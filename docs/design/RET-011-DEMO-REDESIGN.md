# RET-011 — Single-page demo and configurable dashboard

Owner direction: 9 October 2026. This plan supersedes the earlier `/workspace?entry=...` entry layout and fixed dashboard composition. The local redesign is implemented in both modes. Two actual-byte numeric passes, seventeen live Retro cases and real localhost Turnstile/browser checks passed. Owner/manual/physical and hosted acceptance remain separate; see [current status](../CURRENT-STATUS.md).

## Journey and layout

**`/demo`** is the canonical application route: no query parameters or fragments. It holds one session and one responsive component tree. Both landing entry actions lead here; historical workspace URLs redirect here. Keep forest green, burnt orange, ivory, vintage typography, the glass Retro composer and always-on motion.

Use **Choose → Documents → Process**, then automatically transition into the full-screen dashboard in the same page. A small step indicator, one heading and one primary action replace long introductions and duplicate controls. ScreenPilot's `features/entry/demo-experience.tsx` supplies the explicit-stage/shared-session pattern; ClipBuilder's `features/sample/sample.experience.tsx` supplies the contained workflow frame, stage progress and recovery pattern. Both repositories are read-only references.

### Choose

Two cards: **Use my documents** and **Try the sample**. Explain the sample in one sentence: realistic fictional business paperwork, ready to explore. Restored sessions offer Continue to dashboard. No sidebar or Retro appears before the dashboard.

### Documents

