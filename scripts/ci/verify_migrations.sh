#!/usr/bin/env bash
set -euo pipefail

MYSQL_HOST=${MYSQL_HOST:-127.0.0.1}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_USER=${MYSQL_USER:-root}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-password}
MYSQL_DB=${MYSQL_DB:-hospital_management}

echo "Waiting for MySQL at ${MYSQL_HOST}:${MYSQL_PORT} ..."
for i in {1..30}; do
  if mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [[ "$i" -eq 30 ]]; then
    echo "MySQL did not become ready in time" >&2
    exit 1
  fi
done

echo "Creating database ${MYSQL_DB} ..."
mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

run_migrations() {
  mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DB}" -e "
    SET @T_USERS='App_Users';
    SET @T_USER_ROLES='user_roles';
    SET @T_ROLES='roles';
    SOURCE Backend/migrations/001_bootstrap_admin.sql;
    SOURCE Backend/migrations/002_fk_constraints.sql;
    SOURCE Backend/migrations/003_commissioner_tickets.sql;
  "
}

echo "Running migrations (first pass) ..."
run_migrations
echo "Running migrations (second pass for idempotency) ..."
run_migrations

echo "✅ Migrations applied twice successfully (idempotent)."

