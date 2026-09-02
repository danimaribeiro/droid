# Showcase video

Remotion project that renders `out/droid-showcase.mp4` — a walkthrough of the
droid playground followed by a section on how the Rails backend is built.

The rendered video and every asset it uses live under `public/` and `out/`,
both gitignored. Everything here is regenerated from the running app, so
rebuilding means bringing the stack up first.

## What's committed

| | |
| --- | --- |
| `narration.json` | The script — every spoken line, its scene, and the phase it's anchored to. Single source of truth. |
| `src/timeline.js` | Derives all scene and clip timings from the rendered audio durations. Nothing is hardcoded. |
| `src/DroidShowcase.jsx` | Composition: intro, stills, playground, outro. |
| `src/BackendScenes.jsx` | The nine backend scenes. |
| `src/Code.jsx` | Small Ruby/Python/bash highlighter for the code panels. |
| `scripts/` | Audio generation, capture retiming, asset inventory. |

## Prerequisites

- **Node** and **uv** (`brew install uv`)
- **espeak-ng** (`brew install espeak-ng`) — Kokoro's fallback grapheme-to-phoneme
- **Docker or Colima** for the app stack. On Apple Silicon, Piston's runtimes are
  x86_64 and its sandbox needs real namespace `clone()` calls, so **Rosetta is
  required** — under QEMU emulation every submission fails with
  `Cannot run proxy, clone failed`:

  ```bash
  softwareupdate --install-rosetta --agree-to-license
  colima start --vm-type=vz --vz-rosetta --cpu 6 --memory 10 --disk 80
  ```

## Rebuilding

```bash
# 1. Bring the stack up (from the repo root). Piston downloads six language
#    runtimes on first boot, which takes a while.
docker compose up -d
cd docs-site && npm install && npm run dev     # serves :3001

# 2. Record the app: intro stills + the playground screencast.
cd e2e && npm install && npx playwright install chromium
node record-showcase.js                        # --frames-only for stills alone

# 3. Narration, assets, render.
cd ../video && npm install
./generate-audio.sh                            # Kokoro-82M -> public/audio
./scripts/prepare-assets.sh                    # -> public/, refreshes ASSETS.md
npm run render                                 # -> out/droid-showcase.mp4
```

Run them in that order: `src/timeline.js` imports the generated
`public/audio/durations.json`, so a render before step 3 fails to resolve it.

After a run, `public/ASSETS.md` lists every asset with its timecode in the
video and how it was produced.

## Changing things

**The script.** Edit `narration.json` and re-run `./generate-audio.sh`. Scene
lengths, clip positions and playground captions all reflow from the new audio
durations — no timings to update by hand. Stale clips from renamed lines are
pruned automatically.

**The voice.** `./generate-audio.sh --samples` renders one line in six Kokoro
voices to `public/audio-samples/`; `--voice bf_emma` switches, or set `voice`
in `narration.json`.

**The recording.** `record-showcase.js` captures over CDP screencast rather than
Playwright's `recordVideo`, which emits VP8 at ~560 kb/s with no bitrate
control. The page renders at 2x and the screencast downsamples to 1080p, so
text is supersampled.

It also marks each phase (`editor`, `files`, `auth`, …) as it happens, and
`scripts/retime_playground.py` stretches each recorded phase to the length of
the line narrating it — the recording and the script are paced very
differently, and at one rate the narration drifts off what's on screen. If a
phase's ratio gets extreme, adjust that phase's `wait()` in the recorder rather
than fighting it in post.
