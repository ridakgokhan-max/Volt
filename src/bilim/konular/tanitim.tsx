// KANAL TANITIMI — 30 günlük takvimden konular (ws("kelime") = sahne içindeki saniye)
import React from "react";
import type { SceneProps } from "../BilimVideo";
import {
  ACC, ap, Arrow, BLUE, Check, CHALK, cl, ez, Fingerprint, GREEN, Glow, INK, Kisi, lerp, MAP_EDGES, MAP_IDX, MINUTIAE, Phone, RED, sp, Tag, Txt,
} from "../kit";

type S = React.FC<SceneProps>;
const PINK = "#ff5c8a";
const CYAN = "#5ce1ff";
const SEPIA = "#7a5230";
const font = { fontFamily: "var(--font)" };

// ---------- ortak parçalar ----------
const Burst: React.FC<{ x: number; y: number; t: number; at: number; n?: number; color?: string; r?: number }> = ({ x, y, t, at, n = 18, color = ACC, r = 260 }) => {
  const k = (t - at) / 0.9;
  if (k <= 0 || k >= 1) return null;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + i * 0.37;
        const rr = r * ez(k) * (0.6 + (0.4 * ((i * 7) % 5)) / 5);
        return <line key={i} x1={x + Math.cos(a) * rr * 0.6} y1={y + Math.sin(a) * rr * 0.6} x2={x + Math.cos(a) * rr} y2={y + Math.sin(a) * rr} stroke={i % 3 ? color : "#fff"} strokeWidth={8 * (1 - k)} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Sıralı vinyetler: her biri kendi kelimesinde sağdan kayarak gelir, öncekini sola iter */
const Carousel: React.FC<{ t: number; items: { at: number; el: (tt: number) => React.ReactNode; label: string }[]; color: string; ink?: string }> = ({ t, items, color, ink = INK }) => {
  let cur = -1;
  items.forEach((it, i) => {
    if (t >= it.at - 0.25) cur = i;
  });
  return (
    <g>
      {items.map((it, i) => {
        if (i !== cur && i !== cur - 1) return null;
        const k = ez((t - (items[cur].at - 0.25)) / 0.35);
        const x = i === cur ? (1 - k) * 1100 : -k * 1100;
        if (i === cur - 1 && k >= 1) return null;
        return (
          <g key={i} transform={`translate(${x} 0)`}>
            {it.el(t - it.at)}
            <Tag x={540} y={1120} text={it.label} size={50} k={i === cur ? sp(t, it.at - 0.1) : 1} bg={color} color={ink} />
          </g>
        );
      })}
      <g>{items.map((_, i) => <circle key={i} cx={540 - (items.length - 1) * 30 + i * 60} cy={1200} r={12} fill={i <= cur ? color : "#ffffff66"} stroke={INK} strokeWidth={3} />)}</g>
    </g>
  );
};

const Microwave: React.FC<{ x: number; y: number; t: number; on: number }> = ({ x, y, t, on }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-330} y={-200} width={660} height={400} rx={34} fill="#f3efe6" stroke={INK} strokeWidth={9} />
    <rect x={-295} y={-165} width={445} height={330} rx={20} fill={on > 0 ? `rgb(${lerp(40, 255, on * 0.6)},${lerp(45, 210, on * 0.6)},${lerp(55, 120, on * 0.4)})` : "#2c333f"} stroke={INK} strokeWidth={7} />
    <rect x={185} y={-165} width={110} height={330} rx={14} fill="#d8d2c4" stroke={INK} strokeWidth={6} />
    <circle cx={240} cy={-95} r={26} fill="#fff" stroke={INK} strokeWidth={5} />
    <circle cx={240} cy={-20} r={26} fill="#fff" stroke={INK} strokeWidth={5} />
    <rect x={205} y={50} width={70} height={36} rx={6} fill="#1b2a1b" />
    <text x={240} y={78} textAnchor="middle" fontSize={26} fontWeight={900} fill="#7dff8a" style={font}>{Math.max(0, 60 - Math.floor(t * 4))}</text>
  </g>
);

