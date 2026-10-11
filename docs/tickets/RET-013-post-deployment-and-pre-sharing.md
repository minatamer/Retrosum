# RET-013 — Post deployment and pre sharing ticket

**Status:** Phase A complete — quality application commit `743a9dc`, evidence committed with this ticket. Phase B audit pending; security implementation locked.

**Owner instruction:** 11 October 2026. Audit the completed demo before sharing it. Preserve functionality above all other goals. Fully document the code-quality plan before application edits; execute/validate until the settled plan has no actionable findings, then stage and commit that phase. Subsequently audit security without implementing fixes. Leave security findings and their HTML review unstaged and uncommitted for the owner's manual decisions.

**Dependencies:** RET-001–012 implemented; clean `main` at `c716c52`. RET-012 is deployed on its managed origin. This ticket does not declare its outstanding custom-domain, maximum-load, billing/account or physical-device checks complete.

## Authority and precise references

- Root and frontend `AGENTS.md`; installed Next documentation on error handling and server/client boundaries before frontend edits.
- [Blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md): §9 financial meaning, §10 review/CRUD, §11 Retro, §12 persistence, §13 originals/reset, §14 architecture, §15 ownership, §17 transport, §18 processing, §19 admission/spend, §20 privacy, §24 verification, §25 recovery/observability/performance, §26 engineering.
- [Foundation](../engineering/FOUNDATION.md), [money/session ownership](../engineering/MONEY-SESSIONS.md), [recognition](../engineering/RECOGNITION.md), [dashboard](../engineering/DASHBOARD.md), [Retro](../engineering/RETRO.md), [lifecycle](../engineering/EXPORTS-LIFECYCLE.md), [admission controls](../engineering/SECURITY-ADMISSION.md).
- [Release record](../operations/RELEASE-RECORD-2026-10-11.md) and [RET-012 validation](../validation/RET-012.md) distinguish code assertions, bounded hosted observations and remaining external acceptance.
- Execute/validate skills: one ticket, meaningful focused regression checks, read-only validation passes, then execution repairs. No delegation is authorized.

## Phase separation and permissions

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

## B. Security audit plan — documentation only

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
- [ ] B whole-repository threat/dependency analysis and detailed proposed remediations complete.
- [ ] Readable severity-ranked HTML rendered and reviewed.
- [ ] Security artifacts remain unstaged/uncommitted; no security implementation performed; owner review pending.

## Evidence and current result

See [RET-013 validation](../validation/RET-013.md) and the [quality ledger](../audits/RET-013-code-quality.md). CQ-01–04 were documented before execution and are implemented. Read-only review identified one inherited-key message lookup, subsequently repaired with a Map and four regression cases. The second review has no actionable quality findings. Connected fake browser verification and all six settled gates passed (460 tests/45 files, 133 boundaries, both builds). Application changes are committed as `743a9dc`; this evidence allocation completes A. Security findings will be separate post-commit artifacts, with no implementation before owner feedback.
