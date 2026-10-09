"use client";
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
import { Button } from "../../components/ui/button";
import { readJson } from "../documents/recognition-client";
import { useSession } from "../session/session-provider";
import styles from "./processing.module.css";
import type { AuthorizePaid, ProcessingIdentity } from "./processing-client";

type Identity = ProcessingIdentity;
const ProcessingContext = createContext<AuthorizePaid | null>(null);
type Pending = {
  identity: Identity;
  siteKey: string;
  signal: AbortSignal;
  nonce: string;
  finish(grant?: string): void;
};
type Turnstile = {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      cData: string;
      size: "compact";
      theme: "light";
      language: "en";
      retry: "never";
      "refresh-expired": "never";
      "refresh-timeout": "never";
      "response-field": false;
      callback(token: string): void;
      "error-callback"(): void;
      "expired-callback"(): void;
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
  const authorize = use(ProcessingContext);
  if (!authorize) throw new Error("Processing provider is required.");
  return authorize;
}
export function ProcessingProvider({ children }: { children: ReactNode }) {
  const { controller } = useSession();
  const [pending, setPending] = useState<Pending | null>(null);
  const owned = useRef<Pending | null>(null);
  useEffect(() => () => owned.current?.finish(), []);
  const authorize = useCallback<AuthorizePaid>(
    (identity, capabilities, signal) => {
      if (
        capabilities.mode !== "live" ||
        !capabilities.processing?.admissionAvailable ||
        !capabilities.processing.siteKey ||
        capabilities.processing.disclosureVersion !== PROCESSING_DISCLOSURE_VERSION
      )
        return Promise.reject(
          new Error("Live processing is awaiting verification. No content was submitted."),
        );
      if (owned.current)
        return Promise.reject(new Error("Finish the current processing review first."));
      if (signal.aborted)
        return Promise.reject(new Error("Processing cancelled before submission."));
      return new Promise<string>((resolve, reject) => {
        const abort = new AbortController();
        const bounded = AbortSignal.any([signal, abort.signal, AbortSignal.timeout(120000)]);
        const untrack = controller.trackEffect(abort);
        const cancel = () => value.finish();
        const value: Pending = {
          identity,
          siteKey: capabilities.processing!.siteKey,
          signal: bounded,
          nonce:
            document.querySelector<HTMLMetaElement>('meta[name="retrosum-csp-nonce"]')?.content ??
            "",
          finish(grant) {
            if (owned.current !== value) return;
            owned.current = null;
            bounded.removeEventListener("abort", cancel);
            untrack();
            abort.abort();
            setPending(null);
            if (grant) resolve(grant);
            else reject(new Error("Processing review cancelled. No automatic retry will run."));
          },
        };
        owned.current = value;
        bounded.addEventListener("abort", cancel, { once: true });
        setPending(value);
      });
    },
    [controller],
  );
  return (
    <ProcessingContext value={authorize}>
      {children}
      {pending &&
        createPortal(
          <LiveReview key={pending.identity.operationId} pending={pending} />,
          document.body,
        )}
    </ProcessingContext>
  );
}
async function admit(
  path: "/api/retrosum/v1/session" | "/api/retrosum/v1/grants",
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
    throw new Error(
      "Processing is unavailable or this session’s allowance is used. You can still edit your records and explore the dashboard.",
    );
  return value;
}
function LiveReview({ pending }: { pending: Pending }) {
  const [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const accepting = useRef(false),
    submitting = useRef(false);
  const begin = async () => {
    if (accepting.current) return;
    accepting.current = true;
    setBusy(true);
    try {
      await admit(
        "/api/retrosum/v1/session",
        {
          workspaceId: pending.identity.workspaceId,
          disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
          consent: true,
        },
        pending.signal,
      );
      pending.signal.throwIfAborted();
      setAccepted(true);
    } catch {
      if (!pending.signal.aborted)
        setError(
          "Admission could not start. Close this review; your originals and local controls remain available.",
        );
    } finally {
      if (!pending.signal.aborted) setBusy(false);
    }
  };
  const verified = async (challengeToken: string) => {
    if (submitting.current || pending.signal.aborted) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = grantResultSchema.parse(
        await admit(
          "/api/retrosum/v1/grants",
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
        setError(
          "Verification could not finish. Close this review and retry deliberately; nothing was submitted for AI processing.",
        );
    } finally {
      if (!pending.signal.aborted) setBusy(false);
    }
  };
  return (
    <PaperDialog
      open
      title="Review this action"
      caption="Your choice, before processing"
      onClose={() => pending.finish()}
    >
      <div className={styles.copy}>
        <HandlingCopy live action={pending.identity.action} />
        <p>
          Cloudflare checks this action for abuse after you allow it. It receives a challenge and an
          opaque request hash. A grant covers this exact action once; it does not authorize record
          changes.
        </p>
        {accepted && !error && (
          <Challenge
            pending={pending}
            verified={verified}
            failed={() =>
              setError(
                "The challenge expired or could not load. Close this review and retry deliberately.",
              )
            }
          />
        )}
        {busy && <p role="status">Checking admission…</p>}
        {error && <p role="alert">{error}</p>}
        <div className={styles.actions}>
          <Button variant="light" onClick={() => pending.finish()}>
            Cancel
          </Button>
          {!accepted && !error && (
            <Button variant="warm" disabled={busy} onClick={() => void begin()}>
              Allow this live action
            </Button>
          )}
        </div>
      </div>
    </PaperDialog>
  );
}
function Challenge({
  pending,
  verified,
  failed,
}: {
  pending: Pending;
  verified(token: string): Promise<void>;
  failed(): void;
}) {
  const element = useRef<HTMLDivElement>(null),
    [loaded, setLoaded] = useState(false);
  const callbacks = useRef({ verified, failed });
  useEffect(() => {
    callbacks.current = { verified, failed };
  }, [verified, failed]);
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
function HandlingCopy({
  live = false,
  action = "extract",
}: {
  live?: boolean;
  action?: Identity["action"];
}) {
  return (
    <>
      <p>
        {live
          ? action === "extract"
            ? "This selected PDF and its core business context will pass through Retrosum’s temporary server processing to OpenAI for interpretation."
            : "Your question, recent conversation and current financial records will pass through Retrosum’s temporary server processing to OpenAI. Original PDFs are not attached to this Retro turn."
          : "Choose the documents you want to process, then review their details before adding them to your overview. You can inspect the originals and edit your records at any time."}
      </p>
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
export function ProcessingDetails({ compact = false }: { compact?: boolean }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <>
      <button
        type="button"
        aria-label="How processing works"
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
              <HandlingCopy />
            </div>
          </PaperDialog>,
          target,
        )}
    </>
  );
}
