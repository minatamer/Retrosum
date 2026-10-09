import {
  chartSpecSchema,
  dashboardRequestSchema,
  minorUnitsSchema,
  type ChartSpec,
  type DashboardPreferences,
  type DashboardRequest,
  type SessionFilter,
  type Workspace,
} from "@retrosum/contracts";
import { buildDashboard, type DashboardFact } from "./dashboard.js";
import { sumAmounts } from "./amount.js";

export function parseDisplayRate(text: string): number {
  if (!/^(?:0|[1-9]\d{0,3})(?:\.\d{1,6})?$/u.test(text.trim()))
    throw new RangeError("Enter a positive rate with up to six decimal places.");
  const [whole = "0", fraction = ""] = text.trim().split(".");
  const rate = Number(BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0")));
  if (rate < 1 || rate > 1_000_000_000)
    throw new RangeError("Enter a rate between 0.000001 and 1000.");
  return rate;
}
export function convertDisplayAmount(minor: number, rateMicros: number): number {
  minorUnitsSchema.parse(minor);
  if (!Number.isInteger(rateMicros) || rateMicros < 1 || rateMicros > 1_000_000_000)
    throw new RangeError("A valid display exchange rate is required.");
  const signed = BigInt(minor) * BigInt(rateMicros);
  const rounded = ((signed < 0 ? -signed : signed) + 500_000n) / 1_000_000n;
  const converted = Number(signed < 0 ? -rounded : rounded);
  if (!minorUnitsSchema.safeParse(converted).success)
    throw new RangeError("Converted amount exceeds the display limit.");
  return converted;
}
export function formatDisplayAmount(
  minor: number,
  display: Pick<DashboardPreferences, "currency" | "eurRateMicros">,
) {
  let amount: number;
  try {
    amount =
      display.currency === "EUR"
        ? convertDisplayAmount(minor, display.eurRateMicros ?? 0)
        : minorUnitsSchema.parse(minor);
  } catch (cause) {
    if (
      cause instanceof RangeError &&
      cause.message === "Converted amount exceeds the display limit."
    )
      return "Outside display limit";
    throw cause;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: display.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}
export type ChartPoint = { label: string; fact: DashboardFact; comparison: DashboardFact | null };
export function buildCustomChart(
  workspace: Workspace,
  filter: Omit<SessionFilter, "register">,
  input: ChartSpec,
) {
  const spec = chartSpecSchema.parse(input);
  let scope = { ...filter };
  if (spec.range === "history") {
    const dates = [
      ...workspace.events.map((e) => e.occurredOn),
      ...workspace.payments.map((p) => p.occurredOn),
    ]
      .filter((d) => d <= workspace.asOf)
      .sort();
    if (dates.length) scope = { ...scope, from: dates[0]!, to: dates.at(-1)! };
  }
  const points: ChartPoint[] = [];
  const add = (label: string, scoped: typeof scope) => {
    const catalogue = buildDashboard(workspace, scoped);
    points.push({
      label,
      fact: catalogue.facts[spec.metric]!,
      comparison: spec.comparison ? catalogue.facts[spec.comparison]! : null,
    });
  };
  if (spec.groupBy === "category") {
    const names = [
      ...new Set(
        workspace.events
          .filter(
            (e) =>
              e.occurredOn >= scope.from &&
              e.occurredOn <= scope.to &&
              (!scope.category || e.category === scope.category),
          )
          .map((e) => e.category),
      ),
    ].sort();
    if (names.length > 32) throw new RangeError("Narrow this chart to at most 32 categories.");
    names.forEach((category) => add(category, { ...scope, category }));
  } else if (spec.groupBy === "counterparty") {
    const parties = workspace.contacts.filter(
      (p) => !scope.counterpartyId || p.id === scope.counterpartyId,
    );
    if (parties.length > 32)
      throw new RangeError("Narrow this chart to at most 32 counterparties.");
    parties.forEach((party) => add(party.name, { ...scope, counterpartyId: party.id }));
  } else {
    const step = spec.groupBy === "quarter" ? 3 : 1;
    let year = Number(scope.from.slice(0, 4));
    let month = Number(scope.from.slice(5, 7)) - 1;
    if (step === 3) month = Math.floor(month / 3) * 3;
    while (true) {
      const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      if (from > scope.to) break;
      if (points.length >= 36) throw new RangeError("Narrow this chart to at most 36 periods.");
      const to = new Date(Date.UTC(year, month + step, 0)).toISOString().slice(0, 10);
      const label =
        step === 3
          ? `Q${Math.floor(month / 3) + 1} ${year}`
          : new Intl.DateTimeFormat("en-US", {
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(`${from}T00:00:00Z`));
      add(label, {
        ...scope,
        from: from < scope.from ? scope.from : from,
        to: to > scope.to ? scope.to : to,
      });
      month += step;
      if (month >= 12) {
        year += 1;
        month -= 12;
      }
    }
  }
  return {
    spec,
    points,
    scope,
    total: sumAmounts(points.map((p) => p.fact.value ?? 0)),
    pieUnavailable:
      spec.style === "pie" && points.some((p) => p.fact.value !== null && p.fact.value < 0),
    note: "Supplied records only; missing documents are outside this view.",
  };
}
export function dashboardIntent(prompt: string): DashboardRequest | null {
  const text = prompt.toLowerCase();
  if (!/chart|graph|kpi|dashboard.*(card|layout)|(?:add|show|move).*metric/u.test(text))
    return null;
  if (/ignore.*(rules|instructions)|https?:\/\/|<script/u.test(text)) return null;
  const metric = /overdue/u.test(text)
    ? "overdue"
    : /coverage/u.test(text)
      ? "coverage"
      : /tax/u.test(text)
        ? "tax"
        : /supplier.*(due soon|soon)|due soon.*supplier/u.test(text)
          ? "supplier_soon"
          : /customer.*(due soon|soon)|due soon.*customer/u.test(text)
            ? "customer_soon"
            : /margin/u.test(text)
              ? "margin"
              : /cash.*out/u.test(text)
                ? "cash_out"
                : /cash.*net|net.*cash/u.test(text)
                  ? "cash_net"
                  : /cash/u.test(text)
                    ? "cash_in"
                    : /profit|loss/u.test(text)
                      ? "profit"
                      : /cost|expense|spend/u.test(text)
                        ? "costs"
                        : /supplier.*open|payable/u.test(text)
                          ? "supplier_open"
                          : /customer.*open|receivable/u.test(text)
                            ? "customer_open"
                            : "income";
  const style = /curv|smooth|area/u.test(text)
    ? "curve"
    : /line/u.test(text)
      ? "line"
      : /bar/u.test(text)
        ? "bar"
        : /pie|donut/u.test(text)
          ? "pie"
          : null;
  const groupBy = /quarter/u.test(text)
    ? "quarter"
    : /categor|breakdown/u.test(text)
      ? "category"
      : /customer|vendor|supplier|counterpart/u.test(text)
        ? "counterparty"
        : "month";
  const action = /\b(move|reorder)\b/u.test(text)
    ? "move"
    : /remove|delete/u.test(text)
      ? "remove"
      : /change|switch|restyle/u.test(text)
        ? "restyle"
        : /kpi|metric|card/u.test(text)
          ? "kpi"
          : "chart";
  const title = `${groupBy === "quarter" ? "Quarterly" : groupBy === "month" ? "Monthly" : groupBy === "category" ? "Category" : "Counterparty"} ${metric.replaceAll("_", " ")}`;
  const quoted = prompt.match(/["“]([^"”]{1,80})["”]/u)?.[1];
  return dashboardRequestSchema.parse({
    kind: "dashboard_request",
    action,
    metric,
    groupBy,
    title,
    style,
    target: quoted ?? null,
    position: /bottom|last|end/u.test(text)
      ? "last"
      : /top|first|start/u.test(text)
        ? "first"
        : null,
  });
}
