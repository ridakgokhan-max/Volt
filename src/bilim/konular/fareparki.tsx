// Bilim/psikoloji: Fare Parkı (Bruce Alexander, Rat Park). Tamamen çizim; ws("kelime") = sahne içindeki saniye.
// Görsel dil: soğuk, dar, gri KAFES dünyası  ->  sıcak, geniş, renkli PARK dünyası. Final: iki fare = bir kalp.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, cl, Glow, GREEN, INK, lerp, RED, sp, Tag, Txt } from "../kit";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const MOR = "#9b5de5";
const SU = "#7cc6f2";
const GRI = "#9aa3b5";
const KREM = "#f4efe2";
const rnd = (i: number, j: number) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const W = (t: number, k: number) => Math.sin(t * k);

// ---------------------------------------------------------------- ortak çizimler

/** Kamera: yavaş ileri itiş + hafif salınım (ekran hiç donmaz) */
const Kam: React.FC<{ t: number; d: number; z0?: number; z1?: number; ox?: number; oy?: number; children: React.ReactNode }> = ({ t, d, z0 = 1, z1 = 1.08, ox = 540, oy = 780, children }) => {
  const z = lerp(z0, z1, cl(t / Math.max(d, 0.1)));
  return <g transform={`translate(${ox + W(t, 0.8) * 5} ${oy + W(t, 0.6) * 4}) rotate(${W(t, 0.4) * 0.4}) scale(${z}) translate(${-ox} ${-oy})`}>{children}</g>;
};

