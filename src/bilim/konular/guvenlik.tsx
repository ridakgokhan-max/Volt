// Konu: Eski telefonu güvenlik kamerasına çevirmek (DIY, 4/30). ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, BLUE, Check, CHALK, cl, Cross, ez, GREEN, Glow, INK, Kisi, lerp, Phone, RED, sp, Tag } from "../kit";
import { Merakli } from "../merakli";
import { Pil, Saat, Termometre } from "../nesneler";
import { LottieKlip } from "../lottie";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };

/** Eski telefonun kameraya dönüşmüş hali: ekranda büyük lens + REC */
const KameraTel: React.FC<{ x: number; y: number; s?: number; t: number; k?: number; rec?: boolean }> = ({ x, y, s = 0.5, t, k = 1, rec = true }) => (
  <Phone cx={x} cy={y} s={s} screen="#11161f">
    <g transform={`scale(${k})`}>
      <circle r={110} fill="#1d2a3d" stroke="#5c7aa6" strokeWidth={12} />
      <circle r={70} fill="#0b111a" stroke="#9cc7ff" strokeWidth={8} />
      <circle r={30} fill="#2d5d9a" />
      <circle cx={-22} cy={-24} r={14} fill="#fff" opacity={0.7} />
    </g>
    {rec ? (
      <g opacity={k}>
        <circle cx={-90} cy={-230} r={20} fill={RED} opacity={Math.floor(t * 2.2) % 2 ? 1 : 0.25} />
        <text x={-55} y={-218} fontSize={40} fontWeight={900} fill="#fff" style={font}>REC</text>
      </g>
    ) : null}
  </Phone>
);

/** Yeni telefonun ekranında canlı görüntü (oda + kapı) */
const EkranTel: React.FC<{ x: number; y: number; s?: number; t: number; k?: number; kisi?: number }> = ({ x, y, s = 0.5, t, k = 1, kisi = -1 }) => (
  <Phone cx={x} cy={y} s={s} screen="#e9eef5">
    <g opacity={k}>
      <rect x={-148} y={-300} width={296} height={70} fill={BLUE} />
      <text x={0} y={-252} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff" style={font}>CANLI</text>
      <rect x={-120} y={-200} width={240} height={380} fill="#cfd8e3" stroke={INK} strokeWidth={5} />
      <rect x={-50} y={-90} width={100} height={270} fill="#a36a3a" stroke={INK} strokeWidth={5} />
      <circle cx={30} cy={50} r={8} fill={ACC} />
      {kisi >= 0 ? <g transform={`translate(${lerp(-170, 170, kisi)} 120) scale(0.35)`}><Kisi x={0} y={0} t={t} walk={1} color={INK} /></g> : null}
      <circle cx={95} cy={220} r={14} fill={RED} opacity={Math.floor(t * 2.2) % 2 ? 1 : 0.3} />
    </g>
  </Phone>
);

// ---------- 1 — Giriş: çekmeceden fırlayan telefon kameraya dönüşür ----------
const Giris: S = ({ t, ws, ses }) => {
  const tt = ws("telefon");
  const tk = ws("kamerası");
  const t5 = ws("5");
  const dr = ez((t - 0.1) / 0.5);
  const ph = sp(t, tt - 0.15, 9);
  const kam = sp(t, tk - 0.1, 10);
  return (
    <g>
      <g transform="translate(540 1000)">
        <rect x={-300} y={-120} width={600} height={260} rx={22} fill="#c98f5b" stroke={INK} strokeWidth={8} />
        <g transform={`translate(0 ${dr * 120})`}>
          <rect x={-280} y={-60} width={560} height={170} rx={14} fill="#d9a06a" stroke={INK} strokeWidth={7} />
          <rect x={-60} y={10} width={120} height={22} rx={11} fill={INK} />
        </g>
      </g>
      <g transform={`translate(540 ${lerp(980, 620, ez(ph))}) rotate(${(1 - ph) * 30 + Math.sin(t * 3) * 2})`} opacity={cl(ph * 2)}>
        <KameraTel x={0} y={0} s={0.62} t={t} k={kam} rec={t > tk} />
      </g>
      {t > tk ? <LottieKlip ad="kamera" x={720} y={300} w={300} h={300} t={t} bas={tk} /> : null}
      <Tag x={540} y={300} text="BEDAVA KAMERA" size={54} k={sp(t, ws("bedava"))} bg={GREEN} color="#fff" rot={-3} />
      <g opacity={ap(t, t5 - 0.2, 0.3)}>
        <Saat x={200} y={480} s={0.75} t={t - t5} hiz={10} />
        <text x={200} y={620} textAnchor="middle" fontSize={56} fontWeight={900} fill={INK} style={font}>5 dk</text>
      </g>
      <Merakli x={880} y={1235} s={0.62} t={t} hareket={t > tk ? "aha" : "sasir"} kostum="usta" agiz={ses(t)} />
    </g>
  );
};

