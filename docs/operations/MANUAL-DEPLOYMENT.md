# Manual release and rollback

Current handoff **10 October 2026**: local paid corpus/Retro/production Turnstile checks passed and the configured USD 5 OpenAI spending limit is owner-confirmed. Document processing now uses two bounded slots; an actual local paid D01/D02 pair passed with overlapping requests. Linux image refresh is deployment preparation. [Current status](../CURRENT-STATUS.md) separates completed local evidence from manual/hosted acceptance. Local templates now allow backend 180 s/frontend 210 s above the existing 170 s backend/175 s bridge envelope; verify those exact settings on the deployed candidate.

Prepared **8 October 2026**, RET-012. Local files and Linux verification are authorized. **No push, cloud mutation, public exposure, credentials, domain registration or paid evaluation is authorized by this runbook.** Obtain those approvals for the concrete candidate later. The exact local evidence is in [RET-012 validation](../validation/RET-012.md); [release readiness](../engineering/RELEASE-READINESS.md) retains live/physical/operator gates.

## Prepared artifacts and operating modes

- Root-context `apps/frontend/Dockerfile` and `apps/backend/Dockerfile`: Node 24.19.0 Debian slim, base digest `sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df`, pnpm 11.25.0, frozen dependency install, nonroot `node` runtime, no runtime download/install.
- `infra/cloud-run/*.service.template.yaml`: unresolved Retrosum-owned placeholders; frontend 1 CPU/512 MiB/HTTP concurrency 8/210 seconds, backend 1 CPU/1 GiB/HTTP concurrency 4/180 seconds, service and revision minimum zero/maximum one. The backend admits at most two expensive operations across extraction/chat/insights, independently of HTTP concurrency. These are starting settings, not measured hosted capacity or global spend caps.
- Docker backend defaults to explicitly labelled fake/paid-off. Cloud backend template overrides to **FAKE_MODE=false / PAID_DEMO_ENABLED=false**, reporting unavailable. Fake mode alone selects the operating mode, and the single paid switch covers both documents and Retro. This is a closed capability preview, not a live AI demo. A separately approved fake preview must remain visibly labelled.
- `pnpm probe:release`: bounded free HTTP/assets/config probes. It accepts only explicit HTTPS or loopback origins, follows no redirects, reports no response content/secrets, and refuses action probes unless config first proves provider work unavailable. It cannot test a live mode or perform document inference.

Cloud Run/Artifact Registry/Secret Manager/runtime IAM, manual immutable revisions and optional Cloudflare DNS/Turnstile match the siblings' tool family. ScreenPilot and ClipBuilder guides supplied structure only; their resource names, accounts, secrets, domains, approvals and measurements were not copied.

### Two-document deployment acceptance

No additional secret, environment switch, database, queue or instance is required. Existing HTTP concurrency 4/8 accommodates two requests plus admission/control traffic; keep minimum zero/maximum one and current starting CPU/memory until measurements justify a change. Before hosted paid enablement, rebuild both images from this candidate and test two admitted documents together: both finish and merge exactly once in selection order, progress counts completed validation, a third expensive request rejects before provider dispatch, and cancel/reset/replay/unknown-outcome behavior remains bounded. Check a payment register finishing before its earlier invoice and a second-copy PDF finishing before its original. A worker retains at most one decoded response while awaiting an earlier commit. Turnstile admission stays serialized and quiet; each document still receives an independent one-use grant. The browser paces five grant attempts per minute, leaving one for initial session creation under the unchanged aggregate six/minute server limit; other visitors/tabs can still exhaust that aggregate limit.