/** Fare (yandan). mood: "uzgun" | "mutlu" | "sersem". walk: yürüyüş fazı */
const Fare: React.FC<{ x: number; y: number; s?: number; t: number; flip?: boolean; renk?: string; mood?: "uzgun" | "mutlu" | "sersem" | "merak"; walk?: number; ph?: number; o?: number }> = ({
  x, y, s = 1, t, flip = false, renk = "#c9c2b8", mood = "merak", walk = 0, ph = 0, o = 1,
}) => {
  const nefes = 1 + W(t * 1.0 + ph, 3) * 0.02;
  const kuyruk = W(t + ph, mood === "mutlu" ? 5 : 1.6) * (mood === "mutlu" ? 18 : 8);
  const sek = walk ? Math.abs(W(walk, 9)) * -14 : mood === "mutlu" ? Math.abs(W(t + ph, 4)) * -8 : 0;
  const sallan = mood === "sersem" ? W(t + ph, 2.2) * 9 : 0;
  const ic = "#f2b8c6";
  return (
    <g transform={`translate(${x} ${y + sek}) scale(${flip ? -s : s} ${s}) rotate(${sallan})`} opacity={o}>
      <ellipse cx={0} cy={58} rx={95} ry={14} fill={INK} opacity={0.18} />
      <path d={`M -80 20 C -150 ${20 + kuyruk} -190 ${-30 - kuyruk} -235 ${-10 + kuyruk * 0.6}`} fill="none" stroke={ic} strokeWidth={9} strokeLinecap="round" />
      <path d={`M -80 20 C -150 ${20 + kuyruk} -190 ${-30 - kuyruk} -235 ${-10 + kuyruk * 0.6}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" opacity={0.25} />
      {[-45, 30].map((lx, i) => (
        <ellipse key={i} cx={lx + (walk ? W(walk + i * 1.6, 9) * 10 : 0)} cy={48} rx={20} ry={11} fill={ic} stroke={INK} strokeWidth={5} />
      ))}
      <g transform={`scale(${nefes})`}>
        <path d="M -95 30 C -100 -45 -20 -70 40 -48 C 80 -34 105 -5 100 30 C 60 52 -60 55 -95 30 Z" fill={renk} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>
      <g transform={`translate(85 -20) rotate(${mood === "uzgun" ? 18 : mood === "merak" ? W(t + ph, 1.3) * 6 : -6})`}>
        <path d="M -30 -10 C -10 -60 70 -40 95 5 C 70 25 0 35 -30 -10 Z" fill={renk} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={-6} cy={-48} r={30} fill={renk} stroke={INK} strokeWidth={7} />
        <circle cx={-6} cy={-48} r={16} fill={ic} />
        <circle cx={96} cy={4} r={9} fill="#e0607e" stroke={INK} strokeWidth={3} />
        {mood === "mutlu" ? (
          <path d="M 30 -12 Q 42 -24 54 -12" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        ) : mood === "sersem" ? (
          <g stroke={INK} strokeWidth={5} strokeLinecap="round"><line x1={34} y1={-20} x2={50} y2={-4} /><line x1={50} y1={-20} x2={34} y2={-4} /></g>
        ) : (
          <g><circle cx={42} cy={-12} r={9} fill={INK} /><circle cx={45} cy={-15} r={3} fill="#fff" /></g>
        )}
        {mood === "uzgun" && <path d="M 28 -30 L 54 -22" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
        <g stroke={INK} strokeWidth={3} opacity={0.7}>
          <line x1={88} y1={8} x2={130} y2={-4} /><line x1={88} y1={10} x2={132} y2={14} />
        </g>
      </g>
    </g>
  );
};

/** Su şişesi; dolu: 0..1, renk: sıvı rengi, etiket */
const Sise: React.FC<{ x: number; y: number; s?: number; dolu: number; renk: string; etiket: string; parilti?: number; t: number; k?: number }> = ({ x, y, s = 1, dolu, renk, etiket, parilti = 0, t, k = 1 }) => {
  if (k <= 0.01) return null;
  const h = 300 * cl(dolu);
  const id = `sise${Math.round(x)}${Math.round(y)}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      {parilti > 0 && <Glow cx={0} cy={-130} r={260} color={renk} o={0.55 * parilti * (0.8 + 0.2 * W(t, 4))} id={`gl${id}`} />}
      <defs><clipPath id={id}><rect x={-75} y={-300} width={150} height={300} rx={34} /></clipPath></defs>
      <rect x={-75} y={-300} width={150} height={300} rx={34} fill="#ffffff" fillOpacity={0.55} />
      <g clipPath={`url(#${id})`}>
        <rect x={-80} y={-h} width={160} height={h + 4} fill={renk} />
        <path d={`M -80 ${-h} Q -40 ${-h - 8 + W(t, 3) * 5} 0 ${-h} T 80 ${-h}`} fill="#fff" opacity={0.35} />
        {renk === MOR && Array.from({ length: 6 }).map((_, i) => {
          const yy = -((t * 60 + i * 50) % Math.max(h, 1));
          return <circle key={i} cx={-40 + rnd(i, 2) * 80} cy={yy} r={5 + rnd(i, 3) * 6} fill="#fff" opacity={0.35} />;
        })}
      </g>
      <rect x={-75} y={-300} width={150} height={300} rx={34} fill="none" stroke={INK} strokeWidth={8} />
      <rect x={-48} y={-342} width={96} height={46} rx={10} fill="#5b6070" stroke={INK} strokeWidth={7} />
      <path d="M 0 0 L 0 70 L -14 92" fill="none" stroke="#c8ccd6" strokeWidth={14} strokeLinecap="round" />
      <path d="M 0 0 L 0 70 L -14 92" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      <rect x={-92} y={-210} width={184} height={70} rx={14} fill={KREM} stroke={INK} strokeWidth={6} transform="rotate(-3)" />
      <text x={0} y={-162} textAnchor="middle" fontSize={etiket.length > 6 ? 27 : 46} fontWeight={900} fill={INK} style={font} transform="rotate(-3)">{etiket}</text>
    </g>
  );
};

/** Kafes: parmaklıklar + taban */
const Kafes: React.FC<{ x: number; y: number; w: number; h: number; o?: number; patla?: number }> = ({ x, y, w, h, o = 1, patla = 0 }) => {
  const n = Math.round(w / 52);
  return (
    <g opacity={o}>
      <rect x={x} y={y + h - 26} width={w} height={34} rx={8} fill="#6b7387" stroke={INK} strokeWidth={7} />
      {Array.from({ length: n + 1 }).map((_, i) => {
        const bx = x + (i * w) / n;
        const dx = patla * (bx - (x + w / 2)) * 3 + patla * (rnd(i, 1) - 0.5) * 400;
        const dy = -patla * (300 + rnd(i, 2) * 900);
        return <line key={i} x1={bx + dx} y1={y + dy} x2={bx + dx * 1.2} y2={y + h - 26 + dy} stroke="#c3c9d6" strokeWidth={10} strokeLinecap="round" opacity={1 - patla} />;
      })}
      <path d={`M ${x} ${y} Q ${x + w / 2} ${y - 70 - patla * 600} ${x + w} ${y}`} fill="none" stroke="#c3c9d6" strokeWidth={12} opacity={1 - patla} />
      <rect x={x} y={y} width={w} height={h - 26} fill="none" stroke={INK} strokeWidth={6} opacity={(1 - patla) * 0.5} />
    </g>
  );
};

/** Yavaşça düşen sıcak/soğuk zerreler: ekran hiç durmaz */
const Zerre: React.FC<{ t: number; renk: string; n?: number; o?: number; yukari?: boolean }> = ({ t, renk, n = 18, o = 0.4, yukari = false }) => (
  <g opacity={o}>
    {Array.from({ length: n }).map((_, i) => {
      const sp0 = 20 + rnd(i, 2) * 40;
      const yy = (((rnd(i, 1) * 2000 + (yukari ? -1 : 1) * t * sp0) % 2000) + 2000) % 2000 - 40;
      const xx = rnd(i, 3) * 1080 + W(t * 0.6, 1 + rnd(i, 4)) * 20;
      return <circle key={i} cx={xx} cy={yy} r={3 + rnd(i, 5) * 7} fill={renk} />;
    })}
  </g>
);

const Kalp: React.FC<{ x: number; y: number; s?: number; renk?: string; o?: number }> = ({ x, y, s = 1, renk = "#ff6b8b", o = 1 }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} opacity={o} d="M 0 18 C -40 -12 -28 -46 0 -28 C 28 -46 40 -12 0 18 Z" fill={renk} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
);

