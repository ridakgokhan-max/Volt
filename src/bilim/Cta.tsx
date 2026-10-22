// Etkileşim çağrısı (CTA): Meraklı Gözlüklü, Instagram Reels'teki gerçek düğmelerin olduğu yere gidip
// "beğen / yorum / takip" düğmelerine dokunur. Düğme yerleri 1080x1920 Reels ekranına göre yaklaşıktır.
import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { ACC, ap, cl, ez, FPS, H, INK, lerp, RED, sp, W } from "./kit";
import { Merakli, MerakliGorunur } from "./merakli";
import { loadFont } from "@remotion/google-fonts/Nunito";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });

export const IG = {
  begen: { x: 1012, y: 1228 },
  yorum: { x: 1012, y: 1372 },
  takip: { x: 448, y: 1662 },
};

export type CtaAdim = { tur: "begen" | "yorum" | "takip"; bas: number; yazi?: string; kostum?: string };
export const CTA_SURE = 2.8;

/** Parlayan dokunma halkası */
const Halka: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) =>
  t < 0 || t > 0.8 ? null : (
    <g>
      {[0, 0.18].map((g, i) => {
        const u = cl((t - g) / 0.55);
        return u > 0 && u < 1 ? <circle key={i} cx={x} cy={y} r={20 + u * 70} fill="none" stroke={ACC} strokeWidth={10 * (1 - u)} opacity={1 - u} /> : null;
      })}
    </g>
  );

/** İşaret parmağı imleci */
const Parmak: React.FC<{ x: number; y: number; bas: number }> = ({ x, y, bas }) => (
  <g transform={`translate(${x} ${y}) scale(${1 - 0.18 * bas}) rotate(-20)`}>
    <path d="M -10 0 L -10 -70 Q -10 -86 4 -86 Q 18 -86 18 -70 L 18 -34 Q 46 -40 52 -22 Q 70 -26 74 -8 Q 92 -10 92 12 L 88 54 Q 84 82 56 86 L 10 86 Q -14 84 -26 62 L -50 18 Q -58 2 -44 -4 Q -32 -8 -22 6 Z"
      fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
  </g>
);

/** Kafa üstü konuşma balonu */
const Balon: React.FC<{ x: number; y: number; k: number; o?: number; yazi: string; renk?: string }> = ({ x, y, k, o = 1, yazi, renk = "#fff" }) => {
  const w = yazi.length * 30 + 70;
  return k <= 0.01 || o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={cl(k * 1.5) * o}>
      <path d={`M ${-w / 2} -70 L ${w / 2} -70 Q ${w / 2 + 26} -70 ${w / 2 + 26} -44 L ${w / 2 + 26} 4 Q ${w / 2 + 26} 30 ${w / 2} 30 L 22 30 L 0 58 L -10 30 L ${-w / 2} 30 Q ${-w / 2 - 26} 30 ${-w / 2 - 26} 4 L ${-w / 2 - 26} -44 Q ${-w / 2 - 26} -70 ${-w / 2} -70 Z`}
        fill={renk} stroke={INK} strokeWidth={7} />
      <text x={0} y={-6} textAnchor="middle" fontSize={50} fontWeight={900} fill={INK} style={{ fontFamily: "var(--font)" }}>{yazi}</text>
    </g>
  );
};

