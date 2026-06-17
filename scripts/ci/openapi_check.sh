#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")"/../.. && pwd)

# Build if not built
if [ ! -d "$ROOT/Backend/dist" ]; then
  (cd "$ROOT/Backend" && npm ci && npm run build)
fi

node -e "
const doc = require('$ROOT/Backend/dist/openapi/spec.js').getOpenApiDocument();
if (!doc.openapi) { console.error('Missing openapi field'); process.exit(1); }
if (!doc.info || !doc.paths) { console.error('Missing info/paths'); process.exit(1); }
console.log('OpenAPI OK:', doc.openapi, doc.info.title);
"

