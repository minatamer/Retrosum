import { buildExportBundle, originalExportPaths } from "@retrosum/money";
import type { ExportOptions, MoneySession, SourceDocument } from "@retrosum/contracts";
import { validatePdfBlob } from "../session/blob-cache";
export const MAX_EXPORT_BYTES = 40 * 1024 * 1024;
export async function prepareArchive(
  session: MoneySession,
  options: ExportOptions,
  exportedAt: string,
  original: (doc: SourceDocument) => Promise<Blob | null>,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  const { zip } = await import("fflate");
  signal.throwIfAborted();
  const bundle = buildExportBundle(session, options, exportedAt);
  const encoder = new TextEncoder(),
    files: Record<string, Uint8Array> = {};
  let bytes = 0;
  const add = (name: string, value: Uint8Array) => {
    bytes += value.byteLength;
    if (bytes > MAX_EXPORT_BYTES)
      throw new RangeError("The export exceeds its 40 MiB bound. Try without originals.");
    files[name] = value;
  };
  for (const [name, contents] of Object.entries(bundle.files)) add(name, encoder.encode(contents));
  if (options.originals)
    for (const entry of originalExportPaths(session)) {
      const doc = session.workspace.documents.find((row) => row.id === entry.documentId)!;
      const blob = await original(doc);
      signal.throwIfAborted();
      if (!blob)
        throw new RangeError(
          "A requested original is unavailable. Re-select it, or export without originals.",
        );
      await validatePdfBlob(doc, blob);
      signal.throwIfAborted();
      add(entry.path, new Uint8Array(await blob.arrayBuffer()));
    }
  signal.throwIfAborted();
  return new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const abort = () => {
      stop?.();
      reject(new DOMException("Export cancelled", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    const stop = zip(
      files,
      { level: 0, mtime: new Date("2026-01-01T00:00:00Z") },
      (error, result) => {
        signal.removeEventListener("abort", abort);
        if (signal.aborted) {
          reject(new DOMException("Export cancelled", "AbortError"));
          return;
        }
        if (error)
          reject(new Error("The archive could not be prepared. Try again without originals."));
        else if (result.byteLength > MAX_EXPORT_BYTES)
          reject(new RangeError("The export exceeds its output bound."));
        else resolve(result);
      },
    );
    if (signal.aborted) abort();
  });
}
