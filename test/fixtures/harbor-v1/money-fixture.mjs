import truth from "./ground-truth.json" with { type: "json" };
import manifest from "../../../apps/frontend/src/features/documents/sample-manifest.json" with { type: "json" };
import { sessionSchema, SESSION_LIFETIME_MS } from "../../../packages/contracts/dist/index.js";

// Test-only transcription. Production never imports this completed ledger.
export function harborSession() {
  const names = [...new Set(truth.events.map((record) => record.counterparty))];
  const contacts = names.map((name, index) => ({
    id: `contact_harbor${index}`,
    name,
    role: truth.events.some((event) => event.counterparty === name && event.direction === "income")
      ? "customer"
      : "vendor",
  }));
  const source = (label, page, rowId) => ({
    documentId: manifest.documents.find((doc) => doc.label === label).id,
    page,
    ...(rowId ? { rowId } : {}),
  });
  const events = truth.events.map((record, index) => ({
    id: `event_harbor${index}`,
    kind: record.direction === "income" ? "sale" : "cost",
    counterpartyId: contacts.find((contact) => contact.name === record.counterparty).id,
    description: record.reference,
    reference: record.reference,
    occurredOn: record.date,
    ...(record.dueDate ? { dueOn: record.dueDate } : {}),
    amountMinor: record.grossCents,
    netMinor: record.netCents,
    taxMinor: record.taxCents,
    currency: "USD",
    basis: "gross",
    status: "posted",
    paidClaim: record.status === "paid",
    balanceState: record.status,
    category: record.category,
    origin: "document",
    sources: [
      source(record.document, record.page),
      ...(record.reference === "A-77" ? [source("D06", 1)] : []),
    ],
  }));
  const payments = truth.payments.map((record, index) => {
    const event = events.find((item) => item.reference === record.reference);
    return {
      id: `payment_harbor${index}`,
      occurredOn: record.date,
      direction:
        record.kind === "internal_transfer"
          ? "internal_transfer"
          : record.signedCents > 0
            ? "in"
            : "out",
      amountMinor: Math.abs(record.signedCents),
      currency: "USD",
      reference: record.rowId,
      allocations: event ? [{ eventId: event.id, amountMinor: Math.abs(record.signedCents) }] : [],
      ...(event
        ? { counterpartyId: event.counterpartyId }
        : { fromAccount: "checking", toAccount: "reserve" }),
      sources: [source(record.document, record.page, record.rowId)],
      origin: "document",
    };
  });
  return sessionSchema.parse({
    workspace: {
      id: "workspace_harbor",
      schemaVersion: 1,
      revision: 0,
      createdAt: 1000,
      expiresAt: 1000 + SESSION_LIFETIME_MS,
      business: {
        name: "Harbor Studio",
        currency: "USD",
        ownedAccountReferences: ["checking", "reserve"],
      },
      asOf: manifest.asOf,
      documents: manifest.documents.map(
        ({
          label: _label,
          title: _title,
          layoutFamily: _layout,
          pdfPath: _pdf,
          thumbnailPath: _thumb,
          duplicateOf,
          ...doc
        }) => ({ ...doc, state: "ready", disposition: duplicateOf ? "duplicate" : "active" }),
      ),
      contacts,
      events,
      payments,
      invoices: [],
      issues: [],
    },
    appliedCommandIds: [],
    undo: null,
    filters: { from: "2026-09-01", to: "2026-09-30", register: "invoices" },
    messages: [],
  });
}
