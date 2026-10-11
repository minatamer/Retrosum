import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { FrontendRequestGate, frontendRequestGate } from "./request-gate.server";
import { forwardExtraction } from "./extraction.server";
import { forwardRetro } from "./retro.server";
import { forwardAdmission } from "./admission.server";
import { forwardExchangeRate } from "./exchange-rate.server";
import { revokeSession } from "./session.server";
import { GET as config } from "../app/api/retrosum/v1/config/route";

describe("bounded public request work", () => {
  it("all free/control/large API entry points reject saturation before backend or body reads", async () => {
    vi.spyOn(frontendRequestGate, "admit").mockReturnValue(false);
    const fetcher = vi.fn<typeof fetch>();
    const incoming = () =>
      new Request("http://localhost:3000/api/retrosum/v1/session", {
        method: "POST",
        headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
        body: "{}",
      });
    for (const forward of [forwardExtraction, forwardRetro, revokeSession])
      expect((await forward(incoming(), fetcher, {})).status).toBe(429);
    expect((await forwardAdmission(incoming(), "session", fetcher, {})).status).toBe(429);
    expect(
      (
        await forwardExchangeRate(
          new Request("http://localhost:3000/api/retrosum/v1/exchange-rate"),
          fetcher,
          {},
        )
      ).status,
    ).toBe(429);
    expect((await config()).status).toBe(429);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("reserves an independent read allowance while mutation traffic is saturated, and expires both windows", () => {
    let now = 1000;
    const gate = new FrontendRequestGate(() => now);
    for (let i = 0; i < 120; i++) expect(gate.admit("POST")).toBe(true);
    expect(gate.admit("POST")).toBe(false);
    for (let i = 0; i < 120; i++) expect(gate.admit("GET")).toBe(true);
    expect(gate.admit("HEAD")).toBe(false);
    now += 60_000;
    expect(gate.admit("GET")).toBe(true);
    expect(gate.admit("POST")).toBe(true);
  });
  it("allows four large operations and only their own idempotent releases free capacity", () => {
    const gate = new FrontendRequestGate(),
      releases = Array.from({ length: 4 }, () => gate.enter()!);
    expect(gate.enter()).toBeUndefined();
    releases[0]!();
    const fifth = gate.enter()!;
    releases[0]!();
    expect(gate.enter()).toBeUndefined();
    releases.slice(1).forEach((release) => release());
    fifth();
    expect(gate.enter()).toBeTypeOf("function");
  });
});
