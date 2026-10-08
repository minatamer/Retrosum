# RET-002 — Build the brand system and calm sourced landing

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-001](RET-001-initialize-workspace-and-contracts.md)  
Blocks: RET-003  
Suggested commit: `RET-002: build the brand system and calm sourced landing`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Deliver the real responsive landing and reusable visual primitives in the application. Preserve the logo's forest green/burnt orange, ivory text, professional vintage character and calm photographic hero. The eyecatcher is a high-quality office photograph with readable floating/shadowed hero copy; it is a distinct composition from ScreenPilot's hovering hero cards and ClipBuilder's motion graphics.

This packet also owns the visual shells later reused by the dashboard, floating paper viewer and Retro. It does not create a misleading functioning AI demo. All sample interactions in visual states are labelled until their owning tickets wire real behavior.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

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

- [ ] Hero is calm, striking and readable at phone/laptop/wide sizes without stock banking clichés or overly busy motion.
- [ ] Brand, typography and financial numeral style are consistent.
- [ ] Adoption statistics retain dates, denominators and direct primary links.
- [ ] Glass has enough contrast with a solid fallback where backdrop filtering is unsupported.
- [ ] Retro shell is a floating pill; user and Retro message treatment match the owner decision.
- [ ] Keyboard focus/dialog behavior works; composer does not cover content or mobile input controls.
- [ ] No animation-disabling product setting or borrowed suppression rule exists.
- [ ] Asset provenance and licences are recorded; marketing does not claim live accuracy already achieved.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Phone 320/390, laptop 1366, wide desktop | Screenshots and no unintended horizontal overflow |
| Long hero text/font fallback | Readable lines, stable layout, clear CTA |
| Glass over light/dark content | Contrast/fallback proof |
| Keyboard navigation and dialog | Correct focus entry/trap/return and Escape close |
| Mobile keyboard/safe area | Visible composer and no covered submit/source action |
| Sources/assets | Link and rights inventory; no external runtime font/photo dependency |

Run settled frontend quality/build gates and focused visual/manual checks. Do not add unit tests asserting every CSS token or screenshot pixel. Record remaining aesthetic feedback concretely; an unreviewed mock is not evidence of an accepted production layout.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
