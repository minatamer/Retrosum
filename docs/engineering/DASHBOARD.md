# Dashboard facts and interaction

RET-006 builds the overview from the current validated workspace; no presentation ledger, seeded browser dataset, interpolated dates or model-supplied chart amounts exists. `packages/money` exports `buildDashboard`, its typed fact catalogue and exact series. Overview and Records use the same authority. No new chart dependency was required for the small bounded series: custom SVG bars/arcs sit alongside native buttons and equivalent data tables.

## Meaning and scope

Each fact carries ID, revision, USD, reporting dates, selected as-of/category/counterparty, date basis, formula, availability, exact included records, exclusions, applicable issues and original source references. Profit reconciliation retains signed deductions. UI formatting reuses the money package; floating-point ratios are used only for drawing geometry, never financial calculations or authoritative amounts.

Document figures use event dates and explicit net amounts, or stated totals without separate tax. Cash uses supplied movement dates and excludes owned transfers. A category filter makes cash unavailable because an allocation to one category does not establish attribution of a whole payment. Counterparty filters use the actual payment counterparty. Known open uses gross amounts on selected event dates, validated settlements through the selected as-of and the supplied known-status slice. Events after as-of and unknown settlement are excluded with reasons. Due soon is inclusive from as-of through seven days later; overdue begins strictly before as-of. Customer and supplier amounts stay separate.

Missing income/cost/cash/open evidence is unavailable. A supplied cost-only slice can show its honest negative profit preview, with absent income disclosed; margin is unavailable without positive income. A known supplied zero remains zero. Collection coverage ignores date filters and separates source counts from economic-event counts. No confidence, bank balance, tax liability or forecast is invented.

Prior comparison uses the preceding whole calendar month for a complete month, or an equal-length immediately preceding custom range. Only actual supplied periods are plotted. Missing history, unknown net basis and non-positive prior baselines receive explicit unavailable percentages; valid absolute differences remain inspectable. Each prior fact exposes its own date range and sources. Harbor August is wholly sourced to D08; September uses D01–D07 plus the D09/D10 receipt packs; held D03/D04/D06 contribute only after explicit review. The canonical source category is **Materials**, rather than a decorative renamed label.

## Bounded presentation and motion

Cost composition shows at most five named groups plus Other; counterparty bars show six plus Other. Other exposes every member, without dropping amounts. Cash retains every movement in at most six consecutive actual-date buckets; dense groups scroll within the chart, with a full exact table. Empty history has no fake line. Loss bars cross a labelled zero axis. Category colors are stable and use the forest/mint/orange palette; labels and exact values remain usable without color.

Entrances last 550–600 ms; geometry changes settle over 350 ms, and hover/focus feedback over 180 ms. Exact money text updates immediately to its validated final value. Legend isolation affects only the picture and says so; headline scope is unchanged. Native buttons and focusable donut arcs open the same detail on tap/click/Enter. Hover and focus share exact tooltips; adjacent category actions make arcs accessible on touch. Every chart includes View data table. No animation-disable setting exists.

## Navigation, layers and revisions

One session provider owns Overview, Documents and Records. Visible views mount without a second ledger; the bounded intake stays mounted so explicit processing can finish while visiting Overview. Inactive intake overlays are suppressed. Views change within canonical `/demo` without generated query/hash routes and never invoke inference. Dashboard and Records have independent date ranges; refresh resets both to the default period while preserving records and other session preferences. Same-view clicks do not add redundant history entries.

The selected detail resolves its stable fact ID against the latest catalogue. It updates formula, scope, contributions and revision together, announcing new revisions; a deleted group receives an honest unavailable selection state. Original viewing replaces the detail, then returns to it. The paper dialog closes and restores its connected opener on cleanup, including SVG chart focus after a source round-trip. The shared shell measures actual Retro height and reserves it plus 40 px; targeted keyboard actions scroll above it. Full Retro conversation, stale explanations and animated mutations are implemented through RET-007/008 and the latest RET-011 amendments.

## Evidence and limits

See [RET-006 validation](../validation/RET-006.md) for the settled gate and browser results. Focused tests cover Harbor figures, shares/sources, comparisons, CRUD/Undo coherence, category/party/as-of scope, sparse and missing evidence, dense aggregation and calendar boundaries. A local 1,000-event graph with 500 held events and 500 categories produced its 540 facts in **81 ms** on this host; this is one local measurement, not a cross-device performance guarantee.

Two actual-byte PDF passes, source/record audits and live Retro/local Turnstile checks passed; both modes use the exact same money authority. Owner aesthetics, physical/assistive input and broader upload accuracy remain manual acceptance; Linux refresh and hosted checks remain deployment work. See [current status](../CURRENT-STATUS.md).
