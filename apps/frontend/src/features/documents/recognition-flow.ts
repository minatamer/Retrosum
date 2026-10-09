import {
  documentSchema,
  extractionRequestSchema,
  MAX_TOTAL_BYTES,
  type SourceDocument,
  type OperationToken,
  type SampleAsset,
} from "@retrosum/contracts";
import { mergeInterpretation } from "@retrosum/money";
import type { SessionController } from "../session/session-controller";
import { inspectOriginal } from "./inspect-client";
import { recognitionCapabilities, extractOriginal } from "./recognition-client";
import { loadSampleBytes } from "./pdf-policy";
import { hashRequest, type AuthorizePaid } from "../processing/processing-client";

export type IntakeItem = { doc: SourceDocument; blob: Blob };
export function updateDocument(
  controller: SessionController,
  token: OperationToken,
  id: string,
  change: Partial<SourceDocument>,
) {
  const session = controller.getSnapshot().session;
  if (!session) throw new RangeError("This session is unavailable.");
  const graph = {
    ...session.workspace,
    revision: session.workspace.revision + 1,
    documents: session.workspace.documents.map((doc) =>
      doc.id === id ? documentSchema.parse({ ...doc, ...change }) : doc,
    ),
  };
  controller.replaceGraph(token, graph);
  return controller.token(token.operationId);
}
export function checkEnvelope(docs: SourceDocument[]) {
  if (
    docs.length > 10 ||
    docs.reduce((sum, doc) => sum + doc.pageCount, 0) > 20 ||
    docs.reduce((sum, doc) => sum + doc.byteLength, 0) > MAX_TOTAL_BYTES
  )
    throw new RangeError(
      "Keep this workspace within 10 PDFs, 20 pages and 20 MiB. No document processing was started.",
    );
}
export async function prepareSamples(
  assets: readonly SampleAsset[],
  signal: AbortSignal,
): Promise<IntakeItem[]> {
  const items: IntakeItem[] = [];
  for (const asset of assets) {
    const data = await loadSampleBytes(asset, signal);
    const blob = new Blob([data], { type: "application/pdf" });
    const inspected = await inspectOriginal(blob, signal);
    if (inspected.sha256 !== asset.sha256 || inspected.pageCount !== asset.pageCount)
      throw new RangeError("The sample original has changed. Reload before processing.");
    items.push({
      doc: documentSchema.parse({
        id: asset.id,
        name: asset.name,
        mime: asset.mime,
        sha256: asset.sha256,
        byteLength: asset.byteLength,
        pageCount: asset.pageCount,
        kind: asset.kind,
        provenance: asset.provenance,
        state: "queued",
      }),
      blob,
    });
  }
  checkEnvelope(items.map((item) => item.doc));
  return items;
}
export async function prepareUploads(
  files: readonly File[],
  signal: AbortSignal,
): Promise<IntakeItem[]> {
  if (files.length > 10 || files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES)
    throw new RangeError("Choose up to 10 PDFs within 20 MiB.");
  const items: IntakeItem[] = [];
  for (const file of files) {
    const inspected = await inspectOriginal(file, signal);
    items.push({
      blob: file,
      doc: documentSchema.parse({
        id: `document_${crypto.randomUUID()}`,
        name: file.name,
        mime: "application/pdf",
        byteLength: file.size,
        sha256: inspected.sha256,
        pageCount: inspected.pageCount,
        kind: "unknown",
        state: "queued",
        provenance: "visitor_upload",
      }),
    });
  }
  checkEnvelope(items.map((item) => item.doc));
  return items;
}
const pause = (signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new RangeError("Cancelled."));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 400);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
export async function processDocuments(
  controller: SessionController,
  items: IntakeItem[],
  signal: AbortSignal,
  progress: (text: string) => void,
  retry = false,
  authorize?: AuthorizePaid,
) {
  let token = controller.token(`batch_${crypto.randomUUID()}`);
  let capabilities;
  try {
    capabilities = await recognitionCapabilities(signal);
    if (!controller.isCurrent(token))
      throw new RangeError("The workspace changed. Start a fresh document operation.");
    if (!capabilities.documents.available)
      throw new RangeError(
        "Recognition is unavailable. Your originals and manual records are ready.",
      );
  } catch (error) {
    if (controller.isCurrent(token))
      for (const item of items)
        token = updateDocument(controller, token, item.doc.id, {
          state: signal.aborted ? "cancelled" : "error",
          disposition: "held",
          reviewNotes: [
            "Recognition did not start. Originals are preserved; no automatic retry will run.",
          ],
        });
    throw error;
  }
  for (const [n, item] of items.entries()) {
    if (!controller.isCurrent(token))
      throw new RangeError(
        "The workspace changed during processing. Completed sources are preserved.",
      );
    if (signal.aborted) {
      for (const pending of items.slice(n))
        token = updateDocument(controller, token, pending.doc.id, {
          state: "cancelled",
          disposition: "held",
          reviewNotes: ["Cancelled before submission."],
        });
      progress("Processing stopped. Completed sources are preserved.");
      throw new RangeError("Processing cancelled.");
    }
    token = updateDocument(controller, token, item.doc.id, { state: "reading" });
    const session = controller.getSnapshot().session!;
    const docs = session.workspace.documents;
    try {
      progress(`Reading · ${n + 1} of ${items.length} · ${item.doc.name}`);
      if (capabilities.mode === "fake") await pause(signal);
      if (!controller.isCurrent(token))
        throw new RangeError("The workspace changed before submission.");
      const metadata = extractionRequestSchema.parse({
        operationId: crypto.randomUUID(),
        workspaceId: token.workspaceId,
        // Bind the revision that the submission marker will create after consent.
        revision: token.inputRevision + 1,
        retry,
        business: session.workspace.business,
        asOf: session.workspace.asOf,
        document: item.doc,
        envelope: {
          files: docs.length,
          pages: docs.reduce((sum, doc) => sum + doc.pageCount, 0),
          bytes: docs.reduce((sum, doc) => sum + doc.byteLength, 0),
        },
      });
      const grant =
        capabilities.mode === "live"
          ? await authorize?.(
              {
                action: "extract",
                workspaceId: metadata.workspaceId,
                operationId: metadata.operationId,
                inputHash: await hashRequest(metadata),
                documentHash: metadata.document.sha256,
                retry: metadata.retry,
              },
              capabilities,
              signal,
            )
          : undefined;
      if (capabilities.mode === "live" && !grant)
        throw new RangeError(
          "Live processing requires disclosure and admission. No PDF was submitted.",
        );
      if (!controller.isCurrent(token))
        throw new RangeError("The workspace changed before submission.");
      token = updateDocument(controller, token, item.doc.id, { recognitionAttempted: true });
      const result = await extractOriginal(metadata, item.blob, signal, grant);
      if (!controller.isCurrent(token))
        throw new RangeError(
          "The workspace changed. This result was discarded without automatic retry.",
        );
      token = updateDocument(controller, token, item.doc.id, { state: "validating" });
      progress(`Checking source figures · ${item.doc.name}`);
      if (capabilities.mode === "fake") await pause(signal);
      if (!controller.isCurrent(token))
        throw new RangeError("The workspace changed before validation finished.");
      const current = controller.getSnapshot().session!.workspace;
      controller.replaceGraph(token, mergeInterpretation(current, item.doc, result));
      token = controller.token(token.operationId);
    } catch (error) {
      if (!controller.isCurrent(token)) throw error;
      token = updateDocument(controller, token, item.doc.id, {
        state: signal.aborted ? "cancelled" : "error",
        disposition: "held",
        reviewNotes: [
          signal.aborted
            ? "Processing cancelled. No automatic retry will run."
            : error instanceof Error
              ? error.message
              : "Recognition failed.",
        ],
      });
      if (signal.aborted) {
        for (const pending of items.slice(n + 1))
          token = updateDocument(controller, token, pending.doc.id, {
            state: "cancelled",
            disposition: "held",
            reviewNotes: ["Cancelled before submission."],
          });
        progress("Processing stopped. Completed sources are preserved.");
        throw error;
      }
    }
  }
  const selected = new Set(items.map((item) => item.doc.id));
  const finished = controller
    .getSnapshot()
    .session!.workspace.documents.filter((doc) => selected.has(doc.id));
  const failed = finished.filter((doc) => doc.state === "error").length;
  const held = finished.filter((doc) => doc.state === "needs_review").length;
  progress(
    `Processing finished · ${finished.length - failed} interpreted · ${held} need review · ${failed} failed. Originals remain available.`,
  );
}
