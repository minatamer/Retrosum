"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  documentSchema,
  type RuntimeCapabilities,
  type SourceDocument,
  type SourceReference,
} from "@retrosum/contracts";
import { BrandMark, Wordmark } from "../../components/ui/wordmark";
import { SessionProvider, useSession } from "../session/session-provider";
import { monthDateRange } from "../session/reporting-period";
import {
  InlineProcessingReview,
  ProcessingDetails,
  ProcessingProvider,
  usePaidProcessing,
} from "../processing/processing-provider";
import { recognitionCapabilities } from "../documents/recognition-client";
import { sampleAssets, sampleManifest } from "../documents/sample-assets";
import {
  prepareSamples,
  prepareUploads,
  processDocuments,
  checkEnvelope,
  type IntakeItem,
} from "../documents/recognition-flow";
import { OriginalViewer } from "../documents/original-viewer";
import type { PaperOrigin } from "../../components/ui/paper-dialog";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { DashboardExperience } from "./dashboard-experience";
import { UploadThumbnail } from "./upload-thumbnail";
import styles from "./demo.module.css";

export function DemoExperience() {
  return (
    <SessionProvider>
      <ProcessingProvider>
        <SessionExperience />
      </ProcessingProvider>
    </SessionProvider>
  );
}
function SessionExperience() {
  const { generation } = useSession();
  return <DemoFlow key={generation} />;
}
function DemoFlow() {
  const { controller, session, ready, notice } = useSession();
  const authorize = usePaidProcessing();
  const [busy, setBusy] = useState(false);
  const [resetSetup, setResetSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(null);
  const [progress, setProgress] = useState("Preparing your documents");
  const [preview, setPreview] = useState<{ target: SourceReference; origin: PaperOrigin } | null>(
    null,
  );
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);
  const stage = session?.experience.stage ?? "choose";
  useEffect(() => {
    if (stage !== "documents") return;
    const abort = new AbortController();
    void recognitionCapabilities(abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setCapabilities(value);
      })
      .catch((cause: unknown) => {
        if (!abort.signal.aborted) {
          setCapabilities(null);
          setError(cause instanceof Error ? cause.message : "Processing is unavailable.");
        }
      });
    return () => abort.abort();
  }, [stage]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);
  if (!ready || !session)
    return (
      <div className={styles.opening}>
        <span className={styles.spinner} />
        <p role="status">Opening your workspace…</p>
      </div>
    );
  const { experience, workspace } = session;
  const selected = new Set(experience.selectedDocumentIds);
  const collection =
    experience.entry === "sample"
      ? sampleAssets
      : workspace.documents.filter((d) => d.provenance === "visitor_upload");
  const change = (patch: Partial<typeof experience>) =>
    controller.setExperience({ ...controller.getSnapshot().session!.experience, ...patch });
  const run = async (task: (signal: AbortSignal) => Promise<void>) => {
    if (active.current) return;
    const abort = new AbortController();
    active.current = abort;
    const untrack = controller.trackEffect(abort);
    setBusy(true);
    setError(null);
    try {
      await task(abort.signal);
    } catch (cause) {
      if (mounted.current) {
        setError(
          abort.signal.aborted
            ? "Processing stopped. Your completed documents are kept."
            : cause instanceof Error
              ? cause.message
              : "This step could not finish.",
        );
        if (controller.getSnapshot().ready) change({ stage: "documents" });
      }
    } finally {
      untrack();
      if (active.current === abort) active.current = null;
      if (mounted.current) setBusy(false);
    }
  };
  const choose = (entry: "sample" | "upload") => {
    if (workspace.documents.length && experience.entry !== entry) {
      setError("Continue your current workspace, or Reset to start with a different business.");
      return;
    }
    setError(null);
    change({
      entry,
      stage: "documents",
      selectedDocumentIds:
        entry === "sample"
          ? sampleAssets.map((a) => a.id)
          : workspace.documents.filter((d) => d.provenance === "visitor_upload").map((d) => d.id),
    });
  };
  const addUploads = (files: File[]) =>
    void run(async (signal) => {
      if (!files.length) return;
      setProgress("Checking your PDF files");
      const token = controller.token("inspect_uploads");
      const items = await prepareUploads(files, signal);
      if (!controller.isCurrent(token))
        throw new RangeError("Your workspace changed. Please choose the files again.");
      const current = controller.getSnapshot().session!;
      const known = new Set(current.workspace.documents.map((d) => d.sha256));
      const unique = items.filter((item) => {
        if (known.has(item.doc.sha256)) return false;
        known.add(item.doc.sha256);
        return true;
      });
      checkEnvelope([...current.workspace.documents, ...unique.map((i) => i.doc)]);
      controller.replaceGraph(token, {
        ...current.workspace,
        revision: current.workspace.revision + 1,
        documents: [...current.workspace.documents, ...unique.map((i) => i.doc)],
      });
      const cacheToken = controller.token(token.operationId);
      const restoredIds: string[] = [];
      for (const item of items) {
        signal.throwIfAborted();
        const doc = controller
          .getSnapshot()
          .session!.workspace.documents.find((d) => d.sha256 === item.doc.sha256)!;
        await controller.cachePdf(cacheToken, doc, item.blob);
        restoredIds.push(doc.id);
      }
      change({
        selectedDocumentIds: [
          ...new Set([...current.experience.selectedDocumentIds, ...restoredIds]),
        ],
      });
    });
  const process = () =>
    void run(async (signal) => {
      if (!selected.size) throw new RangeError("Select at least one document.");
      change({ stage: "processing" });
      setProgress("Preparing selected documents");
      let items: IntakeItem[];
      let current = controller.getSnapshot().session!;
      if (experience.entry === "sample") {
        if (current.workspace.documents.some((d) => d.provenance === "visitor_upload"))
          throw new RangeError("Reset before switching to the sample business.");
        const token = controller.token("inspect_selected_samples");
        items = await prepareSamples(
          sampleAssets.filter((a) => selected.has(a.id)),
          signal,
        );
        if (!controller.isCurrent(token))
          throw new RangeError("Your workspace changed. Start again.");
        const unique = items.filter(
          (i) => !current.workspace.documents.some((d) => d.sha256 === i.doc.sha256),
        );
        checkEnvelope([...current.workspace.documents, ...unique.map((i) => i.doc)]);
        controller.replaceGraph(token, {
          ...current.workspace,
          revision: current.workspace.revision + 1,
          business: { ...current.workspace.business, name: sampleManifest.business },
          asOf: sampleManifest.asOf,
          documents: [
            ...current.workspace.documents,
            ...unique.map((i) => documentSchema.parse(i.doc)),
          ],
        });
        controller.setFilters({
          ...current.filters,
          ...monthDateRange(sampleManifest.period),
          asOf: sampleManifest.asOf,
        });
      } else {
        items = [];
        for (const doc of current.workspace.documents.filter((d) => selected.has(d.id))) {
          const blob = await controller.original(doc);
          signal.throwIfAborted();
          if (!blob) throw new RangeError(`Select ${doc.name} again to restore its original PDF.`);
          items.push({ doc, blob });
        }
      }
      current = controller.getSnapshot().session!;
      const pending = items
        .map((i) => ({ ...i, doc: current.workspace.documents.find((d) => d.id === i.doc.id)! }))
        .filter((i) => !["ready", "needs_review"].includes(i.doc.state));
      for (const retry of [false, true]) {
        const batch = pending.filter((i) => i.doc.recognitionAttempted === retry);
        if (batch.length)
          await processDocuments(
            controller,
            batch,
            signal,
            setProgress,
            retry,
            (identity, current, signal) => {
              if (capabilities?.mode !== "live")
                throw new Error(
                  "Processing changed. Return to document selection to review it before submitting.",
                );
              // The visible selection disclosure and explicit Process click approve only this batch.
              return authorize(identity, current, signal, "document-selection");
            },
          );
      }
      signal.throwIfAborted();
      const preferences = controller.getSnapshot().session!.dashboard;
      if (
        preferences.revision === 0 &&
        window.matchMedia("(min-width: 701px) and (max-width: 1000px)").matches
      )
        controller.setDashboard({ ...preferences, collapsed: true }, false);
      if (mounted.current) change({ stage: "dashboard", view: "overview" });
    });
  const toggle = (id: string) =>
    change({
      selectedDocumentIds: selected.has(id)
        ? [...selected].filter((v) => v !== id)
        : [...selected, id],
    });
  const previewDocument = (doc: SourceDocument, element: HTMLElement) => {
    const b = element.getBoundingClientRect();
    setPreview({
      target: { documentId: doc.id, page: 1 },
      origin: { left: b.left, top: b.top, width: b.width, height: b.height },
    });
  };
  if (stage === "dashboard")
    return (
      <DashboardExperience
        live={capabilities?.mode === "live"}
        onAddDocuments={() => change({ stage: "documents" })}
      />
    );
  const completed = workspace.documents.filter(
    (d) => selected.has(d.id) && ["ready", "needs_review", "error"].includes(d.state),
  ).length;
  const currentDoc = workspace.documents.find(
    (d) => selected.has(d.id) && ["reading", "validating"].includes(d.state),
  );
  const stageIndex = stage === "choose" ? 0 : stage === "documents" ? 1 : 2;
  return (
    <div className={styles.experience}>
      <header className={styles.header}>
        <Wordmark />
        <Link href="/">Back to the introduction ↗</Link>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <ol className={styles.steps} aria-label="Demo progress">
          {["Choose", "Documents", "Process"].map((name, i) => (
            <li
              key={name}
              aria-current={stageIndex === i ? "step" : undefined}
              data-complete={stageIndex > i}
            >
              <span>{stageIndex > i ? "✓" : `0${i + 1}`}</span>
              {name}
            </li>
          ))}
        </ol>
        {stage === "choose" && (
          <section className={styles.stage}>
            <span className="rs-eyebrow">Your next clear picture</span>
            <h1 ref={heading} tabIndex={-1}>
              Start with your paperwork.
            </h1>
            <p>Bring your PDFs, or explore a business we’ve prepared for you.</p>
            <div className={styles.choices}>
              <button className={styles.choice} type="button" onClick={() => choose("upload")}>
                <span className={styles.choiceIcon}>↥</span>
                <h2>Use my documents</h2>
                <p>Invoices, bills, receipts and payment records.</p>
                <span>
                  Choose your PDFs <b>↗</b>
                </span>
              </button>
              <button
                className={`${styles.choice} ${styles.sampleChoice}`}
                type="button"
                onClick={() => choose("sample")}
              >
                <span className={styles.choiceIcon}>▤</span>
                <h2>Try the sample</h2>
                <p>{sampleAssets.length} realistic PDFs from fictional Harbor Studio.</p>
                <span>
                  Explore the paperwork <b>↗</b>
                </span>
              </button>
            </div>
            {workspace.documents.length > 0 && (
              <button
                className={styles.resume}
                type="button"
                onClick={() => change({ stage: "dashboard" })}
              >
                Continue your workspace <span>↗</span>
              </button>
            )}
            {workspace.documents.length > 0 && (
              <button
                className={styles.textButton}
                type="button"
                onClick={() => setResetSetup(true)}
              >
                Start with a different business
              </button>
            )}
          </section>
        )}
        {stage === "documents" && (
          <section className={styles.stage}>
            <div className={styles.stageHeading}>
              <div>
                <span className="rs-eyebrow">
                  {experience.entry === "sample"
                    ? "Harbor Studio · Fictional sample"
                    : "Your paper trail"}
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  Choose what to explore.
                </h1>
                <p>Click a paper to take a closer look. Select the PDFs you want to process.</p>
              </div>
              <button
                type="button"
                className={styles.textButton}
                disabled={busy}
                onClick={() => change({ stage: "choose" })}
              >
                ← Change path
              </button>
            </div>
            {experience.entry === "upload" && (
              <>
                <label className={styles.businessInput}>
                  Business name
                  <input
                    maxLength={100}
                    defaultValue={
                      workspace.business.name === "My business" ? "" : workspace.business.name
                    }
                    placeholder="Your business"
                    disabled={busy || workspace.events.length > 0}
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (!name || name === workspace.business.name) return;
                      try {
                        const t = controller.token("business_name");
                        const w = controller.getSnapshot().session!.workspace;
                        controller.replaceGraph(t, {
                          ...w,
                          revision: w.revision + 1,
                          business: { ...w.business, name },
                        });
                      } catch (cause) {
                        setError(
                          cause instanceof Error ? cause.message : "Check the business name.",
                        );
                      }
                    }}
                  />
                </label>
                <div
                  className={styles.dropzone}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!busy) addUploads([...e.dataTransfer.files]);
                  }}
                >
                  <span>↥</span>
                  <p>
                    Drop your PDFs here, or{" "}
                    <button type="button" disabled={busy} onClick={() => input.current?.click()}>
                      browse files
                    </button>
                  </p>
                  <small>Up to 10 PDFs · 20 pages · 20 MiB total</small>
                  <input
                    ref={input}
                    type="file"
                    accept="application/pdf"
                    multiple
                    hidden
                    disabled={busy}
                    onChange={(e) => {
                      const files = [...(e.target.files ?? [])];
                      e.target.value = "";
                      addUploads(files);
                    }}
                  />
                </div>
              </>
            )}
            <div className={styles.collectionBar}>
              <span>
                {selected.size} of {collection.length} selected
              </span>
              <div>
                <button
                  type="button"
                  disabled={busy || !collection.length}
                  onClick={() => change({ selectedDocumentIds: collection.map((d) => d.id) })}
                >
                  Select all
                </button>
                <button
                  type="button"
                  disabled={busy || !selected.size}
                  onClick={() => change({ selectedDocumentIds: [] })}
                >
                  Unselect all
                </button>
              </div>
            </div>
            <div className={styles.papers}>
              {collection.map((doc, index) => {
                const asset = sampleAssets.find((a) => a.id === doc.id);
                return (
                  <article
                    className={styles.paperCard}
                    key={doc.id}
                    data-selected={selected.has(doc.id)}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={selected.has(doc.id)}
                        disabled={busy}
                        onChange={() => toggle(doc.id)}
                        aria-label={`Select ${asset?.title ?? doc.name}`}
                      />
                    </label>
                    <button
                      className={styles.paperPreview}
                      type="button"
                      aria-label={`Preview ${asset?.title ?? doc.name}`}
                      onClick={(e) => previewDocument(doc, e.currentTarget)}
                    >
                      {asset ? (
                        <Image src={asset.thumbnailPath} alt="" width={320} height={420} />
                      ) : (
                        <UploadThumbnail doc={doc} />
                      )}
                      <span>View PDF ↗</span>
                    </button>
                    <h2>{asset?.title ?? doc.name}</h2>
                    <p>
                      {doc.provenance === "synthetic_handwriting"
                        ? "Handwritten-style receipt"
                        : doc.kind === "unknown"
                          ? "Your PDF"
                          : doc.kind.replaceAll("_", " ")}{" "}
                      · {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
                    </p>
                  </article>
                );
              })}
            </div>
            {busy && (
              <p role="status" className={styles.inlineStatus}>
                <span className={styles.spinner} />
                {progress}
              </p>
            )}
            <div className={styles.nextBar}>
              <div className={styles.processingNote}>
                <p>
                  {capabilities?.mode === "live"
                    ? "By choosing Process, you allow your selected PDFs and business context to be sent to OpenAI."
                    : "Only selected documents will be processed."}
                </p>
                <ProcessingDetails live={capabilities?.mode === "live"} />
                {!capabilities && <small role="status">Checking processing availability…</small>}
                {capabilities && !capabilities.documents.available && (
                  <small>Processing is unavailable. You can still explore the originals.</small>
                )}
              </div>
              <button
                type="button"
                className={styles.primary}
                disabled={
                  busy ||
                  !selected.size ||
                  !capabilities?.documents.available ||
                  (capabilities.mode === "live" && !capabilities.processing?.admissionAvailable)
                }
                onClick={process}
              >
                Process {selected.size || "selected"}{" "}
                {selected.size === 1 ? "document" : "documents"} <span>→</span>
              </button>
            </div>
          </section>
        )}
        {stage === "processing" && (
          <section className={`${styles.stage} ${styles.processing}`} aria-busy="true">
            <div className={styles.processingPaper}>
              <BrandMark />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="rs-eyebrow">From pages to perspective</span>
            <h1 ref={heading} tabIndex={-1}>
              {currentDoc?.state === "validating"
                ? "Checking the figures."
                : currentDoc
                  ? "Extracting the numbers."
                  : "Preparing your documents."}
            </h1>
            <p role="status">{currentDoc?.name ?? progress}</p>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Document processing"
              aria-valuemin={0}
              aria-valuemax={selected.size}
              aria-valuenow={completed}
            >
              <span
                style={{ width: `${selected.size ? (completed / selected.size) * 100 : 0}%` }}
              />
            </div>
            <div className={styles.processingCount}>
              <span className={styles.spinner} />
              {completed} of {selected.size} documents completed
            </div>
            <InlineProcessingReview />
            <button
              type="button"
              className={styles.textButton}
              onClick={() => active.current?.abort()}
            >
              Cancel processing
            </button>
          </section>
        )}
        {notice && (
          <p className={styles.sessionNotice} role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </main>
      {preview && (
        <OriginalViewer
          target={preview.target}
          origin={preview.origin}
          onClose={() => setPreview(null)}
        />
      )}
      <PaperDialog
        open={resetSetup}
        title="Start with a different business?"
        onClose={() => setResetSetup(false)}
      >
        <p>This clears your current documents, records and dashboard.</p>
        <button
          className={styles.primary}
          type="button"
          onClick={() => {
            setResetSetup(false);
            void controller.reset();
          }}
        >
          Reset workspace
        </button>
      </PaperDialog>
    </div>
  );
}
