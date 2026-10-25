// Konu 14/30 (Bilim): Soğan neden ağlatır? Suçlu bıçak — KOLAJ + ÇİZİM, MOTION sürümü.
// Gerçek fotoğraflar (CC0 / kamu malı, scripts/arsiv_ara.py ile bulundu): kırmızı soğan, şef bıçağı, mikroskopta soğan
// hücreleri, insan gözü, soğan halkaları, Cornell kulesi. Kaynak listesi: aday/sogan/adaylar.json, aday/sogan2/adaylar.json
// İlke: ekran hiç durmaz (kâğıt kırpıntıları, süzülme, kamera yolculuğu); her hareket SÖZE bağlı: ws("kelime").
import React from "react";
import { staticFile } from "remotion";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, cl, ez, GREEN, INK, lerp, RED, sp } from "../kit";
import { adim, Bant, geri, KolajDefs, KREM, KIRMIZI, Muhur, Serit, yap } from "../kolaj";
import { Merakli } from "../merakli";
import olcu from "../data/sogan-olcu.json";

type S = React.FC<SceneProps>;
const KL = "sogan";
const { Parca } = yap(KL, olcu as Record<string, number>);
const font = { fontFamily: "var(--font)" };
const MOR = "#8e3b78";
const GAZ = "#b7d84b";
const SU = "#9fd8ff";
const easeOut = (x: number) => 1 - Math.pow(1 - cl(x), 3);
const rnd = (i: number, j: number) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ---------------------------------------------------------------- hareket katmanları

/** Kamera: tek yönlü ileri dolly (geri çekme yok), hafif kıpırtı, söz vuruşlarında punch-in */
const Kamera: React.FC<{ t: number; d: number; children: React.ReactNode; z0?: number; z1?: number; x0?: number; x1?: number; y0?: number; y1?: number; vurus?: number[]; ox?: number; oy?: number }> = ({
  t, d, children, z0 = 1, z1 = 1.1, x0 = 0, x1 = 0, y0 = 0, y1 = 0, vurus = [], ox = 540, oy = 760,
}) => {
  const k = easeOut(cl(t / Math.max(d, 0.1)) * 1.15);
  let z = lerp(z0, z1, k);
  vurus.forEach((v) => {
    const u = t - v;
    if (u > 0 && u < 0.5) z *= 1 + 0.05 * Math.sin((u / 0.5) * Math.PI);
  });
  const dx = lerp(x0, x1, k) + Math.sin(t * 0.9) * 4;
  const dy = lerp(y0, y1, k) + Math.cos(t * 0.75) * 3;
  return <g transform={`translate(${ox + dx} ${oy + dy}) rotate(${Math.sin(t * 0.45) * 0.4}) scale(${z}) translate(${-ox} ${-oy})`}>{children}</g>;
};

/** Süzülme */
const Suz: React.FC<{ t: number; children: React.ReactNode; a?: number; f?: number; ph?: number; rot?: number }> = ({ t, children, a = 8, f = 1.1, ph = 0, rot = 1.5 }) => (
  <g transform={`translate(${Math.sin(t * f * 0.7 + ph) * a * 0.6} ${Math.sin(t * f + ph) * a}) rotate(${Math.sin(t * f * 0.8 + ph) * rot})`}>{children}</g>
);

/** Arka planda süzülen kâğıt soğan halkaları (marka motifi, hiç durmaz) */
const Kirpinti: React.FC<{ t: number; renk?: string; o?: number; n?: number }> = ({ t, renk = KREM, o = 0.35, n = 14 }) => {
  const tq = adim(t);
  return (
    <g opacity={o}>
      {Array.from({ length: n }).map((_, i) => {
        const x = ((rnd(i, 1) * 1300 + tq * (25 + rnd(i, 2) * 40) * (rnd(i, 3) > 0.5 ? 1 : -1)) % 1300 + 1300) % 1300 - 110;
        const y = ((rnd(i, 4) * 2100 - tq * (30 + rnd(i, 5) * 50)) % 2100 + 2100) % 2100 - 90;
        const r = 18 + rnd(i, 6) * 30;
        return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.8} fill="none" stroke={renk} strokeWidth={7} transform={`rotate(${tq * 30 * (rnd(i, 7) - 0.5)} ${x} ${y})`} />;
      })}
    </g>
  );
};

/** Fotoğraf kartı: krem çerçeve + bant, stop-motion girişi. x,y = merkez; daire = mikroskop merceği gibi yuvarlak */
const Foto: React.FC<{ t: number; ad: string; x: number; y: number; w: number; rot?: number; a?: number; cikis?: number; id: string; daire?: boolean; bant?: boolean; zoom?: number }> = ({
  t, ad, x, y, w, rot = 0, a = 0, cikis, id, daire = false, bant = true, zoom = 1,
}) => {
  const tq = adim(t);
  if (tq < a) return null;
  let k = a <= 0 ? 1 : geri(cl((tq - a) / 0.35));
  if (cikis !== undefined && tq > cikis) k *= 1 - cl((tq - cikis) / 0.3);
  if (k <= 0.001) return null;
  const oran = (olcu as Record<string, number>)[ad] || 0.75;
  const h = daire ? w : w * oran;
  const bw = w * zoom, bh = h * zoom;
  const jr = (rnd(Math.floor(t * 12), ad.length) - 0.5) * 0.8;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + jr}) scale(${k})`} filter="url(#kgolge)">
      <defs>
        <clipPath id={`fk-${id}`}>{daire ? <circle r={w / 2} /> : <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} />}</clipPath>
      </defs>
      {daire ? <circle r={w / 2 + 22} fill={KREM} /> : <rect x={-w / 2 - 20} y={-h / 2 - 20} width={w + 40} height={h + 40} rx={10} fill={KREM} />}
      <g clipPath={`url(#fk-${id})`}>
        <image href={staticFile(`bilim/${KL}/${ad}.jpg`)} x={-bw / 2} y={-bh / 2} width={bw} height={bh} preserveAspectRatio="xMidYMid slice" />
      </g>
      {daire ? <circle r={w / 2} fill="none" stroke={INK} strokeWidth={6} /> : <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />}
      {bant && !daire ? <><Bant x={-w / 2 + 40} y={-h / 2 - 6} w={150} rot={-28} /><Bant x={w / 2 - 40} y={-h / 2 - 6} w={150} rot={24} /></> : null}
    </g>
  );
};

/** Soğan suyu damlası (gözyaşı biçimi) */
const Damla: React.FC<{ x: number; y: number; s?: number; renk?: string; rot?: number; o?: number }> = ({ x, y, s = 1, renk = SU, rot = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <path d="M 0 -26 C 10 -10 18 0 18 10 A 18 18 0 1 1 -18 10 C -18 0 -10 -10 0 -26 Z" fill={renk} stroke={INK} strokeWidth={4} />
    <ellipse cx={-6} cy={6} rx={4} ry={7} fill="#fff" opacity={0.8} />
  </g>
);

/** Damla patlaması: t0'da (x,y)'den yukarı yelpaze; hiz: 1 normal; tavan: damlaların çıkabileceği en üst y */
const Fiskir: React.FC<{ t: number; t0: number; x: number; y: number; n?: number; hiz?: number; yay?: number; tavan?: number; renk?: string; s?: number }> = ({
  t, t0, x, y, n = 14, hiz = 1, yay = 70, tavan = -9999, renk = SU, s = 0.8,
}) => {
  const u = t - t0;
  if (u < 0 || u > 2.2) return null;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const aci = ((-90 + (rnd(i, 31) - 0.5) * yay * 2) * Math.PI) / 180;
        const v0 = (700 + rnd(i, 32) * 700) * hiz;
        const vx = Math.cos(aci) * v0, vy = Math.sin(aci) * v0;
        const g = 1500;
        let py = y + vy * u + 0.5 * g * u * u;
        const px = x + vx * u;
        py = Math.max(py, tavan);
        const vyt = vy + g * u;
        const rot = (Math.atan2(vyt, vx) * 180) / Math.PI + 90;
        return <Damla key={i} x={px} y={py} s={s * (0.6 + rnd(i, 33) * 0.6)} rot={rot + 180} renk={renk} o={cl(1.8 - u)} />;
      })}
    </g>
  );
};

