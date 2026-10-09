"use client";
import { useState } from "react";
import type { SourceDocument, SourceReference } from "@retrosum/contracts";
import { useSession } from "../session/session-provider";
import { OriginalViewer } from "../documents/original-viewer";
import { DocumentReview } from "../documents/document-review";
import { sampleAssets } from "../documents/sample-assets";
import styles from "./dashboard-shell.module.css";

export function DocumentLibrary({ onAddDocuments }: { onAddDocuments(): void }) {
  const { session } = useSession();
  const [source, setSource] = useState<SourceReference | null>(null);
  const [review, setReview] = useState<{ doc: SourceDocument; revision: number } | null>(null);
  if (!session) return null;
  return (
    <section id="retro-documents" className={styles.library}>
      <header>
        <div>
          <span className="rs-eyebrow">Your original paper trail</span>
          <h1>Documents.</h1>
          <p>Preview your sources and check the figures that need a closer look.</p>
        </div>
        <button type="button" onClick={onAddDocuments}>
          Add / select documents ↗
        </button>
      </header>
      <div className={styles.documentRows}>
        {session.workspace.documents.map((doc) => (
          <article key={doc.id}>
            <span className={styles.documentGlyph}>▤</span>
            <div>
              <h2>{sampleAssets.find((a) => a.id === doc.id)?.title ?? doc.name}</h2>
              <p>
                {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"} ·{" "}
                {doc.state.replaceAll("_", " ")}
                {doc.disposition === "duplicate" ? " · Excluded duplicate" : ""}
              </p>
              {doc.state === "needs_review" && doc.reviewNotes[0] && (
                <small>{doc.reviewNotes[0]}</small>
              )}
            </div>
            <button type="button" onClick={() => setSource({ documentId: doc.id, page: 1 })}>
              View PDF ↗
            </button>
            {["ready", "needs_review"].includes(doc.state) && (
              <button
                type="button"
                onClick={() => setReview({ doc, revision: session.workspace.revision })}
              >
                Review figures
              </button>
            )}
          </article>
        ))}
      </div>
      {source && <OriginalViewer target={source} onClose={() => setSource(null)} />}
      {review && !source && (
        <DocumentReview
          {...review}
          onClose={() => setReview(null)}
          onSource={(target) => setSource(target)}
        />
      )}
    </section>
  );
}
