// Konu: Telefon parmak izini nasıl tanır?  (w(i) = i. kelimenin sahne içindeki saniyesi)
import React from "react";
import type { SceneProps } from "../BilimVideo";
import {
  ACC, ap, Arrow, BLUE, Check, CHALK, cl, Cross, ez, Fingerprint, GREEN, Glow, INK, Kisi, lerp, Lock,
  MAP_EDGES, MAP_IDX, MINUTIAE, Phone, RED, sp, Tag, Txt,
} from "../kit";

type S = React.FC<SceneProps>;

// 1 — Milyonlarca parmak arasından seninkini
const Giris: S = ({ t, w }) => {
  const swirl = ap(t, w(1) - 0.2, 0.6);
  const pick = ap(t, w(4), 0.7);
  const ph = sp(t, 0.05);
  return (
    <g>
      <Glow cx={540} cy={700} r={420} id="g1" color="#6fb6ff" o={0.35} />
      {Array.from({ length: 26 }).map((_, i) => {
        const a = i * 2.39996 + t * (0.5 + (i % 3) * 0.15);
        const r = 250 + (i % 5) * 55 + Math.sin(t * 2 + i) * 12;
        const x = 540 + Math.cos(a) * r * 1.05;
        const y = 700 + Math.sin(a) * r * 1.15;
        const mine = i === 7;
        const tx = mine ? lerp(x, 540, pick) : x;
        const ty = mine ? lerp(y, 690, pick) : y;
        const s = mine ? lerp(0.16, 0.42, pick) : 0.16;
        return (
          <g key={i} opacity={mine ? 1 : swirl * (1 - pick * 0.7)}>
            <Fingerprint cx={tx} cy={ty} s={s * swirl + (mine ? 0 : 0)} color={mine && pick > 0 ? ACC : "#cfe6ff"} sw={mine ? 10 : 8} />
          </g>
        );
      })}
      <g transform={`translate(0 ${(1 - ph) * 300})`} opacity={cl(ph * 1.5)}>
        <Phone cx={540} cy={720} s={0.95} screen="#16233d" color="#9cc7ff">
          <circle cx={0} cy={-20} r={95} fill="none" stroke="#6fb6ff" strokeWidth={6} opacity={0.5 + 0.5 * Math.sin(t * 5)} />
          <Txt x={0} y={180} text="?" size={110} color="#9cc7ff" o={1 - pick} />
        </Phone>
      </g>
      <Kisi x={170} y={880} s={0.85} mood="surprised" arms="up" t={t} color={CHALK} o={ap(t, 0.6)} />
      <Tag x={540} y={1130} text={"MİLYONLARCA PARMAK"} size={44} k={sp(t, w(1)) * (1 - ap(t, w(4), 0.3))} />
      <Tag x={540} y={1130} text={"SENİNKİ!"} size={52} k={sp(t, w(4) + 0.1)} bg={ACC} />
    </g>
  );
};

// 2 — Parmak izinin fotoğrafını saklamıyor
const Foto: S = ({ t, w }) => {
  const k = sp(t, 0.1);
  const x = ap(t, w(13), 0.5);
  const stamp = sp(t, w(14), 9);
  return (
    <g>
      <g transform={`translate(560 720) rotate(${-6 + Math.sin(t * 1.5) * 2}) scale(${k})`}>
        <rect x={-230} y={-280} width={460} height={540} rx={12} fill="#fbf7ee" stroke={INK} strokeWidth={8} />
        <rect x={-195} y={-245} width={390} height={390} fill="#e8dcc2" stroke={INK} strokeWidth={4} />
        <Fingerprint cx={0} cy={-50} s={0.62} color={INK} sw={10} />
        <Txt x={0} y={225} text="parmak_izi.jpg" size={38} weight={700} />
      </g>
      <Cross cx={560} cy={700} r={260} k={x} />
      <g transform={`translate(560 1100) rotate(-8) scale(${stamp})`} opacity={cl(stamp * 1.5)}>
        <rect x={-260} y={-62} width={520} height={124} rx={16} fill="none" stroke={RED} strokeWidth={10} />
        <Txt x={0} y={26} text="SAKLANMAZ" size={84} color={RED} />
      </g>
      <Kisi x={170} y={900} s={0.8} mood={t > w(14) ? "surprised" : "serious"} arms="chin" t={t} />
    </g>
  );
};

