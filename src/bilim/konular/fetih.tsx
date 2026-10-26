// Konu 15/30 (Tarih): İstanbul'un Fethi — "Topun Bedeli". FİLM gibi: tek çizilmiş dünya (fetih_dunya.tsx),
// her sahne yalnızca kamera açısını, günün saatini ve olayları değiştirir. Gerçek görsel yok; her şey çizim.
// Yönetmen notları:
//  • Açılış karanlık ve sessiz; fitil yanar (Hitchcock'un bombası) → "gürleme"de namlu ateşi, gülle AĞIR ÇEKİMDE
//    surlara uçar ve tam "çarpıyor" sözünde çarpar.
//  • Geri dönüş (1452) sepya + film greni; Urban surların dibinden ordugâha yürür (aynı set, coğrafya hikâyeyi anlatır).
//  • Şafak surların arkasından doğar: siluetler ters ışıkta, fetih sabahı güneş sancağın arkasında.
//  • Son kare açılış karesine döner (döngü).
// ws("kelime") = sahne içindeki saniye.
import React from "react";
import { useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Cinzel";
import type { SceneProps } from "../BilimVideo";
import { ap, cl, lerp, sp } from "../kit";
import {
  ALTIN, Atis, Ates, fitilDunya, Ayasofya, Bayrak, DunyaSahne, easeIO, easeOut, HEDEF, KAN, Kam, kamYol, KOR, Kos, MOR, NAMLU, renk, rnd, sars, Sultan, TOP, Top, Urban,
  type Dunya,
} from "../fetih_dunya";

const { fontFamily: CINZEL } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });
type S = React.FC<SceneProps>;
/** kamera eğrisi: hep ilerler (yavaşlayıp durmaz) */
const ak = (u: number) => 0.35 * easeOut(u) + 0.65 * cl(u);
const BUYUK = (x: string) => x.toLocaleUpperCase("tr-TR");

/** sahne başından en az `min` sn sonraki ilk geçiş (önceki cümlenin taşan kelimesine takılmasın) */
const sonra = (ws: SceneProps["ws"], txt: string, min = 0.25) => {
  for (let n = 0; n < 6; n++) {
    const v = ws(txt, n);
    if (v > min) return v;
  }
  return ws(txt);
};

// paralaks katmanındaki (p) bir noktayı ekran merkezine getiren kamera konumu
const pk = (X: number, Y: number, p: number) => ({ x: (X - 1000 * (1 - p)) / p, y: (Y - 1200 * (1 - p) * 0.5) / (1 - (1 - p) * 0.5) });

// ---------------------------------------------------------------- ekran katmanları (sinema)
/** Kenar karartma — her sahnede; göz merkeze */
const Vinyet: React.FC<{ g?: number }> = ({ g = 0.75 }) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id="vny" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity={g} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1080} height={1920} fill="url(#vny)" />
  </g>
);

/** Film greni — geri dönüşte ve gece sahnelerinde */
const Gren: React.FC<{ o?: number }> = ({ o = 0.25 }) => {
  const f = useCurrentFrame();
  return (
    <g opacity={o} pointerEvents="none">
      {Array.from({ length: 220 }).map((_, i) => (
        <rect key={i} x={rnd(i, f) * 1080} y={rnd(f, i + 7) * 1920} width={2 + rnd(i, f + 3) * 3} height={2 + rnd(i + 5, f) * 3} fill={i % 2 ? "#fff" : "#000"} opacity={0.5} />
      ))}
      {f % 7 === 0 && <rect x={rnd(f, 2) * 1080} y={0} width={2} height={1920} fill="#fff" opacity={0.25} />}
    </g>
  );
};

/** Yazı bandı: koyu, %78 opak, kenarları yumuşak (kartların her zeminde ≥4,5:1 okunması için) */
const Bant: React.FC<{ y0: number; y1: number; x0?: number; x1?: number; yatay?: "sag" | "sol" }> = ({ y0, y1, x0 = 0, x1 = 1080, yatay }) => {
  const id = `bant${Math.round(y0)}${Math.round(y1)}${yatay || ""}`;
  const h = y1 - y0;
  return (
    <g>
      <defs>
        {yatay ? (
          <linearGradient id={id} x1={yatay === "sol" ? "0" : "1"} y1="0" x2={yatay === "sol" ? "1" : "0"} y2="0">
            <stop offset="0" stopColor="#0b0a14" stopOpacity="0.8" />
            <stop offset="0.75" stopColor="#0b0a14" stopOpacity="0.78" />
            <stop offset="1" stopColor="#0b0a14" stopOpacity="0" />
          </linearGradient>
        ) : (
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b0a14" stopOpacity="0" />
            <stop offset={40 / h} stopColor="#0b0a14" stopOpacity="0.78" />
            <stop offset={1 - 40 / h} stopColor="#0b0a14" stopOpacity="0.78" />
            <stop offset="1" stopColor="#0b0a14" stopOpacity="0" />
          </linearGradient>
        )}
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={h} fill={`url(#${id})`} />
    </g>
  );
};

/** Bölüm kartı: "NİSAN 1453" — harfler aralığı açılarak gelir, sönerek gider */
const Bolum: React.FC<{ t: number; a: number; ust: string; alt?: string; sure?: number; y?: number }> = ({ t, a, ust, alt, sure = 2.6, y = 520 }) => {
  const g = ap(t, a, 0.6) * (1 - ap(t, a + sure, 0.5));
  if (g < 0.01) return null;
  const ls = lerp(18, 10, easeOut((t - a) / 1.6));
  const fs = Math.min(92, (720 / ust.length - ls) / 0.78); // kenar rozetlerine taşmasın
  return (
    <g opacity={g}>
      <Bant y0={y - fs * 0.8 - 64} y1={y + (alt ? 92 : 30) + 64} />
      <line x1={540 - 170 * g} x2={540 + 170 * g} y1={y + 34} y2={y + 34} stroke={ALTIN} strokeWidth={3} />
      <text x={540} y={y} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={fs} letterSpacing={ls} fill="#f6ead0" stroke="#120d08" strokeWidth={6} paintOrder="stroke fill">{ust}</text>
      {alt && <text x={540} y={y + 92} textAnchor="middle" fontFamily={CINZEL} fontWeight={700} fontSize={44} letterSpacing={6} fill={ALTIN} stroke="#120d08" strokeWidth={6} paintOrder="stroke fill">{BUYUK(alt)}</text>}
    </g>
  );
};

/** İsim kartı (lower third): altın çizgi + ad + rol. Altyazı bandının (y≥1300) ÜSTÜNDE kalır. */
const IsimKarti: React.FC<{ t: number; a: number; ad: string; rol: string; sure?: number; sag?: boolean }> = ({ t, a, ad, rol, sure = 3.2, sag }) => {
  const g = ap(t, a, 0.35) * (1 - ap(t, a + sure, 0.4));
  if (g < 0.01) return null;
  const x = sag ? 950 : 70;
  const anc = sag ? "end" : "start";
  const cizgi = lerp(0, 380, easeOut((t - a) / 0.5));
  return (
    <g opacity={g} transform={`translate(${(1 - easeOut((t - a) / 0.45)) * (sag ? 40 : -40)} 0)`}>
      <Bant y0={1036} y1={1196} x0={sag ? 300 : 0} x1={sag ? 1080 : 780} yatay={sag ? "sag" : "sol"} />
      <rect x={sag ? x - cizgi : x} y={1122} width={cizgi} height={4} fill={ALTIN} />
      <text x={x} y={1106} textAnchor={anc} fontFamily={CINZEL} fontWeight={900} fontSize={58} letterSpacing={4} fill="#fbf2dc" stroke="#0e0a07" strokeWidth={6} paintOrder="stroke fill">{ad}</text>
      <text x={x} y={1168} textAnchor={anc} fontFamily={CINZEL} fontWeight={700} fontSize={36} letterSpacing={2} fill={ALTIN} stroke="#0e0a07" strokeWidth={7} paintOrder="stroke fill">{BUYUK(rol)}</text>
    </g>
  );
};

