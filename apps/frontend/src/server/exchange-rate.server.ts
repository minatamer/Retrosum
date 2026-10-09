import "server-only";
import { usdEurRateSchema } from "@retrosum/contracts";
import { backendRequest, readBounded } from "./backend.server";

export async function forwardExchangeRate(
  request: Request,
  fetcher: typeof fetch = fetch,
  environment: Record<string, string | undefined> = process.env,
) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)]);
    const response = await backendRequest("/v1/exchange-rate", { signal }, fetcher, environment);
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new RangeError("exchange_rate_unavailable");
    }
    const quote = usdEurRateSchema.parse(
      JSON.parse(await readBounded(response.body, 4096, signal)),
    );
    return Response.json(quote, { headers });
  } catch {
    return Response.json({ error: "exchange_rate_unavailable" }, { status: 503, headers });
  }
}
