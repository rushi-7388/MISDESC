#!/bin/sh
set -e

echo "Waiting for database and syncing schema..."
ATTEMPTS=0
until npx prisma db push --skip-generate --accept-data-loss 2>/tmp/migrate.log; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "Database did not become ready in time. Last error:"
    cat /tmp/migrate.log
    exit 1
  fi
  sleep 2
done

echo "Schema synced."

if [ "$SEED_DB" != "false" ]; then
  echo "Seeding database (safe to re-run, uses upsert)..."
  node prisma/seed.js || echo "Seed step failed or already applied, continuing."
fi

echo "Starting MISDESC backend..."
exec node src/server.js
