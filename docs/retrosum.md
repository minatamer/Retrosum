# Retrosum · complete product specification

Consolidated **7 October 2026**. The product and brand decisions were recorded on **3 October 2026**. Selected name: **Retrosum**. Intended domain: **retrosum.com**, registration unconfirmed.

Retrosum is a proposed guest business money workspace. Its [HTML companion](retrosum.html#retrosum) contains six inspectable local views with synthetic documents and prepared answers; it does not run a live document-processing service. This file is the complete project reference for the workflow, sample business, calculations, agent, formats, field catalogue, architecture, limits and visual direction.

- [Product and main workflow](#the-product-we-are-designing)
- [Financial meaning and dashboard](#financial-meaning-and-the-sample-dashboard)
- [Agentic insights](#agentic-insights-observations-people-can-use) · [Copilot](#the-data-copilot)
- [Guest behaviour and architecture](#guest-behaviour-and-architecture)
- [Document formats and complete field catalogue](#document-formats-and-field-catalogue)
- [Complete brand and visual direction](#complete-brand-and-visual-direction)
- [Design and format references](#design-and-format-references)

## The product we are designing

A guest opens a small business money workspace, previews realistic sample documents or drops in their own supported files, and gets an organized picture of income, expenses, recorded cash and open amounts. An AI copilot explains that picture using the underlying records. The guest can inspect a source, correct an interpretation, review a payment match and see the whole workspace update.

**Who it serves:** freelancers, agency owners and small service businesses with scattered documents. **Core question:** “What do these records tell me about my business, and where did those numbers come from?” **Useful outcome:** an understandable, traceable overview and reviewed records they can export.

The portfolio story is a complete, usable product: document preview → automatic recognition → linked money records → dashboard → grounded insights → conversation and review. Extraction is an important feature inside that story. A beautiful screen that merely displays an extracted invoice is insufficient.

The guest experience needs no authentication, account connection, administrator setup or visitor API key. One frontend and one private backend are enough for one bounded session. Full accounting and persistent SaaS administration remain outside this demo.

## Product decisions agreed so far

- Chosen brand: **Retrosum**, with intended domain **retrosum.com**. Retro / retrospect + sum expresses looking back through business records and making sense of the numbers. The user chose a vintage feel for the logo and colourway. The canonical scope is `retrosum.md`; earlier scope links remain usable. [Brand decision](#complete-brand-and-visual-direction).
- Offer a prominent **Explore sample documents** route for visitors who do not want to upload their records.
- Use believable, original synthetic PDFs with varied generic business designs. Let visitors read them inline before processing.
- Lead with **“Drop in your documents. We’ll figure out what they are.”** No document-type dropdown or per-file labeling before upload.
- Use GPT for the intended live understanding of supported unstructured documents, across tested layouts and formats. Native parsing and ordinary code remain responsible for structured fields and calculations.
- Make the dashboard useful: a small number of meaningful KPIs, focused charts, visible coverage and links to contributing records.
- Include agentic insights and a data copilot as core capabilities, with evidence and short explanations rather than decorative chat.
- The agent explains records and measurements. **It does not give financial advice**, tax advice or recommendations about business spending, borrowing or investments.
- Keep samples, genuine current-run processing and illustrative UI clearly distinguished. This research enables no paid API calls or domain purchases.

## Selected visual direction

**Retrosum** is the user-selected identity. **retrosum.com** is the intended domain; registration is unconfirmed. The word combines a retrospective view of business records with sums and explanations. The user wants to deliberately use the vintage association in the logo and colourway.

Proposed first treatment: a warm serif wordmark, cream/ivory surfaces, forest green for primary actions and data, and restrained terracotta/ochre accents. The dashboard keeps readable modern controls, charts, numerals and source links. Final logo artwork, exact typography and colour tokens are still design proposals. [Full brand brief and proposed palette](#complete-brand-and-visual-direction).

Working line: **Make sense of your business money.** Descriptor: **Business money workspace.** The scope and guest workflow below continue to define the complete product.

## Main guest flow, step by step

1. **Look at the sample documents.** See a gallery of invoices, bills, receipts and a payment export. Open a PDF inside the site, flip through pages, and see a short explanation of the kind of record it represents. Choose the complete Harbor Studio bundle or individual samples. Own upload is an equally visible secondary path.
2. **Start the workspace.** Select “Use these samples” or drop in supported files. The sample business is already known. For own files, infer candidate business identities and ask one simple confirmation if needed: “Which business is yours?” The guest does not identify the document types.
3. **Watch the documents become records.** Show actual stages: reading, recognizing, extracting, linking and ready/review needed. Detect the document kind, parties, financial direction, amounts and possible relationships. Display recognized results beside the sources. Ask for review only where the interpretation matters or the evidence is unclear.
4. **Explore the money picture.** Open the dashboard with income, net documented costs, profit preview, recorded operating cash and open amounts. Click a card or chart to reveal its records, then open the source. Clearly state period, currency, basis and supplied-data coverage.
5. **Ask the copilot and resolve one item.** Ask “Why is income higher than cash received?” or “What makes up our expenses?” Follow the agent’s source links. Confirm the sample payment match or duplicate relationship. Counts, balances, charts and explanations stay tied to the same workspace revision.
6. **Take the result away.** Export the overview, reviewed records, unresolved issues, cited insights and optional originals. Reset or try a different sample. No messages, payments, applications or account writes are performed.

The first satisfying result should take very few clicks. A roughly five-minute guided visit includes the gallery, dashboard, one useful question and one connected action. A guest can also skip straight to the prepared sample overview; this uses visibly labelled stored sample results.

## The sample gallery and document experience

The first screen should look like a document collection, not a registration form. Show a compact stack or grid of distinct document covers with readable vendor names, document identifiers, a format badge and a page count. The gallery can identify sample types for teaching; own uploads still need no type selection.

Each card offers **Preview** and **Use sample**. A visible **Use full sample business** action starts the coherent bundle. Preview is free local interaction and must never trigger extraction or chat calls. Merely opening the app must not start paid processing.

On desktop, open a document drawer with the PDF on one side and a brief “What this demonstrates” panel on the other. On a phone, use a full-width preview with Back, page navigation and Download original. Give the viewer keyboard access, a readable text alternative and a download fallback when inline PDF rendering is unavailable.

Render actual PDF bytes in the finished app, using a bounded PDF viewer. A painted HTML rectangle with an invoice title does not satisfy inline PDF preview. Images use an image viewer; CSV/XLSX use a small safe table; DOCX uses a labelled rendered preview or extracted-text view. A rendered preview remains distinguishable from the original file. Sources are not loaded from arbitrary external URLs.

**Design references researched:** [Smartsheet invoice templates](https://www.smartsheet.com/content/free-pdf-invoice-templates), [Smartsheet receipt templates](https://www.smartsheet.com/content/receipt-template-pdf) and [FreshBooks PDF invoice templates](https://www.freshbooks.com/invoice-templates/pdf). These publishers provide examples of service invoices, itemized sales, rent receipts and branded invoice layouts. Our sample designs below are original proposals, not copied templates or customer records. The references establish layout examples, not which format is most popular. See the [research update](#design-and-format-references).

### Believable samples, with different designs

Use fictional companies, reserved `.example` contact addresses, nonfunctional payment details and a discreet **Synthetic sample** footer. Each supplier should have its own visual identity, typography and table structure. Do not make every document use the app’s brand or the same template. Keep the document readable and plausible; realism should come from varied structure and ordinary business details, not real personal or bank information.

The original seven-file September fixture remains the base. Add one optional August events CSV to support honest comparisons. The full comparison bundle contains **eight files**, within the 10-file cap. The source files, field values and extraction fixtures still need to be authored and verified during implementation; the companion guide shows conceptual screens only.

| ID / proposed original | Design and source content | What the guest sees it demonstrate |
| --- | --- | --- |
| D01 · `harbor-HS-101.pdf` | A clean agency invoice: restrained blue header, seller and bill-to columns, two service lines, invoice/date/terms, USD 3,000 net and gross, no separately charged tax. Harbor Studio → Cedar Works. Issued 4 Sep; due 18 Sep. | An outgoing invoice is a sale source. A separate +3,000 payment row can settle it without creating another sale. |
| D02 · `harbor-HS-102.docx` | A different, minimal service invoice, USD 1,800, issued 24 Sep; due 8 Oct. Harbor Studio → Maple Retail. Explicitly open as of 3 Oct in sample status evidence. The gallery provides a labelled PDF rendition; only the DOCX original is counted as input. | Document content matters across layouts and formats. Open does not mean overdue. |
| D03 · `northstar-A-77-scan.pdf` | A monochrome supplier invoice with compact table, Northstar → Harbor Studio, USD 360 services + 36 stated tax = 396 gross. Issued 20 Sep; due 10 Oct. Explicitly open in the sample. | AI reads a scan, identifies a bill to this business, and separates net, tax and total. |
| D04 · `rent-R-091.pdf` | A generic property receipt with payer, rental period, date, received-by field and USD 800 paid. No invented tax breakdown. | A receipt provides expense/payment evidence; it is not another customer invoice. |
| D05 · `software-SW-09.xlsx` | A fictional subscription receipt: one purchase, one sheet, USD 120, paid 12 Sep, no separately stated tax. The gallery shows a safe table and optionally a labelled PDF rendition. | An exported spreadsheet can contain a receipt, not just a ledger. A subscription label does not prove future recurring charges. |
| D06 · `northstar-A-77-copy.jpg` | An independently rendered image of the same A-77 invoice, with the same parties, number, date and amounts. | The same event can arrive twice in different formats; retain both sources but count one cost after review. |
| D07 · `september-payments.csv` | Four dated rows for Harbor Studio: +3,000 from Cedar Works with HS-101 reference; -800 rent; -120 software; -200 to another explicitly owned account. | Native parsing, payment matching and exclusion of an internal transfer from operating flows. |
| D08 · `august-events.csv` · optional | A small, documented events export: two net sales of 2,500 and 1,500; rent cost 800, contract services 200, software 100. All USD, August 2026, with unique row IDs and an explicit document-view basis. No payment status or cash history is implied. | Compare recorded periods using supplied source rows rather than inventing a historical trend. |

PDF renditions and thumbnails are preview assets, not additional financial events. Never silently ingest both an original and its rendition as two documents with two costs. The manifest records original IDs, rendition relationships and sample provenance. Deliberate duplicate D06 is an explicit exception used for review.

**Additional sample collection after the base story works:** a credit note linked to a sale; a partial-payment receipt; a refund; a two-page invoice with discounts/shipping; a readable expense photo; a quotation/pro-forma that is excluded from realized sales/costs; and a separate-currency example. These are replacement bundles or individual demonstrations, not extras automatically added beyond the run cap. Handwriting and unusual formats remain advertised only after evaluation.

## Automatic recognition: no manual document labels

File validation can identify a container such as PDF or XLSX. GPT/native schema interpretation identifies the business document and its meaning. Do not confuse those two stages.

For each file, propose a **document kind**, **parties**, **which business side it describes**, **economic event**, **category**, **dates/currency**, **amount basis**, **settlement evidence** and **review state**. Keep the original strings and source locations. A positive amount alone cannot establish income.

| Recognized content | Proposed treatment |
| --- | --- |
| Invoice issued by this business | Customer sale/invoice; payment remains independent evidence. |
| Invoice addressed to this business | Supplier bill/documented cost; paid state must be evidenced. |
| Purchase/rent/service receipt | Expense evidence and possibly a source-stated payment; link to a bill if it describes the same event. |
| Payment receipt, statement or bounded payment export | Settlement/cash evidence; match to an event, or hold as unmatched. It is not automatically additional revenue. |
| Credit note/refund | A linked adjustment with distinct sign and original-event reference; review ambiguous relationships. |
| Deposit/prepayment | Separate state with evidence; do not silently treat it as earned income. Complex recognition remains review-only in the first build. |
| Quote, estimate, pro-forma or purchase order | Reference/expected transaction; excluded from sales/cost totals unless a separate actual event is evidenced and reviewed. |
| Internal transfer | Non-operating movement between explicitly identified owned accounts. |
| Unrelated document or unreadable/ambiguous content | “Not a money record” or “Needs review,” with a reason. Never invent required invoice fields. |

For a sample, identity is preconfigured. For visitor files, propose a repeated business identity where there is evidence and ask a single confirmation. A single invoice often cannot establish whether the visitor is its seller or buyer; a short identity question is necessary in that case. It is still not a document-type form.

Use labels such as **Recognized**, **Matched**, **Needs review**, **Excluded**, **Source states paid**, and **Payment state unknown**. Do not invent numeric accuracy/confidence badges. A candidate category is editable. Keep uncertain financial interpretation out of reviewed headline totals, show the pending amounts/counts, and do not claim the overview is complete before those records are resolved.

The [136-field catalogue](#document-formats-and-field-catalogue) remains the extraction reference. Default review shows the useful subset: parties, document number, dates, currency, net/tax/gross, category, financial direction and status. Line items, discounts, fees, tax breakdowns, payment terms and optional identifiers expand on demand; visitors never face 136 required boxes.

## The connected workspace

| Area | What the guest can do |
| --- | --- |
| Documents | Preview samples/originals, upload, see recognition, inspect source fields and resolve uncertainty. |
| Overview | Filter period/currency, understand the key totals and charts, follow insight cards to their evidence. |
| Records and payments | Inspect sales/costs, correct categories, add a manual record, review duplicates and payment relationships. |
| Copilot | Ask about current records, inspect a short investigation trace, open cited evidence and navigate to a filtered view. |

A small review queue belongs within Documents/Records. A separate admin console is unnecessary. Every screen uses the same stable record IDs and workspace revision. Exports and copilot context must use that revision too.

## Financial meaning and the sample dashboard

Keep **document view** and **recorded operating cash** visibly separate. A sale invoice shows invoiced work; it does not prove money arrived. A supplier bill shows a cost/payable source; it does not prove payment. This simplified document-view preview does not choose a tax/accounting method or represent complete accounts.

**Period:** September 2026. **Currency:** USD. **Reviewed as of:** 3 October 2026. Base approved records yield:

| KPI | Exact sample value | Meaning / evidence |
| --- | --- | --- |
| Invoiced income | 4,800 | D01 3,000 + D02 1,800, included net sales. |
| Net documented costs | 1,280 | D03 360 + D04 800 + D05 120. D06 is linked duplicate evidence, excluded from totals. |
| Profit preview | 3,520 | 4,800 - 1,280 on the displayed sample basis; missing costs are not invented. |
| Preview margin | 73.3% | 3,520 / 4,800 × 100, rounded to one decimal. This is a document-view preview margin, not an audited business margin. |
| Recorded operating cash in / out | 3,000 / 920 | D07 matched operating rows. The -200 internal transfer is excluded. |
| Net recorded operating movement | 2,080 | 3,000 - 920; not a bank/account balance. |
| Customer amount open | 1,800 | D02 explicitly open; due 8 Oct, so not overdue on 3 Oct. |
| Supplier amount open | 396 | D03 explicitly open, including stated 36 tax; not a net-cost figure. |

Show three or four headline cards first; keep cash/open balances in a compact secondary strip with their different basis visible. Every amount opens its contributing records. A badge explains included documents and outstanding reviews. Zero differs from unknown; unknown gross/net/tax amounts do not become zero by default.

### Charts with a purpose

1. **Income and costs by covered period:** a small grouped bar chart. September alone is a snapshot; add August comparison only when D08 is included. It shows a comparison of supplied records, not a continuous historical series or forecast.
2. **Cost composition:** sorted horizontal bars for rent 800, contract services 360 and software 120. Share of included net cost is 62.5%, 28.1% and 9.4% respectively. Click a bar to open source records. A pie chart is optional; do not add it as a second visualization of the same fact merely for decoration.
3. **Invoiced versus recorded received:** show 4,800 invoiced and 3,000 matched receipts side by side, accompanied by the relevant source/matching state. The 1,800 gap equals the explicit open sample invoice; an arbitrary visitor gap must not automatically be declared unpaid income.
4. **Open items:** a compact dated list/table showing 1,800 customer and 396 supplier amounts, due dates and status. Age/overdue buckets require known due dates and the visible as-of date. With two items a readable list is more useful than a complex chart.

Optional August comparison uses D08: income 4,000, costs 1,100, profit preview 2,900. September versus these supplied August records: income +20.0%, costs +16.4%, profit preview +21.4%; preview margin 73.3% versus 72.5%, a +0.8 percentage-point change. Label both periods’ provenance and coverage. Imported events are source rows, not independently verified bank records. A prior value of zero yields no percentage growth claim.

This is deliberately a small dataset. Do not imply precise trends from an impressive but invented daily line. Multi-currency records stay in separate views; no unstated currency conversion. Cost-of-goods, payroll, depreciation and taxes that are absent remain outside the profit preview.

## Agentic insights: observations people can use

After records are ready, the copilot can investigate the current workspace with a few read-only tools, then return at most three or four prioritized findings. “Agentic” means it chooses which provided metrics/records to inspect to answer a question, not that it autonomously makes financial decisions.

Each insight has a short headline, one specific observation, its period/currency/basis, evidence links, an uncertainty/coverage note where needed, and a useful **View records** or **Review match** action. Keep the explanatory sentence next to the relevant KPI/chart when space allows, with an expandable findings list. Describe observable contributions; do not invent business causes or causal explanations from totals alone.

| Good sample comment | Evidence / useful action |
| --- | --- |
| “Rent is USD 800, or 62.5% of the included net costs.” | Open D04 and the cost breakdown. No recommendation to move office or cut rent. |
| “USD 1,800 remains open on HS-102. It is due 8 October.” | Open D02; identify the source-stated open state and current as-of date. No fabricated overdue warning. |
| “HS-101 and the USD 3,000 payment row appear to describe the same sale.” | Open D01 and D07 row; propose a match for guest review. No extra revenue. |
| “A-77 appears twice. Counting both would add USD 360 to net costs.” | Show D03/D06 side by side; confirm the duplicate relationship, preserve originals. |
| “Recorded income is 20.0% higher than the supplied August export.” | Only with D08; cite September events plus August rows and identify the coverage limitation. No claim that the whole business grew by 20%. |

Prioritize data-quality/relationship findings before performance commentary when unresolved records affect the totals. This is a design choice, not a calibrated risk score. Keep serious-sounding alert styling for genuine record issues; routine observations should feel calm and readable.

The server computes the figures, percentages, comparison bases and contributing IDs. GPT explains those returned facts. Schema-valid output is not evidence that an interpretation is correct; validate returned metric/source IDs and attach financial amounts through server-owned result objects. Do not let the model supply arbitrary chart data or calculate the authoritative ledger.

## The data copilot

The copilot lives in a side panel on desktop and an accessible full-width panel on phones. Start with three relevant question chips; do not overwhelm the visitor with a blank chat box and a broad “ask anything” claim. Questions operate on the current workspace, filter scope and selected currency, with an easy way to see that scope.

Examples:

- “What makes up our expenses?” → compute category shares, identify the biggest recorded category, offer its documents.
- “Why is invoiced income higher than recorded cash received?” → inspect sales and matches, explain document-versus-cash basis, link the relevant invoices/payment rows.
- “Which customer amounts are still open?” → return the supported open items and due dates; separate unknown payment status.
- “What changed compared with August?” → compare supplied records only if D08 is included; otherwise ask for a previous-period export without inventing one.
- “Show the records behind this profit preview.” → return contributing sales/costs and the calculation basis, with excluded/pending records visible.
- “Which documents need review?” → explain the specific party, duplicate, arithmetic or payment uncertainty and open the review view.

An answer contains a direct response, compact computed facts, resolvable source chips and an optional action to open a filtered view. Click a chip to open the original at its page, table row or safe text excerpt. If reliable page coordinates are unavailable, identify the page/row and show a readable excerpt; do not fabricate a highlight box.

Offer a short **How I checked** activity such as “Compared included sales → inspected payment matches → opened HS-102.” It reports actual executed tool steps, not hidden reasoning or an invented thinking animation. It should help the user check the answer rather than expose internal implementation details.

**Proposed read-only tools:** `get_summary`, `list_events`, `compare_periods`, `get_metric_evidence`, `get_document_excerpt`, `list_review_issues`. Use a small finite filter schema and validated source IDs. No arbitrary SQL, code execution, file URLs, web browsing, external MCP permissions or outbound actions are required.

UI navigation is an application-owned action referencing allowed view/filter/record IDs. Chat may propose a correction or match, but the guest confirms it through the normal review UI. The model never changes the ledger invisibly.

### Explicit no-financial-advice boundary

Product copy near chat: **“Explains your uploaded records. Does not provide financial, tax or investment advice.”** The behavior must enforce this boundary; a disclaimer alone is insufficient.

Allowed: summarizing observed records, explaining the product’s metric definitions, comparing compatible supplied periods, describing measured contributions, flagging possible duplicates/missing evidence and guiding record review.

Outside scope: investment recommendations; personalized tax deductibility/filing advice; borrowing/credit decisions; business spending allocations; staffing cuts; instructions to buy/sell, pay or transfer; speculative forecasts presented as advice. It must not suggest “cut payroll,” “take a loan,” “invest the surplus” or “deduct this bill.”

If asked “Should I cut rent?” respond briefly: “I can show how rent contributes to the recorded costs, but I don’t recommend spending decisions. Rent is USD 800, or 62.5% of the included September net costs.” Attach the relevant source. For “Can I deduct this expense?” decline the tax conclusion and offer the document’s stated amount/tax fields for review. Keep responses natural and useful.

## The memorable interaction

A visitor sees unfamiliar-looking documents in several designs, previews them, and starts without tagging any document. The app recognizes what it can and creates a clear overview. The guest asks about the sales-versus-cash gap; the copilot opens the two relevant invoices and payment evidence. Confirming the HS-101 match changes the linked settlement evidence while income stays USD 4,800. Reviewing duplicate A-77 shows why two source files represent one cost.

The primary story succeeds automatically on clear records. Deliberately starting with a supplier bill classified as income is no longer the main “wow” interaction; it makes the app’s first impression depend on fixing a mistake. Ambiguous examples remain secondary demonstrations of honest review.

For the base overview above, payment matches and duplicate disposition are already reviewed. A guided pre-review state must clearly label D01 settlement as unknown/pending, show D06 as a held duplicate candidate, and display its review count. Do not call D01 unpaid before reviewing its evidence. Confirming its match leaves the previously supported open D02 amount at 1,800 while resolving D01’s unknown state; no false 4,800-unpaid starting card.

## Other useful features in the same field

**Core first build:** document gallery and recognition; source review; reviewed money dashboard; duplicate/payment review; grounded insight cards; data copilot; export/reset. Include a small manual-record form so a missing expense can be entered without inventing an attachment. Mark it **Manual entry**, capture guest-entered basis/status, and link it to the same ledger revision. It is useful fallback and a real connected interaction.

**Next contained addition:** a simple outgoing invoice builder with buyer, date/due date, currency, editable lines, discount and stated tax fields. Code calculates totals and renders a downloadable PDF. Start in **Draft**, outside recognized sales; any “include as issued record” action is explicit and source-labelled. Downloading is not sending, collecting or proving payment. Do not make this a second unrelated application or require it to complete the main path.

**Optional later adapter:** expose a few validated read-only workspace tools as MCP only after the web product works. MCP is a way another client could inspect the same data; it is not needed for guest uploads, PDF preview or the in-app copilot. No inbox watcher, PayPal login or bank connection is necessary.

## AI, ordinary code and format coverage

GPT is required for the intended live interpretation of unstructured uploads: document recognition, field/party extraction, editable category proposals and grounded explanations. Native parsers handle reliable structured data; code owns validation, financial-event identity, matching rules, rounding, totals, charts and exports. The [format catalogue](#document-formats-and-field-catalogue) specifies routes and expansion boundaries.

Public copy should promise **different document layouts across supported formats**, not literally any file or guaranteed perfect extraction. Test text/scanned/multipage PDFs, image formats, DOCX, XLSX/CSV and supported text/JSON/XML profiles. Password-protected, damaged, unreadable and unsupported files get a clear per-file result. Do not process a different fixture in place of an unsupported visitor input.

The finalized sample gallery must contain the actual authored originals and correct preview renditions. Stored extraction results can support a free, immediate **prepared sample** mode. They are explicitly labelled; they are not proof of fresh GPT processing. The future **Process with AI** route makes real bounded requests only after provider configuration and owner budget authorization. Visitors provide no provider key.

The current research has made no paid model calls. Future real GPT processing has an owner cost and requires a configured budget gate; samples and ordinary code can remain available when that gate is closed.

## State, backend and bounded processing

Core records: `BusinessIdentity`, `Document`, `FinancialEvent`, `PaymentEvidence`, `Match`, `Category`, `ReviewIssue`, `MetricResult`, `Insight`, `ChatAnswer`. Attach a `workspaceRevision`, scope/basis and source IDs to metric/AI results. Every document keeps its original ID and any rendition relationship. One economic event can link several documents and payment rows.

Use browser session memory for bounded current-run state and originals. One private same-origin backend validates self-contained requests. No durable database, ORM, multi-tenant dashboard, scheduled task or vector store is required for this small corpus. Request-scoped temporary files are private and cleaned; reset discards browser state/object URLs. Accurately describe any future provider handling; do not claim browser-only privacy when files are sent to GPT.

Proposed API surface:

- `POST /v1/money/extract` — one validated document and business context; proposed fields/roles, evidence and issues.
- `POST /v1/money/review` — current bounded workspace/revision plus explicit edits/match commands; validated updated records and deterministic metrics.
- `POST /v1/money/insights` — current validated ledger/revision; bounded evidence-linked observation cards.
- `POST /v1/money/chat` — one question, bounded current context and recent conversation; allowlisted read-only tool loop and cited response.
- Export from the same reviewed revision. Original files need not be resent for dashboard arithmetic; excerpts are carried only when needed and within caps.

Proposed limits: **10 original files**, 5 MB each, 20 MB combined; 20 rendered pages combined; 25 invoice lines; at most one payment CSV of 100 rows plus an optional historical events CSV of 100 rows. Preview renditions count toward preview-resource limits but not as separate input records. One business per run; currencies stay separate.

One extraction model request per unstructured document, sequential processing; one explicit extraction retry per run. For the copilot: up to **four guest questions** and **two deliberate insight generations** per run, each with at most four tool calls and three model round trips. A question counter alone cannot control spend; enforce input/output token, time, concurrency/rate and owner-budget limits across the full run. No automatic retries or calls triggered by hovering, chart filters or opening PDFs.

Record edits recompute figures through code and mark old insights/answers as stale. Keep the answer’s original revision visible and disable its outdated action links; offer one explicit refresh within the cap. Do not silently launch a new model call on every keystroke. A stale provider answer cannot overwrite newer state.

Documents, excerpts, CSV values and user text are untrusted data. Do not obey embedded instructions about tools, secrets, websites or changing records. Validate tool names/arguments/IDs independently of the model, bound excerpts, sanitize rendered text and bind each request to its current-run data. Error states preserve manual review/export and never expose another guest’s files. Sensitive payloads stay out of routine logs.

## Export and usable outcomes

Offer `overview.md`, `financial-events.csv`, `documents.csv`, `payments.csv`, `matches.csv`, `issues.csv`, `insights.md`, optional cited `conversation.md`, `workspace.json` and a source manifest. Original files can be included by an explicit option, byte-preserved and clearly unredacted; previews are identified as renditions. Package in one ZIP. Include basis, period, currency, revision, missing states and whether text was stored sample output or generated live.

The result should remain useful even if the visitor never chats: organized documents, transparent totals, a clear review list and export. Chat adds investigation and explanation; it does not become the only way to navigate the product.

## What the finished demo must demonstrate

- Guests preview actual sample PDFs inline and enter a coherent workspace without login; preview requires no model request.
- Own supported input needs no document-type label. A single identity clarification handles ambiguous business direction; unknown content is excluded/reviewed honestly.
- The base reviewed sample yields income 4,800; costs 1,280; profit preview 3,520; cash in/out 3,000/920; operating movement 2,080; open customer/supplier amounts 1,800/396. Transfers and duplicate evidence do not distort totals.
- An outgoing invoice, receipt and matching bank row cannot become three sales. Partial payments, credit/refund and unknown status fixtures have distinct behavior.
- Every KPI, chart bar, insight and answer has resolvable current-scope evidence. Missing prior data produces no invented trend; zero baselines and mixed currencies are handled explicitly.
- A real copilot investigation uses only allowed tools, reports executed steps, sources its claims and follows the no-financial-advice boundary. Unsupported questions/data produce a useful limited answer.
- Review changes propagate to records, dashboard and export. Old narratives are visibly stale and cannot mutate the ledger or act on outdated records.
- Phone/keyboard preview/navigation, per-file partial failure, unrelated files, prompt injection, forged source IDs, closed provider budget, reset and run isolation are verified.
- Sample versus live mode is unmistakable. Real provider evaluation is required before advertising live format support; no accuracy or performance percentages are invented.

## Build order and scope boundaries

Build in dependency order: financial-event contracts and synthetic sources → exact calculations and linked review → gallery/source viewer → dashboard → GPT input adapter → bounded insights/chat → export/reset and fixture/live evaluation. Choose a small frontend/backend stack consistent with the existing portfolio; do not add orchestration services merely to make the architecture sound larger.

Full double-entry accounting, legal accounting/tax compliance, payroll, depreciation, automatic bank sync, financial advice, payment execution, inbox automation and multi-user administration are outside the demo. Samples and precomputed results can run without paid inference; genuine future GPT inference requires separate spending authorization.

## Guest behaviour and architecture

### A coherent product people can use

Open useful samples without authentication, a visitor API key, a connected business/social account or administrator setup. Explain the purpose in one brief description and numbered steps. Aim for a guided first result in roughly five minutes, with related areas available to explore afterward.

The main agent feature recognizes and explains financial documents, investigates the supplied records and presents evidence linked to sources. A chat widget alone is not the product. Show inspectable evidence, proposals and executed tool statuses, without exposing private reasoning or pretending an animation is actual processing.

All related views derive from the same current guest state and revision. Real local transitions update dependent records, metrics and exports. Old agent outputs become stale when their evidence changes.

### One frontend, one private backend

Keep credentials on the backend. Use shared validated contracts and bounded current-run state; browser memory is sufficient for a bounded guest session. No persistent application database, shared upload bucket, multitenant admin system, durable scheduler or visitor account is required for the first build.

Use stable record IDs, revision checks and idempotent commands. Arithmetic, financial-event identity, dates, matching rules, rounding and totals belong to code. AI interprets supported input, explains facts or proposes an action through constrained tools; it cannot override domain validation.

Reset clears current browser state, streams and object URLs. Temporary backend parser files, if needed, use isolated request paths and cleanup. Exports bind to the reviewed/current revision. User-downloaded files remain on their device; do not promise instantaneous provider-side deletion.

### Sample, computed and live modes

- **Sample AI:** explicitly prepared output for its matching seeded input. Ordinary state transitions and calculations still work.
- **Computed/manual:** actual validated code-based parsing, editing, filtering, transitions and exports.
- **Live AI:** an explicitly enabled owner adapter for supported visitor input, with an approved spend limit.

Unsupported arbitrary input must not receive an unrelated stored result presented as fresh AI work. Preserve the visitor's input and explain the unavailable path. The Retrosum unstructured-document route must use a verified GPT API across tested formats in its eventual implementation; native parsing is appropriate for structured exports.

This documentation does not authorize enabling paid providers. Later live operation needs an explicit owner budget, backend gate, token/output limits, timeouts, concurrency caps and bounded deliberate retries. Filtering, arithmetic, previewing samples and rendering charts do not need fresh model calls.

### External actions and changes

The guest explicitly confirms reviewed record edits and payment/duplicate relationships. Financial copilot tools remain read-only; record review is a separate visible control.

All record reviews, matches and corrections affect the local demo only. No real payments, refunds, account writes, emails or external marketplace actions occur.

### Sources, privacy and behavior

Separate synthetic data from visitor input unless the visitor explicitly chooses a supported merge. Keep source coverage, period, currency, applicable policies, processing mode and revision visible where they matter. Treat files, extracted fields and guest messages as untrusted data.

Tools use validated finite filters and record IDs, not arbitrary SQL, general browsing or arbitrary code. Minimize submitted fields and logs. Before enabled provider processing, state the actual provider and handling; browser-local state alone does not imply data never leaves the device.

Retrosum explains supplied records and computed metrics, with **no financial, tax or investment advice**.

### Verify the connected story

Check a meaningful main action and its effects in every related view. Prevent double-counted financial events, duplicate inclusion and unsupported paid/unpaid interpretations. Verify evidence links, stale-output handling, export, reset, mobile/keyboard use, partial failures and unavailable live mode.

Production auth, role isolation, billing, provider integrations and live model accuracy require separate implementation evidence. Do not claim conversion uplift, model accuracy, regulatory compliance or paid-platform expertise from a synthetic concept preview.

## Document formats and field catalogue

### The product decision

Invoice extraction is now a component inside the **Business Money Workspace**: mixed business documents → reviewed income/expense events → profit/cash/open-item views. The expanded [gallery, automatic recognition, dashboard and copilot scope](retrosum.md) now defines the guest product, with a no-financial-advice boundary. Document type is recognized automatically; business identity may need one confirmation. Sample originals and PDF preview renditions remain separate from economic events.

The current [scope](#financial-meaning-and-the-sample-dashboard) defines the business identity, financial meaning and exact sample arithmetic. This replaces the preceding batch-register-only product story.

Use GPT for supported unstructured-document understanding, with native parsing for reliable structured fields. The catalogue below describes the invoice component; the broader workspace adds business-side classification, document/event relationships, payment evidence and report-inclusion states. A fixture-only mock does not fulfil the intended live GPT capability.

### What broad support can honestly mean

Target **different invoice layouts across a tested set of formats**, including scans. No API guarantees correct extraction from every PDF, language, corrupted file, handwriting style or password-protected document. “Any layout” should mean we avoid vendor-specific templates; support is still bounded and evaluated.

OpenAI’s Responses file handling differs by type: PDFs provide text and page images to a compatible model, while other document inputs use extracted text. Embedded images in those other documents need separate treatment. Spreadsheet inputs are augmented and limited to the first 1,000 rows per sheet, so this design reads bounded sheet values directly for exact checks. [OpenAI file inputs](https://developers.openai.com/api/docs/guides/file-inputs)

Vision accepts PNG, JPEG, WEBP and non-animated GIF. Small text, rotation and other visual conditions can affect interpretation. Format acceptance alone is not an accuracy result. [OpenAI images and vision](https://developers.openai.com/api/docs/guides/images-vision)

The following routes are **our proposed application plan**, not claims of implemented support or OpenAI handling every extension directly.

| Input family | Proposed route | Release boundary |
| --- | --- | --- |
| Text PDF, scanned PDF, mixed/multipage PDF | GPT reads bounded PDF text/pages; retain original for review | Core target, with legibility and page fixtures |
| JPG/JPEG, PNG, WEBP, still GIF | GPT vision; normalize orientation safely | Core target; include photo/scan examples |
| DOCX | Parse text/tables; render relevant image-containing pages before vision | Core target only after text and image fixtures pass |
| XLSX, CSV | Read cells/rows natively; GPT maps labels when needed | Core target for one invoice per file; never execute formulas/macros |
| TXT, Markdown, HTML | Parse text/safe tables; GPT maps the content | Core target; never execute HTML or fetch its links |
| JSON invoice exports | Recognized schema adapter, otherwise reviewed mapping | Core target for documented fixtures; arbitrary JSON is not automatically an invoice |
| XML / UBL e-invoice | Safe XML parsing and explicit schema mapping | Core target for one tested profile; disable external entities |
| Factur-X PDF + embedded XML | Detect and parse recognized XML; show readable PDF beside it | Additional adapter; preserve original PDF bytes |
| Other XML schemas, including CII variants | Add versioned native mappings | Declare exact profile coverage rather than “all XML” |
| TIFF, HEIC/HEIF, BMP or other image containers | Safe bounded conversion to supported images | Expansion after conversion/resource fixtures |
| DOC, XLS, RTF, ODT, ODS and presentation exports | Sandboxed parser/renderer or ask for PDF/XLSX | Expansion, not a silent all-office-files promise |
| EML/MHTML/email attachment bundles | Parse body and allow-listed attachments; no inbox connection | Later import adapter; count each attachment against caps |
| ZIP/archive batches | Would require bounded safe archive extraction | Decline in first build; guest selects files directly |
| Password-protected, damaged or restricted files | Explain why processing cannot proceed | Ask for an unlocked/readable copy; no password bypass |
| Invoice URLs/platform accounts | Need a separate authorized connector and URL controls | Core uses downloaded files; no account connection or remote fetch |
| Signed documents | Keep original bytes and expose the source | No signature verification or legal-validity claim |

Factur-X combines a readable PDF and structured XML. **Our inference:** prefer available structured fields and compare them to the visible document when helpful. Do not replace a signed/source PDF with a regenerated file. [Factur-X overview](https://fnfe-mpe.org/factur-x/factur-x_en/)

### Field priorities, rather than a giant form

There is no finite universal list: regional standards, industries and vendor custom fields vary. The catalogue below covers **136 proposed field targets**, including nested groups and application metadata. It is extensible; it does not promise every field is printed on every invoice.

**C — Core:** show the useful subset in the register/review and retain in the primary record. Missing values can still be legitimate. **D — Detail:** capture when present; reveal on demand. **X — Extension:** uncommon/sensitive/custom information; preserve when identifiable, with restrained display/export.

“Most useful” is our product recommendation, not a measured survey of users. The default register should show supplier, invoice number, issue/due dates, currency, stated total, amount due, category and review state. Expand a row to inspect buyer details, line items, taxes, terms and references. A nontechnical visitor should not face 136 input boxes.

#### What the primary references establish

Peppol provides a useful invoice structure: identity and dates; supplier, buyer and other parties; business references; delivery, payment, terms; allowances, taxes, totals and lines. This is a reference catalogue, not a rule that every country or invoice must contain these fields. [Invoice structure](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/)

Line references separate quantity, net value, periods and item information. Item details can include identifiers, origin, classification and extra properties. [Invoice lines](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-InvoiceLine/), [item details](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-InvoiceLine/cac-Item/)

Totals distinguish pre-tax and tax-inclusive amounts, discounts, charges, prepaid amounts, rounding and the payable amount. This is why “total” and “amount due” need separate fields. Tax breakdowns retain each base, category/rate and amount. [Monetary totals](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-LegalMonetaryTotal/), [tax breakdown](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-TaxTotal/cac-TaxSubtotal/)

Payment information can include a remittance identifier and financial account or mandate details. Capture only what is supplied, mask sensitive values in normal views and never initiate payment. [Payment means](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-PaymentMeans/)

Stripe’s structured invoice object also distinguishes customer/merchant details, amounts due/paid/remaining, status, references and custom metadata. These runtime/provider fields need not appear on an uploaded PDF, and a document’s payment claim is not independent settlement evidence. [Stripe invoice object](https://docs.stripe.com/api/invoices/object)

### Proposed field catalogue

#### Document identity

Reference family: P1. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| kind | C | Invoice, credit note, receipt, pro forma or unknown; review the document type. |
| invoice_number | C | Preserve the exact identifier, including leading zeros. |
| issue_date | C | Raw printed date plus normalized date when unambiguous. |
| due_date | C | May be absent or described through terms. |
| currency | C | Explicit currency code; a lone dollar sign is insufficient. |
| document_title | D | The title actually printed. |
| revision_reference | D | Revision/version if supplied. |
| preceding_invoice_reference | D | An earlier invoice or credit-note link. |
| tax_point_date | D | Separate from issue date. |
| tax_accounting_currency | X | Preserve separately from transaction currency. |

#### Supplier

Reference family: P1. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| supplier_name | C | Displayed vendor name. |
| supplier_legal_name | D | Keep separate if different. |
| supplier_trade_name | D | Alternate trading identity. |
| supplier_address | D | Structured parts plus original address text. |
| supplier_country | D | Printed country; avoid guessing from language. |
| supplier_tax_ids | D | List of labelled VAT/GST/tax identifiers. |
| supplier_registration_id | D | Business/company registration if printed. |
| supplier_email | D | Contact only; never send automatically. |
| supplier_phone | D | Preserve international form. |
| supplier_website | D | Text value; do not fetch during extraction. |

#### Buyer and other parties

Reference family: P1. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| buyer_name | D | Person or organization billed. |
| buyer_address | D | Billing address, separate from delivery. |
| buyer_country | D | Printed country. |
| buyer_tax_ids | D | Labelled identifier list. |
| buyer_registration_id | X | Separate business identifier. |
| buyer_contact | D | Named contact and printed contact details. |
| customer_reference | D | Supplier-assigned customer identifier. |
| payee | X | Payee identity when different from supplier. |
| tax_representative | X | Named tax representative, if present. |

#### Business references and timing

Reference family: P1. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| purchase_order_reference | D | PO match key; no PO comparison in core demo. |
| sales_order_reference | D | Supplier order reference. |
| contract_reference | D | Agreement identifier. |
| project_reference | D | Project identifier/name. |
| buyer_reference | D | Internal routing reference. |
| accounting_reference | D | Printed account/cost reference. |
| service_period | D | Start/end or original service-period wording. |
| delivery_date | D | Do not confuse with issue/due date. |
| dispatch_reference | X | Dispatch document identifier. |
| receipt_reference | X | Goods receipt document reference. |
| tender_reference | X | Tender/lot identifier. |
| supporting_documents | X | Referenced attachment names/IDs, without remote fetch. |

#### Line items

Reference family: P2/P3. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| line_id | D | Original line identifier plus application row ID. |
| description | C | Original product/service wording. |
| item_name | D | Short item name when distinct. |
| quantity | C | Decimal value; null when omitted. |
| unit | D | Hours, each, kg or source unit. |
| unit_price | C | Preserve tax-inclusive/exclusive basis if known. |
| price_base_quantity | D | Price may apply to a pack or several units. |
| line_net_amount | C | Printed net line value. |
| line_gross_amount | D | Separate if explicitly available. |
| line_discount | D | Amount/rate plus its basis. |
| line_charge | D | Surcharge amount and reason. |
| line_tax_category | D | Printed category label. |
| line_tax_rate | D | Rate may be zero, exempt or absent. |
| line_tax_amount | D | Capture when printed; distinguish calculated value. |
| seller_item_id | D | SKU or supplier item code. |
| buyer_item_id | X | Buyer-assigned item code. |
| standard_item_id | X | Labelled standardized identifier. |
| origin_country | X | Item origin, not supplier location. |
| commodity_code | X | Printed commodity/classification code. |
| line_service_period | D | Line-specific dates may differ from the header. |
| line_order_reference | D | Related PO/order line. |
| line_accounting_reference | X | Printed cost/accounting assignment. |
| item_properties | X | Bounded name/value pairs for unusual attributes. |

#### Money

Reference family: P4. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| lines_net_total | D | Printed sum of net lines. |
| subtotal_excluding_tax | C | Printed pre-tax subtotal. |
| tax_total | C | Printed total tax, not an inferred rate. |
| total_including_tax | C | The stated invoice total. |
| discount_total | D | Header-level allowances separate from line discounts. |
| charge_total | D | Header-level charges. |
| shipping_amount | D | Explicit shipping; do not count twice inside charges. |
| prepaid_amount | D | Deposit or prior payment explicitly stated. |
| rounding_amount | D | Printed rounding adjustment. |
| amount_due | C | May differ from the full invoice total. |
| amount_paid_claim | D | Document/API claim, not verified bank settlement. |
| balance_remaining_claim | D | Source state; distinguish from current live balance. |
| overpaid_amount_claim | X | Only if explicitly supplied. |
| discount_details | D | Reason, basis and amount/rate. |
| charge_details | D | Reason, basis and amount/rate. |

#### Tax details

Reference family: P5. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| tax_breakdowns | D | Repeated groups rather than one universal tax rate. |
| taxable_base | D | Base for each group. |
| tax_category | D | Printed tax category. |
| tax_rate | D | Preserve zero versus unknown. |
| tax_amount | D | Printed tax for the group. |
| exemption_reason | D | Original exemption text/code. |
| withholding_details | X | Preserve printed withholding without applying tax law. |
| reverse_charge_note | X | Printed wording only. |
| other_tax_labels | X | Regional labels retained without a compliance claim. |

#### Payment and terms

Reference family: P6/B1. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| payment_terms_text | D | Original terms, including conditions. |
| payment_terms_days | D | Normalize only when clear. |
| payment_method | D | Stated method or code. |
| payment_reference | D | Remittance identifier. |
| beneficiary_name | D | Printed payee name. |
| bank_name | X | Hidden from default review/export. |
| bank_account | X | Sensitive; opt-in full-value export. |
| iban | X | Capture if present, masked by default. |
| bic_swift | X | Preserve with the financial details. |
| payment_link | X | Display safely as text; no payment action. |
| card_reference | X | Only an already masked printed reference. |
| direct_debit_reference | X | Mandate identifier if printed. |
| early_payment_discount_terms | X | Text and explicit amount/rate, no eligibility advice. |
| late_payment_terms | X | Printed wording, no automatic enforcement. |
| payment_status_claim | D | Unverified source claim with source/date. |

#### Delivery and industry extensions

Reference family: P1/P3/B1. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| delivery_recipient | D | Ship-to identity. |
| delivery_address | D | Separate ship-to address. |
| delivery_location_id | X | Printed location identifier. |
| shipping_reference | X | Shipment/carrier reference if supplied. |
| subscription_details | X | Plan, period and billing-cycle wording. |
| usage_details | X | Printed usage, units, allowances or prorations. |
| currency_conversion_details | X | Printed rates/amounts; no new conversion. |
| industry_details | X | Travel dates, vehicle/job IDs or other labelled details. |
| custom_fields | X | Preserve unknown printed name/value pairs. |
| notes | D | Bounded original notes. |

#### Structured-source metadata

Reference family: B1/F1. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| provider_invoice_id | D | Only from supplied structured input. |
| source_status | D | Provider/source status with its timestamp. |
| source_pdf_reference | X | Supplied URL/identifier; never arbitrary server fetching. |
| source_hosted_page_reference | X | Keep as a reference, no platform login. |
| source_created_timestamp | D | Separate from printed invoice date. |
| source_custom_metadata | X | Bounded source keys; no uncontrolled object payload. |
| embedded_xml_profile | D | Recognized structured document profile/version. |

#### Application provenance and review

Reference family: Design. Keys below are our proposed storage design; they are not a copied standard or universally required fields.

| Proposed key | Priority | Meaning / review rule |
| --- | --- | --- |
| record_id | C | Current-run identifier. |
| original_filename | C | Original name plus safe export name. |
| source_hash | D | SHA-256 of original file bytes. |
| input_format | D | Validated format, not extension alone. |
| source_locations | C | Page/text/cell/XML path where available. |
| raw_values | C | Keep original strings alongside normalization. |
| field_states | C | Present, missing, ambiguous, unsupported or user-supplied. |
| category_suggestion | C | Editable business-purpose category, not tax advice. |
| review_state | C | Needs review, reviewed or unresolved issues. |
| issues | C | Code-generated or clearly labelled model observations. |
| duplicate_candidates | C | Relationships and reasons, awaiting user confirmation. |
| export_disposition | C | Include, exclude confirmed duplicate, or keep unresolved. |
| user_edits | D | Old/new values, field and review origin. |
| calculated_checks | D | Computed values separate from source amounts. |
| extraction_mode | C | Sample result, native structured import or live GPT. |
| processing_metadata | X | Adapter/model/schema version and processing time. |

### Normalization and extraction rules

- Keep source strings plus normalized values and a source reference. A missing field is null, not zero. Preserve identifiers as strings and retain unknown custom labels in a bounded extras list.
- Keep original language and support non-Latin fixtures. Normalize dates only when unambiguous; “03/04” without context needs review. Do not infer USD from “$”. Never combine currencies into one spending total without an explicit conversion workflow.
- Classify invoice, credit note, receipt and pro forma separately. A credit note must not silently increase payable spend. Review uncertain types; do not declare every uploaded financial page to be an unpaid invoice.
- Record stated total, stated amount due and stated paid status separately. Missing amount due is not automatically full total. Payment terms alone do not prove whether money remains owed today.
- Distinguish an extraction error from an inconsistency in the source. The guest may correct a misread number. If the printed numbers disagree, retain the printed amount, show the calculated comparison and leave an unresolved discrepancy unless evidence resolves it.
- Check arithmetic only when the necessary bases and price/tax rules are known. Discounts, price-per-pack, inclusive taxes, partial payments and rounding change the calculation. Otherwise state “not enough information to check”.
- Exact text/cell/XML references can be verified against parsed content. For scans, show the actual page and label the proposed evidence for visual review. Do not claim exact bounding boxes or invented confidence percentages from GPT.
- Bank data is optional and masked by default. Masking a table does not redact the original file inside a download. Explicitly describe that original files remain intact.

### GPT extraction and code validation

Use Responses with a model that supports the required document/vision inputs and strict schema output. Model choice follows the fixture evaluation and a later owner-approved cost budget; no model or API spending is selected by this research. The extraction instruction treats invoice content as data, never as permission to call tools, reveal secrets or fetch URLs.

Use a versioned strict JSON schema through Responses text.format with type json_schema and strict true. Typed core fields, optional detail groups and a bounded extras array avoid uncontrolled keys. Handle refusal, incomplete output, missing evidence and schema failure explicitly. Strict schema output controls structure; it does not guarantee correct values. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

Ordinary code owns decimal calculations, duplicate candidate scoring, exact file hashes, date/currency grouping, filenames and export generation. GPT proposes document type, mapped fields and business categories. The user can change categories or choose Unknown; these labels do not assert tax deductibility.

Prefer request-scoped processing and store:false when appropriate. If the Files API is used, arrange explicit deletion/expiry. Neither browser-memory state nor store:false is a blanket promise about external-provider retention; accurately describe enabled provider handling. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)

### The connected money features

The core product now includes a money overview, document inbox, income/expense records and payment review. Their shared financial-event model matters more than the number of screens. Classification changes affect relevant totals; category edits affect charts; matching evidence changes cash/open state without creating duplicate income.

Retain these additional workspace fields alongside the invoice catalogue: business identity and party role; event ID/type/direction; related invoice/credit/receipt; reporting basis and inclusion; net/tax/gross amounts; payment evidence/source state; match/partial-payment amounts; reviewed open balance; owned-account transfer references; review provenance. Unknown direction or settlement state needs review rather than a model guess.

See the [current scope](retrosum.md) for the six-step guest story and cap of 10 files, 20 MB combined and 20 rendered pages. The initial launch can support a smaller tested format subset while preserving this complete product story. PO comparison, inbox connectors, bank sync and an MCP interface remain later choices; the guest story needs none of them.

### Evaluation before saying “supported”

Build expected-output fixtures for: selectable and scanned PDFs; rotated/blurry photos; multi-page line tables; DOCX images/tables; XLSX/CSV exact decimals; structured JSON and one XML profile; different languages, decimal separators and ambiguous dates. Include legitimate inclusive/exclusive tax, discounts, deposits, rounding, exempt rates, credit notes and missing fields. Use synthetic or explicitly authorized documents.

Measure document-type and field correctness separately from schema success. Record missing/incorrect core values, line coverage, source-reference validity, false discrepancy alerts and duplicate mistakes. Publish actual evaluation results only after testing; this document provides no accuracy percentage.

Completion needs live GPT fixtures for the claimed unstructured formats, correct source review, safe imperfect-input handling and a functioning export. A precomputed sample can demonstrate the UX and code checks cheaply while development proceeds; it cannot establish arbitrary-upload support.

## Complete brand and visual direction

### What the word means for this product

**Retro / retrospect + sum.** The guest looks back through their business documents and understands what the numbers say: income, costs, recorded cash, open amounts and the evidence behind them. “Sum” connects the records to a useful overview and explanation. This is our brand interpretation of the coined name, not a claim about an official dictionary origin.

The user specifically liked the vintage association. It is now an intentional part of the identity. The product still has a modern, useful experience: sample previews, automatic document recognition, linked charts, evidence-backed agent observations and a conversational copilot.

**Plain descriptor:** Business money workspace. **Working line:** Make sense of your business money. **Proposed pronunciation:** REH-troh-sum. The name, domain and vintage direction are selected; this line and the precise design treatments below remain proposals.

### Name and domain

**Selected intended domain:** [retrosum.com on Cloudflare Registrar](https://www.cloudflare.com/domains/search?q=retrosum.com). Use the plain domain, without the try prefix. The user reported that it was available in this turn.

The earlier exact Cloudflare observation was recorded at **21:07:33 Cairo / 18:07:33 UTC on 3 October 2026**. Its result read “Buy now: retrosum.com for $10.46. Renews at $10.46 per year.” This is point-in-time evidence, not a new check or a reservation. [Original exact observations](#name-and-domain).

**Registration is not confirmed by the user.** No domain was purchased or registered during this update.

### Logo direction

Start with a readable **Retrosum wordmark** inspired by vintage editorial and printed business stationery: warm serif letterforms, a little weight and a confident silhouette. It should feel welcoming and credible beside the dashboard. A restrained emphasis on **sum** can express the wordplay without making the name look like two unrelated brands.

A compact R or RS monogram, or a simple stacked-record motif, can be explored for the app icon. These are candidate approaches, not selected final artwork. Begin by testing the wordmark at navigation size, in a browser tab and in one colour. The companion's serif wordmark and small record mark are a direction preview.

Keep distressed textures away from essential text, tables and charts. Avoid illegible decorative type, tiny ledger print and ornamental details that compete with the figures. The vintage character comes from the brand type, colours and restrained framing; the interface remains easy to scan and operate.

### Proposed colourway

| Role | Starting colour | Use |
| --- | --- | --- |
| Canvas | `#F4EBDD` · Warm paper cream | Outer page and quiet background |
| Panels | `#FFFCF5` · Clean ivory | Documents, cards and working surfaces |
| Text | `#263C34` · Deep green ink | Headings, amounts and body copy |
| Muted text | `#5A685E` · Readable grey green | Supporting labels that remain readable |
| Primary action and data | `#28594C` · Vintage forest green | Buttons, navigation and primary chart series |
| Agent accent | `#98442F` · Muted terracotta | Copilot identity and insight accents |
| Secondary highlight | `#77551F` · Dark ochre | Small highlights with explicit labels |

This palette is a **starting proposal**, not a finished design system. Forest green, warm cream and terracotta give the vintage direction a concrete first expression in the HTML companion. Validate text, focus, selected states and chart colours when the product is built. Status always uses words or icons as well as colour; terracotta is an agent accent, not a universal expense/error signal.

### Applying the identity to the demo

1. **Entry and samples:** the Retrosum wordmark, warm paper backdrop and a clear invitation to explore the sample business or upload supported files.
2. **Document preview:** readable, varied synthetic supplier/customer documents. Each fictional business keeps its own design; the app's palette frames the viewer rather than repainting every source.
3. **Overview:** prominent figures, a clear period and basis, useful charts and links to contributing records. Keep numerals and controls crisp and familiar.
4. **Agent and copilot:** restrained terracotta accents, short observations and visible evidence links. The agent explains supplied records and measurements; **no financial, tax or investment advice**.
5. **Review and export:** clear actions, source references and the current workspace revision. The same records drive every screen and download.

## Design and format references

The following references informed the document structures, fields, parsing routes, sample layouts, traceable dashboards and agent design. They are retained from the earlier research and were not reverified during this consolidation. Proposed features and supported-format claims still require implementation and evaluation.

- **R1** — [Senior/Lead AI engineers: what portfolio project actually makes you say this person knows production?](https://www.reddit.com/r/AI_Agents/comments/1wo286p/seniorlead_ai_engineers_what_portfolio_project/)
- **R2** — [How are you actually using AI agents in real workflows right now?](https://www.reddit.com/r/AI_Agents/comments/1snagk0/how_are_you_actually_using_ai_agents_in_real/)
- **G1** — [DylanMerigaud/ai-invoice-parser](https://github.com/DylanMerigaud/ai-invoice-parser)
- **G2** — [Nutlope/receipthero](https://github.com/Nutlope/receipthero)
- **G3** — [deepset-ai/haystack-rag-app](https://github.com/deepset-ai/haystack-rag-app)
- **G4** — [OpenRefine/OpenRefine](https://github.com/OpenRefine/OpenRefine)
- **D1** — [OpenRefine: Exploring data](https://openrefine.org/docs/manual/exploring)
- **G5** — [plotly/dash-sample-apps](https://github.com/plotly/dash-sample-apps)
- **I1** — [PayPal: invoice PDF downloads and integration](https://www.paypal.com/us/cshelp/article/can-i-archive-delete-or-cancel-an-invoice-help312)
- **I2** — [Stripe: hosted invoice page](https://docs.stripe.com/invoicing/hosted-invoice-page)
- **I3** — [QuickBooks: Accounts Payable automation](https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/import-invoices-bills-quickbooks-online/L9RjlTn7D_US_en_US)
- **I4** — [PayPal Invoices v2](https://developer.paypal.com/api/invoicing/v2)
- **M1** — [MCP: Understanding servers](https://modelcontextprotocol.io/docs/learn/server-concepts)
- **O1** — [OpenAI: File inputs](https://developers.openai.com/api/docs/guides/file-inputs)
- **O2** — [OpenAI: Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
- **O3** — [OpenAI: Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- **O4** — [OpenAI: Data controls](https://developers.openai.com/api/docs/guides/your-data)
- **P1** — [Peppol: Invoice structure](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/)
- **P2** — [Peppol: Invoice line](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-InvoiceLine/)
- **P3** — [Peppol: Item details](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-InvoiceLine/cac-Item/)
- **P4** — [Peppol: Monetary totals](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-LegalMonetaryTotal/)
- **P5** — [Peppol: Tax breakdown](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-TaxTotal/cac-TaxSubtotal/)
- **P6** — [Peppol: Payment means](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-PaymentMeans/)
- **B1** — [Stripe: Invoice object](https://docs.stripe.com/api/invoices/object)
- **F1** — [FNFE-MPE: Factur-X](https://fnfe-mpe.org/factur-x/factur-x_en/)
- **W1** — [QuickBooks: cash and accrual methods](https://quickbooks.intuit.com/learn-support/en-us/help-article/product-preferences/choose-cash-accrual-accounting-methods-reports/L64yocn6B_US_en_US)
- **W2** — [Actual Budget: importing transactions](https://actualbudget.org/docs/transactions/importing/)
- **W3** — [Actual Budget: transfers](https://actualbudget.org/docs/transactions/transfers/)
- **W7** — [Metabase: drill-through](https://www.metabase.com/docs/latest/questions/visualizations/drill-through)
- **V1** — [Smartsheet: PDF invoice templates](https://www.smartsheet.com/content/free-pdf-invoice-templates)
- **V2** — [Smartsheet: PDF receipt templates](https://www.smartsheet.com/content/receipt-template-pdf)
- **V3** — [FreshBooks: PDF invoice templates](https://www.freshbooks.com/invoice-templates/pdf)

Workflow implications: keep document-based figures separate from recorded cash (W1); parse supported structured exports with native code (W2); identify explicitly owned-account transfers so they do not inflate operating income or costs (W3); make totals and charts drill down to contributing records (W7). These are design choices for the bounded supplied-record workspace.

## Lessons from the earlier project

[Lessons learned from ClipBuilder](LESSONS_LEARNED_FROM_CLIPBUILDER.md) — copied unchanged at the user’s request.
