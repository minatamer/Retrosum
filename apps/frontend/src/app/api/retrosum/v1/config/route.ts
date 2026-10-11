import { readBackendCapabilities } from "../../../../../server/capabilities.server";
import {
  frontendRequestGate,
  requestLimitResponse,
} from "../../../../../server/request-gate.server";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!frontendRequestGate.admit("GET")) return requestLimitResponse();
  return Response.json(await readBackendCapabilities(), {
    headers: { "Cache-Control": "no-store" },
  });
}
