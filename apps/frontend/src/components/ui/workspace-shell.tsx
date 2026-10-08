"use client";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
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
  const [composerSpace, setComposerSpace] = useState("21rem");
  const hasComposer = Boolean(composer);
  useLayoutEffect(() => {
    const element = dock.current;
    if (!element) return;
    const measure = () =>
      setComposerSpace(`${Math.ceil(element.getBoundingClientRect().height) + 40}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasComposer]);
  const spacing: CSSProperties & { "--rs-composer-space": string } = {
    "--rs-composer-space": hasComposer ? composerSpace : "2rem",
  };
  return (
    <div className="rs-workspace" style={spacing}>
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
