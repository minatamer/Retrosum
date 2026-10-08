"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  capabilitiesSchema,
  retroResponseSchema,
  retroRequestSchema,
  retroScopeSchema,
  type FinalizedMessage,
  type RetroResponse,
  type RetroTopic,
  type RuntimeCapabilities,
  type SourceReference,
  type SessionFilter,
  type RetroChangeIntent,
  type RetroChangeResult,
} from "@retrosum/contracts";
import {
  buildDashboard,
  createRetroResponse,
  explainTopic,
  fakeRetroDecision,
  formatRetroFact,
  isRetroCurrent,
  renderRetroResponse,
  retroScopeKey,
  patchChangeIntent,
  verifyRetroChange,
} from "@retrosum/money";
import { ComposerShell } from "../../components/ui/composer-shell";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { useSession } from "../session/session-provider";
import { FactDetail } from "../dashboard/fact-detail";
import { OriginalViewer } from "../documents/original-viewer";
import { GuidanceOutline, TourStep, useGuidance } from "./guidance";
import styles from "./retro.module.css";
import { ChangePreview } from "./change-preview";
import { navigateWorkspace } from "../workspace/navigation";
import { usePaidProcessing } from "../processing/processing-provider";
import { hashRequest } from "../processing/processing-client";
import { readJson } from "../documents/recognition-client";

