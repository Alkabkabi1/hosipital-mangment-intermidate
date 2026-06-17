#!/usr/bin/env bash
set -euo pipefail

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-hospital_app}
BACKUP_DIR=${BACKUP_DIR:-./backups}
BACKUP_RETAIN=${BACKUP_RETAIN:-7}

mkdir -p "$BACKUP_DIR"

ts=$(date +%Y%m%d_%H%M%S)
outfile="$BACKUP_DIR/db_${DB_NAME}_${ts}.sql.gz"

echo "[backup] creating backup: $outfile"

MYSQL_PWD="$DB_PASSWORD" mysqldump \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
  --single-transaction --routines --triggers --events \
  "$DB_NAME" | gzip -c > "$outfile"

echo "[backup] created: $outfile"

# Rotate
echo "[backup] rotating to keep last $BACKUP_RETAIN backups"
ls -1t "$BACKUP_DIR"/db_${DB_NAME}_*.sql.gz | tail -n +$((BACKUP_RETAIN+1)) | while read -r old; do
  echo "[backup] removing old: $old"
  rm -f "$old"
done

echo "$outfile"
