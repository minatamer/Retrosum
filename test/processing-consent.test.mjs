import { describe, it, expect, vi } from "vitest";
import {
  capabilitiesSchema,
  DEMO_LIMITS,
  documentSchema,
  PROCESSING_DISCLOSURE_VERSION,
} from "../packages/contracts/dist/index.js";
vi.mock("../apps/frontend/src/features/documents/recognition-client.ts", () => ({
  recognitionCapabilities: vi.fn(),
  extractOriginal: vi.fn(),
}));
vi.mock("../apps/frontend/src/features/processing/processing-client.ts", async (original) => ({
  ...(await original()),
  requestBatchGrant: vi.fn(async () => "injected-grant"),
}));
import {
  recognitionCapabilities,
  extractOriginal,
} from "../apps/frontend/src/features/documents/recognition-client.ts";
import { processDocuments } from "../apps/frontend/src/features/documents/recognition-flow.ts";
import {
  hashRequest,
  requestBatchGrant,
} from "../apps/frontend/src/features/processing/processing-client.ts";
import { SessionController } from "../apps/frontend/src/features/session/session-controller.ts";
const capabilities = capabilitiesSchema.parse({
  schemaVersion: 1,
  mode: "live",
  documents: { available: true },
  copilot: { available: true },
  limits: DEMO_LIMITS,
  processing: {
    provider: "OpenAI",
    disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
    admissionAvailable: true,
    siteKey: "injected",
  },
});
async function harness() {
  const values = new Map();
  const controller = new SessionController({
    now: () => Date.UTC(2026, 9, 8),
    identity: () => "consent_test",
    storage: () => ({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    }),
    lease: async () => ({ acquired: true, release: () => {} }),
    cache: () => ({
      get: async () => null,
      put: async () => {},
      removeWorkspace: async () => {},
      sweepExpired: async () => {},
    }),
  });
  await controller.initialize();
  const doc = documentSchema.parse({
    id: "document_consent",
    name: "original.pdf",
    mime: "application/pdf",
    sha256: "a".repeat(64),
    byteLength: 12,
    pageCount: 1,
    kind: "invoice",
    provenance: "visitor_upload",
    state: "queued",
  });
  const session = controller.getSnapshot().session;
  controller.replaceGraph(controller.token("prepare"), {
    ...session.workspace,
    revision: session.workspace.revision + 1,
    documents: [doc],
  });
  recognitionCapabilities.mockResolvedValue(capabilities);
  return { controller, item: { doc, blob: new Blob(["test original"]) } };
}
describe("consent precedes recognition submission state", () => {
  it("cancelled consent never marks the original submitted or spends its deliberate retry", async () => {
    const h = await harness(),
      authorize = vi.fn(async () => {
        throw new Error("Cancelled review");
      });
    try {
      await expect(
        processDocuments(
          h.controller,
          [h.item],
          new AbortController().signal,
          () => {},
          false,
          authorize,
        ),
      ).rejects.toThrow("Cancelled review");
      expect(extractOriginal).not.toHaveBeenCalled();
      expect(requestBatchGrant).not.toHaveBeenCalled();
      expect(h.controller.getSnapshot().session.workspace.documents[0]).toMatchObject({
        state: "queued",
        recognitionAttempted: false,
      });
    } finally {
      h.controller.dispose();
    }
  });
  it("allowed input hash matches the exact submitted revision and dispatch remains one attempt", async () => {
    const h = await harness();
    const selectedRevision = h.controller.getSnapshot().session.workspace.revision;
    let authorized;
    const authorize = vi.fn(async (identity) => {
      authorized = identity;
      return "injected-grant";
    });
    extractOriginal.mockImplementationOnce(async (metadata, _blob, _signal, grant, submitting) => {
      expect(grant).toBe("injected-grant");
      submitting();
      expect(metadata.revision).toBe(selectedRevision);
      expect(authorized.inputHash).toBe(await hashRequest(authorized.operations));
      expect(authorized.operations[0].inputHash).toBe(await hashRequest(metadata));
      expect(requestBatchGrant).toHaveBeenCalledWith(
        { ...authorized.operations[0], action: "extract", workspaceId: authorized.workspaceId },
        "injected-grant",
        expect.any(AbortSignal),
      );
      throw new Error("Injected unavailable response");
    });
    try {
      await processDocuments(
        h.controller,
        [h.item],
        new AbortController().signal,
        () => {},
        false,
        authorize,
      );
      expect(extractOriginal).toHaveBeenCalledTimes(1);
      expect(h.controller.getSnapshot().session.workspace.documents[0].recognitionAttempted).toBe(
        true,
      );
    } finally {
      h.controller.dispose();
    }
  });
  it("transport preparation failure leaves the original unsubmitted after allowed consent", async () => {
    const h = await harness();
    extractOriginal.mockRejectedValueOnce(new TypeError("Transport could not be prepared"));
    try {
      await processDocuments(
        h.controller,
        [h.item],
        new AbortController().signal,
        () => {},
        false,
        async () => "injected-grant",
      );
      expect(h.controller.getSnapshot().session.workspace.documents[0]).toMatchObject({
        state: "error",
        recognitionAttempted: false,
      });
    } finally {
      h.controller.dispose();
    }
  });
});
