import { z } from "zod";
import { documentIdSchema } from "./ids.js";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
export const sourceReferenceSchema = z.strictObject({
  documentId: documentIdSchema,
  page: z.number().int().min(1).max(20),
  rowId: z.string().min(1).max(80).optional(),
  blockId: z.string().min(1).max(80).optional(),
  excerpt: z.string().max(300).optional(),
});
export const documentSchema = z.strictObject({
  id: documentIdSchema,
  name: z
    .string()
    .min(1)
    .max(160)
    .refine((name) =>
      [...name].every(
        (character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127,
      ),
    ),
  mime: z.literal("application/pdf"),
  sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  byteLength: z.number().int().positive().max(MAX_FILE_BYTES),
  pageCount: z.number().int().min(1).max(20),
  kind: z.enum(["invoice", "bill", "receipt", "payment_register", "history", "unknown"]),
  state: z.enum([
    "selected",
    "inspecting",
    "queued",
    "reading",
    "validating",
    "ready",
    "needs_review",
    "error",
    "cancelled",
  ]),
  provenance: z.enum([
    "synthetic",
    "synthetic_handwriting",
    "authentic_reusable",
    "visitor_upload",
  ]),
});
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type SourceDocument = z.infer<typeof documentSchema>;

const publicPdfPath = z.string().regex(/^\/samples\/harbor-v1\/[A-Za-z0-9_-]+\.pdf$/u);
const publicThumbnailPath = z.string().regex(/^\/samples\/harbor-v1\/D0[1-8]\.webp$/u);
export const sampleAssetSchema = documentSchema.extend({
  label: z.string().regex(/^D0[1-8]$/u),
  title: z.string().min(1).max(100),
  layoutFamily: z.string().min(1).max(80),
  pdfPath: publicPdfPath,
  thumbnailPath: publicThumbnailPath,
  duplicateOf: documentIdSchema.optional(),
});
export const sampleManifestSchema = z
  .strictObject({
    fixtureVersion: z.literal("harbor-v1"),
    business: z.literal("Harbor Studio"),
    currency: z.literal("USD"),
    period: z.literal("2026-09"),
    asOf: z.literal("2026-10-03"),
    documents: z.array(sampleAssetSchema).length(8),
  })
  .superRefine((manifest, ctx) => {
    const documents = manifest.documents;
    const ids = new Set(documents.map((item) => item.id));
    const paths = new Set(documents.map((item) => item.pdfPath));
    const labels = new Set(documents.map((item) => item.label));
    if (
      ids.size !== documents.length ||
      paths.size !== documents.length ||
      labels.size !== documents.length
    )
      ctx.addIssue({ code: "custom", message: "Sample identities and paths must be unique." });
    if (
      documents.reduce((sum, item) => sum + item.pageCount, 0) > 20 ||
      documents.reduce((sum, item) => sum + item.byteLength, 0) > MAX_TOTAL_BYTES
    )
      ctx.addIssue({ code: "custom", message: "Sample exceeds the combined admission envelope." });
    for (const item of documents) {
      if (item.duplicateOf && (item.duplicateOf === item.id || !ids.has(item.duplicateOf)))
        ctx.addIssue({
          code: "custom",
          message: "Duplicate must refer to another visible source.",
        });
    }
  });
export type SampleAsset = z.infer<typeof sampleAssetSchema>;
