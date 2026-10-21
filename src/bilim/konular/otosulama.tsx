// Konu 9/30 (Kendin Yap): Ters şişe neden akmıyor? — KOLAJ, Kendin Yap teması. Ses: Kadir.
// Parçalar: public/bilim/sulama-kolaj/*.png. ws("kelime") = sahne içindeki saniye.
import React from "react";
import { random } from "remotion";
import type { SceneProps } from "../BilimVideo";
import { Merakli } from "../merakli";
import { adim, AdimNo, Bant, geri, KIRMIZI, KolajDefs, KREM, Muhur, Serit, yap } from "../kolaj";
import { cl, INK, lerp } from "../kit";
import olcu from "../data/sulama-kolaj-olcu.json";

type S = React.FC<SceneProps>;
const { Parca } = yap("sulama-kolaj", olcu as Record<string, number>);
const SU = "#5aa9e6";
const TOPRAK = "#6b4a2b";

/** Kâğıttan kesilmiş ters şişe kesiti: su seviyesi, kabarcıklar, damla */
const SiseKesit: React.FC<{ x: number; y: number; s?: number; t: number; seviye?: number; kabarcik?: number; damla?: number }> = ({ x, y, s = 1, t, seviye = 0.85, kabarcik = 0, damla = 0 }) => {
  const tq = adim(t);
  const H = 520, W = 230;
  const su = H * seviye;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#kgolge)">
      {/* gövde (ters: dip yukarıda, boyun aşağıda) */}
      <path d={`M${-W / 2 - 14} -14 L${W / 2 + 14} -14 L${W / 2 + 14} ${H - 120} Q${W / 2 + 14} ${H - 40} 50 ${H} L50 ${H + 70} L-50 ${H + 70} L-50 ${H} Q${-W / 2 - 14} ${H - 40} ${-W / 2 - 14} ${H - 120} Z`} fill={KREM} />
      <path d={`M${-W / 2} 0 L${W / 2} 0 L${W / 2} ${H - 120} Q${W / 2} ${H - 50} 36 ${H} L36 ${H + 56} L-36 ${H + 56} L-36 ${H} Q${-W / 2} ${H - 50} ${-W / 2} ${H - 120} Z`} fill="#dfeef7" />
      <clipPath id={`sk${x}`}>
        <path d={`M${-W / 2} 0 L${W / 2} 0 L${W / 2} ${H - 120} Q${W / 2} ${H - 50} 36 ${H} L36 ${H + 56} L-36 ${H + 56} L-36 ${H} Q${-W / 2} ${H - 50} ${-W / 2} ${H - 120} Z`} />
      </clipPath>
      <rect x={-W / 2} y={H + 56 - su - 56} width={W} height={su + 56} fill={SU} clipPath={`url(#sk${x})`} />
      <rect x={-48} y={H + 56} width={96} height={46} rx={8} fill={KIRMIZI} />
      <circle cx={-14} cy={H + 102} r={5} fill={INK} />
      <circle cx={14} cy={H + 102} r={5} fill={INK} />
      {Array.from({ length: Math.round(kabarcik * 6) }).map((_, i) => {
        const u = (tq * 0.7 + i / 6) % 1;
        return <circle key={i} cx={Math.sin(i * 2.1 + tq * 3) * 30} cy={H + 40 - u * (H - 40)} r={10 + (i % 3) * 4} fill="none" stroke={KREM} strokeWidth={5} opacity={1 - u * 0.6} />;
      })}
      {damla > 0 ? (() => {
        const u = (tq * 1.2) % 1;
        return <path d="M0 -18 Q14 4 0 14 Q-14 4 0 -18 Z" fill={SU} stroke={INK} strokeWidth={3} transform={`translate(0 ${H + 120 + u * 70}) scale(${1.2})`} opacity={damla * (1 - u)} />;
      })() : null}
    </g>
  );
};

