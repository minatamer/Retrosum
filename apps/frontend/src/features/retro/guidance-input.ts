/** User scrolling releases automatic positioning, while a tour ends only through dismissal. */
export function observeGuidanceInput({
  touring,
  isScrolling,
  interruptScroll,
  stop,
}: {
  touring: boolean;
  isScrolling(): boolean;
  interruptScroll(): void;
  stop(): void;
}) {
  const scroll = (event: Event) => {
    if (touring) interruptScroll();
    else if (!(event.target as Element | null)?.closest?.("#retro-tour-card")) stop();
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape") stop();
    else if (
      ["ArrowUp", "ArrowDown", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)
    ) {
      if (touring) interruptScroll();
      else if (
        isScrolling() ||
        (!(event.target as Element | null)?.closest?.("#retro-tour-card") &&
          !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
            (event.target as HTMLElement)?.tagName,
          ))
      )
        stop();
    }
  };
  window.addEventListener("wheel", scroll, { passive: true });
  window.addEventListener("touchstart", scroll, { passive: true });
  window.addEventListener("touchmove", scroll, { passive: true });
  window.addEventListener("keydown", key);
  return () => {
    window.removeEventListener("wheel", scroll);
    window.removeEventListener("touchstart", scroll);
    window.removeEventListener("touchmove", scroll);
    window.removeEventListener("keydown", key);
  };
}
