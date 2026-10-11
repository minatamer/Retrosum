import "server-only";
import { MAX_CONCURRENT_OPERATIONS } from "@retrosum/contracts";

/** Process-local work limits, not visitor identity or a network-flood guarantee. */
export class FrontendRequestGate {
  private reads: number[] = [];
  private writes: number[] = [];
  private active = 0;
  constructor(private readonly now: () => number = Date.now) {}
  admit(method: string) {
    const read = method === "GET" || method === "HEAD";
    const times = (read ? this.reads : this.writes).filter((t) => t > this.now() - 60_000);
    if (read) this.reads = times;
    else this.writes = times;
    if (times.length >= 120) return false;
    times.push(this.now());
    return true;
  }
  enter() {
    if (this.active >= MAX_CONCURRENT_OPERATIONS) return;
    this.active++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
    };
  }
}

export const frontendRequestGate = new FrontendRequestGate();

export function requestLimitResponse() {
  return Response.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Retry-After": "60",
      },
    },
  );
}
