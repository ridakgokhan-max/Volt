// Ücretsiz kolaj B-roll denemesi (gbro-collage-broll yerine kendi sistemimiz).
// Parçalar: Openverse CC0/kamu malı fotoğraflar → scripts/kolaj_kes.py (rembg + halftone + krem kenar).
// Hareket: 12 kare/sn "stop-motion" adımları + her adımda minik titreme.
import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { INK } from "./kit";

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin", "latin-ext"] });
const FPS = 30;
export const KOLAJ_DEMO_SURE = 15;

const KREM = "#F4ECD8";
const KIRMIZI = "#C8402B";
const cl = (x: number) => Math.max(0, Math.min(1, x));
const geri = (x: number) => { const c = 1.9; const y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; }; // easeOutBack
const adim = (t: number) => Math.floor(t * 12) / 12; // stop-motion zamanı
const src = (ad: string) => staticFile(`bilim/kolaj-demo/${ad}.png`);

type Yon = "alt" | "ust" | "sol" | "sag" | "pop";
const Parca: React.FC<{ t: number; ad: string; x: number; y: number; w: number; rot?: number; a: number; yon?: Yon; d?: number; cikis?: number; ekstra?: React.CSSProperties }> = ({ t, ad, x, y, w, rot = 0, a, yon = "pop", d = 0.4, cikis, ekstra }) => {
  const tq = adim(t);
  if (tq < a) return null;
  const k = geri(cl((tq - a) / d));
  let dx = 0, dy = 0, s = 1;
  if (yon === "alt") dy = (1 - k) * 1200;
  if (yon === "ust") dy = -(1 - k) * 1200;
  if (yon === "sol") dx = -(1 - k) * 1200;
  if (yon === "sag") dx = (1 - k) * 1200;
  if (yon === "pop") s = Math.max(0, k);
  let o = 1;
  if (cikis !== undefined && tq > cikis) { const c = cl((tq - cikis) / 0.35); s *= 1 - c; o = 1 - c; }
  const n = Math.floor(t * 12);
  const jr = (random(`${ad}r${n}`) - 0.5) * 1.2;
  const jx = (random(`${ad}x${n}`) - 0.5) * 3;
  return (
    <Img
      src={src(ad)}
      style={{
        position: "absolute", left: x - w / 2, top: y, width: w, opacity: o,
        transform: `translate(${dx + jx}px, ${dy}px) rotate(${rot + jr}deg) scale(${s})`, transformOrigin: "50% 60%",
        filter: "drop-shadow(10px 14px 0 rgba(40,20,0,0.28))", ...ekstra,
      }}
    />
  );
};

// Yırtık kâğıt şerit üzerinde yazı
const Serit: React.FC<{ t: number; a: number; text: string; y: number; rot?: number; size?: number; bg?: string; color?: string; sabit?: boolean }> = ({ t, a, text, y, rot = -2, size = 74, bg = KREM, color = INK, sabit }) => {
  const tq = adim(t);
  if (!sabit && tq < a) return null;
  const k = sabit ? 1 : geri(cl((tq - a) / 0.3));
  const n = Math.floor(t * 12);
  const jr = (random(`s${text}${n}`) - 0.5) * 0.8;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `rotate(${rot + jr}deg) scaleX(${Math.max(0, k)})`, background: bg, color, fontFamily, fontWeight: 900, fontSize: size,
          lineHeight: 1.02, padding: "22px 44px 26px", textAlign: "center", maxWidth: 940, letterSpacing: -0.5,
          clipPath: "polygon(0 6%, 5% 0, 14% 5%, 26% 1%, 38% 6%, 50% 0, 63% 5%, 75% 1%, 87% 6%, 100% 2%, 98% 94%, 90% 100%, 78% 95%, 66% 100%, 54% 96%, 42% 100%, 30% 95%, 18% 100%, 7% 96%, 1% 100%)",
          filter: "drop-shadow(8px 10px 0 rgba(40,20,0,0.3))",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Kırmızı mühür (EVET! / ATMA!)
const Muhur: React.FC<{ t: number; a: number; text: string; x: number; y: number; rot?: number; size?: number }> = ({ t, a, text, x, y, rot = -12, size = 120 }) => {
  const tq = adim(t);
  if (tq < a) return null;
  const k = cl((tq - a) / 0.17);
  const s = 2.2 - 1.2 * k;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: k, fontFamily, fontWeight: 900, fontSize: size, color: KIRMIZI, border: `12px solid ${KIRMIZI}`, borderRadius: 28, padding: "6px 34px", background: "rgba(244,236,216,0.82)", letterSpacing: 2 }}>
      {text}
    </div>
  );
};

// Düz renk zemin + büyük açık daire + kâğıt dokusu
const Zemin: React.FC<{ renk: string; daire: string; cx?: number; cy?: number; r?: number }> = ({ renk, daire, cx = 540, cy = 980, r = 430 }) => (
  <AbsoluteFill style={{ background: renk }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="nk" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="3.2" fill="rgba(0,0,0,0.07)" /></pattern>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={daire} />
      <circle cx={cx} cy={cy} r={r} fill="url(#nk)" />
    </svg>
  </AbsoluteFill>
);

const Doku: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2.5) % 4; // dokunun da hafif "kaynaması"
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", pointerEvents: "none" }}>
      <filter id={`lif${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={seed + 2} />
        <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.08  0 0 0 0.16 0" />
      </filter>
      <rect width={1080} height={1920} filter={`url(#lif${seed})`} />
    </svg>
  );
};