// ---------- 2 — Kurulum: iki telefona aynı uygulama, aynı hesap ----------
const Kurulum: S = ({ t, ws, ses }) => {
  const ta = ws("alfred");
  const t2 = ws("aynı");
  const th = ws("hesapla");
  const bar = (a: number) => cl((t - a) / 1.4);
  const esle = sp(t, th, 9);
  const Uyg: React.FC<{ x: number; p: number; ad: string }> = ({ x, p, ad }) => (
    <g>
      <Phone cx={x} cy={720} s={0.55} screen="#f3f6fb">
        <rect x={-110} y={-200} width={220} height={220} rx={48} fill={BLUE} opacity={cl(p * 3)} />
        <circle cx={0} cy={-90} r={52} fill="#fff" opacity={cl(p * 3)} />
        <circle cx={0} cy={-90} r={26} fill={BLUE} opacity={cl(p * 3)} />
        <rect x={-110} y={80} width={220} height={26} rx={13} fill="#d4dce8" />
        <rect x={-110} y={80} width={220 * p} height={26} rx={13} fill={GREEN} />
        <text x={0} y={160} textAnchor="middle" fontSize={34} fontWeight={900} fill={INK} style={font}>{p >= 1 ? "KURULDU" : `%${Math.round(p * 100)}`}</text>
      </Phone>
      <Tag x={x} y={1010} text={ad} size={40} k={1} bg={x < 540 ? "#8a8f99" : ACC} color={x < 540 ? "#fff" : INK} />
    </g>
  );
  return (
    <g>
      <Uyg x={280} p={bar(0.2)} ad="ESKİ" />
      <g opacity={ap(t, t2 - 0.3, 0.3)}><Uyg x={800} p={bar(t2)} ad="YENİ" /></g>
      {t > ta - 0.1 ? <Tag x={280} y={340} text="ör. Alfred" size={42} k={sp(t, ta)} bg="#fff" rot={-4} /> : null}
      {esle > 0.02 ? (
        <g>
          <path d="M 380 640 Q 540 520 700 640" stroke={ACC} strokeWidth={10} fill="none" strokeDasharray="20 14" strokeDashoffset={-t * 80} opacity={esle} />
          <g transform={`translate(540 560) scale(${esle})`}>
            <circle r={58} fill={ACC} stroke={INK} strokeWidth={6} />
            <circle cy={-14} r={18} fill={INK} />
            <path d="M -30 34 Q 0 0 30 34" fill={INK} />
          </g>
          <Tag x={540} y={420} text="AYNI HESAP" size={44} k={esle} bg={GREEN} color="#fff" />
        </g>
      ) : null}
      <Merakli x={540} y={1240} s={0.45} t={t} hareket="anlat" kostum="usta" agiz={ses(t)} />
    </g>
  );
};

