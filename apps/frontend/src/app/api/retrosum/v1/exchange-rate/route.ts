import { forwardExchangeRate } from "../../../../../server/exchange-rate.server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return forwardExchangeRate(request);
}
