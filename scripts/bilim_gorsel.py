"""Bir Dakikada Bilim: sahne arka plan görselleri (SDXL-Lightning, CPU) + parşömen işleme.

Girdi : bilim/<konu>/gorseller.json  {"gorseller": [{"ad": "atolye", "istem": "...", "seed": 7, "panel": true}]}
Çıktı : public/bilim/<konu>/<ad>.jpg  (1080x1920, parşömen tonlu)
Kullanım: python scripts/bilim_gorsel.py <konu>
"""
import json
import os
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

STYLE = ("2d cartoon illustration, hand drawn, bold clean black ink outlines, flat muted colors with soft simple shading, "
         "simple shapes, storybook comic style, sepia and grey-blue palette, aged paper")
NEG = "photo, photorealistic, realistic, 3d render, text, letters, words, watermark, logo, signature"
W, H = 640, 1136


def main(konu):
    import torch
    from diffusers import EulerDiscreteScheduler, StableDiffusionXLPipeline
    from huggingface_hub import hf_hub_download
    from PIL import Image
    from parchment import stylize

    cfg = json.load(open(os.path.join(ROOT, "bilim", konu, "gorseller.json"), encoding="utf-8"))
    out = os.path.join(ROOT, "public", "bilim", konu)
    os.makedirs(out, exist_ok=True)
    torch.set_num_threads(os.cpu_count() or 4)
    t0 = time.time()
    pipe = StableDiffusionXLPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.float32, variant="fp16", use_safetensors=True)
    pipe.load_lora_weights(hf_hub_download("ByteDance/SDXL-Lightning", "sdxl_lightning_4step_lora.safetensors"))
    pipe.fuse_lora()
    pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
    pipe.set_progress_bar_config(disable=True)
    print("model yüklendi", round(time.time() - t0), "sn", flush=True)
    for g in cfg["gorseller"]:
        dst = os.path.join(out, g["ad"] + ".jpg")
        if os.path.exists(dst) and not g.get("yenile"):
            print(g["ad"], "zaten var, atlandı")
            continue
        t = time.time()
        img = pipe(prompt=f"{g['istem']}, {STYLE}", negative_prompt=NEG, num_inference_steps=4, guidance_scale=0,
                   width=W, height=H, generator=torch.Generator().manual_seed(g.get("seed", 7))).images[0]
        img.save(os.path.join(out, g["ad"] + "_ham.jpg"), quality=92)
        res = stylize(img, seed=g.get("seed", 7), panel=g.get("panel", True))
        (res if isinstance(res, Image.Image) else Image.fromarray(res)).convert("RGB").save(dst, quality=92)
        print(g["ad"], round(time.time() - t), "sn", flush=True)


if __name__ == "__main__":
    main(sys.argv[1])
