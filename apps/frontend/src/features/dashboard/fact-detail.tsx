"use client";
import type { SourceReference } from "@retrosum/contracts";
import { formatAmount, type DashboardFact, type FactMark } from "@retrosum/money";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { factValue } from "./format";
import styles from "./dashboard.module.css";
import { RankedBars, DataTable } from "./charts";

export function FactDetail({
  fact,
  originalRevision,
  onClose,
  onSource,
  sourceName,
  reconciliation,
  facts,
  onSelect,
}: {
  fact: DashboardFact;
  originalRevision: number;
  onClose(): void;
  onSource(source: SourceReference): void;
  sourceName(id: string): string;
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
        {sourceName(source.documentId)} · p. {source.page}
        {source.rowId ? ` · ${source.rowId}` : ""}
      </button>
    ));
  return (
    <PaperDialog
      open
      size="paper"
      title={fact.label}
      caption={`Exact contributors · Revision ${fact.scope.revision}`}
      onClose={onClose}
    >
      <div className={styles.detail}>
        <div className={styles.detailValue}>
          <strong>{factValue(fact)}</strong>
          <span>
            USD · {fact.scope.from} – {fact.scope.to}
          </span>
        </div>
        {originalRevision !== fact.scope.revision && (
          <p className={styles.notice} role="status">
            Updated to revision {fact.scope.revision}. These contributors and the dashboard now
            reflect the same current records.
          </p>
        )}
        <p>{fact.unavailable ?? fact.basis}</p>
        <dl className={styles.formula}>
          <div>
            <dt>Formula</dt>
            <dd>{fact.formula}</dd>
          </div>
          <div>
            <dt>Date basis</dt>
            <dd>
              {fact.dateBasis === "as_of"
                ? `Event dates in range; settlement and due status as of ${fact.scope.asOf}`
                : fact.dateBasis === "payment"
                  ? "Actual movement date"
                  : fact.dateBasis === "collection"
                    ? "Whole collection, independent of date filters"
                    : "Documented event date"}
            </dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>
              {fact.scope.category ?? "All categories"} ·{" "}
              {fact.scope.counterpartyId ? "Selected counterparty" : "All counterparties"} ·
              Supplied records only
            </dd>
          </div>
        </dl>
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
            <details className={styles.data}>
              <summary>View reconciliation data</summary>
              <DataTable marks={reconciliation} facts={facts} onSelect={onSelect} />
            </details>
          </section>
        )}
        <h3>
          Included {fact.unit === "count" ? "sources" : "records"} · {fact.contributors.length}
        </h3>
        {fact.contributors.map((row) => (
          <article key={row.id} className={styles.detailRow}>
            <div>
              <h4>{row.label}</h4>
              <p>{[row.party, row.date, row.category].filter(Boolean).join(" · ")}</p>
              <small>
                {row.basis}
                {row.note ? ` · ${row.note}` : ""}
              </small>
              {sourceButtons(row.sources)}
              {row.sources.length === 0 && (
                <small>Created in this browser session; no PDF source.</small>
              )}
            </div>
            <div className={styles.rowAmount}>
              {fact.unit !== "count" && <strong>{formatAmount(row.amountMinor)}</strong>}
              {row.grossMinor !== undefined && (
                <small>
                  Gross {formatAmount(row.grossMinor)}
                  {row.taxMinor === undefined
                    ? " · Tax not separately stated"
                    : ` · Tax ${formatAmount(row.taxMinor)}`}
                </small>
              )}
            </div>
          </article>
        ))}
        {fact.contributors.length === 0 && (
          <p>
            No contributing records.{" "}
            {fact.unavailable ?? "This is a zero within the supplied known slice."}
          </p>
        )}
        <h3>Excluded / unavailable · {fact.excluded.length}</h3>
        {fact.excluded.map((row) => (
          <article key={row.id} className={styles.detailRow}>
            <div>
              <h4>{row.label}</h4>
              <p>{row.reason}</p>
              {sourceButtons(row.sources)}
            </div>
          </article>
        ))}
        {fact.excluded.length === 0 && (
          <p>
            No additional exclusions within this fact’s recorded scope. Missing documents are
            outside this preview.
          </p>
        )}
        {fact.issues.length > 0 && (
          <aside className={styles.notice}>
            <h3>Applicable review issues</h3>
            {fact.issues.map((issue) => (
              <p key={issue.id}>{issue.message}</p>
            ))}
          </aside>
        )}
        <p className={styles.detailFootnote}>
          Sources are evidence, not a complete set of business accounts. Opening a source never
          changes the ledger.
        </p>
      </div>
    </PaperDialog>
  );
}
