import type { Request, Response } from "express";
import { extractionResultSchema } from "@retrosum/contracts";
import type { AppRuntime } from "../runtime/compose.js";
import { inspectPdf, verifyOriginal } from "./inspection.js";
import { readExtraction } from "./multipart.js";
const publicErrors = new Set([
  "invalid_multipart",
  "invalid_original",
  "unsupported_pdf",
  "pdf_inspection_timeout",
  "fake_unrecognized_pdf",
  "body_too_large",
  "instance_busy",
  "operation_replayed",
  "document_allowance_used",
  "admission_full",
]);
export async function extractRoute(runtime: AppRuntime, req: Request, res: Response) {
  if (req.headers.origin !== runtime.config.FRONTEND_ORIGIN) {
    res.status(403).json({ error: "origin_not_allowed" });
    return;
  }
  if (!runtime.capabilities.documents.available || !runtime.ports.provider?.interpretDocument) {
    res.status(503).json({ error: runtime.capabilities.documents.reason ?? "adapter_not_ready" });
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  const abort = () => {
    if (!res.writableEnded) controller.abort();
  };
  req.once("aborted", abort);
  res.once("close", abort);
  let release: (() => void) | undefined;
  let releaseIntake: (() => void) | undefined;
  let untrack: (() => void) | undefined;
  try {
    releaseIntake = runtime.admission.enter();
    const { metadata, bytes } = await readExtraction(req, controller.signal);
    untrack = runtime.operations.track(metadata.workspaceId, controller);
    verifyOriginal(bytes, metadata.document);
    release = runtime.admission.reserve(
      metadata.workspaceId,
      metadata.operationId,
      metadata.document.sha256,
      metadata.retry,
    );
    const inspection = await inspectPdf(bytes, controller.signal);
    if (
      inspection.pages.length !== metadata.document.pageCount ||
      metadata.envelope.pages < inspection.pages.length ||
      metadata.envelope.bytes < bytes.byteLength
    )
      throw new RangeError("invalid_original");
    const output = await runtime.ports.provider.interpretDocument(
      { metadata, bytes },
      controller.signal,
    );
    controller.signal.throwIfAborted();
    res.json(
      extractionResultSchema.parse({
        mode: runtime.ports.provider.kind === "fake" ? "fake" : "live",
        sha256: metadata.document.sha256,
        inspection,
        ...output,
      }),
    );
  } catch (error) {
    if (!res.headersSent && !res.destroyed) {
      const code = controller.signal.aborted
        ? "cancelled_or_timeout"
        : error instanceof Error && publicErrors.has(error.message)
          ? error.message
          : "interpretation_failed";
      res
        .status(
          code === "fake_unrecognized_pdf"
            ? 422
            : code === "body_too_large"
              ? 413
              : code === "instance_busy" || code === "operation_replayed"
                ? 409
                : 400,
        )
        .json({ error: code });
    }
  } finally {
    release?.();
    releaseIntake?.();
    clearTimeout(timer);
    untrack?.();
    req.removeListener("aborted", abort);
    res.removeListener("close", abort);
  }
}
