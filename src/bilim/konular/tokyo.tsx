// Ara gönderi: Tokyo neden su basmıyor? (G-Cans yeraltı sel sistemi). ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ACC, ap, Arrow, BLUE, Check, CHALK, cl, Cross, ez, GREEN, Glow, INK, lerp, RED, sp, Tag, Txt } from "../kit";
import { Merakli } from "../merakli";
import { Saat } from "../nesneler";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };
const SU = "#3d8fe0";
const SU2 = "#7cc0ff";
const TOPRAK = ["#9b7653", "#8a6646", "#77573b", "#634830", "#523b27"];

/** Yağmur çizgileri (bir kutu içinde) */
const Yagmur: React.FC<{ x: number; y: number; w: number; h: number; t: number; n?: number; o?: number }> = ({ x, y, w, h, t, n = 26, o = 0.7 }) => (
  <g opacity={o}>
    {Array.from({ length: n }).map((_, i) => {
      const xx = x + ((i * 97.3) % w);
      const yy = y + ((t * 900 + i * 137) % h);
      return <line key={i} x1={xx} y1={yy} x2={xx - 10} y2={yy + 34} stroke="#dcecff" strokeWidth={4} strokeLinecap="round" />;
    })}
  </g>
);

/** Dalgalı su yüzeyi olan dikdörtgen su kütlesi */
const Su: React.FC<{ x: number; y: number; w: number; h: number; t: number; renk?: string }> = ({ x, y, w, h, t, renk = SU }) => {
  if (h <= 1) return null;
  const n = 8;
  let d = `M ${x} ${y + h} L ${x} ${y}`;
  for (let i = 0; i <= n; i++) {
    const xx = x + (w * i) / n;
    d += ` L ${xx} ${y + Math.sin(t * 4 + i * 1.3) * 6}`;
  }
  d += ` L ${x + w} ${y + h} Z`;
  return (
    <g>
      <path d={d} fill={renk} opacity={0.92} />
      <path d={`M ${x + 12} ${y + 14} L ${x + w * 0.4} ${y + 14}`} stroke="#fff" strokeOpacity={0.45} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** Yer altı kesiti: toprak katmanları */
const Toprak: React.FC<{ y0: number; y1?: number }> = ({ y0, y1 = 1400 }) => {
  const h = (y1 - y0) / TOPRAK.length;
  return (
    <g>
      {TOPRAK.map((c, i) => (
        <rect key={i} x={0} y={y0 + i * h} width={1080} height={h + 2} fill={c} />
      ))}
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 211) % 1080} cy={y0 + ((i * 89) % (y1 - y0))} r={4 + (i % 4) * 3} fill="#3a2a1c" opacity={0.25} />
      ))}
    </g>
  );
};

/** Basit bina silueti */
const Bina: React.FC<{ x: number; y: number; w: number; h: number; renk?: string; pencere?: boolean }> = ({ x, y, w, h, renk = "#5d6b82", pencere = true }) => (
  <g>
    <rect x={x} y={y - h} width={w} height={h} fill={renk} stroke={INK} strokeWidth={5} />
    {pencere
      ? Array.from({ length: Math.floor(h / 46) }).map((_, r) =>
          Array.from({ length: Math.max(1, Math.floor(w / 40)) }).map((__, c) => (
            <rect key={`${r}-${c}`} x={x + 12 + c * 40} y={y - h + 14 + r * 46} width={18} height={22} fill={ACC} opacity={0.75} />
          )))
      : null}
  </g>
);

