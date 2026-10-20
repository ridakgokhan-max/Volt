import { Composition } from "remotion";
import { Test } from "./Test";
import { FPS, totalFrames, Video } from "./Video";
import { BilimVideo, bilimSure } from "./bilim/BilimVideo";
import { BilimKapak } from "./bilim/Kapak";
import { CtaDemo, CTA_DEMO_SURE } from "./bilim/Cta";
import { ComfyDemo, COMFY_DEMO_SURE } from "./bilim/ComfyDemo";
import { TARZ_KARE } from "./bilim/tarz/ortak";
import { TarzDefter } from "./bilim/tarz/Defter";
import { TarzKagit } from "./bilim/tarz/Kagit";
import { TarzPoster } from "./bilim/tarz/Poster";

export const RemotionRoot = () => (
  <>
    <Composition id="Kuantum" component={Video} durationInFrames={totalFrames()} fps={FPS} width={1080} height={1920} />
    <Composition id="Test" component={Test} durationInFrames={240} fps={30} width={1080} height={1920} />
    <Composition id="Bilim" component={BilimVideo} durationInFrames={bilimSure()} fps={30} width={1080} height={1920} />
    <Composition id="TarzDefter" component={TarzDefter} durationInFrames={TARZ_KARE} fps={30} width={1080} height={1920} />
    <Composition id="TarzKagit" component={TarzKagit} durationInFrames={TARZ_KARE} fps={30} width={1080} height={1920} />
    <Composition id="TarzPoster" component={TarzPoster} durationInFrames={TARZ_KARE} fps={30} width={1080} height={1920} />
    <Composition id="ComfyDemo" component={ComfyDemo} durationInFrames={COMFY_DEMO_SURE * 30} fps={30} width={1080} height={1920} />
    <Composition id="CtaDemo" component={CtaDemo} durationInFrames={CTA_DEMO_SURE * 30} fps={30} width={1080} height={1920} />
    <Composition id="BilimKapak" component={BilimKapak} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
