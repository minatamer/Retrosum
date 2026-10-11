import { describe, expect, it, vi } from "vitest";
import { documentSchema, workspaceIdSchema, type ExtractionRequest } from "@retrosum/contracts";
import { extractOriginal } from "./recognition-client";

const input: ExtractionRequest = {
  operationId: "transport_test",
  workspaceId: workspaceIdSchema.parse("workspace_transport"),
  revision: 2,
  retry: false,
  business: { name: "Test business", currency: "USD", ownedAccountReferences: [] },
  asOf: "2026-10-10",
  document: documentSchema.parse({
    id: "document_transport",
    name: "original.pdf",
    mime: "application/pdf",
    sha256: "a".repeat(64),
    byteLength: 8,
    pageCount: 1,
    kind: "invoice",
    state: "reading",
    provenance: "visitor_upload",
  }),
  envelope: { files: 1, pages: 1, bytes: 8 },
};
describe("recognition transport dispatch", () => {
  it.each(["constructor", "toString", "__proto__", "private_internal_detail"])(
    "uses safe product copy for the unrecognized error code %s",
    async (code) => {
      vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: code }, { status: 503 }));
      await expect(
        extractOriginal(input, new Blob(["original"]), new AbortController().signal),
      ).rejects.toThrow(
        "This PDF could not be processed safely. Its original is preserved; no automatic retry will run.",
      );
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
  it("preparation or prior cancellation cannot mark an original submitted", async () => {
    const submitting = vi.fn();
    const abort = new AbortController();
    abort.abort();
    await expect(
      extractOriginal(input, new Blob(["original"]), abort.signal, "grant", submitting),
    ).rejects.toThrow();
    expect(submitting).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    vi.spyOn(AbortSignal, "timeout").mockImplementationOnce(() => {
      throw new TypeError("Cannot prepare deadline");
    });
    await expect(
      extractOriginal(
        input,
        new Blob(["original"]),
        new AbortController().signal,
        "grant",
        submitting,
      ),
    ).rejects.toThrow("Cannot prepare deadline");
    expect(submitting).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("marks exactly once before dispatch and preserves unknown network outcomes as attempted", async () => {
    const submitting = vi.fn();
    vi.mocked(fetch).mockImplementationOnce(async (_url, options) => {
      expect(submitting).toHaveBeenCalledTimes(1);
      expect(options?.headers).toEqual({ "X-Retrosum-Grant": "grant" });
      throw new Error("Unknown network outcome");
    });
    await expect(
      extractOriginal(
        input,
        new Blob(["original"]),
        new AbortController().signal,
        "grant",
        submitting,
      ),
    ).rejects.toThrow("Unknown network outcome");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(submitting).toHaveBeenCalledTimes(1);
  });
});