// ---------- 1 — Giriş: İstanbul'da su yükseliyor, Tokyo kuru ----------
const Giris: S = ({ t, ws, ses }) => {
  const tt = ws("tokyoda");
  const tc = ws("çeviremiyor");
  const tn = ws("neden");
  const su = lerp(0.3, 0.62, ez(t / 4.5));
  const P = { y: 360, h: 760 };
  return (
    <g>
      {/* İstanbul paneli */}
      <g>
        <clipPath id="ist"><rect x={50} y={P.y} width={475} height={P.h} rx={30} /></clipPath>
        <g clipPath="url(#ist)">
          <rect x={50} y={P.y} width={475} height={P.h} fill="#7f8ea6" />
          <Bina x={70} y={P.y + P.h - 120} w={110} h={260} />
          <Bina x={190} y={P.y + P.h - 120} w={90} h={180} renk="#6b7891" />
          {/* taş kule */}
          <g transform={`translate(380 ${P.y + P.h - 120})`}>
            <rect x={-48} y={-360} width={96} height={360} fill="#9aa3b0" stroke={INK} strokeWidth={6} />
            <path d="M -62 -360 L 0 -470 L 62 -360 Z" fill="#3b4a66" stroke={INK} strokeWidth={6} />
            {[0, 1, 2].map((i) => <rect key={i} x={-12} y={-320 + i * 90} width={24} height={44} rx={12} fill={INK} />)}
          </g>
          <rect x={50} y={P.y + P.h - 120} width={475} height={120} fill="#5b5f66" />
          <Yagmur x={50} y={P.y} w={475} h={P.h} t={t} />
          <Su x={50} y={P.y + P.h * (1 - su)} w={475} h={P.h * su} t={t} />
          {/* suya gömülen araba */}
          <g transform={`translate(160 ${P.y + P.h - 150 + Math.sin(t * 2) * 6})`} opacity={0.9}>
            <rect x={-70} y={-40} width={140} height={46} rx={14} fill={RED} stroke={INK} strokeWidth={5} />
            <path d="M -40 -40 L -24 -72 L 30 -72 L 46 -40 Z" fill="#c7e3ff" stroke={INK} strokeWidth={5} />
          </g>
        </g>
        <rect x={50} y={P.y} width={475} height={P.h} rx={30} fill="none" stroke={INK} strokeWidth={8} />
        <Tag x={288} y={P.y + 60} text="İSTANBUL" size={44} k={1} bg="#fff" />
        <Tag x={288} y={P.y + 150} text="1942'DEN BERİ REKOR" size={30} k={sp(t, ws("1942") - 0.1)} bg={RED} color="#fff" rot={-3} />
      </g>
      {/* Tokyo paneli */}
      <g opacity={lerp(0.55, 1, ap(t, tt - 0.3, 0.4))}>
        <clipPath id="tok"><rect x={555} y={P.y} width={475} height={P.h} rx={30} /></clipPath>
        <g clipPath="url(#tok)">
          <rect x={555} y={P.y} width={475} height={P.h} fill="#8fa3c0" />
          <Bina x={575} y={P.y + P.h - 120} w={100} h={300} />
          <Bina x={900} y={P.y + P.h - 120} w={110} h={220} renk="#6b7891" />
          {/* kırmızı kafes kule */}
          <g transform={`translate(790 ${P.y + P.h - 120})`} stroke={RED} strokeWidth={8} fill="none" strokeLinejoin="round">
            <path d="M -80 0 L 0 -520 L 80 0" />
            {[0.2, 0.4, 0.6, 0.78].map((k, i) => <line key={i} x1={-80 * (1 - k)} y1={-520 * k} x2={80 * (1 - k)} y2={-520 * k} />)}
            <path d="M -64 -104 L 48 -208 M 64 -104 L -48 -208 M -48 -208 L 32 -312 M 48 -208 L -32 -312" strokeWidth={5} />
            <rect x={-26} y={-330} width={52} height={22} fill={CHALK} stroke={INK} strokeWidth={4} />
          </g>
          <rect x={555} y={P.y + P.h - 120} width={475} height={120} fill="#5b5f66" />
          {/* ızgaradan aşağı akan su */}
          {[640, 790, 950].map((x, i) => (
            <g key={i}>
              <rect x={x - 30} y={P.y + P.h - 128} width={60} height={14} fill={INK} />
              <path d={`M ${x} ${P.y + P.h - 108 + ((t * 120 + i * 30) % 80)} l 0 30`} stroke={SU2} strokeWidth={8} strokeLinecap="round" />
            </g>
          ))}
          <Yagmur x={555} y={P.y} w={475} h={P.h} t={t + 0.4} />
        </g>
        <rect x={555} y={P.y} width={475} height={P.h} rx={30} fill="none" stroke={INK} strokeWidth={8} />
        <Tag x={792} y={P.y + 60} text="TOKYO" size={44} k={1} bg="#fff" />
        <Tag x={792} y={P.y + 150} text="SOKAK KURU" size={34} k={sp(t, tc)} bg={GREEN} color="#fff" rot={3} />
      </g>
      <Check cx={950} cy={P.y + 260} s={0.7} k={ap(t, tc + 0.2, 0.4)} />
      <g transform={`translate(540 ${P.y + P.h / 2}) scale(${sp(t, tn - 0.15, 8)}) rotate(${Math.sin(t * 4) * 5})`}>
        <text textAnchor="middle" y={80} fontSize={260} fontWeight={900} fill={ACC} stroke={INK} strokeWidth={14} paintOrder="stroke" style={font}>?</text>
      </g>
      <Merakli x={540} y={1240} s={0.48} t={t} hareket={t > tn ? "dusun" : "sasir"} kostum="baret" agiz={ses(t)} />
    </g>
  );
};

