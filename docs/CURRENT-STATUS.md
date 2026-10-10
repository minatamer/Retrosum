# Retrosum current status

Updated **10 October 2026**. This page summarizes current completion; the [blueprint](RETROSUM_DEMO_SOURCE_OF_TRUTH.md) owns behavior and [RET-011 validation](validation/RET-011.md) owns measured acceptance. Older ticket/evidence/commit snapshots retain their original dates and results.

## Completed locally

- All twelve packets have implemented local product or deployment-preparation outcomes; no additional local feature ticket is waiting. Source candidate `bd9af4b` and evidence commit `939ca7e` passed the settled gates: 386 tests in 39 files, 130 boundary source files and both production builds.
- The sample contains ten original PDFs/eighteen pages. Two independent actual-byte OpenAI passes and record/source audits passed; seventeen live Retro cases passed. Real localhost Turnstile, one-use admission, paid PDF processing, grounded Retro/source replies and deliberate restart recovery passed.
- `/demo` owns Choose → Documents → Process → Dashboard. Dashboard and Records date ranges are independent and reset to defaults on refresh. The Documents/Records review queues stay synchronized. The canonical logo, selected headline, full-height trend, contextual chat shortcuts, collapsed sources, remembered large-chat choice, fast typing and thin shared scrollbars are implemented.
- Live documents and Retro use `FAKE_MODE=false` with the single `PAID_DEMO_ENABLED=true` switch and private backend credentials. Committed defaults remain fake/paid-off. Workspace ZIP/generated-invoice export controls are removed; actual original PDF downloads remain.

## Owner-confirmed OpenAI setup

Document selection now exposes **How processing works** as an optional details dialog. A concise OpenAI disclosure accompanies the explicit Process action; per-document admission/challenge runs inline without repeated extraction-review modals. Retro retains its per-turn review and all individual one-use grants remain required.

The owner confirms the configured OpenAI spending limit is **USD 5** and is already set. Record this as owner-confirmed setup, not a pending request to configure it. Its dashboard scope/period and enforcement have not been independently inspected; no prepaid balance or guaranteed global application cap is inferred. The USD 2.50 process-local admission/evaluation allowance remains a separate application control.

The owner selected **90-day API-key expiry**. Actual Responses generation/input-count access works; the final dashboard expiry timestamp and complete saved permissions have not been inspected. These are manual account-verification details, not missing application features. Secrets remain in ignored backend `.env.local`; no key/account value was copied into documentation.

## Remaining acceptance

- **Deployment preparation and hosted acceptance:** rebuild/verify Linux images for the current ten-PDF/code snapshot, record immutable digests, resolve Cloud Run project/region/domain/runtime identities and secret bindings, then verify IAM, hosted Turnstile/origins, log retention, capacity/overlap, paid-off and rollback. Earlier eight-PDF Linux evidence is historical. No image push, cloud change or deployment is authorized or completed.
- **Manual testing and owner acceptance:** aesthetics, physical touch/software keyboards, assistive technology/browser profiling, real human handwriting and broader upload accuracy. Current sample OCR success does not establish every upload's accuracy. Account permission/expiry/billing-enforcement and provider-handling verification remain manual checks.

No further feature implementation is identified by the documented queue. Future defects or owner feedback can reopen the relevant packet; deployment and manual acceptance remain separate from completed local checks.