/** Yükselen gaz bulutu */
const Gaz: React.FC<{ t: number; t0: number; x: number; y: number; n?: number; yukseklik?: number; hedef?: [number, number]; o?: number; yikanma?: number }> = ({
  t, t0, x, y, n = 12, yukseklik = 700, hedef, o = 1, yikanma = 0,
}) => {
  const u = t - t0;
  if (u < 0) return null;
  return (
    <g opacity={o * (1 - yikanma)}>
      {Array.from({ length: n }).map((_, i) => {
        const p = ((u * 0.45 + rnd(i, 41)) % 1);
        const dog = cl(u * 1.5 - rnd(i, 46) * 0.5);
        const hx = hedef ? lerp(x + (rnd(i, 42) - 0.5) * 260, hedef[0] + (rnd(i, 47) - 0.5) * 120, p) : x + (rnd(i, 42) - 0.5) * 260 + Math.sin(u * 2 + i) * 50 * p;
        const hy = hedef ? lerp(y, hedef[1], p) : y - p * yukseklik;
        const r = 26 + p * 60 + rnd(i, 43) * 20;
        return <circle key={i} cx={hx + Math.sin(u * 3 + i) * 14} cy={hy + yikanma * 500} r={r} fill={GAZ} stroke="#7d9a2a" strokeWidth={3} opacity={dog * 0.55 * (1 - p * 0.6)} />;
      })}
    </g>
  );
};

/** Çizgi film gözleri (soğana) */
const Gozler: React.FC<{ x: number; y: number; t: number; kizgin?: number; mutlu?: number; s?: number }> = ({ x, y, t, kizgin = 0, mutlu = 0, s = 1 }) => {
  const kirp = Math.sin(t * 2.3) > 0.97 ? 0.15 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-46, 46].map((ox, i) => (
        <g key={i}>
          <ellipse cx={ox} cy={0} rx={30} ry={36 * kirp} fill="#fff" stroke={INK} strokeWidth={6} />
          <circle cx={ox + 6} cy={6} r={13 * Math.min(1, kirp * 2)} fill={INK} />
          <line x1={ox - 34} x2={ox + 34} y1={-48 + (i ? 1 : -1) * 0 - kizgin * 4} y2={-48 + kizgin * (i ? -18 : 18) * (i ? -1 : 1)} stroke={INK} strokeWidth={10 * cl(kizgin * 2)} strokeLinecap="round" />
        </g>
      ))}
      {mutlu > 0.05 ? <path d={`M -40 60 Q 0 ${60 + 40 * mutlu} 40 60`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" /> : <path d="M -26 66 Q 0 54 26 66" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" opacity={cl(kizgin * 2)} />}
    </g>
  );
};

/** Sabıka çizelgesi (boy çizgileri) */
const Sabika: React.FC<{ t: number; k: number }> = ({ t, k }) => (
  <g opacity={k}>
    <rect x={60} y={360} width={960} height={860} rx={14} fill="#f6f1e4" stroke={INK} strokeWidth={8} />
    {Array.from({ length: 8 }).map((_, i) => (
      <g key={i}>
        <line x1={60} x2={1020} y1={515 + i * 90} y2={420 + i * 95} stroke={INK} strokeWidth={i % 2 ? 2 : 4} opacity={0.5} />
        <text x={80} y={505 + i * 90} fontSize={28} fontWeight={800} fill={INK} opacity={0.6} style={font}>{`${200 - i * 20}`}</text>
      </g>
    ))}
    <rect x={60} y={360} width={960} height={70} fill={INK} />
    <text x={540} y={408} textAnchor="middle" fontSize={40} fontWeight={900} fill={KREM} style={font} opacity={0.85 + 0.15 * Math.sin(t * 5)}>MUTFAK KARAKOLU · 0001</text>
  </g>
);

/** Hücre: iki oda (sol: kükürtlü madde, sağ: enzim); kirik: duvar parçalanması; karis: karışma (0–1) */
const Hucre: React.FC<{ t: number; x: number; y: number; s?: number; kapi?: number; kirik?: number; karis?: number; k?: number }> = ({ t, x, y, s = 1, kapi = 1, kirik = 0, karis = 0, k = 1 }) => {
  const tq = adim(t);
  const W2 = 420, H2 = 300;
  const nok = (i: number, sol: boolean) => {
    const bx = sol ? -W2 / 2 - 10 : W2 / 2 + 10;
    const ox = (rnd(i, sol ? 51 : 52) - 0.5) * 300, oy = (rnd(i, sol ? 53 : 54) - 0.5) * 220;
    const hx = (rnd(i, 55) - 0.5) * 620, hy = (rnd(i, 56) - 0.5) * 240;
    const m = easeOut(karis);
    const jx = Math.sin(tq * (5 + i) + i) * 8, jy = Math.cos(tq * (4 + i) + i) * 8;
    return [lerp(bx + ox, hx, m) + jx, lerp(oy, hy, m) + jy];
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={k} filter="url(#kgolge)">
      <rect x={-W2 - 40} y={-H2 / 2 - 40} width={2 * W2 + 80} height={H2 + 80} rx={70} fill={KREM} />
      <rect x={-W2 - 20} y={-H2 / 2 - 20} width={2 * W2 + 40} height={H2 + 40} rx={56} fill="#e9dcf2" stroke={MOR} strokeWidth={10} />
      {/* orta duvar: kırılınca parçalar uçar */}
      {kirik < 0.02 ? (
        <g>
          <rect x={-12} y={-H2 / 2 - 20} width={24} height={H2 + 40} fill={MOR} />
          <rect x={-40} y={-50} width={80} height={100} rx={10} fill={kapi > 0.5 ? "#c08a4a" : "none"} stroke={INK} strokeWidth={5} opacity={kapi} />
          <circle cx={22} cy={0} r={6} fill={INK} opacity={kapi} />
        </g>
      ) : (
        Array.from({ length: 6 }).map((_, i) => {
          const u = easeOut(kirik);
          return <rect key={i} x={-12 + (rnd(i, 61) - 0.5) * 400 * u} y={-H2 / 2 - 20 + i * ((H2 + 40) / 6) + (rnd(i, 62) - 0.2) * 300 * u} width={24} height={(H2 + 40) / 6} fill={MOR} opacity={1 - u} transform={`rotate(${u * 180 * (rnd(i, 63) - 0.5)})`} />;
        })
      )}
      {Array.from({ length: 11 }).map((_, i) => {
        const [px, py] = nok(i, true);
        return <circle key={`a${i}`} cx={px} cy={py} r={20} fill={karis > 0.6 ? GAZ : ACC} stroke={INK} strokeWidth={4} />;
      })}
      {Array.from({ length: 9 }).map((_, i) => {
        const [px, py] = nok(i, false);
        return <path key={`b${i}`} d={`M ${px - 20} ${py} L ${px} ${py - 20} L ${px + 20} ${py} L ${px} ${py + 20} Z`} fill={karis > 0.6 ? GAZ : BLUE} stroke={INK} strokeWidth={4} />;
      })}
      {karis > 0.4 ? Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + tq * 2;
        const r = 120 + ((tq * 2 + i * 0.3) % 1) * 260;
        return <path key={`s${i}`} d={`M ${Math.cos(a) * r} ${Math.sin(a) * r * 0.5} l 14 -26 l 10 20 l 16 -24`} stroke={RED} strokeWidth={6} fill="none" opacity={cl(karis * 2 - 1) * (1 - ((tq * 2 + i * 0.3) % 1))} />;
      }) : null}
    </g>
  );
};

