import { UserFacingError, userFacingError } from "../../components/ui/user-facing-error";
import { MAX_FILE_BYTES } from "@retrosum/contracts";
import { PDF_DEADLINE_MS, PDF_RUNTIME_PATH, safePdfOptions } from "./pdf-policy";

export async function inspectOriginal(blob: Blob, signal: AbortSignal) {
  if (blob.type !== "application/pdf" || blob.size < 5 || blob.size > MAX_FILE_BYTES)
    throw new UserFacingError("Choose a PDF up to 5 MiB.");
  signal.throwIfAborted();
  const bytes = await blob.arrayBuffer();
  const raw = new TextDecoder("latin1").decode(bytes);
  if (
    !raw.startsWith("%PDF-") ||
    /\/(?:Encrypt|JavaScript|JS|Launch|OpenAction|AA|EmbeddedFile|RichMedia|XFA)\b/u.test(raw)
  )
    throw new UserFacingError(
      "This PDF is damaged, encrypted or contains unsupported active content.",
    );
  const library = await import("pdfjs-dist");
  signal.throwIfAborted();
  library.GlobalWorkerOptions.workerSrc = `${PDF_RUNTIME_PATH}/pdf.worker.min.mjs`;
  const worker = new library.PDFWorker();
  const task = library.getDocument({ ...safePdfOptions, data: bytes.slice(0), worker });
  const abort = () => {
    void task.destroy();
    worker.destroy();
  };
  signal.addEventListener("abort", abort, { once: true });
  const timer = window.setTimeout(abort, PDF_DEADLINE_MS);
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 20 || (await pdf.getJSActions()) || (await pdf.getAttachments()))
      throw new UserFacingError("This PDF exceeds the page limit or contains active content.");
    for (let n = 1; n <= pdf.numPages; n++) {
      signal.throwIfAborted();
      const page = await pdf.getPage(n);
      const box = page.getViewport({ scale: 1 });
      if (
        box.width <= 0 ||
        box.height <= 0 ||
        box.width > 10000 ||
        box.height > 10000 ||
        (await page.getJSActions())
      )
        throw new UserFacingError("This PDF page is unsupported.");
      const annotations = await page.getAnnotations();
      if (
        annotations.some(
          (item) => item.url || item.unsafeUrl || item.actions || item.file || item.action,
        )
      )
        throw new UserFacingError("Active or external PDF content is unsupported.");
      page.cleanup();
    }
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return {
      bytes,
      sha256: [...new Uint8Array(hash)].map((part) => part.toString(16).padStart(2, "0")).join(""),
      pageCount: pdf.numPages,
    };
  } catch (error) {
    if (signal.aborted) throw error;
    throw new UserFacingError(
      userFacingError(
        error,
        "This PDF could not be inspected. It may be encrypted, damaged or too complex.",
      ),
      { cause: error },
    );
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener("abort", abort);
    await task.destroy().catch(() => undefined);
    worker.destroy();
  }
}
