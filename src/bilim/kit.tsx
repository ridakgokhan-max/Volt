// Bir Dakikada Bilim — ortak çizim kiti (Volt kit.tsx üzerine kurulu)
import React from "react";
import { spring } from "remotion";
import { PaperBg } from "../kit";

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const INK = "#2b2420";
export const CHALK = "#f4efe2";
export const ACC = "#ffcf3a"; // vurgu sarısı
export const RED = "#d64933";
export const GREEN = "#3fae6a";
export const BLUE = "#3b82c4";
/** seri rozeti kategori renkleri */
export const KATEGORI_RENK: Record<string, string> = { bilim: BLUE, tarih: "#b5793a", teknoloji: "#7c4dff", "kendin yap": GREEN, doga: GREEN, uzay: "#1f3c88", sistem: RED };

export const cl = (x: number) => Math.max(0, Math.min(1, x));
export const ez = (x: number) => {
  const v = cl(x);
  return v * v * (3 - 2 * v);
};
/** a saniyesinde başlayıp d saniyede 0→1 */
export const ap = (t: number, a: number, d = 0.4) => ez((t - a) / d);
/** yaylı belirme (0→1, biraz taşar) */
export const sp = (t: number, a: number, damping = 11) =>
  spring({ frame: Math.max(0, (t - a) * FPS), fps: FPS, config: { damping, stiffness: 150, mass: 0.8 } });
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ---------- arka planlar ----------
export type BgKind = "parsomen" | "gece" | "plan" | "tahta" | "devre" | "sicak" | "yesil" | "gok";

const Stars: React.FC<{ t: number; n?: number; seed?: number }> = ({ t, n = 70, seed = 1 }) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = (k: number) => {
      const x = Math.sin(i * 127.1 + seed * 31.7 + k * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const x = r(1) * W;
    const y = r(2) * H;
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1 + r(3) * 2) + r(4) * 6));
    out.push(<circle key={i} cx={x} cy={y} r={1.5 + r(5) * 2.8} fill="#fff8dc" opacity={tw * 0.85} />);
  }
  return <g>{out}</g>;
};

const Dust: React.FC<{ t: number; color: string; n?: number }> = ({ t, color, n = 22 }) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = (k: number) => {
      const x = Math.sin(i * 91.3 + k * 47.9) * 24634.6345;
      return x - Math.floor(x);
    };
    const y = (r(1) * H - t * (18 + r(2) * 30)) % H;
    const yy = y < 0 ? y + H : y;
    const x = r(3) * W + Math.sin(t * 0.8 + i) * 25;
    out.push(<circle key={i} cx={x} cy={yy} r={2 + r(4) * 4} fill={color} opacity={0.18 + r(5) * 0.25} />);
  }
  return <g>{out}</g>;
};

export const Bg: React.FC<{ kind: BgKind; t: number; seed?: number }> = ({ kind, t, seed = 3 }) => {
  if (kind === "parsomen") {
    return (
      <>
        <PaperBg seed={seed} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Dust t={t} color="#8a6a3c" />
        </svg>
      </>
    );
  }
  const grad: Record<string, [string, string]> = {
    gece: ["#0e1a33", "#24345c"],
    plan: ["#123f73", "#1d5a9a"],
    tahta: ["#1f3b2e", "#2c5040"],
    devre: ["#0b1f1a", "#12372d"],
    sicak: ["#f3c9a5", "#e79f7d"],
    yesil: ["#d9f0dc", "#a9dcb6"],
    gok: ["#3d8fd6", "#cfeaff"],
  };
  const [a, b] = grad[kind];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id={`bg-${kind}`} cx="50%" cy="38%" r="85%">
          <stop offset="0%" stopColor={b} />
          <stop offset="100%" stopColor={a} />
        </radialGradient>
        <filter id={`bgn-${kind}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.09 0" />
        </filter>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#cfe6ff" strokeOpacity={0.18} strokeWidth={2} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#bg-${kind})`} />
      {kind === "gece" ? <Stars t={t} seed={seed} /> : null}
      {kind === "plan" ? <rect width={W} height={H} fill="url(#grid)" /> : null}
      {kind === "devre" ? <Circuit t={t} /> : null}
      {kind === "tahta" ? (
        <g opacity={0.1}>
          {[300, 720, 1180, 1560].map((y, i) => (
            <path key={i} d={`M 40 ${y} q 300 ${-30 + i * 15} 1000 ${10 - i * 8}`} stroke="#fff" strokeWidth={50} fill="none" strokeLinecap="round" />
          ))}
        </g>
      ) : null}
      {kind === "gok" ? <Clouds t={t} /> : null}
      {kind === "sicak" || kind === "yesil" ? <Bokeh t={t} color={kind === "sicak" ? "#fff2e0" : "#ffffff"} /> : null}
      <Dust t={t} color={kind === "sicak" || kind === "yesil" ? "#ffffff" : "#cfe6ff"} />
      <rect width={W} height={H} filter={`url(#bgn-${kind})`} />
    </svg>
  );
};