/** Kâğıt beyin */
const Beyin: React.FC<{ x: number; y: number; t: number; alarm?: number; s?: number }> = ({ x, y, t, alarm = 0, s = 1 }) => {
  const sar = alarm > 0.05 ? Math.sin(t * 40) * 8 * alarm : 0;
  return (
    <g transform={`translate(${x + sar} ${y}) scale(${s * (1 + 0.03 * Math.sin(t * 3))})`} filter="url(#kgolge)">
      <path d="M -150 20 C -190 -60 -120 -140 -40 -130 C 0 -170 90 -160 120 -110 C 190 -100 200 -10 160 30 C 170 90 100 130 40 110 C -10 140 -100 130 -120 80 C -170 80 -180 40 -150 20 Z" fill={alarm > 0.5 ? "#ffb3a7" : "#f7c9d4"} stroke={INK} strokeWidth={8} />
      <path d="M -90 -60 C -60 -90 -20 -60 -30 -20 M 10 -100 C 40 -60 0 -30 30 0 M 70 -60 C 110 -40 90 10 120 20 M -100 40 C -60 20 -40 70 0 50 M 40 60 C 70 40 100 80 130 50" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d="M -20 130 L -10 190 L 30 190 L 40 120" fill="#f7c9d4" stroke={INK} strokeWidth={7} />
    </g>
  );
};

/** Hız göstergesi */
const Gosterge: React.FC<{ x: number; y: number; deger: number; t: number; k: number }> = ({ x, y, deger, t, k }) => {
  const aci = -120 + (cl(deger / 180) * 240);
  const tit = deger > 130 ? Math.sin(t * 50) * 2 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} filter="url(#kgolge)">
      <circle r={210} fill={KREM} />
      <circle r={190} fill="#1d2430" stroke={INK} strokeWidth={8} />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = ((-120 + i * (240 / 9) - 90) * Math.PI) / 180;
        return <line key={i} x1={Math.cos(a) * 150} y1={Math.sin(a) * 150} x2={Math.cos(a) * 175} y2={Math.sin(a) * 175} stroke={i >= 7 ? RED : KREM} strokeWidth={8} />;
      })}
      <path d={`M ${Math.cos(((150 - 90) * Math.PI) / 180) * 162} ${Math.sin(((150 - 90) * Math.PI) / 180) * 162}`} />
      <g transform={`rotate(${aci + tit})`}>
        <path d="M -10 0 L 0 -165 L 10 0 Z" fill={RED} stroke={INK} strokeWidth={3} />
      </g>
      <circle r={22} fill={ACC} stroke={INK} strokeWidth={5} />
      <text x={0} y={95} textAnchor="middle" fontSize={76} fontWeight={900} fill={deger > 130 ? ACC : KREM} style={font}>{Math.round(deger)}</text>
      <text x={0} y={140} textAnchor="middle" fontSize={34} fontWeight={800} fill={KREM} style={font}>KM/SA</text>
    </g>
  );
};

/** Çizim bıçak (yan görünüş): kor=1 → kalın, yuvarlak ağız; kor=0 → ince, sivri ağız */
const CizimBicak: React.FC<{ x: number; y: number; kor: number; rot?: number; s?: number }> = ({ x, y, kor, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} filter="url(#kgolge)">
    <rect x={-60} y={-560} width={120} height={300} rx={30} fill="#2b2b2b" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-470} r={12} fill="#888" /><circle cx={0} cy={-350} r={12} fill="#888" />
    {kor > 0.5 ? (
      <path d="M -70 -270 L 70 -270 L 70 -40 Q 70 10 0 14 Q -70 10 -70 -40 Z" fill="#b9c2ca" stroke={INK} strokeWidth={7} />
    ) : (
      <path d="M -50 -270 L 50 -270 L 6 6 L -6 6 Z" fill="#dfe6ec" stroke={INK} strokeWidth={6} />
    )}
    <path d={kor > 0.5 ? "M -40 -240 L -40 -60" : "M -24 -240 L -6 -40"} stroke="#fff" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
  </g>
);

/** Soğan kesiti (yan görünüş, katmanlı); ez: bastırma çukuru (0–1), kesik: temiz kesik açıklığı (0–1) */
const SoganKesit: React.FC<{ x: number; y: number; t: number; ez?: number; kesik?: number }> = ({ x, y, t, ez: e = 0, kesik = 0 }) => (
  <g transform={`translate(${x} ${y})`} filter="url(#kgolge)">
    {Array.from({ length: 7 }).map((_, i) => {
      const r = 380 - i * 50;
      const cuk = e * (60 - i * 6);
      return (
        <path key={i}
          d={`M ${-r} 0 A ${r} ${r * 0.72} 0 0 1 ${-28 * kesik - 6} ${-r * 0.72 + cuk} L ${28 * kesik + 6} ${-r * 0.72 + cuk} A ${r} ${r * 0.72} 0 0 1 ${r} 0 Z`}
          fill={i % 2 ? "#f6e8f0" : "#d98ab6"} stroke={MOR} strokeWidth={6} />
      );
    })}
    <rect x={-420} y={0} width={840} height={40} rx={12} fill="#c99a64" stroke={INK} strokeWidth={6} />
    {e > 0.3 ? Array.from({ length: 6 }).map((_, i) => (
      <circle key={i} cx={(i - 2.5) * 34} cy={-268 + e * 54 + Math.sin(t * 20 + i) * 3} r={14} fill="#f9d7ea" stroke={MOR} strokeWidth={4} transform={`scale(${1 + e * 0.5} ${1 - e * 0.45})`} />
    )) : null}
  </g>
);

/** Göz hizası çizgisi */
const GozHizasi: React.FC<{ y: number; k: number; t: number }> = ({ y, k, t }) => (
  <g opacity={k}>
    <line x1={120} x2={960} y1={y} y2={y} stroke={RED} strokeWidth={8} strokeDasharray="30 18" strokeDashoffset={-t * 60} />
    <g transform={`translate(175 ${y - 60})`}>
      <ellipse cx={0} cy={0} rx={52} ry={30} fill="#fff" stroke={INK} strokeWidth={6} />
      <circle cx={4} cy={0} r={16} fill={INK} />
    </g>
    <text x={250} y={y - 32} fontSize={44} fontWeight={900} fill={RED} style={font}>GÖZ HİZASI</text>
  </g>
);

// ---------------------------------------------------------------- sahneler

