// Konu 8/30 (Teknoloji): GPS — telefon 20.000 km yukarıyı dinliyor. ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, cl, Cross, ez, GREEN, Glow, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";
import { Dunya, Saat, Telefon, Uydu } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };

/** Telefondan yukarı uydulara giden sinyal halkaları */
const Dalga: React.FC<{ x: number; y: number; t: number; o?: number }> = ({ x, y, t, o = 1 }) => (
  <g opacity={o}>
    {[0, 1, 2].map((i) => {
      const u = ((t * 0.9 + i / 3) % 1);
      return <circle key={i} cx={x} cy={y} r={40 + u * 220} fill="none" stroke={ACC} strokeWidth={8 * (1 - u)} opacity={1 - u} />;
    })}
  </g>
);

// ---------- 1 — Telefon uyduları dinliyor, internet gerekmez ----------
const Giris: S = ({ t, ws, ses }) => {
  const ti = ws("internete");
  return (
    <g>
      <g transform="translate(820 420)"><Uydu x={0} y={0} s={0.9} t={t} /></g>
      <line x1={540} y1={920} x2={820} y2={440} stroke={ACC} strokeWidth={6} strokeDasharray="16 12" strokeDashoffset={t * 80} />
      {[0, 1, 2].map((i) => {
        const u = ((t * 0.8 + i / 3) % 1);
        return <circle key={i} cx={lerp(820, 540, u)} cy={lerp(440, 920, u)} r={10} fill={ACC} />;
      })}
      <g transform="translate(540 960)"><Telefon x={0} y={0} s={0.7} t={t} ekran={GREEN} /></g>
      <Tag x={330} y={560} text="20.000 KM" size={56} k={sp(t, 0.3, 8)} bg={ACC} rot={-4} />
      <g opacity={ap(t, ti - 0.3, 0.3)} transform="translate(250 900)">
        <path d="M -70 -10 Q 0 -70 70 -10 M -45 15 Q 0 -25 45 15 M -18 40 Q 0 25 18 40" stroke={CHALK} strokeWidth={10} fill="none" strokeLinecap="round" />
        <Cross cx={0} cy={10} r={90} k={ap(t, ti, 0.3)} sw={14} />
      </g>
      <Merakli x={880} y={1240} s={0.45} t={t} hareket={t > ti ? "sasir" : "isaret"} kostum="kulaklik" agiz={ses(t)} ink={CHALK} flip />
    </g>
  );
};