/** Toprak kesiti: taneler + aradaki boşluklar (ıslak=mavi, kuru=hava) */
const ToprakKesit: React.FC<{ x: number; y: number; w?: number; h?: number; kuru: number; t: number }> = ({ x, y, w = 820, h = 360, kuru, t }) => {
  const n = 46;
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#kgolge)">
      <rect x={-w / 2 - 14} y={-14} width={w + 28} height={h + 28} rx={24} fill={KREM} />
      <rect x={-w / 2} y={0} width={w} height={h} rx={16} fill={kuru > 0.5 ? "#e9dcc3" : "#9cc9ea"} />
      {Array.from({ length: n }).map((_, i) => {
        const cx = -w / 2 + 40 + random(`tx${i}`) * (w - 80);
        const cy = 40 + random(`ty${i}`) * (h - 80);
        const r = 28 + random(`tr${i}`) * 26;
        return <circle key={i} cx={cx} cy={cy} r={r} fill={TOPRAK} stroke={INK} strokeWidth={3} />;
      })}
    </g>
  );
};

/** Kâğıttan iğne */
const Igne2: React.FC<{ t: number; a: number; x: number; y: number }> = ({ t, a, x, y }) => {
  const tq = adim(t);
  if (tq < a) return null;
  const k = geri(cl((tq - a) / 0.35));
  return (
    <g transform={`translate(${x - (1 - k) * 700} ${y}) rotate(-28)`} filter="url(#kgolge)">
      <rect x={-190} y={-16} width={380} height={32} rx={16} fill={KREM} />
      <path d="M-170 0 L150 -7 L185 0 L150 7 Z" fill="#b9c2c9" stroke={INK} strokeWidth={4} />
      <ellipse cx={-140} cy={0} rx={18} ry={5} fill={KREM} stroke={INK} strokeWidth={3} />
    </g>
  );
};

/** Kâğıttan su kasesi */
const Kase: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} filter="url(#kgolge)" opacity={o}>
    <path d="M-170 -14 L170 -14 Q160 150 0 160 Q-160 150 -170 -14 Z" fill={KREM} />
    <path d="M-150 0 L150 0 Q140 130 0 140 Q-140 130 -150 0 Z" fill="#c96f45" />
    <ellipse cx={0} cy={4} rx={150} ry={26} fill={SU} stroke={INK} strokeWidth={4} />
  </g>
);

// 1 — Bu şişe ters duruyor ama tek damla akıtmıyor. Ta ki çiçeğin susayana kadar.
const Giris: S = ({ t, ws, ses }) => (
  <g>
    <KolajDefs />
    <Parca t={t} ad="saksi" x={540} y={240} w={500} />
    <SiseKesit x={590} y={190} s={0.9} t={t} seviye={0.85} />
    <Bant x={420} y={260} w={170} rot={-14} />
    <Muhur t={t} a={ws("susayana") - 0.1} text="ÇİÇEK SUSAYINCA AKIYOR" x={540} y={1110} size={58} rot={-4} />
    <Merakli x={900} y={1180} s={0.45} t={t} hareket="sasir" kostum="onluk" agiz={ses(t)} flip />
  </g>
);

// 2 — Peki bir pet şişe çiçeğin susadığını nasıl anlıyor?
const Soru: S = ({ t, ses }) => (
  <g>
    <KolajDefs />
    <SiseKesit x={300} y={240} s={0.62} t={t} seviye={0.85} />
    <Parca t={t} ad="cicek" x={720} y={380} w={440} rot={4} a={0.2} yon="sag" />
    <Muhur t={t} a={0.7} text="?" x={540} y={560} size={220} rot={8} />
    <Serit t={t} a={0.3} text="ŞİŞE NASIL ANLIYOR?" y={1080} size={66} rot={-2} bg={INK} color={KREM} />
    <Merakli x={160} y={1180} s={0.5} t={t} hareket="anlat" kostum="onluk" agiz={ses(t)} />
  </g>
);

