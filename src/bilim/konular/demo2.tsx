// Konu: Demo 2 — yeni özelliklerin hepsi (kanca, seri rozeti, kostüm, dudak senkronu, derinlik, Blender,
// nesne kütüphanesi, platform sürümleri, taslak onayı, döngü). ws("kelime") = sahne içindeki saniye.
import React from "react";
import { staticFile } from "remotion";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, BLUE, Check, cl, ez, GREEN, INK, KATEGORI_RENK, lerp, RED, sp, Tag } from "../kit";
import { Merakli } from "../merakli";
import { Ampul, Atom, Disli, Dunya, Kitap, Mercek, Miknatis, Pil, Roket, Saat, Termometre, Telefon, Uydu } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const T: React.FC<{ x: number; y: number; s?: number; c?: string; k?: number; children: React.ReactNode; st?: string }> = ({ x, y, s = 60, c = "#fff", k = 1, children, st = INK }) => (
  <text x={x} y={y} textAnchor="middle" fontSize={s} fontWeight={900} fill={c} stroke={st} strokeWidth={s * 0.12} paintOrder="stroke" style={font}
    transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`} opacity={cl(k * 2)}>{children}</text>
);
const Patlama: React.FC<{ x: number; y: number; t: number; a: number; r?: number; c?: string }> = ({ x, y, t, a, r = 260, c = ACC }) => {
  const k = cl((t - a) / 0.5);
  if (t < a || k >= 1) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - k}>
      <circle r={r * ez(k)} fill="none" stroke={c} strokeWidth={30 * (1 - k)} />
      {Array.from({ length: 14 }).map((_, i) => {
        const an = (i / 14) * Math.PI * 2;
        return <path key={i} d={`M ${Math.cos(an) * r * 0.4 * k} ${Math.sin(an) * r * 0.4 * k} L ${Math.cos(an) * r * k} ${Math.sin(an) * r * k}`} stroke={i % 2 ? c : "#fff"} strokeWidth={12} strokeLinecap="round" />;
      })}
    </g>
  );
};

// ---------- 1 — Kanca: 2 saniyelik kronometre ----------
const Kanca: S = ({ t, ws, ses }) => {
  const ti = ws("işte");
  const k = sp(t, 0, 10);
  const dolu = cl(t / 2);
  const bitti = t > ti;
  return (
    <g>
      <g transform={`translate(560 1020) scale(${1.25 * k}) rotate(${Math.sin(t * 30) * 3 * (1 - dolu)})`}>
        <circle r={118} fill={bitti ? GREEN : "#fffaf0"} stroke={INK} strokeWidth={10} />
        <path d={`M 0 0 L 0 -100 A 100 100 0 ${dolu > 0.5 ? 1 : 0} 1 ${Math.sin(dolu * Math.PI * 2) * 100} ${-Math.cos(dolu * Math.PI * 2) * 100} Z`} fill={bitti ? "#2f8c55" : RED} opacity={0.85} />
        <rect x={-18} y={-150} width={36} height={30} rx={6} fill={INK} />
        <rect x={-34} y={-164} width={68} height={18} rx={8} fill={INK} />
        {bitti ? <path d="M -48 4 L -14 38 L 52 -34" stroke="#fff" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : <text y={34} textAnchor="middle" fontSize={96} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke" style={font}>{Math.min(2, t).toFixed(1)}</text>}
      </g>
      <Patlama x={560} y={1020} t={t} a={ti} r={330} />
      <Merakli x={200} y={1230} s={0.72} t={t} hareket={bitti ? "aha" : "kos"} agiz={ses(t)} poz={bitti ? {} : { lean: 10 }} />
      {bitti ? <Tag x={560} y={1235} text="YAKALADIK!" size={56} k={sp(t, ti + 0.1)} bg={ACC} rot={-4} /> : null}
    </g>
  );
};

// ---------- 2 — Seri rozeti ve kategori rengi ----------
const KATS = ["BİLİM", "TARİH", "TEKNOLOJİ", "KENDİN YAP"];
const Rozet: S = ({ t, ws, ses }) => {
  const tk = ws("köşesinde");
  const tn = ws("seri");
  const tc = ws("kategori");
  const ph = sp(t, 0.1, 13);
  const ki = t < tc ? 0 : Math.min(3, Math.floor((t - tc) / 0.45));
  const renk = KATEGORI_RENK[KATS[ki].toLocaleLowerCase("tr-TR")] || BLUE;
  const no = t < tn ? 1 : Math.min(3, 1 + Math.floor((t - tn) / 0.35));
  const rk = sp(t, tn - 0.2, 9);
  return (
    <g>
      <g transform={`translate(540 760) scale(${ph}) rotate(${(1 - ph) * 8})`}>
        <rect x={-210} y={-380} width={420} height={760} rx={56} fill="#1d2433" stroke={INK} strokeWidth={12} />
        <rect x={-186} y={-350} width={372} height={700} rx={36} fill="#f3e6c8" />
        <rect x={-150} y={-300} width={190} height={34} rx={17} fill={ACC} stroke={INK} strokeWidth={4} />
        <g transform="translate(-30 40)">
          <Merakli x={0} y={200} s={0.55} t={t} hareket="anlat" agiz={ses(t)} />
        </g>
        <g transform={`translate(122 -270) scale(${rk})`}>
          <circle r={50} fill={renk} stroke={INK} strokeWidth={6} />
          <circle r={38} fill="none" stroke="#fff" strokeWidth={7} strokeDasharray={`${(2 * Math.PI * 38 * no) / 30} 999`} transform="rotate(-90)" strokeLinecap="round" />
          <text y={11} textAnchor="middle" fontSize={30} fontWeight={900} fill="#fff" style={font}>{no}/30</text>
        </g>
      </g>
      {t > tk ? <circle cx={662} cy={490} r={70 + 12 * Math.sin(t * 9)} fill="none" stroke={ACC} strokeWidth={8} opacity={0.9} /> : null}
      <Arrow x0={900} y0={360} x1={720} y1={460} k={ap(t, tk, 0.35)} color={ACC} sw={10} />
      {KATS.map((k, i) => {
        const c = KATEGORI_RENK[k.toLocaleLowerCase("tr-TR")] || BLUE;
        const kk = sp(t, tc + i * 0.45, 9);
        return <Tag key={k} x={i % 2 ? 790 : 290} y={1185 + Math.floor(i / 2) * 0} text={k} size={40} k={kk * (i === ki ? 1.12 : 0.9)} bg={c} color="#fff" rot={i % 2 ? 3 : -3} />;
      }).filter((_, i) => i === ki || i === (ki + 1) % 4)}
    </g>
  );
};

// ---------- 3 — Kostümler ----------
const Kostum: S = ({ t, ws, ses }) => {
  const ts = [ws("şapka"), ws("önlük"), ws("baret")];
  const dolap = ap(t, ws("giyiniyor") - 0.3, 0.5);
  const kost = ["sapka", "onluk", "usta"] as const;
  const et = ["TARİH", "BİLİM", "KENDİN YAP"];
  const renk = [KATEGORI_RENK.tarih, KATEGORI_RENK.bilim, KATEGORI_RENK["kendin yap"]];
  const xs = [190, 540, 890];
  return (
    <g>
      <g transform="translate(540 470)">
        <rect x={-190} y={-150} width={380} height={300} rx={18} fill="#8a5a33" stroke={INK} strokeWidth={8} />
        <rect x={-170} y={-130} width={340} height={260} fill="#3b2614" />
        <path d="M -150 -80 L 150 -80" stroke="#c9c2b4" strokeWidth={6} />
        {[-100, -20, 60].map((x, i) => <path key={i} d={`M ${x} -80 l 0 14 l -40 40 l 80 0 l -40 -40`} stroke="#c9c2b4" strokeWidth={5} fill="none" opacity={t < ts[i] ? 1 : 0.2} />)}
        <g transform={`translate(-170 0) scale(${1 - dolap * 0.85} 1)`}>
          <rect x={0} y={-130} width={170} height={260} fill="#a8703f" stroke={INK} strokeWidth={6} />
          <circle cx={150} cy={0} r={8} fill={ACC} />
        </g>
        <g transform={`translate(170 0) scale(${1 - dolap * 0.85} 1)`}>
          <rect x={-170} y={-130} width={170} height={260} fill="#a8703f" stroke={INK} strokeWidth={6} />
          <circle cx={-150} cy={0} r={8} fill={ACC} />
        </g>
      </g>
      {xs.map((x, i) => {
        const k = sp(t, ts[i] - 0.15, 10);
        const giydi = t > ts[i];
        return (
          <g key={i} opacity={cl(k * 2)}>
            <Merakli x={x} y={1210} s={0.74 * Math.max(0.01, k)} t={t + i} hareket={giydi ? (i === 1 ? "anlat" : i === 0 ? "isaret" : "salla") : "dur"} kostum={giydi ? kost[i] : "yok"} agiz={ses(t)} duygu={giydi ? "happy" : undefined} />
            <Tag x={x} y={780} text={et[i]} size={38} k={sp(t, ts[i], 9)} bg={renk[i]} color="#fff" rot={i === 1 ? 0 : i ? 4 : -4} />
            <Patlama x={x} y={1000} t={t} a={ts[i]} r={160} c={renk[i]} />
          </g>
        );
      })}
    </g>
  );
};

// ---------- 4 — Dudak senkronu ----------
const Agiz: S = ({ t, ws, ses }) => {
  const tb = ws("birlikte");
  const bars = 46;
  return (
    <g>
      <g transform="translate(0 420)">
        <rect x={60} y={-90} width={960} height={180} rx={30} fill="rgba(0,0,0,0.12)" stroke={INK} strokeWidth={5} />
        {Array.from({ length: bars }).map((_, i) => {
          const v = ses(t - (bars - 1 - i) * 0.035);
          const h = 8 + v * 150;
          return <rect key={i} x={86 + i * 20} y={-h / 2} width={12} height={h} rx={6} fill={i === bars - 1 ? RED : INK} opacity={0.35 + 0.65 * (i / bars)} />;
        })}
      </g>
      <Tag x={540} y={300} text="SENİN SESİN" size={40} k={sp(t, 0.15)} bg={ACC} />
      <g transform="translate(240 900)">
        <rect x={-34} y={-90} width={68} height={130} rx={34} fill="#555" stroke={INK} strokeWidth={6} />
        <path d="M -56 0 Q -56 70 0 70 Q 56 70 56 0 M 0 70 L 0 120 M -40 120 L 40 120" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
        {[0, 1, 2].map((i) => {
          const r = 70 + i * 34 + ses(t) * 30;
          return <path key={i} d={`M ${r * 0.7} ${-20 - r * 0.7} A ${r} ${r} 0 0 1 ${r * 0.7} ${-20 + r * 0.7}`} stroke={RED} strokeWidth={6} fill="none" opacity={ses(t) * (1 - i * 0.25)} />;
        })}
      </g>
      <Merakli x={680} y={1230} s={1.15} t={t} hareket="anlat" kostum="kulaklik" agiz={ses(t)} duygu={t > tb ? "happy" : undefined} />
      <Tag x={720} y={560} text="AĞZI SESİNLE OYNUYOR" size={36} k={sp(t, tb - 0.3)} bg={GREEN} color="#fff" rot={-3} />
    </g>
  );
};

// ---------- 5 — Derinlikli (parallax) yapay zekâ görseli ----------
const Derinlik: S = ({ t, d, ws }) => {
  const p = ez(t / Math.max(d, 0.1));
  const tdr = ws("derinlik");
  const tk = ws("kamera");
  const harita = ap(t, tdr, 0.4) * (1 - ap(t, tk, 0.4));
  const ayir = ap(t, tdr + 0.4, 0.6) * (1 - ap(t, tk, 0.5));
  const img = (ad: string, s: number, dx: number, dy: number) => (
    <image href={staticFile(`bilim/demo2/atolye_${ad}.png`)} x={0} y={-40} width={1080} height={1920} preserveAspectRatio="xMidYMid slice"
      transform={`translate(540 920) scale(${s}) translate(${-540 + dx} ${-920 + dy})`} />
  );
  return (
    <g>
      <rect x={0} y={-40} width={1080} height={1920} fill="#1b130c" />
      <g opacity={1 - ayir * 0.3}>{img("k0", 1.12 + 0.04 * p, lerp(30, -30, p), 0)}</g>
      <g transform={`translate(${ayir * -60} ${ayir * -40})`}>{img("k1", 1.14 + 0.1 * p, lerp(60, -70, p), lerp(0, -20, p))}</g>
      <g transform={`translate(${ayir * 60} ${ayir * 40})`}>{img("k2", 1.16 + 0.2 * p, lerp(110, -130, p), lerp(10, -40, p))}</g>
      {harita > 0.01 ? (
        <g opacity={harita} transform={`translate(700 330) scale(${0.8 + 0.2 * harita})`}>
          <rect x={-8} y={-8} width={316} height={420} rx={20} fill="#fff" stroke={INK} strokeWidth={6} />
          <image href={staticFile("bilim/demo2/atolye_derinlik.png")} x={0} y={0} width={300} height={404} preserveAspectRatio="xMidYMid slice" />
          <text x={150} y={445} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={6} paintOrder="stroke" style={font}>DERİNLİK</text>
        </g>
      ) : null}
      {ayir > 0.05 ? (
        <g opacity={ayir}>
          {["ARKA", "ORTA", "ÖN"].map((e, i) => <Tag key={e} x={180} y={420 + i * 110} text={e} size={36} k={sp(t, tdr + 0.4 + i * 0.12)} bg={[BLUE, ACC, RED][i]} color={i === 1 ? INK : "#fff"} />)}
        </g>
      ) : null}
      <Tag x={540} y={1200} text="KAMERA İÇERİDE" size={46} k={sp(t, tk)} bg={ACC} rot={-3} />
    </g>
  );
};

// ---------- 6 — Blender 3B (video paneli BilimVideo'da çizilir) ----------
const Blender: S = ({ t, ws, ses }) => {
  const t3 = ws("üç");
  return (
    <g>
      <Tag x={540} y={400} text="BLENDER" size={64} k={sp(t, 0.1)} bg="#ea7600" color="#fff" rot={-3} />
      <g opacity={ap(t, t3, 0.3)}>
        <T x={900} y={520} s={130} c={ACC} k={sp(t, t3, 8)}>3B</T>
      </g>
      <Merakli x={140} y={1230} s={0.6} t={t} hareket="isaret" agiz={ses(t)} kostum="usta" />
    </g>
  );
};

// ---------- 7 — Nesne kütüphanesi ----------
const Nesneler: S = ({ t, ws }) => {
  const th = ws("hızlı");
  const tk = ws("kütüphanesi");
  const liste: React.FC<{ x: number; y: number; s: number; t: number }>[] = [
    (p) => <Ampul {...p} yan={Math.sin(p.t * 3) > -0.3 ? 1 : 0} />, (p) => <Disli {...p} />, Miknatis, (p) => <Pil {...p} dolu={0.5 + 0.5 * Math.sin(p.t * 2)} />,
    Dunya, Uydu, Mercek, Saat, (p) => <Termometre {...p} seviye={0.5 + 0.4 * Math.sin(p.t * 2)} />, Roket, Atom, Kitap,
  ];
  const hiz = t > th ? 3 : 1;
  return (
    <g>
      <Tag x={540} y={340} text="NESNE KÜTÜPHANESİ" size={46} k={sp(t, tk)} bg={ACC} />
      {liste.map((C, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const k = sp(t, 0.15 + i * 0.12, 9);
        const x = 200 + col * 340;
        const y = 500 + row * 200;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${k}) rotate(${(1 - k) * 90})`}>
            <rect x={-130} y={-90} width={260} height={180} rx={24} fill="rgba(255,255,255,0.08)" stroke="#f4efe2" strokeWidth={3} strokeDasharray="10 8" />
            <C x={0} y={0} s={0.5} t={t * hiz + i} />
          </g>
        );
      })}
      {t > th ? <Tag x={540} y={1225} text="HIZLI ÇİZİM" size={44} k={sp(t, th)} bg={GREEN} color="#fff" rot={3} /> : null}
    </g>
  );
};

