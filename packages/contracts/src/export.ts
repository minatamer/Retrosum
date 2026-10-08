import { z } from "zod";
import { sessionFilterSchema } from "./filters.js";
import { revisionSchema, workspaceIdSchema } from "./ids.js";
export const EXPORT_VERSION = 1;
export const exportOptionsSchema = z.strictObject({
  originals: z.boolean().default(false),
  sensitive: z.boolean().default(false),
  conversation: z.boolean().default(false),
});
export const exportManifestSchema = z.strictObject({
  exportVersion: z.literal(EXPORT_VERSION),
  workspaceId: workspaceIdSchema,
  revision: revisionSchema,
  scope: sessionFilterSchema,
  asOf: z.iso.date(),
  currency: z.literal("USD"),
  exportedAt: z.iso.datetime(),
  modes: z.array(z.enum(["fake", "live", "manual", "uninterpreted"])).max(4),
  files: z.array(z.string().max(200)).max(30),
  options: exportOptionsSchema,
  policy: z.string().max(1000),
});
export type ExportOptions = z.infer<typeof exportOptionsSchema>;
export type ExportManifest = z.infer<typeof exportManifestSchema>;
