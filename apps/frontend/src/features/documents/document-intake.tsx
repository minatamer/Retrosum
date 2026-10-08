"use client";
import { useEffect, useRef, useState } from "react";
import { documentSchema, type SourceDocument, type SourceReference } from "@retrosum/contracts";
import { Button } from "../../components/ui/button";
import { useSession } from "../session/session-provider";
import { sampleAssets, sampleManifest } from "./sample-assets";
import {
  prepareSamples,
  prepareUploads,
  processDocuments,
  checkEnvelope,
  type IntakeItem,
} from "./recognition-flow";
import { loadSampleBytes } from "./pdf-policy";
import { OriginalViewer } from "./original-viewer";
import { DocumentReview } from "./document-review";
import styles from "./recognition.module.css";

export function DocumentIntake({ active: activeView = true }: { active?: boolean }) {
  const { controller, session, ready } = useSession();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(
    "Start with the visible collection or select your own PDFs.",
  );
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{ doc: SourceDocument; revision: number } | null>(null);
  const [source, setSource] = useState<SourceReference | null>(null);
  const [returnReview, setReturnReview] = useState<typeof review>(null);
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);
  const run = async (task: (signal: AbortSignal) => Promise<void>) => {
    if (active.current) return;
    const abort = new AbortController();
    active.current = abort;
    const unregister = controller.trackEffect(abort);
    setBusy(true);
    setError(null);
    try {
      await task(abort.signal);
    } catch (cause) {
      if (mounted.current)
        setError(
          abort.signal.aborted
            ? "Processing stopped. Completed sources are kept; unfinished originals can be reviewed or retried deliberately."
            : cause instanceof Error
              ? cause.message
              : "This operation could not finish.",
        );
    } finally {
      unregister();
      if (active.current === abort) active.current = null;
      if (mounted.current) setBusy(false);
    }
  };
  const register = async (items: IntakeItem[], signal: AbortSignal, samples = false) => {
    let token = controller.token(`intake_${crypto.randomUUID()}`);
    const current = controller.getSnapshot().session!;
    const unique: IntakeItem[] = [];
    const hashes = new Set(current.workspace.documents.map((doc) => doc.sha256));
    for (const item of items) {
      if (hashes.has(item.doc.sha256)) {
        const previous = current.workspace.documents.find((doc) => doc.sha256 === item.doc.sha256);
        if (previous?.provenance === "visitor_upload")
          await controller.cachePdf(token, previous, item.blob).catch(() => undefined);
        continue;
      }
      hashes.add(item.doc.sha256);
      unique.push(item);
    }
    checkEnvelope([...current.workspace.documents, ...unique.map((item) => item.doc)]);
    if (!controller.isCurrent(token))
      throw new RangeError("The workspace changed during inspection. Start again.");
    if (!unique.length) {
      setProgress(
        "These exact originals are already selected. Existing figures were reused without recognition work.",
      );
      return;
    }
    controller.replaceGraph(token, {
      ...current.workspace,
      revision: current.workspace.revision + 1,
      ...(samples
        ? {
            business: { ...current.workspace.business, name: sampleManifest.business },
            asOf: sampleManifest.asOf,
          }
        : {}),
      documents: [
        ...current.workspace.documents,
        ...unique.map((item) => documentSchema.parse(item.doc)),
      ],
    });
    token = controller.token(token.operationId);
    if (samples)
      controller.setFilters({ ...current.filters, from: "2026-09-01", to: "2026-09-30" });
    for (const item of unique) {
      signal.throwIfAborted();
      if (item.doc.provenance === "visitor_upload")
        await controller.cachePdf(token, item.doc, item.blob).catch(() => undefined);
    }
    await processDocuments(controller, unique, signal, (text) => {
      if (mounted.current) setProgress(text);
    });
  };
  const sample = () =>
    void run(async (signal) => {
      const token = controller.token("inspect_samples");
      const current = controller.getSnapshot().session!.workspace;
      if (
        current.business.name !== sampleManifest.business &&
        current.events.length +
          current.invoices.length +
          current.payments.length +
          current.contacts.length +
          current.documents.length >
          0
      )
        throw new RangeError(
          "Harbor Studio uses a separate business identity. Reset this workspace first, then process the sample collection.",
        );
      setProgress("Inspecting the actual sample PDFs · page counts, signatures and byte hashes.");
      const assets = sampleAssets.filter(
        (asset) => !current.documents.some((doc) => doc.sha256 === asset.sha256),
      );
      const items = await prepareSamples(assets, signal);
      if (!controller.isCurrent(token))
        throw new RangeError(
          "The workspace changed during sample inspection. No interpretation was submitted.",
        );
      await register(items, signal, true);
    });
  const retry = (doc: SourceDocument) =>
    void run(async (signal) => {
      const token = controller.token("retry_original");
      const sample = sampleAssets.find((asset) => asset.sha256 === doc.sha256);
      const blob = sample
        ? new Blob([await loadSampleBytes(sample, signal)], { type: "application/pdf" })
        : await controller.original(doc);
      if (!blob) throw new RangeError("Re-select this exact original before retrying.");
      if (!controller.isCurrent(token))
        throw new RangeError("The workspace changed. Retry was cancelled.");
      await processDocuments(
        controller,
        [{ doc, blob }],
        signal,
        setProgress,
        doc.recognitionAttempted,
      );
    });
  return (
    <section className={styles.section} id="intake" aria-labelledby="intake-heading">
      <div className={styles.heading}>
        <div>
          <span className="rs-eyebrow rs-muted">Paperwork, with a clearer path</span>
          <h2 id="intake-heading">From pages to perspective.</h2>
        </div>
        <span className={styles.badge}>PDF · English · USD</span>
      </div>
      <p className={styles.intro}>
        Read real originals, check their figures, then build your overview. Simulation mode uses
        declared sample transcriptions. Your own PDFs stay viewable and support manual records while
        live recognition awaits verification.
      </p>
      <div className={styles.paths}>
        <div className={styles.path}>
          <span className={styles.pathNumber}>01</span>
          <h3>Explore Harbor Studio.</h3>
          <p>
            Eight visible PDFs, fourteen pages. Invoices, scans, a handwriting-style receipt and two
            months of records.
          </p>
          <Button disabled={!ready || busy} variant="warm" onClick={sample}>
            Process sample documents <span aria-hidden="true">↗</span>
          </Button>
          <a href="#documents">Browse every original first ↓</a>
        </div>
        <div className={styles.path}>
          <span className={styles.pathNumber}>02</span>
          <h3>Bring your paperwork.</h3>
          <p>
            Up to 10 PDFs, 20 pages and 20 MiB per workspace. Original uploads remain in temporary
            browser storage.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              try {
                const token = controller.token("business_identity");
                const current = controller.getSnapshot().session!;
                if (
                  current.workspace.documents.length ||
                  current.workspace.events.length ||
                  current.workspace.contacts.length ||
                  current.workspace.payments.length ||
                  current.workspace.invoices.length
                )
                  throw new RangeError(
                    "Reset this workspace before changing its business identity.",
                  );
                controller.replaceGraph(token, {
                  ...current.workspace,
                  revision: current.workspace.revision + 1,
                  business: { ...current.workspace.business, name: String(data.get("business")) },
                  asOf: String(data.get("asOf")),
                });
                setError(null);
                setProgress("Business confirmed. Select your PDFs.");
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Check the business details.");
              }
            }}
            className={styles.identity}
          >
            <label>
              Business name
              <input
                name="business"
                required
                maxLength={100}
                defaultValue={session?.workspace.business.name ?? ""}
                key={session?.workspace.business.name ?? "loading"}
                disabled={!ready || busy}
              />
            </label>
            <label>
              As of
              <input
                type="date"
                name="asOf"
                required
                defaultValue={session?.workspace.asOf ?? ""}
                key={session?.workspace.asOf ?? "loading"}
                disabled={!ready || busy}
              />
            </label>
            <Button type="submit" variant="ghost" disabled={!ready || busy}>
              Confirm business
            </Button>
          </form>
          <label className={styles.uploadLabel}>
            Select PDFs
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              multiple
              disabled={!ready || busy}
              onChange={(event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = "";
                if (!files.length) return;
                void run(async (signal) => {
                  const token = controller.token("inspect_uploads");
                  const current = controller.getSnapshot().session!;
                  if (current.workspace.business.name === "My business")
                    throw new RangeError(
                      "Confirm the business name before selecting your documents.",
                    );
                  setProgress("Inspecting your originals before any interpretation request.");
                  const items = await prepareUploads(files, signal);
                  if (!controller.isCurrent(token))
                    throw new RangeError(
                      "The workspace changed during inspection. No request was submitted.",
                    );
                  await register(items, signal);
                });
              }}
            />
          </label>
        </div>
      </div>
      <div className={`${styles.progress} ${busy ? styles.scanning : ""}`} aria-busy={busy}>
        <span className={styles.scanPaper} aria-hidden="true">
          ▤
        </span>
        <div>
          <span className="rs-eyebrow">{busy ? "Reading flow" : "Your document journey"}</span>
          <p role="status">{progress}</p>
          <small>Inspect → Read → Check → Review → Ready. No invented OCR percentages.</small>
        </div>
        {busy && (
          <Button variant="ghost" onClick={() => active.current?.abort()}>
            Stop processing
          </Button>
        )}
      </div>
      {error && (
        <p className={styles.warning} role="alert">
          {error}
        </p>
      )}
      <div className={styles.sources} aria-label="Selected document states">
        {session?.workspace.documents.map((doc) => (
          <article className={styles.sourceCard} key={doc.id}>
            <div>
              <small>
                {doc.recognitionMode === "fake"
                  ? "SIMULATED TRANSCRIPTION"
                  : doc.provenance === "visitor_upload"
                    ? "YOUR ORIGINAL"
                    : "VISIBLE SAMPLE"}
              </small>
              <h3>{doc.name}</h3>
              <p>
                {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"} ·{" "}
                {doc.state.replaceAll("_", " ")} · {doc.disposition}
              </p>
              {doc.reviewNotes.length > 0 && (
                <p className={styles.sourceNote}>{doc.reviewNotes[0]}</p>
              )}
            </div>
            <div className={styles.actions}>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setSource({ documentId: doc.id, page: 1 })}
              >
                View PDF ↗
              </Button>
              {["ready", "needs_review"].includes(doc.state) && (
                <Button
                  variant="warm"
                  disabled={busy}
                  onClick={() => setReview({ doc, revision: session.workspace.revision })}
                >
                  Review {doc.numericFields.length} fields
                </Button>
              )}
              {["error", "cancelled"].includes(doc.state) && (
                <Button variant="ghost" disabled={busy} onClick={() => retry(doc)}>
                  {doc.recognitionAttempted ? "Retry once" : "Continue reading"}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {activeView && review && (
        <DocumentReview
          {...review}
          onClose={() => setReview(null)}
          onSource={(target) => {
            setReturnReview(review);
            setReview(null);
            setSource(target);
          }}
        />
      )}
      {activeView && source && (
        <OriginalViewer
          target={source}
          onClose={() => {
            setSource(null);
            if (returnReview) {
              setReview(returnReview);
              setReturnReview(null);
            }
          }}
        />
      )}
    </section>
  );
}
