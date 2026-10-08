export const MODEL = "gpt-6.1-sol";
// This release cannot enable live dispatch until its exact-number and image-token gates pass.
export const LIVE_ACCEPTANCE_VERIFIED = false;
export const SPEND_POLICY = Object.freeze({
  version: "standard-short-context-2026-10-08",
  inputMicroUsdPerToken: 2,
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
