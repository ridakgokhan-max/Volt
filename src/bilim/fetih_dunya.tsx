// İstanbul'un Fethi — TEK DÜNYA. Bütün film aynı çizilmiş dünyada geçer; sahneler yalnızca kamerayı,
// günün saatini ve olayları değiştirir (film çekimi gibi: tek set, farklı açılar).
// Dünya koordinatları: x -600…2700, y -400…2600. Gökyüzü üstte, şehir ufukta (y≈1010), surlar, açık alan, Osmanlı ordugâhı önde.
// Tema "Kor ve Gravür": koyu mürekkep siluetler + kor/şafak ışığı. Şafak surların ARKASINDAN doğar → siluetler ters ışıkta.
import React from "react";
import { cl, lerp } from "./kit";

export const easeOut = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const easeIO = (x: number) => {
  const k = cl(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
export const rnd = (i: number, j: number) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const hx = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export const mixc = (a: string, b: string, k: number) => {
  const A = hx(a), B = hx(b), q = cl(k);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * q)).join(",")})`;
};
/** h: günün saati — 0 gece · 0.5 şafak öncesi · 1 şafak · 2 gündüz. Duraklar arasında renk yumuşak geçer. */
export const renk = (h: number, d: [number, string][]) => {
  if (h <= d[0][0]) return mixc(d[0][1], d[0][1], 0);
  for (let i = 1; i < d.length; i++) if (h <= d[i][0]) return mixc(d[i - 1][1], d[i][1], (h - d[i - 1][0]) / (d[i][0] - d[i - 1][0]));
  return mixc(d[d.length - 1][1], d[d.length - 1][1], 0);
};

export const KOR = "#ff8a2a";
export const ALTIN = "#f2c14e";
export const KAN = "#a8231c";
export const MOR = "#5b2a6e";
export const MUREKKEP = "#16131f";

// ---------------------------------------------------------------- dünya durumu
export type Dunya = {
  t: number; // sahne zamanı (sn) — ikincil hareketler
  h: number; // günün saati
  ates?: number; // kamp ateşleri (0–1)
  ordu?: number; // ordu görünürlüğü (0–1)
  toz?: number; // toz bulutu yoğunluğu
  hasar?: number; // ana gedik (0–1)
  gedikler?: number; // ek gedik sayısı (montaj)
  onarim?: number; // gece onarımı (0–1)
  sancak?: number; // surlarda Osmanlı sancağı (0–1 yükselme)
  kartal?: number; // Bizans sancağı (1 asılı → 0 indirildi)
  ayin?: number; // Ayasofya pencerelerinde mum ışığı
  can?: number; // çan sallanması (0–1)
  gemi?: number; // gemiler karadan yürür (0 → 1 Haliç'e iniş)
  saldiri?: number; // son saldırı meşaleleri (0–1)
  kanlik?: number; // gece saldırısında kızıl gök
  kus?: number; // surlardan kalkan kuşlar (zaman)
  ag?: number; // saray kemerinde örümcek ağı (0–1)
  fitil?: number; // fitil yanması (0–1), -1 kapalı
  atis?: number; // atış anı (sahne zamanı); NaN = yok
  sepya?: boolean; // geri dönüş (anı) — çizimde bazı şeyler gizlenir
  urban?: number; // Urban figürü görünürlüğü
  sultan?: number; // Sultan atlı görünürlüğü
  konstantin?: number; // Konstantin surlarda
  elci?: number; // elçi yolculuğu (0–1)
};

// ---------------------------------------------------------------- GÖK
export const Gok: React.FC<{ D: Dunya }> = ({ D }) => {
  const { h, t } = D;
  const ust = renk(h, [[0, "#070a1c"], [0.5, "#121735"], [1, "#2f3f74"], [2, "#5c95c9"]]);
  const orta = renk(h, [[0, "#141a3c"], [0.5, "#3a2b52"], [1, "#c8655a"], [2, "#a9cbe3"]]);
  const alt = renk(h, [[0, "#22264e"], [0.5, "#7a3f4c"], [1, "#ffb067"], [2, "#efe2c0"]]);
  const kan = D.kanlik || 0;
  const yildiz = cl(1 - h * 1.5);
  const gunes = cl((h - 0.85) / 1.1);
  return (
    <g>
      <defs>
        <linearGradient id="gk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ust} />
          <stop offset="0.62" stopColor={orta} />
          <stop offset="1" stopColor={alt} />
        </linearGradient>
        <radialGradient id="gkgunes">
          <stop offset="0" stopColor="#fff4d6" stopOpacity="1" />
          <stop offset="0.25" stopColor="#ffd28a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff9a4a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gkkan">
          <stop offset="0" stopColor="#ff5a1f" stopOpacity="0.75" />
          <stop offset="1" stopColor="#7a0f0a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-1200} y={-900} width={5200} height={2000} fill="url(#gk)" />
      {yildiz > 0.01 && (
        <g opacity={yildiz}>
          {Array.from({ length: 90 }).map((_, i) => (
            <circle key={i} cx={-600 + rnd(i, 1) * 3400} cy={-400 + rnd(i, 2) * 1150} r={1.4 + rnd(i, 3) * 2.2}
              fill="#fff" opacity={0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + rnd(i, 4)) + i))} />
          ))}
        </g>
      )}
      {/* ay */}
      {yildiz > 0.01 && (
        <g opacity={yildiz} transform={`translate(${250 + t * 2} 120)`}>
          <circle r={130} fill="#fff6dc" opacity={0.08} />
          <circle r={46} fill="#f4ecd2" />
          <circle cx={16} cy={-8} r={42} fill={ust} />
        </g>
      )}
      {/* güneş surların arkasından doğar */}
      {gunes > 0.001 && (
        <g transform={`translate(${880} ${lerp(1060, 330, easeOut(gunes))})`}>
          <circle r={520} fill="url(#gkgunes)" opacity={0.9} />
          <circle r={70} fill="#fff1c9" opacity={0.95} />
        </g>
      )}
      {kan > 0.01 && <ellipse cx={700} cy={1000} rx={1700} ry={700} fill="url(#gkkan)" opacity={kan} />}
      {/* bulutlar */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = ((-700 + rnd(i, 5) * 3600 + t * (8 + rnd(i, 6) * 10)) % 3600) - 700;
        const y = 80 + rnd(i, 7) * 560;
        const s = 0.7 + rnd(i, 8) * 1.1;
        const c = renk(h, [[0, "#1d2346"], [0.5, "#4a3556"], [1, "#e58a6a"], [2, "#ffffff"]]);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.55}>
            <ellipse cx={0} cy={0} rx={150} ry={26} fill={c} />
            <ellipse cx={60} cy={-14} rx={90} ry={24} fill={c} />
            <ellipse cx={-50} cy={-8} rx={70} ry={18} fill={c} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- ŞEHİR (ufuk)
const EV = Array.from({ length: 46 }).map((_, i) => ({ x: -500 + i * 46 + rnd(i, 1) * 20, w: 34 + rnd(i, 2) * 30, hh: 30 + rnd(i, 3) * 60, cati: rnd(i, 4) }));

/** Ayasofya — kubbe, yarım kubbeler, payandalar; 1453'te minaresi yoktu */
export const Ayasofya: React.FC<{ x: number; y: number; c: string; isik: number; t: number; s?: number }> = ({ x, y, c, isik, t, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-70} width={300} height={70} fill={c} />
    <rect x={-112} y={-150} width={34} height={150} fill={c} />
    <rect x={78} y={-150} width={34} height={150} fill={c} />
    <path d="M -190 -40 A 70 46 0 0 1 -60 -60 L -60 0 L -190 0 Z" fill={c} />
    <path d="M 190 -40 A 70 46 0 0 0 60 -60 L 60 0 L 190 0 Z" fill={c} />
    <rect x={-84} y={-150} width={168} height={40} fill={c} />
    <path d="M -96 -150 A 96 78 0 0 1 96 -150 Z" fill={c} />
    <rect x={-4} y={-246} width={8} height={18} fill={c} />
    {/* kubbe kasnağı pencereleri — son ayinde mum ışığı */}
    {Array.from({ length: 9 }).map((_, i) => {
      const fl = 0.75 + 0.25 * Math.sin(t * 9 + i * 1.7);
      return <rect key={i} x={-76 + i * 18} y={-142} width={8} height={22} rx={4} fill={isik > 0.01 ? "#ffc861" : "#000"} opacity={isik > 0.01 ? isik * fl : 0.25} />;
    })}
    {Array.from({ length: 5 }).map((_, i) => {
      const fl = 0.7 + 0.3 * Math.sin(t * 7 + i * 2.3);
      return <rect key={"a" + i} x={-60 + i * 28} y={-58} width={12} height={30} rx={6} fill={isik > 0.01 ? "#ffb54a" : "#000"} opacity={isik > 0.01 ? isik * fl : 0.2} />;
    })}
    {isik > 0.01 && (
      <g>
        <defs>
          <radialGradient id="ayinisik">
            <stop offset="0" stopColor="#ffc861" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffb54a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={0} cy={-100} rx={300} ry={210} fill="url(#ayinisik)" opacity={isik} />
      </g>
    )}
  </g>
);

/** Çan kulesi — çan sallanır */
const CanKulesi: React.FC<{ x: number; y: number; c: string; can: number; t: number; ph?: number }> = ({ x, y, c, can, t, ph = 0 }) => {
  const a = can * 28 * Math.sin(t * 6.2 + ph);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-18} y={-150} width={36} height={150} fill={c} />
      <path d="M -24 -150 L 0 -186 L 24 -150 Z" fill={c} />
      <rect x={-11} y={-140} width={22} height={34} fill="#000" opacity={0.35} />
      <g transform={`rotate(${a} 0 -140)`}>
        <path d="M -9 -116 Q -9 -134 0 -136 Q 9 -134 9 -116 Z" fill={can > 0.01 ? ALTIN : c} />
      </g>
      {can > 0.01 && [0, 1].map((k) => {
        const u = ((t * 1.6 + k * 0.5) % 1);
        return <circle key={k} cx={0} cy={-125} r={20 + u * 90} fill="none" stroke={ALTIN} strokeWidth={3} opacity={(1 - u) * 0.6 * can} />;
      })}
    </g>
  );
};

/** Büyük Saray (harap) — kemerli cephe; beyit sahnesinde içi görünür */
export const Saray: React.FC<{ x: number; y: number; c: string; ag: number; t: number }> = ({ x, y, c, ag, t }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-120} y={-80} width={240} height={80} fill={c} />
    <path d="M -120 -80 L -100 -96 L -60 -84 L -30 -100 L 20 -86 L 60 -98 L 120 -80 Z" fill={c} />
    {[-80, -40, 0, 40, 80].map((k, i) => (
      <path key={i} d={`M ${k - 14} 0 L ${k - 14} -40 A 14 14 0 0 1 ${k + 14} -40 L ${k + 14} 0 Z`} fill="#000" opacity={0.42} />
    ))}
    {/* orta kemerde yırtık perde + örümcek ağı */}
    <g transform="translate(0 -4)">
      <path d={`M -12 -40 Q ${-6 + Math.sin(t * 1.3) * 1.2} -20 -10 0 L -4 0 Q -2 -22 -6 -40 Z`} fill={KAN} opacity={0.85} />
      <path d={`M 12 -40 Q ${7 + Math.sin(t * 1.1 + 1) * 1.2} -18 9 -4 L 4 -6 Q 4 -24 6 -40 Z`} fill={KAN} opacity={0.7} />
      {ag > 0.01 && <Ag cx={0} cy={-30} r={15} k={ag} t={t} />}
    </g>
  </g>
);

/** Örümcek ağı — kendini çizer */
export const Ag: React.FC<{ cx: number; cy: number; r: number; k: number; t: number }> = ({ cx, cy, r, k, t }) => {
  const kol = 9;
  const tel = cl(k * 1.6);
  const halka = cl(k * 1.6 - 0.5);
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${Math.sin(t * 0.9) * 2})`} stroke="#f2ecdc" fill="none" strokeLinecap="round">
      {Array.from({ length: kol }).map((_, i) => {
        const a = (i / kol) * Math.PI * 2;
        return <line key={i} x1={0} y1={0} x2={Math.cos(a) * r * tel} y2={Math.sin(a) * r * tel} strokeWidth={r * 0.025} opacity={0.85} />;
      })}
      {Array.from({ length: 6 }).map((_, j) => {
        const rr = (r * (j + 1)) / 6.5;
        if ((j + 1) / 6 > halka) return null;
        const pts = Array.from({ length: kol + 1 }).map((_, i) => {
          const a = (i / kol) * Math.PI * 2;
          return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
        });
        return <polyline key={j} points={pts.join(" ")} strokeWidth={r * 0.018} opacity={0.75} />;
      })}
      {k > 0.8 && <circle cx={r * 0.18} cy={r * 0.12 + Math.sin(t * 2) * r * 0.03} r={r * 0.07} fill="#1b1b1b" stroke="none" />}
    </g>
  );
};

