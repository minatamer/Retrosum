# Retrosum current status

Updated **10 October 2026**. This page summarizes current completion; the [blueprint](RETROSUM_DEMO_SOURCE_OF_TRUTH.md) owns behavior and [RET-011 validation](validation/RET-011.md) owns measured acceptance. Older ticket/evidence/commit snapshots retain their original dates and results.

## Completed locally

- All twelve packets have implemented local product or deployment-preparation outcomes; no additional local feature ticket is waiting. Source candidate `bd9af4b` and evidence commit `939ca7e` passed the settled gates: 386 tests in 39 files, 130 boundary source files and both production builds.
- The sample contains ten original PDFs/eighteen pages. Two independent actual-byte OpenAI passes and record/source audits passed; seventeen live Retro cases passed. Real localhost Turnstile, one-use admission, paid PDF processing, grounded Retro/source replies and deliberate restart recovery passed.
- `/demo` owns Choose → Documents → Process → Dashboard. Dashboard and Records date ranges are independent and reset to defaults on refresh. The Documents/Records review queues stay synchronized. The canonical logo, selected headline, full-height trend, contextual chat shortcuts, collapsed sources, remembered large-chat choice, fast typing and thin shared scrollbars are implemented.
- Live documents and Retro use `FAKE_MODE=false` with the single `PAID_DEMO_ENABLED=true` switch and private backend credentials. Committed defaults remain fake/paid-off. Workspace ZIP/generated-invoice export controls are removed; actual original PDF downloads remain.

## Owner-confirmed OpenAI setup

Document selection now exposes **How processing works** as an optional details dialog. A concise OpenAI disclosure accompanies the explicit Process action; per-document admission/challenge runs inline without repeated extraction-review modals. Routine Turnstile checks stay visually quiet; show the widget only when interaction is required and an alert on failure. Retro retains its per-turn review and all individual one-use grants remain required. Current document concurrency is one; a two-document pool needs coordinated admission/revision handling and measured account/resource capacity before implementation.

The owner confirms the configured OpenAI spending limit is **USD 5** and is already set. Record this as owner-confirmed setup, not a pending request to configure it. Its dashboard scope/period and enforcement have not been independently inspected; no prepaid balance or guaranteed global application cap is inferred. The USD 2.50 process-local admission/evaluation allowance remains a separate application control.

The owner selected **90-day API-key expiry**. Actual Responses generation/input-count access works; the final dashboard expiry timestamp and complete saved permissions have not been inspected. These are manual account-verification details, not missing application features. Secrets remain in ignored backend `.env.local`; no key/account value was copied into documentation.

## Owner-confirmed Google Cloud setup

The owner confirms the Retrosum Google Cloud project is already created, with budget controls and alerts at **USD 5 and USD 10**, following the same setup pattern as ClipBuilder and ScreenPilot. Deployment secrets are also already set up. Creation is complete on the owner's confirmation; it is not a request to recreate the project, budgets or secrets.

Exact project/secret identifiers and versions are not recorded publicly or inspected. Budget period/scope, alert recipients/delivery, enforcement and runtime secret bindings/IAM remain to be verified for deployment. Cloud budget alerts are separate from the **USD 5 OpenAI limit** and the USD 2.50 process-local allowance; no guaranteed hard cloud/app cap is inferred.

## Remaining acceptance

- **Deployment preparation and hosted acceptance:** rebuild/verify Linux images for the current ten-PDF/code snapshot, record immutable digests, record the existing project's private identifiers, resolve region/domain/runtime identities and bind existing secret versions, then verify budget alerts, IAM, hosted Turnstile/origins, log retention, capacity/overlap, paid-off and rollback. Earlier eight-PDF Linux evidence is historical. No image push or deployment is authorized or completed by this task.
- **Manual testing and owner acceptance:** aesthetics, physical touch/software keyboards, assistive technology/browser profiling, real human handwriting and broader upload accuracy. Current sample OCR success does not establish every upload's accuracy. Account permission/expiry/billing-enforcement and provider-handling verification remain manual checks.

No further feature implementation is identified by the documented queue. Future defects or owner feedback can reopen the relevant packet; deployment and manual acceptance remain separate from completed local checks.
