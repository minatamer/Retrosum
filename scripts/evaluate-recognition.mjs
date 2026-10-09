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

const live = process.argv.includes("--live");
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
  publicLiveEnabled: false,
  handwriting: "Synthetic handwriting-style fixture; not human-written OCR evidence.",
};
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
  const provider = createOpenAiProvider(process.env.OPENAI_API_KEY);
  for (let run = 1; run <= 2; run++) {
    const results = [];
    for (const item of originals) {
      // Reserve the full configured token ceiling, not a raw-byte-derived guess.
      if (report.spentMicroUsd + 108000 > 2500000)
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
      const output = await provider.interpretDocument(
        { metadata, bytes: item.bytes },
        new AbortController().signal,
      );
      report.spentMicroUsd += output.usage.inputTokens * 2 + output.usage.outputTokens * 10;
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
    }
    report.runs.push({ run, results });
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
await mkdir("artifacts/local", { recursive: true });
await writeFile(
  "artifacts/local/recognition-evaluation.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `${report.mode}: inspected ${originals.length} originals, ${originals.reduce((sum, item) => sum + item.inspection.pages.length, 0)} pages. ${report.acceptance}. Report: artifacts/local/recognition-evaluation.json`,
);
