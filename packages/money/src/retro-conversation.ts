import {
  dashboardRequestSchema,
  type DashboardMetric,
  type RetroDecision,
  type RetroRequest,
  type MoneySession,
} from "@retrosum/contracts";
import { dashboardWidgetLabel } from "./custom-dashboard.js";
import { explainTopic, isRetroCurrent } from "./retro.js";
import type { DashboardCatalogue } from "./dashboard.js";

/** A first layer for obvious scope violations; structural/tool checks remain authoritative. */
export function retroGuard(prompt: string): RetroDecision | null {
  const text = prompt
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .toLowerCase();
  const limited = (
    reason: Extract<RetroDecision, { kind: "limited_result" }>["reason"],
  ): RetroDecision => ({ kind: "limited_result", reason });
  if (
    /ignore[\s\S]*(instruction|rule|policy|guard)|(?:system|developer)\s*(prompt|message)|override[\s\S]*(policy|rule)|(?:reveal|print|show)[\s\S]*(secret|api key)|<script|javascript:|https?:\/\//u.test(
      text,
    )
  )
    return limited("injection");
  if (
    /\b(?:write|generate|build|debug|fix|implement|teach|run|execute|help)\b[\s\S]*\b(?:code|coding|programming|script|command|sql|python|javascript|typescript|shell|powershell)\b|\bcreate\s+(?:a\s+|an\s+)?(?:script|program|function|app|code)\b/u.test(
      text,
    )
  )
    return limited("off_topic");
  if (
    /\b(?:solve|equation|algebra|calculus|integral|derivative|square root)\b|\d\s*[+*÷^]\s*\d|\b(?:what is|calculate|compute|evaluate)\b[\s\S]*\d\s*[-/]\s*\d|\b(?:write|tell|compose|generate)\b[\s\S]*\b(?:poem|story|joke|essay|song)\b|\b(?:weather|recipe|politics|travel itinerary)\b/u.test(
      text,
    )
  )
    return limited("off_topic");
  if (
    /\b(?:investment|invest|buy stocks|tax advice|tax planning)\b|\b(?:recommend|should i)\b[\s\S]*\b(?:invest|borrow|hire|fire|stocks?|tax treatment)\b/u.test(
      text,
    )
  )
    return limited("advice");
  if (
    /\b(?:send|deliver)\b[\s\S]*\bemail\b|\bemail\s+(?:the |my |our )?(?:customer|supplier)\b|send money|\bpay\b[\s\S]*supplier|connect[\s\S]*bank/u.test(
      text,
    ) ||
    (/\btransfer\b/u.test(text) && !/\b(record|add|create)\b/u.test(text))
  )
    return limited("external_action");
  return null;
}

/** Only a fresh, single, applied widget change can supply the pronoun reference. */
export function retroFollowUp(session: MoneySession): NonNullable<RetroRequest["followUp"]> {
  const empty = { widgetId: null, topic: null };
  const message = [...session.messages].reverse().find((row) => row.role === "retro");
  const response = message?.response;
  if (!response || !isRetroCurrent(response, session.workspace, session.filters)) return empty;
  if (response.decision.kind === "explanation")
    return { widgetId: null, topic: response.decision.topic };
  if (
    !message ||
    response.uiRevision !== session.dashboard.revision - 1 ||
    session.dashboard.appliedProposalIds.at(-1) !== message.id ||
    !session.dashboardUndo
  )
    return empty;
  const additions = session.dashboard.widgets.filter(
    (widget) => !session.dashboardUndo!.widgets.some((old) => old.id === widget.id),
  );
  if (additions.length === 1) return { widgetId: additions[0]!.id, topic: null };
  if (response.decision.kind === "dashboard_request") {
    const decision = response.decision;
    const matches = session.dashboard.widgets.filter((widget) =>
      decision.targetId
        ? widget.id === decision.targetId
        : !!decision.target &&
          dashboardWidgetLabel(widget).toLowerCase() === decision.target.toLowerCase(),
    );
    if (matches.length === 1) return { widgetId: matches[0]!.id, topic: null };
  }
  return empty;
}

