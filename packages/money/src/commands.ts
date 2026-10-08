import {
  commandSchema,
  eventIdSchema,
  sessionSchema,
  type MoneySession,
  type SessionCommand,
  type Workspace,
  type Invoice,
} from "@retrosum/contracts";
import { validateGraph } from "./graph.js";
import { invoiceAmounts } from "./invoices.js";

function replace<T extends { id: string }>(records: T[], record: T, create: boolean) {
  const index = records.findIndex((item) => item.id === record.id);
  if (create && index !== -1) throw new RangeError("Record identity already exists.");
  if (!create && index === -1) throw new RangeError("Record no longer exists.");
  if (index === -1) records.push(record);
  else records[index] = record;
}
function remove<T extends { id: string }>(records: T[], id: string) {
  if (!records.some((record) => record.id === id)) throw new RangeError("Record no longer exists.");
  return records.filter((record) => record.id !== id);
}
function removeEvent(workspace: Workspace, id: string) {
  workspace.events = remove(workspace.events, id);
  workspace.payments = workspace.payments.map((payment) => ({
    ...payment,
    allocations: payment.allocations.filter((allocation) => allocation.eventId !== id),
  }));
}
function preserveSources(
  before: { sources: unknown[]; origin: string } | undefined,
  after: { sources: unknown[]; origin: string },
) {
  if (
    before &&
    (before.origin !== after.origin ||
      JSON.stringify(before.sources) !== JSON.stringify(after.sources))
  )
    throw new RangeError("Editing a record must preserve its original source references.");
}
function synchronizeInvoice(workspace: Workspace, invoice: Invoice) {
  const old = workspace.invoices.find((record) => record.id === invoice.id);
  preserveSources(old, invoice);
  if (old?.status === "issued" && invoice.status === "draft")
    throw new RangeError(
      "An issued invoice cannot become a draft. Delete it after reviewing its payment impact.",
    );
  if (old?.eventId && invoice.eventId !== old.eventId)
    throw new RangeError("An invoice cannot replace its owned event identity.");
  if (invoice.status === "draft") {
    if (invoice.eventId) throw new RangeError("Drafts do not post an event.");
    return invoice;
  }
  const eventId =
    old?.eventId ?? eventIdSchema.parse(`event_${invoice.id.slice("invoice_".length)}`);
  if (!old?.eventId && workspace.events.some((record) => record.id === eventId))
    throw new RangeError("The generated invoice event identity is already in use.");
  const existing = workspace.events.find((record) => record.id === eventId);
  const amounts = invoiceAmounts(invoice);
  const event = {
    id: eventId,
    kind: "sale" as const,
    counterpartyId: invoice.customerId,
    description: invoice.lines
      .map((line) => line.description)
      .join("; ")
      .slice(0, 240),
    occurredOn: invoice.issuedOn,
    ...(invoice.dueOn ? { dueOn: invoice.dueOn } : {}),
    amountMinor: amounts.grossMinor,
    netMinor: amounts.netMinor,
    taxMinor: amounts.taxMinor,
    currency: "USD" as const,
    basis: "gross" as const,
    status: existing?.status ?? ("posted" as const),
    paidClaim: existing?.paidClaim ?? false,
    balanceState: existing?.balanceState ?? ("open" as const),
    category: "Services",
    reference: invoice.number,
    sources: invoice.sources,
    origin: invoice.origin,
    editedAtRevision: workspace.revision + 1,
  };
  replace(workspace.events, event, !existing);
  return { ...invoice, eventId, editedAtRevision: workspace.revision + 1 };
}
export function validateSession(input: MoneySession): MoneySession {
  const session = sessionSchema.parse(input);
  validateGraph(session.workspace);
  if (session.filters.from > session.filters.to)
    throw new RangeError("The date range is reversed.");
  if (new Set(session.appliedCommandIds).size !== session.appliedCommandIds.length)
    throw new RangeError("Command history contains duplicate identities.");
  if (session.messages.some((message) => message.revision > session.workspace.revision))
    throw new RangeError("A message refers to a future revision.");
  if (session.undo) {
    const undo = session.undo;
    validateGraph(undo.before);
    if (
      undo.workspaceId !== session.workspace.id ||
      undo.before.id !== session.workspace.id ||
      undo.appliedAtRevision !== session.workspace.revision ||
      undo.before.revision + 1 !== undo.appliedAtRevision ||
      undo.before.createdAt !== session.workspace.createdAt ||
      undo.before.expiresAt !== session.workspace.expiresAt ||
      !session.appliedCommandIds.includes(undo.commandId)
    )
      throw new RangeError("Undo receipt does not belong to this revision and session.");
  }
  return session;
}
export function applyCommand(
  input: MoneySession,
  commandInput: SessionCommand,
  label: string,
): MoneySession {
  const session = validateSession(input);
  const command = commandSchema.parse(commandInput);
  if (command.workspaceId !== session.workspace.id)
    throw new RangeError("This action belongs to a different session.");
  if (session.appliedCommandIds.includes(command.id))
    throw new RangeError("This action has already been applied.");
  if (command.basedOnRevision !== session.workspace.revision)
    throw new RangeError("Your workspace changed. Review a fresh action before confirming.");
  if (session.appliedCommandIds.length >= 500)
    throw new RangeError(
      "This demo session reached its 500-action limit. Export and start a fresh session.",
    );
  if (label.length < 1 || label.length > 160) throw new RangeError("Action label is invalid.");
  // Schema parsing creates a detached graph. Failure never mutates the input.
  const workspace = validateGraph(session.workspace);
  for (const action of command.actions) {
    switch (action.type) {
      case "create_contact":
      case "update_contact":
        replace(workspace.contacts, action.record, action.type === "create_contact");
        break;
      case "delete_contact":
        workspace.contacts = remove(workspace.contacts, action.id);
        break;
      case "create_event":
      case "update_event": {
        if (workspace.invoices.some((invoice) => invoice.eventId === action.record.id))
          throw new RangeError("Edit this sale through its invoice.");
        preserveSources(
          workspace.events.find((record) => record.id === action.record.id),
          action.record,
        );
        replace(
          workspace.events,
          { ...action.record, editedAtRevision: workspace.revision + 1 },
          action.type === "create_event",
        );
        break;
      }
      case "delete_event":
        if (workspace.invoices.some((invoice) => invoice.eventId === action.id))
          throw new RangeError("Delete this sale through its invoice.");
        removeEvent(workspace, action.id);
        break;
      case "create_payment":
      case "update_payment":
        preserveSources(
          workspace.payments.find((record) => record.id === action.record.id),
          action.record,
        );
        replace(
          workspace.payments,
          { ...action.record, editedAtRevision: workspace.revision + 1 },
          action.type === "create_payment",
        );
        break;
      case "delete_payment":
        workspace.payments = remove(workspace.payments, action.id);
        break;
      case "create_invoice":
      case "update_invoice":
        replace(
          workspace.invoices,
          {
            ...synchronizeInvoice(workspace, action.record),
            editedAtRevision: workspace.revision + 1,
          },
          action.type === "create_invoice",
        );
        break;
      case "delete_invoice": {
        const invoice = workspace.invoices.find((record) => record.id === action.id);
        workspace.invoices = remove(workspace.invoices, action.id);
        if (invoice?.eventId) removeEvent(workspace, invoice.eventId);
        break;
      }
      case "review_document": {
        const doc = workspace.documents.find((record) => record.id === action.documentId);
        if (!doc || !["ready", "needs_review"].includes(doc.state))
          throw new RangeError("This document is not ready for review.");
        if (action.decision === "accept" && doc.reviewBlocked)
          throw new RangeError(
            "This document has unresolved numeric or role errors. Keep it held and create a corrected manual record.",
          );
        doc.disposition =
          action.decision === "accept"
            ? "active"
            : action.decision === "hold"
              ? "held"
              : "duplicate";
        doc.state = "ready";
        workspace.issues = workspace.issues.map((issue) =>
          issue.documentIds.includes(doc.id) ? { ...issue, resolved: true } : issue,
        );
        break;
      }
    }
  }
  workspace.revision += 1;
  validateGraph(workspace);
  return validateSession({
    ...session,
    workspace,
    appliedCommandIds: [...session.appliedCommandIds, command.id],
    undo: {
      commandId: command.id,
      workspaceId: workspace.id,
      appliedAtRevision: workspace.revision,
      before: session.workspace,
      label,
    },
  });
}
export function undoLatest(
  input: MoneySession,
  expectedRevision: number,
  commandId: string,
): MoneySession {
  const session = validateSession(input);
  const undo = session.undo;
  if (!undo || expectedRevision !== session.workspace.revision || undo.commandId !== commandId)
    throw new RangeError("This Undo is no longer available.");
  return validateSession({
    ...session,
    workspace: { ...undo.before, revision: session.workspace.revision + 1 },
    undo: null,
  });
}
