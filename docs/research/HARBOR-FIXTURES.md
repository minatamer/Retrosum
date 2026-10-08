# Harbor Studio visible PDF corpus

RET-003 · fixture version `harbor-v1` · research and authoring checked 8 October 2026. Original fictional layouts and records; English/USD. September is the main period, August the comparison, and the visible D07 snapshot date is 3 October 2026.

## Research and authorship

[FreshBooks invoice templates](https://www.freshbooks.com/invoice-templates) informed the core party/date/reference/item/tax/total/terms fields and service billing patterns. [Vertex42's Excel invoice](https://www.vertex42.com/ExcelTemplates/excel-invoice-template.html) informed quantity/unit-price tables; its [receipt guidance](https://www.vertex42.com/ExcelTemplates/receipt-template.html) informed paid rent/subscription documents. No downloaded provider template, branding or customer information is redistributed; Vertex42's downloadable template license is private use, so the actual layouts here are original.

The [Burr Printing House historical receipt](https://commons.wikimedia.org/wiki/File:Burr_printing_house_receipt.jpg) was inspected as a reusable archival reference; Commons marks the original public domain. It is not Harbor's modern rent evidence and was not added as a ninth document.

D04 is an original fictional Cove Spaces receipt rendered with [Caveat](https://github.com/google/fonts/blob/main/ofl/caveat/DESCRIPTION.en_us.html), a handwriting family by Pablo Impallari. The [SIL OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/OFL.txt) and official font are bundled in `scripts/fixtures/assets/`. Caveat SHA-256: `0bdb6b660482d31531b3945849fba5916b3ef8695da7024a9e6b9ee3c4157988`. The raster is created with Pillow, then embedded as a full-page image with ReportLab. There is no invisible answer-supplying text layer. Both the document and gallery label it **Synthetic handwriting-style**, not human-written. No OpenAI reading or arbitrary-handwriting accuracy is claimed.

The two Northstar files are different grayscale raster renditions of the same original bill. The second is slightly rotated and visibly marked “SECOND COPY - SAME BILL A-77”. Their byte hashes differ, but the independent truth contains one economic event with both sources.

## Visible collection

| ID  | File                             | Pages | Layout / source purpose                                              |
| --- | -------------------------------- | ----- | -------------------------------------------------------------------- |
| D01 | `harbor-HS-101.pdf`              | 2     | Editorial service invoice and matching scope; Cedar income USD 3,000 |
| D02 | `harbor-HS-102.pdf`              | 1     | Grid invoice; Maple income and explicit open total USD 1,800         |
| D03 | `northstar-A-77-scan.pdf`        | 1     | Scanned monospace bill; USD 360 net, 36 tax, 396 gross open          |
| D04 | `rent-R-091-handwritten.pdf`     | 1     | Image-only synthetic handwriting; USD 800 paid rent                  |
| D05 | `papercloud-September.pdf`       | 2     | Compact subscription receipt and same-purchase notes; USD 120 paid   |
| D06 | `northstar-A-77-second-copy.pdf` | 1     | Second raster rendition of D03, same economic bill                   |
| D07 | `harbor-payments-September.pdf`  | 2     | Statement-style movement rows, references and fixed snapshot date    |
| D08 | `harbor-August-records.pdf`      | 4     | Summary plus all five detailed August income/cost records            |

Eight PDFs, fourteen pages, 412,981 bytes after the snapshot-date addition (the generated manifest is the byte authority; verification reports actual totals). Six printed layout families and one synthetic handwriting family. All files are below the 5 MiB per-file and 20 MiB/20-page combined bounds. Actual first-page WebP thumbnails are generated from these PDF pages, not substitute financial evidence.

## Authoring and independent truth

`scripts/fixtures/author-harbor.py` owns the original layouts; it imports no ground truth, provider or financial graph. Use the pinned `scripts/fixtures/requirements.txt` and Poppler, then run the script. It generates the public files, renders every page under ignored `artifacts/local/harbor-v1/`, and computes actual MIME/bytes/SHA/page metadata in the public manifest. Font masters are bundled; no network is needed to regenerate. PDF.js runtime files are separately copied from the pinned installed package by dev/build preparation.

`test/fixtures/harbor-v1/ground-truth.json` is an independently authored field inventory and normalized expected interpretation. It stays outside production app imports. Each page's numeric inventory preserves raw text, occurrence count, normalized value, scale and ledger treatment, with page/block locators. Repeated summaries/service notes are marked as repeats, not new events. Image-only fields were inspected against rendered pixels; embedded text extraction is intentionally empty for D03/D04/D06.

`node scripts/verify-harbor.mjs` checks actual bytes, hashes, pages, thumbnails, all printed numeric occurrences, normalization and the expected ledger/payment relationships. Raster numeric correctness requires visual inspection; this verifier does not pretend empty embedded text proves OCR accuracy. RET-005 owns live recognition evaluation. Changes to visible financial evidence require a new fixture version and synchronized manifest, inventory and expectations.

All fourteen rendered pages were inspected at readable scale. Printed-page numeric multisets are checked independently against the PDFs; raster dates, references, quantity/rate/net/tax/gross and the rent amount were checked visually. D08 contains all USD 4,000 income / 1,100 costs; D07 contains +3,000, −800, −120 and the excluded −200 owned-account transfer. Its operating net is 2,080; all supplied rows net to 1,880. No bank balance or hidden extra month is supplied.

## Viewer behavior and security

The local gallery opens actual PDF.js pages in the shared centered paper dialog. Source targets reuse the shared document/page/row/block contract; the target's page is checked against the actual asset. Context is shown as a page/row caption and excerpt; no invented bounding box or false pixel highlight is used. Zoom is bounded from 75% to 200% of fit width, with a four-million-pixel canvas cap, two-times output scale cap, bounded page dimensions, twelve-million-pixel embedded image policy and twenty-second load/render deadlines.

Original bytes are fetched only from validated same-origin corpus paths, with no credentials or redirects, bounded streaming, PDF signature and SHA checks. The PDF.js worker, fonts, CMaps, ICC profiles and WASM are locally bundled from `pdfjs-dist@6.4.299` (Apache-2.0; copied license). Its current API no longer exposes the older eval-support option. The application renders canvas only: it installs no PDF scripting manager, executable action or clickable annotation layer; XFA is disabled. Original/download links point to the validated local PDF, opening a separate browser viewer when needed. Close cancels owned fetch/render work, destroys the loading task/worker and unmounts the canvas. This is bounded browser preview, not a claim that arbitrary PDF content has been fully audited.

Per-file viewer errors preserve the card and download fallback. Thumbnail failures visibly offer the original. Native dialog focus includes the scrollable page and text disclosure; sticky close controls remain visible. Page changes hide the previous canvas/transcription until the requested original finishes, preventing stale source content from appearing under a new page label.

Local fake-first progress, owner aesthetic feedback and later live OCR acceptance remain distinct. No PDF was sent to a provider, stored on a server or deployed in this ticket.
