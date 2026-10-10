import { mkdir, writeFile } from "node:fs/promises";
import { harborSession } from "../test/fixtures/harbor-v1/money-fixture.mjs";
import { createFakeProvider } from "../apps/backend/dist/providers/fake.js";
import { createOpenAiInvestigator } from "../apps/backend/dist/providers/openai-investigator.js";
import { investigate } from "../apps/backend/dist/retro/investigator.js";
import { readBoundedJson } from "../apps/backend/dist/security/read-json.js";
import {
  MODEL,
  SPEND_POLICY,
  LIVE_ACCEPTANCE_VERIFIED,
} from "../apps/backend/dist/providers/policy.js";
import { evaluationMode, createEvaluationMeter } from "./lib/retro-evaluation.mjs";

// Private operator entry point. This declared fixture is an input workspace, not
// live PDF recognition evidence. Expected decisions never become model context.
const mode = evaluationMode(process.argv.slice(2), process.env);
const session = harborSession();
const cases = [
  "Summarize this period",
  "Explain this dashboard",
  "Explain profit",
  "Explain cash",
  "What remains unpaid?",
  "Review held figures",
  "Create invoice",
  "Record payment",
  "Open documents",
  "Change period",
  "Chart quarterly income",
  "Add cash net KPI",
  "Set income target",
  "Open settings",
  "Undo",
  "What can Retro do?",
  "Send a bank transfer",
];
const meter = createEvaluationMeter(SPEND_POLICY, fetch, readBoundedJson);
const provider =
  mode === "live"
    ? createOpenAiInvestigator(process.env.OPENAI_API_KEY, meter.fetch)
    : createFakeProvider({ sleep: async (_ms, signal) => signal.throwIfAborted() }).investigator;
const report = {
  mode,
  model: MODEL,
  policy: SPEND_POLICY.version,
  createdAt: new Date().toISOString(),
  fixture: "harbor-v1 declared test workspace; not live recognition evidence",
  publicLiveEnabled: LIVE_ACCEPTANCE_VERIFIED,
  acceptance: "Pending live intent, extraction, token and owner review",
  cases: [],
};
try {
  for (const [index, prompt] of cases.entries()) {
    meter.beginTurn();
    const before = meter.snapshot().usage.length;
    const response = await investigate(
      {
        operationId: `retro_evaluation_${index}`,
        workspace: session.workspace,
        scope: { from: session.filters.from, to: session.filters.to, asOf: session.filters.asOf },
        prompt,
        recent: [],
        uiContext: { dashboard: session.dashboard },
      },
      provider,
      new AbortController().signal,
    );
    report.cases.push({
      prompt,
      decision: response.decision,
      factIds: response.decision.kind === "explanation" ? response.decision.factIds : [],
      sources: response.sources.length,
      steps: response.steps,
      usage: meter.snapshot().usage.slice(before),
      grounded: true,
      intentAccuracy:
        mode === "offline" ? "deterministic fixture routing" : "manual review required",
    });
  }
} catch {
  // Do not echo provider bodies, transport errors or the private key.
  report.stopped =
    "Evaluation stopped; inspect the completed cases and operator configuration. No retry.";
  process.exitCode = 1;
} finally {
  report.meter = meter.snapshot();
  await mkdir("artifacts/local", { recursive: true });
  await writeFile("artifacts/local/retro-evaluation.json", JSON.stringify(report, null, 2) + "\n");
  console.log(
    `${mode}: ${report.cases.length}/${cases.length} grounded cases. Live acceptance remains pending. Report: artifacts/local/retro-evaluation.json`,
  );
}