/** Temsili Instagram düğmeleri (sadece önizleme için; gerçek videoda Instagram kendisi çizer) */
export const IgTaklit: React.FC<{ begendi: number; takip: number }> = ({ begendi, takip }) => (
  <g>
    <defs>
      <linearGradient id="igalt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
      </linearGradient>
    </defs>
    <rect x={0} y={1350} width={W} height={570} fill="url(#igalt)" />
    {/* kalp */}
    <path transform={`translate(${IG.begen.x} ${IG.begen.y}) scale(${1 + 0.35 * Math.sin(Math.PI * cl(begendi * 1.6))})`}
      d="M 0 26 C -40 -2 -44 -30 -24 -40 C -12 -46 -2 -40 0 -30 C 2 -40 12 -46 24 -40 C 44 -30 40 -2 0 26 Z"
      fill={begendi > 0.05 ? RED : "none"} stroke={begendi > 0.05 ? RED : "#fff"} strokeWidth={6} />
    <text x={IG.begen.x} y={IG.begen.y + 66} textAnchor="middle" fontSize={26} fontWeight={700} fill="#fff" style={{ fontFamily: "var(--font)" }}>{begendi > 0.05 ? "2.176" : "2.175"}</text>
    {/* yorum */}
    <path transform={`translate(${IG.yorum.x} ${IG.yorum.y})`} d="M -30 -2 A 32 30 0 1 1 -18 22 L -34 32 Z" fill="none" stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
    <text x={IG.yorum.x} y={IG.yorum.y + 70} textAnchor="middle" fontSize={26} fontWeight={700} fill="#fff" style={{ fontFamily: "var(--font)" }}>9</text>
    {/* paylaş */}
    <path transform={`translate(${IG.begen.x} 1520)`} d="M -32 -26 L 34 -26 L 4 30 L 0 2 Z M 0 2 L 34 -26" fill="none" stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
    {/* profil + takip */}
    <circle cx={74} cy={IG.takip.y} r={34} fill={ACC} stroke="#fff" strokeWidth={4} />
    <text x={74} y={IG.takip.y + 10} textAnchor="middle" fontSize={26} fontWeight={900} fill={INK} style={{ fontFamily: "var(--font)" }}>BDB</text>
    <text x={124} y={IG.takip.y + 10} fontSize={32} fontWeight={800} fill="#fff" style={{ fontFamily: "var(--font)" }}>birdakikadabil</text>
    <rect x={IG.takip.x - 80} y={IG.takip.y - 28} width={160} height={56} rx={14} fill={takip > 0.5 ? "rgba(255,255,255,0.2)" : "none"} stroke="#fff" strokeWidth={4} />
    <text x={IG.takip.x} y={IG.takip.y + 10} textAnchor="middle" fontSize={28} fontWeight={800} fill="#fff" style={{ fontFamily: "var(--font)" }}>{takip > 0.5 ? "Takiptesin" : "Takip et"}</text>
    <text x={60} y={IG.takip.y + 80} fontSize={28} fontWeight={600} fill="#fff" opacity={0.9} style={{ fontFamily: "var(--font)" }}>Dün İstanbul'a 1942'den beri ölçülen en büyük...</text>
  </g>
);

const BALON: Record<CtaAdim["tur"], string> = { begen: "Beğen!", yorum: "Fikrini yaz!", takip: "Takip et!" };

/** Meraklı'nın konumu: hedef düğmenin yanına yürür, dokunur, geri çekilir. t = saniye */
export const CtaKatman: React.FC<{ t: number; adimlar: CtaAdim[]; baslangic?: { x: number; y: number }; yazi?: string }> = ({ t, adimlar, baslangic = { x: 540, y: 1240 }, yazi }) => {
  // her adım: 0..0.9 yürü, 0.9..1.6 dokun + balon, sonraki adıma kadar bekle
  let x = baslangic.x;
  let y = baslangic.y;
  let hareket: "dur" | "yuru" | "isaret" | "salla" | "aha" = "salla";
  let flip = false;
  let parmak: { x: number; y: number; b: number } | null = null;
  let balon: { k: number; o: number; yazi: string } | null = null;
  let halka: { x: number; y: number; t: number } | null = null;
  let px = baslangic.x;
  let py = baslangic.y;
  for (const a of adimlar) {
    const hd = IG[a.tur];
    // Meraklı'nın duracağı yer (düğmenin solunda / üstünde)
    // Meraklı her zaman altyazı bandının ALTINDA (ayak y≈1800) yürür; eli düğmeye uzanır
    const dur = a.tur === "takip" ? { x: hd.x - 180, y: 1800 } : { x: hd.x - 190, y: 1800 };
    const dt = t - a.bas;
    if (dt < 0) break;
    const yur = ez(dt / 0.9);
    x = lerp(px, dur.x, yur);
    y = lerp(py, dur.y, yur);
    flip = dur.x < px;
    hareket = dt < 0.9 ? "yuru" : "isaret";
    if (dt >= 0.75) {
      const el = a.tur === "takip" ? { x: x + (flip ? -70 : 70), y: y - 150 } : { x: hd.x + 34, y: hd.y - 300 };
      const git = ez((dt - 0.75) / 0.35);
      const dokun = dt > 1.1 && dt < 1.4 ? Math.sin(((dt - 1.1) / 0.3) * Math.PI) : 0;
      parmak = { x: lerp(el.x, hd.x + 34, git), y: lerp(el.y, hd.y + 50, git), b: dokun };
      if (dt > 1.25) halka = { x: hd.x, y: hd.y, t: dt - 1.25 };
      if (dt > 1.9) parmak = null;
      balon = { k: sp(t, a.bas + 0.95, 9), o: 1 - ap(t, a.bas + 2.4, 0.25), yazi: yazi || a.yazi || BALON[a.tur] };
    }
    px = dur.x;
    py = dur.y;
  }
  return (
    <g>
      <Merakli x={x} y={y} s={0.6} t={t} hareket={hareket} flip={flip} kostum={(adimlar[0]?.kostum || "baret") as any} ink="#fff" />
      {balon ? <Balon x={x > 540 ? Math.max(balon.yazi.length * 15 + 80, x - 150 - balon.yazi.length * 15) : Math.min(1000 - balon.yazi.length * 15 - 60, x + 150 + balon.yazi.length * 15)} y={y - 190} k={balon.k} o={balon.o} yazi={balon.yazi} renk={ACC} /> : null}
      {halka ? <Halka x={halka.x} y={halka.y} t={halka.t} /> : null}
      {parmak ? <Parmak x={parmak.x} y={parmak.y} bas={parmak.b} /> : null}
    </g>
  );
};