const Bokeh: React.FC<{ t: number; color: string }> = ({ t, color }) => (
  <g>
    {Array.from({ length: 12 }).map((_, i) => {
      const x = ((i * 397) % W) + Math.sin(t * 0.5 + i) * 30;
      const y = ((i * 613) % H) + Math.cos(t * 0.4 + i) * 30;
      return <circle key={i} cx={x} cy={y} r={40 + (i % 4) * 30} fill={color} opacity={0.12} />;
    })}
  </g>
);

const Clouds: React.FC<{ t: number }> = ({ t }) => (
  <g fill="#ffffff" opacity={0.85}>
    {[[150, 380, 1], [760, 520, 1.3], [420, 1500, 0.9], [900, 1700, 1.1]].map(([x, y, s], i) => {
      const xx = ((x + t * (14 + i * 6)) % 1400) - 160;
      return (
        <g key={i} transform={`translate(${xx} ${y}) scale(${s})`}>
          <circle cx={0} cy={0} r={55} /><circle cx={60} cy={-25} r={70} /><circle cx={130} cy={0} r={55} /><rect x={0} y={0} width={130} height={55} />
        </g>
      );
    })}
  </g>
);

const Circuit: React.FC<{ t: number }> = ({ t }) => {
  const lines = [
    "M 0 260 H 260 V 420 H 520", "M 1080 520 H 820 V 330 H 640", "M 0 1580 H 300 V 1420 H 560",
    "M 1080 1700 H 760 V 1520", "M 140 0 V 160 H 400", "M 940 1920 V 1780 H 680", "M 0 900 H 120 V 1100 H 60",
    "M 1080 1000 H 960 V 1200",
  ];
  return (
    <g>
      {lines.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#3fd39a" strokeOpacity={0.22} strokeWidth={6} fill="none" />
          <path d={d} stroke="#7fffc8" strokeWidth={8} fill="none" strokeDasharray="40 900" strokeDashoffset={-((t * 380 + i * 170) % 940)} strokeLinecap="round" opacity={0.75} />
        </g>
      ))}
    </g>
  );
};

