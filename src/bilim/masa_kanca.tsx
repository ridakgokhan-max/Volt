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
