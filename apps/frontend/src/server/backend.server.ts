import "server-only";
type PrivatePath =
  "/v1/config" | "/v1/extract" | "/v1/chat" | "/v1/insights" | "/v1/session" | "/v1/grants";
const paths = new Set<PrivatePath>([
  "/v1/config",
  "/v1/extract",
  "/v1/chat",
  "/v1/insights",
  "/v1/session",
  "/v1/grants",
]);
// TLS/port termination changes Next's internal URL. Only the configured public
// origin is authoritative; forwarded Host/Proto headers never supply authority.
export function frontendRequestOrigin(
  request: Request,
  environment: Record<string, string | undefined>,
): string | undefined {
  try {
    const canonical =
      environment.FRONTEND_ORIGIN ??
      (environment.K_SERVICE ? undefined : new URL(request.url).origin);
    if (!canonical || request.headers.get("origin") !== canonical) return;
    const url = new URL(canonical);
    if (
      url.origin !== canonical ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    )
      return;
    return canonical;
  } catch {
    return;
  }
}
export async function readBounded(
  stream: ReadableStream<Uint8Array>,
  limit: number,
  signal: AbortSignal,
) {
  const reader = stream.getReader(),
    decoder = new TextDecoder();
  let bytes = 0,
    text = "";
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
export async function backendRequest(
  path: PrivatePath,
  options: RequestInit,
  fetcher: typeof fetch,
  environment: Record<string, string | undefined>,
) {
  if (!paths.has(path)) throw new RangeError("invalid_private_path");
  const origin = new URL(environment.BACKEND_ORIGIN ?? "http://127.0.0.1:4000");
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/")
    throw new RangeError("invalid_private_origin");
  const local =
    origin.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname);
  const headers = { ...Object.fromEntries(new Headers(options.headers)) };
  // Never accept browser Authorization or an arbitrary upstream target.
  delete headers.authorization;
  delete headers.Authorization;
  if (!local) {
    const audience = environment.BACKEND_AUDIENCE;
    if (
      origin.protocol !== "https:" ||
      !origin.hostname.endsWith(".run.app") ||
      !environment.K_SERVICE ||
      audience !== origin.origin
    )
      throw new RangeError("private_identity_unavailable");
    const signal = AbortSignal.any([
      options.signal ?? new AbortController().signal,
      AbortSignal.timeout(3000),
    ]);
    const metadata = new URL(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity",
    );
    metadata.searchParams.set("audience", audience);
    metadata.searchParams.set("format", "full");
    const response = await fetcher(metadata, {
      headers: { "Metadata-Flavor": "Google" },
      signal,
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new RangeError("private_identity_unavailable");
    }
    const token = await readBounded(response.body, 8192, signal);
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(token))
      throw new RangeError("private_identity_unavailable");
    const claims: unknown = JSON.parse(
      Buffer.from(token.split(".")[1]!, "base64url").toString("utf8"),
    );
    if (
      !claims ||
      typeof claims !== "object" ||
      !("aud" in claims) ||
      claims.aud !== audience ||
      !("exp" in claims) ||
      typeof claims.exp !== "number" ||
      claims.exp * 1000 <= Date.now() + 30000
    )
      throw new RangeError("private_identity_unavailable");
    headers.Authorization = `Bearer ${token}`;
  }
  // Only application-owned headers and the runtime service identity reach the fixed backend.
  return fetcher(new URL(path, origin), {
    ...options,
    headers,
    cache: "no-store",
    redirect: "error",
  });
}
export function admissionHeaders(request: Request) {
  const output: Record<string, string> = {};
  const cookies = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("retrosum_run="));
  if (
    cookies.length > 1 ||
    (cookies.length === 1 &&
      (!/^retrosum_run=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(cookies[0]!) ||
        cookies[0]!.length > 2061))
  )
    throw new RangeError("invalid_grant");
  if (
    cookies.length === 1 &&
    /^retrosum_run=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(cookies[0]!) &&
    cookies[0]!.length <= 2061
  )
    output.Cookie = cookies[0]!;
  const grant = request.headers.get("x-retrosum-grant");
  if (grant && grant.length <= 2048 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(grant))
    output["X-Retrosum-Grant"] = grant;
  return output;
}
