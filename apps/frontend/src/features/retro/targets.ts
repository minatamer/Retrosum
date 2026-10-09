import type { RetroTarget } from "@retrosum/contracts";
import type { WorkspaceView } from "../workspace/navigation";
export type GuidanceTarget = RetroTarget | "trend" | "customize";
export const TARGETS: Record<
  GuidanceTarget,
  { id: string; companions?: string[]; view: WorkspaceView | null; title: string; text: string }
> = {
  overview: {
    id: "retro-overview",
    view: "overview",
    title: "Meet your dashboard",
    text: "Your paperwork has a clearer picture now. Let’s explore the cards, charts and ways to make this dashboard yours. You can finish the tour at any time.",
  },
  period: {
    id: "retro-period",
    view: "overview",
    title: "A clear scope",
    text: "Choose the period, balance date, category or customer. The nearby document count opens anything that needs review before it contributes to your figures.",
  },
  income: {
    id: "metric-income",
    view: "overview",
    title: "Work recorded",
    text: "Income measures supplied invoiced work. Open this card to see exactly which records contribute.",
  },
  costs: {
    id: "metric-costs",
    view: "overview",
    title: "Costs with evidence",
    text: "Costs use explicit net figures where available. Held and duplicate evidence stays excluded.",
  },
  profit: {
    id: "metric-profit",
    view: "overview",
    title: "The profit preview",
    text: "Income less documented costs. This is a supplied-record preview, with scope and coverage disclosed.",
  },
  margin: {
    id: "metric-margin",
    view: "overview",
    title: "The margin",
    text: "Profit relative to positive income. Without that denominator the card stays unavailable.",
  },
  composition: {
    id: "retro-composition",
    view: "overview",
    title: "Follow the cost",
    text: "Hover or focus a category, then tap its mark or name for the exact contributors. View data table gives the same figures.",
  },
  trend: {
    id: "retro-trend",
    view: "overview",
    title: "See the direction",
    text: "Mint tracks invoiced income; orange tracks documented costs. Hover, focus or tap a point for its exact amount and original records. View data & sources gives the same figures in a table.",
  },
  customize: {
    id: "retro-customize",
    view: "overview",
    title: "Make room for what matters",
    text: "Customize dashboard lets you add KPIs and targets, arrange cards or restore the starting layout. Retro can also build a new chart from a request such as “Show my quarterly income.”",
  },
  cash: {
    id: "metric-cash_in",
    companions: ["metric-cash_out"],
    view: "overview",
    title: "Work and money movement",
    text: "Recorded cash in and out follow actual payment dates. They describe money movements found in your documents, so they can differ from invoiced income and costs.",
  },
  open: {
    id: "metric-customer_open",
    companions: ["metric-supplier_open"],
    view: "overview",
    title: "Known open items",
    text: "These cards show known amounts customers still owe you and amounts owed to suppliers, as of the selected balance date. Open a card to follow its records and settlement evidence.",
  },
  coverage: {
    id: "retro-coverage",
    view: "overview",
    title: "Know the coverage",
    text: "See usable sources, review holds, failures and duplicates before interpreting the figures.",
  },
  documents: {
    id: "retro-documents",
    view: "documents",
    title: "The original paper trail",
    text: "Browse the visible PDFs and original pages. Processing the sample creates these records; no hidden ledger supplies the dashboard.",
  },
  records: {
    id: "retro-records",
    view: "records",
    title: "Your session records",
    text: "Create, edit or remove invoices, costs, payments and contacts. Confirmed local changes recalculate the dashboard and offer latest Undo.",
  },
  composer: {
    id: "retro-composer",
    view: null,
    title: "Your copilot, Retro",
    text: "Use this pill to ask questions, follow sources, build charts or add KPIs. Try “Show my quarterly income” or “Create an invoice.” The up arrow opens chat and shortcuts; changes come with a review step and Undo.",
  },
};
export const TOUR: GuidanceTarget[] = [
  "overview",
  "income",
  "costs",
  "profit",
  "margin",
  "trend",
  "composition",
  "cash",
  "open",
  "period",
  "customize",
  "composer",
];
export function locateTarget(target: GuidanceTarget) {
  const node = document.getElementById(TARGETS[target].id);
  return node?.isConnected && !node.closest("[hidden]") ? node : null;
}
