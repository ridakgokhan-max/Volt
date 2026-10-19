// Konu 7/30 (Tarih): Konserve kutusu ve 50 yıl sonra gelen açacak. ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, BLUE, CHALK, cl, ez, GREEN, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };

const Kutu: React.FC<{ x: number; y: number; s?: number; yazi?: string; renk?: string; kalin?: boolean }> = ({ x, y, s = 1, yazi = "", renk = RED, kalin }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-170} rx={170} ry={46} fill="#d8dde6" stroke={INK} strokeWidth={kalin ? 14 : 8} />
    <rect x={-170} y={-170} width={340} height={340} fill={kalin ? "#8a8f99" : "#c9ced8"} stroke={INK} strokeWidth={kalin ? 14 : 8} />
    <ellipse cx={0} cy={170} rx={170} ry={46} fill="#aeb4c0" stroke={INK} strokeWidth={kalin ? 14 : 8} />
    <rect x={-170} y={-80} width={340} height={150} fill={renk} stroke={INK} strokeWidth={6} />
    {yazi ? <text x={0} y={18} textAnchor="middle" fontSize={58} fontWeight={900} fill="#fff" style={font}>{yazi}</text> : null}
  </g>
);

/** Çekiç vuruşu (0..1 periyodik) */
const Cekic: React.FC<{ x: number; y: number; t: number; hiz?: number }> = ({ x, y, t, hiz = 2.4 }) => {
  const v = (t * hiz) % 1;
  return (
    <g transform={`translate(${x} ${y - 40 * Math.sin(v * Math.PI)}) rotate(${-25 + 35 * Math.sin(v * Math.PI)})`}>
      <rect x={-14} y={-260} width={28} height={220} rx={10} fill="#a36a3a" stroke={INK} strokeWidth={6} />
      <rect x={-70} y={-300} width={140} height={60} rx={10} fill="#5d6b82" stroke={INK} strokeWidth={6} />
    </g>
  );
};

// ---------- 1 — Açacağı yoktu ----------
const Giris: S = ({ t, ws, ses }) => {
  const ty = ws("yoktu");
  return (
    <g>
      <Kutu x={540} y={800} yazi="1810" />
      <g opacity={ap(t, ty - 0.3, 0.3)} transform="translate(800 520)">
        <rect x={-30} y={-110} width={60} height={160} rx={10} fill="#c9ced8" stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={-120} r={40} fill="#c9ced8" stroke={INK} strokeWidth={6} />
        <line x1={-110} y1={-190} x2={110} y2={80} stroke={RED} strokeWidth={18} strokeLinecap="round" />
      </g>
      <Tag x={540} y={340} text="AÇACAK YOK!" size={60} k={sp(t, ty - 0.1)} bg="#fff" rot={-3} />
      <Merakli x={220} y={1240} s={0.55} t={t} hareket="sasir" kostum="sapka" agiz={ses(t)} />
    </g>
  );
};

