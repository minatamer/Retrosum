import { describe, it, expect, vi } from "vitest";
import { grantRequestSchema, PROCESSING_DISCLOSURE_VERSION } from "@retrosum/contracts";
import { turnstileVerifier } from "./challenge.js";
import { readBoundedJson } from "./read-json.js";
import { emitMetric } from "./metrics.js";
const now = Date.UTC(2026, 9, 8);
const input = grantRequestSchema.parse({
  workspaceId: "workspace_test",
  action: "chat",
  operationId: "op_test",
  inputHash: "a".repeat(64),
  consent: true,
  disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
  challengeToken: "injected",
});
const valid = {
  success: true,
  hostname: "retrosum.example",
  action: "retrosum_chat",
  cdata: input.inputHash,
  challenge_ts: new Date(now - 1000).toISOString(),
};
describe("bounded challenge and operational diagnostics", () => {
  it("verifies the hostname/action/input/time binding once at the fixed endpoint", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(valid));
    expect(
      await turnstileVerifier(
        "private",
        "retrosum.example",
        () => now,
        fetcher,
      )(input, new AbortController().signal),
    ).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(options?.redirect).toBe("error");
    expect(String(options?.body)).not.toContain("remoteip");
    for (const change of [
      { success: false },
      { hostname: "foreign.example" },
      { action: "retrosum_extract" },
      { cdata: "b".repeat(64) },
      { challenge_ts: new Date(now - 300000).toISOString() },
      { challenge_ts: new Date(now + 1).toISOString() },
    ]) {
      fetcher.mockResolvedValueOnce(Response.json({ ...valid, ...change }));
      expect(
        await turnstileVerifier(
          "private",
          "retrosum.example",
          () => now,
          fetcher,
        )(input, new AbortController().signal),
      ).toBe(false);
    }
  });
  it("bounds actual body bytes and cancels a hanging body when its signal ends", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response("x".repeat(8193)));
    expect(
      await turnstileVerifier(
        "private",
        "retrosum.example",
        () => now,
        fetcher,
      )(input, new AbortController().signal),
    ).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const cancelled = vi.fn(),
      abort = new AbortController();
    const pending = readBoundedJson(
      new Response(new ReadableStream({ cancel: cancelled })),
      8192,
      abort.signal,
    );
    abort.abort();
    await expect(pending).rejects.toThrow();
    expect(cancelled).toHaveBeenCalledTimes(1);
  });
  it("emits only approved primitives and diagnostics cannot leak a thrown error", () => {
    const sink = vi.fn();
    emitMetric(sink, {
      route: "chat",
      mode: "fake",
      status: 200,
      durationMs: 50.6,
      ...{ prompt: "secret", cookie: "secret", filename: "private.pdf" },
    });
    expect(sink).toHaveBeenCalledWith({ route: "chat", mode: "fake", status: 200, durationMs: 51 });
    emitMetric(sink, { route: "chat", mode: "fake", status: 999, durationMs: 0 });
    expect(sink).toHaveBeenCalledTimes(1);
    expect(() =>
      emitMetric(
        () => {
          throw new Error("private payload");
        },
        { route: "chat", mode: "live", status: 503, durationMs: 0 },
      ),
    ).not.toThrow();
  });
});
