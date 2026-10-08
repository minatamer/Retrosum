# RET-007 — Build Retro conversation, grounded explanations and interactive guidance

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-006](RET-006-build-interactive-money-dashboard.md)  
Blocks: RET-008  
Suggested commit: `RET-007: build Retro conversation, grounded explanations and interactive guidance`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Deliver Retro as a useful floating assistant: summaries, dashboard explanation, grounded questions, source navigation and an interactive guided tour. The floating pill is visible in the workspace; the user never needs a generic bottom-right chatbot launcher.

User messages are bubbles; Retro's replies are unboxed readable text with inline source/actions and predicted-answer chips. Retro can point, outline and scroll to application-owned targets. Language comes from OpenAI in live mode or explicitly labelled development fakes; navigation/calculation/tour actions remain local.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- Frontend floating conversation/composer, message states, sources and shortcut actions.
- Backend investigation use case/OpenAI bounded tool loop, typed facts/answer contract and grounding validator.
- Shared tool/target/action schemas, application-owned highlight registry and local tour definition.
- Fake generic prompt catalogue and stale/failed/clarification scenarios.

## Implementation plan

1. Reuse RET-002 glass tokens/shell and RET-006 typed fact catalogue. Final monetary claims reference computed fact IDs with revision/currency/period/source coverage; the model never computes official totals itself.
2. Implement bounded tools to inspect summary, records, contributors, source excerpts and allowed navigation targets. Revalidate the submitted normalized graph server-side and recompute facts with `packages/money`. Model output requesting arbitrary DOM selectors, code, network or unsupported finance actions is rejected.
3. Live Retro uses the configured OpenAI adapter and the existing admission policy: eight turns per admission run, at most three model requests and four tool calls per turn, bounded input/output, whole-turn deadline and zero automatic retries. Gather missing clarification essentials together and disclose that submitting a clarification consumes a turn.
4. Support summary, explain-this-chart, compare-supplied-periods, largest-cost/customer, show-source and site tour. Money amounts render from validated typed facts; narrative cannot sneak ungrounded digits/claims into authoritative cards. Unknown history/settlement stays unknown.
5. Implement contextual quick replies with suggested Yes/No/follow-ups/Show sources and accessible focus semantics. Typed local navigation/source/tour chips cost zero requests; a natural-language follow-up deliberately consumes a turn. Do not silently send a request just because a suggestion became visible.
6. Implement smooth scroll and temporary outline/pointing effects via a stable registry of actual mounted application targets. Tours use Next/Back/Finish, target-specific explanations and current dashboard scope. Stop cleanly for manual navigation, missing targets, dialogs, resize, reset and expiry; never hijack focus away from active typing.
7. Track idle/submitting/staging/validated/completed/stale/failed/cancelled states. Stage-only text may stream; final financial claims wait for grounding. User turns persist only in the bounded browser projection; pending requests/actions do not re-run after reload.
8. Fake mode supports generic known prompt intents rather than only a single canned demo click. Fake summaries read current facts so edits change answers. Unsupported prompts state the limitation and offer useful chips. Simulate clarification, stale answer, tool cap, refusal and failure without network.
9. Preserve manual forms, local tour, deterministic chart explanations, existing messages and source viewing if live AI is unavailable/exhausted. Do not silently claim fake answers are live.
10. Keep message layout readable under long replies/source lists/mobile keyboard. Composer and conversation can expand/collapse without introducing a round launcher. Avoid unnecessary full-screen conversation when the tour needs the dashboard visible.

## Acceptance criteria

- [ ] Floating glass pill, user bubbles and unboxed Retro text follow the owner direction.
- [ ] Retro summarizes, explains, answers, tours, scrolls and highlights actual fields/sections.
- [ ] Every financial claim binds validated current facts and source references.
- [ ] Quick replies work with keyboard/touch and reduce typing without hidden requests.
- [ ] Tool/turn/deadline limits and paid-off behavior are enforced server-side.
- [ ] Manual local guidance and source viewing remain useful during API outage.
- [ ] Fake generic examples exercise the same UI/choreography honestly.
- [ ] Stale/filter-changed/late results cannot masquerade as current facts.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Summary after manual edit | Exact updated amount, correct revision and sources |
| Explain rent chart | Scroll/outline actual chart and source D04 |
| Tour interruption/mobile keyboard | No stuck overlay or stolen focus |
| Unknown history/advice/injection | Honest limitation, no invented fact/action/tool authority |
| Untrusted selector/tool/fact ID | Contract rejection, no executable model text |
| Turn/tool cap/timeout/disabled paid mode | Correct request counts and recoverable UI |
| Development generic prompt/failure | Labelled deterministic response and zero network |

Use grounding/tool-loop boundary tests and focused real-browser tour/composer checks; do not test only the fake text dictionary. Live factual/tool performance remains separately measured under the owner-run budget.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
