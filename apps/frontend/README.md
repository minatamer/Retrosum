# Retrosum frontend

Root pnpm dev:frontend builds shared exports and starts Next on 127.0.0.1:3000. Use http://localhost:3000 as the canonical browser origin. Root pnpm build creates production output; pnpm start:frontend runs it.

Browser features use public contracts/money and same-origin API routes. The server-only capability bridge defaults to http://127.0.0.1:4000; the client never receives the private origin. No public environment variable enables live AI or contains a key. Root .env files are not part of the workflow.

The current pages are the RET-001 foundation; brand/landing belong to RET-002 and the working workspace arrives through RET-003 onward. The production output uses standalone tracing for later packaging. Docker/cloud verification is deferred.