const Plate: React.FC<{ x: number; y: number; s?: number; food?: string; plate?: string }> = ({ x, y, s = 1, food = "#d9843c", plate = "#fbf7ee" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={160} ry={34} fill={plate} stroke={INK} strokeWidth={7} />
    <path d="M -100 -4 A 100 82 0 0 1 100 -4 Z" fill={food} stroke={INK} strokeWidth={7} />
  </g>
);

const Steam: React.FC<{ x: number; y: number; t: number; color?: string; o?: number }> = ({ x, y, t, color = INK, o = 1 }) => (
  <g opacity={o} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round">
    {[-40, 0, 40].map((dx, i) => {
      let d = "";
      for (let k = 0; k <= 20; k++) {
        const yy = y - k * 6;
        d += (k ? " L " : "M ") + (x + dx + Math.sin(k / 3 + t * 5 + i) * 10) + " " + yy;
      }
      return <path key={i} d={d} />;
    })}
  </g>
);

// ---------- 1 — Mikrodalga sorusu ----------
const Soru1: S = ({ t, ws }) => {
  const tp = ws("tabağı");
  const ty = ws("yemeği");
  const wk = ap(t, 0.3, 0.4);
  return (
    <g>
      <Microwave x={540} y={720} t={t} on={wk} />
      <Plate x={455} y={790} s={0.95} />
      {wk > 0
        ? [0, 1, 2].map((i) => {
          let d = "";
          for (let x = 260; x <= 650; x += 10) d += (x === 260 ? "M " : " L ") + x + " " + (640 + i * 50 + Math.sin(x / 22 - t * 14) * 12);
          return <path key={i} d={d} stroke={CYAN} strokeWidth={5} fill="none" opacity={0.75 * wk} />;
        })
        : null}
      {t > ty ? <Steam x={455} y={730} t={t} color={RED} o={ap(t, ty)} /> : null}
      <Tag x={300} y={420} text="TABAK?" size={54} k={sp(t, tp)} bg="#cfe6ff" rot={-6} />
      <Tag x={780} y={420} text="YEMEK!" size={54} k={sp(t, ty)} bg={ACC} rot={5} />
      <Kisi x={150} y={930} s={0.7} mood={t > ty ? "surprised" : "neutral"} arms="chin" t={t} />
    </g>
  );
};

// ---------- 2 — Parmak izi sorusu ----------
const Soru2: S = ({ t, ws }) => {
  const tt = ws("tanır");
  const scan = ((t * 0.9) % 1);
  const mk = ap(t, tt - 0.2, 0.6);
  const P = MAP_IDX.map((i) => [540 + MINUTIAE[i][0] * 0.62, 720 + MINUTIAE[i][1] * 0.62]);
  return (
    <g>
      <Glow cx={540} cy={720} r={420} id="s2g" color="#6fb6ff" o={0.35} />
      <Phone cx={540} cy={720} s={1.05} screen="#16233d" color="#9cc7ff" />
      <Fingerprint cx={540} cy={720} s={0.62} color="#9cc7ff" sw={8} o={1 - mk * 0.75} />
      <rect x={400} y={500 + scan * 440} width={280} height={8} rx={4} fill={CYAN} opacity={0.8 * (1 - mk)} />
      {MAP_EDGES.map(([a, b], i) => <line key={i} x1={P[a][0]} y1={P[a][1]} x2={lerp(P[a][0], P[b][0], mk)} y2={lerp(P[a][1], P[b][1], mk)} stroke={ACC} strokeWidth={5} opacity={mk > 0.01 ? 1 : 0} />)}
      {P.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill="#fff8dc" opacity={mk} />)}
    </g>
  );
};

// ---------- 3 — Gökyüzü sorusu ----------
const Soru3: S = ({ t, ws }) => {
  const tm = ws("mavidir");
  const ray = ap(t, 0.2, 0.6);
  const sc = ap(t, tm - 0.4, 0.5);
  const cols = [RED, "#ff9d2e", ACC, GREEN, BLUE, "#6a4bd8"];
  return (
    <g>
      <circle cx={180} cy={430} r={90} fill="#ffe27a" stroke="#ffb21a" strokeWidth={10} />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + t * 0.5;
        return <line key={i} x1={180 + Math.cos(a) * 110} y1={430 + Math.sin(a) * 110} x2={180 + Math.cos(a) * 150} y2={430 + Math.sin(a) * 150} stroke="#ffb21a" strokeWidth={8} strokeLinecap="round" />;
      })}
      <line x1={260} y1={500} x2={lerp(260, 560, ray)} y2={lerp(500, 760, ray)} stroke="#fff" strokeWidth={16} strokeLinecap="round" />
      {ray >= 1
        ? cols.map((c, i) => <line key={i} x1={560} y1={760} x2={560 + Math.cos(0.7 + i * 0.05) * 380} y2={760 + Math.sin(0.7 + i * 0.05) * 380} stroke={c} strokeWidth={10} opacity={0.9} />)
        : null}
      <circle cx={560} cy={760} r={22} fill="#fff" stroke={INK} strokeWidth={4} opacity={ray} />
      {sc > 0
        ? Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const r = 60 + ((t * 220 + i * 20) % 260);
          return <Arrow key={i} x0={560 + Math.cos(a) * r} y0={760 + Math.sin(a) * r} x1={560 + Math.cos(a) * (r + 40)} y1={760 + Math.sin(a) * (r + 40)} color={BLUE} sw={7} k={sc} />;
        })
        : null}
      <Tag x={760} y={420} text="MAVİ?" size={60} k={sp(t, tm)} bg={CYAN} />
      <Kisi x={860} y={900} s={0.7} mood="surprised" arms="point" t={t} flip />
    </g>
  );
};

