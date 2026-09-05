# syntax=docker-mirror.liara.ir/docker/dockerfile:1
# ایمیج‌های پایه از میرور لیارا: https://liara.ir/mirrors/docker/

ARG DOCKER_MIRROR=docker-mirror.liara.ir
FROM ${DOCKER_MIRROR}/library/node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS builder
ARG NPM_LOGLEVEL=verbose
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
RUN npm install --loglevel ${NPM_LOGLEVEL} --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY . .

ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public
ARG NEXT_PUBLIC_BASE_PATH=
ARG NEXT_PUBLIC_MEDIA_BASE_URL=
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_MEDIA_BASE_URL=$NEXT_PUBLIC_MEDIA_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npx prisma generate && npx next build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json /app/package-lock.json /app/.npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker/seed-admin.mjs ./docker/seed-admin.mjs
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
