"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  chartSpecSchema,
  defaultDashboardWidgets,
  dashboardMetricSchema,
  sessionFilterSchema,
  type ChartSpec,
  type DashboardWidget,
  type SourceReference,
} from "@retrosum/contracts";
import {
  buildDashboard,
  buildCustomChart,
  formatDisplayAmount,
  parseAmount,
  ratioTenths,
  type DashboardFact,
} from "@retrosum/money";
import { useSession } from "../session/session-provider";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { OriginalViewer } from "../documents/original-viewer";
import { FactDetail } from "./fact-detail";
import { WidgetChart } from "./widget-chart";
import { periodLabel } from "./format";
import styles from "./configurable-dashboard.module.css";

const defaultChartIds = new Set(
  defaultDashboardWidgets()
    .filter((widget) => widget.kind === "chart")
    .map((widget) => widget.id),
);

export function ConfigurableDashboard({ onDocuments }: { onDocuments(): void }) {
  const { controller, session } = useSession();
  const [customize, setCustomize] = useState(false);
  const [detail, setDetail] = useState<DashboardFact | null>(null);
  const [source, setSource] = useState<SourceReference | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const scopeRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismissOutsideScope = (event: PointerEvent) => {
      const scope = scopeRef.current;
      if (scope?.open && event.target instanceof Node && !scope.contains(event.target)) {
        scope.open = false;
      }
    };
    document.addEventListener("pointerdown", dismissOutsideScope);
    return () => document.removeEventListener("pointerdown", dismissOutsideScope);
  }, []);
  const catalogue = useMemo(
    () => (session ? buildDashboard(session.workspace, session.filters) : null),
    [session],
  );
  if (!session || !catalogue) return null;
  const { workspace, dashboard, filters } = session;
  const format = (fact: DashboardFact) =>
    fact.value === null
      ? "Unavailable"
      : fact.unit === "money"
        ? formatDisplayAmount(fact.value, dashboard)
        : fact.unit === "percent"
          ? `${(fact.value / 10).toFixed(1)}%`
          : String(fact.value);
  const update = (widgets: DashboardWidget[]) => controller.setDashboard({ ...dashboard, widgets });
  const move = (index: number, by: number) => {
    const widgets = [...dashboard.widgets];
    const to = index + by;
    if (to < 0 || to >= widgets.length) return;
    [widgets[index], widgets[to]] = [widgets[to]!, widgets[index]!];
    update(widgets);
  };
  const detailCatalogue = detail ? buildDashboard(workspace, detail.scope) : catalogue;
  const currentDetail = detail ? (detailCatalogue.facts[detail.id] ?? detail) : null;
  return (
    <section className={styles.dashboard} id="overview" aria-labelledby="dashboard-heading">
      <header className={styles.heading} id="retro-overview">
        <h1 id="dashboard-heading">Your financial picture</h1>
        <div className={styles.toolbar}>
          <div className={styles.scopeBar}>
            <details
              id="retro-period"
              ref={scopeRef}
              onKeyDown={(event) => {
                if (event.key === "Escape" && event.currentTarget.open) {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
                  event.stopPropagation();
                }
              }}
            >
              <summary>
                Period & scope <span>⌄</span>
              </summary>
              <form
                key={`${filters.from}/${filters.to}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  try {
                    controller.setFilters(
                      sessionFilterSchema.parse({
                        ...filters,
                        from: String(data.get("from")),
                        to: String(data.get("to")),
                        asOf: String(data.get("asOf")),
                        category: String(data.get("category")) || undefined,
                        counterpartyId: String(data.get("counterparty")) || undefined,
                      }),
                    );
                    setScopeError(null);
                  } catch {
                    setScopeError("Choose a valid period with the start before the end.");
                  }
                }}
              >
                <label>
                  From
                  <input name="from" type="date" required defaultValue={filters.from} />
                </label>
                <label>
                  Through
                  <input name="to" type="date" required defaultValue={filters.to} />
                </label>
                <label>
                  Balances as of
                  <input
                    name="asOf"
                    type="date"
                    required
                    defaultValue={filters.asOf ?? workspace.asOf}
                  />
                </label>
                <label>
                  Category
                  <select name="category" defaultValue={filters.category ?? ""}>
                    <option value="">All categories</option>
                    {[...new Set(workspace.events.map((e) => e.category))]
                      .sort()
                      .map((category) => (
                        <option value={category} key={category}>
                          {category}
                        </option>
                      ))}
                  </select>
                </label>
                <label className={styles.fullScopeField}>
                  Counterparty
                  <select name="counterparty" defaultValue={filters.counterpartyId ?? ""}>
                    <option value="">All counterparties</option>
                    {workspace.contacts.map((party) => (
                      <option value={party.id} key={party.id}>
                        {party.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit">Apply →</button>
                {scopeError && <p role="alert">{scopeError}</p>}
              </form>
            </details>
            <button type="button" id="retro-coverage" onClick={onDocuments}>
              {workspace.documents.length} documents · {catalogue.pendingIssueCount} to review{" "}
              {workspace.documents.some((d) => d.state === "error") &&
                ` · ${workspace.documents.filter((d) => d.state === "error").length} failed`}
              <span>↗</span>
            </button>
            {session.dashboardUndo && (
              <button type="button" onClick={() => controller.undoDashboard()}>
                Undo layout ↶
              </button>
            )}
            <p className={styles.periodCaption}>
              {periodLabel(filters.from, filters.to)} · {dashboard.currency}
              {dashboard.currency === "EUR"
                ? ` · 1 USD = ${dashboard.eurRateMicros! / 1_000_000} EUR${dashboard.eurRateDate ? ` · ECB ${dashboard.eurRateDate}` : ""}`
                : " · From your documents"}
            </p>
          </div>
          <button
            type="button"
            className={styles.customizeButton}
            id="retro-customize"
            aria-pressed={customize}
            onClick={() => setCustomize(!customize)}
          >
            {customize ? "Done editing" : "Customize dashboard"}
            <span aria-hidden="true">{customize ? "✓" : "+"}</span>
          </button>
        </div>
      </header>
      {customize && (
        <Customize
          onAdd={(widget) => update([...dashboard.widgets, widget])}
          onRestore={() => update(defaultDashboardWidgets())}
          disabled={dashboard.widgets.length >= 16}
        />
      )}
      <div className={styles.widgets}>
        {dashboard.widgets.map((widget, index) => (
          <article
            className={styles.widget}
            data-kind={widget.kind}
            data-featured={
              (widget.kind === "kpi" &&
                ["income", "profit", "cash_in", "cash_net"].includes(widget.metric)) ||
              widget.kind === "target" ||
              widget.id === "widget_trend"
            }
            key={widget.id}
            style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
            id={
              widget.kind === "kpi"
                ? dashboard.widgets.find((w) => w.kind === "kpi" && w.metric === widget.metric)
                    ?.id === widget.id
                  ? `metric-${widget.metric}`
                  : widget.id
                : widget.id === "widget_composition"
                  ? "retro-composition"
                  : widget.id === "widget_trend"
                    ? "retro-trend"
                    : widget.id === "widget_cash_in"
                      ? "retro-cash"
                      : undefined
            }
          >
            {customize && (
              <div className={styles.editActions}>
                <button
                  type="button"
                  aria-label={`Move ${widget.id} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move ${widget.id} later`}
                  disabled={index === dashboard.widgets.length - 1}
                  onClick={() => move(index, 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${widget.id}`}
                  disabled={dashboard.widgets.length === 1}
                  onClick={() => update(dashboard.widgets.filter((w) => w.id !== widget.id))}
                >
                  ×
                </button>
              </div>
            )}
            {widget.kind === "kpi" && (
              <button
                type="button"
                className={styles.kpi}
                onClick={() => setDetail(catalogue.facts[widget.metric]!)}
              >
                <span>
                  {catalogue.facts[widget.metric]!.label}
                  <i>↗</i>
                </span>
                <strong>{format(catalogue.facts[widget.metric]!)}</strong>
                <small>
                  {widget.metric.startsWith("cash")
                    ? "Recorded movements · payment dates"
                    : widget.metric.includes("open")
                      ? "Known settlement · gross USD sources"
                      : widget.metric === "margin"
                        ? "Of supplied invoiced income"
                        : "Eligible supplied records"}
                </small>
                {catalogue.changes.find((c) => c.key === widget.metric)?.changeTenths !== null &&
                  catalogue.changes.find((c) => c.key === widget.metric)?.changeTenths !==
                    undefined && (
                    <em>
                      {(
                        catalogue.changes.find((c) => c.key === widget.metric)!.changeTenths! / 10
                      ).toFixed(1)}
                      % vs prior supplied period
                    </em>
                  )}
              </button>
            )}
            {widget.kind === "chart" && (
              <ChartWidget
                spec={
                  widget.id === "widget_trend" && widget.spec.title === "Income & costs"
                    ? { ...widget.spec, title: "Income and costs" }
                    : widget.spec
                }
                allowStyleChange={!defaultChartIds.has(widget.id)}
                onChange={(spec) =>
                  update(
                    dashboard.widgets.map((w) => (w.id === widget.id ? { ...widget, spec } : w)),
                  )
                }
                onSelect={setDetail}
                onDocuments={onDocuments}
              />
            )}
            {widget.kind === "target" && (
              <TargetCard
                amount={widget.amountMinor}
                income={catalogue.facts.income!}
                onSelect={setDetail}
              />
            )}
          </article>
        ))}
      </div>
      {currentDetail && !source && (
        <FactDetail
          fact={currentDetail}
          originalRevision={detail!.scope.revision}
          onClose={() => setDetail(null)}
          onSource={setSource}
          sourceName={(id) => workspace.documents.find((d) => d.id === id)?.name ?? "Source"}
          counterpartyName={(id) =>
            workspace.contacts.find((contact) => contact.id === id)?.name ?? "Selected counterparty"
          }
          facts={detailCatalogue.facts}
          onSelect={(id) => setDetail(detailCatalogue.facts[id] ?? null)}
        />
      )}
      {source && <OriginalViewer target={source} onClose={() => setSource(null)} />}
    </section>
  );
}
function ChartWidget({
  spec,
  allowStyleChange,
  onChange,
  onSelect,
  onDocuments,
}: {
  spec: ChartSpec;
  allowStyleChange: boolean;
  onChange(spec: ChartSpec): void;
  onSelect(fact: DashboardFact): void;
  onDocuments(): void;
}) {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  if (!session) return null;
  let result;
  try {
    result = buildCustomChart(session.workspace, session.filters, spec);
  } catch (cause) {
    return <p>{cause instanceof Error ? cause.message : "This chart is unavailable."}</p>;
  }
  return (
    <>
      <header className={styles.chartHeading}>
        <div>
          <span className="rs-eyebrow">
            {spec.groupBy === "quarter"
              ? "Quarterly view"
              : spec.groupBy === "category"
                ? "Cost composition"
                : "Follow the numbers"}
          </span>
          <h2>{spec.title}</h2>
        </div>
        {allowStyleChange && (
          <select
            aria-label={`Chart style for ${spec.title}`}
            value={spec.style}
            onChange={(e) => {
              try {
                const next = chartSpecSchema.parse({ ...spec, style: e.target.value });
                if (next.style === "pie" && next.comparison)
                  throw new RangeError(
                    "Pie charts show one metric. Add a separate composition chart, or choose Line, Curve or Bar here.",
                  );
                if (buildCustomChart(session.workspace, session.filters, next).pieUnavailable)
                  throw new RangeError("Negative values need Line, Curve or Bar.");
                onChange(next);
                setError(null);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Choose another style.");
              }
            }}
          >
            <option value="line">Line</option>
            <option value="curve">Curve</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        )}
      </header>
      <p className={styles.chartCaption}>
        {spec.range === "history" ? `${periodLabel(result.scope.from, result.scope.to)} · ` : ""}
        {result.note}
      </p>
      {spec.comparison && (
        <div className={styles.seriesKeys}>
          <span>● {spec.metric}</span>
          <span>● {spec.comparison}</span>
        </div>
      )}
      <WidgetChart
        {...result}
        style={spec.style}
        preferences={session.dashboard}
        onSelect={onSelect}
      />
      {spec.metric === "costs" &&
        spec.style === "pie" &&
        session.workspace.issues.some((issue) => !issue.resolved) && (
          <button type="button" className={styles.reviewHint} onClick={onDocuments}>
            Review held figures <span aria-hidden="true">↗</span>
          </button>
        )}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
function TargetCard({
  amount,
  income,
  onSelect,
}: {
  amount: number;
  income: DashboardFact;
  onSelect(f: DashboardFact): void;
}) {
  const { session } = useSession();
  if (!session) return null;
  const percentage = income.value === null ? null : ratioTenths(income.value, amount);
  return (
    <button type="button" className={styles.target} onClick={() => onSelect(income)}>
      <span className="rs-eyebrow">Your income target</span>
      <h2>
        {percentage === null ? "Awaiting figures" : `${(percentage / 10).toFixed(1)}% of your goal`}
      </h2>
      <p>
        {income.value === null
          ? "Unavailable"
          : formatDisplayAmount(income.value, session.dashboard)}{" "}
        / {formatDisplayAmount(amount, session.dashboard)}
      </p>
      <span className={styles.targetTrack}>
        <i style={{ width: `${Math.min(100, Math.max(0, (percentage ?? 0) / 10))}%` }} />
      </span>
      <small>Visitor-defined target · current period</small>
    </button>
  );
}
function Customize({
  onAdd,
  onRestore,
  disabled,
}: {
  onAdd(w: DashboardWidget): void;
  onRestore(): void;
  disabled: boolean;
}) {
  const [dialog, setDialog] = useState<"kpi" | "chart" | "target" | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <div className={styles.customization}>
        <span>Make room for what matters.</span>
        <div>
          <button type="button" disabled={disabled} onClick={() => setDialog("kpi")}>
            + KPI
          </button>
          <button type="button" disabled={disabled} onClick={() => setDialog("chart")}>
            + Chart
          </button>
          <button type="button" disabled={disabled} onClick={() => setDialog("target")}>
            + Target
          </button>
          <button type="button" onClick={onRestore}>
            Restore layout
          </button>
        </div>
      </div>
      <PaperDialog
        open={dialog !== null}
        title={
          dialog === "kpi"
            ? "Add a KPI."
            : dialog === "target"
              ? "Set your income target."
              : "Build your chart."
        }
        onClose={() => {
          setDialog(null);
          setError(null);
        }}
      >
        <form
          className={styles.widgetForm}
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            try {
              const id = `widget_${crypto.randomUUID()}`;
              const widget: DashboardWidget =
                dialog === "target"
                  ? {
                      id,
                      kind: "target",
                      metric: "income",
                      amountMinor: parseAmount(String(data.get("target"))),
                    }
                  : dialog === "kpi"
                    ? { id, kind: "kpi", metric: dashboardMetricSchema.parse(data.get("metric")) }
                    : {
                        id,
                        kind: "chart",
                        spec: chartSpecSchema.parse({
                          title: data.get("title"),
                          metric: data.get("metric"),
                          style: data.get("style"),
                          groupBy: data.get("groupBy"),
                          range: data.get("range"),
                          comparison: null,
                        }),
                      };
              if (widget.kind === "target" && widget.amountMinor <= 0)
                throw new RangeError("Enter a positive USD target.");
              onAdd(widget);
              setDialog(null);
              setError(null);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Check the widget details.");
            }
          }}
        >
          {dialog === "target" ? (
            <label>
              Income target · source USD
              <input name="target" inputMode="decimal" required placeholder="5000.00" />
            </label>
          ) : (
            <>
              <label>
                Metric
                <select name="metric">
                  {(dialog === "chart"
                    ? ["income", "costs", "profit", "cash_in", "cash_out", "cash_net"]
                    : dashboardMetricSchema.options
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              {dialog === "chart" && (
                <>
                  <label>
                    Title
                    <input name="title" required maxLength={80} defaultValue="My financial view" />
                  </label>
                  <label>
                    Style
                    <select name="style">
                      <option value="line">Line</option>
                      <option value="curve">Curve</option>
                      <option value="bar">Bar</option>
                      <option value="pie">Pie / donut</option>
                    </select>
                  </label>
                  <label>
                    Group by
                    <select name="groupBy">
                      <option value="month">Month</option>
                      <option value="quarter">Quarter</option>
                      <option value="category">Category</option>
                      <option value="counterparty">Counterparty</option>
                    </select>
                  </label>
                  <label>
                    Period
                    <select name="range">
                      <option value="scope">Current filters</option>
                      <option value="history">All supplied history</option>
                    </select>
                  </label>
                </>
              )}
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <button type="submit">Add to dashboard →</button>
        </form>
      </PaperDialog>
    </>
  );
}
