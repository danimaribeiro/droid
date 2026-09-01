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
            width: "94%",
            height: "84%",
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
              objectPosition: "top left",
            }}
          />
        </div>
      </AbsoluteFill>

      {label && (
        <div
          style={{
            position: "absolute",
            bottom: 38,
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

  const captions = [
    { start: 0, end: 6 * 30, text: "Code Editor" },
    { start: 6 * 30, end: 11 * 30, text: "File Explorer" },
    { start: 11 * 30, end: 16 * 30, text: "Sign In" },
    { start: 16 * 30, end: 21 * 30, text: "Authenticated" },
    { start: 21 * 30, end: 29 * 30, text: "Browsing Code" },
    { start: 29 * 30, end: 36 * 30, text: "Running Tests" },
    { start: 36 * 30, end: 44 * 30, text: "Test Results" },
    { start: 44 * 30, end: 51 * 30, text: "Writing Code" },
    { start: 51 * 30, end: 59 * 30, text: "Multi-Language" },
  ];

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
            width: "96%",
            height: "88%",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(100,60,180,0.15)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <OffthreadVideo
            src={staticFile("playground.mp4")}
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
        />
      )}
    </AbsoluteFill>
  );
}

function CaptionBadge({ text, frame }) {
  const opacity = interpolate(frame, [0, FADE, 150, 150 + FADE], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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

export const DroidShowcase = () => {
  const { fps } = useVideoConfig();

  // Timeline (seconds)
  const introStart = 0;
  const introDur = 7.5;

  const homepageStart = introDur;
  const homepageDur = 6.5;

  const stageStart = homepageStart + homepageDur;
  const stageDur = 6.5;

  const playgroundStart = stageStart + stageDur;
  const playgroundDur = 59;

  const outroStart = playgroundStart + playgroundDur;
  const outroDur = 5;

  // Audio timeline — narration clips synced to scenes
  const audioTimeline = [
    { file: "01-intro.mp3", start: 0.3 },
    { file: "02-homepage.mp3", start: homepageStart + 0.3 },
    { file: "03-stage.mp3", start: stageStart + 0.3 },
    { file: "04-editor-loads.mp3", start: playgroundStart + 0.3 },
    { file: "05-browse-files.mp3", start: playgroundStart + 6.5 },
    { file: "06-auth.mp3", start: playgroundStart + 11.5 },
    { file: "07-login.mp3", start: playgroundStart + 16.5 },
    { file: "08-browse-logged-in.mp3", start: playgroundStart + 21 },
    { file: "09-submit.mp3", start: playgroundStart + 29.5 },
    { file: "10-results.mp3", start: playgroundStart + 36.5 },
    { file: "11-typing.mp3", start: playgroundStart + 45 },
    { file: "12-languages.mp3", start: playgroundStart + 52 },
    { file: "13-outro.mp3", start: outroStart + 0.3 },
  ];

  return (
    <AbsoluteFill style={{ background: "#0f0a1a" }}>
      {/* Intro title card */}
      <Sequence
        from={Math.round(introStart * fps)}
        durationInFrames={Math.round(introDur * fps)}
      >
        <FadeTransition durationInFrames={Math.round(introDur * fps)}>
          <TitleCard />
        </FadeTransition>
      </Sequence>

      {/* Homepage screenshot */}
      <Sequence
        from={Math.round(homepageStart * fps)}
        durationInFrames={Math.round(homepageDur * fps)}
      >
        <FadeTransition durationInFrames={Math.round(homepageDur * fps)}>
          <ScreenshotScene
            src="000-homepage-hero.png"
            label="12-Stage Curriculum"
          />
        </FadeTransition>
      </Sequence>

      {/* Stage page screenshot */}
      <Sequence
        from={Math.round(stageStart * fps)}
        durationInFrames={Math.round(stageDur * fps)}
      >
        <FadeTransition durationInFrames={Math.round(stageDur * fps)}>
          <ScreenshotScene
            src="001-stage-page.png"
            label="Tutorial Lessons"
          />
        </FadeTransition>
      </Sequence>

      {/* Playground video — the main event (~59s, 80% of video) */}
      <Sequence
        from={Math.round(playgroundStart * fps)}
        durationInFrames={Math.round(playgroundDur * fps)}
      >
        <FadeTransition durationInFrames={Math.round(playgroundDur * fps)}>
          <PlaygroundScene />
        </FadeTransition>
      </Sequence>

      {/* Outro */}
      <Sequence
        from={Math.round(outroStart * fps)}
        durationInFrames={Math.round(outroDur * fps)}
      >
        <FadeTransition durationInFrames={Math.round(outroDur * fps)}>
          <OutroCard />
        </FadeTransition>
      </Sequence>

      {/* Narration audio */}
      {audioTimeline.map((clip, i) => (
        <Sequence
          key={i}
          from={Math.round(clip.start * fps)}
          durationInFrames={Math.round(10 * fps)}
        >
          <Audio src={staticFile(`audio/${clip.file}`)} volume={0.9} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