// ---------- çöp adam (Volt Stick'in renk alabilen hali) ----------
type Mood = "happy" | "neutral" | "surprised" | "worried" | "serious";
type Arms = "down" | "up" | "point" | "stop" | "chin" | "thumb";
export const Kisi: React.FC<{ x: number; y: number; s?: number; mood?: Mood; arms?: Arms; t: number; flip?: boolean; color?: string; o?: number; walk?: number }> = ({
  x, y, s = 1, mood = "neutral", arms = "down", t, flip = false, color = INK, o = 1, walk = 0,
}) => {
  const f = t * FPS;
  const breathe = Math.sin(f / 14) * 3;
  const blink = f % 90 > 85;
  const eyeH = blink ? 1 : mood === "surprised" ? 9 : 6;
  const mouth = {
    happy: "M -16 22 Q 0 38 16 22",
    neutral: "M -12 26 L 12 26",
    surprised: "M 0 20 m -7 0 a 7 9 0 1 0 14 0 a 7 9 0 1 0 -14 0",
    worried: "M -14 30 Q 0 20 14 30",
    serious: "M -12 28 Q 0 24 12 28",
  }[mood];
  const wave = Math.sin(f / 6) * 10;
  const armPaths: Record<Arms, string[]> = {
    down: ["M 0 70 L -45 160", "M 0 70 L 45 160"],
    up: [`M 0 70 L -70 ${-10 + wave}`, `M 0 70 L 70 ${-10 - wave}`],
    point: ["M 0 70 L -45 160", "M 0 70 L 95 30"],
    stop: ["M 0 70 L -45 160", "M 0 70 L 80 60 L 85 0"],
    chin: ["M 0 70 L -45 160", "M 0 70 L 50 100 L 18 40"],
    thumb: ["M 0 70 L -45 160", "M 0 70 L 75 75 L 75 30"],
  };
  // yürüme: bacaklar ve kollar zıt yönde sallanır, gövde hafif zıplar
  const ph = t * walk * 9;
  const sw = walk > 0 ? Math.sin(ph) * 0.55 : 0;
  const bob = walk > 0 ? -Math.abs(Math.cos(ph)) * 8 : 0;
  const leg = (a: number) => {
    const kx = Math.sin(a) * 55;
    const fx = Math.sin(a) * 110;
    const lift = a < 0 ? 0 : -Math.max(0, Math.sin(ph * 1)) * 0;
    return `M 0 190 L ${kx} ${245 + lift} L ${fx} ${300 + Math.min(0, -Math.cos(a) * 0) - (Math.abs(a) > 0.3 && a > 0 ? 6 : 0)}`;
  };
  const arm = (a: number) => `M 0 70 L ${Math.sin(a) * 75} ${70 + Math.cos(a) * 85}`;
  return (
    <g opacity={o} transform={`translate(${x} ${y + breathe + bob}) scale(${flip ? -s : s} ${s})`} stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={0} y1={44} x2={0} y2={190} />
      {walk > 0 ? (
        <>
          <path d={leg(sw)} />
          <path d={leg(-sw)} />
          {arms === "down" ? <><path d={arm(-sw)} /><path d={arm(sw)} /></> : armPaths[arms].map((d, i) => <path key={i} d={d} />)}
        </>
      ) : (
        <>
          <line x1={0} y1={190} x2={-38} y2={300} />
          <line x1={0} y1={190} x2={38} y2={300} />
          {armPaths[arms].map((d, i) => <path key={i} d={d} />)}
        </>
      )}
      <circle cx={0} cy={0} r={46} fill={color === INK ? "#f6eedd" : "#ffffff22"} />
      <ellipse cx={-15} cy={-4} rx={5} ry={eyeH} fill={color} stroke="none" />
      <ellipse cx={15} cy={-4} rx={5} ry={eyeH} fill={color} stroke="none" />
      {mood === "worried" || mood === "serious" ? (
        <path d={mood === "worried" ? "M -24 -22 L -8 -18 M 24 -22 L 8 -18" : "M -24 -18 L -8 -14 M 24 -18 L 8 -14"} strokeWidth={4} />
      ) : null}
      <path d={mouth} strokeWidth={4} />
    </g>
  );
};

// ---------- parmak izi ----------
export type Pt = [number, number];
export const ridgePt = (k: number, th: number): Pt => {
  const r = 26 + k * 21;
  const w = 1 + 0.07 * Math.sin(3 * th + k * 0.7) + 0.04 * Math.sin(5 * th - k);
  return [r * w * Math.cos(th), r * 1.3 * w * Math.sin(th)];
};
// her halkanın boşluğu (radyan): boşluk uçları = çizgi bitişleri
export const GAPS: Record<number, [number, number]> = {
  1: [4.2, 5.1], 3: [0.35, 0.85], 5: [2.55, 2.95], 6: [5.35, 5.75], 8: [4.55, 5.0], 9: [1.35, 1.75], 10: [3.4, 3.75], 11: [0.2, 0.5],
};
export const BRANCHES: [number, number, number][] = [
  [4, 3.65, 3.95], [7, 0.85, 1.15], [2, 5.25, 5.55], [9, 2.4, 2.7],
];
export const NRING = 12;

