"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { navigateWorkspace } from "../workspace/navigation";
import { smoothScrollTo } from "../../components/ui/smooth-scroll";
import { locateTarget, TARGETS, TOUR, type GuidanceTarget } from "./targets";
import { placeTour, type TourRect, type TourViewport } from "./tour-layout";
import { observeTourAnchor } from "./tour-anchor";
import { observeGuidanceInput } from "./guidance-input";
import styles from "./retro.module.css";

export type Guidance = {
  target: GuidanceTarget;
  step: number | null;
  serial: number;
  contextKey: string;
};
export function useGuidance(contextKey: string) {
  const [active, setActive] = useState<Guidance | null>(null);
  const stop = useCallback(() => setActive(null), []);
  const show = useCallback(
    (target: GuidanceTarget, step: number | null = null) => {
      const view = TARGETS[target].view;
      if (view) navigateWorkspace(view);
      setActive({ target, step, serial: performance.now(), contextKey });
    },
    [contextKey],
  );
  useEffect(() => {
    const clear = () => setActive(null);
    window.addEventListener("retrosum:manual-navigation", clear);
    window.addEventListener("popstate", clear);
    return () => {
      window.removeEventListener("retrosum:manual-navigation", clear);
      window.removeEventListener("popstate", clear);
    };
  }, []);
  return { active: active?.contextKey === contextKey ? active : null, show, stop };
}
export function GuidanceOutline({
  active,
  onStop,
  show,
}: {
  active: Guidance | null;
  onStop(): void;
  show(target: GuidanceTarget, step?: number | null): void;
}) {
  const [measured, setMeasured] = useState<{
    serial: number;
    rect: TourRect;
    viewport: TourViewport;
    settled: boolean;
  } | null>(null);
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let missingSince: number | null = null;
    let scrolledTarget: HTMLElement | null = null;
    let scrollInFlight = false;
    let cancelScroll: (() => void) | undefined;
    const anchor = observeTourAnchor(
      () => {
        if (disposed) return null;
        const node = locateTarget(active.target);
        if (document.querySelector("dialog[open]")) {
          onStop();
          return null;
        }
        if (!node) {
          missingSince ??= performance.now();
          if (performance.now() - missingSince >= 500) {
            const next = active.step === null ? undefined : TOUR[active.step + 1];
            if (next) show(next, active.step! + 1);
            else onStop();
          }
          return null;
        }
        missingSince = null;
        if (node !== scrolledTarget) {
          cancelScroll?.();
          scrolledTarget = node;
          scrollInFlight = true;
          anchor.beginScroll();
          if (active.step === null && node instanceof HTMLDetailsElement) node.open = true;
          if (active.target !== "composer")
            cancelScroll = smoothScrollTo(
              node.getBoundingClientRect().top + window.scrollY - 76,
              () => {
                scrollInFlight = false;
                if (!disposed) anchor.completeScroll();
              },
            );
          else {
            scrollInFlight = false;
            anchor.completeScroll();
          }
        }
        const boxes = [node.getBoundingClientRect()];
        if (active.target === "composer") {
          const toggle = node.querySelector("button[aria-expanded]");
          if (toggle) boxes.push(toggle.getBoundingClientRect());
        }
        if (active.step !== null)
          for (const id of TARGETS[active.target].companions ?? []) {
            const companion = document.getElementById(id);
            if (companion) boxes.push(companion.getBoundingClientRect());
          }
        const viewport = {
          width: document.documentElement.clientWidth,
          height: window.visualViewport?.height ?? window.innerHeight,
        };
        const top = Math.min(...boxes.map((b) => b.top)),
          left = Math.min(...boxes.map((b) => b.left));
        const bottom = Math.max(...boxes.map((b) => b.bottom)),
          right = Math.max(...boxes.map((b) => b.right));
        if (active.step === null && (top >= viewport.height - 12 || bottom <= 12)) return null;
        return {
          target: node,
          rect: { top, left, width: right - left, height: bottom - top },
          viewport,
        };
      },
      (value) => {
        setMeasured((previous) =>
          value
            ? { serial: active.serial, rect: value.rect, viewport: value.viewport, settled: true }
            : active.step !== null && previous?.serial === active.serial
              ? { ...previous, settled: false }
              : null,
        );
      },
    );
    const resized = () => {
      cancelScroll?.();
      scrolledTarget = null;
      anchor.beginScroll();
    };
    const removeInput = observeGuidanceInput({
      touring: active.step !== null,
      isScrolling: () => scrollInFlight,
      interruptScroll: () => {
        if (!scrollInFlight) return;
        cancelScroll?.();
        scrollInFlight = false;
        anchor.completeScroll();
      },
      stop: onStop,
    });
    window.addEventListener("resize", resized);
    window.visualViewport?.addEventListener("resize", resized);
    window.addEventListener("pagehide", onStop);
    const expiry = active.step === null ? window.setTimeout(onStop, 8000) : null;
    return () => {
      disposed = true;
      cancelScroll?.();
      anchor.dispose();
      if (expiry !== null) window.clearTimeout(expiry);
      window.removeEventListener("resize", resized);
      window.visualViewport?.removeEventListener("resize", resized);
      removeInput();
      window.removeEventListener("pagehide", onStop);
    };
  }, [active, onStop, show]);
  if (!active || measured?.serial !== active.serial) return null;
  if (active.step !== null)
    return createPortal(
      <TourStep
        key={active.serial}
        active={active}
        rect={measured.rect}
        viewport={measured.viewport}
        settled={measured.settled}
        show={show}
        stop={onStop}
      />,
      document.body,
    );
  const box = measured.rect,
    top = Math.max(8, box.top - 6),
    left = Math.max(5, box.left - 6);
  const position: CSSProperties = {
    top,
    left,
    width: Math.max(0, Math.min(measured.viewport.width - 5, box.left + box.width + 6) - left),
    height: Math.max(0, Math.min(measured.viewport.height - 8, box.top + box.height + 6) - top),
  };
  return createPortal(
    <div className={styles.outline} style={position} aria-hidden="true">
      <span>Retro ↘</span>
    </div>,
    document.body,
  );
}
function TourStep({
  active,
  rect,
  viewport,
  settled,
  show,
  stop,
}: {
  active: Guidance;
  rect: TourRect;
  viewport: TourViewport;
  settled: boolean;
  show(target: GuidanceTarget, step?: number | null): void;
  stop(): void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(240);
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const measure = () =>
      setCardHeight((height) => (card.offsetHeight === height ? height : card.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => {
      const fallback = document.querySelector<HTMLButtonElement>("#retro-composer > button");
      (previous?.isConnected ? previous : fallback)?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [active.serial]);
  const index = active.step!,
    target = TARGETS[active.target];
  const { spotlight, card, pointer } = placeTour(rect, viewport, cardHeight);
  const highlighted = settled && rect.top < viewport.height - 12 && rect.top + rect.height > 12;
  const bottom = spotlight.top + spotlight.height,
    right = spotlight.left + spotlight.width;
  const masks = [
    { top: 0, left: 0, width: viewport.width, height: spotlight.top },
    { top: bottom, left: 0, width: viewport.width, height: Math.max(0, viewport.height - bottom) },
    { top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height },
    {
      top: spotlight.top,
      left: right,
      width: Math.max(0, viewport.width - right),
      height: spotlight.height,
    },
  ];
  const style: CSSProperties = {
    top: card.top,
    left: card.left,
    width: card.width,
    maxHeight: viewport.height * 0.45,
  };
  const pointerStyle: CSSProperties =
    card.side === "right" || card.side === "left"
      ? {
          left: card.side === "right" ? card.left - 6 : card.left + card.width - 6,
          top: card.top + pointer - 6,
        }
      : {
          top: card.side === "below" ? card.top - 6 : card.top + card.height - 6,
          left: card.left + pointer - 6,
        };
  return (
    <>
      {highlighted &&
        masks.map((mask, index) => (
          <div
            key={["top", "bottom", "left", "right"][index]}
            className={styles.tourScrim}
            style={mask}
            aria-hidden="true"
          />
        ))}
      {highlighted && (
        <div
          className={styles.outline + " " + styles.tourOutline}
          style={spotlight}
          aria-hidden="true"
        />
      )}
      {highlighted && (
        <div className={styles.tourPointer} style={pointerStyle} aria-hidden="true" />
      )}
      <div
        ref={cardRef}
        id="retro-tour-card"
        className={styles.tour}
        style={style}
        data-side={card.side}
        data-highlighted={highlighted}
        role="dialog"
        aria-modal="true"
        aria-labelledby="retro-tour-title"
        aria-describedby="retro-tour-text"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
          ];
          const first = buttons[0],
            last = buttons.at(-1);
          if (
            event.shiftKey &&
            (document.activeElement === first || document.activeElement === event.currentTarget)
          ) {
            event.preventDefault();
            last?.focus();
          } else if (
            !event.shiftKey &&
            (document.activeElement === last || document.activeElement === event.currentTarget)
          ) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className={`${styles.tourCopy} rs-scrollbar`}>
          <span className={styles.meta}>
            Retro · {index + 1} of {TOUR.length}
          </span>
          <strong id="retro-tour-title">{target.title}</strong>
          <p id="retro-tour-text">{target.text}</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => show(TOUR[index - 1]!, index - 1)}
          >
            Back
          </button>
          {index < TOUR.length - 1 && (
            <button type="button" onClick={() => show(TOUR[index + 1]!, index + 1)}>
              Next →
            </button>
          )}
          <button type="button" onClick={stop}>
            Finish tour
          </button>
        </div>
      </div>
    </>
  );
}
