// Konu: Kablosuz şarj nasıl çalışır? (5/30, Teknoloji). ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, BLUE, CHALK, cl, Cross, ez, GREEN, Glow, INK, lerp, Phone, RED, sp, Tag } from "../kit";
import { Merakli } from "../merakli";
import { Miknatis, Pil, Termometre } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const BAKIR = "#d9893f";
const BAKIR2 = "#a95f22";
const ALAN = "#7fd4ff";

/** Yandan bakır bobin: iç içe yassı halkalar */
const Bobin: React.FC<{ x: number; y: number; s?: number; parla?: number }> = ({ x, y, s = 1, parla = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {parla > 0.01 ? <ellipse rx={210} ry={52} fill={ACC} opacity={0.35 * parla} /> : null}
    {[170, 135, 100, 65].map((r, i) => (
      <ellipse key={i} rx={r} ry={r * 0.2} fill="none" stroke={i % 2 ? BAKIR2 : BAKIR} strokeWidth={14} />
    ))}
  </g>
);

/** Üstten bakır bobin (spiral) */
const Spiral: React.FC<{ x: number; y: number; s?: number; t: number; yon: number }> = ({ x, y, s = 1, t, yon }) => {
  let d = "";
  for (let a = 0; a < Math.PI * 2 * 6; a += 0.2) {
    const r = 30 + a * 9;
    d += `${d ? "L" : "M"} ${Math.cos(a) * r} ${Math.sin(a) * r} `;
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={400} fill="#1d2430" stroke={INK} strokeWidth={10} />
      <path d={d} fill="none" stroke={BAKIR} strokeWidth={14} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff3c4" strokeWidth={8} strokeLinecap="round" strokeDasharray="18 90" strokeDashoffset={yon * t * 900} opacity={0.9} />
    </g>
  );
};

/** Yandan görünüm: şarj aleti + telefon + aradaki manyetik alan çizgileri */
const Duzen: React.FC<{ t: number; dx?: number; alan?: number; kilif?: number; ikinci?: number; isi?: number }> = ({ t, dx = 0, alan = 1, kilif = 0, ikinci = 0, isi = 0 }) => {
  const altY = 940;
  const ustY = 690 - kilif * 70;
  const kop = cl(Math.abs(dx) / 260); // kayma arttıkça çizgiler kopar
  const guc = alan * (1 - kop) * (1 - kilif * 0.6);
  const yon = Math.sin(t * 9) > 0 ? 1 : -1;
  return (
    <g>
      {/* alan çizgileri */}
      {[-150, -90, -30, 30, 90, 150].map((x0, i) => {
        const x1 = x0 + dx;
        const b = 70 + Math.abs(x0) * 0.6;
        const yan = x0 < 0 ? -1 : 1;
        const kopuk = kop > 0.35;
        return (
          <path key={i} d={`M ${540 + x0} ${altY - 20} C ${540 + x0 + yan * b} ${altY - 110} ${540 + x1 + yan * b} ${ustY + 110} ${540 + x1} ${ustY + 30}`}
            fill="none" stroke={ALAN} strokeWidth={9} strokeLinecap="round"
            strokeDasharray={kopuk ? "18 40" : "34 18"} strokeDashoffset={yon * t * 160 + i * 9}
            opacity={guc * (0.55 + 0.45 * Math.abs(Math.sin(t * 9))) + (kopuk ? 0.15 * alan : 0)} />
        );
      })}
      {/* şarj aleti */}
      <rect x={300} y={altY - 10} width={480} height={80} rx={40} fill="#e9eef5" stroke={INK} strokeWidth={8} />
      <Bobin x={540} y={altY + 22} s={1} parla={alan * Math.abs(Math.sin(t * 9)) * 0.6} />
      <path d={`M 780 ${altY + 30} C 900 ${altY + 30} 900 ${altY + 160} 1100 ${altY + 160}`} stroke={INK} strokeWidth={14} fill="none" />
      {/* telefon (yandan) */}
      <g transform={`translate(${dx} 0)`}>
        {kilif > 0.01 ? <rect x={170} y={ustY + 20} width={740} height={30 + kilif * 70} rx={24} fill="#7a5a3c" stroke={INK} strokeWidth={7} opacity={kilif} /> : null}
        <rect x={190} y={ustY - 40} width={700} height={64} rx={30} fill="#2a2f3a" stroke={INK} strokeWidth={8} />
        <rect x={210} y={ustY - 46} width={660} height={14} rx={7} fill="#3b82c4" />
        <Bobin x={540} y={ustY + 6} s={0.8} parla={ikinci * guc} />
        {isi > 0.01
          ? [0, 1, 2].map((i) => {
              const u = ((t * 0.9 + i / 3) % 1);
              return <path key={i} d={`M ${430 + i * 110} ${ustY - 70 - u * 120} q 20 -20 0 -40 q -20 -20 0 -40`} stroke={RED} strokeWidth={8} fill="none" opacity={isi * (1 - u)} strokeLinecap="round" />;
            })
          : null}
      </g>
    </g>
  );
};

// ---------- 1 — Giriş: arada kablo yok ama elektrik geçiyor; hile değil, mıknatıs ----------
const Giris: S = ({ t, ws, ses }) => {
  const tk = ws("kablo");
  const te = ws("elektrik");
  const tm = ws("mıknatıs");
  const sim = ap(t, te - 0.2, 0.3);
  return (
    <g>
      <Phone cx={540} cy={640} s={0.62} screen="#e9eef5">
        <rect x={-148} y={-300} width={296} height={70} fill={GREEN} />
        <text x={0} y={-252} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff" style={font}>ŞARJ</text>
        <g transform={`translate(0 30) scale(${1 + 0.06 * Math.sin(t * 6) * sim})`}>
          <Pil x={0} y={0} s={1.5} dolu={lerp(0.25, 0.85, ap(t, te, 3))} />
        </g>
      </Phone>
      {/* şarj aleti */}
      <ellipse cx={540} cy={1110} rx={300} ry={60} fill="#e9eef5" stroke={INK} strokeWidth={8} />
      <ellipse cx={540} cy={1100} rx={120} ry={20} fill={GREEN} opacity={0.6 + 0.4 * Math.sin(t * 5)} />
      {/* aradaki boşlukta akan enerji */}
      {[0, 1, 2].map((i) => {
        const u = ((t * 1.2 + i / 3) % 1);
        return <path key={i} d={`M ${520 + Math.sin(i * 2) * 20} ${1060 - u * 80} l -24 30 l 22 0 l -18 32`} stroke={ACC} strokeWidth={8} fill="none" strokeLinejoin="round" opacity={sim * (1 - u)} />;
      })}
      {/* kesilmiş kablo */}
      <g opacity={ap(t, tk - 0.3, 0.3)} transform="translate(200 1010)">
        <path d="M -140 60 C -60 60 -60 -10 20 -10" stroke={INK} strokeWidth={16} fill="none" strokeLinecap="round" />
        <rect x={20} y={-26} width={50} height={32} rx={6} fill="#a7adb6" stroke={INK} strokeWidth={5} />
        <Cross cx={0} cy={0} r={90} k={ap(t, tk, 0.35)} sw={14} />
      </g>
      <Tag x={540} y={300} text="HİLE DEĞİL" size={46} k={sp(t, ws("hile") - 0.1) * (1 - ap(t, tm - 0.1, 0.2))} bg="#fff" rot={-3} />
      <g transform={`translate(860 520) scale(${sp(t, tm - 0.2, 8)}) rotate(${Math.sin(t * 3) * 8})`}>
        <Miknatis x={0} y={60} s={1} t={t} />
      </g>
      <Tag x={860} y={720} text="MIKNATIS" size={44} k={sp(t, tm)} bg={BLUE} color="#fff" rot={3} />
      <Merakli x={170} y={1240} s={0.5} t={t} hareket={t > tm ? "aha" : "sasir"} kostum="kulaklik" agiz={ses(t)} />
    </g>
  );
};

// ---------- 2 — Bobin: bakır sarım, akım saniyede 100 binden fazla yön değiştirir ----------
const BobinSahne: S = ({ t, ws, ses }) => {
  const tb = ws("bobin");
  const t1 = ws("100");
  const ty = ws("yön");
  const hiz = t < ty ? 0.15 : 1;
  const yon = Math.sin(t * (t < ty ? 3 : 40)) > 0 ? 1 : -1;
  const sayi = Math.round(100000 * ap(t, t1 - 0.3, 1.0));
  return (
    <g>
      <g transform={`translate(540 760) scale(${sp(t, tb - 0.5, 10)})`}>
        <Spiral x={0} y={0} s={0.85} t={t * hiz} yon={yon} />
      </g>
      <Tag x={540} y={330} text="BAKIR BOBİN" size={52} k={sp(t, tb)} bg={BAKIR} color="#fff" rot={-2} />
      {t > ty - 0.2 ? (
        <g>
          <Arrow x0={200} y0={760} x1={200} y1={760 - 160 * yon} k={1} color={ACC} sw={14} />
          <Arrow x0={880} y0={760} x1={880} y1={760 + 160 * yon} k={1} color={ACC} sw={14} />
        </g>
      ) : null}
      <g transform={`translate(540 1180) scale(${sp(t, t1 - 0.3, 9)})`}>
        <rect x={-330} y={-70} width={660} height={130} rx={65} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={22} textAnchor="middle" fontSize={62} fontWeight={900} fill={INK} style={font}>{`${sayi.toLocaleString("tr-TR")}+ / SN`}</text>
      </g>
      <Merakli x={930} y={1240} s={0.42} t={t} hareket="anlat" kostum="kulaklik" agiz={ses(t)} flip ink={CHALK} />
    </g>
  );
};

// ---------- 3 — Alan: değişen manyetik alan, ikinci bobin elektrik üretir ----------
const AlanSahne: S = ({ t, ws, ses }) => {
  const tm = ws("manyetik");
  const ti = ws("ikinci");
  const te = ws("elektrik");
  const alan = ap(t, tm - 0.4, 0.6);
  const ikinci = ap(t, ti - 0.2, 0.4);
  const dolu = lerp(0.2, 0.9, ap(t, te, 2.2));
  return (
    <g>
      <Duzen t={t} alan={alan} ikinci={ikinci} />
      <Tag x={540} y={330} text="MANYETİK ALAN" size={50} k={sp(t, tm)} bg={BLUE} color="#fff" rot={-2} />
      <Tag x={300} y={560} text="2. BOBİN" size={40} k={sp(t, ti)} bg={BAKIR} color="#fff" rot={-4} />
      <g opacity={ap(t, te - 0.3, 0.3)}>
        <Pil x={890} y={480} s={0.9} dolu={dolu} />
        <Glow cx={890} cy={480} r={150} id="pg" color={ACC} o={0.35 * Math.abs(Math.sin(t * 4))} />
      </g>
      <Merakli x={160} y={1240} s={0.42} t={t} hareket={t > te ? "aha" : "isaret"} kostum="kulaklik" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

// ---------- 4 — Kayma: telefonu kaydırınca çizgiler kopar, alan birkaç mm'de güçlü ----------
const Kayma: S = ({ t, ws, ses }) => {
  const tk = ws("kaydırınca");
  const td = ws("duruyor");
  const tm = ws("milimetrede");
  const dx = 300 * ez((t - tk + 0.2) / 0.8) * (1 - ap(t, tm - 0.6, 0.6));
  return (
    <g>
      <Duzen t={t} dx={dx} />
      <g transform={`translate(860 400) scale(${sp(t, td - 0.1, 9) * (1 - ap(t, tm - 0.6, 0.3))})`}>
        <circle r={70} fill={RED} stroke={INK} strokeWidth={6} />
        <path d="M 6 -40 L -16 6 L 2 6 L -8 44 L 18 -4 L 0 -4 Z" fill="#fff" />
        <Cross cx={0} cy={0} r={95} k={1} sw={12} color={INK} />
      </g>
      {/* birkaç mm ölçüsü */}
      <g opacity={ap(t, tm - 0.3, 0.3)}>
        <Arrow x0={150} y0={790} x1={150} y1={700} k={1} color={ACC} sw={10} />
        <Arrow x0={150} y0={790} x1={150} y1={900} k={1} color={ACC} sw={10} />
      </g>
      <Tag x={540} y={330} text="SADECE BİRKAÇ MM" size={48} k={sp(t, tm)} bg={ACC} rot={-2} />
      <g transform={`translate(540 340) scale(${sp(t, tk - 0.2, 9) * (1 - ap(t, tm - 0.3, 0.2))})`}>
        <text textAnchor="middle" y={30} fontSize={90} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={10} paintOrder="stroke" style={font}>?</text>
      </g>
      <Merakli x={930} y={1240} s={0.42} t={t} hareket={t > tm ? "anlat" : "dusun"} kostum="kulaklik" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 5 — Isı: enerji boşa gider, telefon ısınır, şarj yavaşlar; kalın kılıf da aynı ----------
const Isi: S = ({ t, ws, ses }) => {
  const tk = ws("kayınca");
  const ti = ws("ısınıyor");
  const ty = ws("yavaşlıyor");
  const tl = ws("kalın");
  const kilif = ap(t, tl - 0.2, 0.6);
  const dx = 180 * ez((t - tk + 0.3) / 0.6) * (1 - kilif);
  const isi = ap(t, ti - 0.3, 0.5);
  return (
    <g>
      <Duzen t={t} dx={dx} isi={isi} kilif={kilif} />
      <g opacity={ap(t, ti - 0.3, 0.3)}>
        <Termometre x={150} y={500} s={0.9} seviye={lerp(0.3, 0.85, isi) + 0.02 * Math.sin(t * 6)} />
      </g>
      <g opacity={ap(t, ty - 0.3, 0.3)}>
        <Pil x={920} y={500} s={0.9} dolu={0.3 + 0.03 * cl((t - ty) / 3)} />
        <text x={920} y={650} textAnchor="middle" fontSize={44} fontWeight={900} fill={RED} style={font}>YAVAŞ</text>
      </g>
      <Tag x={540} y={330} text="ENERJİ BOŞA GİDER" size={44} k={sp(t, ws("enerji")) * (1 - ap(t, tl - 0.3, 0.2))} bg={RED} color="#fff" rot={-2} />
      <Tag x={540} y={330} text="KALIN KILIF = AYNI SORUN" size={40} k={sp(t, tl + 0.1)} bg={ACC} rot={2} />
      <Merakli x={540} y={1240} s={0.42} t={t} hareket={t > ti ? "sasir" : "anlat"} kostum="kulaklik" agiz={ses(t)} />
    </g>
  );
};

// ---------- 6 — Sonuç: kablo aslında iki bobinin arasındaki boşlukta saklı ----------
const Sonuc: S = ({ t, ws, ses }) => {
  const td = ws("değil");
  const tk = ws("kablo", 2);
  const ts = ws("saklı");
  const kablo = ap(t, tk - 0.2, 0.8);
  return (
    <g>
      <Duzen t={t} alan={1 - kablo * 0.5} ikinci={1} />
      {/* görünmez kablo: alan çizgileri kablo şeklinde parlar */}
      <g opacity={kablo}>
        <path d="M 540 920 C 540 860 540 780 540 720" stroke={ACC} strokeWidth={46} strokeLinecap="round" opacity={0.35} />
        <path d="M 540 920 C 540 860 540 780 540 720" stroke={ACC} strokeWidth={16} strokeLinecap="round" strokeDasharray="20 16" strokeDashoffset={-t * 120} />
      </g>
      <Glow cx={540} cy={820} r={260} id="sg" color={ACC} o={0.4 * ap(t, ts - 0.3, 0.5)} />
      <g transform={`translate(540 340) scale(${sp(t, td - 0.2, 9)})`}>
        <rect x={-300} y={-60} width={600} height={110} rx={55} fill="#fff" stroke={INK} strokeWidth={7} />
        <text x={0} y={18} textAnchor="middle" fontSize={50} fontWeight={900} fill={INK} style={font}>KABLOSUZ DEĞİL</text>
      </g>
      <Tag x={760} y={560} text="KABLO BURADA" size={40} k={sp(t, ts - 0.2)} bg={ACC} rot={4} />
      <Arrow x0={720} y0={600} x1={590} y1={790} k={ap(t, ts, 0.4)} color={ACC} sw={10} />
      <Merakli x={170} y={1240} s={0.48} t={t} hareket={t > ts ? "kahkaha" : "anlat"} kostum="kulaklik" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, bobin: BobinSahne, alan: AlanSahne, kayma: Kayma, isi: Isi, sonuc: Sonuc };

export const KAPAK: React.FC = () => (
  <g>
    <g transform="translate(0 260)">
      <Duzen t={0.15} ikinci={1} />
    </g>
    <Merakli x={250} y={1640} s={0.95} t={0.3} hareket="sasir" kostum="kulaklik" />
  </g>
);
export const KAPAK_YAZI = { ust: "Arada hiç kablo yok", buyuk: "KABLO NEREDE?", alt: "Kablosuz şarjın sırrı" };
