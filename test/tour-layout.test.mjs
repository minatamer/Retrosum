import { describe, it, expect } from "vitest";
import { placeTour } from "../apps/frontend/src/features/retro/tour-layout.ts";

const overlaps = (a, b) =>
  a.left < b.left + b.width &&
  a.left + a.width > b.left &&
  a.top < b.top + b.height &&
  a.top + a.height > b.top;
describe("floating tour placement", () => {
  it.each([
    [
      { width: 1265, height: 712 },
      { left: 320, top: 80, width: 210, height: 165 },
    ],
    [
      { width: 1265, height: 712 },
      { left: 320, top: 80, width: 900, height: 210 },
    ],
    [
      { width: 768, height: 1024 },
      { left: 100, top: 80, width: 640, height: 530 },
    ],
    [
      { width: 320, height: 640 },
      { left: 16, top: 76, width: 288, height: 900 },
    ],
    [
      { width: 390, height: 844 },
      { left: 16, top: 760, width: 358, height: 67 },
    ],
    [
      { width: 320, height: 320 },
      { left: 16, top: 76, width: 288, height: 400 },
    ],
    [
      { width: 320, height: 120 },
      { left: 16, top: 50, width: 288, height: 400 },
    ],
  ])("keeps guide and visible spotlight separate inside %j", (viewport, target) => {
    for (const cardHeight of [190, 250, 360]) {
      const { spotlight, card } = placeTour(target, viewport, cardHeight);
      for (const rect of [spotlight, card]) {
        expect(rect.left).toBeGreaterThanOrEqual(12);
        expect(rect.top).toBeGreaterThanOrEqual(12);
        expect(rect.left + rect.width).toBeLessThanOrEqual(viewport.width - 12);
        expect(rect.top + rect.height).toBeLessThanOrEqual(viewport.height - 12);
        expect(rect.height).toBeGreaterThan(0);
      }
      expect(overlaps(spotlight, card)).toBe(false);
    }
  });
  it("uses a lateral guide when space exists and an upper guide for the bottom composer", () => {
    expect(
      placeTour({ left: 320, top: 80, width: 210, height: 165 }, { width: 1265, height: 712 }, 230)
        .card.side,
    ).toBe("right");
    expect(
      placeTour({ left: 16, top: 760, width: 358, height: 67 }, { width: 390, height: 844 }, 230)
        .card.side,
    ).toBe("above");
  });
});