// 1 — Soğan doğrarken ağlıyorsan, suçlu soğan değil, elindeki bıçak.
//     0. kare: bıçak soğanı keser, damlalar fışkırır → sabıka çizelgesi → "SUÇLU" mührü bıçağa
const Giris: S = ({ t, d, ws }) => {
  const ts = ws("suçlu"), tsg = ws("soğan", 1), tb = ws("bıçak");
  const kes = ez(cl(0.55 + t / 0.5));
  const sabika = ap(t, ts - 0.3, 0.3);
  const ayril = ez(ap(t, ts - 0.2, 0.5));
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} />
      <Kamera t={t} d={d} z0={1.0} z1={1.1} vurus={[0.45, ts, tb]}>
        <Sabika t={t} k={sabika} />
        {/* soğan: ortadan sola geçer */}
        <g transform={`translate(${lerp(0, -170, ayril)} 0)`}>
          <Suz t={t} a={5}>
            <Parca t={t} ad="sogan" x={540} y={470} w={400} rot={-4} />
            <Gozler x={540} y={900} t={t} kizgin={0} mutlu={ap(t, tsg, 0.3)} s={0.9} />
            {t < tsg ? <Damla x={592} y={950 + ((t * 1.6) % 1) * 120} s={0.8} o={1 - ((t * 1.6) % 1) * 0.7} /> : null}
          </Suz>
        </g>
        {/* bıçak: yukarıdan inip keser, sonra sağa çekilir */}
        <g transform={`translate(${lerp(0, 200, ayril)} ${lerp(-120, 0, kes) + lerp(0, 120, ayril)}) rotate(${lerp(-38, 0, kes) + lerp(0, -22, ayril)} 560 760)`}>
          <Parca t={t} ad="bicak" x={560} y={560} w={820} rot={-24} />
          <Bant x={860} y={760} w={130} rot={-30} />
        </g>
        <Fiskir t={t} t0={-0.35} x={560} y={760} n={18} hiz={1.0} s={1.05} />
        <Fiskir t={t} t0={0.6} x={560} y={760} n={10} hiz={0.8} />
      </Kamera>
      <Serit t={t} a={tsg - 0.05} cikis={d - 0.3} text="MASUM" x={360} y={1150} size={60} rot={-4} bg={GREEN} color="#fff" />
      <Muhur t={t} a={tb - 0.05} text="SUÇLU" x={760} y={980} size={96} rot={-10} />
    </g>
  );
};

// 2 — Ama önce şunu bil: o soğan sana karşı kendini savunuyor.
const Savunma: S = ({ t, d, ws }) => {
  const tsg = ws("soğan"), tsv = ws("savunuyor"), tkd = ws("kendini");
  const kalkan = sp(t, tkd - 0.2, 10);
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#e9f5df" />
      <Kamera t={t} d={d} z0={1.0} z1={1.14} vurus={[tsg, tsv]}>
        {/* katmanlar zırh gibi dışarı halkalanır */}
        {Array.from({ length: 3 }).map((_, i) => {
          const u = ((adim(t) * 0.7 + i / 3) % 1);
          return <ellipse key={i} cx={540} cy={820} rx={240 + u * 300} ry={300 + u * 330} fill="none" stroke={MOR} strokeWidth={14 * (1 - u) + 2} opacity={(1 - u) * ap(t, tsg - 0.3, 0.4)} />;
        })}
        <Suz t={t} a={6}>
          <Parca t={t} ad="sogan" x={540} y={400} w={420} rot={3} a={-1} />
          <Gozler x={540} y={850} t={t} kizgin={ap(t, tsg - 0.1, 0.3)} s={0.95} />
        </Suz>
        {/* kâğıt kalkan */}
        {kalkan > 0.01 ? (
          <g transform={`translate(${lerp(1100, 800, kalkan)} 860) rotate(${lerp(40, -8, kalkan)}) scale(${kalkan})`} filter="url(#kgolge)">
            <path d="M 0 -170 L 140 -120 Q 140 80 0 170 Q -140 80 -140 -120 Z" fill={KREM} />
            <path d="M 0 -150 L 120 -108 Q 120 70 0 150 Q -120 70 -120 -108 Z" fill={KIRMIZI} stroke={INK} strokeWidth={6} />
            <g transform="translate(0 0) scale(1.6)"><Damla x={0} y={4} renk={GAZ} /></g>
          </g>
        ) : null}
      </Kamera>
      <Serit t={t} a={0.15} cikis={tkd - 0.3} text="ÖNCE ŞUNU BİL" x={540} y={420} size={60} rot={-3} bg={INK} color={KREM} />
      <Serit t={t} a={tkd - 0.05} text="KENDİNİ SAVUNUYOR" x={540} y={1170} size={64} rot={2} bg={KIRMIZI} color={KREM} />
    </g>
  );
};

// 3 — Soğanın hücrelerinde iki madde var; normalde ayrı odalarda dururlar.
//     Mikroskop fotoğrafına dalış → tek hücre → iki oda
const HucreS: S = ({ t, d, ws }) => {
  const th = ws("hücrelerinde"), ti = ws("iki"), ta = ws("ayrı");
  const dal = ez(ap(t, ti - 0.5, 0.6));
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#dfe9f7" />
      <Kamera t={t} d={d} z0={1.0} z1={1.08} vurus={[th, ti, ta]}>
        <g opacity={1 - ap(t, ti - 0.05, 0.25)} transform={`translate(540 760) scale(${1 + dal * 2.6}) translate(-540 -760)`}>
          <Foto t={t} ad="hucre" id="h1" x={540} y={760} w={760} daire zoom={1.25} a={-1} />
          {/* hedef hücre çerçevesi */}
          <rect x={480} y={700} width={150} height={110} rx={30} fill="none" stroke={ACC} strokeWidth={8} opacity={ap(t, th, 0.3) * (0.6 + 0.4 * Math.sin(t * 8))} />
        </g>
        <Hucre t={t} x={540} y={780} s={lerp(0.4, 1, ez(ap(t, ti - 0.1, 0.45)))} k={ap(t, ti - 0.1, 0.2)} kapi={1} />
      </Kamera>
      <Serit t={t} a={0.1} cikis={ti - 0.3} text="MİKROSKOPTA SOĞAN" x={540} y={330} size={56} rot={-2} bg={INK} color={KREM} />
      <Serit t={t} a={ti - 0.05} text="İKİ MADDE" x={540} y={420} size={64} rot={-3} />
      <Serit t={t} a={ti + 0.4} cikis={ta - 0.2} text="KÜKÜRTLÜ MADDE  ·  ENZİM" x={540} y={1110} size={44} rot={1} bg={KREM} color={INK} />
      <Serit t={t} a={ta - 0.05} text="AYRI ODALARDA" x={540} y={1110} size={60} rot={2} bg={MOR} color={KREM} />
    </g>
  );
};

