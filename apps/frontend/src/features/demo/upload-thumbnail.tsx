"use client";
import { useEffect, useRef } from "react";
import type { SourceDocument } from "@retrosum/contracts";
import type { PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";
import { useSession } from "../session/session-provider";
import { PDF_RUNTIME_PATH, safePdfOptions } from "../documents/pdf-policy";

export function UploadThumbnail({ doc }: { doc: SourceDocument }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { controller } = useSession();
  useEffect(() => {
    let disposed = false;
    let task: PDFDocumentLoadingTask | undefined;
    let render: RenderTask | undefined;
    const timer = window.setTimeout(() => {
      disposed = true;
      render?.cancel();
      void task?.destroy();
    }, 12000);
    void (async () => {
      const blob = await controller.original(doc);
      if (!blob || disposed) return;
      const library = await import("pdfjs-dist");
      const bytes = await blob.arrayBuffer();
      if (disposed) return;
      library.GlobalWorkerOptions.workerSrc = `${PDF_RUNTIME_PATH}/pdf.worker.min.mjs`;
      task = library.getDocument({ ...safePdfOptions, data: bytes });
      const pdf = await task.promise;
      if (disposed) return;
      const page = await pdf.getPage(1);
      const element = canvas.current;
      if (!element || disposed) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(360 / base.width, 480 / base.height, 1),
      });
      element.width = Math.ceil(viewport.width);
      element.height = Math.ceil(viewport.height);
      render = page.render({ canvas: element, viewport });
      await render.promise;
      window.clearTimeout(timer);
      await task.destroy();
    })().catch(() => undefined);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      render?.cancel();
      void task?.destroy();
    };
  }, [controller, doc]);
  return <canvas ref={canvas} aria-label={`First page of ${doc.name}`} />;
}
