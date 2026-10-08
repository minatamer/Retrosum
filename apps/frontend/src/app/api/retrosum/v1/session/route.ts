import { revokeSession } from "../../../../../server/session.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function DELETE(request: Request) {
  return revokeSession(request);
}
