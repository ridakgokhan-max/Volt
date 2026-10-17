// Kanal tanıtımı / takipçi videosu: içeriklerimizden kısa kesitler + "takip et" çağrısı.
import React from "react";
import { staticFile } from "remotion";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, cl, GREEN, INK, RED, sp, Tag } from "../kit";
import { Merakli } from "../merakli";
import { Saat } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };

// ---------- 1 — Giriş: bir dakikan var mı? ----------
const Giris: S = ({ t, ws, ses }) => {
  const th = ws("her");
  return (
    <g>
      <g transform={`translate(540 620) scale(${sp(t, 0.05, 9)})`}>
        <circle r={210} fill="#fff" stroke={INK} strokeWidth={12} />
        <Saat x={0} y={0} s={2.2} t={t} hiz={4} />
      </g>
      <g transform={`translate(540 900) scale(${sp(t, 0.3, 9)})`}>
        <rect x={-150} y={-60} width={300} height={110} rx={55} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={22} textAnchor="middle" fontSize={64} fontWeight={900} fill={INK} style={font}>1 DK</text>
      </g>
      <Tag x={540} y={1040} text="HER GÜN YENİ BİR ŞEY" size={46} k={sp(t, th - 0.1)} bg={GREEN} color="#fff" rot={-2} />
      <Merakli x={880} y={1240} s={0.55} t={t} hareket={t > th ? "anlat" : "salla"} kostum="yok" agiz={ses(t)} />
    </g>
  );
};

/** Kesit sahnesi: kutu içinde bizim videomuz oynar, üstte etiket */
const kesit = (etiket: string, renk: string, yazi = "#fff"): S => ({ t, ses }) => (
  <g>
    <Tag x={540} y={320} text={etiket} size={46} k={sp(t, 0.15, 9)} bg={renk} color={yazi} rot={-2} />
    {/* kutunun arkasında parıltı ve çerçeve gölgesi */}
    <rect x={292} y={352} width={496} height={869} rx={50} fill="none" stroke={ACC} strokeWidth={6} opacity={0.5 + 0.3 * Math.sin(t * 5)} />
    <Merakli x={140} y={1240} s={0.42} t={t} hareket="isaret" kostum="yok" agiz={ses(t)} />
  </g>
);

// ---------- 6 — Özet: her video 1 dakika, her gün yeni merak ----------
const Ozet: S = ({ t, ws, ses }) => {
  const tm = ws("merak");
  return (
    <g>
      {[1, 2, 3, 4].map((i, j) => {
        const x = j % 2 ? 700 : 380;
        const y = j < 2 ? 470 : 860;
        const k = sp(t, 0.1 + j * 0.15, 9);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${k}) rotate(${(j % 2 ? 3 : -3) + Math.sin(t * 2 + j) * 1.5})`}>
            <rect x={-122} y={-200} width={244} height={400} rx={26} fill="#fff" stroke={INK} strokeWidth={8} />
            <image href={staticFile(`bilim/takip-demo/t${i}.jpg`)} x={-110} y={-188} width={220} height={376} preserveAspectRatio="xMidYMid slice" />
          </g>
        );
      })}
      <g transform={`translate(540 1150) scale(${sp(t, tm - 0.3, 9)})`}>
        <rect x={-300} y={-62} width={600} height={116} rx={58} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={20} textAnchor="middle" fontSize={56} fontWeight={900} fill={INK} style={font}>30 GÜN · 30 MERAK</text>
      </g>
    </g>
  );
};

// ---------- 7 — Takip et ----------
const Takip: S = ({ t, ws, ses }) => {
  const tt = ws("takip");
  const nab = 1 + 0.06 * Math.sin(t * 8) * ap(t, tt, 0.3);
  return (
    <g>
      <g transform={`translate(540 560) scale(${sp(t, 0.1, 9)})`}>
        <circle r={150} fill={ACC} stroke={INK} strokeWidth={10} />
        <text x={0} y={30} textAnchor="middle" fontSize={92} fontWeight={900} fill={INK} style={font}>BDB</text>
      </g>
      <text x={540} y={800} textAnchor="middle" fontSize={54} fontWeight={900} fill={CHALK} stroke={INK} strokeWidth={8} paintOrder="stroke" style={font}>@birdakikadabil</text>
      <g transform={`translate(540 960) scale(${sp(t, tt - 0.3, 8) * nab})`}>
        <rect x={-250} y={-70} width={500} height={130} rx={30} fill={BLUE} stroke={INK} strokeWidth={8} />
        <text x={0} y={24} textAnchor="middle" fontSize={68} fontWeight={900} fill="#fff" style={font}>TAKİP ET</text>
      </g>
      <Tag x={540} y={1110} text="sıradaki merakı kaçırma" size={36} k={sp(t, tt + 0.3)} bg="#fff" rot={2} />
    </g>
  );
};

export const SAHNE: Record<string, S> = {
  giris: Giris,
  kamera: kesit("ESKİ TELEFON = KAMERA", GREEN),
  tokyo: kesit("YERİN 50 M ALTINDA", BLUE),
  sarj: kesit("KABLOSUZ DEĞİL!", RED),
  fermuar: kesit("20 YIL YÜZ VERİLMEDİ", ACC, INK),
  ozet: Ozet,
  takip: Takip,
};

export const KAPAK: React.FC = () => (
  <g>
    {[1, 2, 3, 4].map((i, j) => (
      <g key={i} transform={`translate(${200 + j * 230} 1120) rotate(${(j % 2 ? 4 : -4)})`}>
        <rect x={-105} y={-180} width={210} height={360} rx={22} fill="#fff" stroke={INK} strokeWidth={7} />
        <image href={staticFile(`bilim/takip-demo/t${i}.jpg`)} x={-95} y={-170} width={190} height={340} preserveAspectRatio="xMidYMid slice" />
      </g>
    ))}
    <Merakli x={880} y={1700} s={0.8} t={0.3} hareket="salla" kostum="yok" />
  </g>
);
export const KAPAK_YAZI = { ust: "Bir dakikan var mı?", buyuk: "HER GÜN 1 MERAK", alt: "@birdakikadabil" };
