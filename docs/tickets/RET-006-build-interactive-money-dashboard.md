# RET-006 — Build the beautiful interactive dashboard and source drill-down

**Current acceptance — 10 October 2026:** Local implementation is complete. The current sample contains ten PDFs/eighteen pages; two independent live numeric/record passes, seventeen live Retro cases and real localhost Turnstile/browser checks passed. The owner confirms the configured USD 5 OpenAI spending limit. Owner/physical/assistive/general-upload/manual account checks and hosted acceptance remain separate. See [current status](../CURRENT-STATUS.md) and [RET-011 evidence](../validation/RET-011.md).

Status: **Implemented and verified locally — owner visual acceptance pending**
Last synchronized: **10 October 2026**<br>
Depends on: [RET-004](RET-004-build-money-state-crud-and-refresh.md), [RET-005](RET-005-deliver-live-pdf-recognition-and-review.md)  
Blocks: RET-007  
Suggested commit: `RET-006: build the beautiful interactive dashboard and source drill-down`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Deliver the second core pillar: a visually polished, smoothly animated dashboard where every KPI and chart has a precise meaning, scope and inspectable contributors. It consumes the current canonical graph after live processing or explicitly labelled development fakes; no hard-coded presentation ledger or invented history is allowed.

Use primary patterns from the blueprint's QuickBooks, Mercury and Ramp research to serve a small business's actual questions. Keep the full metric/chart contract from section 6.5; avoid cramming unsupported commercial banking metrics into the demo.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded manual/hosted release gates remain pending; current local paid acceptance is already recorded in RET-011.

Areas owned by this packet:

- Overview route, metric selectors/fact catalogue, animated Recharts/SVG components and detail drawers.
- Period/as-of/category/counterparty filter state and exact contribution query surfaces.
- Reusable chart hover/focus/click/touch behavior and table alternative.
- Dashboard visual/manual acceptance evidence at realistic source-backed data sizes.

## Implementation plan

1. Confirm money formulas from RET-004, recognized/review source contracts from RET-005 and all visible comparison entries from RET-003. Backend and frontend use the same pure selectors; no duplicated float arithmetic in chart components.
2. Implement headline invoiced income, documented costs, profit preview, margin preview, recorded cash in/out/net movement, known customer/supplier open, overdue/as-of context and review/coverage counts. Tax, gross and cash bases remain labelled. Unknown/missing values render unavailable, not zero.
3. Build section 6.5 charts: income/cost/profit trend; recorded cash movement; category composition; open customer/supplier balances and due timing; counterparty contribution; review/coverage context where useful. Use restrained donuts for genuine part-to-whole and bars/lines for comparisons. Empty history does not receive a fake curve.
4. Start with the two supplied periods and dated within-period records. August bars drill into D08; September income links D01/D02; rent segment opens D04. Do not add decorative monthly points unsupported by source entries.
5. Create one typed metric/fact catalogue with revision, date basis, currency, filter scope, formula, contributor IDs and source references. Retro later uses these facts. A metric detail presents exact included/excluded records, applicable issues and source buttons, not generic copy.
6. Add precise hover and keyboard-focus tooltips, clickable data marks/legends, meaningful selected states, responsive scale/axis labels and touch-accessible alternatives. A chart click can filter/detail without changing financial facts. Period comparisons use compatible bases and explicit source coverage.
7. Use Recharts and Motion if they satisfy the measured chart/choreography need; custom SVG is acceptable for a small bounded case. Bundle only needed modules. Animate initial reveals and graph updates smoothly without showing wrong intermediate authoritative money text. Keep exact final numbers stable/tabular.
8. Coordinate chart detail/source dialog/Retro composer layers. Reserve composer space, preserve focus return and announce selected detail. No chart or source action is hover-only. Provide a compact View data table for the same exact values without disabling animation.
9. Handle manual CRUD/Undo/review revision updates together: KPI, chart, selected detail, coverage and export facts must refer to the same graph. Mark incompatible Retro explanations stale rather than retaining outdated “AI” conclusions.
10. Include rich but honest empty, one-point, loss, zero-income margin, missing-history, unknown settlement and many-small-category states. Values/signs and category labels remain distinguishable without color alone.

## Acceptance criteria

- [x] Every KPI in section 6.5 appears with accurate date/basis/coverage semantics.
- [x] Every chart mark and headline has appropriate contributor/source access.
- [x] No hidden dataset, fake trend, unsupported balance or misleading zero state exists.
- [x] Hover/focus/click/tap are polished, useful and keyboard reachable.
- [x] Animations feel smooth and professional without an off setting.
- [x] CRUD, duplicate resolution and Undo update all derived views coherently.
- [x] Phone/tablet/desktop layout keeps figures and actions readable.
- [x] Table alternatives and source links expose the same values as charts.

These checks establish implemented local behavior. Owner aesthetic acceptance and physical-device feedback remain pending; local inspection does not claim that external approval.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Harbor baseline | KPI/axes/tooltips agree with exact money fixture |
| August vs September | 20% income / 16.4% cost / 21.4% profit change with real D08 sources |
| Rent composition | 800 and 62.5%, source D04, correct denominator |
| Add 200 cost / Undo | Smooth update to 1,480 costs / 3,320 profit and back |
| Missing history/zero income/loss/unknown status | No invented comparison/margin/settlement |
| Keyboard/touch and composer overlap | Reachable tooltip/detail/source, unobstructed controls |
| Revision change while detail open | Correct refresh/stale state, no mismatched contributors |

Run focused selector/integration tests and settled root gates. Manual visual acceptance on real data is required; SVG DOM assertions alone cannot prove a beautiful usable dashboard. Record device sizes and motion observations.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

## Historical local execution snapshot

The following original results retain their dated corpus and acceptance boundaries; use the current status above for outstanding work.

**Execution record:** Implemented the shared typed fact/series catalogue, period/as-of/category/counterparty scope, exact availability/exclusions, prior comparisons and due/ageing semantics; responsive custom SVG/native-control charts, equivalent tables, profit reconciliation and current-revision contributor/original dialogs. One browser session connects Overview/Documents/Records; explicit intake continues while Overview is viewed. Narrow existing-flow integration shares availability with Records, suppresses inactive overlays and restores source-dialog focus. No chart dependency, hidden dataset, model-plotted amount or animation-off control was added.

Local evidence: actual sample scanning/review, exact Harbor/August figures, Rent 800/62.5% and D04 access, D08 page 2 access, manual 200 cost/refresh/Undo, missing-history/cash/settlement and filtered-loss/as-of cases, tables, keyboard tooltips/arc/source focus and revision changes while a detail stays open. Ten viewport sizes plus an inspected 1366×900 composition have no page overflow and measured composer clearance. See [dashboard decisions](../engineering/DASHBOARD.md), [validation](../validation/RET-006.md) and [three-group file-level plan](../commit-plans/RET-006.md). Final settled gates passed: 124 tests in 15 files, 66 source boundaries, strict types, lint, formatting and both production builds. Pass B found no actionable findings after the prior-coverage wording fix. Owner aesthetics, physical-device feedback, live accuracy/spend and cloud acceptance remain deferred; no paid request, push or deployment occurred.
