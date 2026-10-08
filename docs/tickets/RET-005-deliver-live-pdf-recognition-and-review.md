# RET-005 — Deliver live OpenAI PDF recognition, review and exact-number evaluation

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-004](RET-004-build-money-state-crud-and-refresh.md)  
Blocks: RET-006, RET-010  
Suggested commit: `RET-005: deliver live OpenAI PDF recognition, review and exact-number evaluation`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Connect the displayed sample PDFs and visitor PDFs to real bounded OpenAI interpretation through the private API. Classification, numeric transcription, role/date/currency interpretation and per-record evidence arrive in one admitted document operation. The public sample is processed live; completed restored records do not trigger another paid run.

The release gate is zero incorrect numeric transcriptions across the published legible corpus in two independent live runs. This is measured fixture accuracy, not a guarantee for every upload. Schema correctness or matching grand totals alone cannot establish numeric truth. Ambiguous digits remain held for review and excluded from affected totals.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- Frontend PDF intake/inspection/progress, live action disclosure and field/source review UI.
- Backend extract route/use case, request-scoped parser and OpenAI Responses adapter.
- Versioned interpretation schema/prompt, source validation, numeric ambiguity and multi-entry PDF handling.
- Fake/injected provider cases and documented live evaluation/usage record.

## Implementation plan

1. Confirm RET-004 graph/restore/commands and RET-003 byte/hash ground truth are verified. Sample start reads the public original assets, shows all PDFs, inspects them, then uses the same admitted extraction path as uploads. Do not import expected JSON into live composition.
2. Enforce MIME/container, one-file 5 MiB, workspace 20 MiB/10 PDFs/20 pages, per-image/decode work and 25-line/100-register-row limits before paid dispatch. Reject unsupported encryption/damage/active resource behavior safely. Do not invent source locators for failed inspection.
3. Forward bounded multipart browser → same-origin Next bridge → private Express with cancellation/deadline and exact origin policy. Keep originals request-scoped in servers; no saved uploads, bucket, provider Files or server document library.
4. Implement a centralized OpenAI Responses adapter with evaluated `gpt-6.1-sol`, inline PDF `input_file`, structured output, foreground `store:false`, supported reasoning effort and no automatic retries. Validate refusal/incomplete output/usage/schema/grounding before producing app records.
5. Use one interpretation request per original, not separate paid classification and extraction. Exact byte duplicates already present can reuse current evidence with correct provenance; D03/D06 differing scans still need relationship review. A deliberately retried failed extraction uses the one workspace retry allowance.
6. Return bounded arrays for statement/history PDFs with page/block citations. Extract all visible required numbers, units, date digits and identifiers separately; native text checks and recomputed arithmetic flag inconsistency but cannot silently correct a wrong number from a fixture lookup.
7. Resolve business roles against Harbor/visitor-confirmed identity. Separate income/cost/payment/reference, net/tax/gross, source paid claim and actual movement. Missing tax is not invented zero tax; incomplete payment evidence is not automatically paid/open.
8. Show genuine stages (inspecting/submitting/reading/validating/needs review/ready/failed), no invented percentages or fictitious streaming OCR text. Partial batch failure preserves successful sources and original previews. Review opens the exact original page, displays raw/normalized value and computes effect before acceptance.
9. Integrate baseline paid-off, action admission, request count/token reservation/deadline and sanitized logging now; RET-010 will harden and measure the complete system. Reject before provider calls when disabled/over quota/unsupported. Outcome-unknown never silently retries or refunds metered work.
10. Fake mode returns only declared fixture/case shapes, visibly simulated; arbitrary visitor PDF preview/manual entry remains available without fake recognition claims. Exercise exact same progress/review/UI contracts.
11. Prepare a live evaluation runner/report that consumes actual PDFs and compares every numeric field afterward against independently authored truth. Owner-run paid acceptance is bounded and separately recorded: two independent dispatched runs per published layout/handwriting source, complete results, model/prompt/schema/version and token spend.

## Acceptance criteria

- [ ] Sample and visitor live routes share validation/provider behavior; no hidden prepared public data.
- [ ] Actual inspected PDF bytes are sent; OpenAI credentials never enter browser/public frontend.
- [ ] Each accepted numeric field has exact source evidence and no invented confidence score.
- [ ] Multipage statements/history preserve every eligible record and locator without truncation.
- [ ] Ambiguous or inconsistent critical figures are held, not guessed into the money graph.
- [ ] Disabled/invalid/stale/replayed requests dispatch zero extra model work.
- [ ] Fake/error/abort/partial success paths preserve honest provenance and previews.
- [ ] Public live support stays closed until two-run exact-field acceptance, including genuine handwriting, passes.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Sample actual bytes vs expected JSON isolation | Import/boundary test and extraction request hash |
| All required numbers | Field-level equality, not just final totals |
| Scanned/handwritten/multipage | Separate recorded live results and source references |
| Ambiguous digit/tax mismatch/currency mismatch | Held review issue, zero incorrect accepted totals |
| Prompt injection in PDF | No policy/tool/action authority granted |
| Bad MIME/encryption/page excess/disabled paid mode | Zero dispatch with readable failure |
| Timeout/cancel/lost response/reload | No automatic rebilling or stale result application |

Local implementation may close with fake/injected evidence while its **live acceptance remains Pending** and public capability remains unavailable. Later local UI tickets can proceed against the verified contract. A fake pass never becomes live OCR evidence; record paid measurements only after actually run and authorized.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
