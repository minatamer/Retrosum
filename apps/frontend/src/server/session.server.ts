import "server-only";
import { workspaceIdSchema } from "@retrosum/contracts";
import {
  backendRequest,
  admissionHeaders,
  readBounded,
  frontendRequestOrigin,
} from "./backend.server";
export async function revokeSession(
  request: Request,
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (!frontendRequestOrigin(request, environment))
    return Response.json({ error: "origin_not_allowed" }, { status: 403, headers });
  if (!/^application\/json(?:;|$)/u.test(request.headers.get("content-type") ?? ""))
    return Response.json({ error: "invalid_session" }, { status: 400, headers });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(5000)]);
  try {
    if (!request.body) throw new Error();
    const body: unknown = JSON.parse(await readBounded(request.body, 256, signal));
    if (
      !body ||
      typeof body !== "object" ||
      Object.keys(body).length !== 1 ||
      !("workspaceId" in body)
    )
      throw new Error();
    const workspaceId = workspaceIdSchema.parse(body.workspaceId);
    const response = await backendRequest(
      "/v1/session",
      {
        method: "DELETE",
        cache: "no-store",
        redirect: "error",
        signal,
        headers: {
          "Content-Type": "application/json",
          Origin: environment.FRONTEND_ORIGIN ?? "http://localhost:3000",
          ...admissionHeaders(request),
        },
        body: JSON.stringify({ workspaceId }),
      },
      fetcher,
      environment,
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
