#!/usr/bin/env bash
set -euo pipefail

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-hospital_app}

RECREATE=false
ASSUME_YES=false

usage() {
  echo "Usage: $0 [--recreate] [--yes] <dump.sql|dump.sql.gz>" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --recreate) RECREATE=true; shift ;;
    --yes) ASSUME_YES=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) break ;;
  esac
done

if [[ $# -lt 1 ]]; then
  usage; exit 1
fi

dump_path="$1"
if [[ ! -f "$dump_path" ]]; then
  echo "dump file not found: $dump_path" >&2
  exit 1
fi

echo "[restore] Target DB: $DB_NAME on $DB_HOST:$DB_PORT"
echo "[restore] File: $dump_path"
if ! $ASSUME_YES; then
  read -r -p "Proceed with restore? This may overwrite data. [y/N] " ans
  case "${ans,,}" in
    y|yes) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SELECT 1;" >/dev/null

if $RECREATE; then
  echo "[restore] Dropping and recreating database $DB_NAME"
  MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\`;"
fi

echo "[restore] Restoring..."
if [[ "$dump_path" == *.gz ]]; then
  gzip -dc "$dump_path" | MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME"
else
  MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$dump_path"
fi

echo "[restore] Completed."
