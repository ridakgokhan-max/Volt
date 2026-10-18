// Konu 6/30 (Bilim): Gökyüzü neden mavi? ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, BLUE, CHALK, cl, ez, GREEN, Glow, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const MOR = "#8a4dff";
const RENK = [RED, "#ff8a2a", ACC, GREEN, BLUE, MOR];

const Gunes: React.FC<{ x: number; y: number; r?: number; t: number }> = ({ x, y, r = 90, t }) => (
  <g>
    <Glow cx={x} cy={y} r={r * 3} id={`g${x}${y}`} color="#fff4c4" o={0.8} />
    {Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * Math.PI * 2 + t * 0.4;
      return <line key={i} x1={x + Math.cos(a) * (r + 14)} y1={y + Math.sin(a) * (r + 14)} x2={x + Math.cos(a) * (r + 46)} y2={y + Math.sin(a) * (r + 46)} stroke={ACC} strokeWidth={10} strokeLinecap="round" />;
    })}
    <circle cx={x} cy={y} r={r} fill="#fff3b0" stroke={INK} strokeWidth={7} />
  </g>
);

// ---------- 1 — Giriş: mor gökyüzü ----------
const Giris: S = ({ t, ws, ses }) => {
  const mor = 1 - ap(t, 1.4, 1.0);
  return (
    <g>
      <defs>
        <linearGradient id="gmor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4b2392" /><stop offset="100%" stopColor="#b48cf0" /></linearGradient>
      </defs>
      <rect x={0} y={-40} width={1080} height={2000} fill="url(#gmor)" opacity={mor} />
      <Gunes x={800} y={430} t={t} />
      <rect x={0} y={1060} width={1080} height={940} fill="#3f6b3a" />
      <path d="M 0 1060 Q 270 990 540 1060 T 1080 1060 L 1080 1100 L 0 1100 Z" fill="#4f8a47" />
      <g transform={`translate(300 720) scale(${sp(t, 1.6, 8)}) rotate(${Math.sin(t * 4) * 7})`}>
        <text textAnchor="middle" y={70} fontSize={240} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>?</text>
      </g>
      <Merakli x={760} y={1240} s={0.55} t={t} hareket={t > 1.6 ? "dusun" : "sasir"} kostum="onluk" agiz={ses(t)} />
    </g>
  );
};

