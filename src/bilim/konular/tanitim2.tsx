// Kanal tanıtımı v2: takvimden henüz yayınlanmamış 5 merak (cevapsız, merak boşluğu) + yorum/takip çağrısı.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, cl, ez, GREEN, Glow, INK, lerp, RED, sp, Tag } from "../kit";
import { Merakli } from "../merakli";
import { Dunya, Telefon, Uydu } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };

/** Sallanan dev soru işareti */
const Soru: React.FC<{ x: number; y: number; k: number; t: number; s?: number }> = ({ x, y, k, t, s = 1 }) =>
  k <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k * s}) rotate(${Math.sin(t * 4) * 7})`}>
      <text textAnchor="middle" y={70} fontSize={220} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>?</text>
    </g>
  );

// ---------- 1 — Gökyüzü mor olmalıydı ----------
const Gok: S = ({ t, ws, ses }) => {
  const mor = 1 - ap(t, 1.6, 1.2); // önce mor, sonra maviye döner
  const tm = ws("mor");
  return (
    <g>
      <defs>
        <linearGradient id="gokmor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b2a9e" />
          <stop offset="100%" stopColor="#b48cf0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1960} fill="url(#gokmor)" opacity={mor} />
      <Glow cx={820} cy={420} r={260} id="gunes1" color="#fff4c4" o={0.9} />
      <circle cx={820} cy={420} r={90} fill="#fff3b0" stroke={INK} strokeWidth={6} />
      {/* güneşten saçılan renkli ışınlar */}
      {["#8a4dff", BLUE, GREEN, ACC, RED].map((c, i) => {
        const u = ((t * 0.7 + i / 5) % 1);
        const a = -2.4 + i * 0.25;
        return <line key={i} x1={820 + Math.cos(a) * 110} y1={420 + Math.sin(a) * 110} x2={820 + Math.cos(a) * (110 + u * 520)} y2={420 + Math.sin(a) * (110 + u * 520)} stroke={c} strokeWidth={12} strokeLinecap="round" opacity={1 - u} />;
      })}
      <rect x={0} y={1060} width={1080} height={940} fill="#3f6b3a" />
      <path d="M 0 1060 Q 270 980 540 1060 T 1080 1060 L 1080 1100 L 0 1100 Z" fill="#4f8a47" />
      <Soru x={330} y={720} k={sp(t, Math.max(tm, 2.1), 8)} t={t} />
      <Merakli x={760} y={1240} s={0.55} t={t} hareket={t > 2 ? "dusun" : "sasir"} kostum="onluk" agiz={ses(t)} />
    </g>
  );
};

// ---------- 2 — Konserve kutusunun açacağı yoktu ----------
const Konserve: S = ({ t, ws, ses }) => {
  const ta = ws("açacağı");
  const vur = (t * 2.6) % 1;
  const darbe = vur < 0.15 ? 1 - vur / 0.15 : 0;
  return (
    <g>
      <g transform={`translate(540 ${820 + darbe * 6})`}>
        <ellipse cx={0} cy={-170} rx={170} ry={46} fill="#d8dde6" stroke={INK} strokeWidth={8} />
        <rect x={-170} y={-170} width={340} height={340} fill="#c9ced8" stroke={INK} strokeWidth={8} />
        <ellipse cx={0} cy={170} rx={170} ry={46} fill="#aeb4c0" stroke={INK} strokeWidth={8} />
        <rect x={-170} y={-80} width={340} height={150} fill={RED} stroke={INK} strokeWidth={6} />
        <text x={0} y={18} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" style={font}>1810</text>
      </g>
      {/* çekiç + keski */}
      <g transform={`translate(560 ${560 - 40 * Math.sin(vur * Math.PI)}) rotate(${-20 + 30 * Math.sin(vur * Math.PI)})`}>
        <rect x={-14} y={-260} width={28} height={220} rx={10} fill="#a36a3a" stroke={INK} strokeWidth={6} />
        <rect x={-70} y={-300} width={140} height={60} rx={10} fill="#5d6b82" stroke={INK} strokeWidth={6} />
      </g>
      {darbe > 0.2 ? [0, 1, 2, 3].map((i) => <line key={i} x1={540} y1={650} x2={540 + Math.cos(i * 1.6) * 90 * darbe} y2={650 + Math.sin(i * 1.6) * 50 * darbe - 40} stroke={ACC} strokeWidth={8} strokeLinecap="round" />) : null}
      <Tag x={540} y={330} text="AÇACAK YOK!" size={60} k={sp(t, ta - 0.1, 8)} bg="#fff" rot={-3} />
      <Merakli x={880} y={1240} s={0.5} t={t} hareket="sasir" kostum="sapka" agiz={ses(t)} />
    </g>
  );
};

// ---------- 3 — Telefon 20.000 km yukarıyı dinliyor ----------
const Gps: S = ({ t, ws, ses }) => {
  const tk = ws("yirmi");
  return (
    <g>
      <Dunya x={540} y={1020} s={1.9} t={t} />
      {[0, 1, 2, 3].map((i) => {
        const a = -Math.PI / 2 + (i - 1.5) * 0.55 + Math.sin(t * 0.5 + i) * 0.05;
        const x = 540 + Math.cos(a) * 560;
        const y = 1020 + Math.sin(a) * 560;
        const u = ((t * 1.2 + i / 4) % 1);
        return (
          <g key={i} opacity={ap(t, 0.1 + i * 0.15, 0.3)}>
            <line x1={x} y1={y} x2={540} y2={880} stroke={ACC} strokeWidth={5} strokeDasharray="14 12" strokeDashoffset={-t * 80} opacity={0.8} />
            <circle cx={lerp(x, 540, u)} cy={lerp(y, 880, u)} r={9} fill={ACC} />
            <Uydu x={x} y={y} s={0.55} t={t} />
          </g>
        );
      })}
      <g transform="translate(540 870)"><Telefon x={0} y={0} s={0.42} t={t} ekran={GREEN} /></g>
      <Tag x={540} y={330} text="20.000 KM" size={70} k={sp(t, tk - 0.1, 8)} bg={ACC} rot={-2} />
      <Merakli x={160} y={1240} s={0.45} t={t} hareket="isaret" kostum="kulaklik" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

/** Mum: alev şekli (0 = damla, 1 = top) */
const Mum: React.FC<{ x: number; y: number; top: number; t: number }> = ({ x, y, top, t }) => {
  const tit = Math.sin(t * 12) * 4 * (1 - top);
  const h = lerp(150, 80, top);
  const w = lerp(56, 80, top);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-46} y={0} width={92} height={260} rx={10} fill="#f4efe2" stroke={INK} strokeWidth={7} />
      <line x1={0} y1={0} x2={0} y2={-26} stroke={INK} strokeWidth={6} />
      <Glow cx={0} cy={-26 - h / 2} r={150} id={`m${x}`} color={top > 0.5 ? "#7fd4ff" : "#ffd27a"} o={0.6} />
      <path d={`M 0 ${-26 - h + tit} C ${w} ${-26 - h * 0.45} ${w} -20 0 -20 C ${-w} -20 ${-w} ${-26 - h * 0.45} 0 ${-26 - h - tit} Z`}
        fill={top > 0.5 ? "#5fb8ff" : "#ffb02e"} stroke={top > 0.5 ? "#2a6fd6" : "#e8661c"} strokeWidth={5} />
    </g>
  );
};

// ---------- 4 — Uzayda alev top gibi yanar ----------
const Alev: S = ({ t, ws, ses }) => {
  const tu = ws("uzayda");
  const tt = ws("balon");
  return (
    <g>
      <Tag x={290} y={420} text="DÜNYA" size={44} k={1} bg="#fff" />
      <Tag x={790} y={420} text="UZAY" size={44} k={sp(t, tu, 9)} bg={BLUE} color="#fff" />
      <Mum x={290} y={760} top={0} t={t} />
      <Mum x={790} y={760} top={ez((t - tt + 0.3) / 0.6)} t={t} />
      <line x1={540} y1={480} x2={540} y2={1100} stroke={CHALK} strokeWidth={4} strokeDasharray="16 14" opacity={0.5} />
      <Tag x={790} y={1110} text="BALON GİBİ!" size={50} k={sp(t, tt, 8)} bg={ACC} rot={3} />
      <Merakli x={540} y={1240} s={0.4} t={t} hareket="sasir" kostum="kasif" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

// ---------- 5 — Pet şişeyle çiçek sulama ----------
const Cicek: S = ({ t, ws, ses }) => {
  const tp = ws("pet");
  const sise = sp(t, tp - 0.3, 9);
  return (
    <g>
      {/* saksı + bitki */}
      <path d="M 380 900 L 700 900 L 660 1160 L 420 1160 Z" fill="#c4683a" stroke={INK} strokeWidth={8} />
      <rect x={360} y={870} width={360} height={40} rx={10} fill="#d47a48" stroke={INK} strokeWidth={8} />
      {[-1, 1].map((d) => (
        <path key={d} d={`M 540 870 Q ${540 + d * 40} 760 ${540 + d * 150} ${720 + Math.sin(t * 2) * 6}`} stroke={GREEN} strokeWidth={12} fill="none" strokeLinecap="round" />
      ))}
      <circle cx={420} cy={710} r={46} fill={RED} stroke={INK} strokeWidth={6} />
      <circle cx={690} cy={720} r={42} fill={ACC} stroke={INK} strokeWidth={6} />
      {/* ters pet şişe */}
      <g transform={`translate(600 ${lerp(300, 600, sise)}) rotate(${(1 - sise) * 40})`} opacity={cl(sise * 2)}>
        <path d="M -60 -260 L 60 -260 L 60 -40 Q 60 0 20 20 L 20 60 L -20 60 L -20 20 Q -60 0 -60 -40 Z" fill="#cfeaff" fillOpacity={0.7} stroke={INK} strokeWidth={6} />
        <rect x={-56} y={-250} width={112} height={lerp(180, 90, cl((t - tp) / 4))} fill="#5fb8ff" opacity={0.7} />
      </g>
      {sise > 0.9 ? [0, 1].map((i) => {
        const u = ((t * 1.1 + i / 2) % 1);
        return <circle key={i} cx={600} cy={680 + u * 180} r={10} fill="#5fb8ff" opacity={1 - u} />;
      }) : null}
      <Tag x={540} y={330} text="TATİLDE BİLE SULANIR" size={44} k={sp(t, ws("tatile"))} bg={GREEN} color="#fff" rot={-2} />
      <Merakli x={880} y={1240} s={0.5} t={t} hareket="aha" kostum="baret" agiz={ses(t)} />
    </g>
  );
};

// ---------- 6 — Yakında: hepsinin cevabı, her gün bir dakikada; hangisi önce? ----------
const IKON = ["MOR GÖK", "AÇACAK", "GPS", "ALEV", "ÇİÇEK"];
const Yakinda: S = ({ t, ws, ses }) => {
  const th = ws("hangisini");
  return (
    <g>
      <Tag x={540} y={330} text="YAKINDA" size={64} k={sp(t, 0.05, 9)} bg={RED} color="#fff" rot={-2} />
      {IKON.map((ad, i) => {
        const r = Math.floor(i / 2);
        const c = i % 2;
        const x = i === 4 ? 540 : c ? 760 : 320;
        const y = 520 + r * 220;
        const k = sp(t, 0.2 + i * 0.12, 9);
        const sec = t > th ? 1 + 0.06 * Math.sin(t * 8 + i) : 1;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${k * sec})`}>
            <rect x={-190} y={-75} width={380} height={150} rx={30} fill="#fff" stroke={INK} strokeWidth={7} />
            <text x={-130} y={18} textAnchor="middle" fontSize={56} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={6} paintOrder="stroke" style={font}>?</text>
            <text x={30} y={16} textAnchor="middle" fontSize={44} fontWeight={900} fill={INK} style={font}>{ad}</text>
          </g>
        );
      })}
      <g transform={`translate(540 1150) scale(${sp(t, ws("her") - 0.2, 9)})`}>
        <rect x={-300} y={-62} width={600} height={116} rx={58} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={20} textAnchor="middle" fontSize={54} fontWeight={900} fill={INK} style={font}>HER GÜN 1 DAKİKA</text>
      </g>
    </g>
  );
};

