import React from "react";
import { interpolate } from "remotion";
import { Atom, fadeIn, Glow, INK, Label, pop, Stick } from "./kit";

type P = { f: number; d: number };
export type SceneDef = { tint?: string; tintOpacity?: number; draw: React.FC<P> };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// 1 — Sıfır ve bir
const Hook: React.FC<P> = ({ f }) => {
  const a = pop(f, 10);
  const b = pop(f, 30);
  return (
    <g>
      <g transform={`translate(300 ${640 + Math.sin(f / 15) * 18}) scale(${a})`}>
        <circle r={150} fill="#f6eedd" stroke={INK} strokeWidth={8} />
        <Label x={0} y={70} text="0" size={210} />
      </g>
      <g transform={`translate(780 ${600 + Math.cos(f / 15) * 18}) scale(${b})`}>
        <circle r={150} fill="#f2d98a" stroke={INK} strokeWidth={8} />
        <Label x={0} y={70} text="1" size={210} />
      </g>
      <Stick x={540} y={1000} s={1.3} mood="surprised" arms="up" frame={f} />
    </g>
  );
};

// 2 — Bitler: açık/kapalı anahtarlar
const Bits: React.FC<P> = ({ f }) => {
  const pattern = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1];
  return (
    <g>
      {Array.from({ length: 5 }).map((_, i) => {
        const on = pattern[(i + Math.floor(f / 14)) % pattern.length] === 1;
        const x = 150 + i * 195;
        const s = pop(f, 6 + i * 6);
        return (
          <g key={i} transform={`translate(${x} 640) scale(${s})`}>
            <rect x={-75} y={-130} width={150} height={260} rx={30} fill={on ? "#f2d98a" : "#cfc4ae"} stroke={INK} strokeWidth={7} />
            <rect x={-40} y={on ? -100 : 10} width={80} height={90} rx={16} fill="#f6eedd" stroke={INK} strokeWidth={6} />
            <Label x={0} y={210} text={on ? "1" : "0"} size={90} />
          </g>
        );
      })}
      <Stick x={540} y={1060} s={1.2} mood="neutral" arms="point" frame={f} />
    </g>
  );
};

// 3 — Kübit (Bloch küresi)
const Qubit: React.FC<P> = ({ f }) => {
  const s = pop(f, 8);
  const ang = f / 20;
  const vx = Math.cos(ang) * 150;
  const vy = -Math.abs(Math.sin(ang * 0.7)) * 170 - 40;
  return (
    <g>
      <g transform={`translate(540 700) scale(${s})`}>
        <Glow cx={0} cy={0} r={380} id="qglow" color="#cfe7ff" o={0.8} />
        <circle r={230} fill="#dfe9ee" fillOpacity={0.55} stroke={INK} strokeWidth={8} />
        <ellipse rx={230} ry={70} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="16 14" />
        <line x1={0} y1={-260} x2={0} y2={260} stroke={INK} strokeWidth={3} strokeOpacity={0.5} />
        <Label x={0} y={-275} text="|0⟩" size={60} />
        <Label x={0} y={320} text="|1⟩" size={60} />
        <line x1={0} y1={0} x2={vx} y2={vy} stroke="#c8553d" strokeWidth={10} strokeLinecap="round" />
        <circle cx={vx} cy={vy} r={18} fill="#c8553d" stroke={INK} strokeWidth={4} />
      </g>
      <Label x={540} y={300} text="KÜBİT" size={110} o={fadeIn(f, 40)} />
      <Stick x={230} y={1080} s={1.1} mood="surprised" arms="down" frame={f} />
    </g>
  );
};

