import {
  capabilitiesSchema,
  DEMO_LIMITS,
  PROCESSING_DISCLOSURE_VERSION,
} from "@retrosum/contracts";
import type { RuntimeCapabilities } from "@retrosum/contracts";
import type { AppConfig } from "../config/config.js";
import type { Clock } from "./clock.js";
import type { AiProviderPort } from "./provider-port.js";
import { ExtractionAdmission } from "../documents/admission.js";
import { RetroAdmission } from "../retro/admission.js";
import { OperationLifecycle } from "./operation-lifecycle.js";
import { PaidAdmission, type ChallengeVerifier } from "../security/admission.js";
import { turnstileVerifier } from "../security/challenge.js";
import { LIVE_ACCEPTANCE_VERIFIED } from "../providers/policy.js";
import type { OperationalMetric } from "../security/metrics.js";
import {
  createExchangeRateService,
  type ExchangeRateService,
} from "../providers/exchange-rates.js";
export interface RuntimePorts {
  clock: Clock;
  createRequestId(): string;
  provider?: AiProviderPort;
  challengeVerifier?: ChallengeVerifier;
  exchangeRates?: ExchangeRateService;
  metric?(metric: OperationalMetric): void;
}
export interface AppRuntime {
  config: AppConfig;
  ports: RuntimePorts;
  capabilities: RuntimeCapabilities;
  ready: boolean;
  admission: ExtractionAdmission;
  retroAdmission: RetroAdmission;
  operations: OperationLifecycle;
  paidAdmission: PaidAdmission;
  exchangeRates: ExchangeRateService;
}
export function composeRuntime(config: AppConfig, ports: RuntimePorts): AppRuntime {
  // Live support stays closed until exact-field, token and admission acceptance.
  const reason = config.FAKE_MODE
    ? "feature_pending"
    : !config.PAID_DEMO_ENABLED
      ? "paid_disabled"
      : !config.OPENAI_API_KEY
        ? "key_missing"
        : !config.TURNSTILE_SECRET_KEY || config.GRANT_SIGNING_SECRET.length < 32
          ? "admission_missing"
          : "acceptance_pending";
  const providerMatches = ports.provider?.kind === (config.FAKE_MODE ? "fake" : "openai");
  const documentsAvailable =
    providerMatches && Boolean(ports.provider?.interpretDocument) && config.FAKE_MODE;
  const copilotAvailable =
    providerMatches && ports.provider?.investigator?.kind === "fake" && config.FAKE_MODE;
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
    processing: {
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      provider: "OpenAI",
      siteKey: config.TURNSTILE_SITE_KEY,
      admissionAvailable:
        !config.FAKE_MODE && config.PAID_DEMO_ENABLED && (documentsAvailable || copilotAvailable),
    },
  });
  return Object.freeze({
    config,
    ports,
    capabilities,
    ready: config.FAKE_MODE || documentsAvailable || copilotAvailable,
    exchangeRates: ports.exchangeRates ?? createExchangeRateService(ports.clock.now),
    admission: new ExtractionAdmission(ports.clock.now),
    retroAdmission: new RetroAdmission(ports.clock.now),
    operations: new OperationLifecycle(),
    paidAdmission: new PaidAdmission(
      config.GRANT_SIGNING_SECRET,
      ports.clock.now,
      () => !config.FAKE_MODE && config.PAID_DEMO_ENABLED && LIVE_ACCEPTANCE_VERIFIED,
      ports.challengeVerifier ??
        turnstileVerifier(
          config.TURNSTILE_SECRET_KEY,
          new URL(config.FRONTEND_ORIGIN).hostname,
          ports.clock.now,
        ),
    ),
  });
}
