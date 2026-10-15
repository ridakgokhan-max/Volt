// Konu kaydı. Render sırasında --props='{"konu":"..."}' ile seçilir; yeni konu = buraya bir satır.
import { getInputProps } from "remotion";
import * as parmakIzi from "./konular/parmakizi";
import parmakIziData from "./data/parmak-izi.json";
import * as demo from "./konular/demo";
import demoData from "./data/demo.json";
import * as tanitim from "./konular/tanitim";
import tanitimData from "./data/tanitim.json";
import * as fermuar from "./konular/fermuar";
import fermuarData from "./data/fermuar.json";
import * as demo2 from "./konular/demo2";
import demo2Data from "./data/demo2.json";
import * as guvenlik from "./konular/guvenlik";
import guvenlikData from "./data/guvenlik-kamerasi.json";
import * as tokyo from "./konular/tokyo";
import tokyoData from "./data/tokyo-sel.json";
import * as kablosuz from "./konular/kablosuz";
import kablosuzData from "./data/kablosuz-sarj.json";

type Konu = { data: typeof parmakIziData; SAHNE: Record<string, any>; KAPAK: React.FC; KAPAK_YAZI: { ust: string; buyuk: string; alt: string } };
const KONULAR: Record<string, Konu> = {
  "parmak-izi": { data: parmakIziData, ...parmakIzi } as Konu,
  demo: { data: demoData as any, ...demo } as Konu,
  tanitim: { data: tanitimData as any, ...tanitim } as Konu,
  fermuar: { data: fermuarData as any, ...fermuar } as Konu,
  demo2: { data: demo2Data as any, ...demo2 } as Konu,
  "guvenlik-kamerasi": { data: guvenlikData as any, ...guvenlik } as Konu,
  "tokyo-sel": { data: tokyoData as any, ...tokyo } as Konu,
  "kablosuz-sarj": { data: kablosuzData as any, ...kablosuz } as Konu,
};
const secilen = (getInputProps() as { konu?: string }).konu || "demo";
const k = KONULAR[secilen] || KONULAR["demo"];
export const data = k.data;
export const SAHNE = k.SAHNE;
export const KAPAK = k.KAPAK;
export const KAPAK_YAZI = k.KAPAK_YAZI;
