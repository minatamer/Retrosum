import http from "node:http";
import https from "node:https";
import { beforeEach, vi } from "vitest";
const loopback = (input: string | URL | http.RequestOptions) => {
  if (typeof input === "string" || input instanceof URL)
    return ["127.0.0.1", "localhost", "[::1]"].includes(new URL(input).hostname);
  return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(
    input.hostname ?? input.host ?? "localhost",
  );
};
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("FAKE_MODE", "true");
  vi.stubEnv("PAID_DEMO_ENABLED", "false");
  vi.stubEnv("LIVE_DOCUMENTS_ENABLED", "false");
  vi.stubEnv("LIVE_COPILOT_ENABLED", "false");
  vi.stubEnv("AI_PROVIDER", "fake");
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  vi.stubEnv("GRANT_SIGNING_SECRET", "");
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("External fetch is disabled in tests."))),
  );
  const originalRequest = http.request;
  const originalGet = http.get;
  vi.spyOn(http, "request").mockImplementation(((...args: Parameters<typeof http.request>) => {
    if (!loopback(args[0])) throw new Error("External HTTP is disabled in tests.");
    return originalRequest(...args);
  }) as typeof http.request);
  vi.spyOn(http, "get").mockImplementation(((...args: Parameters<typeof http.get>) => {
    if (!loopback(args[0])) throw new Error("External HTTP is disabled in tests.");
    return originalGet(...args);
  }) as typeof http.get);
  vi.spyOn(https, "request").mockImplementation(() => {
    throw new Error("External HTTPS is disabled in tests.");
  });
  vi.spyOn(https, "get").mockImplementation(() => {
    throw new Error("External HTTPS is disabled in tests.");
  });
});
