#!/usr/bin/env bash
set -euo pipefail

# Search for hard-coded ports in frontend code, excluding the known dev fallback file
ROOTS=("Frontend")
PATTERN=':[0-9]{2,5}'
EXCLUDE_FILE='Frontend/jS/api-client.js'

FOUND=0
TMPFILE=$(mktemp)

for root in "${ROOTS[@]}"; do
  if [[ -d "$root" ]]; then
    # Grep for ports; exclude the allowed file; exclude obvious comment-only lines
    grep -RInE "$PATTERN" "$root" | grep -v "$EXCLUDE_FILE" | awk '!
      /^[ \t]*\/\// && !/^[ \t]*\*/ && !/^[ \t]*<!--/ { print }' > "$TMPFILE" || true
    if [[ -s "$TMPFILE" ]]; then
      echo "❌ Hard-coded ports found in frontend code (excluding allowed dev fallback):"
      cat "$TMPFILE"
      FOUND=1
      break
    fi
  fi
done

rm -f "$TMPFILE"

if [[ $FOUND -eq 0 ]]; then
  echo "✅ No disallowed hard-coded ports detected in frontend."
fi

exit $FOUND