// 4 — Dönen para (süperpozisyon benzetmesi)
const Coin: React.FC<P> = ({ f }) => {
  const c = Math.cos(f * 0.28);
  const rx = Math.max(8, Math.abs(c) * 200);
  const face = c >= 0 ? "0" : "1";
  const y = 640 + Math.sin(f / 10) * 25;
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${300 - i * 30} ${y - 150 + i * 120} q -40 30 0 60`} stroke={INK} strokeWidth={5} fill="none" opacity={0.5} />
      ))}
      <ellipse cx={540} cy={y} rx={rx} ry={200} fill={c >= 0 ? "#f2d98a" : "#e7c060"} stroke={INK} strokeWidth={8} />
      <ellipse cx={540} cy={y} rx={Math.max(4, rx - 30)} ry={170} fill="none" stroke={INK} strokeWidth={3} opacity={0.6} />
      {rx > 70 ? <Label x={540} y={y + 60} text={face} size={170} /> : null}
      <Label x={540} y={340} text="0 + 1" size={120} o={fadeIn(f, 50)} color="#8a3b2b" />
      <Stick x={820} y={1070} s={1.1} mood="happy" arms="chin" frame={f} flip />
    </g>
  );
};

// 5 — Labirent: parlayan yol
const Maze: React.FC<P> = ({ f, d }) => {
  const walls = "M 160 380 H 920 V 1100 H 160 Z M 160 520 H 640 M 780 380 V 660 M 300 660 H 920 M 300 660 V 940 M 440 800 H 780 V 1100 M 160 940 H 640";
  const path = "M 230 450 H 860 V 590 H 230 V 870 H 370 V 1030 H 700 V 870 H 860 V 1030";
  const len = 3300;
  const prog = interpolate(f, [10, d * 0.8], [len, 0], clamp);
  return (
    <g>
      <path d={walls} fill="#efe4cc" stroke={INK} strokeWidth={10} strokeLinecap="round" fillOpacity={0.6} />
      <path d={path} fill="none" stroke="#f7d54a" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} strokeDasharray={len} strokeDashoffset={prog} />
      <path d={path} fill="none" stroke="#c8553d" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={prog} />
      <Stick x={540} y={1260} s={0.95} mood="happy" arms="point" frame={f} />
    </g>
  );
};

// 6 — Kullanım alanları
const Uses: React.FC<P> = ({ f, d }) => {
  const step = d / 5;
  const items = [
    { x: 300, y: 560, label: "İlaç", icon: (
      <g transform="rotate(-30)"><path d="M 0 -45 H -65 A 45 45 0 0 0 -65 45 H 0 Z" fill="#d9776a" stroke={INK} strokeWidth={7} /><path d="M 0 -45 H 65 A 45 45 0 0 1 65 45 H 0 Z" fill="#f6eedd" stroke={INK} strokeWidth={7} /></g>) },
    { x: 780, y: 560, label: "Malzeme", icon: (
      <g>{[0, 1, 2].map((i) => <polygon key={i} points="0,-70 60,-35 60,35 0,70 -60,35 -60,-35" transform={`translate(${(i - 1) * 75} ${i === 1 ? -40 : 30})`} fill="#bcd3dc" stroke={INK} strokeWidth={6} />)}</g>) },
    { x: 300, y: 1000, label: "Kimya", icon: (
      <g stroke={INK} strokeWidth={7}><line x1={-80} y1={40} x2={0} y2={-30} /><line x1={0} y1={-30} x2={85} y2={30} /><line x1={0} y1={-30} x2={10} y2={-110} /><circle cx={-80} cy={40} r={34} fill="#f2d98a" /><circle cx={0} cy={-30} r={44} fill="#d9776a" /><circle cx={85} cy={30} r={34} fill="#f2d98a" /><circle cx={10} cy={-110} r={28} fill="#bcd3dc" /></g>) },
    { x: 780, y: 1000, label: "Optimizasyon", icon: (
      <g stroke={INK} strokeWidth={6}><polyline points="-100,60 -40,-40 30,20 100,-80" fill="none" stroke="#c8553d" strokeWidth={9} />{[[-100, 60], [-40, -40], [30, 20], [100, -80]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={18} fill="#f6eedd" />)}</g>) },
  ];
  return (
    <g>
      {items.map((it, i) => {
        const s = pop(f, 6 + i * step);
        return (
          <g key={it.label} transform={`translate(${it.x} ${it.y}) scale(${s})`}>
            <circle r={170} fill="#f6eedd" fillOpacity={0.6} stroke={INK} strokeWidth={6} strokeDasharray="4 12" />
            {it.icon}
            <Label x={0} y={235} text={it.label} size={58} />
          </g>
        );
      })}
    </g>
  );
};

// 7 — Devrim: atom ve ışınlar
const Revolution: React.FC<P> = ({ f }) => {
  const s = pop(f, 4);
  return (
    <g>
      <g transform={`rotate(${f * 0.6} 540 680)`} opacity={0.35}>
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d="M 540 680 L 520 0 L 560 0 Z" fill="#f7d54a" transform={`rotate(${i * 22.5} 540 680)`} />
        ))}
      </g>
      <g transform={`translate(540 680) scale(${s}) translate(-540 -680)`}>
        <Atom cx={540} cy={680} r={280} frame={f} glowId="revglow" />
      </g>
      <Stick x={540} y={1110} s={1.15} mood="happy" arms="up" frame={f} />
    </g>
  );
};

// 8 — Dikkat: hâlâ gelişiyor
const Caution: React.FC<P> = ({ f }) => {
  const s = pop(f, 8);
  return (
    <g>
      <g transform={`translate(640 640) scale(${s}) rotate(${Math.sin(f / 20) * 2})`}>
        <line x1={0} y1={0} x2={0} y2={480} stroke={INK} strokeWidth={14} />
        <rect x={-300} y={-170} width={600} height={260} rx={20} fill="#f2d98a" stroke={INK} strokeWidth={8} />
        <Label x={0} y={-70} text="HÂLÂ" size={88} />
        <Label x={0} y={30} text="GELİŞİYOR" size={88} />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${-300 + i * 110} 90 l 50 0 l -40 50 l -50 0 z`} fill={INK} opacity={0.8} />)}
      </g>
      <g transform={`translate(860 1150) scale(${pop(f, 25)})`}>
        <path d="M -70 120 L -25 -110 L 25 -110 L 70 120 Z" fill="#e0884a" stroke={INK} strokeWidth={7} />
        <path d="M -48 20 H 48 M -36 -40 H 36" stroke="#f6eedd" strokeWidth={22} />
        <rect x={-100} y={110} width={200} height={30} rx={8} fill="#e0884a" stroke={INK} strokeWidth={7} />
      </g>
      <Stick x={240} y={990} s={1.15} mood="serious" arms="stop" frame={f} />
    </g>
  );
};

