import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readBackendCapabilities } from "./capabilities.server.js";
import { capabilitiesSchema, DEMO_LIMITS } from "@retrosum/contracts";
const fake = {
  schemaVersion: 1,
  mode: "fake",
  documents: { available: false, reason: "feature_pending" },
  copilot: { available: false, reason: "feature_pending" },
  limits: DEMO_LIMITS,
};
describe("bounded server-only capability bridge", () => {
  it("validates the public projection", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(fake));
    expect(await readBackendCapabilities(fetcher, {})).toEqual(capabilitiesSchema.parse(fake));
    expect(fetcher.mock.calls[0]?.[0]).toEqual(new URL("http://127.0.0.1:4000/v1/config"));
  });
  it("allows a cold backend to respond after three seconds without retrying", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async (_url, options) =>
        new Promise<Response>((resolve, reject) => {
          const signal = options?.signal;
          const abort = () => {
            clearTimeout(timer);
            reject(signal?.reason);
          };
          const timer = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve(Response.json(fake));
          }, 3200);
          signal?.addEventListener("abort", abort, { once: true });
          if (signal?.aborted) abort();
        }),
    );
    expect(await readBackendCapabilities(fetcher, {})).toEqual(capabilitiesSchema.parse(fake));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("never exposes rejected backend payloads", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ...fake, secret: "private" }));
    const result = await readBackendCapabilities(fetcher, {});
    expect(result.mode).toBe("unavailable");
    expect(JSON.stringify(result)).not.toContain("private");
  });
  it.each([
    "javascript:alert(1)",
    "http://attacker.example",
    "http://localhost:4000/path",
    "https://user:secret@example.com",
  ])("rejects unsafe private origin %s", async (origin) => {
    const fetcher = vi.fn<typeof fetch>();
    expect((await readBackendCapabilities(fetcher, { BACKEND_ORIGIN: origin })).mode).toBe(
      "unavailable",
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("recovers from backend failure without inventing fake availability", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("secret_failure"));
    expect((await readBackendCapabilities(fetcher, {})).mode).toBe("unavailable");
  });
  it("rejects an oversized payload", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("x".repeat(8193)));
    expect((await readBackendCapabilities(fetcher, {})).mode).toBe("unavailable");
  });
});