// 3 — Çıkıntılar, oluklar ve sensör
const Yakin: S = ({ t, w }) => {
  const zoom = ap(t, w(16) - 0.2, 0.8);
  const c1 = sp(t, w(17));
  const c2 = sp(t, w(19));
  const sens = ap(t, w(21) - 0.1, 0.4);
  const scan = ((t - w(21)) * 1.3) % 1;
  const wave = (x: number) => 780 + Math.sin((x - 90) / 62) * 55;
  let d = "M 90 1000 L 90 " + wave(90);
  for (let x = 90; x <= 990; x += 10) d += ` L ${x} ${wave(x)}`;
  d += " L 990 1000 Z";
  return (
    <g>
      {/* parmak ucu */}
      <g opacity={1 - zoom} transform={`translate(540 760) scale(${1 + zoom * 1.6})`}>
        <path d="M -150 380 L -150 -120 A 150 170 0 0 1 150 -120 L 150 380" fill="#f1b08a" stroke={INK} strokeWidth={9} />
        <path d="M -95 -150 A 95 60 0 0 1 95 -150" fill="#f8d6c0" stroke={INK} strokeWidth={5} />
        <Fingerprint cx={0} cy={-40} s={0.32} color="#b86a48" sw={9} />
      </g>
      {/* kesit */}
      <g opacity={zoom}>
        <rect x={60} y={430} width={960} height={620} rx={40} fill="#fff4ea" stroke={INK} strokeWidth={8} />
        <Txt x={540} y={490} text="parmak ucunun kesiti" size={40} weight={700} color="#8a5a3c" />
        <path d={d} fill="#f1b08a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <g transform={`translate(382 ${wave(382) - 20}) scale(${c1})`}>
          <Arrow x0={0} y0={-80} x1={0} y1={-12} color={INK} />
          <Tag x={0} y={-120} text="ÇIKINTI" size={42} k={1} />
        </g>
        <g transform={`translate(577 ${wave(577) - 20}) scale(${c2})`}>
          <Arrow x0={60} y0={-190} x1={4} y1={-14} color={INK} />
          <Tag x={110} y={-228} text="OLUK" size={42} k={1} bg="#9fd3ff" />
        </g>
      </g>
      {/* sensör */}
      <g opacity={sens} transform={`translate(0 ${(1 - sens) * 60})`}>
        <rect x={90} y={1010} width={900} height={60} rx={14} fill="#3a4250" stroke={INK} strokeWidth={6} />
        {t > w(21) ? <rect x={90 + scan * 860} y={1000} width={40} height={80} rx={10} fill="#7ff0ff" opacity={0.9} /> : null}
        <Tag x={860} y={1130} text="SENSÖR" size={40} k={sp(t, w(21))} bg="#7ff0ff" />
      </g>
    </g>
  );
};

