import "server-only";
import { capabilitiesSchema, unavailableCapabilities } from "@retrosum/contracts";
import type { RuntimeCapabilities } from "@retrosum/contracts";
export async function readBackendCapabilities(
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
): Promise<RuntimeCapabilities> {
  try {
    const origin = new URL(environment.BACKEND_ORIGIN ?? "http://127.0.0.1:4000");
    const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname);
    if (
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== "/" ||
      !((origin.protocol === "http:" && loopback) || origin.protocol === "https:")
    )
      return unavailableCapabilities();
    const response = await fetcher(new URL("/v1/config", origin), {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
      redirect: "error",
    });
    if (!response.ok) {
      await response.body?.cancel();
      return unavailableCapabilities();
    }
    const length = response.headers.get("content-length");
    if (length && Number(length) > 8192) {
      await response.body?.cancel();
      return unavailableCapabilities();
    }
    if (!response.body) return unavailableCapabilities();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 8192) {
          await reader.cancel();
          return unavailableCapabilities();
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    const result = capabilitiesSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : unavailableCapabilities();
  } catch {
    return unavailableCapabilities();
  }
}
