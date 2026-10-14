// Konu: Fermuarın hüzünlü hikâyesi (ws("kelime") = sahne içindeki saniye)
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, BLUE, Check, CHALK, cl, Cross, ez, GREEN, Glow, INK, Kamera, kameraAn, Kisi, lerp, Lock, Odak, Phone, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";
import { Saat } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const BRASS = "#d9b25a";
const BRASS_D = "#8a6a2a";
const FABRIC = "#2f4f7a";

// ---------- fermuar çizimi ----------
// dikey fermuar: y0..y1 arası; slider (0..1) konumundan yukarısı kapalı, aşağısı açık (V şeklinde)
const Zip: React.FC<{ x: number; y0: number; y1: number; slider: number; tw?: number; fabric?: string; spread?: number; teeth?: number }> = ({
  x, y0, y1, slider, tw = 34, fabric = FABRIC, spread = 140, teeth = 26,
}) => {
  const sy = lerp(y0, y1, slider);
  const step = (y1 - y0) / teeth;
  const open = (y: number) => (y <= sy ? 0 : Math.min(1, (y - sy) / ((y1 - y0) * 0.6)) * spread);
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = y0 + ((y1 - y0) * i) / 24;
    left.push(`${x - tw * 0.6 - open(y)},${y}`);
    right.push(`${x + tw * 0.6 + open(y)},${y}`);
  }
  return (
    <g>
      <polygon points={`${x - 600},${y0} ${left.join(" ")} ${x - 600},${y1}`} fill={fabric} stroke={INK} strokeWidth={6} />
      <polygon points={`${x + 600},${y0} ${right.join(" ")} ${x + 600},${y1}`} fill={fabric} stroke={INK} strokeWidth={6} />
      {Array.from({ length: teeth }).map((_, i) => {
        const y = y0 + step * (i + 0.5);
        const o = open(y);
        const side = i % 2 === 0 ? -1 : 1;
        const cx = x + side * (tw * 0.25 + o);
        return <rect key={i} x={cx - tw * 0.45} y={y - step * 0.32} width={tw * 0.9} height={step * 0.64} rx={step * 0.18} fill={BRASS} stroke={BRASS_D} strokeWidth={3} />;
      })}
      <g transform={`translate(${x} ${sy})`}>
        <path d={`M ${-tw * 1.1} -26 L ${tw * 1.1} -26 L ${tw * 0.8} 34 L ${-tw * 0.8} 34 Z`} fill="#c9c2b4" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-tw * 0.35} y={30} width={tw * 0.7} height={tw * 2.2} rx={tw * 0.3} fill="#c9c2b4" stroke={INK} strokeWidth={6} />
      </g>
    </g>
  );
};

// ---------- 1 — Giriş: dev fermuar kapanır ----------
const Giris: S = ({ t, ws, ses }) => {
  const z = ez(t / 1.0);
  const th = ws("hüzünlü");
  const KAM = [{ t: 0, x: 540, y: 330, z: 1.9 }, { t: 1.0, x: 540, y: 1180, z: 1.9 }, { t: 1.9, x: 540, y: 760, z: 1 }];
  return (
    <Kamera t={t} anlar={KAM}>
      <Zip x={540} y0={260} y1={1260} slider={z} tw={44} spread={360} teeth={30} />
      <g transform={`translate(540 760) scale(${sp(t, 2.05, 9)}) rotate(-4)`}>
        <rect x={-330} y={-95} width={660} height={190} rx={30} fill={ACC} stroke={INK} strokeWidth={9} />
        <text x={0} y={42} textAnchor="middle" fontSize={130} fontWeight={900} fill={INK} style={font}>FERMUAR</text>
      </g>
      <Merakli kostum="sapka" agiz={ses(t)} x={170} y={1230} s={0.75} t={t} hareket={t > th ? "uzgun" : "dur"} o={ap(t, 2.0, 0.3)} />
    </Kamera>
  );
};

