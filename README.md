# Retrosum

Retrosum is a planned guest demo that reads financial PDFs with OpenAI, turns their evidence into an interactive money dashboard, and lets an assistant named **Retro** explain, guide and edit temporary session records. The core is exact document recognition, beautiful source-linked charts, and useful AI interaction.

The interface and sample documents use English and USD. Every sample figure comes from a viewable PDF; the public sample processes live. Development fake mode supports the same interaction flow without API usage. Records and PDF previews survive refresh using bounded browser storage, with a proposed two-hour expiry and no server database.

## Documentation

- [Complete product, architecture and delivery blueprint](docs/RETROSUM_DEMO_SOURCE_OF_TRUTH.md)
- [Short visual product brief](docs/RETROSUM_OVERVIEW.html)
- [Twelve detailed implementation tickets and dependencies](docs/tickets/README.md)
- [Documentation map and authority](docs/README.md)

**Status:** RET-001 foundation verified locally. The strict pnpm workspace, shared contracts, exact money helpers, minimal pages and no-key runtime pass the quality gates. Product features, authored sample PDFs, live accuracy evidence and deployment remain pending; the minimal pages do not represent the finished demo. RET-002 is next.

## Local development

Use Node 24.19.0 (24 LTS) and pnpm 11.25.0. Install with `pnpm install --frozen-lockfile`, then start `pnpm dev:backend` and `pnpm dev:frontend` in separate terminals. Open http://localhost:3000; the backend binds 127.0.0.1:4000. Default mode is fake/paid-off, with no API key needed. App-local `.env.example` files document optional overrides; no root secret file is used.

`pnpm check` runs formatting, lint, strict typechecking, AST ownership boundaries, isolated tests and production builds. See [foundation decisions and commands](docs/engineering/FOUNDATION.md) for exact dependencies and verification scope. Docker and deployment are not required for local development.
