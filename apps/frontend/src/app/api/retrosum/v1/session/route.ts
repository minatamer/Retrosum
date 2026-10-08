import { revokeSession } from "../../../../../server/session.server";
import { forwardAdmission } from "../../../../../server/admission.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function DELETE(request: Request) {
  return revokeSession(request);
}
export async function POST(request: Request) {
  return forwardAdmission(request, "session");
}