// ---------- 2 — Beyaz ışığın içinde bütün renkler (prizma) ----------
const Isik: S = ({ t, ws, ses }) => {
  const tb = ws("beyaz");
  const tr = ws("renkler");
  const yay = ap(t, tr - 0.5, 0.8);
  return (
    <g>
      <Gunes x={170} y={520} r={70} t={t} />
      <line x1={240} y1={560} x2={lerp(240, 470, ap(t, tb - 0.3, 0.6))} y2={lerp(560, 700, ap(t, tb - 0.3, 0.6))} stroke="#fff" strokeWidth={26} strokeLinecap="round" />
      <path d="M 540 560 L 660 800 L 420 800 Z" fill="#cfeaff" fillOpacity={0.6} stroke={INK} strokeWidth={8} />
      {RENK.map((c, i) => (
        <line key={i} x1={600} y1={720} x2={lerp(600, 1040, yay)} y2={lerp(720, 760 + i * 70, yay)} stroke={c} strokeWidth={22} strokeLinecap="round" opacity={yay} />
      ))}
      <Tag x={540} y={340} text="BEYAZ = BÜTÜN RENKLER" size={42} k={sp(t, tr - 0.1)} bg="#fff" rot={-2} />
      <Merakli x={200} y={1240} s={0.48} t={t} hareket={t > tr ? "aha" : "anlat"} kostum="onluk" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

// ---------- 3 — Moleküllere çarpıp saçılma: mavi-mor çok, kırmızı az ----------
const Sacilma: S = ({ t, ws, ses }) => {
  const tm = ws("mavi");
  const tk = ws("kırmızıdan");
  const mol = [[300, 600], [560, 520], [800, 640], [420, 860], [700, 900], [240, 1020], [880, 1040]];
  return (
    <g>
      {mol.map(([x, y], i) => (
        <g key={i} transform={`translate(${x + Math.sin(t * 2 + i) * 8} ${y + Math.cos(t * 2.3 + i) * 8})`}>
          <circle r={26} fill="#dfe7f3" stroke={INK} strokeWidth={5} />
          <circle cx={-10} cy={-10} r={8} fill="#fff" />
        </g>
      ))}
      {/* kırmızı ışın düz geçer */}
      <g opacity={ap(t, tk - 0.3, 0.3)}>
        <line x1={0} y1={760} x2={1080} y2={760} stroke={RED} strokeWidth={14} strokeDasharray="40 20" strokeDashoffset={-t * 300} />
        <Tag x={960} y={700} text="KIRMIZI" size={34} k={sp(t, tk)} bg={RED} color="#fff" />
      </g>
      {/* mavi-mor her yöne saçılır */}
      {mol.map(([x, y], i) => (
        <g key={i} opacity={ap(t, tm - 0.2 + i * 0.08, 0.3)}>
          {[0, 1, 2, 3].map((j) => {
            const a = (j / 4) * Math.PI * 2 + i;
            const u = ((t * 1.2 + j * 0.25 + i * 0.1) % 1);
            return <line key={j} x1={x + Math.cos(a) * 34} y1={y + Math.sin(a) * 34} x2={x + Math.cos(a) * (34 + u * 110)} y2={y + Math.sin(a) * (34 + u * 110)} stroke={j % 2 ? MOR : BLUE} strokeWidth={9} strokeLinecap="round" opacity={1 - u} />;
          })}
        </g>
      ))}
      <Tag x={540} y={340} text="MAVİ + MOR SAÇILIR" size={46} k={sp(t, tm)} bg={BLUE} color="#fff" rot={-2} />
    </g>
  );
};

// ---------- 4 — Nereye baksan gözüne saçılan ışık gelir ----------
const Goz: S = ({ t, ws, ses }) => (
  <g>
    {Array.from({ length: 7 }).map((_, i) => {
      const x0 = 120 + i * 140;
      const u = ((t * 0.9 + i / 7) % 1);
      return <line key={i} x1={x0} y1={380} x2={lerp(x0, 560, u)} y2={lerp(380, 1000, u)} stroke={i % 2 ? BLUE : MOR} strokeWidth={10} strokeLinecap="round" opacity={(1 - u) * ap(t, 0.2 + i * 0.1, 0.3)} />;
    })}
    <g transform="translate(560 1020)">
      <path d="M -160 0 Q 0 -110 160 0 Q 0 110 -160 0 Z" fill="#fff" stroke={INK} strokeWidth={9} />
      <circle r={58} fill={BLUE} stroke={INK} strokeWidth={7} />
      <circle r={26} fill={INK} />
      <circle cx={-16} cy={-18} r={11} fill="#fff" />
    </g>
    <Tag x={540} y={340} text="HER YÖNDEN GÖZÜNE" size={44} k={sp(t, ws("gözüne") - 0.1)} bg="#fff" rot={-2} />
  </g>
);

// ---------- 5 — Soru: en çok mor saçılıyorsa neden mor değil? ----------
const Soru: S = ({ t, ws, ses }) => (
  <g>
    <rect x={130} y={500} width={360} height={460} rx={30} fill={MOR} stroke={INK} strokeWidth={8} />
    <rect x={590} y={500} width={360} height={460} rx={30} fill={BLUE} stroke={INK} strokeWidth={8} />
    <Txt x={310} y={1030} text="BEKLENEN" size={44} color={CHALK} stroke={INK} />
    <Txt x={770} y={1030} text="GÖRÜLEN" size={44} color={CHALK} stroke={INK} />
    <g transform={`translate(540 730) scale(${sp(t, ws("neden") - 0.2, 8)}) rotate(${Math.sin(t * 4) * 6})`}>
      <text textAnchor="middle" y={70} fontSize={220} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>?</text>
    </g>
    <Merakli x={540} y={1240} s={0.45} t={t} hareket="dusun" kostum="onluk" agiz={ses(t)} ink={CHALK} />
  </g>
);

// ---------- 6 — İki sebep: Güneş az mor yollar + göz maviye duyarlı ----------
const Sebep: S = ({ t, ws, ses }) => {
  const t1 = ws("güneş");
  const t2 = ws("gözümüz");
  const ts = ws("sonuç");
  const bar = (i: number, h: number, a: number) => {
    const k = ap(t, a + i * 0.06, 0.4);
    return <rect key={i} x={170 + i * 60} y={760 - h * k} width={44} height={h * k} rx={8} fill={RENK[5 - i]} stroke={INK} strokeWidth={4} />;
  };
  return (
    <g>
      <g opacity={ap(t, t1 - 0.3, 0.3)}>
        <Txt x={320} y={420} text="1) GÜNEŞ" size={44} color={CHALK} stroke={INK} />
        {[110, 170, 230, 240, 220, 200].map((h, i) => bar(i, h * 1.3, t1))}
        <Tag x={200} y={830} text="az mor" size={30} k={sp(t, t1 + 0.6)} bg={MOR} color="#fff" />
      </g>
      <g opacity={ap(t, t2 - 0.3, 0.3)}>
        <Txt x={780} y={420} text="2) GÖZÜMÜZ" size={44} color={CHALK} stroke={INK} />
        <path d={`M 590 760 C 650 760 680 ${lerp(760, 520, ap(t, t2, 0.8))} 760 ${lerp(760, 480, ap(t, t2, 0.8))} C 840 ${lerp(760, 470, ap(t, t2, 0.8))} 900 ${lerp(760, 640, ap(t, t2, 0.8))} 980 760`} fill="none" stroke={GREEN} strokeWidth={12} strokeLinecap="round" />
        <line x1={590} y1={760} x2={990} y2={760} stroke={CHALK} strokeWidth={5} />
        <Tag x={640} y={830} text="mora kör gibi" size={30} k={sp(t, t2 + 0.8)} bg="#fff" />
      </g>
      <g transform={`translate(540 1060) scale(${sp(t, ts - 0.1, 8)})`}>
        <rect x={-230} y={-70} width={460} height={130} rx={65} fill={BLUE} stroke={INK} strokeWidth={8} />
        <text x={0} y={24} textAnchor="middle" fontSize={70} fontWeight={900} fill="#fff" style={font}>= MAVİ</text>
      </g>
    </g>
  );
};

// ---------- 7 — Akşam: uzun yol, mavi kaybolur, turuncu-kırmızı kalır ----------
const Aksam: S = ({ t, ws, ses }) => {
  const tu = ws("uzun");
  const tg = ws("geriye");
  const bat = ap(t, tg - 0.5, 1.2);
  return (
    <g>
      <defs>
        <linearGradient id="aksam" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2b2a6b" /><stop offset="60%" stopColor="#ff7a3d" /><stop offset="100%" stopColor="#ffd27a" /></linearGradient>
      </defs>
      <rect x={0} y={-40} width={1080} height={2000} fill="url(#aksam)" opacity={bat} />
      {/* atmosfer kabuğu ve uzun ışık yolu */}
      <circle cx={540} cy={2200} r={1300} fill="#3f6b3a" />
      <circle cx={540} cy={2200} r={1420} fill="none" stroke="#9cc6ef" strokeWidth={120} opacity={0.35} />
      <Gunes x={lerp(900, 1000, bat)} y={lerp(700, 980, bat)} r={70} t={t} />
      <path d={`M ${lerp(900, 1000, bat)} ${lerp(700, 980, bat)} Q 760 1000 540 1060`} stroke="#fff" strokeWidth={14} fill="none" strokeDasharray="30 18" strokeDashoffset={-t * 200} opacity={ap(t, tu - 0.3, 0.3)} />
      {[0, 1, 2].map((i) => {
        const u = ((t + i / 3) % 1);
        return <line key={i} x1={780 - i * 80} y1={990 + i * 20} x2={780 - i * 80 + Math.cos(-1.8) * u * 160} y2={990 + i * 20 - u * 160} stroke={BLUE} strokeWidth={9} strokeLinecap="round" opacity={(1 - u) * ap(t, tu, 0.4)} />;
      })}
      <Tag x={540} y={340} text="MAVİ YOLDA KAYBOLUR" size={42} k={sp(t, ws("mavi") - 0.1) * (1 - ap(t, tg - 0.2, 0.2))} bg={BLUE} color="#fff" rot={-2} />
      <Tag x={540} y={340} text="TURUNCU + KIRMIZI" size={48} k={sp(t, tg)} bg="#ff7a3d" color="#fff" rot={2} />
      <Merakli x={300} y={1240} s={0.48} t={t} hareket={t > tg ? "aha" : "anlat"} kostum="onluk" agiz={ses(t)} />
    </g>
  );
};

// ---------- 8 — Sonuç: rengi biraz da gözümüz seçiyor ----------
const Sonuc: S = ({ t, ws, ses }) => {
  const tg = ws("gözümüz");
  return (
    <g>
      <g transform={`translate(540 700) scale(${sp(t, 0.1, 9)})`}>
        <path d="M -300 0 Q 0 -220 300 0 Q 0 220 -300 0 Z" fill="#fff" stroke={INK} strokeWidth={12} />
        <circle r={130} fill="url(#gokgoz)" stroke={INK} strokeWidth={10} />
        <defs><radialGradient id="gokgoz"><stop offset="0%" stopColor="#bfe3ff" /><stop offset="100%" stopColor={BLUE} /></radialGradient></defs>
        <circle r={55} fill={INK} />
        <circle cx={-35} cy={-40} r={22} fill="#fff" />
      </g>
      <Tag x={540} y={1040} text="RENGİ GÖZÜMÜZ SEÇİYOR" size={44} k={sp(t, tg - 0.1)} bg={ACC} rot={-2} />
      <Merakli x={880} y={1240} s={0.5} t={t} hareket={t > tg ? "kahkaha" : "anlat"} kostum="onluk" agiz={ses(t)} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, isik: Isik, sacilma: Sacilma, goz: Goz, soru: Soru, sebep: Sebep, aksam: Aksam, sonuc: Sonuc };

export const KAPAK: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#7d4fd0" />
    <rect x={0} y={1280} width={1080} height={640} fill="#3f6b3a" />
    <Gunes x={800} y={1050} r={110} t={0.2} />
    <Merakli x={300} y={1700} s={0.95} t={0.3} hareket="dusun" kostum="onluk" />
  </g>
);
export const KAPAK_YAZI = { ust: "Fiziğe göre gökyüzü", buyuk: "MOR OLMALIYDI!", alt: "Peki neden mavi?" };
