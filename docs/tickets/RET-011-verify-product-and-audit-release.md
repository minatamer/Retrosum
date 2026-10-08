# RET-011 — Verify responsive product quality and audit the release candidate

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-010](RET-010-harden-privacy-admission-and-spend.md)  
Blocks: RET-012  
Suggested commit: `RET-011: verify responsive product quality and audit the release candidate`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Run the whole demo as a customer would, polish the remaining responsive/accessibility/performance gaps and audit one exact release candidate. The three pillars must feel connected: read visible PDFs accurately, explore an excellent animated dashboard, and use Retro to understand and act with editable forms/Undo.

This packet combines the product-quality pass and release audit for a bounded demo rather than generating separate tickets per device/chart/dialog. It does not turn fake evidence into live accuracy or approve public deployment automatically.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- Necessary final UI/lifecycle performance fixes across the existing owned features.
- Release acceptance matrix and actual evidence for source, money, Retro, privacy and motion behavior.
- Exact candidate dependency/build/artifact inventory, unresolved-risk disposition and release-readiness record.
- Documentation/HTML/ticket consistency corrections based on final observed behavior.

## Implementation plan

1. Walk landing → view every sample PDF → live process (or labelled fake local test) → resolve duplicate/payment review → dashboard drill-down → Retro explanation/tour → animated invoice/expense → confirm/Undo → export → refresh/reset/expiry.
2. Verify all claimed live numeric fields against the complete ground truth for two independent runs, including handwriting/multipage. Record missing/incorrect/invented fields separately. Any incorrect accepted numeric field blocks that layout's public support; no reassuring grand-total-only result.
3. Test phone/tablet/laptop/wide composition, software keyboard, safe areas, touch chart interaction, fixed pill overlays, long text and multipage paper dialog. Polish chart animations, typography/number alignment, glass contrast and form fill using real source-backed data.
4. Verify semantic headings/buttons/dialog focus, keyboard chart/detail/source actions, View data tables, screen-reader announcements, target highlighting/tour focus and error recovery. Preserve requested motion; there is no product animation-off switch. Avoid flashing and make controls/values accessible through their normal states.
5. Measure bundle/first-content/gallery/PDF render memory, chart update smoothness, bounded page caches and lifecycle leaks on target browser/devices. Establish performance targets from measurement rather than claim invented response times. No provider calls triggered by hover/filter/navigation.
6. Audit dependency/contract boundaries, duplicate financial logic, stale TODO/mock leakage, active/fake mode imports, secret/client exposure, unsupported format claims, dangerous logs and oversized parser/export resources. Run settled root quality/test/build gates once final fixes settle.
7. Inspect local production build output and asset/font/PDF worker packaging. No temp scripts, private inputs, `.env`, sibling project identifiers or live expected-result imports belong in release. Docker image contents/Linux startup verification belongs to deferred RET-012 and is not required to finish this local pass.
8. Capture exact commit/worktree digest/candidate versions and evidence. Track fake/injected, local browser, owner-run live and cloud evidence separately. A ticket-named commit or passing test count does not prove the product flow.
9. Update active docs and HTML to final behavior; ticket status reflects actual completion with remaining live/cloud prerequisites explicitly pending. Do not publish “zero mistakes on every document” or pretend broad finance compliance.
10. Prepare a concise release readiness/rollback handoff for RET-012 with actual provider spend, configured limits, domain/IAM/operator inputs and unresolved blockers. Resolve material local issues in this packet rather than making deployment repair them silently.

## Acceptance criteria

- [ ] Complete flow works coherently and all three pillars meet intended visual/functional quality.
- [ ] Source-backed metrics, live numeric acceptance and CRUD/Undo/export checks have exact evidence.
- [ ] Phone/keyboard/touch/source/dialog/composer interactions are usable and unobstructed.
- [ ] Smooth signature animations remain enabled with accessible normal controls.
- [ ] Performance/resource behavior is measured and no material leak/overrun remains.
- [ ] Exact release candidate passes settled quality/test/build/packaging checks.
- [ ] Privacy/support/performance claims match observed behavior and evidence class.
- [ ] Material release blockers are resolved or explicitly keep public launch unavailable.

## Verification and evidence

| Case                              | Evidence                                                    |
| --------------------------------- | ----------------------------------------------------------- |
| Whole-flow local fake run         | Production-shaped UI and zero network/inference             |
| Bounded owner live run            | Actual corpus accuracy/usage, no cached result substitution |
| Device/input matrix               | Screenshots plus keyboard/touch/screen-reader notes         |
| Loss/zero/missing/ambiguous cases | Honest math and readable design                             |
| Repeat refresh/Reset/expiry       | No lifecycle leak, stale command or rebilling               |
| Production builds/images          | Exact asset/dependency/startup inventory                    |
| Final claim audit                 | Docs/HTML/UI agreement and clear pending cloud inputs       |

Broaden tests only for new fixes or unresolved concerns. Record what was actually run and the exact limitations; do not replace a concise release audit with a copied chronological log of every tool invocation.

## Scope limits and completion record

For the current owner-authorized execution scope, live numeric/spend measurements, owner aesthetic feedback and actual cloud deployment happen later. A completed local fake-mode walkthrough and local quality review may be recorded as **Implemented locally — deferred acceptance pending**, retaining each unperformed check explicitly. Proceed to RET-012 local packaging/preparation after clean local validation; do not ask for cloud credentials during the local loop.

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
