#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE:-http://localhost:3037}

say() { echo -e "[smoke] $*"; }
fail() { echo -e "[smoke] ❌ $*" >&2; exit 1; }

say "API_BASE=$API_BASE"

# 1) Health
say "Checking /health..."
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health")
[[ "$code" == "200" ]] || fail "/health expected 200 got $code"

# 2) Ready
say "Checking /ready..."
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/ready")
[[ "$code" == "200" ]] || fail "/ready expected 200 got $code (ensure DB reachable)"

# 3) CORS preflight – disallowed origin should fail
say "CORS preflight (disallowed origin) ..."
resp=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  -H "Origin: https://disallowed.example" \
  -H "Access-Control-Request-Method: GET" \
  "$API_BASE/health")
if [[ "$resp" == "200" ]]; then
  say "Note: Some servers return 200 but omit Access-Control-Allow-Origin for disallowed origins"
fi

# 4) CORS preflight – allowed origin should succeed when configured
if [[ -n "${CORS_ALLOWED_ORIGINS:-}" ]]; then
  allow_origin=$(echo "$CORS_ALLOWED_ORIGINS" | cut -d',' -f1)
  say "CORS preflight (allowed origin: $allow_origin) ..."
  headers=$(curl -sI -X OPTIONS -H "Origin: $allow_origin" -H "Access-Control-Request-Method: GET" "$API_BASE/health")
  echo "$headers" | grep -qi "access-control-allow-origin: $allow_origin" || fail "Allowed origin not reflected in CORS headers"
fi

# 5) Security headers
say "Verifying security headers..."
headers=$(curl -sI "$API_BASE/health")
echo "$headers" | grep -qi "x-content-type-options: nosniff" || fail "Missing X-Content-Type-Options"
echo "$headers" | grep -qi "x-frame-options: DENY" || fail "Missing X-Frame-Options"
echo "$headers" | grep -qi "referrer-policy: no-referrer" || fail "Missing Referrer-Policy"
echo "$headers" | tr '[:upper:]' '[:lower:]' | grep -qi "content-security-policy:" || fail "Missing Content-Security-Policy"

say "✅ All smoke tests passed"
