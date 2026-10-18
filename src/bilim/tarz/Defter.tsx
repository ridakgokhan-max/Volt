// Tarz demosu 1: Defter (el çizimi) — kareli kâğıt, mürekkep çizgiler, fosforlu vurgu, "kaynayan" çizgi.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { altyazi, ap, cl, FPS, kz, lerp, Olcek, pop, S2, S3, Ses } from "./ortak";

const { fontFamily: EL } = loadFont("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const INK = "#1d1d1b";
const SARI = "#FFD84A";
const KIRMIZI = "#C8432B";
const KAGIT = "#F7F2E6";

// çizerek beliren yol
const Ciz: React.FC<{ d: string; k: number; w?: number; c?: string; fill?: string }> = ({ d, k, w = 4, c = INK, fill = "none" }) =>
  k <= 0 ? null : (
    <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cl(k)} fill={k >= 1 ? fill : "none"}
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );

const Merakli: React.FC<{ x: number; y: number; t: number; kol?: "salla" | "goster" | "dur"; adim?: number; yon?: 1 | -1 }> = ({ x, y, t, kol = "dur", adim = 0, yon = 1 }) => {
  const s = Math.sin(t * 9) * 0.5 + 0.5;
  let rx = 26, ry = 62;
  if (kol === "salla") { rx = 30 + s * 6; ry = 4 - s * 18; }
  if (kol === "goster") { rx = 46; ry = 30; }
  const b = Math.sin(adim * Math.PI * 2) * 14;
  const zip = -Math.abs(Math.sin(adim * Math.PI * 2)) * 3;
  return (
    <g transform={`translate(${x} ${y + zip}) scale(${yon * 1.15} 1.15)`}>
      <g fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M-4 -22 C-7 -40 14 -44 12 -31 C11 -24 3 -25 2 -18" />
        <path d="M1 -22 C16 -21 23 -8 22 3 C21 16 10 23 -1 22 C-14 21 -22 11 -21 -1 C-20 -14 -11 -22 2 -21" fill={KAGIT} />
        <circle cx={-8} cy={1} r={6.5} strokeWidth={2.5} />
        <circle cx={9} cy={1} r={6.5} strokeWidth={2.5} />
        <path d="M-1.5 0 L2.5 0" strokeWidth={2} />
        <path d="M-6 12 Q1 17 8 12" strokeWidth={2.5} />
        <path d="M0 23 C1 45 2 68 3 92" />
        <path d="M1 42 C-10 50 -18 58 -26 66" />
        <path d={`M1 42 Q${(1 + rx) / 2 + 4} ${(42 + ry) / 2 - 6} ${rx} ${ry}`} />
        <path d={`M3 92 L${-16 + b} 138`} />
        <path d={`M3 92 L${22 - b} 138`} />
      </g>
      <path d="M-15 27 C-4 33 9 33 17 26" fill="none" stroke="#F2C230" strokeWidth={7} strokeLinecap="round" />
      <path d={`M11 30 L${19 + Math.sin(t * 6) * 3} 50`} fill="none" stroke="#F2C230" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

const Kutu: React.FC<{ k: number; tarama: number; yazi?: number; s?: number }> = ({ k, tarama, yazi = 0, s = 1 }) => (
  <g transform={`scale(${s})`}>
    <Ciz d="M-92 2 C-90 -30 90 -32 92 -1 C93 28 -90 30 -92 2 Z" k={k * 1.4} fill="#FFFFFF" />
    <Ciz d="M-60 0 C-55 -14 55 -15 60 0" k={k * 1.4 - 0.3} w={2.5} />
    <Ciz d="M-92 4 C-93 70 -91 160 -90 226" k={k * 1.3 - 0.1} />
    <Ciz d="M92 2 C93 80 91 160 90 228" k={k * 1.3 - 0.15} />
    <Ciz d="M-90 226 C-88 262 88 262 90 228" k={k * 1.3 - 0.3} />
    <Ciz d="M-91 70 C-50 86 50 86 92 70" k={k * 1.5 - 0.5} />
    <Ciz d="M-90 158 C-50 174 50 174 91 158" k={k * 1.5 - 0.5} />
    <g opacity={0.55}>
      {[[-84, 92, -70, 150], [-66, 96, -52, 156], [-48, 98, -34, 160], [56, 98, 70, 158], [72, 94, 84, 146]].map(([a, b2, c, d], i) => (
        <Ciz key={i} d={`M${a} ${b2} L${c} ${d}`} k={tarama * 6 - i} w={2} />
      ))}
    </g>
    <text x={0} y={136} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={54} fill={KIRMIZI} opacity={yazi}>1810</text>
  </g>
);

const Acacak: React.FC<{ k: number }> = ({ k }) => (
  <g>
    <Ciz d="M0 0 L58 -4 L60 12 L2 16 Z" k={k * 1.5} fill="#FFFFFF" />
    <Ciz d="M60 2 C82 -2 90 14 76 24 L68 16" k={k * 1.5 - 0.5} />
  </g>
);

export const TarzDefter: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const seed = Math.floor(f / 4); // çizgiler saniyede ~7 kez "kaynar"

  // sahne kaydırmaları (sayfa çevirir gibi)
  const c1 = ap(t, S2 - 0.1, 0.4);
  const g2 = ap(t, S2 - 0.1, 0.4), c2 = ap(t, S3 - 0.1, 0.4);
  const g3 = ap(t, S3 - 0.1, 0.4);

  const sat = altyazi(t);
  const tAc = kz("açacağı"), t50 = kz("50"), tGeldi = kz("geldi"), t1810 = kz("1810"), tIng = kz("İngiltere");
  const tMetal = kz("metal"), tPat = kz("patentlendi");

  const yuruX = lerp(70, 395, ap(t, S2 + 0.3, 2.6));

  return (
    <AbsoluteFill>
      <Ses />
      <Olcek bg={KAGIT}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#E4DCC8 1px, transparent 1px), linear-gradient(90deg, #E4DCC8 1px, transparent 1px)", backgroundSize: "30px 30px", backgroundPosition: `${-c1 * 0}px 0` }} />
        <svg width={540} height={960} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="kaynat">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} />
              <feDisplacementMap in="SourceGraphic" scale={3.2} />
            </filter>
          </defs>

          {/* rozet */}
          <g filter="url(#kaynat)">
            <path d="M57 32 C73 31 83 43 82 58 C81 74 69 83 55 82 C40 81 31 69 32 55 C33 41 44 33 59 33" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          </g>
          <text x={57} y={64} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={22} fill={INK}>7/30</text>
          <text x={94} y={66} fontFamily={EL} fontWeight={700} fontSize={26} fill={INK}>TARİH</text>
          <text x={512} y={64} textAnchor="end" fontFamily={EL} fontWeight={700} fontSize={24} fill={INK}>Bir Dakikada Bilim</text>

          {/* ---------- SAHNE 1 ---------- */}
          {c1 < 1 && (
            <g transform={`translate(${-c1 * 560} 0)`} filter="url(#kaynat)">
              <g transform="translate(270 490)">
                <Kutu k={ap(t, 0.1, 1.0)} tarama={ap(t, 0.9, 0.5)} yazi={ap(t, 1.1, 0.3)} />
              </g>
              <g transform={`translate(410 ${600 - (1 - pop(t, 1.4, 9)) * 420}) rotate(${24 + (1 - pop(t, 1.4, 9)) * 40})`} opacity={t > 1.4 ? 1 : 0}>
                <path d="M-7 -10 C-8 50 -6 110 -5 160 L7 160 C8 110 7 50 7 -10 Z" fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
                <path d="M-46 -40 C-20 -44 30 -44 50 -40 L50 -8 C26 -5 -22 -5 -46 -8 Z" fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
              </g>
              <Ciz d="M150 770 C230 766 330 774 420 768" k={ap(t, 0.05, 0.6)} />
              {/* "açacak? yok!" notu */}
              <g transform="translate(330 335)">
                <g transform="scale(0.8)"><Acacak k={ap(t, tAc, 0.4)} /></g>
                <Ciz d="M-8 -14 L80 28" k={ap(t, tAc + 0.45, 0.2)} w={5} c={KIRMIZI} />
                <Ciz d="M80 -14 L-8 28" k={ap(t, tAc + 0.6, 0.2)} w={5} c={KIRMIZI} />
              </g>
              <Merakli x={lerp(-60, 82, ap(t, 0, 0.8))} y={640} t={t} kol={t > 0.8 ? "salla" : "dur"} adim={t < 0.8 ? t * 2.5 : 0} />
            </g>
          )}

          {/* ---------- SAHNE 2: zaman çizelgesi ---------- */}
          {g2 > 0 && c2 < 1 && (
            <g transform={`translate(${(1 - g2) * 560 - c2 * 560} 0)`} filter="url(#kaynat)">
              <Ciz d="M60 720 C160 716 300 724 480 718" k={ap(t, S2 + 0.25, 1.4)} w={5} />
              <circle cx={60} cy={720} r={9 * pop(t, S2 + 0.25)} fill={INK} />
              <g transform="translate(60 630) scale(0.32)"><Kutu k={ap(t, S2 + 0.3, 0.6)} tarama={ap(t, S2 + 0.6, 0.3)} /></g>
              <text x={60} y={770} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={34} fill={INK} opacity={ap(t, S2 + 0.4, 0.3)}>1810</text>
              {/* 50 yıl */}
              <text x={270} y={410} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={64} fill={KIRMIZI}
                opacity={ap(t, t50 - 0.05, 0.15)} transform={`rotate(-4 270 390)`}>~50 yıl!</text>
              <Ciz d="M180 380 C170 340 260 332 350 350 C400 362 380 422 300 424 C220 426 166 410 186 370" k={ap(t, t50 + 0.15, 0.5)} w={3} c={KIRMIZI} />
              {/* varış */}
              <circle cx={480} cy={718} r={9 * pop(t, tGeldi - 0.3)} fill={KIRMIZI} />
              <g transform="translate(440 650)"><Acacak k={ap(t, tGeldi - 0.3, 0.5)} /></g>
              <text x={480} y={770} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={34} fill={KIRMIZI} opacity={ap(t, tGeldi - 0.2, 0.3)}>1850'ler</text>
              <Merakli x={yuruX} y={561} t={t} adim={t > S2 + 0.3 && t < S2 + 2.9 ? (t - S2) * 2.2 : 0} kol={t > S2 + 2.9 ? "salla" : "dur"} />
            </g>
          )}

          {/* ---------- SAHNE 3: patent ---------- */}
          {g3 > 0 && (
            <g transform={`translate(${(1 - g3) * 560} 0)`} filter="url(#kaynat)">
              <g transform="rotate(-3 270 470)">
                <Ciz d="M110 250 L420 246 L424 660 L114 664 Z" k={ap(t, S3 + 0.1, 0.7)} fill="#FFFFFF" />
                <text x={268} y={322} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={62} fill={INK} opacity={ap(t, S3 + 0.4, 0.3)}>PATENT</text>
                <text x={268} y={366} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={32} fill={INK} opacity={ap(t, t1810, 0.25)}>1810</text>
                <text x={268} y={400} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={30} fill={INK} opacity={ap(t, tIng, 0.25)}>İngiltere</text>
                {[0, 1, 2].map((i) => (
                  <Ciz key={i} d={`M150 ${430 + i * 22} C220 ${426 + i * 22} 300 ${434 + i * 22} ${i === 2 ? 300 : 386} ${430 + i * 22}`} k={ap(t, kz("yiyeceği") + i * 0.25, 0.35)} w={2.5} />
                ))}
                <g transform="translate(268 530) scale(0.38)"><Kutu k={ap(t, tMetal, 0.6)} tarama={ap(t, tMetal + 0.5, 0.3)} /></g>
              </g>
              {/* mühür */}
              <g transform={`translate(330 590) rotate(-14) scale(${t >= tPat ? 2.2 - 1.2 * pop(t, tPat, 9) : 0})`} opacity={ap(t, tPat, 0.05) * 0.9}>
                <rect x={-96} y={-30} width={192} height={60} rx={8} fill="none" stroke={KIRMIZI} strokeWidth={5} />
                <text x={0} y={14} textAnchor="middle" fontFamily={EL} fontWeight={700} fontSize={42} fill={KIRMIZI}>ONAYLANDI</text>
              </g>
              <Merakli x={455} y={660} t={t} kol={t > S3 + 0.6 ? "goster" : "dur"} yon={-1} />
            </g>
          )}
        </svg>

        {/* kanca (ilk karede okunur) */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 112, textAlign: "center", lineHeight: 0.95, fontFamily: EL, color: INK, fontWeight: 700, transform: `translateX(${-c1 * 560}px)` }}>
          <div style={{ position: "relative", display: "inline-block", fontSize: 78 }}>
            <span style={{ position: "absolute", left: -10, top: 30, height: 44, width: `calc(${ap(t, 0.05, 0.35) * 100}% + 20px)`, background: SARI, transform: "rotate(-2deg)", borderRadius: 8, opacity: 0.85 }} />
            <span style={{ position: "relative" }}>Açacağı</span>
          </div>
          <div style={{ fontSize: 68, marginTop: 4 }}>50 yıl sonra geldi!</div>
        </div>

        {/* altyazı */}
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 54, textAlign: "center", fontFamily: EL, fontWeight: 700, fontSize: 40, lineHeight: 1.15, color: INK }}>
          {sat.map((k, i) => (
            <span key={i} style={{ position: "relative", display: "inline-block", margin: "0 6px", color: k.durum === "gelecek" ? "#A8A296" : INK }}>
              {k.durum === "simdi" && <span style={{ position: "absolute", left: -6, right: -6, top: 16, height: 26, background: SARI, transform: "rotate(-1.5deg)", borderRadius: 6 }} />}
              <span style={{ position: "relative" }}>{k.w}</span>
            </span>
          ))}
        </div>
      </Olcek>
    </AbsoluteFill>
  );
};
