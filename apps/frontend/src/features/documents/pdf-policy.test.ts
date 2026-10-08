import { describe, expect, it, vi } from "vitest";
import { sampleAssets, resolveSourceTarget } from "./sample-assets";
import { loadSampleBytes, MAX_CANVAS_PIXELS, renderDimensions } from "./pdf-policy";
import { sampleManifestSchema } from "@retrosum/contracts";
import manifest from "./sample-manifest.json";

describe("visible source manifest and target", () => {
  it("rejects external paths, duplicate IDs, excess total pages and absent renditions", () => {
    const mutate = (edit: (value: typeof manifest) => void) => {
      const candidate = structuredClone(manifest);
      edit(candidate);
      expect(sampleManifestSchema.safeParse(candidate).success).toBe(false);
    };
    mutate((value) => {
      value.documents[0]!.pdfPath = "https://other.example/doc.pdf";
    });
    mutate((value) => {
      value.documents[1]!.id = value.documents[0]!.id;
    });
    mutate((value) => {
      value.documents[0]!.pageCount = 20;
    });
    mutate((value) => {
      value.documents[5]!.duplicateOf = "document_missing";
    });
  });
  it("resolves the actual cited page/row and rejects unavailable pages", () => {
    const asset = sampleAssets[6]!;
    expect(
      resolveSourceTarget(sampleAssets, { documentId: asset.id, page: 2, rowId: "P-904" }).target
        .rowId,
    ).toBe("P-904");
    expect(() => resolveSourceTarget(sampleAssets, { documentId: asset.id, page: 3 })).toThrow();
  });
});
describe("bounded rendering", () => {
  it("caps device pixels for phone, wide, high-DPI and tall pages", () => {
    for (const [w, h, available, zoom, dpr] of [
      [612, 792, 280, 1, 3],
      [612, 792, 1920, 2, 4],
      [500, 9000, 1440, 2, 2],
    ]) {
      const result = renderDimensions(w!, h!, available!, zoom!, dpr!);
      expect(result.pixelWidth * result.pixelHeight).toBeLessThanOrEqual(MAX_CANVAS_PIXELS);
      expect(result.cssHeight).toBeLessThanOrEqual(8192);
    }
    expect(() => renderDimensions(Infinity, 100, 300, 1, 1)).toThrow();
    expect(() => renderDimensions(100, 10001, 300, 1, 1)).toThrow();
  });
});
describe("safe original loading", () => {
  const original = sampleAssets[0]!;
  it("rejects changed or truncated bytes", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("%PDF-x", { headers: { "content-type": "application/pdf" } }),
    );
    await expect(loadSampleBytes(original, new AbortController().signal)).rejects.toThrow(
      "incomplete",
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("%PDF-x", { headers: { "content-type": "application/pdf" } }),
    );
    await expect(
      loadSampleBytes({ ...original, byteLength: 6 }, new AbortController().signal),
    ).rejects.toThrow("changed");
  });
  it("rejects non-PDF MIME, excessive bytes and external sources before dispatch", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("no pdf", { headers: { "content-type": "text/html" } }),
    );
    await expect(loadSampleBytes(original, new AbortController().signal)).rejects.toThrow(
      "could not be loaded",
    );
    vi.mocked(fetch).mockResolvedValue(
      new Response("too large", { headers: { "content-type": "application/pdf" } }),
    );
    await expect(
      loadSampleBytes({ ...original, byteLength: 1 }, new AbortController().signal),
    ).rejects.toThrow("declared size");
    vi.mocked(fetch).mockClear();
    await expect(
      loadSampleBytes(
        { ...original, pdfPath: "https://other.example/x.pdf" },
        new AbortController().signal,
      ),
    ).rejects.toThrow("unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
});
