"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ExportOptions } from "@retrosum/contracts";
import { buildExportBundle, validateSession } from "@retrosum/money";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { Button } from "../../components/ui/button";
import { useSession } from "../session/session-provider";
import { sampleAssets } from "../documents/sample-assets";
import styles from "./exports.module.css";

export function ExportPanel() {
  const { session, generation, ready } = useSession();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        variant="light"
        disabled={!ready || !session}
        onClick={() => setTarget(document.body)}
      >
        Export workspace ↗
      </Button>
      {target &&
        session &&
        createPortal(
          <ExportReview
            key={`${generation}/${session.workspace.id}`}
            onClose={() => setTarget(null)}
          />,
          target,
        )}
    </>
  );
}
function ExportReview({ onClose }: { onClose(): void }) {
  const { controller, session } = useSession();
  const [snapshot, setSnapshot] = useState(() => validateSession(session!));
  const [exportedAt, setExportedAt] = useState(() => new Date().toISOString());
  const [options, setOptions] = useState<ExportOptions>({
    originals: false,
    sensitive: false,
    conversation: false,
  });
  const [invoiceId, setInvoiceId] = useState(
    snapshot.workspace.invoices.find((r) => r.origin === "session")?.id ?? "",
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [download, setDownload] = useState<{ url: string; filename: string; bytes: number } | null>(
    null,
  );
  const owned = useRef<{
    abort: AbortController;
    url?: string | undefined;
    timer?: ReturnType<typeof setTimeout> | undefined;
    untrack: () => void;
  } | null>(null);
  const release = () => {
    const value = owned.current;
    owned.current = null;
    if (value) {
      value.abort.abort();
      if (value.url) URL.revokeObjectURL(value.url);
      if (value.timer) clearTimeout(value.timer);
      value.untrack();
    }
  };
  useEffect(
    () => () => {
      const value = owned.current;
      owned.current = null;
      if (value) {
        value.abort.abort();
        if (value.url) URL.revokeObjectURL(value.url);
        if (value.timer) clearTimeout(value.timer);
        value.untrack();
      }
    },
    [],
  );
  const changed =
    session?.workspace.revision !== snapshot.workspace.revision ||
    session?.workspace.id !== snapshot.workspace.id;
  const bundle = useMemo(
    () => buildExportBundle(snapshot, options, exportedAt),
    [snapshot, options, exportedAt],
  );
  const choose = (name: keyof ExportOptions, value: boolean) => {
    release();
    setDownload(null);
    setError(null);
    setOptions({ ...options, [name]: value });
  };
  const prepare = async (kind: "zip" | "pdf") => {
    if (busy || changed) return;
    release();
    setDownload(null);
    setBusy(true);
    setError(null);
    const abort = new AbortController(),
      token = controller.token("export");
    const resource = {
      abort,
      untrack: controller.trackEffect(abort),
      url: undefined as string | undefined,
      timer: undefined as ReturnType<typeof setTimeout> | undefined,
    };
    owned.current = resource;
    abort.signal.addEventListener(
      "abort",
      () => {
        if (owned.current !== resource) return;
        owned.current = null;
        if (resource.url) URL.revokeObjectURL(resource.url);
        if (resource.timer) clearTimeout(resource.timer);
        resource.untrack();
        setDownload(null);
        setBusy(false);
        setError(
          "Export stopped. Capture the current revision and prepare again; no automatic retry ran.",
        );
      },
      { once: true },
    );
    resource.timer = setTimeout(() => abort.abort(), 30000);
    try {
      let bytes: Uint8Array<ArrayBuffer>, mime: string, filename: string;
      if (kind === "zip") {
        const { prepareArchive } = await import("./archive");
        bytes = await prepareArchive(
          snapshot,
          options,
          exportedAt,
          async (doc) => {
            const asset = sampleAssets.find((r) => r.id === doc.id && r.sha256 === doc.sha256);
            if (!asset) return controller.original(doc);
            const response = await fetch(asset.pdfPath, {
              signal: abort.signal,
              cache: "no-store",
            });
            if (!response.ok)
              throw new RangeError("A sample original could not be loaded. Try without originals.");
            return response.blob();
          },
          abort.signal,
        );
        mime = "application/zip";
        filename = `retrosum-revision-${snapshot.workspace.revision}.zip`;
      } else {
        const { renderInvoicePdf } = await import("./invoice-pdf");
        const response = await fetch("/pdfjs/6.4.299/standard_fonts/LiberationSans-Regular.ttf", {
          signal: abort.signal,
        });
        if (!response.ok)
          throw new RangeError(
            "The local invoice font is unavailable. Use the structured export or retry.",
          );
        bytes = await renderInvoicePdf(
          snapshot,
          invoiceId,
          new Uint8Array(await response.arrayBuffer()),
          abort.signal,
          options,
        );
        mime = "application/pdf";
        filename = `retrosum-invoice-revision-${snapshot.workspace.revision}.pdf`;
      }
      abort.signal.throwIfAborted();
      if (!controller.isCurrent(token))
        throw new RangeError("The workspace changed. Capture its current revision and try again.");
      if (resource.timer) clearTimeout(resource.timer);
      resource.url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      setDownload({ url: resource.url, filename, bytes: bytes.byteLength });
      resource.timer = setTimeout(() => {
        release();
        setDownload(null);
        setError("The prepared download expired. Prepare it again when ready.");
      }, 60000);
    } catch (cause) {
      if (owned.current !== resource) return;
      const cancelled = abort.signal.aborted;
      release();
      setError(
        cancelled
          ? "Export stopped. Capture the current revision and prepare again; no automatic retry ran."
          : cause instanceof RangeError
            ? cause.message
            : "The download could not be prepared. Your records are safe; try again.",
      );
    } finally {
      if (owned.current === resource || owned.current === null) setBusy(false);
    }
  };
  const refresh = () => {
    release();
    setDownload(null);
    setBusy(false);
    setError(null);
    const current = validateSession(controller.getSnapshot().session!);
    setSnapshot(current);
    if (!current.workspace.invoices.some((r) => r.id === invoiceId && r.origin === "session"))
      setInvoiceId(current.workspace.invoices.find((r) => r.origin === "session")?.id ?? "");
    setExportedAt(new Date().toISOString());
  };
  return (
    <PaperDialog
      open
      onClose={onClose}
      title="Take your work with you."
      caption={`Export review · Revision ${snapshot.workspace.revision}`}
      size="paper"
    >
      <div className={styles.review}>
        <p>
          {snapshot.workspace.business.name} · {snapshot.filters.from} — {snapshot.filters.to} · USD
          · As of {bundle.manifest.asOf}
        </p>
        {changed && (
          <p role="status">
            Your workspace has changed.{" "}
            <button type="button" onClick={refresh}>
              Capture current revision
            </button>
          </p>
        )}
        <div className={styles.counts}>
          {Object.entries(bundle.recordCounts).map(([name, count]) => (
            <span key={name}>
              <strong>{count}</strong>
              {name}
            </span>
          ))}
        </div>
        <p>
          Every register includes the records you can inspect, with drafts, held sources, historical
          rows and current-scope exclusions labelled separately.
        </p>
        <fieldset disabled={busy}>
          <legend>Choose what leaves this browser</legend>
          <label>
            <input
              type="checkbox"
              checked={options.originals}
              onChange={(e) => choose("originals", e.target.checked)}
            />
            Include original documents
          </label>
          <p>
            Original PDFs retain all their unredacted contents. Summary masking never changes their
            bytes.
          </p>
          <label>
            <input
              type="checkbox"
              checked={options.sensitive}
              onChange={(e) => choose("sensitive", e.target.checked)}
            />
            Include full source financial identifiers
          </label>
          <p>
            Includes contact email, payment/account references, source raw/excerpt/note copies and
            full selected conversation. Default masking minimizes data; it does not make an export
            anonymous.
          </p>
          <label>
            <input
              type="checkbox"
              checked={options.conversation}
              onChange={(e) => choose("conversation", e.target.checked)}
            />
            Include conversation
          </label>
          <p>
            Without full identifiers, includes verified current Retro answers and labelled stale
            markers; user/free narrative is omitted.
          </p>
        </fieldset>
        <details>
          <summary>Review overview and included files</summary>
          <pre>{bundle.overview}</pre>
          <ul>
            {bundle.manifest.files.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p>
            Processing: {bundle.manifest.modes.join(", ")}. Financial money is exact USD decimal
            text. This export is a demo record, not audited accounts or evidence that money was
            sent.
          </p>
        </details>
        <div className={styles.actions}>
          <Button variant="warm" disabled={busy || changed} onClick={() => void prepare("zip")}>
            {busy ? "Preparing locally…" : "Prepare ZIP download"}
          </Button>
          {busy && (
            <Button
              variant="light"
              onClick={() => {
                release();
                setBusy(false);
                setDownload(null);
                setError("Export cancelled. No download was prepared.");
              }}
            >
              Cancel preparation
            </Button>
          )}
        </div>
        {snapshot.workspace.invoices.some((r) => r.origin === "session") && (
          <fieldset disabled={busy}>
            <legend>A session-created invoice</legend>
            <label>
              Invoice
              <select
                value={invoiceId}
                onChange={(e) => {
                  release();
                  setDownload(null);
                  setInvoiceId(e.target.value);
                }}
              >
                {snapshot.workspace.invoices
                  .filter((r) => r.origin === "session")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.number} · {r.status}
                    </option>
                  ))}
              </select>
            </label>
            <Button
              variant="light"
              disabled={changed || !invoiceId}
              onClick={() => void prepare("pdf")}
            >
              Prepare invoice PDF
            </Button>
            <p>
              Exact core fields and draft/issued status. Optional notes follow the identifier
              choice. No invoice is sent; unsupported local font characters produce a readable
              error.
            </p>
          </fieldset>
        )}
        {download && !changed && (
          <p className={styles.download}>
            <a href={download.url} download={download.filename}>
              Download {download.filename}
            </a>
            <span>
              {Math.ceil(download.bytes / 1024)} KiB · captured revision{" "}
              {snapshot.workspace.revision} · available for one minute
            </span>
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <p className={styles.limit}>
          Reset clears page-held downloads, records, conversation and owned temporary originals. It
          cannot remove downloads already on your device or recall provider-controlled copies. A
          closed/crashed browser removes expired leftovers when Retrosum runs again.
        </p>
      </div>
    </PaperDialog>
  );
}
