# Retrosum managed-URL release — 11 October 2026

**Deployed; public live mode enabled** at [Retrosum](https://retrosum-frontend-imspgi7bya-ew.a.run.app/demo). Owner local manual acceptance is complete. Later explicit approvals cover Google Cloud fixes/rollout, allocated source/evidence commits, frontend-only public invocation, backend-only secret access, seven-day default log retention and one bounded ten-PDF/up-to-four-Retro test followed by public live availability. No Git remote push occurred.

This content-safe record excludes private account/project numbers, runtime account addresses, resolved exports, secret values, tokens and document/chat payloads. Private artifacts/logs remain ignored under `artifacts/local/ret-012-cloud-ef915a0/`.

## Immutable candidate and runtime

| Field                          | Actual evidence                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Frontend source                | `e7411977be1144b7830422b4f2020600250289a1`; includes CSP correction `8099b80644ee105f396c02d9df5451c901e2f2fa` |
| Backend source                 | `ef915a01544110211685803a32f7f537da19aaf4`; unchanged by frontend corrections                                  |
| Lockfile SHA-256               | `cf57cd003d32619d8dcbddd4ecda919aa407fcf97f9b2e110d4d774a52b5d2bb`                                             |
| Frontend registry index digest | `sha256:47783e120009862a99c9092542b8fec38afb6d8abcc326c81a4758f122c7b9ee`                                      |
| Backend registry index digest  | `sha256:bdb745ab46877496e962c32789c1f6aac0b6984907e866d831809256f3ad22ae`                                      |
| Frontend revision              | `retrosum-frontend-ret012-e741197`, 100 percent traffic                                                        |
| Live backend revision          | `retrosum-backend-00004-4lc`, 100 percent traffic                                                              |
| Compatible paid-off backend    | `retrosum-backend-00003-crk`, same image/origin/secrets, paid false                                            |
| Base image                     | `node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df`           |
| Tools/runtime                  | pnpm 11.25.0, Node 24.19.0, Linux amd64, UID 1000                                                              |
| Region                         | `europe-west1`                                                                                                 |
| Frontend resources             | 1 CPU, 512 MiB, HTTP concurrency 8, timeout 210 seconds, min 0/max 1                                           |
| Backend resources              | 1 CPU, 1 GiB, HTTP concurrency 6, timeout 180 seconds, min 0/max 1; four expensive operation leases            |
| Mode                           | fake false / paid true; live documents/copilot/admission verified through public config                        |
| Versions                       | Browser projection 1; sample `harbor-v1`; disclosure `retrosum-processing-v1`                                  |

Registry index digests identify published images; Cloud Run may report the selected platform-manifest digest. Neither is a local configuration ID. Clean Git archives excluded environment files. Both production packages passed verification; final frontend inventory is 1,561 files / 46,665,575 bytes / SHA-256 `7a39f8f799c5292aad32f68bd731172db37bc3db46a1db207b0db9e53cc96f61`. Its offline runtime verifies UID/Node, ten original hashes and canonical logo. Backend package/eighteen-page worker evidence is in [RET-012 validation](../validation/RET-012.md).

## Cloud access, secrets and privacy

Frontend service IAM grants `allUsers` invocation. Backend service IAM grants only its dedicated frontend runtime identity; anonymous managed and numbered backend URLs return 403. Audience is the exact managed backend origin; both apps use the public frontend origin. Wrong-origin frontend chat returns 403. No account key was downloaded or browser Authorization reused.

Four existing enabled secrets were inventoried without reading values: `OPENAI_API_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`, `GRANT_SIGNING_SECRET`. Backend Secret Accessor bindings are **secret-level** and Cloud Run references **version 1** explicitly; this is not a per-version IAM policy. Frontend has no provider secret bindings. The public site key is intentionally projected. The owner added the managed hostname to Turnstile.

Both public pages return nonce CSP matching rendered HTML, without production `unsafe-eval`; original PDFs render under it. Public HTML and ten client scripts (1,010,871 bytes) passed the private-configuration scan. Application diagnostics project only route/mode/status/duration. Platform logs can separately contain URL/IP metadata. Default operational retention is seven days after specific approval; required audit retention and unrelated resources were unchanged.

No database, document bucket, persistent chat store, queue or provider Files library was introduced. Browser data remains bounded per tab for two hours. Provider requests remain foreground with `store:false`; cleanup cannot recall previous downloads or provider-held copies. Hosted two-hour expiry/reset/max-file cleanup was not newly measured.

## Actual hosted walkthrough

1. Paid-off probes passed against earlier rollback and secret-bound paid-off backends: capabilities, two CSP pages, ten originals, pinned worker and extract/chat/insights rejection before dispatch. Browser originals remain accessible.
2. One approved batch processed all **ten PDFs/eighteen pages** with production Turnstile/per-PDF admission: **ten live extraction HTTP 200 responses**, no failed extraction requests. Dashboard was observed by **92.215 seconds** after Process, including observation delay; this is an upper bound, not exact completion timing. Individual request durations were about 13.4–41.4 seconds. No automatic retry ran.
3. Initial income/costs/profit/margin/customer-open were **USD 4,800 / USD 1,190 / USD 3,610 / 75.2% / USD 1,800**. Scan, synthetic handwriting and duplicate stayed held. Payment register additionally had three unmatched-reference notes and cash stayed unavailable. Both original pages/all **24 numeric occurrences** were checked; normal explicit source acceptance then produced **USD 3,000 cash in / USD 920 out / USD 2,080 net**, excluding the owned USD 200 transfer. Payments remained unmatched; automatic relationship accuracy is not claimed. No amounts/prompt/model were changed.
4. Four Retro submissions: friendly local greeting/four options; successful live grounded period summary/contextual suggestions; income-target request stopped at manual Cloudflare verification; successful local first-position proposal. Browser tool could not click the protected CAPTCHA despite action-time permission; verification expired and composer recovered without retry/dispatch for that turn. Logs show **one live chat HTTP 200**, 2,838 ms. Manual CAPTCHA completion remains unverified.
5. Manual USD 5,000 target showed **96.0%**. Retro required confirmation for first position; applying and layout Undo worked. Source review and synthetic contact creation/Undo worked. Refresh preserved records/accepted source/target with no extra extraction. D01 rendered/downloaded during paid-off closure; downloaded SHA-256 `3a3fd106210471aa43cb0a7b7f7a8d4fe1ce0c1dcb0f87bc7073904677873f00` matches committed bytes. Screenshot/private exports remain ignored.

These results are distinct from RET-011's two local numeric passes/seventeen live cases and owner manual acceptance. Additional payment hold and uncompleted CAPTCHA are actual results, not complete automatic acceptance.

## Corrections and rollback

Actual `/demo` lacked CSP before `8099b80` added its canonical matcher, meaningful nonce tests and both-page HTML probes. First backend config took **5.022102320 seconds**, exceeding the old frontend three-second envelope; fallback returned after **3.167078231 seconds**. `e741197` permits ten seconds for one bounded config GET, retains three seconds for metadata identity and has a real delayed-response test that fails old code/passes the fix. Final root gates passed **451 tests/42 files**, **132 boundaries**, formatting/lint/types and both builds. Warm backend config took about 0.002–0.004 seconds; maximum cold starts are unproven.

First cold-start rollout was requested before upload finished: `retrosum-frontend-00004-ctw` failed image-not-found while the existing frontend stayed served. After publication, the fresh named final revision became Ready. Failed/superseded revisions are not release/rollback targets.

Backend `00003-crk` → `00002-zbl` rollback was probed and restored. After live testing, **`00004-4lc` → `00003-crk`** closed paid actions; all unavailable probes passed with zero paid requests while existing records/original download stayed usable. **`00004-4lc` was restored** and public config verified live documents/copilot/admission. Compatible closure pair: final frontend `ret012-e741197` plus paid-off backend `00003-crk`; projection/sample/disclosure match. Older frontends without `/demo` CSP must not be restored publicly. Traffic changes do not recall in-flight work or old downloads; inspect usage/compatibility before restoration.

## Cost controls and remaining checks

Existing monthly USD 5 Cloud Run alerts exclude credits; USD 10 project alerts include credits, each at 50/80/100 percent actual spend. Billing totals/delivery/enforcement are untested. Owner-confirmed USD 5 OpenAI limit/90-day key expiry require saved-dashboard verification. Reservations are process-local, not a durable global quota. Ten extracts plus the maximum four investigation turns reserve **USD 1.74** under committed policy, within approved **USD 2.50**; this is conservative policy arithmetic, **not measured invoice USD**. Provider token/image/reasoning units and invoice cost were not collected. No additional paid test is authorized here.

Remaining: four maximum-file peak memory/fifth-operation rejection, hosted cancellation/reset/expiry/replay; provider RPM/TPM/account permissions/expiry/billing and alert delivery; broader arbitrary-upload/physical/assistive coverage; manual challenge completion. Full RET-012 acceptance remains partially open while the app is deployed.

**retrosum.com** was purchased at Cloudflare. Google verification is absent; no domain mapping, A/AAAA records, custom certificate or canonical-origin cutover occurred. Follow [Google ownership/mapping](https://docs.cloud.google.com/run/docs/mapping-custom-domains) and [Cloudflare records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/), using actual returned records after verification. The region supports preview mapping; its limitations remain an operator choice for this demo. Keep the managed URL until apex TLS/Turnstile/origin/redirect checks pass.
