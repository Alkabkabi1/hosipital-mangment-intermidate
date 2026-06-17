#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# 0) Ensure .env exists
if [ ! -f "$ROOT/.env" ]; then
  if [ -f "$ROOT/.env.example" ]; then
    cp "$ROOT/.env.example" "$ROOT/.env"
    echo "[bootstrap] Created .env from .env.example (edit if needed)"
  else
    echo "[bootstrap] ERROR: .env.example not found"
    exit 1
  fi
fi

# Load key envs (fallbacks match docker-compose.dev.yml)
export DB_NAME="${DB_NAME:-hospital_app}"
export MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-rootsecret}"

# 1) Start MySQL + API
echo "[bootstrap] Starting docker compose..."
docker compose -f "$ROOT/docker-compose.dev.yml" up -d --build

# 2) Wait for MySQL readiness
echo "[bootstrap] Waiting for MySQL..."
for i in {1..60}; do
  if docker exec dev-mysql mysqladmin ping -uroot -p"$MYSQL_ROOT_PASSWORD" --silent &>/dev/null; then
    echo "[bootstrap] MySQL is up"
    break
  fi
  sleep 1
  if [ "$i" -eq 60 ]; then
    echo "[bootstrap] ERROR: MySQL not responding"
    exit 1
  fi
done

# 3) Create DB (if missing) and run migrations
echo "[bootstrap] Ensuring database '$DB_NAME' exists and running migrations..."
docker exec -i dev-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`$DB_NAME\`;
SQL

# Copy Backend folder into container so SOURCE paths resolve
docker cp "$ROOT/Backend" dev-mysql:/Backend >/dev/null

# Run the migration bundle (uses SOURCE Backend/...) from container root
docker exec -i dev-mysql sh -lc "cd / && mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" \"$DB_NAME\" < /dev/stdin" < "$ROOT/scripts/dev/migrate_all.sql"
echo "[bootstrap] Migrations applied (idempotent)"

# 4) Smoke checks
API_BASE="${API_BASE:-http://localhost:3037}"
echo "[bootstrap] Smoke checks on $API_BASE"
set +e
curl -sSf "$API_BASE/health" >/dev/null && echo "[bootstrap] /health OK" || { echo "[bootstrap] /health FAIL"; exit 1; }
curl -sSf "$API_BASE/ready"  >/dev/null && echo "[bootstrap] /ready  OK" || { echo "[bootstrap] /ready  FAIL";  exit 1; }
set -e

# 5) Hints
cat <<'NOTE'
[bootstrap] ✅ System is up.

Next steps:
  1) Admin login (replace PASSWORD with your dev password):
     curl -sS http://localhost:3037/api/v1/auth/login \
       -H 'Content-Type: application/json' \
       -d '{"email":"admin@dev.local","password":"PASSWORD"}' | jq .

  2) Open the frontend (static pages served by backend):
     http://localhost:3037/Frontend/HTML/login.html
     (Ensure each HTML <head> has: <meta name="api-base" content="http://localhost:3037">)

  3) Stage-F smoke (optional):
     bash scripts/ops/smoke.sh

  4) Stage-L flow test (optional):
     API_BASE=http://localhost:3037 \
     API_EMAIL=admin@dev.local \
     API_PASSWORD='PASSWORD' \
     node scripts/ops/load_flows.js
NOTE

