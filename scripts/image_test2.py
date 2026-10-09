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
    "hand-drawn storybook illustration on aged stained parchment paper, thin black ink outlines, "
    "soft muted watercolor shading, desaturated sepia and grey-blue palette, old book illustration, "
    "simple clean shapes, vintage, calm"
)
NEG = "photo, photorealistic, 3d render, text, letters, watermark, signature, blurry, neon, vivid saturated colors"

TESTS = [
    ("01-nehir", "a wide calm river winding between soft hills, a small empty wooden rowing boat near the shore, distant trees, no people"),
    ("02-firtina", "a dark stormy sea with large curling waves, swirling brown storm clouds, rain, dramatic mood, no people"),
    ("03-saatci", "an old bearded clockmaker with round glasses and a brown apron sitting at a wooden workbench full of clocks and gears, cartoon character, expressive face, warm candle light"),
    ("04-sehir", "a modern city skyline seen from a riverside park with a single tree and a bench, minimal line art, morning light, no people"),
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