// ---------- 3 — Roller: eski = kamera, yeni = ekran ----------
const Roller: S = ({ t, ws, ses }) => {
  const tk = ws("kamera");
  const te = ws("ekran");
  const kk = sp(t, tk - 0.2, 9);
  const ek = sp(t, te - 0.2, 9);
  return (
    <g>
      <Glow cx={540} cy={720} r={460} id="rg" color="#4b7bd8" o={0.25} />
      <g transform={`translate(270 720) scale(${kk})`}><KameraTel x={0} y={0} s={0.6} t={t} /></g>
      <Tag x={270} y={1010} text="KAMERA" size={46} k={kk} bg={RED} color="#fff" rot={-3} />
      <g transform={`translate(810 720) scale(${ek})`}><EkranTel x={0} y={0} s={0.6} t={t} /></g>
      <Tag x={810} y={1010} text="EKRAN" size={46} k={ek} bg={BLUE} color="#fff" rot={3} />
      {[0, 1, 2].map((i) => {
        const u = ((t * 1.3 + i / 3) % 1);
        return t > te - 0.3 ? <path key={i} d={`M ${400 + u * 260} 700 q 15 20 0 40`} stroke={ACC} strokeWidth={8} fill="none" opacity={1 - u} /> : null;
      })}
      <Merakli x={540} y={1240} s={0.42} t={t} hareket="isaret" kostum="usta" agiz={ses(t)} />
    </g>
  );
};

// ---------- 4 — Soru: pil bitince? ----------
const Soru: S = ({ t, ws, ses }) => {
  const tp = ws("pil");
  const tf = ws("püf");
  const dolu = 1 - cl((t - tp) / 1.2) * 0.95;
  return (
    <g>
      <g transform={`translate(330 700) rotate(${Math.sin(t * 9) * (t > tp ? 3 : 0)})`}>
        <Pil x={0} y={0} s={1.6} dolu={dolu} />
      </g>
      <text x={330} y={1010} textAnchor="middle" fontSize={64} fontWeight={900} fill={dolu < 0.2 ? RED : INK} style={font}>%{Math.round(dolu * 100)}</text>
      <g transform={`translate(780 560) scale(${sp(t, 0.1, 8)}) rotate(${Math.sin(t * 4) * 6})`}>
        <text textAnchor="middle" fontSize={300} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={14} paintOrder="stroke" style={font}>?</text>
      </g>
      {t > tf - 0.1 ? <Tag x={760} y={760} text="PÜF NOKTASI" size={48} k={sp(t, tf)} bg={GREEN} color="#fff" rot={-4} /> : null}
      <Merakli x={760} y={1240} s={0.7} t={t} hareket={t > tf ? "aha" : "dusun"} kostum="usta" agiz={ses(t)} />
    </g>
  );
};

// ---------- 5 — Şarj: takılı kalsın ama gölgede, havadar ----------
const Sarj: S = ({ t, ws, ses }) => {
  const ts = ws("şarja");
  const tg = ws("güneş");
  const th = ws("havadar");
  return (
    <g>
      <g transform="translate(330 700)">
        <KameraTel x={0} y={0} s={0.5} t={t} />
        <path d={`M 0 165 C 0 260 -120 260 -140 ${lerp(420, 330, ez((t - ts) / 0.4))}`} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" opacity={ap(t, ts - 0.3, 0.3)} />
      </g>
      {t > ts ? <LottieKlip ad="sarj" x={110} y={850} w={220} h={220} t={t} bas={ts} dongu /> : null}
      <g transform="translate(800 470)" opacity={ap(t, tg - 0.3, 0.3)}>
        <circle r={70} fill={ACC} stroke={INK} strokeWidth={6} />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + t;
          return <path key={i} d={`M ${Math.cos(a) * 90} ${Math.sin(a) * 90} L ${Math.cos(a) * 125} ${Math.sin(a) * 125}`} stroke={ACC} strokeWidth={10} strokeLinecap="round" />;
        })}
        <Cross cx={0} cy={0} r={150} k={ap(t, tg + 0.2, 0.4)} sw={18} />
      </g>
      <g opacity={ap(t, th - 0.3, 0.3)}>
        {[0, 1, 2].map((i) => {
          const x = ((t * 260 + i * 150) % 520) + 560;
          return <path key={i} d={`M ${x} ${760 + i * 60} q 40 -26 80 0 t 80 0`} stroke="#5aa0d8" strokeWidth={9} fill="none" strokeLinecap="round" />;
        })}
        <Termometre x={960} y={820} s={0.7} seviye={0.25 + 0.03 * Math.sin(t * 3)} />
        <Tag x={780} y={1010} text="GÖLGE + HAVA" size={42} k={sp(t, th)} bg={GREEN} color="#fff" />
      </g>
    </g>
  );
};

