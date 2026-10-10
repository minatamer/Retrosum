import { z } from "zod";
import { documentSchema } from "./source.js";
import { workspaceIdSchema, revisionSchema } from "./ids.js";
import { dateSchema, businessIdentitySchema } from "./records.js";

export const RECOGNITION_SCHEMA_VERSION = "recognition-v1";
export const MAX_RECOGNITION_BYTES = 512 * 1024;
// Inspection (20s), exact input preflight (60s), generation (75s), bounded decoding.
export const EXTRACTION_DEADLINE_MS = 170_000;
export const EXTRACTION_TRANSPORT_DEADLINE_MS = 175_000;
const fieldKey = z.string().regex(/^[A-Za-z0-9_-]{1,60}$/u);
export const numericFieldSchema = z.strictObject({
  key: fieldKey,
  page: z.number().int().min(1).max(20),
  block: z.string().min(1).max(80),
  raw: z.string().min(1).max(100),
  occurrences: z.number().int().min(1).max(100),
  normalized: z.string().max(100).nullable(),
  scale: z.string().min(1).max(40),
  treatment: z.string().min(1).max(80),
  ambiguous: z.boolean(),
});
const lineSchema = z.strictObject({
  description: z.string().min(1).max(200),
  quantity: fieldKey,
  unitPrice: fieldKey,
  total: fieldKey,
});
export const interpretationSchema = z.strictObject({
  version: z.literal(RECOGNITION_SCHEMA_VERSION),
  kind: z.enum(["invoice", "bill", "receipt", "payment_register", "history", "unknown"]),
  currency: z.string().max(10),
  business: z.string().max(100),
  asOfField: fieldKey.nullable(),
  fields: z.array(numericFieldSchema).max(500),
  events: z
    .array(
      z.strictObject({
        party: z.string().min(1).max(100),
        businessRole: z.enum(["issuer", "recipient", "unknown"]),
        description: z.string().min(1).max(240),
        category: z.string().max(60),
        dateField: fieldKey,
        dueField: fieldKey.nullable(),
        referenceField: fieldKey,
        grossField: fieldKey,
        netField: fieldKey.nullable(),
        taxField: fieldKey.nullable(),
        balanceState: z.enum(["unknown", "open", "paid"]),
        lines: z.array(lineSchema).max(25),
      }),
    )
    .max(100),
  payments: z
    .array(
      z.strictObject({
        party: z.string().max(100),
        direction: z.enum(["in", "out", "internal_transfer"]),
        dateField: fieldKey,
        referenceField: fieldKey,
        amountField: fieldKey,
        eventReference: z.string().max(80).nullable(),
        fromAccount: z.string().max(80).nullable(),
        toAccount: z.string().max(80).nullable(),
      }),
    )
    .max(100),
  warnings: z.array(z.string().min(1).max(300)).max(20),
});
export const inspectionSchema = z.strictObject({
  pages: z
    .array(
      z.strictObject({
        page: z.number().int().min(1).max(20),
        text: z.string().max(50000),
        raster: z.boolean(),
      }),
    )
    .min(1)
    .max(20),
});
export const extractionRequestSchema = z.strictObject({
  operationId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/u),
  workspaceId: workspaceIdSchema,
  revision: revisionSchema,
  retry: z.boolean(),
  business: businessIdentitySchema,
  asOf: dateSchema,
  document: documentSchema,
  envelope: z.strictObject({
    files: z.number().int().min(1).max(10),
    pages: z.number().int().min(1).max(20),
    bytes: z
      .number()
      .int()
      .min(1)
      .max(20 * 1024 * 1024),
  }),
});
export const extractionResultSchema = z.strictObject({
  mode: z.enum(["fake", "live"]),
  sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  interpretation: interpretationSchema,
  inspection: inspectionSchema,
  usage: z
    .strictObject({
      inputTokens: z.number().int().min(0).max(24000),
      outputTokens: z.number().int().min(0).max(6000),
    })
    .nullable(),
});
export type NumericField = z.infer<typeof numericFieldSchema>;
export type DocumentInterpretation = z.infer<typeof interpretationSchema>;
export type PdfInspection = z.infer<typeof inspectionSchema>;
export type ExtractionRequest = z.infer<typeof extractionRequestSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
