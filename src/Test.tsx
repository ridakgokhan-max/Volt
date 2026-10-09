import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const INK = "#2b2420";
const PAPER = "#e9dcc3";

// Kelime kelime altyazı: [kelime, başlangıç karesi]
const WORDS: [string, number][] = [
  ["Bir", 20], ["gün", 32], ["küçük", 44], ["bir", 58], ["kayıkçı", 68],
  ["nehrin", 110], ["ortasında", 124], ["durdu", 146], ["ve", 170], ["sordu...", 182],
];

const Paper: React.FC = () => (
  <AbsoluteFill>
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <defs>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 0.18 0" />
        </filter>
        <filter id="stains">
          <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="8" />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.40  0 0 0 0 0.22  0 0 0 0.55 -0.12" />
        </filter>
        <radialGradient id="vig" cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#3a2a18" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill={PAPER} />
      <rect width="1080" height="1920" filter="url(#stains)" />
      <rect width="1080" height="1920" filter="url(#grain)" />
      <rect width="1080" height="1920" fill="url(#vig)" />
    </svg>
  </AbsoluteFill>
);

const Waves: React.FC<{ frame: number; y: number; amp: number; speed: number; color: string }> = ({ frame, y, amp, speed, color }) => {
  let d = `M -50 ${y}`;
  for (let x = -50; x <= 1130; x += 20) {
    const yy = y + Math.sin(x / 70 + frame * speed) * amp;
    d += ` L ${x} ${yy.toFixed(1)}`;
  }
  d += " L 1130 1920 L -50 1920 Z";
  return <path d={d} fill={color} stroke={INK} strokeWidth={3} strokeOpacity={0.7} />;
};

const Boat: React.FC<{ frame: number }> = ({ frame }) => {
  const bob = Math.sin(frame / 12) * 10;
  const tilt = Math.sin(frame / 15) * 3;
  const oar = Math.sin(frame / 10) * 12;
  return (
    <g transform={`translate(540 ${1150 + bob}) rotate(${tilt})`}>
      {/* kayıkçı (çöp adam) */}
      <g stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none">
        <circle cx={60} cy={-260} r={42} fill="#f3ead8" />
        <circle cx={48} cy={-264} r={4} fill={INK} stroke="none" />
        <circle cx={74} cy={-264} r={4} fill={INK} stroke="none" />
        <path d="M 48 -240 Q 61 -232 74 -240" strokeWidth={4} />
        <line x1={60} y1={-218} x2={60} y2={-100} />
        <line x1={60} y1={-100} x2={30} y2={-20} />
        <line x1={60} y1={-100} x2={95} y2={-20} />
        <line x1={60} y1={-180} x2={140} y2={-150} />
        <line x1={60} y1={-180} x2={135} y2={-120} />
        {/* kürek */}
        <g transform={`rotate(${oar} 140 -140)`}>
          <line x1={110} y1={-260} x2={230} y2={60} stroke="#6b4a2b" strokeWidth={10} />
          <ellipse cx={232} cy={70} rx={16} ry={38} fill="#8a6440" stroke={INK} strokeWidth={4} transform="rotate(-20 232 70)" />
        </g>
      </g>
      {/* kayık */}
      <path d="M -260 -30 L 260 -30 Q 220 70 140 80 L -150 80 Q -230 70 -260 -30 Z" fill="#8a6440" stroke={INK} strokeWidth={6} />
      <path d="M -240 0 L 240 0 M -200 40 L 200 40" stroke={INK} strokeWidth={3} strokeOpacity={0.5} />
    </g>
  );
};

const Captions: React.FC<{ frame: number }> = ({ frame }) => {
  const visible = WORDS.filter(([, s]) => frame >= s);
  const lineStart = visible.length > 5 ? 5 : 0;
  const shown = visible.slice(lineStart);
  return (
    <div style={{ position: "absolute", bottom: 380, width: "100%", textAlign: "center", padding: "0 80px", boxSizing: "border-box" }}>
      {shown.map(([w, s], i) => {
        const isLast = i === shown.length - 1;
        const pop = interpolate(frame - s, [0, 6], [0.6, 1], { extrapolateRight: "clamp" });
        return (
          <span key={w + s} style={{
            display: "inline-block", margin: "0 12px", fontFamily: "Comic Sans MS, Chalkboard, sans-serif",
            fontSize: 74, fontWeight: 700, color: isLast ? "#ffd400" : "#fff",
            WebkitTextStroke: "3px #1a1410", textShadow: "0 4px 10px rgba(0,0,0,0.5)", transform: `scale(${pop})`,
          }}>{w}</span>
        );
      })}
    </div>
  );
};

export const Test: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.12]);
  const fade = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0]);
  const dark = interpolate(frame, [90, 200], [0, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: PAPER, opacity: fade }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Paper />
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
          {/* uzak kıyı */}
          <path d="M 0 860 Q 270 800 520 850 T 1080 830 L 1080 900 L 0 900 Z" fill="#b9b48f" fillOpacity={0.6} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
          <Waves frame={frame} y={900} amp={10} speed={0.05} color="#9fb3bd" />
          <Waves frame={frame} y={1040} amp={14} speed={0.07} color="#8ea6b2" />
          <Boat frame={frame} />
          <Waves frame={frame} y={1230} amp={18} speed={0.09} color="#7f98a6" />
          <rect width="1080" height="1920" fill="#2a2030" opacity={dark} />
        </svg>
      </AbsoluteFill>
      <Captions frame={frame} />
    </AbsoluteFill>
  );
};