// ---------- 2 — Judson, 1893: atölye görseli üstünde ----------
const Judson: S = ({ t, ws, ses }) => {
  const ty = ws("1893'te");
  const tn = ws("whitcomb");
  const tp = ws("patentlendi");
  const ta = ws("ayakkabı");
  const year = Math.round(lerp(1850, 1893, ez((t - (ty - 0.5)) / 0.7)));
  const paper = sp(t, tp - 0.4);
  const stamp = sp(t, tp, 8);
  const boot = sp(t, ta - 0.2);
  return (
    <g>
      <rect x={0} y={-40} width={1080} height={1960} fill="#5a3b1c" opacity={0.18} />
      <g transform={`translate(540 380) scale(${sp(t, ty - 0.5)})`}>
        <rect x={-210} y={-80} width={420} height={160} rx={24} fill="#f3e2bf" stroke={INK} strokeWidth={8} />
        <text x={0} y={45} textAnchor="middle" fontSize={130} fontWeight={900} fill={INK} style={{ ...font, fontVariantNumeric: "tabular-nums" }}>{year}</text>
      </g>
      <Tag x={540} y={540} text="Whitcomb Judson" size={52} k={sp(t, tn)} bg="#f3e2bf" />
      {/* patent belgesi */}
      <g transform={`translate(${lerp(1300, 760, ez(paper))} 860) rotate(${6 - 3 * paper})`}>
        <rect x={-200} y={-250} width={400} height={500} fill="#fbf3dd" stroke={INK} strokeWidth={7} />
        <text x={0} y={-190} textAnchor="middle" fontSize={40} fontWeight={900} fill={INK} style={font}>PATENT</text>
        <text x={0} y={-150} textAnchor="middle" fontSize={26} fontWeight={700} fill={INK} style={font}>No. 504,038</text>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <path d={`M -60 ${-80 + i * 42} q 30 -18 60 0 q 30 18 60 0`} stroke={INK} strokeWidth={5} fill="none" />
            <circle cx={-60 + (i % 2) * 120} cy={-80 + i * 42} r={8} fill="none" stroke={INK} strokeWidth={4} />
          </g>
        ))}
        <g transform={`translate(70 170) rotate(-14) scale(${stamp})`} opacity={cl(stamp * 1.5)}>
          <rect x={-120} y={-42} width={240} height={84} rx={10} fill="none" stroke={RED} strokeWidth={8} />
          <text x={0} y={18} textAnchor="middle" fontSize={50} fontWeight={900} fill={RED} style={font}>ONAY</text>
        </g>
      </g>
      {/* bağcıklı ayakkabı */}
      <g transform={`translate(260 1060) scale(${boot})`} opacity={cl(boot * 1.5)}>
        <path d="M -110 60 L -110 -120 L -20 -120 L -10 -10 Q 90 0 120 40 L 120 60 Z" fill="#5a3b25" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M -60 ${-95 + i * 28} l 40 14 m -40 0 l 40 -14`} stroke="#f3e2bf" strokeWidth={5} strokeLinecap="round" />
        ))}
        <path d={`M -20 -10 q 40 ${30 + Math.sin(t * 5) * 10} 10 70 q -40 20 -60 -10`} stroke="#f3e2bf" strokeWidth={5} fill="none" />
        <Cross cx={0} cy={-20} r={120} k={ap(t, ws("uğraşmamak"), 0.4)} sw={14} />
      </g>
      <Odak id="od-pat" t={t} a={tp - 0.1} b={ta - 0.3} x={760} y={860} rx={240} ry={300} />
      <Odak id="od-ayk" t={t} a={ta} x={260} y={1040} rx={180} ry={160} />
    </g>
  );
};

// ---------- 3 — Sorun: kendi kendine açılır ----------
const Sorun: S = ({ t, ws, ev, ses }) => {
  const tk = ws("açılıyordu");
  const tv = ev.vur0;
  const ty = ws("vermedi") - 0.4;
  const walking = t < tv;
  const x = walking ? lerp(-100, 520, ez(t / Math.max(tv, 0.1))) : 520;
  const popK = ap(t, tk, 0.3);
  return (
    <g>
      <line x1={0} y1={1200} x2={1080} y2={1200} stroke={INK} strokeWidth={7} />
      {/* açılan toka kartı */}
      <g transform={`translate(800 560) scale(${sp(t, 0.3)})`}>
        <rect x={-200} y={-150} width={400} height={300} rx={26} fill="#fff4ea" stroke={INK} strokeWidth={7} />
        {[0, 1, 2, 3, 4].map((i) => {
          const o = popK * (i % 2 ? 1 : -1) * (20 + i * 6) * (0.6 + 0.4 * Math.sin(t * 8 + i));
          return (
            <g key={i} transform={`translate(0 ${-100 + i * 50}) rotate(${o})`}>
              <path d="M -70 0 q 35 -22 70 0 q 35 22 70 0" stroke={BRASS_D} strokeWidth={8} fill="none" />
              <circle cx={-70} cy={0} r={10} fill={BRASS} stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
        <Txt x={0} y={190} text="kendi kendine açılıyor" size={34} o={popK} color={RED} />
      </g>
      {t > tk ? <Tag x={760} y={330} text="SIK SIK AÇILIYOR" size={40} k={sp(t, tk)} bg={RED} color="#fff" /> : null}
      <Merakli kostum="sapka" agiz={ses(t)} x={x} y={1200} s={1.05} t={t} hareket={walking ? "yuru" : t < ty ? "sasir" : "uzgun"} />
      {t > tv && t < tv + 0.9 ? (
        <g transform={`translate(${x + 70} 1110) scale(${sp(t, tv, 7)})`}>
          <path d="M 0 -70 L 18 -18 L 72 -26 L 30 8 L 56 60 L 0 28 L -56 60 L -30 8 L -72 -26 L -18 -18 Z" fill={ACC} stroke={INK} strokeWidth={6} />
          <text x={0} y={14} textAnchor="middle" fontSize={34} fontWeight={900} fill={INK} style={font}>POP!</text>
        </g>
      ) : null}
      <Odak id="od-kart" t={t} a={tk} b={tk + 1.6} x={800} y={560} rx={240} ry={200} />
      <Odak id="od-pop" t={t} a={tv} b={tv + 1.2} x={x + 40} y={1110} rx={140} ry={120} renk={RED} />
      {/* yüz çeviren kalabalık */}
      {t > ty
        ? [0, 1, 2, 3].map((i) => {
          const turn = ap(t, ty + 0.1 + i * 0.12, 0.25);
          return <Kisi key={i} x={780 + (i % 2) * 140} y={810 + Math.floor(i / 2) * 0} s={0.55} t={t} flip={turn > 0.5} mood="serious" arms={turn > 0.5 ? "stop" : "down"} o={ap(t, ty, 0.3)} />;
        })
        : null}
    </g>
  );
};

// ---------- 4 — Sundback, 1913: plan üzerinde yeniden tasarım ----------
const Sundback: S = ({ t, ws, ses }) => {
  const t20 = ws("yirmi") - 0.2;
  const t13 = ws("1913'te");
  const tg = ws("gideon");
  const tk = ws("kancalar");
  const td = ws("dişler");
  const year = Math.round(lerp(1893, 1913, ez((t - t20) / 1.4)));
  const hook = ap(t, tk - 0.2, 0.8);
  const teeth = ap(t, td - 0.6, 0.9);
  const KAM = [{ t: 0, x: 540, y: 760, z: 1 }, { t: tk - 0.3, x: 540, y: 760, z: 1 }, { t: tk + 0.3, x: 290, y: 860, z: 1.5 }, { t: td - 0.35, x: 290, y: 860, z: 1.5 }, { t: td + 0.3, x: 790, y: 860, z: 1.5 }, { t: td + 2.0, x: 790, y: 860, z: 1.5 }, { t: td + 2.6, x: 540, y: 760, z: 1 }];
  return (
    <Kamera t={t} anlar={KAM}>
      <g opacity={1 - cl((kameraAn(t, KAM).z - 1) / 0.3)}>
      <g transform="translate(540 390)">
        <rect x={-200} y={-80} width={400} height={160} rx={20} fill="#0f3a66" stroke="#cfe6ff" strokeWidth={6} />
        <text x={0} y={45} textAnchor="middle" fontSize={120} fontWeight={900} fill={t >= t13 ? ACC : "#ffffff"} style={{ ...font, fontVariantNumeric: "tabular-nums" }}>{year}</text>
      </g>
      <g opacity={ap(t, t20 - 0.2, 0.3) * (1 - ap(t, t13 + 0.5, 0.3))}>
        <Saat x={880} y={390} s={0.62} t={t} hiz={22} />
      </g>
      <g transform={`translate(540 560) scale(${sp(t, tg)})`} opacity={cl(sp(t, tg) * 1.5)}>
        <rect x={-300} y={-48} width={600} height={96} rx={48} fill="#0f3a66" stroke="#cfe6ff" strokeWidth={5} />
        <g transform="translate(-235 0)">
          <rect x={-40} y={-26} width={80} height={52} fill="#006aa7" />
          <rect x={-18} y={-26} width={14} height={52} fill="#fecc00" />
          <rect x={-40} y={-7} width={80} height={14} fill="#fecc00" />
        </g>
        <text x={40} y={18} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff" style={font}>Gideon Sundback</text>
      </g>
      </g>
      {/* isim gelene kadar takvim yaprakları uçuşur, sonra Meraklı düşünür */}
      {t < tk - 0.2
        ? Array.from({ length: 6 }).map((_, i) => {
          const u = ((t - t20) * 1.4 + i / 6) % 1;
          if (t < t20 || t > t13 + 0.6) return null;
          return (
            <g key={i} transform={`translate(${300 + i * 90 + Math.sin(u * 6 + i) * 60} ${700 + u * 420}) rotate(${u * 200 + i * 40})`} opacity={1 - u}>
              <rect x={-50} y={-60} width={100} height={120} rx={8} fill="#fff" stroke={INK} strokeWidth={4} />
              <rect x={-50} y={-60} width={100} height={30} rx={8} fill={RED} />
            </g>
          );
        })
        : null}
      <Merakli kostum="sapka" agiz={ses(t)} x={540} y={1230} s={0.85} t={t} hareket="dusun" ink={CHALK} o={ap(t, t13 + 0.4) * (1 - ap(t, tk - 0.4, 0.3))} />
      {/* plan: kanca -> diş */}
      <g transform="translate(290 900)" opacity={hook > 0.01 ? 1 : 0}>
        <rect x={-190} y={-200} width={380} height={400} rx={20} fill="none" stroke="#cfe6ff" strokeWidth={5} strokeDasharray="16 12" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M -60 ${-110 + i * 90} q 0 -40 40 -40 q 40 0 40 40 l 0 20 m 0 -20 l 60 0`} stroke={CHALK} strokeWidth={8} fill="none" pathLength={1} strokeDasharray={`${hook} 1`} strokeLinecap="round" />
        ))}
        <Txt x={0} y={240} text="KANCA" size={44} color={CHALK} o={hook} />
        <Cross cx={0} cy={0} r={150} k={ap(t, td - 0.1, 0.4)} sw={14} />
      </g>
      <g transform="translate(790 900)" opacity={teeth > 0.01 ? 1 : 0}>
        <rect x={-190} y={-200} width={380} height={400} rx={20} fill="none" stroke={ACC} strokeWidth={5} strokeDasharray="16 12" />
        {Array.from({ length: 6 }).map((_, i) => {
          const side = i % 2 ? 1 : -1;
          const k = cl(teeth * 6 - i);
          return (
            <g key={i} transform={`translate(${side * (14 + (1 - k) * 60)} ${-130 + i * 52})`} opacity={k}>
              <rect x={-38} y={-18} width={76} height={36} rx={10} fill={BRASS} stroke={BRASS_D} strokeWidth={4} />
              <circle cx={side * -22} cy={0} r={7} fill={BRASS_D} />
            </g>
          );
        })}
        <Txt x={0} y={240} text="DİŞ" size={44} color={ACC} o={teeth} />
        <g transform="translate(150 -170)"><Check cx={0} cy={0} s={0.45} k={ap(t, td, 0.4)} /></g>
      </g>
      <Odak id="od-kanca" t={t} a={tk} b={td - 0.3} x={290} y={910} rx={230} ry={270} renk="#cfe6ff" />
      <Odak id="od-dis" t={t} a={td} b={td + 2.2} x={790} y={910} rx={230} ry={270} />
    </Kamera>
  );
};

