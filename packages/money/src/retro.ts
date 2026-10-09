import {
  retroDecisionSchema,
  retroRequestSchema,
  retroResponseSchema,
  retroToolSchema,
  type RetroDecision,
  type RetroRequest,
  type RetroResponse,
  type RetroScope,
  type RetroTopic,
  type RetroTarget,
  type Workspace,
  type RetroChangeIntent,
} from "@retrosum/contracts";
import { buildDashboard, type DashboardCatalogue, type DashboardFact } from "./dashboard.js";
import { validateGraph } from "./graph.js";
import { formatAmount } from "./amount.js";
import { fakeChangeIntent, prepareRetroChange } from "./retro-change.js";
import { dashboardIntent } from "./custom-dashboard.js";
import { fakeWorkspaceIntent, retroDocuments } from "./retro-workspace.js";

export function retroScopeKey(scope: RetroScope) {
  return JSON.stringify([
    scope.from,
    scope.to,
    scope.asOf ?? null,
    scope.category ?? null,
    scope.counterpartyId ?? null,
  ]);
}
const required: Record<RetroTopic, string[]> = {
  summary: ["income", "costs", "profit", "margin", "customer_open", "supplier_open", "coverage"],
  income: ["income"],
  costs: ["costs"],
  profit: ["income", "costs", "profit"],
  margin: ["margin", "income", "profit"],
  cash: ["income", "cash_in", "cash_out", "cash_net"],
  open: ["customer_open", "supplier_open", "overdue"],
  rent: [],
  largest_cost: [],
  customer: [],
  vendor: [],
  comparison: ["income", "prior:income", "costs", "prior:costs", "profit", "prior:profit"],
  coverage: ["coverage"],
  due_soon: ["customer_soon", "supplier_soon"],
  tax: ["tax"],
  categories: [],
  customers: [],
  vendors: [],
};
const targets: Record<RetroTopic, RetroTarget> = {
  summary: "overview",
  income: "income",
  costs: "costs",
  profit: "profit",
  margin: "margin",
  cash: "cash",
  open: "open",
  rent: "composition",
  largest_cost: "composition",
  customer: "income",
  vendor: "costs",
  comparison: "overview",
  coverage: "coverage",
  due_soon: "open",
  tax: "costs",
  categories: "composition",
  customers: "income",
  vendors: "costs",
};
export function topicFacts(topic: RetroTopic, catalogue: DashboardCatalogue): string[] {
  if (topic === "categories") return catalogue.categories.map((mark) => mark.factId);
  if (topic === "customers") return catalogue.customers.map((mark) => mark.factId);
  if (topic === "vendors") return catalogue.vendors.map((mark) => mark.factId);
  if (topic === "rent")
    return catalogue.categories
      .filter((mark) => mark.label.toLowerCase() === "rent")
      .map((mark) => mark.factId);
  if (topic === "largest_cost") return catalogue.categories.slice(0, 1).map((mark) => mark.factId);
  if (topic === "customer") return catalogue.customers.slice(0, 1).map((mark) => mark.factId);
  if (topic === "vendor") return catalogue.vendors.slice(0, 1).map((mark) => mark.factId);
  return required[topic].filter((id) => catalogue.facts[id]);
}
export function explainTopic(topic: RetroTopic, catalogue: DashboardCatalogue): RetroDecision {
  const factIds = topicFacts(topic, catalogue);
  return factIds.length
    ? { kind: "explanation", topic, factIds, target: targets[topic] }
    : { kind: "limited_result", reason: "unknown_history" };
}
// Only intent recognition is simulated. Every returned amount comes from this snapshot.
export function fakeRetroDecision(
  prompt: string,
  catalogue: DashboardCatalogue,
  workspace?: Workspace,
  changeContext?: RetroChangeIntent,
): RetroDecision {
  const text = prompt.toLowerCase();
  if (
    /ignore.*(instruction|rule)|system prompt|execute.*(code|script)|https?:\/\/|<script/u.test(
      text,
    )
  )
    return { kind: "limited_result", reason: "injection" };
  if (/invest|tax advice|should i|recommend|buy stocks/u.test(text))
    return { kind: "limited_result", reason: "advice" };
  if (
    /send.*email|email.*(customer|supplier)|send money|pay.*supplier|connect.*bank/u.test(text) ||
    (/transfer/u.test(text) && !/record|add|create/u.test(text))
  )
    return { kind: "limited_result", reason: "external_action" };
  if (/simulate (failure|refusal|tool cap)/u.test(text))
    return {
      kind: "limited_result",
      reason: text.includes("refusal")
        ? "refusal"
        : text.includes("tool cap")
          ? "tool_limit"
          : "failed",
    };
  if (workspace) {
    if (/last year|forecast|predict|bank balance/u.test(text))
      return { kind: "limited_result", reason: "unknown_history" };
    const action = fakeWorkspaceIntent(prompt);
    if (action) return { kind: "workspace_request", intent: action };
    const dashboard = dashboardIntent(prompt);
    if (dashboard) return dashboard;
    const intent = fakeChangeIntent(prompt, workspace, changeContext);
    if (intent) return { kind: "change_request", intent };
  }
  if (
    /create|add.*(expense|bill|payment|contact)|delete|remove|update|edit.*(invoice|expense)|due date/u.test(
      text,
    )
  )
    return { kind: "limited_result", reason: "crud_next" };
  if (/tour|show me around|guide me/u.test(text))
    return { kind: "tour", tourId: "workspace_intro" };
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const named = months.findIndex((month) => new RegExp(`\\b${month}\\b`, "u").test(text));
  if (
    named !== -1 &&
    Number(catalogue.scope.from.slice(5, 7)) !== named + 1 &&
    !/compare|previous|prior/u.test(text)
  )
    return { kind: "clarification", reason: "period", choices: ["summary", "comparison"] };
  if (/last year|forecast|predict|bank balance/u.test(text))
    return { kind: "limited_result", reason: "unknown_history" };
  if (/explain (it|this)$|what about that|more details$/u.test(text))
    return {
      kind: "clarification",
      reason: "topic",
      choices: ["profit", "cash", "rent", "coverage"],
    };
  const topic: RetroTopic | null = /cash|received|movement/u.test(text)
    ? "cash"
    : /due soon/u.test(text)
      ? "due_soon"
      : /tax/u.test(text)
        ? "tax"
        : /categor|cost breakdown/u.test(text)
          ? "categories"
          : /customers|clients/u.test(text)
            ? "customers"
            : /vendors|suppliers/u.test(text)
              ? "vendors"
              : /overdue|due|open|unpaid/u.test(text)
                ? "open"
                : /rent/u.test(text)
                  ? "rent"
                  : /largest.*(cost|expense)|biggest.*(cost|expense)/u.test(text)
                    ? "largest_cost"
                    : /customer|client/u.test(text)
                      ? "customer"
                      : /vendor|supplier.*largest/u.test(text)
                        ? "vendor"
                        : /compare|previous|prior|august/u.test(text)
                          ? "comparison"
                          : /margin/u.test(text)
                            ? "margin"
                            : /profit|loss/u.test(text)
                              ? "profit"
                              : /review|coverage|duplicate/u.test(text)
                                ? "coverage"
                                : /cost|expense/u.test(text)
                                  ? "costs"
                                  : /income|revenue|sale/u.test(text)
                                    ? "income"
                                    : /summary|summarize|overview|dashboard|how.*doing/u.test(text)
                                      ? "summary"
                                      : null;
  return topic ? explainTopic(topic, catalogue) : { kind: "limited_result", reason: "unsupported" };
}
export function validateRetroInput(input: unknown): RetroRequest {
  const request = retroRequestSchema.parse(input);
  validateGraph(request.workspace);
  return request;
}
export function groundRetroDecision(input: unknown, catalogue: DashboardCatalogue): RetroDecision {
  const decision = retroDecisionSchema.parse(input);
  if (decision.kind === "explanation") {
    const expected = topicFacts(decision.topic, catalogue);
    if (
      expected.length === 0 ||
      new Set(decision.factIds).size !== decision.factIds.length ||
      expected.length !== decision.factIds.length ||
      expected.some((id) => !decision.factIds.includes(id)) ||
      decision.factIds.some((id) => !catalogue.facts[id]) ||
      (decision.target !== null && decision.target !== targets[decision.topic])
    )
      throw new RangeError("ungrounded_answer");
  }
  return decision;
}
export function createRetroResponse(
  request: RetroRequest,
  decision: unknown,
  mode: RetroResponse["mode"],
  steps: RetroResponse["steps"] = [],
): RetroResponse {
  const catalogue = buildDashboard(request.workspace, request.scope);
  const grounded = groundRetroDecision(decision, catalogue);
  const sources =
    grounded.kind === "explanation"
      ? grounded.factIds.flatMap((id) => catalogue.facts[id]!.sources)
      : [];
  const unique = [...new Map(sources.map((source) => [JSON.stringify(source), source])).values()];
  return retroResponseSchema.parse({
    schemaVersion: 1,
    adapterVersion: "retro-grounded-v1",
    workspaceId: request.workspace.id,
    revision: request.workspace.revision,
    scope: request.scope,
    mode,
    ...(request.uiContext ? { uiRevision: request.uiContext.dashboard.revision } : {}),
    decision: grounded,
    sources: unique.slice(0, 100),
    steps,
    ...(grounded.kind === "change_request"
      ? {
          change: prepareRetroChange(
            grounded.intent,
            request.workspace,
            request.scope,
            request.operationId.slice(6),
          ),
        }
      : {}),
  });
}
export function isRetroCurrent(response: RetroResponse, workspace: Workspace, scope: RetroScope) {
  return (
    response.workspaceId === workspace.id &&
    response.revision === workspace.revision &&
    retroScopeKey(response.scope) === retroScopeKey(scope)
  );
}
const limitedCopy: Record<string, string> = {
  unsupported:
    "I can help with summaries, dashboard figures, comparisons, sources, tours and record changes. Try a shortcut below.",
  advice:
    "I can explain your supplied records and their sources. Investment and tax recommendations are outside this demo.",
  external_action:
    "This browser demo can inspect and record finances. It cannot send money, email customers or connect a bank.",
  injection:
    "I can only inspect supplied facts and registered workspace actions. Source instructions, code and external links do not grant additional capabilities.",
  unknown_history:
    "That figure or history is not supplied in the current scope. Open Documents or change the period to inspect the available evidence.",
  tool_limit:
    "The investigation reached its tool limit. Your records are unchanged. Try one specific figure or inspect its contributors locally.",
  failed:
    "I couldn’t complete that request. Your records are safe. Try again, or choose an explanation below.",
  refusal: "I can’t help with that request. You can still explore your figures and their sources.",
  crud_next:
    "Session records support invoices, costs, payments and contacts. Open Records to create, edit or remove them with an editable form and local confirmation.",
};
export function formatRetroFact(fact: DashboardFact) {
  if (fact.value === null) return "Unavailable";
  if (fact.unit === "money") return formatAmount(fact.value);
  if (fact.unit === "percent") return `${(fact.value / 10).toFixed(1)}%`;
  return String(fact.value);
}
export function renderRetroResponse(
  response: RetroResponse,
  catalogue: DashboardCatalogue,
): { intro: string; facts: DashboardFact[]; closing: string } {
  const decision = response.decision;
  if (decision.kind === "workspace_request")
    return {
      intro:
        decision.intent.action === "help"
          ? "Choose a task."
          : "Here’s the next step. Review or choose the control below.",
      facts: [],
      closing: "",
    };
  if (decision.kind === "dashboard_request")
    return {
      intro:
        decision.action === "chart"
          ? "Let’s build that chart. Which style would you like?"
          : decision.action === "kpi"
            ? "Add this figure to your dashboard?"
            : "Choose the dashboard card you want to change.",
      facts: [],
      closing: "",
    };
  if (decision.kind === "change_request")
    return {
      intro:
        response.change?.kind === "ready"
          ? "I’ve prepared an editable session form. Review its fields and financial effect before confirming."
          : response.change?.kind === "clarification"
            ? "A few details are needed together before I can prepare this form."
            : response.change?.kind === "rejected"
              ? response.change.reason
              : "This change could not be validated.",
      facts: [],
      closing: "Your records change only after you confirm. You can undo your latest change.",
    };
  if (decision.kind === "limited_result")
    return { intro: limitedCopy[decision.reason]!, facts: [], closing: "" };
  if (decision.kind === "clarification")
    return {
      intro:
        decision.reason === "period"
          ? "This request names a different period. Change Period & scope, then ask again, or explore the current period below."
          : "Which part would you like to explore? Choose a topic below.",
      facts: [],
      closing: "",
    };
  if (decision.kind === "tour")
    return {
      intro:
        "Let’s explore your workspace. I’ll point out each section as we go. You can go back, finish or keep typing at any time.",
      facts: [],
      closing: "",
    };
  groundRetroDecision(decision, catalogue);
  const allowedSources = [
    ...new Map(
      decision.factIds
        .flatMap((id) => catalogue.facts[id]!.sources)
        .map((source) => [JSON.stringify(source), source]),
    ).values(),
  ].slice(0, 100);
  if (JSON.stringify(response.sources) !== JSON.stringify(allowedSources))
    throw new RangeError("ungrounded_sources");
  const intros: Record<RetroTopic, string> = {
    summary: "Here’s the picture from your supplied records in this scope.",
    income: "Invoiced income measures supplied work, on event dates.",
    costs:
      "Documented costs use explicit net amounts, or stated amounts when no separate tax is present.",
    profit: "Profit preview subtracts compatible documented costs from invoiced income.",
    margin:
      "Margin divides the profit preview by positive invoiced income. It is unavailable without that denominator.",
    cash: "Cash uses supplied payment movements. Work and payment dates can differ; this is movement, not an account balance.",
    open: "These are known gross open amounts as of the selected date. Unknown settlement is excluded, and due items are not automatically overdue.",
    rent: "This is the Rent contribution to compatible documented costs.",
    largest_cost: "This category has the largest supplied cost contribution in this scope.",
    customer: "This counterparty contributes the most supplied income in this scope.",
    vendor: "This counterparty contributes the most supplied costs in this scope.",
    comparison:
      "Compare the current period with the preceding supplied period. Each figure retains its own coverage and contributors.",
    coverage:
      "Coverage describes the whole document collection, including review holds and duplicates. It is not a complete accounting claim.",
    due_soon: "These known open amounts are due within seven days of the selected as-of date.",
    tax: "This is explicitly stated document tax. It does not calculate tax liability or recoverability.",
    categories:
      "Here’s how documented costs divide into categories. Each group opens its contributors.",
    customers: "These counterparties contribute supplied income in this scope.",
    vendors: "These counterparties contribute supplied costs in this scope.",
  };
  return {
    intro: intros[decision.topic],
    facts: decision.factIds.map((id) => catalogue.facts[id]!),
    closing:
      "Figures use the supplied USD records and current filters. Open a figure for its formula, exclusions and original evidence.",
  };
}
export function executeRetroTool(
  input: unknown,
  request: RetroRequest,
  catalogue: DashboardCatalogue,
) {
  const tool = retroToolSchema.parse(input);
  const graph = request.workspace;
  switch (tool.name) {
    case "get_ui_context":
      return {
        dashboard: request.uiContext?.dashboard ?? null,
        categories: [...new Set(graph.events.map((event) => event.category))].slice(0, 20),
        counterparties: graph.contacts
          .slice(0, 20)
          .map(({ id, name, role }) => ({ id, name, role })),
      };
    case "list_documents":
      return retroDocuments(graph, tool.args.query)
        .slice(tool.args.offset, tool.args.offset + 20)
        .map(({ id, name, kind, pageCount, state, disposition, provenance }) => ({
          id,
          name,
          kind,
          pageCount,
          state,
          disposition,
          provenance,
        }));
    case "prepare_session_change":
      return prepareRetroChange(
        tool.args,
        request.workspace,
        request.scope,
        request.operationId.slice(6),
      );
    case "get_summary":
      return topicFacts("summary", catalogue).map((id) => briefFact(catalogue.facts[id]!));
    case "compare_periods":
      return topicFacts("comparison", catalogue).map((id) => briefFact(catalogue.facts[id]!));
    case "get_metric_evidence": {
      const fact = catalogue.facts[tool.args.factId];
      if (!fact) throw new RangeError("unknown_fact");
      return {
        ...briefFact(fact),
        contributors: fact.contributors
          .slice(tool.args.offset, tool.args.offset + 50)
          .map((row) => ({
            id: row.id,
            label: row.label,
            amountMinor: row.amountMinor,
          })),
        sources: fact.sources.slice(tool.args.offset, tool.args.offset + 50),
        excluded: fact.excluded
          .slice(0, 20)
          .map(({ id, label, reason }) => ({ id, label, reason })),
        nextOffset:
          tool.args.offset + 50 < Math.max(fact.contributors.length, fact.sources.length)
            ? tool.args.offset + 50
            : null,
      };
    }
    case "list_events":
      return graph.events
        .filter(
          (event) =>
            event.occurredOn >= request.scope.from &&
            event.occurredOn <= request.scope.to &&
            (!request.scope.category || event.category === request.scope.category) &&
            (!request.scope.counterpartyId ||
              event.counterpartyId === request.scope.counterpartyId),
        )
        .slice(tool.args.offset, tool.args.offset + 20)
        .map(
          ({
            id,
            kind,
            description,
            occurredOn,
            status,
            amountMinor,
            netMinor,
            category,
            sources,
          }) => ({
            id,
            kind,
            description,
            occurredOn,
            status,
            amountMinor,
            netMinor,
            category,
            sources,
          }),
        );
    case "list_review_issues":
      return graph.issues.filter((issue) => !issue.resolved).slice(0, 20);
    case "list_contacts":
      return graph.contacts
        .filter((contact) => contact.name.toLowerCase().includes(tool.args.query.toLowerCase()))
        .slice(0, 20)
        .map(({ id, name, role }) => ({ id, name, role }));
    case "get_record": {
      const event = graph.events.find((row) => row.id === tool.args.id);
      if (event)
        return {
          id: event.id,
          kind: event.kind,
          description: event.description,
          category: event.category,
          amountMinor: event.amountMinor,
          netMinor: event.netMinor,
          dueOn: event.dueOn,
          status: event.status,
          sources: event.sources,
        };
      const invoice = graph.invoices.find((row) => row.id === tool.args.id);
      if (invoice)
        return {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          issuedOn: invoice.issuedOn,
          dueOn: invoice.dueOn,
          customerId: invoice.customerId,
          sources: invoice.sources,
        };
      const payment = graph.payments.find((row) => row.id === tool.args.id);
      if (payment)
        return {
          id: payment.id,
          direction: payment.direction,
          occurredOn: payment.occurredOn,
          amountMinor: payment.amountMinor,
          allocations: payment.allocations,
          sources: payment.sources,
        };
      const contact = graph.contacts.find((row) => row.id === tool.args.id);
      if (contact) return { id: contact.id, name: contact.name, role: contact.role };
      throw new RangeError("unknown_record");
    }
    case "get_document_excerpt": {
      const original = graph.documents.find((row) => row.id === tool.args.documentId);
      if (!original || tool.args.page > original.pageCount) throw new RangeError("unknown_source");
      return {
        documentId: original.id,
        page: tool.args.page,
        untrustedExcerpt: original.numericFields
          .filter((field) => field.page === tool.args.page)
          .map((field) => `${field.block}: ${field.raw}`)
          .join("\n")
          .slice(0, 2000),
      };
    }
    case "start_tour":
      return {
        tourId: tool.args.tourId,
        targets: [
          "overview",
          "period",
          "income",
          "composition",
          "documents",
          "records",
          "composer",
        ],
      };
    case "navigate_workspace":
      return { target: tool.args.target, proposed: true };
  }
}
export function briefFact(fact: DashboardFact) {
  return {
    id: fact.id,
    label: fact.label,
    value: fact.value,
    unit: fact.unit,
    basis: fact.basis,
    unavailable: fact.unavailable,
    scope: fact.scope,
    sources: fact.sources.slice(0, 10),
  };
}
