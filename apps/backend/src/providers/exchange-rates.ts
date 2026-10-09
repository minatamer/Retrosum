import { z } from "zod";
import { dateSchema, usdEurRateSchema, type UsdEurRate } from "@retrosum/contracts";
import { parseDisplayRate } from "@retrosum/money";
import { readBoundedJson } from "../security/read-json.js";

const endpoint = "https://api.frankfurter.dev/v2/rate/usd/eur?providers=ecb";
const day = 86_400_000;
const providerRate = z.object({
  base: z.literal("USD"),
  quote: z.literal("EUR"),
  date: dateSchema,
  rate: z.number().positive().max(1000),
});
export interface ExchangeRateService {
  read(signal: AbortSignal): Promise<UsdEurRate>;
}

/** Anonymous public quote; no AI mode, user data or import-time HTTP. */
export function createExchangeRateService(
  now: () => number,
  fetcher: typeof fetch = fetch,
): ExchangeRateService {
  let cached: { quote: UsdEurRate; expiresAt: number } | null = null;
  const recent = (date: string) => {
    const today = Math.floor(now() / day) * day;
    const published = Date.parse(`${date}T00:00:00Z`);
    return published <= today && published >= today - 7 * day;
  };
  return {
    async read(signal) {
      signal.throwIfAborted();
      if (cached && cached.expiresAt > now() && recent(cached.quote.date)) return cached.quote;
      const bounded = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      const response = await fetcher(endpoint, {
        signal: bounded,
        headers: { Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new RangeError("exchange_rate_unavailable");
      }
      const parsed = providerRate.parse(await readBoundedJson(response, 4096, bounded));
      if (!recent(parsed.date)) throw new RangeError("exchange_rate_outdated");
      const quote = usdEurRateSchema.parse({
        base: parsed.base,
        quote: parsed.quote,
        date: parsed.date,
        source: "ECB",
        rateMicros: parseDisplayRate(parsed.rate.toFixed(6)),
      });
      cached = { quote, expiresAt: now() + 3_600_000 };
      return quote;
    },
  };
}
