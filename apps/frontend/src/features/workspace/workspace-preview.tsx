"use client";
import { useState, useSyncExternalStore } from "react";
import { WorkspaceShell } from "../../components/ui/workspace-shell";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { RuntimeStatus } from "../runtime/runtime-status";
import { DocumentGallery } from "../documents/document-gallery";
import { SessionProvider, useSession } from "../session/session-provider";
import { RecordsWorkspace } from "../records/records-workspace";
import { DocumentIntake } from "../documents/document-intake";
import { Dashboard } from "../dashboard/dashboard";
import { Retro } from "../retro/retro";
import { ExportPanel } from "../exports/export-panel";
import { navigateWorkspace, type WorkspaceView } from "./navigation";
import styles from "./workspace.module.css";

type View = WorkspaceView;
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
  navigateWorkspace(view, true);
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
  const { session, generation } = useSession();
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <WorkspaceShell
      composer={<Retro key={`${generation}/${session?.workspace.id ?? "opening"}`} />}
    >
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
          <ExportPanel key={`${generation}/${session?.workspace.id ?? "opening"}`} />
          <p>
            Private browser workspace.
            <br />
            USD · English
          </p>
        </nav>
        <div className={styles.content}>
          <div id="retro-change-stage" />
          <div hidden={view !== "overview"}>
            {view === "overview" && <Dashboard onDocuments={() => navigate("documents")} />}
          </div>
          <div hidden={view !== "documents"} id="retro-documents">
            <header className={styles.heading}>
              <span className="rs-eyebrow rs-muted">Your original evidence</span>
              <h1>Start with the paper trail.</h1>
              <p>Eight visible PDFs, varied layouts, one source-backed financial story.</p>
            </header>
            <RuntimeStatus />
            <DocumentIntake active={view === "documents"} />
            {view === "documents" && <DocumentGallery />}
          </div>
          <div hidden={view !== "records"} id="retro-records">
            {view === "records" && <RecordsWorkspace />}
          </div>
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
          clear the session from Records or review an export first. Refresh keeps the original fixed
          deadline; it never renews the two-hour session. Reset cannot remove prior downloads or
          recall provider-controlled copies.
        </p>
      </PaperDialog>
    </WorkspaceShell>
  );
}
