// Foreground request ownership only: no jobs, persistence or provider capacity.
export class InspectionCapacity {
  private active = 0;
  private readonly waiting: {
    signal: AbortSignal;
    abort(): void;
    resolve(release: () => void): void;
  }[] = [];
  async enter(signal: AbortSignal): Promise<() => void> {
    signal.throwIfAborted();
    if (this.active < 2) {
      this.active++;
      return this.release();
    }
    if (this.waiting.length >= 2) throw new RangeError("instance_busy");
    return new Promise((resolve, reject) => {
      const waiter = {
        signal,
        resolve,
        abort: () => {
          const index = this.waiting.indexOf(waiter);
          if (index >= 0) this.waiting.splice(index, 1);
          reject(signal.reason);
        },
      };
      this.waiting.push(waiter);
      signal.addEventListener("abort", waiter.abort, { once: true });
    });
  }
  private release() {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.waiting.shift();
      if (!next) {
        this.active--;
        return;
      }
      next.signal.removeEventListener("abort", next.abort);
      next.resolve(this.release());
    };
  }
}
