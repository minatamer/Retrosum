import { describe, it, expect, vi } from "vitest";
import { verifyInputBudget } from "./openai-input.js";

const body = {
  model: "gpt-6.1-sol",
  instructions: "Untrusted document transcription",
  input: [
    {
      role: "user",
      content: [
        { type: "input_file", file_data: "data:application/pdf;base64,test", detail: "high" },
      ],
    },
  ],
  text: { format: { type: "json_schema", strict: true, schema: { type: "object" } } },
  reasoning: { effort: "low" },
};
describe("exact input admission before model generation", () => {
  it("counts the complete PDF/schema request through the fixed endpoint with no storage or tools", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ object: "response.input_tokens", input_tokens: 24000 }),
    );
    await verifyInputBudget("injected-key", body, 24000, new AbortController().signal, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/responses/input_tokens");
    expect(options?.redirect).toBe("error");
    expect(JSON.parse(String(options?.body))).toEqual(body);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([24001, -1, 1.5, null])(
    "rejects an excessive or invalid count %s without retry",
    async (input_tokens) => {
      const fetcher = vi.fn<typeof fetch>(async () =>
        Response.json({ object: "response.input_tokens", input_tokens }),
      );
      await expect(
        verifyInputBudget("injected-key", body, 24000, new AbortController().signal, fetcher),
      ).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("stops when counting is rejected or cancelled", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 403 }));
    await expect(
      verifyInputBudget("injected-key", body, 24000, new AbortController().signal, fetcher),
    ).rejects.toThrow("provider_input_unverified");
    const controller = new AbortController();
    const cancelled = vi.fn<typeof fetch>(async () => {
      controller.abort();
      return Response.json({ object: "response.input_tokens", input_tokens: 100 });
    });
    await expect(
      verifyInputBudget("injected-key", body, 24000, controller.signal, cancelled),
    ).rejects.toThrow();
  });
});