const ringPath = (k: number): string => {
  const g = GAPS[k];
  const a0 = g ? g[1] : 0;
  const a1 = g ? g[0] + Math.PI * 2 : Math.PI * 2;
  const n = 90;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const th = a0 + ((a1 - a0) * i) / n;
    const [x, y] = ridgePt(k, th);
    d += (i ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d;
};
const branchPath = (b: [number, number, number]) => {
  const [k, a, bb] = b;
  const [x0, y0] = ridgePt(k, a);
  const [x1, y1] = ridgePt(k + 0.5, (a + bb) / 2);
  const [x2, y2] = ridgePt(k + 1, bb);
  return `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`;
};
/** ayırt edici noktalar: [x,y,tür] */
export const MINUTIAE: [number, number, "bitis" | "catal"][] = [
  ...Object.entries(GAPS).flatMap(([k, g]) => [ridgePt(+k, g[0]), ridgePt(+k, g[1])].map((p) => [p[0], p[1], "bitis"] as [number, number, "bitis"])),
  ...BRANCHES.map((b) => {
    const p = ridgePt(b[0], b[1]);
    return [p[0], p[1], "catal"] as [number, number, "catal"];
  }),
];
// haritada kullanılacak noktalar (seçilmiş) ve bağlantılar
export const MAP_IDX = [0, 2, 5, 7, 9, 11, 13, 16, 17, 18, 19];
export const MAP_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 0], [1, 8], [2, 9], [3, 7], [4, 10], [5, 9],
];

export const Fingerprint: React.FC<{ cx: number; cy: number; s?: number; color?: string; draw?: number; o?: number; sw?: number }> = ({
  cx, cy, s = 1, color = INK, draw = 1, o = 1, sw = 9,
}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={draw <= 0.01 ? 0 : o} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
    {Array.from({ length: NRING }).map((_, k) => (
      <path key={k} d={ringPath(k)} pathLength={1} strokeDasharray={`${draw} 1`} />
    ))}
    {BRANCHES.map((b, i) => (
      <path key={"b" + i} d={branchPath(b)} pathLength={1} strokeDasharray={`${draw} 1`} />
    ))}
  </g>
);

// ---------- nesneler ----------
export const Phone: React.FC<{ cx: number; cy: number; s?: number; screen?: string; children?: React.ReactNode; color?: string }> = ({
  cx, cy, s = 1, screen = "#1b2333", children, color = INK,
}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <rect x={-170} y={-330} width={340} height={660} rx={46} fill="#2a2f3a" stroke={color} strokeWidth={9} />
    <rect x={-148} y={-300} width={296} height={600} rx={30} fill={screen} />
    <rect x={-40} y={-318} width={80} height={10} rx={5} fill="#555" />
    {children}
  </g>
);

export const Lock: React.FC<{ cx: number; cy: number; s?: number; open?: number; color?: string; fill?: string }> = ({
  cx, cy, s = 1, open = 0, color = INK, fill = ACC,
}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`} stroke={color} strokeWidth={9} strokeLinecap="round">
    <path d={`M -45 -10 V -60 A 45 45 0 0 1 45 -60 V ${-10 - open * 55}`} fill="none" transform={`translate(0 ${-open * 18})`} />
    <rect x={-75} y={-15} width={150} height={120} rx={20} fill={fill} />
    <circle cx={0} cy={35} r={14} fill={color} stroke="none" />
    <rect x={-5} y={40} width={10} height={35} fill={color} stroke="none" />
  </g>
);

export const Check: React.FC<{ cx: number; cy: number; s?: number; k?: number; color?: string }> = ({ cx, cy, s = 1, k = 1, color = GREEN }) => k <= 0.01 ? null : (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <circle r={80} fill={color} stroke={INK} strokeWidth={8} opacity={cl(k * 2)} />
    <path d="M -38 2 L -10 30 L 42 -28" stroke="#fff" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
  </g>
);

export const Cross: React.FC<{ cx: number; cy: number; r?: number; k?: number; color?: string; sw?: number }> = ({ cx, cy, r = 140, k = 1, color = RED, sw = 22 }) => (
  <g stroke={color} strokeWidth={sw} strokeLinecap="round">
    {k > 0.01 ? <path d={`M ${cx - r} ${cy - r} L ${cx + r} ${cy + r}`} pathLength={1} strokeDasharray={`${cl(k * 2)} 1`} /> : null}
    {k > 0.51 ? <path d={`M ${cx + r} ${cy - r} L ${cx - r} ${cy + r}`} pathLength={1} strokeDasharray={`${cl(k * 2 - 1)} 1`} /> : null}
  </g>
);

export const Tag: React.FC<{ x: number; y: number; text: string; k?: number; size?: number; bg?: string; color?: string; rot?: number }> = ({
  x, y, text, k = 1, size = 52, bg = ACC, color = INK, rot = 0,
}) => {
  const w = text.length * size * 0.7 + 56;
  const h = size * 1.45;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`} opacity={cl(k * 1.5)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={bg} stroke={INK} strokeWidth={6} />
      <text x={0} y={size * 0.35} textAnchor="middle" fontSize={size} fontWeight={900} fill={color} style={{ fontFamily: "var(--font)" }}>
        {text}
      </text>
    </g>
  );
};