// 4 — Bıçak hücreyi parçaladığı an ikisi karışıyor; havaya uçan yakıcı bir gaz oluşuyor.
const GazS: S = ({ t, d, ws }) => {
  const tp = ws("parçaladığı"), tk = ws("karışıyor"), th = ws("havaya"), ty = ws("yakıcı");
  const inis = ez(ap(t, tp - 0.6, 0.55));
  const kir = ap(t, tp - 0.05, 0.5);
  const kar = ap(t, tk - 0.4, 0.8);
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#f5ebc4" />
      <Kamera t={t} d={d} z0={1.05} z1={1.0 + 0.05} y0={0} y1={-120} vurus={[tp, tk, ty]}>
        <Hucre t={t} x={540} y={900} s={1} kirik={kir} karis={kar} />
        <Gaz t={t} t0={th - 0.6} x={540} y={690} n={14} yukseklik={240} o={ap(t, th - 0.6, 0.5)} />
        {/* bıçak yukarıdan iner, duvarı keser, yukarı çıkar */}
        <defs><clipPath id="gaz-ust"><rect x={-200} y={240} width={1480} height={1700} /></clipPath></defs>
        <g clipPath="url(#gaz-ust)">
          <g transform={`translate(0 ${lerp(-900, 0, inis) - ez(ap(t, tp + 0.5, 0.5)) * 900})`}>
            <Parca t={t} ad="bicak" x={540} y={170} w={760} rot={-90} />
          </g>
        </g>
      </Kamera>
      <Serit t={t} a={tp - 0.05} cikis={tk - 0.2} text="TETİĞİ BIÇAK ÇEKER" x={540} y={1170} size={56} rot={-2} bg={INK} color={KREM} />
      <Serit t={t} a={tk - 0.05} cikis={th - 0.15} text="KARIŞIYOR!" x={540} y={1170} size={66} rot={2} bg={ACC} />
      <Serit t={t} a={th - 0.05} text="YAKICI GAZ" x={540} y={370} size={76} rot={-3} bg={KIRMIZI} color={KREM} />
      {t > th - 0.2 ? <g opacity={ap(t, th - 0.2, 0.25)}><rect x={330} y={438} width={420} height={50} rx={12} fill={KREM} stroke={INK} strokeWidth={3} /><text x={540} y={474} textAnchor="middle" fontSize={34} fontWeight={900} fill={INK} style={font}>(propantiyal S-oksit)</text></g> : null}
    </g>
  );
};

// 5 — Gaz göze ulaşınca sinirler beyne "yanıyor!" der; beyin gözyaşı bezlerine "Yıka!" emri verir.
const GozS: S = ({ t, d, ws }) => {
  const tu = ws("ulaşınca"), tsn = ws("sinirler"), tyn = ws("yanıyor"), tb = ws("beyin"), tgz = ws("gözyaşı"), tyk = ws("yıka");
  const GX = 420, GY = 880; // göz merkezi
  const BX = 810, BY = 600; // beyin
  const sinyal1 = ap(t, tsn - 0.1, Math.max(0.4, tyn - tsn));
  const sinyal2 = ap(t, tb + 0.2, Math.max(0.4, tyk - tb - 0.5));
  const alarm = ap(t, tyn - 0.1, 0.2) * (1 - ap(t, tb + 0.3, 0.4));
  const yas = ap(t, tyk - 0.1, 0.3);
  const yanma = ap(t, tu, 0.3) * (1 - yas);
  const yol = (u: number): [number, number] => [lerp(GX + 180, BX - 120, u), lerp(GY - 40, BY + 60, u) - Math.sin(u * Math.PI) * 120];
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#fbe1e6" />
      <Kamera t={t} d={d} z0={1.0} z1={1.08} vurus={[tu, tyn, tyk]}>
        <Foto t={t} ad="goz" id="g1" x={GX} y={GY} w={660} rot={-3} a={-1} />
        {/* yanma: göz kızarır */}
        <ellipse cx={GX} cy={GY} rx={300} ry={160} fill={RED} opacity={0.28 * yanma * (0.7 + 0.3 * Math.sin(t * 12))} />
        <Gaz t={t} t0={-0.6} x={GX} y={1200} hedef={[GX, GY]} n={12} o={1 - ap(t, tyk + 0.3, 0.4)} yikanma={yas} />
        {/* sinir yolu */}
        <path d={`M ${yol(0)[0]} ${yol(0)[1]} Q ${(GX + BX) / 2 + 30} ${Math.min(GY, BY) - 150} ${yol(1)[0]} ${yol(1)[1]}`} stroke={INK} strokeWidth={8} fill="none" strokeDasharray="18 14" opacity={ap(t, tsn - 0.3, 0.3)} />
        {sinyal1 > 0 && sinyal1 < 1 ? <circle cx={yol(sinyal1)[0]} cy={yol(sinyal1)[1]} r={26} fill={ACC} stroke={INK} strokeWidth={5} /> : null}
        {sinyal2 > 0 && sinyal2 < 1 ? <circle cx={yol(1 - sinyal2)[0]} cy={yol(1 - sinyal2)[1]} r={26} fill={SU} stroke={INK} strokeWidth={5} /> : null}
        <g opacity={ap(t, tsn - 0.2, 0.3)}><Beyin x={BX} y={BY} t={t} alarm={alarm} s={0.85} /></g>
        {/* alarm balonu */}
        {alarm > 0.02 ? (
          <g transform={`translate(${BX - 40} ${BY - 190}) scale(${sp(t, tyn - 0.1, 9) * (1 + 0.05 * Math.sin(t * 14))}) rotate(-4)`} filter="url(#kgolge)">
            <rect x={-200} y={-62} width={400} height={124} rx={30} fill={KIRMIZI} stroke={INK} strokeWidth={7} />
            <text x={0} y={22} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" style={font}>YANIYOR!</text>
          </g>
        ) : null}
        {/* gözyaşı bezi (göz üst-dış köşesi) */}
        <g opacity={ap(t, tgz - 0.2, 0.3)}>
          <ellipse cx={GX + 230} cy={GY - 130} rx={46} ry={30} fill={SU} stroke={INK} strokeWidth={5} transform={`scale(${1 + 0.1 * Math.sin(t * 6)})`} style={{ transformOrigin: `${GX + 230}px ${GY - 130}px` }} />
          <text x={GX + 150} y={GY - 230} textAnchor="middle" fontSize={42} fontWeight={900} fill={INK} stroke={KREM} strokeWidth={8} paintOrder="stroke" style={font}>GÖZYAŞI BEZİ</text>
        </g>
        {/* gözyaşı akıntısı */}
        {yas > 0 ? Array.from({ length: 16 }).map((_, i) => {
          const u = ((t - tyk) * 0.9 + rnd(i, 71)) % 1;
          const x = GX - 120 + rnd(i, 72) * 240;
          return <Damla key={i} x={x + Math.sin(u * 6 + i) * 10} y={GY + 40 + u * 330} s={0.9 + rnd(i, 73) * 0.5} o={yas * (1 - u * 0.6)} />;
        }) : null}
      </Kamera>
      <Serit t={t} a={tyk - 0.3} text={'"YIKA!"'} x={540} y={420} rot={-2} size={84} rot={-3} bg={BLUE} color="#fff" />
    </g>
  );
};

