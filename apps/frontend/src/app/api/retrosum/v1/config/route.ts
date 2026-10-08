import { readBackendCapabilities } from "../../../../../server/capabilities.server";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await readBackendCapabilities(), {
    headers: { "Cache-Control": "no-store" },
  });
}
