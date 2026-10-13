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

type Konu = { data: typeof parmakIziData; SAHNE: Record<string, any>; KAPAK: React.FC; KAPAK_YAZI: { ust: string; buyuk: string; alt: string } };
const KONULAR: Record<string, Konu> = {
  "parmak-izi": { data: parmakIziData, ...parmakIzi } as Konu,
  demo: { data: demoData as any, ...demo } as Konu,
  tanitim: { data: tanitimData as any, ...tanitim } as Konu,
  fermuar: { data: fermuarData as any, ...fermuar } as Konu,
};
const secilen = (getInputProps() as { konu?: string }).konu || "demo";
const k = KONULAR[secilen] || KONULAR["demo"];
export const data = k.data;
export const SAHNE = k.SAHNE;
export const KAPAK = k.KAPAK;
export const KAPAK_YAZI = k.KAPAK_YAZI;
