// Tarz demosu 3: Grafik poster — üç renk, dev rakamlar, net ızgara, keskin ve hızlı hareket.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as loadBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { altyazi, ap, FPS, kz, lerp, Olcek, pop, S2, S3, Ses } from "./ortak";

const { fontFamily: KALIN } = loadBlack("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: YAZI } = loadArchivo("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });

const LACI = "#1F2A44";
const DOMATES = "#E4572E";
const KREM = "#F2EBDD";
const SARI = "#F2C14E";
const ZEMIN_Y = 700;

const Merakli: React.FC<{ x: number; y: number; t: number; kol?: "salla" | "goster" | "dur"; adim?: number; yon?: 1 | -1 }> = ({ x, y, t, kol = "dur", adim = 0, yon = 1 }) => {
  const s = Math.sin(t * 10) * 0.5 + 0.5;
  const [rx, ry] = kol === "salla" ? [30 + s * 4, -44 - s * 14] : kol === "goster" ? [40, -30] : [18, -2];
  const b = Math.sin(adim * Math.PI * 2) * 12;
  return (
    <g transform={`translate(${x} ${y}) scale(${yon * 1.3} 1.3)`} fill="none" stroke={LACI} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={0} cy={-58} r={18} fill={KREM} />
      <circle cx={-6} cy={-57} r={5} strokeWidth={2.5} />
      <circle cx={7} cy={-57} r={5} strokeWidth={2.5} />
      <path d="M-3 -76 C-5 -90 12 -92 10 -82 C9 -77 3 -78 2 -74" strokeWidth={3} />
      <path d="M0 -40 L0 20" />
      <path d="M0 -26 L-20 -4" />
      <path d={`M0 -26 L${rx} ${ry}`} />
      <path d={`M0 20 L${-14 + b} 58`} />
      <path d={`M0 20 L${14 - b} 58`} />
      <path d="M-12 -38 C-4 -34 6 -34 13 -38" stroke={SARI} strokeWidth={6} />
    </g>
  );
};

const Kutu: React.FC = () => (
  <g>
    <path d="M-100 0 L-100 250 A100 28 0 0 0 100 250 L100 0 Z" fill={LACI} />
    <path d="M-100 80 L100 80 L100 170 L-100 170 Z" fill={DOMATES} />
    <path d="M-100 0 L-100 250 A100 28 0 0 0 -40 274 L-40 0 Z" fill="url(#nokta)" opacity={0.5} />
    <ellipse cx={0} cy={0} rx={100} ry={28} fill="#33416A" />
    <ellipse cx={0} cy={0} rx={76} ry={19} fill={LACI} />
    <text x={0} y={140} textAnchor="middle" fontFamily={KALIN} fontSize={44} fill={KREM}>1810</text>
  </g>
);