// 3 — Önce yapalım: 1) kapağa iğneyle 1-2 delik 2) suyla doldur, kapat 3) ters çevir, 5-6 cm göm
const Adim: S = ({ t, ws }) => {
  const t1 = ws("kapağı"), t2 = ws("şişeyi"), t3 = ws("ters");
  return (
    <g>
      <KolajDefs />
      <Serit t={t} a={0.05} text="KENDİN YAP" x={300} y={250} size={50} rot={-4} bg={INK} color={KREM} />
      <AdimNo t={t} a={t1 - 0.1} n={1} x={150} y={420} />
      <Igne2 t={t} a={t1} x={420} y={420} />
      <Serit t={t} a={t1 + 0.3} text="KAPAĞA 1-2 DELİK" x={740} y={430} size={44} rot={2} />
      <AdimNo t={t} a={t2 - 0.1} n={2} x={150} y={660} />
            <Serit t={t} a={t2 + 0.3} text="DOLDUR, KAPAT" x={740} y={670} size={44} rot={-2} />
      <AdimNo t={t} a={t3 - 0.1} n={3} x={150} y={900} />
      <Serit t={t} a={t3 + 0.2} text="TERS ÇEVİR, 5-6 CM GÖM" x={590} y={910} size={44} rot={2} bg={KIRMIZI} color={KREM} />
      
    </g>
  );
};

// 4 — Şimdi sır şu: şişeden su çıkabilmesi için içeri hava girmesi gerekiyor.
const Sir: S = ({ t, ws }) => {
  const th = ws("hava");
  const tq = adim(t);
  return (
    <g>
      <KolajDefs />
      <SiseKesit x={540} y={170} s={0.85} t={t} seviye={0.8} />
      {tq > th - 0.2 ? (
        <g filter="url(#kgolge)">
          <path d="M820 760 C760 700 700 660 610 640" stroke={KREM} strokeWidth={22} fill="none" strokeLinecap="round" />
          <path d="M610 640 l40 -34 l-6 52 Z" fill={KREM} />
        </g>
      ) : null}
      <Serit t={t} a={0.1} text="SIR ŞU:" x={260} y={270} size={56} rot={-5} bg={INK} color={KREM} />
      <Serit t={t} a={th - 0.1} text="HAVA GİRMEZSE SU ÇIKMAZ" y={1100} size={52} rot={-2} />
    </g>
  );
};

// 5 — Toprak ıslakken delikler suyla tıkalı. Hava giremiyor, su da çıkamıyor.
const Islak: S = ({ t, ws }) => (
  <g>
    <KolajDefs />
    <ToprakKesit x={540} y={300} kuru={0} t={t} />
    <Serit t={t} a={0.1} text="ISLAK TOPRAK" x={300} y={260} size={52} rot={-4} bg={INK} color={KREM} />
    <Serit t={t} a={ws("tıkalı") - 0.1} text="BOŞLUKLAR SUYLA DOLU" y={760} size={54} rot={2} />
    <Muhur t={t} a={ws("giremiyor") - 0.1} text="HAVA YOK = SU YOK" x={540} y={950} size={64} rot={-5} />
  </g>
);

// 6 — Toprak kurudukça boşluklar açılıyor, hava kabarcıkları şişeye giriyor, şişe biraz su bırakıyor.
const Kuru: S = ({ t, ws }) => {
  const tk = ws("kabarcıkları");
  const tb = ws("bırakıyor");
  return (
    <g>
      <KolajDefs />
      <ToprakKesit x={540} y={760} h={300} kuru={adim(t) > ws("açılıyor") - 0.3 ? 1 : 0} t={t} />
      <SiseKesit x={540} y={130} s={0.62} t={t} seviye={lerp(0.8, 0.65, cl((adim(t) - tb) / 1.5))} kabarcik={adim(t) > tk - 0.2 ? 1 : 0} damla={adim(t) > tb - 0.2 ? 1 : 0} />
      <Serit t={t} a={ws("kurudukça") - 0.1} text="KURU TOPRAK" x={260} y={250} size={50} rot={-4} bg={INK} color={KREM} />
      <Serit t={t} a={tk - 0.1} text="HAVA GİRER → SU ÇIKAR" x={540} y={1110} size={50} rot={2} />
    </g>
  );
};