export const Sehir: React.FC<{ D: Dunya }> = ({ D }) => {
  const { h, t } = D;
  // atmosfer perspektifi: uzaktaki şehir surlardan biraz açık
  const c = renk(h, [[0, "#1d1f3d"], [0.5, "#2c2443"], [1, "#5a3b4a"], [2, "#b9a98d"]]);
  const cKoyu = renk(h, [[0, "#181834"], [0.5, "#241d39"], [1, "#4a3040"], [2, "#a4937a"]]);
  return (
    <g>
      {EV.map((e, i) => (
        <g key={i} transform={`translate(${e.x} 1012)`}>
          <rect x={0} y={-e.hh} width={e.w} height={e.hh} fill={i % 2 ? c : cKoyu} />
          {e.cati > 0.55 ? (
            <path d={`M 0 ${-e.hh} A ${e.w / 2} ${e.w / 2.4} 0 0 1 ${e.w} ${-e.hh} Z`} fill={i % 2 ? c : cKoyu} />
          ) : (
            <path d={`M -4 ${-e.hh} L ${e.w / 2} ${-e.hh - 22} L ${e.w + 4} ${-e.hh} Z`} fill={i % 2 ? c : cKoyu} />
          )}
          {h < 0.9 && rnd(i, 9) > 0.6 && <rect x={e.w * 0.4} y={-e.hh * 0.6} width={6} height={9} fill="#ffcf73" opacity={0.7 * (1 - h)} />}
        </g>
      ))}
      {/* serviler */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = -400 + rnd(i, 11) * 1900;
        return <ellipse key={i} cx={x} cy={990} rx={9} ry={40 + rnd(i, 12) * 26} fill={cKoyu} />;
      })}
      <CanKulesi x={380} y={1012} c={cKoyu} can={D.can || 0} t={t} />
      <CanKulesi x={1210} y={1012} c={cKoyu} can={D.can || 0} t={t} ph={1.3} />
      <CanKulesi x={-120} y={1012} c={cKoyu} can={D.can || 0} t={t} ph={2.1} />
      <Saray x={1010} y={1012} c={cKoyu} ag={D.ag || 0} t={t} />
      <Ayasofya x={720} y={1012} c={cKoyu} isik={D.ayin || 0} t={t} />
      {/* Haliç ve Galata */}
      <Halic D={D} />
    </g>
  );
};

