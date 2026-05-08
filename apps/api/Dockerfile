FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@9

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/pace-calculator/package.json ./packages/pace-calculator/
COPY packages/training-engine/package.json ./packages/training-engine/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ─── Build ────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm --filter @openrunna/shared build \
 && pnpm --filter @openrunna/pace-calculator build \
 && pnpm --filter @openrunna/training-engine build \
 && pnpm --filter @openrunna/api run prisma:generate \
 && pnpm --filter @openrunna/api build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/pace-calculator/dist ./packages/pace-calculator/dist
COPY --from=builder /app/packages/training-engine/dist ./packages/training-engine/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
