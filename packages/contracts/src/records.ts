import { z } from "zod";
import { contactIdSchema, eventIdSchema, paymentIdSchema, invoiceIdSchema } from "./ids.js";
import { sourceReferenceSchema } from "./source.js";
export const MAX_MINOR_UNITS = 1_000_000_000_000;
export const currencySchema = z.literal("USD");
export const minorUnitsSchema = z.number().int().safe().min(-MAX_MINOR_UNITS).max(MAX_MINOR_UNITS);
export const nonnegativeMinorUnitsSchema = minorUnitsSchema.refine((amount) => amount >= 0);
export const moneySchema = z.strictObject({ minor: minorUnitsSchema, currency: currencySchema });
export const dateSchema = z.iso.date();
export const businessIdentitySchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  currency: currencySchema,
  ownedAccountReferences: z.array(z.string().min(1).max(80)).max(10),
});
export const contactSchema = z.strictObject({
  id: contactIdSchema,
  name: z.string().trim().min(1).max(100),
  role: z.enum(["customer", "vendor", "both"]),
  email: z.email().max(160).optional(),
});
export const eventSchema = z.strictObject({
  id: eventIdSchema,
  kind: z.enum(["sale", "cost"]),
  counterpartyId: contactIdSchema,
  description: z.string().trim().min(1).max(240),
  occurredOn: dateSchema,
  dueOn: dateSchema.optional(),
  amountMinor: nonnegativeMinorUnitsSchema,
  currency: currencySchema,
  basis: z.literal("gross"),
  netMinor: nonnegativeMinorUnitsSchema.optional(),
  taxMinor: nonnegativeMinorUnitsSchema.optional(),
  status: z.enum(["posted", "held", "duplicate"]),
  paidClaim: z.boolean(),
  sources: z.array(sourceReferenceSchema).max(20),
  origin: z.enum(["document", "session"]),
});
export const paymentSchema = z.strictObject({
  id: paymentIdSchema,
  occurredOn: dateSchema,
  direction: z.enum(["in", "out", "internal_transfer"]),
  amountMinor: nonnegativeMinorUnitsSchema,
  currency: currencySchema,
  counterpartyId: contactIdSchema.optional(),
  reference: z.string().max(120),
  allocations: z
    .array(z.strictObject({ eventId: eventIdSchema, amountMinor: nonnegativeMinorUnitsSchema }))
    .max(20),
  sources: z.array(sourceReferenceSchema).max(20),
  origin: z.enum(["document", "session"]),
});
export const invoiceLineSchema = z.strictObject({
  description: z.string().trim().min(1).max(200),
  quantity: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/u)
    .refine((value) => Number(value) > 0),
  unitPriceMinor: nonnegativeMinorUnitsSchema,
});
export const invoiceSchema = z.strictObject({
  id: invoiceIdSchema,
  number: z.string().trim().min(1).max(40),
  customerId: contactIdSchema,
  issuedOn: dateSchema,
  dueOn: dateSchema,
  currency: currencySchema,
  lines: z.array(invoiceLineSchema).min(1).max(20),
  notes: z.string().max(1000),
  status: z.enum(["draft", "issued"]),
  eventId: eventIdSchema.optional(),
});
export type Money = z.infer<typeof moneySchema>;
export type BusinessIdentity = z.infer<typeof businessIdentitySchema>;
export type Contact = z.infer<typeof contactSchema>;
export type FinancialEvent = z.infer<typeof eventSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
