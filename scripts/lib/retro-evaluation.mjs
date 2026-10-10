export function evaluationMode(args, env) {
  const allowed = new Set(["--live", "--confirm-paid"]);
  if (args.some((arg) => !allowed.has(arg))) throw new RangeError("unknown_evaluation_option");
  if (!args.includes("--live")) {
    if (args.includes("--confirm-paid")) throw new RangeError("live_flag_required");
    return "offline";
  }
  if (
    !args.includes("--confirm-paid") ||
    env.PAID_DEMO_ENABLED !== "true" ||
    !env.OPENAI_API_KEY?.trim()
  )
    throw new RangeError("live_requires_confirm_paid_private_key_and_paid_flag");
  return "live";
}

// The caller injects the existing bounded response reader and explicit transport.
// Imports have no network/environment side effects. Unknown outcomes stop the run.
export function createEvaluationMeter(policy, fetcher, readJson) {
  let requests = 0;
  let spentMicroUsd = 0;
  const usage = [];
  const bound = policy.investigation;
  const reservation =
    bound.requests *
    (bound.input * policy.inputMicroUsdPerToken + bound.output * policy.outputMicroUsdPerToken);
  return {
    beginTurn() {
      if (spentMicroUsd + reservation > policy.runMicroUsd)
        throw new RangeError("evaluation_allowance_exhausted");
      requests = 0;
    },
    snapshot: () => ({ spentMicroUsd, requests, usage: [...usage] }),
    async fetch(url, options) {
      if (url !== "https://api.openai.com/v1/responses" || options?.redirect !== "error")
        throw new RangeError("unexpected_evaluation_transport");
      const body = JSON.parse(options.body);
      if (body.service_tier !== "default" || body.store !== false || body.background !== false)
        throw new RangeError("unexpected_evaluation_policy");
      if (++requests > bound.requests) throw new RangeError("evaluation_request_limit");
      const response = await fetcher(url, options);
      if (!response.ok) return response;
      const payload = await readJson(response, 128 * 1024, options.signal);
      const input = payload.usage?.input_tokens;
      const output = payload.usage?.output_tokens;
      if (!Number.isSafeInteger(input) || input < 0 || !Number.isSafeInteger(output) || output < 0)
        throw new RangeError("evaluation_usage_missing");
      spentMicroUsd +=
        input * policy.inputMicroUsdPerToken + output * policy.outputMicroUsdPerToken;
      usage.push({
        inputTokens: input,
        outputTokens: output,
        serviceTier: payload.service_tier ?? null,
      });
      if (input > bound.input || output > bound.output || spentMicroUsd > policy.runMicroUsd)
        throw new RangeError("evaluation_usage_exceeded");
      if (payload.service_tier !== "default") throw new RangeError("evaluation_tier_unverified");
      return new Response(JSON.stringify(payload), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
}
