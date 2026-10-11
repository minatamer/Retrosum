import { describe, it, expect, vi } from "vitest";
import {
  PROCESSING_DISCLOSURE_VERSION,
  workspaceIdSchema,
  type GrantRequest,
  type ExtractionBatchRequest,
  type BatchGrantRequest,
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

function batch(h: ReturnType<typeof harness>, cookie: string, count = 10) {
  const operations = Array.from({ length: count }, (_, i) => ({
    operationId: `batch_op_${i}`,
    inputHash: requestInputHash({ input: i }),
    documentHash: requestInputHash({ pdf: i }),
    retry: false,
  }));
  const request: ExtractionBatchRequest = {
    workspaceId: workspaceIdSchema.parse("workspace_a"),
    action: "extract",
    operationId: "batch_1",
    inputHash: requestInputHash(operations),
    retry: false,
    operations,
    challengeToken: "injected",
    disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
    consent: true,
  };
  return {
    request,
    start: () => h.ledger.issueBatch(cookie, request, new AbortController().signal),
  };
}
describe("exact selected-batch verification", () => {
  it("verifies ten exact identities once and mints fresh single-use grants after earlier grants would expire", async () => {
    const h = harness(),
      cookie = h.session(),
      b = batch(h, cookie),
      approval = await b.start();
    expect(h.verify).toHaveBeenCalledTimes(1);
    expect(() => h.ledger.preflight(cookie, approval.grant, "extract")).toThrow();
    for (const op of b.request.operations) {
      h.advance(30_000);
      const input: BatchGrantRequest = {
        ...op,
        workspaceId: b.request.workspaceId,
        action: "extract" as const,
        batchGrant: approval.grant,
        disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
        consent: true as const,
      };
      const grant = h.ledger.issueFromBatch(cookie, input);
      expect(grant.expiresAt).toBe(
        1_000_000 + 30_000 * (b.request.operations.indexOf(op) + 1) + 120_000,
      );
      expect(() => h.ledger.issueFromBatch(cookie, input)).toThrow("invalid_grant");
      h.ledger.consume(cookie, grant.grant, {
        ...op,
        workspaceId: b.request.workspaceId,
        action: "extract",
      })();
      expect(() =>
        h.ledger.consume(cookie, grant.grant, {
          ...op,
          workspaceId: b.request.workspaceId,
          action: "extract",
        }),
      ).toThrow("operation_replayed");
    }
    expect(h.verify).toHaveBeenCalledTimes(1);
  });
  it("rejects altered manifests and duplicate operation/document identities before verifying", async () => {
    for (const mutation of ["hash", "operation", "document"] as const) {
      const h = harness(),
        b = batch(h, h.session());
      if (mutation === "hash") b.request.operations[0]!.inputHash = "a".repeat(64);
      if (mutation === "operation")
        b.request.operations[1]!.operationId = b.request.operations[0]!.operationId;
      if (mutation === "document")
        b.request.operations[1]!.documentHash = b.request.operations[0]!.documentHash;
      await expect(b.start()).rejects.toThrow();
      expect(h.verify).not.toHaveBeenCalled();
    }
  });
  it("a batch approval cannot widen to a different hash, document, retry flag, operation or workspace", async () => {
    const h = harness(),
      cookie = h.session(),
      b = batch(h, cookie),
      approval = await b.start();
    const input: BatchGrantRequest = {
      ...b.request.operations[0]!,
      workspaceId: b.request.workspaceId,
      action: "extract" as const,
      batchGrant: approval.grant,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      consent: true as const,
    };
    for (const change of [
      { inputHash: "a".repeat(64) },
      { documentHash: "a".repeat(64) },
      { retry: true },
      { operationId: "not_selected" },
      { workspaceId: workspaceIdSchema.parse("workspace_b") },
    ])
      expect(() => h.ledger.issueFromBatch(cookie, { ...input, ...change })).toThrow(
        "invalid_grant",
      );
    expect(() => h.ledger.issueFromBatch(h.session("workspace_b"), input)).toThrow("invalid_grant");
    const grant = h.ledger.issueFromBatch(cookie, input);
    h.advance(120_000);
    expect(() => h.ledger.preflight(cookie, grant.grant, "extract")).toThrow("grant_expired");
  });
  it("reset, batch expiry and prior boot invalidate unsubmitted approved identities", async () => {
    for (const event of ["reset", "expiry", "boot"] as const) {
      const h = harness(),
        cookie = h.session(),
        b = batch(h, cookie),
        approval = await b.start();
      const input: BatchGrantRequest = {
        ...b.request.operations[0]!,
        workspaceId: b.request.workspaceId,
        action: "extract" as const,
        batchGrant: approval.grant,
        disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
        consent: true as const,
      };
      if (event === "reset") h.ledger.revoke(cookie, "workspace_a");
      if (event === "expiry") h.advance(600_000);
      expect(() =>
        (event === "boot" ? harness().ledger : h.ledger).issueFromBatch(cookie, input),
      ).toThrow();
    }
  });
  it("late verification after reset cannot restore the manifest; failed verification mints nothing", async () => {
    const h = harness(),
      cookie = h.session(),
      b = batch(h, cookie);
    let finish!: (value: boolean) => void;
    h.verify.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = b.start();
    h.ledger.revoke(cookie, "workspace_a");
    finish(true);
    await expect(pending).rejects.toThrow("invalid_grant");
    h.verify.mockResolvedValue(false);
    await expect(b.start()).rejects.toThrow("challenge_rejected");
  });
  it("bounds combined approved identities and issued grants, and retains full dispatch reservations", async () => {
    const h = harness(true, reservationMicroUsd("extract")),
      cookie = h.session(),
      b = batch(h, cookie),
      approval = await b.start();
    await b.start();
    await expect(b.start()).rejects.toThrow("admission_full");
    const input = (n: number): BatchGrantRequest => ({
      ...b.request.operations[n]!,
      workspaceId: b.request.workspaceId,
      action: "extract" as const,
      batchGrant: approval.grant,
      disclosureVersion: PROCESSING_DISCLOSURE_VERSION,
      consent: true as const,
    });
    const first = h.ledger.issueFromBatch(cookie, input(0)),
      second = h.ledger.issueFromBatch(cookie, input(1));
    const id = (n: number) => ({
      ...b.request.operations[n]!,
      workspaceId: b.request.workspaceId,
      action: "extract" as const,
    });
    h.ledger.consume(cookie, first.grant, id(0))();
    expect(() => h.ledger.consume(cookie, second.grant, id(1))).toThrow("spend_allowance_used");
  });
  it("paid-off and aborted verification fail before a usable approval", async () => {
    const h = harness(false),
      b = batch(h, "invalid");
    await expect(b.start()).rejects.toThrow("paid_disabled");
    expect(h.verify).not.toHaveBeenCalled();
    const live = harness(),
      cookie = live.session(),
      next = batch(live, cookie),
      abort = new AbortController();
    abort.abort();
    await expect(live.ledger.issueBatch(cookie, next.request, abort.signal)).rejects.toThrow();
    expect(live.verify).not.toHaveBeenCalled();
  });
});
const issue = (h: ReturnType<typeof harness>, cookie: string, r: GrantRequest) =>
  h.ledger.issue(cookie, r, new AbortController().signal);
describe("one-use admission and conservative reservations", () => {
  it("paid-off rejects before challenge or dispatch; all priced ceilings remain explicit", async () => {
    const h = harness(false);
    expect(() => h.session()).toThrow("paid_disabled");
    await expect(issue(h, "invalid", action(1))).rejects.toThrow("paid_disabled");
    expect(h.verify).not.toHaveBeenCalled();
    expect(reservationMicroUsd("extract")).toBe(120000);
    expect(reservationMicroUsd("chat")).toBe(135000);
    expect(11 * reservationMicroUsd("extract") + 10 * reservationMicroUsd("chat")).toBe(2670000);
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
  it("four global leases span action classes; a fifth waits and stale releases cannot free new work", async () => {
    const h = harness(),
      cookie = h.session();
    const actions = [
      action(1),
      action(2, "extract", { documentHash: "b".repeat(64) }),
      action(3, "insights"),
      action(4),
      action(5),
    ];
    const grants: Awaited<ReturnType<typeof issue>>[] = [];
    for (const a of actions) grants.push(await issue(h, cookie, a));
    const releases = actions
      .slice(0, 4)
      .map((a, i) => h.ledger.consume(cookie, grants[i]!.grant, identity(a)));
    expect(() => h.ledger.consume(cookie, grants[4]!.grant, identity(actions[4]!))).toThrow(
      "instance_busy",
    );
    expect(() => h.ledger.consume(cookie, grants[1]!.grant, identity(actions[1]!))).toThrow(
      "operation_replayed",
    );
    releases[0]!();
    const fifth = h.ledger.consume(cookie, grants[4]!.grant, identity(actions[4]!));
    releases[0]!();
    const sixth = action(6),
      pending = await issue(h, cookie, sixth);
    expect(() => h.ledger.consume(cookie, pending.grant, identity(sixth))).toThrow("instance_busy");
    for (const release of releases.slice(1)) release();
    fifth();
    h.ledger.consume(cookie, pending.grant, identity(sixth))();
  });
  it("concurrent dispatch still reserves the full combined cost before either outcome", async () => {
    const h = harness(true, 2 * reservationMicroUsd("extract") - 1),
      cookie = h.session(),
      a = action(1, "extract", { documentHash: "a".repeat(64) }),
      b = action(2, "extract", { documentHash: "b".repeat(64) }),
      ga = await issue(h, cookie, a),
      gb = await issue(h, cookie, b);
    const release = h.ledger.consume(cookie, ga.grant, identity(a));
    expect(() => h.ledger.consume(cookie, gb.grant, identity(b))).toThrow("spend_allowance_used");
    release();
    expect(() => h.ledger.consume(cookie, gb.grant, identity(b))).toThrow("spend_allowance_used");
  });
  it("unknown outcomes retain reservations; a lower controlled envelope rejects before another call", async () => {
    const h = harness(true, reservationMicroUsd("chat")),
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
  it("bounds eight turns and two insight generations", async () => {
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
  });
  it("rejects failed and cancelled challenge verification without minting a grant", async () => {
    const h = harness(),
      cookie = h.session();
    h.verify.mockResolvedValue(false);
    await expect(issue(h, cookie, action(1))).rejects.toThrow("challenge_rejected");
    h.verify.mockResolvedValue(true);
    const abort = new AbortController();
    abort.abort();
    await expect(h.ledger.issue(cookie, action(2), abort.signal)).rejects.toThrow();
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

describe("service entry and independent run windows", () => {
  it("allows neighboring runs after one run exhausts its challenge window, without renewing that run on reset", async () => {
    const h = harness(),
      cookie = h.session();
    h.verify.mockResolvedValue(false);
    for (let i = 0; i < 6; i++)
      await expect(issue(h, cookie, action(i))).rejects.toThrow("challenge_rejected");
    await expect(issue(h, cookie, action(7))).rejects.toThrow("rate_limited");
    h.ledger.revoke(cookie, "workspace_a");
    await expect(issue(h, cookie, action(8))).rejects.toThrow("rate_limited");
    const neighbor = h.session("workspace_b");
    h.verify.mockResolvedValue(true);
    await expect(
      issue(
        h,
        neighbor,
        action(9, "chat", { workspaceId: workspaceIdSchema.parse("workspace_b") }),
      ),
    ).resolves.toHaveProperty("grant");
    expect(h.verify).toHaveBeenCalledTimes(7);
  });
  it("retains bounded minute/hour service ceilings and releases expired entries", () => {
    const h = harness();
    for (let window = 0; window < 5; window++) {
      for (let i = 0; i < 120; i++) h.ledger.attempt();
      expect(() => h.ledger.attempt()).toThrow("rate_limited");
      h.advance(60_001);
    }
    expect(() => h.ledger.attempt()).toThrow("rate_limited");
    h.advance(3_600_000);
    expect(() => h.ledger.attempt()).not.toThrow();
  });
  it("complete validation is side-effect free and shares all identity/replay checks with consumption", async () => {
    const h = harness(),
      cookie = h.session(),
      r = action(1, "extract", { documentHash: "b".repeat(64) }),
      g = await issue(h, cookie, r);
    for (const change of [
      { workspaceId: "workspace_wrong" },
      { operationId: "wrong" },
      { inputHash: "c".repeat(64) },
      { documentHash: "c".repeat(64) },
      { retry: true },
      { action: "chat" as const },
    ])
      expect(() => h.ledger.validate(cookie, g.grant, { ...identity(r), ...change })).toThrow(
        "invalid_grant",
      );
    for (let i = 0; i < 5; i++) h.ledger.validate(cookie, g.grant, identity(r));
    h.ledger.consume(cookie, g.grant, identity(r))();
    expect(() => h.ledger.validate(cookie, g.grant, identity(r))).toThrow("operation_replayed");
  });
});
