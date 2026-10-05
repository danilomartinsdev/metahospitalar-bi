# Web (SPA estática) servida pelo Caddy, que também faz HTTPS e proxy de /api.
FROM node:24-alpine AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter web... --ignore-scripts
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter web exec nuxt generate
# CSP: libera por hash só os scripts embutidos que o Nuxt gerou (senão a SPA abre em branco).
COPY docker/Caddyfile docker/csp-hashes.mjs docker/
RUN node docker/csp-hashes.mjs apps/web/.output/public docker/Caddyfile > /repo/Caddyfile

FROM caddy:2-alpine AS runtime
COPY --from=build /repo/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/web/.output/public /srv
EXPOSE 80 443
