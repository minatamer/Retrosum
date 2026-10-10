# Workspace foundation

## Selected versions and purpose

Verified official npm metadata on 8 October 2026; all direct versions and the workspace lockfile are pinned. Node 24.19.0 is the available tested Node 24 LTS runtime; pnpm 11.25.0 is the installed compatible manager. Next 16.4.0/React 19.3.0 own the app, Express 5.2.1 the API, Zod 4.6.5 the runtime contracts, and TypeScript 6.0.3 the strict compiler. TypeScript 7 is deliberately not selected because the supported typescript-eslint 8.71.1 peer range is below 6.1.

ESLint 10.12.0 is maintained, with @eslint/js 10.0.1, the matching Next plugin and supported React Hooks/React X checks. The sibling ESLint 9 toolchain is end-of-life, and the legacy eslint-config-next React/a11y plugins do not declare ESLint 10 support; they are not forced through incompatible peer ranges. Accessibility has local browser evidence in RET-011; physical/assistive manual acceptance remains separate. Vitest 5.0.3/Supertest 7.3.1 verify boundaries and HTTP; Prettier 3.9.9 formats owned files.

Primary references: [Node LTS](https://nodejs.org/en/about/previous-releases), [Next 16 requirements](https://nextjs.org/docs/app/guides/upgrading/version-16), [Express requirements](https://expressjs.com/en/starter/faq/), [ESLint support](https://eslint.org/version-support/), [pnpm 11 settings/security](https://pnpm.io/blog/releases/11.0). Official npm metadata supplied exact package engines/peer ranges. CI actions are pinned to commits resolved from their official repositories' v6/v4 tags.

## Ownership

- Frontend routes compose browser features or a narrow same-origin server bridge.
- Express app factories accept explicit configuration and clock/request-ID ports; importing them never starts services.
- Backend startup alone loads apps/backend/.env.local, preserving existing process values.
- Contracts are bounded strict schemas; money owns exact decimal/cents helpers. Financial commands, allocations and calculations are implemented by the pure RET-004 money authority.
- Shared packages publish built exports. Root scripts build contracts before money before apps, so consumers do not rely on stale source aliases.
- AST-based boundaries reject cross-owner relative imports, private application imports, Node/platform access in shared code and browser imports of server-owned modules. Negative tests exercise violations.

## Runtime modes

Default configuration is fake and paid-off. Both operations are implemented; accepted local live composition uses `FAKE_MODE=false`, `PAID_DEMO_ENABLED=true` and the backend key/challenge/grant prerequisites. RET-001's original feature-pending state is historical. See [current status](../CURRENT-STATUS.md).

Live mode never falls back to fake. Missing key/admission/adapter returns fixed unavailable codes; health remains alive while readiness returns 503. Public capability JSON contains only mode, feature availability/reason and reviewed limits. The bridge has one fixed endpoint, no arbitrary public proxy.

## Commands and checks

Use pnpm install --frozen-lockfile after the initial lockfile exists. Use pnpm dev:backend and pnpm dev:frontend in separate terminals. Backend binds 127.0.0.1:4000; browser entry is http://localhost:3000 (Next binds 127.0.0.1:3000). Check /v1/health, /v1/ready, /v1/config and frontend /api/retrosum/v1/config independently.

pnpm check runs format, lint, strict typecheck, executable boundaries, isolated unit/HTTP tests and both production builds. Fake tests replace inherited live settings and block fetch/external HTTP/HTTPS; loopback Supertest traffic is allowed. pnpm's one-day package age gate and strict peer/engine settings remain enabled. Only named necessary esbuild/sharp build scripts are allowed; obsolete resolver builds are denied.

Local paid acceptance is complete. Linux image refresh and hosted checks belong to deployment preparation/acceptance. The owner now authorizes RET-012 local packaging/preparation, while cloud changes and deployment stay deferred. No root .env, global configuration change, cloud project or database is created here.
