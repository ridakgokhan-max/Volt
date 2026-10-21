// Konu 9/30 (Kendin Yap): Ters şişe neden akmıyor? — ÇİZİM sürümü (gerçek fotoğraf yok, eski kanal tekniği).
// Ses ve metin "otomatik-sulama" ile aynı. ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, Cross, ez, GREEN, Glow, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";
import { Saksi, Sise } from "./cicek";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const SU = "#5fb8ff";
const KAHVE = "#6b4a2b";

/** Toprak kesiti: taneler + aralarındaki boşluklar (ıslak = mavi, kuru = açık) */
const Kesit: React.FC<{ x: number; y: number; w?: number; h?: number; kuru: number }> = ({ x, y, w = 760, h = 300, kuru }) => {
  const taneler: [number, number, number][] = [];
  for (let i = 0; i < 40; i++) {
    const r = (k: number) => { const v = Math.sin(i * 91.7 + k * 37.3) * 43758.5453; return v - Math.floor(v); };
    taneler.push([-w / 2 + 40 + r(1) * (w - 80), 40 + r(2) * (h - 80), 26 + r(3) * 22]);
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={0} width={w} height={h} rx={20} fill={kuru > 0.5 ? "#f1dfb8" : "#7cc0ef"} stroke={INK} strokeWidth={8} />
      {taneler.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={KAHVE} stroke={INK} strokeWidth={4} />)}
    </g>
  );
};

