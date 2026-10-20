// Konu 8/30 (Teknoloji): GPS — KOLAJ sürümü. Ses, altyazı, CTA aynı; görseller CC0/kamu malı foto kolajı.
// Parçalar: public/bilim/gps-kolaj/*.png (scripts/kolaj_kes.py). ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { Merakli } from "../merakli";
import { adim, Halka, Igne, KIRMIZI, KolajDefs, KREM, Muhur, Serit, yap } from "../kolaj";
import { cl, INK, lerp } from "../kit";
import olcu from "../data/gps-kolaj-olcu.json";

type S = React.FC<SceneProps>;
const { Parca } = yap("gps-kolaj", olcu as Record<string, number>);
const MAVI = "#2E5C9A";

/** Kâğıt noktalardan sinyal yolu (a → b), noktalar adım adım akar */
const Yol: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; o?: number }> = ({ x1, y1, x2, y2, t, o = 1 }) => {
  const tq = adim(t);
  const n = 9;
  return (
    <g opacity={o}>
      {Array.from({ length: n }).map((_, i) => {
        const u = ((i / n + tq * 0.6) % 1);
        return <circle key={i} cx={lerp(x1, x2, u)} cy={lerp(y1, y2, u)} r={11} fill={KREM} stroke={INK} strokeWidth={3} />;
      })}
    </g>
  );
};

// 1 — Telefonun 20.000 km yukarıyı dinliyor, internet gerekmez
const Giris: S = ({ t, ws, ses }) => {
  const ti = ws("internete");
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="dunya" x={540} y={900} w={1000} />
      <Yol x1={800} y1={420} x2={430} y2={820} t={t} />
      <Parca t={t} ad="uydu" x={780} y={230} w={480} rot={-8} />
      <Parca t={t} ad="telefon" x={420} y={600} w={290} rot={6} />
      <Serit t={t} a={0} text="20.000 KM" x={300} y={330} size={64} rot={-5} bg={INK} color={KREM} />
      <Muhur t={t} a={ti - 0.1} text="İNTERNET YOK" x={560} y={1090} size={78} rot={-6} />
      <Merakli x={900} y={1180} s={0.55} t={t} hareket={t > ti ? "sasir" : "isaret"} kostum="kulaklik" agiz={ses(t)} flip />
    </g>
  );
};

// 2 — Dünyanın etrafında 30'dan fazla GPS uydusu
const Uydular: S = ({ t, ws }) => {
  const tq = adim(t);
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="dunya" x={540} y={420} w={720} a={0.05} yon="pop" />
      {[0, 1, 2, 3, 4].map((i) => {
        const aci = tq * 0.55 + (i * Math.PI * 2) / 5;
        const x = 540 + Math.cos(aci) * 430;
        const y = 760 + Math.sin(aci) * 300;
        return <Parca key={i} t={t} ad="uydu" x={x} y={y - 80} w={230} rot={(i % 2 ? 10 : -10)} a={0.25 + i * 0.12} yon="pop" flip={i % 2 === 1} />;
      })}
      <Serit t={t} a={ws("30'dan") - 0.1} text="30+ GPS UYDUSU" y={1100} size={70} rot={2} />
    </g>
  );
};

// 3 — Her biri yayınlıyor: Ben buradayım ve saat tam olarak şu
const Yayin: S = ({ t, ws }) => (
  <g>
    <KolajDefs />
    <Halka x={540} y={400} t={t} buyuk={330} />
    <Parca t={t} ad="uydu" x={540} y={290} w={620} a={0.05} yon="ust" />
    <Serit t={t} a={ws("buradayım") - 0.15} text="BEN BURADAYIM" x={400} y={880} size={66} rot={-3} bg={INK} color={KREM} />
    <Parca t={t} ad="saat" x={800} y={700} w={270} rot={8} a={ws("saat") - 0.15} yon="sag" />
    <Serit t={t} a={ws("saat") + 0.2} text="SAAT TAM OLARAK ŞU" x={480} y={1100} size={60} rot={2} />
  </g>
);

// 4 — Sinyalin geliş süresinden uzaklık
const Sure: S = ({ t, ws }) => {
  const tu = ws("uzaklığı");
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="uydu" x={780} y={250} w={420} rot={-10} a={0.05} yon="sag" />
      <Yol x1={800} y1={420} x2={360} y2={700} t={t} />
      <Parca t={t} ad="telefon" x={330} y={560} w={300} rot={-6} a={0.1} yon="sol" />
      <Parca t={t} ad="kronometre" x={760} y={700} w={300} rot={10} a={ws("sürede") - 0.15} yon="pop" />
      <Serit t={t} a={tu - 0.1} text="SÜRE → UZAKLIK" y={1100} size={72} rot={-2} />
    </g>
  );
};