// ---------- 6 sn'lik önizleme: Tokyo videosunun bir karesi üstünde ----------
export const CTA_DEMO_SURE = 6;
const ADIMLAR: CtaAdim[] = [
  { tur: "begen", bas: 0.3 },
  { tur: "yorum", bas: 2.0 },
  { tur: "takip", bas: 3.6 },
];
export const CtaDemo: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const begendi = ap(t, ADIMLAR[0].bas + 1.25, 0.3);
  const takip = t > ADIMLAR[2].bas + 1.3 ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: "#111", ["--font" as string]: fontFamily } as React.CSSProperties}>
      <Img src={staticFile("bilim/cta-demo/arka.jpg")} style={{ width: W, height: H, objectFit: "cover" }} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <IgTaklit begendi={begendi} takip={takip} />
        {/* kalp patlaması */}
        {begendi > 0 && begendi < 1
          ? Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 40 + begendi * 90;
              return <circle key={i} cx={IG.begen.x + Math.cos(a) * r} cy={IG.begen.y + Math.sin(a) * r} r={10 * (1 - begendi)} fill={RED} />;
            })
          : null}
        <CtaKatman t={t} adimlar={ADIMLAR} />
        <text x={540} y={110} textAnchor="middle" fontSize={30} fontWeight={800} fill="#fff" opacity={0.8} style={{ fontFamily: "var(--font)" }}>ÖNİZLEME · Instagram düğmeleri temsili</text>
      </svg>
      <Audio src={staticFile("bilim/cta-demo/ses.wav")} />
    </AbsoluteFill>
  );
};

/** Gerçek videoda: her adım ayrı anda; Meraklı alttan girer, düğmeye dokunur, kaybolur */
export const ctaGorunur = (t: number, adimlar: CtaAdim[]) => {
  let v = 0;
  for (const a of adimlar) {
    const dt = t - a.bas;
    if (dt > -0.25 && dt < CTA_SURE + 0.25) v = Math.max(v, ap(dt, -0.25, 0.25) * (1 - ap(dt, CTA_SURE - 0.3, 0.3)));
  }
  return v;
};

export const CtaVideo: React.FC<{ t: number; adimlar: CtaAdim[] }> = ({ t, adimlar }) => {
  const a = adimlar.find((x) => t - x.bas > -0.25 && t - x.bas < CTA_SURE + 0.25);
  if (!a) return null;
  const v = ctaGorunur(t, adimlar);
  const begendi = a.tur === "begen" ? ap(t, a.bas + 1.25, 0.3) : 0;
  return (
    <MerakliGorunur.Provider value={1}>
      <g opacity={v}>
        <CtaKatman t={t} adimlar={[a]} baslangic={a.tur === "takip" ? { x: 640, y: 1800 } : { x: 640, y: 1800 }} yazi={a.yazi} />
        {begendi > 0 && begendi < 1
          ? Array.from({ length: 8 }).map((_, i) => {
              const an = (i / 8) * Math.PI * 2;
              const r = 40 + begendi * 90;
              return <circle key={i} cx={IG.begen.x + Math.cos(an) * r} cy={IG.begen.y + Math.sin(an) * r} r={12 * (1 - begendi)} fill={RED} />;
            })
          : null}
      </g>
    </MerakliGorunur.Provider>
  );
};
