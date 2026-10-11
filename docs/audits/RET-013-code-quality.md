# RET-013 code-quality audit ledger

Plan checkpoint: 11 October 2026, before application edits. Baseline `c716c52`; six gates pass, 451 tests in 42 files, 132 boundary modules and both builds. The first sandbox invocation failed on workspace `realpath`; the identical unpaid check succeeded outside the Windows sandbox. This is not a product defect.

The import inventory covers 207 tracked source/style/test/script files. Production roots are Next routes/proxy, backend startup and public package exports. It includes literal dynamic imports and worker URLs. Two CSS “unreachable” reports were false positives: `globals.css` imports tokens and primitives through CSS `@import`. Required PDF fonts/CMaps/WASM/worker and sample originals remain. This analysis is a consumer check, not a claim that every public export can be removed.

## Confirmed findings and exact repair plans

### CQ-01 — Raw exceptions can become product messages

**Priority:** High within quality scope. **Evidence:** `demo-experience.tsx` catches capabilities/intake failures and prints `Error.message`; `recognition-flow.ts` persists arbitrary exceptions in document review notes; dashboard/widget/settings/record/review/Retro catch boundaries do the same. PDF inspection treats every `RangeError` as safe, and the viewer trusts a message prefix. A malformed success JSON, Zod parse, fetch/storage exception or parser error can therefore become visible or survive refresh. `money/recognition.ts` and `retro-change.ts` also forward broad exception classes into source notes/proposal rejection text.

**Plan:** Introduce one explicit browser presentation boundary: application-authored `UserFacingError` for intentional product guidance; unexpected exceptions receive each screen's existing useful generic fallback. Preserve human money-validation guidance through a small exact, reviewed mapping owned by money, reused in recognition/proposals/browser. Do not accept arbitrary RangeError messages, error names or prefixes. Mark intentional intake/PDF/admission/proposal errors at their source; keep internal invariant errors unmarked. Migrate all authored UI catch boundaries and persisted exception notes. Leave legitimate structured review issue descriptions and source text rendering unchanged.

**Files:** new frontend `components/ui/user-facing-error.ts` and regression; documents clients/flow/PDF policy/viewer/original viewer/review; demo flow/settings; configurable dashboard; record forms/register workspace; Retro/change/dashboard/workspace requests; processing client/provider. New pure money `input-guidance.ts` and tests/public export, recognition and Retro change rejection mapping.

**Preservation:** exact calculations/commands and status/grant/deadline/retry policies unchanged. Unsupported PDF, expired/stale proposal, exact amount and payment matching retain understandable guidance. Synthetic malformed response/parser/storage exceptions never become displayed text. Existing backend operational and startup/listener logs remain byte-for-byte untouched. PDF privacy/verbosity settings remain. No global console suppression.

### CQ-02 — Retired browser exporters keep unused production dependencies

**Priority:** Medium. **Evidence:** only tests import `features/exports/archive.ts` and `invoice-pdf.ts`; no route/component/dynamic production caller exists. ZIP/generated-invoice controls were deliberately removed in RET-011. `fflate`, `pdf-lib` and `@pdf-lib/fontkit` are used exclusively by these helpers/their obsolete adapter tests. The Liberation font under PDF.js is also required by the surviving viewer and must remain.

**Plan:** Remove the two unreachable browser adapters and their three direct frontend dependencies; reconcile the lockfile using installed/offline tools, without upgrades. Remove only adapter-specific archive/PDF tests/imports. Retain the pure public money export API/contracts and its exact-data, masking and spreadsheet safety tests: those are documented public package utilities, not an executable UI branch. Retain inert saved legacy export intents for refresh compatibility, original PDF downloads and all PDF.js resources. Add an explicit historical note to lifecycle documentation so deleted adapters are not described as current code.

**Files:** frontend package manifest/lockfile, two browser exporter deletions, focused edits to `test/export.test.mjs`, lifecycle engineering documentation. **Checks:** import inventory resolves all surviving modules, pure export tests survive, recognition/PDF-cache and original download/browser checks, frozen production install/build graph still valid. Test count may fall because four obsolete adapter tests are retired; explain the count rather than equating fewer tests with success.

### CQ-03 — Shared browser transport is owned by one feature

**Priority:** Medium. **Evidence:** `readJson` in `documents/recognition-client.ts` is imported by unrelated Retro and processing modules. This gives a document feature ownership of the general browser response reader and makes error/cleanup policy harder to locate.

**Plan:** Move the existing byte-counted UTF-8/abort/reader-release algorithm into named browser transport `transport/read-json.ts`; update all actual imports and add focused multibyte, empty/malformed, overflow, abort and cleanup checks. Keep byte limits/deadlines at each caller and the fixed endpoint/server boundary intact. Use technical internal exceptions only behind CQ-01's presentation boundary. Do not merge the separate server/backend readers across platform ownership.

