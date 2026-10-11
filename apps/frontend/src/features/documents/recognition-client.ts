import { UserFacingError } from "../../components/ui/user-facing-error";
import {
  capabilitiesSchema,
  extractionResultSchema,
  extractionRequestSchema,
  MAX_RECOGNITION_BYTES,
  EXTRACTION_TRANSPORT_DEADLINE_MS,
  type ExtractionRequest,
} from "@retrosum/contracts";

import { readJson } from "../../transport/read-json";
export async function recognitionCapabilities(signal: AbortSignal) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
  const response = await fetch("/api/retrosum/v1/config", {
    signal: deadline,
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok)
    throw new UserFacingError(
      "Document processing is temporarily unavailable. Originals and manual records remain available.",
    );
  return capabilitiesSchema.parse(await readJson(response, 8192, deadline));
}
const messages = new Map([
  [
    "fake_unrecognized_pdf",
    "This PDF could not be interpreted. You can view the original and add its records manually.",
  ],
  [
    "document_allowance_used",
    "This session’s recognition allowance is used. Keep the original and enter records manually, or start a fresh workspace.",
  ],
  [
    "operation_replayed",
    "This operation was already submitted. Review its existing result; it will not be billed again automatically.",
  ],
  [
    "acceptance_pending",
    "Live recognition is awaiting owner accuracy and spend verification. Your original remains in this browser.",
  ],
  [
    "instance_busy",
    "Another document operation is active. Try again deliberately when it finishes.",
  ],
]);
export async function extractOriginal(
  input: ExtractionRequest,
  blob: Blob,
  signal: AbortSignal,
  grant?: string,
  submitting?: () => void,
) {
  const metadata = extractionRequestSchema.parse(input);
  const form = new FormData();
  form.set("metadata", JSON.stringify(metadata));
  form.set("file", blob, "document.pdf");
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(EXTRACTION_TRANSPORT_DEADLINE_MS)]);
  deadline.throwIfAborted();
  submitting?.();
  const response = await fetch("/api/retrosum/v1/extract", {
    method: "POST",
    body: form,
    signal: deadline,
    headers: grant ? { "X-Retrosum-Grant": grant } : {},
    cache: "no-store",
    redirect: "error",
  });
  const body = await readJson(response, MAX_RECOGNITION_BYTES, deadline);
  if (!response.ok) {
    const code =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "failed";
    throw new UserFacingError(
      messages.get(code) ??
        "This PDF could not be processed safely. Its original is preserved; no automatic retry will run.",
    );
  }
  return extractionResultSchema.parse(body);
}
