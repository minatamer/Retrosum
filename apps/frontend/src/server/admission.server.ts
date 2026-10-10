import "server-only";
import {
  admissionSessionSchema,
  grantRequestSchema,
  grantResultSchema,
  admissionSessionResultSchema,
} from "@retrosum/contracts";
import {
  admissionHeaders,
  backendRequest,
  readBounded,
  frontendRequestOrigin,
} from "./backend.server";
export async function forwardAdmission(
  request: Request,
  kind: "session" | "grant",
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const publicOrigin = frontendRequestOrigin(request, environment);
  if (!publicOrigin)
    return Response.json({ error: "origin_not_allowed" }, { status: 403, headers });
  if (
    !request.body ||
    !/^application\/json(?:;|$)/u.test(request.headers.get("content-type") ?? "")
  )
    return Response.json({ error: "invalid_admission" }, { status: 400, headers });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12000)]);
  try {
    const raw: unknown = JSON.parse(await readBounded(request.body, 4096, signal));
    const body = (kind === "session" ? admissionSessionSchema : grantRequestSchema).parse(raw);
    const response = await backendRequest(
      kind === "session" ? "/v1/session" : "/v1/grants",
      {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Origin: environment.FRONTEND_ORIGIN ?? "http://localhost:3000",
          ...admissionHeaders(request),
        },
        body: JSON.stringify(body),
      },
      fetcher,
      environment,
    );
    if (!response.body) throw new Error();
    const value: unknown = JSON.parse(await readBounded(response.body, 4096, signal));
    if (!response.ok) {
      const expiredCookie = `retrosum_run=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${publicOrigin.startsWith("https:") ? "; Secure" : ""}`;
      if (
        kind === "session" &&
        response.status === 409 &&
        typeof value === "object" &&
        value !== null &&
        "error" in value &&
        value.error === "boot_changed" &&
        response.headers.get("set-cookie") === expiredCookie
      )
        headers["Set-Cookie"] = expiredCookie;
      return Response.json(
        { error: "admission_unavailable" },
        { status: [403, 409, 429, 503].includes(response.status) ? response.status : 503, headers },
      );
    }
    const result =
      kind === "session"
        ? admissionSessionResultSchema.parse(value)
        : grantResultSchema.parse(value);
    const cookie = response.headers.get("set-cookie");
    if (kind === "session") {
      if (
        !cookie ||
        !/^retrosum_run=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+; Path=\/; Max-Age=\d{1,4}; HttpOnly; SameSite=Strict(?:; Secure)?$/u.test(
          cookie,
        ) ||
        cookie.length > 2200 ||
        (publicOrigin.startsWith("https://") && !cookie.endsWith("; Secure"))
      )
        throw new Error();
      headers["Set-Cookie"] = cookie;
    }
    return Response.json(result, { headers });
  } catch {
    return Response.json({ error: "admission_unavailable" }, { status: 503, headers });
  }
}
