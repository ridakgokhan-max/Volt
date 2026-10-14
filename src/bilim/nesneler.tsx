// Hazır nesne kütüphanesi — her konuda tekrar çizmek yerine buradan alınır.
// Hepsi aynı imza: <Ampul x y s t ... />  (x,y merkez; s ölçek; t saniye — kendi küçük animasyonları için)
import React from "react";
import { ACC, BLUE, cl, GREEN, INK, RED } from "./kit";

type N = { x: number; y: number; s?: number; t?: number; r?: number };
const G: React.FC<N & { children: React.ReactNode }> = ({ x, y, s = 1, r = 0, children }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>{children}</g>
);
const st = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Ampul: yan (0..1) ile parlar */
export const Ampul: React.FC<N & { yan?: number }> = ({ yan = 1, t = 0, ...p }) => (
  <G {...p}>
    {yan > 0 ? <circle r={110 + 8 * Math.sin(t * 6)} cy={-20} fill={ACC} opacity={0.28 * yan} /> : null}
    {yan > 0
      ? Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const l = 96 + 10 * Math.sin(t * 8 + i);
          return <path key={i} d={`M ${Math.cos(a) * 78} ${-20 + Math.sin(a) * 78} L ${Math.cos(a) * l} ${-20 + Math.sin(a) * l}`} {...st} stroke={ACC} strokeWidth={7} opacity={yan} />;
        })
      : null}
    <path d="M -28 30 C -28 6 -58 -6 -58 -36 C -58 -72 -30 -92 0 -92 C 30 -92 58 -72 58 -36 C 58 -6 28 6 28 30 Z" fill={yan > 0.3 ? "#fff6b8" : "#e8eef2"} {...st} />
    <path d="M -12 28 L -12 -8 L -4 -24 L 4 -8 L 12 -24 L 12 28" fill="none" {...st} strokeWidth={4} stroke={yan > 0.3 ? "#e08a00" : INK} />
    <rect x={-30} y={30} width={60} height={30} rx={6} fill="#a7adb6" {...st} />
    <path d="M -30 42 L 30 42 M -30 52 L 30 52" {...st} strokeWidth={3} />
    <path d="M -14 60 Q 0 74 14 60" fill="#555" {...st} strokeWidth={4} />
  </G>
);

