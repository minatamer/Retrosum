import { z } from "zod";
import { workspaceIdSchema } from "./ids.js";
export const PROCESSING_DISCLOSURE_VERSION = "retrosum-processing-v1";
export const MAX_CONCURRENT_OPERATIONS = 4;
export const PAID_ATTEMPTS_PER_MINUTE = 6;
export const EXTRACTION_BATCH_APPROVAL_MS = 600_000;
export const paidActionSchema = z.enum(["extract", "chat", "insights"]);
export const inputHashSchema = z.string().regex(/^[a-f0-9]{64}$/u);
export const admissionSessionSchema = z.strictObject({
  workspaceId: workspaceIdSchema,
  disclosureVersion: z.literal(PROCESSING_DISCLOSURE_VERSION),
  consent: z.literal(true),
});
export const grantRequestSchema = z
  .strictObject({
    ...admissionSessionSchema.shape,
    action: paidActionSchema,
    operationId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/u),
    inputHash: inputHashSchema,
    documentHash: inputHashSchema.optional(),
    retry: z.boolean().default(false),
    challengeToken: z.string().min(1).max(2048),
  })
  .superRefine((v, ctx) => {
    if (v.action === "extract" ? !v.documentHash : v.documentHash || v.retry)
      ctx.addIssue({ code: "custom", message: "Invalid action identity." });
  });
export const extractionOperationSchema = z.strictObject({
  operationId: grantRequestSchema.shape.operationId,
  inputHash: inputHashSchema,
  documentHash: inputHashSchema,
  retry: z.boolean(),
});
export const extractionBatchRequestSchema = z
  .strictObject({
    ...admissionSessionSchema.shape,
    action: z.literal("extract"),
    operationId: grantRequestSchema.shape.operationId,
    inputHash: inputHashSchema,
    retry: z.literal(false),
    challengeToken: grantRequestSchema.shape.challengeToken,
    operations: z.array(extractionOperationSchema).min(1).max(10),
  })
  .superRefine((value, ctx) => {
    if (
      new Set(value.operations.map((op) => op.operationId)).size !== value.operations.length ||
      new Set(value.operations.map((op) => op.documentHash)).size !== value.operations.length ||
      value.operations.filter((op) => op.retry).length > 1
    )
      ctx.addIssue({ code: "custom", message: "Invalid batch identities." });
  });
export const batchGrantRequestSchema = z.strictObject({
  ...admissionSessionSchema.shape,
  ...extractionOperationSchema.shape,
  action: z.literal("extract"),
  batchGrant: z.string().min(1).max(2048),
});
export const admissionGrantRequestSchema = z.union([grantRequestSchema, batchGrantRequestSchema]);
export const grantResultSchema = z.strictObject({
  grant: z.string().min(1).max(2048),
  expiresAt: z.number().int().positive(),
  disclosureVersion: z.literal(PROCESSING_DISCLOSURE_VERSION),
});
export const admissionSessionResultSchema = z.strictObject({
  expiresAt: z.number().int().positive(),
  disclosureVersion: z.literal(PROCESSING_DISCLOSURE_VERSION),
});
export type PaidAction = z.infer<typeof paidActionSchema>;
export type GrantRequest = z.infer<typeof grantRequestSchema>;
export type ExtractionOperation = z.infer<typeof extractionOperationSchema>;
export type ExtractionBatchRequest = z.infer<typeof extractionBatchRequestSchema>;
export type BatchGrantRequest = z.infer<typeof batchGrantRequestSchema>;
