"use client";
import { useMemo, useState } from "react";
import { contactIdSchema, type SourceReference } from "@retrosum/contracts";
import { buildDashboard, formatAmount, type FactMark } from "@retrosum/money";
import { Button } from "../../components/ui/button";
import { useSession } from "../session/session-provider";
import { OriginalViewer } from "../documents/original-viewer";
import { ChartPanel, DataTable, FactTooltip, GroupedBars, RankedBars } from "./charts";
import { FactDetail } from "./fact-detail";
import { colorFor, factValue, percentage, periodLabel, shortDate } from "./format";
import styles from "./dashboard.module.css";

export function Dashboard({ onDocuments }: { onDocuments(): void }) {
  const { controller, session, ready, notice, persistence } = useSession();
  const [detail, setDetail] = useState<{ id: string; revision: number } | null>(null);
  const [source, setSource] = useState<SourceReference | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const catalogue = useMemo(
    () => (session ? buildDashboard(session.workspace, session.filters) : null),
    [session],
  );
  if (!ready || !session || !catalogue)
    return <p role="status">Opening your private browser workspace…</p>;
  const workspace = session.workspace;
  const { facts, scope } = catalogue;
  const select = (id: string) => {
    setDetail({ id, revision: workspace.revision });
    setHovered(null);
  };
  const table = (marks: FactMark[]) => <DataTable marks={marks} facts={facts} onSelect={select} />;
  const currentDetail = detail ? facts[detail.id] : undefined;
  const allCategories = [...new Set(workspace.events.map((row) => row.category))].sort();
  const change = (key: string) => catalogue.changes.find((row) => row.key === key);
  const cards = (keys: string[], headline = false) => (
    <div className={headline ? styles.headlines : styles.band}>
      {keys.map((key) => {
        const fact = facts[key]!;
        const comparison = change(key);
        return (
          <button
            className={`${styles.metric} ${key === "profit" ? styles.featured : ""}`}
            type="button"
            key={key}
            onClick={() => select(key)}
            id={`metric-${key}`}
          >
            <span className={styles.metricLabel}>
              {fact.label}
              <span aria-hidden="true">↗</span>
            </span>
            <strong className={fact.value !== null && fact.value < 0 ? styles.negative : ""}>
              {factValue(fact)}
            </strong>
            <small>
              {key === "margin"
                ? "Of supplied invoiced income"
                : key.includes("open")
                  ? `Gross · as of ${scope.asOf}`
                  : key.startsWith("cash")
                    ? "Operating movements · payment dates"
                    : key === "overdue"
                      ? `Known open · as of ${scope.asOf}`
                      : "Document view · event dates"}
            </small>
            {comparison && (
              <span className={styles.change}>
                {comparison.changeTenths === null
                  ? "Prior comparison unavailable"
                  : `${comparison.changeTenths >= 0 ? "+" : ""}${percentage(comparison.changeTenths)} vs prior supplied period`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
  const chartGroups = catalogue.trend.map((group) => ({
    label: periodLabel(
      group.marks[0] ? facts[group.marks[0].factId]!.scope.from : scope.from,
      group.marks[0] ? facts[group.marks[0].factId]!.scope.to : scope.to,
    ),
    marks: group.marks,
  }));
  const trendTable = chartGroups.flatMap((group) =>
    group.marks.map((mark) => ({ ...mark, label: `${group.label} · ${mark.label}` })),
  );
  const catColors = catalogue.categories.map((mark) => colorFor(mark.label));
  const denominator = facts.costs!.value;
  return (
    <section className={styles.dashboard} aria-labelledby="overview-heading" id="overview">
      <header className={styles.context}>
        <div>
          <span className="rs-eyebrow rs-muted">
            {workspace.business.name} · Financial overview
          </span>
          <h1 id="overview-heading">
            A little clarity.
            <br />
            <em>A bigger picture.</em>
          </h1>
          <p>{periodLabel(scope.from, scope.to)} · USD · Document-based preview</p>
        </div>
        <div className={styles.contextRight}>
          <span className={styles.mode}>
            {workspace.documents.some((doc) => doc.recognitionMode === "fake")
              ? "Simulated AI · real local calculations"
              : "Browser session · supplied records"}
          </span>
          <span>
            {persistence === "ready" ? "Refresh recovery ready" : "Memory only"} · Revision{" "}
            {scope.revision}
          </span>
          {catalogue.latestEditRevision > 0 && (
            <span>Latest record edit: revision {catalogue.latestEditRevision}</span>
          )}
        </div>
      </header>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <div className={styles.scopeLine}>
        <span>
          <i aria-hidden="true" />
          {catalogue.includedEventCount} included events · {catalogue.pendingIssueCount} review
          issues
        </span>
        <button type="button" onClick={onDocuments}>
          Inspect your documents <span aria-hidden="true">↗</span>
        </button>
      </div>
      <details className={styles.filters}>
        <summary>
          Period & scope{" "}
          {scope.category || scope.counterpartyId
            ? "· Filtered"
            : "· All categories & counterparties"}
        </summary>
        <form
          key={`${scope.from}:${scope.to}:${scope.asOf}:${scope.category ?? ""}:${scope.counterpartyId ?? ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const category = String(data.get("category"));
            const party = String(data.get("party"));
            setError(null);
            try {
              controller.setFilters({
                from: String(data.get("from")),
                to: String(data.get("to")),
                asOf: String(data.get("asOf")),
                register: session.filters.register,
                ...(category ? { category } : {}),
                ...(party ? { counterpartyId: contactIdSchema.parse(party) } : {}),
              });
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "The scope is invalid.");
            }
          }}
        >
          <label>
            From
            <input name="from" type="date" required defaultValue={scope.from} />
          </label>
          <label>
            Through
            <input name="to" type="date" required defaultValue={scope.to} />
          </label>
          <label>
            As of
            <input name="asOf" type="date" required defaultValue={scope.asOf} />
          </label>
          <label>
            Category
            <select name="category" defaultValue={scope.category ?? ""}>
              <option value="">All categories</option>
              {allCategories.map((name) => (
                <option key={name}>{name}</option>
              ))}
              {scope.category && !allCategories.includes(scope.category) && (
                <option>{scope.category}</option>
              )}
            </select>
          </label>
          <label>
            Counterparty
            <select name="party" defaultValue={scope.counterpartyId ?? ""}>
              <option value="">All counterparties</option>
              {workspace.contacts.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
              {scope.counterpartyId &&
                !workspace.contacts.some((row) => row.id === scope.counterpartyId) && (
                  <option value={scope.counterpartyId}>Removed counterparty</option>
                )}
            </select>
          </label>
          <Button variant="warm" type="submit">
            Apply scope
          </Button>
        </form>
        {error && <p role="alert">{error}</p>}
        {(scope.category || scope.counterpartyId || scope.asOf !== workspace.asOf) && (
          <button
            type="button"
            className={styles.textAction}
            onClick={() =>
              controller.setFilters({
                from: scope.from,
                to: scope.to,
                register: session.filters.register,
              })
            }
          >
            Clear category, counterparty & as-of filters
          </button>
        )}
        <p>
          Dates use documented event dates; cash uses movement dates. Open items use the selected
          event range and as-of date. Category scope cannot establish attributed cash. Coverage is
          the whole collection.
        </p>
      </details>
      {workspace.events.length === 0 && (
        <div className={styles.emptyWelcome}>
          <span aria-hidden="true">✦</span>
          <h2>Good numbers start with good sources.</h2>
          <p>
            Process the sample PDFs or add your own documents. Your overview begins empty and grows
            from the evidence you provide.
          </p>
          <Button variant="warm" onClick={onDocuments}>
            Start with documents ↗
          </Button>
        </div>
      )}
      {cards(["income", "costs", "profit", "margin"], true)}
      <div className={styles.primaryGrid}>
        <ChartPanel
          title="The shape of your month"
          subtitle="Invoiced income, documented costs & profit. Discrete supplied periods; no invented history."
          table={table(trendTable)}
        >
          <GroupedBars
            groups={chartGroups}
            facts={facts}
            colors={["var(--rs-income)", "var(--rs-cost)", "var(--rs-comparison)"]}
            onSelect={select}
            signed
          />
          {catalogue.changes.some((row) => row.differenceMinor !== null) && (
            <div className={styles.comparisons}>
              {catalogue.changes.map((row) => (
                <button key={row.key} type="button" onClick={() => select(row.priorFactId)}>
                  <span>{row.label} change</span>
                  <b>
                    {row.changeTenths === null
                      ? "Unavailable"
                      : `${row.changeTenths >= 0 ? "+" : ""}${percentage(row.changeTenths)}`}
                  </b>
                  <small>
                    {row.differenceMinor === null
                      ? row.reason
                      : `${row.differenceMinor >= 0 ? "+" : ""}${formatAmount(row.differenceMinor)} · inspect prior records`}
                  </small>
                </button>
              ))}
            </div>
          )}
        </ChartPanel>
        <ChartPanel
          title="Where costs go"
          subtitle="Compatible documented costs, grouped by category. Tap a segment or a category."
          table={table(catalogue.categories)}
        >
          <div className={styles.donutWrap}>
            {denominator !== null &&
            denominator > 0 &&
            catalogue.categories.every((mark) => mark.value >= 0) ? (
              <svg
                className={styles.donut}
                viewBox="0 0 240 240"
                role="group"
                aria-label="Cost composition"
              >
                <circle
                  cx="120"
                  cy="120"
                  r="88"
                  fill="none"
                  stroke="var(--rs-line)"
                  strokeWidth="24"
                />
                {catalogue.categories.map((mark, index) => {
                  const length = (mark.value / denominator) * 100;
                  const start =
                    (catalogue.categories.slice(0, index).reduce((sum, row) => sum + row.value, 0) /
                      denominator) *
                    100;
                  return (
                    <circle
                      key={mark.factId}
                      cx="120"
                      cy="120"
                      r="88"
                      fill="none"
                      stroke={catColors[index]}
                      strokeWidth="24"
                      pathLength="100"
                      strokeDasharray={`${length} ${100 - length}`}
                      strokeDashoffset={-start}
                      transform="rotate(-90 120 120)"
                      role="button"
                      tabIndex={0}
                      className={styles.slice}
                      aria-label={`${mark.label}, ${formatAmount(mark.value)}, ${percentage(mark.shareTenths ?? 0)}, view records`}
                      onMouseEnter={() => setHovered(mark.factId)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(mark.factId)}
                      onBlur={() => setHovered(null)}
                      onClick={() => select(mark.factId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          select(mark.factId);
                        }
                      }}
                    />
                  );
                })}
                <text x="120" y="112" textAnchor="middle" className={styles.donutCaption}>
                  DOCUMENT COSTS
                </text>
                <text x="120" y="141" textAnchor="middle" className={styles.donutValue}>
                  {formatAmount(denominator)}
                </text>
              </svg>
            ) : (
              <div className={styles.chartEmpty}>
                Composition unavailable without a positive, compatible cost whole.
              </div>
            )}
          </div>
          <div className={styles.categoryList}>
            {catalogue.categories.map((mark, index) => (
              <button
                key={mark.factId}
                type="button"
                onClick={() => select(mark.factId)}
                onMouseEnter={() => setHovered(mark.factId)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(mark.factId)}
                onBlur={() => setHovered(null)}
              >
                <i style={{ background: catColors[index] }} aria-hidden="true" />
                <b>{mark.label}</b>
                <span>{formatAmount(mark.value)}</span>
                <small>{mark.shareTenths === null ? "—" : percentage(mark.shareTenths)}</small>
              </button>
            ))}
          </div>
          <FactTooltip
            fact={hovered ? (facts[hovered] ?? null) : null}
            shareTenths={catalogue.categories.find((mark) => mark.factId === hovered)?.shareTenths}
          />
        </ChartPanel>
      </div>
      <div className={styles.sectionHeading}>
        <span className="rs-eyebrow rs-muted">The movements behind the documents</span>
        <h2>Cash has its own story.</h2>
        <p>
          Supplied payment evidence, separate from income and costs. This is movement, not a bank
          balance.
        </p>
      </div>
      {cards(["cash_in", "cash_out", "cash_net"])}
      <div className={styles.secondaryGrid}>
        <ChartPanel
          title="Recorded cash movement"
          subtitle="Actual supplied payment dates. Owned transfers are excluded and disclosed in the detail."
          table={table(
            catalogue.cashSeries.flatMap((group) =>
              group.marks.map((mark) => ({ ...mark, label: `${group.label} · ${mark.label}` })),
            ),
          )}
        >
          <GroupedBars
            groups={catalogue.cashSeries.map((group) => ({
              ...group,
              label:
                group.from === group.to
                  ? shortDate(group.from)
                  : `${shortDate(group.from)} – ${shortDate(group.to)}`,
            }))}
            facts={facts}
            colors={["var(--rs-cash)", "var(--rs-cost)"]}
            onSelect={select}
          />
        </ChartPanel>
        <section className={`${styles.panel} ${styles.story}`}>
          <span className="rs-eyebrow">Locally calculated summary</span>
          <h2>
            From paper,
            <br />
            to perspective.
          </h2>
          <p>
            {facts.profit!.value === null
              ? "Your financial story is waiting for its first source-backed records."
              : `The supplied slice records ${factValue(facts.income!)} income and ${factValue(facts.costs!)} costs, giving a ${factValue(facts.profit!)} ${facts.profit!.label.toLowerCase()}.`}
          </p>
          <p>
            {catalogue.categories[0]
              ? `${catalogue.categories[0].label} contributes ${formatAmount(catalogue.categories[0].value)}${catalogue.categories[0].shareTenths === null ? "" : `, ${percentage(catalogue.categories[0].shareTenths)} of documented costs`}.`
              : "Missing cost documents stay outside this preview."}
          </p>
          <button type="button" className={styles.textAction} onClick={() => select("profit")}>
            Walk through the profit bridge ↗
          </button>
          <span className={styles.storyFootnote}>
            {catalogue.includedEventCount} events in this date range ·{" "}
            {catalogue.unknownSettlementCount} unknown settlement states ·{" "}
            {catalogue.pendingIssueCount} collection review issues
          </span>
        </section>
      </div>
      <div className={styles.sectionHeading}>
        <span className="rs-eyebrow rs-muted">Known amounts · gross basis</span>
        <h2>What’s still open.</h2>
        <p>
          Due status as of {scope.asOf}. Unknown settlement is counted separately, never guessed.
        </p>
      </div>
      {cards(["customer_open", "supplier_open", "overdue"])}
      <div className={styles.secondaryGrid}>
        {catalogue.ageing.map((group, index) => (
          <ChartPanel
            key={group.label}
            title={group.label}
            subtitle={`${factValue(facts[index === 0 ? "customer_soon" : "supplier_soon"]!)} due within 7 days · inclusive of as-of through seven days later.`}
            table={table(group.marks)}
          >
            <button
              type="button"
              className={styles.dueSoon}
              onClick={() => select(index === 0 ? "customer_soon" : "supplier_soon")}
            >
              Inspect due-soon items ↗
            </button>
            <RankedBars
              marks={group.marks}
              facts={facts}
              colors={[index === 0 ? "var(--rs-income)" : "var(--rs-cost)"]}
              onSelect={select}
            />
          </ChartPanel>
        ))}
      </div>
      <div className={styles.sectionHeading}>
        <span className="rs-eyebrow rs-muted">The people behind the figures</span>
        <h2>Customers & counterparties.</h2>
      </div>
      <div className={styles.secondaryGrid}>
        <ChartPanel
          title="Customer contributions"
          subtitle="Issued income on the documented basis. Every bar opens its exact invoices."
          table={table(catalogue.customers)}
        >
          <RankedBars
            marks={catalogue.customers}
            facts={facts}
            onSelect={select}
            colors={["var(--rs-income)", "var(--rs-cash)"]}
          />
        </ChartPanel>
        <ChartPanel
          title="Vendor contributions"
          subtitle="Documented cost basis, separate from gross supplier amounts due."
          table={table(catalogue.vendors)}
        >
          <RankedBars
            marks={catalogue.vendors}
            facts={facts}
            onSelect={select}
            colors={["var(--rs-cost)", "var(--rs-comparison)"]}
          />
        </ChartPanel>
      </div>
      <ChartPanel
        title="Every source accounted for"
        subtitle={`${workspace.documents.length} originals across the whole collection · ${catalogue.includedEventCount} included events in this date range. Source counts are not event counts or AI confidence.`}
        table={table(catalogue.coverage)}
      >
        <div className={styles.coverageBar} aria-hidden="true">
          {catalogue.coverage.map((mark, index) =>
            mark.value > 0 ? (
              <i
                key={mark.factId}
                style={{
                  flex: mark.value,
                  background: [
                    "var(--rs-income)",
                    "var(--rs-review)",
                    "var(--rs-danger)",
                    "var(--rs-comparison)",
                    "var(--rs-cash)",
                  ][index],
                }}
              />
            ) : null,
          )}
        </div>
        <div className={styles.coverage} aria-label="Document coverage">
          {catalogue.coverage.map((mark, index) => (
            <button
              key={mark.factId}
              type="button"
              onClick={() => select(mark.factId)}
              style={
                {
                  "--coverage-color": [
                    "var(--rs-income)",
                    "var(--rs-review)",
                    "var(--rs-danger)",
                    "var(--rs-comparison)",
                    "var(--rs-cash)",
                  ][index],
                } as React.CSSProperties
              }
            >
              <i aria-hidden="true" />
              <b>{mark.value}</b>
              <span>{mark.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.coverageActions}>
          <button type="button" onClick={onDocuments}>
            Open documents & review ↗
          </button>
          <button type="button" onClick={() => select("tax")}>
            Explicit tax: {factValue(facts.tax!)} ↗
          </button>
        </div>
        <p className={styles.caption}>
          Account balance, forecasts and tax liability are unavailable from this document slice.
        </p>
      </ChartPanel>
      <footer className={styles.dashboardFooter}>
        <span>Revision {scope.revision} · Exact integer cents · USD</span>
        <span>
          Document view · {scope.from} through {scope.to}
        </span>
      </footer>
      {currentDetail && !source && (
        <FactDetail
          fact={currentDetail}
          originalRevision={detail!.revision}
          onClose={() => setDetail(null)}
          onSource={setSource}
          reconciliation={
            detail!.id === "profit" || detail!.id === "margin" ? catalogue.profitBridge : undefined
          }
          facts={facts}
          onSelect={select}
          sourceName={(id) =>
            workspace.documents.find((doc) => doc.id === id)?.name ?? "Original PDF"
          }
        />
      )}
      {detail && !currentDetail && !source && (
        <div role="status" className={styles.notice}>
          This selected group no longer has current records.{" "}
          <button type="button" onClick={() => setDetail(null)}>
            Dismiss detail
          </button>
        </div>
      )}
      {source && <OriginalViewer target={source} onClose={() => setSource(null)} />}
    </section>
  );
}
