ARG NODE_BUILD_PLATFORM=linux/amd64
# satteri does not publish a Linux arm64 native package; this stage only emits static assets.
FROM --platform=${NODE_BUILD_PLATFORM} node:24-trixie-slim AS system_base
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  ca-certificates openssh-client curl wget git unzip \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable pnpm

# -------------------
# Install dependencies and build app
# https://pnpm.io/docker
# -------------------
FROM system_base AS app_deps
WORKDIR /webapp
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /webapp/
COPY apps/web/package.json /webapp/apps/web/package.json
COPY apps/stories/package.json /webapp/apps/stories/package.json
COPY packages/core/package.json /webapp/packages/core/package.json
COPY packages/components/package.json /webapp/packages/components/package.json
COPY packages/examples/package.json /webapp/packages/examples/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# -------------------
# Build app
# -------------------
FROM system_base AS app_build
COPY . /webapp
WORKDIR /webapp
COPY --from=app_deps /webapp/node_modules /webapp/node_modules
RUN pnpm build:site

# -------------------
# Serve the website
# -------------------
FROM nginx:1-alpine AS app_serve
WORKDIR /webapp
COPY --from=app_build /webapp/dist-site/ /webapp/www/
COPY server/nginx.conf /etc/nginx/nginx.conf
COPY server/docker-entrypoint.sh /webapp/docker-entrypoint.sh
RUN chmod +x /webapp/docker-entrypoint.sh
RUN nginx -t
EXPOSE 80
CMD ["/webapp/docker-entrypoint.sh"]
