import type { Request, Response } from "express";
import { admissionSessionSchema, grantRequestSchema } from "@retrosum/contracts";
import type { AppRuntime } from "../runtime/compose.js";
import { runCookie } from "./admission.js";
export function safeAdmissionError(cause: unknown) {
  const code = cause instanceof Error ? cause.message : "";
  return [
    "paid_disabled",
    "boot_changed",
    "admission_expired",
    "workspace_mismatch",
    "admission_full",
    "rate_limited",
    "challenge_rejected",
    "operation_replayed",
    "invalid_grant",
    "grant_expired",
    "instance_busy",
    "spend_allowance_used",
    "document_allowance_used",
    "turn_allowance_used",
  ].includes(code)
    ? code
    : "invalid_admission";
}
export function admissionStatus(code: string) {
  return code === "paid_disabled"
    ? 503
    : [
          "rate_limited",
          "admission_full",
          "spend_allowance_used",
          "document_allowance_used",
          "turn_allowance_used",
          "instance_busy",
        ].includes(code)
      ? 429
      : [
            "operation_replayed",
            "boot_changed",
            "workspace_mismatch",
            "admission_expired",
            "grant_expired",
          ].includes(code)
        ? 409
        : 403;
}
export function paidPreflight(
  runtime: AppRuntime,
  request: Request,
  response: Response,
  action: "extract" | "chat" | "insights",
) {
  if (runtime.config.FAKE_MODE) return true;
  try {
    const cookie = runCookie(request.headers.cookie),
      grant = request.headers["x-retrosum-grant"];
    if (!cookie || typeof grant !== "string") throw new RangeError("invalid_grant");
    runtime.paidAdmission.preflight(cookie, grant, action);
    return true;
  } catch (cause) {
    const code = safeAdmissionError(cause);
    response.status(admissionStatus(code)).json({ error: code });
    return false;
  }
}
export async function admissionRoute(
  runtime: AppRuntime,
  request: Request,
  response: Response,
  kind: "session" | "grant",
) {
  if (request.headers.origin !== runtime.config.FRONTEND_ORIGIN) {
    response.status(403).json({ error: "origin_not_allowed" });
    return;
  }
  if (
    !runtime.config.PAID_DEMO_ENABLED ||
    runtime.config.FAKE_MODE ||
    (!runtime.capabilities.documents.available && !runtime.capabilities.copilot.available)
  ) {
    response.status(503).json({ error: "paid_disabled" });
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const abort = () => {
    if (!response.writableEnded) controller.abort();
  };
  request.once("aborted", abort);
  response.once("close", abort);
  const signal = controller.signal;
  try {
    const cookie = runCookie(request.headers.cookie),
      source = runtime.paidAdmission.source(request.socket.remoteAddress ?? "unknown-ingress");
    if (kind === "session") {
      const input = admissionSessionSchema.parse(request.body);
      if (!cookie) runtime.paidAdmission.attempt(source);
      const result = runtime.paidAdmission.session(input.workspaceId, cookie);
      response.set(
        "Set-Cookie",
        `retrosum_run=${result.cookie}; Path=/; Max-Age=${Math.max(0, Math.floor((result.expiresAt - runtime.ports.clock.now()) / 1000))}; HttpOnly; SameSite=Strict${runtime.config.FRONTEND_ORIGIN.startsWith("https:") ? "; Secure" : ""}`,
      );
      response.json({ expiresAt: result.expiresAt, disclosureVersion: input.disclosureVersion });
    } else {
      if (!cookie) throw new RangeError("invalid_grant");
      response.json(
        await runtime.paidAdmission.issue(
          cookie,
          grantRequestSchema.parse(request.body),
          source,
          signal,
        ),
      );
    }
  } catch (cause) {
    const code = safeAdmissionError(cause);
    if (!response.destroyed && !response.headersSent)
      response.status(admissionStatus(code)).json({ error: code });
  } finally {
    clearTimeout(timer);
    request.removeListener("aborted", abort);
    response.removeListener("close", abort);
  }
}
