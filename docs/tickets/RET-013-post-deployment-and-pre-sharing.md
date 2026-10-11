# RET-013 — Post deployment and pre sharing ticket

**Status:** Quality and SEC-01–04 repairs are committed and deployed from `35bc824`; both services are Ready at 100 percent traffic with public live mode restored. Settled review/six root gates pass (482 tests), and new free hosted/browser verification passes. The separate local paid portfolio run, 83 original screenshots and professional thumbnail are delivered. [Actual rollout record](../operations/RELEASE-RECORD-RET-013-2026-10-11.md) separates these evidence classes. Deployment documentation and the README cover have specific owner staging/commit approval; no Git remote push.

**Latest owner authority:** On 11 October, the owner instructed, "commit the stuff in unstaged," explicitly approving the current eleven-path deployment/portfolio allocation in its two file-level plans. Earlier approval authorized deploying the committed work and fixing/redeploying deployment issues, and covered the completed security commits and subsequent local paid portfolio run/thumbnail. No additional paid test, remote push, edge service or custom-domain cutover is inferred. No application repair was needed during this rollout. Earlier statements prohibiting deployment below retain their original audit/execution-stage scope.

**Later portfolio presentation request, 11 October:** the original cover is also copied into the Desktop's ten-image shortlist as `00-Retrosum-thumbnail.png` and displayed below the root README title through `docs/assets/retrosum-overview.png`. Both copies match the delivered original; all ten shortlisted screenshots and all 83 full-set screenshots remain preserved. The subsequent explicit Git approval covers the [portfolio file allocation](../commit-plans/RET-013-portfolio.md) and [deployment evidence allocation](../commit-plans/RET-013-deployment.md).

### Approved implementation plan (before security application edits)

1. SEC-01: replace immediate-proxy source buckets with one bounded service entry window (120/minute, 600/hour) and separate validated-run challenge windows (6/minute, 30/hour). Session creation uses the global window; challenge issuance uses both. Exact batch child minting retains its current one-challenge behavior. Preserve 20/hour paid starts, four active operations, fixed expiries and run rotation/spend controls. Remove the obsolete socket identity API rather than trust forwarding headers.
2. SEC-02: factor complete grant validation into one side-effect-free ledger method reused by atomic consumption. Check actual bytes/hash and full request identity before operation tracking, workspace reservations and PDF inspection. Revalidate after inspection before dispatch. Cover wrong identities, valid-token recovery, expiry/revocation and concurrent replay; retain every diagnostic event.
3. SEC-03: add one process-owned frontend request gate with separate navigation/free and mutating windows, plus four independent large-operation leases. Cover the canonical pages, API paths and image optimizer; leave owned static assets available. Reject malformed admission headers before capability lookup and require complete headers for live requests before body reads. Because fake/live authority belongs to the backend, an unknown mode may need the first coalesced capability read; do not invent a second frontend paid switch. Coalesce capability reads only while in flight (no stale availability cache), and coalesce fixed FX misses with a short failure backoff and independent caller abort ownership. The selected scope is application-only; a load balancer/WAF remains optional infrastructure, not an implied deployment.
4. SEC-04: first run bounded synthetic/sample inspection measurements in an isolated Linux 1 GiB container, without keys/network/provider dispatch. Include all ten originals, four concurrent demanding PDFs, cancellation, release and fifth-slot rejection. Select the smallest demonstrated parser control from those results; document any throughput effect before implementation. Preserve four normal document requests and provider slots, exact originals and held-file behavior. No production stress test or unbounded fuzzing.
5. Review the combined diff in read-only validation passes, independently verify and repair findings, then run all six required gates and connected fake browser preservation checks. Record exact scope and remaining external verification limits. Write `docs/commit-plans/RET-013-security.md`, stage only allocated paths, inspect the staged diff and commit under `RET-013:`.
6. After security commits, run the new local paid candidate with ten synthetic originals and up to four live Retro turns, no automatic retry and at most USD 2.50 reserved. Capture landing, every flow stage and every dashboard view, including useful forms/Retro/source states. Save numbered original screenshots and a manifest to a Desktop portfolio folder. Keep billing/account proof and hosted deployment separate. Generate the thumbnail with the canonical logo, forest/orange/ivory and actual screenshot references; no invented financial UI.

