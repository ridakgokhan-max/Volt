// Konu (Teknoloji): QR kod neden bozulmaz? — ÇİZİM tekniği, MOTION sürümü (v2).
// İlke: ekranda hareket hiç durmaz. Her sahne bir "kamera" içinde sürekli kayar/yaklaşır; arka planda
// QR pikselleri süzülür; nesnelerin bekleme (idle) hareketleri vardır; hikâye bir yolculuk gibi akar.
// ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, cl, Cross, ez, GREEN, Glow, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";
import { Disli, Telefon } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const N = 25; // modül sayısı
const M = 20; // modül boyu (px, ölçek 1)
const W = N * M;

const rnd = (i: number, j: number) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const bulucu = (i: number, j: number) => {
  const ic = (a: number, b: number) => i >= a && i < a + 7 && j >= b && j < b + 7;
  return ic(0, 0) || ic(0, N - 7) || ic(N - 7, 0);
};
const easeOut = (x: number) => 1 - Math.pow(1 - cl(x), 3);

// ---------------------------------------------------------------- yardımcı hareket katmanları

/** Kamera: sahne boyunca yavaş yaklaşma + yana kayma + hafif dönme; "vurus" anlarında kısa punch-in */
const Kamera: React.FC<{ t: number; d: number; children: React.ReactNode; z0?: number; z1?: number; x0?: number; x1?: number; y0?: number; y1?: number; r?: number; vurus?: number[]; ox?: number; oy?: number }> = ({
  t, d, children, z0 = 1, z1 = 1.12, x0 = 50, x1 = -70, y0 = 0, y1 = 0, r = 0.5, vurus = [], ox = 540, oy = 760,
}) => {
  const k = cl(t / Math.max(d, 0.1));
  let z = lerp(z0, z1, k);
  vurus.forEach((v) => {
    const u = t - v;
    if (u > 0 && u < 0.6) z *= 1 + 0.06 * Math.sin((u / 0.6) * Math.PI) * (1 - u / 0.6 * 0.3);
  });
  const dx = lerp(x0, x1, k) + Math.sin(t * 0.9) * 5;
  const dy = lerp(y0, y1, k) + Math.cos(t * 0.75) * 4;
  const rot = Math.sin(t * 0.45) * r;
  return <g transform={`translate(${ox + dx} ${oy + dy}) rotate(${rot}) scale(${z}) translate(${-ox} ${-oy})`}>{children}</g>;
};

/** Arka planda süzülen QR pikselleri (marka motifi) — sürekli hareket */
const Pikseller: React.FC<{ t: number; renk?: string; n?: number; o?: number }> = ({ t, renk = "#ffffff", n = 30, o = 0.26 }) => (
  <g opacity={o}>
    {Array.from({ length: n }).map((_, i) => {
      const hz = 40 + rnd(i, 3) * 70;
      const x = ((rnd(i, 1) * 1300 + t * hz * (rnd(i, 5) > 0.5 ? 1 : -1)) % 1300 + 1300) % 1300 - 110;
      const y = ((rnd(i, 2) * 2100 - t * (30 + rnd(i, 4) * 60)) % 2100 + 2100) % 2100 - 90;
      const s = 14 + rnd(i, 6) * 34;
      return <rect key={i} x={x} y={y} width={s} height={s} fill={renk} transform={`rotate(${t * 20 * (rnd(i, 7) - 0.5)} ${x + s / 2} ${y + s / 2})`} />;
    })}
  </g>
);

/** Japon kiraz çiçeği yaprakları: ekran boyunca sürekli süzülür */
const Yapraklar: React.FC<{ t: number; o?: number }> = ({ t, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: 16 }).map((_, i) => {
      const x = ((rnd(i, 21) * 1300 + t * (60 + rnd(i, 22) * 80)) % 1300 + 1300) % 1300 - 110;
      const y = ((rnd(i, 23) * 2000 + t * (90 + rnd(i, 24) * 90)) % 2000) - 40;
      const r = t * (90 + rnd(i, 25) * 160) * (rnd(i, 26) > 0.5 ? 1 : -1);
      return <ellipse key={i} cx={x} cy={y} rx={22} ry={12} fill="#ffc4d6" stroke="#e58aa6" strokeWidth={3} transform={`rotate(${r} ${x} ${y})`} />;
    })}
  </g>
);

/** Süzülme: nesneye sürekli hafif yüzme hareketi */
const Suz: React.FC<{ t: number; children: React.ReactNode; a?: number; f?: number; ph?: number; rot?: number }> = ({ t, children, a = 10, f = 1.1, ph = 0, rot = 2 }) => (
  <g transform={`translate(${Math.sin(t * f * 0.7 + ph) * a * 0.6} ${Math.sin(t * f + ph) * a}) rotate(${Math.sin(t * f * 0.8 + ph) * rot})`}>{children}</g>
);

/** Kinetik etiket: zıplayarak gelir, sürekli hafif sallanır, çıkarken küçülür */
const KTag: React.FC<{ t: number; a: number; b?: number; text: string; y?: number; size?: number; bg?: string; color?: string; rot?: number }> = ({ t, a, b, text, y = 330, size = 52, bg = ACC, color = INK, rot = -2 }) => {
  const g = sp(t, a, 12);
  const k = 0.75 + 0.25 * g;
  const cik = (b === undefined ? 1 : 1 - ap(t, b, 0.15)) * cl(g * 3);
  if (g < 0.01 || cik < 0.01) return null;
  return <g opacity={cik}><Tag x={540 + Math.sin(t * 1.3) * 6} y={y + Math.sin(t * 1.7) * 5} text={text} size={size} k={k} bg={bg} color={color} rot={rot + Math.sin(t * 1.1) * 1.5} /></g>;
};

// ---------------------------------------------------------------- çizim nesneleri

/** QR kod. yirtik: sağ alt köşe yırtığı (0–1); silik: rastgele silinmiş oran; dolum: silinenlerin geri gelişi (0–1);
 *  vurgu: köşe kareleri kırmızı + parlama; nabiz: köşe karelerinin atışı; insa: modüllerin tek tek belirişi (0–1) */
