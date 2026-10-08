import "server-only";
import { workspaceIdSchema } from "@retrosum/contracts";
export async function revokeSession(
  request: Request,
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "origin_not_allowed" }, { status: 403, headers });
  if (!/^application\/json(?:;|$)/u.test(request.headers.get("content-type") ?? ""))
    return Response.json({ error: "invalid_session" }, { status: 400, headers });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(5000)]);
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error();
    let raw = "",
      count = 0;
    const decoder = new TextDecoder();
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
        count += part.value.byteLength;
        if (count > 256) throw new Error();
        raw += decoder.decode(part.value, { stream: true });
      }
      raw += decoder.decode();
    } finally {
      signal.removeEventListener("abort", abort);
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    const body: unknown = JSON.parse(raw);
    if (
      !body ||
      typeof body !== "object" ||
      Object.keys(body).length !== 1 ||
      !("workspaceId" in body)
    )
      throw new Error();
    const workspaceId = workspaceIdSchema.parse(body.workspaceId);
    const response = await fetcher(
      new URL("/v1/session", environment.BACKEND_ORIGIN ?? "http://127.0.0.1:4000"),
      {
        method: "DELETE",
        cache: "no-store",
        redirect: "error",
        signal,
        headers: {
          "Content-Type": "application/json",
          Origin: environment.FRONTEND_ORIGIN ?? "http://localhost:3000",
        },
        body: JSON.stringify({ workspaceId }),
      },
    );
    await response.body?.cancel();
    return Response.json(
      { remoteCancellation: response.ok, providerCopiesRecalled: false },
      {
        status: response.ok ? 200 : 503,
        headers: {
          ...headers,
          "Set-Cookie": "retrosum_action=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict",
        },
      },
    );
  } catch {
    return Response.json(
      { remoteCancellation: false, providerCopiesRecalled: false },
      { status: 503, headers },
    );
  }
}