// ---------- 2 — Dünyanın etrafında 30'dan fazla GPS uydusu ----------
const Uydular: S = ({ t, ws, ses }) => {
  const t3 = ws("30dan");
  return (
    <g>
      <Dunya x={540} y={780} s={1.7} t={t} />
      {[0, 1, 2].map((o) => (
        <ellipse key={o} cx={540} cy={780} rx={360 + o * 50} ry={160 + o * 40} fill="none" stroke={CHALK} strokeWidth={3} strokeDasharray="10 12" opacity={0.5} transform={`rotate(${-30 + o * 30} 540 780)`} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => {
        const o = i % 3;
        const a = t * (0.5 + o * 0.15) + i * 0.9;
        const rx = 360 + o * 50, ry = 160 + o * 40, rot = ((-30 + o * 30) * Math.PI) / 180;
        const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
        const x = 540 + px * Math.cos(rot) - py * Math.sin(rot);
        const y = 780 + px * Math.sin(rot) + py * Math.cos(rot);
        return <g key={i} opacity={ap(t, 0.1 + i * 0.08, 0.2)}><circle cx={x} cy={y} r={14} fill={ACC} stroke={INK} strokeWidth={4} /></g>;
      })}
      <g transform={`translate(540 340) scale(${sp(t, t3 - 0.1, 8)})`}>
        <rect x={-200} y={-60} width={400} height={110} rx={55} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={22} textAnchor="middle" fontSize={60} fontWeight={900} fill={INK} style={font}>30+ UYDU</text>
      </g>
    </g>
  );
};

// ---------- 3 — Her biri yayınlıyor: ben buradayım + saat ----------
const Yayin: S = ({ t, ws, ses }) => {
  const tb = ws("ben");
  const ts = ws("saat");
  const ms = Math.floor((t * 1000) % 1000).toString().padStart(3, "0");
  return (
    <g>
      <g transform="translate(540 620)"><Uydu x={0} y={0} s={1.3} t={t} /></g>
      <Glow cx={540} cy={620} r={260} id="yy" color={ACC} o={0.25 + 0.15 * Math.sin(t * 6)} />
      {[0, 1, 2].map((i) => {
        const u = ((t * 0.8 + i / 3) % 1);
        return <circle key={i} cx={540} cy={620} r={120 + u * 300} fill="none" stroke={ACC} strokeWidth={6 * (1 - u)} opacity={1 - u} />;
      })}
      <g transform={`translate(540 960) scale(${sp(t, tb - 0.2, 9)})`}>
        <rect x={-300} y={-60} width={600} height={110} rx={30} fill="#fff" stroke={INK} strokeWidth={7} />
        <text x={0} y={18} textAnchor="middle" fontSize={50} fontWeight={900} fill={INK} style={font}>"BEN BURADAYIM"</text>
      </g>
      <g transform={`translate(540 1100) scale(${sp(t, ts - 0.2, 9)})`}>
        <rect x={-260} y={-55} width={520} height={100} rx={20} fill={INK} />
        <text x={0} y={20} textAnchor="middle" fontSize={54} fontWeight={900} fill={ACC} style={font}>{`12:00:00.${ms}`}</text>
      </g>
    </g>
  );
};

// ---------- 4 — Sinyal süresinden uzaklık ----------
const Sure: S = ({ t, ws, ses }) => {
  const tg = ws("geldiğinden");
  const tu = ws("uzaklığı");
  const u = cl((t - 0.4) / 1.6);
  return (
    <g>
      <g transform="translate(220 420)"><Uydu x={0} y={0} s={0.8} t={t} /></g>
      <g transform="translate(820 1000)"><Telefon x={0} y={0} s={0.55} t={t} ekran={GREEN} /></g>
      <line x1={260} y1={460} x2={800} y2={920} stroke={CHALK} strokeWidth={4} strokeDasharray="12 12" />
      <circle cx={lerp(260, 800, u)} cy={lerp(460, 920, u)} r={18} fill={ACC} stroke={INK} strokeWidth={4} />
      <g opacity={ap(t, tg - 0.4, 0.3)}><Saat x={300} y={900} s={0.9} t={t} hiz={8} /></g>
      <g transform={`translate(560 340) scale(${sp(t, tu - 0.2, 9)})`}>
        <rect x={-310} y={-55} width={620} height={100} rx={50} fill={ACC} stroke={INK} strokeWidth={7} />
        <text x={0} y={18} textAnchor="middle" fontSize={46} fontWeight={900} fill={INK} style={font}>SÜRE × HIZ = UZAKLIK</text>
      </g>
    </g>
  );
};

// ---------- 5 — 4 uydu, kesişen çemberler, birkaç metre ----------
const Dort: S = ({ t, ws, ses }) => {
  const tb = ws("birkaç");
  const P = [540, 820];
  const U = [[170, 420, 520], [910, 400, 540], [130, 1180, 470], [960, 1160, 500]];
  return (
    <g>
      {U.map(([x, y], i) => {
        const k = ap(t, 0.2 + i * 0.35, 0.8);
        const r = Math.hypot(P[0] - x, P[1] - y);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r * k} fill="none" stroke={[ACC, BLUE, GREEN, RED][i]} strokeWidth={7} opacity={0.85} />
            <g transform={`translate(${x} ${y})`}><Uydu x={0} y={0} s={0.45} t={t} /></g>
          </g>
        );
      })}
      <g transform={`translate(${P[0]} ${P[1]}) scale(${sp(t, tb - 0.4, 8)})`}>
        <path d="M 0 30 C -40 -10 -50 -40 -50 -60 A 50 50 0 1 1 50 -60 C 50 -40 40 -10 0 30 Z" fill={RED} stroke={INK} strokeWidth={6} />
        <circle cy={-60} r={20} fill="#fff" />
      </g>
      <Tag x={540} y={340} text="BİRKAÇ METRE HASSAS" size={44} k={sp(t, tb)} bg={ACC} rot={-2} />
    </g>
  );
};

// ---------- 6 — Soru ----------
const Soru: S = ({ t, ws, ses }) => (
  <g>
    <g transform={`translate(540 720) scale(${sp(t, 0.1, 8)}) rotate(${Math.sin(t * 4) * 7})`}>
      <text textAnchor="middle" y={80} fontSize={300} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={14} paintOrder="stroke" style={font}>?</text>
    </g>
    <Tag x={540} y={1020} text="EN ŞAŞIRTICI KISIM" size={46} k={sp(t, ws("şaşırtıcı") - 0.1)} bg="#fff" rot={-2} />
    <Merakli x={880} y={1240} s={0.5} t={t} hareket="sasir" kostum="kulaklik" agiz={ses(t)} ink={CHALK} flip />
  </g>
);

