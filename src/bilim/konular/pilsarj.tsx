// Konu 12/30 (Teknoloji): Telefonu %100 şarj etme — KOLAJ, derin sürüm. Ses: Kadir'in sesi (klon).
// Parçalar: public/bilim/pil-kolaj/*.png (scripts/kolaj_kes.py). ws("kelime") = sahne içindeki saniye.
import React from "react";
import { random } from "remotion";
import type { SceneProps } from "../BilimVideo";
import { Merakli } from "../merakli";
import { adim, geri, KIRMIZI, KolajDefs, KREM, Muhur, Serit, yap } from "../kolaj";
import { cl, INK, lerp } from "../kit";
import olcu from "../data/pil-kolaj-olcu.json";

type S = React.FC<SceneProps>;
const { Parca } = yap("pil-kolaj", olcu as Record<string, number>);
const YESIL = "#3fae6a";
const SARI = "#F2C14E";

/** Kâğıttan kesilmiş pil göstergesi. dolu: 0–1. */
const PilIkon: React.FC<{ x: number; y: number; s?: number; dolu: number; yazi?: string; renk?: string; bolge?: boolean; o?: number }> = ({ x, y, s = 1, dolu, yazi, renk, bolge, o = 1 }) => {
  const W = 360, H = 170;
  const r = renk || (dolu > 0.85 ? SARI : dolu < 0.2 ? KIRMIZI : YESIL);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#kgolge)" opacity={o}>
      <rect x={-W / 2 - 14} y={-H / 2 - 14} width={W + 28} height={H + 28} rx={30} fill={KREM} />
      <rect x={W / 2 + 10} y={-36} width={30} height={72} rx={10} fill={KREM} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={20} fill={INK} />
      <rect x={-W / 2 + 10} y={-H / 2 + 10} width={Math.max(0, (W - 20) * cl(dolu))} height={H - 20} rx={12} fill={r} />
      {bolge ? (
        <g>
          <rect x={-W / 2 + 10 + (W - 20) * 0.2} y={-H / 2 + 4} width={(W - 20) * 0.6} height={H - 8} rx={10} fill="none" stroke={KREM} strokeWidth={7} strokeDasharray="18 10" />
        </g>
      ) : null}
      {yazi ? (
        <text x={0} y={22} textAnchor="middle" fontSize={68} fontWeight={900} fill={KREM} stroke={INK} strokeWidth={8} paintOrder="stroke" style={{ fontFamily: "var(--font)" }}>{yazi}</text>
      ) : null}
    </g>
  );
};

/** Kâğıt iyon noktaları: k=0 karışık, k=1 hepsi sağ tarafa sıkışmış */
const Iyonlar: React.FC<{ t: number; k: number; cx: number; cy: number; kayip?: number }> = ({ t, k, cx, cy, kayip = 0 }) => {
  const n = 22;
  const tq = adim(t);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const x0 = cx - 240 + random(`ix${i}`) * 480;
        const y0 = cy - 150 + random(`iy${i}`) * 300;
        const x1 = cx + 90 + random(`jx${i}`) * 150;
        const y1 = cy - 140 + random(`jy${i}`) * 280;
        const kk = cl(k * 1.15 - random(`d${i}`) * 0.15);
        const gitti = i / n < kayip;
        const jx = Math.sin(tq * 9 + i) * 4;
        return gitti ? null : <circle key={i} cx={lerp(x0, x1, kk) + jx} cy={lerp(y0, y1, kk)} r={20} fill="#9ec5ff" stroke={INK} strokeWidth={5} />;
      })}
    </g>
  );
};

// 1 — Her gece %100 şarj ediyorsan pilini yoruyorsun
const Giris: S = ({ t, ws, ses }) => {
  const ty = ws("yoruyorsun");
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="sarj" x={700} y={700} w={420} rot={-18} />
      <Parca t={t} ad="telefon" x={430} y={330} w={420} rot={-6} />
      <PilIkon x={790} y={300} s={0.62} dolu={1} yazi="%100" />
      <Muhur t={t} a={ty - 0.1} text="PİLİ YORUYOR" x={540} y={1090} size={80} rot={-5} />
      <Merakli x={900} y={1180} s={0.5} t={t} hareket={t > ty ? "sasir" : "isaret"} kostum="kulaklik" agiz={ses(t)} flip />
    </g>
  );
};

