"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  RetroChangePreparation,
  RetroResponse,
  SessionAction,
  RetroChangeResult,
  Workspace,
} from "@retrosum/contracts";
import {
  changeFormValues,
  changeSelection,
  previewRetroCommand,
  formatAmount,
  recordActionFields,
} from "@retrosum/money";
import { RecordForm } from "../records/record-forms";
import { useSession } from "../session/session-provider";
import styles from "./change-preview.module.css";
type Ready = Extract<RetroChangePreparation, { kind: "ready" }>;
export function ChangePreview({
  proposal,
  response,
  onCancel,
  onApplied,
}: {
  proposal: Ready;
  response: RetroResponse;
  onCancel(): void;
  onApplied(result: RetroChangeResult): void;
}) {
  const { controller, session } = useSession();
  const [filling, setFilling] = useState(proposal.intent.operation !== "delete");
  const [current, setCurrent] = useState<Ready | null>(proposal);
  const [error, setError] = useState<string | null>(null);
  const applied = useRef(false);
  const [workspace] = useState(() => session!.workspace);
  const identity = proposal.command.id.slice("command_".length);
  const complete = useCallback(() => setFilling(false), []);
  const trackEffect = useCallback(
    (effect: AbortController) => controller.trackEffect(effect),
    [controller],
  );
  const animation = useMemo(
    () => ({
      values: changeFormValues(proposal, workspace),
      identity,
      trackEffect,
      onComplete: complete,
    }),
    [proposal, workspace, identity, trackEffect, complete],
  );
  useEffect(() => {
    const manual = () => onCancel();
    window.addEventListener("retrosum:manual-navigation", manual);
    return () => {
      window.removeEventListener("retrosum:manual-navigation", manual);
    };
  }, [onCancel]);
  const preview = (action: SessionAction | null, label: string) => {
    setError(null);
    if (!action) {
      setCurrent(null);
      return;
    }
    try {
      setCurrent(
        previewRetroCommand(
          proposal.intent,
          action,
          workspace,
          response.scope,
          identity,
          label,
          recordActionFields(action, workspace),
          proposal.beforeFields,
        ),
      );
    } catch (cause) {
      setCurrent(null);
      setError(cause instanceof Error ? cause.message : "Check the proposed fields.");
    }
  };
  const confirm = (action: SessionAction, label: string) => {
    if (filling || applied.current) return;
    try {
      const actual = previewRetroCommand(
        proposal.intent,
        action,
        workspace,
        response.scope,
        identity,
        label,
        recordActionFields(action, workspace),
        proposal.beforeFields,
      );
      if (Date.now() >= proposal.expiresAt)
        throw new RangeError("This proposal expired. Prepare a fresh one.");
      applied.current = true;
      const next = controller.execute(actual.command, label);
      onApplied({
        commandId: actual.command.id,
        appliedAtRevision: next.workspace.revision,
        family: proposal.intent.family,
        recordId: actual.targetId,
        label,
      });
    } catch (cause) {
      applied.current = false;
      setError(cause instanceof Error ? cause.message : "This change could not be applied.");
    }
  };
  return (
    <section id="retro-proposal" className={styles.panel} aria-label="Retro editable proposal">
      <header>
        <div>
          <span>Retro · Review your change</span>
          <h2>{proposal.label}</h2>
        </div>
        <button type="button" onClick={onCancel}>
          Cancel proposal
        </button>
      </header>
      <p className={styles.caption}>
        {filling
          ? "Preparing your form. You can edit any field as it appears."
          : "Review the details and their effect on your overview, then confirm."}{" "}
        USD · Dates and tax basis are visible below.
      </p>
      <div className={styles.body}>
        <div>
          {proposal.intent.operation === "delete" ? (
            <div className={styles.deletion}>
              <h3>Remove this session record?</h3>
              <dl>
                {proposal.beforeFields
                  .filter(
                    (f) =>
                      f.value &&
                      [
                        "name",
                        "number",
                        "description",
                        "price",
                        "net",
                        "reference",
                        "date",
                      ].includes(f.name),
                  )
                  .map((field) => (
                    <div key={field.name}>
                      <dt>{field.name}</dt>
                      <dd>{field.value}</dd>
                    </div>
                  ))}
              </dl>
              <button
                type="button"
                className={styles.confirm}
                onClick={() => confirm(proposal.command.actions[0]!, proposal.label)}
              >
                Yes, confirm removal
              </button>
            </div>
          ) : (
            <RecordForm
              selection={changeSelection(proposal.intent, workspace)}
              workspace={workspace}
              animation={animation}
              onPreview={preview}
              onSave={confirm}
              submitLabel={filling ? "Preparing fields…" : "Yes, confirm change"}
              submitDisabled={filling || !current}
            />
          )}
        </div>
        <aside aria-label="Proposed financial effect">
          <span className={styles.eyebrow}>Effect on your overview</span>
          <p>
            {response.scope.from} — {response.scope.to} · as of{" "}
            {response.scope.asOf ?? workspace.asOf}
          </p>
          {!current ? (
            <p role="status">Complete valid fields to preview the exact effect.</p>
          ) : (
            <dl className={styles.effects}>
              {current.effects.map((effect) => (
                <div key={effect.factId}>
                  <dt>{effect.label}</dt>
                  <dd>
                    <span>{value(effect.before, effect.unit)}</span>
                    <i aria-hidden="true">→</i>
                    <strong>{value(effect.after, effect.unit)}</strong>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className={styles.caption}>
            This shows this dashboard scope only. Dates outside it can affect another period.
            Confirming updates your records. It does not send a payment.
          </p>
          {proposal.relationships.map((text) => (
            <p className={styles.relation} key={text}>
              {text}
            </p>
          ))}
          <details>
            <summary>Before / proposed fields</summary>
            <dl className={styles.diff}>
              {(current?.fields ?? proposal.fields).map((field) => (
                <div key={field.name}>
                  <dt>{field.name}</dt>
                  <dd>
                    {proposal.intent.operation === "create"
                      ? "New"
                      : fieldValue(
                          field.name,
                          proposal.beforeFields.find((old) => old.name === field.name)?.value ?? "",
                          workspace,
                        )}{" "}
                    → {fieldValue(field.name, field.value, workspace)}
                  </dd>
                </div>
              ))}
            </dl>
            <p>
              Edits in the form take priority over these prepared values. The effect above updates
              from the actual editable fields.
            </p>
          </details>
        </aside>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </section>
  );
}
function value(number: number | null, unit: string) {
  return number === null
    ? "Unavailable"
    : unit === "money"
      ? formatAmount(number)
      : unit === "percent"
        ? `${(number / 10).toFixed(1)}%`
        : String(number);
}
function fieldValue(name: string, value: string, workspace: Workspace) {
  if (!value) return "Empty";
  if (name === "contact")
    return workspace.contacts.find((row) => row.id === value)?.name ?? "Selected counterparty";
  if (name === "allocation")
    return (
      workspace.events.find((row) => row.id === value)?.reference || "Selected financial record"
    );
  return value;
}