// ---------- 5 — Mekanizma: dişler iç içe kilitlenir ----------
const Mekanizma: S = ({ t, ws, ev, ses }) => {
  const tl = ev.vur0;
  const th = ws("hâlâ");
  const sl = 1 - ez((t - 0.2) / 2.8);
  return (
    <g>
      <Glow cx={360} cy={760} r={420} id="mg" color={BRASS} o={0.2} />
      <Zip x={360} y0={330} y1={1230} slider={sl} tw={56} spread={150} teeth={20} fabric="#24324f" />
      {t > tl - 0.1 ? (
        <g transform={`translate(700 1120) scale(${0.6 * sp(t, tl)})`}>
          <Lock cx={0} cy={0} s={0.8} fill={ACC} />
        </g>
      ) : null}
      <Odak id="od-surgu" t={t} a={0.3} b={tl - 0.2} x={360} y={lerp(330, 1230, sl) + 20} rx={130} ry={150} />
      <Odak id="od-kilit" t={t} a={tl} b={th - 0.2} x={700} y={1120} rx={110} />
      <Tag x={540} y={300} text="BUGÜN HÂLÂ AYNI FİKİR" size={46} k={sp(t, th)} bg={GREEN} color="#fff" />
      <Merakli kostum="sapka" agiz={ses(t)} x={930} y={1235} s={0.6} t={t - th} hareket={t > th ? "aha" : "dusun"} ink={CHALK} o={ap(t, 0.8)} />
    </g>
  );
};

