import { describe, it, expect } from "vitest";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";
import {
  buildExportBundle,
  serializeCsv,
  safeExportFilename,
  applyCommand,
  prepareRetroChange,
} from "../packages/money/dist/index.js";
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
    expect(data.financialFacts.costs.value).toBe("2350.00");
    expect(data.financialFacts.profit.value).toBe("2450.00");
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
});
