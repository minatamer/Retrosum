export type TourRect = { top: number; left: number; width: number; height: number };
export type TourViewport = { width: number; height: number };
export type TourSide = "right" | "left" | "below" | "above";
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(value, Math.max(low, high)));

/** Keep the guide beside its visible spotlight, including a tall chart on a small phone. */
export function placeTour(raw: TourRect, viewport: TourViewport, cardHeight: number) {
  const edge = 12,
    gap = 18;
  const cardWidth = Math.min(360, viewport.width - edge * 2);
  const height = Math.min(cardHeight, viewport.height * 0.45);
  const minimumSpotlight = Math.min(48, Math.max(1, viewport.height - height - gap - edge * 2));
  const left = clamp(raw.left - 6, edge, viewport.width - edge - 32);
  const top = clamp(raw.top - 6, edge, viewport.height - edge - minimumSpotlight);
  let spotlight: TourRect = {
    left,
    top,
    width: Math.max(1, Math.min(viewport.width - edge, raw.left + raw.width + 6) - left),
    height: Math.max(1, Math.min(viewport.height - edge, raw.top + raw.height + 6) - top),
  };
  const candidates = (rect: TourRect) => [
    {
      side: "right" as const,
      left: rect.left + rect.width + gap,
      top: clamp(rect.top, edge, viewport.height - height - edge),
    },
    {
      side: "left" as const,
      left: rect.left - cardWidth - gap,
      top: clamp(rect.top, edge, viewport.height - height - edge),
    },
    {
      side: "below" as const,
      left: clamp(
        rect.left + (rect.width - cardWidth) / 2,
        edge,
        viewport.width - cardWidth - edge,
      ),
      top: rect.top + rect.height + gap,
    },
    {
      side: "above" as const,
      left: clamp(
        rect.left + (rect.width - cardWidth) / 2,
        edge,
        viewport.width - cardWidth - edge,
      ),
      top: rect.top - height - gap,
    },
  ];
  const fits = (candidate: { left: number; top: number }) =>
    candidate.left >= edge &&
    candidate.top >= edge &&
    candidate.left + cardWidth <= viewport.width - edge &&
    candidate.top + height <= viewport.height - edge;
  let card = candidates(spotlight).find(fits);
  if (!card) {
    // Highlight the visible upper portion of an oversized target and leave a clear guide below.
    const availableTop = viewport.height - height - gap - edge - minimumSpotlight;
    spotlight = {
      ...spotlight,
      top: Math.min(spotlight.top, Math.max(edge, availableTop)),
    };
    spotlight.height = Math.min(
      spotlight.height,
      viewport.height - height - gap - edge - spotlight.top,
    );
    card = candidates(spotlight).find(fits)!;
  }
  const pointer =
    card.side === "left" || card.side === "right"
      ? clamp(spotlight.top + spotlight.height / 2 - card.top, 24, height - 24)
      : clamp(spotlight.left + spotlight.width / 2 - card.left, 24, cardWidth - 24);
  return { spotlight, card: { ...card, width: cardWidth, height }, pointer };
}