const QR: React.FC<{ x: number; y: number; s?: number; yirtik?: number; vurgu?: number; rot?: number; renk?: string; silik?: number; dolum?: number; nabiz?: number; insa?: number; t?: number; kaynak?: [number, number]; onarim?: number }> = ({
  x, y, s = 1, yirtik = 0, vurgu = 0, rot = 0, renk = INK, silik = 0, dolum = 0, nabiz = 0, insa = 1, t = 0, kaynak, onarim = 0,
}) => {
  const c = 2 - 0.82 * yirtik;
  const kutu: React.ReactNode[] = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (bulucu(i, j)) continue;
      const kopuk = yirtik > 0.01 && (i + j + 1) / N > c;
      if (rnd(i, j) <= 0.52) continue;
      if (kopuk) {
        const g = cl(onarim * 1.8 - ((i + j) / N - c) * 2.2);
        if (g > 0) kutu.push(<rect key={`o${i}-${j}`} x={j * M + (1 - easeOut(g)) * 260} y={i * M + (1 - easeOut(g)) * 260} width={M} height={M} fill={GREEN} opacity={g} />);
        continue;
      }
      const sira = rnd(j, i + 9);
      if (sira > insa) continue;
      const silindi = silik > 0 && rnd(j, i) < silik;
      if (silindi) {
        // silinen modül: dolum ilerledikçe dışarıdan uçarak geri gelir
        const g = cl(dolum * 1.6 - rnd(i, j + 3) * 0.6);
        if (g <= 0) continue;
        const fx = kaynak ? kaynak[0] + (rnd(i, 11) - 0.5) * 200 - j * M : (rnd(i, 11) - 0.5) * 900;
        const fy = kaynak ? kaynak[1] - i * M : (rnd(j, 13) - 0.5) * 900;
        kutu.push(<rect key={`${i}-${j}`} x={j * M + fx * (1 - easeOut(g))} y={i * M + fy * (1 - easeOut(g))} width={M} height={M} fill={GREEN} opacity={g} />);
        continue;
      }
      kutu.push(<rect key={`${i}-${j}`} x={j * M} y={i * M} width={M} height={M} fill={renk} />);
    }
  const pz = 1 + nabiz * 0.08 * Math.sin(t * 6);
  const Bul = ({ bx, by }: { bx: number; by: number }) => (
    <g transform={`translate(${bx * M + 3.5 * M} ${by * M + 3.5 * M}) scale(${pz}) translate(${-3.5 * M} ${-3.5 * M})`}>
      <rect x={0} y={0} width={7 * M} height={7 * M} fill={vurgu > 0.5 ? RED : renk} />
      <rect x={M} y={M} width={5 * M} height={5 * M} fill="#fff" />
      <rect x={2 * M} y={2 * M} width={3 * M} height={3 * M} fill={vurgu > 0.5 ? RED : renk} />
      {vurgu > 0.05 ? <rect x={-14} y={-14} width={7 * M + 28} height={7 * M + 28} fill="none" stroke={ACC} strokeWidth={10} opacity={vurgu * (0.6 + 0.4 * Math.sin(t * 8))} rx={10} /> : null}
    </g>
  );
  const P = 40;
  let kart = `M ${-P} ${-P} L ${W + P} ${-P}`;
  if (yirtik > 0.01 && onarim < 0.6) {
    const d = c * W;
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
      <path d={kart} transform="translate(14 18)" fill="rgba(0,0,0,0.25)" />
      <path d={kart} fill="#fff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {kutu}
      <Bul bx={0} by={0} />
      <Bul bx={N - 7} by={0} />
      <Bul bx={0} by={N - 7} />
    </g>
  );
};

/** Telefon + tarama ışını; ok=1 → yeşil tik */
const Okut: React.FC<{ x: number; y: number; t: number; k?: number; ok?: number; s?: number }> = ({ x, y, t, k = 1, ok = 0, s = 1.15 }) => (
  <g transform={`translate(${x} ${y}) rotate(${Math.sin(t * 1.6) * 4})`} opacity={k}>
    <Telefon x={0} y={0} s={s} t={t} ekran={ok > 0.5 ? GREEN : BLUE} />
    {ok > 0.5 ? (
      <path d="M -50 -10 L -10 30 L 60 -50" stroke="#fff" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`scale(${s * 0.9 * (1 + 0.1 * Math.sin(t * 5))})`} />
    ) : (
      <line x1={-80 * s} x2={80 * s} y1={(-100 + ((t * 160) % 200)) * s} y2={(-100 + ((t * 160) % 200)) * s} stroke={RED} strokeWidth={7} />
    )}
  </g>
);

/** Tarama ışını: nesnenin üstünden gidip gelen çizgi */
const Isin: React.FC<{ x: number; y: number; w: number; h: number; t: number; o?: number }> = ({ x, y, w, h, t, o = 1 }) => {
  const u = (Math.sin(t * 2.4) + 1) / 2;
  return (
    <g opacity={o}>
      <rect x={x - w / 2} y={y - h / 2 + u * h - 4} width={w} height={8} fill={RED} opacity={0.85} />
      <rect x={x - w / 2} y={y - h / 2 + u * h - 30} width={w} height={60} fill={RED} opacity={0.12} />
    </g>
  );
};

