#!/bin/sh
set -eu

echo "Waiting for Postgres…"
i=0
until node -e "
const net = require('net');
const host = process.env.POSTGRES_HOST || 'postgresql';
const port = Number(process.env.POSTGRES_PORT || 5432);
const s = net.connect(port, host, () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "Postgres not ready after 60s" >&2
    exit 1
  fi
  sleep 1
done

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running prisma migrate deploy…"
  node ./node_modules/prisma/build/index.js migrate deploy
fi

if [ "${RUN_SEED_ADMIN:-true}" = "true" ]; then
  echo "Seeding admin if missing…"
  node /app/docker/seed-admin.mjs || true
fi

echo "Starting Circle on :${PORT:-3000}"
exec "$@"
