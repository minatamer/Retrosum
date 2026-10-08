import type { DocumentInterpretation, ExtractionRequest } from "@retrosum/contracts";
import type { RecordInvestigator } from "../retro/investigator.js";

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
  investigator?: RecordInvestigator;
}
