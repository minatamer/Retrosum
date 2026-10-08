type TurnBudget = { expiresAt: number; operations: Set<string> };
export class RetroAdmission {
  private readonly budgets = new Map<string, TurnBudget>();
  constructor(private readonly now: () => number) {}
  reserve(workspaceId: string, operationId: string) {
    const now = this.now();
    for (const [id, budget] of this.budgets) if (budget.expiresAt <= now) this.budgets.delete(id);
    let budget = this.budgets.get(workspaceId);
    if (!budget) {
      if (this.budgets.size >= 1000) throw new RangeError("admission_full");
      budget = { expiresAt: now + 30 * 60 * 1000, operations: new Set() };
      this.budgets.set(workspaceId, budget);
    }
    if (budget.operations.has(operationId)) throw new RangeError("operation_replayed");
    if (budget.operations.size >= 8) throw new RangeError("turn_allowance_used");
    budget.operations.add(operationId);
  }
}
