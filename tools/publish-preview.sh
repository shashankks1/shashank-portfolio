#!/usr/bin/env bash
# Publish the committed website/ folder to the gh-pages branch, which GitHub Pages
# serves as an unlisted review preview. Netlify (the real domain) is unaffected.
#
#   bash tools/publish-preview.sh
#
# Only what is committed on main is published, so commit first. The gh-pages branch is
# rebuilt from scratch each time (force-pushed); never edit it by hand.
set -euo pipefail
cd "$(dirname "$0")/.."

SHA=$(git rev-parse --short HEAD)
REMOTE=$(git remote get-url origin)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Export exactly what main has committed under website/ (no zips, no local settings).
git archive --format=tar HEAD:website | tar -x -C "$TMP"

# Preview only: keep every page out of search engines. The live site never gets this.
find "$TMP" -name '*.html' -print0 | while IFS= read -r -d '' f; do
  grep -q 'name="robots"' "$f" || \
    sed -i 's|<meta charset="utf-8" />|<meta charset="utf-8" />\n  <meta name="robots" content="noindex, nofollow" />|' "$f"
done
touch "$TMP/.nojekyll"   # serve files as-is, skip GitHub's Jekyll step

cd "$TMP"
git init -q -b gh-pages
git add -A
git -c core.safecrlf=false commit -q -m "Preview of main@$SHA"
git push -q -f "$REMOTE" gh-pages
echo "Published main@$SHA to gh-pages"
