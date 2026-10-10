# Manual release and rollback

Prepared **8 October 2026**, RET-012. Local files and Linux verification are authorized. **No push, cloud mutation, public exposure, credentials, domain registration or paid evaluation is authorized by this runbook.** Obtain those approvals for the concrete candidate later. The exact local evidence is in [RET-012 validation](../validation/RET-012.md); [release readiness](../engineering/RELEASE-READINESS.md) retains live/physical/operator gates.

## Prepared artifacts and operating modes

- Root-context `apps/frontend/Dockerfile` and `apps/backend/Dockerfile`: Node 24.19.0 Debian slim, base digest `sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df`, pnpm 11.25.0, frozen dependency install, nonroot `node` runtime, no runtime download/install.
- `infra/cloud-run/*.service.template.yaml`: unresolved Retrosum-owned placeholders; frontend 1 CPU/512 MiB/concurrency 8/150 seconds, backend 1 CPU/1 GiB/concurrency 4/120 seconds, service and revision minimum zero/maximum one. These are starting settings, not measured hosted capacity or global spend caps.
- Docker backend defaults to explicitly labelled fake/paid-off. Cloud backend template overrides to **FAKE_MODE=false / PAID_DEMO_ENABLED=false**, reporting unavailable. Fake mode alone selects the operating mode, and the single paid switch covers both documents and Retro. This is a closed capability preview, not a live AI demo. A separately approved fake preview must remain visibly labelled.
- `pnpm probe:release`: bounded free HTTP/assets/config probes. It accepts only explicit HTTPS or loopback origins, follows no redirects, reports no response content/secrets, and refuses action probes unless config first proves provider work unavailable. It cannot test a live mode or perform document inference.

Cloud Run/Artifact Registry/Secret Manager/runtime IAM, manual immutable revisions and optional Cloudflare DNS/Turnstile match the siblings' tool family. ScreenPilot and ClipBuilder guides supplied structure only; their resource names, accounts, secrets, domains, approvals and measurements were not copied.

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

The package scripts use fixed ignored `artifacts/local/release/{backend,frontend}` paths and require an empty destination. Preserve or explicitly remove only the resolved owned output before a new candidate; never use a broad cleanup command. Frontend staging preserves contained relative Linux links, remaps Windows junctions within its fixed local output, excludes environment files and copies traced server dependencies, `.next/static`, public originals/thumbnails/photo, local fonts and the pinned PDF runtime. The verifier rejects escaping dependency links/private configuration and verifies eight originals/runtime/worker/shared package contents. Both Docker builds verify their final package before copying it into the nonroot runtime. Windows junctions are absolute and are not portable after moving the directory; rebuild deployment artifacts in Linux. Public-origin checks use the configured canonical origin across proxy TLS/port termination, ignore forwarded-host claims and retain Secure-cookie enforcement.

Check actual runtime, not just successful image build: bind temporary ports only on loopback; verify `process.getuid()` is nonzero, injected `PORT` and worker support, all sample pages/assets and nonce headers; exercise a declared fake sample; run a distinct unavailable/paid-off instance and verify all three rejected action routes. Inspect logs for content-free categories, cancellation and no unexpected provider start. Use owned names/labels and stop only those containers after evidence is captured. Do not stop other repositories or remove unrelated images/volumes.

The browser's server-only bridge allows loopback or authenticated HTTPS `run.app`, so a local two-container test can share one network namespace: backend port 8080, frontend `PORT=8081`, `BACKEND_ORIGIN=http://127.0.0.1:8080`, both with the exact test frontend origin. A Docker host/service name over plain HTTP is deliberately rejected. This does not test hosted identity/IAM.

## Operator inputs and approvals

Before external changes, resolve project ID/number, billing owner, region, registry repository, frontend/backend service names, separate runtime identities, canonical origin/domain, immutable image pair, intended preview/public availability and operator permissions. Keep resolved input files under ignored `artifacts/local/`; never commit account identities, service-account JSON, environment files or secrets. Capture approvals against the final pair and intended exposure.

Use approved APIs/permissions for Cloud Run, Artifact Registry and Secret Manager. The frontend runtime needs service-level backend `roles/run.invoker`; it needs no OpenAI secret. Backend runtime reads only its approved named provider/challenge/grant secrets. Operator/build permissions stay separate; no project Editor/Owner shortcut or broad runtime token delegation. Initial paid-off deployment needs no provider secrets. Later secret bindings use explicit enabled versions, e.g. `--update-secrets OPENAI_API_KEY=OWNER_SECRET:VERSION`, never secret values in CLI/YAML.

Application logs allow safe operation route/mode/status/duration. Verify platform request/build/audit logging separately: it can retain URL/IP/platform metadata the application does not emit. Establish approved seven-day retention and narrow access; do not claim application sanitization removes platform metadata. Account spending controls and alerts must be recorded by scope. Process-local allowance/restarts, max-one revisions, tags and in-flight overlap cannot guarantee a global dollar cap.

## Later authorized deployment sequence

1. Finish the numeric/spend, physical/owner and local candidate gates required for the intended mode. The current source permanently closes public live composition; flags/secrets alone cannot enable it. A later reviewed implementation and two independent actual-byte numeric evaluations are required before live release.
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

Traffic changes are not instantaneous; old in-flight requests can finish. A flag update/restart invalidates boot grants but does not recall dispatched work, previous downloads or provider-held copies. Do not route traffic back to a previously paid-enabled revision as an emergency fix. Restore the approved configuration/IAM/secret references with the pair, re-probe anonymous backend rejection and local viewing/manual/export, inspect actual usage, and leave paid capability closed until review. Record timestamp/operator/action/results without source content or secrets.

## Primary references

Implementation was checked against the installed Next 16.4 output/self-hosting guides, [pnpm deployment](https://pnpm.io/cli/deploy), [workspace settings](https://pnpm.io/settings), [Cloud Run YAML](https://docs.cloud.google.com/run/docs/reference/yaml/v1), [service identity](https://cloud.google.com/run/docs/securing/service-identity), [service authentication](https://cloud.google.com/run/docs/authenticating/service-to-service) and [traffic rollback](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration). Recheck version-sensitive hosted behavior before the actual release; local success does not prove IAM, challenge, platform logs or a deployed walkthrough.
