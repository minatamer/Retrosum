import { z } from "zod";
import { readBoundedJson } from "../security/read-json.js";

// Discriminants remain checked by the original contract after provider output.
// Responses accepts nested anyOf, but rejects Zod's discriminated oneOf.
export function responsesSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, {
    override: ({ jsonSchema }) => {
      if (jsonSchema.oneOf) {
        jsonSchema.anyOf = jsonSchema.oneOf;
        delete jsonSchema.oneOf;
      }
    },
  });
}

interface CountableRequest {
  model: string;
  instructions: string;
  input: unknown[];
  text: unknown;
  reasoning: unknown;
  tools?: unknown[];
  parallel_tool_calls?: boolean;
}
const countSchema = z.object({
  object: z.literal("response.input_tokens"),
  input_tokens: z.number().int().nonnegative().safe(),
});
export async function verifyInputBudget(
  key: string,
  request: CountableRequest,
  ceiling: number,
  signal: AbortSignal,
  fetcher: typeof fetch,
) {
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(60_000)]);
  const { model, instructions, input, text, reasoning, tools, parallel_tool_calls } = request;
  const response = await fetcher("https://api.openai.com/v1/responses/input_tokens", {
    method: "POST",
    signal: bounded,
    redirect: "error",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      instructions,
      input,
      text,
      reasoning,
      tools,
      parallel_tool_calls,
    }),
  });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new RangeError("provider_input_unverified");
  }
  const count = countSchema.parse(await readBoundedJson(response, 16 * 1024, bounded));
  if (count.input_tokens > ceiling) throw new RangeError("context_too_large");
  signal.throwIfAborted();
}
