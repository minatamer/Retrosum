"use client";
import type { SourceDocument, SourceReference, Workspace } from "@retrosum/contracts";
import { Button } from "../../components/ui/button";
import styles from "./document-review-queue.module.css";

export type DocumentReviewSelection = {
  doc: SourceDocument;
  revision: number;
  issueNotes?: string[];
};

export function DocumentReviewQueue({
  workspace,
  theme = "paper",
  headingId,
  onReview,
  onSource,
}: {
  workspace: Workspace;
  theme?: "paper" | "green";
  headingId: string;
  onReview(selection: DocumentReviewSelection): void;
  onSource(source: SourceReference): void;
}) {
  const documents = workspace.documents
    .map((doc) => ({
      doc,
      issues: workspace.issues.filter(
        (issue) => !issue.resolved && issue.documentIds.includes(doc.id),
      ),
    }))
    .filter(({ issues }) => issues.length > 0);
  if (documents.length === 0) return null;
  return (
    <aside className={styles.review} data-theme={theme} aria-labelledby={headingId}>
      <header className={styles.reviewHeader}>
        <div>
          <span className="rs-eyebrow">A final check</span>
          <h3 id={headingId}>A few details need your eye.</h3>
          <p>Check the originals before including held figures in your totals.</p>
        </div>
        <span className={styles.reviewCount}>
          {documents.length} {documents.length === 1 ? "document" : "documents"}
        </span>
      </header>
      <ul className={styles.reviewList}>
        {documents.map(({ doc, issues }) => {
          const duplicate = issues.some((issue) => issue.code === "duplicate");
          const handwritten = doc.provenance === "synthetic_handwriting";
          const scanned = doc.reviewNotes.some((note) => note.includes("is image-only"));
          const label = duplicate
            ? "Duplicate check"
            : handwritten
              ? "Handwriting review"
              : scanned
                ? "Scan review"
                : "Source review";
          const description = doc.reviewBlocked
            ? "Some figures need correcting before this source can be accepted."
            : duplicate
              ? "Check whether this repeats a transaction already recorded."
              : handwritten
                ? "Compare the handwritten amounts with the original."
                : scanned
                  ? "Compare the extracted figures with the scanned original."
                  : issues[0]!.message;
          const actionLabel = duplicate ? "Review duplicate" : "Review figures";
          return (
            <li key={doc.id} className={styles.reviewRow}>
              <span className={styles.reviewGlyph} aria-hidden="true" data-duplicate={duplicate}>
                <svg viewBox="0 0 24 28" fill="none">
                  <path d="M3 1.5h11l7 7v18H3zM14 1.5v7h7M7 14h10M7 18h10M7 22h6" />
                </svg>
              </span>
              <div className={styles.reviewContent}>
                <div className={styles.reviewMeta}>
                  <span data-duplicate={duplicate}>{label}</span>
                  <small>
                    {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
                  </small>
                </div>
                <h4>{doc.name}</h4>
                <p>{description}</p>
              </div>
              <div className={styles.reviewActions}>
                <Button
                  variant={theme === "green" ? "warm" : "primary"}
                  aria-label={`${actionLabel} in ${doc.name}`}
                  onClick={() =>
                    onReview({
                      doc,
                      revision: workspace.revision,
                      issueNotes: issues.map((issue) => issue.message),
                    })
                  }
                >
                  {actionLabel} <span aria-hidden="true">→</span>
                </Button>
                <button
                  type="button"
                  className={styles.reviewSource}
                  aria-label={`View PDF ${doc.name}`}
                  onClick={() => onSource({ documentId: doc.id, page: 1 })}
                >
                  View PDF <span aria-hidden="true">↗</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
