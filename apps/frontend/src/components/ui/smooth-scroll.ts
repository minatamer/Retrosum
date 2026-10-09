const duration = 640;
let activeCancel: (() => void) | null = null;

export function cancelSmoothScroll() {
  activeCancel?.();
}

export function smoothScrollTo(top: number, onFinish?: () => void) {
  cancelSmoothScroll();
  const start = window.scrollY;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const destination = Math.max(0, Math.min(top, maximum));
  if (Math.abs(destination - start) < 1) {
    onFinish?.();
    return () => {};
  }
  const started = performance.now();
  let frame = 0;
  const cancel = () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", cancel);
    window.removeEventListener("pagehide", cancel);
    window.removeEventListener("popstate", cancel);
    if (activeCancel === cancel) activeCancel = null;
  };
  const onKey = (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "Escape"].includes(event.key))
      cancel();
  };
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: start + (destination - start) * eased, behavior: "instant" });
    if (progress < 1) frame = window.requestAnimationFrame(step);
    else {
      cancel();
      onFinish?.();
    }
  };
  activeCancel = cancel;
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", cancel);
  window.addEventListener("pagehide", cancel);
  window.addEventListener("popstate", cancel);
  frame = window.requestAnimationFrame(step);
  return cancel;
}

export function scrollToElement(
  element: HTMLElement,
  { block = "start", focus = false }: { block?: "start" | "center"; focus?: boolean } = {},
) {
  const box = element.getBoundingClientRect();
  const top = box.top + window.scrollY;
  const style = getComputedStyle(element);
  const rootStyle = getComputedStyle(document.documentElement);
  const marginTop = Number.parseFloat(style.scrollMarginTop) || 0;
  const marginBottom = Number.parseFloat(style.scrollMarginBottom) || 0;
  const paddingTop = Number.parseFloat(rootStyle.scrollPaddingTop) || 0;
  const paddingBottom = Number.parseFloat(rootStyle.scrollPaddingBottom) || 0;
  const offset =
    block === "center"
      ? paddingTop +
        (window.innerHeight - paddingTop - paddingBottom - box.height) / 2 +
        (marginTop - marginBottom) / 2
      : marginTop + paddingTop;
  return smoothScrollTo(top - offset, () => {
    if (focus && element.isConnected) element.focus({ preventScroll: true });
  });
}

export function scrollToSection(id: string, focus = false) {
  const element = document.getElementById(id);
  return element ? scrollToElement(element, { focus }) : () => {};
}