// ---------- 2 — Cevap şehrin altında: kamera yerin 50 metre altına iniyor ----------
const Alt: S = ({ t, ws, ses }) => {
  const ta = ws("altında");
  const t50 = ws("50");
  const tt = ws("tüneli");
  const in_ = ez((t - ta + 0.2) / 2.6);
  const kay = in_ * 760;
  const derin = Math.round(50 * cl((t - ta + 0.2) / 2.6) * (t > t50 - 0.4 ? 1 : 0.8));
  const tun = sp(t, tt - 0.5, 10);
  return (
    <g>
      <g transform={`translate(0 ${-kay})`}>
        <rect x={0} y={0} width={1080} height={560} fill="#9cc6ef" />
        <Bina x={80} y={560} w={130} h={300} />
        <Bina x={240} y={560} w={110} h={220} renk="#6b7891" />
        <Bina x={700} y={560} w={140} h={340} />
        <Bina x={860} y={560} w={120} h={250} renk="#6b7891" />
        <rect x={0} y={540} width={1080} height={30} fill="#5b5f66" />
        <Toprak y0={570} y1={2200} />
        {/* tünel kesiti */}
        <g transform={`translate(560 ${1330}) scale(${tun})`}>
          <circle r={230} fill="#2a2f3a" stroke={INK} strokeWidth={10} />
          <circle r={190} fill="#11161f" stroke="#7a8597" strokeWidth={8} strokeDasharray="30 16" />
          <Su x={-180} y={60} w={360} h={110} t={t} />
          <ellipse cx={0} cy={0} rx={190} ry={190} fill="none" stroke={SU2} strokeOpacity={0.25} strokeWidth={30} />
        </g>
      </g>
      {/* derinlik cetveli */}
      <g opacity={ap(t, ta - 0.3, 0.3)}>
        <rect x={60} y={420} width={26} height={760} rx={13} fill="#fff" stroke={INK} strokeWidth={5} />
        <rect x={60} y={420} width={26} height={760 * in_} rx={13} fill={ACC} stroke={INK} strokeWidth={5} />
        <g transform={`translate(160 ${420 + 760 * in_})`}>
          <rect x={-20} y={-44} width={210} height={80} rx={20} fill={INK} />
          <text x={85} y={14} textAnchor="middle" fontSize={50} fontWeight={900} fill={ACC} style={font}>{`-${derin} m`}</text>
        </g>
      </g>
      <Tag x={600} y={380} text="TOKYO'NUN HEMEN DIŞI" size={38} k={sp(t, ws("dışında") - 0.2)} bg="#fff" rot={-2} />
      <Tag x={600} y={880} text="DÜNYANIN EN BÜYÜĞÜ" size={40} k={sp(t, ws("dünyanın") - 0.1)} bg={ACC} rot={-3} />
      <Tag x={600} y={960} text="SEL TÜNELİ" size={52} k={sp(t, tt)} bg={BLUE} color="#fff" rot={2} />
      <Merakli x={930} y={1240} s={0.45} t={t} hareket={t > tt ? "aha" : "isaret"} kostum="baret" agiz={ses(t)} flip ink={CHALK} />
    </g>
  );
};

const KX = [160, 350, 540, 730, 920];
const KUY = { y0: 520, y1: 1120, w: 120 };

/** Yüzeyde nehir + 5 kuyu (dolum oranlarıyla) */
const Kuyular: React.FC<{ t: number; dolu: (i: number) => number; sol?: (i: number) => number; tasma?: number }> = ({ t, dolu, sol = () => 1, tasma = 0 }) => (
  <g>
    <rect x={0} y={0} width={1080} height={KUY.y0 - 40} fill="#9cc6ef" />
    <Toprak y0={KUY.y0 - 40} y1={1400} />
    {/* nehir */}
    <Su x={0} y={KUY.y0 - 140 - tasma * 40} w={1080} h={100 + tasma * 40} t={t} />
    {KX.map((x, i) => {
      const d = cl(dolu(i));
      const h = KUY.y1 - KUY.y0;
      return (
        <g key={i} opacity={sol(i)}>
          <rect x={x - KUY.w / 2} y={KUY.y0} width={KUY.w} height={h} fill="#2a2f3a" stroke={INK} strokeWidth={8} />
          <Su x={x - KUY.w / 2 + 4} y={KUY.y1 - h * d} w={KUY.w - 8} h={h * d - 4} t={t + i} />
          {/* yukarıdan dökülen su */}
          {d > 0.01 && d < 0.98 ? <rect x={x - 18} y={KUY.y0 - 40} width={36} height={h * (1 - d) + 40} fill={SU2} opacity={0.75} /> : null}
        </g>
      );
    })}
  </g>
);