// 4 — Üç sensör türü
const Card: React.FC<{ y: number; k: number; title: string; sub: string; t: number; kind: 0 | 1 | 2; act: number }> = ({ y, k, title, sub, t, kind, act }) => (
  <g transform={`translate(${lerp(1700, 540, ez(k))} ${y})`} opacity={k > 0.01 ? 1 : 0}>
    <rect x={-470} y={-120} width={940} height={240} rx={30} fill="#0f3a66" stroke={act > 0 ? ACC : "#cfe6ff"} strokeWidth={act > 0 ? 9 : 5} />
    <g transform="translate(-330 0)">
      <rect x={-110} y={-20} width={220} height={60} rx={10} fill="#5d7fa3" stroke="#cfe6ff" strokeWidth={4} />
      <path d="M -80 -20 Q 0 -110 80 -20" fill="#f1b08a" stroke="#cfe6ff" strokeWidth={4} />
      {kind === 0
        ? [-60, 0, 60].map((x, i) => (
          <line key={i} x1={x} y1={40} x2={x + Math.sin(t * 6 + i) * 6} y2={-15} stroke="#ffe27a" strokeWidth={8} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(t * 8 + i * 2)} />
        ))
        : null}
      {kind === 1
        ? [-60, -20, 20, 60].map((x, i) => (
          <path key={i} d={`M ${x} 38 l 8 -16 l -10 0 l 8 -18`} stroke="#ffe27a" strokeWidth={6} fill="none" opacity={(Math.floor(t * 10 + i) % 3) === 0 ? 1 : 0.2} />
        ))
        : null}
      {kind === 2
        ? [0, 1, 2].map((i) => {
          const r = ((t * 70 + i * 30) % 90) + 10;
          return <path key={i} d={`M ${-r} 30 A ${r} ${r * 0.8} 0 0 1 ${r} 30`} stroke="#ffe27a" strokeWidth={5} fill="none" opacity={1 - r / 100} />;
        })
        : null}
    </g>
    <text x={-150} y={-12} fontSize={58} fontWeight={900} fill={act > 0 ? ACC : "#ffffff"} style={{ fontFamily: "var(--font)" }}>{title}</text>
    <text x={-150} y={52} fontSize={40} fontWeight={700} fill="#cfe6ff" style={{ fontFamily: "var(--font)" }}>{sub}</text>
  </g>
);
const Sensor: S = ({ t, w }) => {
  const a = sp(t, w(26) - 0.3);
  const b = sp(t, w(35) - 0.5);
  const c = sp(t, w(40) - 0.4);
  const act = (i: number) => (i === 0 ? (t < w(29) ? 1 : 0) : i === 1 ? (t >= w(29) && t < w(38) ? 1 : 0) : t >= w(38) ? 1 : 0);
  return (
    <g>
      <Txt x={540} y={400} text="3 FARKLI SENSÖR" size={58} color={ACC} o={ap(t, 0.1)} />
      <Card y={570} k={a} title="OPTİK" sub="ışıkla fotoğraf çeker" t={t} kind={0} act={act(0)} />
      <Card y={830} k={b} title="KAPASİTİF" sub="elektrik farkını ölçer" t={t} kind={1} act={act(1)} />
      <Card y={1090} k={c} title="ULTRASONİK" sub="ses yankısını dinler" t={t} kind={2} act={act(2)} />
    </g>
  );
};

// 5 — Özel noktalar: bitiş ve çatallanma
const Noktalar: S = ({ t, w }) => {
  const draw = ap(t, 0, 1.6);
  const flash = ap(t, w(49), 0.3);
  const e1 = sp(t, w(54) - 0.1);
  const e2 = sp(t, w(57) - 0.1);
  const S0 = 1.05;
  const CX = 540;
  const CY = 760;
  return (
    <g>
      <Fingerprint cx={CX} cy={CY} s={S0} color={CHALK} draw={draw} sw={6} o={0.9} />
      {MINUTIAE.map(([x, y, k], i) => {
        const isEnd = k === "bitis";
        const kk = isEnd ? e1 : e2;
        const base = flash * (0.6 + 0.4 * Math.sin(t * 8 + i));
        const r = 14 + 14 * kk;
        return (
          <g key={i}>
            <circle cx={CX + x * S0} cy={CY + y * S0} r={10} fill={ACC} opacity={base} />
            <circle cx={CX + x * S0} cy={CY + y * S0} r={r} fill="none" stroke={isEnd ? ACC : "#7fe0ff"} strokeWidth={7} opacity={kk} />
          </g>
        );
      })}
      <Tag x={250} y={380} text="BİTİŞ" size={44} k={e1} />
      <Tag x={740} y={380} text="ÇATALLANMA" size={44} k={e2} bg="#7fe0ff" />
      <Txt x={540} y={1180} text="özel noktalar" size={48} color={ACC} o={flash * (1 - e1)} weight={900} />
    </g>
  );
};

