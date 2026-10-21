// Kolaj sahne kiti (SVG içinde): kesilmiş foto parçaları, yırtık kâğıt şerit, kırmızı mühür.
// Parçalar scripts/kolaj_kes.py ile üretilir → public/bilim/<klasor>/<ad>.png, en-boy oranları <klasor>/olcu.json'da.
import React from "react";
import { random, staticFile } from "remotion";
import { cl, INK } from "./kit";

export const KREM = "#F4ECD8";
export const KIRMIZI = "#C8402B";
export const geri = (x: number) => { const c = 1.9; const y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };
export const adim = (t: number) => Math.floor(t * 12) / 12; // stop-motion zamanı

/** Sahne başına bir kez koy: gölge filtresi */
export const KolajDefs: React.FC = () => (
  <defs>
    <filter id="kgolge" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="10" dy="14" stdDeviation="0" floodColor="#281400" floodOpacity="0.28" />
    </filter>
  </defs>
);

export type Yon = "alt" | "ust" | "sol" | "sag" | "pop" | "yok";
export const yap = (klasor: string, olcu: Record<string, number>) => {
  /** Kesilmiş foto parçası. x = merkez, y = üst kenar. */
  const Parca: React.FC<{ t: number; ad: string; x: number; y: number; w: number; rot?: number; a?: number; yon?: Yon; d?: number; cikis?: number; flip?: boolean; o?: number }> = ({
    t, ad, x, y, w, rot = 0, a = 0, yon = "pop", d = 0.4, cikis, flip, o = 1,
  }) => {
    const tq = adim(t);
    if (tq < a) return null;
    const k = a <= 0 || yon === "yok" ? 1 : geri(cl((tq - a) / d));
    let dx = 0, dy = 0, s = 1;
    if (yon === "alt") dy = (1 - k) * 1300;
    if (yon === "ust") dy = -(1 - k) * 1300;
    if (yon === "sol") dx = -(1 - k) * 1300;
    if (yon === "sag") dx = (1 - k) * 1300;
    if (yon === "pop") s = Math.max(0, k);
    let op = o;
    if (cikis !== undefined && tq > cikis) { const c = cl((tq - cikis) / 0.35); s *= 1 - c; op *= 1 - c; }
    if (s <= 0.001 || op <= 0.001) return null;
    const n = Math.floor(t * 12);
    const jr = (random(`${ad}r${n}`) - 0.5) * 1.2;
    const jx = (random(`${ad}x${n}`) - 0.5) * 3;
    const h = w * (olcu[ad] || 1);
    return (
      <g transform={`translate(${x + dx + jx} ${y + h * 0.6 + dy}) rotate(${rot + jr}) scale(${(flip ? -1 : 1) * s} ${s})`} opacity={op} filter="url(#kgolge)">
        <image href={staticFile(`bilim/${klasor}/${ad}.png`)} x={-w / 2} y={-h * 0.6} width={w} height={h} />
      </g>
    );
  };
  return { Parca };
};

