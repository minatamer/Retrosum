# RET-001 — Initialize the workspace, contracts and safe runtime

Status: **Complete — verified local foundation**  
Last synchronized: **8 October 2026**  
Depends on: None  
Blocks: RET-002, RET-004  
Suggested commit: `RET-001: initialize the workspace, contracts and safe runtime`  
Parent authority: [Retrosum blueprint](../RETROSUM_DEMO_SOURCE_OF_TRUTH.md)  
Queue: [Ticket index](README.md)

## Outcome and standalone context

Create a runnable strict pnpm monorepo whose real application boundaries, public contracts and fake/live configuration can be verified from a fresh checkout. This is a foundation with executable quality gates, not empty folders or a landing mock in a separate tool.

Retrosum shares the siblings' Next.js App Router/React frontend, Express API, browser-safe Zod contracts and TypeScript. The eventual two-service Docker/Cloud Run packaging is deferred to RET-012; local apps run directly with pnpm/Node. Add a browser-safe `packages/money` for deterministic amounts, calculations and commands. No server database, upload bucket, video renderer, microphone stack or Gemini SDK belongs here. OpenAI's implementation comes in RET-005.

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
9. Document direct local pnpm/Node startup and production build commands. Defer Dockerfiles, image builds, container runtime checks and cloud setup to RET-012; Docker Desktop is not required for this foundation. Update the canonical repository tree if implementation reveals a simpler justified placement.

## Acceptance criteria

- [x] Lockfile installs reproducibly; both minimal apps run with the documented commands. Frozen installation verified in this checkout; a separate fresh clone was not made.
- [x] Contracts and money public surfaces build in browser and backend contexts.
- [x] Illegal imports and shared global/platform access fail an executable AST boundary check.
- [x] Invalid currency, unsafe numeric magnitude, fractional cent and malformed revisions fail at the external boundary.
- [x] Fake mode remains explicit and provider dispatch count is zero, even with inherited credentials.
- [x] Config response exposes capabilities/limits and mode but no key, private origin or internal cloud identity.
- [x] Health and readiness have distinct semantics and no hidden paid probe.
- [x] Root quality commands execute and the no-key CI workflow invokes those commands. Local gates passed; hosted CI has not run because no push was requested.

## Verification and evidence

| Case                                     | Evidence                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Empty environment/fake startup           | Real health/config and clean app start                                        |
| Explicit live mode without prerequisites | Safe unavailable readiness, zero provider composition/dispatch                |
| Secret/live flags inherited into tests   | Network guard and zero dispatch counters                                      |
| Contracts imported by client bundle      | Successful browser build plus import rules                                    |
| Exact money edge cases                   | Decimal parsing tests including 0.10, negative adjustments and rejected 0.001 |
| Reproducibility                          | Frozen-lockfile install, settled root gates and both production builds        |

No cloud or paid acceptance is required for this packet. Record installed versions and real gate outcomes, not a claim that a new folder proves architecture.

## Scope limits and completion record

Keep this packet one coherent outcome: necessary UI, contracts, backend/local effects, recovery and focused verification belong together. Do not create extra tickets for individual buttons, charts, fields or endpoints. Follow the blueprint's English/USD, PDF evidence, live-public/fake-development, no-server-database, temporary browser storage and motion decisions.

Ticket planning is not implementation evidence or authorization for unrequested paid calls, cloud changes, deployment or commits. At execution use the user's current authorization; local reversible work normally proceeds without repeated permission. Record exact changes, settled checks, manual evidence, fake/live distinction and remaining prerequisites before updating status.

**Execution record, 8 October 2026:** implemented strict Node 24.19.0/pnpm 11.25.0 workspace, Next 16.4.0/React 19.3.0 frontend, Express 5.2.1 backend, Zod 4.6.5 contracts and exact BigInt-backed cents helpers. TypeScript 6.0.3 was selected for supported lint peer compatibility. App factories are import-safe; startup alone loads ignored configuration/starts listeners. Public capabilities use a bounded server-only bridge; live prerequisites fail closed. No provider SDK/client or paid dispatch exists in this packet.

Frozen-lockfile installation and settled `pnpm check` passed: formatting, lint, strict typecheck, executable boundary rules, 67 tests across seven files and both production builds. Actual local health/readiness/config and frontend bridge responses were checked. Browser navigation, exact $0.10 formatting, explicit fake status and skip-link keyboard focus passed. Foundation layouts had no horizontal overflow at 320×568, 390×844, 768×1024, 1280×800, 1440×900 and 1920×1080. These are foundation checks; RET-002 owns the finished first-screen hero.

Validation initially found shared `globalThis` platform access and a comment-only `server-only` marker bypass. Both are fixed with regression tests. Manual keyboard checking also found the main target needed `tabIndex={-1}`; native skip links now move focus correctly. The final read-only review has no actionable findings. See [validation record](../validation/RET-001.md) and [file-level commit plan](../commit-plans/RET-001.md). Hosted CI, owner aesthetics, paid OpenAI and cloud evidence were not performed and are not needed to unblock RET-002 locally.