// 6 — Noktalar haritaya dönüşür
const Harita: S = ({ t, w }) => {
  const S0 = 1.05;
  const CX = 540;
  const CY = 760;
  const fpo = 0.9 - 0.75 * ap(t, w(60), 1.2);
  const n = MAP_EDGES.length;
  const lineK = (i: number) => ap(t, lerp(w(60), w(69), i / n), 0.35);
  const glow = ap(t, w(69), 0.4);
  const P = MAP_IDX.map((i) => [CX + MINUTIAE[i][0] * S0, CY + MINUTIAE[i][1] * S0]);
  return (
    <g>
      <Fingerprint cx={CX} cy={CY} s={S0} color={CHALK} sw={6} o={fpo} />
      {glow > 0 ? <Glow cx={CX} cy={CY} r={480} id="mg" color={ACC} o={0.35 * glow} /> : null}
      {MAP_EDGES.map(([a, b], i) => {
        const k = lineK(i);
        return k > 0 ? (
          <line key={i} x1={P[a][0]} y1={P[a][1]} x2={lerp(P[a][0], P[b][0], k)} y2={lerp(P[a][1], P[b][1], k)} stroke={ACC} strokeWidth={6} strokeLinecap="round" />
        ) : null;
      })}
      {P.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={13 + 5 * Math.sin(t * 5 + i)} fill="#fff8dc" stroke={ACC} strokeWidth={4} />
      ))}
      <Tag x={540} y={360} text="SADECE SENİN" size={50} k={sp(t, w(65))} />
      <Tag x={540} y={1170} text="HARİTA" size={60} k={sp(t, w(69))} bg="#7fe0ff" />
    </g>
  );
};

// 7 — Matematiksel özet, şifre, güvenli bölge
const HEX = "7F3AC91E04BD58A2E6F1093C";
const Kasa: S = ({ t, w }) => {
  const shrink = ap(t, w(73), 0.6);
  const hashK = ap(t, w(76) - 0.1, 0.4);
  const lockK = sp(t, w(77));
  const chipK = sp(t, w(78) - 0.2);
  const fly = ap(t, w(80), 0.9);
  const scr = Math.floor(t * 20);
  const hex = HEX.split("").map((c, i) => (t < w(77) ? HEX[(i * 7 + scr) % HEX.length] : c)).join("");
  const hx = lerp(540, 540, fly);
  const hy = lerp(560, 960, fly);
  const hs = lerp(1, 0.38, fly);
  return (
    <g>
      {/* harita küçülüp özete dönüşür */}
      <g transform={`translate(540 560) scale(${lerp(0.8, 0.15, shrink)})`} opacity={1 - hashK}>
        {MAP_EDGES.map(([a, b], i) => {
          const pa = MINUTIAE[MAP_IDX[a]];
          const pb = MINUTIAE[MAP_IDX[b]];
          return <line key={i} x1={pa[0] * 1.05} y1={pa[1] * 1.05} x2={pb[0] * 1.05} y2={pb[1] * 1.05} stroke={ACC} strokeWidth={12} />;
        })}
      </g>
      <g transform={`translate(${hx} ${hy}) scale(${hs})`} opacity={hashK}>
        <rect x={-420} y={-95} width={840} height={190} rx={24} fill="#0d2a22" stroke="#7fffc8" strokeWidth={6} />
        <text x={0} y={-20} textAnchor="middle" fontSize={34} fontWeight={800} fill="#7fffc8" style={{ fontFamily: "var(--font)" }}>matematiksel özet</text>
        <text x={0} y={50} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffffff" letterSpacing={6} style={{ fontFamily: "monospace" }}>{hex.slice(0, 4)}·{hex.slice(4, 8)}·{hex.slice(8, 12)}·{hex.slice(12, 16)}</text>
        <g transform="translate(360 -95)">
          <Lock cx={0} cy={0} s={0.55 * lockK} fill={ACC} />
        </g>
      </g>
      {/* işlemci */}
      <g transform={`translate(540 1000) scale(${chipK})`} opacity={cl(chipK * 1.5)}>
        {Array.from({ length: 7 }).map((_, i) => (
          <g key={i} stroke="#9aa5b1" strokeWidth={10}>
            <line x1={-150 + i * 50} y1={-200} x2={-150 + i * 50} y2={-240} />
            <line x1={-150 + i * 50} y1={200} x2={-150 + i * 50} y2={240} />
            <line x1={-200} y1={-150 + i * 50} x2={-240} y2={-150 + i * 50} />
            <line x1={200} y1={-150 + i * 50} x2={240} y2={-150 + i * 50} />
          </g>
        ))}
        <rect x={-200} y={-200} width={400} height={400} rx={26} fill="#1c2430" stroke="#9aa5b1" strokeWidth={8} />
        <rect x={-120} y={-60} width={240} height={150} rx={16} fill="#0d2a22" stroke={ACC} strokeWidth={6} strokeDasharray="14 10" />
        <text x={0} y={-110} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff" style={{ fontFamily: "var(--font)" }}>İŞLEMCİ</text>
        <text x={0} y={130} textAnchor="middle" fontSize={30} fontWeight={800} fill={ACC} style={{ fontFamily: "var(--font)" }}>GÜVENLİ BÖLGE</text>
      </g>
      <Tag x={540} y={400} text="ŞİFRELENİR" size={52} k={sp(t, w(77))} />
    </g>
  );
};

