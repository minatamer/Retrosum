// Explicit injected count endpoint for existing generation/intent contract tests.
// Production adapters still execute and validate the real preflight separately.
export const withTokenPreflight = (generation) => async (url, options) =>
  url === "https://api.openai.com/v1/responses/input_tokens"
    ? Response.json({ object: "response.input_tokens", input_tokens: 100 })
    : generation(url, options);
