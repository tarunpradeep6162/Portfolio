# syntax=docker/dockerfile:1
# Multi-stage production image for the Next.js 16 standalone output.
# Deterministic: pinned base digest-free but version-pinned major (node:20),
# npm ci (lockfile-exact), no dev server, no test tooling in the final stage.

ARG NODE_VERSION=20-alpine

# ---- deps: install exact locked dependencies once, cached across stages ----
# Deliberately no `--mount=type=cache` here: it requires BuildKit, and this
# image needs to build identically on a plain legacy-builder Docker daemon
# (this repo's local dev host, a bare Jenkins agent) and in GitHub Actions
# (which sets up BuildKit via docker/setup-buildx-action and layers its own
# `type=gha` cache on top regardless) - reproducibility across both wins
# over a local npm-cache speedup that only one of those environments has.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: production build using the standalone output tracer ----
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal runtime, non-root, only traced files ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Configurable at `docker run -e PORT=...`; defaults to the repo's preview port.
ENV PORT=3500
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Only the files next build's standalone tracer determined are needed -
# no node_modules copied wholesale, no .git, no test output, no .env.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3500

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3500)+'/').then(r=>{if(r.status!==200)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
