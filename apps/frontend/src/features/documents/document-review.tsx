"use client";
import { useState } from "react";
import { commandIdSchema, type SourceDocument, type SourceReference } from "@retrosum/contracts";
import { applyCommand, calculateMetrics, formatAmount } from "@retrosum/money";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { Button } from "../../components/ui/button";
import { useSession } from "../session/session-provider";
import styles from "./recognition.module.css";
function showNormalized(field: SourceDocument["numericFields"][number]) {
  if (field.normalized === null) return "Needs review";
  if (field.scale !== "USD_cents") return field.normalized;
  try {
    return formatAmount(Number(field.normalized));
  } catch {
    return `${field.normalized} cents · needs review`;
  }
}

export function DocumentReview({
  doc,
  revision,
  onClose,
  onSource,
}: {
  doc: SourceDocument;
  revision: number;
  onClose(): void;
  onSource(target: SourceReference): void;
}) {
  const { controller, session } = useSession();
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const duplicate = doc.reviewNotes.some((note) =>
    note.includes("repeats an existing economic event"),
  );
  let effect: string | null = null;
  if (session && !doc.reviewBlocked)
    try {
      const before = calculateMetrics(session.workspace, session.filters);
      const proposed = applyCommand(
        session,
        {
          id: commandIdSchema.parse("command_review_preview"),
          workspaceId: session.workspace.id,
          basedOnRevision: revision,
          actions: [
            {
              type: "review_document",
              documentId: doc.id,
              decision: duplicate ? "duplicate" : "accept",
            },
          ],
        },
        "Review preview",
      );
      const after = calculateMetrics(proposed.workspace, session.filters);
      effect = `Income ${formatAmount(before.income.minor)} → ${formatAmount(after.income.minor)} · Costs ${formatAmount(before.costs.minor)} → ${formatAmount(after.costs.minor)} · Profit ${formatAmount(before.profitMinor)} → ${formatAmount(after.profitMinor)}`;
    } catch {
      effect = "The workspace changed. Close this review and open it again.";
    }
  const decide = (decision: "accept" | "hold" | "duplicate") => {
    try {
      controller.apply(
        [{ type: "review_document", documentId: doc.id, decision }],
        `${decision === "accept" ? "Accept" : decision === "duplicate" ? "Mark duplicate" : "Hold"} ${doc.name}`,
        revision,
      );
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This review could not be applied.");
    }
  };
  return (
    <PaperDialog
      open
      onClose={onClose}
      title="Check the source. Trust the story."
      caption={
        doc.recognitionMode === "fake"
          ? "Simulation · Declared demo transcription"
          : "Source review"
      }
    >
      <p>
        {doc.name} · {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}.{" "}
        {doc.numericFields.reduce((sum, field) => sum + field.occurrences, 0)} visible numeric
        occurrences.
      </p>
      {doc.provenance === "synthetic_handwriting" && (
        <p>Synthetic handwriting-style demonstration · Not human-written.</p>
      )}
      {doc.reviewNotes.length > 0 && (
        <ul className={styles.notes}>
          {[...new Set(doc.reviewNotes)].map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {doc.reviewBlocked && (
        <p className={styles.reviewWarning}>
          This source cannot be accepted until its unresolved figures or role are corrected. Keep it
          held and create a source-checked manual record.
        </p>
      )}
      <div className={styles.reviewPage}>
        <label>
          Numeric inventory page{" "}
          <select value={page} onChange={(event) => setPage(Number(event.target.value))}>
            {Array.from({ length: doc.pageCount }, (_, n) => (
              <option key={n + 1} value={n + 1}>
                {n + 1} of {doc.pageCount}
              </option>
            ))}
          </select>
        </label>
        <Button variant="ghost" onClick={() => onSource({ documentId: doc.id, page })}>
          View original page {page} ↗
        </Button>
      </div>
      <div className={styles.fieldList} role="list" aria-label="Raw and normalized source numbers">
        {doc.numericFields
          .filter((field) => field.page === page)
          .map((field) => (
            <div key={field.key} role="listitem" className={styles.field}>
              <div>
                <small>
                  {field.block} · {field.treatment.replaceAll("_", " ")}
                </small>
                <strong>
                  {field.raw} <span aria-hidden="true">→</span> {showNormalized(field)}
                </strong>
                <small>
                  {field.scale} · {field.occurrences}{" "}
                  {field.occurrences === 1 ? "occurrence" : "occurrences"} ·{" "}
                  {field.check.replaceAll("_", " ")}
                </small>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSource({
                    documentId: doc.id,
                    page: field.page,
                    blockId: field.block,
                    excerpt: field.raw,
                  })
                }
              >
                Source ↗
              </button>
            </div>
          ))}
        {doc.numericFields.length === 0 && (
          <p>No transcription is available. View this PDF and enter its core records manually.</p>
        )}
      </div>
      {effect && (
        <p className={styles.effect}>
          <b>Effect in the current date range</b>
          <br />
          {effect}
        </p>
      )}
      {!doc.reviewBlocked && (
        <label className={styles.confirm}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />{" "}
          I checked the raw figures and source meaning against the original.
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => decide("hold")}>
          Keep held
        </Button>
        <Button
          disabled={!checked || doc.reviewBlocked || session?.workspace.revision !== revision}
          onClick={() => decide(duplicate ? "duplicate" : "accept")}
        >
          {duplicate ? "Confirm duplicate" : "Accept source figures"}
        </Button>
      </div>
    </PaperDialog>
  );
}
