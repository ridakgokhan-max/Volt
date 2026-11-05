"""Dinozorların Yok Oluşu — V2 (Bir Dakikada Bilim). Kodla çizilen hareketli grafikler + SDXL illüstrasyonları + Gemini anlatım.

Kullanım: python scripts/dino_v2.py <calisma_klasoru> <cikti.mp4> [--onizleme t1,t2,...]
Çalışma klasöründe: tex.npy, clouds.npy (dino_geo), parts.json (bölüm süreleri), words.json (kelime zamanları),
                    img/*.png (SDXL görselleri), narr.wav (anlatım)
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dino_geo as G  # noqa: E402
from parchment import PAPER, grade, panel_mask, paper_texture  # noqa: E402

W, H, FPS = 1080, 1920, 30
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf"
BLUE = (38, 104, 220)
HILITE = (90, 175, 255)
rng0 = np.random.default_rng(11)


def ease(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ease_io(x):
    x = np.clip(x, 0, 1)
    return x * x * x * (x * (6 * x - 15) + 10)


def seg(t, a, b):
    return np.clip((t - a) / max(b - a, 1e-6), 0, 1)


def cover(img, w=W, h=H):
    s = max(w / img.shape[1], h / img.shape[0])
    r = cv2.resize(img, (round(img.shape[1] * s), round(img.shape[0] * s)), interpolation=cv2.INTER_LANCZOS4)
    y0, x0 = (r.shape[0] - h) // 2, (r.shape[1] - w) // 2
    return r[y0:y0 + h, x0:x0 + w]


def kenburns(img, t, z0=1.0, z1=1.12, dx=0.0, dy=0.0, cx=0.5, cy=0.5):
    """Görsel üzerinde yumuşak kamera: yakınlaşma + kayma (t 0..1)."""
    z = z0 + (z1 - z0) * ease_io(t)
    ox = (cx * W) + dx * W * ease_io(t)
    oy = (cy * H) + dy * H * ease_io(t)
    M = np.float32([[z, 0, W / 2 - ox * z], [0, z, H / 2 - oy * z]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


# ---------------- ortak katmanlar ----------------
class Ctx:
    def __init__(self, work):
        self.work = work
        self.tex = np.load(os.path.join(work, "tex.npy")).astype(np.float32)
        self.clouds = np.load(os.path.join(work, "clouds.npy")).astype(np.float32)
        self.img = {}
        for f in os.listdir(os.path.join(work, "img")):
            if f.endswith(".png"):
                im = cv2.cvtColor(cv2.imread(os.path.join(work, "img", f)), cv2.COLOR_BGR2RGB)
                self.img[f[:-4]] = grade(cover(im).astype(np.float32)) * 0.55 + cover(im).astype(np.float32) * 0.45
        self.pm, dist = panel_mask(H, W, 7, margin=34, radius=54)
        self.edge = np.exp(-np.abs(dist + 4) / 5.0) * 0.35
        self.ptex = paper_texture(H, W, 7)
        Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((X - W / 2) / (W * 0.75)) ** 2 + ((Y - H / 2) / (H * 0.75)) ** 2)
        self.vig = (1 - 0.32 * np.clip(r - 0.45, 0, 1) ** 1.4)[..., None]
        self.X, self.Y = X, Y
        self.paper = np.broadcast_to(PAPER, (H, W, 3)).astype(np.float32)
        # yıldızlar
        n = 900
        self.stars = np.column_stack([rng0.uniform(0, W, n), rng0.uniform(0, H, n), rng0.uniform(0.4, 1.0, n) ** 3,
                                      rng0.uniform(0, 6.28, n)])
        neb = np.zeros((H // 8, W // 8), np.float32)
        for s, a in ((2, 0.5), (6, 0.3), (18, 0.2)):
            k = rng0.random((H // 8 // s + 2, W // 8 // s + 2)).astype(np.float32)
            neb += cv2.resize(cv2.GaussianBlur(k, (0, 0), 1), (W // 8, H // 8)) * a
        neb = cv2.resize(neb, (W, H), interpolation=cv2.INTER_CUBIC)
        self.nebula = np.clip((neb - 0.45) * 2.2, 0, 1)
        # haritalar (büyük, önceden çizilmiş)
        self.map_big, self.map_land, self.mapP, self.map_ppd = G.region_map(-118, -58, 3, 38, 3240, int(3240 * 1.75))
        self.rock = rock_sprite(220)

    def finish(self, c):
        o = c * self.pm + self.paper * (1 - self.pm)
        o = o * (1 - self.edge) + np.array([90, 70, 50], np.float32) * self.edge
        o = o * (1 - 0.04 * self.pm) + self.paper * 0.04 * self.pm
        return o * self.ptex * self.vig


def rock_sprite(n):
    """Düzensiz, kraterli asteroid (RGBA)."""
    r = np.random.default_rng(4)
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32) / n * 2 - 1
    ang = np.arctan2(yy, xx)
    rad = 0.78 + 0.08 * np.sin(3 * ang + 1) + 0.05 * np.sin(5 * ang + 2) + 0.03 * np.sin(9 * ang)
    d = np.sqrt(xx ** 2 + yy ** 2)
    a = np.clip((rad - d) * n / 3, 0, 1)
    nz = cv2.resize(cv2.GaussianBlur(r.random((n // 6, n // 6)).astype(np.float32), (0, 0), 1), (n, n))
    z = np.sqrt(np.clip(1 - (d / rad) ** 2, 0, 1))
    L = np.array([-0.5, -0.6, 0.62])
    nx, ny = xx / rad, yy / rad
    shade = np.clip(nx * L[0] + ny * L[1] + z * L[2], 0, 1) * 0.85 + 0.15
    col = np.dstack([96 + 40 * nz, 88 + 34 * nz, 84 + 30 * nz]) * shade[..., None]
    for _ in range(9):
        cx, cy, cr = r.uniform(-0.5, 0.5), r.uniform(-0.5, 0.5), r.uniform(0.05, 0.16)
        dd = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        rim = np.exp(-((dd - cr) / 0.02) ** 2) * 0.25
        pit = np.clip(1 - dd / cr, 0, 1) * 0.3
        col = col * (1 - pit[..., None]) + col * rim[..., None]
    return np.dstack([col, a]).astype(np.float32)


def stars_layer(ctx, t, drift=(0, 0), bright=1.0):
    img = np.zeros((H, W, 3), np.float32)
    img += ctx.nebula[..., None] * np.array([46, 28, 70]) + np.array([9, 9, 20])
    xs = (ctx.stars[:, 0] + drift[0]) % W
    ys = (ctx.stars[:, 1] + drift[1]) % H
    b = ctx.stars[:, 2] * (0.75 + 0.25 * np.sin(t * 3 + ctx.stars[:, 3])) * bright
    xi, yi = xs.astype(int), ys.astype(int)
    img[yi, xi] += (b[:, None] * np.array([255, 245, 235]))
    img = cv2.GaussianBlur(img, (0, 0), 0.7) * 1.6
    return img


def add_glow(img, x, y, r, col, s=1.0):
    x0, x1 = int(max(0, x - 3 * r)), int(min(W, x + 3 * r))
    y0, y1 = int(max(0, y - 3 * r)), int(min(H, y + 3 * r))
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    g = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * r * r)) * s
    img[y0:y1, x0:x1] += g[..., None] * np.array(col, np.float32)


def paste_rgba(img, spr, x, y, scale, rot=0.0):
    n = spr.shape[0]
    s = scale / n
    M = cv2.getRotationMatrix2D((n / 2, n / 2), rot, s)
    M[0, 2] += x - n / 2
    M[1, 2] += y - n / 2
    lay = cv2.warpAffine(spr, M, (W, H), flags=cv2.INTER_LINEAR, borderValue=0)
    a = lay[..., 3:4]
    img[:] = img * (1 - a) + lay[..., :3] * a


class Particles:
    def __init__(self, n, seed):
        self.r = np.random.default_rng(seed)
        self.n = n
        self.p = None

    def burst(self, x, y, speed, spread, life, up=-1.0):
        a = self.r.uniform(-spread, spread, self.n) + (np.pi / 2 if up < 0 else -np.pi / 2) * -1
        v = self.r.uniform(0.3, 1.0, self.n) * speed
        self.p = np.column_stack([np.full(self.n, x), np.full(self.n, y), np.cos(a) * v, -np.abs(np.sin(a)) * v,
                                  self.r.uniform(0.5, 1.0, self.n) * life, self.r.uniform(1.5, 5, self.n)])


def draw_points(img, xs, ys, sizes, cols, alphas):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    alphas = np.broadcast_to(np.asarray(alphas, np.float64), np.shape(xs))
    for x, y, s, c, a in zip(xs, ys, sizes, cols, alphas):
        if 0 <= x < W and 0 <= y < H and a > 0.01:
            d.ellipse([x - s, y - s, x + s, y + s], fill=(int(c[0]), int(c[1]), int(c[2]), int(255 * min(1, a))))
    arr = np.asarray(lay, np.float32)
    al = arr[..., 3:4] / 255
    img[:] = img * (1 - al) + arr[..., :3] * al


# ---------------- sahneler ----------------
def scene_impact(ctx, t, dur, tl):
    """Uzaydan Dünya'ya yaklaşma, asteroidin atmosfere girişi, gerilim, ışık patlaması ve şok dalgası."""
    t_imp = tl["impact"]
    u = min(t, t_imp)
    # kamera: küre büyür, Chicxulub ekranın alt-orta bölgesine gelir
    zoom = ease_io(seg(u, 0.0, t_imp - 0.6)) ** 1.6
    R = 360 + (3400 - 360) * zoom
    target = np.array([540, 1250 - 250 * zoom])  # krater noktasının ekran yeri
    cy = target[1] + R * 0.55 * zoom + (1 - zoom) * 120  # yakınlaştıkça merkez aşağı iner (ufuk görünür)
    cx = 540.0
    Yt = np.clip((cy - target[1]) / R, -0.99, 0.99)
    lat0 = G.CHICX[0] - np.degrees(np.arcsin(Yt))
    lon0 = G.CHICX[1] + 32 * (1 - ease_io(seg(u, 0, t_imp - 0.8)))
    drift = (-40 * t, 25 * t)
    img = stars_layer(ctx, t, drift, bright=1 - 0.6 * zoom)

    def veil(lat, lon):
        if t < t_imp:
            return np.zeros_like(lat)
        k = seg(t, t_imp, t_imp + 1.2)
        la, lo = np.radians(lat), np.radians(lon)
        c = np.sin(la) * np.sin(np.radians(G.CHICX[0])) + np.cos(la) * np.cos(np.radians(G.CHICX[0])) * np.cos(lo - np.radians(G.CHICX[1]))
        ang = np.degrees(np.arccos(np.clip(c, -1, 1)))
        return np.clip(1 - ang / (2 + 9 * k), 0, 1) * 0.9

    g, a = G.render_globe(ctx.tex, cx, cy, R, lon0, lat0, W, H, clouds=ctx.clouds, cloud_lon=t * 2, veil=veil)
    img = img * (1 - a[..., None]) + g
    ix, iy, iz = G.latlon_to_screen(G.CHICX[0], G.CHICX[1], cx, cy, R, lon0, lat0)
    # asteroid yolu: sağ üstten çarpma noktasına
    p = ease(seg(t, 0.0, t_imp)) ** 2.2
    sx, sy = 980 - 60 * p, 120 + 80 * p
    ax, ay = sx + (ix - sx) * p, sy + (iy - sy) * p
    size = 46 + 130 * p ** 1.5
    heat = seg(t, t_imp - 2.6, t_imp - 0.3)
    if t < t_imp:
        # kuyruk (iz)
        dx, dy = sx - ax, sy - ay
        L = np.hypot(dx, dy) + 1e-6
        trail_len = 160 + 800 * heat
        steps = 60
        lay = np.zeros((H, W, 3), np.float32)
        for k in range(steps):
            f = k / steps
            px, py = ax + dx / L * trail_len * f, ay + dy / L * trail_len * f
            rr = size * (0.55 - 0.45 * f) * (0.4 + heat)
            col = np.array([255, 190 - 90 * f, 90 - 80 * f]) * (1 - f) * (0.45 + 0.8 * heat)
            cv2.circle(lay, (int(px), int(py)), max(1, int(rr)), col.tolist(), -1, cv2.LINE_AA)
        lay = cv2.GaussianBlur(lay, (0, 0), 6 + 10 * heat)
        img += lay
        add_glow(img, ax, ay, size * (0.9 + 1.6 * heat), (255, 170, 90), 0.5 + 1.6 * heat)
        paste_rgba(img, ctx.rock, ax, ay, size, rot=t * 40)
        add_glow(img, ax - size * 0.2, ay + size * 0.25, size * 0.6, (255, 220, 160), 1.4 * heat)
        # kıvılcımlar
        if heat > 0:
            rr_ = np.random.default_rng(int(t * FPS))
            m = int(40 * heat)
            ox = rr_.normal(0, 1, m)
            xs = ax + dx / L * rr_.uniform(0, trail_len * 0.6, m) + ox * size * 0.6
            ys = ay + dy / L * rr_.uniform(0, trail_len * 0.6, m) + rr_.normal(0, 1, m) * size * 0.6
            draw_points(img, xs, ys, rr_.uniform(1, 3.5, m), [(255, 210, 140)] * m, rr_.uniform(0.4, 1, m))
    # gerilim: çarpmadan hemen önce kısa yavaşlama ve kararma
    tension = seg(t, t_imp - 0.55, t_imp) * (t < t_imp)
    img = img * (1 - 0.25 * tension)
    if t >= t_imp:
        k = t - t_imp
        # şok dalgası halkaları + parlak kraterden yükselen sütun
        for j, (spd, w_) in enumerate(((900, 26), (520, 14))):
            rr = 20 + spd * k
            fade = max(0, 1 - k / 1.0)
            cv2.ellipse(img, (int(ix), int(iy)), (int(rr), int(rr * 0.32)), 0, 0, 360,
                        (255 * fade, 220 * fade, 170 * fade), w_, cv2.LINE_AA)
        img = cv2.GaussianBlur(img, (0, 0), 1.0)
        rr_ = np.random.default_rng(3)
        m = 260
        ang = rr_.uniform(np.pi * 0.05, np.pi * 0.95, m)
        v0 = rr_.uniform(300, 1300, m)
        ex = ix + np.cos(ang) * v0 * k * (1 if True else 0) * np.sign(rr_.uniform(-1, 1, m))
        ey = iy - np.sin(ang) * v0 * k + 600 * k * k
        ec = [(255, 200 - 80 * q, 120 - 80 * q) for q in rr_.uniform(0, 1, m)]
        draw_points(img, ex, ey, rr_.uniform(2, 6, m), ec, np.clip(1 - k / 1.15, 0, 1) * rr_.uniform(0.5, 1, m))
        add_glow(img, ix, iy - 40 * k, 140 + 220 * k, (255, 160, 80), 2.2 * max(0, 1 - k / 1.4))
        # ışık patlaması
        flash = np.exp(-k / 0.18) if k > 0.05 else k / 0.05
        img = img * (1 - 0.85 * flash) + 255 * 0.85 * flash
        # sarsıntı
        sh = 18 * np.exp(-k / 0.35)
        M = np.float32([[1, 0, sh * np.sin(k * 90)], [0, 1, sh * np.cos(k * 77)]])
        img = cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    return img


