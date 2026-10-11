import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { forwardExtraction } from "./extraction.server.js";
import { DEMO_LIMITS, MAX_FILE_BYTES } from "@retrosum/contracts";
const available = {
  schemaVersion: 1,
  mode: "fake",
  documents: { available: true },
  copilot: { available: false, reason: "feature_pending" },
  limits: DEMO_LIMITS,
};
const incoming = (
  body: BodyInit = "small multipart body",
  origin = "http://localhost:3000",
  length?: number,
) =>
  new Request("http://localhost:3000/api/retrosum/v1/extract", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "multipart/form-data; boundary=demo",
      ...(length ? { "Content-Length": String(length) } : {}),
    },
    body,
  });
describe("bounded same-origin document bridge", () => {
  it("rejects malformed admission before config and missing live admission before reading a body", async () => {
    const malformed = incoming();
    malformed.headers.set("Cookie", "retrosum_run=a.b; retrosum_run=c.d");
    const noLookup = vi.fn<typeof fetch>();
    expect((await forwardExtraction(malformed, noLookup, {})).status).toBe(403);
    expect(noLookup).not.toHaveBeenCalled();
    const live = incoming(),
      reader = vi.spyOn(live.body!, "getReader");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ...available, mode: "live" }));
    expect((await forwardExtraction(live, fetcher, {})).status).toBe(403);
    expect(reader).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("holds four capability/body leases, rejects a fifth, and releases all when availability fails", async () => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    const work = Array.from({ length: 4 }, () => forwardExtraction(incoming(), fetcher, {}));
    expect((await forwardExtraction(incoming(), fetcher, {})).status).toBe(429);
    expect(fetcher).toHaveBeenCalledTimes(1);
    finish(
      Response.json({ ...available, documents: { available: false, reason: "paid_disabled" } }),
    );
    expect((await Promise.all(work)).map((r) => r.status)).toEqual([503, 503, 503, 503]);
    fetcher.mockResolvedValueOnce(
      Response.json({ ...available, documents: { available: false, reason: "paid_disabled" } }),
    );
    expect((await forwardExtraction(incoming(), fetcher, {})).status).toBe(503);
  });
  it("rejects foreign origin and advertised oversized uploads before backend dispatch", async () => {
    const fetcher = vi.fn<typeof fetch>();
    expect(
      (await forwardExtraction(incoming("x", "https://attacker.example"), fetcher, {})).status,
    ).toBe(403);
    expect(
      (
        await forwardExtraction(
          incoming("x", "http://localhost:3000", MAX_FILE_BYTES + 65537),
          fetcher,
          {},
        )
      ).status,
    ).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not forward bytes when capability is closed or the configured origin is invalid", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        ...available,
        documents: { available: false, reason: "acceptance_pending" },
      }),
    );
    expect((await forwardExtraction(incoming(), fetcher, {})).status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const invalid = vi.fn<typeof fetch>();
    expect(
      (await forwardExtraction(incoming(), invalid, { BACKEND_ORIGIN: "http://attacker.example" }))
        .status,
    ).toBe(503);
    expect(invalid).not.toHaveBeenCalled();
  });
  it("streams the incoming bytes unchanged and discards unsafe backend output", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(available))
      .mockImplementationOnce(async (_url, options) => {
        expect(await new Response(options?.body).text()).toBe("small multipart body");
        expect(options?.headers).toEqual({
          "content-type": "multipart/form-data; boundary=demo",
          origin: "http://localhost:3000",
        });
        return Response.json({ secret: "rejected provider content" });
      });
    const response = await forwardExtraction(incoming(), fetcher, {});
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret");
  });
  it("bounds unadvertised body bytes while streaming and never exposes raw errors", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(available))
      .mockImplementationOnce(async (_url, options) => {
        await new Response(options?.body).arrayBuffer();
        return Response.json({});
      });
    const response = await forwardExtraction(
      incoming("x".repeat(MAX_FILE_BYTES + 65537)),
      fetcher,
      {},
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "body_too_large" });
  });
});
