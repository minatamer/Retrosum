import { UserFacingError } from "../../components/ui/user-facing-error";
import {
  PROCESSING_DISCLOSURE_VERSION,
  grantResultSchema,
  type GrantRequest,
  type RuntimeCapabilities,
  type ExtractionOperation,
} from "@retrosum/contracts";
import { readJson } from "../../transport/read-json";
export type ProcessingIdentity = Omit<
  GrantRequest,
  "challengeToken" | "consent" | "disclosureVersion"
> & { operations?: ExtractionOperation[] };
export type AuthorizePaid = (
  identity: ProcessingIdentity,
  capabilities: RuntimeCapabilities,
  signal: AbortSignal,
  presentation?: "document-selection",
) => Promise<string>;
export async function requestBatchGrant(
  identity: ProcessingIdentity,
  batchGrant: string,
  signal: AbortSignal,
) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(12_000)]);
  const response = await fetch("/api/retrosum/v1/grants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...identity,
      batchGrant,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      consent: true,
    }),
    signal: deadline,
    cache: "no-store",
    redirect: "error",
  });
  const value = await readJson(response, 4096, deadline);
  if (!response.ok)
    throw new UserFacingError(
      "Processing approval is unavailable. Your originals remain available; retry deliberately.",
    );
  const result = grantResultSchema.parse(value);
  deadline.throwIfAborted();
  if (result.expiresAt <= Date.now())
    throw new UserFacingError("Processing approval expired. Retry deliberately.");
  return result.grant;
}
export async function hashRequest(input: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
