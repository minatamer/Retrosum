"use client";
import { UserFacingError, userFacingError } from "../../components/ui/user-facing-error";

import { useState } from "react";
import {
  defaultDashboardWidgets,
  retroScopeSchema,
  type RetroResponse,
  type RetroWorkspaceRequest,
  type RetroWorkspaceIntent,
  type SourceReference,
} from "@retrosum/contracts";
import {
  isRetroCurrent,
  isRetroUiCurrent,
  parseAmount,
  prepareRetroFilter,
  retroDocuments,
} from "@retrosum/money";
import { useSession } from "../session/session-provider";
import { OriginalViewer } from "../documents/original-viewer";
import { DocumentReview } from "../documents/document-review";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { navigateWorkspace, openWorkspacePanel } from "../workspace/navigation";
import styles from "./workspace-request.module.css";
import { ReplyText } from "./reply-text";
import { RETRO_HELP_EXAMPLES } from "./shortcuts";

export function WorkspaceRequestPreview({
  decision,
  response,
  proposalId,
  onPrompt,
}: {
  decision: RetroWorkspaceRequest;
  response: RetroResponse;
  proposalId: string;
  onPrompt(prompt: string): void;
}) {
  const { controller, session } = useSession();
  const [notice, setNotice] = useState<string | null>(null);
  const [source, setSource] = useState<SourceReference | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [amount, setAmount] = useState(
    decision.intent.action === "target" ? (decision.intent.amount ?? "") : "",
  );
  if (!session) return null;
  const intent = decision.intent;
  if (
    (intent.action === "target" || intent.action === "restore_layout") &&
    !session.dashboard.appliedProposalIds.includes(proposalId) &&
    !isRetroUiCurrent(response, session.dashboard)
  )
    return (
      <p>
        <ReplyText text="Your dashboard has changed since this preview. Ask again before making another layout change." />
      </p>
    );
  // Legacy messages remain restorable, but no longer expose workspace export controls.
  if (intent.action === "panel" && intent.panel === "export")
    return (
      <p>
        <ReplyText text="Original PDFs can be downloaded from Documents." />
      </p>
    );
  const current = (layout = false) => {
    const snapshot = controller.getSnapshot().session;
    if (!snapshot || !isRetroCurrent(response, snapshot.workspace, snapshot.filters))
      throw new UserFacingError("Your records or filters changed. Ask again for a current action.");
    if (layout && !isRetroUiCurrent(response, snapshot.dashboard))
      throw new UserFacingError("Your dashboard changed. Ask again for a current proposal.");
    return snapshot;
  };
  const perform = (action: () => void) => {
    try {
      action();
    } catch (cause) {
      setNotice(userFacingError(cause, "This action could not be completed."));
    }
  };
  const changeLayout = (restore: boolean) => {
    const snapshot = current(true);
    if (snapshot.dashboard.appliedProposalIds.includes(proposalId))
      throw new UserFacingError("This proposal was already applied.");
    if (!restore && snapshot.dashboard.widgets.length >= 16)
      throw new UserFacingError("Your dashboard has 16 cards. Remove one before adding another.");
    const minor = restore ? null : parseAmount(amount);
    if (minor !== null && minor <= 0)
      throw new UserFacingError("Enter a positive income target in USD.");
    controller.setDashboard({
      ...snapshot.dashboard,
      widgets: restore
        ? defaultDashboardWidgets()
        : [
            ...snapshot.dashboard.widgets,
            {
              id: `widget_${crypto.randomUUID()}`,
              kind: "target",
              metric: "income",
              amountMinor: minor!,
            },
          ],
      appliedProposalIds: [...snapshot.dashboard.appliedProposalIds, proposalId].slice(-40),
    });
    navigateWorkspace("overview");
    setNotice(
      restore
        ? "Default dashboard restored. Undo layout keeps the previous arrangement."
        : "Income target added. Undo layout restores the previous arrangement.",
    );
  };
  const documents =
    intent.action === "source" || intent.action === "review"
      ? retroDocuments(session.workspace, intent.query).filter(
          (doc) =>
            intent.action !== "review" || doc.state === "ready" || doc.state === "needs_review",
        )
      : [];
  const review = session.workspace.documents.find((doc) => doc.id === reviewId);
  return (
    <div className={styles.action}>
      {intent.action === "help" && (
        <>
          <div className={styles.choices}>
            {RETRO_HELP_EXAMPLES.slice(0, 4).map((prompt) => (
              <button type="button" key={prompt} onClick={() => onPrompt(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <details>
            <summary>More things Retro can help with</summary>
            <div className={styles.choices}>
              {RETRO_HELP_EXAMPLES.slice(4).map((prompt) => (
                <button type="button" key={prompt} onClick={() => onPrompt(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </details>
          <p>
            <ReplyText text="Ask in your own words, or choose an option to get started. I’ll explain the next step and let you review any change before it is applied." />
          </p>
        </>
      )}
      {intent.action === "filter" && <FilterRequest intent={intent} response={response} />}
      {(intent.action === "source" || intent.action === "review") && (
        <>
          <p>
            <ReplyText
              text={
                intent.action === "source"
                  ? "Choose an original. The viewer includes its PDF download."
                  : "Choose the document to review. Check the original before confirming any figures or duplicate decision."
              }
            />
          </p>
          {documents.length === 0 && (
            <p>
              <ReplyText text="No matching document is available. Open Documents to inspect the collection." />
            </p>
          )}
          <div className={styles.documents}>
            {documents.map((doc) => (
              <button
                type="button"
                key={doc.id}
                onClick={() =>
                  perform(() => {
                    current();
                    if (intent.action === "review") setReviewId(doc.id);
                    else {
                      const page = intent.page ?? 1;
                      if (page > doc.pageCount)
                        throw new UserFacingError(
                          "That page is outside this document. Ask for an available page.",
                        );
                      setSource({ documentId: doc.id, page });
                    }
                  })
                }
              >
                <span>▤ {doc.name}</span>
                <small>
                  {doc.pageCount} pages ·{" "}
                  {doc.disposition === "active" ? doc.state.replaceAll("_", " ") : doc.disposition}
                </small>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              perform(() => {
                current();
                navigateWorkspace("documents");
              })
            }
          >
            Open Documents ↗
          </button>
        </>
      )}
      {intent.action === "navigate" && (
        <button
          type="button"
          onClick={() =>
            perform(() => {
              current();
              navigateWorkspace(intent.view);
            })
          }
        >
          Open {intent.view === "overview" ? "dashboard" : intent.view} ↗
        </button>
      )}
      {intent.action === "records" && (
        <button
          type="button"
          onClick={() =>
            perform(() => {
              const snapshot = current();
              if (intent.family)
                controller.setFilters({ ...snapshot.filters, register: intent.family });
              navigateWorkspace("records");
            })
          }
        >
          Open {intent.family ?? "records"} ↗
        </button>
      )}
      {intent.action === "panel" && (
        <>
          {intent.panel === "settings" && (
            <p>
              <ReplyText text="Edit your profile and display currency. Choose EUR to load the latest exchange rate automatically." />
            </p>
          )}
          {intent.panel === "reset" && (
            <p>
              <ReplyText text="Review what will be cleared before starting fresh." />
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              perform(() => {
                current();
                openWorkspacePanel(intent.panel, intent.currency);
              })
            }
          >
            {intent.panel === "reset"
              ? "Review Reset"
              : intent.panel === "intake"
                ? "Add / select documents"
                : "Open settings"}{" "}
            ↗
          </button>
        </>
      )}
      {intent.action === "sidebar" && (
        <button
          type="button"
          onClick={() =>
            perform(() => {
              const snapshot = current(true);
              controller.setDashboard(
                { ...snapshot.dashboard, collapsed: intent.collapsed },
                false,
              );
              setNotice(intent.collapsed ? "Sidebar collapsed." : "Sidebar expanded.");
            })
          }
        >
          {intent.collapsed ? "Collapse" : "Expand"} sidebar
        </button>
      )}
      {intent.action === "undo" && (
        <>
          <p>
            <ReplyText text="Record changes and dashboard layout have independent latest Undo." />
          </p>
          {(intent.which === null || intent.which === "financial") && (
            <button
              type="button"
              disabled={!session.undo}
              onClick={() =>
                perform(() => {
                  const snapshot = current();
                  if (!snapshot.undo)
                    throw new UserFacingError("No record change is available to undo.");
                  controller.undo(snapshot.undo.commandId, snapshot.undo.appliedAtRevision);
                })
              }
            >
              Undo record change{session.undo ? ` · ${session.undo.label}` : " · none available"}
            </button>
          )}
          {(intent.which === null || intent.which === "layout") && (
            <button
              type="button"
              disabled={!session.dashboardUndo}
              onClick={() =>
                perform(() => {
                  current(true);
                  controller.undoDashboard();
                  setNotice("Latest layout change undone.");
                })
              }
            >
              Undo layout{session.dashboardUndo ? " ↶" : " · none available"}
            </button>
          )}
        </>
      )}
      {intent.action === "target" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            perform(() => changeLayout(false));
          }}
        >
          <label>
            Income target · USD
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              maxLength={40}
              placeholder="5000.00"
            />
          </label>
          <p>
            <ReplyText text="A manual target for the current dashboard filters; its progress uses exact source-linked income." />
          </p>
          <button
            type="submit"
            disabled={session.dashboard.appliedProposalIds.includes(proposalId)}
          >
            Add income target →
          </button>
        </form>
      )}
      {intent.action === "restore_layout" && (
        <button
          type="button"
          disabled={session.dashboard.appliedProposalIds.includes(proposalId)}
          onClick={() => perform(() => changeLayout(true))}
        >
          Restore default dashboard
        </button>
      )}
      {intent.action === "clear_conversation" && (
        <button
          type="button"
          onClick={() =>
            perform(() => {
              current();
              setClearOpen(true);
            })
          }
        >
          Review clear conversation
        </button>
      )}
      {notice && (
        <p role="status">
          <ReplyText text={notice} />
        </p>
      )}
      {source && <OriginalViewer target={source} onClose={() => setSource(null)} />}
      {review && !source && (
        <DocumentReview
          doc={review}
          revision={response.revision}
          onClose={() => setReviewId(null)}
          onSource={setSource}
        />
      )}
      <PaperDialog
        open={clearOpen}
        title="Clear this conversation?"
        caption="Retro"
        onClose={() => setClearOpen(false)}
      >
        <p>
          This clears the chat in this tab. Your documents, records and dashboard stay available.
        </p>
        <button type="button" onClick={() => setClearOpen(false)}>
          Keep conversation
        </button>
        <button
          type="button"
          onClick={() =>
            perform(() => {
              current();
              controller.setMessages([]);
            })
          }
        >
          Clear conversation
        </button>
      </PaperDialog>
    </div>
  );
}

function FilterRequest({
  intent,
  response,
}: {
  intent: Extract<RetroWorkspaceIntent, { action: "filter" }>;
  response: RetroResponse;
}) {
  const { controller, session } = useSession();
  const [initial] = useState(() => {
    try {
      return { scope: prepareRetroFilter(intent, session!.workspace, response.scope), error: null };
    } catch (cause) {
      return {
        scope: response.scope,
        error: userFacingError(cause, "Choose your scope."),
      };
    }
  });
  const [error, setError] = useState<string | null>(initial.error);
  if (!session) return null;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const snapshot = controller.getSnapshot().session;
          if (!snapshot || !isRetroCurrent(response, snapshot.workspace, snapshot.filters))
            throw new UserFacingError("Your scope changed. Ask again for current filters.");
          const data = new FormData(event.currentTarget);
          const scope = retroScopeSchema.parse({
            from: data.get("from"),
            to: data.get("to"),
            ...(data.get("asOf") ? { asOf: data.get("asOf") } : {}),
            ...(data.get("category") ? { category: data.get("category") } : {}),
            ...(data.get("party") ? { counterpartyId: data.get("party") } : {}),
          });
          if (scope.from > scope.to)
            throw new UserFacingError("End date must be on or after the start date.");
          controller.setFilters({ ...scope, register: snapshot.filters.register });
          navigateWorkspace("overview");
        } catch (cause) {
          setError(userFacingError(cause, "Check the filter fields."));
        }
      }}
    >
      <div className={styles.fields}>
        <label>
          From
          <input name="from" type="date" defaultValue={initial.scope.from} required />
        </label>
        <label>
          To
          <input name="to" type="date" defaultValue={initial.scope.to} required />
        </label>
        <label>
          As of
          <input
            name="asOf"
            type="date"
            defaultValue={initial.scope.asOf ?? session.workspace.asOf}
            required
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue={initial.scope.category ?? ""}>
            <option value="">All categories</option>
            {[...new Set(session.workspace.events.map((event) => event.category))].map(
              (category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Counterparty
          <select name="party" defaultValue={initial.scope.counterpartyId ?? ""}>
            <option value="">All counterparties</option>
            {session.workspace.contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>
        <ReplyText text="Review the dates and scope. Figures recalculate from the supplied records." />
      </p>
      {error && (
        <p role="alert">
          <ReplyText text={error} />
        </p>
      )}
      <button type="submit">Apply filters →</button>
    </form>
  );
}