/** Yırtık kâğıt şerit üzerinde yazı (x,y = merkez) */
export const Serit: React.FC<{ t: number; a?: number; text: string; x?: number; y: number; rot?: number; size?: number; bg?: string; color?: string; cikis?: number }> = ({
  t, a = 0, text, x = 540, y, rot = -2, size = 64, bg = KREM, color = INK, cikis,
}) => {
  const tq = adim(t);
  if (tq < a) return null;
  let k = a <= 0 ? 1 : geri(cl((tq - a) / 0.3));
  if (cikis !== undefined && tq > cikis) k *= 1 - cl((tq - cikis) / 0.25);
  if (k <= 0.001) return null;
  const n = Math.floor(t * 12);
  const jr = (random(`s${text}${n}`) - 0.5) * 0.8;
  const w = Math.min(1040, text.length * size * 0.66 + 90);
  const h = size * 1.55;
  const pts: string[] = [];
  const adimS = 12;
  for (let i = 0; i <= adimS; i++) pts.push(`${-w / 2 + (w * i) / adimS},${-h / 2 + (i % 2 ? 6 : -2) + random(`u${text}${i}`) * 5}`);
  for (let i = adimS; i >= 0; i--) pts.push(`${-w / 2 + (w * i) / adimS},${h / 2 + (i % 2 ? -5 : 3) - random(`a${text}${i}`) * 5}`);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + jr}) scale(${Math.max(0, k)} 1)`} filter="url(#kgolge)">
      <polygon points={pts.join(" ")} fill={bg} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontSize={size} fontWeight={900} fill={color} style={{ fontFamily: "var(--font)", letterSpacing: -0.5 }}>
        {text}
      </text>
    </g>
  );
};

/** Kırmızı mühür */
export const Muhur: React.FC<{ t: number; a: number; text: string; x: number; y: number; rot?: number; size?: number }> = ({ t, a, text, x, y, rot = -12, size = 110 }) => {
  const tq = adim(t);
  if (tq < a) return null;
  const k = cl((tq - a) / 0.17);
  const s = 2.2 - 1.2 * k;
  const w = text.length * size * 0.7 + 70;
  const h = size * 1.35;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={k}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="rgba(244,236,216,0.85)" stroke={KIRMIZI} strokeWidth={12} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontSize={size} fontWeight={900} fill={KIRMIZI} style={{ fontFamily: "var(--font)" }}>{text}</text>
    </g>
  );
};

/** Kâğıttan kesilmiş harita iğnesi */
export const Igne: React.FC<{ x: number; y: number; s?: number; renk?: string }> = ({ x, y, s = 1, renk = KIRMIZI }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#kgolge)">
    <path d="M0 0 C-14 -30 -60 -60 -60 -100 A60 60 0 1 1 60 -100 C60 -60 14 -30 0 0 Z" fill={KREM} transform="scale(1.12) translate(0 4)" />
    <path d="M0 0 C-14 -30 -60 -60 -60 -100 A60 60 0 1 1 60 -100 C60 -60 14 -30 0 0 Z" fill={renk} />
    <circle cx={0} cy={-100} r={24} fill={KREM} />
  </g>
);

/** Kâğıt yayın halkaları (sinyal) */
export const Halka: React.FC<{ x: number; y: number; t: number; renk?: string; buyuk?: number }> = ({ x, y, t, renk = KREM, buyuk = 240 }) => {
  const tq = adim(t);
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const u = (tq * 0.8 + i / 3) % 1;
        return <circle key={i} cx={x} cy={y} r={50 + u * buyuk} fill="none" stroke={renk} strokeWidth={14 * (1 - u) + 2} opacity={1 - u} />;
      })}
    </g>
  );
};

/** Kendin Yap teması: yarı saydam kâğıt bant (x,y = merkez) */
export const Bant: React.FC<{ x: number; y: number; w?: number; rot?: number }> = ({ x, y, w = 150, rot = -8 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <polygon points={`${-w / 2},-22 ${w / 2},-24 ${w / 2 - 6},-12 ${w / 2},0 ${w / 2 - 5},12 ${w / 2},24 ${-w / 2},22 ${-w / 2 + 6},10 ${-w / 2},0 ${-w / 2 + 5},-12`} fill="rgba(250,240,200,0.72)" stroke="rgba(120,90,40,0.18)" strokeWidth={2} />
  </g>
);

/** Kendin Yap teması: numaralı adım rozeti */
export const AdimNo: React.FC<{ t: number; a: number; n: number; x: number; y: number; renk?: string }> = ({ t, a, n, x, y, renk = KIRMIZI }) => {
  const tq = adim(t);
  if (tq < a) return null;
  const k = geri(cl((tq - a) / 0.3));
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(0, k)}) rotate(-6)`} filter="url(#kgolge)">
      <circle r={62} fill={KREM} />
      <circle r={50} fill={renk} />
      <text y={22} textAnchor="middle" fontSize={64} fontWeight={900} fill={KREM} style={{ fontFamily: "var(--font)" }}>{n}</text>
    </g>
  );
};