// ---------- 7 — Uydu saatleri günde 38 mikrosaniye hızlı ----------
const Saatler: S = ({ t, ws, ses }) => {
  const t38 = ws("38");
  return (
    <g>
      <g transform="translate(300 640)">
        <circle r={150} fill="#fff" stroke={INK} strokeWidth={10} />
        <line x1={0} y1={0} x2={Math.cos(t * 2.2 - 1.5) * 110} y2={Math.sin(t * 2.2 - 1.5) * 110} stroke={RED} strokeWidth={10} strokeLinecap="round" />
        <circle r={14} fill={INK} />
        <Txt x={0} y={220} text="UZAYDA" size={44} color={CHALK} stroke={INK} />
      </g>
      <g transform="translate(780 640)">
        <circle r={150} fill="#fff" stroke={INK} strokeWidth={10} />
        <line x1={0} y1={0} x2={Math.cos(t * 2 - 1.5) * 110} y2={Math.sin(t * 2 - 1.5) * 110} stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <circle r={14} fill={INK} />
        <Txt x={0} y={220} text="YERDE" size={44} color={CHALK} stroke={INK} />
      </g>
      <g opacity={ap(t, ws("einstein") - 0.3, 0.3)} transform="translate(540 380)">
        <rect x={-170} y={-55} width={340} height={100} rx={14} fill="#1d2430" stroke={INK} strokeWidth={6} />
        <text x={0} y={18} textAnchor="middle" fontSize={52} fontWeight={900} fill={CHALK} style={font}>E = mc²</text>
      </g>
      <g transform={`translate(540 1060) scale(${sp(t, t38 - 0.2, 8)})`}>
        <rect x={-300} y={-62} width={600} height={116} rx={58} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={20} textAnchor="middle" fontSize={54} fontWeight={900} fill={INK} style={font}>+38 µs / GÜN</text>
      </g>
    </g>
  );
};

// ---------- 8 — Düzeltilmeseydi konum kilometrelerce kayardı ----------
const Kayma: S = ({ t, ws, ses }) => {
  const tk = ws("kilometrelerce");
  const k = ez((t - tk + 0.6) / 1.4);
  return (
    <g>
      <rect x={120} y={420} width={840} height={680} rx={30} fill="#e9eef5" stroke={INK} strokeWidth={8} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={120} y1={520 + i * 160} x2={960} y2={480 + i * 170} stroke="#c9d3e0" strokeWidth={26} />)}
      {[0, 1, 2].map((i) => <line key={i} x1={300 + i * 230} y1={420} x2={260 + i * 250} y2={1100} stroke="#c9d3e0" strokeWidth={22} />)}
      <g transform={`translate(${lerp(400, 860, k)} ${lerp(820, 520, k)})`}>
        <path d="M 0 30 C -40 -10 -50 -40 -50 -60 A 50 50 0 1 1 50 -60 C 50 -40 40 -10 0 30 Z" fill={RED} stroke={INK} strokeWidth={6} />
        <circle cy={-60} r={20} fill="#fff" />
      </g>
      <circle cx={400} cy={760} r={22} fill={GREEN} stroke={INK} strokeWidth={5} opacity={ap(t, tk - 0.6, 0.3)} />
      <Tag x={540} y={340} text="HER GÜN KM'LERCE KAYMA" size={40} k={sp(t, tk)} bg={RED} color="#fff" rot={-2} />
    </g>
  );
};

// ---------- 9 — Sonuç: haritan Einstein'a teşekkür borçlu ----------
const Sonuc: S = ({ t, ws, ses }) => {
  const tt = ws("teşekkür");
  return (
    <g>
      <g transform="translate(400 760)"><Telefon x={0} y={0} s={0.8} t={t} ekran={GREEN} /></g>
      <g transform={`translate(760 540) rotate(4) scale(${sp(t, 0.2, 9)})`}>
        <rect x={-160} y={-80} width={320} height={160} rx={14} fill="#fff7c2" stroke={INK} strokeWidth={6} />
        <text x={0} y={-12} textAnchor="middle" fontSize={40} fontWeight={900} fill={INK} style={font}>E = mc²</text>
        <text x={0} y={42} textAnchor="middle" fontSize={34} fontWeight={900} fill={RED} style={font}>TEŞEKKÜRLER!</text>
      </g>
      <Tag x={540} y={340} text="EINSTEIN'A TEŞEKKÜR" size={44} k={sp(t, tt - 0.1)} bg={ACC} rot={-2} />
      <Merakli x={820} y={1240} s={0.55} t={t} hareket={t > tt ? "aha" : "anlat"} duygu={t > tt ? "wink" : undefined} kostum="kulaklik" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, uydular: Uydular, yayin: Yayin, sure: Sure, dort: Dort, soru: Soru, saatler: Saatler, kayma: Kayma, sonuc: Sonuc };

export const KAPAK: React.FC = () => (
  <g>
    <Dunya x={540} y={1450} s={2.4} t={0.2} />
    <g transform="translate(830 1060)"><Uydu x={0} y={0} s={1} t={0.2} /></g>
    <Merakli x={250} y={1700} s={0.85} t={0.3} hareket="sasir" kostum="kulaklik" ink={CHALK} />
  </g>
);
export const KAPAK_YAZI = { ust: "İnternet olmadan bile", buyuk: "TELEFONUN UZAYI DİNLİYOR", alt: "GPS'in Einstein sırrı" };
