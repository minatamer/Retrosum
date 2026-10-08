import { Worker } from "node:worker_threads";
import { createHash } from "node:crypto";
import {
  inspectionSchema,
  MAX_FILE_BYTES,
  type PdfInspection,
  type SourceDocument,
} from "@retrosum/contracts";

export function verifyOriginal(bytes: Uint8Array, doc: SourceDocument) {
  if (
    bytes.byteLength !== doc.byteLength ||
    bytes.byteLength > MAX_FILE_BYTES ||
    Buffer.from(bytes.subarray(0, 5)).toString() !== "%PDF-" ||
    createHash("sha256").update(bytes).digest("hex") !== doc.sha256
  )
    throw new RangeError("invalid_original");
}
export function inspectPdf(bytes: Uint8Array, signal: AbortSignal): Promise<PdfInspection> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./inspect-worker.mjs", import.meta.url), {
      execArgv: [],
      resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 32, stackSizeMb: 4 },
      stdout: true,
      stderr: true,
    });
    // PDF parser diagnostics can contain source text. Drain without logging.
    worker.stdout?.resume();
    worker.stderr?.resume();
    const timer = setTimeout(() => finish(new RangeError("pdf_inspection_timeout")), 20000);
    const abort = () => finish(new RangeError("cancelled"));
    function finish(error?: Error, result?: PdfInspection) {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      worker.removeAllListeners();
      void worker.terminate();
      if (error) reject(error);
      else if (result) resolve(result);
    }
    signal.addEventListener("abort", abort, { once: true });
    worker.once("error", () => finish(new RangeError("unsupported_pdf")));
    worker.once("exit", () => finish(new RangeError("unsupported_pdf")));
    worker.once("message", (message: unknown) => {
      const parsed = inspectionSchema.safeParse(message);
      if (!parsed.success) finish(new RangeError("unsupported_pdf"));
      else finish(undefined, parsed.data);
    });
    worker.postMessage(bytes);
  });
}