// 6 — 2002: Japon bilim insanları gazı üreten gizli enzimi buldu; buluş Ig Nobel ödülü getirdi
const Japon: S = ({ t, d, ws }) => {
  const t02 = ws("2002"), tj = ws("japon"), tg = ws("gazı"), te = ws("enzim"), tgu = ws("güldüren"), tdu = ws("düşündüren"), tn = ws("nobel");
  const gec = ez(ap(t, tg - 0.4, 0.6)); // güneş → laboratuvar
  const odul = ez(ap(t, tgu - 1.1, 0.6)); // laboratuvar → ödül
  const buyutec = ap(t, tg, Math.max(0.6, te - tg));
  const bul = ap(t, te - 0.1, 0.3);
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#e7d3ad" />
      <Kamera t={t} d={Math.min(d, 4)} z0={1.0} z1={1.08} vurus={[t02, tj, te, tn]}>
        {/* güneş + 2002 + Japonya */}
        <g transform={`translate(${-gec * 1100} 0)`}>
          <g transform={`translate(540 ${lerp(1000, 720, easeOut(t / 0.9))}) rotate(${Math.sin(t * 1.3) * 3}) scale(${1 + 0.03 * Math.sin(t * 2.2)})`} filter="url(#kgolge)">
            <rect x={-330} y={-230} width={660} height={460} rx={14} fill={KREM} />
            <path d={`M -310 -210 Q -150 ${-225 + Math.sin(t * 3) * 14} 0 -210 T 310 -210 L 310 210 Q 150 ${195 + Math.sin(t * 3 + 1) * 14} 0 210 T -310 210 Z`} fill="#fff" stroke={INK} strokeWidth={5} />
            <circle r={130 + 6 * Math.sin(t * 2)} fill={KIRMIZI} />
            <text x={0} y={-255} textAnchor="middle" fontSize={50} fontWeight={900} fill={INK} style={font}>JAPONYA</text>
          </g>
          <g transform={`translate(540 1060) scale(${sp(t, t02 - 0.15, 9)}) rotate(-4)`} filter="url(#kgolge)">
            <rect x={-190} y={-75} width={380} height={140} rx={24} fill={INK} />
            <text x={0} y={28} textAnchor="middle" fontSize={96} fontWeight={900} fill={ACC} style={font}>2002</text>
          </g>
        </g>
        {/* laboratuvar: büyüteç gizli enzimi bulur */}
        <g transform={`translate(${(1 - gec) * 1500 - odul * 1500} 0) translate(540 760) scale(1.3) translate(-540 -760)`}>
          {Array.from({ length: 7 }).map((_, i) => {
            const x = 170 + i * 125, y = 760 + Math.sin(adim(t) * 3 + i) * 18;
            const gizli = i === 4;
            return gizli ? (
              <g key={i} transform={`translate(${x} ${y}) scale(${1 + bul * 0.6}) rotate(${bul * Math.sin(t * 6) * 10})`}>
                <circle r={46} fill={bul > 0.5 ? ACC : "#cfc6b6"} stroke={INK} strokeWidth={6} />
                <path d="M -18 0 L 18 0 M 6 0 L 6 16 M 14 0 L 14 12" stroke={INK} strokeWidth={6} strokeLinecap="round" transform="translate(-4 -4)" />
                <circle cx={-24} cy={-4} r={10} fill="none" stroke={INK} strokeWidth={6} />
              </g>
            ) : (
              <circle key={i} cx={x} cy={y} r={40} fill="#cfc6b6" stroke={INK} strokeWidth={5} opacity={1 - bul * 0.5} />
            );
          })}
          {/* büyüteç */}
          <g transform={`translate(${lerp(120, 170 + 4 * 125, ez(buyutec))} ${lerp(600, 740, ez(buyutec)) + Math.sin(t * 2) * 10})`}>
            <circle r={110} fill="rgba(200,230,255,0.25)" stroke={INK} strokeWidth={14} />
            <rect x={70} y={70} width={40} height={190} rx={16} fill="#8b5a2b" stroke={INK} strokeWidth={6} transform="rotate(-45 90 90)" />
          </g>
          <circle cx={170 + 4 * 125} cy={760} r={90 + ((t * 1.4) % 1) * 120} fill="none" stroke={ACC} strokeWidth={10} opacity={bul * (1 - ((t * 1.4) % 1))} />
        </g>
        {/* Ig Nobel */}
        <g transform={`translate(${(1 - odul) * 1100} 0)`}>
          <g transform={`translate(540 ${740 + Math.sin(t * 2) * 10})`} filter="url(#kgolge)">
            <circle r={230} fill={KREM} />
            <circle r={210} fill="#e8b93a" stroke={INK} strokeWidth={8} />
            <circle r={170} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />
            <text x={0} y={-60} textAnchor="middle" fontSize={64} fontWeight={900} fill={INK} style={font}>IG NOBEL</text>
            <text x={0} y={70} textAnchor="middle" fontSize={130} style={font}>{t < tdu - 0.1 ? "😂" : "🤔"}</text>
            <path d="M -110 200 L -150 360 L -60 320 L -20 380 L 0 220 Z M 110 200 L 150 360 L 60 320 L 20 380 L 0 220 Z" fill={KIRMIZI} stroke={INK} strokeWidth={6} />
          </g>
        </g>
      </Kamera>
      <Serit t={t} a={tj - 0.05} cikis={tg - 0.4} text="JAPON BİLİM İNSANLARI" x={540} y={400} size={56} rot={-2} bg={INK} color={KREM} />
      <Serit t={t} a={te - 0.05} cikis={tgu - 1.1} text="GİZLİ ENZİM" x={540} y={400} size={70} rot={2} bg={ACC} />
      <Serit t={t} a={tgu - 0.05} cikis={tdu - 0.15} text="ÖNCE GÜLDÜREN..." x={540} y={1150} size={56} rot={-2} />
      <Serit t={t} a={tdu - 0.05} text="...SONRA DÜŞÜNDÜREN" x={540} y={1150} size={56} rot={2} bg={BLUE} color="#fff" />
      <Muhur t={t} a={tdu + 0.25} text="2013" x={850} y={500} size={80} rot={12} />
      {/* şüpheli bıçak: hikâyenin ipi ortada da görünsün; sahne sonunda ortaya gelip büyür (Cornell'deki bıçağa devreder) */}
      {(() => {
        const dev = ez(ap(t, d - 0.75, 0.6));
        return (
          <g opacity={ap(t, 0.4, 0.4)} transform={`translate(${lerp(760, 540, dev) + Math.sin(t * 1.7) * 6} ${lerp(1600, 1520, dev)}) rotate(${lerp(-18, -20, dev) + Math.sin(t * 2) * 3}) scale(${lerp(1.4, 2.4, dev)})`} filter="url(#kgolge)">
            <g transform="translate(-160 -50)"><Parca t={t} ad="bicak" x={160} y={0} w={320} a={-1} /></g>
            <g opacity={1 - dev}>
              <rect x={-120} y={-140} width={240} height={58} rx={14} fill={KIRMIZI} stroke={INK} strokeWidth={4} />
              <text x={0} y={-99} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fff" style={font}>ŞÜPHELİ ?</text>
            </g>
          </g>
        );
      })()}
      <Merakli x={150} y={1840} s={0.55} t={t} hareket={t > tdu - 0.1 ? "dusun" : t > tgu - 0.3 ? "kahkaha" : "anlat"} kostum="onluk" />
    </g>
  );
};

