/**
 * Single source of truth for the video timeline.
 *
 * Scene and clip start times are derived from the actual rendered narration
 * durations (public/audio/durations.json) rather than hardcoded, so
 * regenerating the audio — or switching Kokoro voices — reflows the video
 * instead of desyncing it.
 */
import narration from "../narration.json";
import manifest from "../public/audio/durations.json";
import playground from "../public/playground.json";

export const FPS = 30;

// Breathing room, in seconds.
const LEAD_IN = 0.4; // silence before a scene's first clip
const GAP = 0.6; // silence between clips inside a scene
const TAIL = 0.6; // silence after a scene's last clip

// Scenes in playback order, with a floor so short narration still gets air.
const SCENES = [
  { id: "intro", minDuration: 6 },
  { id: "homepage", minDuration: 5 },
  { id: "stage", minDuration: 5 },
  { id: "playground", minDuration: 20 },
  // "How it was built" — the backend walkthrough.
  { id: "transition", minDuration: 5 },
  { id: "stack", minDuration: 8 },
  { id: "flow", minDuration: 8 },
  { id: "model", minDuration: 8 },
  { id: "submission", minDuration: 8 },
  { id: "job", minDuration: 8 },
  { id: "api", minDuration: 8 },
  { id: "piston", minDuration: 8 },
  { id: "tests", minDuration: 8 },
  { id: "outro", minDuration: 5 },
];

const durationOf = (name) => {
  const d = manifest.durations[name];
  if (d === undefined) {
    throw new Error(
      `No duration for "${name}". Run ./generate-audio.sh to render the narration.`
    );
  }
  return d;
};

function build() {
  const scenes = {};
  const clips = [];
  let cursor = 0;

  for (const scene of SCENES) {
    const sceneClips = narration.clips.filter((c) => c.scene === scene.id);
    let offset = LEAD_IN;

    for (const clip of sceneClips) {
      const duration = durationOf(clip.name);
      clips.push({
        ...clip,
        duration,
        start: cursor + offset, // absolute, for <Audio>
        sceneOffset: offset, // relative, for captions
      });
      offset += duration + GAP;
    }

    const contentDuration = offset - GAP + TAIL;
    const duration = Math.max(scene.minDuration, contentDuration);

    scenes[scene.id] = { start: cursor, duration };
    cursor += duration;
  }

  return { scenes, clips, totalDuration: cursor };
}

export const { scenes, clips, totalDuration } = build();

export const frames = (seconds) => Math.round(seconds * FPS);

/**
 * The screen recording and the narration are captured independently, so they
 * rarely match in length. Slow (or speed up) the recording so it spans its
 * scene exactly instead of freezing on the last frame or getting cut off.
 */
export const playgroundPlaybackRate =
  playground.duration / scenes.playground.duration;

export const clipsInScene = (sceneId) =>
  clips.filter((c) => c.scene === sceneId);
