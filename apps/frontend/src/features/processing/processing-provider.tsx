"use client";
import { UserFacingError } from "../../components/ui/user-facing-error";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import { PROCESSING_DISCLOSURE_VERSION, grantResultSchema } from "@retrosum/contracts";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { readJson } from "../../transport/read-json";
import { useSession } from "../session/session-provider";
import styles from "./processing.module.css";
import type { AuthorizePaid, ProcessingIdentity } from "./processing-client";

type Identity = ProcessingIdentity;
const ProcessingContext = createContext<{
  authorize: AuthorizePaid;
  pending: Pending | null;
} | null>(null);
type Pending = {
  identity: Identity;
  siteKey: string;
  signal: AbortSignal;
  nonce: string;
  admission: Promise<boolean> | null;
  finish(grant?: string, failure?: string): void;
};
type Turnstile = {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      cData: string;
      size: "compact";
      appearance: "interaction-only";
      theme: "light";
      language: "en";
      retry: "never";
      "refresh-expired": "never";
      "refresh-timeout": "never";
      "response-field": false;
      callback(token: string): void;
      "error-callback"(): void;
      "expired-callback"(): void;
      "before-interactive-callback"(): void;
      "after-interactive-callback"(): void;
    },
  ): string;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function usePaidProcessing() {
  const processing = use(ProcessingContext);
  if (!processing) throw new Error("Processing provider is required.");
  return processing.authorize;
}
export function InlineProcessingReview({ action = "extract" }: { action?: Identity["action"] }) {
  const processing = use(ProcessingContext);
  if (!processing) throw new Error("Processing provider is required.");
  const pending = processing.pending;
  return pending?.identity.action === action ? (
    <LiveReview key={pending.identity.operationId} pending={pending} />
  ) : null;
}
export function ProcessingProvider({ children }: { children: ReactNode }) {
  const { controller } = useSession();
  const [pending, setPending] = useState<Pending | null>(null);
  const owned = useRef<Pending | null>(null);
  useEffect(() => () => owned.current?.finish(), []);
  const authorize = useCallback<AuthorizePaid>(
    (identity, capabilities, signal, presentation = undefined) => {
      if (presentation === "document-selection" && identity.action !== "extract")
        return Promise.reject(new Error("Document selection cannot authorize a Retro turn."));
      if (
        identity.operations &&
        (identity.action !== "extract" || presentation !== "document-selection")
      )
        return Promise.reject(new Error("A document batch requires its selected-document action."));
      if (
        capabilities.mode !== "live" ||
        !capabilities.processing?.admissionAvailable ||
        !capabilities.processing.siteKey ||
        capabilities.processing.disclosureVersion !== PROCESSING_DISCLOSURE_VERSION
      )
        return Promise.reject(
          new UserFacingError(
            "Live processing is awaiting verification. No content was submitted.",
          ),
        );
      if (owned.current)
        return Promise.reject(new UserFacingError("Finish the current verification first."));
      if (signal.aborted)
        return Promise.reject(new UserFacingError("Processing cancelled before submission."));
      return new Promise<string>((resolve, reject) => {
        const abort = new AbortController();
        const bounded = AbortSignal.any([signal, abort.signal, AbortSignal.timeout(120000)]);
        const untrack = controller.trackEffect(abort);
        const cancel = () => value.finish();
        const value: Pending = {
          identity,
          siteKey: capabilities.processing!.siteKey,
          signal: bounded,
          admission: null,
          nonce:
            document.querySelector<HTMLMetaElement>('meta[name="retrosum-csp-nonce"]')?.content ??
            "",
          finish(grant, failure) {
            if (owned.current !== value) return;
            owned.current = null;
            bounded.removeEventListener("abort", cancel);
            untrack();
            abort.abort();
            setPending(null);
            if (grant) resolve(grant);
            else
              reject(
                new UserFacingError(
                  failure ?? "Processing cancelled. No automatic retry will run.",
                ),
              );
          },
        };
        owned.current = value;
        value.admission = startAdmission(value);
        bounded.addEventListener("abort", cancel, { once: true });
        setPending(value);
      });
    },
    [controller],
  );
  return <ProcessingContext value={{ authorize, pending }}>{children}</ProcessingContext>;
}
async function admit(
  path:
    "/api/retrosum/v1/session" | "/api/retrosum/v1/grants" | "/api/retrosum/v1/document-batches",
  body: unknown,
  signal: AbortSignal,
) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(12000)]);
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: deadline,
    cache: "no-store",
    redirect: "error",
  });
  const value = await readJson(response, 4096, deadline);
  if (!response.ok)
    throw new UserFacingError(
      "Processing is unavailable or this session’s allowance is used. You can still edit your records and explore the dashboard.",
    );
  return value;
}
function startAdmission(pending: Pending) {
  return admit(
    "/api/retrosum/v1/session",
    {
      workspaceId: pending.identity.workspaceId,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      consent: true,
    },
    pending.signal,
  ).then(
    () => true,
    () => false,
  );
}
function LiveReview({ pending }: { pending: Pending }) {
  const chat = pending.identity.action === "chat";
  const [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(true),
    [interactive, setInteractive] = useState(false),
    [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const admissionError = chat
    ? "Security verification could not start. Send your request again deliberately; nothing was submitted for AI processing."
    : "Verification could not start. Cancel processing and try again deliberately; your originals remain available.";
  useEffect(() => {
    if (!pending.admission) return;
    void pending.admission.then((success) => {
      if (pending.signal.aborted) return;
      setBusy(false);
      if (success) setAccepted(true);
      else if (chat) pending.finish(undefined, admissionError);
      else setError(admissionError);
    });
  }, [pending, admissionError, chat]);
  const fail = (message: string) => {
    if (chat) pending.finish(undefined, message);
    else setError(message);
  };
  const verified = async (challengeToken: string) => {
    if (submitting.current || pending.signal.aborted) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = grantResultSchema.parse(
        await admit(
          pending.identity.operations
            ? "/api/retrosum/v1/document-batches"
            : "/api/retrosum/v1/grants",
          {
            ...pending.identity,
            disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
            consent: true,
            challengeToken,
          },
          pending.signal,
        ),
      );
      pending.signal.throwIfAborted();
      if (result.expiresAt <= Date.now()) throw new Error();
      pending.finish(result.grant);
    } catch {
      if (!pending.signal.aborted)
        fail(
          chat
            ? "Security verification could not finish. Send your request again deliberately; nothing was submitted for AI processing."
            : "Verification could not finish. Cancel processing and try again deliberately; this PDF was not submitted for AI processing.",
        );
    } finally {
      if (!pending.signal.aborted) setBusy(false);
    }
  };
  const verification = (
    <>
      {accepted && !error && (
        <Challenge
          pending={pending}
          verified={verified}
          interaction={setInteractive}
          failed={() =>
            fail(
              chat
                ? "Security verification expired or could not load. Send your request again deliberately; nothing was submitted for AI processing."
                : "Verification expired or could not load. Cancel processing and try again deliberately.",
            )
          }
        />
      )}
      {!error && interactive && <p role="status">Complete the security check to continue.</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
  return (
    <div
      className={styles.inlineReview}
      aria-busy={busy}
      data-action={pending.identity.action}
      data-attention={interactive || !!error}
    >
      {verification}
    </div>
  );
}
function Challenge({
  pending,
  verified,
  failed,
  interaction,
}: {
  pending: Pending;
  verified(token: string): Promise<void>;
  failed(): void;
  interaction(required: boolean): void;
}) {
  const element = useRef<HTMLDivElement>(null),
    [loaded, setLoaded] = useState(false);
  const callbacks = useRef({ verified, failed, interaction });
  useEffect(() => {
    callbacks.current = { verified, failed, interaction };
  }, [verified, failed, interaction]);
  useEffect(() => {
    if (!loaded || !element.current || !window.turnstile || pending.signal.aborted) return;
    const api = window.turnstile;
    let id: string;
    try {
      id = api.render(element.current, {
        sitekey: pending.siteKey,
        action: `retrosum_${pending.identity.action}`,
        cData: pending.identity.inputHash,
        size: "compact",
        appearance: "interaction-only",
        theme: "light",
        language: "en",
        retry: "never",
        "refresh-expired": "never",
        "refresh-timeout": "never",
        "response-field": false,
        callback: (token) => {
          void callbacks.current.verified(token);
        },
        "error-callback": () => callbacks.current.failed(),
        "expired-callback": () => callbacks.current.failed(),
        "before-interactive-callback": () => callbacks.current.interaction(true),
        "after-interactive-callback": () => callbacks.current.interaction(false),
      });
    } catch {
      callbacks.current.failed();
      return;
    }
    return () => {
      try {
        api.remove(id);
      } catch {
        /* Already removed by provider cleanup. */
      }
    };
  }, [loaded, pending]);
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        nonce={pending.nonce}
        onReady={() => setLoaded(true)}
        onError={() => callbacks.current.failed()}
      />
      <div ref={element} className={styles.challenge} aria-label="Verify this action" />
    </>
  );
}
function HandlingCopy({ live = false }: { live?: boolean }) {
  return (
    <>
      <p>
        {live
          ? "Your selected PDFs and their core business context will pass through Retrosum’s temporary server processing to OpenAI for interpretation when you choose Process."
          : "Choose the documents you want to process, then review their details before adding them to your overview. You can inspect the originals and edit your records at any time."}
      </p>
      {live && (
        <p>
          When you send Retro a message, your question, recent conversation and current financial
          records pass through Retrosum’s temporary server processing to OpenAI. Original PDFs are
          not attached to Retro turns. Opening chat sends no content.
        </p>
      )}
      <p>
        Uploaded PDFs stay in this browser tab. Your records survive refresh for up to two hours.
        Reset stops processing and clears the session; expired data is cleared when you return.
      </p>
      {live && (
        <p>
          OpenAI may retain data under its abuse monitoring and file or image policies.{" "}
          <a
            href="https://developers.openai.com/api/docs/guides/your-data"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read OpenAI’s data policy ↗
          </a>
        </p>
      )}
      <p>
        Share only documents you are entitled to process. Reset cannot remove files you already
        downloaded{live ? " or recall copies held by OpenAI" : ""}.
      </p>
    </>
  );
}
export function ProcessingDetails({
  compact = false,
  live = false,
}: {
  compact?: boolean;
  live?: boolean;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <>
      <button
        type="button"
        className={styles.detailsButton}
        aria-label="How processing works"
        aria-haspopup="dialog"
        onClick={() => setTarget(document.body)}
      >
        {compact ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v6 M12 7v1" />
          </svg>
        ) : (
          "How processing works ↗"
        )}
      </button>
      {target &&
        createPortal(
          <PaperDialog
            open
            onClose={() => setTarget(null)}
            title="Your documents, handled clearly"
            caption="Privacy & processing"
          >
            <div className={styles.copy}>
              <HandlingCopy live={live} />
              {live && (
                <p>
                  Choosing Process approves the selected documents; sending a Retro message approves
                  that exact turn. Cloudflare verifies each action before submission and receives a
                  challenge and an opaque request hash. A single-use grant does not authorize record
                  changes. Opening these details starts no processing.
                </p>
              )}
            </div>
          </PaperDialog>,
          target,
        )}
    </>
  );
}
