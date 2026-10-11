"""Görsel modeli testi: SDXL-Lightning (4 adım) — CPU üzerinde süre/kalite ölçümü."""
import json
import os
import time

import torch
from diffusers import EulerDiscreteScheduler, StableDiffusionXLPipeline
from huggingface_hub import hf_hub_download

OUT = "out/gorsel-test"
os.makedirs(OUT, exist_ok=True)
torch.set_num_threads(os.cpu_count() or 4)

STYLE = (
    "2d cartoon illustration, hand drawn, bold clean black ink outlines, flat muted colors with soft simple shading, "
    "simple shapes, storybook comic style, sepia and grey-blue palette, aged paper"
)
NEG = "photo, photorealistic, realistic, 3d render, text, watermark"

TESTS = [
    ("01-nehir", "a wide calm river winding between soft hills, a small empty wooden rowing boat near the shore, distant trees, no people"),
    ("02-firtina", "a dark stormy sea with large curling waves, swirling brown storm clouds, rain, dramatic mood, no people"),
    ("03-saatci", "a cartoon old bearded clockmaker with big expressive eyes and exaggerated simple features, with round glasses and a brown apron sitting at a wooden workbench full of clocks and gears, cartoon character, expressive face, warm candle light"),
    ("04-sehir", "a modern city skyline seen from a riverside park with a single tree and a bench, minimal line art, morning light, no people"),
]

W, H = 768, 1344  # 9:16'ya yakın SDXL çözünürlüğü
log = {"cpu": os.cpu_count(), "size": [W, H], "images": []}

t0 = time.time()
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True
)
pipe.load_lora_weights(hf_hub_download("ByteDance/SDXL-Lightning", "sdxl_lightning_4step_lora.safetensors"))
pipe.fuse_lora()
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
pipe.set_progress_bar_config(disable=True)
pipe.enable_attention_slicing()
log["load_sec"] = round(time.time() - t0, 1)
print("model yüklendi", log["load_sec"], "sn", flush=True)

for name, desc in TESTS:
    t = time.time()
    img = pipe(
        prompt=f"{desc}, {STYLE}",
        negative_prompt=NEG,
        num_inference_steps=4,
        guidance_scale=0,
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
