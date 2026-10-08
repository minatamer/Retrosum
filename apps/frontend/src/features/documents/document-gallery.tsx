"use client";
import Image from "next/image";
import { useState } from "react";
import { PdfViewer } from "./pdf-viewer";
import { resolveSourceTarget, sampleAssets } from "./sample-assets";
import styles from "./documents.module.css";

const layoutLabels: Record<string, string> = {
  "editorial-service": "Service invoice",
  "grid-sidebar": "Grid invoice",
  "scanned-monospace": "Scanned supplier bill",
  "handwriting-notebook": "Synthetic handwriting-style",
  "compact-subscription": "Subscription receipt",
  "movement-register": "Payment register",
  "archive-record-pack": "Historical records",
};

export function DocumentGallery() {
  const [selection, setSelection] = useState<ReturnType<typeof resolveSourceTarget> | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<readonly string[]>([]);
  return (
    <section className={styles.collection} id="documents" aria-labelledby="documents-heading">
      <div className={styles.collectionHeading}>
        <div>
          <span className="rs-eyebrow rs-muted">
            A fictional business. Real documents to explore.
          </span>
          <h2 id="documents-heading">Meet Harbor Studio.</h2>
        </div>
        <span className={styles.collectionCount}>8 PDFs · 14 pages · English / USD</span>
      </div>
      <p className={styles.intro}>
        Every sample figure starts here. Open an original, turn its pages, and see the different
        ways everyday paperwork arrives.
      </p>
      <div className={styles.gallery}>
        {sampleAssets.map((asset, index) => (
          <button
            key={asset.id}
            className={styles.documentCard}
            type="button"
            aria-label={`View ${asset.label}: ${asset.title}`}
            onClick={() =>
              setSelection(resolveSourceTarget(sampleAssets, { documentId: asset.id, page: 1 }))
            }
          >
            <span className={styles.thumbnail}>
              <Image
                src={asset.thumbnailPath}
                alt=""
                width={420}
                height={544}
                loading={index < 4 ? "eager" : "lazy"}
                onError={() =>
                  setThumbnailErrors((ids) => (ids.includes(asset.id) ? ids : [...ids, asset.id]))
                }
                sizes="(max-width: 600px) 80vw, (max-width: 1024px) 40vw, 25vw"
              />
              {thumbnailErrors.includes(asset.id) && (
                <span className={styles.thumbnailError}>
                  Preview unavailable. Open the original PDF.
                </span>
              )}
              <span className={styles.paperLabel}>
                {asset.label}
                <span aria-hidden="true">↗</span>
              </span>
            </span>
            <span className={styles.cardTitle}>{asset.title}</span>
            <span className={styles.cardMeta}>
              {asset.pageCount} {asset.pageCount === 1 ? "page" : "pages"} · PDF
            </span>
            <span className={styles.cardBadge}>
              {asset.duplicateOf
                ? "Second copy · Same bill as D03"
                : layoutLabels[asset.layoutFamily]}
            </span>
          </button>
        ))}
      </div>
      <div className={styles.collectionNote}>
        <p>
          August’s comparison records and September’s payment rows are included. The second
          Northstar copy is visible too.
        </p>
        <button
          type="button"
          onClick={() => {
            const asset = sampleAssets.find((item) => item.label === "D07");
            if (asset)
              setSelection(
                resolveSourceTarget(sampleAssets, {
                  documentId: asset.id,
                  page: 2,
                  rowId: "P-904",
                  excerpt: "Internal transfer, not income or an operating cost.",
                }),
              );
          }}
        >
          See a source-linked row ↗
        </button>
      </div>
      <PdfViewer selection={selection} onClose={() => setSelection(null)} />
    </section>
  );
}
