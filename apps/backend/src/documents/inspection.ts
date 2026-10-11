import { Worker } from "node:worker_threads";
import { createHash } from "node:crypto";
import {
  inspectionSchema,
  MAX_FILE_BYTES,
  type PdfInspection,
  type SourceDocument,
} from "@retrosum/contracts";
import { InspectionCapacity } from "./inspection-capacity.js";
const capacity = new InspectionCapacity();
const MAX_INSPECTION_RSS = 640 * 1024 * 1024;

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
  return inspectWithinDeadline(bytes, signal);
}
async function inspectWithinDeadline(
  bytes: Uint8Array,
  signal: AbortSignal,
): Promise<PdfInspection> {
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(20000)]);
  let release: (() => void) | undefined;
  try {
    release = await capacity.enter(bounded);
    bounded.throwIfAborted();
    if (process.memoryUsage.rss() >= MAX_INSPECTION_RSS) throw new RangeError("instance_busy");
    return await inspectWorker(bytes, bounded);
  } catch (cause) {
    if (bounded.aborted)
      throw new RangeError(signal.aborted ? "cancelled" : "pdf_inspection_timeout", { cause });
    throw cause;
  } finally {
    release?.();
  }
}
function inspectWorker(bytes: Uint8Array, signal: AbortSignal): Promise<PdfInspection> {
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
    let settled = false;
    const memory = setInterval(() => {
      if (process.memoryUsage.rss() >= MAX_INSPECTION_RSS)
        void finish(new RangeError("unsupported_pdf"));
    }, 10);
    const abort = () => {
      void finish(new RangeError("cancelled"));
    };
    async function finish(error?: Error, result?: PdfInspection) {
      if (settled) return;
      settled = true;
      clearInterval(memory);
      signal.removeEventListener("abort", abort);
      worker.removeAllListeners("message");
      worker.removeAllListeners("exit");
      await worker.terminate().catch(() => undefined);
      if (error) reject(error);
      else if (result) resolve(result);
    }
    signal.addEventListener("abort", abort, { once: true });
    worker.once("error", () => {
      void finish(new RangeError("unsupported_pdf"));
    });
    worker.once("exit", () => {
      void finish(new RangeError("unsupported_pdf"));
    });
    worker.once("message", (message: unknown) => {
      const parsed = inspectionSchema.safeParse(message);
      if (!parsed.success) void finish(new RangeError("unsupported_pdf"));
      else void finish(undefined, parsed.data);
    });
    worker.postMessage(bytes);
    if (signal.aborted) abort();
  });
}
