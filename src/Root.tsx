import { Composition } from "remotion";
import { Test } from "./Test";

export const RemotionRoot = () => (
  <Composition id="Test" component={Test} durationInFrames={240} fps={30} width={1080} height={1920} />
);
