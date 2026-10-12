import { Composition } from "remotion";
import { Test } from "./Test";
import { FPS, totalFrames, Video } from "./Video";
import { BilimVideo, bilimSure } from "./bilim/BilimVideo";
import { BilimKapak } from "./bilim/Kapak";

export const RemotionRoot = () => (
  <>
    <Composition id="Kuantum" component={Video} durationInFrames={totalFrames()} fps={FPS} width={1080} height={1920} />
    <Composition id="Test" component={Test} durationInFrames={240} fps={30} width={1080} height={1920} />
    <Composition id="Bilim" component={BilimVideo} durationInFrames={bilimSure()} fps={30} width={1080} height={1920} />
    <Composition id="BilimKapak" component={BilimKapak} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
