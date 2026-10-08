import type {
  ChangeProposal,
  Contact,
  FinancialEvent,
  Payment,
  ReviewIssue,
  SourceDocument,
  Workspace,
} from "@retrosum/contracts";

// The backend owns provider operations; adapters validate their output before crossing this port.
export interface AiProviderPort {
  readonly kind: "fake" | "openai";
  interpretDocument?: (
    input: Readonly<{ document: SourceDocument; bytes: Uint8Array }>,
    signal: AbortSignal,
  ) => Promise<{
    contacts: Contact[];
    events: FinancialEvent[];
    payments: Payment[];
    issues: ReviewIssue[];
  }>;
  answer?: (
    input: Readonly<{ workspace: Workspace; prompt: string }>,
    signal: AbortSignal,
  ) => Promise<{ text: string; proposal?: ChangeProposal }>;
}
