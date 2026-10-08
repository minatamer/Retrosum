import { MAX_PROJECTION_BYTES, sessionSchema, type MoneySession } from "@retrosum/contracts";
import { validateSession } from "@retrosum/money";

export const PROJECTION_KEY = "retrosum.session.v1";
export function encodeProjection(session: MoneySession): string {
  const encoded = JSON.stringify(validateSession(session));
  if (new TextEncoder().encode(encoded).byteLength > MAX_PROJECTION_BYTES)
    throw new RangeError("This workspace is too large for refresh recovery.");
  return encoded;
}
export function decodeProjection(raw: string, now: number): MoneySession {
  if (
    raw.length > MAX_PROJECTION_BYTES ||
    new TextEncoder().encode(raw).byteLength > MAX_PROJECTION_BYTES
  )
    throw new RangeError("Stored workspace exceeds its limit.");
  const session = validateSession(sessionSchema.parse(JSON.parse(raw)));
  if (session.workspace.createdAt > now || session.workspace.expiresAt <= now)
    throw new RangeError("This temporary workspace has expired.");
  // Interrupted recognition never resumes or becomes ready automatically.
  const cancelInterrupted = (workspace: MoneySession["workspace"]) => ({
    ...workspace,
    documents: workspace.documents.map((doc) =>
      ["inspecting", "queued", "reading", "validating"].includes(doc.state)
        ? { ...doc, state: "cancelled" as const }
        : doc,
    ),
  });
  return {
    ...session,
    workspace: cancelInterrupted(session.workspace),
    undo: session.undo ? { ...session.undo, before: cancelInterrupted(session.undo.before) } : null,
  };
}
export function writeProjection(storage: Pick<Storage, "setItem">, session: MoneySession) {
  // Browser setItem is atomic on quota/security failure; don't remove the old value first.
  storage.setItem(PROJECTION_KEY, encodeProjection(session));
}
