#!/bin/bash
# Move captured assets into public/ for the composition.
#
#   1. the intro stills, copied through as captured (already 16:9 at 2x)
#   2. the playground screencast, encoded from its captured frames and
#      phase-locked to the narration by retime_playground.py
#   3. a refreshed public/ASSETS.md inventory
#
# Record first:  cd ../e2e && node record-showcase.js
# Then:          ./scripts/prepare-assets.sh
set -e
cd "$(dirname "$0")/.."

CAPTURE="${1:-../e2e/video-recordings/playground-capture.json}"
if [ ! -f "$CAPTURE" ]; then
  echo "No capture at $CAPTURE — run: cd ../e2e && node record-showcase.js" >&2
  exit 1
fi

mkdir -p public/frames
for frame in 000-homepage-hero 001-stage-page; do
  cp "../e2e/video-frames/${frame}.png" "public/frames/${frame}.png"
  echo "Copied public/frames/${frame}.png"
done
echo ""

python3 scripts/retime_playground.py "$CAPTURE"
echo ""
python3 scripts/write_assets_doc.py
