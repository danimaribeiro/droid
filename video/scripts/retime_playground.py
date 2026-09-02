#!/usr/bin/env python3
"""
Encode the screencast capture into public/playground.mp4, stretching each
recorded phase to the length of the narration line that describes it.

The recording and the narration are produced independently, and their pacing
never matches: browsing files takes four seconds on screen but six to narrate,
while stepping through results takes ten on screen and nine to narrate. Playing
the whole clip at one rate therefore drifts — the file-explorer line lands over
the login modal. Warping phase by phase keeps them locked instead.

Each phase in `marks` is mapped to the narration clip carrying the same
`anchor`, and its frames are held proportionally longer or shorter so the phase
lasts exactly as long as that line (plus the gap that follows it).

    python3 scripts/retime_playground.py [path/to/playground-capture.json]
"""

import json
import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
COMPOSITOR = ROOT / "node_modules/@remotion/compositor-darwin-arm64"

# Must match the constants in src/timeline.js.
LEAD_IN, GAP, TAIL = 0.4, 0.6, 0.6
FPS = 30


def ffmpeg():
    bundled = COMPOSITOR / "ffmpeg"
    return str(bundled) if bundled.exists() else "ffmpeg"


def phase_targets(marks, clips, durations):
    """Target on-screen seconds for each recorded phase."""
    by_anchor = {c["anchor"]: c for c in clips if c.get("anchor")}
    missing = [m["name"] for m in marks if m["name"] not in by_anchor]
    if missing:
        raise SystemExit(
            f"No narration clip anchored to: {', '.join(missing)}.\n"
            "Add an \"anchor\" to the matching clip in narration.json."
        )

    targets = []
    for i, mark in enumerate(marks):
        clip = by_anchor[mark["name"]]
        span = durations[clip["name"]] + GAP
        if i == 0:
            span += LEAD_IN  # the scene opens on a beat of silence
        if i == len(marks) - 1:
            span += TAIL - GAP
        targets.append(span)
    return targets


def warp(capture, targets):
    """Map every frame's timestamp through the piecewise-linear phase warp."""
    marks = capture["marks"]
    bounds = [m["at"] for m in marks] + [capture["duration"]]

    # Where each phase starts once stretched.
    out_starts, acc = [], 0.0
    for t in targets:
        out_starts.append(acc)
        acc += t
    total = acc

    warped = []
    for frame in capture["frames"]:
        at = frame["at"]
        # Find the phase this frame belongs to.
        i = max(j for j in range(len(marks)) if bounds[j] <= at) if at >= bounds[0] else 0
        span = bounds[i + 1] - bounds[i]
        progress = (at - bounds[i]) / span if span > 0 else 0.0
        warped.append((frame["file"], out_starts[i] + progress * targets[i]))

    return warped, total


def main():
    capture_path = pathlib.Path(
        sys.argv[1]
        if len(sys.argv) > 1
        else ROOT / "../e2e/video-recordings/playground-capture.json"
    ).resolve()
    if not capture_path.exists():
        raise SystemExit(
            f"No capture at {capture_path}.\n"
            "Record one first: cd ../e2e && node record-showcase.js"
        )

    capture = json.loads(capture_path.read_text())
    narration = json.loads((ROOT / "narration.json").read_text())
    durations = json.loads((ROOT / "public/audio/durations.json").read_text())["durations"]

    clips = [c for c in narration["clips"] if c["scene"] == "playground"]
    targets = phase_targets(capture["marks"], clips, durations)
    warped, total = warp(capture, targets)

    print(f"Capture: {capture['duration']:.2f}s → {total:.2f}s to match narration\n")
    for mark, target in zip(capture["marks"], targets):
        idx = capture["marks"].index(mark)
        bounds = [m["at"] for m in capture["marks"]] + [capture["duration"]]
        src = bounds[idx + 1] - bounds[idx]
        print(f"  {mark['name']:11} {src:5.2f}s → {target:5.2f}s  ({target / src:.2f}x)")

    # One encode, straight from the captured frames — no intermediate video, so
    # nothing is transcoded twice.
    listing = ROOT / "public/.playground-frames.txt"
    lines = ["ffconcat version 1.0"]
    for i, (file, at) in enumerate(warped):
        nxt = warped[i + 1][1] if i + 1 < len(warped) else total
        lines.append(f"file '{file}'")
        lines.append(f"duration {max(1.0 / FPS, nxt - at):.4f}")
    lines.append(f"file '{warped[-1][0]}'")
    listing.write_text("\n".join(lines) + "\n")

    out = ROOT / "public/playground.mp4"
    env = {**os.environ, "DYLD_LIBRARY_PATH": str(COMPOSITOR)}
    result = subprocess.run(
        [ffmpeg(), "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
         "-fps_mode", "cfr", "-r", str(FPS),
         "-c:v", "libx264", "-preset", "slow", "-crf", "16",
         "-pix_fmt", "yuv420p", "-vf", "scale=1920:1080", str(out)],
        env=env, capture_output=True, text=True,
    )
    listing.unlink(missing_ok=True)
    if result.returncode != 0:
        raise SystemExit(f"ffmpeg failed:\n{result.stderr[-1500:]}")

    (ROOT / "public/playground.json").write_text(
        json.dumps({"duration": round(total, 3), "retimed": True}, indent=2) + "\n"
    )

    frames_dir = pathlib.Path(warped[0][0]).parent
    shutil.rmtree(frames_dir, ignore_errors=True)

    mb = out.stat().st_size / 1024 / 1024
    print(f"\nWrote public/playground.mp4 ({total:.2f}s, {mb:.1f} MB), phase-locked to narration")


if __name__ == "__main__":
    main()
