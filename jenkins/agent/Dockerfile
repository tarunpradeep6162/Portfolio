# syntax=docker/dockerfile:1
#
# A dedicated, Docker-capable Jenkins SSH agent for this repository's
# pipeline - built as a reproducible image, not hand-provisioned into a
# running container, so it can be rebuilt identically. Same base image
# family as the existing jenkins-agent-01 ("linux-agent" label,
# jenkins/ssh-agent:debian-jdk21) for architectural consistency; this
# agent is additive, not a replacement for it. jenkins-agent-01 is never
# modified by this file or anything that builds from it.
#
# Labelled "portfolio-docker" in Jenkins - the label the repository's own
# Jenkinsfile has referenced since before this agent existed (it could
# never actually run until this image and its node registration existed).
#
# Docker access: the host's /var/run/docker.sock is bind-mounted only into
# containers run from this image (never into jenkins-agent-01). The
# `jenkins` user (uid 1000, inherited from the base image) is added to a
# `docker` group whose GID is passed at build time to match the host's
# actual docker group GID - so pipeline steps run as the jenkins user, not
# root, and still reach the socket. No TCP Docker exposure anywhere.
ARG DOCKER_GID=999

FROM jenkins/ssh-agent:debian-jdk21

ARG DOCKER_GID
ARG PLAYWRIGHT_VERSION=1.62.1
ARG NODE_MAJOR=22

USER root

# curl (also needed by NodeSource's setup script), gnupg for apt key
# handling, ca-certificates for HTTPS repos.
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      gnupg \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 via NodeSource - matches the Node major version pinned
# everywhere else in this repository (Dockerfile, GitHub Actions,
# next.config.ts's own documented reasoning about jsdom@30 needing
# Node >=22.22.2).
RUN curl -fsSL --connect-timeout 15 --max-time 60 --retry 3 --retry-delay 5 \
      https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && node --version && npm --version

# Docker CLI only (no daemon, no dockerd) - this agent talks to the
# host's Docker daemon exclusively through the bind-mounted socket.
RUN curl -fsSL --connect-timeout 15 --max-time 60 --retry 3 --retry-delay 5 \
      https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli \
    && rm -rf /var/lib/apt/lists/* \
    && docker --version

# Trivy - filesystem and image scanning, matching the same tool GitHub
# Actions' nightly/release workflows already use. Installed via GitHub's
# own install script/CDN (raw.githubusercontent.com), not aquasecurity's
# separately-hosted apt repo (aquasecurity.github.io) - that domain
# stalled silently (connection open, near-zero throughput, no error) for
# 9+ minutes during this image's first real build attempt on this VM,
# confirmed by checking the build container's own process list before
# concluding it wasn't just "slow." GitHub's API/CDN responded instantly
# in the same environment. Explicit timeout/retry flags so a future stall
# fails the build loudly within minutes instead of hanging indefinitely.
ARG TRIVY_VERSION=0.73.0
RUN curl -fsSL --connect-timeout 15 --max-time 90 --retry 3 --retry-delay 5 \
      https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
      -o /tmp/install-trivy.sh \
    && sh /tmp/install-trivy.sh -b /usr/local/bin "v${TRIVY_VERSION}" \
    && rm /tmp/install-trivy.sh \
    && trivy --version

# Playwright's own system-dependency installer knows the exact apt
# packages its browsers need per Debian release - reused rather than a
# hand-maintained package list that could silently drift from what
# Playwright actually requires. install-deps only touches OS packages,
# not the browser binary itself (installed below, pinned to this
# repository's exact locked version).
RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Match the host's docker group GID so the non-root jenkins user can use
# the bind-mounted socket without sudo or running as root. If a group
# with this GID already exists under a different name (base-image
# default), reuse it by GID rather than creating a duplicate.
RUN if getent group ${DOCKER_GID} > /dev/null 2>&1; then \
      EXISTING_GROUP=$(getent group ${DOCKER_GID} | cut -d: -f1); \
      usermod -aG "${EXISTING_GROUP}" jenkins; \
    else \
      groupadd -g ${DOCKER_GID} docker && usermod -aG docker jenkins; \
    fi

# Pre-download the exact locked Chromium build as the jenkins user (not
# root) so it lands in the same cache path a real job run will look in -
# real network access at build time, not faked; if this step fails the
# image build fails loudly rather than silently shipping without it.
USER jenkins
RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install chromium
USER root

LABEL description="Docker-capable Jenkins SSH agent for tarunpradeep6162/Portfolio - label: portfolio-docker"
