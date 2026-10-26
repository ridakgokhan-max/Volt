// Masa üstü (flat-lay) KANCA şablonu — yalnızca açılış (hook) sahnesi için.
// Teknik: yukarıdan bakış masa + kesim matı, kenarlarda kanalın kendi nesneleri, çapraz pencere ışığı,
// sağdan genişleyen iki "mesaj hapı" (kelime kelime yazılır), açılışta hızlı kamera itişi.
// Kullanım: <MasaZemin t={t} /> ... içerik ... <Hap .../> <Hap .../>
import React from "react";
import { cl, INK } from "./kit";

const font = { fontFamily: "var(--font)" };
const easeOut = (x: number) => 1 - Math.pow(1 - cl(x), 3);
const geriYay = (x: number) => { const c = 1.7; const y = cl(x) - 1; return 1 + (c + 1) * y * y * y + c * y * y; };
const rnd = (i: number, j: number) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };

/** Kamera itişi: açılışta 1.16 → 1.0 hızlı geri çekiliş (yayılı), sonra çok yavaş ileri kayma */
export const MasaKamera: React.FC<{ t: number; children: React.ReactNode; ox?: number; oy?: number }> = ({ t, children, ox = 540, oy = 860 }) => {
  const u = cl(t / 0.75);
  const z = 1.16 - 0.16 * easeOut(u) + 0.035 * cl((t - 0.75) / 4);
  const r = (1 - easeOut(u)) * -2.2 + Math.sin(t * 0.5) * 0.25;
  const dx = Math.sin(t * 0.8) * 4, dy = Math.cos(t * 0.6) * 3;
  return <g transform={`translate(${ox + dx} ${oy + dy}) rotate(${r}) scale(${z}) translate(${-ox} ${-oy})`}>{children}</g>;
};

/** Masa zemini: ahşap + yeşil ızgaralı kesim matı + kenar nesneleri (defter, kalem, kupa) */
export const MasaZemin: React.FC<{ t: number; mat?: string }> = ({ t, mat = "#3f8f6b" }) => {
  const MX = 70, MY = 270, MW = 940, MH = 1340, A = 62;
  return (
    <g>
      <defs>
        <linearGradient id="mk-ahsap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c99a6b" /><stop offset="0.5" stopColor="#b78457" /><stop offset="1" stopColor="#a8744a" />
        </linearGradient>
        <filter id="mk-golge" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="14" dy="18" stdDeviation="10" floodColor="#1a0d00" floodOpacity="0.35" /></filter>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill="url(#mk-ahsap)" />
      {Array.from({ length: 26 }).map((_, i) => (
        <path key={i} d={`M -200 ${-150 + i * 90} C 300 ${-120 + i * 90 + rnd(i, 1) * 40} 700 ${-180 + i * 90 + rnd(i, 2) * 40} 1300 ${-140 + i * 90}`} stroke="#8a5a32" strokeWidth={2 + rnd(i, 3) * 3} fill="none" opacity={0.18} />
      ))}
      {/* kesim matı */}
      <g filter="url(#mk-golge)">
        <rect x={MX} y={MY} width={MW} height={MH} rx={18} fill={mat} />
      </g>
      {Array.from({ length: Math.floor(MW / A) + 1 }).map((_, i) => <line key={`v${i}`} x1={MX + 20 + i * A} x2={MX + 20 + i * A} y1={MY + 14} y2={MY + MH - 14} stroke="#d9f2e4" strokeWidth={i % 5 === 0 ? 3 : 1.5} opacity={0.55} />)}
      {Array.from({ length: Math.floor(MH / A) + 1 }).map((_, i) => <line key={`h${i}`} y1={MY + 20 + i * A} y2={MY + 20 + i * A} x1={MX + 14} x2={MX + MW - 14} stroke="#d9f2e4" strokeWidth={i % 5 === 0 ? 3 : 1.5} opacity={0.55} />)}
      {/* defter (sağ üst) */}
      <g transform="translate(860 120) rotate(28)" filter="url(#mk-golge)">
        <rect x={-210} y={-150} width={420} height={300} rx={12} fill="#d8c3a0" />
        <rect x={-210} y={-150} width={34} height={300} rx={8} fill="#b59c74" />
        <text x={30} y={10} textAnchor="middle" fontSize={30} fontWeight={900} fill="#8a6f48" style={font}>MERAK DEFTERİ</text>
      </g>
      {/* kalem */}
      <g transform="translate(190 1720) rotate(-18)" filter="url(#mk-golge)">
        <rect x={-180} y={-14} width={300} height={28} rx={6} fill="#f2c230" />
        <polygon points="120,-14 170,0 120,14" fill="#f1d9b5" /><polygon points="155,-4 170,0 155,4" fill={INK} />
        <rect x={-200} y={-14} width={24} height={28} rx={6} fill="#e38a9a" />
      </g>
      {/* kupa (sol üst) */}
      <g transform="translate(90 150)" filter="url(#mk-golge)">
        <circle r={115} fill="#f4efe2" /><circle r={92} fill="#5a3a22" /><circle cx={-22} cy={-26} r={18} fill="#8a6040" opacity={0.6} />
        <rect x={100} y={-26} width={70} height={52} rx={26} fill="none" stroke="#f4efe2" strokeWidth={20} />
      </g>
    </g>
  );
};