// ---------- 8 — Platformlar ----------
const PLATF: { ad: string; renk: string; alt: number; ikon: number }[] = [
  { ad: "Instagram", renk: "#d6249f", alt: 0.68, ikon: 0 },
  { ad: "TikTok", renk: "#111", alt: 0.6, ikon: 1 },
  { ad: "Shorts", renk: "#ff0000", alt: 0.63, ikon: 2 },
];
const Platform: S = ({ t, ws }) => {
  const ts = [ws("Instagram"), ws("tiktok"), ws("youtube")];
  const ta = ws("ayarlanıyor");
  return (
    <g>
      {PLATF.map((p, i) => {
        const k = sp(t, ts[i] - 0.25, 10);
        const x = 190 + i * 350;
        const w = 280;
        const h = 500;
        const y0 = 560;
        const ayar = ap(t, ta, 0.6);
        return (
          <g key={p.ad} transform={`translate(${x} ${y0 + h / 2}) scale(${k}) rotate(${(1 - k) * (i - 1) * 20}) translate(${-x} ${-(y0 + h / 2)})`}>
            <rect x={x - w / 2 - 12} y={y0 - 12} width={w + 24} height={h + 24} rx={34} fill="#1d2433" stroke={INK} strokeWidth={6} />
            <rect x={x - w / 2} y={y0} width={w} height={h} rx={24} fill="#f3e6c8" />
            {/* platform arayüzü (sağ ikonlar, alt bilgi) */}
            {[0, 1, 2, 3].map((j) => <circle key={j} cx={x + w / 2 - 26} cy={y0 + h * 0.5 + j * 46} r={15} fill="#999" opacity={0.7} />)}
            <rect x={x - w / 2 + 14} y={y0 + h - 60} width={w * 0.6} height={14} rx={7} fill="#999" opacity={0.7} />
            {/* altyazı bandı: ayarlanınca güvenli alana kayar */}
            <rect x={x - w / 2 + 16} y={y0 + h * lerp(0.8, p.alt, ayar)} width={w - 70} height={34} rx={10} fill={ACC} stroke={INK} strokeWidth={3} />
            <rect x={x - w / 2 + 30} y={y0 + 40} width={w - 60} height={10} rx={5} fill={ACC} />
            <rect x={x - 70} y={y0 + 140} width={140} height={110} rx={14} fill={BLUE} opacity={0.5} />
            <rect x={x - 70} y={y0 + h + 30} width={140} height={46} rx={23} fill={p.renk} stroke={INK} strokeWidth={4} />
            <text x={x} y={y0 + h + 63} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fff" style={font}>{p.ad}</text>
            {ayar > 0.9 ? <Check cx={x + w / 2 - 10} cy={y0 - 10} s={0.35} k={ap(t, ta + 0.5 + i * 0.12, 0.4)} /> : null}
          </g>
        );
      })}
      <Tag x={540} y={420} text="3 PLATFORM, 3 AYAR" size={44} k={sp(t, ta - 0.2)} bg={ACC} />
    </g>
  );
};

