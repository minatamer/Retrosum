import type { ChartStyle, RetroResponse, RetroTarget, RetroTopic } from "@retrosum/contracts";

type ChangeChoice = Extract<
  NonNullable<RetroResponse["change"]>,
  { kind: "clarification" }
>["choices"][number];
export type RetroShortcut = { label: string } & (
  | { kind: "topic"; topic: RetroTopic }
  | { kind: "tour" }
  | { kind: "help" }
  | { kind: "prompt"; prompt: string }
  | { kind: "highlight"; target: RetroTarget }
  | { kind: "decline" }
  | { kind: "change_choice"; choice: ChangeChoice }
  | { kind: "style"; style: ChartStyle }
);

export const TOPIC_LABELS: Partial<Record<RetroTopic, string>> = {
  summary: "Summarize this period",
  profit: "Explain profit",
  cash: "Explain cash",
  rent: "Explain rent",
  coverage: "Explain coverage",
  comparison: "Compare periods",
  open: "What remains unpaid?",
  categories: "Show cost categories",
  largest_cost: "What is the largest cost?",
};
export const RETRO_HELP_EXAMPLES = [
  "Summarize this period",
  "Explain this dashboard",
  "How can I add a widget?",
  "Show me around",
  "Review held figures",
  "Create invoice",
  "Explain cash",
  "Open documents",
  "Change period",
  "Record payment",
  "Chart quarterly income",
  "Add cash net KPI",
  "Set income target",
  "Open settings",
  "Undo",
] as const;
const topic = (value: RetroTopic): RetroShortcut => ({
  kind: "topic",
  topic: value,
  label: TOPIC_LABELS[value] ?? `Explain ${value}`,
});
const help: RetroShortcut = { kind: "help", label: "What can Retro do?" };
const question = (label: string): RetroShortcut => ({ kind: "prompt", label, prompt: label });
const widgets = question("How can I add a widget?");
const sources = question("How do I check the sources?");
const starters: RetroShortcut[] = [
  topic("summary"),
  topic("profit"),
  { kind: "tour", label: "Show me around" },
  help,
];
const related: Partial<Record<RetroTopic, RetroTopic[]>> = {
  summary: ["profit", "cash"],
  profit: ["cash", "comparison"],
  cash: ["open", "profit"],
  costs: ["categories", "largest_cost"],
  categories: ["largest_cost", "comparison"],
  income: ["comparison", "open"],
  open: ["cash", "coverage"],
  coverage: ["summary", "costs"],
};

export function retroShortcuts({
  empty,
  response,
  current,
  dismissed = false,
  applied = false,
  busy = false,
  failed = false,
}: {
  empty: boolean;
  response?: RetroResponse | undefined;
  current: boolean;
  dismissed?: boolean;
  applied?: boolean;
  busy?: boolean;
  failed?: boolean;
}): RetroShortcut[] {
  if (busy) return [];
  if (failed) return [topic("summary"), help];
  if (empty) return starters;
  if (!response) return [];
  if (!current) return [{ ...topic("summary"), label: "Refresh figures" }];
  if (applied)
    return [
      question(
        response.decision.kind === "dashboard_request" && response.decision.position === "first"
          ? "Move it to the bottom"
          : "Move it to the top",
      ),
      widgets,
      topic("summary"),
      question("Undo layout"),
    ];
  if (response.change?.kind === "clarification")
    return response.change.choices
      .slice(0, 4)
      .map((choice) => ({ kind: "change_choice", label: choice.label, choice }));
  const decision = response.decision;
  if (decision.kind === "workspace_request" && decision.intent.action === "help") return [];
  if (decision.kind === "conversation") {
    if (decision.topic === "greeting") return [];
    if (decision.topic === "widgets")
      return [
        question("Add profit KPI"),
        question("Chart quarterly income"),
        question("Set income target"),
        { kind: "tour", label: "Show me around" },
      ];
    if (decision.topic === "scope")
      return [question("Change period"), topic("comparison"), topic("summary"), sources];
    if (decision.topic === "sources")
      return [
        question("Open documents"),
        topic("coverage"),
        question("Review held figures"),
        topic("summary"),
      ];
    return [topic("summary"), widgets, sources, help];
  }
  if (decision.kind === "clarification") return decision.choices.map(topic);
  if (decision.kind === "explanation") {
    const next = (related[decision.topic] ?? ["summary", "comparison"])
      .filter((value) => value !== decision.topic)
      .map(topic)
      .slice(0, 2);
    return [
      ...(decision.target && decision.topic !== "summary" && !dismissed
        ? [
            {
              kind: "highlight" as const,
              label: `Find ${decision.topic.replaceAll("_", " ")} on the dashboard`,
              target: decision.target,
            },
          ]
        : []),
      ...next,
      ...(decision.topic === "summary" ? [sources] : []),
      widgets,
    ].slice(0, 4);
  }
  if (
    decision.kind === "dashboard_request" &&
    (decision.action === "chart" || decision.action === "restyle")
  )
    return (["line", "curve", "bar", "pie"] as const).map((style) => ({
      kind: "style",
      style,
      label:
        style === "curve"
          ? "Curve"
          : style === "pie"
            ? "Pie / donut"
            : style === "line"
              ? "Line"
              : "Bar",
    }));
  if (decision.kind === "limited_result")
    return decision.reason === "unknown_history"
      ? [
          { kind: "prompt", label: "Change period", prompt: "Change period" },
          { kind: "prompt", label: "Open documents", prompt: "Open documents" },
        ]
      : [topic("summary"), help];
  // Editable proposals already present their own validated action controls.
  return [];
}

export function resolveRetroReply(
  prompt: string,
  choices: RetroShortcut[],
): RetroShortcut | undefined {
  const text = prompt.trim().toLowerCase();
  const styles: Record<string, ChartStyle> = {
    line: "line",
    "line chart": "line",
    curve: "curve",
    curved: "curve",
    "curved chart": "curve",
    smooth: "curve",
    bar: "bar",
    "bar chart": "bar",
    pie: "pie",
    "pie chart": "pie",
    donut: "pie",
    "pie / donut": "pie",
  };
  return choices.find((choice) => {
    if (choice.kind === "highlight") return choice.label.toLowerCase() === text;
    if (choice.kind === "decline") return ["no", "no thanks", "no, thanks"].includes(text);
    return choice.kind === "style"
      ? choice.style === styles[text]
      : choice.kind === "change_choice" && choice.label.toLowerCase() === text;
  });
}