**SEC-04 measured repair selection, before parser edits:** Four 797,346-byte synthetic PDFs, each with 7,000 unique small inline images (68,607,000 pixels, within the current per-document image budget), reached 989,671,424 bytes process peak RSS / 945,635,328 bytes cgroup peak and all timed out at the existing 20-second deadline. This leaves inadequate production headroom in 1 GiB. Select two simultaneous inspection workers with at most two request-owned, abortable waiters; retain four document/provider operations. The same 20-second deadline includes lease waiting. Add a 640 MiB process-RSS stop with a 10 ms observation interval, preserving the heap/pixel/body/deadline controls. Await worker termination before settling/releasing the inspection lease. This is measured headroom protection, not an OS-enforced per-parser memory cap or proof for every possible PDF. Verify actual pressure rejection/cleanup, subsequent sample success, four normal HTTP/provider overlaps and cancellation; do not add a helper service, change instance size or alter paid concurrency.

**Original owner instruction (fulfilled audit stage; superseded for execution):** 11 October 2026. Audit the completed demo before sharing it. Preserve functionality above all other goals. Fully document the code-quality plan before application edits; execute/validate until the settled plan has no actionable findings, then stage and commit that phase. Subsequently audit security without implementing fixes. Leave security findings and their HTML review unstaged and uncommitted for the owner's manual decisions.

**Dependencies:** RET-001–012 implemented; clean `main` at `c716c52`. RET-012 is deployed on its managed origin. This ticket does not declare its outstanding custom-domain, maximum-load, billing/account or physical-device checks complete.

## Authority and precise references

- Root and frontend `AGENTS.md`; installed Next documentation on error handling and server/client boundaries before frontend edits.
- [Blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md): §9 financial meaning, §10 review/CRUD, §11 Retro, §12 persistence, §13 originals/reset, §14 architecture, §15 ownership, §17 transport, §18 processing, §19 admission/spend, §20 privacy, §24 verification, §25 recovery/observability/performance, §26 engineering.
- [Foundation](../engineering/FOUNDATION.md), [money/session ownership](../engineering/MONEY-SESSIONS.md), [recognition](../engineering/RECOGNITION.md), [dashboard](../engineering/DASHBOARD.md), [Retro](../engineering/RETRO.md), [lifecycle](../engineering/EXPORTS-LIFECYCLE.md), [admission controls](../engineering/SECURITY-ADMISSION.md).
- [Release record](../operations/RELEASE-RECORD-2026-10-11.md) and [RET-012 validation](../validation/RET-012.md) distinguish code assertions, bounded hosted observations and remaining external acceptance.
- Execute/validate skills: one ticket, meaningful focused regression checks, read-only validation passes, then execution repairs. No delegation is authorized.

## Original phase separation and permissions (audit-stage history)

1. **A — Code quality, structure and efficiency:** inspect, plan, implement behavior-preserving improvements, validate and commit. The owner's current instruction explicitly authorizes staging and committing this phase after verification. Use explicit file allocations under `RET-013:`; inspect staged content. No push or deployment.
2. **B — Security review:** inspect the committed result, research current advisories, document material STRIDE/common threats and careful proposed repairs, create a readable HTML decision aid. **No security implementation, dependency upgrades, cloud mutations, staging or commits in this phase.** Wait for manual owner feedback. A finding discovered in A that needs a security-policy change is recorded for B, not silently implemented.

No additional paid calls, hosted stress tests, CAPTCHA operations, external scanning upload, new storage service, framework upgrades or production rollout are authorized. Local verification uses fake/no-secret composition. Preserve any existing owner local processes.

## Functional invariants

