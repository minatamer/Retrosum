import { z } from "zod";
export const workspaceIdSchema = z
  .string()
  .regex(/^workspace_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"WorkspaceId">();
export const documentIdSchema = z
  .string()
  .regex(/^document_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"DocumentId">();
export const eventIdSchema = z
  .string()
  .regex(/^event_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"EventId">();
export const paymentIdSchema = z
  .string()
  .regex(/^payment_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"PaymentId">();
export const contactIdSchema = z
  .string()
  .regex(/^contact_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"ContactId">();
export const invoiceIdSchema = z
  .string()
  .regex(/^invoice_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"InvoiceId">();
export const commandIdSchema = z
  .string()
  .regex(/^command_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"CommandId">();
export const requestIdSchema = z
  .string()
  .regex(/^request_[A-Za-z0-9_-]{1,96}$/u)
  .brand<"RequestId">();
export const revisionSchema = z.number().int().safe().min(0).max(1_000_000);
export type WorkspaceId = z.infer<typeof workspaceIdSchema>;
export type DocumentId = z.infer<typeof documentIdSchema>;
export type EventId = z.infer<typeof eventIdSchema>;
export type PaymentId = z.infer<typeof paymentIdSchema>;
export type ContactId = z.infer<typeof contactIdSchema>;
export type InvoiceId = z.infer<typeof invoiceIdSchema>;
