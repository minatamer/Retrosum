import { readFile } from "node:fs/promises";
import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import {
  documentSchema,
  extractionRequestSchema,
  commandIdSchema,
  interpretationSchema,
} from "../packages/contracts/dist/index.js";
import {
  mergeInterpretation,
  calculateMetrics,
  applyCommand,
} from "../packages/money/dist/index.js";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";
import { inspectPdf, verifyOriginal } from "../apps/backend/src/documents/inspection.ts";
import { createFakeProvider } from "../apps/backend/src/providers/fake.ts";
import {
  createOpenAiProvider,
  buildResponsesRequest,
} from "../apps/backend/src/providers/openai.ts";
import { ExtractionAdmission } from "../apps/backend/src/documents/admission.ts";
import { createApp } from "../apps/backend/src/http/app.ts";
import { composeRuntime } from "../apps/backend/src/runtime/compose.ts";
import { parseConfig } from "../apps/backend/src/config/config.ts";
import manifest from "../apps/frontend/src/features/documents/sample-manifest.json" with { type: "json" };

const clock = { now: () => 2000, sleep: async (_ms, signal) => signal.throwIfAborted() };
const provider = createFakeProvider(clock);
const admitted = (asset) =>
  documentSchema.parse(
    Object.fromEntries(
      Object.keys(documentSchema.shape)
        .filter((key) => key in asset)
        .map((key) => [key, asset[key]]),
    ),
  );
const metadata = (doc, id = "operation_first", retry = false) =>
  extractionRequestSchema.parse({
    operationId: id,
    workspaceId: "workspace_review",
    revision: 0,
    retry,
    business: {
      name: "Harbor Studio",
      currency: "USD",
      ownedAccountReferences: ["checking", "reserve"],
    },
    asOf: "2026-10-03",
    document: doc,
    envelope: { files: 8, pages: 14, bytes: 412981 },
  });
