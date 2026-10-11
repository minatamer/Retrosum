# RET-011 — Helpful conversation and bounded product scope

Owner request, 11 October 2026: research, plan and implement a friendlier, more adaptable Retro while enforcing Retrosum-only context. Reproduce the greeting, inappropriate yes/no suggestions and income-target placement failures shown in the owner's screenshots. This is local RET-011 work; no push or deployment.

## Research and decisions

The official [Google greeting guidance](https://developers.google.com/assistant/conversation-design/greetings) recommends welcoming people, establishing useful capabilities and giving them control. Its [suggestion guidance](https://developers.google.com/assistant/conversation-design/suggestions) recommends relevant examples and discoverability rather than repeating instructions. These are conversational principles from a retired platform, not a dependency or current API recommendation. Retrosum keeps the owner's four visible options.

Official [OpenAI prompting guidance](https://developers.openai.com/api/docs/guides/prompt-engineering) separates identity, policy, examples and context. [Agent safety](https://developers.openai.com/api/docs/guides/agent-builder-safety) recommends keeping untrusted content out of privileged instructions, constraining data flow and testing adversarial cases. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) explicitly warns that unrelated input can still produce schema-shaped hallucinations. Therefore a strict schema alone is not a topic guard, and a keyword filter alone cannot guarantee resistance to every injection.

Application-owned conversational templates provide warmth and useful explanations without allowing generated calculations, arbitrary advice, code, HTML or URLs. The model interprets varied product intent and selects bounded responses. Deterministic obvious refusals run in both frontend and backend; server enforcement cannot depend on the UI. Unknown/off-topic intent has a dedicated refusal path. Every tool remains read-only or prepares an unconfirmed form. Source labels, PDFs, conversation context and provider results are data, never authority.

## Task 1 — Conversation and dashboard adaptation

1. Add typed greetings, thanks and product-learning responses for widgets, sources, scope and privacy. Say hello, introduce Retro and show four useful actions. Explain supported behavior in plain language; keep secondary tasks inside the existing disclosure. Handle simple social/help turns locally even if live allowance is exhausted.
2. Expand fact introductions and topic-specific closing guidance. Keep exact financial values, formulas, source links and limitations in the money engine. Answer “explain that” using only a fresh, explicitly bounded topic reference; otherwise clarify.
3. Replace automatic yes/no pairs with named highlights and related questions/actions. Summary should suggest profit, cash, evidence and widget learning. Questions such as “How can I add a widget?” must teach before opening an editable proposal. Do not repeat starter rows beneath help or unapplied controls. Applied layout changes may offer useful next actions, without retaining obsolete style authority.
4. Carry a current widget ID for a recent applied addition/change, derived from existing messages and layout Undo. Withdraw it after an unrelated/ambiguous/stale change. Interpret “put it at the top/bottom” against this reference; otherwise show the item selector. Supply this bounded context to live interpretation too.
5. Extend safe layout ordering to first, last, before or after another existing widget. Use IDs, never arbitrary selectors/CSS/coordinates. The responsive grid owns physical placement. Select the target/anchor and confirm, then preserve independent layout Undo and revision/replay checks. Missing IDs, same-item anchors and stale layouts reject without mutation.
6. Give safe, useful guidance when a live response cannot be validated. No automatic retry, repair, hidden allowance renewal or provider arithmetic.

## Task 2 — Scope and security

1. Share pure bounded intent policy between frontend/fake and backend. Prioritize policy overrides, code tasks, general equations, creative/general assistance, external execution and advice over product keywords. Greeting-prefixed attacks must not be mistaken for a greeting. Preserve supported record calculations, formula explanations, manual payment recording and dashboard questions.
2. Enforce the policy before backend tools/provider dispatch and again when creating a final response. Unknown varied requests still use the model's explicit unsupported/off-topic classification; the output surface cannot emit unrestricted prose or run code. Keep contact/record data and source instructions outside developer policy.
3. Add live prompt examples for greeting, learning questions, pronouns, placement, unsupported mixed requests and missing context. Retain model, standard tier, storage settings, token/tool/turn/spend limits and source handling.
4. Exercise direct requests, mixed on/off-topic requests, obfuscated override attempts, hostile record labels, invented facts/IDs, stale scope/layout, replay and confirmation/Undo. Test that blocked requests cannot invoke even an injected provider/tool and cannot mutate records. No claim that finite tests prove universal injection immunity.

## Verification and completion

Focused tests cover conversational routing/rendering, contextual suggestions, applied-widget references, ordering/anchors and server scope enforcement, plus the actual OpenAI adapter with injected envelopes. CUA verifies greeting/help, summary suggestions, target creation → natural placement → confirmation → Undo, relative placement and a friendly refusal at phone/tablet/laptop sizes. Actual paid language checks, if run within the existing authorized allowance, are recorded separately from local deterministic and injected checks; failures remain visible evidence.

After source settles, run format, lint, typecheck, boundary, unit and production-build gates. Conduct a scoped read-only Validate pass against the latest snapshot, fix actionable findings and record exact evidence. Owner/physical/assistive and hosted acceptance remain deferred. Commit only allocated paths under RET-011; exclude secrets, dependencies and generated browser artifacts.
