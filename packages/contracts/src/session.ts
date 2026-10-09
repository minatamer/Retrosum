import { z } from "zod";
import { commandIdSchema, revisionSchema, workspaceIdSchema } from "./ids.js";
import { undoReceiptSchema, workspaceSchema } from "./commands.js";
import { sessionFilterSchema } from "./filters.js";
import { retroResponseSchema } from "./retro.js";
import { retroChangeResultSchema } from "./retro-change.js";
import { dashboardPreferencesSchema, demoExperienceSchema } from "./dashboard.js";
export { sessionFilterSchema } from "./filters.js";

export const SESSION_LIFETIME_MS = 2 * 60 * 60 * 1000;
export const MAX_PROJECTION_BYTES = 2 * 1024 * 1024;
export const finalizedMessageSchema = z.strictObject({
  id: z.string().min(1).max(100),
  role: z.enum(["user", "retro"]),
  text: z.string().max(2000),
  revision: revisionSchema,
  response: retroResponseSchema.optional(),
  changeResult: retroChangeResultSchema.optional(),
});
export const sessionSchema = z.strictObject({
  workspace: workspaceSchema,
  appliedCommandIds: z.array(commandIdSchema).max(500),
  undo: undoReceiptSchema.nullable(),
  filters: sessionFilterSchema,
  messages: z.array(finalizedMessageSchema).max(40),
  experience: demoExperienceSchema.default(() => demoExperienceSchema.parse({})),
  dashboard: dashboardPreferencesSchema.default(() => dashboardPreferencesSchema.parse({})),
  dashboardUndo: dashboardPreferencesSchema.nullable().default(null),
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