// ---------- 4 — Logo ----------
const Logo: S = ({ t, ws }) => {
  const th = ws("hoş");
  const words = ["BİR", "DAKİKADA", "BİLİM"];
  const sweep = cl((t - 0.2) / 2.2);
  return (
    <g>
      <Glow cx={540} cy={700} r={520} id="lg" color="#6fb6ff" o={0.35 + 0.1 * Math.sin(t * 4)} />
      <g transform="translate(540 520)">
        <circle r={150} fill="#16233d" stroke="#fff" strokeWidth={12} />
        <path d={`M 0 0 L 0 -130 A 130 130 0 ${sweep > 0.5 ? 1 : 0} 1 ${Math.sin(sweep * Math.PI * 2) * 130} ${-Math.cos(sweep * Math.PI * 2) * 130} Z`} fill={ACC} />
        <line x1={0} y1={0} x2={Math.sin(sweep * Math.PI * 2) * 118} y2={-Math.cos(sweep * Math.PI * 2) * 118} stroke="#fff" strokeWidth={12} strokeLinecap="round" />
        <rect x={-26} y={-200} width={52} height={40} rx={8} fill="#fff" />
        <text x={0} y={60} textAnchor="middle" fontSize={60} fontWeight={900} fill="#fff" style={font}>1 dk</text>
      </g>
      {words.map((w, i) => {
        const k = sp(t, 0.1 + i * 0.22, 9);
        return (
          <g key={i} transform={`translate(540 ${800 + i * 120}) scale(${k}) rotate(${(1 - cl(k)) * (i % 2 ? 20 : -20)})`}>
            <text x={0} y={0} textAnchor="middle" fontSize={i === 2 ? 150 : 110} fontWeight={900} fill={i === 2 ? ACC : "#fff"} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>{w}</text>
          </g>
        );
      })}
      <Burst x={540} y={520} t={t} at={th} n={26} r={460} />
    </g>
  );
};

// ---------- 5 — Her gün yeni bir şey ----------
const Hergun: S = ({ t, ws }) => {
  const ty = ws("yeni");
  const day = 1 + Math.floor(29 * ez(t / 3.2));
  const flip = (t * 9) % 1;
  const lit = ap(t, ty, 0.3);
  const x = lerp(-100, 300, ez(t / 2.4));
  return (
    <g>
      <g transform="translate(720 640)">
        <rect x={-190} y={-200} width={380} height={400} rx={30} fill="#fff" stroke={INK} strokeWidth={8} />
        <rect x={-190} y={-200} width={380} height={100} rx={30} fill={RED} stroke={INK} strokeWidth={8} />
        <text x={0} y={-130} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff" style={font}>GÜN</text>
        <g transform={`scale(1 ${t < 3.2 ? 0.75 + 0.25 * Math.abs(Math.cos(flip * Math.PI)) : 1})`}>
          <text x={0} y={110} textAnchor="middle" fontSize={210} fontWeight={900} fill={INK} style={{ ...font, fontVariantNumeric: "tabular-nums" }}>{day}</text>
        </g>
      </g>
      <Kisi x={x} y={830} s={0.95} t={t} walk={t < 2.4 ? 1 : 0} mood={lit > 0.5 ? "happy" : "neutral"} arms={lit > 0.5 ? "up" : "down"} />
      <g transform={`translate(${x} 640)`}>
        {lit > 0 ? <Glow cx={0} cy={0} r={170} id="hb" color="#fff2a8" o={0.8 * lit} /> : null}
        <path d="M 0 60 C -60 60 -70 0 -50 -30 C -35 -55 -35 -70 -35 -85 L 35 -85 C 35 -70 35 -55 50 -30 C 70 0 60 60 0 60 Z" transform="translate(0 -40) scale(0.9)" fill={lit > 0 ? ACC : "#fff"} stroke={INK} strokeWidth={6} />
        <rect x={-22} y={24} width={44} height={26} rx={6} fill="#bbb" stroke={INK} strokeWidth={5} />
      </g>
    </g>
  );
};

