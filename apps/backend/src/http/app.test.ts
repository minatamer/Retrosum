import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { capabilitiesSchema } from "@retrosum/contracts";
import { createApp } from "./app.js";
import { parseConfig } from "../config/config.js";
import { composeRuntime } from "../runtime/compose.js";
import { systemClock } from "../runtime/clock.js";
const makeApp = (environment: Record<string, string | undefined> = {}) =>
  createApp(
    composeRuntime(parseConfig(environment), {
      clock: { ...systemClock, now: () => Date.UTC(2026, 9, 8) },
      createRequestId: () => "request_test",
    }),
  );
describe("safe explicit HTTP composition", () => {
  it("content-free reset cancels only owned work and keeps replay/turn counters", async () => {
    const runtime = composeRuntime(parseConfig({}), {
        clock: systemClock,
        createRequestId: () => "request_test",
      }),
      app = createApp(runtime);
    const owned = new AbortController(),
      other = new AbortController();
    runtime.operations.track("workspace_clear", owned);
    runtime.operations.track("workspace_other", other);
    runtime.retroAdmission.reserve("workspace_clear", "op_once");
    await request(app).delete("/v1/session").send({ workspaceId: "workspace_clear" }).expect(403);
    const result = await request(app)
      .delete("/v1/session")
      .set("Origin", "http://localhost:3000")
      .send({ workspaceId: "workspace_clear" })
      .expect(200);
    expect(owned.signal.aborted).toBe(true);
    expect(other.signal.aborted).toBe(false);
    expect(result.body.providerCopiesRecalled).toBe(false);
    expect(() => runtime.retroAdmission.reserve("workspace_clear", "op_once")).toThrow(/replayed/);
    await request(app)
      .delete("/v1/session")
      .set("Origin", "http://localhost:3000")
      .send({ workspaceId: "workspace_clear", records: "secret" })
      .expect(400);
  });
  it("starts fake by default and exposes only approved capabilities", async () => {
    const app = makeApp();
    const health = await request(app).get("/v1/health").expect(200);
    expect(health.body).toMatchObject({ status: "ok", requestId: "request_test" });
    await request(app).get("/v1/ready").expect(200);
    const response = await request(app).get("/v1/config").expect(200);
    expect(capabilitiesSchema.parse(response.body).mode).toBe("fake");
    expect(response.headers["cache-control"]).toBe("no-store");
  });
  it("cannot activate live work from inherited credentials in fake mode", async () => {
    const dispatch = vi.spyOn(globalThis, "fetch");
    const response = await request(
      makeApp({
        OPENAI_API_KEY: "secret",
        PAID_DEMO_ENABLED: "true",
        LIVE_DOCUMENTS_ENABLED: "true",
        LIVE_COPILOT_ENABLED: "true",
      }),
    )
      .get("/v1/config")
      .expect(200);
    expect(response.body.mode).toBe("fake");
    expect(JSON.stringify(response.body)).not.toContain("secret");
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("keeps liveness distinct from missing live prerequisites", async () => {
    const app = makeApp({ FAKE_MODE: "false", AI_PROVIDER: "openai", PAID_DEMO_ENABLED: "true" });
    await request(app).get("/v1/health").expect(200);
    await request(app).get("/v1/ready").expect(503);
    const config = await request(app).get("/v1/config");
    expect(config.body.documents.reason).toBe("key_missing");
    expect(config.body.mode).toBe("unavailable");
  });
  it("rejects foreign origins and unsupported routes", async () => {
    await request(makeApp())
      .get("/v1/config")
      .set("Origin", "https://attacker.example")
      .expect(403);
    await request(makeApp()).post("/v1/unknown").expect(404);
  });
  it("sanitizes malformed input and honors the body bound", async () => {
    const malformed = await request(makeApp())
      .post("/v1/unknown")
      .set("Content-Type", "application/json")
      .send('{"secret":')
      .expect(400);
    expect(malformed.body).toEqual({ error: "invalid_json" });
    await request(makeApp())
      .post("/v1/unknown")
      .send({ value: "x".repeat(5000) })
      .expect(413);
  });
  it("validates booleans without leaking rejected values", () => {
    expect(() => parseConfig({ FAKE_MODE: "secret_invalid_value" })).toThrow(
      "Invalid configuration fields: FAKE_MODE",
    );
    expect(() => parseConfig({ FRONTEND_ORIGIN: "javascript:alert(1)" })).toThrow();
  });
  it("cancels simulated work and releases its timer", async () => {
    const controller = new AbortController();
    const pending = systemClock.sleep(10000, controller.signal);
    controller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
  });
});
