export type SessionLease = { acquired: boolean; release: () => void | Promise<void> };
/** The exclusive Web Lock lasts for this document, and releases on reload/close. */
export async function acquireSessionOwnership(
  id: string,
  locks: LockManager | undefined,
): Promise<SessionLease> {
  if (!locks) return { acquired: false, release: () => undefined };
  let release: () => void = () => undefined;
  let settle: (value: SessionLease) => void = () => undefined;
  const result = new Promise<SessionLease>((resolve) => {
    settle = resolve;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const request = locks
    .request(`retrosum:${id}`, { mode: "exclusive", ifAvailable: true }, async (lock) => {
      settle({
        acquired: Boolean(lock),
        release: async () => {
          release();
          await request;
        },
      });
      if (lock) await held;
    })
    .catch(() => settle({ acquired: false, release }));
  void request;
  return result;
}