**Files:** new transport module/test, recognition client/test references where needed, processing client/provider and Retro imports. **Checks:** chunked multibyte decode, count actual bytes, pending read abort and lock release, existing recognition/admission/Retro suite.

### CQ-04 — Chat/layout changes rebuild unchanged financial catalogues

**Priority:** Medium. **Evidence:** ConfigurableDashboard and Retro memoize `buildDashboard` against the entire session. `validateSession` parses detached copies, so appending messages or changing dashboard layout creates fresh workspace/filter objects and invalidates both expensive catalogues despite unchanged records and scope.

**Plan:** Keep full validation, then retain the already validated current workspace/filter references in controller setters that only change messages or dashboard preferences/Undo. Narrow catalogue memo dependencies to workspace and filters. Do not use a global cache, revision-only shortcut, mutation, skipped validation or altered financial algorithm. Other setters may remain detached: optimize the demonstrated path, not every operation.

**Files:** session controller, ConfigurableDashboard and Retro. **Checks:** chat/dashboard edits preserve graph/scope references and values; record edits/filter changes still publish fresh inputs and recompute current totals; validation still rejects invalid input; latest layout Undo unchanged. Existing stale-source/proposal/session tests plus connected fake workflow.

## Review coverage and deliberately retained designs

- **Architecture/configuration:** inspected startup/composition, package exports, server bridge, runtime capabilities and installed framework guides. One authoritative money engine, strict runtime schemas, side-effect-free factories and explicit startup remain; no replacement service layer.
- **Money/recognition/Retro:** inspected exact amount, graph validation, commands, matching/hold path, tool grounding and proposal preparation. Do not remove detached validation simply to lower CPU: it protects transactions and current sources.
- **Documents/lifecycle:** inspected stream readers, four-worker/source-order intake, worker limits, Blob ownership, refresh projection, leases and reset/revoke. No extraction parallelism, timeout, input-policy or persistence redesign.
- **Rendering:** inspected dashboard catalogue consumers, chart/source/record forms, tours/composer and landing module reachability. Long visual modules are connected and own one feature; length alone is not a defect. Motion and branding remain.
- **Logging:** backend `server.ts` still prints operation metrics and startup/listen failures; `metrics.ts` projects content-free fields. Existing PDF worker stdout/stderr are drained because they can contain source text. Do not turn these private parser payloads into new telemetry or delete any existing operational output.
- **Tests/tooling/release:** no-network setup resets paid settings and blocks external HTTP; boundary checks, frozen packaging, nonroot image/runtime templates and required CI gates remain. Dependency vulnerability assessment belongs to B and cannot authorize upgrades in A.

## Settled execution dispositions

CQ-01 is implemented with explicit authored guidance, a pure reviewed money mapping and generic fallbacks at every identified presentation catch. An existing source-arithmetic regression caught lost useful guidance; marking the three owned dynamic source-review explanations restored it. Read-only pass 1 then identified inherited property names in the upstream-code lookup; a Map and four unknown/inherited-key regressions resolved it. No private backend source/log line changed. Remaining `.message` accesses are the reviewed boundaries or equality checks against internal codes, not arbitrary UI presentation.

CQ-02 removed exactly two unreachable adapters, three direct dependencies and four exclusively obsolete adapter tests. No version upgrades occurred. Pure export/masking/formula-safety checks and original download resources remain.

CQ-03 moved the shared browser reader to transport with UTF-8 byte limits, cancellation and reader release retained. Four focused regressions cover multibyte boundaries, overflow, malformed/empty responses and pending-read abort. Backend and server readers remain separately owned.

CQ-04 retains already validated graph/scope references only for message/layout operations and narrows two financial catalogue memo inputs. Full validation remains. A regression proves unrelated edits preserve references while record/scope changes invalidate them, invalid messages reject without publication and layout Undo restores its value.

**Read-only validation pass 2: Meets ticket; no actionable quality findings.** Rechecked the complete diff, caller ownership, abort/finally cleanup, all surviving catch boundaries, source-review regressions, controller validation/reference invalidation, removed adapter consumers, lockfile-only removals and unchanged backend logging/motion/financial algorithms. No further refactor is justified by an actual defect. See [validation](../validation/RET-013.md) for browser and final gate results. This concludes A's repair loop; it does not assert zero future bugs or complete hosted security acceptance.

### Inventory coverage

Owned-source review covers frontend routes/proxy/server/transport; document inspection/viewers/recognition and processing; session controller/cache/leases/resources; dashboard/catalogue/chart/forms; records/settings; Retro local/live response grounding/forms/typing/tours; backend composition/config/HTTP/admission/challenge/providers/native worker/FX/metrics; public contracts and money calculations/commands/recognition/customization/export/validation; and build/boundary/probe/evaluation scripts, manifests, Docker templates and CI. Static/dynamic/worker reachability was reconciled with CSS imports and public exports. Generated/minified third-party assets were assessed by required consumers and provenance, rather than rewritten as owned source. Security-policy and advisory assessment is explicitly reserved for B.
