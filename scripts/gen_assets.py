"""Görsel varlık üretimi (SDXL-Lightning, fp32, CPU). Metinden görsel ve bölgesel yeniden çizim (inpaint).

Kullanım: python scripts/gen_assets.py assets/jobs/<is>.json
İş dosyası:
{
  "items": [
    {"name": "karakter-1", "prompt": "...", "seed": 1, "w": 640, "h": 1136},
    {"name": "gulumse", "mode": "inpaint", "image": "out/assets/x/karakter-1.png", "mask": "assets/masks/yuz.png",
     "prompt": "...", "seed": 3, "strength": 0.8}
  ]
}
Çıktılar: out/assets/<is-adi>/<name>.png
"""
import json
import os
import sys
import time

import torch
from diffusers import EulerDiscreteScheduler, StableDiffusionXLInpaintPipeline, StableDiffusionXLPipeline
from huggingface_hub import hf_hub_download
from PIL import Image

STYLE = (
    "2d cartoon illustration, hand drawn, bold clean black ink outlines, flat muted colors with soft simple shading, "
    "simple shapes, storybook comic style, sepia and grey-blue palette"
)
NEG = "photo, photorealistic, realistic, 3d render, text, letters, watermark, signature"

job_path = sys.argv[1]
job = json.load(open(job_path, encoding="utf-8"))
out_dir = os.path.join("out", "assets", os.path.splitext(os.path.basename(job_path))[0])
os.makedirs(out_dir, exist_ok=True)
torch.set_num_threads(os.cpu_count() or 4)

t0 = time.time()
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.float32, variant="fp16", use_safetensors=True
)
pipe.load_lora_weights(hf_hub_download("ByteDance/SDXL-Lightning", "sdxl_lightning_4step_lora.safetensors"))
pipe.fuse_lora()
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
pipe.set_progress_bar_config(disable=True)
inpaint = None
print("model yüklendi", round(time.time() - t0, 1), "sn", flush=True)

log = []
for it in job["items"]:
    t = time.time()
    prompt = it["prompt"] + ("" if it.get("no_style") else ", " + STYLE)
    neg = it.get("neg", "") + ", " + NEG
    gen = torch.Generator().manual_seed(it.get("seed", 42))
    if it.get("mode") == "inpaint":
        if inpaint is None:
            inpaint = StableDiffusionXLInpaintPipeline.from_pipe(pipe)
            inpaint.set_progress_bar_config(disable=True)
        img = Image.open(it["image"]).convert("RGB")
        mask = Image.open(it["mask"]).convert("L").resize(img.size)
        res = inpaint(prompt=prompt, negative_prompt=neg, image=img, mask_image=mask, strength=it.get("strength", 0.8),
                      num_inference_steps=it.get("steps", 6), guidance_scale=0, generator=gen,
                      width=img.width, height=img.height).images[0]
    else:
        res = pipe(prompt=prompt, negative_prompt=neg, num_inference_steps=4, guidance_scale=0,
                   width=it.get("w", 640), height=it.get("h", 1136), generator=gen).images[0]
    res.save(os.path.join(out_dir, it["name"] + ".png"))
    sec = round(time.time() - t, 1)
    log.append({"name": it["name"], "sec": sec})
    print(it["name"], sec, "sn", flush=True)

json.dump(log, open(os.path.join(out_dir, "sonuc.json"), "w"), indent=1)