// 7 — Peki bıçak nereden çıktı? 2025, ABD, Cornell; soğan kesmeyi yüksek hızlı kamerayla çektiler
const Cornell: S = ({ t, d, ws }) => {
  const tb = ws("bıçak"), t25 = ws("2025"), tc = ws("cornell"), ty = ws("yüksek"), tk = ws("kamerayla");
  const ts2 = ws("bilim"); const kam = ap(t, ts2 - 0.3, 0.45);
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#f0b4b4" o={0.3} />
      <Kamera t={t} d={d} z0={1.0} z1={1.1} vurus={[tb, t25, tc, tk]}>
        {/* bıçak döne döne gelir (kancaya dönüş) */}
        <g opacity={1 - ap(t, t25 + 0.1, 0.3)} transform={`translate(540 780) rotate(${(1 - easeOut(ap(t, 0, 0.6))) * 25 + Math.sin(t * 2) * 4}) scale(${1.15 - 0.15 * easeOut(ap(t, 0, 0.6))}) translate(-540 -780)`}>
          <Parca t={t} ad="bicak" x={540} y={600} w={820} rot={-20} />
          <Bant x={840} y={790} w={130} rot={-28} />
        </g>
        {/* Cornell kulesi fotoğrafı */}
        {(() => { const kc = ez(ap(t, ws("üniversitesi") + 0.5, 0.5)); return <Foto t={t} ad="cornellf" id="c1" x={lerp(350, 280, kc)} y={lerp(790, 640, kc)} w={lerp(400, 280, kc)} rot={-4} a={t25 + 0.25} zoom={1 + 0.4 * cl((t - t25) / 4)} />; })()}
        <circle cx={350} cy={790} r={360 + ((t * 1.2) % 1) * 140} fill="none" stroke={KREM} strokeWidth={10} opacity={ap(t, t25 + 0.4, 0.3) * (1 - ((t * 1.2) % 1)) * 0.6} />
        <g transform={`translate(800 600) scale(${sp(t, t25 - 0.1, 9)}) rotate(5)`} filter="url(#kgolge)">
          <rect x={-150} y={-62} width={300} height={124} rx={22} fill={INK} />
          <text x={0} y={30} textAnchor="middle" fontSize={84} fontWeight={900} fill={ACC} style={font}>2025</text>
        </g>
        {/* yüksek hızlı kamera */}
        <g transform={`translate(${lerp(1300, 720, ez(kam))} 880) rotate(${-6 + Math.sin(t * 1.5) * 2})`} filter="url(#kgolge)">
          <rect x={-170} y={-110} width={300} height={220} rx={26} fill={KREM} />
          <rect x={-155} y={-95} width={270} height={190} rx={20} fill="#2a3140" stroke={INK} strokeWidth={6} />
          <rect x={115} y={-60} width={90} height={120} rx={14} fill="#3b4456" stroke={INK} strokeWidth={6} />
          <circle cx={-20} cy={0} r={62} fill="#11161f" stroke="#8a95a8" strokeWidth={8} />
          <circle cx={-34} cy={-16} r={14} fill="#fff" opacity={0.5} />
          <circle cx={-120} cy={-62} r={14} fill={RED} opacity={Math.sin(t * 8) > 0 ? 1 : 0.2} />
          <text x={-95} y={-52} fontSize={26} fontWeight={900} fill="#fff" style={font}>REC</text>
        </g>
        {/* film şeridi: soğan kareleri akar */}
        <g opacity={ap(t, ts2 + 0.2, 0.3)} transform="translate(0 1075)">
          <rect x={-40} y={-70} width={1160} height={140} fill={INK} />
          {Array.from({ length: 8 }).map((_, i) => {
            const x = ((i * 170 - adim(t) * 260) % 1360 + 1360) % 1360 - 160;
            return (
              <g key={i}>
                <rect x={x} y={-50} width={150} height={100} fill="#d98ab6" stroke={KREM} strokeWidth={4} />
                <ellipse cx={x + 75} cy={0} rx={50 - (i % 3) * 8} ry={34} fill="#f6e8f0" stroke={MOR} strokeWidth={4} />
              </g>
            );
          })}
        </g>
      </Kamera>
      <Serit t={t} a={0.05} cikis={t25 - 0.3} text="PEKİ BIÇAK?" x={540} y={420} size={92} rot={-3} bg={ACC} />
      <Serit t={t} a={t25 + 0.6} text="CORNELL ÜNİVERSİTESİ · ABD" x={540} y={400} size={46} rot={2} bg={KIRMIZI} color={KREM} />
      <Serit t={t} a={ty - 0.05} cikis={d - 0.3} text="YÜKSEK HIZLI KAMERA" x={620} y={1000} size={44} rot={-2} bg={INK} color={KREM} />
    </g>
  );
};

// 8 — Kör bıçak daha çok bastırır, hücreyi ezip suyu fışkırtır; hızlı kesince damlalar 140 km/sa'yi aşar
const Kor: S = ({ t, d, ws }) => {
  const tbs = ws("bastırıyor"), tez = ws("ezip"), tf = ws("fışkırtıyor"), th = ws("hızlı"), t140 = ws("140"), ts = ws("sıçrıyor");
  const bas = ap(t, 0.5, Math.max(0.6, tbs + 0.4 - 0.5)); // bastırma
  const kir = t > tf - 0.05 ? 1 : 0;
  const hizli = ap(t, th - 0.1, 0.4);
  const bicakY = lerp(640, 862, ez(bas)) + (kir ? lerp(0, 150, ap(t, tf - 0.05, 0.2)) : 0) + hizli * Math.max(0, Math.sin((t - th) * 9)) * -160;
  const yuk = ap(t, t140 - 0.6, 0.8);
  const deger = yuk < 1 ? 145 * ez(yuk) : 142 + 3 * Math.exp(-(t - t140 - 0.2) * 6) + Math.sin(t * 30) * 0.4;
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#b9c8dc" o={0.25} />
      {/* vizör köşeleri (yüksek hızlı kamera görüntüsü) */}
      <g stroke={KREM} strokeWidth={10} fill="none" opacity={0.85}>
        <path d="M 80 380 L 80 320 L 140 320" /><path d="M 1000 380 L 1000 320 L 940 320" />
        <path d="M 80 1140 L 80 1200 L 140 1200" /><path d="M 1000 1140 L 1000 1200 L 940 1200" />
      </g>
      <circle cx={130} cy={370} r={14} fill={RED} opacity={Math.sin(t * 8) > 0 ? 1 : 0.2} />
      <text x={155} y={382} fontSize={32} fontWeight={900} fill={KREM} style={font}>REC · AĞIR ÇEKİM</text>
      <Kamera t={t} d={d} z0={1.0} z1={1.12} oy={900} vurus={[tbs, tez, tf, t140]}>
        <SoganKesit x={540} y={1110} t={t} ez={ez(bas) * (1 - kir * 0.4)} kesik={kir * 0.6} />
        {/* kör bıçak giremiyor: ileri-geri zorlanır, titrer (bekleme anı canlı kalsın) */}
        <CizimBicak x={540 + (t > tbs - 0.3 && !kir ? Math.sin(t * 11) * 26 : 0)} y={bicakY + (t > tbs - 0.3 && !kir ? Math.abs(Math.sin(t * 11)) * 14 : 0)} kor={1} s={0.75} rot={t > tbs - 0.3 && !kir ? Math.sin(t * 11) * 3 : 0} />
        {t > tbs - 0.3 && !kir ? <g transform={`translate(${790 + Math.sin(t * 30) * 4} 640) rotate(6)`}><rect x={-165} y={-48} width={330} height={84} rx={18} fill={KIRMIZI} stroke={INK} strokeWidth={5} /><text x={0} y={13} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" style={font}>ZORLANIYOR!</text></g> : null}
        {/* basınç okları */}
        <g opacity={ap(t, tbs - 0.4, 0.3) * (1 - kir)}>
          {[-1, 1].map((sg) => <path key={sg} d={`M ${540 + sg * 230} ${700 + Math.sin(t * 9) * 8} L ${540 + sg * 140} ${800} M ${540 + sg * 140} 800 l ${sg * 40} -6 M ${540 + sg * 140} 800 l ${sg * 6} -40`} stroke={KIRMIZI} strokeWidth={14} strokeLinecap="round" fill="none" />)}
        </g>
        <Fiskir t={t} t0={tf - 0.05} x={540} y={860} n={20} hiz={1.05} yay={60} />
        <Fiskir t={t} t0={th + 0.25} x={540} y={860} n={14} hiz={1.35} yay={50} />
        <Fiskir t={t} t0={th + 1.1} x={540} y={860} n={14} hiz={1.4} yay={55} />
        {/* hız çizgileri */}
        {t > th ? Array.from({ length: 6 }).map((_, i) => {
          const u = ((t - th) * 2 + i / 6) % 1;
          return <line key={i} x1={300 + i * 90} x2={300 + i * 90} y1={760 - u * 600} y2={700 - u * 600 - 120} stroke={KREM} strokeWidth={8} opacity={(1 - u) * hizli} strokeLinecap="round" />;
        }) : null}
      </Kamera>
      <g opacity={ap(t, t140 - 0.7, 0.3)}><Gosterge x={540} y={1610} deger={deger} t={t} k={sp(t, t140 - 0.7, 10)} /></g>
      <Serit t={t} a={0.15} cikis={tez - 0.2} text="KÖR BIÇAK" x={250} y={480} size={56} rot={-3} bg={KIRMIZI} color={KREM} />
      <Serit t={t} a={tez - 0.05} cikis={th - 0.2} text="EZER!" x={250} y={480} size={64} rot={2} bg={ACC} />
      <Serit t={t} a={th - 0.05} cikis={ts + 0.6} text="HIZLI KESİNCE" x={265} y={480} size={44} rot={-2} bg={INK} color={KREM} />
    </g>
  );
};

