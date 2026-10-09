"""Model çıktısını parşömen tarzına çevirir: soluk sepya renk, kâğıt dokusu, yırtık kenarlı panel, vinyet.

Kullanım: python scripts/parchment.py girdi.jpg cikti.jpg [--panel] [--seed 7]
"""
import argparse

import numpy as np
from PIL import Image, ImageFilter

W, H = 1080, 1920
PAPER = np.array([233, 220, 195], dtype=np.float32)


def _noise(h, w, scale, rng):
    """Yumuşak (düşük frekanslı) gürültü, 0..1."""
    sh, sw = max(2, h // scale), max(2, w // scale)
    n = Image.fromarray((rng.random((sh, sw)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    n = n.filter(ImageFilter.GaussianBlur(scale / 3))
    a = np.asarray(n, dtype=np.float32) / 255
    return (a - a.min()) / (a.max() - a.min() + 1e-6)


def paper_texture(h, w, seed):
    rng = np.random.default_rng(seed)
    stains = 0.5 * _noise(h, w, 320, rng) + 0.3 * _noise(h, w, 120, rng) + 0.2 * _noise(h, w, 40, rng)
    grain = rng.normal(0, 1, (h, w)).astype(np.float32)
    grain = np.asarray(Image.fromarray(((grain * 18) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), dtype=np.float32) / 255 - 0.5
    # 1.0 civarında çarpan: lekeler koyulaştırır, tane hafif doku verir
    mult = 1.0 - 0.16 * np.clip(stains - 0.35, 0, 1) * 1.6 + grain * 0.08
    return mult[..., None]


def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def grade(rgb):
    """Doygunluğu düşür, sepyaya çek, kontrastı yumuşat."""
    gray = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    rgb = gray[..., None] + (rgb - gray[..., None]) * 0.72
    sepia = np.stack([gray * 1.07, gray * 0.95, gray * 0.80], -1)
    rgb = rgb * 0.85 + sepia * 0.15
    rgb = 18 + rgb * 0.90  # siyahları kaldır
    return rgb


def panel_mask(h, w, seed, margin=60, radius=70):
    """Kenarları hafif dalgalı/yırtık yuvarlatılmış dikdörtgen maske (0..1)."""
    rng = np.random.default_rng(seed + 11)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = np.maximum(np.maximum(margin + radius - xx, xx - (w - margin - radius)), 0)
    dy = np.maximum(np.maximum(margin + radius - yy, yy - (h - margin - radius)), 0)
    d = np.sqrt(dx ** 2 + dy ** 2) - radius  # içeride <0
    wobble = (_noise(h, w, 60, rng) - 0.5) * 22 + (_noise(h, w, 12, rng) - 0.5) * 6
    d = d + wobble
    return np.clip(-d / 3.0, 0, 1)[..., None], d[..., None]


def stylize(img, seed=7, panel=True):
    img = cover(img.convert("RGB"), W, H)
    rgb = grade(np.asarray(img, dtype=np.float32))
    tex = paper_texture(H, W, seed)
    if panel:
        mask, dist = panel_mask(H, W, seed)
        paper = np.broadcast_to(PAPER, rgb.shape)
        # panel içinde resim, kenar boyunca yanık/koyu çizgi
        edge = np.exp(-np.abs(dist + 4) / 5.0) * 0.35
        rgb = rgb * mask + paper * (1 - mask)
        rgb = rgb * (1 - edge) + np.array([90, 70, 50], dtype=np.float32) * edge
        # panel içine hafif kâğıt rengi karışımı (baskı hissi)
        rgb = rgb * (1 - 0.06 * mask) + paper * 0.06 * mask
    else:
        rgb = rgb * 0.88 + PAPER * 0.12
    rgb = rgb * tex
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.75)) ** 2)
    vig = 1 - 0.38 * np.clip(r - 0.45, 0, 1) ** 1.4
    rgb = rgb * vig[..., None]
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--no-panel", action="store_true")
    a = ap.parse_args()
    stylize(Image.open(a.src), a.seed, panel=not a.no_panel).save(a.dst, quality=92)
