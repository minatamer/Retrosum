import { MAX_CONCURRENT_OPERATIONS } from "@retrosum/contracts";

type Budget = {
  expiresAt: number;
  originals: Set<string>;
  operations: Set<string>;
  retries: number;
};
// Bounded process-local counters contain no PDF bytes, records or provider output.
export class ExtractionAdmission {
  private readonly budgets = new Map<string, Budget>();
  private active = 0;
  private intakeActive = 0;
  constructor(private readonly now: () => number) {}
  enter() {
    if (this.intakeActive >= MAX_CONCURRENT_OPERATIONS) throw new RangeError("instance_busy");
    this.intakeActive++;
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.intakeActive--;
      }
    };
  }
  reserve(workspaceId: string, operationId: string, hash: string, retry: boolean) {
    const now = this.now();
    for (const [id, budget] of this.budgets) if (budget.expiresAt <= now) this.budgets.delete(id);
    if (this.active >= MAX_CONCURRENT_OPERATIONS) throw new RangeError("instance_busy");
    let budget = this.budgets.get(workspaceId);
    if (!budget) {
      if (this.budgets.size >= 1000) throw new RangeError("admission_full");
      budget = {
        expiresAt: now + 2 * 60 * 60 * 1000,
        originals: new Set(),
        operations: new Set(),
        retries: 0,
      };
      this.budgets.set(workspaceId, budget);
    }
    if (budget.operations.has(operationId)) throw new RangeError("operation_replayed");
    if (
      retry
        ? budget.retries >= 1 || !budget.originals.has(hash)
        : budget.originals.has(hash) || budget.originals.size >= 10
    )
      throw new RangeError("document_allowance_used");
    budget.operations.add(operationId);
    budget.originals.add(hash);
    if (retry) budget.retries++;
    this.active++;
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.active--;
      }
    };
  }
}
