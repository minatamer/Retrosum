"use client";
import { UserFacingError, userFacingError } from "../../components/ui/user-facing-error";

import { useEffect, useRef, useState } from "react";
import type { SourceDocument, SourceReference } from "@retrosum/contracts";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";
import { PaperDialog, type PaperOrigin } from "../../components/ui/paper-dialog";
import {
  loadSampleBytes,
  PDF_DEADLINE_MS,
  PDF_RUNTIME_PATH,
  renderDimensions,
  safePdfOptions,
} from "./pdf-policy";
import styles from "./documents.module.css";

export type ViewerAsset = SourceDocument & { title: string; pdfPath: string; label?: string };
function PdfPage({ asset, target }: { asset: ViewerAsset; target: SourceReference }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(target.page);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(760);
  const [status, setStatus] = useState("Loading the original PDF…");
  const [error, setError] = useState<string | null>(null);
  const [pageText, setPageText] = useState("");
  const [readyPage, setReadyPage] = useState<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let loading: PDFDocumentLoadingTask | undefined;
    let disposed = false;
    const timeout = window.setTimeout(() => {
      controller.abort();
      void loading?.destroy();
      if (!disposed)
        setError("The PDF took too long to open. Try again or use the original download.");
    }, PDF_DEADLINE_MS);
    void (async () => {
      try {
        const [library, data] = await Promise.all([
          import("pdfjs-dist"),
          loadSampleBytes(asset, controller.signal),
        ]);
        if (disposed || controller.signal.aborted) return;
        library.GlobalWorkerOptions.workerSrc = `${PDF_RUNTIME_PATH}/pdf.worker.min.mjs`;
        loading = library.getDocument({ ...safePdfOptions, data });
        const document = await loading.promise;
        if (document.numPages !== asset.pageCount || document.numPages > 20)
          throw new UserFacingError("This PDF’s page count has changed. Reload the collection.");
        if (!disposed) {
          setPdf(document);
          setStatus("Preparing the page…");
        }
      } catch (cause) {
        await loading?.destroy().catch(() => undefined);
        if (!disposed)
          setError(
            userFacingError(
              cause,
              "This PDF could not be opened. It may be damaged or password-protected. Use the original download or try again.",
            ),
          );
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
      void loading?.destroy();
    };
  }, [asset]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(1, element.clientWidth - 32)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf) return;
    let disposed = false;
    let render: RenderTask | undefined;
    let page: PDFPageProxy | undefined;
    const element = canvas.current;
    if (!element) return;
    const deadline = window.setTimeout(() => {
      disposed = true;
      render?.cancel();
      setError("This page took too long to render. Try another page or download the original.");
      setPdf(null);
      void pdf.loadingTask.destroy();
    }, PDF_DEADLINE_MS);
    void (async () => {
      try {
        page = await pdf.getPage(pageNumber);
        if (disposed) {
          page.cleanup();
          return;
        }
        const base = page.getViewport({ scale: 1 });
        const size = renderDimensions(
          base.width,
          base.height,
          width,
          zoom,
          window.devicePixelRatio,
        );
        const context = element.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas is unavailable.");
        element.width = size.pixelWidth;
        element.height = size.pixelHeight;
        element.style.width = `${size.cssWidth}px`;
        element.style.height = `${size.cssHeight}px`;
        setStatus("Rendering the original page…");
        setPageText("");
        setReadyPage(null);
        render = page.render({
          canvas: element,
          viewport: page.getViewport({ scale: size.scale }),
          transform: [size.outputScale, 0, 0, size.outputScale, 0, 0],
          annotationMode: 0,
        });
        await render.promise;
        const content = await page.getTextContent();
        if (disposed) return;
        setPageText(
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
            .slice(0, 30000),
        );
        setStatus(`Page ${pageNumber} of ${pdf.numPages} ready.`);
        setReadyPage(pageNumber);
      } catch {
        if (!disposed)
          setError(
            "This page could not be rendered safely. Try another page or download the original.",
          );
      } finally {
        window.clearTimeout(deadline);
        page?.cleanup();
      }
    })();
    return () => {
      disposed = true;
      window.clearTimeout(deadline);
      render?.cancel();
    };
  }, [pdf, pageNumber, width, zoom]);

  function changePage(next: number) {
    setError(null);
    setReadyPage(null);
    setPageText("");
    setStatus("Preparing the page…");
    setPageNumber(next);
  }
  return (
    <>
      <div className={styles.toolbar} aria-label="PDF controls">
        <div className={styles.controlGroup}>
          <button
            type="button"
            aria-label="Previous page"
            disabled={!pdf || pageNumber <= 1}
            onClick={() => changePage(pageNumber - 1)}
          >
            ←
          </button>
          <label>
            Page{" "}
            <select
              aria-label="PDF page"
              value={pageNumber}
              disabled={!pdf}
              onChange={(event) => changePage(Number(event.target.value))}
            >
              {Array.from({ length: asset.pageCount }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} of {asset.pageCount}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Next page"
            disabled={!pdf || pageNumber >= asset.pageCount}
            onClick={() => changePage(pageNumber + 1)}
          >
            →
          </button>
        </div>
        <div className={styles.controlGroup}>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= 0.75}
            onClick={() => setZoom((value) => value - 0.25)}
          >
            −
          </button>
          <button type="button" onClick={() => setZoom(1)}>
            Fit
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= 2}
            onClick={() => setZoom((value) => value + 0.25)}
          >
            +
          </button>
          <span className={styles.zoom}>{Math.round(zoom * 100)}%</span>
        </div>
      </div>
      {(target.rowId || target.blockId || target.excerpt) && (
        <p className={styles.sourceHint}>
          Cited page {target.page}
          {target.rowId ? ` · Row ${target.rowId}` : target.blockId ? ` · ${target.blockId}` : ""}
          {target.excerpt && (
            <>
              <br />“{target.excerpt}”
            </>
          )}
        </p>
      )}
      <div
        className={styles.paperStage}
        ref={container}
        aria-busy={readyPage !== pageNumber}
        tabIndex={0}
        role="region"
        aria-label="Original PDF page"
      >
        <canvas
          ref={canvas}
          style={{ visibility: readyPage === pageNumber ? "visible" : "hidden" }}
          role="img"
          aria-label={`${asset.title}, original page ${pageNumber}`}
        />
      </div>
      <p className={styles.renderStatus} role={error ? "alert" : "status"}>
        {error ?? status}
      </p>
      <div className={styles.footer}>
        <span>
          {asset.provenance === "synthetic_handwriting"
            ? "Synthetic handwriting-style · Not human-written"
            : asset.provenance === "visitor_upload"
              ? "Your original · Temporary browser storage"
              : "Original fictional demo document"}
        </span>
        <a href={asset.pdfPath} download={asset.name}>
          Download PDF ↗
        </a>
        <a href={asset.pdfPath} target="_blank" rel="noopener noreferrer">
          Open original ↗
        </a>
      </div>
      <details className={styles.textDetails}>
        <summary>Page text & accessibility</summary>
        <p>
          {pageText ||
            "This page has no embedded text layer. Read its image or open the original. Image-only pages are interpreted during document processing; no hidden transcription is supplied."}
        </p>
      </details>
    </>
  );
}

export function PdfViewer({
  selection,
  onClose,
  origin,
}: {
  selection: { asset: ViewerAsset; target: SourceReference } | null;
  onClose(): void;
  origin?: PaperOrigin | undefined;
}) {
  return (
    <PaperDialog
      open={selection !== null}
      onClose={onClose}
      title={selection?.asset.title ?? "Original document"}
      caption={
        selection
          ? `${selection.asset.label ?? "Your original"} · PDF · ${selection.asset.pageCount} ${selection.asset.pageCount === 1 ? "page" : "pages"}`
          : "PDF"
      }
      size="paper"
      origin={origin}
    >
      {selection && (
        <PdfPage
          key={`${selection.asset.id}:${selection.target.page}:${selection.target.rowId ?? selection.target.blockId ?? ""}`}
          {...selection}
        />
      )}
    </PaperDialog>
  );
}
