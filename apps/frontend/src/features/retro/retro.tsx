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
  isRetroUiCurrent,
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
import { GuidanceOutline, useGuidance } from "./guidance";
import styles from "./retro.module.css";
import { ChangePreview } from "./change-preview";
import { DashboardRequestPreview } from "./dashboard-request";
import { WorkspaceRequestPreview } from "./workspace-request";
import { ReplyText } from "./reply-text";
import { retroShortcuts, resolveRetroReply, TOPIC_LABELS, type RetroShortcut } from "./shortcuts";
import { navigateWorkspace } from "../workspace/navigation";
import {
  cancelSmoothScroll,
  scrollToElement,
  scrollToSection,
} from "../../components/ui/smooth-scroll";
import { InlineProcessingReview, usePaidProcessing } from "../processing/processing-provider";
import { hashRequest } from "../processing/processing-client";
import { readJson } from "../documents/recognition-client";

type Pending = {
  prompt: string;
  stage: "submitting" | "staging" | "validated" | "stale" | "failed" | "cancelled";
  text: string;
};
export function Retro() {
  const { controller, session, generation, ready } = useSession();
  const authorize = usePaidProcessing();
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(null);
  const [runtimeRefresh, setRuntimeRefresh] = useState(0);
  const [dismissedSuggestion, setDismissedSuggestion] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [roomy, setRoomy] = useState(false);
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
  const tourSeen = session?.experience.dashboardTourSeen;
  const tourView = session?.experience.view;
  const showGuidance = guidance.show;
  const startTour = () => {
    const current = controller.getSnapshot().session;
    if (!current) return;
    if (!current.experience.dashboardTourSeen)
      controller.setExperience({ ...current.experience, dashboardTourSeen: true });
    setActiveChange(null);
    setExpanded(false);
    guidance.show("overview", 0);
  };
  useEffect(() => {
    if (!ready || tourSeen !== false || tourView !== "overview") return;
    const timer = window.setTimeout(() => {
      if (controller.claimDashboardTour()) {
        setExpanded(false);
        showGuidance("overview", 0);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [controller, ready, tourSeen, tourView, showGuidance]);
  useEffect(() => () => cancelSmoothScroll(), [contextKey]);
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
    if (!node) return;
    const answer = node.querySelector<HTMLElement>("article:last-of-type");
    const top =
      !pending && answer
        ? node.scrollTop +
          answer.getBoundingClientRect().top -
          node.getBoundingClientRect().top -
          12
        : node.scrollHeight;
    node.scrollTo({ top, behavior: "smooth" });
  }, [session?.messages.length, pending, expanded]);
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
    if (response.decision.kind === "tour") startTour();
    if (response.change?.kind === "ready") {
      verifyRetroChange(response, workspace);
      const target = document.getElementById("retro-change-stage");
      if (target) setActiveChange({ response, contextKey, target });
      setExpanded(false);
      navigateWorkspace("records");
      window.requestAnimationFrame(() => scrollToSection("retro-proposal"));
    }
  };
  const local = (topic: RetroTopic, prompt = TOPIC_LABELS[topic] ?? `Explain ${topic}`) => {
    if (busy) return;
    guidance.stop();
    setActiveChange(null);
    setNotice(null);
    finish(
      prompt,
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
    const replyChoice = resolveRetroReply(prompt, shortcuts);
    if (replyChoice) {
      runShortcut(replyChoice, prompt);
      setInput("");
      return;
    }
    guidance.stop();
    setActiveChange(null);
    setInput("");
    setExpanded(true);
    setNotice(null);
    if (!capabilities?.copilot.available) {
      setPending({
        prompt,
        stage: "failed",
        text: "Retro could not connect. Try reconnecting, or use the explanation and tour shortcuts below.",
      });
      return;
    }
    const effect = new AbortController();
    request.current = effect;
    let deadline: number | undefined;
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
      uiContext: { dashboard: session.dashboard },
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
      text: "Understanding your request…",
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
        deadline = window.setTimeout(() => effect.abort(), 60000);
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
        deadline = window.setTimeout(() => effect.abort(), 60000);
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
  const shortcuts = retroShortcuts({
    empty: session.messages.length === 0,
    response: last,
    current:
      !staleLast &&
      (!last ||
        last.decision.kind !== "dashboard_request" ||
        isRetroUiCurrent(last, session.dashboard)),
    dismissed: dismissedSuggestion === lastMessage?.id,
    applied: !!lastMessage && session.dashboard.appliedProposalIds.includes(lastMessage.id),
    busy,
    failed: !!pending && !busy,
  });
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
    window.requestAnimationFrame(() => {
      const record = document.getElementById(`record-${result.recordId}`);
      if (record) scrollToElement(record, { block: "center" });
    });
  };
  const openFact = (id: string) => {
    guidance.stop();
    setDetail({ id, revision: workspace.revision });
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
  const runShortcut = (choice: RetroShortcut, prompt = choice.label) => {
    if (busy) return;
    if (choice.kind === "topic") return local(choice.topic, prompt);
    if (choice.kind === "prompt") return void send(choice.prompt);
    if (choice.kind === "change_choice") {
      if (last?.change?.kind === "clarification" && !staleLast)
        localChange(patchChangeIntent(last.change.intent, choice.choice), prompt);
      return;
    }
    if (choice.kind === "highlight" || choice.kind === "decline") {
      if (!last || staleLast) return;
      const current = controller.getSnapshot().session;
      if (!current) return;
      controller.setMessages(
        [
          ...current.messages,
          {
            id: `user_${crypto.randomUUID()}`,
            role: "user" as const,
            text: prompt,
            revision: workspace.revision,
          },
        ].slice(-40),
      );
      setDismissedSuggestion(lastMessage?.id ?? null);
      if (choice.kind === "decline") setNotice("Okay. We can keep exploring here.");
      else {
        setNotice(null);
        setExpanded(false);
        guidance.show(choice.target);
      }
      return;
    }
    guidance.stop();
    setActiveChange(null);
    setNotice(null);
    const decision =
      choice.kind === "help"
        ? { kind: "workspace_request" as const, intent: { action: "help" as const } }
        : choice.kind === "tour"
          ? { kind: "tour" as const, tourId: "workspace_intro" as const }
          : last?.decision.kind === "dashboard_request"
            ? { ...last.decision, style: choice.style }
            : null;
    if (!decision) return;
    finish(
      prompt,
      createRetroResponse(
        {
          operationId: `retro_${crypto.randomUUID()}`,
          workspace,
          scope: actualScope,
          prompt,
          recent: [],
          uiContext: { dashboard: session.dashboard },
        },
        decision,
        "local",
      ),
    );
  };
  return (
    <div id="retro-composer" className={styles.retro} data-expanded={expanded} data-roomy={roomy}>
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
      <GuidanceOutline active={guidance.active} onStop={guidance.stop} show={guidance.show} />
      <button
        type="button"
        className={styles.conversationToggle}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse conversation" : "Expand conversation"}
        onClick={() => {
          if (expanded || touring) guidance.stop();
          setExpanded((value) => !value);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="m5 11 4-4 4 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {expanded && !touring && (
        <div className={styles.topline}>
          <span className={styles.meta}>Retro</span>
          <div className={styles.headerActions}>
            {!capabilities?.copilot.available && (
              <button
                type="button"
                aria-label="Reconnect Retro"
                onClick={() => setRuntimeRefresh((value) => value + 1)}
              >
                Reconnect
              </button>
            )}
            {session.undo && (
              <button type="button" onClick={undo}>
                Undo
              </button>
            )}
            <button
              type="button"
              className={styles.resizeChat}
              aria-label={roomy ? "Restore chat size" : "Enlarge chat"}
              aria-pressed={roomy}
              onClick={() => setRoomy((value) => !value)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d={
                    roomy
                      ? "M4 10h6V4M20 14h-6v6M10 10 4 4m10 10 6 6"
                      : "M9 4H4v5M15 20h5v-5M4 4l6 6m10 10-6-6"
                  }
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      {expanded && !touring && (
        <div
          ref={messagesBox}
          className={`${styles.messages} rs-scrollbar`}
          role="region"
          aria-label="Retro conversation"
          tabIndex={0}
        >
          {session.messages.length === 0 && !pending && (
            <div className={styles.welcome}>
              <span className={styles.meta}>A little help, always close.</span>
              <p>
                <ReplyText text="I’m Retro. Ask about your supplied figures, follow their paper trail, or let me show you around." />
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
                {stale ? (
                  <p className={styles.stale}>
                    <ReplyText text="Your records or filters have changed since this answer. Refresh it to see the current figures." />
                  </p>
                ) : (
                  <>
                    <p>
                      <ReplyText
                        text={
                          content?.intro ??
                          (response
                            ? "This answer could not be verified. Ask again for the current figures."
                            : message.text)
                        }
                      />
                    </p>
                    {response?.decision.kind === "dashboard_request" && content && (
                      <DashboardRequestPreview
                        decision={response.decision}
                        response={response}
                        proposalId={message.id}
                      />
                    )}
                    {response?.decision.kind === "workspace_request" && content && (
                      <WorkspaceRequestPreview
                        decision={response.decision}
                        response={response}
                        proposalId={message.id}
                        onPrompt={(prompt) => {
                          void send(prompt);
                        }}
                      />
                    )}
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
                      <>
                        <ul className={styles.missing}>
                          {response.change.missing.map((text) => (
                            <li key={text}>
                              <ReplyText text={text} />
                            </li>
                          ))}
                        </ul>
                        {response.change.choices.length > 4 && (
                          <details className={styles.sourceDisclosure}>
                            <summary>More choices</summary>
                            <div className={styles.sources}>
                              {response.change.choices.slice(4).map((choice) => (
                                <button
                                  type="button"
                                  key={JSON.stringify(choice)}
                                  disabled={busy || message.id !== lastMessage?.id}
                                  onClick={() =>
                                    runShortcut({
                                      kind: "change_choice",
                                      label: choice.label,
                                      choice,
                                    })
                                  }
                                >
                                  {choice.label}
                                </button>
                              ))}
                            </div>
                          </details>
                        )}
                      </>
                    )}
                    {response?.change?.kind === "ready" &&
                      !stale &&
                      (activeChange?.response.change?.kind !== "ready" ||
                        activeChange.response.change.command.id !== response.change.command.id) && (
                        <p className={styles.caption}>
                          <ReplyText text="This saved preview is read-only. Prepare a fresh request to edit and confirm." />
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
                    {content?.closing && (
                      <p className={styles.caption}>
                        <ReplyText text={content.closing} />
                      </p>
                    )}
                    {response && content && response.sources.length > 0 && (
                      <details className={styles.sourceDisclosure}>
                        <summary>
                          Show sources <span>{response.sources.length}</span>
                        </summary>
                        <div className={styles.sources}>
                          {response.sources.map((item) => (
                            <button
                              key={JSON.stringify(item)}
                              type="button"
                              onClick={() => {
                                guidance.stop();
                                setSource(item);
                              }}
                            >
                              Original ·{" "}
                              {workspace.documents.find((doc) => doc.id === item.documentId)
                                ?.name ?? "Source"}{" "}
                              · p{item.page}
                            </button>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </article>
            );
          })}
          {pending && (
            <>
              <div className={styles.user}>{pending.prompt}</div>
              <p
                className={`${styles.stage} ${busy ? styles.working : ""}`}
                role={pending.stage === "failed" ? "alert" : "status"}
              >
                <ReplyText text={pending.text} />
              </p>
            </>
          )}
          {notice && (
            <p role="status" className={styles.stage}>
              <ReplyText text={notice} />
            </p>
          )}
        </div>
      )}
      <InlineProcessingReview action="chat" />
      <ComposerShell
        value={input}
        onChange={setInput}
        onSubmit={() => {
          void send(input);
        }}
        disabled={busy}
        shortcuts={
          !expanded || touring || shortcuts.length === 0
            ? undefined
            : shortcuts.map((choice) => (
                <button
                  type="button"
                  key={choice.label}
                  disabled={busy}
                  onClick={() => runShortcut(choice)}
                >
                  {choice.label}
                </button>
              ))
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
