// Bir Dakikada Bilim — ana kompozisyon: ses, sahneler, geçişler, vurgulu altyazı
import React from "react";
import { AbsoluteFill, Audio, getInputProps, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CtaAdim, ctaGorunur, CtaVideo } from "./Cta";
import { MerakliGorunur } from "./merakli";
import { data, SAHNE } from "./aktif";
import { ACC, ap, Bg, BgKind, BLUE, cl, ez, FPS, H, INK, KATEGORI_RENK, lerp, sp, W } from "./kit";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });

export type Kelime = { w: string; s: number; e: number; vurgu?: boolean };
export type Gecis = "daire" | "kaydir" | "zoom" | "glitch" | "perde" | "flas" | "savur";
export type Sahne = { id: string; bg: BgKind; bas: number; son: number; ev: Record<string, number>; gecis?: Gecis; gorsel?: string; video?: string; video_kutu?: [number, number, number, number]; derinlik?: boolean };
/** w(i): i. kelimenin sahneye göre saniyesi; ws("kelime", n): sahne başından sonra o kelimenin n. geçişi */
/** ses(t): o andaki ses şiddeti 0..1 (Meraklı'nın dudak senkronu için: <Merakli agiz={ses(t)} />) */
export type SceneProps = { t: number; d: number; ev: Record<string, number>; w: (i: number) => number; ws: (txt: string, n?: number) => number; ses: (t: number) => number };

// ---------- platform güvenli alanları (Instagram / TikTok / YouTube Shorts) ----------
export type Platform = "instagram" | "tiktok" | "shorts";
export const PLATFORM: Platform = ((getInputProps() as { platform?: Platform }).platform || "instagram") as Platform;
const ALAN: Record<Platform, { altyaziTop: number; sag: number; sol: number; ustTop: number; rozetTop: number }> = {
  instagram: { altyaziTop: 1300, sag: 120, sol: 60, ustTop: 165, rozetTop: 160 },
  tiktok: { altyaziTop: 1170, sag: 170, sol: 60, ustTop: 250, rozetTop: 250 },
  shorts: { altyaziTop: 1210, sag: 150, sol: 60, ustTop: 215, rozetTop: 215 },
};
const A = ALAN[PLATFORM] || ALAN.instagram;

// ---------- büyüme özellikleri (kurgu.json -> data) ----------
type Seri = { no: number; toplam: number; kategori: string };
type Kanca = { yazi: string; alt?: string; sure?: number };
type Acilis = { sahne: string; an: number; sure: number };
const D = data as unknown as { seri?: Seri; kanca?: Kanca; dongu?: boolean; agiz?: number[]; acilis?: Acilis; imza?: boolean; cta?: CtaAdim[]; arka?: string };
const AC = D.acilis;
const KANCA_SURE = D.kanca ? D.kanca.sure ?? 2 : 0;
const DONGU = 15; // döngü sonu: son 15 karede ilk sahneye karışır
const AGIZ = D.agiz || [];
export const sesAn = (sn: number) => {
  if (!AGIZ.length) return 0;
  const i = sn * FPS;
  const a = AGIZ[Math.max(0, Math.min(AGIZ.length - 1, Math.floor(i)))];
  const b = AGIZ[Math.max(0, Math.min(AGIZ.length - 1, Math.floor(i) + 1))];
  return a + (b - a) * (i - Math.floor(i));
};

const K: Kelime[] = data.kelimeler as Kelime[];
const SAT: [number, number][] = data.satirlar as [number, number][];
const SC: Sahne[] = data.sahneler as Sahne[];
const OV = 18; // geçiş için üst üste binme (kare) — 0,6 sn, izleyici takip edebilsin
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

type WrapProps = { sc: Sahne; idx: number; lead: number; donus?: boolean; sabitT?: number; acilis?: boolean };
/** Geçiş karelerinde sinema kamerası gibi hareket bulanıklığı (motion blur) */
const SceneWrap: React.FC<WrapProps> = (p) => {
  const f = useCurrentFrame();
  const gecisVar = !p.acilis && (p.idx > 0 || !!AC || p.donus) && f < (p.donus ? DONGU : OV);
  return gecisVar ? (
    <CameraMotionBlur shutterAngle={200} samples={5}>
      <SceneIc {...p} />
    </CameraMotionBlur>
  ) : (
    <SceneIc {...p} />
  );
};

