// DEMO: Volt sisteminin yapabildikleri (ws("kelime") = o kelimenin sahne içindeki saniyesi)
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, BLUE, Check, CHALK, cl, ez, GREEN, Glow, INK, Kisi, lerp, RED, sp, Tag, Txt } from "../kit";

type S = React.FC<SceneProps>;
const PINK = "#ff5c8a";
const CYAN = "#5ce1ff";
const font = { fontFamily: "var(--font)" };

// ortak: patlayan kıvılcımlar
const Burst: React.FC<{ x: number; y: number; t: number; at: number; n?: number; color?: string; r?: number }> = ({ x, y, t, at, n = 18, color = ACC, r = 260 }) => {
  const k = (t - at) / 0.9;
  if (k <= 0 || k >= 1) return null;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + i * 0.37;
        const rr = r * ez(k) * (0.6 + 0.4 * ((i * 7) % 5) / 5);
        const x1 = x + Math.cos(a) * rr;
        const y1 = y + Math.sin(a) * rr;
        const x0 = x + Math.cos(a) * rr * 0.6;
        const y0 = y + Math.sin(a) * rr * 0.6;
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={i % 3 ? color : "#fff"} strokeWidth={8 * (1 - k)} strokeLinecap="round" />;
      })}
    </g>
  );
};

// 1 — Açılış: harf harf düşen logo, kıvılcım, kronometre
const Acilis: S = ({ t, ws }) => {
  const letters = "VOLT".split("");
  const tDemo = ws("demo");
  const tDk = ws("dakikada");
  const sub = "SİSTEM DEMOSU";
  const typed = Math.floor(cl((t - 0.9) / 0.9) * sub.length);
  const clock = sp(t, tDk - 0.4);
  const sweep = cl((t - tDk) / 1.6);
  return (
    <g>
      <Glow cx={540} cy={640} r={520} id="ag" color="#6fb6ff" o={0.35 + 0.1 * Math.sin(t * 3)} />
      {letters.map((ch, i) => {
        const k = sp(t, 0.15 + i * 0.16, 9);
        const y = lerp(-300, 640, k);
        const rot = (1 - cl(k)) * (i % 2 ? 40 : -40);
        return (
          <g key={i} transform={`translate(${255 + i * 190} ${y}) rotate(${rot})`}>
            <text x={0} y={0} textAnchor="middle" fontSize={230} fontWeight={900} fill={i === 3 ? ACC : "#ffffff"} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>{ch}</text>
          </g>
        );
      })}
      <text x={540} y={760} textAnchor="middle" fontSize={64} fontWeight={900} fill={CYAN} letterSpacing={8} style={font}>
        {sub.slice(0, typed)}{typed < sub.length && Math.floor(t * 4) % 2 ? "|" : ""}
      </text>
      <Burst x={540} y={560} t={t} at={tDemo} n={24} r={420} />
      <g transform={`translate(540 1010) scale(${clock})`} opacity={cl(clock * 1.5)}>
        <circle r={130} fill="#16233d" stroke="#ffffff" strokeWidth={10} />
        <path d={`M 0 0 L 0 -112 A 112 112 0 ${sweep > 0.5 ? 1 : 0} 1 ${Math.sin(sweep * Math.PI * 2) * 112} ${-Math.cos(sweep * Math.PI * 2) * 112} Z`} fill={ACC} opacity={0.85} />
        <line x1={0} y1={0} x2={Math.sin(sweep * Math.PI * 2) * 100} y2={-Math.cos(sweep * Math.PI * 2) * 100} stroke="#fff" strokeWidth={10} strokeLinecap="round" />
        <rect x={-22} y={-170} width={44} height={36} rx={8} fill="#fff" />
        <text x={0} y={60} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" style={font}>1 dk</text>
      </g>
    </g>
  );
};

