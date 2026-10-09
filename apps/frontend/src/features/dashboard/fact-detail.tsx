"use client";
import type { SourceReference } from "@retrosum/contracts";
import { formatAmount, type DashboardFact, type FactMark } from "@retrosum/money";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { factValue } from "./format";
import styles from "./fact-detail.module.css";
import chartStyles from "./dashboard.module.css";
import { RankedBars, DataTable } from "./charts";

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

export function FactDetail({
  fact,
  originalRevision,
  onClose,
  onSource,
  sourceName,
  counterpartyName,
  reconciliation,
  facts,
  onSelect,
}: {
  fact: DashboardFact;
  originalRevision: number;
  onClose(): void;
  onSource(source: SourceReference): void;
  sourceName(id: string): string;
  counterpartyName?: (id: string) => string;
  reconciliation?: FactMark[] | undefined;
  facts: Record<string, DashboardFact>;
  onSelect(id: string): void;
}) {
  const sourceButtons = (sources: SourceReference[]) =>
    sources.map((source) => (
      <button
        type="button"
        className={styles.sourceChip}
        key={JSON.stringify(source)}
        onClick={() => onSource(source)}
      >
        <span>
          {sourceName(source.documentId)}
          <small>
            Page {source.page}
            {source.rowId ? " · " + source.rowId : ""}
          </small>
        </span>
        <span className={styles.sourceArrow} aria-hidden="true">
          ↗
        </span>
      </button>
    ));
  return (
    <PaperDialog
      open
      size="paper"
      title={fact.label}
      caption="Behind the number"
      className={styles.dialog}
      onClose={onClose}
    >
      <div className={styles.detail}>
        <section className={styles.summary} aria-label="Metric summary">
          <div className={styles.summaryValue}>
            <span className={styles.eyebrow}>This figure</span>
            <strong>{factValue(fact)}</strong>
            <span className={styles.unit}>
              {fact.unit === "money"
                ? "USD · Source amount"
                : fact.unit === "percent"
                  ? "Percentage"
                  : "Count"}
            </span>
          </div>
          <div className={styles.summaryContext}>
            <span className={styles.eyebrow}>Reporting period</span>
            <p>
              {displayDate(fact.scope.from)} – {displayDate(fact.scope.to)}
            </p>
            <div className={styles.counts}>
              <span>
                <b>{fact.contributors.length}</b> included
              </span>
              <span>
                <b>{fact.excluded.length}</b> excluded / unavailable
              </span>
            </div>
          </div>
        </section>
        {originalRevision !== fact.scope.revision && (
          <p className={styles.notice} role="status">
            Updated to revision {fact.scope.revision}. These contributors and the dashboard now
            reflect the same current records.
          </p>
        )}
        {fact.unavailable && <p className={styles.notice}>{fact.unavailable}</p>}
        <section className={styles.calculation} aria-label="Calculation and amount basis">
          <span className={styles.eyebrow}>How it is calculated</span>
          <p className={styles.formula}>{fact.formula}</p>
          {fact.id === "profit" && facts.income && facts.costs && (
            <div className={styles.calculationTerms}>
              {[facts.income, facts.costs, fact].map((term, index) => (
                <div key={term.id}>
                  {index > 0 && (
                    <span className={styles.operator} aria-hidden="true">
                      {index === 1 ? "−" : "="}
                    </span>
                  )}
                  <span>{term.label}</span>
                  <strong>{factValue(term)}</strong>
                </div>
              ))}
            </div>
          )}
          <p className={styles.basis}>
            <b>Amount basis</b>
            {fact.basis}
          </p>
        </section>
        <div className={styles.contextGrid}>
          <section className={styles.contextCard}>
            <h3>Date basis</h3>
            <p>
              {fact.dateBasis === "as_of"
                ? "Event dates in range; settlement and due status as of " +
                  displayDate(fact.scope.asOf)
                : fact.dateBasis === "payment"
                  ? "Actual movement date"
                  : fact.dateBasis === "collection"
                    ? "Whole collection, independent of date filters"
                    : "Documented event date"}
            </p>
          </section>
          <section className={styles.contextCard}>
            <h3>Filters & coverage</h3>
            <dl className={styles.filterFacts}>
              <div>
                <dt>Category</dt>
                <dd>{fact.scope.category ?? "All categories"}</dd>
              </div>
              <div>
                <dt>Counterparty</dt>
                <dd>
                  {fact.scope.counterpartyId
                    ? (counterpartyName?.(fact.scope.counterpartyId) ?? "Selected counterparty")
                    : "All counterparties"}
                </dd>
              </div>
            </dl>
            <p className={styles.coverage}>Supplied records only · Source currency USD</p>
          </section>
        </div>
        {reconciliation && (
          <section className={styles.paperBridge}>
            <h3>Profit reconciliation</h3>
            <p>
              Income less each documented cost category equals the preview. Deductions retain their
              negative signs.
            </p>
            <RankedBars
              marks={reconciliation}
              facts={facts}
              onSelect={onSelect}
              colors={["var(--rs-income)", "var(--rs-cost)"]}
            />
            <details className={chartStyles.data}>
              <summary>View reconciliation data</summary>
              <DataTable marks={reconciliation} facts={facts} onSelect={onSelect} />
            </details>
          </section>
        )}
        <section className={styles.recordSection} aria-labelledby="fact-included-heading">
          <header className={styles.sectionHeading}>
            <h3 id="fact-included-heading">
              Included {fact.unit === "count" ? "sources" : "records"}
            </h3>
            <span>{fact.contributors.length}</span>
          </header>
          <div className={styles.recordList}>
            {fact.contributors.map((row) => (
              <article key={row.id} className={styles.detailRow}>
                <div className={styles.recordHeading}>
                  <h4>{row.label}</h4>
                  {fact.unit !== "count" && (
                    <div className={styles.rowAmount} data-negative={row.amountMinor < 0}>
                      <span>Contribution</span>
                      <strong>{formatAmount(row.amountMinor)}</strong>
                    </div>
                  )}
                </div>
                <dl className={styles.recordFacts}>
                  {row.party && (
                    <div>
                      <dt>Counterparty</dt>
                      <dd>{row.party}</dd>
                    </div>
                  )}
                  {row.date && (
                    <div>
                      <dt>Date</dt>
                      <dd>{displayDate(row.date)}</dd>
                    </div>
                  )}
                  {row.category && (
                    <div>
                      <dt>Category</dt>
                      <dd>{row.category}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Amount basis</dt>
                    <dd>{row.basis.replaceAll("_", " ")}</dd>
                  </div>
                  {row.grossMinor !== undefined && (
                    <>
                      <div>
                        <dt>Source gross</dt>
                        <dd>{formatAmount(row.grossMinor)}</dd>
                      </div>
                      <div>
                        <dt>Source tax</dt>
                        <dd>
                          {row.taxMinor === undefined
                            ? "Not separately stated"
                            : formatAmount(row.taxMinor)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
                {row.note && (
                  <p className={styles.recordNote}>
                    <b>Record note</b>
                    {row.note}
                  </p>
                )}
                <div className={styles.sources}>
                  <span className={styles.eyebrow}>Original documents</span>
                  <div>{sourceButtons(row.sources)}</div>
                  {row.sources.length === 0 && (
                    <p>Created in this browser session; no PDF source.</p>
                  )}
                </div>
              </article>
            ))}
            {fact.contributors.length === 0 && (
              <p className={styles.empty}>
                No contributing records.{" "}
                {fact.unavailable ?? "This is a zero within the supplied known slice."}
              </p>
            )}
          </div>
        </section>
        <section className={styles.recordSection} aria-labelledby="fact-excluded-heading">
          <header className={styles.sectionHeading} data-excluded="true">
            <h3 id="fact-excluded-heading">Excluded / unavailable</h3>
            <span>{fact.excluded.length}</span>
          </header>
          <div className={styles.recordList}>
            {fact.excluded.map((row) => (
              <article key={row.id} className={styles.excludedRow}>
                <div className={styles.recordHeading}>
                  <h4>{row.label}</h4>
                  <span className={styles.excludedBadge}>Not included</span>
                </div>
                <p className={styles.excludedReason}>{row.reason}</p>
                {row.sources.length > 0 && (
                  <div className={styles.sources}>
                    <span className={styles.eyebrow}>Original documents</span>
                    <div>{sourceButtons(row.sources)}</div>
                  </div>
                )}
              </article>
            ))}
            {fact.excluded.length === 0 && (
              <p className={styles.empty}>
                No additional exclusions within this fact’s recorded scope. Missing documents are
                outside this preview.
              </p>
            )}
          </div>
        </section>
        {fact.issues.length > 0 && (
          <aside className={styles.notice}>
            <h3>Review notes · {fact.issues.length}</h3>
            <ul>
              {fact.issues.map((issue) => (
                <li key={issue.id}>
                  <strong>{issue.documentIds.map(sourceName).join(" · ")}</strong>
                  <p>{issue.message}</p>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <p className={styles.detailFootnote}>
          Sources are evidence, not a complete set of business accounts. Opening a source never
          changes the ledger.
          <span>Source snapshot · Revision {fact.scope.revision}</span>
        </p>
      </div>
    </PaperDialog>
  );
}
