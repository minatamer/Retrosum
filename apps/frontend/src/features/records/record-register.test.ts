import { describe, expect, it } from "vitest";
import {
  contactSchema,
  eventSchema,
  invoiceSchema,
  paymentSchema,
  type FinancialEvent,
} from "@retrosum/contracts";
import { recordsInPeriod } from "./record-register";

const range = { from: "2026-09-15", to: "2026-09-30" };
const invoice = (id: string, issuedOn: string, dueOn?: string, draft = false) =>
  invoiceSchema.parse({
    id: `invoice_${id}`,
    number: id,
    customerId: "contact_customer",
    issuedOn,
    dueOn,
    currency: "USD",
    lines: [{ description: "Service", quantity: "1", unitPriceMinor: 100 }],
    notes: "",
    status: draft ? "draft" : "issued",
  });
const cost = (id: string, occurredOn: string, status: FinancialEvent["status"] = "posted") =>
  eventSchema.parse({
    id: `event_${id}`,
    kind: "cost",
    counterpartyId: "contact_vendor",
    description: id,
    occurredOn,
    amountMinor: 100,
    currency: "USD",
    basis: "gross",
    status,
    paidClaim: false,
    sources: [],
    origin: "session",
  });
const payment = (id: string, occurredOn: string, transfer = false) =>
  paymentSchema.parse({
    id: `payment_${id}`,
    occurredOn,
    direction: transfer ? "internal_transfer" : "in",
    amountMinor: 100,
    currency: "USD",
    reference: id,
    allocations: transfer ? [] : [{ eventId: "event_older_sale", amountMinor: 100 }],
    sources: [],
    origin: "session",
  });
const emptyRecords = () => ({
  invoices: [] as ReturnType<typeof invoice>[],
  events: [] as ReturnType<typeof cost>[],
  payments: [] as ReturnType<typeof payment>[],
  contacts: [contactSchema.parse({ id: "contact_customer", name: "Customer", role: "customer" })],
});

describe("Records period selection", () => {
  it("uses inclusive issue dates, not due dates, and retains in-range drafts", () => {
    const records = emptyRecords();
    records.invoices = [
      invoice("HS101", "2026-09-04", "2026-09-18"),
      invoice("start", range.from),
      invoice("HS102", "2026-09-24", "2026-10-08"),
      invoice("end", range.to),
      invoice("after", "2026-10-01"),
      invoice("draft", "2026-09-20", undefined, true),
    ];
    expect(recordsInPeriod(records, range).invoices.map((row) => row.number)).toEqual([
      "start",
      "HS102",
      "end",
      "draft",
    ]);
  });

  it("filters cost dates while retaining held/duplicate rows for inspection", () => {
    const records = emptyRecords();
    records.events = [
      cost("before", "2026-09-14"),
      cost("held", range.from, "held"),
      cost("posted", "2026-09-20"),
      cost("duplicate", range.to, "duplicate"),
      cost("after", "2026-10-01"),
      { ...cost("sale", "2026-09-20"), kind: "sale" },
    ];
    expect(recordsInPeriod(records, range).costs.map((row) => row.description)).toEqual([
      "held",
      "posted",
      "duplicate",
    ]);
  });

  it("uses payment movement dates independently of matches and retains transfers", () => {
    const records = emptyRecords();
    records.payments = [
      payment("before", "2026-09-14"),
      payment("start", range.from),
      payment("transfer", range.to, true),
      payment("after", "2026-10-01"),
    ];
    expect(recordsInPeriod(records, range).payments.map((row) => row.reference)).toEqual([
      "start",
      "transfer",
    ]);
  });

  it("keeps undated contacts and underlying records when another year has no matches", () => {
    const records = emptyRecords();
    records.invoices = [invoice("existing", "2026-09-20")];
    records.events = [cost("existing", "2026-09-20")];
    records.payments = [payment("existing", "2026-09-20")];
    const before = structuredClone(records);
    const selected = recordsInPeriod(records, { from: "2027-01-01", to: "2027-01-31" });
    expect(selected.invoices).toEqual([]);
    expect(selected.costs).toEqual([]);
    expect(selected.payments).toEqual([]);
    expect(selected.contacts).toEqual(records.contacts);
    expect(records).toEqual(before);
  });
});
