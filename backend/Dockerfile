# ─────────────────────────────────────────────────────────────────────────────
# VersionIQ — Backend Dockerfile (multi-stage)
#
# Stage 1 (dependencies): install production npm packages
# Stage 2 (runtime):      run the Express server
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install production dependencies ─────────────────────────────────
FROM node:22-alpine AS dependencies
LABEL stage=dependencies
WORKDIR /app
COPY package*.json ./
# --omit=dev keeps the image lean; devDependencies are not needed at runtime
RUN npm ci --no-audit --no-fund --omit=dev

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
LABEL maintainer="version-vault"
LABEL version="1.0.0"

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# dumb-init for proper PID-1 signal handling; curl for health checks
RUN apk add --no-cache dumb-init curl

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001

# Copy production dependencies from the first stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copy application source
COPY --chown=appuser:nodejs src ./src
COPY --chown=appuser:nodejs .env.example ./.env.example

# Uploads directory — mounted as a volume in production
RUN mkdir -p uploads/tmp && chown -R appuser:nodejs uploads

USER appuser

EXPOSE 4000

# Health check — hits the lightweight /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
