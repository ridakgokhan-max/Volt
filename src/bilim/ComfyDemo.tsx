// Comfy Cloud deneme videosu: Comfy'de üretilen görseller + bizim katmanlar (Meraklı, yazılar).
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { ACC, ap, cl, GREEN, INK, RED, sp } from "./kit";
import { Merakli } from "./merakli";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });
const FPS = 30;
const PARCA = 5; // saniye
export const COMFY_DEMO_SURE = PARCA * 4;

type Parca = { tur: "video" | "resim"; dosya: string; ust: string; alt: string; renk: string; hareket: "isaret" | "aha" | "sasir" | "anlat"; uyari?: boolean };
const PARCALAR: Parca[] = [
  { tur: "video", dosya: "baldamla.mp4", ust: "RESMİ CANLANDIRDI", alt: "Tek görselden 5 sn hareket", renk: GREEN, hareket: "aha" },
  { tur: "resim", dosya: "bal.jpg", ust: "BİZİM TARZDA ÇİZİM", alt: "Düz renk, kalın çizgi", renk: GREEN, hareket: "isaret" },
  { tur: "resim", dosya: "sarj.jpg", ust: "KONUYA ÖZEL SAHNE", alt: "Her video için yeni görsel", renk: GREEN, hareket: "anlat" },
  { tur: "resim", dosya: "deprem.jpg", ust: "DİKKAT: HATALI!", alt: "Kişi masanın ALTINDA değil", renk: RED, hareket: "sasir", uyari: true },
];

const Sahne: React.FC<{ p: Parca }> = ({ p }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const z = 1.04 + 0.08 * cl(t / PARCA);
  const ust = sp(t, 0.15, 12);
  const alt = sp(t, 0.5, 12);
  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, opacity: ap(t, 0, 0.25) }}>
        {p.tur === "video" ? (
          <OffthreadVideo muted src={staticFile(`bilim/comfy-demo/${p.dosya}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Img src={staticFile(`bilim/comfy-demo/${p.dosya}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </AbsoluteFill>
      {p.uyari ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={560} cy={1060} r={250 + 10 * Math.sin(t * 8)} fill="none" stroke={RED} strokeWidth={16} strokeDasharray="40 22" opacity={ap(t, 1.2, 0.3)} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ transform: `scale(${ust}) rotate(-2deg)`, background: p.renk, color: "#fff", fontFamily, fontWeight: 900, fontSize: 72, padding: "12px 34px", borderRadius: 24, border: `6px solid ${INK}`, boxShadow: "0 10px 0 rgba(0,0,0,0.35)" }}>{p.ust}</div>
        <div style={{ transform: `scale(${alt})`, background: "#fff", color: INK, fontFamily, fontWeight: 900, fontSize: 48, padding: "8px 26px", borderRadius: 20, border: `5px solid ${INK}` }}>{p.alt}</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Merakli x={880} y={1640} s={0.55} t={t} hareket={p.hareket} kostum="yok" />
      </svg>
    </AbsoluteFill>
  );
};

export const ComfyDemo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: INK }}>
      {PARCALAR.map((p, i) => (
        <Sequence key={i} from={i * PARCA * FPS} durationInFrames={PARCA * FPS}>
          <Sahne p={p} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", top: 50, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 34, letterSpacing: 2, color: ACC, textShadow: "0 3px 8px rgba(0,0,0,0.7)" }}>
        COMFY DENEMESİ · {Math.min(4, Math.floor(f / (PARCA * FPS)) + 1)}/4
      </div>
    </AbsoluteFill>
  );
};
