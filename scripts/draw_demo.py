"""Çizilerek anlatım demosu: görselin çizgileri kalemle çiziliyormuş gibi belirir, sonra renk dolar.

Kullanım: python scripts/draw_demo.py cikti.mp4
"""
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage, signal
from skimage import filters, graph, morphology

sys.path.insert(0, "scripts")
from parchment import H, PAPER, W, cover, stylize  # noqa: E402

FPS = 30
SCENE_F = 102  # sahne başına kare (3,4 sn)
DRAW_END, FILL_END, FADE_START = 60, 82, 94
INK = np.array([38, 30, 26], dtype=np.float32)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

SCENES = [
    ("out/gorsel-test/01-nehir.jpg", "Bir zamanlar sakin bir nehrin kıyısında..."),
    ("out/gorsel-test/03-saatci.jpg", "yaşlı bir saatçi zamanı tamir ederdi."),
    ("out/gorsel-test/04-sehir.jpg", "Bugün ise şehir hiç durmadan koşuyor."),
]


def line_mask(raw):
    g = np.asarray(raw.convert("L"), dtype=np.float32) / 255
    g = filters.gaussian(g, 0.8)
    loc = filters.threshold_local(g, 21, offset=0.035)
    m = (g < loc) | (g < 0.22)
    m = morphology.remove_small_objects(m, 60)
    return m


def draw_times(mask):
    """Her çizgi pikseline 0..1 arası 'çizilme zamanı' verir: büyük çizgiler önce, her çizgi kendi içinde akar."""
    lab, n = ndimage.label(mask, structure=np.ones((3, 3)))
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    costs = np.where(mask, 1.0, np.inf)
    seeds = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        ys, xs = np.nonzero(lab[sl] == i + 1)
        k = np.argmin(ys * 10000 + xs)
        seeds.append((ys[k] + sl[0].start, xs[k] + sl[1].start))
    dist, _ = graph.MCP_Geometric(costs).find_costs(seeds)
    dist = np.where(mask, dist, 0)
    maxd = ndimage.maximum(dist, lab, range(1, n + 1))
    order = np.argsort(-sizes)
    start = np.zeros(n)
    acc = 0.0
    total = sizes.sum()
    for i in order:
        start[i] = acc
        acc += sizes[i] / total
    dur = sizes / total
    comp = np.clip(lab - 1, 0, None)
    t = start[comp] + dur[comp] * (dist / np.maximum(maxd[comp], 1))
    return np.where(mask, t, 9.0)


def pencil(d, x, y):
    ang = np.deg2rad(-35)
    ux, uy = np.cos(ang), np.sin(ang)  # kalemin gövde yönü (yukarı-sağ)
    px, py = -uy, ux
    L, w = 230, 22

    def P(a, b):
        return (x + ux * a + px * b, y + uy * a + py * b)

    d.polygon([P(0, 0), P(38, -w / 2), P(38, w / 2)], fill=(222, 190, 140), outline=(40, 30, 26))
    d.polygon([P(0, 0), P(13, -4), P(13, 4)], fill=(50, 45, 45))
    d.polygon([P(38, -w / 2), P(L, -w / 2), P(L, w / 2), P(38, w / 2)], fill=(232, 178, 58), outline=(40, 30, 26))
    d.polygon([P(L, -w / 2), P(L + 26, -w / 2), P(L + 26, w / 2), P(L, w / 2)], fill=(214, 120, 120), outline=(40, 30, 26))


def caption(d, font, words, k, alpha=1.0):
    shown = words[:k]
    if not shown:
        return
    sp = d.textlength(" ", font=font)
    widths = [d.textlength(w, font=font) for w in shown]
    lines, cur, cw = [], [], 0
    for i, wd in enumerate(widths):
        if cur and cw + sp + wd > W - 160:
            lines.append((cur, cw))
            cur, cw = [], 0
        cw = cw + (sp if cur else 0) + wd
        cur.append(i)
    lines.append((cur, cw))
    y = 1500
    for idx, lw in lines:
        x = (W - lw) / 2
        for i in idx:
            col = (255, 212, 0) if i == k - 1 else (255, 255, 255)
            d.text((x, y), shown[i], font=font, fill=col, stroke_width=5, stroke_fill=(26, 20, 16))
            x += widths[i] + sp
        y += 88


