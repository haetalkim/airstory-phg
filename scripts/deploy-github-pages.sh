#!/usr/bin/env bash
# gh-pages caches its clone under node_modules/.cache by default. Git then
# treats that path as inside the parent repo's ignored node_modules and uses
# the wrong .git — `git add` fails with "node_modules" ignored. Use a cache
# outside the project instead (see find-cache-dir CACHE_DIR).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CACHE_DIR="${CACHE_DIR:-${TMPDIR:-/tmp}/tamguingAIR-gh-pages-cache}"
cd "$ROOT"
npx gh-pages -d build --nojekyll "$@"
