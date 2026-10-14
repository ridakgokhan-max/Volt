"""Taslak karelerini numaralı, etiketli tek bir paftada birleştirir: out/bilim/<konu>-taslak.jpg"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

konu = sys.argv[1]
kareler = sorted(glob.glob(f"out/bilim/taslak/{konu}/*.png"))
if not kareler:
    sys.exit("kare yok")
w, h = Image.open(kareler[0]).size
kol = 5
sat = -(-len(kareler) // kol)
pafta = Image.new("RGB", (kol * (w + 20) + 20, sat * (h + 70) + 20), "#f3e6c8")
d = ImageDraw.Draw(pafta)
try:
    font = ImageFont.truetype("DejaVuSans-Bold.ttf", 30)
except OSError:
    font = ImageFont.load_default()
for i, k in enumerate(kareler):
    x, y = 20 + (i % kol) * (w + 20), 20 + (i // kol) * (h + 70)
    pafta.paste(Image.open(k).convert("RGB"), (x, y))
    ad = os.path.basename(k)[:-4].replace("-", ". ", 1)
    d.text((x + 6, y + h + 12), ad, fill="#2b2420", font=font)
pafta.save(f"out/bilim/{konu}-taslak.jpg", quality=88)
print("pafta:", f"out/bilim/{konu}-taslak.jpg")
