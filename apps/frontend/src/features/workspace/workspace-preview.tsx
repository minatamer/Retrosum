"use client";
import { useState, useSyncExternalStore } from "react";
import { WorkspaceShell } from "../../components/ui/workspace-shell";
import { ComposerShell } from "../../components/ui/composer-shell";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { RuntimeStatus } from "../runtime/runtime-status";
import { DocumentGallery } from "../documents/document-gallery";
import { SessionProvider, useSession } from "../session/session-provider";
import { RecordsWorkspace } from "../records/records-workspace";
import { DocumentIntake } from "../documents/document-intake";
import { Dashboard } from "../dashboard/dashboard";
import styles from "./workspace.module.css";

type View = "overview" | "documents" | "records";
const subscribe = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
const currentView = (): View =>
  window.location.hash === "#documents"
    ? "documents"
    : window.location.hash === "#records"
      ? "records"
      : "overview";
const serverView = (): View => "overview";
function navigate(view: View) {
  if (window.location.hash !== `#${view}`) {
    window.history.pushState(null, "", `#${view}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}
export function WorkspacePreview() {
  return (
    <SessionProvider>
      <WorkspaceContent />
    </SessionProvider>
  );
}
function WorkspaceContent() {
  const view = useSyncExternalStore(subscribe, currentView, serverView);
  const { session } = useSession();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [preview, setPreview] = useState<"welcome" | "tour" | "draft">("welcome");
  const descriptions = {
    welcome: "Every number has a paper trail. Tap a chart to explore its original sources.",
    tour: "Start in Documents, review the sources, then explore Overview. Records lets you create, edit and undo changes in this session.",
    draft:
      "I’ll prepare an editable form and fill it step by step. You review the details before confirming; your most recent action can be undone.",
  };
  const composer = (
    <ComposerShell
      value=""
      disabled
      footnote="Interaction preview · Full Retro chat follows."
      shortcuts={
        <>
          <button type="button" onClick={() => setPreview("tour")}>
            Show me around
          </button>
          <button type="button" onClick={() => setPreview("draft")}>
            How drafts work
          </button>
        </>
      }
    >
      <div className="rs-chat-retro" key={preview}>
        <span className="rs-eyebrow">Retro · Interaction preview</span>
        {descriptions[preview]}
      </div>
    </ComposerShell>
  );
  return (
    <WorkspaceShell composer={composer}>
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Workspace areas">
          <span className={styles.business}>
            {session?.workspace.business.name ?? "Your workspace"}
          </span>
          {(["overview", "documents", "records"] as const).map((name, index) => (
            <a
              href={`#${name}`}
              key={name}
              aria-current={view === name ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigate(name);
              }}
            >
              <span aria-hidden="true">0{index + 1}</span>
              {name.charAt(0).toUpperCase() + name.slice(1)}
              {name === "documents" && session && (
                <small>{session.workspace.documents.length}</small>
              )}
            </a>
          ))}
          <button type="button" onClick={() => setDetailsOpen(true)}>
            Session details ↗
          </button>
          <p>
            Private browser workspace.
            <br />
            USD · English
          </p>
        </nav>
        <div className={styles.content}>
          <div hidden={view !== "overview"}>
            {view === "overview" && <Dashboard onDocuments={() => navigate("documents")} />}
          </div>
          <div hidden={view !== "documents"}>
            <header className={styles.heading}>
              <span className="rs-eyebrow rs-muted">Your original evidence</span>
              <h1>Start with the paper trail.</h1>
              <p>Eight visible PDFs, varied layouts, one source-backed financial story.</p>
            </header>
            <RuntimeStatus />
            <DocumentIntake active={view === "documents"} />
            {view === "documents" && <DocumentGallery />}
          </div>
          <div hidden={view !== "records"}>{view === "records" && <RecordsWorkspace />}</div>
        </div>
      </div>
      <PaperDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="A temporary place for your finances"
        caption="Browser session"
      >
        <p>
          Your records stay in this browser tab. Refresh recovery lasts up to two hours. Uploaded
          originals use temporary browser-only PDF storage; immutable sample PDFs can be opened from
          the published collection.
        </p>
        <p>
          Fake development mode simulates AI interactions without provider calls. Live processing
          requires explicit disclosure and the pending accuracy/spend gates.
        </p>
        <p>
          Closing cleanup is best effort; expired remnants are swept on your next visit. You can
          clear the session from Records. Exports follow in the delivery queue.
        </p>
      </PaperDialog>
    </WorkspaceShell>
  );
}
