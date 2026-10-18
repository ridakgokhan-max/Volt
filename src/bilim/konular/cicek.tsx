// Konu 9/30 (Kendin Yap): Pet şişeyle otomatik sulama. ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, cl, ez, GREEN, Glow, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const SU = "#5fb8ff";

/** Saksı + bitki; canli 0 = solgun, 1 = canlı */
const Saksi: React.FC<{ x: number; y: number; s?: number; t: number; canli?: number; nem?: number }> = ({ x, y, s = 1, t, canli = 1, nem = 0 }) => {
  const egik = lerp(55, 0, canli);
  const yesil = canli > 0.5 ? GREEN : "#9a8a4a";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-1, 1].map((d) => (
        <path key={d} d={`M 0 0 Q ${d * 40} -110 ${d * 150} ${-150 + egik + Math.sin(t * 2 + d) * 5 * canli}`} stroke={yesil} strokeWidth={12} fill="none" strokeLinecap="round" />
      ))}
      <circle cx={-150} cy={-160 + egik} r={40} fill={canli > 0.5 ? RED : "#a3756a"} stroke={INK} strokeWidth={6} />
      <circle cx={150} cy={-150 + egik} r={36} fill={canli > 0.5 ? ACC : "#b8a877"} stroke={INK} strokeWidth={6} />
      <rect x={-180} y={-10} width={360} height={40} rx={10} fill="#d47a48" stroke={INK} strokeWidth={8} />
      <path d="M -160 30 L 160 30 L 120 290 L -120 290 Z" fill="#c4683a" stroke={INK} strokeWidth={8} />
      <rect x={-150} y={30} width={300} height={40} fill={nem > 0.5 ? "#5a3b25" : "#8a6646"} />
    </g>
  );
};

/** Pet şişe (ters = kapak aşağıda) */
const Sise: React.FC<{ x: number; y: number; s?: number; dolu?: number; ters?: number; delik?: boolean }> = ({ x, y, s = 1, dolu = 0, ters = 0, delik }) => (
  <g transform={`translate(${x} ${y}) rotate(${ters * 180}) scale(${s})`}>
    <path d="M -70 -60 L 70 -60 L 70 200 Q 70 230 40 230 L -40 230 Q -70 230 -70 200 Z" fill="#cfeaff" fillOpacity={0.55} stroke={INK} strokeWidth={6} />
    <path d="M -70 -60 Q -70 -120 -30 -150 L -30 -190 L 30 -190 L 30 -150 Q 70 -120 70 -60 Z" fill="#cfeaff" fillOpacity={0.55} stroke={INK} strokeWidth={6} />
    {dolu > 0.01 ? <rect x={-66} y={226 - 280 * dolu} width={132} height={280 * dolu} fill={SU} opacity={0.75} /> : null}
    <rect x={-36} y={-225} width={72} height={40} rx={8} fill={BLUE} stroke={INK} strokeWidth={5} />
    {delik ? <><circle cx={-12} cy={-225} r={5} fill={INK} /><circle cx={12} cy={-225} r={5} fill={INK} /></> : null}
  </g>
);

// ---------- 1 — Çiçeklerin kurumasın: tatil + solan çiçek ----------
const Giris: S = ({ t, ws, ses }) => {
  const tt = ws("tatile");
  const sol = ap(t, ws("kuruyacak") - 0.3, 1.0);
  return (
    <g>
      <Glow cx={850} cy={420} r={240} id="gn" color="#fff1a8" o={0.8} />
      <circle cx={850} cy={420} r={80} fill="#ffe36b" stroke={INK} strokeWidth={6} />
      <Saksi x={420} y={860} t={t} canli={1 - sol} />
      <g opacity={ap(t, tt - 0.3, 0.3)} transform={`translate(${lerp(1200, 820, ap(t, tt - 0.3, 0.8))} 1000)`}>
        <rect x={-110} y={-140} width={220} height={190} rx={20} fill="#3a7bd5" stroke={INK} strokeWidth={7} />
        <rect x={-40} y={-175} width={80} height={40} rx={10} fill="none" stroke={INK} strokeWidth={8} />
        <Txt x={0} y={-30} text="TATİL" size={40} color="#fff" />
      </g>
      <Merakli x={160} y={1240} s={0.5} t={t} hareket={sol > 0.5 ? "uzgun" : "salla"} kostum="baret" agiz={ses(t)} />
    </g>
  );
};