// ---------- 3 — Beş dev kuyu, her biri 70 m (20 katlı bina sığar) ----------
const Kuyu: S = ({ t, ws, ses }) => {
  const td = ws("dökülüyor");
  const tt = ws("taşmaya");
  const t5 = ws("5");
  const t70 = ws("70");
  const t20 = ws("20");
  const bina = ap(t, t20 - 0.3, 1.2);
  const kat = Math.round(20 * bina);
  return (
    <g>
      <Kuyular t={t} tasma={ap(t, tt - 0.2, 0.6)} dolu={(i) => (t - td + 0.9 - i * 0.18) / 1.8} sol={(i) => (i === 2 ? 1 : 1 - 0.65 * ap(t, t20 - 0.4, 0.4))} />
      <Tag x={540} y={340} text="5 DEV KUYU" size={54} k={sp(t, t5 - 0.1)} bg={ACC} rot={-2} />
      {/* 70 m ölçüsü */}
      <g opacity={ap(t, t70 - 0.2, 0.3)}>
        <Arrow x0={60} y0={KUY.y0} x1={60} y1={KUY.y1} k={ap(t, t70 - 0.2, 0.6)} color={CHALK} sw={10} />
        <Arrow x0={60} y0={KUY.y1} x1={60} y1={KUY.y0} k={ap(t, t70 - 0.2, 0.6)} color={CHALK} sw={10} />
      </g>
      <Tag x={180} y={(KUY.y0 + KUY.y1) / 2} text="70 M" size={48} k={sp(t, t70)} bg={RED} color="#fff" rot={-4} />
      {/* 20 katlı bina kuyunun içinde */}
      {bina > 0.01 ? (
        <g>
          <rect x={540 - 46} y={KUY.y1 - (KUY.y1 - KUY.y0) * 0.95 * bina} width={92} height={(KUY.y1 - KUY.y0) * 0.95 * bina} fill="#e9eef5" stroke={INK} strokeWidth={5} />
          {Array.from({ length: kat }).map((_, i) => (
            <line key={i} x1={500} x2={580} y1={KUY.y1 - 28.5 * (i + 1)} y2={KUY.y1 - 28.5 * (i + 1)} stroke="#9aa3b0" strokeWidth={4} />
          ))}
          <Tag x={800} y={760} text={`${kat} KAT`} size={60} k={sp(t, t20 - 0.1)} bg={GREEN} color="#fff" rot={3} />
        </g>
      ) : null}
      <Merakli x={900} y={1240} s={0.45} t={t} hareket={t > t20 ? "sasir" : "anlat"} kostum="baret" agiz={ses(t)} flip ink={CHALK} />
    </g>
  );
};

// ---------- 4 — Kuyular 6,3 km tünelle bağlı ----------
const Tunel: S = ({ t, ws, ses }) => {
  const t6 = ws("63");
  const tb = ws("birbirine");
  const ciz = ap(t, t6 - 0.4, 1.4);
  const km = (6.3 * ap(t, t6 - 0.2, 1.2)).toFixed(1).replace(".", ",");
  return (
    <g>
      <Kuyular t={t} dolu={() => 0.85} />
      <rect x={KX[0]} y={KUY.y1 - 10} width={(KX[4] - KX[0]) * ciz} height={110} fill="#2a2f3a" stroke={INK} strokeWidth={8} />
      <Su x={KX[0] + 4} y={KUY.y1 + 30} w={Math.max(0, (KX[4] - KX[0]) * ciz - 8)} h={66} t={t} />
      {ciz > 0.9
        ? [0, 1, 2, 3, 4, 5].map((i) => {
            const u = ((t * 0.6 + i / 6) % 1);
            return <Arrow key={i} x0={KX[0] + 40 + u * 650} y0={KUY.y1 + 60} x1={KX[0] + 100 + u * 650} y1={KUY.y1 + 60} color="#fff" sw={7} />;
          })
        : null}
      <Tag x={540} y={360} text={`${km} KM TÜNEL`} size={60} k={sp(t, t6 - 0.2)} bg={ACC} rot={-2} />
      <Tag x={540} y={1260} text="HEPSİ BİRBİRİNE BAĞLI" size={40} k={sp(t, tb)} bg={GREEN} color="#fff" />
    </g>
  );
};

