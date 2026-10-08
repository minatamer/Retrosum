# Retrosum implementation ticket queue

Updated **8 October 2026**. The owner authorized the full local fake-mode execute/validate loop and per-ticket commits. **RET-001 is Complete; RET-002 is implemented locally with owner visual acceptance pending; RET-003 is next.** The [source of truth](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md) owns product/architecture behavior; the [HTML brief](../RETROSUM_OVERVIEW.html) summarizes it. Actual live accuracy/spend, owner visual feedback and cloud deployment remain pending.

## Why twelve packets

Actual ClipBuilder's source-of-truth section 22 records consolidation from 22 slices to 15 cohesive tickets. Retrosum follows that principle: one reviewable feature includes its UI, contracts, backend/local effects, recovery and meaningful checks. ScreenPilot's detailed packets supply acceptance specificity; its earlier ticket volume is not the model. There are no separate tickets for each form, endpoint, chart, font, shadow, shortcut or highlight.

RET-001 establishes safe boundaries. RET-002/003 make the brand and visible evidence concrete. RET-004/005 establish real financial state and live recognition. RET-006/007/008 deliver the dashboard and Retro experience. RET-009 closes the guest lifecycle; RET-010/011/012 harden, verify and release. Basic privacy/admission starts early and is not postponed until hardening.

## Canonical queue and dependencies

| Ticket                                                        | Complete outcome                                                         | Dependencies     | Status                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------- | --------------------- |
| [RET-001](RET-001-initialize-workspace-and-contracts.md)      | Initialize the workspace, contracts and safe runtime                     | None             | Complete              |
| [RET-002](RET-002-build-brand-and-landing.md)                 | Build the brand system and calm sourced landing                          | RET-001          | Local; visual pending |
| [RET-003](RET-003-author-sample-pdfs-and-viewer.md)           | Author the visible PDF corpus and floating paper viewer                  | RET-002          | Planned               |
| [RET-004](RET-004-build-money-state-crud-and-refresh.md)      | Build the canonical money workspace, CRUD, Undo and refresh recovery     | RET-001, RET-003 | Planned               |
| [RET-005](RET-005-deliver-live-pdf-recognition-and-review.md) | Deliver live OpenAI PDF recognition, review and exact-number evaluation  | RET-004          | Planned               |
| [RET-006](RET-006-build-interactive-money-dashboard.md)       | Build the beautiful interactive dashboard and source drill-down          | RET-004, RET-005 | Planned               |
| [RET-007](RET-007-build-retro-conversation-and-guidance.md)   | Build Retro conversation, grounded explanations and interactive guidance | RET-006          | Planned               |
| [RET-008](RET-008-deliver-retro-animated-crud.md)             | Deliver Retro animated forms, confirmation and inline Undo               | RET-007          | Planned               |
| [RET-009](RET-009-complete-exports-and-session-lifecycle.md)  | Complete exports and whole-session reset, expiry and recovery            | RET-008          | Planned               |
| [RET-010](RET-010-harden-privacy-admission-and-spend.md)      | Harden privacy, private transport, abuse controls and spend readiness    | RET-005, RET-009 | Planned               |
| [RET-011](RET-011-verify-product-and-audit-release.md)        | Verify responsive product quality and audit the release candidate        | RET-010          | Planned               |
| [RET-012](RET-012-deploy-and-validate-cloud-run.md)           | Deploy manually, validate live behavior and record rollback              | RET-011          | Planned               |

The next eligible local packet is **RET-003**. The canonical order above is sufficient; do not infer parallel agent authorization from the dependency graph. Start a packet only when the user requests implementation and its required local dependency evidence exists.

## Non-negotiable product decisions

- English and USD; one fictional Harbor Studio business.
- Eight modest sample PDFs, some multipage, one handwriting example fetched from a reusable source or recreated with documented provenance, and every financial/comparison figure visible in the originals. A recreated handwriting-style receipt is permitted; do not label it human-authored without evidence.
- Public sample processes those actual bytes live with OpenAI. No hidden prepared public dataset. Development fake mode has generic supported Retro examples and the same interaction behavior, clearly labelled and no-key/no-network.
- Exact numeric transcription is the main release gate: complete required numeric field comparison on two independently dispatched live runs per published fixture; uncertainty is held. No guarantee about every arbitrary upload.
- Beautiful smooth interactive source-linked charts, forest/orange/ivory, professional vintage typography and calm photo hero. No animation-off product setting.
- Retro is a floating glass pill composer with floating messages, user bubbles and unboxed Retro replies; summaries, explanations, tours, scroll/highlights, contextual shortcuts and animated editable forms.
- Real local CRUD for invoices, costs/bills, payments and contacts through one command engine; compact inline confirmation and small latest-action Undo.
- Refresh preserves records/original previews. Bounded per-tab browser projection plus temporary browser-only Blob storage; proposed fixed two-hour expiry, Reset and accurate lazy-cleanup wording. No server database or upload bucket.
- OpenAI selected, initial evaluated candidate `gpt-6.1-sol`; approximately USD 5 initial credits, actual usage measured. No Gemini comparison prerequisite or automatic provider fallback.

## Execution and completion policy

**Owner authorization, 8 October 2026:** execute/validate every packet, including RET-012 local packaging/preparation. Research/acquire or recreate the handwriting PDF without making an owner-provided scan a prerequisite. OpenAI accuracy/spend measurements, owner visual feedback and actual cloud deployment happen later. Local development and verification use pnpm/Node; a running Docker engine, OpenAI key, cloud credentials and an approved visual design are not prerequisites for local progress. Keep any unavailable container verification explicitly pending.

Each packet has standalone context, concrete ownership, implementation steps, acceptance criteria and focused verification. Suggested module paths are responsibilities, not instructions to create empty placeholders. Follow the blueprint's authority order and reuse shared contracts/calculations.

Use statuses **Planned**, **In progress**, **Implemented locally — live acceptance pending** where applicable, and **Complete** only after the packet's actual required evidence is recorded. A local fake/injected pass can unblock local dependent UI work without enabling an unproved live capability. RET-005's exact-number gate and RET-012's deployed acceptance remain distinct.

For this fake-first phase, a dependency recorded as **Implemented locally — deferred acceptance pending** is eligible for local follow-on work when its actual contracts, required local behavior and checks pass. List deferred live accuracy/spend, owner visual review and hosted checks individually; keep their acceptance boxes unchecked. Build the shared production-shaped flow with simulated scanning, typed Retro conversation, shortcuts, guidance, animated form proposals, confirmation and Undo. Never mark an external check passed because a simulation passed. After RET-011 passes locally, proceed to RET-012 local preparation; cloud execution still requires later authorization.

After implementation record what changed, actual settled quality checks, meaningful manual/device evidence, measured live/cloud facts only when run, and any remaining prerequisite. Do not pre-check acceptance or copy sibling approvals/test counts. Keep large packets manageable with adjacent implementation phases/commits under the same ID; split only a demonstrated independent outcome/risk.

Suggested commit subjects use `RET-###:`. The existing initial-documentation convention can use `RET-000: add initial documentation`; this does not require a separate implementation ticket zero or authorize a commit now.

No application code, sample PDF bytes, provider credential, paid evaluation, cloud resource, public deployment or Git mutation was created by this ticket-planning pass.
