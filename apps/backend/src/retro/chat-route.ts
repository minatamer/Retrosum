import type { Request, Response } from "express";
import { RETRO_LIMITS } from "@retrosum/contracts";
import { validateRetroInput } from "@retrosum/money";
import type { AppRuntime } from "../runtime/compose.js";
import { investigate } from "./investigator.js";
import { requestInputHash, runCookie } from "../security/admission.js";
import { admissionStatus, safeAdmissionError } from "../security/routes.js";
export async function chatRoute(
  runtime: AppRuntime,
  request: Request,
  response: Response,
  action: "chat" | "insights" = "chat",
  capacityHeld = false,
) {
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
  let releasePaid: (() => void) | undefined;
  try {
    const input = validateRetroInput(request.body);
    untrack = runtime.operations.track(input.workspace.id, controller);
    if (
      input.workspace.createdAt > runtime.ports.clock.now() ||
      input.workspace.expiresAt <= runtime.ports.clock.now()
    )
      throw new RangeError("session_expired");
    if (!capacityHeld) release = runtime.admission.enter();
    if (runtime.config.FAKE_MODE)
      runtime.retroAdmission.reserve(input.workspace.id, input.operationId);
    if (!runtime.config.FAKE_MODE) {
      const cookie = runCookie(request.headers.cookie),
        grant = request.headers["x-retrosum-grant"];
      if (!cookie || typeof grant !== "string") throw new RangeError("invalid_grant");
      releasePaid = runtime.paidAdmission.consume(cookie, grant, {
        action,
        workspaceId: input.workspace.id,
        operationId: input.operationId,
        inputHash: requestInputHash(input),
        retry: false,
      });
    }
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
          : !runtime.config.FAKE_MODE && !releasePaid
            ? safeAdmissionError(error)
            : "invalid_or_ungrounded_turn";
      response
        .status(
          !runtime.config.FAKE_MODE && !releasePaid
            ? admissionStatus(code)
            : code === "turn_timeout"
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
    releasePaid?.();
    untrack?.();
    response.removeListener("close", abort);
  }
}