export const Txt: React.FC<{ x: number; y: number; text: string; size?: number; color?: string; o?: number; weight?: number; stroke?: string }> = ({
  x, y, text, size = 56, color = INK, o = 1, weight = 900, stroke,
}) => (
  <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={weight} fill={color} opacity={o}
    stroke={stroke} strokeWidth={stroke ? size / 9 : 0} paintOrder="stroke" style={{ fontFamily: "var(--font)" }}>
    {text}
  </text>
);

export const Arrow: React.FC<{ x0: number; y0: number; x1: number; y1: number; k?: number; color?: string; sw?: number }> = ({
  x0, y0, x1, y1, k = 1, color = INK, sw = 8,
}) => {
  const xe = lerp(x0, x1, k);
  const ye = lerp(y0, y1, k);
  const a = Math.atan2(ye - y0, xe - x0);
  const h = 26;
  return k <= 0.01 ? null : (
    <g stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none">
      <line x1={x0} y1={y0} x2={xe} y2={ye} />
      <path d={`M ${xe - h * Math.cos(a - 0.5)} ${ye - h * Math.sin(a - 0.5)} L ${xe} ${ye} L ${xe - h * Math.cos(a + 0.5)} ${ye - h * Math.sin(a + 0.5)}`} strokeLinejoin="round" />
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

// ---------- kamera: tek çizim üzerinde gezinme ----------
/** t anında kameranın baktığı nokta (x,y) ve yakınlık (z). anlar zamana göre sıralı. */
export type KameraAn = { t: number; x: number; y: number; z: number };
export const kameraAn = (t: number, anlar: KameraAn[]) => {
  if (t <= anlar[0].t) return anlar[0];
  for (let i = 0; i < anlar.length - 1; i++) {
    const a = anlar[i];
    const b = anlar[i + 1];
    if (t <= b.t) {
      const k = ez((t - a.t) / Math.max(b.t - a.t, 0.001));
      return { t, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) };
    }
  }
  return anlar[anlar.length - 1];
};
export const Kamera: React.FC<{ t: number; anlar: KameraAn[]; children: React.ReactNode }> = ({ t, anlar, children }) => {
  const k = kameraAn(t, anlar);
  return <g transform={`translate(540 920) scale(${k.z}) translate(${-k.x} ${-k.y})`}>{children}</g>;
};

// ---------- odak: anlatılan parça parlar, gerisi kararır ----------
/** a..b saniyeleri arasında (x,y) çevresi aydınlık kalır; rx/ry elips yarıçapları */
export const Odak: React.FC<{ id: string; t: number; a: number; b?: number; x: number; y: number; rx: number; ry?: number; renk?: string; koyu?: number }> = ({
  id, t, a, b = 1e9, x, y, rx, ry, renk = ACC, koyu = 0.62,
}) => {
  const k = ap(t, a, 0.35) * (1 - ap(t, b, 0.35));
  if (k <= 0.005) return null;
  const r2 = ry ?? rx;
  const nefes = 1 + 0.03 * Math.sin(t * 6);
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0.82" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id={`${id}-m`}>
          <rect x={-3000} y={-3000} width={7000} height={8000} fill="#fff" />
          <ellipse cx={x} cy={y} rx={rx * nefes} ry={r2 * nefes} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <rect x={-3000} y={-3000} width={7000} height={8000} fill="#05070c" opacity={koyu * k} mask={`url(#${id}-m)`} />
      <ellipse cx={x} cy={y} rx={rx * nefes} ry={r2 * nefes} fill="none" stroke={renk} strokeWidth={6} strokeDasharray="22 14"
        strokeDashoffset={-t * 60} opacity={0.9 * k} />
    </g>
  );
};