/** Go tahtası: taşlar sırayla düşer (konan), kayar (kay) */
const GoTahtasi: React.FC<{ x: number; y: number; s?: number; t: number; konan: number; kay?: number; hayalet?: number }> = ({ x, y, s = 1, t, konan, kay = 0, hayalet = 0 }) => {
  const n = 9, a = 64;
  const tas: [number, number, string][] = [[2, 2, INK], [3, 5, "#fff"], [5, 3, INK], [6, 6, "#fff"], [4, 4, INK], [2, 6, "#fff"], [6, 2, INK], [1, 4, "#fff"], [4, 1, INK], [7, 5, "#fff"]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${-(n - 1) * a / 2} ${-(n - 1) * a / 2})`}>
      <rect x={-50} y={-50} width={(n - 1) * a + 100} height={(n - 1) * a + 100} rx={16} fill="#e2b46b" stroke={INK} strokeWidth={8} />
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <line x1={0} x2={(n - 1) * a} y1={i * a} y2={i * a} stroke={INK} strokeWidth={3} />
          <line y1={0} y2={(n - 1) * a} x1={i * a} x2={i * a} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {tas.map(([i, j, c], k) => {
        const g = cl(konan * tas.length - k);
        if (g <= 0) return null;
        const dus = (1 - easeOut(g)) * -300;
        const kx = (Math.sin(k * 3.1 + t * 2.2) * 16) * kay;
        const ky = (Math.cos(k * 2.3 + t * 1.9) * 16) * kay;
        return (
          <g key={k}>
            {hayalet > 0.05 ? <circle cx={j * a} cy={i * a} r={30} fill="none" stroke={GREEN} strokeWidth={5} strokeDasharray="8 6" opacity={hayalet} /> : null}
            <circle cx={j * a + kx} cy={i * a + ky + dus} r={26} fill={c} stroke={INK} strokeWidth={5} opacity={g} />
            <circle cx={j * a} cy={i * a} r={26 + ((t * 1.3 + k * 0.37) % 1) * 30} fill="none" stroke={INK} strokeWidth={2} opacity={0.25 * (1 - ((t * 1.3 + k * 0.37) % 1)) * cl(g)} />
          </g>
        );
      })}
    </g>
  );
};

/** Tren penceresinden şehir: binalar iki katmanda (yakın hızlı, uzak yavaş) akar; gökdelen gelince yavaşlar */
const TrenPenceresi: React.FC<{ t: number; yavas: number; vurgu: number; gokX: number }> = ({ t, yavas, vurgu, gokX }) => {
  const hiz = lerp(1, 0.08, yavas);
  const uzak: React.ReactNode[] = [];
  const yakin: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const w = 90 + rnd(i, 1) * 80, h = 160 + rnd(i, 2) * 220;
    const x = ((i * 130 - t * 90 * hiz) % 1820 + 1820) % 1820 - 300;
    uzak.push(<rect key={i} x={x} y={1080 - h} width={w} height={h} fill="#2c3a58" stroke={INK} strokeWidth={4} />);
  }
  for (let i = 0; i < 9; i++) {
    const w = 140 + rnd(i, 4) * 80, h = 120 + rnd(i, 5) * 160;
    const x = ((i * 210 - t * 260 * hiz) % 1890 + 1890) % 1890 - 300;
    yakin.push(<rect key={i} x={x} y={1120 - h} width={w} height={h} fill="#4d5f86" stroke={INK} strokeWidth={6} />);
  }
  return (
    <g>
      <rect x={100} y={430} width={880} height={720} rx={60} fill="#1b2540" />
      <clipPath id="pencere"><rect x={120} y={450} width={840} height={680} rx={46} /></clipPath>
      <g clipPath="url(#pencere)">
        <rect x={100} y={430} width={880} height={720} fill="#22305a" />
        {Array.from({ length: 20 }).map((_, i) => <circle key={i} cx={(rnd(i, 8) * 900 + 100)} cy={470 + rnd(i, 9) * 200} r={2 + rnd(i, 10) * 3} fill="#fff8dc" opacity={0.6 + 0.4 * Math.sin(t * 2 + i)} />)}
        {uzak}
        {/* gökdelen */}
        <g transform={`translate(${gokX} 0)`}>
          <Glow cx={85} cy={760} r={260} id="gk" color="#fff1a8" o={0.7 * vurgu} />
          <rect x={20} y={560} width={130} height={560} fill={vurgu > 0.5 ? ACC : "#5d70a0"} stroke={INK} strokeWidth={7} />
          {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={45} y={600 + i * 62} width={80} height={30} fill={vurgu > 0.5 ? "#fff6c8" : "#90a4c8"} stroke={INK} strokeWidth={3} />)}
          <line x1={85} y1={560} x2={85} y2={490} stroke={INK} strokeWidth={8} />
        </g>
        {yakin}
        {/* direkler hızla geçer */}
        {Array.from({ length: 3 }).map((_, i) => {
          const x = ((i * 640 - t * 900 * hiz) % 1920 + 1920) % 1920 - 300;
          return <rect key={i} x={x} y={430} width={34} height={720} fill="#141a2c" opacity={0.85} />;
        })}
      </g>
      <rect x={100} y={430} width={880} height={720} rx={60} fill="none" stroke={INK} strokeWidth={14} />
      <line x1={540} y1={430} x2={540} y2={1150} stroke={INK} strokeWidth={14} />
    </g>
  );
};

/** Fabrika bandı: kutular soldan sağa akar, her birinde QR, tarayıcı ışını üstte */
const Bant: React.FC<{ t: number; y: number; k: number }> = ({ t, y, k }) => (
  <g opacity={k}>
    <rect x={-40} y={y} width={1160} height={60} rx={30} fill="#5b6470" stroke={INK} strokeWidth={8} />
    {Array.from({ length: 12 }).map((_, i) => {
      const x = ((i * 100 - t * 140) % 1200 + 1200) % 1200 - 60;
      return <circle key={i} cx={x} cy={y + 30} r={16} fill="#9aa3ab" stroke={INK} strokeWidth={4} />;
    })}
    {Array.from({ length: 4 }).map((_, i) => {
      const x = ((i * 320 - t * 140) % 1280 + 1280) % 1280 - 160;
      return (
        <g key={i} transform={`translate(${x} ${y - 150})`}>
          <rect x={0} y={0} width={180} height={150} rx={10} fill="#c98b4f" stroke={INK} strokeWidth={7} />
          <line x1={0} y1={40} x2={180} y2={40} stroke={INK} strokeWidth={4} opacity={0.5} />
          <QR x={90} y={95} s={0.13} />
        </g>
      );
    })}
  </g>
);

/** Otopark ödeme direği + kayarak yapışan sahte çıkartma */
const Parkmetre: React.FC<{ x: number; y: number; t: number; sahte: number }> = ({ x, y, t, sahte }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-22} y={0} width={44} height={260} fill="#7d8790" stroke={INK} strokeWidth={7} />
    <rect x={-150} y={-320} width={300} height={340} rx={30} fill="#9aa5ae" stroke={INK} strokeWidth={8} />
    <rect x={-120} y={-290} width={240} height={84} rx={10} fill="#1d2430" stroke={INK} strokeWidth={5} />
    <Txt x={0} y={-232} text="OTOPARK" size={36} color={`rgba(159,230,160,${0.6 + 0.4 * Math.sin(t * 4)})`} />
    <QR x={0} y={-80} s={0.32} />
    <g opacity={sahte} transform={`translate(${lerp(320, 0, easeOut(sahte))} ${-80 + lerp(-120, 0, easeOut(sahte))}) rotate(${lerp(40, -4, easeOut(sahte))})`}>
      <rect x={-98} y={-98} width={196} height={196} fill="#fff8d8" stroke={RED} strokeWidth={6} strokeDasharray="12 8" />
      <QR x={0} y={0} s={0.29} renk="#5a1d14" />
    </g>
  </g>
);

/** El (sahte çıkartmayı yapıştıran) */
const El: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <path d="M 0 0 C 40 -10 90 -10 130 10 L 300 40 L 300 120 L 120 110 C 70 110 20 90 0 60 Z" fill="#f2c9a0" stroke={INK} strokeWidth={7} />
    <rect x={280} y={30} width={120} height={100} rx={12} fill="#2b3245" stroke={INK} strokeWidth={6} />
  </g>
);

/** Adres önizleme balonu */
const Adres: React.FC<{ x: number; y: number; k: number; text: string; iyi: boolean; t: number }> = ({ x, y, k, text, iyi, t }) => (
  <g transform={`translate(${x + (iyi ? 0 : Math.sin(t * 34) * 16 * cl(k) * cl(1.6 - k))} ${y}) scale(${Math.min(k, 1.08)})`} opacity={cl(k * 1.4)}>
    <rect x={-330} y={-60} width={660} height={120} rx={30} fill="#fff" stroke={iyi ? GREEN : RED} strokeWidth={8} />
    <text x={-280} y={16} fontSize={42} fontWeight={900} fill={INK} style={font}>🔗</text>
    <text x={-210} y={16} fontSize={40} fontWeight={800} fill={iyi ? INK : RED} style={font}>{text}</text>
  </g>
);

// ---------------------------------------------------------------- sahneler

// 1 — Bu karenin üçte biri yırtılsa bile telefonun onu yine okur. Peki nasıl?
//     İmkânsız an GÖSTERİLİR: sağlam QR yırtılır → telefon tarar → büyük "OKUNDU ✓"
const Giris: S = ({ t, d, ws }) => {
  const tn = ws("nasıl");
  const yirt = ez(cl((t - 0.45) / 0.35));
  const tara = ap(t, 1.0, 0.3);
  const ok = t > 2.0 ? 1 : 0;
  const parcaU = cl((t - 0.45) / 1.0);
  return (
    <g>
      <Pikseller t={t} />
      <Kamera t={t} d={d} z0={1.0} z1={1.1} vurus={[0.5, 2.0, tn]}>
        <Suz t={t} a={6} rot={2}>
          <QR x={470} y={900} s={0.85} yirtik={yirt} rot={-5} t={t} nabiz={ok} />
          {/* yırtılacak çizgi: 0. karede görünür */}
          <g transform="translate(470 900) rotate(-5) scale(0.85)" opacity={1 - yirt}>
            <line x1={300} y1={-210} x2={-210} y2={300} stroke={RED} strokeWidth={16} strokeDasharray="34 20" strokeDashoffset={-t * 120} />
            <text x={250} y={-235} fontSize={70} style={font}>✂️</text>
          </g>
        </Suz>
        {/* kopan parça: yırtılma anında ayrılıp düşer */}
        {yirt > 0.05 ? (
          <g transform={`translate(${640 + easeOut(parcaU) * 700} ${1000 - easeOut(parcaU) * 650}) rotate(${10 + parcaU * 220}) scale(${1 - parcaU * 0.4})`}>
            <path d="M 0 0 L 190 -12 L 130 170 Z" fill="#fff" stroke={INK} strokeWidth={6} />
            <rect x={60} y={20} width={22} height={22} fill={INK} /><rect x={95} y={52} width={22} height={22} fill={INK} /><rect x={70} y={85} width={22} height={22} fill={INK} />
          </g>
        ) : null}
        <Isin x={470} y={900} w={500} h={470} t={t * 1.4} o={tara * (1 - ok)} />
        <g transform={`translate(${860 + Math.sin(t * 2) * 8} ${1020 - easeOut(cl((t - 0.9) / 0.5)) * 60})`}><Okut x={0} y={0} t={t} ok={ok} s={0.95} /></g>
      </Kamera>
      {/* OKUNDU damgası */}
      {ok ? (
        <g transform={`translate(540 760) scale(${sp(t, 2.0, 7)}) rotate(-6)`} opacity={1 - ap(t, tn - 0.9, 0.2)}>
          <rect x={-300} y={-80} width={600} height={160} rx={30} fill={GREEN} stroke={INK} strokeWidth={10} />
          <text x={0} y={34} textAnchor="middle" fontSize={92} fontWeight={900} fill="#fff" style={font}>OKUNDU ✓</text>
        </g>
      ) : null}
      {t > tn - 0.2 ? (
        <g transform={`translate(540 640) scale(${sp(t, tn - 0.2, 10)}) rotate(${-3 + Math.sin(t * 3) * 1.5})`}>
          <rect x={-380} y={-95} width={760} height={190} rx={40} fill={ACC} stroke={INK} strokeWidth={10} />
          <text x={0} y={42} textAnchor="middle" fontSize={124} fontWeight={900} fill={INK} style={font}>PEKİ NASIL?</text>
        </g>
      ) : null}
    </g>
  );
};

// 2 — 1994, Japonya, Masahiro Hara (Denso); araba fabrikasında parça takibi
const Tarih: S = ({ t, d, ws, ses }) => {
  const ty = ws("1994"), tm = ws("masahiro"), ta = ws("araba");
  const fab = ap(t, ta - 0.4, 0.5);
    const kartK = sp(t, tm - 0.2, 12) * (1 - ap(t, ta - 0.5, 0.3));
  return (
    <g>
      <Pikseller t={t} renk="#7a5a2e" o={0.12} />
      <Yapraklar t={t} o={1 - fab * 0.5} />
      {/* kamera: güneşten yazıya doğru belirgin dolly-in + aşağı tilt; "araba"da banda whip */}
      <Kamera t={t} d={Math.min(d, 4)} z0={1.0} z1={1.2} x0={0} x1={0} y0={60} y1={-100} vurus={[ty, tm, ta]}>
        <g transform={`translate(0 ${-fab * 400})`}>
          <g transform={`translate(540 ${lerp(760, 540, easeOut(t / 1.2))})`} opacity={1 - fab}>
            <circle r={170} fill="#fff" stroke={INK} strokeWidth={8} />
            <circle r={80 + Math.sin(t * 2) * 4} fill={RED} />
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={0} y1={-200} x2={0} y2={-240} stroke={RED} strokeWidth={8} strokeLinecap="round" transform={`rotate(${i * 30 + t * 26})`} />
            ))}
          </g>
          <g opacity={1 - fab}>
            <Txt x={540} y={830} text="JAPONYA" size={64} color={CHALK} stroke={INK} />
            <g transform={`translate(540 950) scale(${(0.6 + 0.4 * sp(t, Math.max(0, ty - 0.5), 9)) * (1 + 0.12 * Math.sin(Math.PI * cl((t - ty) / 0.5)) * (t > ty ? 1 : 0))})`}>
              <rect x={-160} y={-66} width={320} height={116} rx={22} fill={INK} />
              <Txt x={0} y={22} text="1994" size={86} color={ACC} />
            </g>
          </g>
        </g>
        {/* Hara kartı: yandan yaylanarak girer */}
        <g transform={`translate(${lerp(-400, 540, kartK)} 1080) rotate(${(1 - kartK) * -12})`} opacity={cl(kartK * 1.5)}>
          <rect x={-300} y={-80} width={600} height={160} rx={28} fill="#fff" stroke={INK} strokeWidth={8} />
          <circle cx={-210} cy={0} r={52} fill="#f2c9a0" stroke={INK} strokeWidth={6} />
          <path d="M -262 -10 Q -210 -80 -158 -10 Z" fill={INK} />
          <Txt x={60} y={-8} text="MASAHIRO HARA" size={46} color={INK} />
          <Txt x={60} y={46} text="DENSO · MÜHENDİS" size={32} color={BLUE} />
        </g>
        {/* fabrika bandı (whip ile gelir) */}
        <g transform={`translate(${(1 - easeOut(fab)) * -800} 0)`}>
          <Bant t={t} y={900} k={fab} />
          <g opacity={fab}>
            <Isin x={540} y={820} w={220} h={190} t={t} />
            <Disli x={170} y={520} s={0.9} t={t} hiz={70} />
            <Disli x={330} y={440} s={0.55} t={-t} hiz={90} renk="#9aa3ab" />
          </g>
        </g>
      </Kamera>
      <KTag t={t} a={ta - 0.1} text="PARÇA TAKİBİ İÇİN" size={52} bg={BLUE} color="#fff" rot={2} />
    </g>
  );
};

// 3 — Go oyunu (görünüm ilhamı) → koda YEDEK bilgi eklenir → silinen kısım yedekten hesaplanır
const Go: S = ({ t, d, ws }) => {
  const tk = ws("kaysa"), tb = ws("birden"), tsil = ws("silinirse"), ttam = ws("tamamlanıyor");
  const ikinci = ap(t, tb - 0.6, 0.6);
  const sil = ap(t, tsil - 0.3, 0.5);
  const dol = ap(t, tsil + 0.4, Math.max(0.6, ttam - tsil - 1.4));
  const yedek = ap(t, tb - 0.1, 0.8);
  // taş kayması: "kaysa"da 3 taş 36 px kayar, sonra yaylanarak ızgaraya oturur
  const kayU = t - (tk - 0.1);
  const kay = kayU <= 0 ? 0 : kayU < 0.45 ? ez(kayU / 0.45) : Math.max(0, Math.cos((kayU - 0.45) * 7) * Math.exp(-(kayU - 0.45) * 4));
  return (
    <g>
      <Pikseller t={t} renk="#e2b46b" o={0.14} />
      <Kamera t={t} d={d} z0={1.0} z1={1.08} vurus={[tk, tb, tsil, ttam]}>
        <g transform={`translate(${lerp(0, -900, ez(ikinci))} 0)`}>
          {/* Go tahtası alttan dönerek girer, kaymada punch-in */}
          <g transform={`translate(${540 + (1 - easeOut(t / 0.8)) * 900} 760) rotate(${(1 - easeOut(t / 0.8)) * 25 + Math.sin(t * 1.4) * 4}) scale(${1 + 0.04 * Math.sin(t * 2.2) + 0.06 * ap(t, tk + 1.6, 1.5) + 0.18 * ap(t, tk - 0.3, 0.3) * (1 - ap(t, tk + 1.4, 0.4))}) translate(-540 -760)`}>
            <GoTahtasi x={540} y={760} s={1.05} t={t} konan={ap(t, 0.25, 2.2)} kay={kay} hayalet={ap(t, tk, 0.3)} />
          </g>
          <g transform="translate(900 0)">
            <Suz t={t} a={6} ph={1}>
              <QR x={540} y={620} s={0.66} t={t} yirtik={sil} onarim={dol} nabiz={dol > 0.95 ? 1 : 0} />
            </Suz>
            {/* yedek şeridi: QR'dan küçük kareler akarak dolar */}
            <g opacity={yedek} transform="translate(540 1050)">
              <rect x={-300} y={-55} width={600} height={110} rx={24} fill="#eafbe9" stroke={GREEN} strokeWidth={8} />
              <Txt x={-185} y={14} text="YEDEK BİLGİ" size={34} color={GREEN} />
              {Array.from({ length: 10 }).map((_, i) => {
                const g = cl(yedek * 12 - i);
                const nab = 1 + 0.12 * Math.sin(t * 5 + i);
                return <rect key={i} x={-40 + i * 32 - 13} y={-13 - (1 - g) * 300} width={26 * nab} height={26 * nab} fill={GREEN} opacity={g} />;
              })}
            </g>
            {/* kopan köşe uçup gider */}
            {sil > 0.02 && sil < 1 ? (
              <g transform={`translate(${640 + easeOut(sil) * 500} ${700 + easeOut(sil) * 300}) rotate(${sil * 200})`} opacity={1 - sil}>
                <path d="M 0 0 L 150 -10 L 100 130 Z" fill="#fff" stroke={INK} strokeWidth={6} />
              </g>
            ) : null}
            {dol > 0.95 ? <g transform={`translate(${lerp(1150, 900, easeOut(cl((t - (tsil + 0.4 + Math.max(0.6, ttam - tsil - 1.4))) / 0.4)))} 900)`}><Okut x={0} y={0} t={t} ok={1} s={0.75} /></g> : null}
            {dol > 0.95 ? (
              <g transform={`translate(540 640) scale(${sp(t, tsil + 0.4 + Math.max(0.6, ttam - tsil - 1.4), 8)}) rotate(-6)`}>
                <rect x={-220} y={-60} width={440} height={120} rx={26} fill={GREEN} stroke={INK} strokeWidth={8} />
                <text x={0} y={26} textAnchor="middle" fontSize={68} fontWeight={900} fill="#fff" style={font}>OKUNDU ✓</text>
              </g>
            ) : null}
            {dol > 0.95 ? <circle cx={540} cy={620} r={200 + (t - ttam) * 140} fill="none" stroke={GREEN} strokeWidth={10} opacity={cl(1 - (t - ttam) * 0.8)} /> : null}
          </g>
        </g>
      </Kamera>
      <KTag t={t} a={0.2} b={tk - 0.4} text="GO OYUNU" size={58} />
      <KTag t={t} a={tk - 0.1} b={tb - 0.5} text="BOZULSA DA ANLAŞILIR" size={46} bg={GREEN} color="#fff" rot={2} />
      <KTag t={t} a={tb - 0.1} b={tsil - 0.4} text="KODA YEDEK BİLGİ EKLENİR" size={44} bg={BLUE} color="#fff" />
      <KTag t={t} a={tsil - 0.1} b={tsil + 0.55} text="YIRTILSA BİLE..." size={54} bg={RED} color="#fff" rot={2} />
      <KTag t={t} a={tsil + 0.6} b={d - 0.35} text="EKSİK HESAPLANIR" size={50} bg={GREEN} color="#fff" />
    </g>
  );
};

// 4 — Köşedeki üç büyük kare: "kod burada" — kamera köşeleri sırayla, duraklayarak gezer
const Kare: S = ({ t, d, ws }) => {
  const tu = ws("üç"), tb = ws("burada");
  const QX = 540, QY = 700, QS = 0.85;
  const kose = (bx: number, by: number): [number, number] => [QX + (bx - W / 2) * QS, QY + (by - W / 2) * QS];
  const hedef: [number, number][] = [[QX, QY], kose(3.5 * M, 3.5 * M), kose((N - 3.5) * M, 3.5 * M), kose(3.5 * M, (N - 3.5) * M), [QX, QY]];
  // her geçiş 0.45 sn (whip), her köşede 0.35 sn bekleme
  const bas = tu - 0.2;
  const adimS = 0.8;
  const u = Math.max(0, t - bas);
  const i0 = Math.min(hedef.length - 2, Math.floor(u / adimS));
  const yerel = cl((u - i0 * adimS) / 0.45);
  const g = ez(yerel);
  const [hx, hy] = [lerp(hedef[i0][0], hedef[i0 + 1][0], g), lerp(hedef[i0][1], hedef[i0 + 1][1], g)];
  const icerde = u > 0 && i0 < hedef.length - 2 ? 1 : i0 === hedef.length - 2 ? 1 - g : 0;
  const zz = (1 + 0.5 * icerde) * (1 + 0.08 * (1 - ap(t, 0, 0.5)) + 0.06 * ap(t, 0, 0.4) * (1 - ap(t, bas, 0.3))) * (1 + 0.03 * Math.sin(t * 4));
  const aktif = Math.min(3, i0 + (yerel >= 1 ? 1 : 0));
  return (
    <g>
      <Pikseller t={t} />
      <defs>
        <filter id="hizbulanik"><feGaussianBlur stdDeviation="6 2" /></filter>
        <clipPath id="karebant"><rect x={0} y={400} width={1080} height={820} /></clipPath>
      </defs>
      <g clipPath="url(#karebant)">
      <g transform={`translate(${lerp(540, 540 + (540 - hx) * 0.0, 1)} ${QY}) scale(${zz}) translate(${-hx} ${-hy})`} filter={yerel > 0.05 && yerel < 0.9 && u > 0 ? "url(#hizbulanik)" : undefined}>
        <Suz t={t} a={4}><QR x={QX} y={QY} s={QS} t={t} vurgu={ap(t, tu - 0.1, 0.3)} nabiz={1} /></Suz>
        {[kose(3.5 * M, 3.5 * M), kose((N - 3.5) * M, 3.5 * M), kose(3.5 * M, (N - 3.5) * M)].map(([cx, cy], k) => (
          <circle key={k} cx={cx} cy={cy} r={110 + 10 * Math.sin(t * 6)} fill="none" stroke={GREEN} strokeWidth={10} opacity={aktif === k + 1 ? 0.9 : 0} />
        ))}
      </g>
      </g>
      <KTag t={t} a={0.1} b={tb - 0.4} text="KÖŞEDEKİ 3 KARE" size={54} />
      <KTag t={t} a={tb - 0.2} text={'"KOD BURADA!"'} size={62} bg={RED} color="#fff" rot={2} />
    </g>
  );
};

// 5 — Fikir trende: şehir akar, gökdelen sıyrılır → köşe karesi olur → ters/eğik QR anında tanınır
const Gokdelen: S = ({ t, d, ws }) => {
  const tg = ws("gökdelene"), tsy = ws("sıyrılan"), tu = ws("üç"), tt = ws("ters"), te = ws("eğik"), ta = ws("anda");
  const yavas = ap(t, tg - 1.2, 1.2);
  const gokX = lerp(1100, 455, easeOut(cl((t - (tsy - 0.3)) / 1.4)));
  const donus = ap(t, tu - 0.9, 1.0);
  // QR açısı: "ters"te 180°'ye, "eğik"te 205°'ye yaylanarak oturur
  const yay = (u: number) => (u <= 0 ? 0 : 1 - Math.cos(u * 9) * Math.exp(-u * 5));
  const aci = 180 * yay(t - (tt - 0.1)) + 25 * yay(t - (te - 0.1));
  const flas = (Math.max(0, 1 - Math.abs(t - tt - 0.35) * 4) + Math.max(0, 1 - Math.abs(t - te - 0.35) * 4));
  const okundu = t > ta - 0.1 ? 1 : 0;
  return (
    <g>
      <Pikseller t={t} n={18} />
      <Kamera t={t} d={tg + 0.6} z0={1.0} z1={1.35} x0={60} x1={-50} oy={1000} vurus={[tg, ta]}>
        <g opacity={1 - donus} transform={`translate(540 830) scale(${1 - donus * 0.4}) translate(-540 -790)`}>
          <g transform={`translate(${Math.sin(t * 17) * 2 * (1 - yavas)} ${Math.sin(t * 22) * 4 * (1 - yavas)})`}>
            <TrenPenceresi t={t} yavas={yavas} vurgu={ap(t, tg - 0.1, 0.3)} gokX={gokX} />
          </g>
        </g>
        {/* match-cut: parlayan gökdelen küçülüp sol üst köşe karesine oturur */}
        {donus > 0.01 && donus < 0.99 ? (
          <rect x={lerp(gokX + 20, 400 - 55, ez(cl(donus / 0.7)))} y={lerp(600, 560 - 55, ez(cl(donus / 0.7)))} width={lerp(130, 110, ez(cl(donus / 0.7)))} height={lerp(560, 110, ez(cl(donus / 0.7)))} fill={RED} stroke={INK} strokeWidth={7} opacity={1 - cl((donus - 0.75) / 0.1)} />
        ) : null}
        <g opacity={cl((donus - 0.7) / 0.15)} transform={`translate(400 560) scale(${lerp(0.25, 1, ez(cl((donus - 0.7) / 0.3)))}) translate(-400 -560)`}>
          <g transform={`translate(540 700) rotate(${aci}) translate(-540 -700)`}>
            <QR x={540} y={700} s={0.78} t={t} vurgu={1} nabiz={1} />
          </g>
          <circle cx={540} cy={700} r={300} fill="none" stroke={GREEN} strokeWidth={14} opacity={cl(flas)} />
          <g transform={`translate(880 990) scale(${1 + 0.12 * (okundu ? Math.sin(Math.PI * cl((t - ta) / 0.4)) : 0)})`}><Okut x={0} y={0} t={t} ok={okundu} s={0.72} /></g>
        </g>
      </Kamera>
      <KTag t={t} a={0.2} b={tg - 0.4} text="TRENDE GİDERKEN..." size={50} bg={BLUE} color="#fff" />
      <KTag t={t} a={tg - 0.1} b={tu - 0.6} text="GÖKDELEN FİKRİ" size={56} />
      <KTag t={t} a={tu - 0.3} b={tt - 0.3} text="YIRTIK, TERS, EĞİK..." size={50} bg={BLUE} color="#fff" rot={2} />
      <KTag t={t} a={tt - 0.1} text="ANINDA BULUR" size={56} bg={GREEN} color="#fff" rot={-2} />
    </g>
  );
};

// 6 — Karanlık taraf: kod sahibini bilmez → el sahte çıkartmayı yapıştırır → telefona girip sahte ödeme sayfası
const Karanlik: S = ({ t, d, ws, ses }) => {
  const td = ws("dolandırıcılar"), ts = ws("sahte"), to = ws("ödeme"), tok = ws("okutan"), tk = ws("karanlık");
  const yapis = ap(t, ts - 0.6, 0.7);
  const titre = t > ts - 0.05 && t < ts + 0.45 ? 1 : 0;
  const gir = ap(t, tok + 0.15, 0.8); // okutunca telefona dalış
  const telX = lerp(980, 700, easeOut(cl((t - ts - 0.5) / 1.0)));
  return (
    <g>
      <Pikseller t={t} renk={RED} o={0.1} />
      <g transform={`translate(${titre * Math.sin(t * 60) * 10} 0)`}>
        <Kamera t={t} d={Math.min(d, 3.2)} z0={1.0} z1={1.25} y0={0} y1={-60} x0={80} x1={-20} vurus={[tk, td, ts, tok]}>
          <g transform={`translate(${telX} 720) scale(${1 + ez(gir) * 5}) translate(${-telX} -720)`}>
            <Glow cx={380} cy={420} r={320} id="sl" color="#fff3b0" o={(0.35 + 0.08 * Math.sin(t * 7)) * (t < 3 && (Math.sin(t * 9) > 0.75 || Math.sin(t * 23) > 0.9) ? 0.15 : 1)} />
            <Parkmetre x={380} y={780} t={t} sahte={yapis} />
            <El x={lerp(820, 470, easeOut(cl((t - (td + 0.3)) / 1.2)))} y={620} o={ap(t, td, 0.3) * (1 - ap(t, ts + 0.4, 0.4))} />
            <circle cx={380} cy={700} r={130 + ((t * 1.5) % 1) * 90} fill="none" stroke={RED} strokeWidth={8} opacity={ap(t, ts + 0.3, 0.3) * (1 - ((t * 1.5) % 1))} />
            <g opacity={ap(t, ts + 0.5, 0.3)} transform={`translate(${telX} ${720 + Math.sin(t * 2) * 12})`}>
              <Okut x={0} y={0} t={t} ok={0} s={1.2} />
            </g>
          </g>
        </Kamera>
      </g>
      {/* telefonun içine girince: sahte ödeme sayfası tam ekran */}
      {/* "karanlık" kelimesinde ekran kararır */}
      <rect x={0} y={0} width={1080} height={1920} fill="#000" opacity={0.75 * Math.min(1, Math.max(0, 1.4 - Math.abs(t - tk - 0.3) * 2.5))} />
      {gir > 0.55 ? (
        <g opacity={ap(t, tok + 0.6, 0.2)} transform={`translate(540 740) scale(${(0.5 + 0.5 * sp(t, tok + 0.6, 10)) * (1 + 0.14 * ap(t, tok + 0.9, 1.6))}) translate(${-540 + Math.sin(t * 40) * 5 * Math.max(0, 1 - Math.abs(t - tok - 1.1) * 6)} -700)`}>
          <rect x={0} y={0} width={1080} height={1920} fill="#14101a" opacity={0.9} />
          <rect x={130} y={330} width={820} height={820} rx={50} fill="#fff" stroke={RED} strokeWidth={12} />
          <rect x={130} y={330} width={820} height={130} rx={50} fill={RED} />
          <Txt x={540} y={418} text="ÖDEME" size={64} color="#fff" />
          <Txt x={540} y={570} text="Kart numarası" size={40} color={INK} />
          <rect x={220} y={610} width={640} height={90} rx={18} fill="#f3f3f3" stroke={INK} strokeWidth={5} />
          <text x={250} y={672} fontSize={46} fontWeight={900} fill={INK} style={font}>{"•••• ".repeat(Math.min(4, Math.max(0, Math.floor((t - tok - 0.8) * 3))))}</text>
          <rect x={250 + Math.min(4, Math.max(0, Math.floor((t - tok - 0.8) * 3))) * 120} y={628} width={6} height={54} fill={INK} opacity={Math.sin(t * 12) > 0 ? 1 : 0} />
          <Txt x={540} y={790} text="odeme-otopark.xyz" size={42} color={RED} />
          <g transform={`translate(540 960) scale(${sp(t, tok + 1.0, 8) * (1 + 0.05 * Math.sin(t * 8))}) rotate(-4)`}>
            <rect x={-280} y={-62} width={560} height={116} rx={24} fill={RED} stroke={INK} strokeWidth={7} />
            <Txt x={0} y={18} text="⚠ SAHTE SAYFA" size={46} color="#fff" />
          </g>
        </g>
      ) : null}
      {titre ? <rect x={0} y={0} width={1080} height={1920} fill={RED} opacity={0.12} /> : null}
      <KTag t={t} a={0.2} b={td - 0.4} text="KARANLIK TARAF" size={56} bg={RED} color="#fff" />
      <KTag t={t} a={td - 0.1} b={ts - 0.3} text="KOD, SAHİBİNİ BİLMEZ" size={50} bg={INK} color="#fff" rot={2} />
      <KTag t={t} a={ts - 0.1} b={tok} text="SAHTE ÇIKARTMA!" size={56} bg={RED} color="#fff" rot={-2} />
    </g>
  );
};

// 7 — Açmadan önce adrese bak; tanımadığın adres çıkarsa açma
const Cozum: S = ({ t, d, ws }) => {
  const tb = ws("adrese"), ta = ws("açma", 1);
  return (
    <g opacity={1 - ap(t, d - 0.35, 0.3)}>
      <Pikseller t={t} renk="#2f7a4f" o={0.12} />
      <Kamera t={t} d={d} z0={1.0} z1={1.12} vurus={[tb, ta]}>
        <g opacity={1 - ap(t, tb - 0.3, 0.35)} transform={`translate(540 ${700 + (1 - easeOut(t / 0.9)) * 900}) scale(${(1 + 0.3 * easeOut(cl(t / Math.max(tb, 0.5)))) * (1 + 0.5 * ez(ap(t, tb - 0.3, 0.35)))}) rotate(${Math.sin(t * 1.4) * 3 + (1 - easeOut(t / 0.9)) * 30})`}>
          <Telefon x={0} y={0} s={2.5} t={t} ekran="#1d2430" />
          <g opacity={1 - ap(t, tb - 0.4, 0.3)}>
            <QR x={0} y={-40} s={0.34} t={t} />
            <Isin x={0} y={-40} w={200} h={190} t={t * 3} o={ap(t, 0.3, 0.3)} />
          </g>
        </g>
        <Adres x={540} y={560} k={sp(t, tb - 0.1)} text="belediye.gov.tr ✓" iyi t={t} />
        <Adres x={540} y={770} k={sp(t, tb + 0.6)} text="odeme-otopark.xyz ✗" iyi={false} t={t} />
        <line x1={330} x2={lerp(330, 690, ap(t, ta - 0.25, 0.25))} y1={770} y2={770} stroke={RED} strokeWidth={8} opacity={0.75} />
        <g transform={`translate(930 690) scale(${sp(t, ta - 0.2, 9)})`}><circle r={58} fill={RED} stroke={INK} strokeWidth={6} /><Cross cx={0} cy={0} r={34} k={1} sw={12} /></g>
        <g transform={`translate(930 480) scale(${sp(t, tb + 0.1, 9) * (1 + 0.08 * Math.sin(t * 6))})`}><circle r={52} fill={GREEN} stroke={INK} strokeWidth={6} /><path d="M -22 0 L -6 18 L 24 -18" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" /></g>
      </Kamera>
      <KTag t={t} a={tb - 0.2} text="ÖNCE ADRESE BAK" size={58} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, tarih: Tarih, go: Go, kare: Kare, gokdelen: Gokdelen, karanlik: Karanlik, cozum: Cozum };

export const KAPAK: React.FC = () => (
  <g>
    <QR x={540} y={1330} s={0.9} yirtik={1} rot={-5} />
    <g transform="translate(860 1500) rotate(-8)"><Okut x={0} y={0} t={0} ok={1} s={1.3} /></g>
    <Merakli x={180} y={1840} s={0.75} t={0.3} hareket="sasir" kostum="kulaklik" />
  </g>
);
export const KAPAK_YAZI = { ust: "Yırtık ama okunuyor", buyuk: "QR KOD NEDEN BOZULMAZ?", alt: "" };
