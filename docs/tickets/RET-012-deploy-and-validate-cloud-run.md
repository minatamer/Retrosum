# RET-012 — Deploy manually, validate live behavior and record rollback

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: [RET-011](RET-011-verify-product-and-audit-release.md)  
Blocks: Final packet  
Suggested commit: `RET-012: deploy manually, validate live behavior and record rollback`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Prepare and, when authorized, deploy the exact accepted release to the same tool family as ScreenPilot/ClipBuilder: public Next frontend and private Express backend on Google Cloud Run, Artifact Registry, Secret Manager/runtime IAM, Cloudflare DNS/Turnstile and manual release control. No server database or uploaded-document bucket is required.

Perform concrete packaging/setup planning before any approval checkpoint. This documentation ticket does not itself authorize new paid/cloud/public actions. At execution, use existing user authorization where provided; seek only actually missing external-action approval after the exact deployable result is ready.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- App Docker/build contexts and manual immutable image/revision deployment definitions.
- Operator setup/deploy/probe/rollback/emergency paid-off guides and release record.
- Cloud IAM/origin/audience/secret/challenge/capacity configuration and domain evidence.
- Bounded deployed live walkthrough, actual usage/cleanup/availability measurements.

## Implementation plan

1. Confirm the exact RET-011 candidate, completed local gates, current model availability/price evidence, sample rights and live exact-field gate. Do not deploy a visually working fake build labelled as the public AI sample.
2. Resolve actual cloud project/billing/region/service names/domain ownership and intended public availability. Inspect sibling guides for command structure only; never copy their identities, credentials, domains, permissions or prior approvals.
3. Build/test nonroot Linux images with exact lockfile, PDF inspection/worker/assets/font packaging and correct runtime port. Push immutable versioned images only under authorized cloud scope; record digests and deployed revisions.
4. Create least-privilege runtime identities: public frontend can invoke only the private backend; backend can access required OpenAI/grant secrets. Use audience-bound runtime ID tokens, exact origins, configured Turnstile and server-only private connection values. No service-account JSON in Git/browser.
5. Start conservatively with min 0/max 1 each, measured CPU/memory/concurrency/timeouts and one expensive backend operation lease. Budget alerts/quotas/emergency switches are operational controls with documented scope, not guaranteed USD 5 total app spending.
6. Deploy backend privately first, verify authenticated no-cost health/config/paid-off rejection, then frontend. Anonymous private API probes must fail. Confirm browser bundle/public config lack keys/private identities and forwarded streams remain bounded.
7. Configure owned domain/HTTPS/Cloudflare DNS only after ownership is verified. Set canonical origins/CSP/challenge policies to actual deployed values and test public landing/PDF viewer before paid availability.
8. Perform an explicitly bounded owner-authorized live sample walkthrough using actual eight PDFs and a small Retro interaction set. Verify numeric/source accuracy, live progress, charts, animated CRUD/Undo, refresh recovery/export/expiry and measured OpenAI units/cost. Stop on a material money/privacy/admission issue.
9. Record cold-start/deadline/container resource behavior, provider/key correspondence, content-free logs, local Blob cleanup limitations and actual paid-off behavior. A successful deployment command alone does not establish these facts.
10. Record rollback to previous immutable revision, compatibility handling for browser projection/schema/sample version and emergency closure of paid actions while preserving viewing/manual/export. Probe rollback/disabled states with no-cost requests where possible.
11. Update release/operations evidence and ticket status with deployed revision, region/date, actual walkthrough result, budget/capacity settings and limitations. Keep fake preview availability explicit if retained separately.

## Acceptance criteria

- [ ] Exact accepted images/revisions are deployed with documented ownership and configuration.
- [ ] Frontend is public, backend is private and service-to-service invocation is verified.
- [ ] Secrets/provider grants stay private; origin/challenge/replay/limits work in the deployed topology.
- [ ] All eight originals remain viewable and the public sample actually processes live.
- [ ] Deployed numeric/Retro/CRUD/refresh/export behavior has bounded actual evidence.
- [ ] Actual provider/cloud usage is monitored; operator paid-off and remaining quota limitations are clear.
- [ ] Rollback procedure identifies immutable targets and browser schema compatibility.
- [ ] Public claims and release record match what was actually measured.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Anonymous private API vs frontend identity | Rejection vs accepted no-cost probe |
| Public client assets/config | No provider secrets/private resource leakage |
| Paid-off before enable/after emergency switch | Zero dispatch and usable local features |
| Bounded live eight-PDF sample | Exact results/source evidence and actual usage |
| Refresh and stale grant | No automatic rebilling or restored secret capability |
| Deployed timeout/partial failure | Honest recovery and no hidden fake substitution |
| Rollback and old browser projection | Safe compatibility or explicit clean restart |

Record only verified cloud facts and actual owner-run paid evidence. If authorization/configuration/live gate is missing, leave deployment pending with the prepared concrete artifact and specific missing input; do not claim completion or create a new alternative infrastructure stack.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
