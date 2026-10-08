# Retrosum frontend

Root pnpm dev:frontend builds shared exports and starts Next on 127.0.0.1:3000. Use http://localhost:3000 as the canonical browser origin. Root pnpm build creates production output; pnpm start:frontend runs it.

Browser features use public contracts/money and same-origin API routes. The server-only capability bridge defaults to http://127.0.0.1:4000; the client never receives the private origin. No public environment variable enables live AI or contains a key. Root .env files are not part of the workflow.

RET-001 through RET-008 are verified locally: responsive brand/landing, visible PDFs/viewer, exact money/session recovery/manual CRUD, simulated actual-byte recognition/review, interactive source-backed dashboard and floating Retro conversation/tour. The chat bridge is private and server-only; browser simulations use current facts without AI requests. RET-008 delivers real animated editable CRUD proposals and zero-inference confirmation/Undo; RET-009 exports/lifecycle follows. The production output uses standalone tracing for later packaging. Owner visual, live AI and Docker/cloud verification remain deferred.
