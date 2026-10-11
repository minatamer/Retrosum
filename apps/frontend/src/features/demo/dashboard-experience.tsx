"use client";
import { userFacingError } from "../../components/ui/user-facing-error";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Wordmark } from "../../components/ui/wordmark";
import { PaperDialog } from "../../components/ui/paper-dialog";
import { useSession } from "../session/session-provider";
import { RecordsWorkspace } from "../records/records-workspace";
import { Retro } from "../retro/retro";
import { ProcessingDetails } from "../processing/processing-provider";
import {
  navigateWorkspace,
  isWorkspaceView,
  workspaceNavigationEvent,
  workspacePanelEvent,
  type WorkspaceView,
} from "../workspace/navigation";
import { ConfigurableDashboard } from "../dashboard/configurable-dashboard";
import { usdEurRateSchema, type UsdEurRate } from "@retrosum/contracts";
import { DocumentLibrary } from "./document-library";
import styles from "./dashboard-shell.module.css";

const paths: Record<string, string> = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  documents: "M6 2h9l4 4v16H6z M14 2v6h5 M9 12h7 M9 16h7",
  records: "M4 4h16v16H4z M4 10h16 M10 4v16",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
  collapse: "M5 4v16 M19 7l-5 5 5 5 M14 12h7",
  reset: "M3 10a9 9 0 1 1 1 7 M3 3v7h7",
};
function Icon({ name }: { name: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.overview} />
    </svg>
  );
}
const phoneQuery = "(max-width: 700px)";
function subscribePhone(callback: () => void) {
  const query = window.matchMedia(phoneQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
export function DashboardExperience({
  onAddDocuments,
  live,
}: {
  onAddDocuments(): void;
  live: boolean;
}) {
  const { controller, session, generation, notice } = useSession();
  const [settings, setSettings] = useState(false);
  const [suggestedCurrency, setSuggestedCurrency] = useState<"USD" | "EUR" | null>(null);
  const [menu, setMenu] = useState(false);
  const [reset, setReset] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const phone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(phoneQuery).matches,
    () => false,
  );
  useLayoutEffect(() => {
    const owner = frame.current,
      element = dock.current;
    if (!owner || !element) return;
    const measure = () => {
      const viewport = window.visualViewport;
      owner.style.setProperty(
        "--rs-composer-space",
        `${Math.ceil(element.getBoundingClientRect().height) + 40}px`,
      );
      owner.style.setProperty(
        "--rs-keyboard-offset",
        `${viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0}px`,
      );
      owner.style.setProperty(
        "--rs-visual-height",
        `${Math.round(viewport?.height ?? window.innerHeight)}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, []);
  useEffect(() => {
    if (!phone || !menu) return;
    const previous = document.activeElement as HTMLElement | null;
    const controls = () => [
      ...(sidebar.current?.querySelectorAll<HTMLElement>("a[href],button:not(:disabled)") ?? []),
    ];
    controls()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        return;
      }
      if (event.key !== "Tab") return;
      const buttons = controls(),
        first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [phone, menu]);
  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<{ panel?: string; currency?: "USD" | "EUR" | null }>)
        .detail;
      if (detail?.panel === "settings") {
        setSuggestedCurrency(
          detail.currency === "USD" || detail.currency === "EUR" ? detail.currency : null,
        );
        setSettings(true);
      } else if (detail?.panel === "reset") setReset(true);
      else if (detail?.panel === "intake") onAddDocuments();
    };
    window.addEventListener(workspacePanelEvent, open);
    return () => window.removeEventListener(workspacePanelEvent, open);
  }, [onAddDocuments]);
  useEffect(() => {
    const navigate = (event: Event) => {
      const view = (event as CustomEvent<{ view?: WorkspaceView }>).detail?.view;
      const current = controller.getSnapshot().session;
      if (isWorkspaceView(view) && current)
        controller.setExperience({ ...current.experience, view });
    };
    window.addEventListener(workspaceNavigationEvent, navigate);
    return () => window.removeEventListener(workspaceNavigationEvent, navigate);
  }, [controller]);
  if (!session) return null;
  const { workspace, dashboard, experience } = session;
  const name =
    dashboard.profileName === "Your workspace" ? workspace.business.name : dashboard.profileName;
  const go = (view: WorkspaceView) => {
    navigateWorkspace(view, true);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div ref={frame} className={styles.app} data-collapsed={dashboard.collapsed} data-menu={menu}>
      {menu && (
        <button
          className={styles.scrim}
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        ref={sidebar}
        className={styles.sidebar}
        aria-label="Workspace navigation"
        inert={phone && !menu}
        role={phone && menu ? "dialog" : undefined}
        aria-modal={phone && menu ? true : undefined}
      >
        {phone && menu && (
          <button type="button" className={styles.closeMenu} onClick={() => setMenu(false)}>
            Close navigation ×
          </button>
        )}
        <div className={styles.sidebarBrand}>
          <Wordmark inverse />
          <Wordmark compact className={styles.miniBrand} />
        </div>
        <button
          className={styles.profile}
          type="button"
          onClick={() => setSettings(true)}
          aria-label="Open profile and settings"
        >
          <span>{name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <small>Guest workspace</small>
          </div>
          <i>⌄</i>
        </button>
        <span className={styles.navCaption}>Your workspace</span>
        <nav aria-label="Workspace areas">
          {(["overview", "documents", "records"] as const).map((view) => (
            <button
              type="button"
              key={view}
              aria-label={
                view === "overview" ? "Dashboard" : view === "documents" ? "Documents" : "Records"
              }
              aria-current={experience.view === view ? "page" : undefined}
              onClick={() => go(view)}
              title={view === "overview" ? "Dashboard" : view}
            >
              <Icon name={view} />
              <span>
                {view === "overview" ? "Dashboard" : view === "documents" ? "Documents" : "Records"}
              </span>
              {view === "documents" && <small>{workspace.documents.length}</small>}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <button type="button" onClick={() => setSettings(true)} title="Settings">
            <Icon name="settings" />
            <span>Settings</span>
          </button>
          <button type="button" onClick={() => setReset(true)} title="Reset workspace">
            <Icon name="reset" />
            <span>Reset workspace</span>
          </button>
          <ProcessingDetails compact={dashboard.collapsed && !phone} live={live} />
          <button
            type="button"
            className={styles.collapse}
            onClick={() =>
              controller.setDashboard({ ...dashboard, collapsed: !dashboard.collapsed }, false)
            }
            aria-label={dashboard.collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name="collapse" />
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className={styles.workspace} inert={phone && menu}>
        <header className={styles.topbar}>
          <div>
            <button
              type="button"
              className={styles.menuButton}
              aria-label="Open navigation"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              ☰
            </button>
            <span>{name}</span>
            <i>/</i>
            <strong>
              {experience.view === "overview"
                ? "Dashboard"
                : experience.view === "documents"
                  ? "Documents"
                  : "Records"}
            </strong>
          </div>
          <button type="button" onClick={() => setSettings(true)}>
            {dashboard.currency}
            <span>⚙</span>
          </button>
        </header>
        <main id="main" tabIndex={-1} className={styles.content}>
          <div id="retro-change-stage" />
          {notice && (
            <p className={styles.sessionNotice} role="status">
              {notice}
            </p>
          )}
          {experience.view === "overview" && (
            <ConfigurableDashboard onDocuments={() => go("documents")} />
          )}
          {experience.view === "documents" && <DocumentLibrary onAddDocuments={onAddDocuments} />}
          {experience.view === "records" && (
            <div id="retro-records">
              <RecordsWorkspace />
            </div>
          )}
        </main>
      </div>
      <div ref={dock} className={styles.composer} inert={phone && menu}>
        <Retro key={`${generation}/${workspace.id}`} />
      </div>
      {settings && (
        <Settings
          suggestedCurrency={suggestedCurrency}
          onClose={() => {
            setSettings(false);
            setSuggestedCurrency(null);
          }}
        />
      )}
      <PaperDialog
        open={reset}
        title="Start fresh?"
        caption="Your workspace"
        onClose={() => setReset(false)}
      >
        <p>Your current documents, records, conversation and dashboard layout will be cleared.</p>
        <div className={styles.dialogActions}>
          <button type="button" onClick={() => setReset(false)}>
            Keep workspace
          </button>
          <button
            type="button"
            onClick={() => {
              setReset(false);
              void controller.reset();
            }}
          >
            Reset workspace
          </button>
        </div>
      </PaperDialog>
    </div>
  );
}
function Settings({
  onClose,
  suggestedCurrency,
}: {
  onClose(): void;
  suggestedCurrency: "USD" | "EUR" | null;
}) {
  const { controller, session } = useSession();
  const [currency, setCurrency] = useState(suggestedCurrency ?? session!.dashboard.currency);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState<UsdEurRate | null>(null);
  const [rateStatus, setRateStatus] = useState<"idle" | "loading" | "ready" | "error">(
    currency === "EUR" ? "loading" : "idle",
  );
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (currency !== "EUR") return;
    const abort = new AbortController();
    const release = controller.trackEffect(abort);
    void (async () => {
      try {
        const response = await fetch("/api/retrosum/v1/exchange-rate", {
          cache: "no-store",
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10_000)]),
        });
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error("exchange_rate_unavailable");
        }
        const quote = usdEurRateSchema.parse(await response.json());
        if (!abort.signal.aborted) {
          setRate(quote);
          setRateStatus("ready");
        }
      } catch {
        if (!abort.signal.aborted) setRateStatus("error");
      } finally {
        release();
      }
    })();
    return () => {
      abort.abort();
      release();
    };
  }, [controller, currency, retry]);
  if (!session) return null;
  const preferences = session.dashboard;
  return (
    <PaperDialog open title="Make it yours." caption="Workspace settings" onClose={onClose}>
      <form
        className={styles.settings}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          if (currency === "EUR" && (rateStatus !== "ready" || !rate)) return;
          try {
            controller.setDashboard(
              {
                ...preferences,
                profileName: String(data.get("name")).trim(),
                currency,
                eurRateMicros: currency === "EUR" ? rate!.rateMicros : preferences.eurRateMicros,
                eurRateDate: currency === "EUR" ? rate!.date : preferences.eurRateDate,
              },
              false,
            );
            onClose();
          } catch (cause) {
            setError(userFacingError(cause, "Check these settings."));
          }
        }}
      >
        <label>
          Display name
          <input
            name="name"
            defaultValue={
              preferences.profileName === "Your workspace"
                ? session.workspace.business.name
                : preferences.profileName
            }
            required
            maxLength={80}
          />
        </label>
        <label>
          Dashboard currency
          <select
            value={currency}
            onChange={(e) => {
              const next = e.target.value as "USD" | "EUR";
              setCurrency(next);
              setRate(null);
              setRateStatus(next === "EUR" ? "loading" : "idle");
              setError(null);
            }}
          >
            <option value="USD">USD · US dollar</option>
            <option value="EUR">EUR · Euro</option>
          </select>
        </label>
        {currency === "EUR" && (
          <div className={styles.exchangeRate} role="status" aria-live="polite">
            {rateStatus === "ready" && rate ? (
              <>
                <span>Automatic exchange rate</span>
                <strong>1 USD = {rate.rateMicros / 1_000_000} EUR</strong>
                <small>
                  ECB reference ·{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  }).format(new Date(`${rate.date}T00:00:00Z`))}
                </small>
              </>
            ) : rateStatus === "error" ? (
              <>
                <strong>We couldn’t load the exchange rate.</strong>
                <small>Try again, or choose USD to continue.</small>
                <button
                  type="button"
                  className={styles.rateRetry}
                  onClick={() => {
                    setRate(null);
                    setRateStatus("loading");
                    setRetry(retry + 1);
                  }}
                >
                  Retry rate lookup ↻
                </button>
              </>
            ) : (
              <span className={styles.rateLoading}>
                <i aria-hidden="true" /> Loading the latest exchange rate…
              </span>
            )}
            <small>Source documents and records stay in USD.</small>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={currency === "EUR" && (rateStatus !== "ready" || !rate)}>
          Save settings →
        </button>
      </form>
    </PaperDialog>
  );
}
