// Tarz demosu 2: Kâğıt kesik — renkli kâğıt katmanları, gerçek gölge, kâğıt dokusu, 12 kare/sn stop-motion hissi.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { altyazi, ap, FPS, kz, lerp, Olcek, pop, S2, S3, Ses } from "./ortak";

const { fontFamily: YAZI } = loadFont("normal", { weights: ["500", "800"], subsets: ["latin", "latin-ext"] });

const KOYU = "#2B2622";
const KREM = "#FBF6EC";
const KIRMIZI = "#C2462E";
const SARI = "#F5D04A";
const ZEMIN = "#E3A945";

// her parçaya adım adım değişen minik eğiklik (elle yerleştirilmiş his)
const oyna = (adim: number, id: number) => Math.sin(adim * 12.9898 + id * 78.233) * 0.9;

const Merakli: React.FC<{ x: number; y: number; t: number; kol?: "salla" | "goster" | "dur"; adim?: number; yon?: 1 | -1 }> = ({ x, y, t, kol = "dur", adim = 0, yon = 1 }) => {
  const sag = kol === "salla" ? -150 + Math.sin(t * 9) * 22 : kol === "goster" ? -100 : -50;
  const b = Math.sin(adim * Math.PI * 2) * 20;
  return (
    <g transform={`translate(${x} ${y}) scale(${yon * 1.2} 1.2)`}>
      <g filter="url(#golge)">
        <circle cx={0} cy={-58} r={24} fill={KREM} />
        <rect x={-6} y={-34} width={12} height={68} rx={6} fill={KREM} />
        <rect x={-5} y={-26} width={10} height={46} rx={5} fill={KREM} transform={`rotate(${sag} 0 -26)`} />
        <rect x={-5} y={-26} width={10} height={46} rx={5} fill={KREM} transform="rotate(140 0 -26)" />
        <rect x={-5} y={28} width={10} height={50} rx={5} fill={KREM} transform={`rotate(${22 + b} 0 28)`} />
        <rect x={-5} y={28} width={10} height={50} rx={5} fill={KREM} transform={`rotate(${-22 + b} 0 28)`} />
        <path d="M-18 -36 C-6 -28 8 -28 20 -36 L22 -28 C8 -20 -8 -20 -20 -28 Z" fill={SARI} />
        <path d="M10 -28 L22 -4 L14 -2 L4 -26 Z" fill={SARI} />
      </g>
      <g fill="none" stroke={KOYU} strokeWidth={2.5}>
        <circle cx={-8} cy={-58} r={6.5} />
        <circle cx={9} cy={-58} r={6.5} />
        <path d="M-1.5 -59 L2.5 -59" />
        <path d="M-5 -46 Q1 -42 7 -46" strokeLinecap="round" />
        <path d="M-3 -82 C-5 -98 14 -100 12 -89 C11 -83 4 -84 3 -79" strokeLinecap="round" strokeWidth={3.5} />
      </g>
    </g>
  );
};

const Kutu: React.FC = () => (
  <g filter="url(#golge)">
    <path d="M-95 0 L-95 230 C-95 262 95 262 95 230 L95 0 Z" fill="#AEB7BC" />
    <path d="M-95 0 L-95 230 C-95 262 -40 266 -40 262 L-40 0 Z" fill="#C7CED2" />
    <path d="M-96 70 L96 70 L96 160 L-96 160 Z" fill={KIRMIZI} />
    <ellipse cx={0} cy={0} rx={95} ry={26} fill="#D9DFE2" />
    <ellipse cx={0} cy={0} rx={72} ry={17} fill="#C3CACE" />
  </g>
);

const Bayrak: React.FC<{ x: number; y: number; s: number; renk: string; ust: string; alt: string }> = ({ x, y, s, renk, ust, alt }) => (
  <g transform={`translate(${x} ${y}) scale(1 ${s})`}>
    <g filter="url(#golge)">
      <rect x={-3} y={-150} width={6} height={150} fill="#7A5236" />
      <path d="M3 -150 L118 -128 L3 -100 Z" fill={renk} />
    </g>
    <text x={12} y={-122} fontFamily={YAZI} fontWeight={800} fontSize={15} fill={KREM}>{ust}</text>
    <text x={0} y={34} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={26} fill={KOYU}>{alt}</text>
  </g>
);

