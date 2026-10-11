import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { forwardRetro } from "./retro.server.js";
import { DEMO_LIMITS, RETRO_LIMITS, retroRequestSchema } from "@retrosum/contracts";
import { buildDashboard, createRetroResponse, fakeRetroDecision } from "@retrosum/money";
const available = {
  schemaVersion: 1,
  mode: "fake",
  documents: { available: true },
  copilot: { available: true },
  limits: DEMO_LIMITS,
};
const payload = () => {
  return retroRequestSchema.parse({
    operationId: "retro_transport",
    workspace: {
      id: "workspace_transport",
      schemaVersion: 1,
      revision: 0,
      createdAt: 0,
      expiresAt: 7200000,
      business: { name: "Test business", currency: "USD", ownedAccountReferences: [] },
      asOf: "2026-10-03",
      documents: [],
      contacts: [],
      events: [],
      payments: [],
      invoices: [],
      issues: [],
    },
    scope: { from: "2026-09-01", to: "2026-09-30" },
    prompt: "Summarize this period",
    recent: [],
  });
};
const incoming = (body = JSON.stringify(payload()), origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/retrosum/v1/chat", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body,
  });
describe("Retro same-origin private bridge", () => {
  it("does not lookup config for malformed tokens or parse a live body without admission", async () => {
    const malformed = incoming();
    malformed.headers.set("X-Retrosum-Grant", "not-signed");
    const fetcher = vi.fn<typeof fetch>();
    expect((await forwardRetro(malformed, fetcher, {})).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
    const live = incoming(),
      reader = vi.spyOn(live.body!, "getReader");
    fetcher.mockResolvedValueOnce(Response.json({ ...available, mode: "live" }));
    expect((await forwardRetro(live, fetcher, {})).status).toBe(403);
    expect(reader).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("foreign origin, unsafe upstream and closed capability never dispatch chat", async () => {
    const fetcher = vi.fn();
    expect((await forwardRetro(incoming("{}", "https://bad.example"), fetcher, {})).status).toBe(
      403,
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      (await forwardRetro(incoming(), fetcher, { BACKEND_ORIGIN: "http://attacker.example" }))
        .status,
    ).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockResolvedValueOnce(
      Response.json({ ...available, copilot: { available: false, reason: "paid_disabled" } }),
    );
    expect((await forwardRetro(incoming(), fetcher, {})).status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("invalid JSON/contracts and actual oversized bodies stop before forwarding", async () => {
    const fetcher = vi.fn(async () => Response.json(available));
    expect((await forwardRetro(incoming("bad json"), fetcher, {})).status).toBe(400);
    expect((await forwardRetro(incoming("{}"), fetcher, {})).status).toBe(400);
    expect(
      (await forwardRetro(incoming("x".repeat(RETRO_LIMITS.bodyBytes + 1)), fetcher, {})).status,
    ).toBe(413);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("only validated bounded responses cross the no-store bridge", async () => {
    const snapshot = payload();
    const catalogue = buildDashboard(snapshot.workspace, snapshot.scope);
    const result = createRetroResponse(
      snapshot,
      fakeRetroDecision(snapshot.prompt, catalogue),
      "fake",
    );
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(available))
      .mockResolvedValueOnce(Response.json(result));
    const response = await forwardRetro(incoming(), fetcher, {});
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(result);
    expect(fetcher.mock.calls[1]?.[0]).toEqual(new URL("http://127.0.0.1:4000/v1/chat"));
    const bad = vi
      .fn()
      .mockResolvedValueOnce(Response.json(available))
      .mockResolvedValueOnce(new Response("x".repeat(128 * 1024 + 1)));
    expect((await forwardRetro(incoming(), bad, {})).status).toBe(502);
    const invalid = vi
      .fn()
      .mockResolvedValueOnce(Response.json(available))
      .mockResolvedValueOnce(Response.json({ secret: "never exposed" }));
    expect(await (await forwardRetro(incoming(), invalid, {})).text()).not.toContain(
      "never exposed",
    );
  });
});
