import { forwardRetro } from "../../../../../server/retro.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return forwardRetro(request);
}
