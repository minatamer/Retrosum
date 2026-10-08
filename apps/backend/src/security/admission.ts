import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  grantRequestSchema,
  inputHashSchema,
  paidActionSchema,
  workspaceIdSchema,
  type GrantRequest,
  type PaidAction,
} from "@retrosum/contracts";
import { reservationMicroUsd, SPEND_POLICY } from "../providers/policy.js";
const sessionClaims = z.strictObject({
  run: z.string().uuid(),
  epoch: z.string().uuid(),
  expiresAt: z.number().int(),
});
const grantClaims = z.strictObject({
  ...sessionClaims.shape,
  nonce: z.string().uuid(),
  workspaceId: workspaceIdSchema,
  action: paidActionSchema,
  operationId: z.string().min(1).max(100),
  inputHash: inputHashSchema,
  documentHash: inputHashSchema.optional(),
  retry: z.boolean(),
});
type Claims = z.infer<typeof grantClaims>;
type Run = {
  workspaceId: string;
  expiresAt: number;
  originals: Set<string>;
  operations: Set<string>;
  retries: number;
  chat: number;
  insights: number;
  reserved: number;
  grants: Map<string, Claims>;
  generation: number;
};
export type ChallengeVerifier = (request: GrantRequest, signal: AbortSignal) => Promise<boolean>;
export type ActionIdentity = {
  action: PaidAction;
  workspaceId: string;
  operationId: string;
  inputHash: string;
  documentHash?: string;
  retry: boolean;
};
export function requestInputHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

