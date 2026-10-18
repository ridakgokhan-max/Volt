// Canva demosu: sahne görselleri Canva'da üretildi (public/bilim/canva-demo/*.jpg); burada sadece Meraklı ve küçük vurgular var.
import React from "react";
import type { SceneProps } from "../BilimVideo";
import { ap, CHALK, INK, RED, sp } from "../kit";
import { Merakli } from "../merakli";

type S = React.FC<SceneProps>;
const font = { fontFamily: "var(--font)" };

const Etiket: React.FC<{ x: number; y: number; t: number; a: number; yazi: string; renk?: string }> = ({ x, y, t, a, yazi, renk = RED }) => {
  const k = sp(t, a, 12);
  if (k <= 0.01) return null;
  const w = yazi.length * 34 + 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${k}) rotate(-3)`}>
      <rect x={-w / 2} y={-46} width={w} height={92} rx={20} fill={renk} stroke={INK} strokeWidth={6} />
      <text x={0} y={18} textAnchor="middle" fontSize={54} fontWeight={900} fill="#fff" style={font}>{yazi}</text>
    </g>
  );
};

const Giris: S = ({ t, ws, ses }) => (
  <g>
    <Etiket x={760} y={560} t={t} a={ws("yoktu") - 0.2} yazi="AÇACAK YOK!" />
    <Merakli x={200} y={1240} s={0.5} t={t} hareket="sasir" duygu="surprised" kostum="sapka" ink={CHALK} agiz={ses(t)} />
  </g>
);
const Cizelge: S = ({ t, ses }) => (
  <g>
    <Merakli x={200} y={1240} s={0.5} t={t} hareket="anlat" kostum="sapka" agiz={ses(t)} />
  </g>
);
const Patent: S = ({ t, ws, ses }) => (
  <g>
    <Etiket x={540} y={300} t={t} a={ws("patentlendi") - 0.1} yazi="PATENT · 1810" />
    <Merakli x={900} y={1240} s={0.5} t={t} hareket="isaret" flip kostum="sapka" ink={CHALK} agiz={ses(t)} />
  </g>
);
const Amac: S = ({ t, ses }) => (
  <g>
    <Merakli x={200} y={1240} s={0.5} t={t} hareket="anlat" duygu="happy" kostum="sapka" ink={CHALK} agiz={ses(t)} />
  </g>
);
const Agir: S = ({ t, ws, ses }) => (
  <g opacity={ap(t, 0, 0.2)}>
    <Etiket x={760} y={420} t={t} a={ws("ağırdı") - 0.1} yazi="ÇOK AĞIR!" />
    <Merakli x={200} y={1240} s={0.5} t={t} hareket="sasir" duygu="scared" kostum="sapka" ink={CHALK} agiz={ses(t)} />
  </g>
);

export const SAHNE: Record<string, S> = { giris: Giris, cizelge: Cizelge, patent: Patent, amac: Amac, agir: Agir };

export const KAPAK: React.FC = () => (
  <g>
    <Merakli x={880} y={1700} s={0.85} t={0.3} hareket="sasir" kostum="sapka" />
  </g>
);
export const KAPAK_YAZI = { ust: "Konserve icat edildiğinde", buyuk: "AÇACAK YOKTU!", alt: "Canva görselleriyle demo" };