const Halic: React.FC<{ D: Dunya }> = ({ D }) => {
  const { h, t } = D;
  const su = renk(h, [[0, "#0f1838"], [0.5, "#2a2a52"], [1, "#d07a5e"], [2, "#5f9cc4"]]);
  const tepe = renk(h, [[0, "#141631"], [0.5, "#231d38"], [1, "#4a3040"], [2, "#9b8b70"]]);
  return (
    <g>
      <path d="M 1440 1012 L 2900 1012 L 2900 1080 L 1500 1080 Z" fill={su} />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = 1500 + ((rnd(i, 1) * 1400 + t * 12) % 1400);
        return <line key={i} x1={x} y1={1020 + rnd(i, 2) * 50} x2={x + 26} y2={1020 + rnd(i, 2) * 50} stroke="#fff" strokeWidth={2} opacity={0.18} />;
      })}
      {/* Galata yakası ve kulesi */}
      <path d="M 2050 1012 Q 2300 900 2600 930 L 2900 960 L 2900 1012 Z" fill={tepe} />
      <g transform="translate(2360 935)">
        <rect x={-14} y={-90} width={28} height={90} fill={tepe} />
        <path d="M -18 -90 L 0 -128 L 18 -90 Z" fill={tepe} />
      </g>
      {/* Haliç zinciri */}
      <path d={`M 2050 1046 Q 2200 ${1060 + Math.sin(t) * 3} 2380 1046`} stroke="#000" strokeWidth={3} fill="none" opacity={0.5} strokeDasharray="6 5" />
    </g>
  );
};

// ---------------------------------------------------------------- SURLAR
const KULE = Array.from({ length: 13 }).map((_, i) => -420 + i * 160);
export const HEDEF = { x: 700, y: 1080 }; // ana gedik (Topkapı civarı)
const GEDIK_X = [380, 1020, 220, 860];

export const Surlar: React.FC<{ D: Dunya }> = ({ D }) => {
  const { h, t } = D;
  const tas = renk(h, [[0, "#12121f"], [0.5, "#1c1828"], [1, "#3a2a32"], [1.35, "#6d5848"], [2, "#b8a586"]]);
  const golge = renk(h, [[0, "#0b0b14"], [0.5, "#120f1a"], [1, "#2a1d24"], [1.35, "#4d3d33"], [2, "#8d7b62"]]);
  const kenar = renk(h, [[0, "#2a2a44"], [1, "#ff9a5a"], [1.4, "#ffcf8a"], [2, "#e8d8b0"]]); // ters ışık kenarı
  const hasar = D.hasar || 0;
  const onarim = D.onarim || 0;
  const ged = D.gedikler || 0;
  const mazgal = (x0: number, x1: number, y: number, s = 16) => {
    const out: React.ReactNode[] = [];
    for (let x = x0; x < x1; x += s * 1.8) out.push(<rect key={x} x={x} y={y - s} width={s} height={s} fill={tas} />);
    return out;
  };
  return (
    <g>
      {/* iç sur */}
      <rect x={-700} y={1030} width={2150} height={100} fill={tas} />
      <rect x={-700} y={1028} width={2150} height={4} fill={kenar} opacity={0.6} />
      {mazgal(-700, 1450, 1030)}
      {KULE.map((x, i) => (
        <g key={i}>
          <rect x={x - 36} y={986} width={72} height={144} fill={tas} />
          <rect x={x - 36} y={984} width={72} height={4} fill={kenar} opacity={0.7} />
          {mazgal(x - 36, x + 36, 986, 14)}
          <rect x={x - 6} y={1010} width={12} height={22} rx={6} fill="#000" opacity={0.5} />
          {D.h < 0.8 && i % 3 === 1 && <circle cx={x} cy={1000} r={5 + Math.sin(t * 8 + i) * 1.2} fill={KOR} opacity={0.85 * (1 - D.h)} />}
        </g>
      ))}
      {/* dış sur */}
      <rect x={-700} y={1120} width={2150} height={58} fill={golge} />
      {mazgal(-700, 1450, 1120, 12)}
      {KULE.map((x, i) => (
        <rect key={"d" + i} x={x + 50} y={1092} width={44} height={86} fill={golge} />
      ))}
      {/* hendek */}
      <rect x={-700} y={1186} width={2150} height={26} fill="#000" opacity={0.45} />
      {/* ana gedik */}
      {hasar > 0.01 && <Gedik x={HEDEF.x} y={1040} k={hasar} onarim={onarim} tas={tas} t={t} />}
      {GEDIK_X.slice(0, Math.floor(ged)).map((x, i) => (
        <Gedik key={i} x={x} y={1040} k={0.7} onarim={onarim} tas={tas} t={t} />
      ))}
      {/* sancaklar: Bizans kartalı iner, Osmanlı sancağı çıkar */}
      <Bayrak x={HEDEF.x + 160} y={986} renk={MOR} k={D.kartal ?? 1} t={t} />
      {(D.sancak || 0) > 0.01 && <Bayrak x={HEDEF.x} y={986} renk={KAN} k={D.sancak || 0} t={t} buyuk />}
      {(D.konstantin || 0) > 0.01 && <Konstantin x={HEDEF.x + 160} y={984} o={D.konstantin || 0} t={t} />}
    </g>
  );
};