// 9 — Birlikte çalışma
const Together: React.FC<P> = ({ f, d }) => {
  const pts = [
    { x: 540, y: 430, label: "Kuantum" },
    { x: 250, y: 950, label: "Yapay Zekâ" },
    { x: 830, y: 950, label: "Klasik" },
  ];
  const link = interpolate(f, [30, 70], [1, 0], clamp);
  const pulse = (f % 40) / 40;
  return (
    <g>
      {[[0, 1], [1, 2], [2, 0]].map(([a, b], i) => {
        const A = pts[a];
        const B = pts[b];
        return (
          <g key={i}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={INK} strokeWidth={8} strokeDasharray="700" strokeDashoffset={700 * link} />
            {link === 0 ? <circle cx={A.x + (B.x - A.x) * pulse} cy={A.y + (B.y - A.y) * pulse} r={16} fill="#f7d54a" stroke={INK} strokeWidth={4} /> : null}
          </g>
        );
      })}
      {pts.map((p, i) => (
        <g key={p.label} transform={`translate(${p.x} ${p.y}) scale(${pop(f, 4 + i * 8)})`}>
          <circle r={150} fill="#f6eedd" stroke={INK} strokeWidth={8} />
          {i === 0 ? <Atom cx={0} cy={0} r={100} frame={f} glowId="tgl" /> : null}
          {i === 1 ? (
            <g stroke={INK} strokeWidth={6} fill="none">
              <path d="M -10 -85 C -90 -95 -110 -10 -80 30 C -100 70 -40 100 -10 80 Z" fill="#e9b7b0" />
              <path d="M 10 -85 C 90 -95 110 -10 80 30 C 100 70 40 100 10 80 Z" fill="#e9b7b0" />
              <path d="M -60 -30 q 20 15 40 0 M 30 -40 q 20 20 40 5 M -55 40 q 20 -10 35 5 M 25 45 q 25 -15 40 0" />
            </g>
          ) : null}
          {i === 2 ? (
            <g stroke={INK} strokeWidth={6}>
              <rect x={-90} y={-75} width={180} height={115} rx={10} fill="#bcd3dc" />
              <path d="M -115 50 H 115 L 95 80 H -95 Z" fill="#cfc4ae" />
              <Label x={0} y={0} text="01" size={54} />
            </g>
          ) : null}
          <Label x={0} y={215} text={p.label} size={54} />
        </g>
      ))}
    </g>
  );
};

