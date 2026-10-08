# RET-009 — Complete exports and whole-session reset, expiry and recovery

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-008](RET-008-deliver-retro-animated-crud.md)  
Blocks: RET-010  
Suggested commit: `RET-009: complete exports and whole-session reset, expiry and recovery`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Finish the complete guest journey with revision-consistent export and reliable session lifecycle. A visitor can inspect what will be exported, download structured records/summary and eligible locally created invoice PDFs, then reset or let the temporary workspace expire without old data or operations reappearing.

The browser retains uploaded originals only for the bounded local session. Reset cannot retract prior downloads or erase provider-controlled copies. The product must state actual browser expiry/cleanup behavior without claiming instant deletion everywhere.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- Browser export preparation/serialization/download and invoice PDF rendering.
- Export review sheet and provenance/mode/revision metadata.
- Session-wide cleanup orchestration, expiry UI, cancellation/late-result isolation and restore reconciliation integration.
- Content-free API clear/revoke endpoint and lifecycle/manual evidence.

## Implementation plan

1. Capture an immutable current revision, selected period/USD scope, included/excluded/review records and calculation basis. If the graph changes while preparing export, complete the captured version with its label or restart deliberately; never mix revisions.
2. Implement the blueprint section 13 bundle: normalized structured data, readable overview and relevant registers/review/source manifest. Apply documented safe spreadsheet-cell/CSV formula handling, exact money/date encoding and bounded archive/memory work. Do not put hidden financial records into an export that the visitor could not inspect.
3. Support a simple PDF output for locally created invoice records using the shared validated core fields; visibly retain draft/issued status and synthetic/demo nature. Render exact USD fields without inventing professional compliance/tax fields or sending the invoice anywhere.
4. Originals are excluded by default and included only through a clear opt-in explaining they are unredacted original bytes. Optional sensitive identifiers follow actual implemented inclusion/redaction rules; a record-summary redaction is not a promise that original PDFs were redacted.
5. Mark live vs development-fake interpretation provenance, source IDs/pages, manual creation/correction, review issues and as-of date. Export must not imply official audited accounts or actual payment execution.
6. Centralize session reset: invalidate generations, cancel requests, stop workers/fill/tour timers, clear graph/chat/Undo/proposals and remove only owned projection/Blob entries. Revoke object URLs and drop download buffers. A failed server revoke does not undo successful local cleanup.
7. Apply the fixed two-hour expiry without renewing it on refresh. Explain expiry, stop new work, preserve any already downloaded files externally, and clear local owned content. Purge expired leftovers on startup/while active; document that a closed/crashed browser cannot execute immediate physical deletion.
8. Preserve partial successes after recoverable operation failure. Reload interrupted processing as deliberate retry, never auto-resubmission. Paid admission cookies/counters remain independent of browser graph lifetime and cannot be replenished by reset.
9. Handle closing/reopening/viewer/download/mobile lifecycle cases without accidental cleanup on ordinary refresh or history navigation. ScreenPilot's selective projection is inspiration; test Retrosum's actual PDF Blob lifecycle rather than assuming their CV behavior matches.

## Acceptance criteria

- [ ] Export is complete, accurate, mode-labelled and tied to one revision/period/basis.
- [ ] Created invoice PDF shows correct core values/status and no fake payment/compliance claim.
- [ ] Originals/sensitive fields follow explicit actual choices and preserve accurate privacy wording.
- [ ] Reset and expiry clear owned browser content and stale actions without deleting unrelated sessions.
- [ ] Cancellation/late result cannot resurrect cleared data or repeat paid work.
- [ ] Refresh remains recoverable before expiry, and expiry is fixed.
- [ ] Export/storage/download failures have useful recovery states and release buffers.
- [ ] Provider/download retention limitations are stated accurately.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Baseline/edited/draft/review export | Exact records, figures, status and provenance |
| Change during export | Single captured revision or explicit restart |
| Include original/sensitive option | Actual output bytes/fields match wording |
| CSV injection-like description | Safe output, inert source input |
| Reset during extract/chat/fill/download | No stale resurrection; all owned effects released |
| Refresh vs expiry vs closed browser startup | Recovery before expiry; lazy purge afterward |
| Storage cleanup/API revoke failure | Correct local state and truthful handling message |

Open exported artifacts for visual/data inspection and compare them with the captured graph. Use deterministic clock/lifecycle tests and focused browser memory/resource observations; no paid provider call is needed to test local cleanup logic.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
