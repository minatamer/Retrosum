# RET-001 — Initialize the workspace, contracts and safe runtime

Status: **Planned — not implemented**  
Last synchronized: **8 October 2026**  
Depends on: None  
Blocks: RET-002, RET-004  
Suggested commit: `RET-001: initialize the workspace, contracts and safe runtime`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Create a runnable strict pnpm monorepo whose real application boundaries, public contracts and fake/live configuration can be verified from a fresh checkout. This is a foundation with executable quality gates, not empty folders or a landing mock in a separate tool.

Retrosum shares the siblings' Next.js App Router/React frontend, Express API, browser-safe Zod contracts, TypeScript and two-service Docker/Cloud Run shape. Add a browser-safe `packages/money` for deterministic amounts, calculations and commands. No server database, upload bucket, video renderer, microphone stack or Gemini SDK belongs here. OpenAI's implementation comes in RET-005.

Keep money/source/payment/review contracts explicit from the beginning. The 136-field research catalogue is optional extraction coverage, not 136 required form controls. Core first-release documents are English/USD PDFs; valid money is exact integer minor units with currency and a clearly defined tax/document basis.

## Dependency evidence and ownership

Read the latest owner decisions and the dependency packets' actual completion records before implementing. A dependency's planned checkbox or ticket-named commit is not evidence. Reuse the owning schema/state/command surfaces; do not silently repair an incomplete dependency or duplicate its authority. Local follow-on work can use verified fake/injected contracts while separately recorded live/cloud release gates remain pending.

Areas owned by this packet:

- `package.json`, `pnpm-workspace.yaml`, lockfile, shared TypeScript/ESLint/Prettier configuration and `.gitignore`.
- `apps/frontend` composition, minimal real routes and server-only private API bridge interface.
- `apps/backend` app factory/server entry, configuration parser, health/readiness/config routes and injected provider ports.
- `packages/contracts`, `packages/money` initial public surfaces and executable dependency rules.
- Root/application READMEs, local command contract, initial `AGENTS.md` guidance and no-key CI workflow.

## Implementation plan

1. Inspect current supported versions in official runtime/framework documentation, select one compatible exact dependency set, pin pnpm and Node support, and install through one lockfile. Record why major dependencies are needed.
2. Create real Next/Express entry points. Imports must not load `.env`, start listeners, create paid clients or contact providers. Backend startup loads only its ignored app-local configuration; process environment takes precedence. Tests skip file loading.
3. Define strict browser-safe schemas for PDF source metadata/locators, currency/minor units, business identity, sale/cost/payment/contact records, review issue, workspace revision, command/proposal/Undo receipt and bounded runtime capability response. IDs have typed ownership rather than stringly typed routing.
4. Define pure money interfaces and implement core amount parsing/formatting with exact-decimal rejection cases. Subsequent tickets own full financial command behavior; do not build a second calculation engine in API handlers.
5. Enforce dependency direction: browser features → public contracts/money; HTTP adapters → use cases → domain/ports; OpenAI SDK stays private. Contract packages may not import Node APIs, environment readers, provider SDKs or application modules.
6. Parse mode once. Committed examples are explicitly fake/paid-off with blank secrets. Hosted live mode is an explicit configuration; missing key/readiness closes the route and never silently fakes success. A single capability endpoint supplies mode/limits to the browser.
7. Implement fake composition with injectable clock/IDs/abort and a network-deny test guard. Test inherited shell keys/live flags cannot activate paid work. Health/config/bootstrap cost zero model requests.
8. Provide meaningful root commands for format check, lint, typecheck, tests, boundary check and production build. CI runs no-key deterministic gates, not deployment. Document frontend/backend ports and readiness independently.
9. Add lightweight multi-stage nonroot Docker definitions/build contexts that can later package the exact apps. Do not create cloud resources now. Update the canonical repository tree if implementation reveals a simpler justified placement.

## Acceptance criteria

- [ ] Fresh checkout installs reproducibly and the two minimal apps run with the documented commands.
- [ ] Contracts and money public surfaces build in browser and backend contexts.
- [ ] Illegal imports fail an executable boundary check.
- [ ] Invalid currency, unsafe numeric magnitude, fractional cent and malformed revisions fail at the external boundary.
- [ ] Fake mode remains explicit and provider dispatch count is zero, even with inherited credentials.
- [ ] Config response exposes capabilities/limits and mode but no key, private origin or internal cloud identity.
- [ ] Health and readiness have distinct semantics and no hidden paid probe.
- [ ] Root quality commands and no-key CI actually execute; no placeholder success scripts.

## Verification and evidence

| Case | Evidence |
| --- | --- |
| Empty environment/fake startup | Real health/config and clean app start |
| Explicit live mode without prerequisites | Safe unavailable readiness, zero provider composition/dispatch |
| Secret/live flags inherited into tests | Network guard and zero dispatch counters |
| Contracts imported by client bundle | Successful browser build plus import rules |
| Exact money edge cases | Decimal parsing tests including 0.10, negative adjustments and rejected 0.001 |
| Reproducibility | Frozen-lockfile install, settled root gates and both production builds |

No cloud or paid acceptance is required for this packet. Record installed versions and real gate outcomes, not a claim that a new folder proves architecture.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record:** Not started. No tests, assets, application feature, provider call or deployment is completed by creating this packet.
