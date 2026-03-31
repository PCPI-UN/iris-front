# Multi-stage build

# ========================
# Stage 1: Base
# ========================
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# ========================
# Stage 2: Dependencies
# ========================
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ========================
# Stage 3: Builder
# ========================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for Next.js environment variables
ARG API_URL
ARG NEXT_PUBLIC_ENABLE_API_MOCKING
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_MOCK_API_PORT

ENV NEXT_PUBLIC_ENABLE_API_MOCKING=${NEXT_PUBLIC_ENABLE_API_MOCKING}
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
ENV NEXT_PUBLIC_MOCK_API_PORT=${NEXT_PUBLIC_MOCK_API_PORT}
ENV API_URL=${API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build 2>&1 || (echo "BUILD FAILED" && exit 1)
# ========================
# Stage 4: Production
# ========================
FROM base AS production

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --chown=nextjs:nodejs package.json ./

USER nextjs

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + process.env.PORT, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["dumb-init", "pnpm", "start"]