- `/demo` remains the Choose → Documents → Process → Dashboard journey; existing clean navigation and landing remain.
- Exact USD source cents and the shared money engine remain authoritative. Income, costs, profit, cash, known open and unknown settlement keep their meanings; no float-based replacement arithmetic.
- Actual sample originals, review holds, matching, duplicate detection, source drill-down and original byte downloads remain usable. No hidden financial dataset.
- Four document requests may overlap; source-order graph commits, one batch verification, per-document single-use grants, explicit retry, cancellation and completed-source preservation remain.
- Manual and Retro CRUD use the same commands. Editable proposals, visitor edits, confirmation, stale-revision rejection, layout placement and latest Undo remain.
- Friendly scoped conversation, useful contextual shortcuts, local guidance and tours remain. No off-context coding/task expansion.
- Two-hour per-tab recovery, lease ownership, reset/expiry generation invalidation, Blob cleanup, resource revocation and no auto-resubmission remain.
- Forest/orange/ivory, canonical logo, type, mobile/desktop layout, native keyboard controls and all intended animation remain. No reduced-motion gate or animation-off switch.
- Fixed private backend transport, no browser secrets and shared-package boundaries remain.
- **Every existing backend operational log remains.** Never delete, silence or reduce a diagnostic stream to satisfy this ticket. Keep content-free private logging; do not introduce raw document text, provider bodies, tokens or financial records into logs. Browser code must not print technical diagnostics. Unexpected UI errors become calm, useful messages; intentional form/domain guidance stays helpful.

## A. Detailed audit and implementation plan (written before application edits)

### A1. Establish and inventory the baseline

Read tracked application source, contracts, pure money modules, tests, scripts, styling, runtime configuration, packaging and CI. Exclude generated bundles, dependency implementation and synthetic binary assets from owned-code counts; inspect their loading/provenance and manifest references separately. Build a module/import reachability inventory with actual route/startup/package-export roots, dynamic imports and worker references. Do not confuse test-only utilities, required assets or public package exports with dead application code.

Run all six root gates as the baseline. If a sandbox/runtime failure occurs, record it distinctly and rerun through the existing installed tools outside the sandbox; never classify a permission error as an application failure. Store bulky check output under ignored `artifacts/local/ret-013/` and summarize actual results in validation.

### A2. Check structure and reachability

Inspect layer direction, public exports, module ownership, environment/listener side effects, server/client boundaries and platform access. Identify orphaned feature branches, unused production dependencies/assets, stale exports and repeated implementations. For each deletion, trace every static/dynamic/worker/config/test consumer and explain why current behavior cannot call it. Retain legitimate pure public APIs and meaningful tests unless a removed feature is conclusively the sole consumer. Do not split large files merely because they are long or introduce a generic utilities/service framework.

Candidate investigation: retired ZIP/generated-invoice browser helpers/dependencies versus the surviving original-download and shared export contracts; duplicated bounded JSON readers currently owned by the document feature but consumed by Retro/processing. Confirm actual consumers before allocating edits.

### A3. Error presentation and logging

Trace every caught exception through React state, persisted review notes, API bridges and the backend. Reject raw `Error.message`, parser messages, JSON syntax diagnostics, schema dumps, URLs and stack traces at user-facing catch boundaries. Preserve curated application guidance through an explicit safe mechanism, not a broad error-class/name/prefix heuristic. Native input validation and source-review issue descriptions are legitimate product information and must retain useful wording.

Candidate files: document intake/client/flow/viewers; demo/settings; dashboard/widget forms; manual record forms; Retro proposals/requests/turns; session recovery. Review successful and failed transport, malformed success bodies, unsupported PDFs, storage failure, stale changes and cancellation. Backend metrics/startup/listener output and parser privacy handling must remain intact. No global console suppression or monkey patch.

Regression evidence must include a technical exception and schema/JSON failure that cannot leak, plus useful deliberate validation guidance that still works. Confirm provider/network failure maps to deliberate retry and preserved records, rather than resetting data or retrying automatically.

### A4. Efficiency and lifecycle

Inspect repeated full-graph validation, catalogue rebuilds on unrelated chat/layout changes, repeated expensive work, eager dependency loading, bounded loops/data structures and rendering subscriptions. Optimize only a demonstrated redundant computation with stable revision/scope inputs. Do not change calculations, cached private data ownership, extraction concurrency, prompts/model, provider timeout/reservations or admission semantics.

Review every effect/timer/listener/controller/worker/object URL and stream reader for normal completion, abort, unmount, reset and expiry. Preserve visitoredits and avoid new asynchronous races. Readiness/cold-start behavior and no automatic provider retry stay as previously verified. Record non-actionable observations instead of speculative refactors.

### A5. Maintainability, tests and documentation

Check meaningful domain/HTTP/lifecycle tests, no-network isolation, generated asset preparation, frozen production packaging and CI gates. Use existing pinned dependencies; add no library for the audit. Remove redundant test scaffolding only when it becomes obsolete because its feature is removed. Keep tests of money, sources, masking, privacy and cancellation that protect surviving public behavior.

