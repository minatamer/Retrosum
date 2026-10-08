import { documentSchema, MAX_TOTAL_BYTES, type SourceDocument } from "@retrosum/contracts";

type CachedPdf = {
  key: string;
  workspaceId: string;
  documentId: string;
  sha256: string;
  expiresAt: number;
  blob: Blob;
};
const DATABASE = "retrosum-temporary-pdfs-v1";
const STORE = "pdfs";
const DEADLINE_MS = 5000;
function key(workspaceId: string, doc: SourceDocument) {
  return `${workspaceId}/${doc.id}/${doc.sha256}`;
}
export async function validatePdfBlob(input: SourceDocument, blob: Blob) {
  const doc = documentSchema.parse(input);
  if (blob.size !== doc.byteLength || blob.type !== "application/pdf")
    throw new RangeError("PDF bytes do not match their admitted metadata.");
  const data = await blob.arrayBuffer();
  if (new TextDecoder().decode(data.slice(0, 5)) !== "%PDF-")
    throw new RangeError("This file is not a PDF.");
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  if (hash !== doc.sha256) throw new RangeError("PDF fingerprint does not match the original.");
}
function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE, 1);
    let settled = false;
    const timer = window.setTimeout(() => {
      settled = true;
      reject(new Error("Temporary PDF storage is unavailable."));
    }, DEADLINE_MS);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE, { keyPath: "key" });
    };
    request.onerror = () => {
      settled = true;
      window.clearTimeout(timer);
      reject(new Error("Temporary PDF storage is unavailable."));
    };
    request.onblocked = () => {
      settled = true;
      window.clearTimeout(timer);
      reject(new Error("Another tab is blocking temporary PDF storage."));
    };
    request.onsuccess = () => {
      window.clearTimeout(timer);
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}
async function transact<T>(
  factory: IDBFactory,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, finish: (value: T) => void, fail: (error: Error) => void) => void,
): Promise<T> {
  const db = await openDatabase(factory);
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      let value: T;
      const timer = window.setTimeout(() => {
        tx.abort();
        reject(new Error("Temporary PDF storage timed out."));
      }, DEADLINE_MS);
      tx.oncomplete = () => {
        window.clearTimeout(timer);
        resolve(value);
      };
      tx.onabort = tx.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("Temporary PDF storage could not complete this change."));
      };
      run(
        tx.objectStore(STORE),
        (result) => {
          value = result;
        },
        (error) => {
          tx.abort();
          reject(error);
        },
      );
    });
  } finally {
    db.close();
  }
}
export class PdfBlobCache {
  constructor(private readonly factory: IDBFactory) {}
  async put(workspaceId: string, document: SourceDocument, blob: Blob, expiresAt: number) {
    await validatePdfBlob(document, blob);
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())
      throw new RangeError("The PDF session has expired.");
    const record: CachedPdf = {
      key: key(workspaceId, document),
      workspaceId,
      documentId: document.id,
      sha256: document.sha256,
      expiresAt,
      blob,
    };
    await transact<void>(this.factory, "readwrite", (store, finish, fail) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const records = request.result as CachedPdf[];
        for (const old of records) if (old.expiresAt <= Date.now()) store.delete(old.key);
        const bytes = records
          .filter(
            (old) =>
              old.expiresAt > Date.now() &&
              old.workspaceId === workspaceId &&
              old.key !== record.key,
          )
          .reduce((sum, old) => sum + old.blob.size, blob.size);
        if (bytes > MAX_TOTAL_BYTES) {
          fail(new RangeError("This session exceeds its 20 MiB PDF limit."));
          return;
        }
        // A single tab cannot accumulate many unexpired cache identities.
        const total = records
          .filter((old) => old.expiresAt > Date.now() && old.key !== record.key)
          .reduce((sum, old) => sum + old.blob.size, blob.size);
        if (total > MAX_TOTAL_BYTES * 4) {
          fail(
            new RangeError("Temporary PDF storage is full. Close or clear other demo sessions."),
          );
          return;
        }
        store.put(record);
        finish(undefined);
      };
    });
  }
  async get(workspaceId: string, document: SourceDocument): Promise<Blob | null> {
    const record = await transact<CachedPdf | undefined>(
      this.factory,
      "readonly",
      (store, finish) => {
        const request = store.get(key(workspaceId, document));
        request.onsuccess = () => finish(request.result as CachedPdf | undefined);
      },
    );
    if (!record || record.expiresAt <= Date.now()) return null;
    await validatePdfBlob(document, record.blob);
    return record.blob;
  }
  async removeWorkspace(workspaceId: string) {
    await transact<void>(this.factory, "readwrite", (store, finish) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          finish(undefined);
          return;
        }
        const record = cursor.value as CachedPdf;
        if (record.workspaceId === workspaceId) cursor.delete();
        cursor.continue();
      };
    });
  }
  async sweepExpired(now: number) {
    await transact<void>(this.factory, "readwrite", (store, finish) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          finish(undefined);
          return;
        }
        if ((cursor.value as CachedPdf).expiresAt <= now) cursor.delete();
        cursor.continue();
      };
    });
  }
}
