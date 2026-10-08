import { describe, it, expect, vi } from "vitest";
import {
  PROCESSING_DISCLOSURE_VERSION,
  workspaceIdSchema,
  type GrantRequest,
} from "@retrosum/contracts";
import { PaidAdmission, requestInputHash } from "./admission.js";
import { reservationMicroUsd } from "../providers/policy.js";
const secret = "local-injected-test-secret-32-characters";
function harness(enabled = true, ceiling = 2_500_000) {
  let now = 1000000;
  const verify = vi.fn(async () => true),
    ledger = new PaidAdmission(
      secret,
      () => now,
      () => enabled,
      verify,
      ceiling,
    );
  return {
    ledger,
    verify,
    advance: (ms: number) => {
      now += ms;
    },
    session: (workspaceId = "workspace_a") => ledger.session(workspaceId, null).cookie,
  };
}
function action(
  i: number,
  action: GrantRequest["action"] = "chat",
  extra: Partial<GrantRequest> = {},
): GrantRequest {
  return {
    workspaceId: workspaceIdSchema.parse("workspace_a"),
    operationId: `op_${i}`,
    action,
    inputHash: requestInputHash({ i }),
    retry: false,
    disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
    consent: true,
    challengeToken: "injected",
    ...extra,
  };
}
const identity = (r: GrantRequest) => ({
  action: r.action,
  workspaceId: r.workspaceId,
  operationId: r.operationId,
  inputHash: r.inputHash,
  retry: r.retry,
  ...(r.documentHash ? { documentHash: r.documentHash } : {}),
});
const issue = (h: ReturnType<typeof harness>, cookie: string, r: GrantRequest) =>
  h.ledger.issue(cookie, r, h.ledger.source("immediate-ingress"), new AbortController().signal);
