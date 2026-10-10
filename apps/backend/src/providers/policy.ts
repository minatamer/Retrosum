export const MODEL = "gpt-6.1-sol";
// RET-011: two live corpus passes, grounded intent review and exact preflight verified locally.
// Hosted/domain acceptance remains an operator gate; committed defaults remain paid-off.
export const LIVE_ACCEPTANCE_VERIFIED = true;
export const SPEND_POLICY = Object.freeze({
  version: "standard-cache-write-ceiling-2026-10-10",
  // Reserve at the standard cache-write ceiling; ordinary/cached input costs less.
  inputMicroUsdPerToken: 2.5,
  outputMicroUsdPerToken: 10,
  runMicroUsd: 2_500_000,
  extraction: { input: 24_000, output: 6_000, requests: 1 },
  investigation: { input: 12_000, output: 1_500, requests: 3 },
});
export function reservationMicroUsd(action: "extract" | "chat" | "insights") {
  const bound = action === "extract" ? SPEND_POLICY.extraction : SPEND_POLICY.investigation;
  return (
    bound.requests *
    (bound.input * SPEND_POLICY.inputMicroUsdPerToken +
      bound.output * SPEND_POLICY.outputMicroUsdPerToken)
  );
}
