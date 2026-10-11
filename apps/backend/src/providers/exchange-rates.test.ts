import { describe, expect, it, vi } from "vitest";
import { createExchangeRateService } from "./exchange-rates.js";

const published = { base: "USD", quote: "EUR", date: "2026-10-09", rate: 0.89238 };
const expected = {
  base: "USD",
  quote: "EUR",
  source: "ECB",
  date: published.date,
  rateMicros: 892380,
};
const signal = () => new AbortController().signal;

describe("automatic public ECB reference quote", () => {
  it("coalesces cold requests while one aborted caller cannot cancel the other", async () => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    const service = createExchangeRateService(() => Date.UTC(2026, 9, 9), fetcher),
      one = new AbortController(),
      two = new AbortController();
    const first = service.read(one.signal),
      second = service.read(two.signal);
    const rejected = expect(first).rejects.toThrow();
    one.abort();
    await rejected;
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    finish(Response.json(published));
    expect(await second).toEqual(expected);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("aborts abandoned shared work and a later caller can start a fresh lookup", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(
        (_url, options) =>
          new Promise<Response>((_resolve, reject) =>
            options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), {
              once: true,
            }),
          ),
      )
      .mockResolvedValueOnce(Response.json(published));
    const service = createExchangeRateService(() => Date.UTC(2026, 9, 9), fetcher),
      caller = new AbortController();
    const work = service.read(caller.signal),
      rejected = expect(work).rejects.toThrow();
    caller.abort();
    await rejected;
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(await service.read(signal())).toEqual(expected);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("backs off failed cold lookups briefly without stale rates, then recovers", async () => {
    let now = Date.UTC(2026, 9, 9);
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("upstream", { status: 503 }))
      .mockResolvedValueOnce(Response.json(published));
    const service = createExchangeRateService(() => now, fetcher);
    await expect(service.read(signal())).rejects.toThrow();
    for (let i = 0; i < 4; i++)
      await expect(service.read(signal())).rejects.toThrow("exchange_rate_unavailable");
    expect(fetcher).toHaveBeenCalledTimes(1);
    now += 5000;
    expect(await service.read(signal())).toEqual(expected);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("uses one anonymous fixed-pair request, exact micros and a bounded one-hour cache", async () => {
    let now = Date.UTC(2026, 9, 9, 12);
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(published));
    const service = createExchangeRateService(() => now, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    expect(await service.read(signal())).toEqual(expected);
    expect(await service.read(signal())).toEqual(expected);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      "https://api.frankfurter.dev/v2/rate/usd/eur?providers=ecb",
    );
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      headers: { Accept: "application/json" },
      redirect: "error",
      cache: "no-store",
    });
    expect(fetcher.mock.calls[0]?.[1]).not.toHaveProperty("body");
    now += 3_600_001;
    await service.read(signal());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it.each([
    { ...published, base: "EUR" },
    { ...published, quote: "USD" },
    { ...published, rate: 0 },
    { ...published, rate: 1001 },
    { ...published, rate: 0.0000001 },
    { ...published, date: "2026-02-30" },
    { ...published, date: "2026-10-10" },
    { ...published, date: "2026-09-30" },
  ])("rejects an invalid, inverted, future or old quote %#", async (body) => {
    const service = createExchangeRateService(
      () => Date.UTC(2026, 9, 9, 12),
      vi.fn<typeof fetch>().mockResolvedValue(Response.json(body)),
    );
    await expect(service.read(signal())).rejects.toThrow();
  });
  it("accepts the previous published working-day rate across a weekend", async () => {
    const service = createExchangeRateService(
      () => Date.UTC(2026, 9, 12, 8),
      vi.fn<typeof fetch>().mockResolvedValue(Response.json(published)),
    );
    expect(await service.read(signal())).toEqual(expected);
  });
  it("never invents a fallback or returns expired cache on an upstream failure", async () => {
    let now = Date.UTC(2026, 9, 9, 12);
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(published))
      .mockResolvedValue(new Response("private upstream detail", { status: 429 }));
    const service = createExchangeRateService(() => now, fetcher);
    await service.read(signal());
    now += 3_600_001;
    await expect(service.read(signal())).rejects.toThrow("exchange_rate_unavailable");
    const aborted = new AbortController();
    aborted.abort();
    await expect(service.read(aborted.signal)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("rejects oversized rate responses", async () => {
    const service = createExchangeRateService(
      () => Date.UTC(2026, 9, 9),
      vi.fn<typeof fetch>().mockResolvedValue(new Response("x".repeat(4097))),
    );
    await expect(service.read(signal())).rejects.toThrow();
  });
});
