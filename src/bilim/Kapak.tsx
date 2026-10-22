// Bir Dakikada Bilim — video kapağı (tek kare)
import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { data, KAPAK, KAPAK_YAZI } from "./aktif";
import { ACC, Bg, BgKind, H, INK, W } from "./kit";

const ilkBg = ((data as { sahneler?: { bg: string }[] }).sahneler?.[0]?.bg || "") as string;
const kapakBg = (ilkBg || "gece") as BgKind;

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });

export const BilimKapak: React.FC = () => (
  <AbsoluteFill style={{ ["--font" as string]: fontFamily } as React.CSSProperties}>
    <Bg kind={kapakBg} t={2} seed={4} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <KAPAK />
    </svg>
    <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily, fontWeight: 900 }}>
      <div style={{ fontSize: 36, letterSpacing: 3, color: INK, background: ACC, padding: "8px 28px", borderRadius: 40, border: `4px solid ${INK}` }}>BİR DAKİKADA BİLİM</div>
      <div style={{ marginTop: 26, fontSize: 92, lineHeight: 1.05, color: "#fff", textAlign: "center", padding: "0 60px", WebkitTextStroke: "4px #1a1410", paintOrder: "stroke fill", textShadow: "0 8px 18px rgba(0,0,0,0.6)" }}>{KAPAK_YAZI.ust}</div>
      <div style={{ fontSize: Math.min(150, Math.floor(1500 / Math.max(...KAPAK_YAZI.buyuk.split(" ").map((s) => s.length)) / 0.95)), lineHeight: 1.0, color: ACC, textAlign: "center", padding: "0 40px", WebkitTextStroke: "6px #1a1410", paintOrder: "stroke fill", textShadow: "0 10px 22px rgba(0,0,0,0.6)", transform: "rotate(-3deg)" }}>{KAPAK_YAZI.buyuk}</div>
    </div>
    <div style={{ position: "absolute", top: 1590, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 64, color: "#fff", WebkitTextStroke: "3px #1a1410", paintOrder: "stroke fill" }}>
      {KAPAK_YAZI.alt}
    </div>
  </AbsoluteFill>
);
