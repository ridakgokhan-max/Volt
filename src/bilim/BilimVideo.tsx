// Bir Dakikada Bilim — ana kompozisyon: ses, sahneler, geçişler, vurgulu altyazı
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { data, SAHNE } from "./aktif";
import { ACC, ap, Bg, BgKind, cl, ez, FPS, H, INK, sp, W } from "./kit";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });

export type Kelime = { w: string; s: number; e: number; vurgu?: boolean };
export type Gecis = "daire" | "kaydir" | "zoom" | "glitch" | "perde" | "flas";
export type Sahne = { id: string; bg: BgKind; bas: number; son: number; ev: Record<string, number>; gecis?: Gecis };
/** w(i): i. kelimenin sahneye göre saniyesi; ws("kelime", n): sahne başından sonra o kelimenin n. geçişi */
export type SceneProps = { t: number; d: number; ev: Record<string, number>; w: (i: number) => number; ws: (txt: string, n?: number) => number };

const K: Kelime[] = data.kelimeler as Kelime[];
const SAT: [number, number][] = data.satirlar as [number, number][];
const SC: Sahne[] = data.sahneler as Sahne[];
const OV = 12; // geçiş için üst üste binme (kare)
const norm = (x: string) => x.toLocaleLowerCase("tr-TR").replace(/[.,!?:;"'…]/g, "");

export const bilimSure = () => Math.ceil(data.sure * FPS);

const wordTime = (i: number) => (K[i] ? K[i].s : 0);
const findWord = (from: number, txt: string, n = 0) => {
  const q = norm(txt);
  let c = 0;
  for (const k of K) {
    if (k.s >= from - 0.3 && norm(k.w).startsWith(q)) {
      if (c === n) return k.s;
      c++;
    }
  }
  return from + 1;
};

const SceneWrap: React.FC<{ sc: Sahne; idx: number; lead: number }> = ({ sc, idx, lead }) => {
  const f = useCurrentFrame();
  const t = (f - lead) / FPS; // sahnenin gerçek başlangıcına göre saniye
  const d = sc.son - sc.bas;
  const Draw = SAHNE[sc.id];
  const rev = idx === 0 ? 1 : ez(f / OV);
  const g: Gecis = sc.gecis || "daire";
  const zoom = 1 + 0.045 * cl(t / Math.max(d, 0.1));
  // giriş geçişi
  const outer: React.CSSProperties = {};
  let flash = 0;
  if (rev < 1) {
    const r = 1 - rev;
    if (g === "daire") outer.clipPath = `circle(${rev * 125}% at 50% 42%)`;
    if (g === "kaydir") outer.transform = `translateX(${r * 100}%)`;
    if (g === "zoom") {
      outer.transform = `scale(${1 + r * 0.6})`;
      outer.opacity = rev;
    }
    if (g === "perde") outer.clipPath = `inset(0 0 ${r * 100}% 0)`;
    if (g === "glitch") {
      const j = Math.sin(f * 91.7) * 60 * r;
      outer.transform = `translateX(${j}px) skewX(${Math.sin(f * 13.1) * 8 * r}deg)`;
      outer.filter = `drop-shadow(${14 * r}px 0 0 rgba(255,0,80,0.8)) drop-shadow(${-14 * r}px 0 0 rgba(0,240,255,0.8))`;
      outer.opacity = f % 3 === 1 ? 0.35 : 1;
    }
    if (g === "flas") flash = r;
  }
  // vuruş anlarında küçük sarsıntı
  let shake = 0;
  Object.entries(sc.ev).forEach(([k, v]) => {
    if (k.startsWith("vur")) {
      const dt = t - v;
      if (dt > 0 && dt < 0.35) shake += Math.sin(dt * 90) * 14 * (1 - dt / 0.35);
    }
  });
  const ink = sc.bg === "parsomen" || sc.bg === "sicak" || sc.bg === "yesil" ? INK : "#f4efe2";
  return (
    <AbsoluteFill style={outer}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${shake}px, ${shake * 0.4}px)` }}>
        <Bg kind={sc.bg} t={t + idx * 3} seed={3 + (idx % 5)} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, color: ink }}>
          <g transform="translate(0 40)">{Draw ? <Draw t={t} d={d} ev={sc.ev} w={(i: number) => wordTime(i) - sc.bas} ws={(txt: string, n = 0) => findWord(sc.bas, txt, n) - sc.bas} /> : null}</g>
        </svg>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};

const Altyazi: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  let li = -1;
  SAT.forEach(([a], i) => {
    if (t >= K[a].s - 0.12) li = i;
  });
  if (li < 0) return null;
  const [a, b] = SAT[li];
  const lineEnd = K[b].e;
  const next = SAT[li + 1] ? K[SAT[li + 1][0]].s - 0.12 : 1e9;
  if (t > lineEnd + 0.9 && t < next) return null;
  const inK = sp(t, K[a].s - 0.12, 14);
  const words = K.slice(a, b + 1);
  return (
    <div style={{
      position: "absolute", top: 1300, left: 60, right: 120, display: "flex", flexWrap: "wrap", justifyContent: "center",
      alignContent: "flex-start", rowGap: 6, transform: `translateY(${(1 - inK) * 40}px)`, opacity: cl(inK * 1.4),
    }}>
      {words.map((k, j) => {
        const gi = a + j;
        const active = t >= k.s && (gi === b ? t < k.e + 0.6 : t < K[gi + 1].s);
        const said = t >= k.s;
        const big = k.vurgu ? 0.32 : 0.12;
        const pop = active ? 1 + big * (1 - ez((t - k.s) / (k.vurgu ? 0.35 : 0.18))) + (k.vurgu ? 0.08 : 0) : 1;
        const col = active ? INK : k.vurgu && said ? ACC : "#ffffff";
        return (
          <span key={gi} style={{
            display: "inline-block", margin: "0 7px", padding: "2px 14px", borderRadius: 18,
            background: active ? ACC : "transparent", boxShadow: active ? "0 6px 0 rgba(0,0,0,0.35)" : "none",
            fontFamily, fontWeight: 900, fontSize: 70, lineHeight: 1.12, color: col, opacity: said ? 1 : 0.55,
            WebkitTextStroke: active ? "0px" : "3px #1a1410", paintOrder: "stroke fill",
            textShadow: active ? "none" : "0 5px 12px rgba(0,0,0,0.6)", transform: `scale(${pop})`,
          }}>{k.w}</span>
        );
      })}
    </div>
  );
};

const Ust: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const prog = cl(t / data.sure);
  const titleK = 1 - ap(t, 3.2, 0.5);
  return (
    <>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, height: 10, background: "rgba(0,0,0,0.25)" }}>
        <div style={{ width: `${prog * 100}%`, height: "100%", background: ACC }} />
      </div>
      <div style={{ position: "absolute", top: 165, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 34, letterSpacing: 3, color: INK, background: ACC, padding: "8px 26px", borderRadius: 40, border: `4px solid ${INK}` }}>
          BİR DAKİKADA BİLİM
        </div>
        {titleK > 0.01 && data.baslik ? (
          <div style={{
            fontFamily, fontWeight: 900, fontSize: 58, color: "#fff", WebkitTextStroke: "3px #1a1410", paintOrder: "stroke fill",
            textShadow: "0 6px 14px rgba(0,0,0,0.6)", opacity: titleK, transform: `scale(${0.9 + 0.1 * sp(t, 0.1)})`, textAlign: "center", padding: "0 60px",
          }}>{data.baslik}</div>
        ) : null}
      </div>
    </>
  );
};

export const BilimVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#111", ["--font" as string]: fontFamily } as React.CSSProperties}>
    {SC.map((sc, idx) => {
      const real = Math.round(sc.bas * FPS);
      const from = Math.max(0, real - (idx === 0 ? 0 : OV));
      const dur = Math.round(sc.son * FPS) - from + (idx === SC.length - 1 ? 30 : OV);
      return (
        <Sequence key={sc.id} from={from} durationInFrames={dur}>
          <SceneWrap sc={sc} idx={idx} lead={real - from} />
        </Sequence>
      );
    })}
    <Ust />
    <Altyazi />
    <Audio src={staticFile(data.audio)} />
  </AbsoluteFill>
);
