ARG NODE_IMAGE=node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
FROM ${NODE_IMAGE} AS build
WORKDIR /workspace
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/money/package.json packages/money/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:shared \
    && pnpm --filter @retrosum/backend build \
    && pnpm --filter @retrosum/backend deploy --prod --offline --frozen-lockfile /runtime/backend \
    && node scripts/verify-release.mjs backend /runtime/backend

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
COPY --from=build --chown=node:node /runtime/backend ./
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0 FAKE_MODE=true PAID_DEMO_ENABLED=false LIVE_DOCUMENTS_ENABLED=false LIVE_COPILOT_ENABLED=false AI_PROVIDER=fake
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