/** Beyaz/sıcak parlama (atış, çarpma, sabah ışığı) */
const Parlama: React.FC<{ t: number; a: number; d?: number; renk?: string; g?: number }> = ({ t, a, d = 0.5, renk: r = "#fff4d6", g = 1 }) => {
  const u = t - a;
  if (u < 0 || u > d) return null;
  return <rect x={0} y={0} width={1080} height={1920} fill={r} opacity={g * Math.pow(1 - u / d, 2)} />;
};

/** Sinematik ışık huzmeleri — şafakta surların üstünden aşağı/yana yayılır */
const Huzme: React.FC<{ t: number; o: number; x?: number; y?: number }> = ({ t, o, x = 560, y = 760 }) => {
  if (o < 0.01) return null;
  return (
    <g opacity={o} style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = ((25 + i * 22 + Math.sin(t * 0.3 + i) * 2) * Math.PI) / 180;
        const w = 0.05 + rnd(i, 3) * 0.05;
        const L = 2400;
        return <path key={i} d={`M ${x} ${y} L ${x + Math.cos(a - w) * L} ${y + Math.sin(a - w) * L} L ${x + Math.cos(a + w) * L} ${y + Math.sin(a + w) * L} Z`} fill="#ffd9a0" opacity={0.07 + 0.03 * Math.sin(t + i)} />;
      })}
    </g>
  );
};

/** Ekranda süzülen kor/kül parçacıkları (her zaman hareket) */
const Kul: React.FC<{ t: number; renk?: string; o?: number; n?: number; yukari?: boolean }> = ({ t, renk: r = KOR, o = 0.8, n = 26, yukari = true }) => (
  <g opacity={o}>
    {Array.from({ length: n }).map((_, i) => {
      const hiz = 40 + rnd(i, 1) * 80;
      const y = yukari ? ((1920 + 100 - ((t * hiz + rnd(i, 2) * 2000) % 2100)) % 2100) - 50 : ((t * hiz + rnd(i, 2) * 2000) % 2100) - 50;
      const x = rnd(i, 3) * 1080 + Math.sin(t * (0.6 + rnd(i, 4)) + i) * 40;
      return <circle key={i} cx={x} cy={y} r={1.5 + rnd(i, 5) * 3.5} fill={r} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))} />;
    })}
  </g>
);

/** Ekranda yavaşça kayan sis/duman perdeleri — ekran asla durmasın */
const Sis: React.FC<{ t: number; renk?: string; o?: number; y?: number; hiz?: number }> = ({ t, renk: r = "#cfc6b8", o = 0.18, y = 900, hiz = 45 }) => (
  <g opacity={o} pointerEvents="none">
    <defs>
      <radialGradient id={`sis${r.slice(1)}`}>
        <stop offset="0" stopColor={r} stopOpacity="0.9" />
        <stop offset="1" stopColor={r} stopOpacity="0" />
      </radialGradient>
    </defs>
    {Array.from({ length: 6 }).map((_, i) => {
      const x = ((rnd(i, 1) * 1800 + t * hiz * (0.7 + rnd(i, 2) * 0.6)) % 1800) - 360;
      return <ellipse key={i} cx={x} cy={y + (rnd(i, 3) - 0.5) * 700 + Math.sin(t * 0.5 + i) * 30} rx={300 + rnd(i, 4) * 200} ry={90 + rnd(i, 5) * 70} fill={`url(#sis${r.slice(1)})`} />;
    })}
  </g>
);

/** Ön plan bokeh: kameraya yakın, bulanık süzülen kor/toz tanecikleri (derinlik + kesintisiz hareket) */
const OnPlan: React.FC<{ t: number; renk?: string; o?: number; n?: number; yon?: number }> = ({ t, renk: r = "#ffb36b", o = 0.4, n = 14, yon = 1 }) => (
  <g opacity={o} pointerEvents="none">
    <defs>
      <radialGradient id={`bok${r.slice(1)}`}>
        <stop offset="0" stopColor={r} stopOpacity="0.85" />
        <stop offset="0.6" stopColor={r} stopOpacity="0.3" />
        <stop offset="1" stopColor={r} stopOpacity="0" />
      </radialGradient>
    </defs>
    {Array.from({ length: n }).map((_, i) => {
      const hiz = 90 + rnd(i, 1) * 160;
      const x = ((rnd(i, 2) * 1400 + yon * t * hiz) % 1400 + 1400) % 1400 - 160;
      const y = ((rnd(i, 3) * 2200 - t * hiz * 0.55) % 2200 + 2200) % 2200 - 140;
      const rr = 22 + rnd(i, 4) * 46;
      return <circle key={i} cx={x} cy={y + Math.sin(t * 1.3 + i) * 20} r={rr} fill={`url(#bok${r.slice(1)})`} opacity={0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)} />;
    })}
  </g>
);

