import { capabilitiesSchema, DEMO_LIMITS } from "@retrosum/contracts";
import type { RuntimeCapabilities } from "@retrosum/contracts";
import type { AppConfig } from "../config/config.js";
import type { Clock } from "./clock.js";
import type { AiProviderPort } from "./provider-port.js";
export interface RuntimePorts {
  clock: Clock;
  createRequestId(): string;
  provider?: AiProviderPort;
}
export interface AppRuntime {
  config: AppConfig;
  ports: RuntimePorts;
  capabilities: RuntimeCapabilities;
  ready: boolean;
}
export function composeRuntime(config: AppConfig, ports: RuntimePorts): AppRuntime {
  // Live adapter installation belongs to RET-005. Never substitute a fake for a live request.
  const reason = config.FAKE_MODE
    ? "feature_pending"
    : !config.PAID_DEMO_ENABLED
      ? "paid_disabled"
      : !config.OPENAI_API_KEY
        ? "key_missing"
        : !config.TURNSTILE_SECRET_KEY || config.GRANT_SIGNING_SECRET.length < 32
          ? "admission_missing"
          : "adapter_not_ready";
  const providerMatches = ports.provider?.kind === (config.FAKE_MODE ? "fake" : "openai");
  const liveAllowed =
    !config.FAKE_MODE && reason === "adapter_not_ready" && config.AI_PROVIDER === "openai";
  const documentsAvailable =
    providerMatches &&
    Boolean(ports.provider?.interpretDocument) &&
    (config.FAKE_MODE || (liveAllowed && config.LIVE_DOCUMENTS_ENABLED));
  const copilotAvailable =
    providerMatches &&
    Boolean(ports.provider?.answer) &&
    (config.FAKE_MODE || (liveAllowed && config.LIVE_COPILOT_ENABLED));
  const capabilities = capabilitiesSchema.parse({
    schemaVersion: 1,
    mode: config.FAKE_MODE
      ? "fake"
      : documentsAvailable || copilotAvailable
        ? "live"
        : "unavailable",
    documents: documentsAvailable ? { available: true } : { available: false, reason },
    copilot: copilotAvailable ? { available: true } : { available: false, reason },
    limits: DEMO_LIMITS,
  });
  return Object.freeze({
    config,
    ports,
    capabilities,
    ready: config.FAKE_MODE || documentsAvailable || copilotAvailable,
  });
}
