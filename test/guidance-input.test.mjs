import { afterEach, describe, expect, it, vi } from "vitest";
import { observeGuidanceInput } from "../apps/frontend/src/features/retro/guidance-input.ts";

afterEach(() => vi.unstubAllGlobals());

function setup(touring = true) {
  const events = new EventTarget();
  vi.stubGlobal("window", events);
  const stop = vi.fn();
  const interruptScroll = vi.fn();
  const dispose = observeGuidanceInput({ touring, isScrolling: () => true, interruptScroll, stop });
  return { events, stop, interruptScroll, dispose };
}

describe("tour input persistence", () => {
  it.each(["wheel", "touchstart", "touchmove"])(
    "keeps the tour active on %s while releasing automatic scrolling",
    (type) => {
      const h = setup();
      h.events.dispatchEvent(new Event(type));
      expect(h.stop).not.toHaveBeenCalled();
      expect(h.interruptScroll).toHaveBeenCalledOnce();
      h.dispose();
    },
  );

  it.each(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "])(
    "keeps the same tour active on the %j scroll key",
    (key) => {
      const h = setup();
      const event = new Event("keydown", { cancelable: true });
      Object.defineProperty(event, "key", { value: key });
      h.events.dispatchEvent(event);
      expect(h.stop).not.toHaveBeenCalled();
      expect(h.interruptScroll).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(false);
      h.dispose();
    },
  );

  it("keeps guide-copy scrolling active and lets it release an in-flight reposition", () => {
    const h = setup();
    const event = new Event("wheel");
    Object.defineProperty(event, "target", {
      value: { closest: () => ({ id: "retro-tour-card" }) },
    });
    h.events.dispatchEvent(event);
    expect(h.stop).not.toHaveBeenCalled();
    expect(h.interruptScroll).toHaveBeenCalledOnce();
    h.dispose();
  });

  it("still dismisses through Escape without treating ordinary typing as scrolling", () => {
    const h = setup();
    for (const key of ["a", "Enter", "Tab", "Escape"]) {
      const event = new Event("keydown");
      Object.defineProperty(event, "key", { value: key });
      h.events.dispatchEvent(event);
    }
    expect(h.stop).toHaveBeenCalledOnce();
    expect(h.interruptScroll).not.toHaveBeenCalled();
    h.dispose();
  });

  it("still dismisses a temporary explanation highlight when the visitor scrolls away", () => {
    const h = setup(false);
    h.events.dispatchEvent(new Event("wheel"));
    expect(h.stop).toHaveBeenCalledOnce();
    expect(h.interruptScroll).not.toHaveBeenCalled();
    h.dispose();
  });

  it("removes all input listeners when guidance is disposed", () => {
    const h = setup();
    h.dispose();
    for (const type of ["wheel", "touchstart", "touchmove", "keydown"]) {
      const event = new Event(type);
      Object.defineProperty(event, "key", { value: "Escape" });
      h.events.dispatchEvent(event);
    }
    expect(h.stop).not.toHaveBeenCalled();
    expect(h.interruptScroll).not.toHaveBeenCalled();
  });
});
