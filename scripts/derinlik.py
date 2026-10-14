"""Yapay zekâ görselini derinliğe göre katmanlara ayırır (2.5B paralaks için).

Depth Anything V2 Small (Apache-2.0) ile derinlik haritası çıkarır; 3 katman PNG yazar:
  <cikti>_k0.png  arka (tam görsel, hafif bulanık)   <cikti>_k1.png  orta   <cikti>_k2.png  ön
Kullanım: python scripts/derinlik.py girdi.jpg public/bilim/<konu>/<ad>
"""
import sys

import numpy as np
from PIL import Image, ImageFilter


def main(src, out):
    from transformers import pipeline

    img = Image.open(src).convert("RGB")
    pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
    d = np.asarray(pipe(img)["depth"].resize(img.size, Image.BICUBIC), dtype=np.float32)
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)  # 1 = yakın
    Image.fromarray((d * 255).astype(np.uint8)).save(out + "_derinlik.png")
    rgb = np.asarray(img)

    def layer(lo, hi, feather=0.06):
        a = np.clip((d - lo) / feather, 0, 1) * np.clip((hi - d) / feather + 1, 0, 1) if hi < 1 else np.clip((d - lo) / feather, 0, 1)
        a = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
        im = Image.fromarray(rgb).convert("RGBA")
        im.putalpha(a)
        return im

    img.filter(ImageFilter.GaussianBlur(1.5)).save(out + "_k0.png")
    layer(0.38, 0.68).save(out + "_k1.png")
    layer(0.68, 1.0).save(out + "_k2.png")
    print("katmanlar yazıldı:", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
