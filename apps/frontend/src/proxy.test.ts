import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, proxy } from "./proxy";

describe("page security policy", () => {
  it("protects the canonical demo and keeps API/assets outside the page proxy", () => {
    for (const url of ["/", "/demo", "/demo?entry=sample", "/workspace"]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
    }
    for (const url of [
      "/api/retrosum/v1/config",
      "/samples/harbor-v1/harbor-HS-101.pdf",
      "/pdfjs/6.4.299/pdf.worker.min.mjs",
      "/_next/static/chunks/app.js",
    ]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
    }
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
