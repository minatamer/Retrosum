# Retrosum

Retrosum is a guest demo that turns financial PDF evidence into an interactive money dashboard and lets an assistant named **Retro** explain, guide and edit temporary session records. The local build provides the full simulated interaction flow. OpenAI live processing remains closed until its numeric and spend acceptance gates pass.

The interface and sample documents use English and USD. Every sample figure comes from a viewable PDF; the intended public AI sample will process those originals live. Development fake mode supports the same interaction flow without API usage. Records and PDF previews survive refresh using bounded browser storage, with a fixed two-hour expiry and no server database.

## Documentation

- [Complete product, architecture and delivery blueprint](docs/RETROSUM_DEMO_SOURCE_OF_TRUTH.md)
- [Short visual product brief](docs/RETROSUM_OVERVIEW.html)
- [Twelve detailed implementation tickets and dependencies](docs/tickets/README.md)
- [Documentation map and authority](docs/README.md)
- [Prepared manual release and rollback guide](docs/operations/MANUAL-DEPLOYMENT.md)

**Status:** RET-001 through RET-011 are verified locally: foundation, brand/landing, eight visible PDFs, exact money/manual CRUD/Undo/recovery, simulated actual-byte recognition/review, interactive source-backed dashboard and floating Retro conversation/guidance. Typed simulations use current scoped facts, original sources and registered tour targets. The workspace starts empty; unfamiliar uploads stay previewable without a fake OCR claim. RET-008 delivers real animated editable CRUD proposals, clarification, exact effect previews, one confirmation and revision-safe inline Undo. RET-009 reviewed revision-bound ZIP exports, local created-invoice PDFs and whole-session cleanup are verified locally. RET-010 local privacy/admission/spend hardening is verified: scoped one-use grants, retained conservative reservations, private identity transport, bounded resources, nonce security policy and explicit processing disclosure. Actual live/IAM/challenge/spend gates stay closed; RET-011 connected product verification is complete locally, including actual ZIP download, ten hero/eight dashboard sizes and 190 settled tests. Physical/assistive performance and live acceptance remain pending. RET-012 local preparation is complete: both nonroot Linux images, packaged originals/fonts/workers, canonical proxy origins and free fake/unavailable probes are verified. The settled final gates passed 192 tests and 105 boundary checks. Manual deployment/rollback guides and unresolved Cloud Run templates are ready; no images were pushed and nothing was deployed. Owner aesthetics/physical-device feedback, live accuracy/spend and deployment remain pending; public live capability stays closed. See [Retro decisions](docs/engineering/RETRO.md), [dashboard decisions](docs/engineering/DASHBOARD.md), [recognition decisions](docs/engineering/RECOGNITION.md) and each ticket’s evidence.

## Local development

Use Node 24.19.0 (24 LTS) and pnpm 11.25.0. Install with `pnpm install --frozen-lockfile`, then start `pnpm dev:backend` and `pnpm dev:frontend` in separate terminals. Open http://localhost:3000; the backend binds 127.0.0.1:4000. Default mode is fake/paid-off, with no API key needed. App-local `.env.example` files document optional overrides; no root secret file is used.

`pnpm check` runs formatting, lint, strict typechecking, AST ownership boundaries, isolated tests and production builds. See [foundation decisions and commands](docs/engineering/FOUNDATION.md) for exact dependencies and verification scope. Docker and deployment are not required for local development.
