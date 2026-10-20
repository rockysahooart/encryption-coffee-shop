#!/usr/bin/env bash
# The mechanical half of "ship it" (see CLAUDE.md). Two steps, so the source
# diff can be read in between:
#
#   ./ship.sh check            rebuild, run the smoke suite, show what would ship
#   ./ship.sh push "message"   commit exactly what passed check, push, confirm the deploy
#
# Both refuse to run off main, behind origin/main, with untracked files, or with
# changes outside src/, tools/, index.html, ship.sh, .gitignore and *.md.
# Set SHIP_ALLOW_OTHER=1 to allow a change elsewhere on purpose.
set -euo pipefail
cd "$(dirname "$0")"

die() { echo "ship: $*" >&2; exit 1; }
fingerprint() { git diff HEAD --binary | shasum -a 256 | cut -d' ' -f1; }

preflight() {
  [[ "$(git branch --show-current)" == main ]] || die "not on main"
  git fetch -q origin main
  [[ "$(git rev-list --count HEAD..origin/main)" == 0 ]] || die "behind origin/main; pull first"
  local untracked; untracked="$(git ls-files --others --exclude-standard)"
  [[ -z "$untracked" ]] || die "untracked files (git add them, or ignore them):"$'\n'"$untracked"
  local other; other="$(git diff HEAD --name-only | grep -vE '^(src/|tools/|index\.html$|ship\.sh$|\.gitignore$|[^/]*\.md$)' || true)"
  [[ -z "$other" || "${SHIP_ALLOW_OTHER:-}" == 1 ]] || die "changes outside the usual scope:"$'\n'"$other"
}

build() {
  (cd src && ./make.sh)
  # the deployed file must come from source: a change to it alone means drift
  if ! git diff HEAD --quiet -- index.html && git diff HEAD --quiet -- src; then
    die "index.html differs from HEAD but src/ does not; the build is not reproducing the committed file"
  fi
}

case "${1:-}" in
  check)
    preflight
    build
    (cd tools && node smoke.js) || die "smoke suite found a regression; see above"
    echo
    git --no-pager diff HEAD --stat
    echo
    echo "next: read the source diff (git diff HEAD -- . ':!index.html'), then ./ship.sh push \"message\""
    ;;

  push)
    [[ -n "${2:-}" ]] || die 'usage: ./ship.sh push "message"'
    preflight
    git diff HEAD --quiet && die "nothing to ship"
    before="$(fingerprint)"
    build
    [[ "$(fingerprint)" == "$before" ]] || die "rebuilding changed index.html; run ./ship.sh check again"
    node -e '
      const r = require("./tools/.smoke/last.json");
      if (!r.pass) { console.error("ship: the last smoke run did not pass"); process.exit(1); }
      if (r.fingerprint !== process.argv[1]) { console.error("ship: the tree changed since the last ./ship.sh check"); process.exit(1); }
    ' "$before" 2>/dev/null || die "no passing ./ship.sh check for exactly this tree"

    git add -u
    git commit -q -m "$2"
    sha="$(git rev-parse HEAD)"
    git push -q origin main
    git fetch -q origin main
    [[ "$(git rev-parse origin/main)" == "$sha" ]] || die "pushed, but origin/main is not $sha"
    echo "pushed $sha"

    # GitHub Pages builds main on push; wait for the build of this commit
    if command -v gh >/dev/null && repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)"; then
      for _ in $(seq 1 24); do
        read -r status commit < <(gh api "repos/$repo/pages/builds/latest" -q '.status + " " + .commit' 2>/dev/null || echo "? ?")
        if [[ "$commit" == "$sha" && "$status" == built ]]; then echo "pages: built $sha"; exit 0; fi
        if [[ "$commit" == "$sha" && "$status" == errored ]]; then die "pages build errored for $sha"; fi
        sleep 5
      done
      echo "pages: no finished build for $sha after 2 minutes; check https://github.com/$repo/deployments"
    else
      echo "pages: gh not available; the push to main triggers the deploy"
    fi
    ;;

  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