def scene_map(ctx, t, dur, tl):
    """Yucatán haritasına yakınlaşma, 180 km halka ve ölçek; ardından krater kesiti."""
    u = t / dur
    if u < 0.62:
        return map_zoom(ctx, t, dur * 0.62)
    return crater_section(ctx, (u - 0.62) / 0.38, dur * 0.38)


def map_zoom(ctx, t, dur):
    u = t / dur
    big = ctx.map_big
    P = ctx.mapP
    cxk, cyk = P(G.CHICX[1], G.CHICX[0])
    # görünen genişlik: geniş (Kuzey/Orta Amerika) -> Yucatán
    z = ease_io(seg(u, 0.0, 0.7))
    view_w = 3240 * (1 - z) + 560 * z
    cx = 1620 * (1 - z) + cxk * z
    cy = 2835 * (1 - z) * 0.72 + cyk * z + 160 * z
    s = W / view_w
    M = np.float32([[s, 0, W / 2 - cx * s], [0, s, H / 2 - cy * s]])
    img = cv2.warpAffine(big, M, (W, H), flags=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    X, Y = cxk * s + M[0, 2], cyk * s + M[1, 2]
    km = ctx.map_ppd / 111.2 * s  # px/km (yaklaşık; enlem düzeltmesi haritada)
    pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    f_lab = ImageFont.truetype(FONT_B, 40)
    f_small = ImageFont.truetype(FONT_B, 34)
    # yanıp sönen işaret
    pulse = (t * 1.6) % 1
    rp = 12 + 40 * pulse
    d.ellipse([X - rp, Y - rp, X + rp, Y + rp], outline=(190, 40, 30, int(255 * (1 - pulse))), width=4)
    d.ellipse([X - 9, Y - 9, X + 9, Y + 9], fill=(190, 40, 30, 255))
    if z > 0.5:
        a = int(255 * seg(u, 0.5, 0.65))
        d.text((X + 30, Y - 120), "YUCATÁN", font=f_lab, fill=(40, 34, 30, a))
        d.text((X + 30, Y - 76), "MEKSİKA", font=f_small, fill=(70, 60, 52, a))
    # 180 km halka ve ölçek
    ring = seg(u, 0.72, 0.9)
    if ring > 0:
        r = 90 * km
        ang = 360 * ring
        d.arc([X - r, Y - r, X + r, Y + r], -90, -90 + ang, fill=(170, 30, 24, 255), width=7)
        if ring >= 1:
            d.line([X - r, Y + r + 40, X + r, Y + r + 40], fill=(40, 34, 30, 255), width=5)
            for xx in (X - r, X + r):
                d.line([xx, Y + r + 26, xx, Y + r + 54], fill=(40, 34, 30, 255), width=5)
            d.text((X - 92, Y + r + 60), "~180 KM", font=f_lab, fill=(40, 34, 30, 255))
            # asteroid ölçeği (10-15 km) — aynı ölçekte
            ra = 6.25 * km
            ax_, ay_ = X - r - 150, Y - r * 0.2
            d.ellipse([ax_ - ra, ay_ - ra, ax_ + ra, ay_ + ra], fill=(60, 56, 54, 255))
            d.text((ax_ - 120, ay_ + 22), "asteroid", font=f_small, fill=(40, 34, 30, 255))
            d.text((ax_ - 120, ay_ + 58), "10–15 km", font=f_small, fill=(40, 34, 30, 255))
    return np.asarray(pil, np.float32)


def crater_section(ctx, u, dur):
    """Bilimsel krater kesiti: geçici boşluk oluşur, çöker; tepe halkası ve erimiş kayaç oluşur."""
    img = np.zeros((H, W, 3), np.float32) + np.array([226, 214, 190])
    top = 760
    xs = np.arange(W)
    cx = W / 2
    half = 470  # ekranda kraterin yarı genişliği (~90 km)
    p_form = ease(seg(u, 0.0, 0.35))
    p_coll = ease(seg(u, 0.35, 0.7))
    # katmanlar
    layers = [(top, (126, 156, 176), "SIĞ DENİZ"), (top + 60, (210, 190, 150), "KİREÇTAŞI"),
              (top + 240, (168, 150, 130), "KABUK"), (top + 560, (120, 104, 96), "")]
    x = (xs - cx) / half
    bowl_t = np.clip(1 - x ** 2, 0, None)
    depth = (520 * bowl_t) * p_form * (1 - 0.55 * p_coll)
    peak = p_coll * 140 * np.exp(-((np.abs(x) - 0.42) / 0.12) ** 2) + p_coll * 60 * np.exp(-(x / 0.12) ** 2)
    surf = top + 60 + depth - peak
    for i, (y0, col, _) in enumerate(layers):
        y1 = layers[i + 1][0] if i + 1 < len(layers) else H
        for xi in range(W):
            a = int(max(y0, surf[xi] if i <= 1 else y0))
            b = int(y1)
            if b > a:
                img[a:b, xi] = col
    # krater içi: erimiş kayaç ve dolgu
    melt = p_coll
    for xi in range(W):
        if bowl_t[xi] > 0 and depth[xi] > 4:
            a = int(top + 60)
            b = int(surf[xi])
            if b > a:
                img[a:b, xi] = (226, 214, 190) if u < 0.35 else (150, 136, 120)
            mb = int(surf[xi] + 40 * melt * bowl_t[xi])
            img[int(surf[xi]):mb, xi] = (210, 100, 50)
    # su tabakası çarpmada itilir
    pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    d.line([(xi, int(surf[xi])) for xi in range(0, W, 3)], fill=(46, 40, 36, 255), width=4)
    for i, (y0, col, lab) in enumerate(layers[:-1]):
        d.line([0, y0, W, y0], fill=(46, 40, 36, 120), width=2)
    f = ImageFont.truetype(FONT_B, 34)
    fl = ImageFont.truetype(FONT_B, 44)
    d.text((60, top + 8), "SIĞ DENİZ", font=f, fill=(30, 50, 70, 230))
    d.text((60, top + 130), "KİREÇTAŞI", font=f, fill=(80, 64, 40, 230))
    d.text((60, top + 400), "YER KABUĞU", font=f, fill=(60, 50, 44, 230))
    if u < 0.38:
        a = int(255 * seg(u, 0.12, 0.25))
        d.text((cx - 150, top + 260), "GEÇİCİ BOŞLUK", font=fl, fill=(46, 40, 36, a))
    if u > 0.62:
        a = int(255 * seg(u, 0.62, 0.75))
        px = cx + 0.42 * half
        d.line([px, top + 60 - 120, px + 90, top - 120], fill=(46, 40, 36, a), width=3)
        d.text((px + 20, top - 180), "TEPE HALKASI", font=f, fill=(46, 40, 36, a))
        d.line([cx - 60, top + 120, cx - 260, top + 330], fill=(46, 40, 36, a), width=3)
        d.text((cx - 470, top + 336), "ERİMİŞ KAYAÇ", font=f, fill=(150, 60, 30, a))
    if u > 0.78:
        a = int(255 * seg(u, 0.78, 0.9))
        y = top - 60
        d.line([cx - half, y, cx + half, y], fill=(170, 30, 24, a), width=5)
        for xx in (cx - half, cx + half):
            d.line([xx, y - 18, xx, y + 18], fill=(170, 30, 24, a), width=5)
        d.text((cx - 95, y - 70), "~180 KM", font=fl, fill=(170, 30, 24, a))
    out = np.asarray(pil, np.float32)
    # hafif kamera kayması
    return kenburns(out, u, 1.06, 1.0, cy=0.52)


def scene_after(ctx, t, dur, tl):
    u = t / dur
    if u < 0.36:
        return fire(ctx, u / 0.36, t)
    if u < 0.7:
        return veil_globe(ctx, (u - 0.36) / 0.34, t)
    return dim_sky(ctx, (u - 0.7) / 0.3, t)


def fire(ctx, v, t):
    img = kenburns(ctx.img["orman-yangin"], v, 1.0, 1.1, dy=-0.02)
    fl = 1 + 0.08 * np.sin(t * 23) + 0.05 * np.sin(t * 37 + 1)
    img = img * fl
    # sıcaklık dalgalanması (üst yarı)
    yy = ctx.Y
    disp = (np.sin(yy / 18 + t * 9) * 2.5 * (yy < H * 0.6)).astype(np.float32)
    img = cv2.remap(img, (ctx.X + disp).astype(np.float32), ctx.Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    r = np.random.default_rng(7)
    m = 140
    x0 = r.uniform(0, W, m)
    sp = r.uniform(60, 220, m)
    ph = r.uniform(0, 10, m)
    ys = (H * 0.95 - (sp * (t + ph)) % (H * 0.95))
    xs = x0 + 30 * np.sin(t * 2 + ph)
    draw_points(img, xs, ys, r.uniform(1.5, 4, m), [(255, 170, 70)] * m, 0.9 * np.clip(ys / H, 0.2, 1))
    return img


def veil_globe(ctx, v, t):
    img = stars_layer(ctx, t, (-10 * t, 0), 0.8)
    R = 470 + 40 * v
    cx, cy = 600, 1000
    lon0 = G.CHICX[1] + 20 - 70 * v
    k = ease(v)

    def veil(lat, lon):
        la, lo = np.radians(lat), np.radians(lon)
        c = np.sin(la) * np.sin(np.radians(G.CHICX[0])) + np.cos(la) * np.cos(np.radians(G.CHICX[0])) * np.cos(lo - np.radians(G.CHICX[1]))
        ang = np.degrees(np.arccos(np.clip(c, -1, 1)))
        nz = 0.15 * np.sin(np.radians(lon) * 5 + lat / 9) + 0.1 * np.sin(np.radians(lat) * 7)
        return np.clip((25 + 190 * k - ang) / 30 + nz, 0, 1)

    g, a = G.render_globe(ctx.tex, cx, cy, R, lon0, 15, W, H, clouds=ctx.clouds, cloud_lon=t * 3, veil=veil,
                          light=(-0.8, -0.2, 0.55))
    img = img * (1 - a[..., None]) + g
    # güneş (sol üst) sönükleşir
    sun = 1 - 0.75 * k
    add_glow(img, 130, 380, 120, (255, 220, 160), 1.4 * sun)
    add_glow(img, 130, 380, 40, (255, 250, 230), 2.5 * sun)
    # ışık ölçer
    pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    f = ImageFont.truetype(FONT_B, 34)
    x0, y0, w_ = 120, 1560, 840
    d.rounded_rectangle([x0, y0, x0 + w_, y0 + 34], 16, outline=(230, 230, 240, 220), width=3)
    lvl = 1 - 0.8 * k
    col = (int(255), int(200 * lvl + 40), int(80 * lvl + 40), 230)
    d.rounded_rectangle([x0 + 5, y0 + 5, x0 + 5 + (w_ - 10) * lvl, y0 + 29], 12, fill=col)
    d.text((x0, y0 - 46), "YÜZEYE ULAŞAN GÜNEŞ IŞIĞI", font=f, fill=(235, 235, 245, 230))
    return np.asarray(pil, np.float32)


def dim_sky(ctx, v, t):
    img = kenburns(ctx.img["toz-gok"], v, 1.04, 1.12, dx=0.02)
    dark = 0.15 + 0.5 * ease(v)
    grad = np.clip(1 - ctx.Y / H * 1.1, 0, 1)[..., None]
    img = img * (1 - dark * (0.5 + 0.5 * grad)) + np.array([40, 32, 36]) * dark * 0.3
    r = np.random.default_rng(9)
    m = 220
    x0 = r.uniform(0, W, m)
    sp = r.uniform(40, 120, m)
    ph = r.uniform(0, 20, m)
    ys = (sp * (t + ph)) % H
    xs = x0 + 40 * np.sin(t * 0.8 + ph)
    draw_points(img, xs, ys, r.uniform(1.5, 4.5, m), [(200, 196, 190)] * m, r.uniform(0.3, 0.8, m))
    # termometre
    pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    x, y = 930, 560
    d.rounded_rectangle([x - 18, y, x + 18, y + 380], 18, fill=(240, 240, 240, 200), outline=(40, 40, 50, 230), width=3)
    d.ellipse([x - 36, y + 360, x + 36, y + 432], fill=(200, 60, 40, 240), outline=(40, 40, 50, 230), width=3)
    lvl = 0.8 - 0.55 * ease(v)
    d.rectangle([x - 9, y + 380 - 360 * lvl, x + 9, y + 380], fill=(200, 60, 40, 240))
    for k in range(6):
        d.line([x + 20, y + 30 + k * 60, x + 34, y + 30 + k * 60], fill=(40, 40, 50, 230), width=3)
    return np.asarray(pil, np.float32)


def bird_silhouette(img, x, y, s, phase, col=(30, 28, 34), alpha=1.0):
    """Kanat çırpan kuş silueti (vektör)."""
    flap = np.sin(phase)
    pts_body = [(-1.0, 0.0), (-0.3, -0.12), (0.5, -0.1), (1.0, 0.02), (0.5, 0.12), (-0.3, 0.1)]
    wing_y = -0.9 * flap
    wl = [(-0.1, -0.05), (-0.55, wing_y - 0.1), (-0.95, wing_y * 0.9 + 0.1), (0.15, 0.0)]
    wr = [(0.1, -0.05), (0.2, wing_y * 0.8 - 0.25), (0.55, wing_y * 0.7 - 0.05), (0.3, 0.0)]
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for poly in (pts_body, wl, wr):
        d.polygon([(x + px * s, y + py * s) for px, py in poly], fill=(*col, int(255 * alpha)))
    arr = np.asarray(lay, np.float32)
    a = arr[..., 3:4] / 255
    img[:] = img * (1 - a) + arr[..., :3] * a


def scene_end_of_dinos(ctx, t, dur, tl):
    u = t / dur
    if u < 0.5:
        v = u / 0.5
        img = kenburns(ctx.img["dinozor-suru"], v, 1.0, 1.1, dx=0.03)
        dark = 0.55 * ease(seg(v, 0.2, 1.0))
        grad = np.clip(1 - ctx.Y / (H * 0.7), 0, 1)[..., None]
        img = img * (1 - dark * (0.4 + 0.6 * grad))
        r = np.random.default_rng(5)
        m = 160
        ys = (r.uniform(30, 90, m) * (t + r.uniform(0, 20, m))) % H
        draw_points(img, r.uniform(0, W, m), ys, r.uniform(1.5, 3.5, m), [(190, 186, 180)] * m, 0.7 * seg(v, 0.25, 0.6))
        # besin zinciri
        food_chain(img, seg(v, 0.12, 0.3), seg(v, 0.55, 0.8))
        return img
    v = (u - 0.5) / 0.5
    img = kenburns(ctx.img["kurak"], v, 1.0, 1.08, dy=-0.02)
    warm = ease(seg(v, 0.55, 1.0))
    img = img * (1 - 0.25 * warm) + np.array([255, 196, 130]) * 0.25 * warm * np.clip(1 - ctx.Y / H, 0, 1)[..., None]
    if v > 0.5:
        k = seg(v, 0.5, 1.0)
        bird_silhouette(img, -60 + 760 * k, 640 - 180 * k + 20 * np.sin(k * 9), 42, t * 14, alpha=min(1, k * 3))
    return img


def food_chain(img, appear, crack):
    if appear <= 0:
        return
    pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    f = ImageFont.truetype(FONT_B, 34)
    labs = ["BİTKİLER", "OTÇULLAR", "ETÇİLLER"]
    a = int(235 * appear)
    y = 560
    xs = [230, 540, 850]
    for i, (x, lab) in enumerate(zip(xs, labs)):
        d.rounded_rectangle([x - 120, y - 46, x + 120, y + 46], 22, fill=(250, 244, 230, a), outline=(46, 40, 36, a), width=3)
        tw = d.textlength(lab, font=f)
        d.text((x - tw / 2, y - 20), lab, font=f, fill=(46, 40, 36, a))
        if i < 2:
            x1, x2 = x + 120, xs[i + 1] - 120
            d.line([x1 + 6, y, x2 - 6, y], fill=(46, 40, 36, a), width=5)
            d.polygon([(x2 - 6, y), (x2 - 22, y - 10), (x2 - 22, y + 10)], fill=(46, 40, 36, a))
            if crack > 0:
                m = (x1 + x2) / 2
                c = int(255 * crack)
                d.line([m - 16, y - 22, m + 16, y + 22], fill=(200, 40, 30, c), width=7)
                d.line([m - 16, y + 22, m + 16, y - 22], fill=(200, 40, 30, c), width=7)
    img[:] = np.asarray(pil, np.float32)


def scene_birds(ctx, t, dur, tl):
    u = t / dur
    if u < 0.58:
        v = u / 0.58
        s = ease_io(seg(v, 0.18, 0.75))
        img = ctx.morph(s)
        img = kenburns(img, v, 1.0, 1.06)
        pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
        d = ImageDraw.Draw(pil, "RGBA")
        f = ImageFont.truetype(FONT_B, 44)
        for lab, al in (("TÜYLÜ THEROPOD", 1 - s), ("GÜNÜMÜZ KUŞU", s)):
            if al > 0.02:
                tw = d.textlength(lab, font=f)
                d.rounded_rectangle([W / 2 - tw / 2 - 24, 1180, W / 2 + tw / 2 + 24, 1250], 16, fill=(250, 244, 230, int(220 * al)))
                d.text((W / 2 - tw / 2, 1190), lab, font=f, fill=(46, 40, 36, int(255 * al)))
        return np.asarray(pil, np.float32)
    v = (u - 0.58) / 0.42
    img = kenburns(ctx.img["orman-sabah"], v, 1.12, 1.02, dx=0.06)
    bx = 300 + 420 * ease_io(v)
    by = 1000 - 420 * ease_io(v) + 25 * np.sin(v * 10)
    bird_silhouette(img, bx, by, 70 - 20 * v, t * 13)
    for j in range(5):
        k = seg(v, 0.2 + j * 0.08, 1.0)
        if k > 0:
            bird_silhouette(img, 1000 - 900 * k + j * 40, 420 + j * 36 - 80 * k, 14, t * 15 + j, alpha=0.8)
    return img


def scene_final(ctx, t, dur, tl):
    u = t / dur
    if u < 0.34:
        return crater_map_scientific(ctx, u / 0.34, t)
    if u < 0.58:
        return kpg_layers(ctx, (u - 0.34) / 0.24, t)
    v = (u - 0.58) / 0.42
    img = kenburns(ctx.img["kus-yakin"], v, 1.0, 1.14, cy=0.45)
    fade = ease(seg(v, 0.72, 1.0))
    return img * (1 - 0.92 * fade)


def crater_map_scientific(ctx, v, t):
    big, P = ctx.map_big, ctx.mapP
    cxk, cyk = P(G.CHICX[1], G.CHICX[0])
    z = ease_io(v)
    view_w = 620 * (1 - z) + 2100 * z  # bilimsel yakın görünüm -> gerçek konum (geniş)
    s = W / view_w
    M = np.float32([[s, 0, W / 2 - cxk * s], [0, s, H / 2 - cyk * s]])
    img = cv2.warpAffine(big, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    km = ctx.map_ppd / 111.2 * s
    X, Y = W / 2, H / 2
    # yerçekimi anomalisi tarzı eş merkezli halkalar (gömülü krater yapısı)
    d2 = np.sqrt((ctx.X - X) ** 2 + (ctx.Y - Y) ** 2) / km  # km
    ringv = np.cos(d2 / 90 * np.pi * 3.2) * np.exp(-((d2 - 60) / 70) ** 2)
    mask = np.clip(1 - d2 / 130, 0, 1)
    col = np.where(ringv[..., None] > 0, np.array([200, 70, 60]), np.array([60, 90, 190]))
    img = img * (1 - 0.45 * mask[..., None] * np.abs(ringv)[..., None]) + col * 0.45 * mask[..., None] * np.abs(ringv)[..., None]
    pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    f = ImageFont.truetype(FONT_B, 38)
    r = 90 * km
    d.ellipse([X - r, Y - r, X + r, Y + r], outline=(46, 40, 36, 230), width=3)
    d.text((X - 170, Y + r + 20), "GÖMÜLÜ KRATER", font=f, fill=(46, 40, 36, 255))
    if z > 0.6:
        a = int(255 * seg(v, 0.6, 0.8))
        d.text((X + r + 20, Y - 30), "CHICXULUB", font=f, fill=(170, 30, 24, a))
    return np.asarray(pil, np.float32)


def kpg_layers(ctx, v, t):
    img = np.zeros((H, W, 3), np.float32)
    r = np.random.default_rng(2)
    y = 0
    cols = [(196, 176, 142), (178, 160, 128), (206, 190, 158), (170, 150, 122)]
    bands = []
    while y < H * 1.3:
        hh = r.integers(70, 160)
        bands.append((y, hh, cols[len(bands) % 4]))
        y += hh
    kpg_y = int(H * 0.62)
    off = -180 * ease_io(v)
    for y0, hh, c in bands:
        a, b = int(y0 + off), int(y0 + hh + off)
        img[max(0, a):max(0, min(H, b))] = c
    nz = cv2.resize(cv2.GaussianBlur(r.random((H // 6, W // 6)).astype(np.float32), (0, 0), 1), (W, H))
    img *= (0.88 + 0.2 * nz[..., None])
    ky = int(kpg_y + off)
    glow = 0.5 + 0.5 * np.sin(t * 5)
    img[ky:ky + 18] = np.array([52, 44, 40]) + np.array([60, 30, 10]) * glow
    pil = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    f = ImageFont.truetype(FONT_B, 40)
    fs = ImageFont.truetype(FONT_B, 32)
    a = int(255 * seg(v, 0.15, 0.4))
    d.line([620, ky + 9, 760, ky - 90], fill=(40, 34, 30, a), width=4)
    d.rounded_rectangle([560, ky - 190, 1020, ky - 92], 18, fill=(250, 244, 230, int(a * 0.9)))
    d.text((580, ky - 180), "K-Pg SINIRI", font=f, fill=(170, 30, 24, a))
    d.text((580, ky - 132), "iridyumca zengin kil katmanı", font=fs, fill=(46, 40, 36, a))
    d.text((60, ky - 70), "KRETASE", font=fs, fill=(46, 40, 36, a))
    d.text((60, ky + 34), "↓ daha eski", font=fs, fill=(46, 40, 36, int(a * 0.8)))
    d.text((60, ky - 120), "↑ PALEOJEN", font=fs, fill=(46, 40, 36, a))
    return np.asarray(pil, np.float32)


# ---------------- morf (tüylü dinozor -> kuş) ----------------
def make_morph(a, b):
    ga = cv2.cvtColor(a.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    gb = cv2.cvtColor(b.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    fab = dis.calc(ga, gb, None)
    fba = dis.calc(gb, ga, None)
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))

    def at(s):
        s = float(s)
        ma = cv2.remap(a, (gx + fba[..., 0] * s).astype(np.float32), (gy + fba[..., 1] * s).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        mb = cv2.remap(b, (gx + fab[..., 0] * (1 - s)).astype(np.float32), (gy + fab[..., 1] * (1 - s)).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        k = ease(seg(s, 0.25, 0.75))
        return ma * (1 - k) + mb * k
    return at


# ---------------- yazılar ----------------
def draw_brand(d):
    f = ImageFont.truetype(FONT_B, 30)
    d.text((70, 62), "BİR DAKİKADA", font=f, fill=(255, 255, 255, 235), stroke_width=3, stroke_fill=(30, 30, 40, 200))
    w = d.textlength("BİR DAKİKADA ", font=f)
    d.text((70 + w, 62), "BİLİM", font=f, fill=(225, 70, 50, 255), stroke_width=3, stroke_fill=(30, 30, 40, 200))


def draw_title(img_pil, text, k, y=300):
    """Mavi kutulu başlık etiketi (orijinal videonun kimliği): k 0..1 görünürlük."""
    if k <= 0:
        return
    f = ImageFont.truetype(FONT_B, 56)
    lines = wrap(text, f, 820)
    lw = max(ImageDraw.Draw(img_pil).textlength(ln, font=f) for ln in lines)
    bw, bh = int(lw + 64), int(len(lines) * 68 + 34)
    box = Image.new("RGBA", (bw + 40, bh + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(box)
    d.rectangle([20, 20, 20 + bw, 20 + bh], fill=(*BLUE, 245))
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=f)
        d.text((20 + (bw - tw) / 2, 34 + i * 68), ln, font=f, fill=(255, 255, 255, 255))
    s = 0.85 + 0.15 * ease(min(1, k * 3))
    box = box.rotate(2, resample=Image.BICUBIC, expand=True)
    box = box.resize((int(box.width * s), int(box.height * s)), Image.BICUBIC)
    alpha = np.asarray(box, np.float32)
    alpha[..., 3] *= min(1, k * 3) if k < 1 else 1
    box = Image.fromarray(alpha.clip(0, 255).astype(np.uint8))
    img_pil.alpha_composite(box, (int(W / 2 - box.width / 2), int(y - box.height / 2)))


def wrap(text, font, maxw):
    words, lines, cur = text.split(), [], ""
    dd = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    for w in words:
        t = (cur + " " + w).strip()
        if dd.textlength(t, font=font) > maxw and cur:
            lines.append(cur)
            cur = w
        else:
            cur = t
    lines.append(cur)
    return lines


def tr_upper(s):
    return s.replace("i", "İ").replace("ı", "I").upper()


def caption_groups(words, n=3, maxw=900):
    f = ImageFont.truetype(FONT_B, 66)
    dd = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    groups, cur = [], []
    for i, w in enumerate(words):
        trial = " ".join(tr_upper(words[j]["w"]) for j in cur + [i])
        if cur and dd.textlength(trial, font=f) > maxw:
            groups.append(cur)
            cur = []
        cur.append(i)
        if len(cur) >= n or w["w"].rstrip()[-1:] in ".,!?;:":
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def draw_caption(d, words, groups, t, y=1330):
    cur = -1
    for i, w in enumerate(words):
        if w["start"] <= t:
            cur = i
    if cur < 0:
        return
    g = next(g for g in groups if cur in g)
    if t > words[g[-1]]["end"] + 0.5:
        return
    f = ImageFont.truetype(FONT_B, 66)
    shown = [i for i in g]
    txt = [tr_upper(words[i]["w"]) for i in shown]
    sp = d.textlength(" ", font=f)
    widths = [d.textlength(x, font=f) for x in txt]
    tot = sum(widths) + sp * (len(txt) - 1)
    x = W / 2 - tot / 2
    for i, x_txt, wd in zip(shown, txt, widths):
        on = i <= cur
        col = HILITE if i == cur else (255, 255, 255)
        d.text((x, y), x_txt, font=f, fill=(*col, 255 if on else 110), stroke_width=6, stroke_fill=(20, 22, 34, 255 if on else 90))
        x += wd + sp


# ---------------- ana döngü ----------------
SCENES = [scene_impact, scene_map, scene_after, scene_end_of_dinos, scene_birds, scene_final]


def build_timeline(parts):
    """parts: [{"ad":"P1","sure":...}, ...] -> sahne sınırları ve anlatım başlangıçları."""
    d = [p["sure"] for p in parts]
    lead = 0.25
    s1 = lead + d[0] + 0.45 + 1.15  # anlatım + gerilim + çarpışma/sessizlik
    tl = {"impact": lead + d[0] + 0.45, "starts": [], "voice": []}
    t = 0.0
    durs = [s1] + [d[i] + 0.38 for i in range(1, len(d))]
    durs[-1] += 1.6  # final soru ekranı
    vstart = [lead] + [None] * (len(d) - 1)
    for i, du in enumerate(durs):
        tl["starts"].append(t)
        if i > 0:
            vstart[i] = t + 0.12
        t += du
    tl["durs"] = durs
    tl["voice"] = vstart
    tl["total"] = t
    return tl


TITLES = [("DÜNYA'YI TEK BİR ÇARPIŞMA DEĞİŞTİRDİ.", 0.3, -0.6), ("66 MİLYON YIL ÖNCE", 0.2, 0.6),
          ("GÜNEŞ IŞIĞI AZALDI. İKLİM DEĞİŞTİ.", 0.36, 1.0), ("YAŞAM YOK OLMADI.", 0.74, 1.0),
          ("DİNOZORLARIN BİR KOLU HÂLÂ YAŞIYOR.", 0.08, 0.95), ("66 MİLYON YIL SONRA HÂLÂ İZLERİ BURADA.", 0.05, 0.55)]


def render(work, dst, preview=None):
    ctx = Ctx(work)
    parts = json.load(open(os.path.join(work, "parts.json")))
    words = json.load(open(os.path.join(work, "words.json")))
    tl = build_timeline(parts)
    a, b = ctx.img["tuylu-dinozor"], ctx.img["kus-dal"]
    ctx.morph = make_morph(a, b)
    groups = caption_groups(words)
    total = int(np.ceil(tl["total"] * FPS))
    json.dump(tl, open(os.path.join(work, "timeline.json"), "w"), indent=1)
    frames = [int(x * FPS) for x in preview] if preview else range(total)
    enc = None
    if not preview:
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                                "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
                                "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
    tiles = []
    for f in frames:
        t = f / FPS
        k = max(i for i, s in enumerate(tl["starts"]) if s <= t + 1e-6)
        lt = t - tl["starts"][k]
        img = SCENES[k](ctx, lt, tl["durs"][k], tl)
        # sahne geçişi: son 0.25 sn'de bir sonrakine çapraz geçiş (çarpışma sahnesi beyazdan çıkar)
        if k + 1 < len(SCENES) and tl["durs"][k] - lt < 0.25:
            nxt = SCENES[k + 1](ctx, 0.0, tl["durs"][k + 1], tl)
            m = ease(1 - (tl["durs"][k] - lt) / 0.25)
            img = img * (1 - m) + nxt * m
        img = ctx.finish(img)
        if k == len(SCENES) - 1:  # finalde kâğıt da kararır
            v = lt / tl["durs"][k]
            img = img * (1 - 0.85 * ease(seg(v, 0.82, 0.95)))
        pil = Image.fromarray(img.clip(0, 255).astype(np.uint8)).convert("RGBA")
        d = ImageDraw.Draw(pil, "RGBA")
        draw_brand(d)
        title, ta, tb = TITLES[k]
        v = lt / tl["durs"][k]
        tb_ = tb if tb > 0 else (tl["impact"] + tb) / tl["durs"][k]
        kk = seg(v, ta, ta + 0.06) * (1 - seg(v, tb_, tb_ + 0.04))
        draw_title(pil, title, kk)
        if k == len(SCENES) - 1:
            q = seg(v, 0.84, 0.9)
            if q > 0:
                fq = ImageFont.truetype(FONT_B, 92)
                txt = "Sen ne düşünüyorsun?"
                tw = d.textlength(txt, font=fq)
                d.text((W / 2 - tw / 2, 880), txt, font=fq, fill=(255, 255, 255, int(255 * q)), stroke_width=5,
                       stroke_fill=(20, 22, 34, int(255 * q)))
        draw_caption(d, words, groups, t)
        frame = np.asarray(pil.convert("RGB"))
        if preview:
            tiles.append(cv2.resize(frame, (270, 480)))
        else:
            enc.stdin.write(frame.tobytes())
            if f % 60 == 0:
                print("kare", f, "/", total, flush=True)
    if preview:
        cv2.imwrite(dst, cv2.cvtColor(np.hstack(tiles), cv2.COLOR_RGB2BGR))
    else:
        enc.stdin.close()
        enc.wait()
    return tl


if __name__ == "__main__":
    pv = None
    if "--onizleme" in sys.argv:
        pv = [float(x) for x in sys.argv[sys.argv.index("--onizleme") + 1].split(",")]
    render(sys.argv[1], sys.argv[2], pv)
