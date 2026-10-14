// Taslak (storyboard): her sahnenin ortasından bir kare çeker — tam render'dan önce onay için.
// Kullanım: node scripts/taslak.mjs <konu> [platform]   -> out/bilim/taslak/<konu>/NN-<sahne>.png
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";

const konu = process.argv[2];
const platform = process.argv[3] || "instagram";
const data = JSON.parse(fs.readFileSync(`src/bilim/data/${konu}.json`, "utf8"));
const out = `out/bilim/taslak/${konu}`;
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const inputProps = { konu, platform };
const composition = await selectComposition({ serveUrl, id: "Bilim", inputProps });
let i = 0;
for (const s of data.sahneler) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round((s.bas + (s.son - s.bas) * 0.72) * 30));
  const file = `${out}/${String(++i).padStart(2, "0")}-${s.id}.png`;
  await renderStill({ composition, serveUrl, output: file, frame, inputProps, scale: 0.4 });
  console.log("kare:", file);
}
