# RET-010 — Harden privacy, private transport, abuse controls and spend readiness

**Current acceptance — 10 October 2026:** Local implementation is complete. The current sample contains ten PDFs/eighteen pages; two independent live numeric/record passes, seventeen live Retro cases and real localhost Turnstile/browser checks passed. The owner confirms the configured USD 5 OpenAI spending limit. Owner/physical/assistive/general-upload/manual account checks and hosted acceptance remain separate. See [current status](../CURRENT-STATUS.md) and [RET-011 evidence](../validation/RET-011.md).

Status: **Implemented locally — deferred acceptance pending**<br>
Last synchronized: **10 October 2026**<br>
Depends on: [RET-005](RET-005-deliver-live-pdf-recognition-and-review.md), [RET-009](RET-009-complete-exports-and-session-lifecycle.md)  
Blocks: RET-011  
Suggested commit: `RET-010: harden privacy, private transport, abuse controls and spend readiness`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Audit and harden the complete working flow's external boundaries before public release: browser-only retained uploads, private API transport, prompt/tool restrictions, bounded resources/admission, measured OpenAI spend and truthful handling copy. Security basics already exist; this ticket verifies their integration rather than postponing protection until the end.

The owner confirms the configured OpenAI spending limit is USD 5, already set. Its dashboard scope/period/enforcement was not independently inspected; no prepaid balance or global application cap is inferred. Keep the 41-request/624k-input/111k-output structural envelope and proposed USD 2.50 per-run reservation policy explicit, then measure a typical ten-PDF visit before enabling public usage.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded manual/hosted release gates remain pending; current local paid acceptance is already recorded in RET-011.

Areas owned by this packet:

- Backend/front bridge admission, challenge/grant/replay/capacity/rate/deadline policy and sanitized logging.
- Local runtime/parser/resource controls, secret/config assertions and security headers/origin rules. Docker packaging/runtime verification belongs to deferred RET-012.
- Privacy/provider disclosure, temporary browser-storage guarantees and expiry wording.
- Provider setup, cost/rights/dependency notes and threat/abuse verification evidence.

## Implementation plan

1. Review data flow across browser projection/Blob store, Next transport, Express request buffers and OpenAI. Retained originals stay local; disclosed AI processing still transfers bounded bytes. No upload bucket, server document cache, provider Files library or persistent chat/vector store is introduced.
2. Verify the frontend uses same-origin routes and audience-bound runtime identity for the private backend in hosted mode. Origins are exact; request bodies/headers/stream deadlines are bounded; backend does not become a public bypass. Tokens/keys/private origins never enter client bundles or public config.
3. Verify challenge and action-bound one-use grants for expensive actions, boot epoch/session/operation identity, atomic consumed state before dispatch, single expensive-operation lease, sequential document processing and content-free counters. Reject invalid/stale/replayed actions before provider use.
4. Enforce ten files/one retry/two insight generations/eight Retro turns and per-request/tool/token deadlines/reservations. Preview, local forms, arithmetic, tour, confirmation, Undo and original downloads cost zero inference. Reserve unknown outcomes; automatic network SDK retries are disabled.
5. Recheck official `gpt-6.1-sol` access/rates and record pricing date and billed image/text/reasoning units. Measure actual sample/Retro usage under authorized owner-run tests. The conservative cache-write reservation for all 41 structural generations is USD 2.67; the USD 2.50 process-local ledger can therefore stop before all allowances are exhausted. Actual input counts and usage/tier are checked; neither the reservation nor the owner-confirmed USD 5 limit implies free hosting or unbounded traffic.
6. Verify `PAID_DEMO_ENABLED=false` stops all dispatch even if `FAKE_MODE=false` and credentials are present. Live unavailability preserves local controls; it never silently injects fake sample/chat outputs. Expose a safe operational paid-off control and documented balance monitoring.
7. Bound PDF decompression/image work, multipart resources, graph/tool response size, browser projection/Blob quota and owned download memory. Verify these controls in local Node/browser execution; use current primary advisories for relevant updates rather than inheriting sibling lockfiles blindly. Target Linux image behavior and nonroot container ownership are deferred to RET-012, not local hardening prerequisites.
8. Threat-test document/chat prompt injection, untrusted filenames/HTML, invented fact IDs/commands, arbitrary selectors/URLs, XSS/CSV output handling, cross-session Blob IDs and stale/replayed grants. Model outputs are data and cannot authorize arbitrary action or network.
9. Log only approved content-free allow-listed operation route/capability mode/status/bounded duration; no PDFs, raw extraction text, chat/contact fields, filenames, source IP, secret/grant or SDK payload. Specify log retention and diagnostics ownership.
10. Document process-local quota limitations: new anonymous identities, restarts/overlap/replicas and platform max-instance behavior can weaken global spend enforcement. Provider/account controls complement the app. Do not add a durable counter DB silently; escalate only a demonstrated requirement through a new design decision.
11. Reconcile privacy copy with two-hour browser expiry/lazy sweep, explicit processing consent, provider policies and inability to retract downloads/external retention. Verify no absolute “never leaves device/instant erase everywhere/zero retention” claim remains.