Sample entry shows ten actual mini-PDF papers with titles, type and page count (18 pages total, following the owner's 10 October cost-category expansion). Upload entry has a drop zone/picker, short business-name field and the same selectable collection. Accept PDFs only with the existing 10-file / 20-page / 20-MiB limits; inspect locally before recognition. Keep one business identity; switching paths never mixes businesses or silently deletes processed records.

Click a paper to animate from its measured card rectangle into a centered large PDF dialog. Fit the screen, retain page/zoom/text controls and actual PDF downloads, Escape/Close/focus return. A separate checkbox controls selection. Provide Select all / Unselect all, selected count and one **Process selected documents** action. Previewing/selecting never extracts figures. Unselected queued originals contribute no financial facts. Refresh preserves inspected uploads and selection; interrupted work requires deliberate retry.

### Process

Center an animated paper/spinner, meaningful stage text, current filename, completed/selected count and a progress bar. Count actual terminal document states, never estimated provider time. Reading and validation are distinct stages. Cancel/errors/recovery remain usable. Failed documents preserve successful results and held sources. Finish opens the dashboard with concise review/failure indicators. Never replace a live failure with fake success or automatically reprocess/rebill on refresh.

### Dashboard

Fill the browser. Desktop has an ivory workspace and forest sidebar; animate collapse to accessible icons. Tablet defaults to a compact rail; phones use a compact header and accessible navigation drawer. Reserve composer/keyboard/safe-area space; use natural scrolling on short screens. Verify 320×640, 390×844, 768×1024, 1280×720, 1366×768 and 1920×1080 with no horizontal overflow.

Navigation: **Dashboard**, **Documents**, **Records**; bottom **Settings** and **Reset**; workspace ZIP/generated-invoice export controls are removed. Profile initials and business/display name appear at the top; this remains a guest session. Documents holds originals/review; Records retains real editable invoices, expenses, contacts and payments. Mount Retro only after dashboard entry; retain it across dashboard areas.

Default widgets: income, costs, profit and margin KPIs; a wide income/cost trend with line/curve/bar styles; a cost-composition donut and labelled legend; cash and known-open cards. Animate real dated points, show exact hover/focus values and clickable source evidence, include data tables. Sparse history stays sparse; curves connect actual points rather than supply extra observed values. Missing history stays unavailable. Keep compact scope filters and review coverage.

## Personalization and currency

Store bounded dashboard preferences within the existing two-hour per-tab session. Support adding/removing KPIs, custom charts, visitor-defined income targets, card reordering with touch/keyboard move buttons, chart styling and default-layout restoration. Keep latest layout Undo separate from financial-record Undo. Reset/expiry clears preferences and pending interactions along with the original session.

Source records/forms remain exact USD. Settings allow **USD/EUR dashboard display**; latest owner feedback requires automatically loading the ECB USD→EUR reference rate through the backend's fixed Frankfurter lookup, with its publication date. Never ask for a manual rate, invent a fallback or relabel dollars as euros. Use bounded integer-micro conversion and half-up cent rounding in the shared money package. Identify the saved rate/date near the dashboard; original-source/reconciliation views identify source USD. Loading/failure/Retry states never apply an unavailable rate. Changing display currency never rewrites documents, settlement or ledger currency. This public quote lookup is independent of fake/paid AI configuration and sends no visitor data. Shared browser preferences preserve the saved rate/date through refresh within the existing two-hour session; opening EUR settings refreshes the quote.

Targets are visitor supplied, never invented business goals. Compute progress from eligible income and the exact target; unavailable income leaves progress unavailable. Above-target text may exceed 100% while the visual indicator stays bounded.

## Retro charts and dashboard actions

Preserve summaries, explanations, tour/highlights, animated editable CRUD, confirmation and financial Undo. Extend the shared structured decision contract for charts and KPIs. Live OpenAI uses the existing backend-only Responses tool/decision loop; fake mode recognizes representative requests through the same bounded schemas.

Example: **“I want a chart about my quarterly income.”** Retro asks **“Which style would you like?”** with clickable illustrated **Line / Curve / Bar / Pie** previews. The visitor may choose a preview or reply in words. Show editable title/metric/grouping/scope and Add to dashboard. The new chart animates into the layout and recomputes on record/filter changes. Later requests can change/remove a named custom chart; ambiguous names need explicit choice.

Support income/cost/profit/recorded-cash metrics and meaningful month/quarter/category/counterparty grouping. Approved specs contain enums/bounded text only. Models cannot supply executable chart code, formulas, amounts, dataset arrays, selectors, URLs or action authority. App code derives series/source facts through the canonical money engine. Negative values cannot become pie slices: offer line/bar instead. Unavailable periods render honestly. Quarterly sample history covers the supplied August/September records only.

KPI requests offer supported metrics and an Add action. Direct controls and Retro use the same preference mutation path. Bind confirmation to session/revision; stale replies cannot apply obsolete assumptions. Visual and typed choices use the same action. Keep compact unboxed replies.

Research: [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling) describes application-executed tools and recommends strict schemas; [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) distinguishes tool calls from structured UI responses. Adapt these to validated chart specs and app-owned rendering. These sources establish the API approach, not acceptance of our live behavior.

## Corpus and architecture

Reuse the original eight Harbor Studio PDFs unchanged: two customer invoices, scanned materials bill, handwritten-style rent receipt, software receipt, duplicate bill candidate, payment register and multi-page prior-month records. Add two native two-page receipt packs for Materials (USD 240), archive-storage Rent (200), Services (450) and Marketing (180). Together with eligible Software (120), the initial chart has five positive categories and USD 1,190 costs while the scan/handwriting/duplicate stay held. Reviewed costs become USD 2,350; recorded cash stays based on the original payment register. They cover income, expense categories, tax/net/gross, settlement, cash, review and comparisons. The handwritten specimen already embeds an image inside a PDF with documented synthetic provenance. Inspect it before regenerating; changing bytes requires hashes/fixtures/provenance/acceptance expectations to change together. Never call fictional samples real customer documents.

Contracts own bounded experience/preferences/widget specs and Retro decisions, with backward-compatible session defaults. The money package owns exact conversion, grouped source-backed charts and fake intent recognition, without environment/platform/provider imports. Frontend owns stages, selection, animation, sidebar, controls and charts. Reuse existing inspection, recognition, review, original viewer, Records and controller lifecycle. Workspace export UI is removed by later owner feedback. Backend owns the registered decision/tool surface, prompt and bounded anonymous public FX adapter; preserve caps, admission and provider isolation.

Remove obsolete sample introduction, redundant intake copy and old workspace composition after replacements are active. Preserve useful review/CRUD/source components, stable tour targets and all earlier unstaged owner visual feedback. Browsing/selecting/filtering/styling/layout/currency never dispatch inference. No sibling edits, push or deployment.

## Sequence and acceptance

1. Allocate files and introduce bounded contracts/shared money functions.
2. Build `/demo` stages, selected papers, expanding viewer and count-based progress with recovery.
3. Build responsive dashboard/sidebar, settings/currency and configurable source-backed widgets.
4. Extend Retro chart/KPI requests and illustrated choices while preserving CRUD/tours.
5. Remove obsolete composition/routes/components and synchronize active docs.
6. CUA-check selection/all/none/partial, preview/download, processing, review/duplicate, dashboard, typed/visual chart choices, KPI/layout/target, currency, refresh/Reset and responsive sizes. Physical hardware remains an owner check.
7. Add meaningful tests for grouped/quarterly data, unavailable/negative values, exact conversion, schema bounds, recovery and Retro decisions. Run settled root format/lint/types/boundaries/unit/build checks after implementation settles; do not repeat gates during active visual iteration.

Completion requires cleaned implementation, actual local browser evidence and passing local gates. Record fake/local/live/cloud evidence separately. Owner aesthetic approval, physical keyboard/touch hardware, broader upload/real human-handwriting accuracy and hosted acceptance remain pending. The configured USD 5 OpenAI limit is owner-confirmed; current corpus/local paid acceptance passed.
