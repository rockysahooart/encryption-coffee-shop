#!/usr/bin/env bash
# Commit and push whatever changed, then let GitHub Pages redeploy.
set -euo pipefail
cd "$(dirname "$0")"
if [[ -z "$(git status --porcelain)" ]]; then
  echo "Nothing to publish — no changes."
  exit 0
fi
git add -A
git commit -m "${1:-Update explainer}"
git push
echo
echo "Pushed. GitHub Pages usually redeploys within a minute."
