import "server-only";
import { capabilitiesSchema, unavailableCapabilities } from "@retrosum/contracts";
import type { RuntimeCapabilities } from "@retrosum/contracts";
import { backendRequest, readBounded } from "./backend.server";
export async function readBackendCapabilities(
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
): Promise<RuntimeCapabilities> {
  try {
    const signal = AbortSignal.timeout(3000);
    const response = await backendRequest(
      "/v1/config",
      {
        cache: "no-store",
        signal,
        redirect: "error",
      },
      fetcher,
      environment,
    );
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
    const text = await readBounded(response.body, 8192, signal);
    const result = capabilitiesSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : unavailableCapabilities();
  } catch {
    return unavailableCapabilities();
  }
}
