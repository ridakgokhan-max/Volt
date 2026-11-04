"""Kara Kedi Reels V3 — derinlik paralakslı kurgu motoru (kurgu.py yardımcılarını kullanır).
Kullanım: python3 kurgu_v3.py [--onizleme t1,t2,...] [--cikti dosya.mp4]
"""
import glob
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, "/home/claude/karakedi/uretim")
os.environ.setdefault("METIN", "/home/claude/volt/uretim/kara-kedi/gemini/metin_tam.txt")
import kurgu as K  # noqa: E402

W, H, FPS = K.W, K.H, K.FPS
V3 = "/home/claude/karakedi/v3"
ASSETS = "/home/claude/volt/out/assets"
DERIN = "/home/claude/volt-istatistik/uretim/kara-kedi/derinlik"
ease, ease_out, ease_in, clamp, lerp = K.ease, K.ease_out, K.ease_in, K.clamp, K.lerp
ORANGE, CREAM, INK = K.ORANGE, K.CREAM, K.INK

# ---------------------------------------------------------------- görsel + derinlik yükleme
_C = {}
UY, UX = np.mgrid[0:H, 0:W].astype(np.float32)
UX -= W / 2
UY -= H / 2


def kaynak(ad):
    """ad: 'k04' (Kadir) veya 'kk4-a/usta-a' (SDXL). Döner: (bgr, derinlik 0..1 yakın=1)"""
    if ad in _C:
        return _C[ad]
    if ad.startswith("k") and len(ad) == 3:
        p = f"{V3}/temiz/{ad}.png" if os.path.exists(f"{V3}/temiz/{ad}.png") else f"{V3}/buyuk/{ad}.png"
        a = cv2.imread(p)
        dp = f"{DERIN}/{ad}_derinlik.png"
    else:
        a = cv2.imread(f"{ASSETS}/{ad}.png")
        a = cv2.resize(a, (a.shape[1] * 2, a.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
        bl = cv2.GaussianBlur(a, (0, 0), 1.4)
        a = cv2.addWeighted(a, 1.4, bl, -0.4, 0)
        dp = f"{DERIN}/{ad.split('/')[-1]}_derinlik.png"
    if os.path.exists(dp):
        d = cv2.imread(dp, cv2.IMREAD_UNCHANGED).astype(np.float32)
        d = d / (65535.0 if d.max() > 255 else 255.0)
        d = cv2.resize(d, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_LINEAR)
        d = cv2.GaussianBlur(d, (0, 0), 6)
    else:
        print("derinlik yok:", ad)
        h, w = a.shape[:2]
        d = np.tile(np.linspace(0.3, 0.7, h, dtype=np.float32)[:, None], (1, w))
    if ad in ("kk4-b/harita-a", "k01", "k12"):
        a = cv2.bilateralFilter(a, 9, 30, 7)
    _C[ad] = (a, d)
    return _C[ad]


def pcam(ad, cx=0.5, cy=0.5, z=1.0, rot=0.0, px=0.0, py=0.0, dz=0.0, d0=0.5, dx=0.0, dy=0.0):
    """Derinlik paralakslı kamera. z=1: kaynak genişliği ekran genişliğine eşit.
    px,py: yakın (d=1) katmanın uzak katmana göre ekranda kayması (piksel); dz: dolly (yakın katman büyür)."""
    src, dep = kaynak(ad)
    sh, sw = src.shape[:2]
    sc = W / sw * z
    sc = max(sc, H / sh * 1.0) if z >= 1 and (sh * sc) < H else sc
    th = math.radians(rot)
    c, s = math.cos(th), math.sin(th)
    ox, oy = UX - dx, UY - dy
    bx = cx * sw + (c * ox + s * oy) / sc
    by = cy * sh + (-s * ox + c * oy) / sc
    if px or py or dz:
        dd = cv2.remap(dep, bx, by, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT) - d0
        k = 1.0 / (1.0 + dz * dd)
        mx = cx * sw + (bx - cx * sw) * k - px * dd / sc
        my = cy * sh + (by - cy * sh) * k - py * dd / sc
    else:
        mx, my = bx, by
    return cv2.remap(src, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def to_screen(ad, x, y, cx, cy, z):
    src, _ = kaynak(ad)
    sh, sw = src.shape[:2]
    sc = W / sw * z
    return W / 2 + (x * sw - cx * sw) * sc, H / 2 + (y * sh - cy * sh) * sc


def flicker(t, k=1.0):
    return 1 + k * (0.5 * math.sin(t * 13.1) + 0.3 * math.sin(t * 29.7 + 1) + 0.2 * math.sin(t * 7.3 + 2))


def warm_glow(f, pts, t, r=160, s=0.55):
    return K.glow_spots(f, pts, s * flicker(t, 0.25), r, (40, 130, 255))


SMOKE = None


def smoke(f, x, y, t, a=0.35):
    global SMOKE
    if SMOKE is None:
        rg = np.random.default_rng(4)
        n = rg.normal(0, 1, (240, 160)).astype(np.float32)
        SMOKE = cv2.GaussianBlur(n, (0, 0), 9)
    h, w = 520, 220
    yy = (np.arange(h)[:, None] + t * 60) % 240
    xx = (np.arange(w)[None, :] + 20 * np.sin(np.arange(h)[:, None] / 40 + t)) % 160
    m = SMOKE[yy.astype(int), xx.astype(int)]
    m = np.clip(m * 4 + 0.2, 0, 1) * np.linspace(1, 0, h)[:, None] * np.exp(-((np.arange(w) - w / 2) / 50) ** 2)[None, :]
    x0, y0 = int(x - w / 2), int(y - h)
    x1, y1 = max(0, x0), max(0, y0)
    x2, y2 = min(W, x0 + w), min(H, y0 + h)
    if x2 <= x1 or y2 <= y1:
        return f
    mm = m[y1 - y0:y2 - y0, x1 - x0:x2 - x0, None] * a
    roi = f[y1:y2, x1:x2].astype(np.float32)
    f[y1:y2, x1:x2] = (roi * (1 - mm) + 190 * mm).astype(np.uint8)
    return f


def stamp(f, text, cx, cy, u, size=150, angle=-12):
    """mühür gibi çarpan kırmızı damga"""
    if u < 0:
        return f
    k = clamp(u / 0.12)
    s = lerp(2.0, 1.0, ease_in(k))
    a = K.torn_tag(text, size=size, bg=(150, 28, 24), fg=CREAM, angle=angle)
    a = cv2.resize(a, None, fx=s * 0.8, fy=s * 0.8)
    h, w = a.shape[:2]
    return K.over(f, a, int(cx - w / 2), int(cy - h / 2), clamp(k * 2))


def unroll(f, bg, u, dur=0.9):
    """parşömen açılması: yukarıdan aşağı açılır, açılan kenarda rulo gölgesi."""
    k = ease_out(clamp(u / dur))
    yb = int(lerp(260, H, k))
    out = bg.copy()
    out[yb:] = (out[yb:] * 0.15).astype(np.uint8)
    out[:yb] = f[:yb]
    if k < 1:
        r0, r1 = max(0, yb - 70), min(H, yb + 30)
        g = np.linspace(0.55, 1.25, r1 - r0)[:, None, None]
        out[r0:r1] = np.clip(out[r0:r1].astype(np.float32) * g, 0, 255).astype(np.uint8)
        cv2.rectangle(out, (0, yb), (W, min(H, yb + 34)), (120, 168, 205), -1)
        cv2.line(out, (0, yb + 34), (W, yb + 34), (40, 60, 80), 3)
    return out


# ---------------------------------------------------------------- metin / altyazı / sahneler
TTS = open("/home/claude/volt/uretim/kara-kedi/gemini/metin_v3.txt", encoding="utf-8").read().split()
K.TTS = TTS
SUBS = [
    ("*1233'TE* BİR PAPA,", 6), ("KARA BİR KEDİYİ", 3), ("ŞEYTANİ BİR AYİNİN", 3), ("PARÇASI OLARAK ANLATTI.", 3),
    ("AMA KEDİLERİN ÖLDÜRÜLMESİNİ", 3), ("EMRETTİĞİ İDDİASI", 2), ("DOĞRU DEĞİLDİ.", 2),
    ("*PAPA* *IX.* *GREGORY'NİN*", 3), ("*VOX* *IN* *RAMA* ADLI BELGESİ,", 5), ("ALMANYA'DA SAPKINLIKLA", 2),
    ("SUÇLANAN BİR GRUBUN", 3), ("SÖZDE AYİNLERİNİ ANLATIYORDU.", 3), ("KARA KEDİ DE", 3), ("BU ANLATININ İÇİNDEYDİ.", 3),
    ("ŞİMDİ YAKLAŞIK", 2), ("BEŞ YÜZ YIL İLERİ GİDELİM.", 5), ("*1730'LARIN* SONLARINDA", 5), ("*PARİS'TE,*", 1),
    ("BİR MATBAA ÇIRAĞININ", 3), ("YILLAR SONRA YAZDIĞI ANI,", 4), ("ÇOK DAHA TUHAF", 3), ("BİR OLAYI ANLATIYORDU.", 3),
    ("ANIYA GÖRE ÇIRAKLAR,", 3), ("USTALARININ SEVDİĞİ KEDİ DE DAHİL", 6), ("BİRÇOK KEDİYİ ÖLDÜRMÜŞTÜ.", 3),
    ("TARİHÇİ ROBERT DARNTON", 3), ("BU OLAYI,", 2), ("AĞIR ÇALIŞMA KOŞULLARI", 3), ("VE USTALARINA DUYULAN", 3),
    ("ÖFKEYLE İLİŞKİLENDİRDİ.", 2),
    ("İKİ OLAY ARASINDA", 3), ("DOĞRUDAN BİR BAĞLANTI", 3), ("KANITLANMIŞ DEĞİL.", 2), ("AMA BİZE DÜŞÜNDÜRÜCÜ", 3),
    ("BİR SORU BIRAKIYOR:", 3), ("İNSANLAR BAZEN", 2), ("KENDİ *KORKULARINI*", 2), ("HAYVANLARA MI YÜKLÜYOR?", 3),
    (None, 4), (None, 3),
]
assert sum(n for _, n in SUBS) == len(TTS), (sum(n for _, n in SUBS), len(TTS))

SCENES = [  # id, başlangıç sözcüğü, dönem
    ("A01", None, "orta"), ("A02", "şeytani", "orta"), ("A03", "Papa", "orta"), ("A04", "Almanya'da", "orta"),
    ("A05", "sözde", "orta"), ("A06", "Kara", "orta"), ("A07", "Şimdi", "orta"), ("A08", "Bin", "paris"),
    ("A09", "matbaa", "paris"), ("A10", "anı,", "paris"), ("A11", "Anıya", "paris"), ("A12", "ustalarının", "paris"),
    ("A13", "birçok", "paris"), ("A14", "Tarihçi", "paris"), ("A15", "ağır", "paris"), ("A16", "İki", "karma"),
    ("A17", "İnsanlar", "karma"), ("A18", "Sen", "karma"),
]


def tok(word, after=0):
    for i in range(after, len(TTS)):
        if K.norm(TTS[i]).startswith(K.norm(word)):
            return i
    raise ValueError(word)


def build_timeline(times, total):
    starts, last = [], 0
    for sid, w, era in SCENES:
        if w is None:
            starts.append(0.0)
            continue
        i = tok(w, last)
        j = i - 1 if sid in ("A09", "A06") else i  # "bir matbaa", "Kara kedi"
        if sid == "A06":
            j = i
        starts.append(max(0.0, times[j][0] - 0.1))
        last = i + 1
    end = total + 0.5
    return [{"id": sid, "start": starts[k], "end": starts[k + 1] if k + 1 < len(SCENES) else end, "era": era}
            for k, (sid, w, era) in enumerate(SCENES)], end


def T(word, after=None):
    a = tok(after) if after else 0
    return TIMES[tok(word, a)][0]


# ---------------------------------------------------------------- sahneler
def scene(sc, t):
    sid, s, e = sc["id"], sc["start"], sc["end"]
    u, dur = t - s, e - s
    p = clamp(u / dur)
    fl, du = 0.0, 0
    if sid == "A01":  # göz ECU, kameraya bakış
        ad = "kk4-b/kedigoz-a"
        z = lerp(1.0, 1.1, ease(p))
        f = pcam(ad, 0.5, lerp(0.47, 0.42, ease(p)), z, px=lerp(-8, 8, p), dz=0.05 * p)
        f = K.glow_spots(f, [to_screen(ad, 0.12, 0.27, 0.5, lerp(0.47, 0.42, ease(p)), z), to_screen(ad, 0.83, 0.28, 0.5, lerp(0.47, 0.42, ease(p)), z)], 0.25 * flicker(t, 0.3), 80)
        fl = 0.05
        f = K.place_tag(f, "1233: BİR PAPA\nVE KARA KEDİLER", W / 2, 1020, u - 0.03, 99, size=118, angle=-3)
    elif sid == "A02":  # mühürlü parşömene hızlı geri çekiliş
        ad = "k01"
        k = ease_out(clamp(u / 0.5))
        k2 = ease(clamp((u - (T("Ama") - s)) / 0.5))
        z = lerp(4.2, 1.9, k) + 0.12 * p + 1.1 * k2
        f = pcam(ad, lerp(lerp(0.63, 0.55, k), 0.62, k2), lerp(lerp(0.71, 0.58, k), 0.70, k2), z, rot=lerp(10, 0, k) - 4 * k2, px=lerp(0, 18, p), dz=0.06 * p)
        if u < 0.3:
            f = K.motion_blur(f, 46 * (1 - u / 0.3), 35)
        fl = 0.04
        t_ama = T("Ama") - s
        f = K.place_tag(f, "AMA GERÇEK,\nANLATILANDAN FARKLIYDI.", W / 2, 330, u - t_ama + 0.05, 99, size=92, angle=-3)
        f = K.place_tag(f, "“ÖLDÜRÜN” EMRİ?", W / 2, 1000, u - (T("öldürülmesini") - s) + 0.1, 99, size=110, angle=4, bg=CREAM, fg=INK)
        f = stamp(f, "YOK", W / 2 + 230, 1130, u - (T("doğru") - s), size=150)
    elif sid == "A03":  # papa belgeyi inceliyor
        ad = "k04"
        f = pcam(ad, lerp(0.505, 0.5, p), lerp(0.47, 0.5, p), lerp(2.95, 3.25, ease(p)), px=lerp(26, -26, ease(p)), dz=0.10 * p)
        f = warm_glow(f, [(-60, 1150), (W + 60, 1150)], t, 260, 0.6)
        fl = 0.07
        f = K.place_tag(f, "PAPA IX. GREGORY · 1233", W / 2, 300, u - 0.1, 99, size=84, angle=-3, bg=CREAM, fg=INK)
        f = K.place_tag(f, "VOX IN RAMA", W / 2, 440, u - (T("Vox") - s), 99, size=110, angle=3)
    elif sid == "A04":  # harita: Almanya
        ad = "kk4-b/harita-a"
        cx, cy, z = lerp(0.5, 0.57, ease(p)), lerp(0.5, 0.52, ease(p)), lerp(1.15, 1.6, ease(p))
        f = pcam(ad, cx, cy, z, rot=lerp(-2, 1, p))
        x, y = to_screen(ad, 0.57, 0.52, cx, cy, z)
        k = ease(clamp((u - 0.2) / 0.8))
        if k > 0:
            ov = f.copy()
            cv2.circle(ov, (int(x), int(y)), int(190 * k), (35, 35, 150), -1, cv2.LINE_AA)
            f = K.blend(f, ov, 0.42)
            cv2.circle(f, (int(x), int(y)), 14, (40, 40, 170), -1, cv2.LINE_AA)
        f = K.place_tag(f, "ALMANYA", W / 2, 330, u - 0.15, 99, size=120, angle=-4)
    elif sid == "A05":  # sözde ayin
        ad = "k05"
        f = pcam(ad, lerp(0.46, 0.54, ease(p)), 0.5, 1.0, rot=lerp(-3, 3, p), px=lerp(-40, 40, ease(p)), py=-12, dz=0.08)
        f = warm_glow(f, [(170, 1350), (900, 1350), (540, 1240)], t, 200, 0.55)
        f = smoke(f, 540, 1250, t, 0.28)
        fl = 0.1
        du = 1
        f = K.place_tag(f, "“SÖZDE” AYİNLER", W / 2, 320, u - 0.1, 99, size=110, angle=-4)
    elif sid == "A06":  # parşömen açılır, belgedeki kedi
        ad = "k12"
        fr = pcam(ad, 0.5, 0.5, lerp(1.0, 1.08, ease(p)), px=lerp(-14, 14, p), dz=0.05)
        bg = np.full((H, W, 3), (40, 34, 30), np.uint8)
        f = unroll(fr, bg, u, 0.85)
        f = K.place_tag(f, "BELGEDEKİ KARA KEDİ", W / 2, 300, u - 0.6, 99, size=96, angle=-3, bg=CREAM, fg=INK)
    elif sid == "A07":  # haritada zaman/mekân geçişi
        ad = "kk4-b/harita-a"
        k = ease(clamp(u / (dur * 0.85)))
        cx, cy, z = lerp(0.57, 0.47, k), lerp(0.52, 0.57, k), lerp(1.6, 1.4, k)
        f = pcam(ad, cx, cy, z)
        a0 = to_screen(ad, 0.57, 0.52, cx, cy, z)
        a1 = to_screen(ad, 0.40, 0.60, cx, cy, z)
        q = ease(clamp((u - 0.15) / (dur * 0.7)))
        pts = [(int(lerp(a0[0], a1[0], v)), int(lerp(a0[1], a1[1], v) - 90 * math.sin(math.pi * v))) for v in np.linspace(0, q, 30)]
        for i in range(len(pts) - 1):
            if i % 2 == 0:
                cv2.line(f, pts[i], pts[i + 1], (235, 240, 245), 18, cv2.LINE_AA)
                cv2.line(f, pts[i], pts[i + 1], (30, 40, 200), 11, cv2.LINE_AA)
        cv2.circle(f, (int(a0[0]), int(a0[1])), 14, (30, 40, 200), -1, cv2.LINE_AA)
        cv2.circle(f, pts[-1], 22, (30, 40, 200), -1, cv2.LINE_AA)
        cv2.circle(f, pts[-1], 22, (235, 240, 245), 4, cv2.LINE_AA)
        yr = "1233" if u < 0.3 else ("1730'LAR" if q >= 0.98 else str(int(lerp(1233, 1730, q))))
        f = K.place_tag(f, yr, W / 2, 360, u - 0.05, 99, size=190, angle=-3)
        f = K.place_tag(f, "~500 YIL", W / 2 + 200, 560, u - 0.3, 99, size=80, angle=4, bg=CREAM, fg=INK)
    elif sid == "A08":  # Paris çatıları
        ad = "kk4-a/paris-a"
        f = pcam(ad, 0.5, lerp(0.6, 0.45, ease(p)), lerp(1.25, 1.12, ease(p)), py=lerp(30, -30, ease(p)), dz=0.08)
        f = K.place_tag(f, "PARİS · 1730'LAR", W / 2, 330, u - 0.05, 99, size=110, angle=-4)
    elif sid == "A09":  # matbaa geniş açı
        ad = "k02"
        f = pcam(ad, lerp(0.38, 0.62, ease(p)), 0.5, 2.25, px=lerp(40, -40, ease(p)), dz=0.06)
        bump = max(0, math.sin(u * 2 * math.pi / 0.8)) ** 10
        f = cv2.warpAffine(f, np.float32([[1, 0, 0], [0, 1, 5 * bump]]), (W, H), borderMode=cv2.BORDER_REFLECT)
        f = K.place_tag(f, "BİR MATBAA ÇIRAĞI", W / 2, 320, u - 0.15, 99, size=96, angle=-3, bg=CREAM, fg=INK)
    elif sid == "A10":  # anıyı yazan el
        ad = "k08"
        f = pcam(ad, lerp(0.66, 0.7, p), lerp(0.55, 0.5, p), lerp(2.6, 2.9, ease(p)), px=lerp(-20, 20, p), dz=0.08)
        f = warm_glow(f, [(int(W * 0.25), 900)], t, 180, 0.5)
        fl = 0.06
        f = K.place_tag(f, "NICOLAS CONTAT’IN ANISI", W / 2, 300, u - 0.1, 99, size=80, angle=-3, bg=CREAM, fg=INK)
    elif sid == "A11":  # yorgun çıraklar yakın
        ad = "k02"
        k = ease(p)
        f = pcam(ad, lerp(0.17, 0.2, k), lerp(0.45, 0.42, k), lerp(4.6, 5.0, k), px=lerp(-16, 16, k), dz=0.08)
        f = K.place_tag(f, "ANIYA GÖRE", W / 2, 320, u - 0.05, 99, size=100, angle=-4)
    elif sid == "A12":  # otoriter usta
        ad = "kk4-a/usta-b"
        f = pcam(ad, 0.5, lerp(0.40, 0.44, p), lerp(1.12, 1.3, ease(p)), rot=lerp(-4, -2, p), px=lerp(18, -18, p), dz=0.1)
        fl = 0.06
        f = K.place_tag(f, "USTANIN GÖZDE KEDİSİ DE", W / 2, 320, u - 0.15, 99, size=86, angle=-4)
    elif sid == "A13":  # sembolik: mumlar söner, gölgeler kaybolur
        ad = "kk4-b/golge-b"
        f = pcam(ad, 0.5, 0.5, 1.12 + 0.05 * p, px=lerp(-10, 10, p))
        edge = lerp(-150, W + 150, ease(p))
        dark = np.clip((edge - (UX + W / 2)) / 240, 0, 1)[..., None]
        f = (f.astype(np.float32) * (1 - 0.6 * dark)).astype(np.uint8)
        for i, x in enumerate((240, 540, 840)):
            if edge > x:
                f = smoke(f, x, 1150, t + i, 0.3)
        fl = 0.08
        f = K.place_tag(f, "BİRÇOK KEDİ", W / 2, 320, u - 0.1, 99, size=110, angle=-4)
    elif sid == "A14":  # baskı makinesi mekanizması + Darnton
        ad = "k02"
        bump = max(0, math.sin(u * 2 * math.pi / 0.7)) ** 10
        f = pcam(ad, 0.5, lerp(0.24, 0.3, p), lerp(3.4, 3.7, ease(p)), py=lerp(-14, 14, p), dz=0.06, dy=7 * bump)
        f = K.place_tag(f, "TARİHÇİ ROBERT DARNTON", W / 2, 320, u - 0.1, 99, size=86, angle=-3, bg=CREAM, fg=INK)
        f = K.place_tag(f, "BİR YORUM", W / 2 + 200, 470, u - 0.5, 99, size=64, angle=5)
    elif sid == "A15":  # mürekkepli eller → öfke
        ad = "kk4-a/eller-a"
        bump = max(0, math.sin(u * 2 * math.pi / 0.7)) ** 10
        f = pcam(ad, lerp(0.48, 0.52, p), 0.52, lerp(1.2, 1.4, ease(p)), px=lerp(-20, 20, p), dz=0.1, dy=5 * bump)
        fl = 0.06
        f = K.place_tag(f, "AĞIR ÇALIŞMA", W / 2, 320, u - 0.05, 99, size=110, angle=-4)
        f = K.place_tag(f, "ÖFKE", W / 2 + 160, 640, u - (T("öfkeyle") - s), 99, size=120, angle=6, bg=CREAM, fg=INK)
    elif sid == "A16":  # iki ayrı bağlam
        L = pcam("k01", 0.42, 0.55, 2.4)
        R = pcam("k08", 0.56, 0.66, 3.4)
        f = np.zeros((H, W, 3), np.uint8)
        f[:, :W // 2 - 6] = L[:, W // 4 + 3:W // 4 + 3 + W // 2 - 6]
        f[:, W // 2 + 6:] = R[:, W // 4 - 3:W // 4 - 3 + W // 2 - 6]
        f[:, W // 2 - 6:W // 2 + 6] = (20, 18, 16)
        zz = lerp(1.08, 1.0, ease(p))
        f = cv2.warpAffine(f, cv2.getRotationMatrix2D((W / 2, H / 2), 0, zz), (W, H), borderMode=cv2.BORDER_REFLECT)
        k = ease(clamp(u / (dur * 0.55)))
        gap = 80
        if k < 1:
            f = K.thread(f, 80, 1050, lerp(80, W / 2 - gap, k), 1050, 0)
            f = K.thread(f, W - 80, 1050, lerp(W - 80, W / 2 + gap, k), 1050, 0)
        else:
            sag = 140 * ease(clamp((u - dur * 0.55) / 0.6))
            f = K.thread(f, 80, 1050, W / 2 - gap, 1050 + sag, -sag * 0.2)
            f = K.thread(f, W - 80, 1050, W / 2 + gap, 1050 + sag, -sag * 0.2)
        f = K.place_tag(f, "1233", W / 4, 520, u - 0.05, 99, size=110, angle=-4)
        f = K.place_tag(f, "1730'LAR", 3 * W / 4, 520, u - 0.2, 99, size=96, angle=4, bg=CREAM, fg=INK)
        f = K.place_tag(f, "KANITLANMIŞ\nBAĞ YOK", W / 2, 780, u - (T("kanıtlanmış") - s), 99, size=110, angle=-3)
    elif sid == "A17":  # korku: insanlar ve kedi
        ad = "k11"
        f = pcam(ad, lerp(0.5, 0.55, ease(p)), lerp(0.55, 0.62, ease(p)), lerp(1.75, 2.1, ease(p)), px=lerp(-30, 30, ease(p)), dz=0.12)
        f = K.place_tag(f, "KORKU", W / 2, 330, u - (T("korkularını") - s), 99, size=140, angle=-5)
    elif sid == "A18":  # final: kedi kameraya bakar, arka plan sadeleşir
        ad = "k06"
        z = lerp(1.25, 2.2, ease(p))
        cy = lerp(0.52, 0.42, ease(p))
        f = pcam(ad, 0.5, cy, z, dz=0.05 * p)
        src, dep = kaynak(ad)
        # arka plan sadeleşir: yakın olmayan (kedi dışı) bölgeleri karart + bulanıklaştır
        dd = pcam_dep(ad, 0.5, cy, z)
        m = np.clip((0.62 - dd) / 0.25, 0, 1)[..., None] * ease(clamp(p * 1.6))
        blur = cv2.GaussianBlur(f, (0, 0), 14)
        f = (f * (1 - m) + (blur * 0.35) * m).astype(np.uint8)
        # göz kırpma
        eyes = []
        for ex, ey in EYES06:
            x, y = to_screen(ad, ex, ey, 0.5, cy, z)
            eyes.append((x, y, 46 * z, 38 * z))
        bt = u - dur * 0.42
        closed = clamp(1 - abs(bt - 0.11) / 0.11) if 0 <= bt <= 0.22 else 0
        f = K.eyelid(f, eyes, closed)
        f = K.glow_spots(f, [(x, y) for x, y, _, _ in eyes], 0.3 * (1 - closed), 60)
        f = K.place_tag(f, "SEN KARA BİR KEDİ\nGÖRDÜĞÜNDE NE\nDÜŞÜNÜYORSUN?", W / 2, 1420, u - 0.25, 99, size=96, angle=-2)
        k = clamp((u - (dur - 0.35)) / 0.35)
        if k > 0:  # döngü: açılış karesine karış
            f0 = pcam("kk4-b/kedigoz-a", 0.5, 0.47, 1.0)
            f = K.blend(f, f0, ease(k))
    return f, fl, du


def pcam_dep(ad, cx, cy, z):
    src, dep = kaynak(ad)
    sh, sw = src.shape[:2]
    sc = W / sw * z
    bx = cx * sw + UX / sc
    by = cy * sh + UY / sc
    return cv2.remap(dep, bx, by, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


SIG = None


def frame_at(t, tl):
    for k, sc in enumerate(tl):
        if sc["start"] <= t < sc["end"]:
            break
    f, fl, du = scene(sc, t)
    u = t - sc["start"]
    if k > 0 and u < 0.15 and sc["id"] not in ("A02", "A06", "A07"):
        prev = tl[k - 1]
        pf, _, _ = scene(prev, min(t, prev["end"] - 1e-3))
        f = K.blend(pf, f, ease(u / 0.15))
    f = K.finish(f, t, sc["era"], fl, du)
    for d, s0, s1 in SUB_TIMES:
        if s0 <= t < s1:
            f = K.place_sub(f, d, t - s0)
            break
    return K.over(f, SIG, 40, 46, 0.85)


# ---------------------------------------------------------------- ses
def build_audio(total, tl, voice_path, out_wav):
    SR = K.SR
    n = int(total * SR) + SR
    voice = np.zeros((n, 2), np.float32)
    v = K.load_audio(voice_path)
    rms = np.sqrt(np.mean(v[np.abs(v[:, 0]) > 0.01] ** 2) + 1e-9)
    v *= 0.12 / rms
    voice[:min(n, len(v))] += v[:n]
    K.TIMES = TIMES
    mus = music(total + 1, tl)[:n]
    env = np.convolve(np.abs(voice[:, 0]), np.ones(4800) / 4800, mode="same")
    duck = np.convolve(np.where(env > 0.01, 0.08, 0.26), np.ones(9600) / 9600, mode="same").astype(np.float32)
    mix = voice.copy()
    mix[:len(mus)] += mus * duck[:len(mus), None]
    sfx = np.zeros_like(mix)
    st = {s["id"]: s["start"] for s in tl}

    def S(ad, t, g=0.0, rate=1.0):
        try:
            K.add(sfx, K.load_audio(K.sfx_path(ad), rate=rate), max(0, t), g)
        except Exception as e:
            print("sfx yok", ad, e)
    S("impact_hit_434874", 0.0, -8)                       # açılış dramatik vurgu
    S("impactBell_heavy_000", 0.02, -22, 0.55)
    S("whoosh_494789", st["A02"] - 0.05, -9)
    S("page_flip_484933", st["A02"] + 0.35, -15)
    S("impact_hit_209012", T("doğru") - 0.02, -6, 0.8)    # YOK damgası
    S("impact_hit_718749", st["A03"] + 0.1, -18, 0.7)
    S("swoosh_transition_614169", st["A04"], -15)
    S("riser_cinematic_648732", st["A05"], -18)
    S("bookOpen", st["A06"], -6)                          # parşömen açılması
    S("page_flip_725433", st["A06"] + 0.1, -14)
    S("swoosh_transition_755054", st["A07"], -12)          # harita geçişi
    for k in range(5):
        S("chip-lay-%d" % (k % 3 + 1), st["A07"] + 0.3 + k * 0.13, -18, 0.7)
    S("whoosh_222493", st["A08"], -22)
    t0 = st["A09"]
    while t0 < st["A10"]:                                 # matbaa mekanik sesleri
        S("impactGeneric_light_001", t0 + 0.2, -11, 0.6)
        S("mechanical_gears_813053", t0 + 0.05, -24, 0.8)
        t0 += 0.8
    S("page_flip_437121", st["A10"] + 0.2, -16)
    S("creak2", st["A12"] + 0.1, -14)
    S("cloth2", st["A13"] + 0.2, -16)
    t0 = st["A14"]
    while t0 < st["A16"]:
        S("impactGeneric_light_002", t0 + 0.25, -13, 0.6)
        t0 += 0.7
    S("mechanical_gears_813080", st["A14"], -24)
    S("swoosh_transition_614169", st["A16"] + 0.15, -16)
    S("heartbeat_451948", st["A17"] + 0.2, -20)
    mix += sfx
    peak = np.max(np.abs(mix)) + 1e-9
    if peak > 0.95:
        mix *= 0.95 / peak
    import wave
    pcm = (mix[:int(total * SR)] * 32767).astype(np.int16)
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def music(total, tl):
    SR = K.SR
    n = int(total * SR)
    tt = np.arange(n) / SR
    m = np.zeros(n)
    for f0, g in [(55, 0.5), (82.41, 0.28), (110, 0.22), (164.8, 0.08)]:
        for det in (-0.25, 0.25):
            ph = 2 * np.pi * (f0 + det) * tt
            m += g * (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.08 * tt + f0))
    m /= 4
    st = {s["id"]: s["start"] for s in tl}
    notes = [220, 261.6, 329.6, 261.6, 196, 246.9, 293.7, 246.9]
    k, tcur = 0, st["A07"]
    while tcur < st["A16"]:
        pl = K.karplus(notes[k % 8], 1.1, 0.993) * 0.14
        i = int(tcur * SR)
        m[i:i + len(pl)] += pl[:max(0, min(len(pl), n - i))]
        k += 1
        tcur += 0.34
    env = np.ones(n)
    env *= 1 + 0.4 * np.clip((tt - st["A17"]) / 2.0, 0, 1) * (tt < st["A18"])
    fin = st["A18"]
    env *= np.where(tt > fin, np.clip(1 - (tt - fin) / (total - fin) * 0.6, 0.4, 1), 1)  # finalde sakinleşir
    m *= env
    m = np.stack([m, m], 1)
    m[:, 1] = np.roll(m[:, 1], 240)
    return m.astype(np.float32)


# ---------------------------------------------------------------- ana
if __name__ == "__main__":
    args = sys.argv[1:]
    out = f"{V3}/kara_kedi_reels_v3_ham.mp4"
    prev = None
    if "--cikti" in args:
        out = args[args.index("--cikti") + 1]
    if "--onizleme" in args:
        prev = [float(x) for x in args[args.index("--onizleme") + 1].split(",")]
    vp = f"{V3}/ses/final.wav"
    kp = f"{V3}/ses/final.kelimeler.json"
    TIMES, total = K.word_times(kp)
    K.TIMES = TIMES
    TL, END = build_timeline(TIMES, total)
    SUB_TIMES = []
    i = 0
    for d, nn in SUBS:
        s0 = TIMES[i][0]
        i += nn
        SUB_TIMES.append([d, s0 - 0.05, None])
    for k in range(len(SUB_TIMES)):
        SUB_TIMES[k][2] = SUB_TIMES[k + 1][1] if k + 1 < len(SUB_TIMES) else END
    SUB_TIMES = [x for x in SUB_TIMES if x[0]]
    SIG = K.build_sig()
    EYES06 = json.load(open(f"{V3}/goz_k06.json"))
    json.dump({"timeline": TL, "subs": SUB_TIMES, "end": END}, open(f"{V3}/zaman.json", "w"), ensure_ascii=False, indent=1)
    if prev:
        frames = [frame_at(t, TL) for t in prev]
        sm = [cv2.resize(f, (360, 640)) for f in frames]
        rows = [np.hstack(sm[i:i + 6] + [np.zeros_like(sm[0])] * (6 - len(sm[i:i + 6]))) for i in range(0, len(sm), 6)]
        cv2.imwrite(f"{V3}/onizleme.jpg", np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
        print("önizleme", [(s["id"], round(s["start"], 2)) for s in TL], round(END, 2))
        sys.exit()
    wav = f"{V3}/mix.wav"
    build_audio(END, TL, vp, wav)
    nfr = int(END * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
                           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-ac", "2",
                           "-movflags", "+faststart", "-shortest", out], stdin=subprocess.PIPE)
    for fi in range(nfr):
        ff.stdin.write(frame_at(fi / FPS, TL).tobytes())
        if fi % 150 == 0:
            print(f"{fi}/{nfr}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("bitti", out, round(END, 2))
