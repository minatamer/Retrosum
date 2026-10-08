# Retrosum backend

Root pnpm dev:backend builds shared contracts/money and starts the explicit tsx watcher on 127.0.0.1:4000. Production: pnpm build then pnpm start:backend. Copy .env.example to ignored .env.local only when needed; process values take precedence and tests never load local files.

GET /v1/health is no-cost liveness; GET /v1/ready reflects usable runtime composition; GET /v1/config returns only public validated capabilities. Fake/paid-off is the default. Live prerequisites yield unavailable status, never fake output. The app factory has no listener or provider side effects.

Module ownership: config parses once, runtime composes injected ports, HTTP maps fixed routes, server is the explicit entry. Document/OpenAI use cases arrive in RET-005. No hosted storage/database. Logs must remain content-free.
