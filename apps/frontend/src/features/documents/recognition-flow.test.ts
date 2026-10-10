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

vi.mock("./recognition-client", () => ({
  extractOriginal: vi.fn(),
  recognitionCapabilities: vi.fn(),
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
async function harness(count = 3, firstAuthorization?: Promise<string>) {
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
describe("two-document processing", () => {
  it("overlaps two requests and commits reversed completions in selection order without losing records", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    expect(
      h.controller.getSnapshot().session!.workspace.documents.filter((d) => d.recognitionAttempted),
    ).toHaveLength(2);
    h.calls[1]!.completion.resolve(result(h.calls[1]!.input));
    await vi.waitFor(() =>
      expect(h.controller.getSnapshot().session!.workspace.documents[1]!.state).toBe("validating"),
    );
    expect(h.calls).toHaveLength(2);
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(0);
    h.calls[0]!.completion.resolve(result(h.calls[0]!.input));
    await vi.waitFor(() => expect(h.calls).toHaveLength(3));
    expect(h.controller.getSnapshot().session!.workspace.events.map((e) => e.reference)).toEqual([
      "INV-0",
      "INV-1",
    ]);
    h.calls[2]!.completion.resolve(result(h.calls[2]!.input));
    await h.running;
    const graph = h.controller.getSnapshot().session!.workspace;
    expect(graph.events.map((e) => e.reference).sort()).toEqual(["INV-0", "INV-1", "INV-2"]);
    expect(graph.events.reduce((sum, e) => sum + e.amountMinor, 0)).toBe(30000);
    expect(graph.documents.every((d) => d.state === "ready")).toBe(true);
    expect(h.authorize).toHaveBeenCalledTimes(3);
    h.controller.dispose();
  });
  it("matches a payment to its earlier invoice even when the payment request finishes first", async () => {
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
  it("keeps one challenge owner while admitted extraction continues", async () => {
    const h = await harness();
    const waiting = deferred<string>();
    h.authorize.mockImplementationOnce(() => waiting.promise);
    await vi.waitFor(() => expect(h.authorize).toHaveBeenCalledTimes(1));
    expect(h.calls).toHaveLength(0);
    waiting.resolve("grant");
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    h.calls[0]!.completion.resolve(result(h.calls[0]!.input));
    h.calls[1]!.completion.resolve(result(h.calls[1]!.input));
    await vi.waitFor(() => expect(h.calls).toHaveLength(3));
    h.calls[2]!.completion.resolve(result(h.calls[2]!.input));
    await h.running;
    h.controller.dispose();
  });
  it("keeps other successes and continues the pool after one failure without retrying", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    h.calls[0]!.completion.reject(new Error("Provider refused"));
    await vi.waitFor(() => expect(h.calls).toHaveLength(3));
    h.calls[1]!.completion.resolve(result(h.calls[1]!.input));
    h.calls[2]!.completion.resolve(result(h.calls[2]!.input));
    await h.running;
    expect(h.controller.getSnapshot().session!.workspace.documents[0]!.state).toBe("error");
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(2);
    expect(h.calls).toHaveLength(3);
    h.controller.dispose();
  });
  it("aborts both in-flight requests and leaves unstarted originals unsubmitted", async () => {
    const h = await harness(4);
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    h.abort.abort();
    expect(h.calls.every((call) => call.signal.aborted)).toBe(true);
    for (const call of h.calls) call.completion.resolve(result(call.input));
    expect(await h.settled).toBeInstanceOf(Error);
    const graph = h.controller.getSnapshot().session!.workspace;
    expect(graph.events).toHaveLength(0);
    expect(graph.documents.every((d) => d.state === "cancelled")).toBe(true);
    expect(graph.documents.slice(2).some((d) => d.recognitionAttempted)).toBe(false);
    expect(h.calls).toHaveLength(2);
    h.controller.dispose();
  });
  it("preserves completed sources when cancellation occurs with two more slots active", async () => {
    const h = await harness(4);
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    h.calls[0]!.completion.resolve(result(h.calls[0]!.input));
    await vi.waitFor(() => expect(h.calls).toHaveLength(3));
    h.abort.abort();
    for (const call of h.calls.slice(1)) call.completion.resolve(result(call.input));
    await h.settled;
    expect(h.controller.getSnapshot().session!.workspace.events.map((e) => e.reference)).toEqual([
      "INV-0",
    ]);
    expect(h.controller.getSnapshot().session!.workspace.documents[0]!.state).toBe("ready");
    h.controller.dispose();
  });
  it("reset aborts both slots and discards late results from the old workspace", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    await h.controller.reset();
    expect(h.calls.every((call) => call.signal.aborted)).toBe(true);
    for (const call of h.calls) call.completion.resolve(result(call.input));
    await h.settled;
    expect(h.controller.getSnapshot().session!.workspace.documents).toHaveLength(0);
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(0);
    expect(h.calls).toHaveLength(2);
    h.controller.dispose();
  });
  it("does not treat an unrelated workspace revision as a mutation owned by the batch", async () => {
    const h = await harness();
    await vi.waitFor(() => expect(h.calls).toHaveLength(2));
    const graph = h.controller.getSnapshot().session!.workspace;
    h.controller.replaceGraph(h.controller.token("external_edit"), {
      ...graph,
      revision: graph.revision + 1,
      business: { ...graph.business, name: "Changed business" },
    });
    h.calls[0]!.completion.resolve(result(h.calls[0]!.input));
    await vi.waitFor(() => expect(h.calls[1]!.signal.aborted).toBe(true));
    h.calls[1]!.completion.resolve(result(h.calls[1]!.input));
    expect(await h.settled).toBeInstanceOf(Error);
    expect(h.controller.getSnapshot().session!.workspace.business.name).toBe("Changed business");
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(0);
    expect(h.calls).toHaveLength(2);
    h.controller.dispose();
  });
  it("paces from actual verification completion when the first challenge is slow", async () => {
    vi.useFakeTimers();
    const waiting = deferred<string>();
    const h = await harness(6, waiting.promise);
    vi.mocked(extractOriginal).mockImplementation(
      async (input, _blob, _signal, _grant, submitting) => {
        submitting?.();
        return result(input);
      },
    );
    await vi.waitFor(() => expect(h.authorize).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(50000);
    waiting.resolve("grant");
    await vi.waitFor(() => expect(h.authorize).toHaveBeenCalledTimes(5));
    await vi.advanceTimersByTimeAsync(10000);
    expect(h.authorize).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(50100);
    await vi.waitFor(() => expect(h.authorize).toHaveBeenCalledTimes(6));
    await h.running;
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(6);
    h.controller.dispose();
  });
  it("paces a fast ten-document batch under the unchanged six/minute admission limit", async () => {
    vi.useFakeTimers();
    const h = await harness(10);
    vi.mocked(extractOriginal).mockImplementation(
      async (input, _blob, _signal, _grant, submitting) => {
        submitting?.();
        return result(input);
      },
    );
    await vi.waitFor(() => expect(h.authorize).toHaveBeenCalledTimes(5));
    await vi.advanceTimersByTimeAsync(59000);
    expect(h.authorize).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(1100);
    await vi.waitFor(() => expect(h.authorize).toHaveBeenCalledTimes(10));
    await h.running;
    expect(h.controller.getSnapshot().session!.workspace.events).toHaveLength(10);
    h.controller.dispose();
  });
});
