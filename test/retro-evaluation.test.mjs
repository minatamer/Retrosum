import { describe, it, expect, vi } from "vitest";
import { evaluationMode, createEvaluationMeter } from "../scripts/lib/retro-evaluation.mjs";
import { SPEND_POLICY } from "../apps/backend/src/providers/policy.ts";
import { readBoundedJson } from "../apps/backend/src/security/read-json.ts";

const options = () => ({
  redirect: "error",
  signal: new AbortController().signal,
  body: JSON.stringify({ service_tier: "default", store: false, background: false }),
});
const url = "https://api.openai.com/v1/responses";
const completed = (input = 100, output = 10, tier = "default") =>
  Response.json({
    service_tier: tier,
    usage: { input_tokens: input, output_tokens: output },
    output: [],
  });
describe("private live Retro evaluation admission and metering", () => {
  it("stays offline even with inherited funded settings and requires every live opt-in", () => {
    const env = { OPENAI_API_KEY: "injected-key", PAID_DEMO_ENABLED: "true" };
    expect(evaluationMode([], env)).toBe("offline");
    expect(evaluationMode(["--live", "--confirm-paid"], env)).toBe("live");
    for (const [args, settings] of [
      [["--live"], env],
      [["--confirm-paid"], env],
      [["--live", "--confirm-paid"], { ...env, OPENAI_API_KEY: " " }],
      [["--live", "--confirm-paid"], { ...env, PAID_DEMO_ENABLED: "false" }],
      [["--unknown"], env],
    ])
      expect(() => evaluationMode(args, settings)).toThrow();
  });
  it("counts validated actual usage and stops before a fourth dispatch", async () => {
    const fetcher = vi.fn(async () => completed());
    const meter = createEvaluationMeter(SPEND_POLICY, fetcher, readBoundedJson);
    meter.beginTurn();
    for (let i = 0; i < 3; i++) await meter.fetch(url, options());
    expect(meter.snapshot().spentMicroUsd).toBe(1050);
    await expect(meter.fetch(url, options())).rejects.toThrow("evaluation_request_limit");
    expect(fetcher).toHaveBeenCalledTimes(3);
    meter.beginTurn();
    expect(meter.snapshot().requests).toBe(0);
  });
  it("checks reservation before a turn and refuses nonstandard or redirected transport", async () => {
    const fetcher = vi.fn();
    const meter = createEvaluationMeter(
      { ...SPEND_POLICY, runMicroUsd: 100 },
      fetcher,
      readBoundedJson,
    );
    expect(() => meter.beginTurn()).toThrow("evaluation_allowance_exhausted");
    await expect(meter.fetch("https://example.com", options())).rejects.toThrow("transport");
    const auto = options();
    auto.body = JSON.stringify({ service_tier: "auto", store: false, background: false });
    await expect(meter.fetch(url, auto)).rejects.toThrow("policy");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("fails closed for excessive/missing usage and unverified actual service tier", async () => {
    for (const response of [
      completed(12001),
      completed(100, 1501),
      completed(100, 10, "priority"),
      Response.json({ usage: {} }),
    ]) {
      const fetcher = vi.fn(async () => response);
      const meter = createEvaluationMeter(SPEND_POLICY, fetcher, readBoundedJson);
      meter.beginTurn();
      await expect(meter.fetch(url, options())).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
});
