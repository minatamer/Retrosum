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
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build:shared \
    && pnpm --filter @retrosum/frontend build \
    && node scripts/package-frontend.mjs \
    && node scripts/verify-release.mjs frontend artifacts/local/release/frontend

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
COPY --from=build --chown=node:node /workspace/artifacts/local/release/frontend ./
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=8080
USER node
EXPOSE 8080
CMD ["node", "apps/frontend/server.js"]
