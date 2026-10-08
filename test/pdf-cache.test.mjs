import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { PdfBlobCache } from "../apps/frontend/src/features/session/blob-cache.ts";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";

async function pdf(index, bytes = 32) {
  const data = new Uint8Array(bytes);
  data.set(new TextEncoder().encode("%PDF-1.7"));
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return {
    doc: {
      ...harborSession().workspace.documents[0],
      id: `document_cache${index}`,
      byteLength: bytes,
      sha256: hash,
    },
    blob: new Blob([data], { type: "application/pdf" }),
  };
}
beforeEach(() => vi.stubGlobal("window", { setTimeout, clearTimeout }));
afterEach(() => vi.unstubAllGlobals());
describe("temporary PDF transactions", () => {
  it("retains actual original bytes, isolates workspace keys and deletes only the owned session", async () => {
    const cache = new PdfBlobCache(new IDBFactory());
    const { doc, blob } = await pdf(1);
    const expiry = Date.now() + 100000;
    await cache.put("workspace_one", doc, blob, expiry);
    await cache.put("workspace_two", doc, blob, expiry);
    expect(await (await cache.get("workspace_one", doc)).arrayBuffer()).toEqual(
      await blob.arrayBuffer(),
    );
    expect(await cache.get("workspace_missing", doc)).toBeNull();
    await cache.removeWorkspace("workspace_one");
    expect(await cache.get("workspace_one", doc)).toBeNull();
    expect(await cache.get("workspace_two", doc)).not.toBeNull();
    await cache.sweepExpired(expiry + 1);
    expect(await cache.get("workspace_two", doc)).toBeNull();
  });
  it("enforces the combined 20 MiB cap atomically and preserves all previous files", async () => {
    const cache = new PdfBlobCache(new IDBFactory());
    const expiry = Date.now() + 100000;
    const large = await pdf(0, 5 * 1024 * 1024);
    for (let index = 0; index < 4; index++)
      await cache.put(
        "workspace_one",
        { ...large.doc, id: `document_large${index}` },
        large.blob,
        expiry,
      );
    const extra = await pdf(5);
    await expect(cache.put("workspace_one", extra.doc, extra.blob, expiry)).rejects.toThrow(
      /20 MiB/,
    );
    expect(await cache.get("workspace_one", extra.doc)).toBeNull();
    for (let index = 0; index < 4; index++)
      expect(
        await cache.get("workspace_one", { ...large.doc, id: `document_large${index}` }),
      ).not.toBeNull();
    await cache.removeWorkspace("workspace_one");
  });
  it("rejects denied storage, expired writes and corrupted metadata without saving a replacement", async () => {
    const { doc, blob } = await pdf(1);
    const cache = new PdfBlobCache(new IDBFactory());
    await expect(
      new PdfBlobCache({
        open: () => {
          throw new Error("denied");
        },
      }).put("workspace_one", doc, blob, Date.now() + 100000),
    ).rejects.toThrow(/denied/);
    await expect(cache.put("workspace_one", doc, blob, Date.now() - 1)).rejects.toThrow(/expired/);
    await cache.put("workspace_one", doc, blob, Date.now() + 100000);
    await expect(
      cache.put("workspace_one", { ...doc, sha256: "a".repeat(64) }, blob, Date.now() + 100000),
    ).rejects.toThrow(/fingerprint/);
    expect(await cache.get("workspace_one", doc)).not.toBeNull();
  });
});
