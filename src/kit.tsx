import React from "react";
import { interpolate, spring } from "remotion";

export const INK = "#2b2420";
export const PAPER = "#e9dcc3";
export const W = 1080;
export const H = 1920;

export const pop = (frame: number, start: number, fps = 30) =>
  spring({ frame: frame - start, fps, config: { damping: 13, stiffness: 120 } });

export const fadeIn = (frame: number, start: number, len = 12) =>
  interpolate(frame, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const PaperBg: React.FC<{ tint?: string; tintOpacity?: number; seed?: number }> = ({ tint, tintOpacity = 0, seed = 3 }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <filter id={`grain${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 0.16 0" />
      </filter>
      <filter id={`stain${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="3" seed={seed + 5} />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.40  0 0 0 0 0.22  0 0 0 0.55 -0.13" />
      </filter>
      <radialGradient id={`vig${seed}`} cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#3a2a18" stopOpacity="0.5" />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill={PAPER} />
    {tint ? <rect width={W} height={H} fill={tint} opacity={tintOpacity} /> : null}
    <rect width={W} height={H} filter={`url(#stain${seed})`} />
    <rect width={W} height={H} filter={`url(#grain${seed})`} />
    <rect width={W} height={H} fill={`url(#vig${seed})`} />
  </svg>
);

type Mood = "happy" | "neutral" | "surprised" | "worried" | "serious";
type Arms = "down" | "up" | "point" | "stop" | "chin";

export const Stick: React.FC<{ x: number; y: number; s?: number; mood?: Mood; arms?: Arms; frame: number; flip?: boolean }> = ({
  x, y, s = 1, mood = "neutral", arms = "down", frame, flip = false,
}) => {
  const breathe = Math.sin(frame / 14) * 3;
  const blink = frame % 90 > 85;
  const eyeH = blink ? 1 : mood === "surprised" ? 9 : 6;
  const mouth = {
    happy: "M -16 22 Q 0 38 16 22",
    neutral: "M -12 26 L 12 26",
    surprised: "M -7 26 A 7 9 0 1 0 7 26 A 7 9 0 1 0 -7 26",
    worried: "M -14 30 Q 0 20 14 30",
    serious: "M -12 28 Q 0 24 12 28",
  }[mood];
  const wave = Math.sin(frame / 6) * 10;
  const armPaths: Record<Arms, string[]> = {
    down: ["M 0 70 L -45 160", "M 0 70 L 45 160"],
    up: [`M 0 70 L -70 ${-10 + wave}`, `M 0 70 L 70 ${-10 - wave}`],
    point: ["M 0 70 L -45 160", "M 0 70 L 95 30"],
    stop: ["M 0 70 L -45 160", "M 0 70 L 80 60 L 85 0"],
    chin: ["M 0 70 L -45 160", "M 0 70 L 50 100 L 18 40"],
  };
  return (
    <g transform={`translate(${x} ${y + breathe}) scale(${flip ? -s : s} ${s})`} stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={0} y1={44} x2={0} y2={190} />
      <line x1={0} y1={190} x2={-38} y2={300} />
      <line x1={0} y1={190} x2={38} y2={300} />
      {armPaths[arms].map((d, i) => <path key={i} d={d} />)}
      <circle cx={0} cy={0} r={46} fill="#f6eedd" />
      <ellipse cx={-15} cy={-4} rx={5} ry={eyeH} fill={INK} stroke="none" />
      <ellipse cx={15} cy={-4} rx={5} ry={eyeH} fill={INK} stroke="none" />
      {mood === "worried" || mood === "serious" ? (
        <path d={mood === "worried" ? "M -24 -22 L -8 -18 M 24 -22 L 8 -18" : "M -24 -18 L -8 -14 M 24 -18 L 8 -14"} strokeWidth={4} />
      ) : null}
      <path d={mood === "surprised" ? "M 0 20 m -7 0 a 7 9 0 1 0 14 0 a 7 9 0 1 0 -14 0" : mouth} strokeWidth={4} />
    </g>
  );
};

export const Glow: React.FC<{ cx: number; cy: number; r: number; color?: string; o?: number; id: string }> = ({ cx, cy, r, color = "#fff6c8", o = 0.9, id }) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor={color} stopOpacity={o} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </g>
);

export const Atom: React.FC<{ cx: number; cy: number; r: number; frame: number; glowId: string }> = ({ cx, cy, r, frame, glowId }) => (
  <g>
    <Glow cx={cx} cy={cy} r={r * 1.5} id={glowId} o={0.6} />
    {[0, 60, 120].map((rot, i) => {
      const a = frame / 9 + i * 2.1;
      const ex = Math.cos(a) * r;
      const ey = Math.sin(a) * r * 0.35;
      const rr = (rot * Math.PI) / 180;
      return (
        <g key={rot}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.35} transform={`rotate(${rot} ${cx} ${cy})`} fill="none" stroke={INK} strokeWidth={5} />
          <circle cx={cx + ex * Math.cos(rr) - ey * Math.sin(rr)} cy={cy + ex * Math.sin(rr) + ey * Math.cos(rr)} r={r * 0.07} fill="#e8a33a" stroke={INK} strokeWidth={3} />
        </g>
      );
    })}
    <circle cx={cx} cy={cy} r={r * 0.13} fill="#c8553d" stroke={INK} strokeWidth={4} />
  </g>
);

export const Label: React.FC<{ x: number; y: number; text: string; size?: number; o?: number; color?: string }> = ({ x, y, text, size = 56, o = 1, color = INK }) => (
  <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={800} fill={color} opacity={o} style={{ fontFamily: "var(--font)" }}>
    {text}
  </text>
);