const SceneIc: React.FC<WrapProps> = ({ sc, idx, lead, donus, sabitT, acilis }) => {
  const f = useCurrentFrame();
  // donus: döngü karesi (ilk görüntünün sabit hali); acilis: videonun en çarpıcı anı, başta kısaca oynar
  const t = donus ? sabitT ?? 0 : sabitT !== undefined ? sabitT + f / FPS : (f - lead) / FPS;
  const d = sc.son - sc.bas;
  const Draw = SAHNE[sc.id];
  const rev = acilis || (idx === 0 && !donus && !AC) ? 1 : ez(f / (donus ? DONGU : OV));
  const g: Gecis = donus ? "zoom" : sc.gecis || "daire";
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
    if (g === "savur") {
      // hızlı kamera savurma: yandan kayarak gelir, hareket bulanıklığı ve eğim
      outer.transform = `translateX(${r * 110}%) skewX(${-r * 18}deg)`;
      outer.filter = `blur(${r * 14}px)`;
    }
  }
  // vuruş anlarında küçük sarsıntı
  let shake = 0;
  Object.entries(sc.ev).forEach(([k, v]) => {
    if (k.startsWith("vur")) {
      const dt = t - v;
      if (dt > 0 && dt < 0.35) shake += Math.sin(dt * 60) * 9 * (1 - dt / 0.35);
    }
  });
  const ink = sc.bg.startsWith("k:") || sc.bg === "parsomen" || sc.bg === "sicak" || sc.bg === "yesil" || sc.bg === "gok" ? INK : "#f4efe2";
  if (acilis) outer.transform = `scale(${1.14 - 0.14 * ez(f / 10)})`;
  return (
    <AbsoluteFill style={outer}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${shake}px, ${shake * 0.4}px)` }}>
        {D.arka ? null : <Bg kind={sc.bg} t={t + idx * 3} seed={3 + (idx % 5)} />}
        {sc.gorsel && sc.derinlik ? (
          // derinlikli görsel: arka / orta / ön katman farklı hızlarda kayar (kamera resmin içinde gezinir)
          <>
            {(["k0", "k1", "k2"] as const).map((k, i) => {
              const p = ez(cl(t / Math.max(d, 0.1)));
              const yon = idx % 2 ? -1 : 1;
              const sc0 = [1.08, 1.12, 1.16][i] + [0.04, 0.1, 0.2][i] * p;
              const dx = yon * lerp([30, 60, 110][i], -[30, 70, 130][i], p);
              const dy = lerp([0, 0, 10][i], -[0, 20, 40][i], p);
              return (
                <Img key={k} src={staticFile(`bilim/${(data as { konu: string }).konu}/${sc.gorsel}_${k}.png`)}
                  style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover", transform: `scale(${sc0}) translate(${dx}px, ${dy}px)` }} />
              );
            })}
          </>
        ) : sc.gorsel ? (
          <Img src={staticFile(`bilim/${(data as { konu: string }).konu}/${sc.gorsel}.jpg`)}
            style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover",
              transform: `scale(${1.04 + 0.1 * cl(t / Math.max(d, 0.1))}) translate(${(idx % 2 ? -1 : 1) * 14 * cl(t / Math.max(d, 0.1))}px, ${-10 * cl(t / Math.max(d, 0.1))}px)` }} />
        ) : null}
        {sc.video ? (
          <div style={{ position: "absolute", left: (sc.video_kutu || [160])[0], top: (sc.video_kutu || [0, 450])[1], width: (sc.video_kutu || [0, 0, 760])[2], height: (sc.video_kutu || [0, 0, 0, 760])[3], zIndex: sc.video_kutu ? 2 : undefined, borderRadius: 44, overflow: "hidden", border: `10px solid ${INK}`,
            boxShadow: "0 30px 60px rgba(0,0,0,0.55)", transform: `scale(${sp(t, 0.05, 12)}) rotate(${(1 - sp(t, 0.05, 12)) * -6}deg)` }}>
            <Sequence from={lead}>
              <OffthreadVideo muted src={staticFile(`bilim/${(data as { konu: string }).konu}/${sc.video}.mp4`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Sequence>
          </div>
        ) : null}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, color: ink }}>
          <MerakliGorunur.Provider value={1 - ctaGorunur(donus ? data.sure - (DONGU - f) / FPS : acilis ? f / FPS : sc.bas + t, D.cta || [])}>
          <g transform="translate(0 40)">{Draw ? <Draw t={t} d={d} ev={sc.ev} w={(i: number) => wordTime(i) - sc.bas} ws={(txt: string, n = 0) => findWord(sc.bas, txt, n) - sc.bas} ses={(tt: number) => sesAn(sc.bas + tt)} /> : null}</g>
          </MerakliGorunur.Provider>
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
  if (t > lineEnd + 0.45 && t < next) return null;
  const inK = sp(t, K[a].s - 0.12, 18);
  const words = K.slice(a, b + 1);
  // kart içi satır kırma (piksel ölçümüyle): tırnak içi ve öbekler bölünmez, kısa bağlaç satır sonunda kalmaz, tek kelimelik satır olmaz
  const KISA = new Set(["bir", "ve", "bu", "o", "şu", "ile", "ya", "ne"]);
  const ENKLITIK = new Set(["de", "da", "ki"]);
  const OBEK = new Set(["sahte çıkartma", "karanlık tarafı", "birden fazla", "adrese bir", "bir anda", "kod burada", "üçte biri", "go oyunundan", "masahiro hara"]);
  const nrm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?"“”:]/g, "");
  const FS = 70, KENAR = 26; // kelime başına iç+dış boşluk
  const GEN = W - A.sol - A.sag - 36;
  const olc = (w: string) => {
    try {
      const c = (olc as any).c || ((olc as any).c = document.createElement("canvas").getContext("2d"));
      c.font = `900 ${FS}px ${fontFamily}`;
      return c.measureText(w).width + KENAR;
    } catch {
      return w.length * FS * 0.6 + KENAR;
    }
  };
  const gw = (ws2: typeof words) => ws2.reduce((n, k) => n + olc(k.w), 0);
  let satirlar: (typeof words)[] = [words];
  if (gw(words) > GEN / 0.9 && words.length > 1) {
    let best = 1e9, kir = 1;
    for (let i = 1; i < words.length; i++) {
      const sol = words.slice(0, i), sag = words.slice(i);
      let c = Math.max(gw(sol), gw(sag));
      if (sol.reduce((n, k) => n + (k.w.match(/["“”]/g) || []).length, 0) % 2 === 1) c += 5000;
      if (OBEK.has(`${nrm(sol[sol.length - 1].w)} ${nrm(sag[0].w)}`)) c += 1000;
      if (KISA.has(nrm(sol[sol.length - 1].w))) c += 2000;
      if (ENKLITIK.has(nrm(sag[0].w))) c += 2000;
      if (words.length > 2 && (sol.length === 1 || sag.length === 1)) c += 1500;
      if (c < best) { best = c; kir = i; }
    }
    satirlar = [words.slice(0, kir), words.slice(kir)];
  }
  // takip çağrısında Meraklı alttaki "Takip et" düğmesine yürür: altyazı onun üstüne binmesin diye yukarı kayar
  const takipK = ctaGorunur(t, (D.cta || []).filter((c) => c.tur === "takip"));
  return (
    <div style={{
      position: "absolute", top: A.altyaziTop, left: A.sol, right: A.sag, display: "flex", flexDirection: "column", alignItems: "center",
      rowGap: 4, transform: `translateY(${(1 - inK) * 18 + 0 * takipK}px) scale(${0.94 + 0.06 * inK})`, opacity: 1,
      background: "rgba(18,22,38,0.8)", borderRadius: 34, padding: "14px 18px 18px",
    }}>
      {satirlar.map((sat, si) => {
        const olcek = Math.max(0.86, Math.min(1, GEN / gw(sat)));
        const bas = satirlar.slice(0, si).reduce((n, x) => n + x.length, 0);
        return (
          <div key={si} style={{ display: "flex", flexWrap: "nowrap", whiteSpace: "nowrap", justifyContent: "center" }}>
            {sat.map((k, jj) => (() => {
        const j = bas + jj;
        const gi = a + j;
        const active = t >= k.s && (gi === b ? t < k.e + 0.6 : t < K[gi + 1].s);
        const said = t >= k.s;
        const big = k.vurgu ? 0.06 : 0.03;
        const pop = active ? 1 + big * (1 - ez((t - k.s) / (k.vurgu ? 0.35 : 0.18))) + 0 : 1;
        const col = active ? INK : k.vurgu && said ? ACC : "#ffffff";
        return (
          <span key={gi} style={{
            display: "inline-block", margin: "0 3px", padding: "2px 10px", borderRadius: 18,
            background: active ? ACC : "transparent", boxShadow: active ? "0 6px 0 rgba(0,0,0,0.35)" : "none",
            fontFamily, fontWeight: 900, fontSize: FS * olcek, lineHeight: 1.12, color: col, opacity: said ? 1 : 0.9,
            WebkitTextStroke: active ? "0px" : "3px #1a1410", paintOrder: "stroke fill",
            textShadow: active ? "none" : "0 5px 12px rgba(0,0,0,0.6)", transform: `scale(${pop})`,
          }}>{k.w}</span>
        );
            })())}
          </div>
        );
      })}
    </div>
  );
};

const Rozet: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (!D.seri) return null;
  const { no, toplam, kategori } = D.seri;
  const renk = KATEGORI_RENK[kategori.toLocaleLowerCase("tr-TR")] || BLUE;
  const k = sp(t, KANCA_SURE + 0.15, 10);
  const halka = cl(no / toplam);
  return (
    <div style={{ position: "absolute", top: A.rozetTop, right: A.sag - 70, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${k}) rotate(${(1 - k) * -40}deg)`, transformOrigin: "50% 50%" }}>
      <svg width={124} height={124} viewBox="0 0 124 124">
        <circle cx={62} cy={62} r={56} fill={renk} stroke={INK} strokeWidth={6} />
        <circle cx={62} cy={62} r={44} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={8} />
        <circle cx={62} cy={62} r={44} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 44 * halka * ez((t - KANCA_SURE - 0.3) / 0.8)} 999`} transform="rotate(-90 62 62)" />
        <text x={62} y={72} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={25} fill="#fff">{no}/{toplam}</text>
      </svg>
      <div style={{ marginTop: -10, fontFamily, fontWeight: 900, fontSize: 22, letterSpacing: 1.5, color: "#fff", background: INK, padding: "4px 12px", borderRadius: 14, border: `3px solid ${renk}` }}>
        {kategori.toLocaleUpperCase("tr-TR")}
      </div>
    </div>
  );
};

/** İlk 2 saniye: dev, titreşen kanca yazısı — izleyiciyi kaydırmadan durdurur */
const KancaYazi: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (!D.kanca || t > KANCA_SURE + 0.4) return null;
  const giris = sp(t + 0.9, 0, 9);
  const cikis = 1 - ap(t, KANCA_SURE - 0.05, 0.35);
  const tit = Math.sin(t * 40) * 3 * (1 - cl(t / 0.6));
  const kel = D.kanca.yazi.split(" ");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 210, opacity: cikis, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,${0.55 * cikis}) 100%)` }} />
      <div style={{ transform: `scale(${0.6 + 0.4 * giris}) rotate(${tit - 2}deg)`, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", padding: "26px 40px 34px", margin: "0 50px", background: "rgba(16,20,34,0.86)", borderRadius: 40, border: "6px solid #1a1410", boxShadow: "0 14px 0 rgba(0,0,0,0.35)" }}>
        {kel.map((w, i) => {
          const k = sp(t + 0.9, 0.06 * i, 8);
          const vur = i === kel.length - 1;
          return (
            <span key={i} style={{
              fontFamily, fontWeight: 900, fontSize: vur ? 132 : 112, lineHeight: 1.05, color: vur ? ACC : "#fff",
              WebkitTextStroke: "6px #1a1410", paintOrder: "stroke fill", textShadow: "0 12px 0 rgba(0,0,0,0.45)",
              display: "inline-block", transform: `translateY(${(1 - k) * 120}px) scale(${k})`,
            }}>{w}</span>
          );
        })}
      </div>
      {D.kanca.alt ? (
        <div style={{ marginTop: 22, opacity: 1, fontFamily, fontWeight: 900, fontSize: 52, color: INK, background: ACC, padding: "8px 28px", borderRadius: 30, border: `5px solid ${INK}` }}>
          {D.kanca.alt}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};


/** Kanalın imza görünümü: her videoda aynı sıcak ışık huzmesi + kenar karartma + ince film greni */
const Imza: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (!D.imza) return null;
  const nefes = 0.85 + 0.15 * Math.sin(t * 0.9);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
        <defs>
          <linearGradient id="imza-h" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe7a8" stopOpacity={0.55 * nefes} />
            <stop offset="55%" stopColor="#ffd77a" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#ffd77a" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="imza-k" cx="0" cy="0" r="0.6">
            <stop offset="0%" stopColor="#fff3cf" stopOpacity={0.5 * nefes} />
            <stop offset="100%" stopColor="#fff3cf" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#imza-k)" />
        {[0, 1, 2, 3].map((i) => {
          const a = -8 + i * 9 + Math.sin(t * 0.35 + i) * 1.5;
          const w = 90 + i * 40;
          return <path key={i} d={`M ${-60 + i * 30} -60 L ${1500} ${900 + i * 260} L ${1500} ${900 + i * 260 + w} Z`} fill="url(#imza-h)" opacity={0.35 - i * 0.06} transform={`rotate(${a} 0 0)`} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,12,4,0.38) 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="imza-g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 7} /></filter>
        <rect width={W} height={H} filter="url(#imza-g)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Etkileşim çağrısı: Meraklı Instagram'ın beğen / yorum / takip düğmelerine dokunur */
const Cta: React.FC = () => {
  const f = useCurrentFrame();
  if (!D.cta || !D.cta.length) return null;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <CtaVideo t={f / FPS} adimlar={D.cta} />
    </svg>
  );
};

const Ust: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const prog = cl(t / data.sure);
  const t0 = KANCA_SURE; // kanca varsa logo ve başlık ondan sonra gelir
  const titleK = ap(t, t0 + 0.1, 0.3) * (1 - ap(t, t0 + 3.2, 0.5));
  const logoK = (D.kanca ? sp(t, t0, 12) : 1) * (D.dongu ? 1 - ap(t, data.sure - 0.9, 0.4) : 1);
  return (
    <>
      <div style={{ position: "absolute", top: A.ustTop - 45, left: 0, right: 0, height: 10, background: "rgba(0,0,0,0.25)" }}>
        <div style={{ width: `${prog * 100}%`, height: "100%", background: ACC }} />
      </div>
      <div style={{ position: "absolute", top: A.ustTop, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 34, letterSpacing: 3, color: INK, background: ACC, padding: "8px 26px", borderRadius: 40, border: `4px solid ${INK}`, transform: `scale(${D.kanca ? sp(t, t0, 12) : 1})`, opacity: cl(logoK * 2) }}>
          BİR DAKİKADA BİLİM
        </div>
        {titleK > 0.01 && data.baslik ? (
          <div style={{
            fontFamily, fontWeight: 900, fontSize: 58, color: "#fff", WebkitTextStroke: "3px #1a1410", paintOrder: "stroke fill",
            textShadow: "0 6px 14px rgba(0,0,0,0.6)", opacity: titleK, transform: `scale(${0.9 + 0.1 * sp(t, t0 + 0.1)})`, textAlign: "center", padding: "0 60px",
          }}>{data.baslik}</div>
        ) : null}
      </div>
    </>
  );
};

export const BilimVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#111", ["--font" as string]: fontFamily } as React.CSSProperties}>
    {D.arka ? (
      // tüm video boyunca tek parça arka plan (ör. Blender'da render edilmiş 3D sahne); sahneler üstüne şeffaf katman olarak biner
      <OffthreadVideo muted src={staticFile(`bilim/${(data as { konu: string }).konu}/${D.arka}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    ) : null}
    {AC ? (
      <Sequence from={0} durationInFrames={Math.round(AC.sure * FPS) + OV}>
        <SceneWrap sc={SC.find((s) => s.id === AC.sahne) || SC[0]} idx={Math.max(0, SC.findIndex((s) => s.id === AC.sahne))} lead={0} sabitT={AC.an} acilis />
      </Sequence>
    ) : null}
    {SC.map((sc, idx) => {
      const real = Math.round(sc.bas * FPS);
      const from = Math.max(0, real - (idx === 0 && !AC ? 0 : OV));
      const dur = Math.round(sc.son * FPS) - from + (idx === SC.length - 1 ? 30 : OV);
      return (
        <Sequence key={sc.id} from={from} durationInFrames={dur}>
          <SceneWrap sc={sc} idx={idx} lead={real - from} />
        </Sequence>
      );
    })}
    {D.dongu ? (
      <Sequence from={bilimSure() - DONGU} durationInFrames={DONGU}>
        {AC ? (
          <SceneWrap sc={SC.find((s) => s.id === AC.sahne) || SC[0]} idx={0} lead={0} donus sabitT={AC.an} />
        ) : (
          <SceneWrap sc={SC[0]} idx={0} lead={0} donus />
        )}
      </Sequence>
    ) : null}
    <Imza />
    <Ust />
    <Rozet />
    <Cta />
    <KancaYazi />
    <Altyazi />
    <Audio src={staticFile(data.audio)} />
  </AbsoluteFill>
);