// ---------- 6 — İsim: 1920'ler, "zipper" ----------
const Isim: S = ({ t, ws, ses }) => {
  const ty = ws("1920'lerde");
  const tz = ws("\"zipper\"");
  const tzz = ws("zip", 1);
  const zk = ez((t - (tz - 0.2)) / 0.45);
  return (
    <g>
      <rect x={0} y={-40} width={1080} height={1960} fill="#5a3b1c" opacity={0.12} />
      <Tag x={540} y={370} text="1920'ler" size={64} k={sp(t, ty)} bg="#f3e2bf" />
      <Kamera t={t} anlar={[{ t: 0, x: 540, y: 760, z: 1 }, { t: tz - 0.8, x: 540, y: 760, z: 1 }, { t: tz - 0.25, x: 330, y: 930, z: 1.55 }, { t: tz + 0.8, x: 330, y: 930, z: 1.55 }, { t: tz + 1.4, x: 540, y: 760, z: 1 }]}>
      {/* lastik çizme (galoş) — fermuarı "zipper" anında kapanır */}
      <g transform={`translate(330 1010) scale(${sp(t, ty + 0.3)})`} opacity={cl(sp(t, ty + 0.3) * 1.5)}>
        <path d="M -120 -230 L 40 -230 L 50 40 Q 170 50 200 120 L 200 170 L -130 170 Z" fill="#1d1d22" stroke="#f3e2bf" strokeWidth={7} strokeLinejoin="round" />
        <path d="M -130 150 L 200 150" stroke="#555" strokeWidth={10} />
        {Array.from({ length: 12 }).map((_, i) => {
          const zc = ez((t - (tz - 0.25)) / 0.5);
          const y = 130 - i * 30;
          const closed = i / 12 < zc;
          return <rect key={i} x={closed ? -12 : (i % 2 ? -26 : 2)} y={y - 9} width={24} height={14} rx={4} fill={BRASS} stroke={BRASS_D} strokeWidth={2} />;
        })}
        <rect x={-20} y={lerp(140, -230, ez((t - (tz - 0.25)) / 0.5)) - 20} width={40} height={40} rx={8} fill="#c9c2b4" stroke={INK} strokeWidth={4} />
      </g>
        <Odak id="od-cizme" t={t} a={tz - 0.3} b={tz + 1.0} x={330} y={960} rx={120} ry={220} />
      </Kamera>
      {zk > 0 ? (
        <g transform={`translate(${lerp(-700, 540, zk)} 760) skewX(${(1 - zk) * -20})`}>
          {[0, 1, 2, 3].map((i) => <line key={i} x1={-560 - i * 30} y1={-60 + i * 40} x2={-380 - i * 10} y2={-60 + i * 40} stroke={INK} strokeWidth={8} strokeLinecap="round" opacity={(1 - zk) * 0.8 + 0.2} />)}
          <text x={0} y={60} textAnchor="middle" fontSize={190} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={14} paintOrder="stroke" style={font}>ZIPPER</text>
        </g>
      ) : null}
      {t > tzz - 0.05 ? (
        <g transform={`translate(760 1040) rotate(-8) scale(${sp(t, tzz, 7)})`}>
          <path d="M 0 -150 L 40 -45 L 150 -60 L 70 15 L 120 130 L 0 60 L -120 130 L -70 15 L -150 -60 L -40 -45 Z" fill={RED} stroke={INK} strokeWidth={8} />
          <text x={0} y={28} textAnchor="middle" fontSize={84} fontWeight={900} fill="#fff" style={font}>ZİP!</text>
        </g>
      ) : null}
    </g>
  );
};

