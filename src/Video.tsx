import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import timeline from "./timeline.json";
import { H, PaperBg, W } from "./kit";
import { SCENES } from "./scenes";

const { fontFamily } = loadFont();

export const FPS = 30;
type Word = { text: string; start: number; end: number };
type Scene = { id: string; audio: string | null; duration: number; words: Word[] };
const scenes = (timeline as { scenes: Scene[] }).scenes;

export const totalFrames = () => scenes.reduce((a, s) => a + Math.ceil(s.duration * FPS), 0);

const SceneView: React.FC<{ sc: Scene; dur: number; idx: number }> = ({ sc, dur, idx }) => {
  const f = useCurrentFrame();
  const def = SCENES[sc.id];
  const Draw = def.draw;
  const fade = interpolate(f, [0, 8, dur - 6, dur], [0, 1, 1, 0.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, dur], [1.0, 1.07]);
  const panX = (idx % 2 === 0 ? 1 : -1) * interpolate(f, [0, dur], [0, 18]);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${panX}px)` }}>
        <PaperBg tint={def.tint} tintOpacity={def.tintOpacity} seed={3 + (idx % 4)} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <Draw f={f} d={dur} />
        </svg>
      </AbsoluteFill>
      {sc.audio ? <Audio src={staticFile(sc.audio)} /> : null}
    </AbsoluteFill>
  );
};

const CHUNK = 4;
const Captions: React.FC<{ sc: Scene }> = ({ sc }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const words = sc.words;
  let cur = -1;
  words.forEach((w, i) => {
    if (t >= w.start) cur = i;
  });
  if (cur < 0) return null;
  const start = Math.floor(cur / CHUNK) * CHUNK;
  const shown = words.slice(start, Math.min(start + CHUNK, cur + 1));
  return (
    <div style={{ position: "absolute", top: 1480, width: "100%", padding: "0 70px", boxSizing: "border-box", textAlign: "center", lineHeight: 1.25 }}>
      {shown.map((w, i) => {
        const gi = start + i;
        const active = gi === cur;
        const age = (t - w.start) * FPS;
        const s = interpolate(age, [0, 5], [0.7, 1], { extrapolateRight: "clamp" });
        return (
          <span key={gi} style={{
            display: "inline-block", margin: "0 12px", fontFamily, fontWeight: 900, fontSize: 76,
            color: active ? "#ffd400" : "#ffffff", WebkitTextStroke: "3px #1a1410",
            textShadow: "0 5px 12px rgba(0,0,0,0.55)", transform: `scale(${s})`,
          }}>{w.text}</span>
        );
      })}
    </div>
  );
};

export const Video: React.FC = () => {
  const { fps } = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill style={{ background: "#e9dcc3", ["--font" as string]: fontFamily } as React.CSSProperties}>
      {scenes.map((sc, idx) => {
        const dur = Math.ceil(sc.duration * fps);
        const el = (
          <Sequence key={sc.id} from={from} durationInFrames={dur}>
            <SceneView sc={sc} dur={dur} idx={idx} />
            <Captions sc={sc} />
          </Sequence>
        );
        from += dur;
        return el;
      })}
    </AbsoluteFill>
  );
};
