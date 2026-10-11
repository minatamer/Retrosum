import "server-only";
import { capabilitiesSchema, unavailableCapabilities } from "@retrosum/contracts";
import type { RuntimeCapabilities } from "@retrosum/contracts";
import { backendRequest, readBounded } from "./backend.server";
const pending = new WeakMap<typeof fetch, Map<string, Promise<RuntimeCapabilities>>>();
export function readBackendCapabilities(
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
  signal?: AbortSignal,
): Promise<RuntimeCapabilities> {
  if (signal?.aborted) return Promise.resolve(unavailableCapabilities());
  const key = JSON.stringify([
    environment.BACKEND_ORIGIN,
    environment.BACKEND_AUDIENCE,
    environment.K_SERVICE,
  ]);
  let requests = pending.get(fetcher);
  if (!requests) {
    requests = new Map();
    pending.set(fetcher, requests);
  }
  const existing = requests.get(key);
  if (existing) return waitForCapabilities(existing, signal);
  if (requests.size >= 8) return Promise.resolve(unavailableCapabilities());
  const result = lookupCapabilities(fetcher, environment).finally(() => requests.delete(key));
  requests.set(key, result);
  return waitForCapabilities(result, signal);
}
function waitForCapabilities(result: Promise<RuntimeCapabilities>, signal?: AbortSignal) {
  if (!signal) return result;
  return new Promise<RuntimeCapabilities>((resolve) => {
    const abort = () => {
      resolve(unavailableCapabilities());
      signal.removeEventListener("abort", abort);
    };
    signal.addEventListener("abort", abort, { once: true });
    void result.then((value) => {
      signal.removeEventListener("abort", abort);
      resolve(value);
    });
    if (signal.aborted) abort();
  });
}
async function lookupCapabilities(
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
): Promise<RuntimeCapabilities> {
  try {
    // Both hosted services scale to zero; the public, no-cost config request
    // must allow the private backend to start before declaring it unavailable.
    const signal = AbortSignal.timeout(10000);
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
