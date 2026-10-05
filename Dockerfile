# ---------- build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git
RUN corepack enable

# Source (see .dockerignore — node_modules / dist / build are excluded)
COPY . .

RUN yarn install

# Build core types and the UI, then bundle the server with esbuild
# (core is inlined; frontEnd/dist is copied to backEnd/dist/dashboard)
RUN yarn workspace livemock-core build \
 && yarn workspace front-end build \
 && yarn workspace livemock build

# ---------- production stage ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    LIVEMOCK_PORT=9002 \
    LIVEMOCK_DB_PATH=/app/data/db

# Bundled server + built UI
COPY --from=builder /app/backEnd/dist ./dist
COPY --from=builder /app/backEnd/package.json ./

# Runtime dependencies only. devDependencies must be removed first: npm rejects
# the Yarn-only "workspace:*" protocol even when --omit=dev is used.
RUN npm pkg delete devDependencies scripts \
 && npm install --omit=dev --no-audit --no-fund \
 && mkdir -p /app/data \
 && chown -R node:node /app

USER node

EXPOSE 9002 8088
VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]