// ---------- 9 — Taslak (storyboard) onayı ----------
const Taslak: S = ({ t, ws, ses }) => {
  const to = ws("onayına");
  const ts = ws("sahneleri");
  const kucuk: React.FC<{ x: number; y: number; s: number; t: number }>[] = [Ampul, Disli, Dunya, Roket, Saat, Atom];
  const onay = sp(t, ws("sunuyorum") + 0.1, 7);
  return (
    <g>
      <Tag x={540} y={340} text="TASLAK" size={56} k={sp(t, 0.1)} bg={ACC} rot={-2} />
      {kucuk.map((C, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 220 + col * 320;
        const y = 560 + row * 330;
        const k = sp(t, ts - 0.2 + i * 0.1, 10);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${k}) rotate(${(i % 2 ? 2 : -2) * k})`}>
            <rect x={-130} y={-140} width={260} height={280} rx={10} fill="#fffaf0" stroke={INK} strokeWidth={5} />
            <rect x={-110} y={-120} width={220} height={190} fill="#e8dcc0" />
            <C x={0} y={-25} s={0.55} t={t + i} />
            <text x={-110} y={115} fontSize={30} fontWeight={900} fill={INK} style={font}>{i + 1}</text>
            <path d="M -60 106 L 110 106" stroke={INK} strokeWidth={4} opacity={0.4} />
            {t > to + i * 0.08 ? <Check cx={95} cy={-115} s={0.28} k={ap(t, to + i * 0.08, 0.3)} /> : null}
          </g>
        );
      })}
      {onay > 0.02 ? (
        <g transform={`translate(560 760) rotate(-12) scale(${2.2 - 1.2 * onay})`} opacity={cl(onay * 1.5)}>
          <rect x={-230} y={-80} width={460} height={160} rx={20} fill="none" stroke={GREEN} strokeWidth={16} />
          <text y={42} textAnchor="middle" fontSize={120} fontWeight={900} fill={GREEN} style={font}>ONAY</text>
        </g>
      ) : null}
      <Merakli x={540} y={1240} s={0.45} t={t} hareket="dusun" agiz={ses(t)} kostum="onluk" />
    </g>
  );
};

// ---------- 10 — Döngü ----------
const Dongu: S = ({ t, ws, ses }) => {
  const tb = ws("başa");
  const r = 300;
  const a = t * 2.4;
  return (
    <g>
      <g transform="translate(540 800)">
        <circle r={r} fill="none" stroke="#f4efe2" strokeWidth={14} strokeDasharray="30 22" strokeDashoffset={-t * 120} opacity={0.6} />
        <path d={`M ${r} 0 l -26 -40 l 52 0 Z`} fill={ACC} transform={`rotate(${(a * 180) / Math.PI})`} />
        <g transform={`rotate(${(a * 180) / Math.PI}) translate(0 ${-r}) rotate(${-(a * 180) / Math.PI})`}>
          <Merakli x={0} y={90} s={0.4} t={t} hareket="kos" agiz={ses(t)} />
        </g>
        <text y={70} textAnchor="middle" fontSize={210} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={14} paintOrder="stroke" style={font}
          transform={`scale(${sp(t, tb, 8)})`}>∞</text>
      </g>
      <Tag x={540} y={1230} text="TEKRAR İZLE" size={48} k={sp(t, tb + 0.2)} bg={RED} color="#fff" rot={-3} />
      <Arrow x0={760} y0={1180} x1={900} y1={1050} k={ap(t, tb + 0.4, 0.3)} color={ACC} sw={10} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { kanca: Kanca, rozet: Rozet, kostum: Kostum, agiz: Agiz, derinlik: Derinlik, blender: Blender, nesneler: Nesneler, platform: Platform, taslak: Taslak, dongu: Dongu };

export const KAPAK: React.FC = () => (
  <g>
    <Disli x={250} y={700} s={1.3} t={0.3} />
    <Disli x={420} y={600} s={0.8} t={0.8} dis={9} hiz={-60} renk="#b87333" yc={50} />
    <Roket x={860} y={760} s={1.1} t={0.2} r={20} />
    <Telefon x={790} y={1180} s={0.9} t={0} ekran={ACC} />
    <Merakli x={330} y={1640} s={0.95} t={0.3} hareket="aha" kostum="usta" />
  </g>
);
export const KAPAK_YAZI = { ust: "Bir Dakikada Bilim", buyuk: "YENİ HÜNERLER!", alt: "Hepsi tek videoda" };
