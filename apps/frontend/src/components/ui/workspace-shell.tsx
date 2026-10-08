"use client";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Wordmark } from "./wordmark";
export function WorkspaceShell({
  children,
  composer,
}: {
  children: ReactNode;
  composer?: ReactNode;
}) {
  const dock = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const hasComposer = Boolean(composer);
  useLayoutEffect(() => {
    const element = dock.current;
    if (!element) return;
    const measure = () => {
      const owner = frame.current;
      if (!owner) return;
      owner.style.setProperty(
        "--rs-composer-space",
        `${Math.ceil(element.getBoundingClientRect().height) + 40}px`,
      );
      const viewport = window.visualViewport;
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
  }, [hasComposer]);
  const spacing: CSSProperties & {
    "--rs-composer-space": string;
    "--rs-keyboard-offset": string;
    "--rs-visual-height": string;
  } = {
    "--rs-composer-space": hasComposer ? "21rem" : "2rem",
    "--rs-keyboard-offset": "0px",
    "--rs-visual-height": "100dvh",
  };
  return (
    <div ref={frame} className="rs-workspace" style={spacing}>
      <header className="rs-workspace-header">
        <Wordmark inverse />
        <Link href="/">
          Back to the introduction <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main id="main" tabIndex={-1} className="rs-workspace-main">
        {children}
      </main>
      {composer && (
        <aside ref={dock} className="rs-floating-composer" aria-label="Retro assistant">
          {composer}
        </aside>
      )}
    </div>
  );
}