// 7 — Yani şişe hiçbir şey anlamıyor. Musluğu toprak açıp kapatıyor.
const Musluk: S = ({ t, ws }) => {
  const tm = ws("musluğu");
  return (
    <g>
      <KolajDefs />
      <SiseKesit x={300} y={220} s={0.6} t={t} seviye={0.8} />
      <Serit t={t} a={0.2} text="ŞİŞE: HİÇBİR ŞEY ANLAMIYOR" x={540} y={760} size={46} rot={-2} />
      <Parca t={t} ad="toprak" x={740} y={330} w={400} rot={4} a={tm - 0.15} yon="sag" />
      <Serit t={t} a={tm} text="MUSLUK: TOPRAK" x={540} y={920} size={84} rot={2} bg={KREM} color={INK} />
    </g>
  );
};

// 8 — Şişen yoksa pamuklu ip: bir ucu su dolu kapta, diğer ucu toprakta. Su ipten tırmanır.
const Ip: S = ({ t, ws }) => {
  const tt = ws("tırmanarak");
  const tq = adim(t);
  return (
    <g>
      <KolajDefs />
      <Kase x={260} y={660} o={adim(t) > ws("kaba") - 0.3 ? 1 : 0} />
      <Parca t={t} ad="bitki" x={790} y={260} w={330} rot={3} a={ws("toprağa") - 0.3} yon="sag" />
      <path d="M290 660 C380 380 560 360 720 600" stroke="#efe6d2" strokeWidth={18} fill="none" filter="url(#kgolge)" opacity={tq > ws("pamuklu") - 0.2 ? 1 : 0} />
      {tq > tt - 0.4
        ? [0, 1, 2, 3, 4].map((i) => {
            const u = (tq * 0.5 + i / 5) % 1;
            const bx = Math.pow(1 - u, 3) * 290 + 3 * Math.pow(1 - u, 2) * u * 380 + 3 * (1 - u) * u * u * 560 + u * u * u * 720;
            const by = Math.pow(1 - u, 3) * 660 + 3 * Math.pow(1 - u, 2) * u * 380 + 3 * (1 - u) * u * u * 360 + u * u * u * 600;
            return <circle key={i} cx={bx} cy={by} r={13} fill={SU} stroke={INK} strokeWidth={3} />;
          })
        : null}
      <Serit t={t} a={ws("pamuklu") - 0.1} text="PAMUKLU İP" x={300} y={260} size={52} rot={-4} bg={INK} color={KREM} />
      <Serit t={t} a={tt - 0.1} text="SU İPTEN TIRMANIR" y={1100} size={58} rot={2} />
    </g>
  );
};

// 9 — Son uyarı: delik büyükse şişe bir günde biter. Tatile çıkmadan bir gün önce dene.
const Uyari: S = ({ t, ws }) => {
  const tg = ws("günde");
  return (
    <g>
      <KolajDefs />
      <SiseKesit x={300} y={220} s={0.6} t={t} seviye={lerp(0.85, 0.08, cl((adim(t) - (tg - 1)) / 1.4))} damla={1} />
      <Muhur t={t} a={tg - 0.1} text="1 GÜNDE BİTER" x={740} y={420} size={60} rot={8} />
      <Parca t={t} ad="bavul" x={760} y={560} w={330} rot={-4} a={ws("tatile") - 0.2} yon="sag" />
      <Muhur t={t} a={ws("önce") - 0.1} text="1 GÜN ÖNCE DENE" x={540} y={1060} size={70} rot={-4} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, soru: Soru, adim: Adim, sir: Sir, islak: Islak, kuru: Kuru, musluk: Musluk, ip: Ip, uyari: Uyari };

export const KAPAK: React.FC = () => (
  <g>
    <KolajDefs />
    <Parca t={0} ad="saksi" x={520} y={880} w={440} />
    <SiseKesit x={560} y={1010} s={0.55} t={0} seviye={0.85} />
    <Bant x={470} y={1050} w={130} rot={-14} />
    <Merakli x={900} y={1820} s={0.6} t={0.3} hareket="sasir" kostum="onluk" />
  </g>
);
export const KAPAK_YAZI = { ust: "Ters ama akmıyor", buyuk: "ŞİŞE ÇİÇEĞİN SUSADIĞINI BİLİYOR MU?", alt: "Tatilde çiçek sulama sırrı" };
