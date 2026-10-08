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