// 5 — 4 uydu birleşince birkaç metre
const Dort: S = ({ t, ws }) => {
  const t4 = ws("4");
  const yerler: [number, number, number][] = [[200, 200, -12], [880, 200, 10], [200, 880, 8], [880, 890, -8]];
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="harita" x={540} y={330} w={900} rot={-2} a={0.05} yon="alt" />
      {yerler.map(([x, y, r], i) => (
        <Parca key={i} t={t} ad="uydu" x={x} y={y} w={250} rot={r} a={t4 + i * 0.2} yon={i % 2 ? "sag" : "sol"} d={0.3} flip={i % 2 === 1} />
      ))}
      {adim(t) > ws("birleştirince") - 0.1 ? <Igne x={540} y={760} s={1.1} /> : null}
      <Serit t={t} a={ws("birkaç") - 0.1} text="4 UYDU = BİRKAÇ METRE" y={1110} size={62} rot={2} bg={INK} color={KREM} />
    </g>
  );
};

// 6 — Peki işin en şaşırtıcı kısmı ne?
const Soru: S = ({ t, ses }) => (
  <g>
    <KolajDefs />
    <Serit t={t} a={0.05} text="EN ŞAŞIRTICI KISIM?" y={360} size={72} rot={-3} />
    <Parca t={t} ad="telefon" x={330} y={560} w={380} rot={-8} a={0.15} yon="sol" />
    <Parca t={t} ad="uydu" x={760} y={500} w={340} rot={8} a={0.3} yon="sag" />
    <Muhur t={t} a={0.6} text="?" x={560} y={940} size={180} rot={10} />
    <Merakli x={430} y={1180} s={0.75} t={t} hareket="sasir" kostum="kulaklik" agiz={ses(t)} />
  </g>
);

// 7 — Uydu saatleri günde 38 mikrosaniye hızlı
const Saatler: S = ({ t, ws }) => {
  const te = ws("einstein");
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="saat" x={280} y={220} w={280} rot={-6} a={0.05} yon="sol" />
      <Serit t={t} a={0.3} text="UZAYDA" x={280} y={590} size={52} rot={-3} bg={INK} color={KREM} />
      <Parca t={t} ad="saat" x={800} y={220} w={280} rot={6} a={0.2} yon="sag" flip />
      <Serit t={t} a={0.45} text="YERDE" x={800} y={590} size={52} rot={3} />
      <Parca t={t} ad="einstein" x={540} y={640} w={290} rot={-3} a={te - 0.15} yon="alt" />
      <Muhur t={t} a={ws("38") - 0.1} text="+38 µs / GÜN" x={540} y={1100} size={74} rot={-4} />
    </g>
  );
};

// 8 — Düzeltilmeseydi konum kilometrelerce kayardı
const Kayma: S = ({ t, ws }) => {
  const tk = ws("kilometrelerce");
  const k = cl((adim(t) - (tk - 0.8)) / 1.6);
  const x = lerp(400, 820, k);
  const y = lerp(960, 680, k);
  return (
    <g>
      <KolajDefs />
      <Parca t={t} ad="harita" x={540} y={380} w={920} rot={2} a={0.05} yon="alt" />
      <circle cx={400} cy={960} r={26} fill="#3fae6a" stroke={KREM} strokeWidth={8} opacity={k > 0.02 ? 1 : 0} />
      {k > 0.02 ? <line x1={400} y1={960} x2={x} y2={y} stroke={KIRMIZI} strokeWidth={10} strokeDasharray="22 16" /> : null}
      <Igne x={x} y={y} s={1} />
      <Serit t={t} a={tk - 0.1} text="HER GÜN KİLOMETRELERCE KAYMA" y={330} size={50} rot={-2} bg={KIRMIZI} color={KREM} />
    </g>
  );
};

// 9 — Cebindeki harita Einstein'a teşekkür borçlu
const Sonuc: S = ({ t, ws }) => (
  <g>
    <KolajDefs />
    <Parca t={t} ad="einstein" x={720} y={300} w={400} rot={4} a={0.05} yon="sag" />
    <Parca t={t} ad="telefon" x={330} y={420} w={320} rot={-8} a={0.2} yon="sol" />
    <Serit t={t} a={ws("teşekkür") - 0.1} text="TEŞEKKÜRLER EINSTEIN" y={890} size={62} rot={-2} bg={INK} color={KREM} />
  </g>
);

export const SAHNE: Record<string, S> = { giris: Giris, uydular: Uydular, yayin: Yayin, sure: Sure, dort: Dort, soru: Soru, saatler: Saatler, kayma: Kayma, sonuc: Sonuc };

export const KAPAK: React.FC = () => (
  <g>
    <KolajDefs />
    <Parca t={0} ad="dunya" x={540} y={1330} w={1150} />
    <Parca t={0} ad="uydu" x={780} y={1130} w={420} rot={-8} />
    <Parca t={0} ad="telefon" x={270} y={1150} w={260} rot={6} />
    <Merakli x={900} y={1820} s={0.6} t={0.3} hareket="sasir" kostum="kulaklik" />
  </g>
);
export const KAPAK_YAZI = { ust: "İnternet olmadan bile", buyuk: "TELEFONUN UZAYI DİNLİYOR", alt: "GPS'in Einstein sırrı" };
export const KOLAJ_RENK = MAVI;
