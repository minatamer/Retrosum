"use client";
import { useState } from "react";
import type { SessionAction, SessionFilter, SourceReference } from "@retrosum/contracts";
import { calculateMetrics, formatAmount, invoiceAmounts } from "@retrosum/money";
import { Button } from "../../components/ui/button";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { useSession } from "../session/session-provider";
import { OriginalViewer } from "../documents/original-viewer";
import { RecordForm, type RecordSelection } from "./record-forms";
import styles from "./records.module.css";

const names: Record<SessionFilter["register"], string> = {
  invoices: "Invoices",
  costs: "Costs & bills",
  payments: "Payments",
  contacts: "Contacts",
};
export function RecordsWorkspace() {
  const { controller, session, ready, persistence, notice, missingDocumentIds } = useSession();
  const [selection, setSelection] = useState<{ value: RecordSelection; revision: number } | null>(
    null,
  );
  const [deletion, setDeletion] = useState<{
    action: SessionAction;
    label: string;
    impact: string;
    revision: number;
  } | null>(null);
  const [source, setSource] = useState<SourceReference | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!ready || !session)
    return (
      <section className={styles.section} aria-busy="true">
        <p role="status">Opening your private browser workspace…</p>
      </section>
    );
  const workspace = session.workspace;
  const result = calculateMetrics(workspace, session.filters);
  const family = session.filters.register;
  const act = (operation: () => void) => {
    setError(null);
    try {
      operation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This action could not be completed.");
    }
  };
  const edit = (value: RecordSelection) => {
    setError(null);
    setSelection({ value, revision: workspace.revision });
  };
  const sources = (references: SourceReference[]) =>
    references.map((reference) => (
      <button
        key={JSON.stringify(reference)}
        className={styles.textButton}
        type="button"
        onClick={() =>
          act(() => {
            setSource(reference);
          })
        }
      >
        Source PDF · p. {reference.page}
      </button>
    ));
  const remove = (action: SessionAction, label: string, impact: string) =>
    setDeletion({ action, label, impact, revision: workspace.revision });
  return (
    <section className={styles.section} id="records" aria-labelledby="records-heading">
      <div className={styles.heading}>
        <div>
          <span className="rs-eyebrow rs-muted">
            {workspace.business.name} · Revision {workspace.revision}
          </span>
          <h2 id="records-heading">A clear view of your records.</h2>
        </div>
        <span className={styles.sessionBadge}>
          {persistence === "ready" ? "Refresh recovery ready" : "Memory only"}
        </span>
      </div>
      <p className={styles.intro}>
        Create something, change it, and try Undo. Every imported figure traces to a visible PDF;
        held sources contribute only after review.
      </p>
      {notice && (
        <p className={styles.warning} role="status">
          {notice}
        </p>
      )}
      {missingDocumentIds.length > 0 && (
        <p className={styles.warning}>
          The original for {missingDocumentIds.length} uploaded{" "}
          {missingDocumentIds.length === 1 ? "PDF is" : "PDFs are"} missing from browser storage.
          Valid records are preserved; re-select originals before processing again.
        </p>
      )}
      <form
        className={styles.dateRange}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          act(() =>
            controller.setFilters({
              ...session.filters,
              from: String(data.get("from")),
              to: String(data.get("to")),
            }),
          );
        }}
        key={`${session.filters.from}-${session.filters.to}`}
      >
        <label className="rs-form-field">
          <span>From</span>
          <input name="from" type="date" required defaultValue={session.filters.from} />
        </label>
        <label className="rs-form-field">
          <span>To</span>
          <input name="to" type="date" required defaultValue={session.filters.to} />
        </label>
        <Button type="submit" variant="ghost">
          Apply dates
        </Button>
      </form>
      <div className={styles.metrics} aria-label="Current financial totals">
        <div>
          <span>Income</span>
          <strong>{formatAmount(result.income.minor)}</strong>
          <small>Net / stated document basis</small>
        </div>
        <div>
          <span>Costs</span>
          <strong>{formatAmount(result.costs.minor)}</strong>
          <small>Explicit tax shown separately</small>
        </div>
        <div>
          <span>Profit preview</span>
          <strong>{formatAmount(result.profitMinor)}</strong>
          <small>
            {result.marginTenths === null
              ? "Margin unavailable"
              : `${(result.marginTenths / 10).toFixed(1)}% margin`}
          </small>
        </div>
        <div>
          <span>Recorded cash movement</span>
          <strong>{formatAmount(result.netCashMinor)}</strong>
          <small>In less out · excludes transfers</small>
        </div>
      </div>
      <div className={styles.balanceLine}>
        <span>
          Customer open <b>{formatAmount(result.customerOpen.minor)}</b>
        </span>
        <span>
          Supplier open <b>{formatAmount(result.supplierOpen.minor)}</b>
        </span>
        <span>
          Explicit tax <b>{formatAmount(result.tax.minor)}</b>
        </span>
      </div>
      {(result.exclusions.unknownBalances.length > 0 ||
        result.exclusions.unknownNet.length > 0) && (
        <p className={styles.hint}>
          {result.exclusions.unknownBalances.length} records have unknown settlement.{" "}
          {result.exclusions.unknownNet.length} records are excluded from net totals because their
          net amount is unknown.
        </p>
      )}
      <div className={styles.toolbar}>
        <nav className={styles.tabs} aria-label="Record types">
          {Object.entries(names).map(([key, name]) => (
            <button
              key={key}
              type="button"
              aria-pressed={family === key}
              onClick={() =>
                act(() =>
                  controller.setFilters({
                    ...session.filters,
                    register: key as SessionFilter["register"],
                  }),
                )
              }
            >
              {name}
            </button>
          ))}
        </nav>
        <Button variant="warm" onClick={() => edit({ family })}>
          New{" "}
          {family === "invoices"
            ? "invoice"
            : family === "costs"
              ? "cost"
              : family === "payments"
                ? "payment"
                : "contact"}{" "}
          <span aria-hidden="true">＋</span>
        </Button>
      </div>
      <div className={styles.register} aria-label={`${names[family]} register`}>
        {family === "contacts" &&
          workspace.contacts.map((record) => (
            <article className={styles.record} key={record.id}>
              <div>
                <span className={styles.recordBadge}>{record.role}</span>
                <h3>{record.name}</h3>
                <p>{record.email || "No email supplied"}</p>
                <small>Session contact</small>
              </div>
              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => edit({ family, record })}>
                  Edit {record.name}
                </Button>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() =>
                    remove(
                      { type: "delete_contact", id: record.id },
                      `Delete ${record.name}`,
                      "Contacts still used by an invoice, cost or payment cannot be deleted. Update those relationships first.",
                    )
                  }
                >
                  Delete {record.name}
                </button>
              </div>
            </article>
          ))}
        {family === "invoices" &&
          workspace.invoices.map((record) => (
            <article className={styles.record} key={record.id}>
              <div>
                <span className={styles.recordBadge}>{record.status}</span>
                <h3>{record.number}</h3>
                <p>
                  {workspace.contacts.find((contact) => contact.id === record.customerId)?.name} ·{" "}
                  {record.issuedOn}
                </p>
                <small>
                  {record.dueOn ? `Due ${record.dueOn}` : "No due date"} ·{" "}
                  {record.origin === "document" ? "PDF source" : "Created in session"}
                  {record.editedAtRevision
                    ? ` · Edited at revision ${record.editedAtRevision}`
                    : ""}
                </small>
                <div>{sources(record.sources)}</div>
              </div>
              <div className={styles.recordRight}>
                <strong>{formatAmount(invoiceAmounts(record).grossMinor)}</strong>
                <small>Gross · {formatAmount(record.taxMinor)} tax</small>
                <div className={styles.actions}>
                  <Button variant="ghost" onClick={() => edit({ family, record })}>
                    Edit {record.number}
                  </Button>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => {
                      const matches = workspace.payments.filter((payment) =>
                        payment.allocations.some(
                          (allocation) => allocation.eventId === record.eventId,
                        ),
                      );
                      remove(
                        { type: "delete_invoice", id: record.id },
                        `Delete invoice ${record.number}`,
                        `Its ${record.status === "issued" ? "linked sale is also removed" : "draft has no posted sale"}. ${matches.length} payment matches will be removed; actual cash movements remain. Latest Undo restores the records and matches together.`,
                      );
                    }}
                  >
                    Delete {record.number}
                  </button>
                </div>
              </div>
            </article>
          ))}
        {family === "costs" &&
          workspace.events
            .filter((record) => record.kind === "cost")
            .map((record) => (
              <article className={styles.record} key={record.id}>
                <div>
                  <span className={styles.recordBadge}>
                    {record.status} · {record.balanceState}
                  </span>
                  <h3>{record.description}</h3>
                  <p>
                    {
                      workspace.contacts.find((contact) => contact.id === record.counterpartyId)
                        ?.name
                    }{" "}
                    · {record.occurredOn}
                  </p>
                  <small>
                    {record.category} ·{" "}
                    {record.origin === "document" ? "PDF source" : "Created in session"}
                    {record.editedAtRevision
                      ? ` · Edited at revision ${record.editedAtRevision}`
                      : ""}
                  </small>
                  <div>{sources(record.sources)}</div>
                </div>
                <div className={styles.recordRight}>
                  <strong>{formatAmount(record.amountMinor)}</strong>
                  <small>
                    Gross ·{" "}
                    {record.netMinor === undefined
                      ? "Net unknown"
                      : `${formatAmount(record.netMinor)} net`}
                  </small>
                  <div className={styles.actions}>
                    <Button variant="ghost" onClick={() => edit({ family, record })}>
                      Edit {record.description}
                    </Button>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => {
                        const count = workspace.payments.filter((payment) =>
                          payment.allocations.some(
                            (allocation) => allocation.eventId === record.id,
                          ),
                        ).length;
                        remove(
                          { type: "delete_event", id: record.id },
                          "Delete cost",
                          `${count} payment matches will be removed. Actual payment movements remain. Latest Undo restores this cost and its matches together.`,
                        );
                      }}
                    >
                      Delete {record.description}
                    </button>
                  </div>
                </div>
              </article>
            ))}
        {family === "payments" &&
          workspace.payments.map((record) => (
            <article className={styles.record} key={record.id}>
              <div>
                <span className={styles.recordBadge}>
                  {record.direction === "internal_transfer"
                    ? "Owned transfer"
                    : record.direction === "in"
                      ? "Money in"
                      : "Money out"}
                </span>
                <h3>{record.reference || "Unreferenced movement"}</h3>
                <p>
                  {record.occurredOn} · {record.allocations.length}{" "}
                  {record.allocations.length === 1 ? "match" : "matches"}
                </p>
                <small>
                  {record.origin === "document" ? "PDF source" : "Recorded in session"}
                  {record.editedAtRevision
                    ? ` · Edited at revision ${record.editedAtRevision}`
                    : ""}
                  {record.direction === "internal_transfer"
                    ? ` · ${record.fromAccount} → ${record.toAccount}`
                    : ""}
                </small>
                <div>{sources(record.sources)}</div>
              </div>
              <div className={styles.recordRight}>
                <strong>{formatAmount(record.amountMinor)}</strong>
                <div className={styles.actions}>
                  <Button variant="ghost" onClick={() => edit({ family, record })}>
                    Edit {record.reference}
                  </Button>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() =>
                      remove(
                        { type: "delete_payment", id: record.id },
                        `Delete payment ${record.reference}`,
                        `This removes the cash movement and its ${record.allocations.length} matches. Income and costs stay; evidenced open balances recalculate. Latest Undo restores the payment and matches.`,
                      )
                    }
                  >
                    Delete {record.reference}
                  </button>
                </div>
              </div>
            </article>
          ))}
        {(family === "contacts"
          ? workspace.contacts.length
          : family === "invoices"
            ? workspace.invoices.length
            : family === "costs"
              ? workspace.events.filter((record) => record.kind === "cost").length
              : workspace.payments.length) === 0 && (
          <div className={styles.empty}>
            <span aria-hidden="true">✦</span>
            <h3>
              {family === "contacts"
                ? "Start with a customer or vendor."
                : `Your ${names[family].toLowerCase()} will appear here.`}
            </h3>
            <p>
              {family === "contacts"
                ? "A name and role are enough to get started."
                : "Create a contact first, then add your records. There are no hidden sample figures in this session."}
            </p>
            {family !== "contacts" && (
              <Button
                variant="ghost"
                onClick={() =>
                  act(() => controller.setFilters({ ...session.filters, register: "contacts" }))
                }
              >
                Go to contacts
              </Button>
            )}
          </div>
        )}
      </div>
      {workspace.issues.filter((issue) => !issue.resolved).length > 0 && (
        <aside className={styles.review}>
          <h3>Needs a careful look.</h3>
          {workspace.issues
            .filter((issue) => !issue.resolved)
            .map((issue) => (
              <div key={issue.id}>
                <p>{issue.message}</p>
                {issue.documentIds.map((id) => (
                  <div key={id}>
                    <span>{workspace.documents.find((doc) => doc.id === id)?.name}</span>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        act(() =>
                          controller.apply(
                            [{ type: "review_document", documentId: id, decision: "hold" }],
                            "Hold source",
                          ),
                        )
                      }
                    >
                      Hold source
                    </Button>
                    {issue.code === "duplicate" && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          act(() =>
                            controller.apply(
                              [{ type: "review_document", documentId: id, decision: "duplicate" }],
                              "Mark duplicate",
                            ),
                          )
                        }
                      >
                        Mark duplicate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ))}
        </aside>
      )}
      <div className={styles.sessionActions}>
        <p>
          Expires{" "}
          {new Date(workspace.expiresAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          · Fixed two-hour session.
        </p>
        <div>
          {session.undo && (
            <Button
              variant="ghost"
              onClick={() =>
                act(() => controller.undo(session.undo!.commandId, workspace.revision))
              }
            >
              Undo · {session.undo.label}
            </Button>
          )}
          <button className={styles.textButton} type="button" onClick={() => setResetOpen(true)}>
            Clear this session
          </button>
        </div>
      </div>
      {error && (
        <p className={styles.warning} role="alert">
          {error}
        </p>
      )}
      {selection && (
        <PaperDialog
          open
          title={`${selection.value.record ? "Edit" : "New"} ${selection.value.family === "costs" ? "cost / bill" : selection.value.family.slice(0, -1)}`}
          caption="Your session · USD"
          onClose={() => setSelection(null)}
        >
          <RecordForm
            selection={selection.value}
            workspace={workspace}
            onSave={(action, label) => {
              controller.apply([action], label, selection.revision);
              setSelection(null);
            }}
          />
        </PaperDialog>
      )}
      {deletion && (
        <PaperDialog
          open
          title={deletion.label}
          caption="Review the impact"
          onClose={() => setDeletion(null)}
        >
          <p>{deletion.impact}</p>
          <Button
            variant="warm"
            onClick={() =>
              act(() => {
                controller.apply([deletion.action], deletion.label, deletion.revision);
                setDeletion(null);
              })
            }
          >
            Confirm deletion
          </Button>
          {error && (
            <p role="alert" className={styles.warning}>
              {error}
            </p>
          )}
        </PaperDialog>
      )}
      <PaperDialog
        open={resetOpen}
        title="Start fresh?"
        caption="Clear this browser session"
        onClose={() => setResetOpen(false)}
      >
        <p>
          Your current records, Undo and this session’s cached originals will be cleared. A fresh
          empty session starts with its own two-hour expiry. This cannot be undone.
        </p>
        <p>Closed-browser cleanup is best effort; expired remnants are swept on your next visit.</p>
        <Button
          variant="warm"
          onClick={() => {
            setResetOpen(false);
            setSelection(null);
            setDeletion(null);
            void controller.reset();
          }}
        >
          Clear & start fresh
        </Button>
      </PaperDialog>
      {source && <OriginalViewer target={source} onClose={() => setSource(null)} />}
    </section>
  );
}
