# syntax=docker/dockerfile:1
# Multi-stage production image for the Next.js 16 standalone output.
# Deterministic: pinned base digest-free but version-pinned major (node:22),
# npm ci (lockfile-exact), no dev server, no test tooling in the final stage.
#
# Node 22, not 20: jsdom@30 (a devDependency, not part of the runtime image)
# requires Node ^22.22.2 - Node 20's undici lacks
# webidl.util.markAsUncloneable, which jsdom's CacheStorage import needs at
# require-time. This broke Fast CI's first real run on GitHub Actions
# (Node 20 runner) even though it worked locally (this dev machine runs
# Node 22.22.1). Standardized on 22 everywhere - this Dockerfile, all
# GitHub Actions workflows, and Jenkinsfile - to match the one
# Node version actually proven to work.
ARG NODE_VERSION=22-alpine

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

# node:22-alpine ships its own global npm install (and npm's internal
# dependencies - tar, ip-address, sigstore, picomatch, brace-expansion -
# used by npm's registry/publish/provenance machinery) regardless of
# whether this stage ever invokes npm. It doesn't: CMD runs `node
# server.js` directly and HEALTHCHECK uses `node -e`. A real hosted
# release-candidate Trivy image scan (workflow run 31720379298) flagged
# CRITICAL/HIGH CVEs in exactly those npm-internal packages; none of them
# are this app's own dependencies or present in .next/standalone's traced
# node_modules (verified against package-lock.json and the standalone
# output directly). Removing the base image's unused npm install drops
# the vulnerable code from the shipped image without touching anything
# the app uses at runtime.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

USER nextjs

EXPOSE 3500

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3500)+'/').then(r=>{if(r.status!==200)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
