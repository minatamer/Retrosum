import {
  contactSchema,
  eventSchema,
  invoiceSchema,
  paymentSchema,
  type Contact,
  type FinancialEvent,
  type Invoice,
  type Payment,
  type Workspace,
  type SessionAction,
} from "@retrosum/contracts";
import { parseAmount, sumAmounts } from "./amount.js";
export type RecordSelection =
  | { family: "contacts"; record?: Contact }
  | { family: "costs"; record?: FinancialEvent }
  | { family: "invoices"; record?: Invoice }
  | { family: "payments"; record?: Payment };
export type RecordFormValues = Record<string, string>;
const text = (data: RecordFormValues, name: string) => (data[name] ?? "").trim();
const amount = (data: RecordFormValues, name: string) => {
  const value = parseAmount(text(data, name));
  if (value < 0) throw new RangeError("Amounts must be zero or greater.");
  return value;
};
export function nextInvoiceNumber(workspace: Workspace) {
  let n = workspace.invoices.length + 1;
  while (workspace.invoices.some((row) => row.number.toLowerCase() === `inv-${n}`)) n++;
  return `INV-${n}`;
}
export function buildRecordAction(
  selection: RecordSelection,
  data: RecordFormValues,
  identity: string,
): SessionAction {
  const editing = Boolean(selection.record);
  switch (selection.family) {
    case "contacts":
      return {
        type: editing ? "update_contact" : "create_contact",
        record: contactSchema.parse({
          id: selection.record?.id ?? `contact_${identity}`,
          name: text(data, "name"),
          role: text(data, "role"),
          ...(text(data, "email") ? { email: text(data, "email") } : {}),
        }),
      };
    case "costs": {
      const netMinor = amount(data, "net"),
        taxMinor = amount(data, "tax");
      return {
        type: editing ? "update_event" : "create_event",
        record: eventSchema.parse({
          ...selection.record,
          id: selection.record?.id ?? `event_${identity}`,
          kind: "cost",
          counterpartyId: text(data, "contact"),
          description: text(data, "description"),
          occurredOn: text(data, "date"),
          dueOn: text(data, "due") || undefined,
          amountMinor: sumAmounts([netMinor, taxMinor]),
          netMinor,
          taxMinor,
          currency: "USD",
          basis: "gross",
          status: selection.record?.status ?? "posted",
          paidClaim: text(data, "balance") === "paid",
          balanceState: text(data, "balance"),
          category: text(data, "category"),
          reference: text(data, "reference"),
          sources: selection.record?.sources ?? [],
          origin: selection.record?.origin ?? "session",
        }),
      };
    }
    case "invoices":
      return {
        type: editing ? "update_invoice" : "create_invoice",
        record: invoiceSchema.parse({
          ...selection.record,
          id: selection.record?.id ?? `invoice_${identity}`,
          number: text(data, "number"),
          customerId: text(data, "contact"),
          issuedOn: text(data, "date"),
          dueOn: text(data, "due") || undefined,
          currency: "USD",
          notes: text(data, "notes"),
          status: editing ? text(data, "status") : "draft",
          taxMinor: amount(data, "tax"),
          lines: (data.lineKeys ?? "line0").split(",").map((key) => ({
            description: text(data, `${key}-description`),
            quantity: text(data, `${key}-quantity`),
            unitPriceMinor: amount(data, `${key}-price`),
          })),
        }),
      };
    case "payments": {
      const direction = text(data, "direction"),
        eventId = text(data, "allocation");
      const counterparty = text(data, "contact");
      return {
        type: editing ? "update_payment" : "create_payment",
        record: paymentSchema.parse({
          ...selection.record,
          id: selection.record?.id ?? `payment_${identity}`,
          occurredOn: text(data, "date"),
          direction,
          amountMinor: amount(data, "amount"),
          currency: "USD",
          reference: text(data, "reference"),
          counterpartyId:
            counterparty && direction !== "internal_transfer" ? counterparty : undefined,
          allocations:
            direction === "internal_transfer"
              ? []
              : data.preserveAllocations === "yes" && !eventId
                ? (selection.record?.allocations ?? [])
                : eventId
                  ? [{ eventId, amountMinor: amount(data, "allocated") }]
                  : [],
          fromAccount: direction === "internal_transfer" ? text(data, "from") : undefined,
          toAccount: direction === "internal_transfer" ? text(data, "to") : undefined,
          sources: selection.record?.sources ?? [],
          origin: selection.record?.origin ?? "session",
        }),
      };
    }
  }
}
