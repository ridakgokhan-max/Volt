// Konu (Teknoloji): QR kod neden bozulmaz? — ÇİZİM tekniği (gerçek foto yok). Ses: Kadir.
// ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, cl, Cross, ez, GREEN, Glow, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";
import { Disli, Telefon } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const N = 25; // modül sayısı

const rnd = (i: number, j: number) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const bulucu = (i: number, j: number) => {
  const ic = (a: number, b: number) => i >= a && i < a + 7 && j >= b && j < b + 7;
  return ic(0, 0) || ic(0, N - 7) || ic(N - 7, 0);
};

/** Çizim QR kod. yirtik: 0–1 sağ alt köşeden yırtılan oran; vurgu: köşe karelerini parlat */
const QR: React.FC<{ x: number; y: number; s?: number; yirtik?: number; vurgu?: number; rot?: number; renk?: string; silik?: number }> = ({ x, y, s = 1, yirtik = 0, vurgu = 0, rot = 0, renk = INK, silik = 0 }) => {
  const m = 20;
  const W = N * m;
  const c = 2 - 0.82 * yirtik; // (i+j)/N bu değeri geçen modüller yırtık parçada
  const kutu: React.ReactNode[] = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (bulucu(i, j)) continue;
      if (yirtik > 0.01 && (i + j + 1) / N > c) continue;
      if (rnd(i, j) > 0.52) kutu.push(<rect key={`${i}-${j}`} x={j * m} y={i * m} width={m} height={m} fill={renk} opacity={silik && rnd(j, i) < silik ? 0.15 : 1} />);
    }
  const Bul = ({ bx, by }: { bx: number; by: number }) => (
    <g transform={`translate(${bx * m} ${by * m})`}>
      <rect x={0} y={0} width={7 * m} height={7 * m} fill={vurgu > 0.5 ? RED : renk} />
      <rect x={m} y={m} width={5 * m} height={5 * m} fill="#fff" />
      <rect x={2 * m} y={2 * m} width={3 * m} height={3 * m} fill={vurgu > 0.5 ? RED : renk} />
      {vurgu > 0.05 ? <rect x={-12} y={-12} width={7 * m + 24} height={7 * m + 24} fill="none" stroke={ACC} strokeWidth={10} opacity={vurgu} rx={10} /> : null}
    </g>
  );
  // kart: yırtıksa sağ alt köşe tırtıklı çizgiyle kesik
  const P = 40;
  let kart = `M ${-P} ${-P} L ${W + P} ${-P}`;
  if (yirtik > 0.01) {
    const d = c * W; // x + y = d çizgisi
    const ax = W + P, ay = d - ax, bx = d - (W + P), by = W + P;
    kart += ` L ${ax} ${ay}`;
    for (let k = 1; k < 12; k++) {
      const u = k / 12;
      const off = (k % 2 ? 1 : -1) * 16;
      kart += ` L ${lerp(ax, bx, u) + off * 0.7} ${lerp(ay, by, u) + off * 0.7}`;
    }
    kart += ` L ${bx} ${by}`;
  } else kart += ` L ${W + P} ${W + P}`;
  kart += ` L ${-P} ${W + P} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(${-W / 2} ${-W / 2})`}>
      <path d={kart} fill="#fff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {kutu}
      <Bul bx={0} by={0} />
      <Bul bx={N - 7} by={0} />
      <Bul bx={0} by={N - 7} />
    </g>
  );
};

/** Telefonla okutma: telefon + tarama çizgisi + tik */
const Okut: React.FC<{ x: number; y: number; t: number; k: number; ok?: number }> = ({ x, y, t, k, ok = 0 }) => (
  <g transform={`translate(${x} ${y})`} opacity={k}>
    <Telefon x={0} y={0} s={0.75} t={t} ekran={ok > 0.5 ? GREEN : BLUE} />
    {ok > 0.5 ? (
      <path d="M -50 -10 L -10 30 L 60 -50" stroke="#fff" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <line x1={-80} x2={80} y1={-60 + ((t * 120) % 160)} y2={-60 + ((t * 120) % 160)} stroke={RED} strokeWidth={6} />
    )}
  </g>
);

