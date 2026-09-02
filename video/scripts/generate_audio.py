# /// script
# requires-python = ">=3.11"
# dependencies = ["kokoro>=0.9.4", "soundfile", "numpy"]
# ///
"""
Generate narration clips with Kokoro-82M (local, open-weight TTS).

    uv run scripts/generate_audio.py                    # full narration.json
    uv run scripts/generate_audio.py --voice am_michael
    uv run scripts/generate_audio.py --samples          # one line in several voices

Writes 24 kHz mono WAVs to public/audio/ plus a durations.json manifest that
the Remotion composition uses to size each audio sequence.
"""

import argparse
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

import numpy as np
import soundfile as sf
from kokoro import KPipeline

SAMPLE_RATE = 24000
ROOT = Path(__file__).resolve().parents[1]

SAMPLE_VOICES = ["af_heart", "af_bella", "af_nicole", "bf_emma", "am_michael", "bm_george"]
SAMPLE_LINE = (
    "Welcome to droid. An interactive tutorial where you build a database "
    "engine from scratch, one stage at a time."
)


def synth(pipeline, text, voice, speed):
    chunks = [audio for _, _, audio in pipeline(text, voice=voice, speed=speed)]
    return np.concatenate(chunks) if len(chunks) > 1 else chunks[0]


def pipeline_for(voice):
    # Kokoro voice prefixes: a* = American English, b* = British English
    return KPipeline(lang_code=voice[0], repo_id="hexgrad/Kokoro-82M")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", help="override the voice in narration.json")
    ap.add_argument("--speed", type=float, help="override the speed in narration.json")
    ap.add_argument("--out", default="public/audio")
    ap.add_argument("--samples", action="store_true", help="render voice comparison samples")
    args = ap.parse_args()

    if args.samples:
        out_dir = ROOT / "public" / "audio-samples"
        out_dir.mkdir(parents=True, exist_ok=True)
        print("Rendering voice samples...\n")
        for voice in SAMPLE_VOICES:
            audio = synth(pipeline_for(voice), SAMPLE_LINE, voice, args.speed or 1.0)
            sf.write(out_dir / f"{voice}.wav", audio, SAMPLE_RATE)
            print(f"  ✓ {voice}.wav  ({len(audio) / SAMPLE_RATE:.2f}s)")
        print(f"\nSamples in {out_dir}")
        return

    spec = json.loads((ROOT / "narration.json").read_text())
    voice = args.voice or spec["voice"]
    speed = args.speed or spec.get("speed", 1.0)

    out_dir = ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Generating narration with Kokoro-82M [{voice} @ {speed}x]\n")
    pipeline = pipeline_for(voice)
    durations = {}

    for clip in spec["clips"]:
        name, text = clip["name"], clip["text"]
        audio = synth(pipeline, text, voice, speed)
        sf.write(out_dir / f"{name}.wav", audio, SAMPLE_RATE)
        durations[name] = round(len(audio) / SAMPLE_RATE, 3)
        print(f"  ✓ {name}.wav  ({durations[name]}s)")

    # Drop clips left behind by a renamed or deleted line, so public/audio
    # always mirrors narration.json exactly.
    for stale in out_dir.glob("*.wav"):
        if stale.stem not in durations:
            stale.unlink()
            print(f"  - removed stale {stale.name}")

    manifest = {"voice": voice, "speed": speed, "durations": durations}
    (out_dir / "durations.json").write_text(json.dumps(manifest, indent=2) + "\n")

    print(f"\nDone. {len(durations)} clips in {out_dir}")
    print(f"Total narration: {sum(durations.values()):.1f}s")


if __name__ == "__main__":
    sys.exit(main())