Measure peak container memory during two simultaneous maximum-size PDFs, including two inspection workers, multipart buffers, inline Base64/request bodies and frontend forwarding; the small local pair's Windows working-set snapshot is not hosted capacity evidence. Verify model/project RPM/TPM and actual pair timings/usage without raising the existing twenty/hour starts or USD 2.50 run reservation. Record cold/warm, third-request rejection and cleanup in the release record. These requirements follow the platform's distinct [HTTP concurrency](https://docs.cloud.google.com/run/docs/about-concurrency), [memory sizing](https://docs.cloud.google.com/run/docs/configuring/services/memory-limits) and [request timeout](https://docs.cloud.google.com/run/docs/configuring/request-timeout) controls; no cloud setting was changed locally.

## Local candidate and image verification

Use an audited clean checkout, Node/pnpm above, and the exact committed lockfile. pnpm 11 uses injected workspace dependencies synchronized after `build`, then creates an isolated production deployment with a dedicated frozen lockfile. Dependency versions did not change when this setting was introduced. Legacy deployment is intentionally unused: it attempted a second dependency resolution during the initial package trial.

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm release:backend
pnpm release:frontend
docker build --platform linux/amd64 --file apps/backend/Dockerfile --tag retrosum-backend:ret-012-local .
docker build --platform linux/amd64 --file apps/frontend/Dockerfile --tag retrosum-frontend:ret-012-local .
docker image inspect retrosum-backend:ret-012-local --format '{{.Id}} {{.Config.User}} {{.Architecture}}'
docker image inspect retrosum-frontend:ret-012-local --format '{{.Id}} {{.Config.User}} {{.Architecture}}'
```

The package scripts use fixed ignored `artifacts/local/release/{backend,frontend}` paths and require an empty destination. Preserve or explicitly remove only the resolved owned output before a new candidate; never use a broad cleanup command. Frontend staging preserves contained relative Linux links, remaps Windows junctions within its fixed local output, excludes environment files and copies traced server dependencies, `.next/static`, public originals/thumbnails/photo, local fonts and the pinned PDF runtime. The verifier rejects escaping dependency links/private configuration and verifies all ten originals/runtime/worker/shared package contents. Rebuild/reverify the current eighteen-page source snapshot; the eight-PDF Linux evidence is historical deployment preparation. Both Docker builds verify their final package before copying it into the nonroot runtime. Windows junctions are absolute and are not portable after moving the directory; rebuild deployment artifacts in Linux. Public-origin checks use the configured canonical origin across proxy TLS/port termination, ignore forwarded-host claims and retain Secure-cookie enforcement.

Check actual runtime, not just successful image build: bind temporary ports only on loopback; verify `process.getuid()` is nonzero, injected `PORT` and worker support, all sample pages/assets and nonce headers; exercise a declared fake sample; run a distinct unavailable/paid-off instance and verify all three rejected action routes. Inspect logs for content-free categories, cancellation and no unexpected provider start. Use owned names/labels and stop only those containers after evidence is captured. Do not stop other repositories or remove unrelated images/volumes.

The browser's server-only bridge allows loopback or authenticated HTTPS `run.app`, so a local two-container test can share one network namespace: backend port 8080, frontend `PORT=8081`, `BACKEND_ORIGIN=http://127.0.0.1:8080`, both with the exact test frontend origin. A Docker host/service name over plain HTTP is deliberately rejected. This does not test hosted identity/IAM.

## Operator inputs and approvals

**Owner setup checkpoint, 10 October 2026:** The Retrosum Google Cloud project, budget controls/alerts at **USD 5 and USD 10**, and deployment secrets are already set up. This follows the owner's stated ClipBuilder/ScreenPilot pattern. Treat creation as owner-confirmed completion, reuse those Retrosum resources and do not recreate them. Exact project/secret identifiers, enabled versions, budget period/scope/recipients/delivery/enforcement and runtime access/bindings have not been independently inspected. This checkpoint does not authorize deployment or a cloud change.

Before external changes, record/verify the existing project's private ID/number, billing owner and configured budget alerts; resolve region, registry repository, frontend/backend service names, separate runtime identities, canonical origin/domain, immutable image pair, intended preview/public availability and operator permissions. Inventory existing secret names/versions privately and verify their required runtime bindings rather than assuming that creation grants access. Keep resolved input files under ignored `artifacts/local/`; never commit account identities, service-account JSON, environment files or secrets. Capture deployment approvals against the final pair and intended exposure.

Use approved APIs/permissions for Cloud Run, Artifact Registry and Secret Manager. The frontend runtime needs service-level backend `roles/run.invoker`; it needs no OpenAI secret. Backend runtime reads only its approved named provider/challenge/grant secrets. Operator/build permissions stay separate; no project Editor/Owner shortcut or broad runtime token delegation. Initial paid-off deployment needs no provider secrets. Later secret bindings use explicit enabled versions, e.g. `--update-secrets OPENAI_API_KEY=OWNER_SECRET:VERSION`, never secret values in CLI/YAML.

Application logs allow safe operation route/mode/status/duration. Verify platform request/build/audit logging separately: it can retain URL/IP/platform metadata the application does not emit. Establish approved seven-day retention and narrow access; do not claim application sanitization removes platform metadata. The configured USD 5 OpenAI spending limit and Google Cloud budget controls/alerts at USD 5/USD 10 are owner-confirmed setup. Record their separate actual scope/period/enforcement and the cloud recipients/notification-delivery evidence during manual account verification. Budget alerts, process-local allowance/restarts, max-one revisions, tags and in-flight overlap cannot guarantee a global dollar cap.

## Later authorized deployment sequence

1. Finish the numeric/spend, physical/owner and local candidate gates required for the intended mode. RET-011 now contains two accepted local live corpus passes, grounded Retro tests, normal paid startup and successful actual localhost Turnstile/browser checks for documents and chat. These do not establish the hosted domain/IAM/account/physical gates. Keep deployment paid-off until the intended hosted acceptance is explicitly complete.
2. After approval, build from the accepted commit and push versioned images to the owner's Artifact Registry. Read actual registry digests and record both; a mutable local tag or Docker image ID is not a registry digest. Never use `latest` as the release record.
3. Fill every `${TOKEN}` in the YAML templates into ignored local files. `${BACKEND_IMAGE}` / `${FRONTEND_IMAGE}` must be `REGION-docker.pkg.dev/PROJECT/REPOSITORY/IMAGE@sha256:DIGEST`. Check no placeholder remains. Keep backend invoker IAM enforcement enabled; templates do not grant public access.
4. Deploy backend **private**, paid-off, first. Check that no `allUsers`/`allAuthenticatedUsers` invoker binding exists, including inherited authority. Then grant only the approved frontend runtime identity backend invocation. HTTP ingress `all` allows the frontend's managed HTTPS request while IAM enforces privacy; it is not anonymous invocation.
5. Deploy frontend initially private, using backend's actual managed origin as both `BACKEND_ORIGIN` and audience. Resolve the frontend managed URL/canonical origin, update the exact `FRONTEND_ORIGIN` on both services before exposing it, then apply explicitly approved public frontend invocation. For bootstrap only, a closed backend may use `https://retrosum.invalid` until the real frontend URL is available; this temporary value must not remain in the final record.
6. Confirm free frontend config/landing/originals, runtime identity bridge, anonymous backend denial, wrong audience/origin, bounded forwarding, unavailable paid routes and content-free logs. Do not auto-enable provider flags or trigger a paid walkthrough.
7. Configure owner-verified domain/HTTPS/redirects and Cloudflare DNS only when separately authorized. Verify managed-URL exposure too; a custom-domain challenge does not protect every public entry. Register actual Turnstile hostnames and prove human challenge/consent/expiry/replay binding before later live enablement.
8. Record cold/warm timings, memory/worker/deadlines, provider correspondence, limits/overlap and live usage only when actually observed. Stop a paid evaluation on any money/privacy/admission defect. Fill the [release record](RELEASE-RECORD.template.md), retaining unchecked gates.

Examples below are **future operator commands**, not commands already run. All variables are owner-resolved values; do not invent them or copy sibling values.

```powershell
gcloud run services replace artifacts/local/backend.service.yaml --project $retrosumProject --region $retrosumRegion
gcloud run services add-iam-policy-binding $retrosumBackendService --project $retrosumProject --region $retrosumRegion --member "serviceAccount:$retrosumFrontendAccount" --role roles/run.invoker
gcloud run services replace artifacts/local/frontend.service.yaml --project $retrosumProject --region $retrosumRegion
# Only after explicit public exposure approval:
gcloud run services add-iam-policy-binding $retrosumFrontendService --project $retrosumProject --region $retrosumRegion --member allUsers --role roles/run.invoker
pnpm probe:release frontend $retrosumFrontendOrigin unavailable
```

Anonymous backend config must return an IAM denial (401/403), not application JSON. Frontend config returning `unavailable` through its bridge supplies an authenticated no-cost check. For a separately approved direct authenticated backend probe, obtain an audience-bound ID token through the authorized identity flow, set `RETROSUM_PROBE_TOKEN` only in the probe process environment, run `pnpm probe:release backend BACKEND_ORIGIN unavailable FRONTEND_ORIGIN`, then remove the variable. Never print/store the token or introduce a downloaded account key. `v1/health` returns 200 for a listening process; `v1/ready` intentionally returns 503 while live capability is closed. Use health, not capability readiness, as the paid-off container startup probe.

## Rollback, compatibility and emergency paid-off

Retain the previous accepted **pair**: frontend/backend digest, revision, configuration, IAM, secret-version references, sample/contract/projection schema. Browser projection version is currently 1, samples `harbor-v1`, processing disclosure 1. Rollback only to a proven compatible pair. An incompatible projection must be rejected and require a clear restart; never migrate monetary data silently or replay a provider request on refresh.

```powershell
# Owner-authorized emergency closure creates a new backend revision:
gcloud run services update $retrosumBackendService --project $retrosumProject --region $retrosumRegion --update-env-vars PAID_DEMO_ENABLED=false
# Route only to already-recorded compatible paid-off revisions:
gcloud run services update-traffic $retrosumBackendService --project $retrosumProject --region $retrosumRegion --to-revisions "$retrosumGoodBackendRevision=100"
gcloud run services update-traffic $retrosumFrontendService --project $retrosumProject --region $retrosumRegion --to-revisions "$retrosumGoodFrontendRevision=100"
pnpm probe:release frontend $retrosumFrontendOrigin unavailable
```

Traffic changes are not instantaneous; old in-flight requests can finish. A flag update/restart invalidates boot grants but does not recall dispatched work, previous downloads or provider-held copies. Do not route traffic back to a previously paid-enabled revision as an emergency fix. Restore the approved configuration/IAM/secret references with the pair, re-probe anonymous backend rejection and local viewing/manual/original downloads, inspect actual usage, and leave paid capability closed until review. Record timestamp/operator/action/results without source content or secrets.

## Primary references

Implementation was checked against the installed Next 16.4 output/self-hosting guides, [pnpm deployment](https://pnpm.io/cli/deploy), [workspace settings](https://pnpm.io/settings), [Cloud Run YAML](https://docs.cloud.google.com/run/docs/reference/yaml/v1), [service identity](https://cloud.google.com/run/docs/securing/service-identity), [service authentication](https://cloud.google.com/run/docs/authenticating/service-to-service) and [traffic rollback](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration). Recheck version-sensitive hosted behavior before the actual release; local success does not prove IAM, challenge, platform logs or a deployed walkthrough.
