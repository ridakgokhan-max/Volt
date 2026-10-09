import { Composition } from "remotion";
import { Test } from "./Test";
import { FPS, totalFrames, Video } from "./Video";

export const RemotionRoot = () => (
  <>
    <Composition id="Kuantum" component={Video} durationInFrames={totalFrames()} fps={FPS} width={1080} height={1920} />
    <Composition id="Test" component={Test} durationInFrames={240} fps={30} width={1080} height={1920} />
  </>
);
