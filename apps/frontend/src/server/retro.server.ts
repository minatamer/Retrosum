import "server-only";
import { RETRO_LIMITS, retroRequestSchema, retroResponseSchema } from "@retrosum/contracts";
import { readBackendCapabilities } from "./capabilities.server";
import { backendRequest, admissionHeaders, readBounded } from "./backend.server";
export async function forwardRetro(
  request: Request,
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
  action: "chat" | "insights" = "chat",
): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  const error = (code: string, status: number) =>
    Response.json({ error: code }, { status, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return error("origin_not_allowed", 403);
  if (
    !/^application\/json(?:;|$)/u.test(request.headers.get("content-type") ?? "") ||
    !request.body
  )
    return error("invalid_json", 400);
  const capabilities = await readBackendCapabilities(fetcher, environment);
  if (!capabilities.copilot.available)
    return error(capabilities.copilot.reason ?? "backend_unavailable", 503);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(65000)]);
  let forwarded = false;
  try {
    const payload = retroRequestSchema.parse(
      JSON.parse(await readBounded(request.body, RETRO_LIMITS.bodyBytes, signal)),
    );
    forwarded = true;
    const response = await backendRequest(
      action === "chat" ? "/v1/chat" : "/v1/insights",
      {
        method: "POST",
        signal,
        redirect: "error",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Origin: environment.FRONTEND_ORIGIN ?? "http://localhost:3000",
          ...admissionHeaders(request),
        },
        body: JSON.stringify(payload),
      },
      fetcher,
      environment,
    );
    if (!response.body) return error("backend_unavailable", 503);
    const raw: unknown = JSON.parse(await readBounded(response.body, 128 * 1024, signal));
    if (!response.ok) {
      const code =
        typeof raw === "object" &&
        raw !== null &&
        "error" in raw &&
        typeof raw.error === "string" &&
        /^[a-z_]{1,60}$/u.test(raw.error)
          ? raw.error
          : "investigation_failed";
      return error(
        code,
        [400, 403, 409, 413, 429, 503, 504].includes(response.status) ? response.status : 502,
      );
    }
    return Response.json(retroResponseSchema.parse(raw), { headers });
  } catch (cause) {
    return error(
      signal.aborted
        ? "turn_timeout"
        : cause instanceof RangeError && cause.message === "body_too_large"
          ? "body_too_large"
          : "invalid_or_unavailable_turn",
      signal.aborted
        ? 504
        : cause instanceof RangeError && cause.message === "body_too_large"
          ? forwarded
            ? 502
            : 413
          : forwarded
            ? 502
            : 400,
    );
  }
}