// ---------- 5 — Dev depo: 59 sütun, her biri 500 ton ----------
const Depo: S = ({ t, ws, ses, ev }) => {
  const t59 = ws("59");
  const t500 = ws("500");
  const sayi = Math.round(59 * ap(t, t59 - 0.3, 1.0));
  const dus = ez((t - t500 + 0.35) / 0.35);
  const sutunlar: { x: number; y: number; s: number; i: number }[] = [];
  let n = 0;
  [0.55, 0.75, 1].forEach((s, r) => {
    const adet = [7, 6, 5][r];
    for (let c = 0; c < adet; c++) {
      sutunlar.push({ x: 540 + (c - (adet - 1) / 2) * 190 * s, y: [760, 900, 1090][r], s, i: n++ });
    }
  });
  return (
    <g>
      <rect x={0} y={300} width={1080} height={1000} fill="#2c3240" />
      <path d="M 0 1300 L 260 640 L 820 640 L 1080 1300 Z" fill="#3c4456" />
      <Su x={0} y={1180 - ap(t, 0.1, 2) * 60} w={1080} h={140 + ap(t, 0.1, 2) * 60} t={t} renk="#3373b8" />
      {sutunlar.map((p) => {
        const g = ap(t, 0.15 + p.i * 0.07, 0.3);
        const hh = 520 * p.s;
        return (
          <g key={p.i} opacity={g} transform={`translate(${p.x} ${p.y})`}>
            <rect x={-28 * p.s} y={-hh} width={56 * p.s} height={hh} fill="#c9ced8" stroke={INK} strokeWidth={5} />
            <rect x={-40 * p.s} y={-hh - 18 * p.s} width={80 * p.s} height={18 * p.s} fill="#aeb4c0" stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
      <Glow cx={540} cy={420} r={420} id="dg" color="#fff2c4" o={0.25} />
      <Merakli x={430} y={1150} s={0.18} t={t} hareket="sasir" kostum="baret" ink={CHALK} />
      <Tag x={540} y={360} text={`${sayi} SÜTUN`} size={60} k={sp(t, t59 - 0.3)} bg={ACC} rot={-2} />
      {t > t500 - 0.4 ? (
        <g transform={`translate(${540} ${lerp(200, 520, dus)})`}>
          <path d="M -120 0 L 120 0 L 90 -150 L -90 -150 Z" fill="#3a3f4a" stroke={INK} strokeWidth={8} />
          <circle cx={0} cy={-170} r={26} fill="none" stroke={INK} strokeWidth={10} />
          <text x={0} y={-50} textAnchor="middle" fontSize={56} fontWeight={900} fill={ACC} style={font}>500 TON</text>
        </g>
      ) : null}
      <Tag x={540} y={1260} text="HER BİRİ 500 TON" size={42} k={sp(t, t500 + 0.3)} bg={RED} color="#fff" />
    </g>
  );
};

/** Pervaneli pompa */
const Pompa: React.FC<{ x: number; y: number; t: number; hiz: number }> = ({ x, y, t, hiz }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-40} y={-80} width={300} height={160} rx={30} fill="#9aa3b0" stroke={INK} strokeWidth={7} />
    <circle r={78} fill="#e9eef5" stroke={INK} strokeWidth={7} />
    <g transform={`rotate(${t * hiz * 360})`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d="M 0 0 C 20 -20 40 -50 10 -66 C -6 -50 -6 -20 0 0" fill={BLUE} stroke={INK} strokeWidth={4} transform={`rotate(${i * 72})`} />
      ))}
      <circle r={12} fill={INK} />
    </g>
  </g>
);

// ---------- 6 — Uçak motorundan pompalar, saniyede 200 ton ----------
const Pompalar: S = ({ t, ws, ses }) => {
  const tu = ws("uçak");
  const tp = ws("pompalar");
  const t2 = ws("200");
  const hiz = 0.3 + 3 * ap(t, tp - 0.3, 1.2);
  const akis = ap(t, ws("suyu") - 0.3, 0.5);
  const ucak = ap(t, tu - 0.3, 0.6);
  const ton = Math.round(200 * ap(t, t2 - 0.3, 0.9));
  return (
    <g>
      {[520, 720, 920, 1120].map((y, i) => (
        <g key={i}>
          <Pompa x={170} y={y} t={t + i * 0.13} hiz={hiz} />
          {akis > 0.01 ? (
            <g>
              <rect x={430} y={y - 30} width={390 * akis} height={60} fill={SU} stroke={INK} strokeWidth={5} />
              {[0, 1, 2].map((j) => {
                const u = ((t * 1.6 + j / 3 + i * 0.1) % 1);
                return <path key={j} d={`M ${440 + u * 360 * akis} ${y - 10} l 30 10 l -30 10`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.8} />;
              })}
            </g>
          ) : null}
        </g>
      ))}
      {/* nehir */}
      <rect x={820} y={420} width={220} height={820} rx={20} fill={SU} stroke={INK} strokeWidth={7} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M 840 ${480 + ((t * 120 + i * 200) % 760)} q 40 -20 80 0 t 80 0`} stroke="#fff" strokeOpacity={0.6} strokeWidth={6} fill="none" />)}
      <Tag x={930} y={400} text="NEHİR" size={36} k={1} bg="#fff" />
      {/* uçak motoru */}
      <g transform={`translate(${lerp(-200, 560, ucak)} 330)`} opacity={cl(ucak * 2) * (1 - ap(t, tp + 0.6, 0.4))}>
        <path d="M -150 0 L 120 -14 Q 170 0 120 14 Z" fill="#e9eef5" stroke={INK} strokeWidth={6} />
        <path d="M -10 -6 L -80 -90 L -40 -90 L 50 -8 Z M -10 6 L -80 90 L -40 90 L 50 8 Z" fill="#c9ced8" stroke={INK} strokeWidth={5} />
        <ellipse cx={-30} cy={34} rx={36} ry={16} fill="#5d6b82" stroke={INK} strokeWidth={4} />
      </g>
      <Tag x={540} y={420} text="UÇAK MOTORUNDAN" size={40} k={sp(t, tu) * (1 - ap(t, t2 - 0.3, 0.3))} bg="#fff" rot={-2} />
      <g transform={`translate(560 ${1270}) scale(${sp(t, t2 - 0.3, 9)})`}>
        <rect x={-300} y={-70} width={600} height={130} rx={65} fill={ACC} stroke={INK} strokeWidth={8} />
        <text x={0} y={22} textAnchor="middle" fontSize={68} fontWeight={900} fill={INK} style={font}>{`${ton} TON / SN`}</text>
      </g>
    </g>
  );
};

// ---------- 7 — Olimpik havuz 13 saniyede boşalır ----------
const Havuz: S = ({ t, ws, ses }) => {
  const to = ws("olimpik");
  const t13 = ws("13");
  const bas = to + 0.3;
  const bos = cl((t - bas) / 2.6);
  const sn = Math.min(13, Math.round(13 * bos));
  return (
    <g>
      <g transform="translate(540 760)">
        <rect x={-420} y={-300} width={840} height={600} rx={24} fill="#e9eef5" stroke={INK} strokeWidth={10} />
        <rect x={-396} y={-276} width={792} height={552} fill="#b9c6d6" />
        <Su x={-396} y={-276 + 552 * bos} w={792} h={552 * (1 - bos)} t={t} renk="#48a6ea" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={i} x1={-396} x2={396} y1={-276 + i * 69} y2={-276 + i * 69} stroke={i % 2 ? RED : "#fff"} strokeWidth={6} strokeDasharray="22 14" opacity={0.85} />
        ))}
        {bos > 0.02 && bos < 0.99 ? <circle cx={0} cy={260} r={40 + 10 * Math.sin(t * 12)} fill="none" stroke="#fff" strokeWidth={6} opacity={0.7} /> : null}
      </g>
      <Tag x={540} y={360} text="OLİMPİK HAVUZ" size={52} k={sp(t, to - 0.2)} bg="#fff" rot={-2} />
      <Saat x={260} y={1180} s={0.8} t={t - bas} hiz={6} />
      <g transform={`translate(560 1190) scale(${sp(t, t13 - 0.4, 9)})`}>
        <rect x={-130} y={-70} width={300} height={130} rx={30} fill={INK} />
        <text x={20} y={26} textAnchor="middle" fontSize={84} fontWeight={900} fill={ACC} style={font}>{`${sn} sn`}</text>
      </g>
      <Check cx={880} cy={1180} s={0.75} k={ap(t, bas + 2.7, 0.4)} />
    </g>
  );
};

// ---------- 8 — Yılda ortalama 8 kez ----------
const Takvim: S = ({ t, ws, ses }) => {
  const t8 = ws("8");
  const aylar = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"];
  const yagis = [2, 4, 5, 6, 7, 8, 9, 10]; // örnek dağılım: yağışlı aylarda
  return (
    <g>
      <rect x={110} y={380} width={860} height={820} rx={34} fill="#fff" stroke={INK} strokeWidth={10} />
      <rect x={110} y={380} width={860} height={120} rx={34} fill={RED} stroke={INK} strokeWidth={10} />
      <Txt x={540} y={462} text="1 YIL" size={64} color="#fff" />
      {aylar.map((a, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const x = 210 + c * 220;
        const y = 600 + r * 210;
        const s = yagis.indexOf(i);
        const k = s >= 0 ? sp(t, t8 - 0.6 + s * 0.16, 9) : 0;
        return (
          <g key={i}>
            <rect x={x - 90} y={y - 80} width={180} height={170} rx={20} fill="#eef2f7" stroke={INK} strokeWidth={5} />
            <text x={x} y={y - 38} textAnchor="middle" fontSize={34} fontWeight={900} fill="#7a8597" style={font}>{a}</text>
            <g transform={`translate(${x} ${y + 30}) scale(${k})`}>
              <path d="M 0 -50 C 24 -16 34 2 34 18 C 34 38 18 52 0 52 C -18 52 -34 38 -34 18 C -34 2 -24 -16 0 -50 Z" fill={SU} stroke={INK} strokeWidth={5} />
            </g>
          </g>
        );
      })}
      <Tag x={540} y={1270} text="YILDA ~8 KEZ" size={56} k={sp(t, t8 + 0.6)} bg={ACC} />
      <Merakli x={960} y={1240} s={0.4} t={t} hareket="anlat" kostum="baret" agiz={ses(t)} flip />
    </g>
  );
};

// ---------- 9 — Terazi: maliyet vs. 50 yılda önlenen zarar (3 kat) ----------
const Terazi: S = ({ t, ws, ses }) => {
  const t50 = ws("50");
  const t3 = ws("3");
  const egim = lerp(0, 16, ez((t - t3 + 0.2) / 0.7));
  const Para: React.FC<{ x: number; y: number; n: number; k: number }> = ({ x, y, n, k }) => (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i} opacity={ap(k, i * 0.25, 0.2)}>
          <ellipse cx={x + ((i % 3) - 1) * 70} cy={y - Math.floor(i / 3) * 34} rx={52} ry={18} fill={ACC} stroke={INK} strokeWidth={5} />
        </g>
      ))}
    </g>
  );
  const kol = 330;
  const rad = (egim * Math.PI) / 180;
  const lx = 540 - kol * Math.cos(rad);
  const ly = 560 - kol * Math.sin(rad);
  const rx = 540 + kol * Math.cos(rad);
  const ry = 560 + kol * Math.sin(rad);
  return (
    <g>
      <path d="M 540 560 L 540 1150 M 420 1150 L 660 1150" stroke={INK} strokeWidth={18} strokeLinecap="round" />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <circle cx={540} cy={560} r={22} fill={ACC} stroke={INK} strokeWidth={6} />
      {[[lx, ly, 1, "MALİYET"], [rx, ry, 3, "ÖNLENEN ZARAR"]].map(([x, y, n, ad], i) => (
        <g key={i}>
          <path d={`M ${x} ${y} L ${(x as number) - 140} ${(y as number) + 230} M ${x} ${y} L ${(x as number) + 140} ${(y as number) + 230}`} stroke={INK} strokeWidth={5} />
          <path d={`M ${(x as number) - 170} ${(y as number) + 230} Q ${x} ${(y as number) + 320} ${(x as number) + 170} ${(y as number) + 230} Z`} fill="#c9ced8" stroke={INK} strokeWidth={7} />
          <Para x={x as number} y={(y as number) + 210} n={(n as number) * 3} k={i === 0 ? t - 0.2 : t - t3 + 0.6} />
          <Tag x={x as number} y={(y as number) + 350} text={ad as string} size={30} k={1} bg="#fff" />
        </g>
      ))}
      <Tag x={540} y={380} text="50 YILDA" size={54} k={sp(t, t50 - 0.2)} bg="#fff" rot={-2} />
      <Tag x={820} y={470} text="3 KAT" size={64} k={sp(t, t3)} bg={GREEN} color="#fff" rot={4} />
    </g>
  );
};

// ---------- 10 — Sonuç: sel kader değil, altyapı. Sence İstanbul'a? ----------
const Sonuc: S = ({ t, ws, ses }) => {
  const tk = ws("kader");
  const ta = ws("altyapı");
  const ts = ws("sence");
  const ty = ws("yorumlara");
  const ciz = ap(t, ta - 0.2, 1.2);
  return (
    <g>
      <rect x={0} y={300} width={1080} height={500} fill="#f6c99a" opacity={0.0} />
      {/* İstanbul silueti */}
      <g transform="translate(0 760)" fill="#3b4a66" stroke={INK} strokeWidth={5}>
        <rect x={0} y={-60} width={1080} height={60} />
        <path d="M 330 -60 Q 330 -200 470 -200 Q 610 -200 610 -60 Z" />
        <rect x={455} y={-240} width={30} height={50} />
        <rect x={300} y={-330} width={22} height={270} />
        <path d="M 296 -330 L 311 -380 L 326 -330 Z" />
        <rect x={620} y={-330} width={22} height={270} />
        <path d="M 616 -330 L 631 -380 L 646 -330 Z" />
        <rect x={80} y={-170} width={120} height={110} />
        <rect x={760} y={-200} width={70} height={140} />
        <rect x={840} y={-150} width={150} height={90} />
        <g transform="translate(140 -170)">
          <rect x={-30} y={-180} width={60} height={180} fill="#9aa3b0" />
          <path d="M -40 -180 L 0 -250 L 40 -180 Z" />
        </g>
      </g>
      <Toprak y0={760} y1={1300} />
      {/* çizilen tünel hattı */}
      <rect x={90} y={1000} width={900 * ciz} height={90} rx={45} fill="#2a2f3a" stroke={INK} strokeWidth={7} />
      <Su x={110} y={1030} w={Math.max(0, 860 * ciz)} h={46} t={t} />
      {[200, 540, 880].map((x, i) => (
        <rect key={i} x={x - 30} y={760} width={60} height={240 * ap(t, ta + i * 0.2, 0.5)} fill="#2a2f3a" stroke={INK} strokeWidth={5} />
      ))}
      <g>
        <Tag x={300} y={400} text="KADER" size={60} k={sp(t, tk - 0.2) * (1 - ap(t, ts - 0.2, 0.3))} bg="#fff" rot={-3} />
        <Cross cx={300} cy={400} r={110} k={ap(t, tk + 0.3, 0.35) * (1 - ap(t, ts - 0.2, 0.3))} sw={16} />
        <Tag x={760} y={420} text="ALTYAPI" size={64} k={sp(t, ta) * (1 - ap(t, ts - 0.2, 0.3))} bg={GREEN} color="#fff" rot={3} />
      </g>
      {/* soru balonu */}
      <g transform={`translate(540 430) scale(${sp(t, ts - 0.1, 9)})`}>
        <path d="M -330 -110 L 330 -110 Q 370 -110 370 -70 L 370 70 Q 370 110 330 110 L 40 110 L -20 170 L -10 110 L -330 110 Q -370 110 -370 70 L -370 -70 Q -370 -110 -330 -110 Z" fill="#fff" stroke={INK} strokeWidth={8} />
        <text x={0} y={-12} textAnchor="middle" fontSize={50} fontWeight={900} fill={INK} style={font}>İstanbul'a da</text>
        <text x={0} y={56} textAnchor="middle" fontSize={50} fontWeight={900} fill={RED} style={font}>gerekir mi?</text>
      </g>
      <Tag x={540} y={1240} text="YORUMLARA YAZ" size={50} k={sp(t, ty - 0.1)} bg={ACC} rot={-2} />
      <Merakli x={920} y={1240} s={0.45} t={t} hareket={t > ty ? "isaret" : t > ts ? "dusun" : "anlat"} kostum="baret" agiz={ses(t)} flip />
    </g>
  );
};

export const SAHNE: Record<string, S> = { giris: Giris, alt: Alt, kuyu: Kuyu, tunel: Tunel, depo: Depo, pompa: Pompalar, havuz: Havuz, takvim: Takvim, terazi: Terazi, sonuc: Sonuc };

export const KAPAK: React.FC = () => (
  <g>
    <g transform="translate(0 260)">
      <rect x={0} y={560} width={1080} height={900} fill="#77573b" />
      <rect x={0} y={520} width={1080} height={50} fill="#5b5f66" />
      {[200, 380, 560, 740, 920].map((x, i) => (
        <g key={i}>
          <rect x={x - 55} y={570} width={110} height={560} fill="#2a2f3a" stroke={INK} strokeWidth={8} />
          <rect x={x - 51} y={570 + 560 * (0.35 + (i % 2) * 0.1)} width={102} height={560 * (0.65 - (i % 2) * 0.1)} fill={SU} />
        </g>
      ))}
      <rect x={140} y={1120} width={840} height={100} fill="#2a2f3a" stroke={INK} strokeWidth={8} />
      <rect x={146} y={1150} width={828} height={64} fill={SU} />
    </g>
    <Merakli x={880} y={1640} s={0.9} t={0.3} hareket="sasir" kostum="baret" />
  </g>
);
export const KAPAK_YAZI = { ust: "Dün İstanbul'u su bastı", buyuk: "TOKYO'YU NEDEN BASMIYOR?", alt: "Yerin 50 metre altındaki sır" };
