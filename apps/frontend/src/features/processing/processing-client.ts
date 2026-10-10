import type { GrantRequest, RuntimeCapabilities } from "@retrosum/contracts";
export type ProcessingIdentity = Omit<
  GrantRequest,
  "challengeToken" | "consent" | "disclosureVersion"
>;
export type AuthorizePaid = (
  identity: ProcessingIdentity,
  capabilities: RuntimeCapabilities,
  signal: AbortSignal,
  presentation?: "document-selection",
) => Promise<string>;
export async function hashRequest(input: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
