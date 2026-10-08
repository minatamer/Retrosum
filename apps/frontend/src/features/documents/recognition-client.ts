import {
  capabilitiesSchema,
  extractionResultSchema,
  extractionRequestSchema,
  MAX_RECOGNITION_BYTES,
  type ExtractionRequest,
} from "@retrosum/contracts";

export async function readJson(response: Response, maximum: number) {
  if (!response.body) throw new RangeError("The server response was empty.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let text = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new RangeError("The server response exceeded the supported limit.");
      }
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    reader.releaseLock();
  }
}
export async function recognitionCapabilities(signal: AbortSignal) {
  const response = await fetch("/api/retrosum/v1/config", {
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok)
    throw new RangeError(
      "Document processing is temporarily unavailable. Originals and manual records remain available.",
    );
  return capabilitiesSchema.parse(await readJson(response, 8192));
}
const messages: Record<string, string> = {
  fake_unrecognized_pdf:
    "Simulation has no declared transcription for this PDF. View the original and add its core records manually.",
  document_allowance_used:
    "This session’s recognition allowance is used. Keep the original and enter records manually, or start a fresh workspace.",
  operation_replayed:
    "This operation was already submitted. Review its existing result; it will not be billed again automatically.",
  acceptance_pending:
    "Live recognition is awaiting owner accuracy and spend verification. Your original remains in this browser.",
  instance_busy: "Another document operation is active. Try again deliberately when it finishes.",
};
export async function extractOriginal(input: ExtractionRequest, blob: Blob, signal: AbortSignal) {
  const metadata = extractionRequestSchema.parse(input);
  const form = new FormData();
  form.set("metadata", JSON.stringify(metadata));
  form.set("file", blob, "document.pdf");
  const response = await fetch("/api/retrosum/v1/extract", {
    method: "POST",
    body: form,
    signal: AbortSignal.any([signal, AbortSignal.timeout(95000)]),
    cache: "no-store",
    redirect: "error",
  });
  const body = await readJson(response, MAX_RECOGNITION_BYTES);
  if (!response.ok) {
    const code =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "failed";
    throw new RangeError(
      messages[code] ??
        "This PDF could not be processed safely. Its original is preserved; no automatic retry will run.",
    );
  }
  return extractionResultSchema.parse(body);
}
