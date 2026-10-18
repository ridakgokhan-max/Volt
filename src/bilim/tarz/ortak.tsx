// Tarz demoları için ortak parçalar: konserve videosunun ilk ~11 saniyesi (ses + kelime zamanları).
import React from "react";
import { Audio, interpolate, spring, staticFile } from "remotion";
import konserve from "../data/konserve.json";

export const FPS = 30;
export const TARZ_SURE = 11.4; // saniye
export const TARZ_KARE = Math.round(TARZ_SURE * FPS);

// sahne sınırları (konserve.json'daki ilk üç sahne)
export const S2 = 3.294;
export const S3 = 6.456;

type Kelime = { w: string; s: number; e: number };
const K = konserve.kelimeler as Kelime[];
const SAT = konserve.satirlar as [number, number][];

export const cl = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** a anında başlayıp d saniyede 0→1 giden yumuşak geçiş */
export const ap = (t: number, a: number, d: number) => ease(cl((t - a) / d));
/** a anında zıplayarak beliren değer (0→1, hafif taşmalı) */
export const pop = (t: number, a: number, damping = 11) =>
  t < a ? 0 : spring({ frame: (t - a) * FPS, fps: FPS, config: { damping, stiffness: 160 } });
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** kelimenin başlangıç zamanı (ilk eşleşme) */
export const kz = (w: string) => {
  const k = K.find((x) => x.w.toLowerCase().startsWith(w.toLowerCase()));
  return k ? k.s : 0;
};

export type AltyaziKelime = { w: string; durum: "gecti" | "simdi" | "gelecek" };
/** t anındaki altyazı satırı */
export const altyazi = (t: number): AltyaziKelime[] => {
  let idx = -1;
  for (let i = 0; i < SAT.length; i++) if (K[SAT[i][0]].s - 0.05 <= t) idx = i;
  if (idx < 0) idx = 0;
  const [a, b] = SAT[idx];
  if (K[b].s > TARZ_SURE) return [];
  const out: AltyaziKelime[] = [];
  for (let i = a; i <= b; i++) {
    const k = K[i];
    out.push({ w: k.w, durum: t >= k.e ? "gecti" : t >= k.s - 0.03 ? "simdi" : "gelecek" });
  }
  return out;
};

export const Ses: React.FC = () => (
  <Audio
    src={staticFile("bilim/konserve/mix.m4a")}
    endAt={TARZ_KARE}
    volume={(f) => interpolate(f, [TARZ_KARE - 20, TARZ_KARE - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
  />
);

/** 540x960 tasarım koordinatlarını 1080x1920 kareye büyütür */
export const Olcek: React.FC<{ children: React.ReactNode; bg: string }> = ({ children, bg }) => (
  <div style={{ width: 1080, height: 1920, background: bg, overflow: "hidden", position: "relative" }}>
    <div style={{ width: 540, height: 960, transform: "scale(2)", transformOrigin: "0 0", position: "absolute", left: 0, top: 0 }}>
      {children}
    </div>
  </div>
);