const Gedik: React.FC<{ x: number; y: number; k: number; onarim: number; tas: string; t: number }> = ({ x, y, k, onarim, tas, t }) => {
  const w = 60 * k + 20;
  return (
    <g>
      {/* yıkık bölüm: gökyüzü rengine yakın koyu boşluk + moloz yığını */}
      <path d={`M ${x - w} ${y - 60} L ${x - w * 0.6} ${y - 10} L ${x - w * 0.2} ${y + 30 * k} L ${x + w * 0.3} ${y + 10} L ${x + w * 0.7} ${y + 40 * k} L ${x + w} ${y - 60} Z`} fill="#0a0810" opacity={0.75} />
      <path d={`M ${x - w * 1.3} ${y + 92} Q ${x} ${y + 30 - 30 * k} ${x + w * 1.3} ${y + 92} Z`} fill={tas} />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={x - w + rnd(i, 1) * w * 2} y={y + 60 + rnd(i, 2) * 30} width={8 + rnd(i, 3) * 14} height={6 + rnd(i, 4) * 10}
          fill={tas} transform={`rotate(${rnd(i, 5) * 60 - 30} ${x} ${y + 70})`} />
      ))}
      {/* gece onarımı: kalaslar ve toprak fıçıları */}
      {/* gece onarımı: sivri kazıklı çit + toprak dolu fıçılar (gediği kapatır) */}
      {onarim > 0.01 && Array.from({ length: Math.ceil((w * 1.6) / 11) }).map((_, i, A) => {
        const g = cl(onarim * A.length * 0.5 - i * 0.5);
        const xx = x - w * 0.8 + i * 11;
        const hh = 46 + rnd(i, 7) * 14;
        return <path key={i} d={`M ${xx} ${y + 40} L ${xx} ${y + 40 - hh * g} L ${xx + 4.5} ${y + 34 - hh * g} L ${xx + 9} ${y + 40 - hh * g} L ${xx + 9} ${y + 40} Z`} fill="#4a3220" stroke="#20140a" strokeWidth={1.5} />;
      })}
      {onarim > 0.3 && [-0.5, 0, 0.5].map((k, i) => (
        <ellipse key={"f" + i} cx={x + k * w} cy={y + 46} rx={12} ry={15} fill="#5a3c22" stroke="#20140a" strokeWidth={2} opacity={cl((onarim - 0.3) * 3)} />
      ))}
      {onarim > 0.5 && <circle cx={x} cy={y - 10} r={4 + Math.sin(t * 10) * 1} fill="#ffcf73" opacity={0.9} />}
    </g>
  );
};

/** Dalgalanan sancak */
export const Bayrak: React.FC<{ x: number; y: number; renk: string; k: number; t: number; buyuk?: boolean }> = ({ x, y, renk: r, k, t, buyuk }) => {
  const s = buyuk ? 1.5 : 1;
  const yuk = lerp(0, 1, k);
  const n = 8;
  const w = 70 * s, hh = 42 * s;
  const ust = Array.from({ length: n + 1 }).map((_, i) => `${(i / n) * w},${Math.sin(t * 6 - i * 0.8) * 5 * (i / n) * s}`);
  const alt = Array.from({ length: n + 1 }).map((_, i) => `${((n - i) / n) * w},${hh + Math.sin(t * 6 - (n - i) * 0.8) * 5 * ((n - i) / n) * s}`);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-2} y={-110 * s} width={4} height={110 * s} fill="#2a1f18" />
      <g transform={`translate(0 ${-110 * s + (1 - yuk) * 80 * s})`} opacity={cl(k * 4)}>
        <polygon points={[...ust, ...alt].join(" ")} fill={r} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- AÇIK ALAN + ORDUGÂH
export const Zemin: React.FC<{ D: Dunya }> = ({ D }) => {
  const { h } = D;
  const z1 = renk(h, [[0, "#141225"], [0.5, "#1f1a2c"], [1, "#4a3428"], [2, "#a8915f"]]);
  const z2 = renk(h, [[0, "#0d0c18"], [0.5, "#16121f"], [1, "#33241c"], [2, "#7d6a45"]]);
  const tepe = renk(h, [[0, "#131226"], [0.5, "#1d182b"], [1, "#3e2c27"], [2, "#958457"]]);
  return (
    <g>
      <defs>
        <linearGradient id="zm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={z1} />
          <stop offset="1" stopColor={z2} />
        </linearGradient>
      </defs>
      <rect x={-1200} y={1210} width={5200} height={1700} fill="url(#zm)" />
      {/* Galata sırtı: gemilerin aştığı tepe */}
      <path d="M 1440 1240 Q 1700 1060 2000 1090 Q 2300 1110 2900 1280 L 2900 1500 L 1440 1500 Z" fill={tepe} />
      <path d="M 1500 1080 Q 1580 1060 1700 1070 L 1700 1100 Z" fill={tepe} />
    </g>
  );
};

const CADIR = Array.from({ length: 56 }).map((_, i) => {
  const y = 1330 + Math.pow(rnd(i, 1), 1.3) * 1150;
  return { x: -500 + rnd(i, 2) * 2400, y, s: 0.5 + ((y - 1330) / 700) * 0.95, r: rnd(i, 3) };
}).sort((a, b) => a.y - b.y);

export const Cadirlar: React.FC<{ D: Dunya }> = ({ D }) => {
  const { h, t } = D;
  const ates = D.ates ?? 1;
  const kumas = renk(h, [[0, "#2a1c2a"], [0.5, "#3a2230"], [1, "#8a3a2e"], [2, "#d9c8a4"]]);
  const kumas2 = renk(h, [[0, "#3a1a1e"], [0.5, "#4a1f24"], [1, "#a8352a"], [2, "#b5332a"]]);
  return (
    <g>
      {CADIR.map((c, i) => {
        if (Math.abs(c.x - 560) < 180 && c.y > 1430 && c.y < 1760) return null; // topun yeri boş
        if (Math.abs(c.x - 1150) < 160 && c.y > 1560 && c.y < 1760) return null; // otağ yeri
        return (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <path d="M -70 0 L -50 -40 L 0 -90 L 50 -40 L 70 0 Z" fill={c.r > 0.5 ? kumas : kumas2} />
            <path d="M 0 -90 L 50 -40 L 70 0 L 20 0 Z" fill="#000" opacity={0.22} />
            <rect x={-1.5} y={-112} width={3} height={24} fill="#2a1f18" />
            <path d={`M 0 -112 L ${16 + Math.sin(t * 5 + i) * 3} -106 L 0 -100 Z`} fill={KAN} />
            <path d="M -10 0 L 0 -26 L 10 0 Z" fill="#000" opacity={0.5} />
          </g>
        );
      })}
      {/* kamp ateşleri */}
      {ates > 0.01 && CADIR.filter((_, i) => i % 2 === 0).map((c, i) => (
        <Ates key={i} x={c.x + 70 * c.s} y={c.y + 10} s={c.s * 0.9} t={t + i} o={ates * (h < 1.5 ? 1 : 0.5)} gece={cl(1.4 - h)} />
      ))}
    </g>
  );
};