// 9 — Keskin bıçakla yavaş kesersen damlalar göz hizasına bile ulaşamaz
const Keskin: S = ({ t, d, ws }) => {
  const tk = ws("keskin"), tyv = ws("yavaş"), tdm = ws("damlalar"), tu = ws("ulaşamıyor");
  const kes = ap(t, tyv - 0.2, Math.max(0.8, tu - tyv));
  const by = lerp(640, 1060, ez(kes));
  return (
    <g>
      <KolajDefs />
      <Kirpinti t={t} renk="#d9f1e1" o={0.3} />
      <Kamera t={t} d={d} z0={1.0} z1={1.08} oy={900} vurus={[tk, tu]}>
        <GozHizasi y={660} k={ap(t, tdm - 0.4, 0.3)} t={t} />
        <SoganKesit x={540} y={1110} t={t} kesik={ez(kes)} />
        <CizimBicak x={540} y={by} kor={0} s={0.75} />
        {/* birkaç küçük damla: göz hizasına varamadan geri düşer */}
        <Fiskir t={t} t0={tdm - 0.2} x={540} y={850} n={8} hiz={0.42} yay={40} s={0.6} />
        <Fiskir t={t} t0={tdm + 0.5} x={540} y={850} n={6} hiz={0.4} yay={40} s={0.55} />
        <g transform={`translate(880 760) scale(${Math.min(1.05, sp(t, tu - 0.1, 9))})`}>
          <circle r={64} fill={GREEN} stroke={INK} strokeWidth={7} />
          <path d="M -28 0 L -8 22 L 30 -22" stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" />
        </g>
      </Kamera>
      <Serit t={t} a={tdm - 0.05} text="ÇOK DAHA AZ DAMLA" x={540} y={325} size={46} rot={-1} bg={INK} color={KREM} />
      <Serit t={t} a={tk - 0.05} text="KESKİN" x={250} y={420} size={64} rot={-3} bg={GREEN} color="#fff" />
      <Serit t={t} a={tyv - 0.05} text="+ YAVAŞ" x={820} y={420} size={64} rot={3} bg={KREM} color={INK} />
    </g>
  );
};

// 10 — Bir dahaki sefere soğan seni ağlatırsa ona kızma: bıçağına bak. (döngü: açılışa geri döner)
const Son: S = ({ t, d, ws }) => {
  const tsg = ws("soğan"), tkz = ws("kızma"), tb = ws("bıçağa");
  const cik = 1 - ap(t, d - 0.22, 0.2);
  return (
    <g opacity={cik}>
      <KolajDefs />
      <Kirpinti t={t} />
      <Kamera t={t} d={d} z0={1.0} z1={1.12} vurus={[tsg, tkz, tb]}>
        <Foto t={t} ad="halka" id="s1" x={540} y={780} w={800} rot={2} a={-1} cikis={tb - 0.6} />
        <g transform={`translate(${lerp(0, -170, ap(t, tb - 0.3, 0.4))} 0)`}>
          <Suz t={t} a={6}>
            <Parca t={t} ad="sogan" x={540} y={470} w={400} rot={-4} a={tsg - 0.2} yon="alt" />
            {t > tsg ? <Gozler x={540} y={900} t={t} mutlu={ap(t, tkz - 0.2, 0.3)} s={0.9} /> : null}
          </Suz>
        </g>
        {t > tkz ? (
          <g transform={`translate(${380} ${560}) scale(${sp(t, tkz, 9)})`}>
            <path d="M 0 30 C -60 -20 -40 -70 0 -40 C 40 -70 60 -20 0 30 Z" fill={KIRMIZI} stroke={INK} strokeWidth={5} />
          </g>
        ) : null}
        <g transform={`translate(${lerp(700, 230, ez(ap(t, tb - 0.3, 0.4)))} 0) rotate(${lerp(30, 0, ez(ap(t, tb - 0.3, 0.4)))} 560 760)`} opacity={ap(t, tb - 0.3, 0.2)}>
          <Parca t={t} ad="bicak" x={560} y={640} w={720} rot={-94} a={tb - 0.3} yon="sag" />
        </g>
      </Kamera>
      <Serit t={t} a={0.1} cikis={ws("ağlatırsa") - 0.1} text="GAZI SOĞAN YAPAR" x={540} y={340} size={56} rot={-2} bg={INK} color={KREM} />
      <Serit t={t} a={ws("ağlatırsa")} text="MİKTARINI BIÇAK BELİRLER" x={540} y={340} size={48} rot={2} bg={KIRMIZI} color={KREM} />
      <Serit t={t} a={tkz - 0.05} cikis={tb - 0.45} text="ONA KIZMA" x={540} y={1150} size={68} rot={-3} bg={GREEN} color="#fff" />
      <Muhur t={t} a={tb + 0.15} text="SUÇLU" x={760} y={980} size={96} rot={-10} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, savunma: Savunma, hucre: HucreS, gaz: GazS, goz: GozS, japon: Japon, cornell: Cornell, kor: Kor, keskin: Keskin, son: Son };

export const KAPAK: React.FC = () => (
  <g>
    <KolajDefs />
    <Parca t={0} ad="sogan" x={380} y={1040} w={380} rot={-6} />
    <Gozler x={380} y={1460} t={0.5} s={0.85} />
    <Damla x={430} y={1540} s={1.1} /><Damla x={330} y={1580} s={0.8} />
    <g transform="rotate(-24 760 1300)"><Parca t={0} ad="bicak" x={760} y={1150} w={700} /></g>
  </g>
);
export const KAPAK_YAZI = { ust: "Soğan neden ağlatır?", buyuk: "SUÇLU: BIÇAK?", alt: "" };