/** Ön planda kadraj kenarında dalgalanan büyük sancak/perde (yakın plan derinliği, sürekli hareket) */
const OnBayrak: React.FC<{ t: number; renk: string; sag?: boolean; y?: number; boy?: number; o?: number }> = ({ t, renk: r, sag, y = 380, boy = 520, o = 0.92 }) => {
  const n = 12, w = 300;
  const ust = Array.from({ length: n + 1 }).map((_, i) => [(i / n) * w + Math.sin(t * 2.2 - i * 0.5) * 18 * (i / n), Math.sin(t * 4.2 - i * 0.7) * 40 * (i / n)]);
  const alt = Array.from({ length: n + 1 }).map((_, i) => [((n - i) / n) * w + Math.sin(t * 2.2 - (n - i) * 0.5) * 24 * ((n - i) / n), boy + Math.sin(t * 4.2 - (n - i) * 0.7 + 0.6) * 50 * ((n - i) / n)]);
  const pts = [...ust, ...alt].map(([x, yy]) => `${x},${yy}`).join(" ");
  return (
    <g opacity={o} transform={sag ? `translate(1080 ${y}) scale(-1 1) translate(-60 0)` : `translate(-60 ${y})`}>
      <rect x={-8} y={-60} width={16} height={boy + 200} fill="#140c08" />
      <polygon points={pts} fill={r} />
      <polygon points={pts} fill="#000" opacity={0.25} transform="translate(0 0)" style={{ mixBlendMode: "multiply" }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M ${40 + i * 55} 0 Q ${50 + i * 55 + Math.sin(t * 3.4 - i) * 14} ${boy / 2} ${40 + i * 55} ${boy}`} stroke="#000" strokeWidth={10} opacity={0.12} fill="none" />
      ))}
    </g>
  );
};

/** Ön planda büyük mum alevleri (ayin) */
const OnMum: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {[[90, 1700, 1.6], [990, 1660, 1.3], [200, 1820, 1.1]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
        <circle r={140} cy={-80} fill="#ffb54a" opacity={0.12 + 0.05 * Math.sin(t * 9 + i)} />
        <rect x={-18} y={-40} width={36} height={200} fill="#efe4c8" />
        <path d={`M 0 -40 Q ${-22 + Math.sin(t * 11 + i) * 6} -80 ${Math.sin(t * 7 + i) * 8} ${-130 - Math.sin(t * 13 + i) * 14} Q ${22 + Math.sin(t * 9 + i) * 6} -80 0 -40 Z`} fill="#ffc861" />
        <path d={`M 0 -44 Q -9 -70 ${Math.sin(t * 7 + i) * 4} -96 Q 9 -70 0 -44 Z`} fill="#fff4d0" />
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------- ortak yardımcılar
/** Otağ: Sultan'ın kırmızı-altın çadırı */
const Otag: React.FC<{ h: number; t: number }> = ({ h, t }) => {
  const k = renk(h, [[0, "#3a1012"], [1, "#9a2a22"], [2, "#b5332a"]]);
  return (
    <g transform="translate(1150 1720)">
      <path d="M -180 0 L -150 -70 L 0 -190 L 150 -70 L 180 0 Z" fill={k} />
      <path d="M -150 -70 L 150 -70 L 140 -56 L -140 -56 Z" fill={ALTIN} opacity={0.85} />
      <path d="M 0 -190 L 150 -70 L 180 0 L 60 0 Z" fill="#000" opacity={0.2} />
      <path d="M -30 0 L 0 -60 L 30 0 Z" fill="#1a0806" />
      <rect x={-3} y={-250} width={6} height={62} fill="#2a1f18" />
      <circle cx={0} cy={-254} r={10} fill={ALTIN} />
      <Bayrak x={0} y={-188} renk={KAN} k={1} t={t} buyuk />
    </g>
  );
};

/** Bizanslı savunucular — surların üstünde mızraklar */
const Savunucular: React.FC<{ k: number; t: number; h: number; kaldir?: number }> = ({ k, t, h, kaldir = 0 }) => {
  if (k < 0.01) return null;
  const c = renk(h, [[0, "#0c0a14"], [1, "#24161c"], [2, "#3b2a26"]]);
  return (
    <g opacity={k}>
      {Array.from({ length: 16 }).map((_, i) => {
        const x = 640 + i * 26 + rnd(i, 1) * 6;
        const kal = cl(kaldir * 3 - rnd(i, 2) * 1.6);
        return (
          <g key={i} transform={`translate(${x} ${1030 + Math.sin(t * 2 + i) * 0.6}) scale(0.32)`}>
            <circle cx={0} cy={-44} r={10} fill={c} />
            <path d="M -9 -34 L -10 0 L 10 0 L 9 -34 Z" fill={c} />
            <line x1={10} y1={-20} x2={14} y2={-110 - kal * 30} stroke={c} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
};

/** Elçi atlısı — beyaz bayrak/ferman ile ordugâhtan kapıya */
const Elci: React.FC<{ k: number; t: number; h: number }> = ({ k, t, h }) => {
  if (k < 0) return null;
  const x = lerp(1200, 900, easeIO(k));
  const y = lerp(1500, 1235, easeIO(k));
  const s = lerp(0.6, 0.36, k);
  const c = renk(h, [[0, "#0c0a14"], [1, "#2a1c18"], [2, "#3b2a20"]]);
  const zip = Math.sin(t * 14) * 3;
  return (
    <g transform={`translate(${x} ${y + zip}) scale(${-s} ${s})`}>
      <path d="M -70 -60 Q -40 -80 30 -74 L 60 -96 L 84 -70 L 52 -60 Q 50 -40 36 -32 L -50 -30 Q -74 -36 -70 -60 Z" fill={c} />
      {[-58, -40, 18, 36].map((lx, i) => <rect key={i} x={lx} y={-34} width={7} height={34} fill={c} transform={`rotate(${Math.sin(t * 14 + i) * 18} ${lx} -34)`} />)}
      <path d="M -14 -74 L -18 -126 L 8 -126 L 8 -74 Z" fill={c} />
      <circle cx={-4} cy={-140} r={12} fill={c} />
      <rect x={10} y={-180} width={3} height={100} fill={c} />
      <path d={`M 13 -180 L ${50 + Math.sin(t * 9) * 4} -170 L 13 -158 Z`} fill="#f4efe2" />
    </g>
  );
};

/** Ferman (teklif) — açılan rulo, soyut hat çizgileri (yazı altyazıda) */
const Ferman: React.FC<{ t: number; a: number; b: number }> = ({ t, a, b }) => {
  const g = ap(t, a, 0.5) * (1 - ap(t, b, 0.45));
  if (g < 0.01) return null;
  const ac = easeOut((t - a) / 0.8);
  const w = 560 * ac;
  return (
    <g opacity={g} transform={`translate(540 560) rotate(${-3 + Math.sin(t) * 0.6})`}>
      <rect x={-w / 2} y={-170} width={w} height={340} fill="#efe1bd" stroke="#6b4a2b" strokeWidth={4} />
      <rect x={-w / 2 - 22} y={-186} width={22} height={372} rx={11} fill="#8a5a32" />
      <rect x={w / 2} y={-186} width={22} height={372} rx={11} fill="#8a5a32" />
      {ac > 0.5 && (
        <g opacity={cl((ac - 0.5) * 2)} stroke="#2b1a10" fill="none" strokeLinecap="round">
          {/* tuğra benzeri soyut hat */}
          <path d="M -120 -70 Q -110 -150 -90 -70 Q -70 -150 -50 -70 Q -30 -150 -10 -70 L -10 -40 Q 80 -60 120 -20 Q 60 10 -120 -10" strokeWidth={7} />
          {Array.from({ length: 4 }).map((_, i) => (
            <path key={i} d={`M -220 ${30 + i * 32} Q ${-100 + Math.sin(i) * 30} ${20 + i * 32} 0 ${30 + i * 32} T 220 ${30 + i * 32}`} strokeWidth={4} opacity={0.75} />
          ))}
        </g>
      )}
      <circle cx={170} cy={120} r={30} fill={KAN} opacity={cl((ac - 0.7) * 3)} />
    </g>
  );
};

/** Kese: boş para kesesi + "ÖDENMEDİ" mührü */
const Kese: React.FC<{ t: number; a: number; muhur: number; b: number }> = ({ t, a, muhur, b }) => {
  const g = ap(t, a, 0.35) * (1 - ap(t, b, 0.35));
  if (g < 0.01) return null;
  const s = sp(t, a, 10);
  const ters = easeOut((t - a - 0.4) / 0.6);
  const m = t - muhur;
  return (
    <g opacity={g} transform={`translate(800 360) scale(${s * 0.72})`}>
      <g transform={`rotate(${180 * ters})`}>
        <path d="M -90 -40 Q -130 80 0 100 Q 130 80 90 -40 Q 40 -70 0 -60 Q -40 -70 -90 -40 Z" fill="#8a6038" stroke="#3a2614" strokeWidth={6} />
        <path d="M -70 -50 Q 0 -30 70 -50" stroke="#3a2614" strokeWidth={8} fill="none" />
      </g>
      {/* tek bir sikke düşer, sonra hiçbir şey */}
      {ters > 0.5 && (() => {
        const u = cl((t - a - 0.8) / 0.7);
        return <ellipse cx={10} cy={-40 + u * 260} rx={22 * Math.abs(Math.cos(t * 9))} ry={22} fill={ALTIN} opacity={1 - u} />;
      })()}
      {m > 0 && (
        <g transform={`translate(-60 250) rotate(-8) scale(${1 + 0.6 * Math.max(0, 1 - m / 0.18)})`} opacity={cl(m / 0.08)}>
          <rect x={-220} y={-56} width={440} height={112} rx={14} fill="none" stroke={KAN} strokeWidth={10} />
          <text x={0} y={24} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={66} letterSpacing={6} fill={KAN}>ÖDENMEDİ</text>
        </g>
      )}
    </g>
  );
};

/** Babil'in surları — Urban'ın sözünde gökte beliren hayalet İştar Kapısı; "toz" sözünde toza dağılır */
const Babil: React.FC<{ t: number; a: number; toz: number }> = ({ t, a, toz }) => {
  const g = ap(t, a, 0.8);
  if (g < 0.01) return null;
  const u = t - toz;
  const dag = cl(u / 1.8);
  const tug = (x: number, y: number, w: number, hh: number, key: string, i0: number) => {
    // sırlı mavi tuğla duvar parçası
    const out: React.ReactNode[] = [];
    const bw = 26, bh = 16;
    for (let r = 0; r < Math.floor(hh / bh); r++)
      for (let c = 0; c < Math.floor(w / bw); c++) {
        const i = i0 + r * 40 + c;
        const xx = x + c * bw + (r % 2 ? bw / 2 : 0), yy = y + r * bh;
        if (xx + bw > x + w + 1) continue;
        const dx = dag * (rnd(i, 1) - 0.5) * 1100, dy = dag * (-150 + rnd(i, 2) * 1000);
        const op = (1 - cl(dag * 1.4 - rnd(i, 3) * 0.4)) * (0.7 + 0.3 * rnd(i, 4));
        if (op < 0.02) continue;
        out.push(<rect key={key + i} x={xx + dx} y={yy + dy} width={bw - 2} height={bh - 2} fill={rnd(i, 5) > 0.15 ? "#2a63b8" : "#3c7fd6"} opacity={op}
          transform={dag > 0 ? `rotate(${dag * 160 * (rnd(i, 6) - 0.5)} ${xx + dx + 12} ${yy + dy + 7})` : undefined} />);
      }
    return out;
  };
  // altın hayvan kabartmaları (aslan/boğa siluetleri — sade)
  const hayvan = (x: number, y: number, k: number) => (
    <g key={k} transform={`translate(${x} ${y})`} opacity={1 - dag}>
      <path d="M -26 0 Q -24 -14 -8 -14 L 14 -14 Q 22 -22 28 -16 L 26 -8 L 18 -6 L 18 4 L 12 4 L 10 -4 L -14 -4 L -16 4 L -22 4 Z" fill={ALTIN} />
    </g>
  );
  return (
    <g opacity={g * 0.88} transform={`translate(540 ${640 + Math.sin(t * 0.8) * 6})`}>
      <ellipse cx={0} cy={-80} rx={560} ry={360} fill="#5aa0e0" opacity={0.14 * (1 - dag)} />
      {/* iki kule + kemerli kapı */}
      {tug(-330, -330, 200, 400, "a", 0)}
      {tug(130, -330, 200, 400, "b", 3000)}
      {tug(-130, -250, 260, 140, "c", 6000)}
      {dag < 0.5 && <path d="M -110 70 L -110 -40 A 110 110 0 0 1 110 -40 L 110 70 Z" fill="#0b1a33" opacity={0.65 * (1 - dag * 2)} />}
      {/* basamaklı mazgallar */}
      {[-330, -290, -250, -210, -170, 130, 170, 210, 250, 290].map((x, i) => (
        <path key={i} d={`M ${x} ${-330 - dag * 400 * rnd(i, 9)} l 0 -20 l 8 0 l 0 -10 l 8 0 l 0 -10 l 8 0 l 0 10 l 8 0 l 0 10 l 8 0 l 0 20 Z`} fill="#2a63b8" opacity={1 - dag} />
      ))}
      {[-280, -200, 180, 260].map((x, i) => hayvan(x, -150 + (i % 2) * 140, i))}
      {[-280, -200, 180, 260].map((x, i) => hayvan(x, -10 - (i % 2) * 140, i + 10))}
      <rect x={-330} y={-200} width={660} height={6} fill={ALTIN} opacity={0.8 * (1 - dag)} />
      {/* toz */}
      {u > 0 && Array.from({ length: 46 }).map((_, i) => {
        const k = cl(u / 2.6);
        return <circle key={"t" + i} cx={(rnd(i, 5) - 0.5) * 900 * (0.4 + k)} cy={-160 + (rnd(i, 6) - 0.3) * 520 + k * 300} r={30 + k * 90} fill="url(#babtoz)" opacity={0.9 * (1 - k)} />;
      })}
      <defs>
        <radialGradient id="babtoz">
          <stop offset="0" stopColor="#e6d6b4" stopOpacity="0.6" />
          <stop offset="1" stopColor="#e6d6b4" stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
};

/** Günü sayan sayaç (montaj) */
const Sayac: React.FC<{ t: number; a: number; b: number; deger: number }> = ({ t, a, b, deger }) => {
  const g = ap(t, a, 0.3) * (1 - ap(t, b, 0.4));
  if (g < 0.01) return null;
  return (
    <g opacity={g}>
      <Bant y0={290} y1={540} />
      <text x={540} y={430} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={120} letterSpacing={6} fill="#fbf2dc" stroke="#0e0a07" strokeWidth={7} paintOrder="stroke fill">{`${Math.max(1, Math.round(deger))}. GÜN`}</text>
      <text x={540} y={490} textAnchor="middle" fontFamily={CINZEL} fontWeight={700} fontSize={34} letterSpacing={6} fill={ALTIN} stroke="#0e0a07" strokeWidth={4} paintOrder="stroke fill">KUŞATMA SÜRÜYOR</text>
    </g>
  );
};

/** Sikke — sonda düşer, top ağzının önüne iner, bir kez seker, yan yatıp durur, çınlar */
const Sikke: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const u = t - a;
  if (u < 0) return null;
  const T = 0.55; // düşüş
  const dus = cl(u / T);
  const zemin = 1150;
  const y = lerp(180, zemin, dus * dus);
  const v = u - T;
  const sek = v > 0 && v < 0.32 ? Math.sin((v / 0.32) * Math.PI) * 70 : 0;
  // dönüş: havada hızlı; yere değince yavaşlayıp yan yatar (yassı elips)
  const don = u < T ? Math.abs(Math.cos(u * 22)) : v < 0.32 ? Math.abs(Math.cos(v * 14)) : lerp(Math.abs(Math.cos(0.32 * 14)), 0.28, cl((v - 0.32) / 0.35));
  const ry = v > 0.32 ? lerp(70, 26, cl((v - 0.32) / 0.35)) : 70;
  return (
    <g>
      {v > 0.32 && <ellipse cx={540} cy={zemin + 30} rx={90} ry={16} fill="#000" opacity={0.35} />}
      <g transform={`translate(540 ${y - sek})`}>
        <ellipse cx={0} cy={0} rx={70 * Math.max(0.12, don)} ry={ry} fill={ALTIN} stroke="#8a6a1c" strokeWidth={6} />
        <ellipse cx={0} cy={0} rx={48 * Math.max(0.1, don)} ry={ry * 0.68} fill="none" stroke="#8a6a1c" strokeWidth={4} />
      </g>
      {v > 0 && v < 1.0 && <ellipse cx={540} cy={zemin + 20} rx={70 + v * 360} ry={(70 + v * 360) * 0.3} fill="none" stroke="#ffe7a0" strokeWidth={4} opacity={1 - v} />}
    </g>
  );
};

/** Yerdeki sikke (açılışta açıklamasız durur, sonda ödül olur) — dünya koordinatı */
const YerSikke: React.FC<{ t: number }> = ({ t }) => {
  const p = Math.max(0, Math.sin(t * 2.1)) ** 8;
  return (
    <g transform="translate(560 1685)">
      <ellipse cx={0} cy={0} rx={32} ry={12} fill={ALTIN} stroke="#6a4a14" strokeWidth={3} />
      <ellipse cx={0} cy={-2} rx={20} ry={6} fill="none" stroke="#8a6a1c" strokeWidth={2} />
      <circle cx={0} cy={0} r={46} fill="#ffd36b" opacity={0.18 + 0.25 * p} />
      <path d="M -26 -6 A 30 10 0 0 1 22 -9" stroke="#fff6d0" strokeWidth={3} fill="none" opacity={0.4 + 0.6 * p} />
      <ellipse cx={-24 + ((t * 0.9) % 1) * 48} cy={-3} rx={6} ry={4} fill="#fffbe8" opacity={0.3 + 0.6 * p} />
    </g>
  );
};

/** Beyit ön planı: harap taban taşları + arkadan görünen genç sultan silueti (kemerlere bakıyor) */
const Harabe: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <path d="M 0 1470 L 180 1440 L 420 1470 L 700 1430 L 1080 1460 L 1080 1920 L 0 1920 Z" fill="#2a2228" />
    {Array.from({ length: 9 }).map((_, i) => (
      <path key={i} d={`M ${i * 130 - 20} ${1500 + (i % 3) * 60} l 120 -10 l 10 60 l -125 12 Z`} fill="#3a3036" stroke="#1a1418" strokeWidth={3} />
    ))}
    <g transform="translate(720 1440) rotate(-8)">
      <rect x={-34} y={-60} width={300} height={68} rx={10} fill="#4a3e44" stroke="#1a1418" strokeWidth={4} />
      <rect x={-34} y={-60} width={300} height={14} fill="#5c5056" />
    </g>
    {/* genç sultan, arkadan: büyük beyaz kavuk, kırmızı kaftan; hafif nefes */}
    <g transform={`translate(230 ${2055 + Math.sin(t * 1.6) * 3}) scale(2.1)`}>
      <path d="M -70 0 L -58 -150 Q 0 -178 58 -150 L 70 0 Z" fill="#7a1a14" />
      <path d="M -58 -150 Q 0 -178 58 -150 L 50 -120 Q 0 -140 -50 -120 Z" fill="#5a120e" />
      <rect x={-14} y={-196} width={28} height={30} fill="#c9a07a" />
      <ellipse cx={0} cy={-222} rx={46} ry={38} fill="#f4efe2" />
      <path d="M -44 -224 Q 0 -250 44 -224" stroke="#d8d0bc" strokeWidth={4} fill="none" />
      <rect x={-3} y={-268} width={6} height={12} fill="#f2c14e" />
    </g>
  </g>
);

// ---------------------------------------------------------------- SAHNELER
const ACILIS_KAM: [number, number, number, number][] = [[0, 520, 1480, 1.5], [8, 430, 1420, 1.85]];

/** 1 · Nisan 1453. Şafak henüz sökmemiş. Surların önünde binlerce asker karanlıkta titriyor. */
const Acilis: S = ({ t, d, ws }) => {
  // açılış: itme ilk 3 sn'de yoğun (easeOut) — ilk andan itibaren hareket
  const k = ak(t / Math.max(1, d));
  const kam: Kam = { x: lerp(ACILIS_KAM[0][1], ACILIS_KAM[1][1], k), y: lerp(ACILIS_KAM[0][2], ACILIS_KAM[1][2], k), z: lerp(ACILIS_KAM[0][3], ACILIS_KAM[1][3], k) };
  const ta = ws("binlerce");
  const D: Dunya = { t, h: 0.32, ates: 1, ordu: 0.35 + 0.65 * ap(t, ta, 1.4), fitil: lerp(0, 0.05, cl(t / d)), toz: 0 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam}>
        <Otag h={D.h} t={t} />
        <Top D={D} />
        <Urban x={200} y={1700} s={1.3} t={t} />
        <YerSikke t={t} />
      </DunyaSahne>
      <Sis t={t} o={0.38} y={1150} hiz={110} renk="#8a7a9a" />
      {/* geleceğe sıçramadan kalan duman kadrajı süpürür (ilk 2 sn) */}
      {t < 2.2 && (
        <g>
          <defs>
            <radialGradient id="supurme">
              <stop offset="0" stopColor="#c9bdac" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#b9ad9c" stopOpacity="0.22" />
              <stop offset="1" stopColor="#b9ad9c" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({ length: 7 }).map((_, i) => (
            <ellipse key={i} cx={-200 + i * 190 + t * 520} cy={700 + rnd(i, 3) * 700} rx={380 + rnd(i, 4) * 200} ry={220 + rnd(i, 5) * 120} fill="url(#supurme)" opacity={1 - t / 2.2} />
          ))}
        </g>
      )}
      <Kul t={t} o={0.85} n={40} />
      <OnPlan t={t} o={0.65} n={26} />
      <OnBayrak t={t} renk="#7a1a14" y={250} boy={480} />
      <Vinyet g={0.85} />
      <Bolum t={t} a={1.5} ust="NİSAN 1453" alt="KONSTANTİNOPOLİS ÖNLERİ" sure={Math.max(2.6, ws("binlerce") - 1.2)} y={430} />
    </g>
  );
};

/** 2 · Sonra her şey susuyor. Kuşlar bile. — fitil, kuşlar, fitil deliğe varır */
const Sessiz: S = ({ t, d, ws }) => {
  const tk = ws("kuşlar");
  const ic = t < tk - 0.05;
  const fk = lerp(0.05, 0.98, cl(t / d));
  const fp = fitilDunya(fk);
  const kam: Kam = ic
    ? { x: lerp(fp.x, fp.x + 40, 0.5), y: fp.y + 115, z: lerp(2.3, 2.9, cl(t / Math.max(0.1, tk))) }
    : { ...pk(HEDEF.x, 1000, 0.75), z: lerp(1.15, 1.4, cl((t - tk) / Math.max(0.5, d - tk))) };
  const D: Dunya = { t, h: 0.36, ates: 1, ordu: 1, fitil: fk, kus: t - tk + 0.4 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam}>
        <Otag h={D.h} t={t} />
        <Top D={D} />
        <Urban x={200} y={1700} s={1.3} t={t} />
        <YerSikke t={t} />
      </DunyaSahne>
      <Kul t={t} o={0.5} n={14} />
      <OnPlan t={t} o={0.35} n={10} />
      <Vinyet g={0.9} />
    </g>
  );
};

/** 3 · Ve bir gürleme. Yer sarsılıyor. Yarım tonluk bir taş gülle surlara çarpıyor. — ağır çekim gülle */
const Gurleme: S = ({ t, d, ws }) => {
  const tg = ws("yer") - 0.6, tc = ws("çarpıyor"), ty = ws("yarım"); // top, "gürleme." sözünden sonraki boşlukta patlar
  const ucus = cl((t - tg) / Math.max(0.5, tc - tg)); // gülle tam "çarpıyor"da varır
  const bx = lerp(NAMLU.x, HEDEF.x, easeIO(ucus) * 0.15 + ucus * 0.85);
  const by = lerp(NAMLU.y, HEDEF.y, ucus) - Math.sin(ucus * Math.PI) * 160;
  let kam: Kam;
  const ilk: Kam = { x: 600, y: 1490, z: lerp(1.6, 1.75, cl(t / Math.max(0.1, tg + 0.3))) };
  const takip: Kam = { x: lerp(560, bx, 0.85), y: lerp(1500, by + 40, 0.85), z: lerp(1.9, 2.3, ucus) }; // namlu altyazı bandının altına iner
  const gk = easeIO((t - tg - 0.15) / 0.7); // ilk plandan gülle takibine yumuşak geçiş (sıçrama yok)
  if (t < tc) kam = { x: lerp(ilk.x, takip.x, gk), y: lerp(ilk.y, takip.y, gk), z: lerp(ilk.z, takip.z, gk) };
  else kam = { x: HEDEF.x, y: HEDEF.y + 40, z: lerp(1.7, 1.95, cl((t - tc) / 1.5)) };
  const sh = sars(t, [tg, tc], 30);
  const carp = t - tc;
  const D: Dunya = { t, h: 0.42 + 0.1 * cl(t / d), ates: 1, ordu: 1, fitil: t < tg ? 0.99 : -1, hasar: carp > 0 ? cl(carp / 0.3) : 0, toz: carp > 0 ? cl(carp / 0.6) * 0.8 : 0 };
  const etiket = ap(t, ty, 0.3) * (1 - ap(t, tc - 0.15, 0.15));
  return (
    <g>
      <DunyaSahne D={D} kam={kam} sallanti={sh}>
        <Otag h={D.h} t={t} />
        <Top D={D} geri={t > tg ? Math.max(0, 1 - (t - tg) / 0.6) : 0} />
        <Urban x={200} y={1700} s={1.3} t={t} />
        <YerSikke t={t} />
        {/* namlu ateşi + duman (gülleyi burada ayrıca çiziyoruz: ağır çekim) */}
        <Atis u={t > tg ? t - tg : -1} t={t} sadece="namlu" />
        {t > tg && ucus < 1 && (
          <g>
            {Array.from({ length: 8 }).map((_, i) => {
              const k = cl(ucus - i * 0.02);
              const x = lerp(NAMLU.x, HEDEF.x, easeIO(k) * 0.15 + k * 0.85), y = lerp(NAMLU.y, HEDEF.y, k) - Math.sin(k * Math.PI) * 160;
              return <circle key={i} cx={x} cy={y} r={20 - i * 2} fill="#fff1b0" opacity={0.25 - i * 0.03} />;
            })}
            <circle cx={bx} cy={by} r={22 * (1 + 1.5 * Math.pow(ucus, 4))} fill="#3a342e" stroke="#120e0a" strokeWidth={3} />
            <circle cx={bx - 6} cy={by - 7} r={6} fill="#8a7f72" />
            {etiket > 0.01 && (
              <g opacity={etiket} transform={`translate(${bx - 280} ${by - 70})`}>
                <rect x={0} y={-30} width={230} height={50} rx={10} fill="#120d08" stroke={ALTIN} strokeWidth={3} />
                <text x={115} y={4} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={30} fill={ALTIN}>≈ 540 KG</text>
              </g>
            )}
          </g>
        )}
        {carp > 0 && <Atis u={0.55 + carp} t={t} sadece="carpma" />}
      </DunyaSahne>
      <Kul t={t} o={0.6} n={18} />
      <Parlama t={t} a={tg} d={0.2} g={1} />
      <Parlama t={t} a={tg + 0.05} d={0.45} g={0.35} renk="#ff9a4a" />
      <Parlama t={t} a={tc} d={0.5} g={0.7} renk="#ffe2b0" />
      <Vinyet g={0.8} />
    </g>
  );
};

/** 4 · Toz bulutunun içinde Osmanlı ordusu görünüyor. Başında 21 yaşında bir sultan: Mehmed. */
const Ordu: S = ({ t, d, ws }) => {
  const to = ws("osmanlı"), tb = ws("başında"), tm = ws("mehmed");
  const kesme = tb - 0.1;
  const kam: Kam = t < kesme
    ? { x: lerp(760, 720, cl(t / kesme)), y: lerp(1300, 1280, cl(t / kesme)), z: lerp(0.62, 0.84, ak(t / kesme)) }
    : { x: 1060, y: lerp(1390, 1370, cl((t - kesme) / 3)), z: lerp(1.55, 1.75, cl((t - kesme) / 3)) };
  const D: Dunya = { t, h: lerp(0.55, 1.05, cl(t / d)), ates: 0.7, ordu: ap(t, to - 0.6, 1.6), toz: lerp(0.85, 0.15, cl(t / (to + 1))), hasar: 1 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam}>
        <Otag h={D.h} t={t} />
        <Top D={D} />
        <Sultan x={1060} y={1470} s={1.2} t={t} />
      </DunyaSahne>
      <Huzme t={t} o={0.6 * cl((D.h - 0.7) * 3)} x={540} y={t < kesme ? 640 : 300} />
      <Kul t={t} o={0.35} n={14} renk="#ffd9a0" />
      <OnPlan t={t} o={0.3} renk="#ffd9a0" />
      <Vinyet g={0.7} />
      <IsimKarti t={t} a={tb - 0.05} ad="II. MEHMED" rol="21 yaşında · Osmanlı sultanı" sure={Math.max(2.5, d - tb - 0.3)} sag />
    </g>
  );
};

/** 5 · O topu döken adam şimdi topun yanında: Urban. */
const UrbanS: S = ({ t, d, ws }) => {
  const tu = sonra(ws, "urban", 0.8);
  void tu;
  const kam: Kam = { x: lerp(430, 300, ak(t / d)), y: lerp(1560, 1600, ak(t / d)), z: lerp(1.45, 1.85, ak(t / d)) };
  const D: Dunya = { t, h: 1.15, ates: 0.5, ordu: 1, hasar: 1 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam}>
        <Top D={D} />
        {/* namludan hâlâ tüten duman */}
        {Array.from({ length: 6 }).map((_, i) => {
          const u = ((t * 0.35 + i / 6) % 1);
          return <circle key={i} cx={NAMLU.x + u * 60 + Math.sin(t + i) * 10} cy={NAMLU.y - u * 260} r={20 + u * 50} fill="#d8cfc0" opacity={0.35 * (1 - u)} />;
        })}
        <Urban x={200} y={1720} s={1.75} t={t} />
      </DunyaSahne>
      <Huzme t={t} o={0.35} x={700} y={200} />
      <Kul t={t} o={0.3} n={12} renk="#ffd9a0" />
      <OnPlan t={t} o={0.3} renk="#ffd9a0" />
      <Vinyet g={0.7} />
      <IsimKarti t={t} a={Math.max(0.15, ws("topu") - 0.1)} ad="URBAN" rol="top dökümcüsü · Macar asıllı" sure={Math.max(1.9, d - Math.max(0.15, ws("topu") - 0.1) - 0.4)} />
    </g>
  );
};

/** Geri dönüş çerçevesi: sepya + gren + yazı "1452" */
const Ani: React.FC<{ t: number; children: React.ReactNode; yil?: boolean; ust?: React.ReactNode }> = ({ t, children, yil, ust }) => (
  <g>
    <defs>
      <filter id="sepya" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0" />
      </filter>
    </defs>
    <g filter="url(#sepya)">{children}</g>
    <rect x={0} y={0} width={1080} height={1920} fill="#6b4a22" opacity={0.12} />
    <Gren o={0.28} />
    <Vinyet g={0.95} />
    {ust}
    {yil && <Bolum t={t} a={0.1} ust="1452" alt="BİR YIL ÖNCE" sure={1.9} y={380} />}
  </g>
);

/** 6 · Bir yıl önce Bizans'a çalışmak istemişti. Ama imparator küçük maaşını bile ödeyemedi. Urban da Sultan'a gitti. */
const Gecmis: S = ({ t, d, ws }) => {
  const tmaas = ws("maaşını"), tode = ws("ödeyemedi"), turb = sonra(ws, "urban", 1.5);
  // Urban sur kapısının dibinde → imparator surda; sonra ordugâha yürür
  const yuru = cl((t - turb) / Math.max(0.6, d - turb));
  const ux = lerp(930, 1060, yuru), uy = lerp(1226, 1600, yuru);
  const k1: Kam = { x: lerp(930, 860, cl(t / turb)), y: lerp(1160, 1125, cl(t / turb)), z: lerp(2.2, 3.0, cl(t / turb)) };
  const k2: Kam = { x: lerp(990, 1080, yuru), y: uy - 70, z: lerp(1.9, 2.1, yuru) };
  const bg = easeIO((t - turb + 0.1) / 0.9); // tek kesintisiz aşağı süzülme
  const kam: Kam = { x: lerp(k1.x, k2.x, bg), y: lerp(k1.y, k2.y, bg), z: lerp(k1.z, k2.z, bg) };
  const D: Dunya = { t, h: 1.7, ates: 0, ordu: 0, konstantin: 1, kartal: 1, sepya: true };
  return (
    <Ani t={t} yil ust={<g><OnPlan t={t} o={0.45} n={20} renk="#f0e2c0" /><Sis t={t} o={0.3} y={1000} hiz={60} renk="#e8d8b4" /><Kul t={t} o={0.5} n={30} renk="#f0e2c0" yukari={false} /><Kese t={t} a={tmaas - 0.2} muhur={tode} b={Math.max(tode + 1.6, turb + 0.4)} /></g>}>
      <DunyaSahne D={D} kam={kam}>
        <Otag h={D.h} t={t} />
        <Urban x={ux} y={uy} s={0.75} t={t} yuru={t > turb ? 1 : 0} flip={t < turb} />
      </DunyaSahne>
    </Ani>
  );
};

/** 7 · Sultan, bu surları yıkacak bir top dökebilir mi diye sordu. Urban: "Topumun taşları Babil'in surlarını bile toz eder." */
const Soru: S = ({ t, d, ws }) => {
  const tu = sonra(ws, "urban", 1.0), tb = ws("babil'in"), tt = sonra(ws, "toz", 1.0);
  const kam: Kam = t < tu - 0.05
    ? { x: lerp(1140, 1075, cl(t / tu)), y: lerp(1545, 1500, cl(t / tu)), z: lerp(2.1, 3.3, ak(t / tu)) }
    : { x: lerp(980, 880, cl((t - tu) / (d - tu))), y: lerp(1330, 1250, cl((t - tu) / (d - tu))), z: lerp(0.88, 1.15, cl((t - tu) / (d - tu))) };
  const D: Dunya = { t, h: 1.75, ates: 0, ordu: 0, sepya: true };
  return (
    <Ani t={t} ust={<g><OnPlan t={t} o={0.45} n={20} renk="#f0e2c0" /><Sis t={t} o={0.3} y={1100} hiz={60} renk="#e8d8b4" /><Kul t={t} o={0.5} n={30} renk="#f0e2c0" yukari={false} /><Babil t={t} a={tb - 0.5} toz={tt} /></g>}>
      <DunyaSahne D={D} kam={kam}>
        <Otag h={D.h} t={t} />
        <Sultan x={1010} y={1600} s={0.8} t={t} />
        <Urban x={1165} y={1602} s={0.85} t={t} flip />
      </DunyaSahne>
    </Ani>
  );
};

/** 8 · Haftalar geçiyor. Gündüz gülleler, gece Bizanslılar yıkılan yerleri elleriyle örüyor. — zaman atlaması */
const Haftalar: S = ({ t, d, ws }) => {
  const tg = ws("gündüz"), tgc = ws("gece");
  // gün-gece döngüsü: "gündüz"de gün ortası, "gece"de gece; sonra hızlanan döngü
  const P = 2 * Math.max(0.8, tgc - tg); // bir gün-gece: "gündüz" sözünde öğle, "gece" sözünde gece yarısı
  const h = 1 + Math.cos((2 * Math.PI * (t - tg)) / P);
  const gun = lerp(2, 17, cl(t / Math.max(0.5, d - 0.5))); // 6 Nisan = 1. gün → 22 Nisan = 17. gün
  const kam: Kam = { ...pk(HEDEF.x, 1080, 1), z: lerp(0.95, 1.15, cl(t / d)) };
  const gece = cl(1 - h);
  const atisAn = Math.floor(t / 0.9) * 0.9;
  const D: Dunya = { t, h, ates: gece, ordu: 0, hasar: 1, gedikler: Math.min(4, Math.floor(t / 1.2)), onarim: gece > 0.4 ? cl((gece - 0.4) * 2.5) : 0 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam}>
        {h > 1.2 && <Atis u={0.55 + (t - atisAn) * 1.4} t={t} sadece="carpma" hedef={{ x: 380 + rnd(atisAn * 7, 1) * 700, y: 1060 }} />}
        {/* gece onarımı: fenerli savunucular */}
        {gece > 0.3 && Array.from({ length: 10 }).map((_, i) => (
          <g key={i} opacity={gece}>
            <circle cx={500 + i * 45 + Math.sin(t * 2 + i) * 14} cy={1110 + Math.cos(t * 1.7 + i) * 8} r={18} fill={KOR} opacity={0.25} />
            <circle cx={500 + i * 45 + Math.sin(t * 2 + i) * 14} cy={1110 + Math.cos(t * 1.7 + i) * 8} r={5} fill="#ffd36b" />
          </g>
        ))}
      </DunyaSahne>
      <Vinyet g={0.75} />
      <Sayac t={t} a={0.2} b={d - 0.3} deger={gun} />
    </g>
  );
};

/** 9 · Bir gece Osmanlı gemileri karadan yürütüp Haliç'e indiriyor. */
const Gemiler: S = ({ t, d, ws }) => {
  const th = ws("haliç");
  const g = cl(t / (th + 0.6));
  const kam: Kam = { x: lerp(2330, 1700, cl(t / d)), y: lerp(1300, 1090, cl(t / d)), z: lerp(1.2, 1.6, cl(t / d)) };
  const D: Dunya = { t, h: 0.12, ates: 1, ordu: 0, hasar: 1, gemi: g };
  const etiket = ap(t, 0.25, 0.4) * (1 - ap(t, d - 0.35, 0.3));
  return (
    <g>
      <DunyaSahne D={D} kam={kam} />
      {etiket > 0.01 && (
        <g opacity={etiket}>
          <text x={540} y={640} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={84} letterSpacing={14} fill="#fbf2dc" stroke="#0e0a07" strokeWidth={6} paintOrder="stroke fill">HALİÇ</text>
          <text x={540} y={696} textAnchor="middle" fontFamily={CINZEL} fontWeight={700} fontSize={30} letterSpacing={4} fill={ALTIN} stroke="#0e0a07" strokeWidth={5} paintOrder="stroke fill">22 NİSAN · ZİNCİR AŞILMADAN, KARADAN</text>
        </g>
      )}
      <Gren o={0.12} />
      <OnPlan t={t} o={0.3} renk="#9fb4ff" yon={-1} />
      <Vinyet g={0.9} />
    </g>
  );
};

/** 10 · Sultan son bir teklif gönderiyor: "Teslim olun, canınız bağışlansın." */
const Teklif: S = ({ t, d, ws }) => {
  const tts = sonra(ws, "teslim", 0.5);
  const kam: Kam = { x: lerp(860, 800, ak(t / d)), y: lerp(1400, 1250, ak(t / d)), z: lerp(1.08, 1.42, ak(t / d)) }; // sağda dünyanın kenarı görünmesin
  const D: Dunya = { t, h: 1.85, ates: 0, ordu: 0.6, hasar: 1, gedikler: 4, onarim: 1, elci: cl(t / (d - 0.2)) };
  return (
    <g>
      <DunyaSahne D={D} kam={kam}>
        <Otag h={D.h} t={t} />
        <Elci k={cl(t / (d - 0.2))} t={t} h={D.h} />
      </DunyaSahne>
      <OnPlan t={t} o={0.25} renk="#f4e4c0" />
      <Vinyet g={0.65} />
      <Bolum t={t} a={0.05} ust="MAYIS 1453" alt="son teklif" sure={Math.max(1.2, tts - 0.9)} y={380} />
      <Ferman t={t} a={tts - 0.35} b={d - 0.15} />
    </g>
  );
};

/** 11 · Konstantin'in cevabı: "Şehri teslim etmek ne benim elimde... Hepimiz kendi isteğimizle ölmeye hazırız." */
const Cevap: S = ({ t, d, ws }) => {
  const th = ws("hepimiz"), to = ws("ölmeye"), te = sonra(ws, "elimde", 0.5);
  const kx = HEDEF.x + 160;
  const kam: Kam = t < te - 0.05
    ? { x: lerp(kx + 45, kx - 20, cl(t / te)), y: lerp(1000, 980, cl(t / te)), z: lerp(3.0, 3.8, ak(t / te)) }
    : t < th - 0.05
    ? { x: lerp(kx + 6, kx - 6, cl((t - te) / (th - te))), y: lerp(950, 942, cl((t - te) / (th - te))), z: lerp(6.0, 7.2, cl((t - te) / (th - te))) } // yakın plan: imparatorun yüzü/tacı
    : { x: lerp(kx - 10, kx - 90, cl((t - th) / (d - th))), y: lerp(1020, 1000, cl((t - th) / (d - th))), z: lerp(2.2, 3.0, cl((t - th) / (d - th))) };
  const D: Dunya = { t, h: 1.55, ates: 0, ordu: 0, hasar: 1, gedikler: 4, onarim: 1, konstantin: 1, kartal: 1 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam}>
        <Savunucular k={ap(t, th - 0.2, 0.5)} t={t} h={D.h} kaldir={ap(t, to, 0.6)} />
      </DunyaSahne>
      <Huzme t={t} o={0.3} x={900} y={250} />
      <Kul t={t} o={0.3} n={10} renk="#ffd9a0" />
      <OnPlan t={t} o={0.35} renk="#ffe0b0" yon={-1} />
      <OnBayrak t={t} renk="#4a1f5c" sag y={260} boy={560} />
      <Vinyet g={0.75} />
      <IsimKarti t={t} a={0.15} ad="XI. KONSTANTİN" rol="son Bizans imparatoru" sure={Math.min(3.4, th - 0.6)} />
    </g>
  );
};

/** 12 · 28 Mayıs gecesi. Ayasofya'da son ayin. İnsanlar ağlayarak dua ediyor. */
const Ayin: S = ({ t, d, ws }) => {
  const ta = ws("ayasofya'da"), ti = ws("insanlar");
  const hedef = pk(720, 900, 0.75);
  const pen = pk(720, 975, 0.75); // alt pencereler: içeride mum ışığı
  const kam: Kam = t < ti - 0.05
    ? { x: hedef.x, y: lerp(hedef.y + 60, hedef.y, ak(t / ti)), z: lerp(1.9, 2.7, ak(t / ti)) }
    : { x: pen.x, y: pen.y, z: lerp(5.2, 6.0, cl((t - ti) / Math.max(0.5, d - ti))) };
  const D: Dunya = { t, h: 0.16, ates: 0.6, ordu: 0, hasar: 1, gedikler: 4, onarim: 1, ayin: ap(t, ta - 0.3, 1.2) };
  return (
    <g>
      <DunyaSahne D={D} kam={kam} />
      {/* yükselen mum kıvılcımları */}
      <Kul t={t} o={0.55 * D.ayin!} n={28} renk="#ffc861" />
      <Sis t={t} o={0.15} y={1100} hiz={30} renk="#6a5a8a" />
      <Gren o={0.1} />
      <OnPlan t={t} o={0.45} renk="#ffc861" />
      <OnMum t={t} />
      <Vinyet g={0.88} />
      <Bolum t={t} a={0.1} ust="28 MAYIS" alt="GECE" sure={ta - 0.2} y={380} />
    </g>
  );
};

/** 13 · Gece yarısı davullar başlıyor. Kilise çanları karşılık veriyor. Son saldırı. */
const Saldiri: S = ({ t, d, ws }) => {
  const tdv = ws("davullar"), tk = ws("kilise"), ts = ws("saldırı");
  let kam: Kam;
  if (t < tk - 0.05) kam = { x: 640, y: lerp(1640, 1620, cl(t / tk)), z: lerp(1.25, 1.45, cl(t / tk)) }; // davullar (ordugâh)
  else if (t < ts - 0.3) kam = { ...pk(380, 880, 0.75), z: lerp(2.2, 2.5, cl((t - tk) / (ts - tk))) }; // çan kulesi
  else kam = { x: 640, y: lerp(1230, 1160, cl((t - ts) / 2)), z: lerp(0.95, 1.15, ak((t - ts) / 1.6)) }; // saldırı
  const D: Dunya = {
    t, h: 0.02, kanlik: t > ts - 0.3 ? 1 : 0.35, ates: 1, ordu: t > ts - 0.3 ? 1 : 0.4, hasar: 1, gedikler: 4, onarim: 1,
    can: ap(t, tk, 0.4), saldiri: t > ts - 0.3 ? cl((t - ts + 0.3) / 2.2) : 0,
  };
  const vur = ap(t, tdv, 0.2);
  return (
    <g>
      <DunyaSahne D={D} kam={kam} sallanti={sars(t, [ts], 18)}>
        <Otag h={D.h} t={t} />
        <Kos x={520} y={1700} s={1.1} vur={vur} t={t} h={0.6} />
        <Kos x={760} y={1720} s={1.0} vur={vur} t={t + 0.3} h={0.6} />
        <Ates x={640} y={1640} s={1.3} t={t} />
      </DunyaSahne>
      <Kul t={t} o={0.85} n={34} />
      <Parlama t={t} a={ts} d={0.4} g={0.6} renk="#ff9a5a" />
      <Gren o={0.12} />
      <OnPlan t={t} o={0.5} n={18} />
      <Vinyet g={0.85} />
    </g>
  );
};

/** 14 · 29 Mayıs sabahı surlarda Osmanlı sancağı dalgalanıyor. Anlatılanlara göre son imparator savaşarak ölüyor. */
const Fetih: S = ({ t, d, ws }) => {
  const ts = ws("sancağı"), ta = ws("anlatılanlara");
  const kam: Kam = t < ta - 0.05
    ? { x: HEDEF.x + 40, y: lerp(1000, 960, ak(t / ta)), z: lerp(1.5, 2.1, ak(t / ta)) }
    : { x: lerp(HEDEF.x + 120, HEDEF.x + 200, cl((t - ta) / (d - ta))), y: lerp(1000, 975, cl((t - ta) / (d - ta))), z: lerp(2.3, 3.5, cl((t - ta) / (d - ta))) };
  const D: Dunya = { t, h: lerp(0.95, 1.3, cl(t / d)), ates: 0.3, ordu: 0, hasar: 1, gedikler: 4, onarim: 0.6, sancak: ap(t, ts - 0.5, 1.0), kartal: 1 - ap(t, ta + 0.6, 1.4), toz: 0.25 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam} />
      <Huzme t={t} o={0.7} x={560} y={t < ta ? 640 : 500} />
      <Kul t={t} o={0.4} n={16} renk="#cfc6b8" />
      <OnPlan t={t} o={0.35} renk="#ffd9a0" />
      <OnBayrak t={t} renk="#8a1c14" sag y={220} boy={600} o={cl((t - ta + 0.3) / 0.5)} />
      <Vinyet g={0.7} />
      <Bolum t={t} a={0.25} ust="29 MAYIS" alt="1453 · SABAH" sure={Math.max(2.5, Math.min(3, ts - 0.2))} y={380} />
    </g>
  );
};

/** 15 · Genç sultan harap sarayda bir beyit mırıldanıyor: "Kayser'in sarayında perdeyi örümcek tutuyor." */
const Beyit: S = ({ t, d, ws }) => {
  const tk = ws("kayser'in"), to = ws("örümcek");
  const hedef = pk(1010, 978, 0.75);
  // tek, kesintisiz dalış: saray kemerine girip örümcek ağına yaklaşır
  const u = cl(t / d);
  const kam: Kam = { x: hedef.x - 14 * u * u, y: hedef.y + lerp(30, 4, u), z: 4 * Math.pow(25 / 4, ak(u)) };
  const D: Dunya = { t, h: 1.5, ates: 0, ordu: 0, hasar: 1, gedikler: 4, onarim: 0.6, sancak: 1, kartal: 0, ag: ap(t, to - 0.3, 1.6) };
  return (
    <g>
      <DunyaSahne D={D} kam={kam} sadeceSehir />
      <Sis t={t} o={0.25} y={1000} hiz={55} renk="#e8dcc0" />
      <Kul t={t} o={0.6} n={36} renk="#e8dcc0" yukari={false} />
      <OnPlan t={t} o={0.8} n={32} renk="#efe2c8" yon={-1} />
      <Harabe t={t} />
      <Vinyet g={0.9} />
      <IsimKarti t={t} a={tk - 0.1} ad="FARSÇA BEYİT" rol="Tursun Bey'in kaydı" sure={d - tk - 0.1} />
    </g>
  );
};

/** 16 · Her şey o sabahki gürleme ile başladı. Belki de ödenmemiş bir maaşla. — açılışa döner (döngü) */
const Son: S = ({ t, d, ws }) => {
  const tg = sonra(ws, "başladı", 0.5) + 0.35, tm = ws("maaşla"); // uzak top yankısı cümleden sonra
  // geniş plandan açılış kadrajına doğrusal ileri itme (döngü: son kare = ilk kare)
  const kk = cl(t / d);
  const kam: Kam = { x: lerp(640, 520, kk) + Math.sin(t * 1.3) * 12 * (1 - kk), y: lerp(1490, 1480, kk), z: lerp(1.0, 1.5, kk) };
  const D: Dunya = { t, h: lerp(0.45, 0.32, cl(t / d)), ates: 1, ordu: lerp(1, 0.35, cl((t - tm) / Math.max(0.3, d - tm))), fitil: -1 };
  return (
    <g>
      <DunyaSahne D={D} kam={kam} sallanti={sars(t, [tg], 10)}>
        <Otag h={D.h} t={t} />
        <Top D={D} />
        <Urban x={200} y={1700} s={1.3} t={t} />
        <YerSikke t={t} />
      </DunyaSahne>
      <Parlama t={t} a={tg} d={0.35} g={0.25} renk="#ffd9a0" />
      <Kul t={t} o={0.6} />
      <OnPlan t={t} o={0.65} n={26} />
      <OnBayrak t={t} renk="#7a1a14" y={250} boy={480} />
      <Vinyet g={0.85} />
      <Sikke t={t} a={tm + 0.05} />
    </g>
  );
};

export const SAHNE: Record<string, S> = {
  acilis: Acilis, sessiz: Sessiz, gurleme: Gurleme, ordu: Ordu, urban: UrbanS, gecmis: Gecmis, soru: Soru, haftalar: Haftalar,
  gemiler: Gemiler, teklif: Teklif, cevap: Cevap, ayin: Ayin, saldiri: Saldiri, fetih: Fetih, beyit: Beyit, son: Son,
};

// kapak: şafakta dev top, surlar ters ışıkta (ilk sahnenin dünyası)
export const KAPAK: React.FC = () => {
  const D: Dunya = { t: 2, h: 0.75, ates: 1, ordu: 1, fitil: 0.85 };
  return (
    <g>
      <DunyaSahne D={D} kam={{ x: 560, y: 1380, z: 0.82 }}>
        <Otag h={D.h} t={2} />
        <Top D={D} />
        <Urban x={200} y={1700} s={1.3} t={2} />
      </DunyaSahne>
      <Vinyet g={0.8} />
    </g>
  );
};
export const KAPAK_YAZI = { ust: "1453 · DEV TOP", buyuk: "ÖDENMEYEN MAAŞ", alt: "" };

// kullanılmayan içe aktarma uyarılarını sustur
void Ayasofya; void MOR; void sp;