def pencil_audio(n_frames, active):
    sr = 44100
    n = int(n_frames / FPS * sr)
    rng = np.random.default_rng(1)
    noise = rng.normal(0, 1, n)
    b, a = signal.butter(2, [1800 / (sr / 2), 7000 / (sr / 2)], "band")
    s = signal.lfilter(b, a, noise)
    t = np.arange(n) / sr
    strokes = 0.55 + 0.45 * np.sin(2 * np.pi * 7.3 * t + 2 * np.sin(2 * np.pi * 1.1 * t))
    env = np.interp(t, np.arange(len(active)) / FPS, active.astype(float))
    env = np.convolve(env, np.ones(800) / 800, mode="same")
    out = s * strokes * env * 0.18
    pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
    return sr, pcm


def main(dst):
    font = ImageFont.truetype(FONT, 70)
    total = SCENE_F * len(SCENES)
    ff = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", dst + ".noaudio.mp4"],
        stdin=subprocess.PIPE,
    )
    active = np.zeros(total)
    paper = np.asarray(stylize(Image.new("RGB", (W, H), tuple(int(c) for c in PAPER)), seed=5), dtype=np.float32)
    rng = np.random.default_rng(3)
    for si, (path, text) in enumerate(SCENES):
        raw = cover(Image.open(path).convert("RGB"), W, H)
        final = np.asarray(stylize(raw, seed=5), dtype=np.float32)
        m = line_mask(raw)
        # panel dışına taşan çizgileri at
        inside = np.abs(paper - final).sum(-1) > 6
        inside = ndimage.binary_erosion(inside, iterations=6)
        m &= inside
        tm = draw_times(m)
        wipe = filters.gaussian(rng.random((H // 8, W // 8)), 3)
        wipe = np.asarray(Image.fromarray((wipe / wipe.max() * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), dtype=np.float32) / 255
        words = text.split()
        prev = -1.0
        for f in range(SCENE_F):
            g = si * SCENE_F + f
            p = min(1.0, f / DRAW_END)
            p = 1 - (1 - p) ** 1.6  # başta hızlı, sona doğru yavaşlayan çizim
            drawn = (tm <= p).astype(np.float32)
            fillp = np.clip((f - DRAW_END) / (FILL_END - DRAW_END), 0, 1)
            A = np.clip((fillp * 1.4 - wipe) / 0.35, 0, 1)[..., None]
            base = paper * (1 - A) + final * A
            ink = drawn[..., None] * (1 - 0.75 * A)
            frame = base * (1 - ink) + INK * ink
            zoom = 1 + 0.05 * f / SCENE_F
            img = Image.fromarray(frame.clip(0, 255).astype(np.uint8))
            if zoom > 1:
                cw, ch = int(W / zoom), int(H / zoom)
                img = img.crop(((W - cw) // 2, (H - ch) // 2, (W - cw) // 2 + cw, (H - ch) // 2 + ch)).resize((W, H), Image.BILINEAR)
            d = ImageDraw.Draw(img)
            if f < DRAW_END:
                front = (tm > prev) & (tm <= p)
                if front.any():
                    ys, xs = np.nonzero(front)
                    cx, cy = xs.mean(), ys.mean()
                    cx = (cx - W / 2) * zoom + W / 2
                    cy = (cy - H / 2) * zoom + H / 2
                    pencil(d, cx, cy)
                    active[g] = 1
            prev = p
            k = min(len(words), int(f / (SCENE_F * 0.8) * len(words)) + 1)
            caption(d, font, words, k)
            arr = np.asarray(img, dtype=np.float32)
            fade = 1.0
            if f >= FADE_START:
                fade = 1 - (f - FADE_START) / (SCENE_F - FADE_START)
            if si > 0 and f < 6:
                fade = f / 6
            arr = arr * fade + paper * (1 - fade)
            ff.stdin.write(arr.clip(0, 255).astype(np.uint8).tobytes())
        print("sahne", si + 1, "tamam", flush=True)
    ff.stdin.close()
    ff.wait()
    sr, pcm = pencil_audio(total, active)
    with wave.open(dst + ".wav", "wb") as wv:
        wv.setnchannels(1)
        wv.setsampwidth(2)
        wv.setframerate(sr)
        wv.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", dst + ".noaudio.mp4", "-i", dst + ".wav", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", dst], check=True)


if __name__ == "__main__":
    main(sys.argv[1])