// Sahne geçişi: yeni renk alttan yırtık kenarla yukarı kayar
const Gecis: React.FC<{ t: number; a: number; renk: string }> = ({ t, a, renk }) => {
  const tq = adim(t);
  if (tq < a - 0.01 || tq > a + 0.5) return null;
  const k = cl((tq - a) / 0.42);
  const y = 1920 * (1 - k) - 80;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d={`M0 ${y + 40} L90 ${y} L200 ${y + 50} L330 ${y + 10} L470 ${y + 55} L600 ${y + 5} L740 ${y + 48} L880 ${y + 8} L1080 ${y + 40} L1080 2000 L0 2000 Z`} fill={renk} />
    </svg>
  );
};

const Sahne1: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    <Zemin renk="#E2733A" daire="#F09A5C" cy={1050} />
    <Parca t={t} ad="piramit" x={520} y={1080} w={1060} a={0} yon="alt" d={0.01} />
    <Parca t={t} ad="kup2" x={600} y={700} w={380} rot={3} a={0.5} yon="pop" />
    <Parca t={t} ad="ari" x={-100 + 1300 * cl((t - 1.4) / 3.2)} y={620 + 90 * Math.sin(t * 5)} w={230} rot={-8} a={1.4} yon="pop" d={0.15} />
    <Serit t={t} a={0} sabit text="3000 YILLIK BAL" y={200} size={96} rot={-2.5} />
    <Serit t={t} a={0} sabit text="HÂLÂ YENEBİLİR Mİ?" y={360} size={70} rot={1.5} bg={INK} color={KREM} />
    <Muhur t={t} a={2.6} text="EVET!" x={300} y={1000} rot={-14} />
  </AbsoluteFill>
);

const Sahne2: React.FC<{ t: number }> = ({ t }) => {
  // mikroplar 6.0'da gelir, kavanoza yaklaşır, 7.4'te sekip küçülür
  const yak = cl((adim(t) - 6.2) / 1.0);
  const sek = cl((adim(t) - 7.3) / 0.35);
  const mx = 300 * yak - 260 * sek;
  return (
    <AbsoluteFill>
      <Zemin renk="#DDA43C" daire="#EDC066" cy={1020} />
      <Parca t={t} ad="mikroskop" x={880} y={1420} w={330} rot={8} a={5.6} yon="sag" />
      <Parca t={t} ad="balkavanoz" x={540} y={500} w={330} a={5.15} yon="alt" />
      <Parca t={t} ad="mikrop" x={20 + mx} y={900} w={330} rot={-10} a={6.0} yon="sol" cikis={7.8} />
      <Parca t={t} ad="mikrop2" x={1060 - mx} y={1150} w={330} rot={12} a={6.1} yon="sag" cikis={7.8} />
      <Serit t={t} a={5.1} text="BAL NEDEN BOZULMAZ?" y={200} size={84} rot={-2} />
      <Muhur t={t} a={7.4} text="✕" x={300} y={1000} size={110} rot={0} />
      <Muhur t={t} a={7.5} text="✕" x={780} y={1250} size={110} rot={0} />
      <Serit t={t} a={8.0} text="İÇİNDE SERBEST SU YOK" y={1500} size={62} rot={1.5} bg={INK} color={KREM} />
      <Serit t={t} a={8.6} text="MİKROP ÇOĞALAMAZ" y={1640} size={62} rot={-1.5} />
    </AbsoluteFill>
  );
};

const Sahne3: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    <Zemin renk="#6E9E62" daire="#8FBB7F" cy={1000} />
    <Parca t={t} ad="kavanoz2" x={500} y={560} w={540} rot={-3} a={10.15} yon="alt" />
    <Parca t={t} ad="kasik" x={870} y={860} w={330} rot={14} a={11.9} yon="sag" />
    <Parca t={t} ad="ari" x={1200 - 1400 * cl((t - 12.6) / 2.4)} y={500 + 70 * Math.sin(t * 6)} w={200} rot={10} a={12.6} yon="pop" d={0.15} />
    <Serit t={t} a={10.1} text="BALIN ŞEKERLENDİ Mİ?" y={200} size={80} rot={-2} />
    <Muhur t={t} a={11.0} text="ATMA!" x={300} y={1180} rot={-14} />
    <Serit t={t} a={12.2} text="ILIK SUDA ERİT" y={1460} size={78} rot={1.5} bg={INK} color={KREM} />
    <Serit t={t} a={12.9} text="BOZULMADI, SADECE ŞEKERİ ÇÖKTÜ" y={1610} size={50} rot={-1.5} />
  </AbsoluteFill>
);

export const KolajDemo: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{ background: INK }}>
      {t < 5 ? <Sahne1 t={t} /> : t < 10 ? <Sahne2 t={t} /> : <Sahne3 t={t} />}
      <Gecis t={t} a={4.6} renk="#DDA43C" />
      <Gecis t={t} a={9.6} renk="#6E9E62" />
      <Doku />
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: KREM, opacity: 0.9 }}>
        BİR DAKİKADA BİLİM · KOLAJ DENEMESİ
      </div>
    </AbsoluteFill>
  );
};
