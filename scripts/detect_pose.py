"""Karakter görselinden otomatik iskelet çıkarır (DWPose / rtmlib, açık kaynak, CPU).

Kullanım: python scripts/detect_pose.py assets/rig/<is>.json
İş dosyası: {"images": ["out/assets/kukla1/karakter-23.png", ...]}
Çıktı: out/rig/<is>/<görsel>.json (133 tüm-vücut noktası + güven) ve <görsel>.jpg (çizimli kontrol görseli)
Nokta sırası (COCO-WholeBody): 0 burun, 1-2 gözler, 3-4 kulaklar, 5-6 omuzlar, 7-8 dirsekler, 9-10 bilekler,
11-12 kalçalar, 13-14 dizler, 15-16 ayak bilekleri, 17-22 ayaklar, 23-90 yüz (68), 91-111 sol el, 112-132 sağ el.
"""
import json
import os
import sys

import cv2
import numpy as np
from rtmlib import Wholebody, draw_skeleton

job_path = sys.argv[1]
job = json.load(open(job_path, encoding="utf-8"))
out_dir = os.path.join("out", "rig", os.path.splitext(os.path.basename(job_path))[0])
os.makedirs(out_dir, exist_ok=True)

model = Wholebody(to_openpose=False, mode="performance", backend="onnxruntime", device="cpu")
for path in job["images"]:
    img = cv2.imread(path)
    kps, scores = model(img)
    name = os.path.splitext(os.path.basename(path))[0]
    res = []
    for k, s in zip(kps, scores):
        res.append({"keypoints": np.round(k, 1).tolist(), "scores": np.round(s, 3).tolist()})
    # en büyük (en güvenli) kişiyi başa al
    res.sort(key=lambda r: -float(np.mean(r["scores"][:17])))
    json.dump({"image": path, "size": [img.shape[1], img.shape[0]], "people": res},
              open(os.path.join(out_dir, name + ".json"), "w"), indent=0)
    vis = draw_skeleton(img.copy(), kps, scores, kpt_thr=0.3)
    cv2.imwrite(os.path.join(out_dir, name + ".jpg"), vis, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(name, "kişi:", len(res), "gövde güveni:", round(float(np.mean(res[0]["scores"][:17])), 2) if res else "-", flush=True)
