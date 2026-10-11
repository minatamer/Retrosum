import "server-only";
import {
  MAX_FILE_BYTES,
  MAX_RECOGNITION_BYTES,
  EXTRACTION_TRANSPORT_DEADLINE_MS,
  extractionResultSchema,
} from "@retrosum/contracts";
import { readBackendCapabilities } from "./capabilities.server";
import { frontendRequestGate, requestLimitResponse } from "./request-gate.server";
import {
  backendRequest,
  admissionHeaders,
  readBounded,
  frontendRequestOrigin,
} from "./backend.server";

const BODY_LIMIT = MAX_FILE_BYTES + 64 * 1024;
export async function forwardExtraction(
  request: Request,
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  const error = (code: string, status: number) =>
    Response.json({ error: code }, { status, headers });
  if (!frontendRequestOrigin(request, environment)) return error("origin_not_allowed", 403);
  if (!frontendRequestGate.admit(request.method)) return requestLimitResponse();
  const type = request.headers.get("content-type") ?? "";
  const length = request.headers.get("content-length");
  if (!/^multipart\/form-data;\s*boundary=.{1,180}$/u.test(type) || !request.body)
    return error("invalid_multipart", 400);
  if (length && (!/^\d+$/u.test(length) || Number(length) > BODY_LIMIT))
    return error("body_too_large", 413);
  let admission: ReturnType<typeof admissionHeaders>;
  try {
    admission = admissionHeaders(request);
  } catch {
    return error("invalid_grant", 403);
  }
  const releaseCapacity = frontendRequestGate.enter();
  if (!releaseCapacity) return error("instance_busy", 429);
  try {
    const capabilities = await readBackendCapabilities(fetcher, environment, request.signal);
    if (!capabilities.documents.available)
      return error(capabilities.documents.reason ?? "backend_unavailable", 503);
    if (capabilities.mode !== "fake" && (!admission.Cookie || !admission["X-Retrosum-Grant"]))
      return error("invalid_grant", 403);
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(EXTRACTION_TRANSPORT_DEADLINE_MS),
    ]);
    const incoming = request.body.getReader();
    let bytes = 0;
    let limitHit = false;
    let released = false;
    const releaseReader = () => {
      if (!released) {
        released = true;
        incoming.releaseLock();
      }
    };
    const cancelIncoming = async () => {
      if (!released) {
        await incoming.cancel().catch(() => undefined);
        releaseReader();
      }
    };
    const abortIncoming = () => {
      void cancelIncoming();
    };
    signal.addEventListener("abort", abortIncoming, { once: true });
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          signal.throwIfAborted();
          const part = await incoming.read();
          if (part.done) {
            releaseReader();
            controller.close();
            return;
          }
          bytes += part.value.byteLength;
          if (bytes > BODY_LIMIT) {
            limitHit = true;
            await cancelIncoming();
            controller.error(new RangeError("body_too_large"));
            return;
          }
          controller.enqueue(part.value);
        } catch (cause) {
          await cancelIncoming();
          controller.error(cause);
        }
      },
      async cancel() {
        await cancelIncoming();
      },
    });
    try {
      // The capability reader has already validated this exact configured private origin.
      const options: RequestInit & { duplex: "half" } = {
        method: "POST",
        body,
        duplex: "half",
        signal,
        redirect: "error",
        cache: "no-store",
        headers: {
          "Content-Type": type,
          Origin: environment.FRONTEND_ORIGIN ?? "http://localhost:3000",
          ...admission,
        },
      };
      const response = await backendRequest("/v1/extract", options, fetcher, environment);
      if (!response.body) return error("backend_unavailable", 503);
      const text = await readBounded(response.body, MAX_RECOGNITION_BYTES, signal);
      const payload: unknown = JSON.parse(text);
      if (!response.ok) {
        const code =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string" &&
          /^[a-z_]{1,60}$/u.test(payload.error)
            ? payload.error
            : "interpretation_failed";
        return error(
          code,
          [400, 403, 409, 413, 422, 429, 503, 504].includes(response.status)
            ? response.status
            : 502,
        );
      }
      const parsed = extractionResultSchema.safeParse(payload);
      return parsed.success
        ? Response.json(parsed.data, { headers })
        : error("invalid_backend_response", 502);
    } catch {
      return limitHit
        ? error("body_too_large", 413)
        : error(signal.aborted ? "cancelled_or_timeout" : "backend_unavailable", 503);
    } finally {
      signal.removeEventListener("abort", abortIncoming);
      await cancelIncoming();
      if (!body.locked) await body.cancel().catch(() => undefined);
    }
  } finally {
    releaseCapacity();
  }
}
