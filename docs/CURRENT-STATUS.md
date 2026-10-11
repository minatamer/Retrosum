# Retrosum current status

Updated **11 October 2026**. Older snapshots retain their original dates. The [blueprint](RETROSUM_DEMO_SOURCE_OF_TRUTH.md) owns behavior, [RET-011](validation/RET-011.md) records local acceptance and [the release record](operations/RELEASE-RECORD-2026-10-11.md) records deployment.

## Deployed on Google Cloud

**The app is deployed and public live processing is enabled** at [Retrosum](https://retrosum-frontend-imspgi7bya-ew.a.run.app/demo). Owner local manual testing and release acceptance are complete. Later explicit approvals cover Google Cloud fixes/rollout, specific source/evidence commits, frontend-only public invocation, backend-only secret access, seven-day default log retention and a bounded hosted test followed by public live availability. **No Git remote push occurred.** Future staging/commits still require specific permission.

Frontend source `e741197` includes the canonical `/demo` nonce CSP fix (`8099b80`) and configuration cold-start correction. Backend source/image remains `ef915a0`, which preserves frozen production packaging while allowing missing build-time registry metadata. Both published Linux amd64 images run as UID 1000 on Node 24.19.0; packages/fonts/workers/canonical logo and all ten originals/eighteen pages are verified. Final source gates passed **451 tests/42 files**, **132 boundaries**, formatting/lint/types and both builds. Exact immutable digests/revisions and rollback targets are in the release record.

## Actual hosted results

Public frontend invokes the private backend through its dedicated identity. Anonymous backend and wrong-origin requests return 403. Provider/grant secrets stay backend-only with existing version 1 runtime references. Public HTML/ten browser scripts passed a private-configuration scan. Both pages have nonce CSP integrated with HTML; originals render and download.

One actual batch processed all ten PDFs with **ten extraction HTTP 200 responses and zero failed extraction requests**. Dashboard was observed by **92.215 seconds**, an observation upper bound. Income **USD 4,800**, costs **USD 1,190**, profit **USD 3,610**, margin **75.2%** and customer open **USD 1,800** matched expectations. The payment register additionally stayed held for unmatched references; after checking both original pages/all 24 numeric occurrences and explicitly accepting through normal review, cash in/out were **USD 3,000 / USD 920**, operating net **USD 2,080**, excluding the owned transfer. Automatic relationship accuracy is not claimed; no amount or prompt was silently corrected.

Four Retro submissions stayed within approval: friendly local greeting, successful live grounded summary/contextual suggestions, income-target request cancelled after an uncompleted manual Cloudflare check, and successful local first-position proposal. The browser tool could not click the protected CAPTCHA despite action-time approval; composer recovered without retry/dispatch. Logs show **one live chat HTTP 200**. Manual USD 5,000 target creation showed **96.0%**; placement confirmation/layout Undo, synthetic contact creation/Undo and source review worked.

Refresh preserved records/accepted source/target without reprocessing. Emergency paid-off rollback and free probes passed; existing records and original download remained usable. Downloaded D01 matched committed bytes. Approved public live mode was restored and verified. The release record retains the additional payment hold and uncompleted CAPTCHA as actual results.

## Completed local acceptance

RET-011's ten-PDF/eighteen-page corpus passed two independent actual-byte numeric/source audits and seventeen live Retro cases. Real localhost Turnstile, one-use admission, paid processing, grounded replies and restart recovery passed. Owner manual acceptance includes the final friendly conversation, product-scope guards and placement. The repeated dashboard processing dialog is removed; Send uses inline verification. Historical local ten-PDF timing **121.895 seconds** remains separate from cloud observations.

`/demo` owns Choose → Documents → Process → Dashboard. Money/charts/manual records/source review/customization/Undo share one exact money authority. Canonical branding and intended animations remain. Committed defaults stay fake/paid-off; the approved hosted backend is live. No database, uploaded-file bucket, persistent chat store, queue or provider Files library was added.

## Account and cost controls

Existing billed project, registry, dedicated identities, secret metadata and runtime IAM/origin settings were inspected. Monthly **USD 5 Cloud Run** alerts exclude credits; **USD 10 project** alerts include credits, each at 50/80/100 percent actual spend. Delivery/enforcement/billing totals are untested. Default operational retention is seven days after explicit approval; required audit retention was unchanged.

Owner-confirmed **USD 5 OpenAI limit** and selected 90-day key expiry are separate account controls whose saved scope/permissions/expiry/enforcement were not inspected. The application's **USD 2.50 process-local reservation** is not an invoice or durable global cap. Actual provider units/invoice USD were not collected in this browser test; content-free request counts are recorded.

## Remaining work

1. **retrosum.com:** Google ownership, the frontend domain mapping and Cloudflare DNS entry are complete on 11 October. The owner's screenshot shows all four A/four AAAA records with DNS only and TTL Auto; Google and Cloudflare public resolvers return all eight exact addresses. See the [runbook](operations/MANUAL-DEPLOYMENT.md). Google TLS is still pending and the HTTPS handshake has not completed; add the apex to Turnstile and verify before canonical-origin/redirect cutover. Managed URL remains usable meanwhile.
2. Hosted four-maximum-file peak memory/fifth-operation rejection, cancellation/reset/expiry/replay and provider/account quota checks. Four-worker limits and min 0/max 1 settings are implemented; the small sample does not prove maximum capacity.
3. Actual provider units/invoice/cloud billing, alert delivery, saved account permissions/expiry and broader arbitrary-upload/physical/assistive coverage. These remain distinct from completed owner local acceptance and bounded hosted checks.

RET-012 is **deployed with follow-up verification pending**, not an entirely completed matrix. Further paid tests/new source commits require specific permission. See [readiness](engineering/RELEASE-READINESS.md) and [operations](operations/MANUAL-DEPLOYMENT.md).
