# Canonical money and browser sessions

RET-004 implements one graph and command authority in `packages/money`. Forms use that public engine; Retro and recognition connect through the same controller in their owning tickets. There is no alternate component total or hidden sample ledger.

## Financial decisions

- Exact USD cents, bounded to 1,000,000,000,000 minor units; whole-event and whole-movement aggregate envelopes also stay within this limit so narrower date filters cannot overflow. Invoice quantities have up to two decimals, at most twenty lines, exact multiplication and half-up cent rounding. Explicit tax is a separate amount.
- Posted events describe sales/costs. Actual payments describe cash. A source-paid claim excludes that event from open balances without inventing a movement. Unknown settlement is excluded from open totals unless a valid confirmed partial match supplies balance evidence. Draft invoices are excluded; issuing and recording payment are separate actions.
- Unknown net with separately stated positive tax is held out of net totals. With no separately stated tax, document-total basis is retained and labelled. The cost editor requires a deliberate net entry when net is unknown; it does not silently derive one.
- Confirmed allocations require matching direction, counterparty and currency, cannot exceed a payment or event, and use movements through the fixed business snapshot date. Internal transfers require distinct owned account references, cannot allocate, and are excluded from operating cash and profit.
- One economic reference maps to one canonical event; one payment reference/date/direction/counterparty maps to one movement. Multiple PDF renditions can cite that same event. Holding/marking a source duplicate excludes its facts unless another active ready source supports the same canonical event.
- Source references remain attached when users edit; original PDFs and excerpts do not change. Edited monetary records retain their edit revision. Deletion previews describe dependent allocation removal. Invoice/cost deletion preserves payment movements; contact deletion fails while used.

## Commands and effects

Commands carry identity, workspace, expected revision and at most five related actions. The engine validates a detached final graph, increments once, and returns one eligible latest Undo receipt. Failure leaves the original graph unchanged. Receipts restore the whole affected group at a new revision; later mutations invalidate older Undo. Applied IDs survive Undo and refresh; a 500-action cap rejects new actions rather than evicting replay protection.

The frontend controller owns graph, filters, finalized messages, receipt and persistence status. Form and deletion dialogs capture the opening revision, so a later edit cannot silently rebase an old confirmation. Async operation tokens bind workspace identity, generation, input revision and operation ID. Reset/disposal abort registered effects; late results cannot overwrite newer edits. A PDF write that finishes after Reset is removed from the old cache identity.

## Recovery and browser ownership

`sessionStorage` stores a strict, UTF-8-bounded projection of at most 2 MiB: graph/source metadata, fixed times, revision, scope fields, up to forty finalized messages of at most 2,000 characters, replay IDs and the latest Undo. Pending proposals, request controllers, object URLs, secrets and image/Base64 copies are excluded. Oversized/schema-invalid/corrupt/expired projections do not become financial state. Interrupted recognition is cancelled in both the restored graph and Undo snapshot, with no automatic inference retry.

Creation fixes expiry at two hours. Refresh keeps that deadline. The provider checks expiry and every mutation/async commit checks it again. Reset starts an explicitly fresh empty identity and invalidates the old generation; only owned storage is cleared. Tab close/navigation releases its document-owned Web Lock, while Blobs are cleaned best effort and expired remnants are swept on a later visit. No claim is made that a closed browser immediately erases its physical storage.

An exclusive Web Lock reserves a session identity before writable recovery. A duplicated tab holding copied `sessionStorage` forks to its own identity, preserves the original deadline/records and clears the copied Undo. It cannot read the first tab’s uploaded originals as its own; missing files are labelled. React development remount/reload waits for asynchronous lock release before reopening, avoiding a false duplicate. Browsers without a usable ownership lock keep accurate in-memory state and explicitly disable refresh recovery.

Temporary PDF originals use native IndexedDB, keyed by workspace/document/SHA-256. Signature, declared MIME/length and actual hash are validated. The adapter admits at most 5 MiB per document and 20 MiB per session; a global 80 MiB cache envelope prevents many unexpired tab identities exhausting storage. Database/transaction waits have five-second deadlines; failed writes are atomic. Quota/blocked storage preserves previous saved data and shows a recovery warning while current in-memory calculations remain accurate.

Restore reconciles visitor originals and preserves valid records when bytes are missing. Published immutable samples remain reopenable from their checked local assets without inference. RET-005 owns intake/processing and attaches originals through these controller/cache APIs; Final lifecycle presentation is implemented; workspace ZIP/generated-invoice export controls were subsequently removed. Dashboard/Records date selections are independent and reset to default on refresh; other saved scope fields/preferences/records remain. See [current status](../CURRENT-STATUS.md).

## Verification scope

Independent Harbor field truth checks pure calculations and relationships without seeding the UI. Session tests inject clock, identity, storage, leases and cache to exercise corruption, quota, absolute expiry, copied-tab ownership, async lock handoff, missing originals and Reset races. Native IndexedDB transactions are exercised with pinned development-only `fake-indexeddb` 6.2.5, including the complete 20 MiB cap and isolated cleanup. Browser checks exercise actual forms, financial changes, Undo/refresh, keyboard controls and responsive layouts. Local live corpus/Retro and real localhost Turnstile checks passed. Broader accuracy, owner aesthetics and physical/assistive input remain manual acceptance; hosted verification remains deployment acceptance.
