// Kanal maskotu "Meraklı Gözlüklü" — karakter/merakli.py'nin Remotion hali.
// Kullanım: <Merakli x y s t hareket="yuru" duygu="mutlu" /> ya da <Merakli poz={{...}} />
import React from "react";
import { FPS } from "./kit";

const INK = "#2b2420";
const ACC = "#ffcf3a";
const RED = "#d64933";
const CREAM = "#f6eedd";
const BLUSH = "#ff9a8a";
const CYAN = "#5ce1ff";
const BLUE_ = "#3a7bd5";

export type Duygu = "neutral" | "happy" | "laugh" | "surprised" | "think" | "sad" | "angry" | "scared" | "excited" | "shy" | "sleepy" | "aha" | "wink";
export type Kostum = "yok" | "sapka" | "onluk" | "baret" | "kulaklik" | "kemer" | "kasif" | "usta";
export type Poz = {
  lean?: number; armL?: [number, number]; armR?: [number, number]; legL?: [number, number]; legR?: [number, number];
  mood?: Duygu; look?: [number, number]; talk?: number; curl?: number; flap?: number; gb?: number; tilt?: number; headdy?: number; sx?: number; sy?: number; blink?: boolean;
};

const R = Math.PI / 180;
const limb = (x: number, y: number, a1: number, a2: number, l1: number, l2: number) => {
  const kx = x + l1 * Math.sin(a1 * R);
  const ky = y + l1 * Math.cos(a1 * R);
  return [kx, ky, kx + l2 * Math.sin((a1 + a2) * R), ky + l2 * Math.cos((a1 + a2) * R)];
};

const BROWS: Record<Duygu, [number, number, number, number]> = {
  neutral: [-32, -32, -32, -32], happy: [-34, -33, -34, -33], laugh: [-36, -34, -36, -34], surprised: [-44, -42, -44, -42],
  think: [-30, -30, -40, -44], sad: [-38, -28, -38, -28], angry: [-24, -36, -24, -36], scared: [-42, -36, -42, -36],
  excited: [-40, -38, -40, -38], shy: [-36, -30, -36, -30], sleepy: [-28, -28, -28, -28], aha: [-44, -40, -44, -40], wink: [-34, -32, -30, -36],
};

