# RET-002 — Build the brand system and calm sourced landing

**Current acceptance — 10 October 2026:** Local implementation is complete. The current sample contains ten PDFs/eighteen pages; two independent live numeric/record passes, seventeen live Retro cases and real localhost Turnstile/browser checks passed. The owner confirms the configured USD 5 OpenAI spending limit. Owner/physical/assistive/general-upload/manual account checks and hosted acceptance remain separate. See [current status](../CURRENT-STATUS.md) and [RET-011 evidence](../validation/RET-011.md).

Status: **Implemented locally — owner visual acceptance pending**<br>
Last synchronized: **10 October 2026**<br>
Depends on: [RET-001](RET-001-initialize-workspace-and-contracts.md)  
Blocks: RET-003  
Suggested commit: `RET-002: build the brand system and calm sourced landing`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Deliver the real responsive landing and reusable visual primitives in the application. Preserve the logo's forest green/burnt orange, ivory text, professional vintage character and calm photographic hero. The eyecatcher is a high-quality office photograph with readable floating/shadowed hero copy; it is a distinct composition from ScreenPilot's hovering hero cards and ClipBuilder's motion graphics.

This packet also owns the visual shells later reused by the dashboard, floating paper viewer and Retro. It does not create a misleading functioning AI demo. All sample interactions in visual states are labelled until their owning tickets wire real behavior.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded manual/hosted release gates remain pending; current local paid acceptance is already recorded in RET-011.

Areas owned by this packet:

- Frontend design tokens, shared typography, buttons, dialogs, cards, glass surface and floating composer primitives.
- Landing route and sections; locally served hero/fonts and asset-rights notes.
- Responsive workspace shell, spacing/safe-area reservations and representative chart/Retro/form states.
- Focused visual reference/evidence under `docs/design/`; current HTML brief remains the PM summary.

## Implementation plan

1. Inspect actual ClipBuilder `apps/frontend/src/styles/tokens.css` glass surface/border/backdrop/edge-shadow/sheen/fallback and ScreenPilot `live-captions.tsx`/candidate-message styling. Adapt their techniques to Retrosum rather than inheriting colors or product copy.
2. Establish semantic palette tokens: forest canvas/panels, green/orange brand, ivory copy, muted readable text, green income, orange costs, teal cash, lilac comparisons and amber review. Negative amounts need text/sign/icon as well as color. Validate contrast in real glass/backdrop cases.
3. Evaluate Fraunces headings and IBM Plex Sans interface/numerals. Bundle chosen fonts/licences locally, use tabular numerals and sensible fallbacks; avoid ornate body text and unstable KPI widths. Preserve the wordmark's green/orange treatment.
4. Build the photographic hero from the rights-cleared office reference in Appendix D or a comparable documented high-resolution asset. Serve an optimized responsive asset in the app; the portable HTML's embedded photo is a reference, not an instruction to ship a megabyte Base64 CSS string in production.
5. Compose landing sections: promise, three core moments, sample PDF gallery entry, intended dashboard/Retro previews, dated adoption evidence, privacy/session explanation and final CTA. Avoid platform internals in marketing copy.
6. Retain sourced facts with population/date/context: BoE/FCA 75% of 118 UK respondents in 2024, Findex digital payment scope, and company-reported Morgan Stanley adoption. Check the current primary references before publishing. Intuit/Morgan Stanley are industry examples, not partners; digital payments do not prove paperless finance.
7. Build a centered paper-dialog entry motion and a forest glass floating pill composer shell with user bubbles/unboxed Retro replies. Messages sit above the composer, not behind a bottom-right round launcher. Reserve bottom layout space on all workspace screens.
8. Set a coherent motion vocabulary for reveals, chart transitions, spotlight outlines and form-field emphasis. No animation-off toggle, “reduce animations” setting or copied CSS rule that suppresses the owner's signature motion. Keep choreography calm and free of flashing; data must remain readable during transitions.
9. Wire landing entry to the real intake route. Until later dependencies are ready, use honest intended-state wording rather than a button pretending it has extracted real documents.

## Acceptance criteria

- [x] Hero fills tested phone/laptop/wide viewports; copy and CTAs remain readable.
- [x] Brand, typography and financial numeral style are consistent.
- [x] Adoption statistics retain dates, denominators and direct primary links.
- [x] Glass has enough contrast with a solid fallback where backdrop filtering is unsupported.
- [x] Retro shell is a floating pill; user and Retro message treatment match the owner decision.
- [x] Browser keyboard focus/dialog behavior works; measured composer clearance protects actions in tested viewports.
- [x] No animation-disabling product setting or borrowed suppression rule exists.
- [x] Asset provenance and licences are recorded; marketing does not claim live accuracy already achieved.
- [ ] Owner aesthetic acceptance and real phone software-keyboard/touch verification (deferred; viewport and browser keyboard checks passed).

## Verification and evidence

| Case                                     | Evidence                                                             |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Phone 320/390, laptop 1366, wide desktop | Screenshots and no unintended horizontal overflow                    |
| Long hero text/font fallback             | Readable lines, stable layout, clear CTA                             |
| Glass over light/dark content            | Contrast/fallback proof                                              |
| Keyboard navigation and dialog           | Correct focus entry/trap/return and Escape close                     |
| Mobile keyboard/safe area                | Visible composer and no covered submit/source action                 |
| Sources/assets                           | Link and rights inventory; no external runtime font/photo dependency |

Run settled frontend quality/build gates and focused visual/manual checks. Do not add unit tests asserting every CSS token or screenshot pixel. Record remaining aesthetic feedback concretely; an unreviewed mock is not evidence of an accepted production layout.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

## Historical local execution snapshot

The following original results retain their dated corpus and acceptance boundaries; use the current status above for outstanding work.

**Execution record — 8 October 2026:** Implemented the real Next.js photographic landing, local Fraunces/IBM Plex Sans fonts, brand tokens, sourced adoption evidence and reusable button/glass/paper-dialog/composer/workspace primitives. Sample/upload CTAs enter the real workspace route with explicit preview states. PDF intake, real chart state and full Retro interaction remain owned by subsequent packets.

`pnpm check` passed formatting, lint, strict typechecking, 29-source-file boundary inspection, all 67 tests in seven files, and both production builds. Browser checks covered standard 320–1920px viewports, short landscape and extra 280/320px phones; the hero filled the viewport without horizontal overflow. Temporary Georgia/Arial fallback checks passed and the test override was removed. Dialog focus entry, explicit first/last Tab cycling, Escape, focus return and scroll restoration passed. Measured dock reservation kept workspace actions usable at six representative viewport sizes. Asset/source provenance and contrast measurements are recorded in [design evidence](../design/RET-002-DESIGN.md).

Settled read-only validation found no actionable findings. See [validation](../validation/RET-002.md) and [file-level commit plan](../commit-plans/RET-002.md). Owner visual review and actual hardware input checks remain deferred; they do not block local RET-003 work. No paid provider calls, cloud resources or deployment were performed.
