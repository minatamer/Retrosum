import type { TourRect, TourViewport } from "./tour-layout";

export type TourAnchor = {
  target: HTMLElement;
  rect: TourRect;
  viewport: TourViewport;
};

const settleTime = 100;
const tolerance = 0.25;
const sameAnchor = (a: TourAnchor, b: TourAnchor) =>
  a.target === b.target &&
  Math.abs(a.viewport.width - b.viewport.width) <= tolerance &&
  Math.abs(a.viewport.height - b.viewport.height) <= tolerance &&
  (Object.keys(a.rect) as (keyof TourRect)[]).every(
    (key) => Math.abs(a.rect[key] - b.rect[key]) <= tolerance,
  );

/** Publish only settled geometry, including transform motion missed by resize/scroll events. */
export function observeTourAnchor(
  read: () => TourAnchor | null,
  publish: (anchor: TourAnchor | null) => void,
) {
  let baseline: TourAnchor | null = null;
  let stableSince = 0;
  let scrolling = false;
  let visible = false;
  let disposed = false;
  let frame = 0;
  const invalidate = () => {
    baseline = null;
    if (visible) {
      visible = false;
      publish(null);
    }
  };
  const sample = (now: number) => {
    if (disposed) return;
    const anchor = read();
    // Reading may stop guidance (for example when its target opens a PDF dialog).
    if (disposed) return;
    if (scrolling || !anchor) invalidate();
    else if (!baseline || !sameAnchor(anchor, baseline)) {
      invalidate();
      baseline = anchor;
      stableSince = now;
    } else if (!visible && now - stableSince >= settleTime) {
      baseline = anchor;
      visible = true;
      publish(anchor);
    }
    if (!disposed) frame = window.requestAnimationFrame(sample);
  };
  frame = window.requestAnimationFrame(sample);
  return {
    beginScroll() {
      scrolling = true;
      invalidate();
    },
    completeScroll() {
      scrolling = false;
      invalidate();
    },
    dispose() {
      disposed = true;
      visible = false;
      baseline = null;
      window.cancelAnimationFrame(frame);
    },
  };
}
