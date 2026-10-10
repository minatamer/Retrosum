import { z } from "zod";
import { revisionSchema } from "./ids.js";
import { dateSchema, minorUnitsSchema } from "./records.js";

export const displayRateMicrosSchema = z.number().int().min(1).max(1_000_000_000);
export const usdEurRateSchema = z.strictObject({
  base: z.literal("USD"),
  quote: z.literal("EUR"),
  source: z.literal("ECB"),
  date: dateSchema,
  rateMicros: displayRateMicrosSchema,
});
export type UsdEurRate = z.infer<typeof usdEurRateSchema>;

export const dashboardMetricSchema = z.enum([
  "income",
  "costs",
  "profit",
  "margin",
  "cash_in",
  "cash_out",
  "cash_net",
  "customer_open",
  "supplier_open",
  "overdue",
  "coverage",
  "tax",
  "customer_soon",
  "supplier_soon",
]);
export const chartMetricSchema = z.enum([
  "income",
  "costs",
  "profit",
  "cash_in",
  "cash_out",
  "cash_net",
]);
export const chartStyleSchema = z.enum(["line", "curve", "bar", "pie"]);
export const chartGroupingSchema = z.enum(["month", "quarter", "category", "counterparty"]);
export const chartSpecSchema = z.strictObject({
  title: z.string().trim().min(1).max(80),
  metric: chartMetricSchema,
  style: chartStyleSchema,
  groupBy: chartGroupingSchema,
  range: z.enum(["scope", "history"]),
  comparison: chartMetricSchema.nullable().default(null),
});
const widgetIdentity = z.string().regex(/^widget_[A-Za-z0-9_-]{1,96}$/u);
export const dashboardWidgetSchema = z.discriminatedUnion("kind", [
  z.strictObject({ id: widgetIdentity, kind: z.literal("kpi"), metric: dashboardMetricSchema }),
  z.strictObject({ id: widgetIdentity, kind: z.literal("chart"), spec: chartSpecSchema }),
  z.strictObject({
    id: widgetIdentity,
    kind: z.literal("target"),
    metric: z.literal("income"),
    amountMinor: minorUnitsSchema.refine((v) => v > 0),
  }),
]);
export const defaultDashboardWidgets = () =>
  dashboardWidgetSchema.array().parse([
    ...["income", "costs", "profit", "margin"].map((metric) => ({
      id: `widget_${metric}`,
      kind: "kpi",
      metric,
    })),
    {
      id: "widget_trend",
      kind: "chart",
      spec: {
        title: "Income and costs",
        metric: "income",
        comparison: "costs",
        style: "curve",
        groupBy: "month",
        range: "history",
      },
    },
    {
      id: "widget_composition",
      kind: "chart",
      spec: {
        title: "Where the money goes",
        metric: "costs",
        style: "pie",
        groupBy: "category",
        range: "scope",
      },
    },
    ...["cash_in", "cash_out", "customer_open", "supplier_open"].map((metric) => ({
      id: `widget_${metric}`,
      kind: "kpi",
      metric,
    })),
  ]);
export const dashboardPreferencesSchema = z
  .strictObject({
    revision: revisionSchema.default(0),
    appliedProposalIds: z.array(z.string().min(1).max(100)).max(40).default([]),
    profileName: z.string().trim().min(1).max(80).default("Your workspace"),
    collapsed: z.boolean().default(false),
    currency: z.enum(["USD", "EUR"]).default("USD"),
    eurRateMicros: displayRateMicrosSchema.nullable().default(null),
    eurRateDate: dateSchema.nullable().default(null),
    widgets: z.array(dashboardWidgetSchema).min(1).max(16).default(defaultDashboardWidgets),
  })
  .superRefine((value, ctx) => {
    if (value.currency === "EUR" && value.eurRateMicros === null)
      ctx.addIssue({ code: "custom", message: "Load the USD to EUR exchange rate first." });
    if (new Set(value.widgets.map((w) => w.id)).size !== value.widgets.length)
      ctx.addIssue({ code: "custom", message: "Dashboard widget identities must be unique." });
  });
export const demoExperienceSchema = z.strictObject({
  sampleContactEmailsInitialized: z.boolean().default(false),
  dashboardTourSeen: z.boolean().default(false),
  stage: z.enum(["choose", "documents", "processing", "dashboard"]).default("choose"),
  entry: z.enum(["sample", "upload"]).default("sample"),
  view: z.enum(["overview", "documents", "records"]).default("overview"),
  selectedDocumentIds: z.array(z.string().min(1).max(100)).max(10).default([]),
});
export const dashboardRequestSchema = z.strictObject({
  kind: z.literal("dashboard_request"),
  action: z.enum(["chart", "kpi", "remove", "restyle", "move"]),
  position: z.enum(["first", "last"]).nullable().default(null),
  metric: dashboardMetricSchema,
  title: z.string().trim().min(1).max(80),
  groupBy: chartGroupingSchema,
  style: chartStyleSchema.nullable(),
  target: z.string().trim().max(80).nullable(),
});
export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type ChartSpec = z.infer<typeof chartSpecSchema>;
export type ChartStyle = z.infer<typeof chartStyleSchema>;
export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>;
export type DashboardPreferences = z.infer<typeof dashboardPreferencesSchema>;
export type DemoExperience = z.infer<typeof demoExperienceSchema>;
export type DashboardRequest = z.infer<typeof dashboardRequestSchema>;