export const Ates: React.FC<{ x: number; y: number; s?: number; t: number; o?: number; gece?: number }> = ({ x, y, s = 1, t, o = 1, gece = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <circle cx={0} cy={-14} r={90} fill={KOR} opacity={0.12 * gece} />
    <circle cx={0} cy={-14} r={40} fill={KOR} opacity={0.18 * gece} />
    {[0, 1, 2].map((k) => {
      const f = 1 + 0.18 * Math.sin(t * (11 + k * 3) + k);
      return <path key={k} d={`M ${-12 + k * 9} 0 Q ${-16 + k * 9} ${-20 * f} ${-4 + k * 9 + Math.sin(t * 7 + k) * 3} ${-36 * f} Q ${2 + k * 9} ${-18 * f} ${2 + k * 9} 0 Z`} fill={k === 1 ? "#ffd36b" : KOR} />;
    })}
    {/* kıvılcımlar */}
    {[0, 1, 2].map((k) => {
      const u = (t * 0.7 + k * 0.33) % 1;
      return <circle key={"k" + k} cx={Math.sin(k * 3 + t) * 10} cy={-30 - u * 80} r={2.2} fill="#ffd36b" opacity={1 - u} />;
    })}
  </g>
);

/** Asker sıraları — mızrak ormanı; ters ışıkta siluet */
export const Ordu: React.FC<{ D: Dunya }> = ({ D }) => {
  const { h, t } = D;
  const o = D.ordu || 0;
  if (o < 0.01) return null;
  const c = renk(h, [[0, "#0c0a14"], [1, "#1e1418"], [2, "#3b2a20"]]);
  const kenar = renk(h, [[0, "#3a3a5a"], [1, "#ffb067"], [2, "#ffe0a8"]]);
  const sira = [1300, 1345, 1395];
  return (
    <g opacity={cl(o * 1.4)}>
      {sira.map((y, si) => {
        const s = 0.55 + si * 0.18;
        const n = 46 - si * 8;
        return (
          <g key={si}>
            {Array.from({ length: n }).map((_, i) => {
              const gor = cl(o * 1.6 - (Math.abs(i - n / 2) / n) * 0.9 - si * 0.12);
              if (gor < 0.02) return null;
              const x = -500 + (i / n) * 2000 + rnd(i, si) * 14;
              const nf = Math.sin(t * 1.6 + i * 0.7) * 1.2;
              return (
                <g key={i} transform={`translate(${x} ${y + nf}) scale(${s})`} opacity={gor}>
                  <rect x={-1.5} y={-96} width={3} height={96} fill={c} />
                  <path d="M -4 -96 L 0 -110 L 4 -96 Z" fill={kenar} />
                  <circle cx={-10} cy={-48} r={9} fill={c} />
                  <path d="M -9 -46 Q -9 -62 -10 -64 Q 2 -66 4 -46 L 6 0 L -12 0 Z" fill={c} />
                  <ellipse cx={-10} cy={-66} rx={9} ry={7} fill={c} />
                  <rect x={-10} y={-74} width={2} height={4} fill={kenar} opacity={0.6} />
                </g>
              );
            })}
          </g>
        );
      })}
      {/* sancaklar */}
      {[-260, 120, 460, 900, 1240].map((x, i) => (
        <Bayrak key={i} x={x} y={1330} renk={i % 2 ? "#2f6b3a" : KAN} k={cl(o * 2 - 0.4)} t={t + i} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- KARAKTERLER (siluet, saygılı)
export const Sultan: React.FC<{ x: number; y: number; s?: number; t: number; o?: number; kenar?: string }> = ({ x, y, s = 1, t, o = 1, kenar = "#ffb067" }) => {
  const nf = Math.sin(t * 1.4) * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {/* beyaz at */}
      <g>
        <path d={`M -70 -60 Q -40 -80 30 -74 L 60 -96 Q 72 -104 80 -94 L 84 -70 Q 78 -64 70 -68 L 52 -60 Q 50 -40 36 -32 L -50 -30 Q -74 -36 -70 -60 Z`} fill="#e9e2d2" />
        {[-58, -40, 18, 36].map((lx, i) => (
          <rect key={i} x={lx} y={-34} width={7} height={34 + (i % 2 ? Math.sin(t * 2) * 1 : 0)} fill="#e9e2d2" />
        ))}
        <path d={`M -70 -58 Q -92 -40 -86 ${-20 + nf}`} stroke="#d9d0bd" strokeWidth={7} fill="none" />
        <path d="M 58 -96 L 66 -110 L 70 -96 Z" fill="#e9e2d2" />
        <path d="M 30 -74 L 46 -86 L 52 -60 Z" fill="#cfc4ad" />
      </g>
      {/* binici: kırmızı kaftan, büyük beyaz kavuk */}
      <path d={`M -16 -74 L -24 -128 Q -6 -144 12 -128 L 8 -74 Z`} fill={KAN} />
      <path d="M -24 -78 L -30 -52 L -10 -60 Z" fill={KAN} />
      <circle cx={-6} cy={-148} r={12} fill="#c9a07a" />
      <ellipse cx={-6} cy={-166} rx={20} ry={17} fill="#f4efe2" />
      <rect x={-8} y={-188} width={4} height={8} fill={ALTIN} />
      <path d="M -24 -128 Q -6 -144 12 -128" stroke={kenar} strokeWidth={2} fill="none" opacity={0.8} />
    </g>
  );
};

export const Urban: React.FC<{ x: number; y: number; s?: number; t: number; o?: number; yuru?: number; flip?: boolean }> = ({ x, y, s = 1, t, o = 1, yuru = 0, flip }) => {
  const ad = yuru ? Math.sin(t * 9) * 10 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={o}>
      <path d={`M -8 0 L ${-6 + ad * 0.4} -50 L 0 -50 Z`} fill="#2b2420" />
      <path d={`M 8 0 L ${6 - ad * 0.4} -50 L 0 -50 Z`} fill="#2b2420" />
      <path d="M -20 -48 L -16 -112 Q 0 -122 16 -112 L 20 -48 Z" fill="#5a3d26" />
      <path d="M -12 -100 L -10 -50 L 10 -50 L 12 -100 Z" fill="#8a6a46" opacity={0.9} />
      <circle cx={0} cy={-130} r={14} fill="#d8b08a" />
      <path d="M -12 -126 Q 0 -100 12 -126 L 10 -118 Q 0 -108 -10 -118 Z" fill="#6e5a48" />
      <path d="M -16 -136 Q 0 -160 18 -136 Z" fill="#3a2a20" />
      <path d={`M 16 -104 L ${30 + ad * 0.3} -76`} stroke="#5a3d26" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

export const Konstantin: React.FC<{ x: number; y: number; o: number; t: number; s?: number }> = ({ x, y, o, t, s = 0.42 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d={`M -26 0 L -20 -90 Q 0 -104 20 -90 L 26 0 Z`} fill={MOR} />
    <path d={`M 20 -90 Q ${46 + Math.sin(t * 3) * 6} -50 ${40 + Math.sin(t * 3) * 8} 0 L 22 0 Z`} fill={MOR} opacity={0.8} />
    <circle cx={0} cy={-108} r={13} fill="#d8b08a" />
    <path d="M -14 -118 L -14 -132 L -7 -124 L 0 -136 L 7 -124 L 14 -132 L 14 -118 Z" fill={ALTIN} />
    <rect x={26} y={-130} width={3} height={130} fill="#b9b9c9" />
  </g>
);

// ---------------------------------------------------------------- BÜYÜK TOP
export const TOP = { x: 330, y: 1640, ag: -24 }; // kuyruk noktası, açı (derece)
export const NAMLU = (() => {
  const a = (TOP.ag * Math.PI) / 180;
  return { x: TOP.x + Math.cos(a) * 425, y: TOP.y + Math.sin(a) * 425 };
})();

export const Top: React.FC<{ D: Dunya; geri?: number }> = ({ D, geri = 0 }) => {
  const { h, t } = D;
  const koyu = renk(h, [[0, "#1e150c"], [0.5, "#2a1c10"], [1, "#5a3a1a"], [2, "#6e4a22"]]);
  const orta = renk(h, [[0, "#4a3418"], [0.5, "#5a3e1e"], [1, "#a8743a"], [2, "#c08a48"]]);
  const parla = renk(h, [[0, "#8a6a3a"], [0.5, "#a07a44"], [1, "#ffd08a"], [2, "#f8e0a8"]]);
  const tahta = renk(h, [[0, "#1c120a"], [1, "#4a2e18"], [2, "#6a4628"]]);
  const tahta2 = renk(h, [[0, "#2a1c10"], [1, "#6a4426"], [2, "#8a5e36"]]);
  const tas = renk(h, [[0, "#2a2a30"], [1, "#6a5e56"], [2, "#a49a8c"]]);
  return (
    <g transform={`translate(${TOP.x - geri * 26} ${TOP.y}) `}>
      <defs>
        <linearGradient id="namlu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={koyu} />
          <stop offset="0.28" stopColor={parla} />
          <stop offset="0.45" stopColor={orta} />
          <stop offset="1" stopColor={koyu} />
        </linearGradient>
        <radialGradient id="gulle" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor={parla} stopOpacity="0.5" />
          <stop offset="0.25" stopColor={tas} />
          <stop offset="1" stopColor="#0e0c0a" />
        </radialGradient>
      </defs>
      {/* ağır kızak: kalaslar + kazıklar */}
      <g transform={`rotate(${TOP.ag})`}>
        <rect x={-80} y={40} width={520} height={34} fill={tahta} />
        <rect x={-80} y={40} width={520} height={8} fill={tahta2} />
        {[-60, 60, 180, 300, 400].map((x, i) => <rect key={i} x={x} y={36} width={16} height={60} fill={tahta2} stroke={tahta} strokeWidth={3} />)}
      </g>
      <path d="M -120 110 L 30 60 L 60 110 Z" fill={tahta} />
      <path d="M 260 -40 L 330 -60 L 360 30 L 300 40 Z" fill={tahta} />
      <g transform={`rotate(${TOP.ag})`}>
        {/* kuyruk (dip) */}
        <ellipse cx={-34} cy={0} rx={30} ry={40} fill="url(#namlu)" />
        <circle cx={-66} cy={0} r={12} fill={orta} />
        {/* gövde: hafif konik silindir */}
        <path d="M -34 -40 L 380 -50 L 380 50 L -34 40 Z" fill="url(#namlu)" />
        {/* takviye halkaları */}
        {[20, 110, 200, 290].map((x, i) => (
          <g key={i}>
            <rect x={x} y={-47 - i * 0.4} width={18} height={94 + i * 0.8} rx={4} fill="url(#namlu)" stroke={koyu} strokeWidth={2} />
            <rect x={x + 2} y={-40} width={4} height={60} fill={parla} opacity={0.35} />
          </g>
        ))}
        {/* ağız: genişleyen çan + karanlık namlu deliği */}
        <path d="M 380 -50 L 420 -64 L 420 64 L 380 50 Z" fill="url(#namlu)" />
        <ellipse cx={420} cy={0} rx={16} ry={64} fill={orta} />
        <ellipse cx={421} cy={0} rx={11} ry={44} fill="#0a0806" />
        {/* fitil deliği */}
        <circle cx={-6} cy={-36} r={5} fill="#000" opacity={0.7} />
        {(D.fitil ?? -1) >= 0 && (D.fitil ?? 0) < 1 && <Fitil k={D.fitil || 0} t={t} />}
      </g>
      {/* yanındaki taş gülle yığını */}
      {[[-130, 120], [-70, 126], [-100, 82], [-10, 132]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={34} fill="url(#gulle)" />
      ))}
    </g>
  );
};

const FP = (u: number) => [-6 - 120 * (1 - u) + Math.sin(u * 9) * 14, -30 - 70 * (1 - u) * (1 - u)];
/** fitil kıvılcımının dünya koordinatı (yakın plan kamerası için) */
export const fitilDunya = (u: number) => {
  const [x, y] = FP(u);
  const a = (TOP.ag * Math.PI) / 180;
  return { x: TOP.x + x * Math.cos(a) - y * Math.sin(a), y: TOP.y + x * Math.sin(a) + y * Math.cos(a) };
};
const Fitil: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  // fitil eğrisi: kıvrılarak namlu deliğine gider; kıvılcım yol boyunca ilerler
  const P = FP;
  const pts = Array.from({ length: 30 }).map((_, i) => P(i / 29));
  const [sx, sy] = P(k);
  const yanan = pts.filter((_, i) => i / 29 >= k);
  return (
    <g>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#1a120c" strokeWidth={4} opacity={0.35} />
      <polyline points={yanan.map((p) => p.join(",")).join(" ")} fill="none" stroke="#1a120c" strokeWidth={4} />
      <circle cx={sx} cy={sy} r={22} fill={KOR} opacity={0.25} />
      <circle cx={sx} cy={sy} r={7 + Math.sin(t * 40) * 2} fill="#fff1b0" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = t * 13 + i * 1.1;
        const r = 10 + ((t * 30 + i * 7) % 18);
        return <circle key={i} cx={sx + Math.cos(a) * r} cy={sy + Math.sin(a) * r - 4} r={2} fill="#ffd36b" />;
      })}
    </g>
  );
};

/** Namlu ateşi + duman + gülle uçuşu + çarpma tozu (atış anından itibaren u saniye) */
export const Atis: React.FC<{ u: number; t: number; hedef?: { x: number; y: number }; sadece?: "namlu" | "carpma" }> = ({ u, t, hedef = HEDEF, sadece }) => {
  if (u < 0 || u > 6) return null;
  const namluVar = sadece !== "carpma", carpVar = sadece !== "namlu";
  const n = NAMLU;
  const ucus = cl(u / 0.55);
  const bx = lerp(n.x, hedef.x, ucus);
  const by = lerp(n.y, hedef.y, ucus) - Math.sin(ucus * Math.PI) * 120;
  const carp = u - 0.55;
  return (
    <g>
      {/* namlu alevi */}
      {namluVar && u < 0.35 && (
        <g transform={`translate(${n.x} ${n.y}) rotate(${TOP.ag})`} opacity={1 - u / 0.35}>
          <ellipse cx={90} cy={0} rx={160} ry={70} fill="#fff1b0" />
          <ellipse cx={60} cy={0} rx={110} ry={50} fill="#ffd36b" />
          <ellipse cx={30} cy={0} rx={60} ry={34} fill="#fff" />
        </g>
      )}
      {/* namlu dumanı */}
      {namluVar && Array.from({ length: 14 }).map((_, i) => {
        const k = cl(u * 1.2 - i * 0.03);
        const a = ((TOP.ag + (rnd(i, 1) - 0.5) * 60) * Math.PI) / 180;
        const d = 40 + k * (120 + rnd(i, 2) * 220);
        return <circle key={i} cx={n.x + Math.cos(a) * d} cy={n.y + Math.sin(a) * d - k * 60} r={50 + k * (110 + rnd(i, 3) * 90)}
          fill="url(#duman)" opacity={(1 - cl(u / 5)) * 0.55} />;
      })}
      {/* gülle */}
      {namluVar && carpVar && ucus < 1 && (
        <g>
          <line x1={lerp(n.x, bx, 0.6)} y1={lerp(n.y, by, 0.6)} x2={bx} y2={by} stroke="#fff1b0" strokeWidth={10} opacity={0.5} strokeLinecap="round" />
          <circle cx={bx} cy={by} r={18} fill="#3a342e" />
        </g>
      )}
      {/* çarpma: flaş, taş parçaları, toz */}
      {carpVar && carp > 0 && (
        <g>
          {carp < 0.2 && <circle cx={hedef.x} cy={hedef.y} r={40 + carp * 500} fill="#fff4d0" opacity={(1 - carp / 0.2) * 0.9} />}
          {Array.from({ length: 16 }).map((_, i) => {
            const a = -Math.PI * (0.1 + rnd(i, 4) * 0.8);
            const v = 220 + rnd(i, 5) * 420;
            const x = hedef.x + Math.cos(a) * v * carp;
            const y = hedef.y + Math.sin(a) * v * carp + 520 * carp * carp;
            return carp < 1.6 ? <rect key={i} x={x} y={y} width={10 + rnd(i, 6) * 16} height={8 + rnd(i, 7) * 12} fill="#5a4a3e" transform={`rotate(${carp * 400 * (rnd(i, 8) - 0.5)} ${x} ${y})`} /> : null;
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const k = cl(carp * 0.8 - i * 0.02);
            return <circle key={"t" + i} cx={hedef.x + (rnd(i, 9) - 0.5) * 260 * k} cy={hedef.y - k * (40 + rnd(i, 10) * 120)} r={60 + k * 220}
              fill="url(#duman)" opacity={(1 - cl(carp / 5)) * 0.6} />;
          })}
        </g>
      )}
    </g>
  );
};

/** Toz bulutu — ordu bunun içinden görünür */
export const TozBulutu: React.FC<{ k: number; t: number; h: number }> = ({ k, t, h }) => {
  if (k < 0.01) return null;
  const c = renk(h, [[0, "#3a3346"], [1, "#d8a77a"], [2, "#e8d6b4"]]);
  return (
    <g opacity={k}>
      {Array.from({ length: 22 }).map((_, i) => (
        <circle key={i} cx={-500 + rnd(i, 1) * 2100 + Math.sin(t * 0.4 + i) * 30} cy={1260 + rnd(i, 2) * 160 - t * 6} r={110 + rnd(i, 3) * 120} fill={c} opacity={0.5} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- GEMİLER (karadan)
export const GEMI_YOL = (u: number): [number, number, number] => {
  // sağ alttan tepeye tırmanır, tepeden Haliç'e iner; açı = eğim
  const P = [[2700, 1420], [2300, 1200], [1980, 1090], [1700, 1060], [1560, 1040]];
  const seg = Math.min(P.length - 2, Math.floor(u * (P.length - 1)));
  const k = u * (P.length - 1) - seg;
  const [x0, y0] = P[seg], [x1, y1] = P[seg + 1];
  return [lerp(x0, x1, k), lerp(y0, y1, k), (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI + 180];
};

export const Gemi: React.FC<{ x: number; y: number; ac: number; s?: number; t: number; c: string; yelken: string }> = ({ x, y, ac, s = 1, t, c, yelken }) => (
  <g transform={`translate(${x} ${y}) rotate(${ac}) scale(-${s} ${s})`}>
    <path d="M -90 -10 L 90 -10 L 70 14 L -76 14 Z" fill={c} />
    {Array.from({ length: 9 }).map((_, i) => (
      <line key={i} x1={-60 + i * 15} y1={4} x2={-66 + i * 15 + Math.sin(t * 4 + i) * 4} y2={26} stroke={c} strokeWidth={2.5} />
    ))}
    <rect x={-2} y={-90} width={4} height={80} fill={c} />
    <path d={`M 0 -92 L ${58 + Math.sin(t * 2) * 3} -24 L -6 -18 Z`} fill={yelken} />
    <path d={`M 2 -98 L ${14 + Math.sin(t * 5) * 3} -94 L 2 -90 Z`} fill={KAN} />
  </g>
);

export const Gemiler: React.FC<{ D: Dunya }> = ({ D }) => {
  const g = D.gemi ?? -1;
  if (g < 0) return null;
  const c = renk(D.h, [[0, "#0e0c16"], [1, "#2a1c18"], [2, "#4a3422"]]);
  const yelken = renk(D.h, [[0, "#3a3550"], [1, "#e0b48a"], [2, "#efe4cc"]]);
  return (
    <g>
      {/* yağlanmış kızak kütükleri */}
      {Array.from({ length: 22 }).map((_, i) => {
        const [x, y] = GEMI_YOL(i / 21);
        return <rect key={i} x={x - 40} y={y + 22} width={80} height={9} rx={4} fill="#5a3a22" opacity={0.9} />;
      })}
      {[0, 1, 2, 3].map((i) => {
        const u = cl(g * 1.35 - i * 0.12);
        const [x, y, a] = GEMI_YOL(u);
        const s = lerp(2.1, 1.35, u);
        return (
          <g key={i}>
            <Gemi x={x} y={y + (u >= 0.999 ? Math.sin(D.t * 2 + i) * 2 : 0)} ac={u >= 0.999 ? 180 : a} s={s} t={D.t + i} c={c} yelken={yelken} />
            {/* ip çeken askerler ve meşaleler */}
            {u > 0.02 && u < 0.98 && [0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={x - 60 - k * 22} y={y - 6 + k * 6} width={6} height={24} fill={c} />
                <circle cx={x - 57 - k * 22} cy={y - 12 + k * 6} r={6} fill={c} />
              </g>
            ))}
            {u > 0.02 && u < 0.98 && <Ates x={x + 90} y={y + 4} s={0.35} t={D.t * 1.3 + i} gece={1} />}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- SON SALDIRI
export const Saldiri: React.FC<{ D: Dunya }> = ({ D }) => {
  const k = D.saldiri || 0;
  if (k < 0.01) return null;
  const { t } = D;
  return (
    <g>
      {/* surlara dayanan merdivenler */}
      {[180, 420, 600, 820, 1060].map((x, i) => {
        const g = cl(k * 3 - i * 0.25);
        return (
          <g key={i} opacity={g} transform={`rotate(${lerp(-40, -8, g)} ${x} 1210)`}>
            <line x1={x - 12} y1={1210} x2={x - 12} y2={1040} stroke="#3a2614" strokeWidth={5} />
            <line x1={x + 12} y1={1210} x2={x + 12} y2={1040} stroke="#3a2614" strokeWidth={5} />
            {Array.from({ length: 7 }).map((_, j) => <line key={j} x1={x - 12} x2={x + 12} y1={1200 - j * 24} y2={1200 - j * 24} stroke="#3a2614" strokeWidth={4} />)}
          </g>
        );
      })}
      {/* meşale dalgası: alttan surlara akar */}
      {Array.from({ length: 70 }).map((_, i) => {
        const hiz = 0.15 + rnd(i, 1) * 0.12;
        const u = cl(k * 1.2 - rnd(i, 2) * 0.4);
        const x = -400 + rnd(i, 3) * 1900 + Math.sin(t * 3 + i) * 6;
        const y = lerp(1600 + rnd(i, 4) * 300, 1200 + rnd(i, 5) * 40, cl(u + ((t * hiz) % 0.2)));
        return (
          <g key={i} opacity={u > 0 ? 1 : 0}>
            <circle cx={x} cy={y} r={16} fill={KOR} opacity={0.25} />
            <circle cx={x} cy={y} r={5 + Math.sin(t * 15 + i) * 1.5} fill="#ffd36b" />
          </g>
        );
      })}
      {/* ok yağmuru */}
      {Array.from({ length: 24 }).map((_, i) => {
        const u = (t * 0.9 + rnd(i, 6)) % 1;
        const x = 1300 - u * 1500 + rnd(i, 7) * 400;
        const y = 1250 - Math.sin(u * Math.PI) * 300 - rnd(i, 8) * 100;
        return <line key={"o" + i} x1={x} y1={y} x2={x + 26} y2={y + 6} stroke="#fff3c4" strokeWidth={2} opacity={0.6 * k} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- KÖS (davul) — ordugâhta
export const Kos: React.FC<{ x: number; y: number; s?: number; vur: number; t: number; h: number }> = ({ x, y, s = 1, vur, t, h }) => {
  const c = renk(h, [[0, "#3a1a10"], [1, "#7a3a1c"], [2, "#8a4a24"]]);
  const sop = Math.sin(t * Math.PI * 2 * 1.6) * 0.5 + 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -70 0 Q -70 60 0 70 Q 70 60 70 0 Z" fill={c} />
      <ellipse cx={0} cy={0} rx={70} ry={20} fill="#d9c49a" />
      <ellipse cx={0} cy={0} rx={70} ry={20} fill="#fff" opacity={vur * (1 - sop) * 0.5} />
      <line x1={-40} y1={-80 + sop * 60} x2={-10} y2={-6 + sop * 6} stroke="#5a3a22" strokeWidth={7} strokeLinecap="round" />
      <line x1={40} y1={-20 - sop * 60} x2={14} y2={-6} stroke="#5a3a22" strokeWidth={7} strokeLinecap="round" />
      {vur > 0 && [0, 1].map((k) => {
        const u = (t * 1.6 + k * 0.5) % 1;
        return <ellipse key={k} cx={0} cy={0} rx={70 + u * 160} ry={20 + u * 50} fill="none" stroke="#ffd9a0" strokeWidth={3} opacity={(1 - u) * 0.5 * vur} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- KUŞLAR (sessizlik)
export const Kuslar: React.FC<{ u: number }> = ({ u }) => {
  if (u < 0 || u > 4) return null;
  return (
    <g>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = 300 + rnd(i, 1) * 900 + u * (120 + rnd(i, 2) * 260) * (rnd(i, 3) > 0.5 ? 1 : -1);
        const y = 985 - u * (180 + rnd(i, 4) * 300);
        const k = Math.sin(u * 18 + i) * 7;
        return <path key={i} d={`M ${x - 10} ${y + k} Q ${x - 4} ${y - 2} ${x} ${y} Q ${x + 4} ${y - 2} ${x + 10} ${y + k}`} stroke="#0c0a12" strokeWidth={3} fill="none" opacity={cl(1 - u / 4)} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- DÜNYA (katmanlar + paralaks)
export type Kam = { x: number; y: number; z: number; r?: number };

/** Kamera: dünya noktası (x,y) ekran merkezine, z yakınlaştırma. Paralaks: uzak katmanlar daha az kayar. */
export const DunyaSahne: React.FC<{ D: Dunya; kam: Kam; children?: React.ReactNode; on?: React.ReactNode; sallanti?: [number, number] }> = ({ D, kam, children, on, sallanti = [0, 0] }) => {
  const kat = (p: number, node: React.ReactNode) => {
    const ox = (kam.x - 1000) * (1 - p);
    const oy = (kam.y - 1200) * (1 - p) * 0.5;
    return <g transform={`translate(${ox} ${oy})`}>{node}</g>;
  };
  const ust = (
    <g transform={`translate(${540 + sallanti[0]} ${960 + sallanti[1]}) rotate(${kam.r || 0}) scale(${kam.z}) translate(${-kam.x} ${-kam.y})`}>
      <defs>
        <radialGradient id="duman">
          <stop offset="0" stopColor="#e2d8c8" stopOpacity="0.75" />
          <stop offset="0.55" stopColor="#c9bca8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#b5a790" stopOpacity="0" />
        </radialGradient>
      </defs>
      {kat(0.25, <Gok D={D} />)}
      {kat(0.75, <Sehir D={D} />)}
      {kat(0.75, <Kuslar u={D.kus ?? -1} />)}
      {kat(1, <Surlar D={D} />)}
      {kat(1, <Zemin D={D} />)}
      {kat(1, <TozBulutu k={D.toz || 0} t={D.t} h={D.h} />)}
      {kat(1, <Ordu D={D} />)}
      {kat(1, <Gemiler D={D} />)}
      {kat(1, <Saldiri D={D} />)}
      {kat(1, <Cadirlar D={D} />)}
      {kat(1, children)}
    </g>
  );
  return (
    <g>
      {ust}
      {on}
    </g>
  );
};

/** Anahtar karelerden kamera yolu: [[t, x, y, z]]; aralar yumuşak (easeIO) */
export const kamYol = (t: number, k: [number, number, number, number][]): Kam => {
  if (t <= k[0][0]) return { x: k[0][1], y: k[0][2], z: k[0][3] };
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const u = easeIO((t - k[i - 1][0]) / Math.max(0.001, k[i][0] - k[i - 1][0]));
      return { x: lerp(k[i - 1][1], k[i][1], u), y: lerp(k[i - 1][2], k[i][2], u), z: lerp(k[i - 1][3], k[i][3], u) };
    }
  }
  const l = k[k.length - 1];
  return { x: l[1], y: l[2], z: l[3] };
};

/** Atış/çarpma sarsıntısı */
export const sars = (t: number, anlar: number[], g = 26): [number, number] => {
  let x = 0, y = 0;
  anlar.forEach((a) => {
    const u = t - a;
    if (u > 0 && u < 0.9) {
      const e = Math.pow(1 - u / 0.9, 2);
      x += Math.sin(u * 70) * g * e;
      y += Math.cos(u * 57) * g * 0.7 * e;
    }
  });
  return [x, y];
};
