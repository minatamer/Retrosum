import { describe, expect, it } from "vitest";
import http from "node:http";
import https from "node:https";
describe("test network guard", () => {
  it("rejects fetch before making any request", async () => {
    await expect(fetch("https://api.openai.com/v1/responses")).rejects.toThrow("disabled in tests");
  });
  it("rejects direct external HTTP and HTTPS", () => {
    expect(() => http.get("http://example.com")).toThrow("disabled in tests");
    expect(() => https.request("https://api.openai.com")).toThrow("disabled in tests");
  });
  it("sets paid flags off and removes inherited credentials", () => {
    expect(process.env.PAID_DEMO_ENABLED).toBe("false");
    expect(process.env.OPENAI_API_KEY).toBe("");
  });
});
