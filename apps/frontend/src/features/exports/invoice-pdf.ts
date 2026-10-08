import type { MoneySession, ExportOptions } from "@retrosum/contracts";
import {
  invoiceAmounts,
  formatAmount,
  validateSession,
  createExportRedactor,
} from "@retrosum/money";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/** Browser-local output. No external fonts, invoice delivery, compliance or payment assertion. */
export async function renderInvoicePdf(
  input: MoneySession,
  invoiceId: string,
  fontBytes: Uint8Array,
  signal: AbortSignal,
  options: ExportOptions = { originals: false, sensitive: false, conversation: false },
) {
  const session = validateSession(input),
    w = session.workspace;
  const invoice = w.invoices.find((row) => row.id === invoiceId && row.origin === "session");
  if (!invoice)
    throw new RangeError("Only an invoice created in this session can use this PDF export.");
  if (fontBytes.byteLength > 1024 * 1024)
    throw new RangeError("The invoice font exceeds its resource bound.");
  signal.throwIfAborted();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  const redact = createExportRedactor(session, options);
  const clean = (text: string) => {
    const value = [...text]
      .map((char) => (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? " " : char))
      .join("");
    if ([...value].some((char) => !supported.has(char.codePointAt(0)!)))
      throw new RangeError(
        "This invoice contains characters unsupported by the local PDF font. Its exact fields remain available in the structured export.",
      );
    return value;
  };
  const forest = rgb(0.09, 0.22, 0.17),
    orange = rgb(0.63, 0.25, 0.14),
    muted = rgb(0.34, 0.39, 0.35),
    ivory = rgb(0.98, 0.97, 0.93);
  let page = pdf.addPage([595.28, 841.89]),
    y = 790,
    pageNumber = 0;
  const start = () => {
    pageNumber++;
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: ivory });
    page.drawText("Retrosum.", { x: 42, y: 790, size: 25, font, color: forest });
    page.drawText(`${invoice.status.toUpperCase()} - DEMO INVOICE`, {
      x: 42,
      y: 760,
      size: 11,
      font,
      color: orange,
    });
    page.drawText(`Revision ${w.revision} | USD | Page ${pageNumber}`, {
      x: 42,
      y: 35,
      size: 8,
      font,
      color: muted,
    });
    page.drawText("Demo output. No money sent; no payment or legal compliance certified.", {
      x: 42,
      y: 22,
      size: 8,
      font,
      color: muted,
    });
    y = 725;
  };
  start();
  const ensure = (height: number) => {
    if (y - height < 65) {
      if (pageNumber >= 8) throw new RangeError("Invoice PDF exceeds its eight-page bound.");
      page = pdf.addPage([595.28, 841.89]);
      start();
    }
  };
  const wrap = (text: string, width: number, size: number) => {
    const lines: string[] = [];
    let remainder = clean(text);
    while (remainder) {
      let end = 0;
      for (const char of remainder) {
        if (end && font.widthOfTextAtSize(remainder.slice(0, end) + char, size) > width) break;
        end += char.length;
      }
      const space = remainder.slice(0, end).lastIndexOf(" ");
      if (end < remainder.length && space > 0) end = space + 1;
      lines.push(remainder.slice(0, end).trimEnd());
      remainder = remainder.slice(end).trimStart();
    }
    return lines.length ? lines : [""];
  };
  const paragraph = (text: string, size = 10, color = forest) => {
    for (const line of wrap(text, 511, size)) {
      ensure(size + 7);
      page.drawText(line, { x: 42, y, size, font, color });
      y -= size + 6;
    }
    y -= 5;
  };
  paragraph(`Invoice ${redact(invoice.number)}`, 19);
  paragraph(`From: ${redact(w.business.name)}`);
  paragraph(`Bill to: ${redact(w.contacts.find((c) => c.id === invoice.customerId)!.name)}`);
  paragraph(`Issued: ${invoice.issuedOn} | Due: ${invoice.dueOn ?? "Not specified"}`);
  paragraph(
    invoice.status === "draft"
      ? "Draft - excluded from invoiced income until explicitly issued."
      : "Issued work - payments are separate recorded movements.",
    9,
    muted,
  );
  y -= 12;
  const amounts = invoiceAmounts(invoice);
  for (const [i, line] of invoice.lines.entries()) {
    signal.throwIfAborted();
    const description = wrap(`${i + 1}. ${redact(line.description)}`, 270, 10),
      height = description.length * 15 + 39;
    ensure(height);
    for (const text of description) {
      page.drawText(text, { x: 42, y, size: 10, font, color: forest });
      y -= 15;
    }
    const details = `Qty ${line.quantity}  |  Unit ${formatAmount(line.unitPriceMinor)}  |  Total ${formatAmount(amounts.lines[i]!)}`;
    paragraph(details, 9, muted);
    page.drawLine({
      start: { x: 42, y: y + 2 },
      end: { x: 553, y: y + 2 },
      thickness: 0.5,
      color: rgb(0.72, 0.76, 0.7),
    });
    y -= 12;
  }
  ensure(110);
  paragraph(`Net: ${formatAmount(amounts.netMinor)}`, 11);
  paragraph(`Explicit tax: ${formatAmount(amounts.taxMinor)}`, 11);
  paragraph(`Total due: ${formatAmount(amounts.grossMinor)}`, 18, orange);
  if (options.sensitive && invoice.notes) {
    y -= 12;
    paragraph("Notes", 11);
    paragraph(invoice.notes, 9, muted);
  }
  pdf.setTitle(`Retrosum demo invoice - ${redact(invoice.number)}`);
  pdf.setSubject(
    `Session-created ${invoice.status} invoice, revision ${w.revision}; not a payment receipt`,
  );
  pdf.setCreator("Retrosum browser export");
  signal.throwIfAborted();
  const bytes = await pdf.save();
  signal.throwIfAborted();
  if (bytes.byteLength > 5 * 1024 * 1024)
    throw new RangeError("Invoice PDF exceeds its output bound.");
  return new Uint8Array(bytes);
}
