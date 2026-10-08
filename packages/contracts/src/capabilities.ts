import { z } from "zod";
import { MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "./source.js";
export const DEMO_LIMITS = Object.freeze({
  files: 10,
  pages: 20,
  fileBytes: MAX_FILE_BYTES,
  totalBytes: MAX_TOTAL_BYTES,
  sessionMilliseconds: 2 * 60 * 60 * 1000,
});
export const unavailableCodeSchema = z.enum([
  "feature_pending",
  "paid_disabled",
  "key_missing",
  "admission_missing",
  "adapter_not_ready",
  "backend_unavailable",
  "acceptance_pending",
]);
export const capabilitiesSchema = z.strictObject({
  schemaVersion: z.literal(1),
  mode: z.enum(["fake", "live", "unavailable"]),
  documents: z.strictObject({ available: z.boolean(), reason: unavailableCodeSchema.optional() }),
  copilot: z.strictObject({ available: z.boolean(), reason: unavailableCodeSchema.optional() }),
  limits: z.strictObject({
    files: z.literal(DEMO_LIMITS.files),
    pages: z.literal(DEMO_LIMITS.pages),
    fileBytes: z.literal(DEMO_LIMITS.fileBytes),
    totalBytes: z.literal(DEMO_LIMITS.totalBytes),
    sessionMilliseconds: z.literal(DEMO_LIMITS.sessionMilliseconds),
  }),
});
export type RuntimeCapabilities = z.infer<typeof capabilitiesSchema>;
export const unavailableCapabilities = (): RuntimeCapabilities => ({
  schemaVersion: 1,
  mode: "unavailable",
  documents: { available: false, reason: "backend_unavailable" },
  copilot: { available: false, reason: "backend_unavailable" },
  limits: DEMO_LIMITS,
});
