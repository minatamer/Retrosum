import { UserFacingError, userFacingError } from "../../components/ui/user-facing-error";
import {
  documentSchema,
  extractionRequestSchema,
  MAX_TOTAL_BYTES,
  MAX_CONCURRENT_OPERATIONS,
  type ExtractionRequest,
  type SourceDocument,
  type OperationToken,
  type SampleAsset,
} from "@retrosum/contracts";
import { mergeInterpretation } from "@retrosum/money";
import type { SessionController } from "../session/session-controller";
import { inspectOriginal } from "./inspect-client";
import { recognitionCapabilities, extractOriginal } from "./recognition-client";
import { loadSampleBytes } from "./pdf-policy";
import {
  hashRequest,
  requestBatchGrant,
  type AuthorizePaid,
} from "../processing/processing-client";

export type IntakeItem = { doc: SourceDocument; blob: Blob };
export function updateDocument(
  controller: SessionController,
  token: OperationToken,
  id: string,
  change: Partial<SourceDocument>,
) {
  const session = controller.getSnapshot().session;
  if (!session) throw new UserFacingError("This session is unavailable.");
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
    throw new UserFacingError(
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
      throw new UserFacingError("The sample original has changed. Reload before processing.");
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
    throw new UserFacingError("Choose up to 10 PDFs within 20 MiB.");
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
const pause = (signal: AbortSignal, milliseconds = 400) =>
  new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new UserFacingError("Cancelled."));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
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
      throw new UserFacingError("The workspace changed. Start a fresh document operation.");
    if (!capabilities.documents.available)
      throw new UserFacingError(
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
  const abort = new AbortController();
  const untrack = controller.trackEffect(abort);
  const batchSignal = AbortSignal.any([signal, abort.signal]);
  const completions = items.map(() => {
    let resolve!: () => void;
    const done = new Promise<void>((finish) => {
      resolve = finish;
    });
    return { done, resolve };
  });
  // Payment matching and duplicate review depend on earlier sources. Keep input-order
  // commits while four requests overlap; each worker holds at most one decoded result.
  const priorCommits = items.map((_, n) =>
    Promise.all(completions.slice(0, n).map((completion) => completion.done)),
  );
  // Only this batch advances its shared token. Unrelated edits/reset still invalidate it.
  const checkCurrent = () => {
    batchSignal.throwIfAborted();
    if (!controller.isCurrent(token))
      throw new UserFacingError(
        "The workspace changed during processing. Completed sources are preserved.",
      );
  };
  const session = controller.getSnapshot().session!;
  const docs = session.workspace.documents;
  // Freeze the exact selected snapshots before verification. Only batch-owned commits
  // may advance the graph while these immutable requests are in flight.
  let requests: ExtractionRequest[] = [];
  let approved: string | undefined;
  let identities: {
    operationId: string;
    inputHash: string;
    documentHash: string;
    retry: boolean;
  }[] = [];
  const process = async (item: IntakeItem, n: number) => {
    try {
      checkCurrent();
      token = updateDocument(controller, token, item.doc.id, { state: "reading" });
      progress(`Reading · ${n + 1} of ${items.length} · ${item.doc.name}`);
      if (capabilities.mode === "fake") await pause(batchSignal);
      checkCurrent();
      const metadata = requests[n]!;
      const grant =
        capabilities.mode === "live" && approved
          ? await requestBatchGrant(
              {
                ...identities[n]!,
                action: "extract",
                workspaceId: token.workspaceId,
              },
              approved,
              batchSignal,
            )
          : undefined;
      if (capabilities.mode === "live" && !grant)
        throw new UserFacingError(
          "Live processing requires disclosure and admission. No PDF was submitted.",
        );
      checkCurrent();
      const result = await extractOriginal(metadata, item.blob, batchSignal, grant, () => {
        checkCurrent();
        token = updateDocument(controller, token, item.doc.id, { recognitionAttempted: true });
      });
      checkCurrent();
      token = updateDocument(controller, token, item.doc.id, { state: "validating" });
      progress(`Checking source figures · ${item.doc.name}`);
      if (capabilities.mode === "fake") await pause(batchSignal);
      await priorCommits[n];
      checkCurrent();
      const current = controller.getSnapshot().session!.workspace;
      controller.replaceGraph(token, mergeInterpretation(current, item.doc, result));
      token = controller.token(token.operationId);
    } catch (error) {
      if (!controller.isCurrent(token)) throw error;
      token = updateDocument(controller, token, item.doc.id, {
        state: batchSignal.aborted ? "cancelled" : "error",
        disposition: "held",
        reviewNotes: [
          batchSignal.aborted
            ? "Processing cancelled. No automatic retry will run."
            : userFacingError(
                error,
                "This PDF could not be processed. Its original is preserved; no automatic retry will run.",
              ),
        ],
      });
      if (batchSignal.aborted) throw error;
    } finally {
      completions[n]!.resolve();
    }
  };
  let cursor = 0;
  let failure: { error: unknown } | undefined;
  const worker = async () => {
    try {
      while (cursor < items.length) {
        checkCurrent();
        const n = cursor++;
        await process(items[n]!, n);
      }
    } catch (error) {
      failure ??= { error };
      abort.abort(error);
    }
  };
  try {
    requests = items.map((item) =>
      extractionRequestSchema.parse({
        operationId: crypto.randomUUID(),
        workspaceId: token.workspaceId,
        revision: token.inputRevision,
        retry,
        business: session.workspace.business,
        asOf: session.workspace.asOf,
        document: item.doc,
        envelope: {
          files: docs.length,
          pages: docs.reduce((sum, doc) => sum + doc.pageCount, 0),
          bytes: docs.reduce((sum, doc) => sum + doc.byteLength, 0),
        },
      }),
    );
    if (capabilities.mode === "live" && items.length) {
      if (!authorize)
        throw new UserFacingError("Live processing requires selected-batch verification.");
      identities = await Promise.all(
        requests.map(async (metadata) => ({
          operationId: metadata.operationId,
          inputHash: await hashRequest(metadata),
          documentHash: metadata.document.sha256,
          retry: metadata.retry,
        })),
      );
      checkCurrent();
      const inputHash = await hashRequest(identities);
      checkCurrent();
      approved = await authorize(
        {
          action: "extract",
          workspaceId: token.workspaceId,
          operationId: token.operationId,
          inputHash,
          retry: false,
          operations: identities,
        },
        capabilities,
        batchSignal,
      );
      checkCurrent();
    }
    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT_OPERATIONS, items.length) }, worker),
    );
    if (failure) {
      if (controller.isCurrent(token))
        for (const pending of items.slice(cursor))
          token = updateDocument(controller, token, pending.doc.id, {
            state: "cancelled",
            disposition: "held",
            reviewNotes: ["Cancelled before submission."],
          });
      progress("Processing stopped. Completed sources are preserved.");
      throw failure.error;
    }
  } finally {
    untrack();
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