/** Ters şişe + toprak + kabarcık/damla animasyonu */
const TersSise: React.FC<{ x: number; y: number; s?: number; t: number; dolu?: number; kabarcik?: number; damla?: number }> = ({ x, y, s = 1, t, dolu = 0.8, kabarcik = 0, damla = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <Sise x={0} y={0} s={s} dolu={dolu} ters={1} delik />
    {kabarcik > 0.02
      ? [0, 1, 2, 3].map((i) => {
          const u = (t * 0.9 + i / 4) % 1;
          return <circle key={i} cx={Math.sin(i * 2 + t * 3) * 16 * s} cy={lerp(220 * s, -120 * s, u)} r={(12 + i * 2) * s} fill="none" stroke="#fff" strokeWidth={5} opacity={(1 - u) * kabarcik} />;
        })
      : null}
    {damla > 0.02
      ? [0, 1].map((i) => {
          const u = (t * 1.2 + i / 2) % 1;
          return <circle key={i} cx={0} cy={240 * s + u * 110} r={11} fill={SU} stroke={INK} strokeWidth={3} opacity={(1 - u) * damla} />;
        })
      : null}
  </g>
);

/** Çizim musluk */
const Musluk: React.FC<{ x: number; y: number; s?: number; acik: number; t: number }> = ({ x, y, s = 1, acik, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-160} y={-50} width={240} height={90} rx={20} fill="#b9c2c9" stroke={INK} strokeWidth={8} />
    <path d="M 60 -10 L 150 -10 Q 190 -10 190 30 L 190 80 L 130 80 L 130 40 L 60 40 Z" fill="#b9c2c9" stroke={INK} strokeWidth={8} />
    <g transform={`translate(-40 -50) rotate(${lerp(0, 90, acik)})`}>
      <rect x={-90} y={-24} width={180} height={48} rx={24} fill={RED} stroke={INK} strokeWidth={7} />
    </g>
    <rect x={-60} y={-80} width={40} height={40} fill="#9aa3ab" stroke={INK} strokeWidth={6} />
    {acik > 0.1
      ? [0, 1, 2].map((i) => {
          const u = (t * 1.4 + i / 3) % 1;
          return <circle key={i} cx={160} cy={100 + u * 180} r={13} fill={SU} stroke={INK} strokeWidth={3} opacity={(1 - u) * acik} />;
        })
      : null}
  </g>
);

// ---------- 1 — Bu şişe ters duruyor ama tek damla akıtmıyor. Ta ki çiçeğin susayana kadar. ----------
const Giris: S = ({ t, ws, ses }) => {
  const ts = ws("susayana");
  const sol = ap(t, ts - 0.6, 0.6);
  return (
    <g>
      <Glow cx={540} cy={700} r={380} id="og" color="#fff1a8" o={0.45} />
      <Saksi x={540} y={1000} s={1.05} t={t} canli={1 - sol * 0.6} nem={1 - sol} />
      <TersSise x={590} y={800} s={0.78} t={t} dolu={0.8} damla={sol} />
      <Tag x={540} y={340} text="ÇİÇEK SUSAYINCA AKIYOR" size={46} k={sp(t, ts - 0.1)} bg={ACC} rot={-2} />
      <Merakli x={880} y={1240} s={0.45} t={t} hareket={t > ts ? "sasir" : "isaret"} kostum="baret" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 2 — Peki bir pet şişe çiçeğin susadığını nasıl anlıyor? ----------
const Soru: S = ({ t, ws, ses }) => (
  <g>
    <Saksi x={430} y={1000} s={0.85} t={t} nem={1} />
    <TersSise x={470} y={820} s={0.62} t={t} dolu={0.8} />
    <g transform={`translate(820 600) scale(${sp(t, ws("nasıl") - 0.3, 8)}) rotate(${Math.sin(t * 4) * 7})`}>
      <text textAnchor="middle" y={70} fontSize={260} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>?</text>
    </g>
    <Tag x={540} y={340} text="ŞİŞE NASIL ANLIYOR?" size={52} k={sp(t, 0.2)} bg={BLUE} color="#fff" rot={-2} />
    <Merakli x={180} y={1240} s={0.48} t={t} hareket="dusun" kostum="baret" agiz={ses(t)} />
  </g>
);

// ---------- 3 — Önce yapalım: kapağa 1-2 delik, doldur, kapat, ters çevir, 5-6 cm göm ----------
const Adim: S = ({ t, ws, ses }) => {
  const ti = ws("iğneyle"), td = ws("delik"), tdo = ws("doldur"), tk = ws("kapat"), tte = ws("ters"), tg = ws("göm");
  const ikinci = ap(t, ws("şişeyi") - 0.3, 0.4);
  const in_ = ez((t - td + 0.4) / 0.4);
  const dolu = ap(t, tdo - 0.4, 0.8);
  const ters = ez((t - tte + 0.1) / 0.6);
  const gom = ez((t - tg + 0.6) / 0.6);
  const adimlar: [string, number][] = [["1. KAPAĞA 1-2 DELİK", td], ["2. DOLDUR", tdo], ["3. KAPAT", tk], ["4. TERS ÇEVİR", tte], ["5. 5-6 CM GÖM", tg]];
  return (
    <g>
      {/* 1. kısım: kapak + iğne */}
      <g opacity={1 - ikinci}>
        <g transform="translate(540 820)">
          <ellipse cx={0} cy={0} rx={200} ry={60} fill={BLUE} stroke={INK} strokeWidth={8} />
          <rect x={-200} y={0} width={400} height={90} fill={BLUE} stroke={INK} strokeWidth={8} />
          <ellipse cx={0} cy={0} rx={200} ry={60} fill="#5a95e6" stroke={INK} strokeWidth={8} />
          {t > td + 0.1 ? <><circle cx={-40} cy={0} r={10} fill={INK} /><circle cx={40} cy={0} r={10} fill={INK} /></> : null}
        </g>
        <g opacity={ap(t, ti - 0.3, 0.3)} transform={`translate(${lerp(260, 500, in_)} ${lerp(470, 760, in_)}) rotate(${lerp(-60, -25, in_)})`}>
          <line x1={0} y1={0} x2={0} y2={-260} stroke="#9aa3b0" strokeWidth={10} strokeLinecap="round" />
          <circle cx={0} cy={-240} r={10} fill="none" stroke="#9aa3b0" strokeWidth={5} />
        </g>
      </g>
      {/* 2. kısım: doldur, kapat, ters çevir, göm */}
      <g opacity={ikinci}>
        <Saksi x={540} y={1000} s={0.9} t={t} nem={1} />
        <g transform={`translate(${lerp(800, 560, ters)} ${lerp(640, 780 + gom * 50, ters)})`}>
          <Sise x={0} y={0} s={0.7} dolu={dolu} ters={ters} delik />
        </g>
        <g opacity={ap(t, tg - 0.4, 0.3)}>
          <line x1={780} y1={1030} x2={780} y2={1090} stroke={RED} strokeWidth={8} />
          <Txt x={880} y={1075} text="5-6 cm" size={42} color={CHALK} stroke={INK} />
        </g>
      </g>
      {adimlar.map(([ad, tt], i) => (
        <Tag key={ad} x={540} y={340} text={ad} size={48} k={sp(t, tt - 0.15) * (i < adimlar.length - 1 ? 1 - ap(t, adimlar[i + 1][1] - 0.2, 0.15) : 1)} bg={ACC} rot={i % 2 ? 2 : -2} />
      ))}
      <Merakli x={160} y={1240} s={0.42} t={t} hareket="anlat" kostum="baret" agiz={ses(t)} />
    </g>
  );
};

// ---------- 4 — Şimdi sır şu: su çıkabilmesi için içeri hava girmesi gerekiyor ----------
const Sir: S = ({ t, ws, ses }) => {
  const th = ws("hava");
  const ok = ap(t, th - 0.2, 0.4);
  return (
    <g>
      <TersSise x={540} y={720} s={1.15} t={t} dolu={0.8} />
      <g opacity={ok}>
        <path d={`M 880 1100 C 820 1020 700 1000 ${lerp(880, 600, ok)} ${lerp(1100, 1000, ok)}`} stroke="#fff" strokeWidth={14} fill="none" strokeDasharray="26 18" strokeDashoffset={-t * 60} strokeLinecap="round" />
        <Txt x={880} y={1160} text="HAVA" size={50} color="#fff" stroke={INK} />
      </g>
      <Tag x={540} y={340} text="SIR ŞU:" size={56} k={sp(t, 0.1)} bg={ACC} rot={-3} />
      <Tag x={540} y={340} text="HAVA GİRMEZSE SU ÇIKMAZ" size={44} k={sp(t, th + 0.2)} bg={BLUE} color="#fff" rot={2} />
      <Merakli x={180} y={1240} s={0.45} t={t} hareket="isaret" kostum="baret" agiz={ses(t)} />
    </g>
  );
};

// ---------- 5 — Toprak ıslakken delikler suyla tıkalı. Hava giremiyor, su da çıkamıyor. ----------
const Islak: S = ({ t, ws, ses }) => {
  const tg = ws("giremiyor");
  return (
    <g>
      <TersSise x={540} y={560} s={0.72} t={t} dolu={0.8} />
      <Kesit x={540} y={820} kuru={0} />
      <g opacity={ap(t, tg - 0.2, 0.2)}><Cross cx={540} cy={760} r={70} k={ap(t, tg - 0.2, 0.3)} sw={14} /></g>
      <Tag x={540} y={340} text="ISLAK TOPRAK = KAPALI" size={46} k={sp(t, ws("tıkalı") - 0.2)} bg={BLUE} color="#fff" rot={-2} />
    </g>
  );
};

// ---------- 6 — Toprak kurudukça boşluklar açılıyor, hava girer, şişe biraz su bırakır ----------
const Kuru: S = ({ t, ws, ses }) => {
  const ta = ws("açılıyor"), tk = ws("kabarcıkları"), tb = ws("bırakıyor");
  return (
    <g>
      <TersSise x={540} y={560} s={0.72} t={t} dolu={0.8 - 0.1 * ap(t, tb, 1.5)} kabarcik={ap(t, tk - 0.3, 0.3)} damla={ap(t, tb - 0.3, 0.3)} />
      <Kesit x={540} y={820} kuru={t > ta - 0.3 ? 1 : 0} />
      <Tag x={540} y={340} text="KURUYUNCA HAVA GİRER" size={46} k={sp(t, tk - 0.1) * (1 - ap(t, tb - 0.2, 0.15))} bg={ACC} rot={-2} />
      <Tag x={540} y={340} text="ŞİŞE BİRAZ SU BIRAKIR" size={46} k={sp(t, tb - 0.1)} bg={GREEN} color="#fff" rot={2} />
    </g>
  );
};

// ---------- 7 — Yani şişe hiçbir şey anlamıyor. Musluğu toprak açıp kapatıyor. ----------
const MuslukS: S = ({ t, ws, ses }) => {
  const tm = ws("musluğu");
  const ac = (Math.sin(t * 2.2) + 1) / 2;
  return (
    <g>
      <Glow cx={540} cy={720} r={360} id="om" color="#fff1a8" o={0.5 * ap(t, tm - 0.3, 0.5)} />
      <Musluk x={480} y={620} s={1.2} acik={t > tm ? ac : 0} t={t} />
      <rect x={200} y={960} width={680} height={150} rx={24} fill={t > tm && ac > 0.5 ? "#a37a52" : "#5a3b25"} stroke={INK} strokeWidth={8} />
      <Txt x={540} y={1055} text="TOPRAK" size={58} color="#fff" stroke={INK} />
      <Tag x={540} y={340} text="ŞİŞE HİÇBİR ŞEY ANLAMIYOR" size={42} k={sp(t, 0.2) * (1 - ap(t, tm - 0.3, 0.15))} bg={BLUE} color="#fff" rot={-2} />
      <Tag x={540} y={340} text="MUSLUĞU TOPRAK AÇIYOR" size={46} k={sp(t, tm - 0.05)} bg={ACC} rot={2} />
      <Merakli x={880} y={1240} s={0.48} t={t} hareket={t > tm ? "aha" : "dusun"} kostum="baret" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 8 — Şişen yoksa pamuklu ip: su ipten tırmanarak saksıya gider ----------
const Ip: S = ({ t, ws, ses }) => {
  const tt = ws("tırmanarak");
  const P = (u: number): [number, number] => {
    const a = [250, 760], b = [330, 420], c = [560, 420], d = [700, 760];
    const v = 1 - u;
    return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
  };
  return (
    <g>
      <g transform="translate(250 820)">
        <path d="M -170 -20 L 170 -20 Q 160 150 0 160 Q -160 150 -170 -20 Z" fill="#d47a48" stroke={INK} strokeWidth={8} />
        <ellipse cx={0} cy={-20} rx={170} ry={36} fill={SU} stroke={INK} strokeWidth={6} />
      </g>
      <Saksi x={760} y={950} s={0.75} t={t} nem={ap(t, tt, 1)} />
      <path d="M 250 760 C 330 420 560 420 700 760" stroke="#f3ead6" strokeWidth={16} fill="none" strokeLinecap="round" opacity={ap(t, ws("pamuklu") - 0.3, 0.3)} />
      {t > tt - 0.4
        ? [0, 1, 2, 3].map((i) => {
            const [x, y] = P((t * 0.45 + i / 4) % 1);
            return <circle key={i} cx={x} cy={y} r={12} fill={SU} stroke={INK} strokeWidth={3} />;
          })
        : null}
      <Tag x={540} y={340} text="PAMUKLU İP" size={54} k={sp(t, ws("pamuklu") - 0.1) * (1 - ap(t, tt - 0.3, 0.15))} bg={ACC} rot={-2} />
      <Tag x={540} y={340} text="SU İPTEN TIRMANIR" size={52} k={sp(t, tt - 0.1)} bg={GREEN} color="#fff" rot={2} />
    </g>
  );
};

// ---------- 9 — Son uyarı: delik büyükse bir günde biter, tatilden bir gün önce dene ----------
const Uyari: S = ({ t, ws, ses }) => {
  const tg = ws("günde");
  const bos = ap(t, tg - 0.6, 1.3);
  return (
    <g>
      <g transform="translate(300 640)">
        <rect x={-150} y={-160} width={300} height={320} rx={16} fill="#fff" stroke={INK} strokeWidth={8} />
        <rect x={-150} y={-160} width={300} height={80} rx={16} fill={RED} stroke={INK} strokeWidth={8} />
        <Txt x={0} y={50} text="TEST" size={70} color={INK} />
      </g>
      <TersSise x={780} y={700} s={0.8} t={t} dolu={0.85 * (1 - bos)} damla={1 - bos * 0.7} />
      <g transform={`translate(300 920) scale(${sp(t, tg, 8)}) rotate(-4)`}>
        <rect x={-170} y={-50} width={340} height={96} rx={48} fill={RED} stroke={INK} strokeWidth={6} />
        <text x={0} y={16} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" style={font}>1 GÜNDE BİTER</text>
      </g>
      <Tag x={540} y={340} text="1 GÜN ÖNCE DENE!" size={56} k={sp(t, ws("önce") - 0.1)} bg={ACC} rot={-3} />
      <Tag x={540} y={340} text="SON UYARI" size={56} k={sp(t, 0.1) * (1 - ap(t, ws("önce") - 0.3, 0.15))} bg={RED} color="#fff" rot={2} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, soru: Soru, adim: Adim, sir: Sir, islak: Islak, kuru: Kuru, musluk: MuslukS, ip: Ip, uyari: Uyari };

export const KAPAK: React.FC = () => (
  <g>
    <Saksi x={480} y={1380} s={1.2} t={0.2} canli={1} nem={1} />
    <g transform="translate(560 1160)"><Sise x={0} y={0} s={0.8} dolu={0.8} ters={1} delik /></g>
    <Merakli x={880} y={1720} s={0.8} t={0.3} hareket="sasir" kostum="baret" />
  </g>
);
export const KAPAK_YAZI = { ust: "Ters ama akmıyor", buyuk: "ŞİŞE ÇİÇEĞİN SUSADIĞINI BİLİYOR MU?", alt: "Tatilde çiçek sulama sırrı" };