const Eye: React.FC<{ cx: number; m: Duygu; look: [number, number]; side: number; blink?: boolean }> = ({ cx, m, look, side, blink }) => {
  if (blink) return <path d={`M ${cx - 8} -3 L ${cx + 8} -3`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />;
  const px = cx + look[0] * 6;
  const py = -4 + look[1] * 6;
  if (m === "excited") {
    const pts = Array.from({ length: 10 }).map((_, k) => {
      const r = k % 2 === 0 ? 9 : 4;
      return `${cx + r * Math.sin((k * Math.PI) / 5)},${-4 - r * Math.cos((k * Math.PI) / 5)}`;
    }).join(" ");
    return <polygon points={pts} fill={ACC} stroke={INK} strokeWidth={2} />;
  }
  if (m === "happy" || m === "laugh" || m === "aha" || (m === "wink" && side > 0))
    return <path d={`M ${cx - 8} -2 q 8 -10 16 0`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
  if (m === "sleepy") return <path d={`M ${cx - 8} -3 q 8 6 16 0`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
  if (m === "angry") return <ellipse cx={px} cy={py + 2} rx={4.5} ry={4} fill={INK} />;
  if (m === "surprised" || m === "scared") return <circle cx={px} cy={py} r={m === "scared" ? 3.2 : 5} fill={INK} />;
  if (m === "sad")
    return (
      <g>
        <ellipse cx={px} cy={py + 2} rx={4.5} ry={5.5} fill={INK} />
        <path d={`M ${cx + 6} 6 q 2 8 0 12`} stroke={CYAN} strokeWidth={3} fill="none" />
      </g>
    );
  return (
    <g>
      <ellipse cx={px} cy={py} rx={4.5} ry={6} fill={INK} />
      <circle cx={px + 1.5} cy={py - 2} r={1.5} fill="#fff" />
    </g>
  );
};

const Mouth: React.FC<{ m: Duygu; talk: number }> = ({ m, talk }) => {
  if (talk > 0.02) return <ellipse cx={0} cy={26} rx={9 + 4 * talk} ry={(4 + 18 * talk) / 2} fill={RED} stroke={INK} strokeWidth={4} />;
  const s = { stroke: INK, strokeWidth: 4.5, fill: "none", strokeLinecap: "round" as const };
  switch (m) {
    case "happy": return <path d="M -14 22 Q 0 36 14 22" {...s} />;
    case "laugh": case "excited": return <path d="M -16 20 Q 0 44 16 20 Z" fill={RED} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />;
    case "aha": return <path d="M -15 20 Q 0 40 15 20 Z" fill={RED} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />;
    case "surprised": return <ellipse cx={0} cy={27} rx={7} ry={10} fill={INK} />;
    case "think": return <path d="M -8 27 Q 2 23 10 26" {...s} />;
    case "sad": return <path d="M -12 30 Q 0 20 12 30" {...s} />;
    case "angry": return <path d="M -12 28 L 12 28" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    case "scared": return <path d="M -12 28 l 4 -4 l 4 4 l 4 -4 l 4 4 l 4 -4" stroke={INK} strokeWidth={4} fill="none" strokeLinejoin="round" />;
    case "shy": return <path d="M -6 26 Q 0 30 6 26" {...s} strokeWidth={4} />;
    case "sleepy": return <ellipse cx={2} cy={27} rx={5} ry={6} fill={INK} />;
    case "wink": return <path d="M -12 24 Q 2 34 14 20" {...s} />;
    default: return <path d="M -9 25 Q 0 30 9 25" {...s} />;
  }
};

const Sapka: React.FC<{ k: Kostum }> = ({ k }) => {
  if (k === "sapka" || k === "kasif") {
    const ana = k === "sapka" ? "#5a4636" : "#c9a86a";
    return (
      <g>
        <path d="M -40 -46 C -42 -80 -30 -96 0 -92 C 30 -96 42 -80 40 -46 Z" fill={ana} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -18 -88 Q 0 -78 18 -88" stroke={INK} strokeWidth={4} fill="none" />
        <path d="M -40 -58 L 40 -58 L 40 -46 L -40 -46 Z" fill={k === "sapka" ? RED : "#5a4636"} stroke={INK} strokeWidth={4} />
        <ellipse cx={0} cy={-45} rx={76} ry={12} fill={ana} stroke={INK} strokeWidth={6} />
      </g>
    );
  }
  if (k === "baret" || k === "usta")
    return (
      <g>
        <path d="M -56 -26 C -56 -80 56 -80 56 -26 Z" fill="#ff9f1c" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -10 -76 L -10 -28 M 10 -76 L 10 -28" stroke={INK} strokeWidth={4} />
        <path d="M -72 -26 L 72 -26 L 66 -16 L -66 -16 Z" fill="#ff9f1c" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <circle cx={0} cy={-50} r={9} fill="#fff7d0" stroke={INK} strokeWidth={3} />
      </g>
    );
  if (k === "kulaklik")
    return (
      <g>
        <path d="M -54 -4 C -60 -78 60 -78 54 -4" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
        <rect x={-68} y={-20} width={22} height={38} rx={9} fill={CYAN} stroke={INK} strokeWidth={5} />
        <rect x={46} y={-20} width={22} height={38} rx={9} fill={CYAN} stroke={INK} strokeWidth={5} />
      </g>
    );
  return null;
};

/** Gövde kostümü (çubuk gövdenin arkasında çizilir) */
const Govde: React.FC<{ k: Kostum; top: number[] }> = ({ k, top }) => {
  if (k === "onluk") {
    const [x, y] = top;
    return (
      <g>
        <path d={`M ${x - 26} ${y + 4} L ${x + 26} ${y + 4} L 34 212 L -34 212 Z`} fill="#ffffff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M ${x - 8} ${y + 4} L ${x} ${y + 40} L ${x + 8} ${y + 4}`} stroke={INK} strokeWidth={4} fill="#dff3ff" />
        <rect x={10} y={150} width={16} height={14} rx={2} fill="none" stroke={INK} strokeWidth={3} />
        <path d="M 14 150 L 14 140 M 20 150 L 20 144" stroke={BLUE_} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  if (k === "kemer" || k === "kasif" || k === "usta")
    return (
      <g>
        <rect x={-34} y={176} width={68} height={16} rx={4} fill="#7a4b2a" stroke={INK} strokeWidth={5} />
        <rect x={-8} y={174} width={16} height={20} rx={3} fill={ACC} stroke={INK} strokeWidth={4} />
        {k === "kemer" || k === "usta" ? (
          <g stroke={INK} strokeWidth={4} strokeLinecap="round">
            <path d="M 28 190 L 30 222" stroke="#8a8f99" strokeWidth={7} />
            <circle cx={30} cy={226} r={6} fill="none" stroke="#8a8f99" />
            <path d="M -28 190 L -30 218" stroke={RED} strokeWidth={8} />
            <path d="M -36 216 L -24 216" />
          </g>
        ) : null}
      </g>
    );
  return null;
};

const Head: React.FC<{ p: Poz; kostum?: Kostum }> = ({ p, kostum = "yok" }) => {
  const m = p.mood || "neutral";
  const c = p.curl || 0;
  const [li, lo, ri, ro] = BROWS[m];
  const curlPath = `M -4 -50 C ${-10 + c * 6} -96 ${40 + c * 14} ${-102 + Math.abs(c) * 4} ${38 + c * 10} -72 C ${36 + c * 8} -54 ${12 + c * 4} -60 12 -42`;
  const look = p.look || [0, 0];
  return (
    <g transform={`rotate(${p.tilt || 0})`}>
      {kostum === "yok" || kostum === "onluk" || kostum === "kemer" || kostum === "kulaklik" ? <path d={curlPath} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" /> : null}
      <circle r={52} fill={CREAM} stroke={INK} strokeWidth={9} />
      {["shy", "laugh", "happy", "excited"].includes(m) ? (
        <g opacity={0.8}>
          <ellipse cx={-30} cy={14} rx={9} ry={5} fill={BLUSH} />
          <ellipse cx={30} cy={14} rx={9} ry={5} fill={BLUSH} />
        </g>
      ) : null}
      <path d={`M -8 ${li} L -30 ${lo}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d={`M 8 ${ri} L 30 ${ro}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <g transform={`translate(0 ${p.gb || 0})`}>
        <circle cx={-19} cy={-4} r={17} fill="#fff" stroke={INK} strokeWidth={6} />
        <circle cx={19} cy={-4} r={17} fill="#fff" stroke={INK} strokeWidth={6} />
        <line x1={-3} y1={-6} x2={3} y2={-6} stroke={INK} strokeWidth={6} />
        <Eye cx={-19} m={m} look={look} side={-1} blink={p.blink} />
        <Eye cx={19} m={m} look={look} side={1} blink={p.blink} />
      </g>
      <Mouth m={m} talk={p.talk || 0} />
      {m === "scared" ? <path d="M 44 -24 q 6 10 0 14 q -6 -4 0 -14 Z" fill={CYAN} stroke={INK} strokeWidth={2} /> : null}
      {m === "angry" ? <path d="M 36 -52 l 8 8 m 0 -8 l -8 8 m 16 -4 l -6 6" stroke={RED} strokeWidth={4} strokeLinecap="round" /> : null}
      {m === "sleepy" ? <text x={54} y={-48} fontSize={26} fontWeight={900} fill={INK}>z</text> : null}
      <Sapka k={kostum} />
    </g>
  );
};

/** Tek karelik çizim: poz -> SVG (ayak tabanı y≈306, gövde merkezi x=0) */
export const MerakliFigur: React.FC<{ p: Poz; ink?: string; kostum?: Kostum }> = ({ p, ink = INK, kostum = "yok" }) => {
  const lean = p.lean || 0;
  const top = [Math.sin(lean * R) * 120, 190 - Math.cos(lean * R) * 120];
  const neck = [top[0] + Math.sin(lean * R) * 24, top[1] - Math.cos(lean * R) * 24];
  const parts: string[] = [`M 0 190 L ${neck[0]} ${neck[1]}`];
  const L = (k: keyof Poz, d: [number, number]) => (p[k] as [number, number]) || d;
  for (const [a1, a2] of [L("legL", [-12, 0]), L("legR", [12, 0])]) {
    const [kx, ky, fx, fy] = limb(0, 190, a1, a2, 58, 58);
    parts.push(`M 0 190 L ${kx} ${ky} L ${fx} ${fy}`);
  }
  for (const [a1, a2] of [L("armL", [-24, 0]), L("armR", [24, 0])]) {
    const [ex, ey, wx, wy] = limb(top[0], top[1], a1, a2, 52, 50);
    parts.push(`M ${top[0]} ${top[1]} L ${ex} ${ey} L ${wx} ${wy}`);
  }
  const hc = [top[0] + Math.sin(lean * R) * 70, top[1] - Math.cos(lean * R) * 70 + (p.headdy || 0)];
  const f = p.flap || 0;
  return (
    <g transform={`translate(0 306) scale(${p.sx || 1} ${p.sy || 1}) translate(0 -306)`}>
      <Govde k={kostum} top={top} />
      <path d={parts.join(" ")} stroke={ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <g transform={`translate(${top[0]} ${top[1] - 70}) rotate(${lean * 0.5} 0 60)`}>
        <path d="M -22 52 Q 0 64 22 52 L 18 66 Q 0 74 -18 66 Z" fill={ACC} stroke={INK} strokeWidth={5} />
        <path d={`M 10 64 L ${30 + f * 24} ${110 - Math.abs(f) * 30} L ${14 + f * 20} ${106 - Math.abs(f) * 24} Z`} fill={ACC} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
      <g transform={`translate(${hc[0]} ${hc[1]})`}>
        <Head p={{ ...p, tilt: (p.tilt || 0) + lean * 0.5 }} kostum={kostum} />
      </g>
    </g>
  );
};

// ---------- hazır hareketler (t: saniye) ----------
export type Hareket = "dur" | "yuru" | "kos" | "salla" | "dusun" | "anlat" | "sasir" | "aha" | "isaret" | "uzgun" | "kahkaha";

export const hareketPoz = (h: Hareket, t: number, duygu?: Duygu): { p: Poz; dy: number } => {
  const ph = t * Math.PI * 2 * (h === "kos" ? 2.8 : 1.7);
  const s = Math.sin(ph);
  const breathe = Math.sin(t * 2.6);
  switch (h) {
    case "yuru":
    case "kos": {
      const run = h === "kos";
      const amp = run ? 34 : 26;
      const k = (x: number) => -(run ? 55 : 38) * Math.max(0, -Math.cos(x));
      return {
        p: {
          lean: run ? 16 : 5, mood: duygu || (run ? "excited" : "happy"), legL: [amp * s, k(ph)], legR: [-amp * s, k(ph + Math.PI)],
          armL: [-amp * 0.9 * s, run ? 70 : 22], armR: [amp * 0.9 * s, run ? 70 : 22],
          curl: -0.6 + 0.3 * Math.sin(ph * 2 - 0.8), flap: -0.8 + 0.25 * Math.sin(ph * 2), tilt: 2 * s,
        },
        dy: -Math.abs(s) * (run ? 14 : 9),
      };
    }
    case "salla": {
      const w = Math.sin(t * 13);
      return { p: { mood: duygu || "happy", armR: [112, 40 + 32 * w], armL: [-20, 10], tilt: -4 + 2 * w, curl: 0.2 * w }, dy: 0 };
    }
    case "dusun":
      return { p: { mood: duygu || "think", look: [0.6, -0.8], armR: [22, -150], armL: [-24, 62], tilt: 8 + 4 * Math.sin(t * 2.4), curl: 0.3 * Math.sin(t * 5) }, dy: 0 };
    case "anlat": {
      const g = Math.sin(t * 5);
      return { p: { mood: duygu || (g > 0 ? "happy" : "neutral"), armR: [95 + 10 * g, -25 + 20 * g], armL: [-35 + 15 * g, 40], talk: Math.max(0, Math.sin(t * 15)) * 0.8, tilt: 3 * g, look: [0.8, 0] }, dy: 0 };
    }
    case "isaret":
      return { p: { mood: duygu || "happy", armR: [100, -10 + 4 * Math.sin(t * 6)], armL: [-24, 10], look: [0.8, 0], tilt: 4 }, dy: 0 };
    case "sasir":
      return {
        p: { mood: duygu || "surprised", armL: [-112, -40], armR: [112, 40], legL: [-18, 0], legR: [18, 0], gb: -10 * Math.exp(-t * 4) * Math.cos(t * 28), curl: 0.9 * Math.exp(-t * 3) * Math.cos(t * 16) },
        dy: -4 * Math.min(1, t / 0.4) * (1 - Math.min(1, t / 0.4)) * 90,
      };
    case "aha":
      return { p: { mood: duygu || "aha", armR: [100, 65], armL: [-30, -10], legR: [16, 0], gb: -5 * Math.exp(-t * 4) * Math.cos(t * 30), curl: -0.5 * Math.exp(-t * 3) * Math.cos(t * 18) }, dy: -4 * Math.min(1, t / 0.45) * (1 - Math.min(1, t / 0.45)) * 60 };
    case "uzgun":
      return { p: { mood: duygu || "sad", armL: [-13, 0], armR: [13, 0], headdy: 8, tilt: -10 + breathe * 2 }, dy: 0 };
    case "kahkaha":
      return { p: { mood: duygu || "laugh", armL: [-35, 95], armR: [35, -95], lean: -4 + 2 * Math.sin(t * 18), tilt: -6 }, dy: -Math.abs(Math.sin(t * 18)) * 6 };
    default:
      return { p: { mood: duygu || "neutral", armL: [-22 - breathe, 0], armR: [22 + breathe, 0], curl: 0.1 * breathe, tilt: breathe }, dy: breathe * 2 };
  }
};

/** agiz: 0..1 ses şiddeti (dudak senkronu; SceneProps.ses(t) ile gelir). kostum: konuya göre kıyafet */
export const Merakli: React.FC<{ x: number; y: number; s?: number; t: number; hareket?: Hareket; duygu?: Duygu; poz?: Poz; flip?: boolean; ink?: string; o?: number; kostum?: Kostum; agiz?: number }> = ({
  x, y, s = 1, t, hareket = "dur", duygu, poz, flip = false, ink, o = 1, kostum = "yok", agiz,
}) => {
  const { p, dy } = hareketPoz(hareket, t, duygu);
  const blink = Math.floor(t * FPS) % 96 > 92 && !["happy", "laugh", "aha", "excited", "sleepy"].includes((poz?.mood || p.mood) as string);
  const fp: Poz = { ...p, ...(poz || {}) };
  if (agiz !== undefined) {
    fp.talk = agiz > 0.06 ? agiz : 0;
    fp.headdy = (fp.headdy || 0) - agiz * 4;
    fp.tilt = (fp.tilt || 0) + agiz * 3 * Math.sin(t * 7);
  }
  const shown = blink ? { ...fp, blink: true } : fp;
  return (
    <g opacity={o} transform={`translate(${x} ${y + dy}) scale(${flip ? -s : s} ${s}) translate(0 -306)`}>
      <ellipse cx={0} cy={310 - dy / s} rx={70} ry={10} fill={INK} opacity={0.18} />
      <MerakliFigur p={shown} ink={ink} kostum={kostum} />
    </g>
  );
};
