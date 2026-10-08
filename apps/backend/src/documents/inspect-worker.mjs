import { parentPort } from "node:worker_threads";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

// Request-scoped, terminated by the parent on cancellation/deadline. No file writes or URLs.
parentPort.once("message", async (bytes) => {
  let task;
  try {
    const raw = Buffer.from(bytes).toString("latin1");
    if (
      !raw.startsWith("%PDF-") ||
      /\/(?:Encrypt|JavaScript|JS|Launch|OpenAction|AA|EmbeddedFile|RichMedia|XFA)\b/u.test(raw)
    )
      throw new Error("unsafe_pdf");
    task = getDocument({
      data: new Uint8Array(bytes),
      enableXfa: false,
      useSystemFonts: false,
      stopAtErrors: true,
      maxImageSize: 12_000_000,
      verbosity: 0,
    });
    const pdf = await task.promise;
    if (
      pdf.numPages < 1 ||
      pdf.numPages > 20 ||
      (await pdf.getJSActions()) ||
      (await pdf.getAttachments())
    )
      throw new Error("unsafe_pdf");
    const pages = [];
    let imageWork = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const box = page.getViewport({ scale: 1 });
      if (box.width <= 0 || box.height <= 0 || box.width > 10000 || box.height > 10000)
        throw new Error("pdf_dimensions");
      if (await page.getJSActions()) throw new Error("unsafe_pdf");
      const annotations = await page.getAnnotations();
      if (
        annotations.some(
          (item) => item.url || item.unsafeUrl || item.actions || item.file || item.action,
        )
      )
        throw new Error("unsafe_pdf");
      const operators = await page.getOperatorList();
      if (operators.fnArray.length > 100000) throw new Error("pdf_complexity");
      for (let i = 0; i < operators.fnArray.length; i++) {
        const op = operators.fnArray[i];
        const args = operators.argsArray[i];
        if (
          [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].includes(
            op,
          )
        ) {
          const image = typeof args[0] === "object" ? args[0] : { width: args[1], height: args[2] };
          const pixels = image.width * image.height;
          if (!Number.isFinite(pixels) || pixels > 12_000_000 || pixels < 0)
            throw new Error("pdf_image_limit");
          imageWork += pixels;
          if (imageWork > 80_000_000) throw new Error("pdf_image_limit");
        }
      }
      const content = await page.getTextContent();
      const text = content.items
        .filter((item) => "str" in item)
        .map((item) => item.str)
        .join(" ");
      if (text.length > 50000) throw new Error("pdf_text_limit");
      pages.push({ page: n, text, raster: text.trim().length === 0 });
      page.cleanup();
    }
    parentPort.postMessage({ pages });
  } catch {
    parentPort.postMessage({ error: "unsupported_pdf" });
  } finally {
    await task?.destroy().catch(() => undefined);
  }
});
