import type {
  ChangeProposal,
  DocumentInterpretation,
  ExtractionRequest,
  Workspace,
} from "@retrosum/contracts";

// The backend owns provider operations; adapters validate their output before crossing this port.
export interface AiProviderPort {
  readonly kind: "fake" | "openai";
  interpretDocument?: (
    input: Readonly<{ metadata: ExtractionRequest; bytes: Uint8Array }>,
    signal: AbortSignal,
  ) => Promise<{
    interpretation: DocumentInterpretation;
    usage: { inputTokens: number; outputTokens: number } | null;
  }>;
  answer?: (
    input: Readonly<{ workspace: Workspace; prompt: string }>,
    signal: AbortSignal,
  ) => Promise<{ text: string; proposal?: ChangeProposal }>;
}
