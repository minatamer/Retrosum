// Presentation only: the complete validated message remains the source of truth.
export function animateReplyText(
  element: HTMLElement,
  text: string,
  reveal: (text: string) => void,
): () => void {
  const letters = Array.from(
    new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
  const interval = Math.min(9, 1800 / Math.max(1, letters.length));
  let frame = 0;
  let started = false;
  let disposed = false;
  let startsAt: number | null = null;
  const tick = (now: number) => {
    if (disposed) return;
    startsAt ??= now;
    const count = Math.min(letters.length, Math.floor((now - startsAt) / interval) + 1);
    reveal(letters.slice(0, count).join(""));
    if (count < letters.length) frame = window.requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver((entries) => {
    if (disposed || started || !entries.some((entry) => entry.isIntersecting)) return;
    started = true;
    observer.disconnect();
    frame = window.requestAnimationFrame(tick);
  });
  observer.observe(element);
  return () => {
    disposed = true;
    observer.disconnect();
    window.cancelAnimationFrame(frame);
  };
}
