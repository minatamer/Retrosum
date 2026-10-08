import type { Request, Response } from "express";
import { RETRO_LIMITS } from "@retrosum/contracts";
import { validateRetroInput } from "@retrosum/money";
import type { AppRuntime } from "../runtime/compose.js";
import { investigate } from "./investigator.js";
export async function chatRoute(runtime: AppRuntime, request: Request, response: Response) {
  if (request.headers.origin !== runtime.config.FRONTEND_ORIGIN) {
    response.status(403).json({ error: "origin_not_allowed" });
    return;
  }
  const provider = runtime.ports.provider?.investigator;
  if (
    !runtime.capabilities.copilot.available ||
    !provider ||
    (!runtime.config.FAKE_MODE && !runtime.config.PAID_DEMO_ENABLED)
  ) {
    response
      .status(503)
      .json({ error: runtime.capabilities.copilot.reason ?? "adapter_not_ready" });
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RETRO_LIMITS.deadlineMs);
  const abort = () => {
    if (!response.writableEnded) controller.abort();
  };
  response.once("close", abort);
  let release: (() => void) | undefined;
  let untrack: (() => void) | undefined;
  try {
    const input = validateRetroInput(request.body);
    untrack = runtime.operations.track(input.workspace.id, controller);
    if (
      input.workspace.createdAt > runtime.ports.clock.now() ||
      input.workspace.expiresAt <= runtime.ports.clock.now()
    )
      throw new RangeError("session_expired");
    release = runtime.admission.enter(); // Shared expensive-operation capacity with extraction.
    runtime.retroAdmission.reserve(input.workspace.id, input.operationId);
    const result = await investigate(input, provider, controller.signal);
    if (!response.destroyed) response.json(result);
  } catch (error) {
    if (!response.headersSent && !response.destroyed) {
      const message = error instanceof Error ? error.message : "investigation_failed";
      const code = controller.signal.aborted
        ? "turn_timeout"
        : [
              "instance_busy",
              "operation_replayed",
              "turn_allowance_used",
              "admission_full",
              "session_expired",
              "context_too_large",
            ].includes(message)
          ? message
          : "invalid_or_ungrounded_turn";
      response
        .status(
          code === "turn_timeout"
            ? 504
            : code === "turn_allowance_used" || code === "admission_full"
              ? 429
              : code === "instance_busy" || code === "operation_replayed"
                ? 409
                : 400,
        )
        .json({ error: code });
    }
  } finally {
    clearTimeout(timer);
    release?.();
    untrack?.();
    response.removeListener("close", abort);
  }
}