type Pending = {
  prompt: string;
  stage: "submitting" | "staging" | "validated" | "stale" | "failed" | "cancelled";
  text: string;
};
const TOPIC_LABELS: Partial<Record<RetroTopic, string>> = {
  summary: "Summarize this period",
  profit: "Explain profit",
  cash: "Explain cash",
  rent: "Explain rent",
  coverage: "Explain coverage",
  comparison: "Compare periods",
};
export function Retro() {
  const { controller, session, generation, ready } = useSession();
  const authorize = usePaidProcessing();
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(null);
  const [runtimeRefresh, setRuntimeRefresh] = useState(0);
  const [dismissedSuggestion, setDismissedSuggestion] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [pending, setPending] = useState<Pending | null>(null);
  const [detail, setDetail] = useState<{ id: string; revision: number } | null>(null);
  const [source, setSource] = useState<SourceReference | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeChange, setActiveChange] = useState<{
    response: RetroResponse;
    contextKey: string;
    target: HTMLElement;
  } | null>(null);
  const cancelChange = useCallback(() => {
    setActiveChange(null);
    setExpanded(true);
    setNotice("Proposal cancelled. No records were changed.");
  }, []);
  const request = useRef<AbortController | null>(null);
  const messagesBox = useRef<HTMLDivElement | null>(null);
  const catalogue = useMemo(
    () => (session ? buildDashboard(session.workspace, session.filters) : null),
    [session],
  );
  const actualScope = session ? scopeFor(session.filters) : null;
  const contextKey = `${generation}/${session?.workspace.id}/${session?.workspace.revision}/${actualScope ? retroScopeKey(actualScope) : ""}`;
  const guidance = useGuidance(contextKey);
  const touring = guidance.active?.step !== undefined && guidance.active.step !== null;
  const busy =
    pending?.stage === "submitting" ||
    pending?.stage === "staging" ||
    pending?.stage === "validated";
  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/retrosum/v1/config", { cache: "no-store", signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unavailable");
        const result = capabilitiesSchema.parse(await readJson(response, 8192, abort.signal));
        if (!abort.signal.aborted) setCapabilities(result);
      })
      .catch(() => {
        if (!abort.signal.aborted) setCapabilities(null);
      });
    return () => {
      abort.abort();
      request.current?.abort();
    };
  }, [runtimeRefresh]);
  useEffect(() => {
    const node = messagesBox.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [session?.messages.length, pending?.stage, expanded]);
  if (!session || !catalogue || !actualScope || !ready)
    return <div className={styles.loading}>Retro is opening your browser workspace…</div>;
  const workspace = session.workspace;
  const finish = (prompt: string, response: RetroResponse) => {
    const rendered = renderRetroResponse(response, catalogue);
    const current = controller.getSnapshot().session;
    if (!current) return;
    const pair: FinalizedMessage[] = [
      {
        id: `user_${crypto.randomUUID()}`,
        role: "user",
        text: prompt,
        revision: workspace.revision,
      },
      {
        id: `retro_${crypto.randomUUID()}`,
        role: "retro",
        text: rendered.intro,
        revision: workspace.revision,
        response,
      },
    ];
    controller.setMessages([...current.messages, ...pair].slice(-40));
    setPending(null);
    setExpanded(true);
    if (response.decision.kind === "tour") guidance.show("overview", 0);
    if (response.change?.kind === "ready") {
      verifyRetroChange(response, workspace);
      const target = document.getElementById("retro-change-stage");
      if (target) setActiveChange({ response, contextKey, target });
      setExpanded(false);
      navigateWorkspace("records");
      window.requestAnimationFrame(() =>
        document
          .getElementById("retro-proposal")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  };
  const local = (topic: RetroTopic) => {
    if (busy) return;
    guidance.stop();
    setActiveChange(null);
    setNotice(null);
    finish(
      TOPIC_LABELS[topic] ?? `Explain ${topic}`,
      createRetroResponse(
        {
          operationId: "retro_local",
          workspace,
          scope: actualScope,
          prompt: "Local explanation",
          recent: [],
        },
        explainTopic(topic, catalogue),
        "local",
      ),
    );
  };
  const send = async (prompt: string) => {
    if (busy || !prompt.trim() || prompt.length > 1000) return;
    guidance.stop();
    setActiveChange(null);
    setInput("");
    setExpanded(true);
    setNotice(null);
    if (!capabilities?.copilot.available) {
      setPending({
        prompt,
        stage: "failed",
        text: "Live conversation is unavailable. Use the local explanation and tour shortcuts; your records remain usable.",
      });
      return;
    }
    const effect = new AbortController();
    request.current = effect;
    const deadline = window.setTimeout(() => effect.abort(), 60000);
    const untrack = controller.trackEffect(effect);
    const token = controller.token(`retro_${crypto.randomUUID()}`);
    const capturedScope = retroScopeKey(actualScope);
    const previousResponse = session.messages.at(-1)?.response;
    const changeContext =
      previousResponse?.change?.kind === "clarification" &&
      isRetroCurrent(previousResponse, workspace, actualScope)
        ? previousResponse.change.intent
        : undefined;
    const payload = {
      operationId: token.operationId,
      workspace,
      scope: actualScope,
      prompt: prompt.trim(),
      ...(changeContext ? { changeContext } : {}),
      recent: session.messages
        .slice(-8)
        .map(({ role, text }) => ({ role, text }))
        .filter(
          (message, index, all) =>
            all.slice(index).reduce((sum, row) => sum + row.text.length, 0) <= 8000,
        ),
    };
    setPending({
      prompt,
      stage: "submitting",
      text:
        capabilities.mode === "fake"
          ? "Understanding your request · Development simulation"
          : "Investigating your current supplied records…",
    });
    try {
      await pause(300, effect.signal);
      setPending({
        prompt,
        stage: "staging",
        text: "Inspecting the current facts and their evidence…",
      });
      let result: RetroResponse;
      if (capabilities.mode === "fake") {
        await pause(/simulate stale/u.test(prompt.toLowerCase()) ? 3500 : 650, effect.signal);
        result = createRetroResponse(
          payload,
          fakeRetroDecision(prompt, catalogue, workspace, payload.changeContext),
          "fake",
          [{ tool: "get_summary", count: 7 }],
        );
      } else {
        const normalized = retroRequestSchema.parse(payload);
        const grant = await authorize(
          {
            action: "chat",
            workspaceId: normalized.workspace.id,
            operationId: normalized.operationId,
            inputHash: await hashRequest(normalized),
            retry: false,
          },
          capabilities,
          effect.signal,
        );
        if (!controller.isCurrent(token))
          throw new Error("The workspace changed before submission.");
        const response = await fetch("/api/retrosum/v1/chat", {
          method: "POST",
          cache: "no-store",
          signal: effect.signal,
          headers: { "Content-Type": "application/json", "X-Retrosum-Grant": grant },
          body: JSON.stringify(normalized),
        });
        if (!response.ok)
          throw new Error(
            response.status === 429
              ? "Your live turn allowance is used. Local guidance is still available."
              : "The live turn could not be completed. No automatic retry ran.",
          );
        result = retroResponseSchema.parse(await readJson(response, 128 * 1024, effect.signal));
      }
      const latest = controller.getSnapshot().session;
      if (
        !controller.isCurrent(token) ||
        !latest ||
        capturedScope !== retroScopeKey(scopeFor(latest.filters))
      ) {
        setPending({
          prompt,
          stage: "stale",
          text: "The records or scope changed during this turn. This result was discarded. Ask again or use a current local explanation.",
        });
        return;
      }
      if (!isRetroCurrent(result, latest.workspace, actualScope))
        throw new Error("The returned answer does not match the current snapshot.");
      renderRetroResponse(result, catalogue); // Ground again before any final figures appear.
      verifyRetroChange(result, workspace);
      setPending({
        prompt,
        stage: "validated",
        text: "Evidence validated. Preparing your answer…",
      });
      await pause(120, effect.signal);
      const finalSnapshot = controller.getSnapshot().session;
      if (
        !controller.isCurrent(token) ||
        !finalSnapshot ||
        capturedScope !== retroScopeKey(scopeFor(finalSnapshot.filters))
      ) {
        setPending({
          prompt,
          stage: "stale",
          text: "The records or scope changed before this answer completed. Ask again for current figures.",
        });
        return;
      }
      finish(prompt, result);
    } catch (cause) {
      if (controller.getSnapshot().generation !== generation) return;
      setPending({
        prompt,
        stage: effect.signal.aborted ? "cancelled" : "failed",
        text: effect.signal.aborted
          ? "This turn was cancelled or the records changed. Nothing was applied. You can ask again."
          : cause instanceof Error && cause.name !== "ZodError"
            ? cause.message
            : "This turn could not be verified. Nothing was applied. Local guidance remains available.",
      });
    } finally {
      window.clearTimeout(deadline);
      untrack();
      if (request.current === effect) request.current = null;
    }
  };
  const lastMessage = [...session.messages].reverse().find((message) => message.role === "retro");
  const last = lastMessage?.response;
  const staleLast = last ? !isRetroCurrent(last, workspace, actualScope) : false;
  const localChange = (intent: RetroChangeIntent, prompt: string) => {
    if (busy) return;
    guidance.stop();
    setActiveChange(null);
    finish(
      prompt,
      createRetroResponse(
        {
          operationId: `retro_${crypto.randomUUID()}`,
          workspace,
          scope: actualScope,
          prompt,
          recent: [],
        },
        { kind: "change_request", intent },
        "local",
      ),
    );
  };
  const appliedChange = (result: RetroChangeResult) => {
    setActiveChange(null);
    setNotice(null);
    setExpanded(true);
    const current = controller.getSnapshot().session;
    if (current)
      controller.setMessages(
        [
          ...current.messages,
          {
            id: `retro_${crypto.randomUUID()}`,
            role: "retro" as const,
            text: `${result.label} completed in this browser session.`,
            revision: current.workspace.revision,
            changeResult: result,
          },
        ].slice(-40),
      );
  };
  const openResult = (result: RetroChangeResult) => {
    setExpanded(false);
    controller.setFilters({
      ...controller.getSnapshot().session!.filters,
      register: result.family,
    });
    navigateWorkspace("records");
    window.requestAnimationFrame(() =>
      document
        .getElementById(`record-${result.recordId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };
  const openFact = (id: string) => {
    guidance.stop();
    setDetail({ id, revision: workspace.revision });
  };
  const clear = () => {
    if (!busy) {
      controller.setMessages([]);
      setActiveChange(null);
      setPending(null);
      guidance.stop();
    }
  };
  const tour = () => {
    setActiveChange(null);
    setExpanded(true);
    guidance.show("overview", 0);
  };
  const undo = () => {
    guidance.stop();
    try {
      const receipt = controller.getSnapshot().session?.undo;
      if (receipt) {
        controller.undo(receipt.commandId, receipt.appliedAtRevision);
        setNotice(`Undid ${receipt.label}. Current figures have been recalculated.`);
      }
    } catch {
      setNotice("That action can no longer be undone. Inspect the current records.");
    }
  };
  return (
    <div id="retro-composer" className={styles.retro}>
      {activeChange?.contextKey === contextKey &&
        activeChange.response.change?.kind === "ready" &&
        createPortal(
          <ChangePreview
            key={activeChange.response.change.command.id}
            proposal={activeChange.response.change}
            response={activeChange.response}
            onCancel={cancelChange}
            onApplied={appliedChange}
          />,
          activeChange.target,
        )}
      <GuidanceOutline active={guidance.active} onStop={guidance.stop} />
      <div className={styles.topline}>
        <span>
          <i aria-hidden="true" /> Retro{" "}
          <small>
            {capabilities?.mode === "fake"
              ? "Development simulation"
              : capabilities?.mode === "live"
                ? "Live AI"
                : "Local guidance"}
          </small>
        </span>
        <div>
          {!capabilities?.copilot.available && (
            <button
              type="button"
              aria-label="Reconnect Retro"
              onClick={() => setRuntimeRefresh((value) => value + 1)}
            >
              Reconnect
            </button>
          )}
          {busy && (
            <button type="button" onClick={() => request.current?.abort()}>
              Cancel turn
            </button>
          )}
          {session.undo && (
            <button type="button" onClick={undo}>
              Undo
            </button>
          )}
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse conversation" : "Expand conversation"}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Hide chat" : "Show chat"}
          </button>
        </div>
      </div>
      {guidance.active?.step !== null && guidance.active && (
        <TourStep active={guidance.active} show={guidance.show} stop={guidance.stop} />
      )}
      {expanded && !touring && (
        <div
          ref={messagesBox}
          className={styles.messages}
          role="region"
          aria-label="Retro conversation"
          tabIndex={0}
        >
          {session.messages.length === 0 && !pending && (
            <div className={styles.welcome}>
              <span className={styles.meta}>A little help, always close.</span>
              <p>
                I’m Retro. Ask about your supplied figures, follow their paper trail, or let me show
                you around.
              </p>
            </div>
          )}
          {session.messages.map((message) => {
            if (message.role === "user")
              return (
                <div key={message.id} className={styles.user}>
                  {message.text}
                </div>
              );
            const response = message.response;
            const stale = response
              ? !isRetroCurrent(response, workspace, actualScope)
              : message.revision !== workspace.revision;
            let content: ReturnType<typeof renderRetroResponse> | null = null;
            if (response && !stale) {
              try {
                content = renderRetroResponse(response, catalogue);
              } catch {
                /* Stored ungrounded data never renders current financial claims. */
              }
            }
            return (
              <article key={message.id} className={styles.answer}>
                <span className={styles.meta}>
                  Retro ·{" "}
                  {response?.mode === "fake"
                    ? "Simulated"
                    : response?.mode === "live"
                      ? "Live"
                      : "Local"}{" "}
                  · Revision {message.revision}
                </span>
                {stale ? (
                  <p className={styles.stale}>
                    This answer belongs to an earlier record revision or filter scope. Refresh it
                    explicitly for the current figures.
                  </p>
                ) : (
                  <>
                    <p>
                      {content?.intro ??
                        (response
                          ? "This stored answer could not be verified. Use a current local explanation."
                          : message.text)}
                    </p>
                    {message.changeResult && (
                      <div className={styles.sources}>
                        <button type="button" onClick={() => openResult(message.changeResult!)}>
                          View {message.changeResult.family}
                        </button>
                        <button
                          type="button"
                          disabled={
                            session.undo?.commandId !== message.changeResult.commandId ||
                            session.undo?.appliedAtRevision !== workspace.revision
                          }
                          onClick={undo}
                        >
                          Undo
                        </button>
                      </div>
                    )}
                    {response?.change?.kind === "clarification" && !stale && (
                      <ul className={styles.missing}>
                        {response.change.missing.map((text) => (
                          <li key={text}>{text}</li>
                        ))}
                      </ul>
                    )}
                    {response?.change?.kind === "ready" &&
                      !stale &&
                      (activeChange?.response.change?.kind !== "ready" ||
                        activeChange.response.change.command.id !== response.change.command.id) && (
                        <p className={styles.caption}>
                          This saved preview is read-only. Prepare a fresh request to edit and
                          confirm.
                        </p>
                      )}
                    {content && content.facts.length > 0 && (
                      <div className={styles.facts}>
                        {content.facts.map((fact) => (
                          <button key={fact.id} type="button" onClick={() => openFact(fact.id)}>
                            <span>{fact.label}</span>
                            <strong>{formatRetroFact(fact)}</strong>
                            <small>
                              {fact.scope.from} — {fact.scope.to} · USD
                              {fact.dateBasis === "as_of" ? ` · as of ${fact.scope.asOf}` : ""}
                            </small>
                            <small>{fact.value === null ? fact.unavailable : fact.basis}</small>
                          </button>
                        ))}
                      </div>
                    )}
                    {content?.closing && <p className={styles.caption}>{content.closing}</p>}
                    {response && content && response.sources.length > 0 && (
                      <div className={styles.sources}>
                        {response.sources.slice(0, 5).map((item) => (
                          <button
                            key={JSON.stringify(item)}
                            type="button"
                            onClick={() => {
                              guidance.stop();
                              setSource(item);
                            }}
                          >
                            Original ·{" "}
                            {workspace.documents.find((doc) => doc.id === item.documentId)?.name ??
                              "Source"}{" "}
                            · p{item.page}
                          </button>
                        ))}
                        {response.sources.length > 5 && (
                          <span className={styles.caption}>
                            Open a figure to inspect all its sources.
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
          {pending && (
            <>
              <div className={styles.user}>{pending.prompt}</div>
              <p className={`${styles.stage} ${busy ? styles.working : ""}`} role="status">
                {pending.text}
              </p>
            </>
          )}
          {notice && (
            <p role="status" className={styles.stage}>
              {notice}
            </p>
          )}
          {session.messages.length > 0 && (
            <button type="button" className={styles.clear} onClick={clear} disabled={busy}>
              Clear conversation
            </button>
          )}
        </div>
      )}
      <ComposerShell
        value={input}
        onChange={setInput}
        onSubmit={() => {
          void send(input);
        }}
        disabled={busy}
        footnote={
          capabilities?.mode === "fake"
            ? "Simulated language · exact local facts · no AI API requests"
            : "Local shortcuts use no requests · live clarification uses another turn"
        }
        shortcuts={
          touring ? undefined : (
            <>
              <button type="button" disabled={busy} onClick={() => local("summary")}>
                Summarize this period
              </button>
              <button type="button" disabled={busy} onClick={() => local("profit")}>
                Explain this dashboard
              </button>
              <button type="button" disabled={busy} onClick={tour}>
                Show me around
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  localChange(
                    { family: "invoices", operation: "create", query: null, fields: [] },
                    "Create an invoice",
                  )
                }
              >
                Create invoice
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  localChange(
                    { family: "costs", operation: "create", query: null, fields: [] },
                    "Add a cost",
                  )
                }
              >
                Add cost
              </button>
              {last?.change?.kind === "clarification" &&
                !staleLast &&
                last.change.choices.map((choice) => (
                  <button
                    type="button"
                    key={JSON.stringify(choice)}
                    disabled={busy}
                    onClick={() =>
                      last.change?.kind === "clarification" &&
                      localChange(patchChangeIntent(last.change.intent, choice), choice.label)
                    }
                  >
                    {choice.label}
                  </button>
                ))}
              {last?.decision.kind === "clarification" &&
                !staleLast &&
                last.decision.choices.map((topic) => (
                  <button key={topic} type="button" disabled={busy} onClick={() => local(topic)}>
                    {TOPIC_LABELS[topic] ?? `Explain ${topic}`}
                  </button>
                ))}
              {last?.decision.kind === "explanation" && !staleLast && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      last.decision.kind === "explanation" &&
                      last.decision.factIds[0] &&
                      openFact(last.decision.factIds[0])
                    }
                  >
                    Show sources
                  </button>
                  {last.decision.target && dismissedSuggestion !== lastMessage?.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (last.decision.kind === "explanation" && last.decision.target) {
                            setExpanded(false);
                            guidance.show(last.decision.target);
                          }
                        }}
                      >
                        Yes, show on dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissedSuggestion(lastMessage?.id ?? null)}
                      >
                        No, thanks
                      </button>
                    </>
                  )}
                </>
              )}
              {staleLast && (
                <button type="button" disabled={busy} onClick={() => local("summary")}>
                  Refresh locally
                </button>
              )}
            </>
          )
        }
      />
      {detail &&
        !source &&
        (catalogue.facts[detail.id] ? (
          <FactDetail
            fact={catalogue.facts[detail.id]!}
            originalRevision={detail.revision}
            onClose={() => setDetail(null)}
            onSource={(item) => setSource(item)}
            sourceName={(id) => workspace.documents.find((doc) => doc.id === id)?.name ?? "Source"}
            facts={catalogue.facts}
            onSelect={openFact}
            reconciliation={
              detail.id === "profit" || detail.id === "margin" ? catalogue.profitBridge : undefined
            }
          />
        ) : (
          <PaperDialog
            open
            title="This fact is no longer in the current scope"
            onClose={() => setDetail(null)}
          >
            <p>Close this detail and select a current figure.</p>
          </PaperDialog>
        ))}
      {source && <OriginalViewer target={source} onClose={() => setSource(null)} />}
    </div>
  );
}
function scopeFor(filters: SessionFilter) {
  const scope = {
    from: filters.from,
    to: filters.to,
    asOf: filters.asOf,
    category: filters.category,
    counterpartyId: filters.counterpartyId,
  };
  return retroScopeSchema.parse(scope);
}
function pause(milliseconds: number, signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new Error("Cancelled"));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}