// 2 — Karakter: yürür, el sallar, duygular
const Karakter: S = ({ t, ws }) => {
  const tWalk = ws("yürüyebiliyor");
  const stop = tWalk + 1.3;
  const tWave = ws("el");
  const tFeel = ws("duygularını");
  const x = lerp(-120, 540, ez(t / stop));
  const walking = t < stop;
  const moods = ["happy", "surprised", "worried", "happy"] as const;
  const mi = t < tFeel ? 0 : Math.min(3, Math.floor((t - tFeel) / 0.55));
  const mood = t < tWave ? "neutral" : moods[mi];
  const waving = t >= tWave && t < tFeel + 2.2;
  const bubble = sp(t, tWave);
  const labels = ["MUTLU", "ŞAŞKIN", "ENDİŞELİ", "MUTLU"];
  return (
    <g>
      <line x1={0} y1={1130} x2={1080} y2={1130} stroke={INK} strokeWidth={6} />
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d={`M ${((i * 160 - t * (walking ? 120 : 0)) % 1200) - 60} 1150 q 20 -18 40 0`} stroke={INK} strokeWidth={4} fill="none" opacity={0.4} />
      ))}
      <Kisi x={x} y={820} s={1.05} t={t} walk={walking ? 1 : 0} arms={waving ? "up" : "down"} mood={mood as any} />
      <g transform={`translate(${x + 150} 640) scale(${bubble})`} opacity={cl(bubble * 1.5)}>
        <path d="M -20 60 L -60 110 L 30 60 Z" fill="#fff" stroke={INK} strokeWidth={6} />
        <rect x={-150} y={-70} width={300} height={130} rx={40} fill="#fff" stroke={INK} strokeWidth={6} />
        <text x={0} y={18} textAnchor="middle" fontSize={56} fontWeight={900} fill={INK} style={font}>Merhaba!</text>
      </g>
      {t >= tFeel ? <Tag x={540} y={420} text={labels[mi]} size={56} k={sp(t, tFeel + mi * 0.55, 9)} bg={[ACC, CYAN, PINK, ACC][mi]} /> : null}
    </g>
  );
};

