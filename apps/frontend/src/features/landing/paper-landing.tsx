"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./landing.module.css";

export function PaperLanding({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = main.current;
    if (!root) return;
    const sheets = Array.from(root.querySelectorAll<HTMLElement>("[data-paper-sheet]"));
    let frame = 0;
    const progressBySheet = new Map<HTMLElement, number>();
    let positions: { sheet: HTMLElement; top: number; height: number }[] = [];
    let lastFrame = performance.now();
    const update = (now: number) => {
      frame = 0;
      const elapsed = Math.min(64, Math.max(1, now - lastFrame));
      lastFrame = now;
      const follow = 1 - Math.exp(-elapsed / 150);
      let moving = false;
      const viewportBottom = window.scrollY + window.innerHeight;
      positions.forEach(({ sheet, top, height }) => {
        const range = Math.max(1, Math.min(window.innerHeight * 0.75, 640, height));
        const progress = Math.max(0, Math.min(1, (viewportBottom - top) / range));
        const target = progress * progress * (3 - 2 * progress);
        const current = progressBySheet.get(sheet) ?? target;
        const settled = Math.abs(target - current) < 0.0005;
        const next = settled ? target : current + (target - current) * follow;
        progressBySheet.set(sheet, next);
        sheet.style.setProperty("--sheet-progress", next.toFixed(4));
        if (!settled) moving = true;
      });
      if (moving) frame = window.requestAnimationFrame(update);
    };
    const schedule = () => {
      if (!frame) {
        lastFrame = performance.now();
        frame = window.requestAnimationFrame(update);
      }
    };
    const measure = () => {
      // Measure the stationary section, so moving its surface never moves the scroll target.
      positions = sheets.map((sheet) => {
        const box = sheet.getBoundingClientRect();
        return { sheet, top: box.top + window.scrollY, height: box.height };
      });
      schedule();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    sheets.forEach((sheet) => observer.observe(sheet));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.cancelAnimationFrame(frame);
      sheets.forEach((sheet) => sheet.style.removeProperty("--sheet-progress"));
      progressBySheet.clear();
    };
  }, []);

  return (
    <main id="main" tabIndex={-1} className={styles.paperLanding} ref={main}>
      {children}
    </main>
  );
}
