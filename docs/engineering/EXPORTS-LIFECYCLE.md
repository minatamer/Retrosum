# Browser exports and session lifecycle (RET-009)

## Current product scope — 10 October 2026

Workspace ZIP and generated-invoice export controls are removed from sidebar, Records, Retro and Reset wording. Original PDF previews/downloads remain. Legacy saved export intents decode as inert history without offering an action, preserving session recovery. Reset, fixed two-hour expiry, bounded originals, owned cancellation and the private revoke route remain implemented. Local paid documents/Retro/Turnstile passed; see [current status](../CURRENT-STATUS.md).

## Historical RET-009 export implementation

The export design, dependency/resource measurements and browser evidence below describe the 8 October scope. They do not advertise a current export feature or a remaining implementation task. The lifecycle paragraphs still describe the retained controller behavior.

The workspace navigation opens a native paper review dialog in a body portal. It captures a detached validated graph, scope, revision and export timestamp. Record counts, file names, basis, as-of date and processing modes are reviewable before preparation. A changed graph hides the old download and offers deliberate capture of the current revision. No file mixes revisions. ZIP/PDF modules load only when their explicit preparation button is used.

## Structured bundle and privacy

The default ZIP contains twelve files: financial events, invoice headers/lines, contacts, documents, payments, matches and issues CSVs; readable overview and current deterministic insights; versioned workspace JSON and manifest JSON. Optional conversation is the thirteenth structured file. All registers describe the inspectable graph, including labelled draft, historical, held and excluded rows. Shared money/dashboard calculations remain the only authority. Money uses exact two-place USD decimal strings, while dates/IDs/source links preserve their validated representation. Draft invoices, paid claims, payment movements and allocations remain distinct.

CSV quotes every cell and escapes quotes/newlines correctly. Untrusted formula-like text and leading control characters receive an apostrophe; controlled numeric columns retain legitimate signs. JSON is output data, without an import/restore feature. Filenames exclude path/control characters and Windows reserved names; ordinal original paths prevent collisions. Download URLs are opaque browser object URLs, with fixed filenames using only the revision.

Default output omits contact email, raw/normalized numeric copies, source excerpts/review notes, notes and account fields. Known owned-account/payment references, email/IBAN patterns and long number sequences are masked across retained untrusted labels/narratives. This minimizes data and does not anonymize it. Structural dates, IDs and amounts are preserved. The independent full-identifier choice retains those source fields. Optional default conversation includes recomputed verified current responses and labelled stale markers; it omits user/free historical narrative. Full-identifier conversation includes stored user text and labelled historical response metadata, with current facts rendered from the captured catalogue rather than invented from saved prose.

Original documents are a separate, default-off choice. Every selected original is checked against its existing PDF metadata/hash before packaging. The ZIP retains its exact bytes and all original contents, regardless of summary masking. Requested unavailable originals fail preparation with a recovery choice; no successful archive silently omits them. No preview image is presented as an original. Existing canonical events with multiple source documents have explicit rendition relationships in matches.csv; duplicate sources and unresolved duplicate evidence retain their actual graph links without an invented canonical match.

## Browser packaging and invoice PDF

Reviewed, exact dependencies: fflate 0.8.3, pdf-lib 1.17.1 and @pdf-lib/fontkit 1.1.1. [fflate's asynchronous ZIP API](https://github.com/101arrowz/fflate/blob/master/docs/functions/zip.md) supplies cancellable level-zero packaging; [PDFDocument](https://pdf-lib.js.org/docs/api/classes/pdfdocument) supplies local creation and embedded fonts. No external font, rendering service or export endpoint receives the graph or files.

Structured text is bounded to 8 MiB characters; actual archive input/output is bounded to 40 MiB. ZIP work has a whole preparation deadline and terminates on abort. Owned arrays are released after preparation settles; the page holds only a generated Blob URL for its one-minute download window. Closing the review, changing options, reset or expiry aborts/revokes owned resources. No automatic retry runs. Download is an explicit native link after preparation, not an automatic save.

Only invoices whose origin is this session have the simple PDF action. It renders the exact validated customer, business, number, dates, lines, quantities, unit amounts, explicit tax and totals with draft/issued status, revision/page and demo limitations. It never sends an invoice or asserts payment/legal compliance. Notes follow the identifier choice; untrusted labels and PDF title metadata follow default masking. The existing licensed local Liberation Sans font is embedded and subset. Unsupported characters fail with a useful structured-export alternative rather than silently replacing a core value. Font input is bounded to 1 MiB, output to 5 MiB/eight pages; word wrapping and page breaks protect content and footers. The verified 25-line stress output spans five pages and retains all lines and USD 50,000 total.

## Cleanup, recovery and the private revoke route

RET-004's session controller remains lifecycle owner. Reset invalidates generations and aborts tracked effects before clearing graph, finalized chat, Undo, proposals and in-memory originals. It removes only the owned projection and Blob workspace entries, releases its lease and starts an empty workspace with a new deadline. Failed local storage cleanup is reported and retried lazily. Failed remote cancellation never undoes a successful local reset.

The fixed two-hour expiry is never renewed by refresh. Startup reconciles retained originals and purges expired entries; active sessions sweep every minute. A closed/crashed browser cannot execute physical deletion until Retrosum runs again. Ordinary refresh/history retains recoverable records and temporary originals; interrupted work restores as deliberate retry and cannot automatically resubmit. Existing lease ownership protects unrelated sessions.

The same-origin Next DELETE bridge accepts only a bounded workspace ID and forwards to the fixed private `/v1/session` route. Backend tracking stores only currently active controllers grouped by that ID, without financial content. Revoke aborts those operations, clears the action cookie and leaves content-free request/allowance counters intact. Responses state that provider copies cannot be recalled. Origin, schema, body/time limits and generic errors remain enforced. RET-010 owns cryptographic grant/admission and durable spend readiness; public live processing is still closed.

Reset cannot delete earlier external downloads or recall provider-controlled copies. The review, reset sheet, session details and settled reset notice state these limitations. Browser abort and remote cancellation are best effort; backend deadlines and provider cleanup still own their part. No paid provider, cloud storage/database, push or deployment was used for this ticket. See [local evidence](../validation/RET-009.md).