export const TarzKagit: React.FC = () => {
  const f = useCurrentFrame();
  const adim = Math.floor(f / 2.5); // 12 kare/sn
  const t = (adim * 2.5) / FPS; // basamaklı zaman
  const tg = f / FPS; // ses ve altyazı için gerçek zaman

  const c1 = ap(t, S2 - 0.1, 0.4);
  const g2 = ap(t, S2 - 0.1, 0.4), c2 = ap(t, S3 - 0.1, 0.4);
  const g3 = ap(t, S3 - 0.1, 0.4);
  const tAc = kz("açacağı"), t50 = kz("50"), tGeldi = kz("geldi"), t1810 = kz("1810"), tIng = kz("İngiltere");
  const tMetal = kz("metal"), tPat = kz("patentlendi");
  const sat = altyazi(tg);

  return (
    <AbsoluteFill>
      <Ses />
      <Olcek bg={ZEMIN}>
        <svg width={540} height={960} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="golge" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx={0} dy={6} stdDeviation={5} floodColor="#3A2410" floodOpacity={0.35} />
            </filter>
            <filter id="lif">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} />
              <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.16  0 0 0 0 0.06  0 0 0 0.10 0" />
            </filter>
          </defs>

          {/* sabit dekor: güneş ve tepeler */}
          <g filter="url(#golge)">
            <circle cx={270} cy={520} r={190 + Math.sin(adim * 0.4) * 3} fill="#F1C66B" />
          </g>

          {/* ---------- SAHNE 1 ---------- */}
          {c1 < 1 && (
            <g transform={`translate(${-c1 * 600} 0)`}>
              <g transform={`translate(270 ${430 + (1 - pop(t, 0.15, 10)) * 420}) rotate(${oyna(adim, 1) * 0.5})`}>
                <Kutu />
              </g>
              <g transform={`translate(270 545) rotate(${-3 + oyna(adim, 2)}) scale(${pop(t, 1.0)})`}>
                <rect x={-56} y={-26} width={112} height={52} rx={4} fill={KREM} filter="url(#golge)" />
                <text x={0} y={14} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={38} fill={KOYU}>1810</text>
              </g>
              <g transform={`translate(${420 + (1 - pop(t, 1.4, 12)) * 260} 600) rotate(${26 + oyna(adim, 3)})`} filter="url(#golge)">
                <rect x={-9} y={-10} width={18} height={170} rx={6} fill="#8A5A3B" />
                <rect x={-48} y={-46} width={96} height={40} rx={6} fill="#4C535A" />
                <rect x={-48} y={-46} width={96} height={12} rx={6} fill="#646C73" />
              </g>
              <g transform={`translate(390 395) rotate(${6 + oyna(adim, 4)}) scale(${pop(t, tAc, 9)})`}>
                <rect x={-78} y={-30} width={156} height={60} rx={4} fill={KREM} filter="url(#golge)" />
                <text x={-20} y={9} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={22} fill={KOYU}>Açacak?</text>
                <circle cx={52} cy={0} r={22} fill={KIRMIZI} />
                <text x={52} y={6} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={15} fill={KREM}>YOK</text>
              </g>
            </g>
          )}

          {/* ---------- SAHNE 2 ---------- */}
          {g2 > 0 && c2 < 1 && (
            <g transform={`translate(${(1 - g2) * 600 - c2 * 600} 0)`}>
              <rect x={60} y={632} width={420 * ap(t, S2 + 0.25, 1.4)} height={16} rx={8} fill={KREM} filter="url(#golge)" />
              <Bayrak x={68} y={632} s={pop(t, S2 + 0.3)} renk="#2F6E6A" ust="KUTU" alt="1810" />
              <Bayrak x={472} y={632} s={pop(t, tGeldi - 0.3)} renk={KIRMIZI} ust="AÇACAK" alt="1850'ler" />
              <g transform={`translate(270 340) rotate(${-8 + oyna(adim, 5) * 2}) scale(${pop(t, t50 - 0.05, 8)})`}>
                <circle r={74} fill={KIRMIZI} filter="url(#golge)" />
                <text y={4} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={62} fill={KREM}>50</text>
                <text y={38} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={22} fill={KREM}>YIL</text>
              </g>
              <Merakli x={lerp(110, 390, ap(t, S2 + 0.3, 2.6))} y={540} t={t} adim={t > S2 + 0.3 && t < S2 + 2.9 ? (t - S2) * 2 : 0} kol={t > S2 + 2.9 ? "salla" : "dur"} />
            </g>
          )}

          {/* ---------- SAHNE 3 ---------- */}
          {g3 > 0 && (
            <g transform={`translate(${(1 - g3) * 600} 0)`}>
              <g transform={`rotate(${-3 + oyna(adim, 6) * 0.4} 270 450)`}>
                <rect x={100} y={250} width={330} height={410} rx={3} fill={KREM} filter="url(#golge)" />
                <rect x={115} y={238} width={70} height={24} fill="#FFFFFF" opacity={0.6} transform="rotate(-8 150 250)" />
                <rect x={345} y={238} width={70} height={24} fill="#FFFFFF" opacity={0.6} transform="rotate(7 380 250)" />
                <text x={265} y={318} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={52} fill={KOYU} opacity={ap(t, S3 + 0.4, 0.2)}>PATENT</text>
                <text x={265} y={358} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={28} fill={KIRMIZI} opacity={ap(t, t1810, 0.2)}>1810</text>
                <text x={265} y={390} textAnchor="middle" fontFamily={YAZI} fontWeight={500} fontSize={24} fill={KOYU} opacity={ap(t, tIng, 0.2)}>İngiltere</text>
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={140} y={414 + i * 20} width={(i === 2 ? 150 : 250) * ap(t, kz("yiyeceği") + i * 0.2, 0.3)} height={8} rx={4} fill="#D8CFC0" />
                ))}
                <g transform={`translate(265 ${510 + (1 - pop(t, tMetal, 10)) * 30}) scale(${0.36 * pop(t, tMetal, 10)})`}><Kutu /></g>
              </g>
              <g transform={`translate(360 600) rotate(${-14 + oyna(adim, 7)}) scale(${t >= tPat ? 2 - pop(t, tPat, 9) : 0})`}>
                <circle r={58} fill={KIRMIZI} filter="url(#golge)" />
                <circle r={48} fill="none" stroke={KREM} strokeWidth={3} strokeDasharray="6 5" />
                <text y={9} textAnchor="middle" fontFamily={YAZI} fontWeight={800} fontSize={26} fill={KREM}>ONAY</text>
              </g>
            </g>
          )}

          {/* tepeler (önde, kâğıt katmanları) */}
          <g filter="url(#golge)">
            <path d="M0 760 C120 700 230 730 330 700 C420 676 480 690 540 670 L540 960 L0 960 Z" fill="#2F6E6A" />
            <path d="M0 820 C140 790 260 812 380 786 C450 772 500 776 540 770 L540 960 L0 960 Z" fill="#245854" />
          </g>

          {/* Meraklı sahne 1 ve 3'te tepede durur */}
          {c1 < 1 && <g transform={`translate(${-c1 * 600} 0)`}><Merakli x={lerp(-60, 98, ap(t, 0, 0.8))} y={690} t={t} kol={t > 0.8 ? "salla" : "dur"} adim={t < 0.8 ? t * 2.5 : 0} /></g>}
          {g3 > 0 && <g transform={`translate(${(1 - g3) * 600} 0)`}><Merakli x={470} y={700} t={t} kol={t > S3 + 0.6 ? "goster" : "dur"} yon={-1} /></g>}

          <rect width={540} height={960} filter="url(#lif)" />
        </svg>

        {/* rozet */}
        <div style={{ position: "absolute", left: 24, top: 26, background: KREM, padding: "6px 12px", borderRadius: 3, fontFamily: YAZI, fontSize: 15, fontWeight: 800, letterSpacing: 1.5, color: KOYU, boxShadow: "0 3px 6px rgba(58,36,16,0.3)", transform: "rotate(-2deg)" }}>7/30 · TARİH</div>
        <div style={{ position: "absolute", right: 24, top: 30, fontFamily: YAZI, fontSize: 15, fontWeight: 800, letterSpacing: 1.5, color: "#3A2410" }}>BİR DAKİKADA BİLİM</div>

        {/* kanca */}
        <div style={{ position: "absolute", left: 40, right: 40, top: 112, transform: `translateY(${-ap(t, S2 - 0.1, 0.35) * 400}px)` }}>
          <div style={{ background: KREM, padding: "26px 28px 24px", transform: `rotate(${-1.5 + oyna(adim, 9) * 0.3}deg)`, boxShadow: "0 8px 14px rgba(58,36,16,0.35)", clipPath: "polygon(0 4%, 6% 0, 18% 3%, 30% 0, 44% 2%, 58% 0, 72% 3%, 86% 0, 100% 2%, 99% 96%, 90% 100%, 76% 97%, 62% 100%, 48% 97%, 34% 100%, 20% 97%, 8% 100%, 1% 97%)" }}>
            <div style={{ fontFamily: YAZI, fontSize: 62, fontWeight: 800, lineHeight: 0.95, letterSpacing: -1, color: KOYU }}>
              Açacağı 50 yıl sonra <span style={{ color: KIRMIZI }}>geldi</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 188, top: -14, width: 84, height: 26, background: "rgba(255,255,255,0.55)", transform: "rotate(4deg)" }} />
        </div>

        {/* altyazı */}
        {sat.length > 0 && (
          <div style={{ position: "absolute", left: 40, right: 40, bottom: 50, textAlign: "center" }}>
            <div style={{ display: "inline-block", background: KREM, padding: "10px 16px", borderRadius: 4, boxShadow: "0 5px 10px rgba(0,0,0,0.3)", fontFamily: YAZI, fontSize: 30, fontWeight: 800, lineHeight: 1.2, color: KOYU }}>
              {sat.map((k, i) => (
                <React.Fragment key={i}><span style={{ margin: "0 4px", padding: "0 5px", borderRadius: 3, background: k.durum === "simdi" ? SARI : "transparent", color: k.durum === "gelecek" ? "#A79D92" : KOYU, fontWeight: k.durum === "gelecek" ? 500 : 800 }}>{k.w}</span>{" "}</React.Fragment>
              ))}
            </div>
          </div>
        )}
      </Olcek>
    </AbsoluteFill>
  );
};
