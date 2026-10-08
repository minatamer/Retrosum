import { describe, it, expect, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";
import {
  buildExportBundle,
  serializeCsv,
  safeExportFilename,
  applyCommand,
  prepareRetroChange,
} from "../packages/money/dist/index.js";
import { prepareArchive } from "../apps/frontend/src/features/exports/archive.ts";
import { renderInvoicePdf } from "../apps/frontend/src/features/exports/invoice-pdf.ts";
import { unzipSync } from "../apps/frontend/node_modules/fflate/esm/browser.js";
import { inspectPdf } from "../apps/backend/src/documents/inspection.ts";
import { PDFDocument } from "../apps/frontend/node_modules/pdf-lib/es/index.js";
const defaults = { originals: false, sensitive: false, conversation: false },
  at = "2026-10-08T00:00:00Z";
function draftSession() {
  const s = harborSession();
  const p = prepareRetroChange(
    {
      family: "invoices",
      operation: "create",
      query: null,
      fields: [
        { name: "contact", value: s.workspace.contacts[0].id },
        { name: "description", value: "Consulting" },
        { name: "price", value: "2000" },
        { name: "due", value: "2026-11-30" },
      ],
    },
    s.workspace,
    s.filters,
    "draft_export",
  );
  return applyCommand(s, p.command, "Create draft");
}
describe("revision-bound local export", () => {
  it("exports exact baseline, draft and review records from a captured graph without changing it", () => {
    const session = draftSession(),
      copy = JSON.stringify(session);
    const bundle = buildExportBundle(session, defaults, at),
      data = JSON.parse(bundle.files["workspace.json"]);
    expect(data.financialFacts.income.value).toBe("4800.00");
    expect(data.financialFacts.costs.value).toBe("1280.00");
    expect(data.financialFacts.profit.value).toBe("3520.00");
    expect(data.workspace.events[0].occurredOn).toBe(session.workspace.events[0].occurredOn);
    expect(data.workspace.events[0].amountUsd).toMatch(/^\d+\.\d{2}$/);
    expect(bundle.manifest.revision).toBe(session.workspace.revision);
    expect(bundle.manifest.modes).toContain("uninterpreted");
    expect(bundle.files["invoices.csv"]).toContain('"draft"');
    expect(bundle.files["documents.csv"]).toContain('"duplicate"');
    expect(bundle.manifest.files.some((f) => f.startsWith("originals/"))).toBe(false);
    expect(JSON.stringify(session)).toBe(copy);
    session.workspace.revision++;
    expect(JSON.parse(bundle.files["manifest.json"]).revision).not.toBe(session.workspace.revision);
  });
  it("default omission/masking covers raw, notes, excerpts, narratives and copied identifiers; explicit choice retains them", () => {
    const s = draftSession(),
      secret = "GB82WEST12345698765432";
    s.workspace.contacts[0].email = "private@example.com";
    s.workspace.payments[0].reference = secret;
    s.workspace.events[0].description = `Account ${secret} private@example.com`;
    s.workspace.events[0].sources[0].excerpt = secret;
    s.workspace.documents[0].numericFields = [
      {
        key: "account",
        page: 1,
        block: "bank",
        raw: secret,
        normalized: secret,
        scale: "identifier",
        occurrences: 1,
        treatment: "reference",
        check: "visual_review",
      },
    ];
    s.workspace.documents[0].reviewNotes = [secret];
    s.workspace.invoices[0].notes = secret;
    s.messages = [{ id: "test", role: "user", text: secret, revision: s.workspace.revision }];
    const a = buildExportBundle(s, { ...defaults, conversation: true }, at);
    expect(Object.values(a.files).join(" ")).not.toContain(secret);
    expect(Object.values(a.files).join(" ")).not.toContain("private@example.com");
    const b = buildExportBundle(s, { ...defaults, sensitive: true, conversation: true }, at);
    expect(b.files["workspace.json"]).toContain(secret);
    expect(b.files["conversation.md"]).toContain(secret);
  });
  it("quotes inert spreadsheet text, preserves controlled numeric signs and safe collision-resistant original paths", () => {
    const csv = serializeCsv(
      ["description", "amount_usd"],
      [
        ['=HYPERLINK("x")', "-12.34"],
        ["\t@command", "0.00"],
        ['a,"b"\nc', "1.00"],
      ],
    );
    expect(csv).toContain("\"'=HYPERLINK(");
    expect(csv).toContain('"-12.34"');
    expect(csv).toContain('"\'\t@command"');
    expect(csv).toContain('"a,""b""\nc"');
    expect(safeExportFilename("../CON.pdf")).not.toContain("/");
    expect(safeExportFilename("CON.pdf")).toBe("document_CON.pdf");
  });
  it("actual archive has the declared files and exact original PDF bytes only after explicit inclusion", async () => {
    const s = harborSession();
    const files = new Map();
    for (const doc of s.workspace.documents) {
      const path = {
        D01: "harbor-HS-101.pdf",
        D02: "harbor-HS-102.pdf",
        D03: "northstar-A-77-scan.pdf",
        D04: "rent-R-091-handwritten.pdf",
        D05: "papercloud-September.pdf",
        D06: "northstar-A-77-second-copy.pdf",
        D07: "harbor-payments-September.pdf",
        D08: "harbor-August-records.pdf",
      }[doc.id.replace(/^document_/, "")];
      if (path)
        files.set(
          doc.id,
          new Blob([await readFile(`apps/frontend/public/samples/harbor-v1/${path}`)], {
            type: "application/pdf",
          }),
        );
    }
    // Fixture source IDs are checked rather than inferred from a financial row.
    const get = vi.fn(async (doc) => files.get(doc.id) ?? null);
    const plain = unzipSync(
      await prepareArchive(s, defaults, at, get, new AbortController().signal),
    );
    expect(get).not.toHaveBeenCalled();
    expect(Object.keys(plain).sort()).toEqual(
      buildExportBundle(s, defaults, at).manifest.files.sort(),
    );
    if (!files.size) throw new Error("Fixture PDF identity mapping must resolve originals.");
    const withOriginals = unzipSync(
      await prepareArchive(
        s,
        { ...defaults, originals: true },
        at,
        get,
        new AbortController().signal,
      ),
    );
    const originalEntries = Object.keys(withOriginals).filter((p) => p.startsWith("originals/"));
    expect(originalEntries).toHaveLength(s.workspace.documents.length);
    expect(
      Buffer.compare(
        Buffer.from(withOriginals[originalEntries[0]]),
        Buffer.from(await files.get(s.workspace.documents[0].id).arrayBuffer()),
      ),
    ).toBe(0);
  });
  it("missing originals and cancellation fail safely instead of silently omitting requested evidence", async () => {
    const s = harborSession(),
      signal = new AbortController();
    signal.abort();
    await expect(
      prepareArchive(s, defaults, at, async () => null, signal.signal),
    ).rejects.toThrow();
    await expect(
      prepareArchive(
        s,
        { ...defaults, originals: true },
        at,
        async () => null,
        new AbortController().signal,
      ),
    ).rejects.toThrow(/unavailable/);
    const during = new AbortController();
    let release;
    let started;
    const waiting = new Promise((resolve) => {
      started = resolve;
    });
    const getter = vi.fn(() => {
      started();
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const operation = prepareArchive(
      s,
      { ...defaults, originals: true },
      at,
      getter,
      during.signal,
    );
    await waiting;
    during.abort();
    release(null);
    await expect(operation).rejects.toThrow();
    expect(getter).toHaveBeenCalledTimes(1);
  });
  it("creates a local exact draft invoice PDF and rejects imported invoices/unsupported glyphs", async () => {
    let s = harborSession();
    const contact = s.workspace.contacts.find((c) => c.role === "customer");
    const proposal = prepareRetroChange(
      {
        family: "invoices",
        operation: "create",
        query: null,
        fields: [
          { name: "contact", value: contact.id },
          { name: "description", value: "Consulting" },
          { name: "price", value: "2000" },
          { name: "due", value: "2026-11-30" },
        ],
      },
      s.workspace,
      s.filters,
      "export_pdf",
    );
    expect(proposal.kind).toBe("ready");
    s = applyCommand(s, proposal.command, "Create draft");
    const font = new Uint8Array(
      await readFile(
        "apps/frontend/public/pdfjs/6.4.299/standard_fonts/LiberationSans-Regular.ttf",
      ),
    );
    const bytes = await renderInvoicePdf(s, proposal.targetId, font, new AbortController().signal);
    const parsed = await inspectPdf(bytes, new AbortController().signal);
    const text = JSON.stringify(parsed);
    expect(text).toContain("2,000.00");
    expect(text).toContain("2026-11-30");
    expect(text).toContain("DRAFT");
    expect(text).toContain("No money sent");
    const invoice = s.workspace.invoices.find((r) => r.id === proposal.targetId);
    invoice.number = "private@example.com";
    const masked = await renderInvoicePdf(s, proposal.targetId, font, new AbortController().signal);
    expect((await PDFDocument.load(masked)).getTitle()).not.toContain("private@example.com");
    s.workspace.invoices.find((r) => r.id === proposal.targetId).origin = "document";
    s.workspace.invoices.find((r) => r.id === proposal.targetId).sources = [
      { documentId: s.workspace.documents[0].id, page: 1 },
    ];
    await expect(
      renderInvoicePdf(s, proposal.targetId, font, new AbortController().signal),
    ).rejects.toThrow(/created/);
    s.workspace.invoices.find((r) => r.id === proposal.targetId).origin = "session";
    s.workspace.invoices.find((r) => r.id === proposal.targetId).notes = "Unsupported 🦄";
    await expect(
      renderInvoicePdf(s, proposal.targetId, font, new AbortController().signal, {
        ...defaults,
        sensitive: true,
      }),
    ).rejects.toThrow(/unsupported/);
  });
  it("keeps long multi-page invoice lines and totals inside the bounded local PDF", async () => {
    const s = draftSession(),
      invoice = s.workspace.invoices[0];
    invoice.lines = Array.from({ length: 25 }, (_, i) => ({
      ...invoice.lines[0],
      description:
        `Line ${i + 1}: ${"Professional consulting and document review. ".repeat(8)}`.slice(0, 200),
    }));
    const font = new Uint8Array(
      await readFile(
        "apps/frontend/public/pdfjs/6.4.299/standard_fonts/LiberationSans-Regular.ttf",
      ),
    );
    const bytes = await renderInvoicePdf(s, invoice.id, font, new AbortController().signal);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getPageCount()).toBeLessThanOrEqual(8);
    const text = JSON.stringify(await inspectPdf(bytes, new AbortController().signal));
    expect(text).toContain("50,000.00");
    expect(text).toContain("Line 25");
  });
});
