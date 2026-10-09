"use client";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
export type PaperOrigin = { left: number; top: number; width: number; height: number };
export function PaperDialog({
  open,
  onClose,
  title,
  caption,
  size = "standard",
  children,
  origin,
  className = "",
}: {
  open: boolean;
  onClose(): void;
  title: string;
  caption?: string;
  size?: "standard" | "paper";
  children: ReactNode;
  origin?: PaperOrigin | undefined;
  className?: string | undefined;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (!open) return;
      if (dialog.open) dialog.close();
      if (opener?.isConnected && "focus" in opener && typeof opener.focus === "function")
        opener.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !origin || !dialog) return;
    const target = dialog.getBoundingClientRect();
    const x = origin.left + origin.width / 2 - target.left - target.width / 2;
    const y = origin.top + origin.height / 2 - target.top - target.height / 2;
    const scale = Math.min(origin.width / target.width, origin.height / target.height);
    const animation = dialog.animate(
      [
        { transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(-4deg)`, opacity: 0.35 },
        { transform: "translate(0, 0) scale(1) rotate(0)", opacity: 1 },
      ],
      { duration: 620, easing: "cubic-bezier(.18,.8,.2,1)" },
    );
    return () => animation.cancel();
  }, [open, origin]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`rs-paper-dialog${size === "paper" ? " rs-paper-dialog-wide" : ""} ${className}`}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length > 0 && element.tabIndex >= 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (!first || !last) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <div className="rs-dialog-heading">
        <div>
          {caption && <span className="rs-eyebrow">{caption}</span>}
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          className="rs-dialog-close"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      <div className="rs-dialog-content">{open ? children : null}</div>
    </dialog>
  );
}
