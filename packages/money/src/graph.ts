import {
  SESSION_LIFETIME_MS,
  workspaceSchema,
  type Workspace,
  type SourceReference,
} from "@retrosum/contracts";
import { sumAmounts } from "./amount.js";
import { invoiceAmounts } from "./invoices.js";

function requireCondition(condition: boolean, message: string): asserts condition {
  if (!condition) throw new RangeError(message);
}
function unique(items: readonly { id: string }[], name: string) {
  requireCondition(
    new Set(items.map((item) => item.id)).size === items.length,
    `Duplicate ${name} identity.`,
  );
}
export function validateGraph(input: Workspace): Workspace {
  const workspace = workspaceSchema.parse(input);
  // Bound whole graph aggregates so every narrower date filter is also safe.
  sumAmounts(workspace.events.map((record) => record.amountMinor));
  sumAmounts(workspace.payments.map((record) => record.amountMinor));
  requireCondition(
    workspace.expiresAt === workspace.createdAt + SESSION_LIFETIME_MS,
    "Session expiry must be fixed at two hours.",
  );
  for (const [name, items] of Object.entries({
    documents: workspace.documents,
    contacts: workspace.contacts,
    events: workspace.events,
    payments: workspace.payments,
    invoices: workspace.invoices,
    issues: workspace.issues,
  }))
    unique(items, name);
  requireCondition(
    new Set(workspace.business.ownedAccountReferences).size ===
      workspace.business.ownedAccountReferences.length,
    "Owned account references must be unique.",
  );
  requireCondition(
    workspace.documents.reduce((sum, doc) => sum + doc.byteLength, 0) <= 20 * 1024 * 1024,
    "Document byte limit exceeded.",
  );
  requireCondition(
    workspace.documents.reduce((sum, doc) => sum + doc.pageCount, 0) <= 20,
    "Document page limit exceeded.",
  );
  const contacts = new Map(workspace.contacts.map((record) => [record.id, record]));
  const events = new Map<string, Workspace["events"][number]>(
    workspace.events.map((record) => [record.id, record]),
  );
  const documents = new Map(workspace.documents.map((record) => [record.id, record]));
  const references = (sources: SourceReference[], origin: "document" | "session") => {
    requireCondition(
      new Set(sources.map((source) => JSON.stringify(source))).size === sources.length,
      "Source references must be unique.",
    );
    requireCondition(
      origin !== "document" || sources.length > 0,
      "A document record needs a visible source.",
    );
    for (const source of sources)
      requireCondition(
        Boolean(
          documents.get(source.documentId) &&
          source.page <= (documents.get(source.documentId)?.pageCount ?? 0),
        ),
        "Source document or page is missing.",
      );
  };
  const eventKeys = new Set<string>();
  for (const record of workspace.events) {
    const contact = contacts.get(record.counterpartyId);
    requireCondition(
      Boolean(
        contact &&
        (contact.role === "both" ||
          contact.role === (record.kind === "sale" ? "customer" : "vendor")),
      ),
      "Event counterparty has the wrong role or is missing.",
    );
    references(record.sources, record.origin);
    requireCondition(
      record.dueOn === undefined || record.dueOn >= record.occurredOn,
      "Due date cannot precede the record date.",
    );
    if (record.netMinor !== undefined)
      requireCondition(
        record.taxMinor !== undefined &&
          sumAmounts([record.netMinor, record.taxMinor]) === record.amountMinor,
        "Net plus explicit tax must equal gross.",
      );
    requireCondition(
      record.balanceState !== "open" || !record.paidClaim,
      "An explicitly open record cannot also claim payment.",
    );
    if (record.reference && record.status !== "duplicate") {
      const key = `${record.kind}|${record.counterpartyId}|${record.reference}`;
      requireCondition(
        !eventKeys.has(key),
        "This business reference already has a canonical event. Review the duplicate first.",
      );
      eventKeys.add(key);
    }
  }
  const allocated = new Map<string, number[]>();
  const paymentKeys = new Set<string>();
  for (const record of workspace.payments) {
    references(record.sources, record.origin);
    if (record.counterpartyId)
      requireCondition(contacts.has(record.counterpartyId), "Payment counterparty is missing.");
    if (record.direction === "internal_transfer") {
      requireCondition(
        Boolean(
          record.fromAccount &&
          record.toAccount &&
          record.fromAccount !== record.toAccount &&
          workspace.business.ownedAccountReferences.includes(record.fromAccount) &&
          workspace.business.ownedAccountReferences.includes(record.toAccount),
        ),
        "A transfer needs two distinct accounts owned by this business.",
      );
      requireCondition(record.allocations.length === 0, "Transfers cannot settle sales or costs.");
    } else
      requireCondition(
        record.fromAccount === undefined && record.toAccount === undefined,
        "Account pairs are only used for owned transfers.",
      );
    requireCondition(
      new Set(record.allocations.map((allocation) => allocation.eventId)).size ===
        record.allocations.length,
      "A payment cannot allocate to the same event twice.",
    );
    requireCondition(
      sumAmounts(record.allocations.map((allocation) => allocation.amountMinor)) <=
        record.amountMinor,
      "Payment allocations exceed its amount.",
    );
    for (const allocation of record.allocations) {
      const event = events.get(allocation.eventId);
      requireCondition(
        Boolean(
          event &&
          event.status !== "duplicate" &&
          allocation.amountMinor > 0 &&
          event.counterpartyId === record.counterpartyId &&
          record.direction === (event.kind === "sale" ? "in" : "out"),
        ),
        "Payment matching needs the same counterparty and the correct direction.",
      );
      const values = allocated.get(allocation.eventId) ?? [];
      values.push(allocation.amountMinor);
      allocated.set(allocation.eventId, values);
    }
    if (record.reference) {
      const key = `${record.direction}|${record.counterpartyId ?? ""}|${record.occurredOn}|${record.reference}`;
      requireCondition(
        !paymentKeys.has(key),
        "This payment reference already has a canonical movement.",
      );
      paymentKeys.add(key);
    }
  }
  for (const [id, values] of allocated)
    requireCondition(
      sumAmounts(values) <= (events.get(id)?.amountMinor ?? -1),
      "Matched payments exceed the event's gross amount.",
    );
  const invoiceEvents = new Set<string>();
  const invoiceNumbers = new Set<string>();
  for (const record of workspace.invoices) {
    const customer = contacts.get(record.customerId);
    requireCondition(
      Boolean(customer && customer.role !== "vendor"),
      "Invoice customer is missing or is a vendor.",
    );
    references(record.sources, record.origin);
    requireCondition(
      record.dueOn === undefined || record.dueOn >= record.issuedOn,
      "Invoice due date cannot precede issue date.",
    );
    requireCondition(
      !invoiceNumbers.has(record.number),
      "Invoice numbers must be unique in this workspace.",
    );
    invoiceNumbers.add(record.number);
    if (record.status === "draft")
      requireCondition(record.eventId === undefined, "A draft cannot have a posted event.");
    else {
      const event = record.eventId ? events.get(record.eventId) : undefined;
      const amounts = invoiceAmounts(record);
      requireCondition(
        Boolean(
          event &&
          event.kind === "sale" &&
          event.counterpartyId === record.customerId &&
          event.occurredOn === record.issuedOn &&
          event.dueOn === record.dueOn &&
          event.amountMinor === amounts.grossMinor &&
          event.netMinor === amounts.netMinor &&
          event.taxMinor === amounts.taxMinor,
        ),
        "Issued invoice and its canonical event must agree.",
      );
      requireCondition(
        !invoiceEvents.has(record.eventId ?? ""),
        "Two invoices cannot own the same event.",
      );
      invoiceEvents.add(record.eventId ?? "");
    }
  }
  for (const issue of workspace.issues)
    for (const id of issue.documentIds)
      requireCondition(documents.has(id), "Review issue source is missing.");
  return workspace;
}

export function sourceEligible(
  workspace: Workspace,
  sources: SourceReference[],
  origin: "document" | "session",
) {
  return (
    origin === "session" ||
    sources.some((source) =>
      workspace.documents.some(
        (doc) =>
          doc.id === source.documentId && doc.disposition === "active" && doc.state === "ready",
      ),
    )
  );
}