// 10 — Şifreleme kilidi çatlıyor
const Lock: React.FC<P> = ({ f, d }) => {
  const s = pop(f, 6);
  const crack = interpolate(f, [d * 0.35, d * 0.85], [600, 0], clamp);
  const shake = f > d * 0.35 ? Math.sin(f * 1.7) * 4 : 0;
  return (
    <g>
      <g transform={`translate(${540 + shake} 720) scale(${s})`}>
        <path d="M -140 -60 V -170 A 140 140 0 0 1 140 -170 V -60" fill="none" stroke={INK} strokeWidth={36} />
        <path d="M -140 -60 V -170 A 140 140 0 0 1 140 -170 V -60" fill="none" stroke="#bfb4a0" strokeWidth={22} />
        <rect x={-230} y={-80} width={460} height={380} rx={40} fill="#d8b25a" stroke={INK} strokeWidth={10} />
        <circle cx={0} cy={70} r={40} fill={INK} />
        <path d="M -16 90 L -24 190 H 24 L 16 90 Z" fill={INK} />
        <path d="M 60 -80 L 20 0 L 90 60 L 30 150 L 80 300" fill="none" stroke={INK} strokeWidth={8} strokeDasharray="600" strokeDashoffset={crack} />
        <path d="M 20 0 L -60 40 M 90 60 L 170 90" fill="none" stroke={INK} strokeWidth={6} strokeDasharray="600" strokeDashoffset={crack} />
      </g>
      <g transform="translate(860 330)">
        <Atom cx={0} cy={0} r={90} frame={f} glowId="lockglow" />
      </g>
      <Stick x={220} y={1060} s={1.1} mood="worried" arms="down" frame={f} />
    </g>
  );
};

// 11 — Gece gökyüzü, yıldızlar ve takımyıldız
const Sky: React.FC<P> = ({ f }) => {
  const stars = [[150, 300], [320, 220], [500, 360], [690, 250], [880, 400], [980, 200], [260, 520], [780, 560], [600, 140], [420, 600]];
  const constellation = [[150, 300], [320, 220], [500, 360], [690, 250], [880, 400]];
  const draw = interpolate(f, [15, 90], [1400, 0], clamp);
  return (
    <g>
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6 + Math.sin(f / 8 + i) * 3} fill="#fff6c8" opacity={0.9} />
      ))}
      <polyline points={constellation.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff6c8" strokeWidth={4} strokeDasharray="1400" strokeDashoffset={draw} opacity={0.85} />
      <path d="M 0 1180 Q 300 1120 540 1170 T 1080 1150 V 1400 H 0 Z" fill="#6b6253" stroke={INK} strokeWidth={6} />
      <Stick x={540} y={850} s={1.1} mood="neutral" arms="chin" frame={f} />
    </g>
  );
};

// 12 — Portal: yeni fiziksel dünya
const Portal: React.FC<P> = ({ f, d }) => {
  const walk = interpolate(f, [0, d], [200, 420], clamp);
  return (
    <g>
      <Glow cx={700} cy={700} r={520} id="portalglow" color="#fff3b0" o={0.95} />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={700} cy={700} rx={300 - i * 55} ry={380 - i * 70} fill="none" stroke={INK} strokeWidth={6 - i}
          strokeDasharray="40 22" transform={`rotate(${(i % 2 ? -1 : 1) * f * (1 + i * 0.4)} 700 700)`} />
      ))}
      <Atom cx={700} cy={700} r={110} frame={f} glowId="pa" />
      <Stick x={walk} y={1000} s={1.05} mood="happy" arms="point" frame={f} />
    </g>
  );
};

export const SCENES: Record<string, SceneDef> = {
  hook: { draw: Hook },
  bits: { draw: Bits },
  qubit: { draw: Qubit, tint: "#7d93a8", tintOpacity: 0.18 },
  coin: { draw: Coin },
  maze: { draw: Maze },
  uses: { draw: Uses },
  revolution: { draw: Revolution, tint: "#f2d98a", tintOpacity: 0.2 },
  caution: { draw: Caution, tint: "#6b5a4a", tintOpacity: 0.2 },
  together: { draw: Together },
  lock: { draw: Lock, tint: "#5a3f45", tintOpacity: 0.3 },
  sky: { draw: Sky, tint: "#1f2a3d", tintOpacity: 0.72 },
  portal: { draw: Portal, tint: "#f2d98a", tintOpacity: 0.15 },
};