// ---------- vinyetler ----------
const Ucak = (tt: number) => (
  <g transform={`translate(${540 + Math.sin(tt * 2) * 20} ${700 - tt * 30})`}>
    {[0, 1, 2, 3].map((i) => {
      const y = -120 + i * 70;
      const off = ((tt * 600 + i * 120) % 900) - 450;
      return <path key={i} d={`M ${off - 140} ${y} q 140 ${-40 + i * 6} 280 0`} stroke={CYAN} strokeWidth={5} fill="none" opacity={0.8} />;
    })}
    <path d="M -260 20 L 200 0 Q 260 0 260 30 L -200 50 Z" fill="#fff" stroke={INK} strokeWidth={7} />
    <path d="M -40 20 L 40 -120 L 90 -120 L 60 25 Z" fill="#dbe7f2" stroke={INK} strokeWidth={6} />
    <path d="M -240 20 L -270 -60 L -220 -60 L -190 18 Z" fill={RED} stroke={INK} strokeWidth={6} />
    <Arrow x0={30} y0={-150} x1={30} y1={-290} color={GREEN} sw={12} k={ap(tt, 0.3, 0.4)} />
    <Txt x={30} y={-310} text="kaldırma" size={40} color="#1f7a44" o={ap(tt, 0.5)} />
  </g>
);
const Buzdolabi = (tt: number) => (
  <g transform="translate(540 700)">
    <rect x={-170} y={-300} width={340} height={600} rx={30} fill="#f4f8fb" stroke={INK} strokeWidth={8} />
    <line x1={-170} y1={-80} x2={170} y2={-80} stroke={INK} strokeWidth={7} />
    <rect x={120} y={-230} width={18} height={110} rx={8} fill={INK} />
    <rect x={120} y={-20} width={18} height={150} rx={8} fill={INK} />
    {[0, 1, 2].map((i) => {
      const y = -200 + i * 170;
      let d = "";
      for (let k = 0; k <= 14; k++) d += (k ? " L " : "M ") + (190 + k * 12) + " " + (y + Math.sin(k / 1.5 - tt * 8) * 12);
      return <path key={i} d={d} stroke={RED} strokeWidth={7} fill="none" opacity={ap(tt, 0.1 + i * 0.15)} />;
    })}
    <g transform={`rotate(${tt * 40} -20 120)`}>{[0, 60, 120].map((a) => <line key={a} x1={-20 - Math.cos((a * Math.PI) / 180) * 60} y1={120 - Math.sin((a * Math.PI) / 180) * 60} x2={-20 + Math.cos((a * Math.PI) / 180) * 60} y2={120 + Math.sin((a * Math.PI) / 180) * 60} stroke={BLUE} strokeWidth={9} strokeLinecap="round" />)}</g>
    <Txt x={250} y={-260} text="ısı dışarı" size={36} color={RED} o={ap(tt, 0.3)} />
  </g>
);
const Kar = (tt: number) => {
  const dk = ap(tt, 0, 1.0);
  return (
    <g transform={`translate(540 700) rotate(${tt * 25})`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`rotate(${i * 60})`} stroke="#1d5a9a" strokeWidth={14} strokeLinecap="round" fill="none">
          <path d="M 0 0 L 0 -260 M 0 -150 L -60 -210 M 0 -150 L 60 -210 M 0 -80 L -40 -120 M 0 -80 L 40 -120" pathLength={1} strokeDasharray={`${dk} 1`} opacity={dk > 0.01 ? 1 : 0} />
        </g>
      ))}
      <circle r={30} fill="#fff" stroke="#1d5a9a" strokeWidth={8} />
    </g>
  );
};
const Gps = (tt: number) => {
  const sats = [0, 2.1, 4.2].map((a) => [540 + Math.cos(a + tt * 0.6) * 330, 700 + Math.sin(a + tt * 0.6) * 330]);
  const pin = [560, 640];
  return (
    <g>
      <circle cx={540} cy={700} r={200} fill="#1d5a9a" stroke={CYAN} strokeWidth={6} />
      <path d="M 420 620 q 60 -60 120 -20 q 40 40 -10 80 q -60 30 -110 -60 Z M 580 720 q 50 -20 70 40 q -40 60 -90 20 Z" fill={GREEN} opacity={0.9} />
      {sats.map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={pin[0]} y2={pin[1]} stroke={ACC} strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={-tt * 60} />
          <rect x={x - 26} y={y - 16} width={52} height={32} fill="#ddd" stroke="#fff" strokeWidth={3} />
          <rect x={x - 70} y={y - 8} width={36} height={16} fill={BLUE} />
          <rect x={x + 34} y={y - 8} width={36} height={16} fill={BLUE} />
        </g>
      ))}
      <path d={`M ${pin[0]} ${pin[1]} c -30 -40 -30 -80 0 -80 c 30 0 30 40 0 80 Z`} fill={RED} stroke="#fff" strokeWidth={4} transform={`translate(0 ${-Math.abs(Math.sin(tt * 5)) * 10})`} />
    </g>
  );
};
const QRBITS = Array.from({ length: 441 }).map((_, i) => (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1 > 0.0 ? ((Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1 > 0.45 ? 1 : 0) : 0);
const Karekod = (tt: number) => {
  const N = 21;
  const cs = 26;
  const ox = 540 - (N * cs) / 2;
  const oy = 700 - (N * cs) / 2;
  const finder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  return (
    <g>
      <rect x={ox - 30} y={oy - 30} width={N * cs + 60} height={N * cs + 60} rx={20} fill="#fff" />
      {Array.from({ length: N * N }).map((_, i) => {
        const r = Math.floor(i / N);
        const c = i % N;
        let on = QRBITS[i] === 1;
        if (finder(r, c)) {
          const rr = r < 7 ? r : r - (N - 7);
          const cc = c < 7 ? c : c - (N - 7);
          on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
        } else if (r === 7 || c === 7 || r === N - 8 || c === N - 8) on = false;
        const k = cl((tt * 2.2 - (r + c) / (2 * N)) * 3);
        return on && k > 0 ? <rect key={i} x={ox + c * cs + (cs * (1 - k)) / 2} y={oy + r * cs + (cs * (1 - k)) / 2} width={cs * k} height={cs * k} fill={INK} /> : null;
      })}
      <rect x={ox - 30} y={oy - 30 + ((tt * 0.8) % 1) * (N * cs + 60)} width={N * cs + 60} height={6} fill={RED} opacity={0.7} />
    </g>
  );
};
const Kablosuz = (tt: number) => {
  const bat = cl(tt / 1.3);
  return (
    <g>
      <ellipse cx={540} cy={900} rx={240} ry={50} fill="#2b3442" stroke={CYAN} strokeWidth={6} />
      {[0, 1, 2].map((i) => {
        const r = ((tt * 90 + i * 40) % 120) + 20;
        return <ellipse key={i} cx={540} cy={880} rx={r * 1.8} ry={r * 0.4} fill="none" stroke={CYAN} strokeWidth={5} opacity={1 - r / 140} />;
      })}
      <Phone cx={540} cy={640} s={0.62} screen="#16233d" color="#9cc7ff">
        <rect x={-60} y={-40} width={120} height={70} rx={10} fill="none" stroke="#fff" strokeWidth={6} />
        <rect x={60} y={-15} width={12} height={20} fill="#fff" />
        <rect x={-52} y={-32} width={104 * bat} height={54} rx={6} fill={GREEN} />
        <text x={0} y={110} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff" style={font}>%{Math.round(bat * 100)}</text>
      </Phone>
    </g>
  );
};
const YapayZeka = (tt: number) => {
  const L = [[0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2]];
  const pos = (l: number, i: number) => [300 + l * 240, 700 + (i - (L[l].length - 1) / 2) * 120];
  const edges: [number, number, number, number][] = [];
  for (let l = 0; l < 2; l++) for (const a of L[l]) for (const b of L[l + 1]) edges.push([l, a, l + 1, b]);
  return (
    <g>
      {edges.map(([l1, a, l2, b], i) => {
        const [x1, y1] = pos(l1, a);
        const [x2, y2] = pos(l2, b);
        const p = (tt * 1.4 + i * 0.13) % 1;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={CYAN} strokeOpacity={0.35} strokeWidth={3} />
            <circle cx={lerp(x1, x2, p)} cy={lerp(y1, y2, p)} r={6} fill={ACC} />
          </g>
        );
      })}
      {L.map((ns, l) => ns.map((i) => {
        const [x, y] = pos(l, i);
        const on = Math.sin(tt * 6 + i + l * 2) > 0.2;
        return <circle key={`${l}-${i}`} cx={x} cy={y} r={30} fill={on ? ACC : "#16233d"} stroke={CYAN} strokeWidth={5} />;
      }))}
    </g>
  );
};
const Fermuar = (tt: number) => {
  const z = cl(tt / 1.4);
  const sy = lerp(420, 1000, z);
  return (
    <g>
      <rect x={300} y={400} width={200} height={620} fill="#c98f5b" stroke={SEPIA} strokeWidth={6} />
      <rect x={580} y={400} width={200} height={620} fill="#c98f5b" stroke={SEPIA} strokeWidth={6} />
      {Array.from({ length: 22 }).map((_, i) => {
        const y = 420 + i * 27;
        const closed = y < sy;
        const off = closed ? 0 : Math.min(60, (y - sy) * 0.35);
        return (
          <g key={i}>
            <rect x={500 - off + (i % 2 ? 0 : 0)} y={y} width={44} height={14} rx={4} fill="#d8c08a" stroke={SEPIA} strokeWidth={3} transform={`translate(${i % 2 ? 0 : -4} 0)`} />
            <rect x={536 + off} y={y + 13} width={44} height={14} rx={4} fill="#d8c08a" stroke={SEPIA} strokeWidth={3} />
          </g>
        );
      })}
      <rect x={505} y={sy - 30} width={70} height={60} rx={12} fill="#b9a06a" stroke={SEPIA} strokeWidth={6} />
      <rect x={525} y={sy + 25} width={30} height={70} rx={10} fill="#b9a06a" stroke={SEPIA} strokeWidth={6} />
    </g>
  );
};
const Barkod = (tt: number) => {
  const widths = [6, 3, 9, 3, 3, 12, 6, 3, 9, 6, 3, 3, 12, 3, 6, 9, 3, 6, 3, 12, 6, 3];
  let x = 330;
  return (
    <g>
      <rect x={260} y={480} width={560} height={460} rx={20} fill="#e8d3a8" stroke={SEPIA} strokeWidth={6} />
      {widths.map((w, i) => {
        const k = cl((tt * 1.6 - i / widths.length) * 4);
        const el = <rect key={i} x={x} y={540} width={w * 1.6} height={300 * k} fill={SEPIA} opacity={0.9} />;
        x += w * 1.6 + 6;
        return el;
      })}
      <Txt x={540} y={905} text="1949" size={44} color={SEPIA} o={ap(tt, 0.8)} />
    </g>
  );
};
const Not = (tt: number) => {
  const k = sp(tt, 0, 6);
  const rot = (1 - cl(k)) * 30 + Math.sin(tt * 3) * 2 * Math.exp(-tt);
  return (
    <g>
      <rect x={220} y={420} width={640} height={620} fill="#efe2c6" stroke={SEPIA} strokeWidth={6} />
      <g transform={`translate(540 ${lerp(200, 700, cl(k))}) rotate(${rot - 4})`}>
        <rect x={-180} y={-180} width={360} height={360} fill="#ffe56a" stroke={SEPIA} strokeWidth={6} />
        <rect x={-180} y={-180} width={360} height={60} fill="#ffd84a" />
        {[0, 1, 2].map((i) => <line key={i} x1={-130} y1={-40 + i * 60} x2={110 - i * 40} y2={-40 + i * 60} stroke={SEPIA} strokeWidth={8} strokeLinecap="round" opacity={ap(tt, 0.6 + i * 0.15)} />)}
      </g>
    </g>
  );
};
const LimonPil = (tt: number) => {
  const on = ap(tt, 0.6, 0.3);
  return (
    <g>
      {[380, 700].map((x, i) => (
        <g key={i} transform={`translate(${x} 860)`}>
          <ellipse rx={150} ry={110} fill="#ffe14d" stroke={CHALK} strokeWidth={7} />
          <rect x={-60} y={-170} width={18} height={120} fill="#d4823c" />
          <rect x={40} y={-170} width={18} height={120} fill="#b7c0c7" />
        </g>
      ))}
      <path d="M 498 690 Q 540 640 589 690" stroke={CHALK} strokeWidth={6} fill="none" />
      <path d="M 329 690 Q 300 520 480 470" stroke={CHALK} strokeWidth={6} fill="none" />
      <path d="M 758 690 Q 790 520 600 470" stroke={CHALK} strokeWidth={6} fill="none" />
      {on > 0 ? <Glow cx={540} cy={430} r={180} id="led" color="#ff6b6b" o={on} /> : null}
      <path d="M 500 470 L 500 400 A 40 40 0 0 1 580 400 L 580 470 Z" fill={on > 0.5 ? "#ff4d4d" : "#7a2a2a"} stroke={CHALK} strokeWidth={6} />
    </g>
  );
};
const Pusula = (tt: number) => {
  const ang = 120 * Math.exp(-tt * 1.6) * Math.cos(tt * 5);
  return (
    <g>
      <ellipse cx={540} cy={760} rx={300} ry={110} fill="#2e6f8f" stroke={CHALK} strokeWidth={7} />
      <ellipse cx={540} cy={740} rx={280} ry={90} fill="#4aa3c8" opacity={0.8} />
      <g transform={`translate(540 740) rotate(${ang}) scale(1 0.4)`}>
        <ellipse rx={150} ry={70} fill="#3fae6a" stroke={CHALK} strokeWidth={5} />
        <path d="M 0 -170 L 18 0 L 0 170 L -18 0 Z" fill="#ccc" stroke={CHALK} strokeWidth={4} />
        <path d="M 0 -170 L 18 0 L -18 0 Z" fill={RED} />
      </g>
      <Txt x={540} y={520} text="K" size={80} color={RED} o={ap(tt, 1.0)} />
      <Arrow x0={540} y0={560} x1={540} y1={600} color={RED} k={ap(tt, 1.0)} />
    </g>
  );
};
const Kamera = (tt: number) => (
  <g>
    <path d={`M 540 610 L 180 1000 L 900 1000 Z`} fill={CHALK} opacity={0.12} />
    <Phone cx={540} cy={560} s={0.5} screen="#222" color={CHALK}>
      <circle cx={0} cy={-210} r={40} fill="#111" stroke="#9cc7ff" strokeWidth={8} />
      <circle cx={-80} cy={-240} r={20} fill={RED} opacity={Math.floor(tt * 2.5) % 2 ? 1 : 0.2} />
      <text x={0} y={30} textAnchor="middle" fontSize={70} fontWeight={900} fill={RED} style={font} opacity={Math.floor(tt * 2.5) % 2 ? 1 : 0.3}>REC</text>
    </Phone>
  </g>
);

// ---------- 6-9 — Kategoriler ----------
const KatBaslik: React.FC<{ t: number; text: string; bg: string; ink?: string }> = ({ t, text, bg, ink = INK }) => (
  <Tag x={540} y={360} text={text} size={70} k={sp(t, 0.05, 9)} bg={bg} color={ink} />
);
const Bilim: S = ({ t, ws }) => (
  <g>
    <KatBaslik t={t} text="BİLİM" bg={ACC} />
    <Carousel t={t} color={ACC} items={[
      { at: ws("uçaklar"), el: Ucak, label: "Uçak nasıl uçar?" },
      { at: ws("buzdolabı"), el: Buzdolabi, label: "Buzdolabı nasıl soğutur?" },
      { at: ws("kar"), el: Kar, label: "Kar neden altıgen?" },
    ]} />
  </g>
);
const Teknoloji: S = ({ t, ws }) => (
  <g>
    <KatBaslik t={t} text="TEKNOLOJİ" bg={CYAN} />
    <Carousel t={t} color={CYAN} items={[
      { at: ws("gps"), el: Gps, label: "GPS" },
      { at: ws("kare"), el: Karekod, label: "Karekod" },
      { at: ws("kablosuz"), el: Kablosuz, label: "Kablosuz şarj" },
      { at: ws("yapay"), el: YapayZeka, label: "Yapay zekâ" },
    ]} />
  </g>
);
const Tarih: S = ({ t, ws }) => (
  <g>
    <rect x={0} y={-40} width={1080} height={1960} fill="#7a5230" opacity={0.12} />
    <KatBaslik t={t} text="TARİH" bg="#e8c48a" />
    <Carousel t={t} color="#e8c48a" items={[
      { at: ws("fermuar"), el: Fermuar, label: "Fermuar" },
      { at: ws("barkod"), el: Barkod, label: "Barkod" },
      { at: ws("yapışkan"), el: Not, label: "Yapışkan not" },
    ]} />
  </g>
);
const Diy: S = ({ t, ws }) => (
  <g>
    <KatBaslik t={t} text="KENDİN YAP" bg={GREEN} ink="#fff" />
    <Carousel t={t} color={GREEN} ink="#fff" items={[
      { at: ws("limon"), el: LimonPil, label: "Limondan pil" },
      { at: ws("iğne"), el: Pusula, label: "İğneden pusula" },
      { at: ws("eski"), el: Kamera, label: "Telefondan kamera" },
    ]} />
  </g>
);

// ---------- 10 — Altı hafta, otuz konu, bir dakika ----------
const Rakam: S = ({ t, ws }) => {
  const a = ws("altı");
  const o = ws("otuz");
  const d = ws("dakika");
  const n30 = Math.round(30 * ez((t - o) / 1.0));
  return (
    <g>
      <g transform={`translate(540 470) scale(${sp(t, a - 0.1)})`}>
        <text x={-40} y={40} textAnchor="end" fontSize={150} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={10} paintOrder="stroke" style={font}>6</text>
        <text x={-10} y={30} fontSize={80} fontWeight={900} fill="#fff" style={font}>HAFTA</text>
      </g>
      <g opacity={ap(t, o - 0.2)}>
        <text x={240} y={690} textAnchor="middle" fontSize={130} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={10} paintOrder="stroke" style={{ ...font, fontVariantNumeric: "tabular-nums" }}>{n30}</text>
        <text x={240} y={760} textAnchor="middle" fontSize={56} fontWeight={900} fill="#fff" style={font}>KONU</text>
        {Array.from({ length: 30 }).map((_, i) => {
          const k = cl((t - o) * 3 - i * 0.1);
          const cols = [ACC, CYAN, "#e8c48a", GREEN];
          return <rect key={i} x={420 + (i % 6) * 95} y={580 + Math.floor(i / 6) * 70} width={80 * k} height={56} rx={10} fill={cols[i % 4]} stroke={INK} strokeWidth={4} opacity={k > 0 ? 1 : 0} />;
        })}
      </g>
      <g transform={`translate(540 1080) scale(${sp(t, d - 0.2)})`}>
        <circle cx={-150} cy={-25} r={60} fill="#16233d" stroke="#fff" strokeWidth={8} />
        <line x1={-150} y1={-25} x2={-150 + Math.sin(t * 6) * 45} y2={-25 - Math.cos(t * 6) * 45} stroke={ACC} strokeWidth={8} strokeLinecap="round" />
        <text x={-60} y={0} fontSize={84} fontWeight={900} fill="#fff" style={font}>1 DAKİKA</text>
      </g>
    </g>
  );
};

// ---------- 11 — Takip et ----------
const Kapanis: S = ({ t, ws }) => {
  const tT = ws("takip");
  const tY = ws("yarın");
  const cur = { x: lerp(1000, 560, ez((t - (tT - 0.8)) / 0.6)), y: lerp(1300, 760, ez((t - (tT - 0.8)) / 0.6)) };
  const clicked = t >= tT;
  const press = clicked && t < tT + 0.12 ? 0.92 : 1;
  return (
    <g>
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 140 + i * 135;
        const y = 1100 - ((t * (60 + i * 12) + i * 140) % 700);
        return <text key={i} x={x} y={y} textAnchor="middle" fontSize={70 + (i % 3) * 20} fontWeight={900} fill={[ACC, CYAN, PINK, GREEN][i % 4]} opacity={0.7 * ap(t, tY - 0.3)} style={font}>?</text>;
      })}
      <g transform={`translate(540 740) scale(${sp(t, 0.1) * press})`}>
        <rect x={-280} y={-80} width={560} height={160} rx={80} fill={clicked ? GREEN : RED} stroke="#fff" strokeWidth={9} />
        <text x={clicked ? 45 : 0} y={26} textAnchor="middle" fontSize={72} fontWeight={900} fill="#fff" style={font}>{clicked ? "TAKİPTESİN" : "TAKİP ET"}</text>
        {clicked ? <g transform="translate(-205 0) scale(0.45)"><Check cx={0} cy={0} k={ap(t, tT, 0.35)} color="#2a8f55" /></g> : null}
      </g>
      {t > tT - 0.8 && t < tT + 1.0 ? <path d={`M ${cur.x} ${cur.y} l 0 70 l 18 -16 l 14 30 l 14 -7 l -14 -29 l 24 -2 Z`} fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" /> : null}
      {clicked
        ? Array.from({ length: 44 }).map((_, i) => {
          const dt = t - tT;
          const a = (i / 44) * Math.PI * 2;
          const v = 520 + (i % 7) * 60;
          const x = 540 + Math.cos(a) * v * dt;
          const y = 740 + Math.sin(a) * v * dt + 650 * dt * dt;
          return <rect key={i} x={x} y={y} width={20} height={11} fill={[ACC, PINK, CYAN, GREEN][i % 4]} transform={`rotate(${dt * 500 + i * 40} ${x} ${y})`} opacity={cl(2.5 - dt)} />;
        })
        : null}
      <Kisi x={540} y={880} s={0.75} t={t} arms="up" mood="happy" color={CHALK} o={ap(t, 0.3)} />
      <Tag x={540} y={420} text="YARIN YENİ BİR SORU" size={50} k={sp(t, tY)} bg={ACC} />
    </g>
  );
};

