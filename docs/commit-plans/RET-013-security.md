# RET-013 security file-level commit plan

Owner authority, 11 October 2026: approve SEC-01–04 execution/validation until no actionable findings, then stage and commit all security work. A further bounded paid portfolio run follows these security commits. No push or deployment. Earlier Phase B documentation-only permissions were superseded by this approval.

The settled read-only review meets the ticket. All six root gates pass: 482 tests/48 files, 135 boundary modules and both builds. Both final Linux images pass frozen packaging and isolated nonroot/read-only fake release probes; connected fake preservation passes. No dependency, money engine, provider prompt/model, private log or cloud configuration change is allocated. Raw logs, credentials, dependencies, generated output, screenshots and thumbnail assets are excluded.

## Commit 1 — RET-013: bind uploads early and bound public and PDF work

One connected implementation snapshot: separate service/run attempts, complete upload binding before side effects, streaming public handler gates, coalesced bounded free lookups, two native inspections/two foreground waiters and sampled RSS containment. Meaningful HTTP/concurrency/abort/replay regressions and repeatable no-key Linux measurement helpers belong with their implementation.

Stage these explicit paths:

- `apps/backend/src/documents/extract-route.ts`
- `apps/backend/src/documents/inspection.ts`
- `apps/backend/src/documents/inspection-capacity.ts`
- `apps/backend/src/documents/inspection-capacity.test.ts`
- `apps/backend/src/documents/inspection.test.ts`
- `apps/backend/src/providers/exchange-rates.ts`
- `apps/backend/src/providers/exchange-rates.test.ts`
- `apps/backend/src/security/admission.ts`
- `apps/backend/src/security/admission.test.ts`
- `apps/backend/src/security/routes.ts`
- `apps/frontend/src/app/api/retrosum/v1/config/route.ts`
- `apps/frontend/src/proxy.ts`
- `apps/frontend/src/proxy.test.ts`
- `apps/frontend/src/server/admission.server.ts`
- `apps/frontend/src/server/admission.test.ts`
- `apps/frontend/src/server/backend.server.ts`
- `apps/frontend/src/server/capabilities.server.ts`
- `apps/frontend/src/server/capabilities.test.ts`
- `apps/frontend/src/server/exchange-rate.server.ts`
- `apps/frontend/src/server/extraction.server.ts`
- `apps/frontend/src/server/extraction.test.ts`
- `apps/frontend/src/server/request-gate.server.ts`
- `apps/frontend/src/server/request-gate.test.ts`
- `apps/frontend/src/server/retro.server.ts`
- `apps/frontend/src/server/retro.test.ts`
- `apps/frontend/src/server/session.server.ts`
- `scripts/measure-pdf-inspection.mjs`
- `test/lib/pdf-pressure.mjs`
- `test/recognition.test.mjs`
- `test/security-admission.test.mjs`

## Commit 2 — RET-013: record approved security repairs and settled evidence

Retain the dated original audit, clearly distinguish its former manual gate, document the approved remedies, measurement limits, final review/root/Linux/browser evidence and current engineering controls. The optional edge service, account enforcement, bundled-native visibility and hosted rollout remain separate. Stage these explicit paths:

- `docs/audits/RET-013-security.md`
- `docs/audits/RET-013-security-review.html`
- `docs/commit-plans/RET-013-security.md`
- `docs/engineering/SECURITY-ADMISSION.md`
- `docs/tickets/RET-013-post-deployment-and-pre-sharing.md`
- `docs/validation/RET-013.md`

## Review and completion procedure

Inspect path equality, staged whitespace, the complete staged implementation/evidence and a content-safe credential-pattern scan before each commit. Never stage by repository-wide glob. Verify all security paths are committed and the index is empty. Record actual hashes in the evidence allocation after Commit 1. The later portfolio screenshots/thumbnail and content-safe capture manifest are saved as original local deliverables, outside these Git allocations. Their paid results must not be inferred from the fake checks above.
