#!/usr/bin/env bash
# Optional: publish automatically whenever the file changes.
# Run it in a Terminal tab and leave it open:  ./watch.sh
set -uo pipefail
cd "$(dirname "$0")"
echo "Watching $(pwd) — Ctrl-C to stop."
while true; do
  if [[ -n "$(git status --porcelain)" ]]; then
    sleep 3                                  # let the write settle
    git add -A
    git commit -m "Update explainer" >/dev/null 2>&1 && git push >/dev/null 2>&1 \
      && echo "$(date '+%H:%M:%S')  published" \
      || echo "$(date '+%H:%M:%S')  push failed — run ./sync.sh to see why"
  fi
  sleep 20
done
