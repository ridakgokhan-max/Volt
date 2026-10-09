"""Görsel modeli testi 2: SD1.5 (DreamShaper 8) + LCM-LoRA, fp32 — CPU üzerinde süre/kalite ölçümü."""
import json
import os
import time

import torch
from diffusers import LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

OUT = "out/gorsel-test2"
os.makedirs(OUT, exist_ok=True)
torch.set_num_threads(os.cpu_count() or 4)

STYLE = (
    "2d cartoon illustration, hand drawn, bold clean black ink outlines, flat muted colors with soft simple shading, "
    "simple shapes, storybook comic style, sepia and grey-blue palette, aged paper"
)
NEG = "photo, photorealistic, realistic, photograph, 3d render, detailed skin texture, text, letters, watermark, signature, blurry"

TESTS = [
    ("01-nehir", "a wide calm river winding between soft hills, a small empty wooden rowing boat near the shore, distant trees, no people"),
    ("02-firtina", "a stormy sea with big curling cartoon waves, swirling brown storm clouds, rain, no people"),
    ("03-saatci", "a cartoon old bearded clockmaker with round glasses and a brown apron, big expressive eyes, exaggerated simple features, sitting at a wooden workbench with clocks and gears"),
    ("04-sehir", "a cartoon city skyline seen from a riverside park with a single tree and a bench, morning, no people"),
]

W, H = 576, 1024
log = {"cpu": os.cpu_count(), "size": [W, H], "images": []}

t0 = time.time()
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.set_progress_bar_config(disable=True)
log["load_sec"] = round(time.time() - t0, 1)
print("model yüklendi", log["load_sec"], "sn", flush=True)

for name, desc in TESTS:
    t = time.time()
    img = pipe(
        prompt=f"{desc}, {STYLE}",
        negative_prompt=NEG,
        num_inference_steps=6,
        guidance_scale=1.5,
        width=W,
        height=H,
        generator=torch.Generator().manual_seed(42),
    ).images[0]
    img.save(f"{OUT}/{name}.jpg", quality=90)
    sec = round(time.time() - t, 1)
    log["images"].append({"name": name, "sec": sec})
    print(name, sec, "sn", flush=True)

log["total_sec"] = round(time.time() - t0, 1)
json.dump(log, open(f"{OUT}/sonuc.json", "w"), indent=1)
print(json.dumps(log, indent=1))
