import { sampleManifestSchema, sourceReferenceSchema } from "@retrosum/contracts";
import type { SampleAsset, SourceReference } from "@retrosum/contracts";
import manifest from "./sample-manifest.json";

export const sampleManifest = sampleManifestSchema.parse(manifest);
export const sampleAssets = sampleManifest.documents;

export function resolveSourceTarget(assets: readonly SampleAsset[], input: SourceReference) {
  const target = sourceReferenceSchema.parse(input);
  const asset = assets.find((item) => item.id === target.documentId);
  if (!asset || target.page > asset.pageCount) throw new Error("This source page is unavailable.");
  return { asset, target };
}