// 8 — Karşılaştır, benziyorsa aç
const Kontrol: S = ({ t, w }) => {
  const touch = ap(t, w(84) - 0.2, 0.5);
  const newK = sp(t, w(87));
  const oldK = sp(t, w(91) - 0.1);
  const cmp = ap(t, w(92), 1.0);
  const okK = ap(t, w(94), 0.5);
  const open = ap(t, w(96) - 0.15, 0.4);
  const pct = Math.round(97 * cmp);
  const MiniMap: React.FC<{ x: number; y: number; k: number; c: string; jit?: number }> = ({ x, y, k, c, jit = 0 }) => (
    <g transform={`translate(${x} ${y}) scale(${0.42 * k})`} opacity={cl(k * 1.5)}>
      <rect x={-300} y={-330} width={600} height={660} rx={40} fill="#ffffff" stroke={INK} strokeWidth={10} />
      {MAP_EDGES.map(([a, b], i) => {
        const pa = MINUTIAE[MAP_IDX[a]];
        const pb = MINUTIAE[MAP_IDX[b]];
        const j = (n: number) => Math.sin(n * 12.9) * jit;
        return <line key={i} x1={pa[0] * 1.1 + j(a)} y1={pa[1] * 1.1 + j(a + 5)} x2={pb[0] * 1.1 + j(b)} y2={pb[1] * 1.1 + j(b + 5)} stroke={c} strokeWidth={12} strokeLinecap="round" />;
      })}
      {MAP_IDX.map((m, i) => <circle key={i} cx={MINUTIAE[m][0] * 1.1} cy={MINUTIAE[m][1] * 1.1} r={16} fill={c} />)}
    </g>
  );
  return (
    <g>
      {/* telefon ve parmak */}
      <g transform={`translate(0 ${-open * 20})`}>
        <Phone cx={540} cy={700} s={0.62} screen={open > 0.5 ? "#3fae6a" : "#1b2333"}>
          {open > 0.5 ? <Txt x={0} y={20} text="AÇIK" size={90} color="#fff" /> : <circle cx={0} cy={180} r={55} fill="none" stroke="#7fe0ff" strokeWidth={6} />}
        </Phone>
        <g transform={`translate(540 ${lerp(1150, 870, touch)})`} opacity={1 - open}>
          <path d="M -60 260 L -60 0 A 60 70 0 0 1 60 0 L 60 260" fill="#f1b08a" stroke={INK} strokeWidth={8} />
        </g>
      </g>
      <MiniMap x={190} y={560} k={newK} c={BLUE} jit={6} />
      <MiniMap x={890} y={560} k={oldK} c={ACC} />
      <Txt x={190} y={760} text="yeni" size={40} o={newK} />
      <Txt x={890} y={760} text="kayıtlı" size={40} o={oldK} />
      {cmp > 0 ? (
        <g>
          <rect x={240} y={1040} width={600} height={56} rx={28} fill="#ffffff" stroke={INK} strokeWidth={6} />
          <rect x={246} y={1046} width={588 * cmp} height={44} rx={22} fill={GREEN} />
          <Txt x={540} y={1150} text={`benzerlik %${pct}`} size={50} />
        </g>
      ) : null}
      <Check cx={540} cy={430} k={okK} s={0.9} />
      <g transform="translate(540 700)">
        <Lock cx={0} cy={-40} s={0.8 * (1 - ap(t, w(96) + 0.6, 0.3))} open={open} fill={open > 0.5 ? GREEN : ACC} />
      </g>
      <Kisi x={170} y={900} s={0.7} mood={okK > 0.5 ? "happy" : "neutral"} arms={okK > 0.5 ? "thumb" : "down"} t={t} o={ap(t, 0.2)} />
    </g>
  );
};

