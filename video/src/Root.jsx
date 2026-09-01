import { Composition } from "remotion";
import { DroidShowcase } from "./DroidShowcase";

const FPS = 30;
const TOTAL_DURATION = 84;

export const RemotionRoot = () => {
  return (
    <Composition
      id="DroidShowcase"
      component={DroidShowcase}
      durationInFrames={TOTAL_DURATION * FPS}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