// ---------- 6 — Yerleşim: kapıya ya da balkona ----------
const Yerlesim: S = ({ t, ws, ses }) => {
  const tk = ws("kapıya");
  const tb = ws("balkona");
  const aci = t < tb ? lerp(0, -28, ez((t - tk) / 0.5)) : lerp(-28, 28, ez((t - tb) / 0.5));
  return (
    <g>
      <g opacity={ap(t, tk - 0.3, 0.3)}>
        <rect x={120} y={420} width={260} height={480} rx={10} fill="#a36a3a" stroke={INK} strokeWidth={8} />
        <circle cx={340} cy={680} r={14} fill={ACC} stroke={INK} strokeWidth={4} />
        <Tag x={250} y={360} text="KAPI" size={44} k={sp(t, tk)} bg="#fff" />
      </g>
      <g opacity={ap(t, tb - 0.3, 0.3)}>
        <rect x={700} y={420} width={280} height={340} fill="#bfe3ff" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${710 + i * 65} 760 L ${710 + i * 65} 900`} stroke={INK} strokeWidth={8} />)}
        <path d="M 690 760 L 990 760 M 690 900 L 990 900" stroke={INK} strokeWidth={10} />
        <Tag x={840} y={360} text="BALKON" size={44} k={sp(t, tb)} bg="#fff" />
      </g>
      <g transform={`translate(540 1060) rotate(${aci})`}>
        <path d={`M 0 -40 L ${-260} -520 L ${260} -520 Z`} fill={ACC} opacity={0.18} />
        <KameraTel x={0} y={0} s={0.32} t={t} />
      </g>
      <Merakli x={900} y={1240} s={0.45} t={t} hareket="isaret" kostum="usta" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 7 — Bildirim: biri geçince telefon öter (açılışta da bu an gösterilir) ----------
const Bildirim: S = ({ t, ws, ses }) => {
  const tb = ws("bildirim");
  const ta = ws("algılamayı");
  const yuru = cl(t / Math.max(tb, 0.5));
  const x = lerp(-60, 620, yuru);
  const yakala = t > ta && x > 250;
  const ban = sp(t, tb, 9);
  return (
    <g>
      <rect x={60} y={360} width={620} height={620} rx={18} fill="#1a2433" stroke="#9cc7ff" strokeWidth={6} />
      <rect x={300} y={480} width={150} height={480} fill="#5a3b25" stroke="#0b111a" strokeWidth={6} />
      <g transform={`translate(${x} 960) scale(0.75)`}><Kisi x={0} y={0} t={t} walk={1} color={CHALK} mood={t > tb ? "surprised" : "neutral"} /></g>
      {yakala ? (
        <rect x={x - 90} y={640} width={180} height={340} fill="none" stroke={RED} strokeWidth={7} strokeDasharray="22 10" strokeDashoffset={-t * 60} />
      ) : null}
      {yakala ? <text x={x} y={625} textAnchor="middle" fontSize={34} fontWeight={900} fill={RED} style={font}>HAREKET</text> : null}
      <g transform={`translate(860 760) rotate(${t > tb ? Math.sin((t - tb) * 40) * 6 * Math.exp(-(t - tb) * 3) : 0})`}>
        <EkranTel x={0} y={0} s={0.5} t={t} kisi={yuru} />
        {ban > 0.02 ? (
          <g transform={`translate(0 ${-235 + (1 - ban) * -60})`} opacity={cl(ban * 2)}>
            <rect x={-160} y={-48} width={320} height={96} rx={22} fill="#fff" stroke={INK} strokeWidth={5} />
            <text x={-130} y={-6} fontSize={30} fontWeight={900} fill={INK} style={font}>Hareket algılandı!</text>
            <text x={-130} y={30} fontSize={24} fontWeight={700} fill="#666" style={font}>Kapı · şimdi</text>
          </g>
        ) : null}
      </g>
      {t > tb - 0.05 ? <LottieKlip ad="bildirim" x={700} y={260} w={320} h={320} t={t} bas={tb - 0.05} /> : null}
      <Merakli x={140} y={1240} s={0.5} t={t} hareket={t > tb ? "sasir" : "dur"} kostum="usta" agiz={ses(t)} />
    </g>
  );
};

// ---------- 8 — Sonuç: çöpten kurtuldu, eve göz ----------
const Sonuc: S = ({ t, ws, ses }) => {
  const tc = ws("çöpten");
  const tg = ws("göz");
  const gk = sp(t, tg - 0.1, 8);
  return (
    <g>
      {t > tc - 0.1 ? <LottieKlip ad="geri-donusum" x={90} y={330} w={400} h={400} t={t} bas={tc - 0.1} /> : null}
      <Tag x={290} y={780} text="ÇÖPTEN KURTULDU" size={40} k={sp(t, tc)} bg={GREEN} color="#fff" rot={-3} />
      <g transform={`translate(790 560) scale(${gk})`}>
        <path d="M -190 0 Q 0 -150 190 0 Q 0 150 -190 0 Z" fill="#fff" stroke={INK} strokeWidth={10} />
        <circle r={72} fill={BLUE} stroke={INK} strokeWidth={8} />
        <circle r={34} fill={INK} />
        <circle cx={-20} cy={-22} r={14} fill="#fff" />
      </g>
      <Tag x={790} y={780} text="BEDAVA GÖZ" size={44} k={sp(t, tg + 0.1)} bg={ACC} rot={3} />
      <Check cx={540} cy={960} s={0.8} k={ap(t, tg + 0.3, 0.4)} />
      <Merakli x={880} y={1240} s={0.6} t={t} hareket={t > tg ? "kahkaha" : "salla"} kostum="usta" agiz={ses(t)} />
    </g>
  );
};

// ---------- 9 — Yarın: kablosuz şarj ----------
const Yarin: S = ({ t, ws, ses }) => {
  const tk = ws("kablo");
  const tn = ws("nasıl");
  return (
    <g>
      <Tag x={540} y={330} text="YARIN" size={64} k={sp(t, 0.1)} bg={ACC} />
      <ellipse cx={540} cy={900} rx={230} ry={56} fill="#2a2f3a" stroke={CHALK} strokeWidth={6} />
      {[0, 1, 2].map((i) => {
        const u = ((t * 1.2 + i / 3) % 1);
        return <ellipse key={i} cx={540} cy={880 - u * 120} rx={150 + u * 60} ry={30 + u * 10} fill="none" stroke={ACC} strokeWidth={6} opacity={(1 - u) * 0.9} />;
      })}
      <g transform={`translate(540 ${700 + Math.sin(t * 3) * 10})`}><Phone cx={0} cy={0} s={0.42} screen={GREEN}>
        <path d="M 6 -70 L -40 20 L 0 20 L -14 100 L 44 -6 L 4 -6 Z" fill="#fff" />
      </Phone></g>
      <g opacity={ap(t, tk - 0.2, 0.3)}>
        <path d="M 160 1060 C 260 980 300 1080 380 1000" stroke={CHALK} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Cross cx={270} cy={1030} r={90} k={ap(t, tk, 0.35)} sw={14} />
      </g>
      <g transform={`translate(860 560) scale(${sp(t, tn - 0.1, 7)})`}>
        <text textAnchor="middle" fontSize={220} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={12} paintOrder="stroke" style={font}>?</text>
      </g>
      <Merakli x={880} y={1240} s={0.5} t={t} hareket={t > tn ? "sasir" : "anlat"} kostum="usta" agiz={ses(t)} ink={CHALK} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, kurulum: Kurulum, roller: Roller, soru: Soru, sarj: Sarj, yerlesim: Yerlesim, bildirim: Bildirim, sonuc: Sonuc, yarin: Yarin };

export const KAPAK: React.FC = () => (
  <g>
    <g transform="translate(560 800) rotate(-6)"><KameraTel x={0} y={0} s={0.85} t={0.1} /></g>
    <Arrow x0={220} y0={560} x1={380} y1={680} k={1} color={ACC} sw={12} />
    <Merakli x={250} y={1640} s={0.95} t={0.3} hareket="aha" kostum="usta" />
  </g>
);
export const KAPAK_YAZI = { ust: "Çekmecedeki eski telefon", buyuk: "KAMERA OLDU!", alt: "5 dakikada, bedava" };