/** Expiring content-free operational memory. Never a person/global/account spending cap. */
export class PaidAdmission {
  readonly epoch = randomUUID();
  private readonly runs = new Map<string, Run>();
  private readonly sources = new Map<string, number[]>();
  private starts: number[] = [];
  private active: string | null = null;
  constructor(
    private readonly secret: string,
    private readonly now: () => number,
    private readonly enabled: () => boolean,
    private readonly verifyChallenge: ChallengeVerifier,
    private readonly ceilingMicroUsd: number = SPEND_POLICY.runMicroUsd,
  ) {}
  private gate() {
    if (!this.enabled() || this.secret.length < 32) throw new RangeError("paid_disabled");
  }
  private sweep() {
    const now = this.now();
    for (const [id, run] of this.runs) {
      if (run.expiresAt <= now) this.runs.delete(id);
      else
        for (const [nonce, grant] of run.grants)
          if (grant.expiresAt <= now) run.grants.delete(nonce);
    }
    for (const [key, times] of this.sources) {
      const retained = times.filter((t) => t > now - 3_600_000);
      if (retained.length) this.sources.set(key, retained);
      else this.sources.delete(key);
    }
    this.starts = this.starts.filter((t) => t > now - 3_600_000);
  }
  source(address: string) {
    return createHmac("sha256", this.secret).update(address).digest("hex");
  }
  attempt(source: string) {
    this.gate();
    this.sweep();
    const now = this.now(),
      times = this.sources.get(source) ?? [];
    if (times.filter((t) => t > now - 60_000).length >= 6 || times.length >= 30)
      throw new RangeError("rate_limited");
    if (this.sources.size >= 1000 && !this.sources.has(source))
      throw new RangeError("admission_full");
    times.push(now);
    this.sources.set(source, times);
  }
  private sign(value: unknown) {
    const body = Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${body}.${createHmac("sha256", this.secret).update(body).digest("base64url")}`;
  }
  private decode(token: string) {
    if (token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(token))
      throw new RangeError("invalid_grant");
    const [body, signature] = token.split(".");
    const expected = createHmac("sha256", this.secret).update(body!).digest(),
      supplied = Buffer.from(signature!, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
      throw new RangeError("invalid_grant");
    return JSON.parse(Buffer.from(body!, "base64url").toString("utf8")) as unknown;
  }
  private run(cookie: string) {
    const claims = sessionClaims.parse(this.decode(cookie));
    if (claims.epoch !== this.epoch) throw new RangeError("boot_changed");
    const run = this.runs.get(claims.run);
    if (!run || claims.expiresAt !== run.expiresAt || run.expiresAt <= this.now())
      throw new RangeError("admission_expired");
    return { run, id: claims.run };
  }
  session(workspaceId: string, cookie: string | null) {
    this.gate();
    this.sweep();
    workspaceIdSchema.parse(workspaceId);
    if (cookie) {
      const { run } = this.run(cookie);
      if (run.workspaceId !== workspaceId) throw new RangeError("workspace_mismatch");
      return { cookie, expiresAt: run.expiresAt }; // Never renew the allowance on refresh.
    }
    if (this.runs.size >= 1000) throw new RangeError("admission_full");
    const run = randomUUID(),
      expiresAt = this.now() + 1_800_000;
    this.runs.set(run, {
      workspaceId,
      expiresAt,
      originals: new Set(),
      operations: new Set(),
      retries: 0,
      chat: 0,
      insights: 0,
      reserved: 0,
      grants: new Map(),
      generation: 0,
    });
    return { cookie: this.sign({ run, expiresAt, epoch: this.epoch }), expiresAt };
  }
  async issue(cookie: string, input: GrantRequest, source: string, signal: AbortSignal) {
    this.attempt(source);
    const request = grantRequestSchema.parse(input),
      { run, id } = this.run(cookie);
    if (run.workspaceId !== request.workspaceId) throw new RangeError("workspace_mismatch");
    const generation = run.generation;
    if (run.grants.size >= 20) throw new RangeError("admission_full");
    if (!(await this.verifyChallenge(request, signal))) throw new RangeError("challenge_rejected");
    signal.throwIfAborted();
    this.gate();
    if (this.run(cookie).run !== run) throw new RangeError("admission_expired");
    if (run.generation !== generation) throw new RangeError("invalid_grant");
    if (run.grants.size >= 20) throw new RangeError("admission_full");
    if (run.operations.has(request.operationId)) throw new RangeError("operation_replayed");
    const claims: Claims = {
      run: id,
      epoch: this.epoch,
      nonce: randomUUID(),
      expiresAt: Math.min(run.expiresAt, this.now() + 120_000),
      workspaceId: request.workspaceId,
      action: request.action,
      operationId: request.operationId,
      inputHash: request.inputHash,
      retry: request.retry,
      ...(request.documentHash ? { documentHash: request.documentHash } : {}),
    };
    run.grants.set(claims.nonce, claims);
    return {
      grant: this.sign(claims),
      expiresAt: claims.expiresAt,
      disclosureVersion: request.disclosureVersion,
    };
  }
  consume(cookie: string, token: string, identity: ActionIdentity) {
    this.gate();
    this.sweep();
    const claims = grantClaims.parse(this.decode(token)),
      { run, id } = this.run(cookie);
    if (claims.epoch !== this.epoch) throw new RangeError("boot_changed");
    if (claims.expiresAt <= this.now()) throw new RangeError("grant_expired");
    if (run.operations.has(identity.operationId)) throw new RangeError("operation_replayed");
    if (
      claims.run !== id ||
      run.workspaceId !== identity.workspaceId ||
      !run.grants.has(claims.nonce) ||
      Object.entries(identity).some(([key, value]) => claims[key as keyof Claims] !== value)
    )
      throw new RangeError("invalid_grant");
    if (this.active) throw new RangeError("instance_busy");
    if (this.starts.length >= 20) throw new RangeError("rate_limited");
    const reserve = reservationMicroUsd(identity.action);
    if (run.reserved + reserve > this.ceilingMicroUsd) throw new RangeError("spend_allowance_used");
    if (identity.action === "extract") {
      if (
        identity.retry
          ? run.retries >= 1 || !run.originals.has(identity.documentHash!)
          : run.originals.size >= 10 || run.originals.has(identity.documentHash!)
      )
        throw new RangeError("document_allowance_used");
    } else if (run[identity.action] >= (identity.action === "chat" ? 8 : 2))
      throw new RangeError("turn_allowance_used");
    // No await between reservation, consumed state and dispatch lease. Unknown outcomes retain it.
    run.grants.delete(claims.nonce);
    run.operations.add(identity.operationId);
    run.reserved += reserve;
    if (identity.action === "extract") {
      run.originals.add(identity.documentHash!);
      if (identity.retry) run.retries++;
    } else run[identity.action]++;
    this.starts.push(this.now());
    this.active = claims.nonce;
    return () => {
      if (this.active === claims.nonce) this.active = null;
    };
  }
  preflight(cookie: string, token: string, action: PaidAction) {
    this.gate();
    this.sweep();
    const claims = grantClaims.parse(this.decode(token)),
      { run, id } = this.run(cookie);
    if (claims.epoch !== this.epoch) throw new RangeError("boot_changed");
    if (claims.expiresAt <= this.now()) throw new RangeError("grant_expired");
    if (run.operations.has(claims.operationId)) throw new RangeError("operation_replayed");
    if (claims.run !== id || claims.action !== action || !run.grants.has(claims.nonce))
      throw new RangeError("invalid_grant");
  }
  revoke(cookie: string, workspaceId: string) {
    const { run } = this.run(cookie);
    if (run.workspaceId !== workspaceId) throw new RangeError("workspace_mismatch");
    run.grants.clear(); // Retain independent run cookie, consumed operations and full reservations.
    run.generation++;
  }
}
export function runCookie(header: string | undefined) {
  const values = (header ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("retrosum_run="));
  if (values.length > 1) throw new RangeError("invalid_grant");
  return values.length === 1 ? values[0]!.slice("retrosum_run=".length) || "invalid" : null;
}
