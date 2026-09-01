#!/bin/bash
# Narration audio for the droid showcase video, via Kokoro-82M (local TTS).
#   ./generate-audio.sh                 # render narration.json
#   ./generate-audio.sh --voice bf_emma # try a different voice
#   ./generate-audio.sh --samples       # voice comparison samples
set -e
cd "$(dirname "$0")"
exec uv run --quiet scripts/generate_audio.py "$@"