export const SAHNE: Record<string, S> = {
  soru1: Soru1, soru2: Soru2, soru3: Soru3, logo: Logo, hergun: Hergun, bilim: Bilim, teknoloji: Teknoloji, tarih: Tarih, diy: Diy, rakam: Rakam, kapanis: Kapanis,
};

export const KAPAK: React.FC = () => (
  <g>
    <Glow cx={540} cy={1180} r={560} id="kt" color="#6fb6ff" o={0.35} />
    <g transform="translate(540 1170)">
      <circle r={190} fill="#16233d" stroke="#fff" strokeWidth={14} />
      <path d="M 0 0 L 0 -165 A 165 165 0 0 1 143 82 Z" fill={ACC} />
      <line x1={0} y1={0} x2={143} y2={82} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
      <rect x={-32} y={-250} width={64} height={48} rx={10} fill="#fff" />
      <text x={0} y={80} textAnchor="middle" fontSize={76} fontWeight={900} fill="#fff" style={font}>1 dk</text>
    </g>
    {[["BİLİM", ACC, 200, 920, -8], ["TEKNOLOJİ", CYAN, 880, 960, 7], ["TARİH", "#e8c48a", 190, 1420, 6], ["KENDİN YAP", GREEN, 870, 1440, -6]].map(([txt, c, x, y, r], i) => (
      <Tag key={i} x={x as number} y={y as number} text={txt as string} size={44} bg={c as string} rot={r as number} />
    ))}
  </g>
);
export const KAPAK_YAZI = { ust: "Her gün 1 dakikada", buyuk: "YENİ BİLGİ", alt: "30 konu · 6 hafta" };
