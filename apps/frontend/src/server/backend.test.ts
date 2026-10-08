import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { backendRequest, admissionHeaders, readBounded } from "./backend.server.js";
import { forwardAdmission } from "./admission.server.js";
import { PROCESSING_DISCLOSURE_VERSION } from "@retrosum/contracts";
const env = {
  BACKEND_ORIGIN: "https://retrosum-private.run.app",
  BACKEND_AUDIENCE: "https://retrosum-private.run.app",
  K_SERVICE: "frontend",
};
const token = (aud: string, exp = Math.floor(Date.now() / 1000) + 3600) =>
  `header.${Buffer.from(JSON.stringify({ aud, exp })).toString("base64url")}.signature`;
describe("fixed private identity and bounded admission bridge", () => {
  it("local requests drop caller authorization; hosted requests obtain an audience-bound runtime identity", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ ok: true }));
    await backendRequest(
      "/v1/config",
      { headers: { Authorization: "browser-secret" } },
      fetcher,
      {},
    );
    expect(new Headers(fetcher.mock.calls[0]![1]?.headers).get("Authorization")).toBeNull();
    fetcher.mockResolvedValueOnce(new Response(token(env.BACKEND_AUDIENCE)));
    await backendRequest(
      "/v1/config",
      { headers: { Authorization: "browser-secret" } },
      fetcher,
      env,
    );
    const [metadata, options] = fetcher.mock.calls[1]!;
    expect(String(metadata)).toContain(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https%3A%2F%2Fretrosum-private.run.app&format=full",
    );
    expect(new Headers(options?.headers).get("Metadata-Flavor")).toBe("Google");
    expect(new Headers(fetcher.mock.calls[2]![1]?.headers).get("Authorization")).toBe(
      `Bearer ${token(env.BACKEND_AUDIENCE)}`,
    );
    expect(fetcher.mock.calls[2]![1]?.redirect).toBe("error");
  });
  it("unsafe targets, wrong audience and expired identities never dispatch to a backend", async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const configuration of [
      { BACKEND_ORIGIN: "https://attacker.example" },
      { ...env, BACKEND_AUDIENCE: "https://wrong.run.app" },
      { ...env, BACKEND_ORIGIN: "https://retrosum-private.run.app/other" },
      { ...env, K_SERVICE: "" },
    ])
      await expect(backendRequest("/v1/chat", {}, fetcher, configuration)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    for (const value of [
      token("https://wrong.run.app"),
      token(env.BACKEND_AUDIENCE, 1),
      "not-jwt",
    ]) {
      fetcher.mockResolvedValueOnce(new Response(value));
      await expect(backendRequest("/v1/chat", {}, fetcher, env)).rejects.toThrow();
    }
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("passes only the owned run cookie and bounded grant; duplicate/malformed cookies cannot bootstrap a fresh allowance", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        Cookie: "foreign=private; retrosum_run=body.signature",
        Authorization: "private",
        "X-Retrosum-Grant": "grant.signature",
      },
    });
    expect(admissionHeaders(request)).toEqual({
      Cookie: "retrosum_run=body.signature",
      "X-Retrosum-Grant": "grant.signature",
    });
    expect(() =>
      admissionHeaders(
        new Request(request, { headers: { Cookie: "retrosum_run=a.b; retrosum_run=c.d" } }),
      ),
    ).toThrow();
  });
  it("rejects foreign origins/invalid consent before contact and filters response cookies", async () => {
    const body = {
      workspaceId: "workspace_test",
      consent: true,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
    };
    const incoming = (value: unknown, origin = "http://localhost:3000") =>
      new Request("http://localhost:3000/api/retrosum/v1/session", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
    const fetcher = vi.fn<typeof fetch>();
    expect(
      (await forwardAdmission(incoming(body, "https://bad.example"), "session", fetcher, {}))
        .status,
    ).toBe(403);
    expect(
      (await forwardAdmission(incoming({ ...body, consent: false }), "session", fetcher, {}))
        .status,
    ).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockResolvedValueOnce(
      Response.json(
        { expiresAt: Date.now() + 10000, disclosureVersion: PROCESSING_DISCLOSURE_VERSION },
        {
          headers: {
            "Set-Cookie":
              "retrosum_run=body.signature; Path=/; Max-Age=1800; HttpOnly; SameSite=Strict",
          },
        },
      ),
    );
    const response = await forwardAdmission(incoming(body), "session", fetcher, {});
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly; SameSite=Strict");
    fetcher.mockResolvedValueOnce(
      Response.json(
        { expiresAt: Date.now() + 10000, disclosureVersion: PROCESSING_DISCLOSURE_VERSION },
        { headers: { "Set-Cookie": "foreign=private; Path=/" } },
      ),
    );
    const rejected = await forwardAdmission(incoming(body), "session", fetcher, {});
    expect(rejected.status).toBe(503);
    expect(rejected.headers.get("set-cookie")).toBeNull();
  });
  it("reader abort cancels a stalled body and does not accept false content lengths", async () => {
    const abort = new AbortController(),
      cancel = vi.fn();
    const pending = readBounded(new ReadableStream({ cancel }), 4096, abort.signal);
    abort.abort();
    await expect(pending).rejects.toThrow();
    expect(cancel).toHaveBeenCalledTimes(1);
    await expect(
      readBounded(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array(4097));
            c.close();
          },
        }),
        4096,
        new AbortController().signal,
      ),
    ).rejects.toThrow("body_too_large");
  });
});
