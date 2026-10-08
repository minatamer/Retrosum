import {
  exportManifestSchema,
  exportOptionsSchema,
  type ExportOptions,
  type MoneySession,
} from "@retrosum/contracts";
import { validateSession } from "./commands.js";
import { buildDashboard } from "./dashboard.js";
import { invoiceAmounts } from "./invoices.js";
import { formatAmount } from "./amount.js";
import { isRetroCurrent, renderRetroResponse, formatRetroFact } from "./retro.js";

export const decimalAmount = (minor: number) => (minor / 100).toFixed(2);
type Cell = string | number | boolean | null | undefined;
export function serializeCsv(headers: string[], rows: Cell[][]) {
  const cell = (value: Cell, numeric: boolean) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (
      !numeric &&
      (/^\s*[=+\-@]/u.test(text) ||
        text.charCodeAt(0) < 32 ||
        [...(text.match(/^\s+/u)?.[0] ?? "")].some((char) => char.charCodeAt(0) < 32))
    )
      text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    [
      headers.map((h) => cell(h, false)).join(","),
      ...rows.map((row) =>
        row
          .map((value, i) =>
            cell(
              value,
              /(?:_usd$|^(?:quantity|line|page|revision|bytes|occurrences)$)/u.test(
                headers[i] ?? "",
              ),
            ),
          )
          .join(","),
      ),
    ].join("\r\n") + "\r\n"
  );
}
export function safeExportFilename(input: string) {
  let name = [...input.normalize("NFKC")]
    .map((char) => (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? "_" : char))
    .join("")
    .replace(/[<>:"/\\|?*]/gu, "_")
    .replace(/[. ]+$/u, "")
    .slice(0, 100);
  if (!name || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(name))
    name = `document_${name || "file"}`;
  return name;
}
export function originalExportPaths(session: MoneySession) {
  return session.workspace.documents.map((doc, i) => ({
    documentId: doc.id,
    path: `originals/${String(i + 1).padStart(2, "0")}-${safeExportFilename(doc.name).replace(/\.pdf$/iu, "")}.pdf`,
  }));
}

export function createExportRedactor(session: MoneySession, options: ExportOptions) {
  const w = session.workspace;
  const identifiers = [
    ...w.business.ownedAccountReferences,
    ...w.contacts.map((c) => c.email ?? ""),
    ...w.payments.map((p) => p.reference),
    ...w.payments.flatMap((p) => [p.fromAccount ?? "", p.toAccount ?? ""]),
  ]
    .filter((v) => v.length >= 3)
    .sort((a, b) => b.length - a.length);
  return (text: string) => {
    if (options.sensitive) return text;
    for (const id of identifiers) text = text.split(id).join("[redacted]");
    return text
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[redacted]")
      .replace(/\b[A-Z]{2}\d{2}(?:[A-Z0-9] ?){11,30}\b/giu, "[redacted]")
      .replace(/\b\d(?:[ -]?\d){5,}\b/gu, "[redacted]");
  };
}
/** Produces inert output strings only; never imports platform, storage or PDF/ZIP code. */
export function buildExportBundle(
  input: MoneySession,
  optionsInput: ExportOptions,
  exportedAt: string,
) {
  const session = validateSession(input),
    options = exportOptionsSchema.parse(optionsInput),
    w = session.workspace;
  const catalogue = buildDashboard(w, session.filters),
    redact = createExportRedactor(session, options);
  const safeScope = {
    ...session.filters,
    ...(session.filters.category ? { category: redact(session.filters.category) } : {}),
  };
  const scrub = (value: unknown): unknown => {
    if (typeof value === "string") return redact(value);
    if (Array.isArray(value)) return value.map(scrub);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            options.sensitive ||
            ![
              "email",
              "excerpt",
              "raw",
              "normalized",
              "reviewNotes",
              "notes",
              "fromAccount",
              "toAccount",
            ].includes(key),
        )
        .map(([key, item]) => [
          key.endsWith("Minor") ? `${key.slice(0, -5)}Usd` : key,
          key.endsWith("Minor") && typeof item === "number"
            ? decimalAmount(item)
            : typeof item === "string" &&
                [
                  "id",
                  "documentId",
                  "counterpartyId",
                  "customerId",
                  "eventId",
                  "sha256",
                  "occurredOn",
                  "dueOn",
                  "issuedOn",
                  "asOf",
                  "quantity",
                ].includes(key)
              ? item
              : scrub(item),
        ]),
    );
  };
  const eligibleIds = new Set(
    [
      ...(catalogue.facts.income?.contributors ?? []),
      ...(catalogue.facts.costs?.contributors ?? []),
    ].map((r) => r.id),
  );
  const excluded = new Map(
    [...(catalogue.facts.income?.excluded ?? []), ...(catalogue.facts.costs?.excluded ?? [])].map(
      (r) => [r.id, r.reason],
    ),
  );
  const source = (refs: { documentId: string; page: number }[]) =>
    refs.map((r) => `${r.documentId}:p${r.page}`).join(";");
  const text = (v: string | undefined) => redact(v ?? "");
  const files: Record<string, string> = {};
  const csv = (name: string, headers: string[], rows: Cell[][]) => {
    files[name] = serializeCsv(headers, rows);
  };
  csv(
    "financial-events.csv",
    [
      "id",
      "kind",
      "counterparty_id",
      "description",
      "date",
      "due_date",
      "gross_usd",
      "net_usd",
      "tax_usd",
      "currency",
      "basis",
      "category",
      "status",
      "included_in_period",
      "exclusion_reason",
      "paid_claim",
      "balance_state",
      "reference",
      "origin",
      "edited_revision",
      "sources",
    ],
    w.events.map((r) => [
      r.id,
      r.kind,
      r.counterpartyId,
      text(r.description),
      r.occurredOn,
      r.dueOn,
      decimalAmount(r.amountMinor),
      r.netMinor === undefined ? "" : decimalAmount(r.netMinor),
      r.taxMinor === undefined ? "" : decimalAmount(r.taxMinor),
      "USD",
      r.netMinor === undefined ? "stated document total" : "net, explicit tax separate",
      text(r.category),
      r.status,
      eligibleIds.has(r.id),
      excluded.get(r.id) ??
        (eligibleIds.has(r.id) ? "" : "Outside selected scope or unavailable basis"),
      r.paidClaim,
      r.balanceState,
      text(r.reference),
      r.origin,
      r.editedAtRevision,
      source(r.sources),
    ]),
  );
  csv(
    "invoices.csv",
    [
      "id",
      "number",
      "customer_id",
      "issue_date",
      "due_date",
      "status",
      "net_usd",
      "tax_usd",
      "gross_usd",
      "event_id",
      "origin",
      "edited_revision",
      "sources",
    ],
    w.invoices.map((r) => {
      const a = invoiceAmounts(r);
      return [
        r.id,
        text(r.number),
        r.customerId,
        r.issuedOn,
        r.dueOn,
        r.status,
        decimalAmount(a.netMinor),
        decimalAmount(a.taxMinor),
        decimalAmount(a.grossMinor),
        r.eventId,
        r.origin,
        r.editedAtRevision,
        source(r.sources),
      ];
    }),
  );
  csv(
    "invoice-lines.csv",
    ["invoice_id", "line_id", "line", "description", "quantity", "unit_usd", "total_usd"],
    w.invoices.flatMap((r) => {
      const a = invoiceAmounts(r);
      return r.lines.map((l, i) => [
        r.id,
        `${r.id}:line${i + 1}`,
        i + 1,
        text(l.description),
        l.quantity,
        decimalAmount(l.unitPriceMinor),
        decimalAmount(a.lines[i]!),
      ]);
    }),
  );
  csv(
    "contacts.csv",
    ["id", "name", "role", "email"],
    w.contacts.map((r) => [r.id, text(r.name), r.role, options.sensitive ? r.email : "[redacted]"]),
  );
  csv(
    "documents.csv",
    [
      "id",
      "name",
      "mime",
      "pages",
      "bytes",
      "sha256",
      "kind",
      "state",
      "disposition",
      "provenance",
      "recognition_mode",
      "review_blocked",
    ],
    w.documents.map((r) => [
      r.id,
      text(r.name),
      r.mime,
      r.pageCount,
      r.byteLength,
      r.sha256,
      r.kind,
      r.state,
      r.disposition,
      r.provenance,
      r.recognitionMode ?? "uninterpreted",
      r.reviewBlocked,
    ]),
  );
  csv(
    "payments.csv",
    [
      "type",
      "id",
      "date",
      "direction",
      "amount_usd",
      "counterparty_id",
      "reference",
      "from_account",
      "to_account",
      "origin",
      "edited_revision",
      "sources",
    ],
    [
      ...w.payments.map((r) => [
        "recorded_movement",
        r.id,
        r.occurredOn,
        r.direction,
        decimalAmount(r.amountMinor),
        r.counterpartyId,
        options.sensitive ? r.reference : "[redacted]",
        options.sensitive ? r.fromAccount : "[redacted]",
        options.sensitive ? r.toAccount : "[redacted]",
        r.origin,
        r.editedAtRevision,
        source(r.sources),
      ]),
      ...w.events
        .filter((r) => r.paidClaim)
        .map((r) => [
          "source_paid_claim_no_cash",
          r.id,
          r.occurredOn,
          "claim_only",
          decimalAmount(r.amountMinor),
          r.counterpartyId,
          text(r.reference),
          "",
          "",
          r.origin,
          r.editedAtRevision,
          source(r.sources),
        ]),
    ],
  );
  csv(
    "matches.csv",
    ["type", "record_id", "target_id", "amount_usd", "state", "evidence"],
    [
      ...w.payments.flatMap((r) =>
        r.allocations.map((a) => [
          "payment_allocation",
          r.id,
          a.eventId,
          decimalAmount(a.amountMinor),
          "confirmed",
          source(r.sources),
        ]),
      ),
      ...w.issues
        .filter((r) => r.code === "payment_match" || r.code === "duplicate")
        .map((r) => [
          r.code,
          r.id,
          r.documentIds.join(";"),
          "",
          r.resolved ? "resolved" : "review",
          r.documentIds.join(";"),
        ]),
      ...w.documents
        .filter((r) => r.disposition === "duplicate")
        .map((r) => ["duplicate_source", r.id, "", "", "excluded", r.sha256]),
      ...w.events
        .filter((r) => new Set(r.sources.map((s) => s.documentId)).size > 1)
        .flatMap((r) =>
          r.sources.map((s) => [
            "source_rendition",
            s.documentId,
            r.id,
            "",
            "shared_canonical_event",
            source([s]),
          ]),
        ),
    ],
  );
  csv(
    "issues.csv",
    ["id", "code", "documents", "message", "resolved"],
    w.issues.map((r) => [r.id, r.code, r.documentIds.join(";"), text(r.message), r.resolved]),
  );
  const overview = [
    `# ${text(w.business.name)} - Retrosum demo overview`,
    `Revision ${w.revision} | USD | ${session.filters.from} to ${session.filters.to} | As of ${catalogue.scope.asOf}`,
    `Category: ${text(session.filters.category) || "All"}; counterparty: ${session.filters.counterpartyId ?? "All"}.`,
    "",
    "All registers contain the inspectable captured graph, including excluded, historical and draft records. Inclusion columns describe this selected dashboard scope. No hidden records are added.",
    "",
    ...Object.values(catalogue.facts)
      .filter((f) =>
        [
          "income",
          "costs",
          "profit",
          "margin",
          "cash_in",
          "cash_out",
          "customer_open",
          "supplier_open",
          "coverage",
        ].includes(f.id),
      )
      .map(
        (f) =>
          `- ${f.label}: ${f.value === null ? "Unavailable" : f.unit === "money" ? formatAmount(f.value) : f.unit === "percent" ? `${(f.value / 10).toFixed(1)}%` : f.value} (${f.basis}; ${f.dateBasis})`,
      ),
    "",
    "Drafts are not income. Paid claims do not establish recorded cash. Owned transfers are excluded from operating cash. Held/duplicate sources do not contribute without eligible supporting evidence.",
    "",
    "Demo output, not audited accounts, a tax certificate or evidence of real money execution. Downloads remain on your device after reset; provider-controlled copies cannot be recalled by browser cleanup.",
  ];
  files["overview.md"] = overview.join("\n");
  files["insights.md"] = [
    "# Current deterministic observations",
    `Captured revision ${w.revision}.`,
    "",
    ...Object.values(catalogue.facts)
      .filter(
        (f) =>
          f.value !== null &&
          ["profit", "cash_net", "customer_open", "supplier_open"].includes(f.id),
      )
      .map(
        (f) =>
          `${f.label}: ${formatRetroFact(f)}. ${f.basis}. Sources: ${source(f.sources) || "Session-created records"}.`,
      ),
  ].join("\n");
  if (options.conversation)
    files["conversation.md"] = [
      "# Optional conversation",
      `Captured revision ${w.revision}. Stale observations are historical and do not describe current figures.`,
      ...session.messages
        .filter((m) => options.sensitive || m.response)
        .map((m) => {
          if (!m.response) return `${m.role} | revision ${m.revision}\n${m.text}`;
          const r = m.response!;
          if (!isRetroCurrent(r, w, catalogue.scope))
            return `Retro | revision ${m.revision} | ${r.mode} | STALE\n${options.sensitive ? `${m.text}\nStored historical response metadata (not current figures): ${JSON.stringify(r)}` : "Historic narrative omitted by default."}`;
          const rendered = renderRetroResponse(r, catalogue);
          return `Retro | revision ${m.revision} | ${r.mode}\n${text(rendered.intro)}\n${rendered.facts.map((f) => `${text(f.label)}: ${formatRetroFact(f)}; sources ${source(f.sources)}`).join("\n")}`;
        }),
    ].join("\n\n");
  files["workspace.json"] = JSON.stringify(
    {
      exportVersion: 1,
      scope: safeScope,
      workspace: scrub(w),
      financialFacts: Object.fromEntries(
        Object.entries(catalogue.facts).map(([id, f]) => [
          id,
          {
            value: f.value === null ? null : f.unit === "money" ? decimalAmount(f.value) : f.value,
            unit: f.unit === "money" ? "USD_decimal" : f.unit,
            basis: f.basis,
            sources: scrub(f.sources),
          },
        ]),
      ),
    },
    null,
    2,
  );
  const manifest = exportManifestSchema.parse({
    exportVersion: 1,
    workspaceId: w.id,
    revision: w.revision,
    scope: safeScope,
    asOf: catalogue.scope.asOf,
    currency: "USD",
    exportedAt,
    modes: [
      ...new Set([...w.documents.map((d) => d.recognitionMode ?? "uninterpreted"), "manual"]),
    ],
    files: [
      ...Object.keys(files),
      "manifest.json",
      ...(options.originals ? originalExportPaths(session).map((r) => r.path) : []),
    ],
    options,
    policy: options.sensitive
      ? "Full summary/source identifiers and optional conversation are included. Originals, when selected, are unredacted original bytes."
      : "Contact extensions, payment/account identifiers and source raw/excerpt/note copies are omitted or masked; text patterns are masked across output. Optional conversation omits user/free historical narrative. Original PDFs are excluded unless explicitly selected; selected originals retain all unredacted contents. This is data minimization, not anonymization.",
  });
  files["manifest.json"] = JSON.stringify(manifest, null, 2);
  if (Object.values(files).reduce((sum, f) => sum + f.length, 0) > 8 * 1024 * 1024)
    throw new RangeError(
      "Structured export exceeds its size limit. Narrow the workspace and retry.",
    );
  return {
    files,
    manifest,
    overview: files["overview.md"],
    recordCounts: {
      events: w.events.length,
      invoices: w.invoices.length,
      payments: w.payments.length,
      contacts: w.contacts.length,
      documents: w.documents.length,
      issues: w.issues.length,
    },
  };
}
