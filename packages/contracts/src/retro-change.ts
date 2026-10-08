import { z } from "zod";
import { commandSchema } from "./commands.js";
import { commandIdSchema, revisionSchema } from "./ids.js";
export const recordFamilySchema = z.enum(["invoices", "costs", "payments", "contacts"]);
export const changeFieldNameSchema = z.enum([
  "name",
  "role",
  "email",
  "contact",
  "number",
  "date",
  "due",
  "description",
  "quantity",
  "price",
  "net",
  "tax",
  "category",
  "balance",
  "reference",
  "notes",
  "direction",
  "allocation",
  "allocated",
  "from",
  "to",
]);
export const changeFieldsSchema = z
  .array(
    z.strictObject({
      name: changeFieldNameSchema,
      value: z.string().max(1000),
    }),
  )
  .max(24)
  .superRefine((fields, ctx) => {
    if (new Set(fields.map((field) => field.name)).size !== fields.length)
      ctx.addIssue({ code: "custom", message: "Duplicate change field." });
  });
export const retroChangeIntentSchema = z.strictObject({
  family: recordFamilySchema,
  operation: z.enum(["create", "update", "delete", "issue"]),
  query: z.string().trim().max(160).nullable(),
  fields: changeFieldsSchema,
});
export const retroChangePreparationSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("clarification"),
    intent: retroChangeIntentSchema,
    missing: z.array(z.string().max(200)).min(1).max(12),
    choices: z
      .array(
        z.strictObject({
          label: z.string().max(160),
          query: z.string().max(160).nullable(),
          fields: changeFieldsSchema,
        }),
      )
      .max(8),
  }),
  z.strictObject({ kind: z.literal("rejected"), reason: z.string().max(300) }),
  z.strictObject({
    kind: z.literal("ready"),
    intent: retroChangeIntentSchema,
    command: commandSchema,
    expiresAt: z.number().int().safe().nonnegative(),
    targetId: z.string().max(120),
    label: z.string().min(1).max(160),
    fields: changeFieldsSchema,
    beforeFields: changeFieldsSchema,
    effects: z
      .array(
        z.strictObject({
          factId: z.string().max(160),
          label: z.string().max(160),
          before: z.number().int().safe().nullable(),
          after: z.number().int().safe().nullable(),
          unit: z.enum(["money", "percent", "count"]),
        }),
      )
      .max(8),
    relationships: z.array(z.string().max(240)).max(20),
  }),
]);
export const retroChangeResultSchema = z.strictObject({
  commandId: commandIdSchema,
  appliedAtRevision: revisionSchema,
  family: recordFamilySchema,
  recordId: z.string().max(120),
  label: z.string().max(160),
});
export type RecordFamily = z.infer<typeof recordFamilySchema>;
export type ChangeFieldName = z.infer<typeof changeFieldNameSchema>;
export type ChangeFields = z.infer<typeof changeFieldsSchema>;
export type RetroChangeIntent = z.infer<typeof retroChangeIntentSchema>;
export type RetroChangePreparation = z.infer<typeof retroChangePreparationSchema>;
export type RetroChangeResult = z.infer<typeof retroChangeResultSchema>;
