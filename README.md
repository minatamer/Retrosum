# Retrosum

Retrosum is a guest demo that turns financial PDF evidence into an interactive money dashboard and lets an assistant named **Retro** explain, guide and edit temporary session records. The local build supports both simulation and the accepted paid OpenAI path. Two numeric/record corpus passes and seventeen live Retro cases passed; actual localhost Turnstile/browser checks passed. Hosted release acceptance remains separate.

The interface and sample documents use English and USD. Every sample figure comes from a viewable PDF; the intended public AI sample will process those originals live. Development fake mode supports the same interaction flow without API usage. Records and PDF previews survive refresh using bounded browser storage, with a fixed two-hour expiry and no server database.

## Documentation

- [Complete product, architecture and delivery blueprint](docs/RETROSUM_DEMO_SOURCE_OF_TRUTH.md)
- [Short visual product brief](docs/RETROSUM_OVERVIEW.html)
- [Twelve detailed implementation tickets and dependencies](docs/tickets/README.md)
- [Documentation map and authority](docs/README.md)
- [Prepared manual release and rollback guide](docs/operations/MANUAL-DEPLOYMENT.md)

**Status:** RET-001 through RET-012 have local product and packaging evidence. The current ten-PDF/eighteen-page sample is source-backed; the workspace starts empty. RET-011's 10 October owner-authorized live numeric/record/Retro checks passed, and normal paid startup is connected with exact token preflight and challenge-bound admission. Real localhost disclosure, Turnstile, one-use grant, PDF extraction and Retro checks passed. Committed examples remain fake/paid-off. Owner/physical/general handwriting, account-wide billing controls and hosted domain/IAM/retention/deployment remain pending. See [current validation](docs/validation/RET-011.md), [live setup](docs/engineering/OPENAI-LIVE-TESTING.md) and the ticket evidence. No push or deployment.

## Local development

Use Node 24.19.0 (24 LTS) and pnpm 11.25.0. Install with `pnpm install --frozen-lockfile`, then start `pnpm dev:backend` and `pnpm dev:frontend` in separate terminals. Open http://localhost:3000; the backend binds 127.0.0.1:4000. Default mode is fake/paid-off, with no API key needed. App-local `.env.example` files document optional overrides; no root secret file is used.

`pnpm check` runs formatting, lint, strict typechecking, AST ownership boundaries, isolated tests and production builds. See [foundation decisions and commands](docs/engineering/FOUNDATION.md) for exact dependencies and verification scope. Docker and deployment are not required for local development.
