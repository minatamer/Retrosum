import { afterEach, describe, expect, it, vi } from "vitest";
import { animateReplyText } from "../apps/frontend/src/features/retro/reply-typing.ts";

afterEach(() => vi.unstubAllGlobals());

function setup(text) {
  let notify;
  let nextId = 0;
  const frames = new Map();
  const disconnect = vi.fn();
  const observe = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback) {
        notify = callback;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  vi.stubGlobal("window", {
    requestAnimationFrame: (callback) => {
      frames.set(++nextId, callback);
      return nextId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const reveal = vi.fn();
  const element = {};
  const dispose = animateReplyText(element, text, reveal);
  return {
    reveal,
    frames,
    disconnect,
    observe,
    element,
    dispose,
    notify: (visible) => notify([{ isIntersecting: visible }]),
    tick: (time) => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(time));
    },
  };
}

describe("Retro reply typewriter lifecycle", () => {
  it("starts on visible entry, then reveals intermediate text and completes", () => {
    const h = setup("Retro is here.");
    expect(h.observe).toHaveBeenCalledWith(h.element);
    h.notify(false);
    h.tick(1000);
    expect(h.reveal).not.toHaveBeenCalled();
    h.notify(true);
    h.tick(2000);
    expect(h.reveal).toHaveBeenLastCalledWith("R");
    h.tick(2036);
    expect(h.reveal).toHaveBeenLastCalledWith("Retro");
    h.tick(2300);
    expect(h.reveal).toHaveBeenLastCalledWith("Retro is here.");
    expect(h.frames.size).toBe(0);
    h.dispose();
  });

  it("never splits a combining character or family emoji", () => {
    const h = setup("e\u0301👨‍👩‍👧‍👦!");
    h.notify(true);
    h.tick(0);
    expect(h.reveal).toHaveBeenLastCalledWith("e\u0301");
    h.tick(9);
    expect(h.reveal).toHaveBeenLastCalledWith("e\u0301👨‍👩‍👧‍👦");
    h.tick(18);
    expect(h.reveal).toHaveBeenLastCalledWith("e\u0301👨‍👩‍👧‍👦!");
    h.dispose();
  });

  it("finishes long replies within the fast bound even after a delayed frame", () => {
    const text = "A long reply. ".repeat(200);
    const h = setup(text);
    h.notify(true);
    h.tick(400);
    expect(h.reveal.mock.lastCall[0]).not.toBe(text);
    h.tick(2200);
    expect(h.reveal).toHaveBeenLastCalledWith(text);
    expect(h.frames.size).toBe(0);
    h.dispose();
  });

  it("does not restart or duplicate frames after repeated visibility notifications", () => {
    const h = setup("A reply");
    h.notify(true);
    h.notify(true);
    expect(h.frames.size).toBe(1);
    h.tick(0);
    h.notify(false);
    h.notify(true);
    h.tick(100);
    expect(h.reveal).toHaveBeenLastCalledWith("A reply");
    expect(h.frames.size).toBe(0);
    h.dispose();
  });

  it("disconnects an offscreen observer and ignores a late callback after disposal", () => {
    const h = setup("Offscreen reply");
    h.dispose();
    expect(h.disconnect).toHaveBeenCalledOnce();
    h.notify(true);
    h.tick(100);
    expect(h.frames.size).toBe(0);
    expect(h.reveal).not.toHaveBeenCalled();
  });

  it("cancels an in-flight frame when the chat collapses or unmounts", () => {
    const h = setup("An unfinished reply");
    h.notify(true);
    h.tick(0);
    expect(h.frames.size).toBe(1);
    h.dispose();
    h.tick(1000);
    expect(h.frames.size).toBe(0);
    expect(h.reveal).toHaveBeenCalledOnce();
    expect(h.disconnect).toHaveBeenCalledTimes(2);
  });
});
