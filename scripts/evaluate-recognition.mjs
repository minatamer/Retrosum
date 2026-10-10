import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  documentSchema,
  extractionRequestSchema,
  RECOGNITION_SCHEMA_VERSION,
} from "../packages/contracts/dist/index.js";
import { inspectPdf, verifyOriginal } from "../apps/backend/dist/documents/inspection.js";
import {
  createOpenAiProvider,
  MODEL,
  PROMPT_VERSION,
} from "../apps/backend/dist/providers/openai.js";
import {
  SPEND_POLICY,
  reservationMicroUsd,
  LIVE_ACCEPTANCE_VERIFIED,
} from "../apps/backend/dist/providers/policy.js";

const live = process.argv.includes("--live");
const resume = process.argv.includes("--resume");
if (resume && !live) throw new Error("Resume requires an explicitly authorized live evaluation.");
if (
  live &&
  (!process.argv.includes("--confirm-paid") ||
    process.env.PAID_DEMO_ENABLED !== "true" ||
    !process.env.OPENAI_API_KEY)
)
  throw new Error(
    "Paid evaluation requires --live --confirm-paid, PAID_DEMO_ENABLED=true and a private OPENAI_API_KEY. Default evaluation is inspection-only.",
  );
const manifest = JSON.parse(
  await readFile("apps/frontend/src/features/documents/sample-manifest.json", "utf8"),
);
const report = {
  mode: live ? "live" : "inspection_only",
  model: MODEL,
  promptVersion: PROMPT_VERSION,
  schemaVersion: RECOGNITION_SCHEMA_VERSION,
  createdAt: new Date().toISOString(),
  runs: [],
  spentMicroUsd: 0,
  acceptance: "Pending",
  publicLiveEnabled: LIVE_ACCEPTANCE_VERIFIED,
  handwriting: "Synthetic handwriting-style fixture; not human-written OCR evidence.",
};
const reportPath = "artifacts/local/recognition-evaluation.json";
await mkdir("artifacts/local", { recursive: true });
const checkpoint = () => writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
const originals = [];
for (const asset of manifest.documents) {
  const doc = documentSchema.parse(
    Object.fromEntries(
      Object.keys(documentSchema.shape)
        .filter((key) => key in asset)
        .map((key) => [key, asset[key]]),
    ),
  );
  const bytes = new Uint8Array(await readFile("apps/frontend/public" + asset.pdfPath));
  verifyOriginal(bytes, doc);
  const inspection = await inspectPdf(bytes, new AbortController().signal);
  if (inspection.pages.length !== doc.pageCount)
    throw new Error("Actual PDF pages differ from the manifest.");
  originals.push({ label: asset.label, doc, bytes, inspection });
}
const fingerprint = (fields) => {
  const counts = new Map();
  for (const field of fields) {
    const key = JSON.stringify([field.page, field.raw, String(field.normalized), field.scale]);
    counts.set(key, (counts.get(key) ?? 0) + field.occurrences);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
};
if (live) {
  if (resume) {
    const previous = JSON.parse(await readFile(reportPath, "utf8"));
    if (
      previous.mode !== "live" ||
      previous.model !== MODEL ||
      previous.promptVersion !== PROMPT_VERSION ||
      previous.schemaVersion !== RECOGNITION_SCHEMA_VERSION ||
      !Array.isArray(previous.runs) ||
      !Number.isSafeInteger(previous.spentMicroUsd) ||
      previous.spentMicroUsd < 0 ||
      previous.spentMicroUsd > SPEND_POLICY.runMicroUsd
    )
      throw new Error("The saved live candidate differs; start a fresh evaluation.");
    report.runs = previous.runs;
    report.spentMicroUsd = previous.spentMicroUsd;
    report.resumedFrom = previous.createdAt;
    report.unknownOperations = previous.unknownOperations ?? [];
  }
  const provider = createOpenAiProvider(process.env.OPENAI_API_KEY);
  for (let run = 1; run <= 2; run++) {
    let savedRun = report.runs.find((entry) => entry.run === run);
    if (!savedRun) {
      savedRun = { run, results: [] };
      report.runs.push(savedRun);
    }
    const results = savedRun.results;
    for (const item of originals) {
      const saved = results.find((result) => result.label === item.label);
      if (saved) {
        if (saved.sha256 !== item.doc.sha256 || saved.pageCount !== item.doc.pageCount)
          throw new Error("The saved original differs; start a fresh evaluation.");
        continue;
      }
      // Reserve the full configured token ceiling, not a raw-byte-derived guess.
      if (report.spentMicroUsd + reservationMicroUsd("extract") > SPEND_POLICY.runMicroUsd)
        throw new Error("Evaluation spend allowance exhausted.");
      const metadata = extractionRequestSchema.parse({
        operationId: `evaluation_${run}_${item.label}`,
        workspaceId: `workspace_evaluation${run}`,
        revision: 0,
        retry: false,
        business: {
          name: manifest.business,
          currency: "USD",
          ownedAccountReferences: ["checking", "reserve"],
        },
        asOf: manifest.asOf,
        document: item.doc,
        envelope: {
          files: originals.length,
          pages: originals.reduce((sum, original) => sum + original.doc.pageCount, 0),
          bytes: originals.reduce((sum, original) => sum + original.bytes.byteLength, 0),
        },
      });
      const reserved = reservationMicroUsd("extract");
      report.spentMicroUsd += reserved;
      report.unknownOperations ??= [];
      const pending = { run, label: item.label, reservedMicroUsd: reserved };
      report.unknownOperations.push(pending);
      await checkpoint();
      const output = await provider.interpretDocument(
        { metadata, bytes: item.bytes },
        new AbortController().signal,
      );
      report.spentMicroUsd +=
        Math.ceil(
          output.usage.inputTokens * SPEND_POLICY.inputMicroUsdPerToken +
            output.usage.outputTokens * SPEND_POLICY.outputMicroUsdPerToken,
        ) - reserved;
      report.unknownOperations.splice(report.unknownOperations.indexOf(pending), 1);
      // Independent truth is loaded only after dispatch; it never becomes provider context.
      const truth = JSON.parse(await readFile("test/fixtures/harbor-v1/ground-truth.json", "utf8"));
      const expected = truth.documents
        .find((doc) => doc.label === item.label)
        .pages.flatMap((page) =>
          page.fields.map((field) => ({
            page: page.page,
            raw: field[0],
            occurrences: field[1],
            normalized: field[2],
            scale: field[3],
          })),
        );
      const numericPass =
        JSON.stringify(fingerprint(expected)) ===
          JSON.stringify(fingerprint(output.interpretation.fields)) &&
        !output.interpretation.fields.some((field) => field.ambiguous || field.normalized === null);
      results.push({
        label: item.label,
        sha256: createHash("sha256").update(item.bytes).digest("hex"),
        pageCount: item.inspection.pages.length,
        numericPass,
        expectedOccurrences: expected.reduce((sum, field) => sum + field.occurrences, 0),
        actualOccurrences: output.interpretation.fields.reduce(
          (sum, field) => sum + field.occurrences,
          0,
        ),
        usage: output.usage,
        interpretation: output.interpretation,
      });
      await checkpoint();
    }
  }
  report.acceptance = report.runs.every((run) => run.results.every((result) => result.numericPass))
    ? "Two-run numeric corpus gate passed; role, grounding, handwritten-source and spend release review still pending"
    : "Failed numeric corpus gate";
} else
  report.runs.push({
    run: 0,
    results: originals.map((item) => ({
      label: item.label,
      sha256: item.doc.sha256,
      pageCount: item.inspection.pages.length,
      numericPass: null,
      usage: null,
    })),
  });
await checkpoint();
console.log(
  `${report.mode}: inspected ${originals.length} originals, ${originals.reduce((sum, item) => sum + item.inspection.pages.length, 0)} pages. ${report.acceptance}. Report: artifacts/local/recognition-evaluation.json`,
);
