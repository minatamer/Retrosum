/** Content-free ownership of currently running requests; never stores graphs, files or output. */
export class OperationLifecycle {
  private readonly active = new Map<string, Set<AbortController>>();
  track(workspaceId: string, operation: AbortController) {
    if (this.active.size >= 1000 && !this.active.has(workspaceId))
      throw new RangeError("instance_busy");
    const set = this.active.get(workspaceId) ?? new Set<AbortController>();
    set.add(operation);
    this.active.set(workspaceId, set);
    return () => {
      set.delete(operation);
      if (!set.size) this.active.delete(workspaceId);
    };
  }
  revoke(workspaceId: string) {
    for (const operation of this.active.get(workspaceId) ?? []) operation.abort();
    this.active.delete(workspaceId);
  }
}
