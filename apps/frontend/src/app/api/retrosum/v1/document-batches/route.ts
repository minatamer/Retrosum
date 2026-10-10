import { forwardAdmission } from "../../../../../server/admission.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return forwardAdmission(request, "batch");
}