// 3 — Tebeşir çizim: ampul ve dişli adım adım
const BULB = "M 540 860 C 400 860 360 720 400 640 C 430 580 460 560 460 500 L 620 500 C 620 560 650 580 680 640 C 720 720 680 860 540 860 Z";
const Cizim: S = ({ t, ws }) => {
  const tAdim = ws("adım");
  const d1 = ap(t, 0.2, 1.6);
  const d2 = ap(t, 1.4, 1.0);
  const lit = ap(t, tAdim, 0.4);
  const gear = (cx: number, cy: number, r: number, rot: number, k: number) => {
    let d = "";
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const rr = r + (Math.floor(i / 3) % 2 ? 22 : 0);
      d += (i ? " L " : "M ") + (cx + Math.cos(a + rot) * rr) + " " + (cy + Math.sin(a + rot) * rr);
    }
    return <path d={d + " Z"} fill="none" stroke={CHALK} strokeWidth={6} pathLength={1} strokeDasharray={`${k} 1`} opacity={k > 0.01 ? 1 : 0} />;
  };
  return (
    <g>
      {lit > 0 ? <Glow cx={540} cy={420} r={420} id="bulb" color="#fff2a8" o={0.6 * lit} /> : null}
      <g transform="translate(0 -250)">
        <path d={BULB} fill={lit > 0 ? `rgba(255,230,120,${0.85 * lit})` : "none"} stroke={CHALK} strokeWidth={8} pathLength={1} strokeDasharray={`${d1} 1`} opacity={d1 > 0.01 ? 1 : 0} />
        <path d="M 470 500 L 470 560 M 610 500 L 610 560 M 480 590 Q 510 540 540 590 Q 570 540 600 590" stroke={lit > 0.5 ? "#ff9d00" : CHALK} strokeWidth={7} fill="none" pathLength={1} strokeDasharray={`${d2} 1`} opacity={d2 > 0.01 ? 1 : 0} />
        <path d="M 480 880 L 600 880 M 490 915 L 590 915 M 505 950 L 575 950" stroke={CHALK} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${d2} 1`} opacity={d2 > 0.01 ? 1 : 0} />
        {lit > 0
          ? Array.from({ length: 9 }).map((_, i) => {
            const a = Math.PI + (i / 8) * Math.PI;
            return <line key={i} x1={540 + Math.cos(a) * 230} y1={660 + Math.sin(a) * 230} x2={540 + Math.cos(a) * (230 + 70 * lit)} y2={660 + Math.sin(a) * (230 + 70 * lit)} stroke={ACC} strokeWidth={9} strokeLinecap="round" />;
          })
          : null}
      </g>
      {gear(230, 980, 85, t * 1.2, ap(t, 2.0, 0.9))}
      {gear(372, 1060, 55, -t * 1.9, ap(t, 2.3, 0.8))}
      {[1, 2, 3].map((n, i) => (
        <g key={n} transform={`translate(${780 + i * 0} ${880 + i * 95}) scale(${sp(t, tAdim - 0.6 + i * 0.3)})`}>
          <circle r={34} fill="none" stroke={ACC} strokeWidth={5} />
          <text x={0} y={16} textAnchor="middle" fontSize={44} fontWeight={900} fill={ACC} style={font}>{n}</text>
        </g>
      ))}
    </g>
  );
};

// 4 — Geçişler: dört panel, dört farklı geçiş
const Panel: React.FC<{ c: string; label: string; icon: number }> = ({ c, label, icon }) => (
  <g>
    <rect x={140} y={430} width={800} height={640} rx={40} fill={c} stroke="#fff" strokeWidth={8} />
    {icon === 0 ? <circle cx={540} cy={700} r={150} fill="none" stroke="#fff" strokeWidth={22} /> : null}
    {icon === 1 ? <Arrow x0={360} y0={700} x1={720} y1={700} color="#fff" sw={26} /> : null}
    {icon === 2 ? <g stroke="#fff" strokeWidth={22} fill="none"><circle cx={510} cy={680} r={110} /><line x1={590} y1={760} x2={690} y2={860} strokeLinecap="round" /></g> : null}
    {icon === 3 ? <g fill="#fff">{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={330 + ((i * 97) % 300)} y={580 + i * 45} width={160 + (i % 3) * 60} height={26} />)}</g> : null}
    <text x={540} y={1000} textAnchor="middle" fontSize={84} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={8} paintOrder="stroke" style={font}>{label}</text>
  </g>
);
const Gecisler: S = ({ t, ws }) => {
  const T = [ws("daire"), ws("kaydırma"), ws("yakınlaşma"), ws("parazit")];
  const cur = T.reduce((acc, v, i) => (t >= v - 0.15 ? i : acc), -1);
  const k = cur >= 0 ? ez((t - (T[cur] - 0.15)) / 0.4) : 0;
  const cols = [BLUE, PINK, GREEN, "#7a4dd8"];
  const labels = ["DAİRE", "KAYDIRMA", "YAKINLAŞMA", "PARAZİT"];
  const prev = cur > 0 ? <Panel c={cols[cur - 1]} label={labels[cur - 1]} icon={cur - 1} /> : null;
  let curEl: React.ReactNode = null;
  if (cur === 0) curEl = <g clipPath="url(#gcirc)"><Panel c={cols[0]} label={labels[0]} icon={0} /></g>;
  if (cur === 1) curEl = <g transform={`translate(${(1 - k) * 1100} 0)`}><Panel c={cols[1]} label={labels[1]} icon={1} /></g>;
  if (cur === 2) curEl = <g transform={`translate(540 750) scale(${0.2 + 0.8 * k}) translate(-540 -750)`} opacity={k}><Panel c={cols[2]} label={labels[2]} icon={2} /></g>;
  if (cur === 3) {
    const g = 1 - k;
    const j = Math.sin(t * 97) * 50 * g;
    curEl = (
      <g>
        <g transform={`translate(${j + 14 * g} 0)`} opacity={0.6 * g}><Panel c="#ff0050" label={labels[3]} icon={3} /></g>
        <g transform={`translate(${-j - 14 * g} 0)`} opacity={0.6 * g}><Panel c="#00e5ff" label={labels[3]} icon={3} /></g>
        <g opacity={Math.floor(t * 30) % 3 === 0 && g > 0.1 ? 0.3 : 1}><Panel c={cols[3]} label={labels[3]} icon={3} /></g>
      </g>
    );
  }
  return (
    <g>
      <defs>
        <clipPath id="gcirc"><circle cx={540} cy={750} r={k * 560} /></clipPath>
      </defs>
      <Txt x={540} y={360} text="GEÇİŞLER" size={64} color={ACC} o={ap(t, 0.1)} />
      {cur < 0 ? <rect x={140} y={430} width={800} height={640} rx={40} fill="none" stroke="#cfe6ff" strokeWidth={6} strokeDasharray="24 18" /> : null}
      {prev}
      {curEl}
      <g>
        {labels.map((_, i) => <circle key={i} cx={420 + i * 80} cy={1140} r={16} fill={i <= cur ? ACC : "#cfe6ff55"} />)}
      </g>
    </g>
  );
};

// 5 — Fizik: zıplayan top, sarkaç, yörünge
export const ZIPLA = [0.55, 1.0, 1.32, 1.55, 1.71, 1.82];
const ballY = (tt: number) => {
  if (tt < 0) return 0;
  let prev = 0;
  for (let i = 0; i < ZIPLA.length; i++) {
    const b = ZIPLA[i];
    if (tt < b) {
      const span = b - prev;
      const h = i === 0 ? 1 : Math.pow(0.55, i);
      const u = (tt - prev) / span;
      return i === 0 ? 1 - u * u : h * (1 - Math.pow(2 * u - 1, 2));
    }
    prev = b;
  }
  return 0;
};
const Fizik: S = ({ t, ws }) => {
  const tz = ws("zıplıyor") - 0.3;
  const ts = ws("sallanıyor");
  const to = ws("yörüngede");
  const by = ballY(t - tz);
  const yb = 1080 - by * 520;
  const near = Math.min(...ZIPLA.map((b) => Math.abs(t - tz - b)));
  const squash = near < 0.06 ? 1 - (0.06 - near) * 5 : 1;
  const pk = ap(t, ts - 0.4, 0.4);
  const ang = Math.sin((t - ts) * 4.2) * 0.65 * Math.exp(-Math.max(0, t - ts) * 0.15) * (t > ts ? 1 : 0.0);
  const ok = sp(t, to - 0.3);
  return (
    <g>
      <line x1={60} y1={1130} x2={420} y2={1130} stroke={INK} strokeWidth={8} />
      <g transform={`translate(240 ${t < tz ? 560 : yb}) scale(${(1 / squash) * sp(t, tz - 0.45)} ${squash * sp(t, tz - 0.45)})`}>
        <ellipse cx={0} cy={50} rx={0} ry={0} />
        <circle cx={0} cy={0} r={50} fill={RED} stroke={INK} strokeWidth={7} />
        <path d="M -30 -20 A 36 36 0 0 1 10 -38" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx={240} cy={1135} rx={60 * (0.5 + 0.5 * (1 - by))} ry={10} fill={INK} opacity={0.25} />
      <g opacity={pk}>
        <line x1={600} y1={380} x2={880} y2={380} stroke={INK} strokeWidth={10} />
        <g transform={`rotate(${(ang * 180) / Math.PI} 740 380)`}>
          <line x1={740} y1={380} x2={740} y2={720} stroke={INK} strokeWidth={6} />
          <circle cx={740} cy={740} r={46} fill={ACC} stroke={INK} strokeWidth={7} />
        </g>
      </g>
      <g transform={`translate(760 960) scale(${ok})`} opacity={cl(ok * 1.5)}>
        <ellipse cx={0} cy={0} rx={190} ry={70} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="10 10" />
        <circle r={46} fill="#ffb21a" stroke={INK} strokeWidth={6} />
        {(() => {
          const a = (t - to) * 2.2;
          const px = Math.cos(a) * 190;
          const py = Math.sin(a) * 70;
          const ma = (t - to) * 7;
          return (
            <g>
              <circle cx={px} cy={py} r={24} fill={BLUE} stroke={INK} strokeWidth={5} />
              <circle cx={px + Math.cos(ma) * 46} cy={py + Math.sin(ma) * 20} r={10} fill="#ddd" stroke={INK} strokeWidth={3} />
            </g>
          );
        })()}
      </g>
      <Txt x={240} y={1210} text="yerçekimi" size={40} o={ap(t, tz)} />
      <Txt x={740} y={1210} text="yörünge" size={40} o={ap(t, to)} />
    </g>
  );
};

// 6 — Grafikler: sayaç, çubuklar, halka
const Grafik: S = ({ t, ws }) => {
  const tS = ws("sayılar") - 0.2;
  const tG = ws("grafikler");
  const tV = ws("veriler");
  const n = Math.floor(1000000 * ez((t - tS) / 1.6));
  const bars = [0.45, 0.7, 0.55, 0.9, 1.0];
  const ring = ap(t, tV - 0.2, 1.0);
  return (
    <g>
      <text x={540} y={470} textAnchor="middle" fontSize={130} fontWeight={900} fill={INK} style={{ ...font, fontVariantNumeric: "tabular-nums" }}>
        {n.toLocaleString("tr-TR")}
      </text>
      <line x1={110} y1={1120} x2={640} y2={1120} stroke={INK} strokeWidth={6} />
      {bars.map((h, i) => {
        const k = sp(t, tG - 0.2 + i * 0.12, 12);
        const hh = 460 * h * k;
        return (
          <g key={i}>
            <rect x={140 + i * 100} y={1120 - hh} width={70} height={hh} rx={10} fill={i === 4 ? ACC : GREEN} stroke={INK} strokeWidth={5} />
            {k > 0.9 ? <text x={175 + i * 100} y={1100 - hh} textAnchor="middle" fontSize={34} fontWeight={900} fill={INK} style={font}>{Math.round(h * 100)}</text> : null}
          </g>
        );
      })}
      <g transform="translate(830 870)">
        <circle r={150} fill="none" stroke="#ffffff99" strokeWidth={56} />
        <circle r={150} fill="none" stroke={PINK} strokeWidth={56} pathLength={1} strokeDasharray={`${0.72 * ring} 1`} transform="rotate(-90)" opacity={ring > 0.01 ? 1 : 0} />
        <text x={0} y={22} textAnchor="middle" fontSize={64} fontWeight={900} fill={INK} style={font}>%{Math.round(72 * ring)}</text>
      </g>
    </g>
  );
};

// 7 — Derinlik: paralaks dağlar + dönen 3B küp
const Derinlik: S = ({ t, ws }) => {
  const t3 = ws("üç") - 0.2;
  const layer = (speed: number, y: number, h: number, col: string, seed: number) => {
    let d = `M -200 1300 L -200 ${y}`;
    for (let x = -200; x <= 1400; x += 100) {
      d += ` L ${x} ${y - (Math.sin(x * 0.006 + seed) * 0.5 + 0.5) * h}`;
    }
    d += " L 1400 1300 Z";
    return <path d={d} fill={col} transform={`translate(${-t * speed} 0)`} />;
  };
  const ck = sp(t, t3);
  const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const ay = (t - t3) * 1.4;
  const ax = 0.5 + Math.sin(t) * 0.2;
  const P = V.map(([x, y, z]) => {
    const x1 = x * Math.cos(ay) + z * Math.sin(ay);
    const z1 = -x * Math.sin(ay) + z * Math.cos(ay);
    const y1 = y * Math.cos(ax) - z1 * Math.sin(ax);
    const z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
    const f = 520 / (4 + z2);
    return [540 + x1 * f * 1.3 * ck, 560 + y1 * f * 1.3 * ck];
  });
  return (
    <g>
      <circle cx={820} cy={430} r={80} fill="#fff6d8" opacity={0.9} transform={`translate(${-t * 4} 0)`} />
      {layer(10, 980, 260, "#2f3f6e", 1)}
      {layer(35, 1060, 200, "#24325a", 3)}
      {layer(90, 1140, 140, "#141c36", 5)}
      {ck > 0.01 ? (
        <g>
          <Glow cx={540} cy={560} r={300} id="cube" color={CYAN} o={0.3} />
          {E.map(([a, b], i) => <line key={i} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke={CYAN} strokeWidth={7} strokeLinecap="round" />)}
          {P.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={10} fill="#fff" />)}
          <Tag x={540} y={850} text="3B" size={60} k={sp(t, t3 + 0.3)} bg={CYAN} />
        </g>
      ) : null}
    </g>
  );
};

// 8 — Kamera: sarsıntı, yakınlaşma, spot ışığı
const Kamera: S = ({ t, ws, ev }) => {
  const tHit = ev.vur0 ?? ws("sarsılıyor");
  const tZ = ws("yakınlaşıyor");
  const tL = ws("ışık");
  const fall = cl((t - (tHit - 0.45)) / 0.45);
  const by = t < tHit ? lerp(-260, 980, fall * fall) : 980;
  const zk = ez((t - tZ + 0.1) / 0.5) * (1 - ap(t, tL - 0.2, 0.4));
  const lk = ap(t, tL - 0.1, 0.3);
  const sx = 540 + Math.sin((t - tL) * 2.2) * 260;
  const sy = 700 + Math.cos((t - tL) * 1.7) * 180;
  return (
    <g>
      <defs>
        <mask id="spot">
          <rect x={0} y={0} width={1080} height={1920} fill="#fff" />
          <circle cx={sx} cy={sy} r={150} fill="#000" />
        </mask>
      </defs>
      <g transform={`translate(540 720) scale(${1 + zk * 0.8}) translate(-540 -720)`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={140 + i * 140} y={1060 - (i % 3) * 60} width={100} height={60 + (i % 3) * 60} fill="#1f5e4b" stroke="#7fffc8" strokeWidth={4} />
        ))}
        <g transform={`translate(540 ${by})`}>
          <rect x={-110} y={-110} width={220} height={220} rx={20} fill={RED} stroke="#fff" strokeWidth={8} />
          <text x={0} y={30} textAnchor="middle" fontSize={90} fontWeight={900} fill="#fff" style={font}>!</text>
        </g>
        <g transform="translate(540 720)" opacity={zk}>
          <circle r={70} fill="none" stroke={ACC} strokeWidth={8} />
          <line x1={-100} y1={0} x2={-40} y2={0} stroke={ACC} strokeWidth={8} />
          <line x1={100} y1={0} x2={40} y2={0} stroke={ACC} strokeWidth={8} />
        </g>
        {t > tHit ? <Burst x={540} y={1090} t={t} at={tHit} n={14} r={300} color="#7fffc8" /> : null}
      </g>
      {lk > 0 ? (
        <g>
          <rect x={0} y={0} width={1080} height={1920} fill="#000" opacity={0.78 * lk} mask="url(#spot)" />
          <circle cx={sx} cy={sy} r={150} fill="none" stroke={ACC} strokeWidth={6} opacity={lk} />
          <polygon points={Array.from({ length: 10 }).map((_, i) => { const r = i % 2 ? 22 : 55; const a = -Math.PI / 2 + (i * Math.PI) / 5; return `${sx + Math.cos(a) * r},${sy + Math.sin(a) * r}`; }).join(" ")} fill={ACC} opacity={lk} />
        </g>
      ) : null}
    </g>
  );
};

// 9 — Kinetik yazı
const Yazi: S = ({ t, ws }) => {
  const items: { txt: string; at: number; y: number; size: number; col: string; fx: "sol" | "sag" | "buyu" | "renk" }[] = [
    { txt: "HER", at: ws("her") - 0.1, y: 470, size: 110, col: INK, fx: "sol" },
    { txt: "KELİME", at: ws("kelime") - 0.1, y: 600, size: 130, col: INK, fx: "sag" },
    { txt: "VURGULANIR", at: ws("vurgulanıyor") - 0.1, y: 770, size: 140, col: ACC, fx: "buyu" },
    { txt: "BÜYÜR", at: ws("büyüyüp") - 0.1, y: 930, size: 120, col: GREEN, fx: "buyu" },
    { txt: "RENK DEĞİŞTİRİR", at: ws("renk") - 0.1, y: 1080, size: 92, col: PINK, fx: "renk" },
  ];
  return (
    <g>
      {items.map((it, i) => {
        const k = sp(t, it.at, it.fx === "buyu" ? 7 : 12);
        if (k <= 0.001) return null;
        let tr = "";
        if (it.fx === "sol") tr = `translate(${(1 - k) * -900} 0)`;
        if (it.fx === "sag") tr = `translate(${(1 - k) * 900} 0)`;
        if (it.fx === "buyu") tr = `translate(540 ${it.y}) scale(${k * (1 + 0.06 * Math.sin(t * 6))}) translate(-540 ${-it.y})`;
        if (it.fx === "renk") tr = `translate(540 ${it.y}) scale(${k}) rotate(${Math.sin(t * 3) * 3}) translate(-540 ${-it.y})`;
        const hue = (t * 160) % 360;
        const fill = it.fx === "renk" ? `hsl(${hue},85%,60%)` : it.col;
        return (
          <g key={i} transform={tr}>
            <text x={540} y={it.y} textAnchor="middle" fontSize={it.size} fontWeight={900} fill={fill} stroke={INK} strokeWidth={it.col === INK ? 0 : 10} paintOrder="stroke" style={font}>{it.txt}</text>
          </g>
        );
      })}
    </g>
  );
};

// 10 — Kapanış: özellik simgeleri, takip et butonu, konfeti
const Kapanis: S = ({ t, ws }) => {
  const tT = ws("takip");
  const icons = ["karakter", "çizim", "geçiş", "fizik", "grafik", "3B", "kamera", "ses"];
  const cur = { x: lerp(1000, 560, ez((t - (tT - 0.9)) / 0.7)), y: lerp(1300, 1010, ez((t - (tT - 0.9)) / 0.7)) };
  const clicked = t >= tT;
  const press = clicked && t < tT + 0.12 ? 0.92 : 1;
  const done = sp(t, tT + 0.05);
  return (
    <g>
      {icons.map((s, i) => {
        const k = sp(t, 0.2 + i * 0.13);
        const x = 220 + (i % 4) * 213;
        const y = 470 + Math.floor(i / 4) * 210;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
            <rect x={-90} y={-75} width={180} height={150} rx={30} fill={["#ff8a3d", CYAN, PINK, GREEN, ACC, "#9b7bff", "#7fffc8", "#ff5c5c"][i]} stroke={INK} strokeWidth={6} />
            <text x={0} y={14} textAnchor="middle" fontSize={36} fontWeight={900} fill={INK} style={font}>{s}</text>
          </g>
        );
      })}
      <g transform={`translate(540 1000) scale(${sp(t, tT - 1.2) * press})`}>
        <rect x={-260} y={-70} width={520} height={140} rx={70} fill={clicked ? GREEN : RED} stroke="#fff" strokeWidth={8} />
        <text x={clicked ? 45 : 0} y={22} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" style={font}>{clicked ? "TAKİPTESİN" : "TAKİP ET"}</text>
        {clicked ? <g transform="translate(-200 0) scale(0.42)"><Check cx={0} cy={0} k={done} color="#2a8f55" /></g> : null}
      </g>
      {t > tT - 0.9 && t < tT + 1.2 ? (
        <path d={`M ${cur.x} ${cur.y} l 0 70 l 18 -16 l 14 30 l 14 -7 l -14 -29 l 24 -2 Z`} fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      ) : null}
      {clicked
        ? Array.from({ length: 40 }).map((_, i) => {
          const dt = t - tT;
          const a = (i / 40) * Math.PI * 2;
          const v = 500 + (i % 7) * 60;
          const x = 540 + Math.cos(a) * v * dt;
          const y = 1000 + Math.sin(a) * v * dt + 600 * dt * dt;
          return <rect key={i} x={x} y={y} width={18} height={10} fill={[ACC, PINK, CYAN, GREEN][i % 4]} transform={`rotate(${dt * 500 + i * 40} ${x} ${y})`} opacity={cl(2.5 - dt)} />;
        })
        : null}
      <Kisi x={170} y={1000} s={0.55} t={t} arms="up" mood="happy" color={CHALK} o={ap(t, 0.5)} />
    </g>
  );
};

export const SAHNE: Record<string, S> = {
  acilis: Acilis, karakter: Karakter, cizim: Cizim, gecisler: Gecisler, fizik: Fizik,
  grafik: Grafik, derinlik: Derinlik, kamera: Kamera, yazi: Yazi, kapanis: Kapanis,
};

export const KAPAK: React.FC = () => (
  <g>
    <Glow cx={540} cy={1150} r={520} id="kd" color={CYAN} o={0.3} />
    {"VOLT".split("").map((ch, i) => (
      <text key={i} x={255 + i * 190} y={1230} textAnchor="middle" fontSize={230} fontWeight={900} fill={i === 3 ? ACC : "#fff"} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font} transform={`rotate(${(i - 1.5) * 4} ${255 + i * 190} 1230)`}>{ch}</text>
    ))}
    <Kisi x={540} y={1330} s={0.7} t={0.3} arms="up" mood="happy" color={CHALK} />
  </g>
);
export const KAPAK_YAZI = { ust: "Tek videoda", buyuk: "HER ŞEY!", alt: "Volt sistemi demo" };
