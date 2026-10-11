/** Browser response transport. Callers own schemas, deadlines and product error wording. */
export async function readJson(response: Response, maximum: number, signal?: AbortSignal) {
  if (!response.body) throw new RangeError("empty_response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let text = "";
  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    signal?.throwIfAborted();
    while (true) {
      const part = await reader.read();
      signal?.throwIfAborted();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maximum) throw new RangeError("response_too_large");
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    signal?.removeEventListener("abort", abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