/** Büyük başlık yazısı (sözle birlikte zıplar) */
const Baslik: React.FC<{ y: number; text: string; k: number; size?: number; renk?: string; rot?: number }> = ({ y, text, k, size = 92, renk = ACC, rot = -2 }) =>
  k <= 0.01 ? null : (
    <g transform={`translate(540 ${y}) rotate(${rot}) scale(${k})`}>
      <text textAnchor="middle" fontSize={size} fontWeight={900} fill={renk} stroke={INK} strokeWidth={size / 7} paintOrder="stroke" style={font}>{text}</text>
    </g>
  );

/** Park dünyası: tepe, tünel, çark, yuva, oyuncaklar */
const Park: React.FC<{ t: number; k?: number }> = ({ t, k = 1 }) => (
  <g opacity={cl(k * 1.4)}>
    <path d="M -40 1060 Q 270 960 560 1040 T 1120 1010 L 1120 2100 L -40 2100 Z" fill="#79b85c" stroke={INK} strokeWidth={7} />
    <path d="M -40 1130 Q 300 1070 600 1120 T 1120 1100 L 1120 2100 L -40 2100 Z" fill="#5f9c47" />
    {/* tünel */}
    <g transform={`translate(${lerp(-300, 0, k)} 0)`}>
      <path d="M 60 1080 L 60 960 A 110 110 0 0 1 280 960 L 280 1080 Z" fill="#e2733a" stroke={INK} strokeWidth={7} />
      <path d="M 105 1080 L 105 975 A 65 65 0 0 1 235 975 L 235 1080 Z" fill="#3d2a22" />
    </g>
    {/* koşu çarkı */}
    <g transform={`translate(${lerp(1300, 860, k)} 880)`}>
      <line x1={0} y1={0} x2={-60} y2={180} stroke={INK} strokeWidth={10} /><line x1={0} y1={0} x2={60} y2={180} stroke={INK} strokeWidth={10} />
      <g transform={`rotate(${t * 90})`}>
        <circle r={120} fill="#ffd166" fillOpacity={0.35} stroke={INK} strokeWidth={9} />
        {Array.from({ length: 10 }).map((_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i / 10) * 6.283) * 120} y2={Math.sin((i / 10) * 6.283) * 120} stroke={INK} strokeWidth={4} opacity={0.5} />)}
      </g>
      <circle r={14} fill={INK} />
    </g>
    {/* toplar ve yuva */}
    <circle cx={lerp(600, 520, k)} cy={1060 + Math.abs(W(t, 3)) * -40} r={34} fill={RED} stroke={INK} strokeWidth={6} />
    <circle cx={700} cy={1075} r={26} fill="#4ea8de" stroke={INK} strokeWidth={6} />
    <ellipse cx={420} cy={1110} rx={90} ry={30} fill="#c9a26b" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={340 + i * 26} y1={1100} x2={360 + i * 22} y2={1085 - (i % 2) * 10} stroke="#8a6a3c" strokeWidth={5} />)}
    {/* çiçekler */}
    {[150, 330, 760, 990].map((fx, i) => (
      <g key={i} transform={`translate(${fx} ${1150 + (i % 2) * 40}) rotate(${W(t + i, 1.5) * 6})`}>
        <line x1={0} y1={0} x2={0} y2={-40} stroke="#2f6b2a" strokeWidth={6} />
        {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 14} cy={-44 + Math.sin((a * Math.PI) / 180) * 14} r={10} fill={["#ff8fab", "#ffd166", "#fff"][i % 3]} stroke={INK} strokeWidth={3} />)}
        <circle cx={0} cy={-44} r={8} fill={ACC} stroke={INK} strokeWidth={3} />
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------- 1 — Soru
const Soru: S = ({ t, d }) => {
  const kk = sp(t, 0.15, 9);
  const park = ap(t, 4.2, 0.6);
  return (
    <Kam t={t} d={d} z0={1.05} z1={1.12}>
      <Zerre t={t} renk="#ffffff" o={0.18} />
      <g transform={`translate(540 640) scale(${kk}) rotate(${W(t, 2) * 4})`}>
        <Glow cx={0} cy={0} r={330} color={MOR} o={0.5} id="sorug" />
        <text textAnchor="middle" y={150} fontSize={460} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={18} paintOrder="stroke" style={font}>?</text>
      </g>
      <g transform={`translate(${lerp(-300, 330, ap(t, 2.2, 0.8))} 1110)`}><Fare x={0} y={0} s={1.1} t={t} mood="merak" walk={t < 3 ? t : 0} /></g>
      <Sise x={810} y={1130} s={0.7} dolu={0.8} renk={MOR} etiket="?" parilti={1} t={t} k={sp(t, 1.1)} />
      <g opacity={park} transform={`translate(0 ${(1 - park) * 40})`}>
        <Tag x={540} y={360} text="BİR PSİKOLOG + BİR PARK" size={46} k={park} bg={GREEN} color="#fff" rot={-2} />
      </g>
    </Kam>
  );
};

// ---------------------------------------------------------------- 2 — 1970'ler: yalnız fare, küçük kafes
const KafesSahne: S = ({ t, d, ws }) => {
  const tk = ws("küçük");
  const tt = ws("tek");
  const yalniz = ap(t, tt, 0.5);
  return (
    <Kam t={t} d={d} z0={1} z1={1.16} oy={900}>
      <Zerre t={t} renk={GRI} o={0.25} />
      <g transform={`translate(540 ${lerp(-120, 450, sp(t, 0.1, 10))})`}>
        <text textAnchor="middle" fontSize={170} fontWeight={900} fill={KREM} stroke={INK} strokeWidth={16} paintOrder="stroke" style={font} opacity={0.95}>1970'ler</text>
      </g>
      {/* lamba konisi */}
      <path d="M 540 420 L 300 1180 L 780 1180 Z" fill="#fff6c8" opacity={0.08 + 0.04 * W(t, 6)} />
      <g transform={`translate(540 1000) scale(${lerp(1.6, 1, ap(t, tk - 0.2, 0.8))}) translate(-540 -1000)`}>
        <Kafes x={330} y={780} w={420} h={400} />
        <Fare x={540} y={1110} s={0.72} t={t} mood={t > tt ? "uzgun" : "merak"} />
      </g>
      <g opacity={yalniz}>
        <Txt x={540} y={1250} text="TEK BAŞINA" size={58} color={KREM} stroke={INK} />
      </g>
    </Kam>
  );
};

// ---------------------------------------------------------------- 3 — İki şişe
const Siseler: S = ({ t, d, ws }) => {
  const tn = ws("normal");
  const tu = ws("uyuşturucu");
  return (
    <Kam t={t} d={d} z0={1.02} z1={1.1}>
      <Zerre t={t} renk={GRI} o={0.22} />
      <Kafes x={110} y={560} w={860} h={640} o={0.55} />
      <Sise x={340} y={960} s={1.05} dolu={0.85} renk={SU} etiket="SU" t={t} k={sp(t, tn - 0.25)} />
      <Sise x={740} y={960} s={1.05} dolu={0.85} renk={MOR} etiket="UYUŞTURUCU" parilti={ap(t, tu, 0.6)} t={t} k={sp(t, tu - 0.25)} />
      <Fare x={540} y={1170} s={0.6} t={t} mood="merak" flip={t > tu + 0.3} />
      <Baslik y={470} text="İKİ ŞİŞE" k={sp(t, 0.2)} size={110} renk={KREM} />
    </Kam>
  );
};

// ---------------------------------------------------------------- 4 — İçiyor, içiyor… Uyuşturucu bağımlılık yapar. Nokta.
const Icme: S = ({ t, d, ws }) => {
  const ti = ws("içiyor");
  const to = ws("ölene");
  const ts = ws("sonuç");
  const tb = ws("bağımlılık");
  const tn = ws("nokta");
  const dolu = lerp(0.9, 0.15, ap(t, ti - 0.5, Math.max(to - ti + 1.5, 1)));
  const kararma = ap(t, to - 0.3, 1.0) * (1 - ap(t, ts - 0.2, 0.5));
  const yudum = Math.abs(W(t, 7)) * (t < ts ? 1 : 0);
  const damga = sp(t, tb - 0.1, 8);
  const nokta = sp(t, tn - 0.05, 7);
  return (
    <Kam t={t} d={d} z0={1.08} z1={1.0}>
      <Zerre t={t} renk={MOR} o={0.3} yukari />
      <Kafes x={110} y={560} w={860} h={640} o={0.55} />
      <Sise x={640} y={900} s={1.1} dolu={dolu} renk={MOR} etiket="UYUŞTURUCU" parilti={1} t={t} />
      <g transform={`translate(${470 + yudum * 12} ${1060 - yudum * 18}) rotate(${-14 - yudum * 6})`}>
        <Fare x={0} y={0} s={0.85} t={t} mood={t > to ? "sersem" : "merak"} />
      </g>
      <rect x={-50} y={-50} width={1180} height={2050} fill="#000" opacity={kararma * 0.45} />
      {damga > 0.01 && (
        <g transform={`translate(540 430) rotate(-6) scale(${damga})`}>
          <rect x={-470} y={-110} width={940} height={220} rx={24} fill={KREM} stroke={RED} strokeWidth={14} />
          <text textAnchor="middle" y={-12} fontSize={72} fontWeight={900} fill={RED} style={font}>UYUŞTURUCU =</text>
          <text textAnchor="middle" y={78} fontSize={84} fontWeight={900} fill={RED} style={font}>BAĞIMLILIK</text>
        </g>
      )}
      {nokta > 0.01 && <circle cx={960} cy={500} r={46 * nokta} fill={RED} stroke={INK} strokeWidth={8} />}
    </Kam>
  );
};

// ---------------------------------------------------------------- 5 — Ama Bruce Alexander merak etti: ya sorun kafesse?
const Merak: S = ({ t, d, ws }) => {
  const tb = ws("bruce");
  const tm = ws("merak");
  const tk = ws("kafes");
  const kafesVurgu = sp(t, tk - 0.15, 8);
  return (
    <Kam t={t} d={d} z0={1} z1={1.1} oy={820}>
      <Zerre t={t} renk={ACC} o={0.18} />
      {/* bilim insanı (silüet, kimseye benzetilmez) */}
      <g transform={`translate(${lerp(-200, 260, sp(t, tb - 0.4, 12))} 1160)`}>
        <path d="M -120 0 C -120 -170 120 -170 120 0 Z" fill="#f4efe2" stroke={INK} strokeWidth={8} />
        <path d="M -20 -150 L 0 -60 L 20 -150" fill="none" stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={-235} r={80} fill="#e8c6a0" stroke={INK} strokeWidth={8} />
        <path d="M -82 -250 C -70 -330 70 -330 82 -250 C 50 -290 -50 -290 -82 -250 Z" fill="#5a4636" stroke={INK} strokeWidth={6} />
        <g stroke={INK} strokeWidth={6} fill="none"><circle cx={-30} cy={-235} r={22} /><circle cx={30} cy={-235} r={22} /><line x1={-8} y1={-235} x2={8} y2={-235} /></g>
        <path d={t > tk ? "M -22 -190 Q 0 -178 22 -190" : "M -20 -190 L 20 -190"} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        <g transform={`translate(110 -110) rotate(${-30 + W(t, 2) * 5})`}><rect x={-14} y={-90} width={28} height={90} rx={12} fill="#e8c6a0" stroke={INK} strokeWidth={6} /></g>
      </g>
      <Tag x={290} y={1200} text="BRUCE ALEXANDER" size={36} k={sp(t, tb)} bg={KREM} rot={2} />
      {/* düşünce balonu */}
      <g opacity={ap(t, tm - 0.3, 0.5)}>
        <circle cx={430} cy={940} r={18} fill={KREM} stroke={INK} strokeWidth={5} />
        <circle cx={480} cy={870} r={28} fill={KREM} stroke={INK} strokeWidth={5} />
        <g transform={`translate(650 600) scale(${sp(t, tm - 0.2, 10)})`}>
          <ellipse rx={380} ry={250} fill={KREM} stroke={INK} strokeWidth={8} />
          <g transform="scale(0.62) translate(-300 -330)">
            <Kafes x={60} y={110} w={480} h={420} />
            <Fare x={300} y={455} s={0.75} t={t} mood="uzgun" />
          </g>
          {kafesVurgu > 0.01 && <circle cx={0} cy={0} r={300 * kafesVurgu} fill="none" stroke={RED} strokeWidth={14} strokeDasharray="30 18" transform={`rotate(${t * 40})`} />}
        </g>
      </g>
      <Baslik y={390} text="YA SORUN KAFESSE?" k={sp(t, tk - 0.3, 9)} size={86} />
    </Kam>
  );
};

// ---------------------------------------------------------------- 6 — Fare Parkı
const ParkSahne: S = ({ t, d, ws }) => {
  const tp = ws("park");
  const t200 = ws("200");
  const to = ws("oyuncaklar");
  const tf = ws("diğer");
  const ta = ws("arkadaşları");
  const ac = ap(t, tp - 0.3, 0.9);
  const fareler = [
    { x: 300, y: 1090, ph: 0, c: "#c9c2b8", a: tf },
    { x: 720, y: 1140, ph: 1.3, c: "#e6d9c4", a: tf + 0.25, flip: true },
    { x: 540, y: 1210, ph: 2.1, c: "#b9ada0", a: tf + 0.5 },
    { x: 180, y: 1230, ph: 0.7, c: "#d8cdbd", a: tf + 0.7, flip: true },
    { x: 930, y: 1230, ph: 2.9, c: "#cfc3b2", a: tf + 0.9 },
  ];
  return (
    <Kam t={t} d={d} z0={1.12} z1={1.0} oy={1000}>
      <rect x={-60} y={-60} width={1200} height={2100} fill="#9ad1f0" opacity={ac} />
      <circle cx={170} cy={700} r={80} fill="#ffe066" stroke={INK} strokeWidth={7} opacity={ac} />
      <Zerre t={t} renk="#fff" o={0.3 * ac} yukari />
      <Park t={t} k={ac} />
      <Kafes x={330} y={780} w={420} h={400} patla={ap(t, tp - 0.35, 0.7)} o={1 - ap(t, tp + 0.2, 0.3)} />
      <Fare x={lerp(540, 300, ac)} y={1110} s={0.7} t={t} mood={t > tp ? "mutlu" : "uzgun"} />
      {fareler.slice(1).map((f, i) => (
        <g key={i} transform={`translate(0 ${(1 - sp(t, f.a, 12)) * 500})`} opacity={cl((t - f.a) * 4)}>
          <Fare x={f.x + W(t + f.ph, 0.8) * 30} y={f.y} s={0.55} t={t} mood="mutlu" ph={f.ph} renk={f.c} flip={f.flip} />
        </g>
      ))}
      {t > ta - 0.2 && [0, 1, 2, 3].map((i) => {
        const u = (t - ta + 0.2 - i * 0.25) % 2.2;
        return u > 0 ? <Kalp key={i} x={[420, 640, 300, 820][i]} y={1000 - u * 160} s={0.9 + u * 0.3} o={1 - u / 2.2} /> : null;
      })}
      <Baslik y={400} text="FARE PARKI" k={sp(t, tp - 0.1, 9)} size={120} renk={ACC} />
      <Tag x={540} y={530} text="200 KAT BÜYÜK" size={50} k={sp(t, t200 - 0.15)} bg="#fff" rot={2} />
      <g opacity={ap(t, to - 0.2, 0.3) * (1 - ap(t, tf - 0.3, 0.3))}>
        <Tag x={540} y={650} text="OYUNCAK · TÜNEL · SAKLANMA YERİ" size={34} k={sp(t, to - 0.1)} bg={KREM} rot={-1} />
      </g>
      <Tag x={540} y={650} text="VE ARKADAŞLAR" size={52} k={sp(t, tf)} bg="#ff8fab" rot={-2} />
    </Kam>
  );
};

// ---------------------------------------------------------------- 7 — Aynı iki şişe: parktakiler neredeyse hiç dokunmadı
const Sonuc: S = ({ t, d, ws }) => {
  const ta = ws("aynı");
  const tn = ws("neredeyse");
  const tdk = ws("dokunmadı");
  const su = lerp(0.85, 0.35, ap(t, ta + 0.8, Math.max(tn - ta, 1)));
  return (
    <Kam t={t} d={d} z0={1} z1={1.08}>
      <rect x={-60} y={-60} width={1200} height={2100} fill="#9ad1f0" />
      <Zerre t={t} renk="#fff" o={0.3} yukari />
      <Park t={t} k={1} />
      <Sise x={330} y={930} s={0.9} dolu={su} renk={SU} etiket="SU" t={t} k={sp(t, ta - 0.1)} />
      <Sise x={760} y={930} s={0.9} dolu={0.85} renk={MOR} etiket="UYUŞTURUCU" parilti={0.4} t={t} k={sp(t, ta + 0.1)} />
      <g transform={`translate(${330 - 150} 1120)`}><Fare x={0} y={0} s={0.55} t={t} mood="mutlu" flip /></g>
      <Fare x={520} y={1210} s={0.55} t={t} mood="mutlu" ph={1.2} renk="#e6d9c4" walk={t} />
      {/* uyuşturucuya sırt dönen fare */}
      <Fare x={900} y={1180} s={0.5} t={t} mood="mutlu" ph={2} renk="#b9ada0" />
      <g transform={`translate(760 700) scale(${sp(t, tdk - 0.1, 8)})`}>
        <circle r={140} fill="none" stroke={RED} strokeWidth={16} />
        <line x1={-100} y1={100} x2={100} y2={-100} stroke={RED} strokeWidth={16} />
      </g>
      <Baslik y={420} text="NEREDEYSE HİÇ DOKUNMADILAR" k={sp(t, tn - 0.15, 10)} size={66} renk={ACC} />
    </Kam>
  );
};

// ---------------------------------------------------------------- 8 — Bağımlı fareler parka taşındı
const Donus: S = ({ t, d, ws }) => {
  const tk = ws("kafeste");
  const tp = ws("parka");
  const tg = ws("geri");
  const yol = ap(t, tp - 0.4, 1.3);
  return (
    <Kam t={t} d={d} z0={1.05} z1={1.0}>
      {/* sol: gri kafes dünyası, sağ: renkli park */}
      <rect x={-60} y={-60} width={600} height={2100} fill="#2c3446" />
      <rect x={540} y={-60} width={600} height={2100} fill="#9ad1f0" />
      <g transform="translate(540 0) scale(0.5) translate(0 1050)"><Park t={t} k={1} /></g>
      <line x1={540} y1={200} x2={540} y2={1300} stroke={INK} strokeWidth={8} strokeDasharray="24 18" />
      <Kafes x={90} y={820} w={360} h={340} o={0.9} />
      <Sise x={270} y={760} s={0.5} dolu={0.2} renk={MOR} etiket="UYUŞ." parilti={0.6} t={t} k={sp(t, tk)} />
      <Arrow x0={360} y0={1220} x1={760} y1={1220} k={ap(t, tp - 0.3, 0.6)} color={ACC} sw={14} />
      <g transform={`translate(${lerp(270, 800, yol)} ${1090 - Math.sin(yol * Math.PI) * 180})`}>
        <Fare x={0} y={0} s={0.6} t={t} mood={yol > 0.95 ? "mutlu" : "sersem"} walk={yol > 0 && yol < 1 ? t : 0} />
      </g>
      <Sise x={880} y={760} s={0.5} dolu={0.8} renk={SU} etiket="SU" t={t} k={sp(t, tg - 0.6)} />
      <Txt x={270} y={520} text="KAFES" size={72} color={GRI} stroke={INK} />
      <Txt x={810} y={520} text="PARK" size={72} color={ACC} stroke={INK} />
      <Baslik y={330} text="ÇOĞU SUYA DÖNDÜ" k={sp(t, tg - 0.2, 9)} size={84} renk={KREM} />
    </Kam>
  );
};

// ---------------------------------------------------------------- 9 — Dürüst dipnot: yayınlanmadı, hep tekrarlanmadı, ama soru değiştirdi
const Dipnot: S = ({ t, d, ws }) => {
  const ty = ws("yayınlanmadı");
  const tsn = ws("sonraki");
  const ta = ws("ama");
  const td = ws("değiştirdi");
  const ampul = ap(t, ta - 0.1, 0.5);
  return (
    <Kam t={t} d={d} z0={1} z1={1.1}>
      <Zerre t={t} renk={KREM} o={0.15} />
      {/* dergi yığını */}
      <g opacity={1 - ap(t, ta - 0.3, 0.4)}>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${300 + i * 40} ${620 + i * 30}) rotate(${-8 + i * 7}) scale(${sp(t, 0.1 + i * 0.12)})`}>
            <rect x={-150} y={-200} width={300} height={400} rx={10} fill={["#f4efe2", "#e9e1cf", "#fff"][i]} stroke={INK} strokeWidth={7} />
            <rect x={-110} y={-160} width={220} height={50} fill={["#3b82c4", RED, GREEN][i]} />
            {[0, 1, 2, 3, 4].map((j) => <line key={j} x1={-110} y1={-70 + j * 40} x2={110 - (j % 2) * 50} y2={-70 + j * 40} stroke={INK} strokeWidth={5} opacity={0.35} />)}
          </g>
        ))}
        <g transform={`translate(360 680) rotate(-12) scale(${sp(t, ty - 0.2, 8)})`}>
          <rect x={-230} y={-56} width={460} height={112} rx={14} fill="none" stroke={RED} strokeWidth={10} />
          <text textAnchor="middle" y={22} fontSize={58} fontWeight={900} fill={RED} style={font}>YAYINLANMADI</text>
        </g>
        {/* terazi: tekrar denemeler */}
        <g transform={`translate(800 900) scale(${sp(t, tsn - 0.1)})`}>
          <line x1={0} y1={0} x2={0} y2={220} stroke={INK} strokeWidth={10} />
          <g transform={`rotate(${W(t, 1.8) * 12})`}>
            <line x1={-150} y1={0} x2={150} y2={0} stroke={INK} strokeWidth={10} />
            <path d="M -190 60 L -110 60 L -150 0 Z" fill="none" stroke={INK} strokeWidth={5} />
            <path d="M 110 60 L 190 60 L 150 0 Z" fill="none" stroke={INK} strokeWidth={5} />
            <text x={-150} y={110} textAnchor="middle" fontSize={56} fontWeight={900} fill={GREEN} style={font}>✓</text>
            <text x={150} y={110} textAnchor="middle" fontSize={56} fontWeight={900} fill={RED} style={font}>?</text>
          </g>
          <Txt x={0} y={300} text="HER ZAMAN AYNI DEĞİL" size={38} color={KREM} stroke={INK} />
        </g>
      </g>
      {/* ama soru değiştirdi: ampul */}
      {ampul > 0.01 && (
        <g transform={`translate(540 760) scale(${sp(t, ta - 0.1, 9)})`}>
          <Glow cx={0} cy={0} r={420} color={ACC} o={0.6 * (0.85 + 0.15 * W(t, 5))} id="ampulg" />
          <path d="M -120 40 C -200 -60 -150 -230 0 -230 C 150 -230 200 -60 120 40 C 90 80 80 110 80 140 L -80 140 C -80 110 -90 80 -120 40 Z" fill="#fff3a6" stroke={INK} strokeWidth={9} />
          <rect x={-80} y={140} width={160} height={70} rx={12} fill="#9aa3b5" stroke={INK} strokeWidth={8} />
          <text textAnchor="middle" y={-30} fontSize={190} fontWeight={900} fill={INK} style={font}>?</text>
        </g>
      )}
      <Baslik y={400} text="AMA SORU HER ŞEYİ DEĞİŞTİRDİ" k={sp(t, td - 0.4, 10)} size={60} renk={ACC} rot={0} />
    </Kam>
  );
};

// ---------------------------------------------------------------- 10 — Bağımlılığın tersi: bağ kurmak
const Final: S = ({ t, d, ws }) => {
  const tt = ws("tersi");
  const tb = ws("bağ", 1); // 0. geçiş "bağımlılığın"
  const yak = ap(t, tb - 0.6, 1.0);
  const k2 = sp(t, tb - 0.1, 8);
  return (
    <Kam t={t} d={d} z0={1} z1={1.12} oy={900}>
      <Zerre t={t} renk="#fff" o={0.35} yukari />
      <Glow cx={540} cy={950} r={600} color="#ffd6a5" o={0.5 + 0.3 * yak} id="finalg" />
      <Fare x={lerp(230, 380, yak)} y={1120} s={0.8} t={t} mood={yak > 0.6 ? "mutlu" : "merak"} />
      <Fare x={lerp(850, 700, yak)} y={1120} s={0.8} t={t} mood={yak > 0.6 ? "mutlu" : "merak"} flip renk="#e6d9c4" ph={1.5} />
      <Kalp x={540} y={900} s={3.2 * k2 * (1 + 0.05 * W(t, 6))} />
      <g opacity={ap(t, tt - 0.3, 0.4)}>
        <Txt x={540} y={400} text="BAĞIMLILIĞIN TERSİ" size={70} color={KREM} stroke={INK} />
        <g opacity={1 - ap(t, tb - 0.3, 0.3)}>
          <Txt x={540} y={530} text="TEMİZ KALMAK DEĞİL…" size={56} color={KREM} stroke={INK} />
        </g>
      </g>
      <Baslik y={560} text="BAĞ KURMAK" k={k2} size={130} renk={ACC} />
    </Kam>
  );
};

export const SAHNE: Record<string, S> = { soru: Soru, kafes: KafesSahne, siseler: Siseler, icme: Icme, merak: Merak, park: ParkSahne, sonuc: Sonuc, donus: Donus, dipnot: Dipnot, final: Final };

export const KAPAK: React.FC = () => (
  <g>
    <rect x={0} y={0} width={540} height={1920} fill="#2c3446" />
    <rect x={540} y={0} width={540} height={1920} fill="#9ad1f0" />
    <g transform="translate(540 0) scale(0.5) translate(0 1900)"><Park t={0.4} k={1} /></g>
    <Kafes x={70} y={1250} w={400} h={380} />
    <Fare x={270} y={1580} s={0.7} t={0.3} mood="uzgun" />
    <Sise x={390} y={1560} s={0.45} dolu={0.6} renk={MOR} etiket="UYUŞ." parilti={1} t={0.3} />
    <Fare x={720} y={1600} s={0.65} t={0.3} mood="mutlu" />
    <Fare x={930} y={1650} s={0.6} t={0.9} mood="mutlu" flip renk="#e6d9c4" />
    <Kalp x={830} y={1450} s={1.4} />
  </g>
);
export const KAPAK_YAZI = { ust: "Bağımlılığın sebebi", buyuk: "UYUŞTURUCU MU?", alt: "Fare Parkı deneyi" };
