#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE:-http://localhost:3037}
LT_DURATION=${LT_DURATION:-10}
LT_CONNECTIONS=${LT_CONNECTIONS:-50}
LT_P95_MS=${LT_P95_MS:-500}

REP_READ_URL=${REP_READ_URL:-$API_BASE/health}
CREATE_URL=${CREATE_URL:-}

say() { echo -e "[load] $*"; }
fail() { echo -e "[load] ❌ $*" >&2; exit 1; }

have_autocannon() {
  command -v autocannon >/dev/null 2>&1 && return 0
  command -v npx >/dev/null 2>&1 || return 1
  return 0
}

run_ac_json() {
  local url="$1"
  local outfile="$2"
  if command -v autocannon >/dev/null 2>&1; then
    autocannon -c "$LT_CONNECTIONS" -d "$LT_DURATION" --json "$url" > "$outfile"
  else
    npx --yes autocannon -c "$LT_CONNECTIONS" -d "$LT_DURATION" --json "$url" > "$outfile"
  fi
}

need_node() {
  command -v node >/dev/null 2>&1 || fail "Node.js is required to parse results"
}

calc_p95() {
  local file="$1"
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('$file','utf8'));console.log(j.latency&&j.latency.p95?j.latency.p95:0)"
}

say "API_BASE=$API_BASE, duration=${LT_DURATION}s, connections=${LT_CONNECTIONS}, p95 budget=${LT_P95_MS}ms"
have_autocannon || fail "autocannon or npx required"
need_node

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

urls=("$API_BASE/health" "$API_BASE/ready" "$REP_READ_URL")
if [[ -n "$CREATE_URL" ]]; then urls+=("$CREATE_URL"); fi

max_p95=0
for u in "${urls[@]}"; do
  say "Benchmarking $u ..."
  out="$tmpdir/out.json"
  run_ac_json "$u" "$out"
  p95=$(calc_p95 "$out")
  say "p95 for $u: ${p95}ms"
  p95=${p95%.*}
  if (( p95 > max_p95 )); then max_p95=$p95; fi
done

say "Max p95 across routes: ${max_p95}ms"
if (( max_p95 > LT_P95_MS )); then
  fail "p95 exceeded threshold ${LT_P95_MS}ms"
fi

say "✅ Load test within thresholds"
