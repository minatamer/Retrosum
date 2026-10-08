import type { RetroTarget } from "@retrosum/contracts";
import type { WorkspaceView } from "../workspace/navigation";
export const TARGETS: Record<
  RetroTarget,
  { id: string; view: WorkspaceView | null; title: string; text: string }
> = {
  overview: {
    id: "overview",
    view: "overview",
    title: "Your financial picture",
    text: "These figures describe the supplied documents and selected scope. Every amount opens its contributors and sources.",
  },
  period: {
    id: "retro-period",
    view: "overview",
    title: "A clear scope",
    text: "Choose period, as-of date, category or counterparty. Event dates, payment dates and known balances retain separate meanings.",
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
  cash: {
    id: "retro-cash",
    view: "overview",
    title: "Work and money movement",
    text: "Payments are dated movements, not a bank balance. A source-paid claim does not invent a payment.",
  },
  open: {
    id: "retro-open",
    view: "overview",
    title: "Known open items",
    text: "Known customer and supplier balances use gross amounts and the as-of date. Unknown settlement remains excluded.",
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
    title: "Keep Retro close",
    text: "Ask for summaries, explanations and sources. Local guidance uses no AI requests. Your last action can be undone here.",
  },
};
export const TOUR: RetroTarget[] = [
  "overview",
  "period",
  "income",
  "composition",
  "cash",
  "documents",
  "records",
  "composer",
];
export function locateTarget(target: RetroTarget) {
  const node = document.getElementById(TARGETS[target].id);
  return node?.isConnected && !node.closest("[hidden]") ? node : null;
}
