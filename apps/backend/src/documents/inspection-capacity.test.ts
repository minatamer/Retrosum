import { describe, expect, it } from "vitest";
import { InspectionCapacity } from "./inspection-capacity.js";

describe("request-owned PDF inspection capacity", () => {
  it("keeps two active and two waiting requests, rejects a fifth and removes canceled waiters", async () => {
    const capacity = new InspectionCapacity(),
      signal = new AbortController().signal;
    const first = await capacity.enter(signal),
      second = await capacity.enter(signal);
    const cancel = new AbortController(),
      third = capacity.enter(cancel.signal),
      fourth = capacity.enter(signal);
    await expect(capacity.enter(signal)).rejects.toThrow("instance_busy");
    const rejected = expect(third).rejects.toThrow();
    cancel.abort();
    await rejected;
    first();
    const releaseFourth = await fourth;
    first();
    let entered = false;
    const next = capacity.enter(signal).then((release) => {
      entered = true;
      return release;
    });
    await Promise.resolve();
    expect(entered).toBe(false);
    second();
    const releaseNext = await next;
    releaseFourth();
    releaseNext();
    (await capacity.enter(signal))();
  });
  it("a timed-out waiter cannot claim the next slot or obstruct later requests", async () => {
    const capacity = new InspectionCapacity(),
      signal = new AbortController().signal;
    const first = await capacity.enter(signal),
      second = await capacity.enter(signal);
    await expect(capacity.enter(AbortSignal.timeout(10))).rejects.toThrow();
    first();
    const next = await capacity.enter(signal);
    second();
    next();
  });
});