// ---------- 7 — Yarın: çekmecedeki telefon ----------
const Yarin: S = ({ t, ws, ses }) => {
  const tc = ws("çekmecende");
  const tb = ws("bedava");
  const tg = ws("güvenlik");
  const dr = ez((t - tc) / 0.5);
  const ph = sp(t, tc + 0.3);
  const KAM = [{ t: 0, x: 540, y: 760, z: 1 }, { t: tc - 0.3, x: 560, y: 820, z: 1.15 }, { t: tc + 0.2, x: 620, y: 960, z: 1.45 }, { t: tc + 0.8, x: 620, y: 700, z: 1.35 }, { t: tb - 0.2, x: 620, y: 700, z: 1.35 }, { t: tb + 0.4, x: 540, y: 760, z: 1 }];
  return (
    <Kamera t={t} anlar={KAM}>
      <g transform="translate(620 860)">
        <rect x={-280} y={-260} width={560} height={420} rx={20} fill="#c98f5b" stroke={INK} strokeWidth={8} />
        <rect x={-250} y={-230} width={500} height={150} rx={12} fill="#b97a45" stroke={INK} strokeWidth={6} />
        <g transform={`translate(0 ${dr * 170})`}>
          <rect x={-260} y={-60} width={520} height={190} rx={12} fill="#d9a06a" stroke={INK} strokeWidth={7} />
          <rect x={-50} y={10} width={100} height={22} rx={11} fill={INK} />
        </g>
      </g>
      <g transform={`translate(620 ${lerp(900, 560, ez(ph))}) scale(${ph})`} opacity={cl(ph * 1.5)}>
        <Phone cx={0} cy={0} s={0.5} screen="#222">
          <circle cx={0} cy={-210} r={40} fill="#111" stroke="#9cc7ff" strokeWidth={8} />
          {t > tg ? <circle cx={-80} cy={-240} r={20} fill={RED} opacity={Math.floor(t * 2.5) % 2 ? 1 : 0.25} /> : null}
          {t > tg ? <text x={0} y={30} textAnchor="middle" fontSize={70} fontWeight={900} fill={RED} style={font} opacity={Math.floor(t * 2.5) % 2 ? 1 : 0.4}>REC</text> : null}
        </Phone>
      </g>
      <Tag x={540} y={330} text="YARIN" size={60} k={sp(t, 0.1)} bg={ACC} />
      <Tag x={620} y={1200} text="BEDAVA KAMERA" size={48} k={sp(t, tb)} bg={GREEN} color="#fff" />
      <Merakli kostum="sapka" agiz={ses(t)} x={180} y={1230} s={0.75} t={t} hareket={t > tc ? "isaret" : "salla"} />
      <Odak id="od-tel" t={t} a={tg - 0.1} x={620} y={560} rx={170} ry={230} renk={RED} />
    </Kamera>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, judson: Judson, sorun: Sorun, sundback: Sundback, mekanizma: Mekanizma, isim: Isim, yarin: Yarin };

export const KAPAK: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#5a3b1c" opacity={0.15} />
    <Zip x={540} y0={760} y1={1560} slider={0.35} tw={50} spread={260} teeth={24} />
    <Merakli kostum="sapka" x={850} y={1640} s={0.8} t={0.2} hareket="sasir" />
  </g>
);
export const KAPAK_YAZI = { ust: "Fermuar icat edildi ama", buyuk: "TUTMADI!", alt: "20 yıl neden bekledi?" };