/** Go tahtası: ızgara + taşlar (biraz kaymış ama yeri belli) */
const GoTahtasi: React.FC<{ x: number; y: number; s?: number; t: number; kay?: number }> = ({ x, y, s = 1, t, kay = 0 }) => {
  const n = 9, a = 64;
  const tas: [number, number, string][] = [[2, 2, INK], [3, 5, "#fff"], [5, 3, INK], [6, 6, "#fff"], [4, 4, INK], [2, 6, "#fff"], [6, 2, INK], [1, 4, "#fff"]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${-(n - 1) * a / 2} ${-(n - 1) * a / 2})`}>
      <rect x={-50} y={-50} width={(n - 1) * a + 100} height={(n - 1) * a + 100} rx={16} fill="#e2b46b" stroke={INK} strokeWidth={8} />
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <line x1={0} x2={(n - 1) * a} y1={i * a} y2={i * a} stroke={INK} strokeWidth={3} />
          <line y1={0} y2={(n - 1) * a} x1={i * a} x2={i * a} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {tas.map(([i, j, c], k) => (
        <circle key={k} cx={j * a + Math.sin(k * 3.1) * 14 * kay} cy={i * a + Math.cos(k * 2.3) * 14 * kay} r={26} fill={c} stroke={INK} strokeWidth={5} />
      ))}
    </g>
  );
};

/** Şehir silueti: bir gökdelen sıyrılıyor */
const Siluet: React.FC<{ x: number; y: number; t: number; vurgu: number }> = ({ x, y, t, vurgu }) => {
  const b: [number, number, number][] = [[-380, 140, 220], [-280, 120, 300], [-170, 110, 180], [-60, 130, 260], [180, 120, 240], [300, 110, 320], [400, 100, 200]];
  return (
    <g transform={`translate(${x} ${y})`}>
      {b.map(([bx, w, h], i) => <rect key={i} x={bx - w / 2} y={-h} width={w} height={h} fill="#3a4a6b" stroke={INK} strokeWidth={6} />)}
      <g>
        <rect x={20} y={-560} width={130} height={560} fill={vurgu > 0.5 ? ACC : "#4d5f86"} stroke={INK} strokeWidth={7} />
        {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={45} y={-520 + i * 62} width={80} height={30} fill={vurgu > 0.5 ? "#fff6c8" : "#90a4c8"} stroke={INK} strokeWidth={3} />)}
        <line x1={85} y1={-560} x2={85} y2={-640} stroke={INK} strokeWidth={8} />
      </g>
    </g>
  );
};

/** Otopark ödeme direği + sahte çıkartma */
const Parkmetre: React.FC<{ x: number; y: number; t: number; sahte: number }> = ({ x, y, t, sahte }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-22} y={0} width={44} height={420} fill="#7d8790" stroke={INK} strokeWidth={7} />
    <rect x={-140} y={-300} width={280} height={320} rx={30} fill="#9aa5ae" stroke={INK} strokeWidth={8} />
    <rect x={-110} y={-270} width={220} height={80} rx={10} fill="#1d2430" stroke={INK} strokeWidth={5} />
    <Txt x={0} y={-215} text="OTOPARK" size={34} color="#9fe6a0" />
    <QR x={0} y={-80} s={0.3} />
    <g opacity={sahte} transform={`translate(${lerp(240, 0, ez(sahte))} -80) rotate(${lerp(30, -4, ez(sahte))})`}>
      <rect x={-92} y={-92} width={184} height={184} fill="#fff8d8" stroke={RED} strokeWidth={6} strokeDasharray="12 8" />
      <QR x={0} y={0} s={0.27} renk="#5a1d14" />
    </g>
  </g>
);

/** Adres önizleme balonu */
const Adres: React.FC<{ x: number; y: number; k: number; text: string; iyi: boolean }> = ({ x, y, k, text, iyi }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`} opacity={cl(k * 1.4)}>
    <rect x={-330} y={-60} width={660} height={120} rx={30} fill="#fff" stroke={iyi ? GREEN : RED} strokeWidth={8} />
    <text x={-280} y={16} fontSize={42} fontWeight={900} fill={INK} style={font}>🔗</text>
    <text x={-210} y={16} fontSize={40} fontWeight={800} fill={iyi ? INK : RED} style={font}>{text}</text>
  </g>
);