// ---------- 7 — Takip et ----------
const Takip: S = ({ t, ws, ses }) => {
  const tt = ws("takip");
  return (
    <g>
      <g transform={`translate(540 560) scale(${sp(t, 0.1, 9)})`}>
        <circle r={150} fill={ACC} stroke={INK} strokeWidth={10} />
        <text x={0} y={30} textAnchor="middle" fontSize={92} fontWeight={900} fill={INK} style={font}>BDB</text>
      </g>
      <text x={540} y={800} textAnchor="middle" fontSize={54} fontWeight={900} fill={CHALK} stroke={INK} strokeWidth={8} paintOrder="stroke" style={font}>@birdakikadabil</text>
      <g transform={`translate(540 960) scale(${sp(t, tt - 0.3, 8) * (1 + 0.06 * Math.sin(t * 8) * ap(t, tt, 0.3))})`}>
        <rect x={-250} y={-70} width={500} height={130} rx={30} fill={BLUE} stroke={INK} strokeWidth={8} />
        <text x={0} y={24} textAnchor="middle" fontSize={68} fontWeight={900} fill="#fff" style={font}>TAKİP ET</text>
      </g>
    </g>
  );
};

export const SAHNE: Record<string, S> = { gok: Gok, konserve: Konserve, gps: Gps, alev: Alev, cicek: Cicek, yakinda: Yakinda, takip: Takip };

export const KAPAK: React.FC = () => (
  <g>
    <g transform="translate(0 300)"><Mum x={300} y={760} top={0} t={0.2} /><Mum x={780} y={760} top={1} t={0.2} /></g>
    <Merakli x={540} y={1700} s={0.85} t={0.3} hareket="sasir" kostum="onluk" />
  </g>
);
export const KAPAK_YAZI = { ust: "Bunları biliyor muydun?", buyuk: "HER GÜN 1 MERAK", alt: "@birdakikadabil" };