// 9 — Parmak izini değil, haritasını hatırlar
const Son: S = ({ t, w }) => {
  const a = sp(t, 0.1);
  const x = ap(t, w(101), 0.45);
  const b = sp(t, 0.45);
  const circ = ap(t, w(104), 0.6);
  const fin = sp(t, w(105) + 0.2);
  return (
    <g>
      <g transform={`translate(290 700) scale(${a})`}>
        <rect x={-210} y={-250} width={420} height={500} rx={24} fill="#fbf7ee" stroke={INK} strokeWidth={8} />
        <Fingerprint cx={0} cy={-10} s={0.55} color={INK} sw={10} />
      </g>
      <Cross cx={290} cy={700} r={200} k={x} sw={20} />
      <Txt x={290} y={1030} text="parmak izi" size={46} o={a} />
      <g transform={`translate(790 700) scale(${b})`}>
        <rect x={-210} y={-250} width={420} height={500} rx={24} fill="#fbf7ee" stroke={INK} strokeWidth={8} />
        {MAP_EDGES.map(([i0, i1], i) => {
          const pa = MINUTIAE[MAP_IDX[i0]];
          const pb = MINUTIAE[MAP_IDX[i1]];
          return <line key={i} x1={pa[0] * 0.8} y1={pa[1] * 0.8 - 10} x2={pb[0] * 0.8} y2={pb[1] * 0.8 - 10} stroke="#c58a0f" strokeWidth={8} strokeLinecap="round" />;
        })}
        {MAP_IDX.map((m, i) => <circle key={i} cx={MINUTIAE[m][0] * 0.8} cy={MINUTIAE[m][1] * 0.8 - 10} r={11} fill={ACC} stroke={INK} strokeWidth={3} />)}
      </g>
      {circ > 0.01 ? <rect x={560} y={430} width={460} height={540} rx={36} fill="none" stroke={GREEN} strokeWidth={14} pathLength={1} strokeDasharray={`${circ} 1`} /> : null}
      <Txt x={790} y={1030} text="haritası" size={46} o={b} color="#2f8f52" />
      <Tag x={540} y={1140} text="HARİTASINI HATIRLAR" size={50} k={fin} />
    </g>
  );
};

export const SAHNE: Record<string, S> = {
  giris: Giris, foto: Foto, yakin: Yakin, sensor: Sensor, noktalar: Noktalar, harita: Harita, kasa: Kasa, kontrol: Kontrol, son: Son,
};

// Kapak: yarısı parmak izi, yarısı harita
export const KAPAK: React.FC = () => {
  const S0 = 1.12;
  const CX = 540;
  const CY = 1160;
  const P = MAP_IDX.map((i) => [CX + MINUTIAE[i][0] * S0, CY + MINUTIAE[i][1] * S0]);
  return (
    <g>
      <defs>
        <clipPath id="solYari"><rect x={0} y={0} width={CX} height={1920} /></clipPath>
        <clipPath id="sagYari"><rect x={CX} y={0} width={540} height={1920} /></clipPath>
      </defs>
      <Glow cx={CX} cy={CY} r={560} id="kg" color={ACC} o={0.3} />
      <g clipPath="url(#solYari)">
        <Fingerprint cx={CX} cy={CY} s={S0} color={CHALK} sw={7} />
      </g>
      <g clipPath="url(#sagYari)">
        <Fingerprint cx={CX} cy={CY} s={S0} color={CHALK} sw={7} o={0.18} />
        {MAP_EDGES.map(([a, b], i) => (
          <line key={i} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke={ACC} strokeWidth={7} strokeLinecap="round" />
        ))}
        {P.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={15} fill="#fff8dc" stroke={ACC} strokeWidth={5} />)}
      </g>
      <line x1={CX} y1={CY - 400} x2={CX} y2={CY + 400} stroke={ACC} strokeWidth={5} strokeDasharray="18 14" />
      
    </g>
  );
};
export const KAPAK_YAZI = { ust: "Telefonun parmak izini", buyuk: "SAKLAMIYOR!", alt: "Peki neyi saklıyor?" };
