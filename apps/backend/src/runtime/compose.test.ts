import { describe, expect, it, vi } from "vitest";
import { parseConfig } from "../config/config.js";
import { composeRuntime } from "./compose.js";
import { systemClock } from "./clock.js";

describe("provider composition stays explicit and side-effect free", () => {
  it("uses only a matching fake adapter without dispatching during readiness", () => {
    const interpretDocument = vi.fn();
    const runtime = composeRuntime(parseConfig({ OPENAI_API_KEY: "inherited" }), {
      clock: systemClock,
      createRequestId: () => "request_test",
      provider: { kind: "fake", interpretDocument },
    });
    expect(runtime.capabilities.documents.available).toBe(true);
    expect(runtime.capabilities.mode).toBe("fake");
    expect(interpretDocument).not.toHaveBeenCalled();
  });
  it("does not activate a live adapter while fake mode is selected", () => {
    const answer = vi.fn();
    const runtime = composeRuntime(parseConfig({ PAID_DEMO_ENABLED: "true" }), {
      clock: systemClock,
      createRequestId: () => "request_test",
      provider: { kind: "openai", investigator: { kind: "openai", step: answer } },
    });
    expect(runtime.capabilities.copilot.available).toBe(false);
    expect(answer).not.toHaveBeenCalled();
  });
  it("paid-off overrides present credentials, live flags and an injected live adapter", () => {
    const interpretDocument = vi.fn();
    const runtime = composeRuntime(
      parseConfig({
        FAKE_MODE: "false",
        AI_PROVIDER: "openai",
        LIVE_DOCUMENTS_ENABLED: "true",
        OPENAI_API_KEY: "secret",
        TURNSTILE_SECRET_KEY: "secret",
        GRANT_SIGNING_SECRET: "x".repeat(32),
      }),
      {
        clock: systemClock,
        createRequestId: () => "request_test",
        provider: { kind: "openai", interpretDocument },
      },
    );
    expect(runtime.capabilities.documents).toEqual({ available: false, reason: "paid_disabled" });
    expect(interpretDocument).not.toHaveBeenCalled();
  });
});