export const TarzPoster: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const tAc = kz("açacağı"), t50 = kz("50"), tGeldi = kz("geldi"), t1810 = kz("1810"), tIng = kz("İngiltere");
  const tPat = kz("patentlendi");
  const sat = altyazi(t);

  // kutu: büyük → çizelgede küçük simge → patentte yine büyük
  const kucul = ap(t, S2 - 0.05, 0.5);
  const buyu = ap(t, S3 - 0.05, 0.5);
  const yuksel = pop(t, 0.1, 13);
  const kx = lerp(lerp(270, 70, kucul), 270, buyu);
  const ky = lerp(lerp(380 + (1 - yuksel) * 520, ZEMIN_Y - 62, kucul), 420, buyu);
  const ks = lerp(lerp(1, 0.2, kucul), 0.82, buyu);

  const ust1 = 1 - ap(t, S2 - 0.1, 0.3); // sahne 1 başlıkları
  const ust2 = ap(t, S2 + 0.1, 0.3) * (1 - ap(t, S3 - 0.1, 0.3));
  const ust3 = ap(t, S3 + 0.1, 0.3);
  const sayac = Math.round(50 * ap(t, S2 + 0.3, t50 + 0.1 - (S2 + 0.3)));
  const cizgi = ap(t, S2 + 0.2, 1.2);

  return (
    <AbsoluteFill>
      <Ses />
      <Olcek bg={KREM}>
        {/* üst şerit */}
        <div style={{ position: "absolute", left: 32, right: 32, top: 30, display: "flex", justifyContent: "space-between", fontFamily: YAZI, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: LACI, borderBottom: `2px solid ${LACI}`, paddingBottom: 12 }}>
          <div>07 / TARİH</div>
          <div>BİR DAKİKADA BİLİM</div>
        </div>

        {/* sahne 1 başlık (ilk karede tam) */}
        <div style={{ opacity: ust1, transform: `translateX(${-(1 - ust1) * 80}px)` }}>
          <div style={{ position: "absolute", left: 26, top: 64, fontFamily: KALIN, fontSize: 250, lineHeight: 1, color: DOMATES, letterSpacing: -10 }}>50</div>
          <div style={{ position: "absolute", left: 300, top: 104, fontFamily: KALIN, fontSize: 58, lineHeight: 0.95, color: LACI }}>YIL<br />SONRA</div>
          <div style={{ position: "absolute", left: 304, top: 232, fontFamily: YAZI, fontSize: 24, fontWeight: 700, lineHeight: 1.15, color: LACI }}>açacak<br />icat edildi.</div>
          <div style={{ position: "absolute", left: 300, top: 300, height: 34, width: 200 * ap(t, tAc, 0.25), background: DOMATES, overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: KALIN, fontSize: 20, color: KREM, padding: "6px 10px" }}>AÇACAK = YOK</div>
          </div>
        </div>

        {/* sahne 2 başlık: sayaç */}
        <div style={{ opacity: ust2 }}>
          <div style={{ position: "absolute", left: 26, top: 64, fontFamily: KALIN, fontSize: 210, lineHeight: 1, color: DOMATES, letterSpacing: -8 }}>+{sayac}</div>
          <div style={{ position: "absolute", left: 32, top: 280, fontFamily: KALIN, fontSize: 52, color: LACI }}>YIL BEKLEDİLER</div>
        </div>

        {/* sahne 3 başlık: patent */}
        <div style={{ opacity: ust3, transform: `translateY(${(1 - ust3) * 30}px)` }}>
          <div style={{ position: "absolute", left: 28, top: 70, fontFamily: KALIN, fontSize: 112, lineHeight: 1, color: "transparent", WebkitTextStroke: `3px ${LACI}` }}>PATENT</div>
          <div style={{ position: "absolute", left: 32, top: 200, fontFamily: KALIN, fontSize: 44, color: DOMATES, opacity: ap(t, t1810, 0.15) }}>1810</div>
          <div style={{ position: "absolute", left: 170, top: 210, fontFamily: YAZI, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: LACI, opacity: ap(t, tIng, 0.15) }}>İNGİLTERE</div>
        </div>

        <svg width={540} height={960} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="nokta" width={10} height={10} patternUnits="userSpaceOnUse"><circle cx={5} cy={5} r={2.4} fill={KREM} /></pattern>
          </defs>

          {/* güneş dairesi */}
          <circle cx={372} cy={470} r={118 * pop(t, 0.3, 14) * (1 - ap(t, S2 - 0.1, 0.3)) + 118 * pop(t, S3 + 0.2, 14)} fill={SARI} />

          {/* zemin çizgisi ve çizelge */}
          <line x1={32} y1={ZEMIN_Y} x2={508} y2={ZEMIN_Y} stroke={LACI} strokeWidth={3} />
          <g opacity={1 - ap(t, S3 - 0.1, 0.3)}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={70 + i * 70} y1={ZEMIN_Y - 8} x2={70 + i * 70} y2={ZEMIN_Y + 8} stroke={LACI} strokeWidth={2} opacity={cizgi * 6 - i > 0 ? 1 : 0} />
            ))}
            <rect x={70} y={ZEMIN_Y - 4} width={350 * cizgi} height={8} fill={DOMATES} />
            <circle cx={70} cy={ZEMIN_Y} r={9 * pop(t, S2 + 0.2)} fill={LACI} />
            <circle cx={420} cy={ZEMIN_Y} r={11 * pop(t, tGeldi - 0.3)} fill={DOMATES} />
            <g opacity={ap(t, S2 + 0.3, 0.2)}>
              <text x={70} y={ZEMIN_Y + 40} textAnchor="middle" fontFamily={YAZI} fontWeight={700} fontSize={20} fill={LACI}>1810</text>
              <text x={70} y={ZEMIN_Y + 62} textAnchor="middle" fontFamily={YAZI} fontWeight={500} fontSize={14} letterSpacing={1.5} fill={LACI}>KUTU</text>
            </g>
            <g opacity={ap(t, tGeldi - 0.25, 0.2)}>
              <text x={420} y={ZEMIN_Y + 40} textAnchor="middle" fontFamily={YAZI} fontWeight={700} fontSize={20} fill={DOMATES}>1850'LER</text>
              <text x={420} y={ZEMIN_Y + 62} textAnchor="middle" fontFamily={YAZI} fontWeight={500} fontSize={14} letterSpacing={1.5} fill={LACI}>AÇACAK</text>
            </g>
          </g>

          {/* kutu */}
          <g transform={`translate(${kx} ${ky}) scale(${ks})`}><Kutu /></g>

          {/* mühür */}
          <g transform={`translate(400 610) rotate(-12) scale(${t >= tPat ? 1.8 - 0.8 * pop(t, tPat, 10) : 0})`}>
            <circle r={62} fill={DOMATES} />
            <circle r={52} fill="none" stroke={KREM} strokeWidth={2.5} />
            <text y={-4} textAnchor="middle" fontFamily={KALIN} fontSize={26} fill={KREM}>ONAY</text>
            <text y={22} textAnchor="middle" fontFamily={YAZI} fontWeight={700} fontSize={14} letterSpacing={2} fill={KREM}>1810</text>
          </g>

          {/* Meraklı */}
          {t < S2 - 0.05 && <Merakli x={lerp(-40, 84, ap(t, 0, 0.6))} y={ZEMIN_Y - 76} t={t} kol={t > 0.6 ? "salla" : "dur"} adim={t < 0.6 ? t * 3 : 0} />}
          {t >= S2 - 0.05 && t < S3 - 0.05 && (
            <Merakli x={lerp(120, 380, ap(t, S2 + 0.3, 2.5))} y={ZEMIN_Y - 76} t={t} adim={t > S2 + 0.3 && t < S2 + 2.8 ? (t - S2) * 2.4 : 0} kol={t > S2 + 2.8 ? "salla" : "dur"} />
          )}
          {t >= S3 - 0.05 && <Merakli x={84} y={ZEMIN_Y - 76} t={t} kol="goster" />}
        </svg>

        {/* altyazı */}
        <div style={{ position: "absolute", left: 32, right: 32, bottom: 48, borderTop: `2px solid ${LACI}`, paddingTop: 16, fontFamily: YAZI, fontSize: 30, fontWeight: 700, lineHeight: 1.25, color: LACI }}>
          {sat.map((k, i) => (
            <span key={i} style={{ marginRight: 9, color: k.durum === "gelecek" ? "#9A9488" : LACI, fontWeight: k.durum === "gelecek" ? 500 : 700, boxShadow: k.durum === "simdi" ? `inset 0 -10px 0 ${DOMATES}` : "none" }}>{k.w}</span>
          ))}
        </div>
      </Olcek>
    </AbsoluteFill>
  );
};
