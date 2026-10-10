# Retrosum frontend

Root `pnpm dev:frontend` builds shared exports and starts Next on 127.0.0.1:3000. Use http://localhost:3000/demo as the canonical application route and browser origin. `pnpm build` creates production output; `pnpm start:frontend` runs it.

Browser features import public contracts/money and use same-origin API routes. The server-only bridge defaults to http://127.0.0.1:4000; the client never receives private origins or provider secrets. Next loads app-local environment normally; there is no root secret-file workflow or public AI mode/key variable.

The single-page journey, ten-PDF/eighteen-page collection, source viewer, exact money/CRUD/recovery, synchronized document review, source-backed configurable dashboard, automatic dated ECB EUR display and floating Retro are implemented. Date ranges for Records and Dashboard are independent and reset on refresh. Retro uses contextual shortcuts, default-collapsed sources, remembered expanded size, fast typing and application-owned editable/confirmed changes with latest Undo. Workspace ZIP/generated-invoice export controls are removed; source PDF downloads remain.

Actual local paid documents/Retro and production Turnstile checks passed. Committed defaults remain fake/paid-off. Nonroot Linux evidence belongs to an older snapshot; refresh it during deployment preparation. See [current status](../../docs/CURRENT-STATUS.md) and [RET-011 evidence](../../docs/validation/RET-011.md) for completed checks and remaining manual/hosted acceptance.
