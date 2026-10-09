import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { MAX_PROJECTION_BYTES, SESSION_LIFETIME_MS } from "../packages/contracts/dist/index.js";
import { harborSession } from "./fixtures/harbor-v1/money-fixture.mjs";
import {
  encodeProjection,
  decodeProjection,
  PROJECTION_KEY,
  writeProjection,
} from "../apps/frontend/src/features/session/projection.ts";
import { SessionController } from "../apps/frontend/src/features/session/session-controller.ts";
import { acquireSessionOwnership } from "../apps/frontend/src/features/session/ownership.ts";
import { validatePdfBlob } from "../apps/frontend/src/features/session/blob-cache.ts";

class MemoryStorage {
  values = new Map();
  fail = false;
  getItem(key) {
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    if (this.fail) throw new Error("quota");
    this.values.set(key, value);
  }
  removeItem(key) {
    this.values.delete(key);
  }
}
class MemoryCache {
  values = new Map();
  removed = [];
  late = null;
  async get(id, doc) {
    return this.values.get(`${id}/${doc.id}`) ?? null;
  }
  async put(id, doc, blob) {
    if (this.late) await this.late;
    this.values.set(`${id}/${doc.id}`, blob);
  }
  async removeWorkspace(id) {
    this.removed.push(id);
    for (const key of this.values.keys()) if (key.startsWith(`${id}/`)) this.values.delete(key);
  }
  async sweepExpired() {}
}
function harness(storage = new MemoryStorage(), cache = new MemoryCache(), owned = new Set()) {
  let now = 2000;
  let sequence = 0;
  const environment = {
    now: () => now,
    identity: () => `test${++sequence}`,
    storage: () => storage,
    cache: () => cache,
    lease: async (id) => {
      const acquired = !owned.has(id);
      if (acquired) owned.add(id);
      return {
        acquired,
        release: () => {
          if (acquired) owned.delete(id);
        },
      };
    },
  };
  return {
    storage,
    cache,
    owned,
    environment,
    clock: (value) => {
      now = value;
    },
    controller: new SessionController(environment),
  };
}
describe("bounded browser refresh and lifecycle", () => {
  it.each([
    ["sample", "fake"],
    ["sample", "live"],
    ["upload", "fake"],
    ["upload", "live"],
  ])(
    "claims first dashboard tour once for %s/%s, across refresh and further processing",
    async (entry, mode) => {
      const h = harness(),
        saved = harborSession();
      saved.experience = { ...saved.experience, entry, stage: "dashboard", view: "overview" };
      saved.workspace.documents = saved.workspace.documents.map((doc) => ({
        ...doc,
        recognitionMode: mode,
        provenance: entry === "upload" ? "visitor_upload" : doc.provenance,
      }));
      writeProjection(h.storage, saved);
      await h.controller.initialize();
      const before = h.controller.getSnapshot().session;
      expect(h.controller.claimDashboardTour()).toBe(true);
      expect(h.controller.claimDashboardTour()).toBe(false);
      expect(h.controller.getSnapshot().session.workspace).toEqual(before.workspace);
      h.controller.dispose();
      await h.controller.initialize();
      expect(h.controller.claimDashboardTour()).toBe(false);
      const current = h.controller.getSnapshot().session;
      h.controller.setExperience({ ...current.experience, stage: "documents" });
      expect(h.controller.claimDashboardTour()).toBe(false);
      h.controller.setExperience({ ...current.experience, stage: "dashboard" });
      expect(h.controller.claimDashboardTour()).toBe(false);
      await h.controller.reset();
      expect(h.controller.getSnapshot().session.experience.dashboardTourSeen).toBe(false);
      h.controller.dispose();
    },
  );
  it("does not claim onboarding before processed dashboard entry and defaults old projections safely", async () => {
    const h = harness();
    await h.controller.initialize();
    expect(h.controller.claimDashboardTour()).toBe(false);
    const current = h.controller.getSnapshot().session;
    h.controller.setExperience({ ...current.experience, stage: "dashboard" });
    expect(h.controller.claimDashboardTour()).toBe(false);
    h.controller.dispose();
    const legacy = harborSession();
    delete legacy.experience.dashboardTourSeen;
    const restored = decodeProjection(JSON.stringify(legacy), 2000);
    expect(restored.experience.dashboardTourSeen).toBe(false);
    h.storage.setItem(PROJECTION_KEY, JSON.stringify(legacy));
    await h.controller.initialize();
    const loaded = h.controller.getSnapshot().session;
    h.controller.setExperience({ ...loaded.experience, stage: "processing" });
    expect(h.controller.claimDashboardTour()).toBe(false);
    h.controller.setExperience({ ...loaded.experience, stage: "dashboard", view: "records" });
    expect(h.controller.claimDashboardTour()).toBe(false);
    h.controller.setExperience({ ...loaded.experience, stage: "dashboard", view: "overview" });
    h.clock(legacy.workspace.expiresAt);
    expect(h.controller.claimDashboardTour()).toBe(false);
    h.controller.dispose();
  });
  it("restores demo preferences and keeps layout Undo separate from profile/currency and financial revision", async () => {
    const h = harness();
    await h.controller.initialize();
    const before = h.controller.getSnapshot().session;
    h.controller.setExperience({ ...before.experience, stage: "dashboard", view: "records" });
    h.controller.setDashboard({
      ...before.dashboard,
      widgets: before.dashboard.widgets.slice(0, 4),
      appliedProposalIds: ["retro_chart"],
    });
    const edited = h.controller.getSnapshot().session;
    h.controller.setDashboard(
      {
        ...edited.dashboard,
        profileName: "My studio",
        currency: "EUR",
        eurRateMicros: 900000,
        eurRateDate: "2026-10-09",
      },
      false,
    );
    h.controller.dispose();
    await h.controller.initialize();
    expect(h.controller.getSnapshot().session.experience).toMatchObject({
      stage: "dashboard",
      view: "records",
    });
    expect(h.controller.getSnapshot().session.dashboard.appliedProposalIds).toEqual([
      "retro_chart",
    ]);
    h.controller.undoDashboard();
    const restored = h.controller.getSnapshot().session;
    expect(restored.dashboard.widgets).toHaveLength(before.dashboard.widgets.length);
    expect(restored.dashboard).toMatchObject({
      profileName: "My studio",
      currency: "EUR",
      eurRateMicros: 900000,
      eurRateDate: "2026-10-09",
      appliedProposalIds: [],
    });
    expect(restored.workspace.revision).toBe(before.workspace.revision);
    h.controller.dispose();
  });
  it("refresh returns interrupted processing to document selection without restarting extraction", async () => {
    const h = harness(),
      saved = harborSession();
    saved.experience = {
      ...saved.experience,
      stage: "processing",
      entry: "sample",
      selectedDocumentIds: saved.workspace.documents.map((d) => d.id),
    };
    saved.workspace.documents[0].state = "reading";
    writeProjection(h.storage, saved);
    await h.controller.initialize();
    expect(h.controller.getSnapshot().session.experience.stage).toBe("documents");
    expect(h.controller.getSnapshot().session.experience.selectedDocumentIds).toEqual(
      saved.experience.selectedDocumentIds,
    );
    expect(h.controller.getSnapshot().session.workspace.documents[0].state).toBe("cancelled");
    h.controller.dispose();
  });
  it("local reset completes despite server/storage cleanup failure, isolates late work and retains fixed expiry", async () => {
    const h = harness();
    h.environment.revoke = async () => false;
    await h.controller.initialize();
    const old = h.controller.getSnapshot().session.workspace.id,
      token = h.controller.token("old");
    const effect = new AbortController();
    h.controller.trackEffect(effect);
    h.cache.removeWorkspace = async () => {
      throw new Error("blocked");
    };
    await h.controller.reset();
    const current = h.controller.getSnapshot();
    expect(effect.signal.aborted).toBe(true);
    expect(current.session.workspace.id).not.toBe(old);
    expect(h.controller.isCurrent(token)).toBe(false);
    expect(current.notice).toContain("could not be removed");
    expect(current.notice).toContain("could not be confirmed");
    const expires = current.session.workspace.expiresAt;
    h.controller.dispose();
    await h.controller.initialize();
    expect(h.controller.getSnapshot().session.workspace.expiresAt).toBe(expires);
    h.controller.dispose();
  });
  it("cancels active recognition on a successful edit and preserves an Undo that cannot restart reading", async () => {
    const h = harness();
    await h.controller.initialize();
    const token = h.controller.token("register");
    const graph = h.controller.getSnapshot().session.workspace;
    const doc = { ...harborSession().workspace.documents[0], state: "reading" };
    h.controller.replaceGraph(token, { ...graph, revision: graph.revision + 1, documents: [doc] });
    const effect = new AbortController();
    h.controller.trackEffect(effect);
    h.controller.apply(
      [
        {
          type: "create_contact",
          record: { id: "contact_during", name: "During scan", role: "customer" },
        },
      ],
      "Create during scan",
    );
    expect(effect.signal.aborted).toBe(true);
    expect(h.controller.getSnapshot().session.workspace.documents[0].state).toBe("cancelled");
    const next = h.controller.getSnapshot().session;
    h.controller.undo(next.undo.commandId, next.workspace.revision);
    expect(h.controller.getSnapshot().session.workspace.documents[0].state).toBe("cancelled");
    expect(h.controller.getSnapshot().session.workspace.contacts).toHaveLength(0);
    h.controller.dispose();
  });
  it("keeps a bounded verified original in memory if IndexedDB fails and releases it on reset", async () => {
    const h = harness();
    await h.controller.initialize();
    h.cache.put = async () => {
      throw new Error("storage denied");
    };
    const doc = harborSession().workspace.documents[0];
    const bytes = await readFile("apps/frontend/public/samples/harbor-v1/harbor-HS-101.pdf");
    const blob = new Blob([bytes], { type: "application/pdf" });
    await expect(h.controller.cachePdf(h.controller.token("cache"), doc, blob)).rejects.toThrow(
      "storage denied",
    );
    expect(await h.controller.original(doc)).toBe(blob);
    await h.controller.reset();
    expect(await h.controller.original(doc)).toBeNull();
    h.controller.dispose();
  });
  it("restores a valid graph, filters and eligible Undo; rejects corruption, expiry and hostile projections", () => {
    const session = harborSession();
    const raw = encodeProjection(session);
    expect(decodeProjection(raw, 2000)).toEqual(session);
    for (const invalid of [
      "{",
      "x".repeat(MAX_PROJECTION_BYTES + 1),
      JSON.stringify({ ...session, secret: "credential" }),
      JSON.stringify({
        ...session,
        workspace: { ...session.workspace, expiresAt: session.workspace.expiresAt + 1 },
      }),
      JSON.stringify({
        ...session,
        workspace: {
          ...session.workspace,
          events: [{ ...session.workspace.events[0], counterpartyId: "contact_missing" }],
        },
      }),
    ])
      expect(() => decodeProjection(invalid, 2000)).toThrow();
    expect(() => decodeProjection(raw, session.workspace.expiresAt)).toThrow(/expired/);
    expect(() => decodeProjection(raw, 999)).toThrow(/expired/);
  });
  it("keeps the previous coherent projection on quota failure and marks current work memory-only", async () => {
    const h = harness();
    await h.controller.initialize();
    const initial = h.storage.getItem(PROJECTION_KEY);
    h.storage.fail = true;
    h.controller.apply(
      [{ type: "create_contact", record: { id: "contact_one", name: "First", role: "customer" } }],
      "Create First",
    );
    expect(h.controller.getSnapshot().session.workspace.contacts).toHaveLength(1);
    expect(h.controller.getSnapshot().persistence).toBe("memory");
    expect(h.storage.getItem(PROJECTION_KEY)).toBe(initial);
    expect(() => writeProjection(h.storage, h.controller.getSnapshot().session)).toThrow();
    h.storage.fail = false;
    h.controller.apply(
      [
        {
          type: "update_contact",
          record: { id: "contact_one", name: "Updated", role: "customer" },
        },
      ],
      "Update First",
    );
    expect(h.controller.getSnapshot().persistence).toBe("ready");
    expect(h.controller.getSnapshot().notice).toBe("Refresh recovery is available again.");
    h.storage.setItem(PROJECTION_KEY, initial);
    h.controller.dispose();
    h.storage.fail = false;
    const reload = new SessionController(h.environment);
    await reload.initialize();
    expect(reload.getSnapshot().session.workspace.contacts).toHaveLength(0);
    reload.dispose();
  });
  it("refresh preserves one latest Undo and never renews absolute expiry", async () => {
    const h = harness();
    await h.controller.initialize();
    h.controller.apply(
      [{ type: "create_contact", record: { id: "contact_one", name: "First", role: "customer" } }],
      "Create First",
    );
    const before = h.controller.getSnapshot().session;
    h.controller.setFilters({ ...before.filters, register: "contacts" });
    h.controller.dispose();
    h.clock(4000);
    const reload = new SessionController(h.environment);
    await reload.initialize();
    expect(reload.getSnapshot().session).toEqual({
      ...before,
      filters: { ...before.filters, register: "contacts" },
    });
    reload.undo(before.undo.commandId, before.workspace.revision);
    expect(reload.getSnapshot().session.workspace.contacts).toHaveLength(0);
    expect(reload.getSnapshot().session.workspace.revision).toBe(2);
    expect(reload.getSnapshot().session.workspace.expiresAt).toBe(before.workspace.expiresAt);
    reload.dispose();
  });
  it("forks a copied tab identity and honestly preserves records with missing uploaded originals", async () => {
    const h = harness();
    const session = harborSession();
    session.workspace.documents[0].provenance = "visitor_upload";
    h.storage.setItem(PROJECTION_KEY, encodeProjection(session));
    h.cache.values.set(
      `${session.workspace.id}/${session.workspace.documents[0].id}`,
      new Blob(["original"]),
    );
    await h.controller.initialize();
    const copiedStorage = new MemoryStorage();
    copiedStorage.setItem(PROJECTION_KEY, h.storage.getItem(PROJECTION_KEY));
    const child = new SessionController({
      ...h.environment,
      identity: () => "fork",
      storage: () => copiedStorage,
    });
    await child.initialize();
    const fork = child.getSnapshot();
    expect(fork.session.workspace.id).not.toBe(session.workspace.id);
    expect(fork.session.workspace.events).toEqual(session.workspace.events);
    expect(fork.missingDocumentIds).toEqual([session.workspace.documents[0].id]);
    expect(fork.session.workspace.expiresAt).toBe(session.workspace.expiresAt);
    child.dispose();
    h.controller.dispose();
  });
  it("rejects a stale recognition result after edits and a late PDF write after Reset", async () => {
    const h = harness();
    await h.controller.initialize();
    const token = h.controller.token("scan");
    const old = h.controller.getSnapshot().session.workspace;
    h.controller.apply(
      [{ type: "create_contact", record: { id: "contact_one", name: "First", role: "customer" } }],
      "Create",
    );
    expect(() => h.controller.replaceGraph(token, { ...old, revision: old.revision + 1 })).toThrow(
      /stale/,
    );
    const latest = h.controller.token("pdf");
    let finish = () => {};
    h.cache.late = new Promise((resolve) => {
      finish = resolve;
    });
    const doc = harborSession().workspace.documents[0];
    const bytes = await readFile("apps/frontend/public/samples/harbor-v1/harbor-HS-101.pdf");
    let startedResolve;
    const started = new Promise((resolve) => {
      startedResolve = resolve;
    });
    const originalPut = h.cache.put.bind(h.cache);
    h.cache.put = (...args) => {
      startedResolve();
      return originalPut(...args);
    };
    const pending = h.controller.cachePdf(
      latest,
      doc,
      new Blob([bytes], { type: "application/pdf" }),
    );
    const failure = expect(pending).rejects.toThrow(/cancelled/);
    await started;
    await h.controller.reset();
    finish();
    await failure;
    expect(h.cache.values.size).toBe(0);
    expect(h.controller.getSnapshot().session.workspace.contacts).toHaveLength(0);
    expect(h.controller.getSnapshot().session.workspace.id).not.toBe(old.id);
    h.controller.dispose();
  });
  it("cancels interrupted work without retry, and cleans only an owned expired session", async () => {
    const h = harness();
    const session = harborSession();
    session.workspace.documents[0].state = "reading";
    h.storage.setItem(PROJECTION_KEY, encodeProjection(session));
    await h.controller.initialize();
    expect(h.controller.getSnapshot().session.workspace.documents[0].state).toBe("cancelled");
    const fixedExpiry = session.workspace.expiresAt;
    h.controller.dispose();
    h.clock(fixedExpiry);
    const reload = new SessionController(h.environment);
    await reload.initialize();
    expect(reload.getSnapshot().session.workspace.events).toEqual([]);
    expect(reload.getSnapshot().notice).toBeNull();
    expect(h.cache.removed).toContain(session.workspace.id);
    expect(reload.getSnapshot().session.workspace.expiresAt).toBe(
      fixedExpiry + SESSION_LIFETIME_MS,
    );
    reload.dispose();
  });
  it("overlapping Reset cleanup never releases a newer session's ownership lease", async () => {
    const h = harness();
    await h.controller.initialize();
    let finish = () => {};
    const cleanup = new Promise((resolve) => {
      finish = resolve;
    });
    h.cache.removeWorkspace = async () => {
      await cleanup;
    };
    const first = h.controller.reset();
    const second = h.controller.reset();
    await second;
    const newestId = h.controller.getSnapshot().session.workspace.id;
    expect(h.owned.has(newestId)).toBe(true);
    finish();
    await first;
    expect(h.owned.has(newestId)).toBe(true);
    h.controller.apply(
      [{ type: "create_contact", record: { id: "contact_new", name: "Newest", role: "customer" } }],
      "Create",
    );
    expect(h.controller.getSnapshot().persistence).toBe("ready");
    h.controller.dispose();
  });
  it("recovers from StrictMode-like disposal during initialization", async () => {
    const h = harness();
    const opening = h.controller.initialize();
    h.controller.dispose();
    const reopened = h.controller.initialize();
    await Promise.all([opening, reopened]);
    expect(h.controller.getSnapshot().ready).toBe(true);
    expect(h.owned.size).toBe(1);
    h.controller.dispose();
    expect(h.owned.size).toBe(0);
  });
  it("waits for a previous asynchronous lock release without forking away saved Undo", async () => {
    const h = harness();
    await h.controller.initialize();
    h.controller.apply(
      [{ type: "create_contact", record: { id: "contact_one", name: "First", role: "customer" } }],
      "Create",
    );
    const saved = h.controller.getSnapshot().session;
    h.controller.dispose();
    let unlock = () => {};
    const owned = new Set();
    const environment = {
      ...h.environment,
      lease: async (id) => {
        const acquired = !owned.has(id);
        if (acquired) owned.add(id);
        return {
          acquired,
          release: async () => {
            await new Promise((resolve) => {
              unlock = resolve;
            });
            if (acquired) owned.delete(id);
          },
        };
      },
    };
    const controller = new SessionController(environment);
    await controller.initialize();
    controller.dispose();
    const reopened = controller.initialize();
    await Promise.resolve();
    unlock();
    await reopened;
    expect(controller.getSnapshot().session.workspace.id).toBe(saved.workspace.id);
    expect(controller.getSnapshot().session.undo).toEqual(saved.undo);
    controller.dispose();
    unlock();
  });
  it("holds and releases an exclusive lock and handles unavailable/denied locks", async () => {
    let releaseDone;
    let held;
    const locks = {
      request: (_name, _options, callback) => {
        held = callback({ name: "owned" });
        return held;
      },
    };
    const lease = await acquireSessionOwnership("workspace_a", locks);
    expect(lease.acquired).toBe(true);
    releaseDone = false;
    void held.then(() => {
      releaseDone = true;
    });
    expect(releaseDone).toBe(false);
    lease.release();
    await held;
    expect(releaseDone).toBe(true);
    expect((await acquireSessionOwnership("a", undefined)).acquired).toBe(false);
    expect(
      (
        await acquireSessionOwnership("a", {
          request: async () => {
            throw new Error("denied");
          },
        })
      ).acquired,
    ).toBe(false);
  });
  it("verifies PDF signature, size, MIME and original fingerprint before caching", async () => {
    const data = new TextEncoder().encode("%PDF-1.7\nminimal test bytes");
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    const doc = {
      ...harborSession().workspace.documents[0],
      byteLength: data.length,
      sha256: hash,
    };
    await expect(
      validatePdfBlob(doc, new Blob([data], { type: "application/pdf" })),
    ).resolves.toBeUndefined();
    await expect(validatePdfBlob(doc, new Blob([data], { type: "text/html" }))).rejects.toThrow(
      /metadata/,
    );
    await expect(
      validatePdfBlob(
        { ...doc, sha256: "a".repeat(64) },
        new Blob([data], { type: "application/pdf" }),
      ),
    ).rejects.toThrow(/fingerprint/);
    await expect(
      validatePdfBlob(
        { ...doc, byteLength: 7 },
        new Blob(["broken!"], { type: "application/pdf" }),
      ),
    ).rejects.toThrow(/not a PDF/);
  });
});
