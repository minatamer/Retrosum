import { z } from "zod";
import { dateSchema } from "./records.js";
import { dashboardPreferencesSchema } from "./dashboard.js";

const query = z.string().trim().min(1).max(160).nullable();
export const retroWorkspaceIntentSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("navigate"),
    view: z.enum(["overview", "documents", "records"]),
  }),
  z.strictObject({
    action: z.literal("filter"),
    from: dateSchema.nullable(),
    to: dateSchema.nullable(),
    asOf: dateSchema.nullable(),
    category: query,
    counterparty: query,
    clear: z.boolean(),
  }),
  z.strictObject({
    action: z.literal("source"),
    query,
    page: z.number().int().min(1).max(20).nullable(),
  }),
  z.strictObject({ action: z.literal("review"), query }),
  z.strictObject({
    action: z.literal("records"),
    family: z.enum(["invoices", "costs", "payments", "contacts"]).nullable(),
  }),
  z.strictObject({
    action: z.literal("panel"),
    // Export is retained only for decoding prior session messages; the UI offers no export action.
    panel: z.enum(["settings", "export", "reset", "intake"]),
    currency: z.enum(["USD", "EUR"]).nullable(),
  }),
  z.strictObject({ action: z.literal("sidebar"), collapsed: z.boolean() }),
  z.strictObject({ action: z.literal("undo"), which: z.enum(["financial", "layout"]).nullable() }),
  z.strictObject({ action: z.literal("target"), amount: z.string().trim().max(40).nullable() }),
  z.strictObject({ action: z.literal("restore_layout") }),
  z.strictObject({ action: z.literal("clear_conversation") }),
  z.strictObject({ action: z.literal("help") }),
]);
export const retroWorkspaceRequestSchema = z.strictObject({
  kind: z.literal("workspace_request"),
  intent: retroWorkspaceIntentSchema,
});
// Supplied by the browser; never provider authority or backend persistence.
export const retroUiContextSchema = z.strictObject({ dashboard: dashboardPreferencesSchema });
export type RetroWorkspaceIntent = z.infer<typeof retroWorkspaceIntentSchema>;
export type RetroWorkspaceRequest = z.infer<typeof retroWorkspaceRequestSchema>;