/** Small talk, product education and explicit follow-ups need no paid inference. */
export function localRetroDecision(
  request: Pick<RetroRequest, "prompt" | "uiContext" | "followUp">,
  catalogue: DashboardCatalogue,
): RetroDecision | null {
  const blocked = retroGuard(request.prompt);
  if (blocked) return blocked;
  const text = request.prompt.trim().toLowerCase();
  const conversation = (
    topic: Extract<RetroDecision, { kind: "conversation" }>["topic"],
  ): RetroDecision => ({ kind: "conversation", topic });
  if (
    /^(?:hi|hello|hey|good morning|good afternoon|good evening)(?:\s+(?:retro|there))?[!,.?\s]*$/u.test(
      text,
    )
  )
    return conversation("greeting");
  if (/^(?:thanks|thank you|thank you retro|thanks retro|cheers)[!,.?\s]*$/u.test(text))
    return conversation("thanks");
  if (
    /^(?:how|what|can|where|help|tell|explain)\b/u.test(text) &&
    /(?:how.*(?:add|create|move|place|arrange|customiz)|what.*(?:widget|chart|kpi)|can i\b.*(?:add|move|place)|explain.*customiz)/u.test(
      text,
    ) &&
    /widget|dashboard.*(?:card|layout)|customiz/u.test(text)
  )
    return conversation("widgets");
  if (
    /how.*(?:source|evidence|original|pdf)|where.*(?:figure|number|data).*come|what.*source/u.test(
      text,
    )
  )
    return conversation("sources");
  if (
    /how.*(?:period|scope|filter).*?(?:work|use|change|choose)|how.*(?:use|change|choose).*(?:period|scope|filter)|what.*(?:period|scope|filter).*mean/u.test(
      text,
    )
  )
    return conversation("scope");
  if (
    /how.*(?:privacy|data.*(?:store|keep|handle))|(?:is|are).*data.*(?:safe|private)|what.*(?:store|privacy)|who.*(?:see|access).*data/u.test(
      text,
    )
  )
    return conversation("privacy");
  if (
    /^(?:please )?(?:explain (?:it|this|that)(?: more)?|tell me more|more details|why)[?.!\s]*$/u.test(
      text,
    )
  )
    return request.followUp?.topic
      ? explainTopic(request.followUp.topic, catalogue)
      : {
          kind: "clarification",
          reason: "topic",
          choices: ["profit", "cash", "coverage", "summary"],
        };
  if (/\b(?:add|make|show)\b.*\b(?:this|that|it)\b.*\b(?:widget|kpi|card)\b/u.test(text)) {
    const metrics: Partial<
      Record<NonNullable<NonNullable<RetroRequest["followUp"]>["topic"]>, DashboardMetric>
    > = {
      profit: "profit",
      income: "income",
      costs: "costs",
      cash: "cash_net",
      margin: "margin",
      tax: "tax",
      coverage: "coverage",
    };
    const metric = request.followUp?.topic ? metrics[request.followUp.topic] : undefined;
    return metric
      ? dashboardRequestSchema.parse({
          kind: "dashboard_request",
          action: "kpi",
          metric,
          title: metric.replaceAll("_", " "),
          groupBy: "month",
          style: null,
          target: null,
        })
      : conversation("widgets");
  }
  const move =
    /\b(?:move|put|place|position|reorder)\b/u.test(text) &&
    /\b(?:it|this|that|widget|card|chart|kpi|target)\b/u.test(text) &&
    /\b(?:top|bottom|first|last|before|after)\b/u.test(text);
  if (move && request.uiContext) {
    const widgets = request.uiContext.dashboard.widgets;
    const targetText = text.split(/\b(?:before|after)\b/u)[0]!;
    const named = widgets.filter((widget) =>
      targetText.includes(dashboardWidgetLabel(widget).toLowerCase()),
    );
    const longest = named.filter(
      (widget) =>
        !named.some(
          (other) =>
            other.id !== widget.id &&
            dashboardWidgetLabel(other).length > dashboardWidgetLabel(widget).length &&
            dashboardWidgetLabel(other)
              .toLowerCase()
              .includes(dashboardWidgetLabel(widget).toLowerCase()),
        ),
    );
    const pronoun = /\b(?:it|this|that)\b/u.test(text);
    const target = pronoun
      ? widgets.find((widget) => widget.id === request.followUp?.widgetId)
      : longest.length === 1
        ? longest[0]
        : undefined;
    const relative = /\b(before|after)\s+(.+?)[?.!]*$/u.exec(text);
    const anchors = relative
      ? widgets.filter(
          (widget) =>
            relative[2]!
              .replace(/^(?:the|my)\s+/u, "")
              .replace(/["“”]/gu, "")
              .trim() === dashboardWidgetLabel(widget).toLowerCase(),
        )
      : [];
    return dashboardRequestSchema.parse({
      kind: "dashboard_request",
      action: "move",
      metric: target?.kind === "chart" ? target.spec.metric : (target?.metric ?? "income"),
      title: target ? dashboardWidgetLabel(target) : "Dashboard item",
      groupBy: "month",
      style: null,
      target: target ? dashboardWidgetLabel(target) : null,
      targetId: target?.id ?? null,
      position: relative?.[1] ?? (/bottom|last/u.test(text) ? "last" : "first"),
      anchorId: anchors.length === 1 ? anchors[0]!.id : null,
    });
  }
  return null;
}

export const retroConversationCopy = {
  greeting:
    "Hi, I’m Retro! I’m here to help you understand your figures and make this Retrosum workspace your own. We can explore your records, follow the evidence, arrange the dashboard or prepare a change together. What would you like to do?",
  thanks:
    "You’re welcome! I’m here whenever you want to explore another figure, check its source or make the dashboard work better for you.",
  widgets:
    "You can add source-linked KPIs, charts and an income target to this dashboard. Tell me what you want to see, then review the preview and confirm. To arrange a card, ask for the top, bottom, or a place before or after another card. The layout adapts to your screen, and Undo layout restores the last arrangement.",
  sources:
    "Every supplied figure keeps a paper trail. Open a figure to see its formula, included records and exclusions, or expand Show sources in my reply to inspect the original PDF and page. Held documents stay outside accepted totals until you review them.",
  scope:
    "Period & scope controls which event dates, categories and counterparties you are looking at. The as-of date controls open and due amounts. Changing these filters recalculates the dashboard from the same records; it doesn’t edit them. I can open the controls so you can choose the view you need.",
  privacy:
    "Your workspace is kept in this browser tab and expires after two hours. Live processing sends your question, recent conversation and current financial records through Retrosum to OpenAI; original PDFs are not attached to a chat turn. OpenAI may retain data under its policies. Reset clears the local session and stops its processing, but cannot recall downloaded copies or data already held by OpenAI.",
} as const;
