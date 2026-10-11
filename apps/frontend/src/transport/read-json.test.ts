import { describe, expect, it, vi } from "vitest";
import { readJson } from "./read-json";

describe("bounded browser response reader", () => {
  it("decodes split multibyte UTF-8 and releases its lock", async () => {
    const bytes = new TextEncoder().encode('{"text":"€"}');
    const response = new Response(
      new ReadableStream({
        start(controller) {
          for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
          controller.close();
        },
      }),
    );
    expect(await readJson(response, bytes.length)).toEqual({ text: "€" });
    expect(response.body?.locked).toBe(false);
  });
  it("counts bytes rather than characters and cancels overflow", async () => {
    const cancel = vi.fn();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('"€€"'));
        },
        cancel,
      }),
    );
    await expect(readJson(response, 6)).rejects.toThrow("response_too_large");
    expect(cancel).toHaveBeenCalledOnce();
    expect(response.body?.locked).toBe(false);
  });
  it("rejects empty or malformed responses without leaving readers locked", async () => {
    await expect(readJson(new Response(null), 20)).rejects.toThrow("empty_response");
    const malformed = new Response("not JSON");
    await expect(readJson(malformed, 20)).rejects.toBeInstanceOf(SyntaxError);
    expect(malformed.body?.locked).toBe(false);
  });
  it("cancels a pending read and preserves the abort result", async () => {
    const abort = new AbortController(),
      cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }));
    const pending = readJson(response, 20, abort.signal);
    abort.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(response.body?.locked).toBe(false);
  });
});
