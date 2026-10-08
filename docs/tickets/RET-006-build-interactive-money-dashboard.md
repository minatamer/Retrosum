# RET-006 — Build the beautiful interactive dashboard and source drill-down

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-004](RET-004-build-money-state-crud-and-refresh.md), [RET-005](RET-005-deliver-live-pdf-recognition-and-review.md)  
Blocks: RET-007  
Suggested commit: `RET-006: build the beautiful interactive dashboard and source drill-down`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Deliver the second core pillar: a visually polished, smoothly animated dashboard where every KPI and chart has a precise meaning, scope and inspectable contributors. It consumes the current canonical graph after live processing or explicitly labelled development fakes; no hard-coded presentation ledger or invented history is allowed.

Use primary patterns from the blueprint's QuickBooks, Mercury and Ramp research to serve a small business's actual questions. Keep the full metric/chart contract from section 6.5; avoid cramming unsupported commercial banking metrics into the demo.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

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

- [ ] Every KPI in section 6.5 appears with accurate date/basis/coverage semantics.
- [ ] Every chart mark and headline has appropriate contributor/source access.
- [ ] No hidden dataset, fake trend, unsupported balance or misleading zero state exists.
- [ ] Hover/focus/click/tap are polished, useful and keyboard reachable.
- [ ] Animations feel smooth and professional without an off setting.
- [ ] CRUD, duplicate resolution and Undo update all derived views coherently.
- [ ] Phone/tablet/desktop layout keeps figures and actions readable.
- [ ] Table alternatives and source links expose the same values as charts.

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

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
