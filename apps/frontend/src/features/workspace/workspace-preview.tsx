"use client";
import { useState } from "react";
import { WorkspaceShell } from "../../components/ui/workspace-shell";
import { ComposerShell } from "../../components/ui/composer-shell";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { Button } from "../../components/ui/button";
import { RuntimeStatus } from "../runtime/runtime-status";
import { DocumentGallery } from "../documents/document-gallery";
import { SessionProvider } from "../session/session-provider";
import { RecordsWorkspace } from "../records/records-workspace";

export function WorkspacePreview() {
  return (
    <SessionProvider>
      <WorkspaceContent />
    </SessionProvider>
  );
}
function WorkspaceContent() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [preview, setPreview] = useState<"welcome" | "tour" | "draft">("welcome");
  const descriptions = {
    welcome:
      "Welcome to your temporary workspace. Start with documents, explore their numbers, and ask me to help with your next task.",
    tour: "Documents are your starting point. The overview will show income, costs, profit and cash; you’ll be able to open a figure and inspect its original source.",
    draft:
      "In the completed flow, I’ll prepare an editable form and fill it step by step. You review the details before confirming; your most recent action can be undone.",
  };
  const composer = (
    <ComposerShell
      value=""
      disabled
      footnote="Design preview · Full chat follows."
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
      <span className="rs-eyebrow rs-muted">A fresh perspective starts here</span>
      <h1>
        Your documents.
        <br />
        Your financial story.
      </h1>
      <p>
        Start with the fictional Harbor Studio collection. Inspect each original PDF before turning
        its details into your financial overview.
      </p>
      <RuntimeStatus />
      <RecordsWorkspace />
      <div className="rs-workspace-panels">
        <section className="rs-card">
          <h2>Start with documents.</h2>
          <p>
            Eight real PDFs bring together varied printed, scanned and synthetic handwriting-style
            layouts. The complete collection is viewable below.
          </p>
          <ul>
            <li>Customer invoices & supplier bills</li>
            <li>Rent & subscription receipts</li>
            <li>Payments & a comparison month</li>
          </ul>
          <p>
            Document viewing and manual records are ready. Processing and your own PDF intake
            connect next.
          </p>
        </section>
        <section className="rs-card">
          <h2>Space to try things.</h2>
          <p>
            English-language PDFs. USD amounts. A temporary session that survives refresh and
            expires after two hours once you start it.
          </p>
          <p>
            Create invoices, costs, payments and contacts above. Latest Undo and refresh recovery
            work in this browser tab.
          </p>
          <Button variant="warm" onClick={() => setDetailsOpen(true)}>
            View session details <span aria-hidden="true">↗</span>
          </Button>
        </section>
      </div>
      <DocumentGallery />
      <PaperDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="A temporary place for your finances"
        caption="Session design"
      >
        <p>
          Your records stay in this browser tab. Refresh recovery lasts up to two hours; export your
          work before clearing or leaving the session.
        </p>
        <p>
          Fake development mode simulates AI interactions without provider calls. Live document
          processing will require an explicit choice before sending PDFs to OpenAI.
        </p>
        <p>
          Uploaded originals use temporary browser-only PDF storage. Immutable sample PDFs can be
          opened again from the published collection. Closing cleanup is best effort; expired cached
          files are swept on the next visit.
        </p>
      </PaperDialog>
    </WorkspaceShell>
  );
}
