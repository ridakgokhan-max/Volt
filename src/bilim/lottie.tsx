// Hazır Lottie animasyonları (public/lottie/<ad>.json, Lottie Simple License — ücretsiz, ticari kullanım serbest).
// Sahne SVG'sinin içine yerleşir: <LottieKlip ad="bildirim" x y w h t={t} bas={ws("bildirim")} />
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import lottie, { AnimationItem } from "lottie-web";
import { continueRender, delayRender, staticFile } from "remotion";

const onbellek: Record<string, Promise<unknown>> = {};
const yukle = (ad: string) => (onbellek[ad] ??= fetch(staticFile(`lottie/${ad}.json`)).then((r) => r.json()));

export const LottieKlip: React.FC<{
  ad: string; x: number; y: number; w: number; h: number; t: number;
  /** başlama saniyesi (sahne içi) */ bas?: number; hiz?: number; dongu?: boolean; o?: number;
}> = ({ ad, x, y, w, h, t, bas = 0, hiz = 1, dongu = false, o = 1 }) => {
  const kutu = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);
  const [bekle] = useState(() => delayRender(`lottie ${ad}`));
  useEffect(() => {
    let iptal = false;
    yukle(ad).then((veri) => {
      if (iptal || !kutu.current) return;
      anim.current = lottie.loadAnimation({ container: kutu.current, renderer: "svg", loop: false, autoplay: false, animationData: veri });
      anim.current.addEventListener("DOMLoaded", () => continueRender(bekle));
    }).catch(() => continueRender(bekle));
    return () => { iptal = true; anim.current?.destroy(); };
  }, [ad, bekle]);
  const sn = Math.max(0, t - bas) * hiz;
  useLayoutEffect(() => {
    const a = anim.current;
    if (!a) return;
    const top = a.getDuration(true);
    let k = sn * a.frameRate;
    k = dongu ? k % top : Math.min(k, top - 1);
    a.goToAndStop(k, true);
  });
  return (
    <foreignObject x={x} y={y} width={w} height={h} opacity={t < bas ? 0 : o}>
      <div ref={kutu} style={{ width: w, height: h }} />
    </foreignObject>
  );
};
