import { z } from "zod";
import { workspaceSchema } from "./commands.js";
import { revisionSchema, workspaceIdSchema } from "./ids.js";
import { sessionFilterSchema } from "./filters.js";
import { sourceReferenceSchema } from "./source.js";
import { retroChangeIntentSchema, retroChangePreparationSchema } from "./retro-change.js";
import { dashboardRequestSchema, widgetIdentitySchema } from "./dashboard.js";
import { retroWorkspaceRequestSchema, retroUiContextSchema } from "./retro-workspace.js";

export const RETRO_LIMITS = Object.freeze({
  turns: 8,
  requests: 3,
  tools: 4,
  deadlineMs: 60_000,
  inputCharacters: 24_000,
  bodyBytes: 2 * 1024 * 1024,
});
export const retroTargetSchema = z.enum([
  "overview",
  "period",
  "income",
  "costs",
  "profit",
  "margin",
  "composition",
  "cash",
  "open",
  "coverage",
  "documents",
  "records",
  "composer",
]);
export const retroTopicSchema = z.enum([
  "summary",
  "income",
  "costs",
  "profit",
  "margin",
  "cash",
  "open",
  "rent",
  "largest_cost",
  "customer",
  "vendor",
  "comparison",
  "coverage",
  "due_soon",
  "tax",
  "categories",
  "customers",
  "vendors",
]);
export const retroDecisionSchema = z.discriminatedUnion("kind", [
  dashboardRequestSchema,
  retroWorkspaceRequestSchema,
  z.strictObject({
    kind: z.literal("conversation"),
    topic: z.enum(["greeting", "thanks", "widgets", "sources", "scope", "privacy"]),
  }),
  z.strictObject({ kind: z.literal("change_request"), intent: retroChangeIntentSchema }),
  z.strictObject({
    kind: z.literal("explanation"),
    topic: retroTopicSchema,
    factIds: z.array(z.string().min(1).max(160)).min(1).max(12),
    target: retroTargetSchema.nullable(),
  }),
  z.strictObject({
    kind: z.literal("clarification"),
    reason: z.enum(["topic", "record", "period"]),
    choices: z.array(retroTopicSchema).min(1).max(4),
  }),
  z.strictObject({ kind: z.literal("tour"), tourId: z.literal("workspace_intro") }),
  z.strictObject({
    kind: z.literal("limited_result"),
    reason: z.enum([
      "unsupported",
      "off_topic",
      "advice",
      "external_action",
      "injection",
      "unknown_history",
      "tool_limit",
      "failed",
      "refusal",
      "crud_next",
    ]),
  }),
]);
export const retroScopeSchema = sessionFilterSchema.omit({ register: true });
export const retroResponseSchema = z.strictObject({
  schemaVersion: z.literal(1),
  adapterVersion: z.literal("retro-grounded-v1"),
  workspaceId: workspaceIdSchema,
  revision: revisionSchema,
  scope: retroScopeSchema,
  mode: z.enum(["fake", "live", "local"]),
  uiRevision: revisionSchema.optional(),
  decision: retroDecisionSchema,
  sources: z.array(sourceReferenceSchema).max(100),
  steps: z
    .array(z.strictObject({ tool: z.string().max(40), count: z.number().int().min(0).max(50) }))
    .max(4),
  change: retroChangePreparationSchema.optional(),
});
export const retroRequestSchema = z
  .strictObject({
    operationId: z.string().regex(/^retro_[A-Za-z0-9_-]{1,96}$/u),
    workspace: workspaceSchema,
    scope: retroScopeSchema,
    prompt: z.string().trim().min(1).max(1000),
    changeContext: retroChangeIntentSchema.optional(),
    uiContext: retroUiContextSchema.optional(),
    followUp: z
      .strictObject({
        widgetId: widgetIdentitySchema.nullable(),
        topic: retroTopicSchema.nullable(),
      })
      .optional(),
    recent: z
      .array(z.strictObject({ role: z.enum(["user", "retro"]), text: z.string().max(2000) }))
      .max(8),
  })
  .superRefine((input, ctx) => {
    if (input.recent.reduce((sum, item) => sum + item.text.length, 0) > 8000)
      ctx.addIssue({ code: "custom", message: "Recent conversation exceeds its bound." });
    if (input.scope.from > input.scope.to)
      ctx.addIssue({ code: "custom", message: "Reversed period." });
  });
export const retroToolSchema = z.discriminatedUnion("name", [
  z.strictObject({ name: z.literal("prepare_session_change"), args: retroChangeIntentSchema }),
  z.strictObject({ name: z.literal("get_summary"), args: z.strictObject({}) }),
  z.strictObject({ name: z.literal("compare_periods"), args: z.strictObject({}) }),
  z.strictObject({
    name: z.literal("get_metric_evidence"),
    args: z.strictObject({
      factId: z.string().min(1).max(160),
      offset: z.number().int().min(0).max(1000),
    }),
  }),
  z.strictObject({
    name: z.literal("list_events"),
    args: z.strictObject({ offset: z.number().int().min(0).max(1000) }),
  }),
  z.strictObject({ name: z.literal("list_review_issues"), args: z.strictObject({}) }),
  z.strictObject({ name: z.literal("get_ui_context"), args: z.strictObject({}) }),
  z.strictObject({
    name: z.literal("list_documents"),
    args: z.strictObject({
      query: z.string().max(160),
      offset: z.number().int().min(0).max(1000),
    }),
  }),
  z.strictObject({
    name: z.literal("list_contacts"),
    args: z.strictObject({ query: z.string().max(80) }),
  }),
  z.strictObject({
    name: z.literal("get_record"),
    args: z.strictObject({ id: z.string().min(1).max(100) }),
  }),
  z.strictObject({
    name: z.literal("get_document_excerpt"),
    args: z.strictObject({
      documentId: z.string().min(1).max(100),
      page: z.number().int().min(1).max(20),
    }),
  }),
  z.strictObject({
    name: z.literal("start_tour"),
    args: z.strictObject({ tourId: z.literal("workspace_intro") }),
  }),
  z.strictObject({
    name: z.literal("navigate_workspace"),
    args: z.strictObject({ target: retroTargetSchema }),
  }),
]);
export type RetroDecision = z.infer<typeof retroDecisionSchema>;
export type RetroResponse = z.infer<typeof retroResponseSchema>;
export type RetroRequest = z.infer<typeof retroRequestSchema>;
export type RetroScope = z.infer<typeof retroScopeSchema>;
export type RetroTarget = z.infer<typeof retroTargetSchema>;
export type RetroTopic = z.infer<typeof retroTopicSchema>;
export type RetroTool = z.infer<typeof retroToolSchema>;
