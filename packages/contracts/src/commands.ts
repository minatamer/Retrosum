import { z } from "zod";
import {
  commandIdSchema,
  workspaceIdSchema,
  revisionSchema,
  eventIdSchema,
  contactIdSchema,
  paymentIdSchema,
  invoiceIdSchema,
  documentIdSchema,
} from "./ids.js";
import {
  eventSchema,
  contactSchema,
  paymentSchema,
  invoiceSchema,
  businessIdentitySchema,
  dateSchema,
} from "./records.js";
import { documentSchema } from "./source.js";
export const actionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("create_event"), record: eventSchema }),
  z.strictObject({ type: z.literal("update_event"), record: eventSchema }),
  z.strictObject({ type: z.literal("delete_event"), id: eventIdSchema }),
  z.strictObject({ type: z.literal("create_contact"), record: contactSchema }),
  z.strictObject({ type: z.literal("update_contact"), record: contactSchema }),
  z.strictObject({ type: z.literal("delete_contact"), id: contactIdSchema }),
  z.strictObject({ type: z.literal("create_payment"), record: paymentSchema }),
  z.strictObject({ type: z.literal("update_payment"), record: paymentSchema }),
  z.strictObject({ type: z.literal("delete_payment"), id: paymentIdSchema }),
  z.strictObject({ type: z.literal("create_invoice"), record: invoiceSchema }),
  z.strictObject({ type: z.literal("update_invoice"), record: invoiceSchema }),
  z.strictObject({ type: z.literal("delete_invoice"), id: invoiceIdSchema }),
  z.strictObject({
    type: z.literal("review_document"),
    documentId: documentIdSchema,
    decision: z.enum(["accept", "hold", "duplicate"]),
  }),
]);
export const commandSchema = z.strictObject({
  id: commandIdSchema,
  workspaceId: workspaceIdSchema,
  basedOnRevision: revisionSchema,
  actions: z.array(actionSchema).min(1).max(5),
});
export const proposalSchema = z.strictObject({
  command: commandSchema,
  summary: z.string().min(1).max(500),
  state: z.enum(["proposed", "filling", "awaiting_confirmation", "applied", "cancelled"]),
});
export const reviewIssueSchema = z.strictObject({
  id: z.string().regex(/^issue_[A-Za-z0-9_-]{1,96}$/u),
  code: z.enum([
    "duplicate",
    "ambiguous_amount",
    "business_role",
    "payment_match",
    "missing_field",
  ]),
  documentIds: z.array(documentIdSchema).min(1).max(10),
  message: z.string().min(1).max(300),
  resolved: z.boolean(),
});
export const workspaceSchema = z.strictObject({
  id: workspaceIdSchema,
  schemaVersion: z.literal(1),
  revision: revisionSchema,
  createdAt: z.number().int().safe().nonnegative(),
  expiresAt: z.number().int().safe().nonnegative(),
  business: businessIdentitySchema,
  asOf: dateSchema,
  documents: z.array(documentSchema).max(10),
  contacts: z.array(contactSchema).max(200),
  events: z.array(eventSchema).max(1000),
  payments: z.array(paymentSchema).max(1000),
  invoices: z.array(invoiceSchema).max(200),
  issues: z.array(reviewIssueSchema).max(100),
});
export const undoReceiptSchema = z.strictObject({
  commandId: commandIdSchema,
  workspaceId: workspaceIdSchema,
  appliedAtRevision: revisionSchema,
  before: workspaceSchema,
  label: z.string().min(1).max(160),
});
export type SessionAction = z.infer<typeof actionSchema>;
export type SessionCommand = z.infer<typeof commandSchema>;
export type ChangeProposal = z.infer<typeof proposalSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type UndoReceipt = z.infer<typeof undoReceiptSchema>;
export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
