import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, proxy } from "./proxy";
import { frontendRequestGate } from "./server/request-gate.server";
vi.mock("server-only", () => ({}));

describe("page security policy", () => {
  it("covers pages and image work while leaving streamed APIs and static assets outside the body-buffering proxy", () => {
    for (const url of [
      "/",
      "/demo",
      "/demo?entry=sample",
      "/workspace",
      "/_next/image?url=logo.png",
    ]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
    }
    for (const url of [
      "/api/retrosum/v1/config",
      "/api/retrosum/v1/extract",
      "/api/retrosum/v1/extract?anything=1",
      "/samples/harbor-v1/harbor-HS-101.pdf",
      "/pdfjs/6.4.299/pdf.worker.min.mjs",
      "/_next/static/chunks/app.js",
    ]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
    }
  });

  it("rejects before rendering/forwarding when the shared work window is closed, with generic copy", () => {
    vi.spyOn(frontendRequestGate, "admit").mockReturnValue(false);
    const page = proxy(new NextRequest("https://retrosum.example/demo"));
    const image = proxy(new NextRequest("https://retrosum.example/_next/image?url=logo.png"));
    expect(page.status).toBe(429);
    expect(image.status).toBe(429);
    expect(page.headers.get("Retry-After")).toBe("60");
    expect(page.headers.get("x-middleware-next")).toBeNull();
    expect(image.headers.get("Cache-Control")).toBe("no-store");
  });

  it("gives each production demo response a fresh policy and matching render nonce", () => {
    vi.stubEnv("NODE_ENV", "production");
    const first = proxy(new NextRequest("https://retrosum.example/demo"));
    const second = proxy(new NextRequest("https://retrosum.example/demo"));
    const policy = first.headers.get("Content-Security-Policy");
    const nonce = policy?.match(/'nonce-([^']+)'/u)?.[1];
    expect(nonce).toBeTruthy();
    expect(first.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
    expect(second.headers.get("Content-Security-Policy")).not.toBe(policy);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(first.headers.get("Cache-Control")).toBe("no-store");
  });
});