let cases = [];
beforeAll(async () => {
  for (const asset of manifest.documents) {
    const doc = admitted(asset);
    const bytes = new Uint8Array(await readFile("apps/frontend/public" + asset.pdfPath));
    verifyOriginal(bytes, doc);
    const inspection = await inspectPdf(bytes, new AbortController().signal);
    const result = await provider.interpretDocument(
      { metadata: metadata(doc), bytes },
      new AbortController().signal,
    );
    cases.push({ doc, bytes, output: { ...result, inspection, sha256: doc.sha256, mode: "fake" } });
  }
}, 30000);
function empty() {
  const session = harborSession();
  return {
    ...session.workspace,
    id: "workspace_review",
    documents: cases.map((item) => ({ ...item.doc, state: "queued" })),
    events: [],
    payments: [],
    contacts: [],
    invoices: [],
    issues: [],
  };
}
describe("actual PDF recognition and source grounding", () => {
  it("inspects all fourteen real pages; keeps raster sources held and deduplicates the second scan", () => {
    let workspace = empty();
    for (const item of cases) workspace = mergeInterpretation(workspace, item.doc, item.output);
    expect(workspace.events).toHaveLength(10);
    expect(workspace.payments).toHaveLength(4);
    expect(workspace.invoices).toHaveLength(4);
    expect(workspace.documents.map((doc) => doc.reviewBlocked)).toEqual(Array(8).fill(false));
    expect(
      workspace.documents.filter((doc) => doc.state === "needs_review").map((doc) => doc.name),
    ).toEqual([cases[2].doc.name, cases[3].doc.name, cases[5].doc.name]);
    let session = { ...harborSession(), workspace };
    for (const [n, doc] of workspace.documents.entries())
      if (doc.state === "needs_review")
        session = applyCommand(
          session,
          {
            id: commandIdSchema.parse(`command_accept${n}`),
            workspaceId: workspace.id,
            basedOnRevision: session.workspace.revision,
            actions: [
              {
                type: "review_document",
                documentId: doc.id,
                decision: n === 5 ? "duplicate" : "accept",
              },
            ],
          },
          "Source checked",
        );
    const totals = calculateMetrics(session.workspace, { from: "2026-09-01", to: "2026-09-30" });
    expect([
      totals.income.minor,
      totals.costs.minor,
      totals.profitMinor,
      totals.netCashMinor,
      totals.customerOpen.minor,
      totals.supplierOpen.minor,
    ]).toEqual([480000, 128000, 352000, 208000, 180000, 39600]);
    expect(workspace.documents.reduce((sum, doc) => sum + doc.numericFields.length, 0)).toBe(128);
    expect(
      workspace.documents.reduce(
        (sum, doc) => sum + doc.numericFields.reduce((n, field) => n + field.occurrences, 0),
        0,
      ),
    ).toBe(146);
  });
  it("holds an incorrect raw digit even if grand totals still match", () => {
    const item = cases[0];
    const bad = structuredClone(item.output);
    bad.interpretation.fields.find((field) => field.raw === "12").raw = "13";
    const graph = mergeInterpretation(empty(), item.doc, bad);
    expect(graph.events).toHaveLength(0);
    expect(graph.documents[0].reviewBlocked).toBe(true);
    expect(() =>
      applyCommand(
        { ...harborSession(), workspace: graph },
        {
          id: commandIdSchema.parse("command_bad"),
          workspaceId: graph.id,
          basedOnRevision: graph.revision,
          actions: [{ type: "review_document", documentId: item.doc.id, decision: "accept" }],
        },
        "Accept",
      ),
    ).toThrow("unresolved");
  });
  it.each(["tax", "currency", "role", "line", "page"])(
    "holds %s inconsistency without correcting it",
    (kind) => {
      const item = cases[0];
      const bad = structuredClone(item.output);
      if (kind === "tax")
        bad.interpretation.events[0].taxField = bad.interpretation.events[0].grossField;
      if (kind === "currency") bad.interpretation.currency = "EUR";
      if (kind === "role") bad.interpretation.events[0].businessRole = "unknown";
      if (kind === "line")
        bad.interpretation.events[0].lines[0].total = bad.interpretation.events[0].grossField;
      if (kind === "page") bad.interpretation.fields[0].page = 3;
      const graph = mergeInterpretation(empty(), item.doc, bad);
      expect(graph.events).toHaveLength(0);
      expect(graph.documents[0].reviewBlocked).toBe(true);
    },
  );
  it("rejects wrong bytes, active content, damage and cancellation before any provider work", async () => {
    expect(() =>
      verifyOriginal(cases[0].bytes, { ...cases[0].doc, sha256: "0".repeat(64) }),
    ).toThrow("invalid_original");
    for (const data of [
      Buffer.from("%PDF-1.7\n/JavaScript (send secrets)"),
      Buffer.from("%PDF-1.7\n/Encrypt 4 0 R"),
      Buffer.from("%PDF-broken"),
    ])
      await expect(inspectPdf(data, new AbortController().signal)).rejects.toThrow(
        "unsupported_pdf",
      );
    const aborted = new AbortController();
    aborted.abort();
    expect(() => inspectPdf(cases[0].bytes, aborted.signal)).toThrow();
  }, 10000);
  it("rejects unsupported visitor simulations and oversized envelopes honestly", async () => {
    await expect(
      provider.interpretDocument(
        { metadata: metadata({ ...cases[0].doc, sha256: "0".repeat(64) }), bytes: cases[0].bytes },
        new AbortController().signal,
      ),
    ).rejects.toThrow("fake_unrecognized_pdf");
    expect(() =>
      extractionRequestSchema.parse({
        ...metadata(cases[0].doc),
        envelope: { files: 11, pages: 14, bytes: 412981 },
      }),
    ).toThrow();
    expect(() =>
      interpretationSchema.parse({
        ...cases[0].output.interpretation,
        events: Array(101).fill(cases[0].output.interpretation.events[0]),
      }),
    ).toThrow();
  });
});
describe("bounded provider and request admission", () => {
  it("burns reservations, rejects replay and allows one deliberate retry without automatic refund", () => {
    const gate = new ExtractionAdmission(clock.now);
    const releaseIntake = gate.enter();
    expect(() => gate.enter()).toThrow("busy");
    releaseIntake();
    gate.reserve("workspace_a", "first", "hash", false)();
    expect(() => gate.reserve("workspace_a", "first", "hash", false)).toThrow("replayed");
    expect(() => gate.reserve("workspace_a", "second", "hash", false)).toThrow("allowance");
    gate.reserve("workspace_a", "retry", "hash", true)();
    expect(() => gate.reserve("workspace_a", "retry2", "hash", true)).toThrow("allowance");
    const release = gate.reserve("workspace_b", "next", "hash2", false);
    expect(() => gate.reserve("workspace_c", "parallel", "hash3", false)).toThrow("busy");
    release();
  });
  it("uses actual inline bytes, foreground strict output, no tools and supported reasoning", () => {
    const body = buildResponsesRequest(metadata(cases[0].doc), cases[0].bytes);
    expect(body).toMatchObject({
      model: "gpt-6.1-sol",
      store: false,
      background: false,
      reasoning: { effort: "low" },
      max_output_tokens: 6000,
      text: { format: { strict: true } },
    });
    expect(Buffer.from(body.input[0].content[0].file_data.split(",")[1], "base64")).toEqual(
      Buffer.from(cases[0].bytes),
    );
    expect(body).not.toHaveProperty("tools");
    expect(JSON.stringify(body)).not.toContain("HS-101");
  });
  it("handles successful injected structured output and rejects incomplete/refusal/usage excess with one dispatch", async () => {
    for (const variant of ["success", "incomplete", "refusal", "usage"]) {
      const fetcher = vi.fn(async () =>
        Response.json({
          status: variant === "incomplete" ? "incomplete" : "completed",
          output: [
            {
              type: "message",
              content: [
                variant === "refusal"
                  ? { type: "refusal" }
                  : { type: "output_text", text: JSON.stringify(cases[0].output.interpretation) },
              ],
            },
          ],
          usage: { input_tokens: variant === "usage" ? 24001 : 200, output_tokens: 100 },
        }),
      );
      const pending = createOpenAiProvider("injected-test-key", fetcher).interpretDocument(
        { metadata: metadata(cases[0].doc), bytes: cases[0].bytes },
        new AbortController().signal,
      );
      if (variant === "success") expect((await pending).usage.inputTokens).toBe(200);
      else await expect(pending).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it("runs the actual bounded multipart route and dispatches zero extra work for replay or paid-off", async () => {
    const dispatch = vi.fn(provider.interpretDocument);
    const runtime = composeRuntime(parseConfig({}), {
      clock,
      createRequestId: () => "request_test",
      provider: { kind: "fake", interpretDocument: dispatch },
    });
    const app = createApp(runtime);
    const send = (app, meta, bytes = cases[0].bytes) =>
      request(app)
        .post("/v1/extract")
        .set("Origin", "http://localhost:3000")
        .field("metadata", JSON.stringify(meta))
        .attach("file", Buffer.from(bytes), {
          filename: "demo.pdf",
          contentType: "application/pdf",
        });
    const result = await send(app, metadata(cases[0].doc)).expect(200);
    expect(result.body.sha256).toBe(cases[0].doc.sha256);
    await send(app, metadata(cases[0].doc)).expect(409);
    expect(dispatch).toHaveBeenCalledTimes(1);
    const closed = createApp(
      composeRuntime(
        parseConfig({
          FAKE_MODE: "false",
          AI_PROVIDER: "openai",
          OPENAI_API_KEY: "present",
          PAID_DEMO_ENABLED: "true",
          LIVE_DOCUMENTS_ENABLED: "true",
          TURNSTILE_SECRET_KEY: "present",
          GRANT_SIGNING_SECRET: "x".repeat(32),
        }),
        {
          clock,
          createRequestId: () => "request_test",
          provider: { kind: "openai", interpretDocument: dispatch },
        },
      ),
    );
    expect((await send(closed, metadata(cases[0].doc)).expect(503)).body.error).toBe(
      "acceptance_pending",
    );
    await send(app, metadata(cases[1].doc, "badbytes"), Buffer.from("not a PDF")).expect(400);
    expect(dispatch).toHaveBeenCalledTimes(1);
    await request(app).post("/v1/extract").expect(403);
  }, 15000);
});
