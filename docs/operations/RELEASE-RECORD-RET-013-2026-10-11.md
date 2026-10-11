# RET-013 security release — 11 October 2026

**Deployed; public live processing restored** at [Retrosum](https://retrosum-frontend-imspgi7bya-ew.a.run.app/demo). Both services serve the approved source `35bc824` at 100 percent traffic. This replaces the [RET-012 release](RELEASE-RECORD-2026-10-11.md), preserving its managed canonical origin, public frontend/private backend and runtime configuration. No Git remote push occurred.

The owner explicitly authorized this rollout and deployment-related repairs/redeployment on 11 October. No application repair was needed. The subsequent instruction to commit the unstaged work explicitly approves the eleven-path deployment/portfolio allocation; no additional paid test, push or deployment is included. Private exports, logs, clean source archive and probe helpers are ignored under `artifacts/local/ret-013/deployment/`.

## Exact source and immutable images

| Field                             | Verified release                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| Source for both images            | `35bc824`, including quality `743a9dc` and security `24e3e71`                        |
| Lockfile SHA-256                  | `7a61116518a86511c7842dbcf395ac1ef3181f3a16dcbcd0a6a810a1dec8af26`                   |
| Frontend registry index digest    | `sha256:6886b3044435f2663a78ad51d184022890e26c56d507a3852e9d45c34225b740`            |
| Backend registry index digest     | `sha256:81451d3cedbc5bb0965691a624ab9f54a563490e5d39c6d5048286ec85889123`            |
| Frontend selected platform digest | `sha256:4e13717d45dabacac27c1141ee72401e3714c2db8bae1d7f4d37b94012169751`            |
| Backend selected platform digest  | `sha256:9c32ae4c7b42901c4798a6fc76e09e26af2276dc88874cb7054adbe16e7a5676`            |
| Frontend revision                 | `retrosum-frontend-ret013-35bc824`, Ready, 100 percent                               |
| Live backend revision             | `retrosum-backend-ret013-35bc824-live`, Ready, 100 percent                           |
| Compatible paid-off backend       | `retrosum-backend-ret013-35bc824-off`, same image/secrets/origin, paid false         |
| Region / runtime                  | `europe-west1`; pinned Node 24.19.0, pnpm 11.25.0, Linux amd64, nonroot `node`       |
| Frontend limits                   | 1 CPU, 512 MiB, HTTP concurrency 8, timeout 210 seconds, min 0/max 1                 |
| Backend limits                    | 1 CPU, 1 GiB, HTTP concurrency 6, timeout 180 seconds, min 0/max 1                   |
| Application limits                | Four expensive operations; two native inspections and two bounded foreground waiters |
| Compatibility                     | Projection 1, sample `harbor-v1`, disclosure `retrosum-processing-v1` unchanged      |

Images were rebuilt from a clean `git archive` of the committed source, using the frozen lockfile and existing positive Docker context. Local environment files, private artifacts and portfolio files were excluded. Both builds verified their production packages. The exact rebuilt images passed isolated, network-disabled, read-only, nonroot fake probes before publication: health/configuration, two-page nonce CSP, all ten originals and pinned PDF worker, with zero paid requests. Registry metadata matched each locally verified index digest; deployed revision metadata matched the selected platform manifests. Earlier RET-013 image digests identify earlier local builds, not this clean-archive publication.

The unchanged application snapshot already passed all six root gates: formatting, lint, strict types, 135 boundary modules, 482 tests in 48 files and both builds. No application changes were made during this rollout; those gates were not needlessly repeated. Documentation formatting/whitespace is checked separately.

## Rollout and actual hosted verification

1. Capture the former active pair, service configuration and IAM without reading secret values. Use explicit Retrosum project/region flags; the operator CLI's default project belongs to another application and was not changed or used for this rollout.
2. Publish immutable images and create the new private paid-off backend and public frontend as no-traffic revisions. Verify readiness and preservation of runtime settings before promotion.
3. Route the new paid-off backend and new frontend to 100 percent. The existing bounded release probe passed: unavailable config, nonce CSP on `/` and `/demo`, ten originals, pinned worker, and extract/chat/insights HTTP 503 before provider dispatch. This also proves the frontend's authenticated private bridge.
4. Create the same-image live backend revision without traffic, then promote it and restore the previously approved public live availability. Free hosted probes at **19:16:33 UTC / 22:16:33 Cairo** passed: live documents/copilot/admission; both CSP pages; eleven browser scripts (1,019,294 bytes) with no matched private configuration; ten PDF SHA-256 matches; exact committed canonical logo; pinned worker; anonymous backend HTTP 403; malformed grants rejected with HTTP 403 for extract/chat/insights; wrong-origin chat HTTP 403. No actual document/chat/provider operation was submitted.
5. Connected browser checks passed landing → Choose → Documents, all ten visible selections, actual original PDF page rendering, closed-mode disabled Process with useful guidance, and refresh recovery to enabled Process after live restoration. Captured warning/error console logs were empty. Original screenshots are retained locally; no browser log suppression was added.
6. Final service/revision metadata verifies Ready/100 percent traffic, exact platform digests, unchanged runtime settings/scaling and identical IAM bindings. Frontend remains public; backend remains private. Four backend-only secret references remain pinned to version 1; frontend has no secret references. No IAM, secret, retention, DNS, budget, instance size or origin policy change occurred.

The final metadata/log check at **19:19:55 UTC / 22:19:55 Cairo** inspected 150 private Cloud Run log entries. Three platform ERROR entries correspond exactly to the intentional paid-off POST probes at 19:14:26 UTC, each returning HTTP 503; there were zero unexpected ERROR-or-higher entries in that captured scope. These entries remain retained, not deleted or suppressed. Existing content-free backend operational logging is unchanged; these frontend-denied free requests do not constitute new successful backend/provider operations.

Two operator-probe corrections did not require an app change: domain mapping inspection uses the installed CLI's beta track, and the SVG comparison must use clean-archive bytes rather than the Windows checkout's CRLF representation. The hosted logo matched the archive exactly. Paid probes were not retried because none were performed.

## Compatible rollback and remaining acceptance

For emergency paid closure, keep the new frontend and route only the backend to the verified `retrosum-backend-ret013-35bc824-off`, then run the bounded unavailable probes. This retains the quality/security changes while closing new paid dispatch. Traffic changes cannot recall in-flight requests, downloaded originals or provider-held copies. Boot-bound grants can expire across revisions; the existing flow requires fresh explicit admission and never automatically replays paid work.

The former RET-012 frontend `retrosum-frontend-ret012-e741197` and live backend `retrosum-backend-00004-4lc` are recorded historical rollback targets; restoring them also removes RET-013 safeguards. Prefer the same-image new paid-off pair for incident closure. No additional rollback exercise or deployment stress test is claimed.

This rollout used **zero new paid provider operations**. RET-013's separate local paid portfolio run processed ten synthetic PDFs and two live Retro operations, with 83 original screenshots and a professional thumbnail delivered to the owner's Desktop. That local evidence and RET-012's earlier hosted paid walkthrough remain distinct from this new release's free checks. No fresh hosted extraction accuracy, paid challenge completion, maximum-file load, cancellation/replay/expiry or actual provider invoice was measured here.

Existing domain metadata reports `retrosum.com` routing/certificate Ready. Canonical app origin remains the managed URL: apex Turnstile/origin/browser cutover is still separate, and no DNS/Cloudflare or custom-domain policy was modified. Account/billing enforcement, full native-library visibility, broader arbitrary-upload/physical-device acceptance and volumetric network protection retain their documented limits. A passing scoped release does not establish complete security or a durable global spend ceiling.

## Evidence and documentation allocation

Ignored source evidence: `source-35bc824.tar`, both build/push/registry records, isolated `image-probes.log`, before/after service/IAM metadata, each revision export, `hosted-unavailable-probes.json`, `hosted-live-probes.json`, `final-verification.json`, private `release-logs.json` and original browser screenshots. The owner-approved [deployment documentation commit plan](../commit-plans/RET-013-deployment.md) allocates only content-safe prose/HTML; the separate portfolio plan includes the requested public cover. Neither documentation commit changes the deployed application source.