Record each confirmed quality finding in the audit ledger with evidence, affected files, risk, selected repair, preservation checks and disposition. Before any application edit, resolve the finding's scope in this ticket/ledger. “No change” is a valid disposition when an existing design is safe and useful.

### A6. Execution and validation loop

1. Document a confirmed finding and exact planned edit before implementing it.
2. Make one cohesive change. Test its positive/negative/cleanup paths with synthetic inputs and zero paid dispatch.
3. Freeze the diff; perform a read-only validate pass against this ticket and nearby execution paths. Log verdict and actionable findings.
4. Return to execution to independently verify and fix each actual finding; revalidate the entire relevant diff. Do not invent findings or treat passing tests alone as a review.
5. Perform connected fake browser checks of changed behavior and representative surviving workflows, including narrow/wide layouts, keyboard paths and visible animation. Preserve owner servers and use isolated fake origins/ports if needed.
6. Once settled, run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:boundaries`, `pnpm test:unit`, `pnpm build` once; repeat a gate only after a relevant new change/failure.
7. Write final file-level allocations in [commit plan](../commit-plans/RET-013.md), inspect explicit staged diff, commit A. Verify clean index before starting B.

### A7. Preservation matrix

| Surface                            | Required evidence                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Money, review, matching, CRUD/Undo | Existing domain/regression suite; no calculation or command-policy drift                                                    |
| Bounded JSON/stream error handling | Valid UTF-8 response; malformed/oversized/empty response; abort and reader release; curated UI fallback                     |
| PDF intake/viewing/download        | Sample originals still load; unsupported input remains held; original byte/hash behavior; worker/URL cleanup                |
| Dashboard and Retro                | Current facts, scope, greeting/shortcuts, widget proposal/placement, source access and latest Undo                          |
| Reset/refresh/cancellation         | Existing lifecycle tests plus browser recovery/reset; no automatic resubmission                                             |
| Logs and browser errors            | Existing private operational sink retains events; no authored browser console diagnostics; expected failure shows safe copy |
| Responsive/motion                  | Representative phone/laptop checks; actual visible movement/completion and normal keyboard operation                        |
| Production composition             | Strict build, import boundaries, no-secret/no-network tests and unchanged private transport/admission behavior              |

## B. Original security audit plan — documentation only until owner approval

Audit the committed A snapshot, not an intermediate diff. Map assets, entry points and trust boundaries: guest tab/storage, public Next, private IAM backend, native PDF worker, OpenAI, Turnstile, fixed FX lookup, secrets/images/CI/logging. Assess spoofing, tampering, repudiation, information disclosure, denial of service and elevation of privilege across each boundary. Include common web/AI/upload/supply-chain threats even where they do not fit neatly into one category.

Investigate actual controls and plausible attack paths for origin/CSRF, grant/cookie/replay, instance restarts and spend limits, visitor/source rate limits, frontend bypass, concurrent/multipart/slow requests, PDF resource use, model injection/action authority, stored XSS/URL/rendering, SSRF/fixed targets, tenant/session isolation, bounded persistence, logging, runtime IAM, image/dependency advisories and production configuration. Distinguish source proof, the dated deployed configuration and unverified hosted behavior. Never infer a durable cost cap from budget alerts or process-local reservations.

Use a read-only lockfile/production dependency advisory check and primary vendor/security advisories for current facts. Assess exact version, production reachability, prerequisites and installed mitigations. Separate dev-only advisories and unavailable registry evidence. Do not upgrade or install packages. No exploit traffic against the public app or provider calls.

Document only material findings with concrete evidence and a realistic demo impact. Do not promote every missing enterprise feature, cosmetic header, speculative scenario or scanner label into a finding. A material low-severity issue may appear, but insignificant nits are excluded. Explicitly list controls that are already effective and uncertainties that are not confirmed vulnerabilities.

Each finding must include: ID/severity/confidence; affected asset and STRIDE category; source/config evidence; prerequisites and attack sequence; current defenses and their gap; practical user/availability/cost impact; a narrowly scoped fix plan; functionality/quality preservation constraints; regression and staged rollout checks; owner decision required. Offer a simple demo-sized remedy before a new service/platform. Rank by actual impact, not package advisory headline alone.

Create a standalone HTML summary under `docs/audits/` with high → medium → material low ordering, plain-language threat and solution, clear decision state and links to the detailed evidence. Keep the page readable on phone/laptop, accessible, local-only and dependency-free. Review its rendered output. All B files remain **unstaged/uncommitted**; no fix execution before manual owner feedback.

## Acceptance and completion gates

- [x] Full A plan documented before application edits; tracked review inventory and confirmed-finding dispositions recorded.
- [x] Quality changes preserve functional invariants, useful input guidance and every existing private backend log.
- [x] Meaningful focused regressions, fake browser evidence and six settled root gates pass.
- [x] Read-only validation loop concludes with no actionable quality findings on the settled snapshot.
- [x] A file-level plan and explicit reviewed quality commit(s) completed; no push/deployment.
- [x] B whole-repository threat/dependency analysis and detailed proposed remediations complete.
- [x] Readable severity-ranked HTML rendered and reviewed.
- [x] Original security artifacts were left unstaged/uncommitted for manual owner review; the owner subsequently approved all four findings.
- [x] Approved security changes preserve exact calculations, four provider operations, one batch challenge, cleanup, UI behavior and all existing private logs.
- [x] Settled read-only security validation has no actionable application findings; all six gates pass (482 tests/48 files, 135 boundary modules, both builds).
- [x] Both final nonroot/read-only Linux candidates build and pass isolated fake release probes with zero paid requests.
- [x] New security file-level allocation and reviewed implementation/evidence commits complete before the later authorized rollout; no Git remote push.
- [x] Authorized post-commit local paid run and complete portfolio screenshot folder delivered: ten PDFs, two live Retro operations, 83 screenshots, actual-results manifest/gallery on Desktop.
- [x] Professional canonical-brand thumbnail delivered in the same portfolio folder.
- [x] Later owner-authorized security rollout verified: immutable pair, preserved runtime/IAM/secrets, compatible paid-off revision and free hosted/browser checks; no new paid provider operations.

## Evidence and original audit-stage result

See [RET-013 validation](../validation/RET-013.md) and the [quality ledger](../audits/RET-013-code-quality.md). CQ-01–04 were documented before execution and are implemented. Read-only review identified one inherited-key message lookup, subsequently repaired with a Map and four regression cases. The second review has no actionable quality findings. Connected fake browser verification and all six settled gates passed (460 tests/45 files, 133 boundaries, both builds). Application changes are committed as `743a9dc`; this evidence allocation completes A. Security findings will be separate post-commit artifacts, with no implementation before owner feedback.

**Phase B delivered:** [Full security audit](../audits/RET-013-security.md) and [HTML owner review](../audits/RET-013-security-review.html). Four medium findings cover shared pre-challenge lockout, late complete upload binding, public request capacity and the PDF external-memory gap. Two request effects were reproduced locally with zero provider calls; hosted outage/OOM was not tested. Current/deployed-era production npm audits report no advisory; development-only braces and exact-image Debian/Node/native reachability are documented separately. Two external verification items retain account enforcement and bundled-native visibility uncertainty. Read-only metadata confirms private backend IAM/secret scopes and the already configured USD 5 Cloud Run spend cap. No security fixes, dependency upgrades, cloud changes, push or redeployment occurred. The owner must select fixes/acceptance/deferrals before any security execution. These completion notes are part of the intentionally uncommitted security documentation, not an additional quality commit.

## Approved execution result

SEC-01–04 are implemented and deployed under the later rollout approval. [Security dispositions](../audits/RET-013-security.md), [settled evidence](../validation/RET-013.md), [security commit allocation](../commit-plans/RET-013-security.md) and [actual release](../operations/RELEASE-RECORD-RET-013-2026-10-11.md) supersede the original audit-stage decision state. Pages/images use proxy-local limits; APIs remain outside the body-buffering proxy and acquire handler-owned limits. Shared capability/FX lookup ownership, complete grant binding and native inspection containment have meaningful rejection/concurrency/cancellation regressions. No money, provider prompt/model, dependencies or existing private operational event is changed. External account/bundled-native visibility and a distributed edge service remain explicitly separate from this application review. New hosted verification is free-only; prior local paid evidence is not relabeled as hosted acceptance.