## Acceptance criteria

- [x] Hosted transport design is private and local composition cannot bypass paid controls; actual IAM/cloud acceptance remains pending.
- [x] Invalid/disabled/excess/replayed requests make zero unexpected provider calls in local/injected verification.
- [x] Rate/capacity/token/request counters are bounded and truthful about scope; exact full-input token preflight and conservative cache-write reservations passed local live verification.
- [x] Browser-only upload retention and actual request/provider transfer match copy; actual local provider processing passed; provider-policy/retention/account enforcement and hosted behavior remain manual acceptance.
- [x] Injection/output/tool/DOM boundaries cannot grant unsupported authority in verified local paths.
- [x] Model/pricing/actual sample usage and conservative spend accounting are recorded in RET-011 (account invoice/enforcement is not claimed).
- [x] Local resource limits and content-free logging are verified; target image/runtime checks are assigned to deferred RET-012.
- [x] No unresolved high-impact boundary/spend/privacy issue is silently carried into release; actual public deployment remains deferred.

## Verification and evidence

| Case                                             | Evidence                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| Invalid origin/challenge/grant/epoch/replay      | Pre-dispatch rejection counters                                           |
| Paid-off/exhausted reservation/concurrent starts | No over-admission or accidental live work                                 |
| Unknown outcome/restart/refresh                  | No automatic retry/refund/free allowance reset                            |
| Prompt/URL/selector/command injection            | Rejected capability escalation and grounded response                      |
| Source/Blob ID cross-session access              | Owned-session isolation                                                   |
| Provider/key/log inspection                      | No content/secrets in public bundle or diagnostic logs                    |
| Controlled spend                                 | Actual units/cost per sample and Retro action; operator controls recorded |

Use fake/injected adversarial tests for integration; live/cloud facts must be measured separately with authorization. Record exact unresolved operator inputs so RET-012 has a concrete checklist rather than vague “secure enough” language.

The owner has deferred live accuracy/spend and deployment. Complete and record local/injected hardening evidence without paid calls or cloud changes; keep measured spend, hosted IAM/transport and operator inputs explicitly pending. These deferred checks do not block RET-011's local product pass. Do not author/build Docker images in this phase.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

## Historical local execution snapshot

The following original results retain their dated corpus and acceptance boundaries; use the current status above for outstanding work.

**Execution record, 8 October 2026:** Added real consent/session/grant endpoints, challenge validation, epoch/run/action/input-bound one-use admission, conservative retained micro-USD reservations, distinct chat/insight limits, early guards, fixed private identity transport, abort-aware bounded readers, nonce CSP, explicit processing review and content-free diagnostics. The required settled `pnpm check` passed formatting, lint, types, 105 source boundaries, 189 tests in 25 files and both builds. Production advisory audit reported zero advisories. Local browser privacy/device/keyboard and production policy evidence are recorded in [RET-010 validation](../validation/RET-010.md); decisions and exact limitations are in [security/admission](../engineering/SECURITY-ADMISSION.md) and [release readiness](../engineering/RELEASE-READINESS.md).

No paid calls, key setup, CAPTCHA solving, Docker build, push or cloud change occurred. Actual model access/numeric accuracy/image-token bounds/spend, challenge/domain/IAM/log retention, physical-device/owner aesthetic and hosted runtime acceptance remain separately pending. This local record unblocks RET-011 without enabling public live processing. File-level allocation is in [the commit plan](../commit-plans/RET-010.md).
