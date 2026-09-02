#!/usr/bin/env python3
"""Regenerate public/ASSETS.md — the inventory of everything the video uses."""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEAD, GAP, TAIL = 0.4, 0.6, 0.6
SCENES = [("intro", 6), ("homepage", 5), ("stage", 5), ("playground", 20),
          ("transition", 5), ("stack", 8), ("flow", 8), ("model", 8),
          ("submission", 8), ("job", 8), ("api", 8), ("piston", 8),
          ("tests", 8), ("outro", 5)]


def ts(s):
    return f"{int(s // 60)}:{s % 60:05.2f}"


def build():
    n = json.loads((ROOT / "narration.json").read_text())
    m = json.loads((ROOT / "public/audio/durations.json").read_text())
    pg = json.loads((ROOT / "public/playground.json").read_text())

    rows, cur = [], 0.0
    for sid, mn in SCENES:
        cs = [c for c in n["clips"] if c["scene"] == sid]
        off, starts = LEAD, []
        for c in cs:
            starts.append((c, cur + off))
            off += m["durations"][c["name"]] + GAP
        dur = max(mn, off - GAP + TAIL) if cs else mn
        rows.append((sid, cur, cur + dur, starts))
        cur += dur

    pg_scene = next(r for r in rows if r[0] == "playground")
    rate = pg["duration"] / (pg_scene[2] - pg_scene[1])

    L = ["# Video assets", "",
         "Everything `src/` references at render time, and nothing else — "
         "`generate_audio.py`",
         "prunes stale clips, so this folder is exactly the set used by "
         f"`../out/droid-showcase.mp4` ({ts(cur)}).", "",
         "Regenerate: `./generate-audio.sh`, then `./scripts/prepare-assets.sh`, "
         "then `npm run render`.",
         "Rebuild this file: `python3 scripts/write_assets_doc.py` (stdlib only).", "",
         "## Screen capture", "",
         "| File | Role | Source | Notes |", "| --- | --- | --- | --- |",
         f"| `playground.mp4` | Product walkthrough, {ts(pg_scene[1])}–{ts(pg_scene[2])} | "
         "`e2e/record-showcase.js` | Captured over CDP screencast: the page renders at "
         "3840x2160 (deviceScaleFactor 2) and the screencast downscales to 1920x1080, so "
         "text is supersampled. Frames are JPEG q100, encoded once at x264 CRF 16 and "
         "remuxed — never transcoded twice. |",
         f"| `playground.json` | Measured duration ({pg['duration']:.2f}s) | "
         "`scripts/prepare-assets.sh` | The timeline slows playback to "
         f"{rate:.3f}x so the clip spans its scene instead of freezing on the last frame. |",
         f"| `frames/000-homepage-hero.png` | Homepage still, {ts(rows[1][1])}–{ts(rows[1][2])} | "
         "`record-showcase.js --frames-only` | 3840x2160, 16:9 at 2x — matches the "
         "composition frame, shown uncropped. |",
         f"| `frames/001-stage-page.png` | Stage page still, {ts(rows[2][1])}–{ts(rows[2][2])} | "
         "same | same |", "",
         "## Narration", "",
         f"Kokoro-82M, voice `{m['voice']}` at {m['speed']}x, 24 kHz mono. Text lives in "
         "`../narration.json`;",
         "`durations.json` is written by the generator and drives every scene boundary.", "",
         "| Start | File | Length | Scene | Line |", "| --- | --- | --- | --- | --- |"]

    for sid, s0, s1, starts in rows:
        for c, st in starts:
            text = c["text"] if len(c["text"]) <= 88 else c["text"][:85] + "..."
            L.append(f"| {ts(st)} | `audio/{c['name']}.wav` | "
                     f"{m['durations'][c['name']]:.2f}s | {sid} | {text} |")

    L += ["", "## Drawn in code", "",
          "No assets to swap out for these — they live in `src/BackendScenes.jsx` "
          "and `src/DroidShowcase.jsx`:", ""]
    for sid, s0, s1, starts in rows:
        if sid not in ("playground", "homepage", "stage"):
            L.append(f"- **{sid}** {ts(s0)}-{ts(s1)}")
    L.append("")

    (ROOT / "public/ASSETS.md").write_text("\n".join(L) + "\n")
    print(f"wrote public/ASSETS.md ({len(L)} lines)")


if __name__ == "__main__":
    build()
