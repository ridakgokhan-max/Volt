"""Toplu derinlik haritası (Depth Anything V2 Base). Kullanım: python scripts/derinlik_toplu.py <liste.json> <gizli_kok> <cikti_klasoru>
liste.json: {"gorseller": ["gizli:uretim/x/girdi/k01.jpg", "acik:out/assets/kk4-a/usta-a.png", ...]}"""
import json, os, sys
import numpy as np
from PIL import Image
from transformers import pipeline
liste, gizli, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Base-hf", device="cpu")
for g in json.load(open(liste))["gorseller"]:
    kind, p = g.split(":", 1)
    src = os.path.join(gizli, p) if kind == "gizli" else p
    if not os.path.exists(src):
        print("yok", src); continue
    img = Image.open(src).convert("RGB")
    d = np.asarray(pipe(img)["depth"].resize(img.size, Image.BICUBIC), dtype=np.float32)
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    ad = os.path.splitext(os.path.basename(p))[0]
    Image.fromarray((d * 65535).astype(np.uint16)).save(os.path.join(out, ad + "_derinlik.png"))
    print("ok", ad, img.size, flush=True)