// ---------- 2 — Açacak 50 yıl sonra geldi: zaman çizelgesi ----------
const Cizelge: S = ({ t, ws, ses }) => {
  const t5 = ws("50");
  const ilerle = ap(t, 0.3, 1.8);
  return (
    <g>
      <line x1={140} y1={760} x2={940} y2={760} stroke={CHALK} strokeWidth={10} strokeLinecap="round" />
      <line x1={140} y1={760} x2={lerp(140, 940, ilerle)} y2={760} stroke={ACC} strokeWidth={14} strokeLinecap="round" />
      <g transform="translate(160 760)"><circle r={24} fill={RED} stroke={INK} strokeWidth={6} /><Txt x={0} y={-50} text="1810" size={52} color={CHALK} stroke={INK} /><Txt x={0} y={90} text="KUTU" size={38} color={CHALK} stroke={INK} /></g>
      <g transform="translate(920 760)" opacity={ap(t, 1.6, 0.3)}><circle r={24} fill={GREEN} stroke={INK} strokeWidth={6} /><Txt x={0} y={-50} text="1850'ler" size={52} color={CHALK} stroke={INK} /><Txt x={0} y={90} text="AÇACAK" size={38} color={CHALK} stroke={INK} /></g>
      <path d="M 180 640 Q 540 520 900 640" fill="none" stroke={ACC} strokeWidth={8} strokeDasharray="18 12" opacity={ap(t, t5 - 0.3, 0.3)} />
      <g transform={`translate(540 560) scale(${sp(t, t5 - 0.1, 8)})`}>
        <rect x={-150} y={-60} width={300} height={110} rx={55} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={22} textAnchor="middle" fontSize={64} fontWeight={900} fill={INK} style={font}>~50 YIL</text>
      </g>
      <Merakli x={540} y={1240} s={0.45} t={t} hareket="anlat" kostum="sapka" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

// ---------- 3 — 1810, İngiltere'de patent ----------
const Patent: S = ({ t, ws, ses }) => {
  const tp = ws("patentlendi");
  const dam = sp(t, tp - 0.15, 7);
  return (
    <g>
      <g transform={`translate(540 760) rotate(-3) scale(${sp(t, 0.1, 9)})`}>
        <rect x={-260} y={-340} width={520} height={680} rx={14} fill="#f4e8c8" stroke={INK} strokeWidth={8} />
        <Txt x={0} y={-250} text="PATENT" size={70} color={INK} />
        <Txt x={0} y={-180} text="1810 · İNGİLTERE" size={40} color="#7a5a3c" />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={-200} y1={-110 + i * 60} x2={200 - (i % 2) * 80} y2={-110 + i * 60} stroke="#b8a37a" strokeWidth={10} strokeLinecap="round" />)}
        <Kutu x={0} y={230} s={0.35} />
      </g>
      {dam > 0.02 ? (
        <g transform={`translate(720 980) rotate(-14) scale(${2 - dam})`} opacity={cl(dam * 1.5)}>
          <rect x={-130} y={-50} width={260} height={100} rx={12} fill="none" stroke={RED} strokeWidth={10} />
          <text x={0} y={20} textAnchor="middle" fontSize={56} fontWeight={900} fill={RED} style={font}>ONAY</text>
        </g>
      ) : null}
      <Merakli x={900} y={1240} s={0.45} t={t} hareket="isaret" kostum="sapka" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 4 — Amaç: asker ve denizcilere bozulmayan yiyecek ----------
const Amac: S = ({ t, ws, ses }) => {
  const td = ws("denizcilere");
  return (
    <g>
      <rect x={0} y={900} width={1080} height={1100} fill={BLUE} opacity={0.8} />
      {[0, 1, 2].map((i) => <path key={i} d={`M ${-80 + ((t * 60 + i * 260) % 1240)} ${940 + i * 60} q 40 -20 80 0 t 80 0`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.6} />)}
      <g transform={`translate(${lerp(-200, 560, ap(t, td - 0.6, 1.2))} ${900 + Math.sin(t * 2) * 8})`}>
        <path d="M -260 0 L 260 0 L 200 90 L -200 90 Z" fill="#7a5a3c" stroke={INK} strokeWidth={7} />
        <line x1={0} y1={0} x2={0} y2={-300} stroke={INK} strokeWidth={10} />
        <path d="M 6 -290 L 180 -120 L 6 -120 Z" fill={CHALK} stroke={INK} strokeWidth={6} />
        {[-150, -60, 30].map((x, i) => <g key={i} transform={`translate(${x} -40) scale(0.18)`}><Kutu x={0} y={0} /></g>)}
      </g>
      <Tag x={540} y={340} text="BOZULMAYAN YİYECEK" size={46} k={sp(t, ws("bozulmayan") - 0.1)} bg={GREEN} color="#fff" rot={-2} />
      <Merakli x={180} y={860} s={0.42} t={t} hareket="salla" kostum="sapka" agiz={ses(t)} />
    </g>
  );
};

// ---------- 5 — İlk kutular kalın demir, boşken bile ağır ----------
const Agir: S = ({ t, ws, ses }) => {
  const ta = ws("ağırdı");
  const egim = lerp(0, 14, ez((t - ta + 0.4) / 0.6));
  return (
    <g>
      <g transform={`rotate(${egim} 540 760)`}>
        <line x1={200} y1={760} x2={880} y2={760} stroke={INK} strokeWidth={16} strokeLinecap="round" />
        <g transform="translate(260 700) scale(0.4)"><Kutu x={0} y={0} kalin renk="#6b6f78" /></g>
        <g transform="translate(820 690)">{[0, 1, 2].map((i) => <rect key={i} x={-50 + i * 6} y={-40 - i * 34} width={100} height={30} rx={6} fill={ACC} stroke={INK} strokeWidth={5} />)}</g>
      </g>
      <path d="M 540 760 L 500 1000 L 580 1000 Z" fill="#5d6b82" stroke={INK} strokeWidth={7} />
      <Tag x={300} y={480} text="KALIN DEMİR" size={42} k={sp(t, ws("kalın") - 0.1)} bg="#5d6b82" color="#fff" rot={-3} />
      <Tag x={540} y={340} text="BOŞKEN BİLE AĞIR" size={48} k={sp(t, ta - 0.1)} bg={RED} color="#fff" rot={2} />
      <Merakli x={880} y={1240} s={0.45} t={t} hareket={t > ta ? "sasir" : "anlat"} kostum="sapka" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 6 — Nasıl açıyorlardı? Talimat: keski ve çekiçle açın ----------
const Talimat: S = ({ t, ws, ses }) => {
  const tk = ws("keski");
  return (
    <g>
      <Kutu x={540} y={780} yazi="" renk="#c4683a" />
      <g opacity={ap(t, ws("talimat") - 0.3, 0.3)}>
        <rect x={360} y={705} width={360} height={140} rx={10} fill="#f4e8c8" stroke={INK} strokeWidth={5} />
        <text x={540} y={760} textAnchor="middle" fontSize={34} fontWeight={900} fill={INK} style={font}>KESKİ VE ÇEKİÇLE</text>
        <text x={540} y={810} textAnchor="middle" fontSize={34} fontWeight={900} fill={RED} style={font}>AÇIN!</text>
      </g>
      {t > tk - 0.2 ? <Cekic x={560} y={560} t={t} /> : null}
      <g transform={`translate(540 360) scale(${sp(t, 0.1, 8) * (1 - ap(t, ws("kutunun") - 0.2, 0.2))}) rotate(${Math.sin(t * 4) * 6})`}>
        <text textAnchor="middle" y={60} fontSize={200} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>?</text>
      </g>
      <Merakli x={200} y={1240} s={0.48} t={t} hareket={t > tk ? "kahkaha" : "dusun"} kostum="sapka" agiz={ses(t)} />
    </g>
  );
};

// ---------- 7 — Askerler süngü, bıçak, hatta tüfek ----------
const Asker: S = ({ t, ws, ses }) => {
  const al = [["SÜNGÜ", ws("süngü")], ["BIÇAK", ws("bıçak")], ["TÜFEK", ws("tüfek")]] as [string, number][];
  const son = al.reduce((a, b) => (t > b[1] - 0.15 ? b : a), al[0]);
  const v = (t * 3) % 1;
  return (
    <g>
      <Kutu x={540} y={840} renk="#6b6f78" />
      <g transform={`translate(${600 + Math.sin(v * Math.PI) * -30} ${560 + Math.sin(v * Math.PI) * 60}) rotate(-35)`} opacity={ap(t, al[0][1] - 0.2, 0.2)}>
        <rect x={-14} y={-280} width={28} height={300} rx={8} fill={son[0] === "TÜFEK" ? "#7a5a3c" : "#c9ced8"} stroke={INK} strokeWidth={6} />
        <path d="M -14 -280 L 0 -330 L 14 -280 Z" fill="#c9ced8" stroke={INK} strokeWidth={5} />
      </g>
      {v < 0.2 && t > al[0][1] ? [0, 1, 2, 3].map((i) => <line key={i} x1={540} y1={680} x2={540 + Math.cos(i * 1.7) * 90} y2={680 - 40 + Math.sin(i * 1.7) * 40} stroke={ACC} strokeWidth={8} strokeLinecap="round" />) : null}
      {al.map(([ad, tt], i) => (
        <Tag key={ad} x={230 + i * 310} y={340} text={ad} size={44} k={sp(t, tt - 0.1)} bg={i === 2 ? RED : "#fff"} color={i === 2 ? "#fff" : INK} rot={i % 2 ? 3 : -3} />
      ))}
      <Merakli x={880} y={1240} s={0.45} t={t} hareket="sasir" kostum="sapka" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 8 — Kutular inceldi, 1850'lerde açacak ----------
const Acacak: S = ({ t, ws, ses }) => {
  const ta = ws("açacaklar");
  const yil = Math.round(lerp(1810, 1855, ap(t, 0.2, 1.8)));
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const u = cl((t - i * 0.25) / 1.2);
        return u > 0 && u < 1 ? (
          <g key={i} transform={`translate(${540 + u * (i % 2 ? 380 : -380)} ${520 - u * 260}) rotate(${u * (i % 2 ? 60 : -60)})`} opacity={1 - u}>
            <rect x={-90} y={-110} width={180} height={220} rx={10} fill="#fff" stroke={INK} strokeWidth={5} />
            <rect x={-90} y={-110} width={180} height={50} rx={10} fill={RED} />
          </g>
        ) : null;
      })}
      <g transform="translate(540 560)">
        <rect x={-150} y={-160} width={300} height={320} rx={16} fill="#fff" stroke={INK} strokeWidth={8} />
        <rect x={-150} y={-160} width={300} height={80} rx={16} fill={RED} stroke={INK} strokeWidth={8} />
        <text x={0} y={60} textAnchor="middle" fontSize={88} fontWeight={900} fill={INK} style={font}>{yil}</text>
      </g>
      <g transform={`translate(540 1000) scale(${sp(t, ta - 0.2, 8)}) rotate(${Math.sin(t * 3) * 5})`}>
        <path d="M -150 -20 L 60 -20 Q 100 -20 110 10 L 150 10 L 150 30 L 100 30 Q 90 40 60 40 L -150 40 Z" fill="#c9ced8" stroke={INK} strokeWidth={7} />
        <circle cx={-110} cy={10} r={16} fill={INK} />
        <path d="M 110 10 L 160 -30" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      </g>
      <Tag x={540} y={1150} text="İLK AÇACAK!" size={46} k={sp(t, ta + 0.2)} bg={GREEN} color="#fff" rot={-2} />
    </g>
  );
};

// ---------- 9 — Sonuç: bir icat bazen başka bir icadı bekler ----------
const Sonuc: S = ({ t, ws, ses }) => {
  const tb = ws("başka");
  const bir = ez((t - tb + 0.2) / 0.7);
  return (
    <g>
      <g transform={`translate(${lerp(300, 450, bir)} 720)`}>
        <rect x={-130} y={-130} width={260} height={260} rx={20} fill={RED} stroke={INK} strokeWidth={8} />
        <Txt x={0} y={20} text="KUTU" size={50} color="#fff" />
      </g>
      <g transform={`translate(${lerp(780, 630, bir)} 720)`}>
        <rect x={-130} y={-130} width={260} height={260} rx={20} fill={GREEN} stroke={INK} strokeWidth={8} />
        <Txt x={0} y={20} text="AÇACAK" size={50} color="#fff" />
      </g>
      {bir > 0.95 ? <circle cx={540} cy={720} r={60 + 40 * Math.sin(t * 6)} fill="none" stroke={ACC} strokeWidth={10} opacity={0.7} /> : null}
      <Tag x={540} y={450} text="İCAT, İCADI BEKLER" size={46} k={sp(t, tb + 0.3)} bg={ACC} rot={-2} />
      <Merakli x={880} y={1240} s={0.5} t={t} hareket={t > tb ? "aha" : "anlat"} kostum="sapka" agiz={ses(t)} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, cizelge: Cizelge, patent: Patent, amac: Amac, agir: Agir, talimat: Talimat, asker: Asker, acacak: Acacak, sonuc: Sonuc };

export const KAPAK: React.FC = () => (
  <g>
    <Kutu x={540} y={1250} s={1.3} yazi="1810" />
    <Merakli x={880} y={1700} s={0.85} t={0.3} hareket="sasir" kostum="sapka" />
  </g>
);
export const KAPAK_YAZI = { ust: "Konserve icat edildiğinde", buyuk: "AÇACAK YOKTU!", alt: "50 yıl boyunca nasıl açtılar?" };
