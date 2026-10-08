"use client";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { RetroTarget } from "@retrosum/contracts";
import { navigateWorkspace } from "../workspace/navigation";
import { locateTarget, TARGETS, TOUR } from "./targets";
import styles from "./retro.module.css";

export type Guidance = {
  target: RetroTarget;
  step: number | null;
  serial: number;
  contextKey: string;
};
export function useGuidance(contextKey: string) {
  const [active, setActive] = useState<Guidance | null>(null);
  const stop = useCallback(() => setActive(null), []);
  const show = useCallback(
    (target: RetroTarget, step: number | null = null) => {
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
    window.addEventListener("resize", clear);
    window.visualViewport?.addEventListener("resize", clear);
    return () => {
      window.removeEventListener("retrosum:manual-navigation", clear);
      window.removeEventListener("popstate", clear);
      window.removeEventListener("resize", clear);
      window.visualViewport?.removeEventListener("resize", clear);
    };
  }, []);
  // A remounted generation/scope clears obsolete guidance without resuming anything.
  return { active: active?.contextKey === contextKey ? active : null, show, stop };
}
export function GuidanceOutline({ active, onStop }: { active: Guidance | null; onStop(): void }) {
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let attempts = 0;
    let first = true;
    const measure = () => {
      if (disposed) return;
      const node = locateTarget(active.target);
      if (document.querySelector("dialog[open]")) {
        onStop();
        return;
      }
      if (!node) {
        if (++attempts > 5) {
          onStop();
          return;
        }
        timer = window.setTimeout(measure, 100);
        return;
      }
      if (first && active.target !== "composer") {
        if (node instanceof HTMLDetailsElement) node.open = true;
        first = false;
        window.scrollTo({
          top: Math.max(0, node.getBoundingClientRect().top + window.scrollY - 76),
          behavior: "smooth",
        });
      }
      const box = node.getBoundingClientRect();
      const dock = document.querySelector(".rs-floating-composer")?.getBoundingClientRect();
      const bottom =
        active.target === "composer"
          ? window.innerHeight - 8
          : Math.min(window.innerHeight - 8, (dock?.top ?? window.innerHeight) - 12);
      const top = Math.max(8, box.top - 6);
      const left = Math.max(5, box.left - 6);
      setRect({
        top,
        left,
        width: Math.max(0, Math.min(window.innerWidth - 5, box.right + 6) - left),
        height: Math.max(0, Math.min(bottom, box.bottom + 6) - top),
      });
    };
    let timer = window.setTimeout(measure, 40);
    const scrolled = () => measure();
    const interrupted = () => onStop();
    const key = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" ||
        (!["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName) &&
          ["PageDown", "PageUp", "Home", "End"].includes(event.key))
      )
        onStop();
    };
    window.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("wheel", interrupted, { passive: true });
    window.addEventListener("touchmove", interrupted, { passive: true });
    window.addEventListener("keydown", key);
    const observer = new MutationObserver(measure);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open", "hidden"],
    });
    const expiry = active.step === null ? window.setTimeout(onStop, 8000) : null;
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      if (expiry !== null) window.clearTimeout(expiry);
      observer.disconnect();
      window.removeEventListener("scroll", scrolled);
      window.removeEventListener("wheel", interrupted);
      window.removeEventListener("touchmove", interrupted);
      window.removeEventListener("keydown", key);
    };
  }, [active, onStop]);
  const position: CSSProperties = rect ?? { display: "none" };
  return (
    active &&
    createPortal(
      <div className={styles.outline} style={position} aria-hidden="true">
        <span>Retro ↘</span>
      </div>,
      document.body,
    )
  );
}
export function TourStep({
  active,
  show,
  stop,
}: {
  active: Guidance;
  show(target: RetroTarget, step?: number | null): void;
  stop(): void;
}) {
  const index = active.step;
  if (index === null) return null;
  const target = TARGETS[active.target];
  return (
    <div className={styles.tour} role="region" aria-label="Retro workspace tour">
      <span className={styles.meta}>
        Local tour · {index + 1} of {TOUR.length}
      </span>
      <strong>{target.title}</strong>
      <p>{target.text}</p>
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
  );
}
