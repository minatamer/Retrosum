# RET-004 — Build the canonical money workspace, CRUD, Undo and refresh recovery

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-001](RET-001-initialize-workspace-and-contracts.md), [RET-003](RET-003-author-sample-pdfs-and-viewer.md)  
Blocks: RET-005, RET-006  
Suggested commit: `RET-004: build the canonical money workspace, CRUD, Undo and refresh recovery`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Implement the single current-revision money graph and all deterministic operations that both forms and Retro will use. A guest can create/read/update/delete invoices, expense/bill records, payment records and simple customers/vendors, resolve review relationships, undo the latest reversible action and refresh without losing the workspace.

This packet deliberately keeps money, command behavior and persistence together: a restored graph must preserve the same financial invariants and provenance as a live edited graph. Components do not own alternate totals, and IndexedDB is browser-only temporary Blob storage rather than a hosted product database.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- `packages/money` event/payment relations, formulas, eligibility, commands, proposals/effects and inverse receipts.
- Frontend canonical reducer/selectors/effect orchestration, manual core forms and records/review register.
- Bounded projection schema, `sessionStorage` access, temporary IndexedDB Blob adapter and restore reconciliation.
- Shared synthetic financial/command/restore fixtures and backend-safe validation surfaces.

## Implementation plan

1. Separate source document, canonical economic event, source-stated payment claim, actual movement and matching relation. Repeated rendition, duplicate receipt or matched statement must not double count income/cost/cash. Unknown settlement is distinct from explicitly open.
2. Compute exact USD cents: income/cost on declared net/document basis; tax separate; profit preview = included income − included costs; margin only with valid nonzero income; recorded cash from unique movements; customer/supplier open from explicit issued balances and valid matching. Owned-account transfer is neither income nor cost.
3. Implement one strict workflow reducer with per-document states, current revision and operation generation. Register selection/filter/display state is derived or clearly transient; provider result cannot overwrite newer state after reset/edit.
4. Implement minimal forms: invoice customer, number, issue/due dates, USD, service description/quantity/unit price/optional explicit tax and draft/issued state; cost vendor, date, description/category/net/tax/gross/payment claim; payment amount/date/direction/reference/optional relation; contact name/role/optional contact fields. Do not require all research extension fields.
5. New invoices start as drafts, outside income/open totals until explicitly issued. Recording payment is separate. Editing a linked event or deleting a payment recomputes balances and review issues; reject impossible relationship updates or preview the exact dependent changes before applying.
6. Build shared typed commands with command ID/expected revision and at most five related operations applied atomically. Validate first, increment once, recalculate once, invalidate stale explanations/proposals and persist a coherent projection. Duplicate IDs/confirmation cannot create duplicate records.
7. Produce an inverse/receipt for the latest reversible command group. Undo validates revision, restores affected records/relations atomically and clears its receipt. A later mutation invalidates older chat Undo controls. Reset/export/provider calls are not undoable. Manual forms and future Retro use the same command APIs.
8. Persist a strict ≤2 MiB projection with graph, source metadata, revision, fixed two-hour timestamps, filters, bounded finalized chat and latest Undo. Put actual PDF Blobs in browser-only IndexedDB under per-session document/hash keys within the 20 MiB cap. Never persist Base64/raster copies, pending requests/controllers/object URLs or challenge secrets.
9. Restore after schema/size/expiry and graph validation, then reconcile Blobs. Do not automatically redo interrupted paid work. Pending proposals restore stale/cancelled; missing originals preserve honestly labelled valid records but require re-selection for reprocessing.
10. Handle blocked/full storage without silently announcing a save. Protect the previous valid projection during failure; show refresh recovery unavailable when falling back to in-memory use. Expiry is absolute and refresh cannot renew it.
11. Prevent competing duplicated tabs from accidentally sharing writable session identity with an ownership handshake/fork policy. Reset/expiry remove only owned projection/Blobs and revoke local effects. Close cleanup is best effort; expired remnants are swept when the app next runs, not guaranteed erased while closed.

## Acceptance criteria

- [ ] Harbor fixture totals and every inclusion/exclusion formula match visible ground truth exactly.
- [ ] All four object families support usable manual CRUD with provenance and sensible errors.
- [ ] Draft/issued, paid claim/recorded movement, tax and unknown/open status are distinct.
- [ ] D03/D06 duplicate and D07 payment matching cannot double count.
- [ ] One command batch produces one revision, no partial graph and one eligible latest Undo.
- [ ] Refresh restores records, PDFs, filters and eligible Undo without provider dispatch.
- [ ] Corrupt/expired/oversized/storage-denied/missing-Blob states are truthful and safe.
- [ ] Reset/expiry/tab ownership and stale async results cannot resurrect old data.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Baseline / add 200 cost / Undo | Costs 1,280 → 1,480 → 1,280; profit 3,520 → 3,320 → 3,520 |
| Draft invoice / issue / payment | No draft financial effect; correct distinct event/cash/open effects |
| Duplicate / partial payment / transfer | One event, correct remaining balance, no transfer income/cost |
| Atomic failure / duplicate command / stale revision | No partial changes or repeated record |
| Reload after CRUD/Undo | Same source hashes/graph/revision, zero inference calls |
| Invalid projection/full storage/missing original | Bounded recovery and accurate persistence/source labels |
| Expiry/Reset/two tabs/late result | Owned cleanup, no cross-tab mutation or old generation resurrection |

Use meaningful pure financial and adversarial restore tests, not tests mirroring reducer branches mechanically. Complete settled root gates and focused browser/manual CRUD-refresh checks. Record browser close/restore limitations accurately.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
