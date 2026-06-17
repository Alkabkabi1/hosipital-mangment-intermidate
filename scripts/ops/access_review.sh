#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE:-http://localhost:3037}
API_TOKEN=${API_TOKEN:-}
OUT_DIR=${OUT_DIR:-./exports}
DATE=$(date +%Y%m%d)

mkdir -p "$OUT_DIR"

auth_hdr=()
if [[ -n "$API_TOKEN" ]]; then
  auth_hdr=(-H "Authorization: Bearer $API_TOKEN")
fi

echo "[access-review] fetching users.csv and users.json from $API_BASE"

curl -fsSL "${auth_hdr[@]}" "$API_BASE/api/v1/admin/access-review/users.csv" -o "$OUT_DIR/access-review_${DATE}.csv"
curl -fsSL "${auth_hdr[@]}" "$API_BASE/api/v1/admin/access-review/users.json" -o "$OUT_DIR/access-review_${DATE}.json"

echo "[access-review] fetching drift report"
curl -fsSL "${auth_hdr[@]}" "$API_BASE/api/v1/admin/access-review/drift" -o "$OUT_DIR/access-drift_${DATE}.json"

if command -v jq >/dev/null 2>&1; then
  echo "[access-review] summary:" 
  jq -r '"staleAdmins:\t" + ((.staleAdmins|length|tostring)) + "\n" +
         "orphanedElevated:\t" + ((.orphanedElevated|length|tostring)) + "\n" +
         "duplicates:\t" + ((.duplicates|length|tostring))' "$OUT_DIR/access-drift_${DATE}.json"
fi

echo "[access-review] done. files in $OUT_DIR"

