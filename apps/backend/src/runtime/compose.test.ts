import { describe, expect, it, vi } from "vitest";
import { parseConfig } from "../config/config.js";
import { composeRuntime } from "./compose.js";
import { systemClock } from "./clock.js";

describe("provider composition stays explicit and side-effect free", () => {
  it.each([
    ["false", "paid_disabled"],
    ["true", "acceptance_pending"],
  ] as const)("the single paid=%s switch covers documents and Retro together", (paid, reason) => {
    const interpretDocument = vi.fn();
    const step = vi.fn();
    const runtime = composeRuntime(
      parseConfig({
        FAKE_MODE: "false",
        PAID_DEMO_ENABLED: paid,
        OPENAI_API_KEY: "injected-key",
        TURNSTILE_SITE_KEY: "injected-site",
        TURNSTILE_SECRET_KEY: "injected-challenge-secret",
        GRANT_SIGNING_SECRET: "x".repeat(32),
      }),
      {
        clock: systemClock,
        createRequestId: () => "request_test",
        provider: { kind: "openai", interpretDocument, investigator: { kind: "openai", step } },
      },
    );
    expect(runtime.capabilities.documents).toEqual({ available: false, reason });
    expect(runtime.capabilities.copilot).toEqual({ available: false, reason });
    expect(runtime.capabilities.processing?.admissionAvailable).toBe(false);
    expect(interpretDocument).not.toHaveBeenCalled();
    expect(step).not.toHaveBeenCalled();
  });
  it("selects fake documents and Retro from fake mode even with paid settings present", () => {
    const interpretDocument = vi.fn();
    const step = vi.fn();
    const runtime = composeRuntime(
      parseConfig({ PAID_DEMO_ENABLED: "true", OPENAI_API_KEY: "inherited" }),
      {
        clock: systemClock,
        createRequestId: () => "request_test",
        provider: { kind: "fake", interpretDocument, investigator: { kind: "fake", step } },
      },
    );
    expect(runtime.capabilities.documents.available).toBe(true);
    expect(runtime.capabilities.copilot.available).toBe(true);
    expect(runtime.capabilities.mode).toBe("fake");
    expect(runtime.capabilities.processing?.admissionAvailable).toBe(false);
    expect(interpretDocument).not.toHaveBeenCalled();
    expect(step).not.toHaveBeenCalled();
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
  it("paid-off overrides present credentials and an injected live adapter", () => {
    const interpretDocument = vi.fn();
    const runtime = composeRuntime(
      parseConfig({
        FAKE_MODE: "false",
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