describe("one-use admission and conservative reservations", () => {
  it("paid-off rejects before challenge or dispatch; all priced ceilings remain explicit", async () => {
    const h = harness(false);
    expect(() => h.session()).toThrow("paid_disabled");
    await expect(issue(h, "invalid", action(1))).rejects.toThrow("paid_disabled");
    expect(h.verify).not.toHaveBeenCalled();
    expect(reservationMicroUsd("extract")).toBe(108000);
    expect(reservationMicroUsd("chat")).toBe(117000);
    expect(11 * reservationMicroUsd("extract") + 10 * reservationMicroUsd("chat")).toBe(2358000);
  });
  it("binds exact run/workspace/action/input, rejects tampering and consumes atomically before calls", async () => {
    const h = harness(),
      cookie = h.session(),
      r = action(1),
      g = await issue(h, cookie, r),
      dispatch = vi.fn();
    const other = h.session("workspace_b");
    expect(() => h.ledger.consume(other, g.grant, identity(r))).toThrow("invalid_grant");
    expect(() =>
      h.ledger.consume(cookie, g.grant, identity({ ...r, inputHash: "a".repeat(64) })),
    ).toThrow("invalid_grant");
    expect(() => h.ledger.preflight(cookie, g.grant, "extract")).toThrow("invalid_grant");
    expect(() => h.ledger.consume(cookie, g.grant.slice(0, -3) + "xyz", identity(r))).toThrow();
    expect(dispatch).not.toHaveBeenCalled();
    const release = h.ledger.consume(cookie, g.grant, identity(r));
    dispatch();
    release();
    expect(() => h.ledger.consume(cookie, g.grant, identity(r))).toThrow("operation_replayed");
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
  it("refresh does not renew a run, reset clears outstanding grants without replenishing consumed work", async () => {
    const h = harness(),
      cookie = h.session(),
      first = h.ledger.session("workspace_a", cookie),
      r = action(1),
      g = await issue(h, cookie, r);
    h.ledger.consume(cookie, g.grant, identity(r))();
    h.advance(61000);
    expect(h.ledger.session("workspace_a", cookie).expiresAt).toBe(first.expiresAt);
    const pending = await issue(h, cookie, action(2));
    h.ledger.revoke(cookie, "workspace_a");
    expect(() => h.ledger.preflight(cookie, pending.grant, "chat")).toThrow("invalid_grant");
    await expect(issue(h, cookie, r)).rejects.toThrow("operation_replayed");
    expect(() => h.ledger.session("workspace_b", cookie)).toThrow("workspace_mismatch");
    expect(() => h.ledger.revoke(cookie, "workspace_b")).toThrow("workspace_mismatch");
  });
  it("prior boot and expired grants fail closed; expired allowance cannot be silently renewed", async () => {
    const h = harness(),
      cookie = h.session(),
      r = action(1),
      g = await issue(h, cookie, r),
      newBoot = harness();
    expect(() => newBoot.ledger.preflight(cookie, g.grant, "chat")).toThrow("boot_changed");
    h.advance(120000);
    expect(() => h.ledger.preflight(cookie, g.grant, "chat")).toThrow("grant_expired");
    h.advance(1800000);
    expect(() => h.ledger.session("workspace_a", cookie)).toThrow("admission_expired");
  });
  it("one global lease spans action classes and rejected concurrency remains deliberately retryable", async () => {
    const h = harness(),
      cookie = h.session(),
      a = action(1),
      b = action(2, "extract", { documentHash: "b".repeat(64) }),
      ga = await issue(h, cookie, a),
      gb = await issue(h, cookie, b);
    const release = h.ledger.consume(cookie, ga.grant, identity(a));
    expect(() => h.ledger.consume(cookie, gb.grant, identity(b))).toThrow("instance_busy");
    release();
    const second = h.ledger.consume(cookie, gb.grant, identity(b));
    release();
    second();
  });
  it("unknown outcomes retain reservations; a lower controlled envelope rejects before another call", async () => {
    const h = harness(true, 120000),
      cookie = h.session(),
      a = action(1),
      g = await issue(h, cookie, a);
    h.ledger.consume(cookie, g.grant, identity(a))(); // Lost response, no refund or automatic retry.
    const next = action(2),
      pending = await issue(h, cookie, next);
    expect(() => h.ledger.consume(cookie, pending.grant, identity(next))).toThrow(
      "spend_allowance_used",
    );
    h.ledger.revoke(cookie, "workspace_a");
    h.advance(61000);
    const again = await issue(h, cookie, next);
    expect(() => h.ledger.consume(cookie, again.grant, identity(next))).toThrow(
      "spend_allowance_used",
    );
  });
  it("enforces ten exact originals and one deliberate retry while rejecting fake retry identities", async () => {
    const h = harness(),
      cookie = h.session();
    for (let i = 0; i < 10; i++) {
      h.advance(61000);
      const r = action(i, "extract", { documentHash: requestInputHash({ file: i }) }),
        g = await issue(h, cookie, r);
      h.ledger.consume(cookie, g.grant, identity(r))();
    }
    h.advance(61000);
    const extra = action(10, "extract", { documentHash: requestInputHash({ file: 10 }) }),
      g = await issue(h, cookie, extra);
    expect(() => h.ledger.consume(cookie, g.grant, identity(extra))).toThrow(
      "document_allowance_used",
    );
    const retry = action(11, "extract", {
        documentHash: requestInputHash({ file: 0 }),
        retry: true,
      }),
      gr = await issue(h, cookie, retry);
    h.ledger.consume(cookie, gr.grant, identity(retry))();
    const duplicate = action(12, "extract", { documentHash: retry.documentHash!, retry: true }),
      gd = await issue(h, cookie, duplicate);
    expect(() => h.ledger.consume(cookie, gd.grant, identity(duplicate))).toThrow(
      "document_allowance_used",
    );
  });
  it("bounds eight turns, two insight generations and immediate-source attempts without using forwarded identity", async () => {
    const h = harness(),
      cookie = h.session();
    for (let i = 0; i < 8; i++) {
      h.advance(61000);
      const r = action(i),
        g = await issue(h, cookie, r);
      h.ledger.consume(cookie, g.grant, identity(r))();
    }
    const ninth = action(9),
      ng = await issue(h, cookie, ninth);
    expect(() => h.ledger.consume(cookie, ng.grant, identity(ninth))).toThrow(
      "turn_allowance_used",
    );
    for (let i = 10; i < 12; i++) {
      h.advance(61000);
      const r = action(i, "insights"),
        g = await issue(h, cookie, r);
      h.ledger.consume(cookie, g.grant, identity(r))();
    }
    const third = action(12, "insights"),
      tg = await issue(h, cookie, third);
    expect(() => h.ledger.consume(cookie, tg.grant, identity(third))).toThrow(
      "turn_allowance_used",
    );
    const limit = harness();
    for (let i = 0; i < 6; i++) limit.ledger.attempt(limit.ledger.source("socket"));
    expect(() => limit.ledger.attempt(limit.ledger.source("socket"))).toThrow("rate_limited");
  });
  it("rejects failed and cancelled challenge verification without minting a grant", async () => {
    const h = harness(),
      cookie = h.session();
    h.verify.mockResolvedValue(false);
    await expect(issue(h, cookie, action(1))).rejects.toThrow("challenge_rejected");
    h.verify.mockResolvedValue(true);
    const abort = new AbortController();
    abort.abort();
    await expect(
      h.ledger.issue(cookie, action(2), h.ledger.source("socket"), abort.signal),
    ).rejects.toThrow();
  });
  it("reset revokes a challenge that was already awaiting verification", async () => {
    let verified!: (value: boolean) => void;
    const h = harness(),
      cookie = h.session();
    h.verify.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          verified = resolve;
        }),
    );
    const pending = issue(h, cookie, action(1));
    h.ledger.revoke(cookie, "workspace_a");
    verified(true);
    await expect(pending).rejects.toThrow("invalid_grant");
  });
});
