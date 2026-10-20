// Konu 9/30 (Kendin Yap) — Blender 3D sürümü. Sahneler Blender'da render edildi (public/bilim/cicek-3d/arka.mp4);
// burada sadece üstüne binen etiketler var. ws("kelime") = sahne içindeki saniye.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { GREEN, RED, sp, Tag } from "../kit";
import { KAPAK as Kapak2D, KAPAK_YAZI as KapakYazi2D } from "./cicek";

type S = React.FC<SceneProps>;
const BLUE = "#3b82c4";

const Etiket: React.FC<{ t: number; a: number; text: string; y?: number; bg?: string; color?: string; size?: number; rot?: number }> = ({ t, a, text, y = 360, bg, color, size = 54, rot = -2 }) =>
  t < a - 0.05 ? null : <Tag x={540} y={y} text={text} k={sp(t, a, 11)} bg={bg} color={color} size={size} rot={rot} />;

const Giris: S = ({ t, ws }) => <Etiket t={t} a={ws("kuruyacak") - 0.3} text="1 HAFTA SUSUZ" bg={RED} color="#fff" />;
const Cozum: S = ({ t, ws }) => <Etiket t={t} a={ws("pet") - 0.1} text="SADECE BİR PET ŞİŞE" />;
const Delik: S = ({ t, ws }) => <Etiket t={t} a={ws("delik") - 0.1} text="1-2 KÜÇÜK DELİK" y={330} />;
const Gom: S = ({ t, ws }) => (
  <g>
    <Etiket t={t} a={ws("doldur") - 0.1} text="SUYLA DOLDUR" y={330} bg={BLUE} color="#fff" />
    <Etiket t={t} a={ws("göm") - 0.1} text="5-6 cm GÖM" y={450} />
  </g>
);
const Soru: S = ({ t }) => <Etiket t={t} a={0.1} text="NEDEN BOŞALMIYOR?" size={60} />;
const Hava: S = ({ t, ws }) => (
  <g>
    <Etiket t={t} a={ws("giremiyor") - 0.2} text="İÇERİ HAVA GİREMİYOR" y={330} bg={BLUE} color="#fff" />
    <Etiket t={t} a={ws("boşluklardan") - 0.2} text="TOPRAK KURUYUNCA HAVA GİRER" y={450} size={46} />
  </g>
);
const Dene: S = ({ t, ws }) => <Etiket t={t} a={ws("büyükse") - 0.1} text="DELİK BÜYÜKSE 1 GÜNDE BİTER" bg={RED} color="#fff" size={46} />;
const Sonuc: S = ({ t, ws }) => <Etiket t={t} a={ws("ihtiyacı") - 0.2} text="KENDİ KENDİNE SULANIYOR" bg={GREEN} color="#fff" />;

export const SAHNE: Record<string, S> = { giris: Giris, cozum: Cozum, delik: Delik, gom: Gom, soru: Soru, hava: Hava, dene: Dene, sonuc: Sonuc };
export const KAPAK = Kapak2D;
export const KAPAK_YAZI = KapakYazi2D;
