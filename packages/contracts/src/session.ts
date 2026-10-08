import { z } from "zod";
import { commandIdSchema, revisionSchema, workspaceIdSchema } from "./ids.js";
import { undoReceiptSchema, workspaceSchema } from "./commands.js";
import { dateSchema } from "./records.js";

export const SESSION_LIFETIME_MS = 2 * 60 * 60 * 1000;
export const MAX_PROJECTION_BYTES = 2 * 1024 * 1024;
export const sessionFilterSchema = z.strictObject({
  from: dateSchema,
  to: dateSchema,
  register: z.enum(["invoices", "costs", "payments", "contacts"]).default("invoices"),
});
export const finalizedMessageSchema = z.strictObject({
  id: z.string().min(1).max(100),
  role: z.enum(["user", "retro"]),
  text: z.string().max(2000),
  revision: revisionSchema,
});
export const sessionSchema = z.strictObject({
  workspace: workspaceSchema,
  appliedCommandIds: z.array(commandIdSchema).max(500),
  undo: undoReceiptSchema.nullable(),
  filters: sessionFilterSchema,
  messages: z.array(finalizedMessageSchema).max(40),
});
export const operationTokenSchema = z.strictObject({
  workspaceId: workspaceIdSchema,
  generation: z.number().int().safe().nonnegative(),
  operationId: z.string().min(1).max(100),
  inputRevision: revisionSchema,
});
export type MoneySession = z.infer<typeof sessionSchema>;
export type SessionFilter = z.infer<typeof sessionFilterSchema>;
export type FinalizedMessage = z.infer<typeof finalizedMessageSchema>;
export type OperationToken = z.infer<typeof operationTokenSchema>;
