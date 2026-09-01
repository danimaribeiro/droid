import { Composition } from "remotion";
import { DroidShowcase } from "./DroidShowcase";
import { FPS, frames, totalDuration } from "./timeline";

export const RemotionRoot = () => {
  return (
    <Composition
      id="DroidShowcase"
      component={DroidShowcase}
      durationInFrames={frames(totalDuration)}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