// ---------- 1 — Bu karenin üçte biri yırtılsa bile telefonun onu yine okur. Peki nasıl? ----------
const Giris: S = ({ t, ws, ses }) => {
  const tn = ws("nasıl");
  return (
    <g>
      <QR x={460} y={700} s={1} yirtik={1} rot={-4} />
      <Okut x={860} y={980} t={t} k={ap(t, 0.6, 0.3)} ok={t > 1.6 ? 1 : 0} />
      <Tag x={540} y={340} text="YİNE DE OKUNUYOR!" size={50} k={sp(t, 1.7) * (1 - ap(t, tn - 0.3, 0.15))} bg={GREEN} color="#fff" rot={-3} />
      <Tag x={540} y={340} text="NASIL?" size={64} k={sp(t, tn - 0.1)} bg={ACC} rot={2} />
    </g>
  );
};

// ---------- 2 — 1994, Japonya, Masahiro Hara; araba fabrikasında parça takibi ----------
const Tarih: S = ({ t, ws, ses }) => {
  const ta = ws("araba");
  return (
    <g>
      <g transform={`translate(540 560) scale(${sp(t, 0.15, 9)})`}>
        <circle r={150} fill="#fff" stroke={INK} strokeWidth={8} />
        <circle r={70} fill={RED} />
        <Txt x={0} y={230} text="JAPONYA · 1994" size={52} color={CHALK} stroke={INK} />
      </g>
      <g opacity={ap(t, ta - 0.3, 0.3)}>
        <Disli x={250} y={1000} s={0.9} t={t} hiz={60} />
        <Disli x={420} y={1080} s={0.6} t={-t} hiz={80} renk="#9aa3ab" />
        <QR x={760} y={1020} s={0.45} rot={6} />
      </g>
      <Tag x={540} y={340} text="MASAHIRO HARA" size={52} k={sp(t, ws("masahiro") - 0.1)} bg={ACC} rot={-2} />
      <Merakli x={900} y={1240} s={0.42} t={t} hareket="anlat" kostum="kulaklik" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 3 — Fikir Go oyunundan; bilgi birden fazla kez yazılıyor, eksik tamamlanıyor ----------
const Go: S = ({ t, ws, ses }) => {
  const tk = ws("kaysa");
  const tb = ws("birden");
  const ikinci = ap(t, tb - 0.3, 0.4);
  return (
    <g>
      <g opacity={1 - ikinci}>
        <GoTahtasi x={540} y={760} s={1.05} t={t} kay={ap(t, tk - 0.3, 0.5)} />
      </g>
      <g opacity={ikinci}>
        <QR x={330} y={720} s={0.5} silik={0} />
        <QR x={750} y={720} s={0.5} silik={0.45} />
        <path d="M 470 1010 Q 540 1080 610 1010" stroke={GREEN} strokeWidth={10} fill="none" />
        <Txt x={540} y={1090} text="EKSİK = KOPYADAN TAMAM" size={42} color={CHALK} stroke={INK} />
      </g>
      <Tag x={540} y={340} text="GO OYUNU" size={56} k={sp(t, 0.2) * (1 - ap(t, tb - 0.4, 0.15))} bg={ACC} rot={-2} />
      <Tag x={540} y={340} text="BİLGİ BİRKAÇ KEZ YAZILIYOR" size={42} k={sp(t, tb - 0.1)} bg={GREEN} color="#fff" rot={2} />
    </g>
  );
};

// ---------- 4 — Köşedeki üç büyük kare: "kod burada" ----------
const Kare: S = ({ t, ws, ses }) => {
  const tu = ws("üç");
  return (
    <g>
      <QR x={540} y={740} s={1.05} vurgu={ap(t, tu - 0.1, 0.3)} />
      <Tag x={540} y={340} text={'3 KARE = "KOD BURADA"'} size={46} k={sp(t, ws("burada") - 0.2)} bg={ACC} rot={-2} />
      <Merakli x={900} y={1240} s={0.42} t={t} hareket="isaret" kostum="kulaklik" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 5 — Fikir trende, sıyrılan bir gökdelene bakarken; ters/eğik dursa da tanıyor ----------
const Gokdelen: S = ({ t, ws, ses }) => {
  const tg = ws("gökdelene");
  const tt = ws("ters");
  const ikinci = ap(t, tt - 0.4, 0.4);
  return (
    <g>
      <g opacity={1 - ikinci}>
        <Siluet x={540} y={1100} t={t} vurgu={ap(t, tg - 0.2, 0.2)} />
        <Glow cx={625} cy={760} r={220} id="qg" color="#fff1a8" o={0.6 * ap(t, tg - 0.2, 0.4)} />
      </g>
      <g opacity={ikinci}>
        <QR x={300} y={700} s={0.42} rot={180} vurgu={1} />
        <QR x={760} y={720} s={0.42} rot={-28} vurgu={1} />
        <Okut x={540} y={1060} t={t} k={1} ok={t > tt + 0.6 ? 1 : 0} />
      </g>
      <Tag x={540} y={340} text="GÖKDELEN FİKRİ" size={54} k={sp(t, tg - 0.1) * (1 - ap(t, tt - 0.4, 0.15))} bg={ACC} rot={-2} />
      <Tag x={540} y={340} text="TERS DE OLSA OKUR" size={52} k={sp(t, tt - 0.1)} bg={GREEN} color="#fff" rot={2} />
    </g>
  );
};

// ---------- 6 — Karanlık taraf: otoparkta gerçek QR'ın üstüne sahte çıkartma ----------
const Karanlik: S = ({ t, ws, ses }) => {
  const ts = ws("sahte");
  const to = ws("ödeme");
  return (
    <g>
      <Parkmetre x={380} y={760} t={t} sahte={ap(t, ts - 0.4, 0.6)} />
      <Adres x={540} y={1110} k={sp(t, to - 0.1)} text="odeme-otopark.xyz" iyi={false} />
      <Tag x={540} y={340} text="KARANLIK TARAF" size={56} k={sp(t, 0.2) * (1 - ap(t, ts - 0.3, 0.15))} bg={RED} color="#fff" rot={-2} />
      <Tag x={540} y={340} text="SAHTE ÇIKARTMA" size={56} k={sp(t, ts - 0.1)} bg={RED} color="#fff" rot={2} />
      <Merakli x={870} y={1240} s={0.45} t={t} hareket="sasir" kostum="kulaklik" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 7 — Açmadan önce adrese bak; tanımadığın adres çıkarsa açma ----------
const Cozum: S = ({ t, ws, ses }) => {
  const tb = ws("adrese");
  const ta = ws("açma", 1);
  return (
    <g>
      <g transform="translate(540 700)"><Telefon x={0} y={0} s={1.2} t={t} ekran="#1d2430" /></g>
      <Adres x={540} y={560} k={sp(t, tb - 0.1)} text="belediye.gov.tr ✓" iyi />
      <Adres x={540} y={760} k={sp(t, tb + 0.6)} text="0dem3-park.xyz ✗" iyi={false} />
      <g opacity={ap(t, ta - 0.2, 0.2)}><Cross cx={540} cy={760} r={110} k={ap(t, ta - 0.2, 0.3)} sw={16} /></g>
      <Tag x={540} y={340} text="ÖNCE ADRESE BAK" size={56} k={sp(t, tb - 0.2)} bg={ACC} rot={-2} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, tarih: Tarih, go: Go, kare: Kare, gokdelen: Gokdelen, karanlik: Karanlik, cozum: Cozum };

export const KAPAK: React.FC = () => (
  <g>
    <QR x={540} y={1330} s={0.9} yirtik={1} rot={-5} />
    <Merakli x={900} y={1820} s={0.7} t={0.3} hareket="sasir" kostum="kulaklik" />
  </g>
);
export const KAPAK_YAZI = { ust: "Üçte biri yırtılsa bile", buyuk: "QR KOD NEDEN BOZULMAZ?", alt: "Köşedeki 3 karenin sırrı" };
