# RET-008 — Deliver Retro animated forms, confirmation and inline Undo

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-007](RET-007-build-retro-conversation-and-guidance.md)  
Blocks: RET-009  
Suggested commit: `RET-008: deliver Retro animated forms, confirmation and inline Undo`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Complete the third core pillar by letting Retro help create, update and delete the same session records as manual forms. A request such as “create an invoice for Cedar Works, USD 2,000, due November 30 for consulting” produces a validated editable draft form, animated field filling, a compact confirmation and then a real local command result with small Undo.

The language model prepares intent and fields. Shared deterministic commands own financial effects. Animated typing/filling is presentation of validated fields, never a stream of unvalidated model commands or an irreversible action.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- Retro command preparation/clarification contract and bounded OpenAI/fake intent tools.
- Frontend invoice/cost/payment/contact form choreography and inline proposal/result controls.
- Shared proposal revision binding/effect preview integration, result navigation and latest Undo display.
- Focused end-to-end create/edit/delete/matching/staleness scenarios.

## Implementation plan

1. Confirm RET-004 manual commands, inverse receipts and storage are proven; reuse them without a parallel chatbot ledger. RET-007 owns chat/facts/target registry and bounded live turn behavior.
2. Support create/update/delete for invoices, expenses/bills, payment records and contacts. Fetch/identify targets through typed search/results; ambiguous names require a short disambiguation, never mutate the first guessed company.
3. Ask only missing core fields together. Offer predicted answers such as an existing company, due-date/year choices, expense category or Yes/No. Parse USD amount exactly; “2,000” is 200,000 cents. Missing due-date year or status is surfaced, not silently guessed into an issued invoice.
4. Create draft invoices by default. Explicit issue/payment operations preserve their separate financial effects; never equate “bill this customer” with payment received. Show exact before/after effect for changes affecting totals or relations.
5. Validate the proposal against current revision and field schemas before animating. Fill a real editable form field by field with focus-outline/pointer choreography; reserve normal interaction and permit edit/cancel while filling. A user-edited field is not overwritten by later animation steps.
6. Show one inline confirmation/action row in chat/form preview, with Yes/Confirm and No/Edit/Cancel as useful shortcuts. Bind callbacks to proposal ID/revision; no stacked modal approvals. Confirmation makes zero model calls and atomically commits at most five related commands.
7. On success, link to the created/updated record and display small **Undo** in the Retro reply. It invokes the latest eligible shared receipt; metrics/charts/register/export update together. A newer manual or Retro mutation disables old message Undo buttons. Valid latest Undo can restore across refresh.
8. Delete proposals explain affected record/relationships and financial effect before confirmation. Removing a source/event must preserve provenance/tombstone rules and never delete unrelated records. Undo restores the complete eligible command group, not just its label.
9. A graph edit, changed target, duplicate confirmation, expired session or late proposal cannot apply stale data. Cancel/reset/expiry interrupts filling, clears outline timers and invalidates pending actions without leaking into a new session.
10. Exercise all animations/controls in fake mode with generic example intents and production-shaped proposals. Fake language support is bounded, but resulting local CRUD is real validated behavior. Do not replace actual forms with pre-rendered typing screenshots.

## Acceptance criteria

- [ ] Natural-language core CRUD prepares real editable forms for all four object families.
- [ ] Form-fill animation is polished, interruptible and never overwrites visitor edits.
- [ ] Missing/ambiguous core fields are clarified with useful shortcuts.
- [ ] One inline confirmation applies validated commands locally with zero extra inference.
- [ ] Draft/issued/payment distinctions and before/after effects are accurate.
- [ ] Latest Undo is small, discoverable, revision-safe and coherent across all derived views.
- [ ] Duplicate/stale/expired proposal actions cannot mutate records.
- [ ] Fake mode shows the same form/action choreography without claims of arbitrary live understanding.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Create USD 2,000 invoice | Exact cents; required year/identity handled; draft outside income totals |
| Add USD 200 cost, confirm, Undo | 1,480/3,320 then baseline restored everywhere |
| Edit/delete linked event/payment | Accurate dependent balances, preview and complete inverse |
| Visitor edits during fill | Edited field preserved; final validation uses actual final form |
| Double Yes/stale chat chip/manual mutation | One command or safe conflict, no duplicate |
| Reload after success | Finalized reply/record and eligible Undo restore; no replayed inference |
| Cancel/reset during fill/tour | Timers/outlines/old action controls cleaned |

Verify command integration with tests and actual browser choreography on phone/desktop. Do not treat a tool-call JSON response as evidence that the user can see, edit, confirm and undo the task.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
