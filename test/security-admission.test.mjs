import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";
import {
  retroRequestSchema,
  PROCESSING_DISCLOSURE_VERSION,
} from "../packages/contracts/dist/index.js";
import { composeRuntime } from "../apps/backend/src/runtime/compose.ts";
import { parseConfig } from "../apps/backend/src/config/config.ts";
import { createApp } from "../apps/backend/src/http/app.ts";
import { requestInputHash, runCookie } from "../apps/backend/src/security/admission.ts";
import { ExtractionAdmission } from "../apps/backend/src/documents/admission.ts";
const input = (operationId = "retro_bound") =>
  retroRequestSchema.parse({
    workspace: harborSession().workspace,
    operationId,
    scope: { from: "2026-09-01", to: "2026-09-30" },
    prompt: "Summarize",
    recent: [],
  });
const origin = "http://localhost:3000";
function harness(paid = true) {
  let now = input().workspace.createdAt + 1000;
  const step = vi.fn(async () => ({
      kind: "answer",
      decision: { kind: "limited_result", reason: "refusal" },
    })),
    document = vi.fn(),
    challenge = vi.fn(async () => true),
    metric = vi.fn();
  const runtime = composeRuntime(
    parseConfig({
      FAKE_MODE: "false",
      PAID_DEMO_ENABLED: String(paid),
      OPENAI_API_KEY: "injected-key",
      TURNSTILE_SITE_KEY: "injected-site",
      TURNSTILE_SECRET_KEY: "injected-secret",
      GRANT_SIGNING_SECRET: "injected-test-only-secret-longer-than-32",
    }),
    {
      clock: { now: () => now, sleep: async () => {} },
      createRequestId: () => "request_test",
      provider: {
        kind: "openai",
        investigator: { kind: "openai", step },
        interpretDocument: document,
      },
      challengeVerifier: challenge,
      metric,
    },
  );
  const ledger = runtime.paidAdmission;
  return {
    app: createApp(runtime),
    ledger,
    step,
    document,
    challenge,
    metric,
    admission: runtime.admission,
    advance: () => {
      now += 61000;
    },
  };
}
async function grant(h, cookie, body, action = "chat") {
  return h.ledger.issue(
    cookie,
    {
      workspaceId: body.workspace.id,
      operationId: body.operationId,
      action,
      inputHash: requestInputHash(body),
      retry: false,
      consent: true,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      challengeToken: "injected",
    },
    h.ledger.source("socket"),
    new AbortController().signal,
  );
}
describe("actual route guards before provider dispatch", () => {
  it("restart rejects a signed obsolete run, then permits a deliberate fresh review without renewing current runs", async () => {
    const before = harness(),
      after = harness(),
      body = input();
    const stale = before.ledger.session(body.workspace.id, null).cookie;
    const consent = {
      workspaceId: body.workspace.id,
      consent: true,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
    };
    const rejected = await request(after.app)
      .post("/v1/session")
      .set("Origin", origin)
      .set("Cookie", `retrosum_run=${stale}`)
      .send(consent)
      .expect(409);
    expect(rejected.body.error).toBe("boot_changed");
    expect(rejected.headers["set-cookie"]).toEqual([
      "retrosum_run=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict",
    ]);
    expect(after.challenge).not.toHaveBeenCalled();
    expect(after.step).not.toHaveBeenCalled();
    const fresh = await request(after.app)
      .post("/v1/session")
      .set("Origin", origin)
      .send(consent)
      .expect(200);
    const current = fresh.headers["set-cookie"][0].split(";")[0];
    after.advance();
    const refreshed = await request(after.app)
      .post("/v1/session")
      .set("Origin", origin)
      .set("Cookie", current)
      .send(consent)
      .expect(200);
    expect(refreshed.body.expiresAt).toBe(fresh.body.expiresAt);
    const mismatch = await request(after.app)
      .post("/v1/session")
      .set("Origin", origin)
      .set("Cookie", current)
      .send({ ...consent, workspaceId: "workspace_another" })
      .expect(409);
    expect(mismatch.body.error).toBe("workspace_mismatch");
    expect(mismatch.headers["set-cookie"]).toBeUndefined();
    const invalid = await request(after.app)
      .post("/v1/session")
      .set("Origin", origin)
      .set("Cookie", "retrosum_run=invalid")
      .send(consent)
      .expect(403);
    expect(invalid.headers["set-cookie"]).toBeUndefined();
    const cookie = current.slice("retrosum_run=".length);
    const g = await grant(after, cookie, body);
    await request(after.app)
      .post("/v1/chat")
      .set("Origin", origin)
      .set("Cookie", current)
      .set("X-Retrosum-Grant", g.grant)
      .send(body)
      .expect(200);
    expect(after.challenge).toHaveBeenCalledTimes(1);
    expect(after.step).toHaveBeenCalledTimes(1);
  });
  it("capacity is acquired before JSON parsing and always released after malformed bodies", async () => {
    const h = harness(),
      body = input(),
      cookie = h.ledger.session(body.workspace.id, null).cookie,
      g = await grant(h, cookie, body);
    const headers = {
      Origin: origin,
      Cookie: `retrosum_run=${cookie}`,
      "X-Retrosum-Grant": g.grant,
      "Content-Type": "application/json",
    };
    const busy = h.admission.enter();
    const otherBusy = h.admission.enter();
    await request(h.app).post("/v1/chat").set(headers).send("not-json").expect(409);
    busy();
    await request(h.app).post("/v1/chat").set(headers).send("not-json").expect(400);
    await request(h.app).post("/v1/chat").set(headers).send(body).expect(200);
    expect(h.step).toHaveBeenCalledTimes(1);
    otherBusy();
    const capacity = new ExtractionAdmission(() => 0),
      release = capacity.enter();
    release();
    const second = capacity.enter();
    const third = capacity.enter();
    release();
    expect(() => capacity.enter()).toThrow("instance_busy");
    second();
    third();
    expect(() => capacity.enter()()).not.toThrow();
  });
  it("the consent/session/grant HTTP path issues a private run and consumes its action exactly once", async () => {
    const h = harness(),
      body = input();
    const bootstrap = await request(h.app)
      .post("/v1/session")
      .set("Origin", origin)
      .send({
        workspaceId: body.workspace.id,
        consent: true,
        disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      })
      .expect(200);
    const cookie = bootstrap.headers["set-cookie"][0].split(";")[0];
    expect(bootstrap.headers["set-cookie"][0]).toContain("HttpOnly; SameSite=Strict");
    const grantBody = {
      workspaceId: body.workspace.id,
      operationId: body.operationId,
      action: "chat",
      inputHash: requestInputHash(body),
      retry: false,
      consent: true,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      challengeToken: "injected",
    };
    const g = await request(h.app)
      .post("/v1/grants")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send(grantBody)
      .expect(200);
    await request(h.app)
      .post("/v1/chat")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .set("X-Retrosum-Grant", g.body.grant)
      .send(body)
      .expect(200);
    await request(h.app)
      .post("/v1/chat")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .set("X-Retrosum-Grant", g.body.grant)
      .send(body)
      .expect(409);
    expect(h.challenge).toHaveBeenCalledTimes(1);
    expect(h.step).toHaveBeenCalledTimes(1);
  });
  it("paid-off rejects extraction/chat/insights/session/grants with no challenge or provider contact", async () => {
    const h = harness(false);
    for (const path of ["chat", "insights", "session", "grants", "extract"])
      await request(h.app).post(`/v1/${path}`).set("Origin", origin).send({}).expect(503);
    expect(h.step).not.toHaveBeenCalled();
    expect(h.document).not.toHaveBeenCalled();
    expect(h.challenge).not.toHaveBeenCalled();
  });
  it("invalid grants reject before large JSON/multipart parsing, with no provider calls", async () => {
    const h = harness();
    for (const path of ["chat", "insights", "extract"])
      await request(h.app)
        .post(`/v1/${path}`)
        .set("Origin", origin)
        .set("X-Retrosum-Grant", "invalid")
        .set("Content-Type", "application/json")
        .send("x".repeat(5000))
        .expect(403);
    expect(h.step).not.toHaveBeenCalled();
    expect(h.document).not.toHaveBeenCalled();
    expect(() => runCookie("retrosum_run=a.b; retrosum_run=c.d")).toThrow("invalid_grant");
  });
  it("valid one-use grant dispatches once; changed input, wrong action and replay never add calls", async () => {
    const h = harness(),
      body = input(),
      cookie = h.ledger.session(body.workspace.id, null).cookie,
      g = await grant(h, cookie, body);
    const send = (path, value = body) =>
      request(h.app)
        .post(`/v1/${path}`)
        .set("Origin", origin)
        .set("Cookie", `retrosum_run=${cookie}`)
        .set("X-Retrosum-Grant", g.grant)
        .send(value);
    await send("insights").expect(403);
    await send("chat", { ...body, prompt: "Changed" }).expect(403);
    expect(h.step).not.toHaveBeenCalled();
    await send("chat").expect(200);
    await send("chat").expect(409);
    expect(h.step).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(h.metric.mock.calls)).not.toContain("Summarize");
  });
  it("the separate insight endpoint enforces two generations and reset cannot replenish it", async () => {
    const h = harness(),
      cookie = h.ledger.session(input().workspace.id, null).cookie;
    for (let i = 0; i < 3; i++) {
      h.advance();
      const body = input(`retro_insight_${i}`),
        g = await grant(h, cookie, body, "insights");
      await request(h.app)
        .post("/v1/insights")
        .set("Origin", origin)
        .set("Cookie", `retrosum_run=${cookie}`)
        .set("X-Retrosum-Grant", g.grant)
        .send(body)
        .expect(i < 2 ? 200 : 429);
    }
    await request(h.app)
      .delete("/v1/session")
      .set("Origin", origin)
      .set("Cookie", `retrosum_run=${cookie}`)
      .send({ workspaceId: input().workspace.id })
      .expect(200);
    h.advance();
    const body = input("retro_insight_after_reset"),
      g = await grant(h, cookie, body, "insights");
    await request(h.app)
      .post("/v1/insights")
      .set("Origin", origin)
      .set("Cookie", `retrosum_run=${cookie}`)
      .set("X-Retrosum-Grant", g.grant)
      .send(body)
      .expect(429);
    expect(h.step).toHaveBeenCalledTimes(2);
  });
});