/** Pencere ışığı: çapraz parlak şerit + koyu gölge; çok yavaş kayar (sahnenin üstüne konur) */
export const PencereIsigi: React.FC<{ t: number }> = ({ t }) => {
  const k = Math.sin(t * 0.25) * 30;
  return (
    <g style={{ mixBlendMode: "multiply" }} pointerEvents="none">
      <path d={`M -200 ${-200 + k} L 1400 ${-200 + k} L 1400 ${420 + k} L -200 ${1560 + k} Z`} fill="#1d1408" opacity={0.42} />
      <path d={`M -200 ${2200 + k} L 1400 ${2200 + k} L 1400 ${1180 + k} L -200 ${2240 + k} Z`} fill="#1d1408" opacity={0.42} />
      {/* pencere kasası gölgesi */}
      <path d={`M 1400 ${780 + k} L -200 ${1900 + k}`} stroke="#1d1408" strokeWidth={34} opacity={0.35} />
    </g>
  );
};

/** Mesaj hapı: sağ kenardan sola doğru yaylanarak genişler, kelimeler sırayla aşağıdan süzülür.
 *  a: başlangıç saniyesi (a<0 → 0. karede tamamen hazır); sag: hapın sağ kenarı */
export const Hap: React.FC<{ t: number; a: number; text: string; sag?: number; y: number; renk?: string; yazi?: string; boy?: number; cikis?: number }> = ({
  t, a, text, sag = 990, y, renk = "#e8463b", yazi = "#fff", boy = 56, cikis,
}) => {
  const u = t - a;
  if (u < 0) return null;
  const kel = text.split(" ");
  const W = Math.min(940, text.length * boy * 0.6 + 90), H = boy * 1.8;
  const ac = a < 0 ? 1 : geriYay(u / 0.32);
  const son = cikis !== undefined && t > cikis ? cl(1 - (t - cikis) / 0.2) : 1;
  if (son <= 0) return null;
  const w = Math.max(H, W * Math.max(0, ac));
  let x = 0;
  const kelX = kel.map((k) => { const v = x; x += (k.length + 1) * boy * 0.6; return v; });
  const top = x - boy * 0.6;
  return (
    <g transform={`translate(${sag} ${y})`} opacity={son}>
      <g filter="url(#mk-golge)">
        <rect x={-w} y={-H / 2} width={w} height={H} rx={H / 2} fill={renk} />
      </g>
      <clipPath id={`hap-${y}`}><rect x={-w} y={-H / 2} width={w} height={H} rx={H / 2} /></clipPath>
      <g clipPath={`url(#hap-${y})`}>
        {kel.map((k, i) => {
          const g = a < 0 ? 1 : cl((u - 0.16 - i * 0.07) / 0.18);
          return (
            <text key={i} x={-W / 2 - top / 2 + kelX[i]} y={boy * 0.36 + (1 - easeOut(g)) * boy * 0.7} fontSize={boy} fontWeight={800} fill={yazi} opacity={g} style={font}>{k}</text>
          );
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- ŞİMŞEK kancası (ilk 3 saniye)
/** Şimşek: karanlık sahne → çift çakış (0.12 sn ve 0.44 sn) → ışıklar yavaşça geri gelir.
 *  hedef: şimşeğin vurduğu nokta. ek: sonradan küçük çakışların saniyeleri (vurgu kelimeleri) */
const CAKIS = [0.12, 0.44];
export const simsekParlak = (t: number, ek: number[] = []) => {
  let p = 0;
  [...CAKIS, ...ek].forEach((c, i) => {
    const u = t - c;
    if (u >= 0 && u < 0.3) p = Math.max(p, (i === 1 ? 0.7 : i >= 2 ? 0.55 : 1) * Math.exp(-u * 16));
  });
  return p;
};
export const simsekKaranlik = (t: number) => (t < 0.12 ? 0.6 : 0.6 * (1 - easeOut((t - 0.12) / 1.0)));
export const simsekSarsinti = (t: number, ek: number[] = []): [number, number] => {
  let a = 0;
  [...CAKIS, ...ek].forEach((c, i) => { const u = t - c; if (u >= 0 && u < 0.45) a = Math.max(a, (i === 0 ? 22 : 12) * Math.exp(-u * 9)); });
  return [Math.sin(t * 91) * a, Math.cos(t * 77) * a * 0.7];
};

/** Zikzak şimşek çizgisi (deterministik), dallarıyla */
const zikzak = (x0: number, y0: number, x1: number, y1: number, n: number, sapma: number, tohum: number) => {
  const p: string[] = [`M ${x0} ${y0}`];
  for (let i = 1; i < n; i++) {
    const k = i / n;
    p.push(`L ${x0 + (x1 - x0) * k + (rnd(i, tohum) - 0.5) * sapma} ${y0 + (y1 - y0) * k + (rnd(tohum, i) - 0.5) * sapma * 0.3}`);
  }
  p.push(`L ${x1} ${y1}`);
  return p.join(" ");
};

export const Simsek: React.FC<{ t: number; hedef: [number, number]; ek?: number[] }> = ({ t, hedef, ek = [] }) => {
  const parlak = simsekParlak(t, ek);
  const cizgiK = (() => {
    let k = 0;
    [...CAKIS, ...ek].forEach((c, i) => { const u = t - c; if (u >= -0.02 && u < 0.16) k = Math.max(k, i >= 2 ? 0.8 : 1); });
    return k;
  })();
  const tohum = Math.floor(t * 30) % 3 + 1; // her karede biraz titreşir
  const [hx, hy] = hedef;
  const ana = zikzak(hx + 160, -80, hx, hy, 14, 120, tohum);
  const dal1 = zikzak(hx + 120, hy * 0.35, hx - 220, hy * 0.6, 6, 70, tohum + 4);
  const dal2 = zikzak(hx + 60, hy * 0.62, hx + 260, hy * 0.82, 5, 60, tohum + 7);
  return (
    <g pointerEvents="none">
      <defs>
        <filter id="sm-parilti" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      {/* sahne karanlığı + çakış anı beyaz patlama */}
      <rect x={-300} y={-300} width={1680} height={2520} fill="#05070f" opacity={simsekKaranlik(t) * (1 - parlak)} />
      {cizgiK > 0 ? (
        <g opacity={cizgiK}>
          {[ana, dal1, dal2].map((d, i) => (
            <g key={i}>
              <path d={d} stroke="#8fc7ff" strokeWidth={i ? 20 : 38} fill="none" filter="url(#sm-parilti)" opacity={0.9} />
              <path d={d} stroke="#ffffff" strokeWidth={i ? 5 : 11} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))}
          <circle cx={hx} cy={hy} r={150} fill="#cfe6ff" filter="url(#sm-parilti)" opacity={0.85} />
        </g>
      ) : null}
      <rect x={-300} y={-300} width={1680} height={2520} fill="#eef6ff" opacity={parlak * 0.85} />
    </g>
  );
};

/** Çarpılan nesnenin etrafında elektrik kıvılcımları (çakıştan ~1.4 sn sonra söner) */
export const Kivilcim: React.FC<{ t: number; x: number; y: number; r?: number; bas?: number; sure?: number }> = ({ t, x, y, r = 170, bas = 0.12, sure = 1.4 }) => {
  const u = t - bas;
  if (u < 0 || u > sure) return null;
  const sonum = 1 - u / sure;
  const kare = Math.floor(t * 20);
  return (
    <g opacity={sonum}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = rnd(i, kare) * Math.PI * 2, rr = r * (0.6 + rnd(kare, i) * 0.6);
        const x0 = x + Math.cos(a) * rr * 0.4, y0 = y + Math.sin(a) * rr * 0.4;
        return <path key={i} d={zikzak(x0, y0, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 4, 30, kare + i)} stroke={i % 2 ? "#ffffff" : "#9fd3ff"} strokeWidth={4} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
};