// 2 — Lityum iyonları şarj olurken bir tarafa sıkışıyor
const Iyon: S = ({ t, ws }) => {
  const k = cl((adim(t) - (ws("sıkışıyor") - 1.2)) / 1.4);
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="pil" x={540} y={240} w={640} a={0.05} yon="alt" />
      <g filter="url(#kgolge)">
        <rect x={250} y={500} width={580} height={360} rx={30} fill={KREM} />
        <rect x={270} y={520} width={540} height={320} rx={22} fill={INK} />
        <line x1={540} y1={530} x2={540} y2={830} stroke={KREM} strokeWidth={6} strokeDasharray="16 12" />
      </g>
      <Iyonlar t={t} k={k} cx={540} cy={680} />
      <Serit t={t} a={ws("lityum") - 0.1} text="LİTYUM İYONLARI" y={1090} size={68} rot={-2} />
    </g>
  );
};

// 3 — %100'de en yüksek gerilim: şişirilmiş balon
const Balon: S = ({ t, ws }) => {
  const tb = ws("balon");
  const sis = 0.55 + 0.45 * geri(cl((adim(t) - (tb - 0.8)) / 1.0));
  return (
    <g>
      <KolajDefs />
      <PilIkon x={290} y={560} s={0.9} dolu={1} yazi="%100" />
      <g transform={`translate(780 640) scale(${sis}) translate(-780 -640)`}>
        <Parca t={t} ad="balon" x={780} y={300} w={400} rot={6} a={tb - 0.9} yon="pop" />
      </g>
      <Serit t={t} a={ws("gerilimde") - 0.1} text="EN YÜKSEK GERİLİM" y={1090} size={66} rot={2} bg={INK} color={KREM} />
    </g>
  );
};

// 4 — Gerginlik tepkimeleri hızlandırır, lityum kalıcı olarak gider
const Tepkime: S = ({ t, ws }) => {
  const tk = ws("kalıcı");
  const kayip = cl((adim(t) - (tk - 0.4)) / 1.6) * 0.45;
  const tq = adim(t);
  return (
    <g>
      <KolajDefs />
      <g filter="url(#kgolge)">
        <rect x={250} y={330} width={580} height={360} rx={30} fill={KREM} />
        <rect x={270} y={350} width={540} height={320} rx={22} fill={INK} />
      </g>
      <Iyonlar t={t} k={1} cx={540} cy={510} kayip={kayip} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = ws("tepkimeleri") - 0.2 + i * 0.35;
        if (tq < a) return null;
        const u = cl((tq - a) / 0.5);
        const x = 300 + random(`kv${i}`) * 480;
        const y = 380 + random(`kw${i}`) * 260;
        return <path key={i} d="M0 -40 L10 -10 L40 0 L10 10 L0 40 L-10 10 L-40 0 L-10 -10 Z" fill={SARI} stroke={INK} strokeWidth={4} transform={`translate(${x} ${y}) scale(${1.2 - u * 0.6})`} opacity={1 - u * 0.5} />;
      })}
      <Serit t={t} a={ws("gerginlik") - 0.1} text="KİMYASAL TEPKİMELER" y={830} size={60} rot={-2} />
      <Serit t={t} a={tk - 0.1} text="LİTYUM KALICI OLARAK GİDER" y={1090} size={56} rot={2} bg={KIRMIZI} color={KREM} />
    </g>
  );
};

// 5 — 1 yıl bekleme testi: dolu %80'e, %40'taki %96'ya
const Test: S = ({ t, ws }) => {
  const t1 = ws("beşte"), t2 = ws("%4'ü");
  const k1 = cl((adim(t) - (t1 - 0.8)) / 0.9);
  const k2 = cl((adim(t) - (t2 - 0.8)) / 0.9);
  return (
    <g>
      <KolajDefs />
      <Serit t={t} a={0.05} text="1 YIL BEKLETİLDİ (25°C)" y={300} size={56} rot={-2} bg={INK} color={KREM} />
      <Serit t={t} a={0.3} text="DOLU" x={540} y={470} size={52} rot={-2} />
      <PilIkon x={540} y={600} s={1} dolu={lerp(1, 0.8, k1)} renk={SARI} yazi={`%${Math.round(lerp(100, 80, k1))}`} />
      <Muhur t={t} a={t1 + 0.2} text="-%20" x={860} y={560} size={70} rot={-10} />
      <Serit t={t} a={ws("%40") - 0.1} text="%40'TA" x={540} y={790} size={52} rot={2} />
      <PilIkon x={540} y={920} s={1} dolu={lerp(1, 0.96, k2)} renk={YESIL} yazi={`%${Math.round(lerp(100, 96, k2))}`} o={adim(t) > ws("%40") - 0.1 ? 1 : 0} />
      <Muhur t={t} a={t2 + 0.2} text="-%4" x={860} y={880} size={70} rot={8} />
    </g>
  );
};

