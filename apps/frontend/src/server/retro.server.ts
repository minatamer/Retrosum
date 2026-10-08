import "server-only";
import { RETRO_LIMITS, retroRequestSchema, retroResponseSchema } from "@retrosum/contracts";
import { readBackendCapabilities } from "./capabilities.server";
export async function forwardRetro(
  request: Request,
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
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
    const origin = new URL(environment.BACKEND_ORIGIN ?? "http://127.0.0.1:4000");
    forwarded = true;
    const response = await fetcher(new URL("/v1/chat", origin), {
      method: "POST",
      signal,
      redirect: "error",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Origin: environment.FRONTEND_ORIGIN ?? "http://localhost:3000",
      },
      body: JSON.stringify(payload),
    });
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
        [400, 409, 413, 429, 503, 504].includes(response.status) ? response.status : 502,
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
async function readBounded(stream: ReadableStream<Uint8Array>, limit: number, signal: AbortSignal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > limit) throw new RangeError("body_too_large");
      text += decoder.decode(part.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    signal.removeEventListener("abort", abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
