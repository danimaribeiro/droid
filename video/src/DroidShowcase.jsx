import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ApiScene,
  FlowScene,
  JobScene,
  ModelScene,
  PistonScene,
  StackScene,
  SubmissionScene,
  TestsScene,
  TransitionCard,
} from "./BackendScenes";
import {
  clips,
  clipsInScene,
  frames,
  playgroundPlaybackRate,
  scenes,
} from "./timeline";

const FADE = 10;

function TitleCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 20, mass: 0.8 } });
  const subSpring = spring({ frame: frame - 12, fps, config: { damping: 20, mass: 0.8 } });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #3d1f5c 0%, #2a1445 25%, #1a0e30 50%, #2d1248 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-15%",
          width: "65%",
          height: "75%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(230,100,140,0.25) 0%, transparent 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "50%",
          height: "55%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(240,170,110,0.18) 0%, transparent 55%)",
        }}
      />
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 20,
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          Introducing
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "white",
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
          }}
        >
          droid
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.65)",
            marginTop: 16,
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: Math.max(0, subSpring),
            transform: `translateY(${interpolate(Math.max(0, subSpring), [0, 1], [20, 0])}px)`,
          }}
        >
          Build a Database Engine from Scratch
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ScreenshotScene({ src, label }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const captionSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 20, mass: 0.6 },
  });
  const scale = interpolate(frame, [0, 300], [1.03, 1.0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0f0a1a" }}>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", padding: 36 }}
      >
        <div
          style={{
            // Stills are captured 16:9 at the composition's ratio, so the frame
            // matches them exactly and nothing gets cropped.
            height: 930,
            aspectRatio: "16 / 9",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(100,60,180,0.15)",
            border: "1px solid rgba(255,255,255,0.08)",
            transform: `scale(${scale})`,
          }}
        >
          <Img
            src={staticFile(`frames/${src}`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </AbsoluteFill>

      {label && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: captionSpring,
            transform: `translateY(${interpolate(captionSpring, [0, 1], [12, 0])}px)`,
          }}
        >
          <div
            style={{
              background: "rgba(15, 10, 26, 0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "10px 28px",
              fontSize: 20,
              fontWeight: 600,
              color: "white",
              fontFamily: "Inter, system-ui, sans-serif",
              letterSpacing: 0.5,
            }}
          >
            {label}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

function PlaygroundScene() {
  const frame = useCurrentFrame();

  // Captions track the narration: each badge is on screen for its clip.
  const captions = clipsInScene("playground").map((clip) => ({
    text: clip.caption,
    start: frames(clip.sceneOffset),
    end: frames(clip.sceneOffset + clip.duration),
  }));

  const currentCaption = captions.find(
    (c) => frame >= c.start && frame < c.end
  );

  return (
    <AbsoluteFill style={{ background: "#0f0a1a" }}>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", padding: 20 }}
      >
        <div
          style={{
            // 16:9, matching the recording, so the frame crops nothing.
            height: 960,
            aspectRatio: "16 / 9",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(100,60,180,0.15)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <OffthreadVideo
            src={staticFile("playground.mp4")}
            playbackRate={playgroundPlaybackRate}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </AbsoluteFill>

      {currentCaption && (
        <CaptionBadge
          text={currentCaption.text}
          key={currentCaption.text}
          frame={frame - currentCaption.start}
          durationInFrames={currentCaption.end - currentCaption.start}
        />
      )}
    </AbsoluteFill>
  );
}

function CaptionBadge({ text, frame, durationInFrames }) {
  const opacity = interpolate(
    frame,
    [0, FADE, durationInFrames - FADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(15, 10, 26, 0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "8px 24px",
          fontSize: 18,
          fontWeight: 600,
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: 0.5,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function OutroCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 18, mass: 0.8 } });
  const subSpring = spring({ frame: frame - 12, fps, config: { damping: 18, mass: 0.8 } });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #3d1f5c 0%, #1a0e30 50%, #2d1248 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "10%",
          width: "55%",
          height: "60%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(140,80,220,0.2) 0%, transparent 55%)",
        }}
      />
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "white",
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          Thank You
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            marginTop: 16,
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: Math.max(0, subSpring),
            transform: `translateY(${interpolate(Math.max(0, subSpring), [0, 1], [20, 0])}px)`,
          }}
        >
          Questions?
        </div>
      </div>
    </AbsoluteFill>
  );
}

function FadeTransition({ durationInFrames, children }) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, FADE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - FADE, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
}

const BACKEND_SCENES = [
  ["transition", TransitionCard],
  ["stack", StackScene],
  ["flow", FlowScene],
  ["model", ModelScene],
  ["submission", SubmissionScene],
  ["job", JobScene],
  ["api", ApiScene],
  ["piston", PistonScene],
  ["tests", TestsScene],
];

export const DroidShowcase = () => {
  const scene = (id) => ({
    from: frames(scenes[id].start),
    durationInFrames: frames(scenes[id].duration),
  });

  return (
    <AbsoluteFill style={{ background: "#0f0a1a" }}>
      {/* Intro title card */}
      <Sequence {...scene("intro")}>
        <FadeTransition durationInFrames={frames(scenes.intro.duration)}>
          <TitleCard />
        </FadeTransition>
      </Sequence>

      {/* Homepage screenshot */}
      <Sequence {...scene("homepage")}>
        <FadeTransition durationInFrames={frames(scenes.homepage.duration)}>
          <ScreenshotScene
            src="000-homepage-hero.png"
            label="12-Stage Curriculum"
          />
        </FadeTransition>
      </Sequence>

      {/* Stage page screenshot */}
      <Sequence {...scene("stage")}>
        <FadeTransition durationInFrames={frames(scenes.stage.duration)}>
          <ScreenshotScene src="001-stage-page.png" label="Tutorial Lessons" />
        </FadeTransition>
      </Sequence>

      {/* Playground video — the main event */}
      <Sequence {...scene("playground")}>
        <FadeTransition durationInFrames={frames(scenes.playground.duration)}>
          <PlaygroundScene />
        </FadeTransition>
      </Sequence>

      {/* "How it was built" — backend walkthrough */}
      {BACKEND_SCENES.map(([id, Component]) => (
        <Sequence key={id} {...scene(id)}>
          <FadeTransition durationInFrames={frames(scenes[id].duration)}>
            <Component />
          </FadeTransition>
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence {...scene("outro")}>
        <FadeTransition durationInFrames={frames(scenes.outro.duration)}>
          <OutroCard />
        </FadeTransition>
      </Sequence>

      {/* Narration — each clip sized to its rendered audio */}
      {clips.map((clip) => (
        <Sequence
          key={clip.name}
          from={frames(clip.start)}
          durationInFrames={frames(clip.duration)}
        >
          <Audio src={staticFile(`audio/${clip.name}.wav`)} volume={0.9} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
