import { afterEach, describe, expect, it, vi } from "vitest";
import { observeTourAnchor } from "../apps/frontend/src/features/retro/tour-anchor.ts";

afterEach(() => vi.unstubAllGlobals());

function setup() {
  let sequence = 0;
  const frames = new Map();
  vi.stubGlobal("window", {
    requestAnimationFrame(callback) {
      const id = ++sequence;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
  });
  let value = {
    target: {},
    rect: { left: 320, top: 76, width: 240, height: 170 },
    viewport: { width: 1280, height: 720 },
  };
  const read = vi.fn(() => value);
  const publish = vi.fn();
  const tracker = observeTourAnchor(read, publish);
  return {
    tracker,
    read,
    publish,
    frames,
    update(change) {
      value = change(value);
    },
    tick(now) {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(now);
    },
  };
}

describe("tour scroll and anchor synchronization", () => {
  it("never reveals a stationary target before the owned scroll completes", () => {
    const h = setup();
    h.tracker.beginScroll();
    h.tick(0);
    h.tick(400);
    h.tick(640);
    expect(h.publish).not.toHaveBeenCalled();
    h.tracker.completeScroll();
    h.tick(650);
    h.tick(700);
    expect(h.publish).not.toHaveBeenCalled();
    h.tick(750);
    expect(h.publish).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        rect: { left: 320, top: 76, width: 240, height: 170 },
      }),
    );
    h.tracker.dispose();
  });

  it("reveals no-op scrolls after stable frames without needing a scrollend event", () => {
    const h = setup();
    h.tracker.beginScroll();
    h.tracker.completeScroll();
    h.tick(0);
    h.tick(100);
    h.tick(1000);
    expect(h.publish).toHaveBeenCalledTimes(1);
    h.tracker.dispose();
  });

  it("waits for transform motion, including cumulative subpixel drift", () => {
    const h = setup();
    h.tick(0);
    for (let index = 1; index <= 10; index++) {
      h.update((value) => ({ ...value, rect: { ...value.rect, top: 76 + index * 0.1 } }));
      h.tick(index * 20);
    }
    expect(h.publish).not.toHaveBeenCalled();
    h.tick(280);
    expect(h.publish).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        rect: expect.objectContaining({ top: 77 }),
      }),
    );
    h.tracker.dispose();
  });

  it("withdraws stale geometry on layout/viewport changes and reanchors after settling", () => {
    const h = setup();
    h.tick(0);
    h.tick(100);
    h.update((value) => ({
      ...value,
      rect: { ...value.rect, top: 96, height: 210 },
      viewport: { width: 320, height: 640 },
    }));
    h.tick(120);
    expect(h.publish).toHaveBeenLastCalledWith(null);
    h.tick(200);
    expect(h.publish).toHaveBeenCalledTimes(2);
    h.tick(220);
    expect(h.publish).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rect: expect.objectContaining({ top: 96, height: 210 }),
        viewport: { width: 320, height: 640 },
      }),
    );
    h.tracker.beginScroll();
    expect(h.publish).toHaveBeenLastCalledWith(null);
    h.tick(1000);
    expect(h.publish).toHaveBeenCalledTimes(4);
    h.tracker.dispose();
  });

  it("does not reuse a missing or replaced target even with identical bounds", () => {
    const h = setup();
    h.tick(0);
    h.tick(100);
    h.update((value) => ({ ...value, target: {} }));
    h.tick(120);
    expect(h.publish).toHaveBeenLastCalledWith(null);
    h.tick(220);
    expect(h.publish).toHaveBeenCalledTimes(3);
    h.update(() => null);
    h.tick(240);
    expect(h.publish).toHaveBeenLastCalledWith(null);
    h.tick(1000);
    expect(h.publish).toHaveBeenCalledTimes(4);
    h.tracker.dispose();
  });

  it("cancels its owned frame and cannot publish a late frame after disposal", () => {
    const h = setup();
    h.tick(0);
    const lateFrame = h.frames.values().next().value;
    h.tracker.dispose();
    expect(h.frames.size).toBe(0);
    lateFrame(1000);
    expect(h.read).toHaveBeenCalledTimes(1);
    expect(h.publish).not.toHaveBeenCalled();
  });
});
