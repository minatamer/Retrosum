import { afterEach, describe, expect, it, vi } from "vitest";
import {
  documentSchema,
  extractionResultSchema,
  DEMO_LIMITS,
  type ExtractionRequest,
  type RuntimeCapabilities,
} from "@retrosum/contracts";
import { SessionController } from "../session/session-controller";
import { processDocuments, type IntakeItem } from "./recognition-flow";
import { extractOriginal, recognitionCapabilities } from "./recognition-client";
import type { AuthorizePaid } from "../processing/processing-client";
import type * as ProcessingClient from "../processing/processing-client";
import { requestBatchGrant, hashRequest } from "../processing/processing-client";

vi.mock("./recognition-client", () => ({
  extractOriginal: vi.fn(),
  recognitionCapabilities: vi.fn(),
}));
vi.mock("../processing/processing-client", async (original) => ({
  ...(await original<typeof ProcessingClient>()),
  requestBatchGrant: vi.fn(async () => "grant"),
}));

const live: RuntimeCapabilities = {
  schemaVersion: 1,
  mode: "live",
  documents: { available: true },
  copilot: { available: true },
  limits: DEMO_LIMITS,
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const result = (input: ExtractionRequest) =>
  extractionResultSchema.parse({
    mode: "live",
    sha256: input.document.sha256,
    usage: { inputTokens: 100, outputTokens: 100 },
    inspection: {
      pages: [
        {
          page: 1,
          raster: false,
          text: `2026-10-10 ${input.document.id.replace("document_", "INV-")} 100.00`,
        },
      ],
    },
    interpretation: {
      version: "recognition-v1",
      kind: "invoice",
      currency: "USD",
      business: "Test business",
      asOfField: null,
      warnings: [],
      payments: [],
      fields: [
        { key: "date", raw: "2026-10-10", normalized: "2026-10-10", scale: "ISO_date" },
        {
          key: "ref",
          raw: input.document.id.replace("document_", "INV-"),
          normalized: input.document.id.replace("document_", "INV-"),
          scale: "identifier",
        },
        { key: "gross", raw: "100.00", normalized: "10000", scale: "USD_cents" },
      ].map((field) => ({
        ...field,
        page: 1,
        block: "invoice",
        occurrences: 1,
        treatment: "source",
        ambiguous: false,
      })),
      events: [
        {
          party: "Customer",
          businessRole: "issuer",
          description: "Work",
          category: "Services",
          dateField: "date",
          dueField: null,
          referenceField: "ref",
          grossField: "gross",
          netField: null,
          taxField: null,
          balanceState: "open",
          lines: [],
        },
      ],
    },
  });
async function harness(count = 5, firstAuthorization?: Promise<string>) {
  const values = new Map<string, string>();
  let identity = 0;
  const controller = new SessionController({
    now: () => Date.parse("2026-10-10T12:00:00Z"),
    identity: () => `pool${++identity}`,
    storage: () => ({
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
      clear: () => values.clear(),
      key: () => null,
      length: values.size,
    }),
    lease: async () => ({ acquired: true, release: () => undefined }),
    cache: () => ({
      get: async () => null,
      put: async () => undefined,
      removeWorkspace: async () => undefined,
      sweepExpired: async () => undefined,
    }),
  });
  await controller.initialize();
  const items: IntakeItem[] = Array.from({ length: count }, (_, n) => ({
    blob: new Blob(["original"]),
    doc: documentSchema.parse({
      id: `document_${n}`,
      name: `${n}.pdf`,
      mime: "application/pdf",
      sha256: String(n).repeat(64),
      byteLength: 8,
      pageCount: 1,
      kind: "invoice",
      state: "queued",
      provenance: "visitor_upload",
    }),
  }));
  const graph = controller.getSnapshot().session!.workspace;
  controller.replaceGraph(controller.token("setup"), {
    ...graph,
    revision: graph.revision + 1,
    business: { ...graph.business, name: "Test business" },
    documents: items.map((item) => item.doc),
  });
  vi.mocked(recognitionCapabilities).mockResolvedValue(live);
  const calls: {
    input: ExtractionRequest;
    signal: AbortSignal;
    completion: ReturnType<typeof deferred<ReturnType<typeof result>>>;
  }[] = [];
  vi.mocked(extractOriginal).mockImplementation((input, _blob, signal, _grant, submitting) => {
    submitting?.();
    const completion = deferred<ReturnType<typeof result>>();
    calls.push({ input, signal, completion });
    // Deliberately ignore abort: the caller must discard even a late successful response.
    return completion.promise;
  });
  const authorize = vi.fn<AuthorizePaid>(async () => "grant");
  if (firstAuthorization) authorize.mockImplementationOnce(() => firstAuthorization);
  const abort = new AbortController();
  const progress = vi.fn();
  const running = processDocuments(controller, items, abort.signal, progress, false, authorize);
  const settled = running.then(
    () => null,
    (error: unknown) => error,
  );
  return { controller, items, calls, authorize, abort, progress, running, settled };
}
afterEach(() => {
  vi.useRealTimers();
});
describe("four-document verified batches", () => {
  it("verifies once, overlaps four requests and commits reversed completions in selection order", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(4));
    expect(h.authorize).toHaveBeenCalledTimes(1);
    const manifest = h.authorize.mock.calls[0]![0];
    expect(manifest.operations).toHaveLength(5);
    expect(manifest.inputHash).toBe(await hashRequest(manifest.operations));
    h.calls[3]!.completion.resolve(result(h.calls[3]!.input));
    await vi.waitFor(() =>
      expect(h.controller.getSnapshot().session!.workspace.documents[3]!.state).toBe("validating"),
    );
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(0);
    expect(h.calls).toHaveLength(4);
    for (const call of h.calls.slice(0, 3).reverse()) call.completion.resolve(result(call.input));
    await vi.waitFor(() => expect(h.calls).toHaveLength(5));
    h.calls[4]!.completion.resolve(result(h.calls[4]!.input));
    await h.running;
    const graph = h.controller.getSnapshot().session!.workspace;
    expect(graph.events.map((e) => e.reference)).toEqual([
      "INV-0",
      "INV-1",
      "INV-2",
      "INV-3",
      "INV-4",
    ]);
    expect(graph.events.reduce((sum, e) => sum + e.amountMinor, 0)).toBe(50000);
    expect(graph.documents.every((d) => d.state === "ready")).toBe(true);
    for (const call of h.calls) {
      const approved = manifest.operations!.find(
        (op) => op.operationId === call.input.operationId,
      )!;
      expect(approved.inputHash).toBe(await hashRequest(call.input));
      expect(requestBatchGrant).toHaveBeenCalledWith(
        { ...approved, action: "extract", workspaceId: call.input.workspaceId },
        "grant",
        call.signal,
      );
    }
    h.controller.dispose();
  });
  it("matches a payment to its earlier invoice when the payment response arrives first", async () => {
    const h = await harness(2);
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    const payment = result(h.calls[1]!.input);
    payment.interpretation.kind = "payment_register";
    payment.interpretation.events = [];
    payment.interpretation.payments = [
      {
        party: "Customer",
        direction: "in",
        dateField: "date",
        referenceField: "ref",
        amountField: "gross",
        eventReference: "INV-0",
        fromAccount: null,
        toAccount: null,
      },
    ];
    h.calls[1]!.completion.resolve(payment);
    await vi.waitFor(() =>
      expect(h.controller.getSnapshot().session!.workspace.documents[1]!.state).toBe("validating"),
    );
    h.calls[0]!.completion.resolve(result(h.calls[0]!.input));
    await h.running;
    const graph = h.controller.getSnapshot().session!.workspace;
    expect(graph.payments[0]!.allocations).toEqual([
      { eventId: graph.events[0]!.id, amountMinor: 10000 },
    ]);
    expect(graph.documents.every((d) => d.state === "ready")).toBe(true);
    h.controller.dispose();
  });
  it("starts no PDF while the selected-batch challenge is waiting", async () => {
    const waiting = deferred<string>();
    const h = await harness(5, waiting.promise);
    await vi.waitFor(() => expect(h.authorize).toHaveBeenCalledTimes(1));
    expect(h.calls).toHaveLength(0);
    waiting.resolve("grant");
    await vi.waitFor(() => expect(h.calls).toHaveLength(4));
    for (const call of h.calls) call.completion.resolve(result(call.input));
    await vi.waitFor(() => expect(h.calls).toHaveLength(5));
    h.calls[4]!.completion.resolve(result(h.calls[4]!.input));
    await h.running;
    expect(h.authorize).toHaveBeenCalledTimes(1);
    h.controller.dispose();
  });
  it("continues after one failed PDF and preserves the other results without retry", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(4));
    h.calls[0]!.completion.reject(new Error("Provider refused"));
    await vi.waitFor(() => expect(h.calls).toHaveLength(5));
    for (const call of h.calls.slice(1)) call.completion.resolve(result(call.input));
    await h.running;
    expect(h.controller.getSnapshot().session!.workspace.documents[0]!.state).toBe("error");
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(4);
    expect(h.calls).toHaveLength(5);
    h.controller.dispose();
  });
  it("aborts all four active requests and leaves queued originals unsubmitted", async () => {
    const h = await harness(6);
    await vi.waitFor(() => expect(h.calls).toHaveLength(4));
    h.abort.abort();
    expect(h.calls.every((call) => call.signal.aborted)).toBe(true);
    for (const call of h.calls) call.completion.resolve(result(call.input));
    expect(await h.settled).toBeInstanceOf(Error);
    const graph = h.controller.getSnapshot().session!.workspace;
    expect(graph.events).toHaveLength(0);
    expect(graph.documents.every((d) => d.state === "cancelled")).toBe(true);
    expect(graph.documents.slice(4).some((d) => d.recognitionAttempted)).toBe(false);
    expect(h.calls).toHaveLength(4);
    h.controller.dispose();
  });
  it("keeps completed sources when four further slots are cancelled", async () => {
    const h = await harness(6);
    await vi.waitFor(() => expect(h.calls).toHaveLength(4));
    h.calls[0]!.completion.resolve(result(h.calls[0]!.input));
    await vi.waitFor(() => expect(h.calls).toHaveLength(5));
    h.abort.abort();
    for (const call of h.calls.slice(1)) call.completion.resolve(result(call.input));
    await h.settled;
    expect(h.controller.getSnapshot().session!.workspace.events.map((e) => e.reference)).toEqual([
      "INV-0",
    ]);
    expect(h.controller.getSnapshot().session!.workspace.documents[0]!.state).toBe("ready");
    h.controller.dispose();
  });
  it("reset aborts four slots and discards responses from the old workspace", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(4));
    await h.controller.reset();
    expect(h.calls.every((call) => call.signal.aborted)).toBe(true);
    for (const call of h.calls) call.completion.resolve(result(call.input));
    await h.settled;
    expect(h.controller.getSnapshot().session!.workspace.documents).toHaveLength(0);
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(0);
    expect(h.calls).toHaveLength(4);
    h.controller.dispose();
  });
  it("rejects unrelated workspace edits instead of treating them as batch-owned revisions", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(4));
    const graph = h.controller.getSnapshot().session!.workspace;
    h.controller.replaceGraph(h.controller.token("external_edit"), {
      ...graph,
      revision: graph.revision + 1,
      business: { ...graph.business, name: "Changed business" },
    });
    h.calls[0]!.completion.resolve(result(h.calls[0]!.input));
    await vi.waitFor(() => expect(h.calls[1]!.signal.aborted).toBe(true));
    for (const call of h.calls.slice(1)) call.completion.resolve(result(call.input));
    expect(await h.settled).toBeInstanceOf(Error);
    expect(h.controller.getSnapshot().session!.workspace.business.name).toBe("Changed business");
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(0);
    expect(h.calls).toHaveLength(4);
    h.controller.dispose();
  });
  it("a rejected batch verification submits no PDF or follow-on challenges", async () => {
    const h = await harness(10);
    h.authorize.mockRejectedValueOnce(new Error("Verification failed"));
    expect(await h.settled).toBeInstanceOf(Error);
    expect(h.authorize).toHaveBeenCalledTimes(1);
    expect(h.calls).toHaveLength(0);
    expect(
      h.controller.getSnapshot().session!.workspace.documents.some((d) => d.recognitionAttempted),
    ).toBe(false);
    h.controller.dispose();
  });
  it("processes ten fast documents with one challenge and ten distinct just-in-time grants", async () => {
    const h = await harness(10);
    vi.mocked(extractOriginal).mockImplementation(
      async (input, _blob, _signal, _grant, submitting) => {
        submitting?.();
        return result(input);
      },
    );
    await h.running;
    expect(h.authorize).toHaveBeenCalledTimes(1);
    expect(h.authorize.mock.calls[0]![0].operations).toHaveLength(10);
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(10);
    h.controller.dispose();
  });
});
