import { z } from "zod";
import { contactIdSchema } from "./ids.js";
import { dateSchema } from "./records.js";
export const sessionFilterSchema = z.strictObject({
  from: dateSchema,
  to: dateSchema,
  register: z.enum(["invoices", "costs", "payments", "contacts"]).default("invoices"),
  category: z.string().trim().min(1).max(60).optional(),
  counterpartyId: contactIdSchema.optional(),
  asOf: dateSchema.optional(),
});