/** Dişli: diş sayısı ve dönüş hızı */
export const Disli: React.FC<N & { dis?: number; hiz?: number; renk?: string; yc?: number }> = ({ dis = 12, hiz = 40, renk = "#c99a3b", yc = 60, t = 0, ...p }) => {
  const pts: string[] = [];
  for (let i = 0; i < dis * 4; i++) {
    const a = (i / (dis * 4)) * Math.PI * 2;
    const rr = i % 4 === 1 || i % 4 === 2 ? yc + 16 : yc;
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`);
  }
  return (
    <G {...p}>
      <g transform={`rotate(${t * hiz})`}>
        <polygon points={pts.join(" ")} fill={renk} {...st} />
        <circle r={yc * 0.55} fill="none" {...st} strokeWidth={4} opacity={0.6} />
        <circle r={yc * 0.2} fill="#fff" {...st} />
      </g>
    </G>
  );
};

/** Mıknatıs: alan çizgileri akar */
export const Miknatis: React.FC<N> = ({ t = 0, ...p }) => (
  <G {...p}>
    {[60, 95, 130].map((r, i) => (
      <path key={i} d={`M -45 -70 C -45 ${-70 - r * 1.6} 45 ${-70 - r * 1.6} 45 -70`} fill="none" stroke={BLUE} strokeWidth={4} strokeDasharray="14 12" strokeDashoffset={-t * 40} opacity={0.7} />
    ))}
    <path d="M -75 -70 L -75 20 A 75 75 0 0 0 75 20 L 75 -70 L 15 -70 L 15 20 A 15 15 0 0 1 -15 20 L -15 -70 Z" fill={RED} {...st} />
    <rect x={-75} y={-100} width={60} height={30} fill="#e9e9e9" {...st} />
    <rect x={15} y={-100} width={60} height={30} fill="#e9e9e9" {...st} />
    <text x={-45} y={-77} textAnchor="middle" fontSize={24} fontWeight={900} fill={INK}>N</text>
    <text x={45} y={-77} textAnchor="middle" fontSize={24} fontWeight={900} fill={INK}>S</text>
  </G>
);

/** Pil: dolu (0..1) */
export const Pil: React.FC<N & { dolu?: number }> = ({ dolu = 0.7, ...p }) => {
  const c = dolu > 0.5 ? GREEN : dolu > 0.2 ? ACC : RED;
  return (
    <G {...p}>
      <rect x={-50} y={-90} width={100} height={180} rx={14} fill="#f4f1ea" {...st} />
      <rect x={-20} y={-108} width={40} height={18} rx={4} fill="#a7adb6" {...st} />
      <rect x={-38} y={78 - 156 * cl(dolu)} width={76} height={156 * cl(dolu)} rx={6} fill={c} />
      <path d="M 6 -40 L -14 4 L 4 4 L -6 44 L 16 -4 L -2 -4 Z" fill="#fff" {...st} strokeWidth={4} />
    </G>
  );
};

/** Dünya: kıtalar döner */
export const Dunya: React.FC<N> = ({ t = 0, ...p }) => {
  const k = (t * 30) % 240;
  const kita = (ox: number, oy: number, i: number) => {
    const x = ((ox + k + 600) % 240) - 120;
    return <path key={i} d={`M ${x} ${oy} q 20 -24 44 -8 q 18 16 -2 34 q -26 14 -40 -6 q -12 -10 -2 -20 Z`} fill={GREEN} stroke={INK} strokeWidth={4} />;
  };
  return (
    <G {...p}>
      <defs>
        <clipPath id="dunya-k">
          <circle r={95} />
        </clipPath>
      </defs>
      <circle r={95} fill={BLUE} />
      <g clipPath="url(#dunya-k)">{[[-80, -40], [10, 10], [-30, 50], [60, -60], [100, 40]].map(([a, b], i) => kita(a, b, i))}</g>
      <circle r={95} fill="none" {...st} />
      <path d="M -60 -50 A 80 80 0 0 1 -20 -80" stroke="#fff" strokeWidth={8} fill="none" opacity={0.5} strokeLinecap="round" />
    </G>
  );
};

/** Uydu: paneller ve sinyal halkaları */
export const Uydu: React.FC<N> = ({ t = 0, ...p }) => (
  <G {...p}>
    {[0, 1, 2].map((i) => {
      const k = ((t * 1.2 + i / 3) % 1);
      return <path key={i} d={`M ${-40 - k * 60} ${60 + k * 60} A ${30 + k * 90} ${30 + k * 90} 0 0 0 ${40 + k * 60} ${60 + k * 60}`} fill="none" stroke={ACC} strokeWidth={6} opacity={1 - k} />;
    })}
    <g transform={`rotate(${Math.sin(t * 1.5) * 8})`}>
      <rect x={-150} y={-24} width={95} height={48} fill={BLUE} {...st} />
      <path d="M -118 -24 L -118 24 M -86 -24 L -86 24" {...st} strokeWidth={3} />
      <rect x={55} y={-24} width={95} height={48} fill={BLUE} {...st} />
      <path d="M 87 -24 L 87 24 M 119 -24 L 119 24" {...st} strokeWidth={3} />
      <rect x={-55} y={-40} width={110} height={80} rx={10} fill="#d9d9d9" {...st} />
      <path d="M 0 40 L 0 62" {...st} />
      <path d="M -24 62 Q 0 82 24 62 Z" fill="#fff" {...st} />
    </g>
  </G>
);

/** Büyüteç */
export const Mercek: React.FC<N> = ({ t = 0, ...p }) => (
  <G {...p}>
    <path d="M 48 48 L 120 120" {...st} strokeWidth={22} stroke="#7a4b2a" />
    <circle r={70} fill="#dff3ff" opacity={0.6} />
    <circle r={70} fill="none" {...st} strokeWidth={12} />
    <path d={`M -40 -20 A 46 46 0 0 1 -10 -48`} stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.7 + 0.3 * Math.sin(t * 4)} />
  </G>
);

/** Saat: akrep yelkovan döner */
export const Saat: React.FC<N & { hiz?: number }> = ({ t = 0, hiz = 1, ...p }) => (
  <G {...p}>
    <circle r={90} fill="#fffaf0" {...st} strokeWidth={8} />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <path key={i} d={`M ${Math.sin(a) * 70} ${-Math.cos(a) * 70} L ${Math.sin(a) * 80} ${-Math.cos(a) * 80}`} {...st} strokeWidth={i % 3 === 0 ? 7 : 4} />;
    })}
    <path d="M 0 0 L 0 -42" {...st} strokeWidth={9} transform={`rotate(${t * 30 * hiz})`} />
    <path d="M 0 0 L 0 -66" {...st} strokeWidth={5} stroke={RED} transform={`rotate(${t * 360 * hiz})`} />
    <circle r={8} fill={INK} />
  </G>
);

/** Termometre: seviye 0..1 */
export const Termometre: React.FC<N & { seviye?: number }> = ({ seviye = 0.5, ...p }) => (
  <G {...p}>
    <path d="M -20 60 L -20 -110 A 20 20 0 0 1 20 -110 L 20 60" fill="#fff" {...st} />
    <circle cy={90} r={38} fill={RED} {...st} />
    <rect x={-9} y={60 - 160 * cl(seviye)} width={18} height={160 * cl(seviye) + 10} fill={RED} />
    {[-90, -50, -10, 30].map((y) => <path key={y} d={`M 20 ${y} L 34 ${y}`} {...st} strokeWidth={4} />)}
  </G>
);

/** Roket: alev titrer, yukseklik ile kalkar */
export const Roket: React.FC<N & { itki?: number }> = ({ t = 0, itki = 1, ...p }) => {
  const fl = 1 + 0.25 * Math.sin(t * 45);
  return (
    <G {...p}>
      {itki > 0 ? <path d={`M -22 80 Q 0 ${80 + 120 * fl * itki} 22 80 Z`} fill={ACC} stroke="#ff7a1a" strokeWidth={6} /> : null}
      <path d="M -40 60 L -70 100 L -40 90 Z M 40 60 L 70 100 L 40 90 Z" fill={RED} {...st} />
      <path d="M -40 90 L -40 -40 Q 0 -150 40 -40 L 40 90 Z" fill="#f4f1ea" {...st} />
      <circle cy={-20} r={20} fill={BLUE} {...st} />
      <path d="M -40 60 L 40 60" {...st} />
    </G>
  );
};

/** Atom: elektronlar yörüngede */
export const Atom: React.FC<N> = ({ t = 0, ...p }) => (
  <G {...p}>
    {[0, 60, 120].map((r, i) => {
      const a = t * (2.4 + i * 0.6) + i * 2;
      return (
        <g key={r} transform={`rotate(${r})`}>
          <ellipse rx={110} ry={38} fill="none" {...st} strokeWidth={5} />
          <circle cx={Math.cos(a) * 110} cy={Math.sin(a) * 38} r={11} fill={BLUE} {...st} strokeWidth={4} />
        </g>
      );
    })}
    <circle r={24} fill={RED} {...st} />
  </G>
);

/** Kitap: sayfalar çevrilir */
export const Kitap: React.FC<N & { ac?: number }> = ({ t = 0, ac = 1, ...p }) => {
  const sayfa = ((t * 0.9) % 1);
  return (
    <G {...p}>
      <path d={`M 0 -60 Q -60 ${-80 + 20 * (1 - ac)} -120 -60 L -120 70 Q -60 50 0 70 Z`} fill="#fffaf0" {...st} />
      <path d={`M 0 -60 Q 60 ${-80 + 20 * (1 - ac)} 120 -60 L 120 70 Q 60 50 0 70 Z`} fill="#fffaf0" {...st} />
      <path d={`M 0 -60 Q ${60 - 120 * sayfa} -80 ${120 - 240 * sayfa} -60 L ${120 - 240 * sayfa} 70 Q ${60 - 120 * sayfa} 50 0 70 Z`} fill="#f3e6c8" {...st} strokeWidth={4} opacity={ac} />
      {[-30, -5, 20].map((y) => <path key={y} d={`M -100 ${y} L -24 ${y} M 24 ${y} L 100 ${y}`} {...st} strokeWidth={3} opacity={0.5} />)}
    </G>
  );
};

/** Telefon (yuvarlak hatlı, ekranı renkli) */
export const Telefon: React.FC<N & { ekran?: string }> = ({ ekran = BLUE, t = 0, ...p }) => (
  <G {...p}>
    <rect x={-62} y={-120} width={124} height={240} rx={22} fill="#222" {...st} />
    <rect x={-50} y={-100} width={100} height={196} rx={10} fill={ekran} />
    <rect x={-30} y={-60 + 6 * Math.sin(t * 3)} width={60} height={14} rx={7} fill="#fff" opacity={0.85} />
    <rect x={-30} y={-30} width={44} height={14} rx={7} fill="#fff" opacity={0.6} />
    <circle cy={106} r={6} fill="#555" />
  </G>
);

export const NESNELER = { Ampul, Disli, Miknatis, Pil, Dunya, Uydu, Mercek, Saat, Termometre, Roket, Atom, Kitap, Telefon };