// 6 — Sıcaklık kaybı ikiye katlar: şarjda oyun, yastık altı
const Sicak: S = ({ t, ws }) => (
  <g>
    <KolajDefs />
    <Parca t={t} ad="termometre" x={230} y={230} w={220} rot={-8} a={ws("sıcaklık") - 0.15} yon="sol" />
    <Muhur t={t} a={ws("ikiye") - 0.1} text="×2" x={360} y={760} size={120} rot={-8} />
    <Parca t={t} ad="oyun" x={760} y={300} w={420} rot={8} a={ws("oyun") - 0.15} yon="sag" />
    <Parca t={t} ad="yastik" x={740} y={640} w={440} rot={-4} a={ws("yastık") - 0.15} yon="alt" />
    <Serit t={t} a={ws("yastık") + 0.1} text="YASTIK ALTINDA" x={740} y={930} size={46} rot={3} bg={INK} color={KREM} />
    <Serit t={t} a={ws("oyun") + 0.1} text="ŞARJDA OYUN" x={760} y={560} size={46} rot={-3} bg={INK} color={KREM} />
    <Serit t={t} a={ws("kötüsü") - 0.15} text="SICAK + DOLU = EN KÖTÜSÜ" y={1090} size={58} rot={-2} bg={KREM} />
  </g>
);

// 7 — Sıfıra kadar bitirmek de yorar; en rahat aralık %20–80
const Sifir: S = ({ t, ws }) => {
  const ty = ws("%20");
  const tq = adim(t);
  return (
    <g>
      <KolajDefs />
      {tq < ty - 0.1 ? <PilIkon x={540} y={560} s={1.2} dolu={0.04} yazi="%0" /> : <PilIkon x={540} y={560} s={1.2} dolu={0.8} yazi="%20–80" bolge />}
      <Muhur t={t} a={ws("yoruyor") - 0.1} text="O DA YORAR" x={540} y={330} size={84} rot={-6} />
      <Serit t={t} a={ty - 0.1} text="EN RAHAT BÖLGE" y={1090} size={68} rot={2} bg={INK} color={KREM} />
    </g>
  );
};

// 8 — Telefonun zaten biliyor: Ayarlar > Pil > Pil koruması, %80'de durdur
const Ayar: S = ({ t, ws }) => {
  const ta = ws("ayarlar");
  const tk = ws("koruması");
  const t80 = ws("%80'd");
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="telefon" x={300} y={260} w={420} rot={-6} a={0.05} yon="sol" />
      <Serit t={t} a={ta - 0.1} text="AYARLAR" x={760} y={330} size={54} rot={-2} />
      <Serit t={t} a={ta + 0.45} text="› PİL" x={760} y={450} size={54} rot={2} />
      <Serit t={t} a={tk - 0.25} text="› PİL KORUMASI" x={720} y={570} size={54} rot={-2} bg={INK} color={KREM} />
      <PilIkon x={540} y={850} s={0.95} dolu={0.8} yazi="%80" o={adim(t) > t80 - 0.15 ? 1 : 0} />
      <Muhur t={t} a={t80 + 0.1} text="%80'DE DUR" x={540} y={1090} size={74} rot={-4} />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, iyon: Iyon, balon: Balon, tepkime: Tepkime, test: Test, sicak: Sicak, sifir: Sifir, ayar: Ayar };

export const KAPAK: React.FC = () => (
  <g>
    <KolajDefs />
    <Parca t={0} ad="sarj" x={760} y={1250} w={420} rot={-18} />
    <Parca t={0} ad="telefon" x={330} y={1120} w={400} rot={-6} />
    <PilIkon x={760} y={1150} s={0.7} dolu={1} yazi="%100" />
    <Merakli x={900} y={1820} s={0.6} t={0.3} hareket="sasir" kostum="kulaklik" />
  </g>
);
export const KAPAK_YAZI = { ust: "Her gece", buyuk: "%100 ŞARJ ETME", alt: "Telefonundaki gizli ayar" };
