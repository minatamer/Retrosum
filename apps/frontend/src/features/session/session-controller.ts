import {
  commandIdSchema,
  sessionFilterSchema,
  sessionSchema,
  workspaceIdSchema,
  SESSION_LIFETIME_MS,
  type MoneySession,
  type OperationToken,
  type SessionAction,
  type SessionCommand,
  type SessionFilter,
  type SourceDocument,
  type Workspace,
  type FinalizedMessage,
} from "@retrosum/contracts";
import { applyCommand, undoLatest, validateSession } from "@retrosum/money";
import {
  decodeProjection,
  cancelInterruptedWork,
  PROJECTION_KEY,
  writeProjection,
} from "./projection";
import { acquireSessionOwnership, type SessionLease } from "./ownership";
import { PdfBlobCache, validatePdfBlob } from "./blob-cache";

type Cache = Pick<PdfBlobCache, "get" | "put" | "removeWorkspace" | "sweepExpired">;
export type SessionEnvironment = {
  now: () => number;
  identity: () => string;
  storage: () => Storage;
  lease: (id: string) => Promise<SessionLease>;
  cache: () => Cache;
};
export type SessionSnapshot = {
  session: MoneySession | null;
  ready: boolean;
  generation: number;
  persistence: "loading" | "ready" | "memory";
  notice: string | null;
  missingDocumentIds: string[];
};
export const EMPTY_SNAPSHOT: SessionSnapshot = {
  session: null,
  ready: false,
  generation: 0,
  persistence: "loading",
  notice: null,
  missingDocumentIds: [],
};
export function createEmptySession(identity: string, now: number): MoneySession {
  const date = new Date(now).toISOString().slice(0, 10);
  const month = date.slice(0, 7);
  const end = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0))
    .toISOString()
    .slice(0, 10);
  return sessionSchema.parse({
    workspace: {
      id: workspaceIdSchema.parse(`workspace_${identity}`),
      schemaVersion: 1,
      revision: 0,
      createdAt: now,
      expiresAt: now + SESSION_LIFETIME_MS,
      business: {
        name: "My business",
        currency: "USD",
        ownedAccountReferences: ["checking", "reserve"],
      },
      asOf: date,
      documents: [],
      contacts: [],
      events: [],
      payments: [],
      invoices: [],
      issues: [],
    },
    appliedCommandIds: [],
    undo: null,
    filters: { from: `${month}-01`, to: end, register: "invoices" },
    messages: [],
  });
}
const browserEnvironment: SessionEnvironment = {
  now: () => Date.now(),
  identity: () => crypto.randomUUID(),
  storage: () => window.sessionStorage,
  lease: (id) => acquireSessionOwnership(id, navigator.locks),
  cache: () => new PdfBlobCache(window.indexedDB),
};
export class SessionController {
  private snapshot: SessionSnapshot = EMPTY_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  private lease: SessionLease | null = null;
  private releasing: Promise<void> = Promise.resolve();
  private initializing: { generation: number; promise: Promise<void> } | null = null;
  private readonly effects = new Set<AbortController>();
  private readonly originals = new Map<string, Blob>();
  constructor(private readonly environment: SessionEnvironment = browserEnvironment) {}
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => EMPTY_SNAPSHOT;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(next: SessionSnapshot) {
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
  private persist(session: MoneySession) {
    if (!this.lease?.acquired)
      return {
        persistence: "memory" as const,
        notice:
          "Tab ownership is unavailable. Your current work stays in memory; refresh recovery is unavailable.",
      };
    try {
      writeProjection(this.environment.storage(), session);
      return {
        persistence: "ready" as const,
        notice:
          this.snapshot.persistence === "memory"
            ? "Refresh recovery is available again."
            : this.snapshot.notice,
      };
    } catch {
      return {
        persistence: "memory" as const,
        notice:
          "Your current records are accurate, but this change could not be saved for refresh. The previous saved version may return. Keep this tab open.",
      };
    }
  }
  initialize(): Promise<void> {
    if (this.initializing?.generation === this.snapshot.generation)
      return this.initializing.promise;
    if (this.snapshot.ready) return Promise.resolve();
    const generation = this.snapshot.generation;
    const previous = this.initializing?.promise ?? Promise.resolve();
    const promise = previous
      .catch(() => undefined)
      .then(() => this.releasing)
      .then(() => this.restore(generation))
      .finally(() => {
        if (this.initializing?.promise === promise) this.initializing = null;
      });
    this.initializing = { generation, promise };
    return promise;
  }
  private async restore(generation: number) {
    if (generation !== this.snapshot.generation) return;
    let session: MoneySession;
    let notice: string | null = null;
    let expiredId: string | null = null;
    try {
      const raw = this.environment.storage().getItem(PROJECTION_KEY);
      if (raw) {
        try {
          session = decodeProjection(raw, this.environment.now());
        } catch {
          // Only a fully validated identity may authorize owned cleanup.
          try {
            if (raw.length <= 2 * 1024 * 1024) {
              const parsed = validateSession(sessionSchema.parse(JSON.parse(raw)));
              if (parsed.workspace.expiresAt <= this.environment.now())
                expiredId = parsed.workspace.id;
            }
          } catch {
            /* Corrupt data never selects a cleanup target. */
          }
          session = createEmptySession(this.environment.identity(), this.environment.now());
          notice =
            "The previous workspace was expired or could not be safely restored. A fresh empty session is ready.";
        }
      } else session = createEmptySession(this.environment.identity(), this.environment.now());
    } catch {
      session = createEmptySession(this.environment.identity(), this.environment.now());
      notice = "Browser storage is unavailable. Refresh recovery may not work.";
    }
    let lease = await this.environment.lease(session.workspace.id);
    if (!lease.acquired) {
      session = {
        ...session,
        workspace: {
          ...session.workspace,
          id: workspaceIdSchema.parse(`workspace_${this.environment.identity()}`),
        },
        undo: null,
      };
      lease = await this.environment.lease(session.workspace.id);
      notice =
        session.workspace.contacts.length +
          session.workspace.events.length +
          session.workspace.invoices.length +
          session.workspace.payments.length >
        0
          ? "This tab has its own workspace identity. Copied records are separate; uploaded originals must be selected again."
          : "A private browser session is ready.";
    }
    if (generation !== this.snapshot.generation) {
      await lease.release();
      return;
    }
    this.lease = lease;
    this.publish({
      session,
      ready: true,
      generation,
      persistence: "loading",
      notice,
      missingDocumentIds: [],
    });
    this.publish({ ...this.snapshot, ...this.persist(session) });
    if (expiredId) {
      const expiredLease = await this.environment.lease(expiredId);
      if (expiredLease.acquired) {
        try {
          await this.environment.cache().removeWorkspace(expiredId);
        } catch {
          /* Lazy sweep will retry expired data. */
        } finally {
          await expiredLease.release();
        }
      }
    }
    try {
      await this.environment.cache().sweepExpired(this.environment.now());
    } catch {
      /* PDF availability is reconciled per file below. */
    }
    const missing: string[] = [];
    for (const doc of session.workspace.documents) {
      if (doc.provenance !== "visitor_upload") continue; // Immutable samples remain available from their published assets.
      try {
        if (!(await this.environment.cache().get(session.workspace.id, doc))) missing.push(doc.id);
      } catch {
        missing.push(doc.id);
      }
    }
    if (
      generation === this.snapshot.generation &&
      this.snapshot.session?.workspace.id === session.workspace.id
    )
      this.publish({ ...this.snapshot, missingDocumentIds: missing });
  }
  private current(): MoneySession {
    const session = this.snapshot.session;
    if (!this.snapshot.ready || !session) throw new RangeError("Your workspace is still opening.");
    if (session.workspace.expiresAt <= this.environment.now())
      throw new RangeError("This session has expired. Start a fresh session.");
    return session;
  }
  apply(actions: SessionAction[], label: string, expectedRevision?: number) {
    const session = this.current();
    return this.execute(
      {
        id: commandIdSchema.parse(`command_${this.environment.identity()}`),
        workspaceId: session.workspace.id,
        basedOnRevision: expectedRevision ?? session.workspace.revision,
        actions,
      },
      label,
    );
  }
  execute(command: SessionCommand, label: string) {
    const next = applyCommand(cancelInterruptedWork(this.current()), command, label);
    for (const effect of this.effects) effect.abort();
    this.effects.clear();
    this.publish({ ...this.snapshot, session: next, ...this.persist(next) });
    return next;
  }
  undo(commandId: string, revision: number) {
    const next = undoLatest(this.current(), revision, commandId);
    this.publish({ ...this.snapshot, session: next, ...this.persist(next) });
  }
  setFilters(input: SessionFilter) {
    const filters = sessionFilterSchema.parse(input);
    const next = validateSession({ ...this.current(), filters });
    this.publish({ ...this.snapshot, session: next, ...this.persist(next) });
  }
  setMessages(messages: FinalizedMessage[]) {
    const next = validateSession({ ...this.current(), messages });
    this.publish({ ...this.snapshot, session: next, ...this.persist(next) });
  }
  token(operationId: string): OperationToken {
    const session = this.current();
    return {
      workspaceId: session.workspace.id,
      generation: this.snapshot.generation,
      inputRevision: session.workspace.revision,
      operationId,
    };
  }
  isCurrent(token: OperationToken) {
    return (
      this.snapshot.ready &&
      this.snapshot.session?.workspace.id === token.workspaceId &&
      this.snapshot.generation === token.generation &&
      this.snapshot.session.workspace.revision === token.inputRevision &&
      this.snapshot.session.workspace.expiresAt > this.environment.now()
    );
  }
  trackEffect(controller: AbortController) {
    this.effects.add(controller);
    return () => {
      this.effects.delete(controller);
    };
  }
  replaceGraph(token: OperationToken, graph: Workspace) {
    if (!this.isCurrent(token))
      throw new RangeError("This document result is stale. Start a fresh review.");
    const session = this.current();
    if (
      graph.id !== session.workspace.id ||
      graph.createdAt !== session.workspace.createdAt ||
      graph.expiresAt !== session.workspace.expiresAt ||
      graph.revision !== session.workspace.revision + 1
    )
      throw new RangeError(
        "Document review cannot replace the session identity, expiry or revision.",
      );
    const next = validateSession({ ...session, workspace: graph, undo: null });
    this.publish({ ...this.snapshot, session: next, ...this.persist(next) });
  }
  async cachePdf(token: OperationToken, doc: SourceDocument, blob: Blob) {
    if (!this.isCurrent(token)) throw new RangeError("This PDF belongs to an old operation.");
    const expiresAt = this.current().workspace.expiresAt;
    await validatePdfBlob(doc, blob);
    if (!this.isCurrent(token)) throw new RangeError("This PDF operation was cancelled.");
    const cacheKey = `${token.workspaceId}/${doc.id}/${doc.sha256}`;
    const heldBytes = [...this.originals].reduce(
      (sum, [key, value]) => sum + (key === cacheKey ? 0 : value.size),
      0,
    );
    if (heldBytes + blob.size > 20 * 1024 * 1024)
      throw new RangeError("Temporary originals exceed the 20 MiB workspace limit.");
    this.originals.set(cacheKey, blob);
    this.publish({
      ...this.snapshot,
      missingDocumentIds: this.snapshot.missingDocumentIds.filter((id) => id !== doc.id),
    });
    try {
      await this.environment.cache().put(token.workspaceId, doc, blob, expiresAt);
      if (!this.isCurrent(token)) {
        if (this.snapshot.session?.workspace.id !== token.workspaceId)
          await this.environment.cache().removeWorkspace(token.workspaceId);
        throw new RangeError("This PDF operation was cancelled.");
      }
    } catch (error) {
      if (this.isCurrent(token))
        this.publish({
          ...this.snapshot,
          notice:
            "The PDF could not be saved for refresh. Records remain available; re-select the original if needed.",
        });
      throw error;
    }
  }
  async original(doc: SourceDocument): Promise<Blob | null> {
    const token = this.token(`view-${doc.id}`);
    const blob =
      this.originals.get(`${token.workspaceId}/${doc.id}/${doc.sha256}`) ??
      (await this.environment.cache().get(token.workspaceId, doc));
    return this.isCurrent(token) ? blob : null;
  }
  async reset(message = "A fresh empty session is ready.") {
    const old = this.snapshot.session?.workspace.id;
    const ownedLease = this.lease;
    this.lease = null;
    const generation = this.snapshot.generation + 1;
    for (const effect of this.effects) effect.abort();
    this.effects.clear();
    this.originals.clear();
    this.publish({ ...EMPTY_SNAPSHOT, generation, notice: message });
    if (ownedLease?.acquired) {
      try {
        this.environment.storage().removeItem(PROJECTION_KEY);
      } catch {
        /* New projection will be attempted; never claim cleanup succeeded. */
      }
      if (old) {
        try {
          await this.environment.cache().removeWorkspace(old);
        } catch {
          /* Expired cache is swept on a later visit. */
        }
      }
    }
    await ownedLease?.release();
    if (generation !== this.snapshot.generation) return;
    const session = createEmptySession(this.environment.identity(), this.environment.now());
    const lease = await this.environment.lease(session.workspace.id);
    if (generation !== this.snapshot.generation) {
      await lease.release();
      return;
    }
    this.lease = lease;
    this.publish({
      session,
      generation,
      ready: true,
      persistence: "loading",
      notice: message,
      missingDocumentIds: [],
    });
    this.publish({ ...this.snapshot, ...this.persist(session) });
  }
  dispose() {
    for (const effect of this.effects) effect.abort();
    this.effects.clear();
    this.originals.clear();
    this.releasing = Promise.resolve(this.lease?.release());
    this.lease = null;
    this.publish({ ...EMPTY_SNAPSHOT, generation: this.snapshot.generation + 1 });
  }
}