// ---------- 2 — Bir pet şişe bir haftalığına çözer ----------
const Cozum: S = ({ t, ws, ses }) => {
  const th = ws("haftalığına");
  return (
    <g>
      <g transform={`translate(540 ${lerp(1300, 760, ez((t - 0.1) / 0.7))}) rotate(${Math.sin(t * 3) * 5})`}><Sise x={0} y={0} s={1.3} dolu={0} /></g>
      <g transform={`translate(800 520) scale(${sp(t, th - 0.2, 8)})`}>
        <circle r={110} fill={ACC} stroke={INK} strokeWidth={8} />
        <text y={-6} textAnchor="middle" fontSize={64} fontWeight={900} fill={INK} style={font}>1</text>
        <text y={46} textAnchor="middle" fontSize={40} fontWeight={900} fill={INK} style={font}>HAFTA</text>
      </g>
      <Tag x={540} y={340} text="BEDAVA ÇÖZÜM" size={50} k={sp(t, 0.3)} bg={GREEN} color="#fff" rot={-2} />
    </g>
  );
};

// ---------- 3 — Isıtılmış iğneyle kapağa 1-2 delik ----------
const Delik: S = ({ t, ws, ses }) => {
  const ti = ws("iğneyle");
  const td = ws("delik");
  const in_ = ez((t - td + 0.4) / 0.4);
  return (
    <g>
      <g transform="translate(540 820)">
        <ellipse cx={0} cy={0} rx={200} ry={60} fill={BLUE} stroke={INK} strokeWidth={8} />
        <rect x={-200} y={0} width={400} height={90} fill={BLUE} stroke={INK} strokeWidth={8} />
        <ellipse cx={0} cy={0} rx={200} ry={60} fill="#5a95e6" stroke={INK} strokeWidth={8} />
        {t > td + 0.1 ? <><circle cx={-40} cy={0} r={10} fill={INK} /><circle cx={40} cy={0} r={10} fill={INK} /></> : null}
      </g>
      {/* çakmak alevi + kızaran iğne */}
      <g opacity={ap(t, ti - 0.4, 0.3)} transform="translate(250 560)">
        <rect x={-30} y={0} width={60} height={110} rx={10} fill={RED} stroke={INK} strokeWidth={6} />
        <path d={`M 0 ${-90 + Math.sin(t * 14) * 5} C 34 -40 30 -6 0 -6 C -30 -6 -34 -40 0 ${-90 - Math.sin(t * 14) * 5} Z`} fill="#ffb02e" stroke="#e8661c" strokeWidth={4} />
      </g>
      <g opacity={ap(t, ti - 0.3, 0.3)} transform={`translate(${lerp(260, 500, in_)} ${lerp(470, 760, in_)}) rotate(${lerp(-60, -25, in_)})`}>
        <line x1={0} y1={0} x2={0} y2={-260} stroke="#9aa3b0" strokeWidth={10} strokeLinecap="round" />
        <line x1={0} y1={0} x2={0} y2={-60} stroke="#ff5a2a" strokeWidth={10} strokeLinecap="round" />
      </g>
      <Tag x={540} y={340} text="1-2 KÜÇÜK DELİK" size={50} k={sp(t, td)} bg={ACC} rot={-2} />
      <Merakli x={880} y={1240} s={0.45} t={t} hareket="anlat" kostum="baret" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 4 — Doldur, kapat, toprağı sula, ters çevir, 5-6 cm göm ----------
const Gom: S = ({ t, ws, ses }) => {
  const tdol = ws("suyla");
  const tka = ws("kapat");
  const tsu = ws("sula");
  const tte = ws("ters");
  const tg = ws("göm");
  const dolu = ap(t, tdol - 0.2, 0.9);
  const ters = ez((t - tte + 0.1) / 0.6);
  const gom = ez((t - tg + 0.8) / 0.8);
  return (
    <g>
      <Saksi x={540} y={1000} s={0.9} t={t} nem={ap(t, tsu, 0.3)} />
      <g transform={`translate(${lerp(820, 540, ters)} ${lerp(640, 760 + gom * 60, ters)})`}>
        <Sise x={0} y={0} s={0.7} dolu={dolu} ters={ters} delik />
      </g>
      {t > tsu - 0.2 && t < tte ? [0, 1, 2].map((i) => {
        const u = ((t * 1.5 + i / 3) % 1);
        return <circle key={i} cx={460 + i * 60} cy={760 + u * 200} r={10} fill={SU} opacity={1 - u} />;
      }) : null}
      <g opacity={ap(t, tg - 0.5, 0.3)}>
        <line x1={760} y1={1030} x2={760} y2={1090} stroke={RED} strokeWidth={8} />
        <Txt x={860} y={1075} text="5-6 cm" size={42} color={CHALK} stroke={INK} />
      </g>
      {[["DOLDUR", tdol], ["KAPAT", tka], ["SULA", tsu], ["TERS ÇEVİR", tte], ["GÖM", tg]].map(([ad, tt], i) => (
        <Tag key={ad as string} x={540} y={340} text={`${i + 1}. ${ad}`} size={50} k={sp(t, (tt as number) - 0.15) * (i < 4 ? 1 - ap(t, ([tka, tsu, tte, tg][i] as number) - 0.2, 0.15) : 1)} bg={ACC} rot={i % 2 ? 2 : -2} />
      ))}
    </g>
  );
};

// ---------- 5 — Soru: su neden bir anda boşalmıyor? ----------
const Soru: S = ({ t, ws, ses }) => (
  <g>
    <Saksi x={540} y={1000} s={0.9} t={t} nem={1} />
    <g transform="translate(540 820)"><Sise x={0} y={0} s={0.7} dolu={0.8} ters={1} delik /></g>
    <g transform={`translate(830 560) scale(${sp(t, ws("neden") - 0.2, 8)}) rotate(${Math.sin(t * 4) * 7})`}>
      <text textAnchor="middle" y={60} fontSize={220} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>?</text>
    </g>
    <Merakli x={200} y={1240} s={0.48} t={t} hareket="dusun" kostum="baret" agiz={ses(t)} />
  </g>
);

// ---------- 6 — Hava giremiyor; toprak kurudukça hava girer, su o kadar çıkar ----------
const Hava: S = ({ t, ws, ses }) => {
  const tk = ws("kuruduğu");
  const tn = ws("nemliyken");
  const kuru = ap(t, tk - 0.2, 0.6) * (1 - ap(t, tn - 0.3, 0.4));
  return (
    <g>
      <g transform="translate(540 760)"><Sise x={0} y={0} s={1.1} dolu={0.75 - 0.05 * cl(t / 6)} ters={1} delik /></g>
      <rect x={160} y={1000} width={760} height={300} rx={20} fill={kuru > 0.5 ? "#a37a52" : "#5a3b25"} stroke={INK} strokeWidth={8} />
      {/* yükselen hava kabarcıkları */}
      {kuru > 0.05 ? [0, 1, 2, 3].map((i) => {
        const u = ((t * 0.9 + i / 4) % 1);
        return <circle key={i} cx={530 + Math.sin(i * 2 + t * 3) * 14} cy={lerp(990, 640, u)} r={12 + i * 2} fill="none" stroke="#fff" strokeWidth={5} opacity={(1 - u) * kuru} />;
      }) : null}
      {/* inen damlalar */}
      {kuru > 0.05 ? [0, 1].map((i) => {
        const u = ((t * 1.2 + i / 2) % 1);
        return <circle key={i} cx={540} cy={1010 + u * 120} r={10} fill={SU} opacity={(1 - u) * kuru} />;
      }) : null}
      <Tag x={540} y={340} text="HAVA GİREMİYOR" size={50} k={sp(t, 0.15) * (1 - ap(t, tk - 0.3, 0.2))} bg={BLUE} color="#fff" rot={-2} />
      <Tag x={540} y={340} text="TOPRAK KURUYUNCA DAMLAR" size={40} k={sp(t, tk) * (1 - ap(t, tn - 0.3, 0.2))} bg={ACC} rot={2} />
      <Tag x={540} y={340} text="NEMLİYKEN DURUR" size={50} k={sp(t, tn)} bg={GREEN} color="#fff" rot={-2} />
    </g>
  );
};

// ---------- 7 — Gitmeden önce dene; delik büyükse bir günde biter ----------
const Dene: S = ({ t, ws, ses }) => {
  const tb = ws("büyükse");
  const bos = ap(t, tb, 1.4);
  return (
    <g>
      <g transform="translate(300 620)">
        <rect x={-150} y={-160} width={300} height={320} rx={16} fill="#fff" stroke={INK} strokeWidth={8} />
        <rect x={-150} y={-160} width={300} height={80} rx={16} fill={RED} stroke={INK} strokeWidth={8} />
        <Txt x={0} y={50} text="TEST" size={70} color={INK} />
      </g>
      <g transform="translate(780 760)" opacity={ap(t, tb - 0.3, 0.3)}><Sise x={0} y={0} s={0.9} dolu={0.85 * (1 - bos)} ters={1} /></g>
      <g transform={`translate(780 1110) scale(${sp(t, tb + 0.4, 8)})`}>
        <rect x={-170} y={-50} width={340} height={96} rx={48} fill={RED} stroke={INK} strokeWidth={6} />
        <text x={0} y={16} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" style={font}>1 GÜNDE BİTER</text>
      </g>
      <Tag x={540} y={340} text="ÖNCE DENE!" size={58} k={sp(t, ws("dene") - 0.1)} bg={ACC} rot={-3} />
      <Merakli x={240} y={1240} s={0.45} t={t} hareket="isaret" kostum="baret" agiz={ses(t)} />
    </g>
  );
};

// ---------- 8 — Sonuç: bitki ihtiyacı kadar suyu kendisi alır ----------
const Sonuc: S = ({ t, ws, ses }) => {
  const tk = ws("kendisi");
  return (
    <g>
      <Glow cx={540} cy={700} r={360} id="cs" color="#fff1a8" o={0.4 * ap(t, tk - 0.3, 0.5)} />
      <Saksi x={540} y={980} s={1.05} t={t} canli={1} nem={1} />
      <g transform="translate(600 800)"><Sise x={0} y={0} s={0.6} dolu={0.6} ters={1} delik /></g>
      <Tag x={540} y={340} text="KENDİ KENDİNE SULANIYOR" size={42} k={sp(t, tk - 0.1)} bg={GREEN} color="#fff" rot={-2} />
      <Merakli x={880} y={1240} s={0.5} t={t} hareket={t > tk ? "kahkaha" : "anlat"} kostum="baret" agiz={ses(t)} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, cozum: Cozum, delik: Delik, gom: Gom, soru: Soru, hava: Hava, dene: Dene, sonuc: Sonuc };

export const KAPAK: React.FC = () => (
  <g>
    <Saksi x={480} y={1380} s={1.2} t={0.2} canli={1} nem={1} />
    <g transform="translate(560 1160)"><Sise x={0} y={0} s={0.8} dolu={0.7} ters={1} delik /></g>
    <Merakli x={880} y={1720} s={0.8} t={0.3} hareket="aha" kostum="baret" />
  </g>
);
export const KAPAK_YAZI = { ust: "Tatile gidiyorsun ama", buyuk: "ÇİÇEKLER KURUMASIN", alt: "Pet şişeyle bedava otomatik sulama" };
