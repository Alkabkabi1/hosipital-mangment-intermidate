#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE:-http://localhost:3037}
F_CONCURRENCY=${F_CONCURRENCY:-5}
F_TOTAL=${F_TOTAL:-50}
F_DURATION_S=${F_DURATION_S:-0}

echo "[run_flows] API_BASE=$API_BASE CONC=$F_CONCURRENCY TOTAL=$F_TOTAL DURATION_S=$F_DURATION_S"
node scripts/ops/load_flows.js

