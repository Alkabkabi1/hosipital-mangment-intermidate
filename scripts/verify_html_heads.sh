#!/usr/bin/env bash
set -euo pipefail

ROOT="Frontend/HTML"
STATUS=0

check_file() {
  local f="$1"
  local meta_ln status_ln sync_ln api_ln

  meta_ln=$(grep -nE "<meta[^>]+name=(['\"])api-base\1" "$f" | head -n1 | cut -d: -f1 || true)
  if [[ -z "${meta_ln}" ]]; then
    echo "❌ $f: missing <meta name=\"api-base\">"
    STATUS=1
    return
  fi

  status_ln=$(grep -nE '<script[^>]+src="\.\./jS/status-mapper\.js"' "$f" | head -n1 | cut -d: -f1 || true)
  sync_ln=$(grep -nE '<script[^>]+src="\.\./jS/sync-manager\.js"' "$f" | head -n1 | cut -d: -f1 || true)
  api_ln=$(grep -nE  '<script[^>]+src="\.\./jS/api-client\.js"' "$f" | head -n1 | cut -d: -f1 || true)

  if [[ -z "$status_ln" || -z "$sync_ln" || -z "$api_ln" ]]; then
    echo "❌ $f: required scripts missing (status/sync/api)"
    STATUS=1
    return
  fi

  if (( status_ln >= sync_ln )); then
    echo "❌ $f: status-mapper.js must appear before sync-manager.js (lines $status_ln < $sync_ln)"
    STATUS=1
    return
  fi
  if (( sync_ln >= api_ln )); then
    echo "❌ $f: sync-manager.js must appear before api-client.js (lines $sync_ln < $api_ln)"
    STATUS=1
    return
  fi

  echo "✅ $f: head order ok"
}

shopt -s nullglob
for file in "$ROOT"/*.html; do
  check_file "$file"
done

exit $STATUS
