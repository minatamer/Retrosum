import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { forwardExchangeRate } from "./exchange-rate.server.js";

const quote = { base: "USD", quote: "EUR", source: "ECB", date: "2026-10-09", rateMicros: 892380 };
const incoming = () =>
  new Request("http://localhost:3000/api/retrosum/v1/exchange-rate", {
    headers: { Cookie: "private_cookie", Authorization: "private_key" },
  });
describe("bounded automatic rate bridge", () => {
  it("forwards only the fixed quote request and validated public fields", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(quote));
    const result = await forwardExchangeRate(incoming(), fetcher, {});
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual(quote);
    expect(fetcher.mock.calls[0]?.[0]).toEqual(new URL("http://127.0.0.1:4000/v1/exchange-rate"));
    expect(fetcher.mock.calls[0]?.[1]?.headers).toEqual({});
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
  it.each([
    Response.json({ ...quote, rateMicros: 0 }),
    Response.json({ ...quote, secret: "private" }),
    new Response("private", { status: 503 }),
    new Response("x".repeat(4097)),
  ])("sanitizes unavailable or malformed backend replies %#", async (response) => {
    const result = await forwardExchangeRate(
      incoming(),
      vi.fn<typeof fetch>().mockResolvedValue(response),
      {},
    );
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ error: "exchange_rate_unavailable" });
  });
});
