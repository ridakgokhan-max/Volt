"""Kara Kedi Reels — ücretsiz kurgu/animasyon motoru.
Kullanım: python3 kurgu.py [--onizleme t1,t2,...] [--cikti video.mp4] [--ses klon|piper|yok]
Girdiler: /home/claude/volt/out/assets/kk-*/<ad>.png, ses: /home/claude/karakedi/uretim/ses/<tip>.wav + .kelimeler.json
"""
import difflib
import glob
import json
import math
import os
import re
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
SW, SH = 1296, 2304  # kaynak görsel çalışma boyutu (1.2x pay)
ROOT = "/home/claude/karakedi/uretim"
ASSETS = "/home/claude/volt/out/assets"
SESLER = "/home/claude/volt"
FONT = os.path.join(ROOT, "Anton.ttf")
ORANGE = (200, 81, 43)
CREAM = (243, 235, 221)
INK = (30, 26, 23)
rng = np.random.default_rng(7)
PICK = {}


# ---------------------------------------------------------------- yardımcılar
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):  # smoothstep
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x ** 3


def lerp(a, b, t):
    return a + (b - a) * t


_img_cache = {}


def img(name):
    if name in _img_cache:
        return _img_cache[name]
    p = PICK.get("dosya", {}).get(name) if isinstance(PICK, dict) else None
    if p and not os.path.isabs(p):
        p = os.path.join(ASSETS, p)
    fs = [p] if p and os.path.exists(p) else (sorted(glob.glob(f"{ASSETS}/kk-*/{name}.png")))
    if not fs:
        print("YER TUTUCU:", name)
        a = np.full((1344, 768, 3), 60, np.uint8)
        cv2.putText(a, name, (40, 670), 0, 2, (200, 200, 200), 4)
    else:
        a = cv2.imread(fs[0])
    kr = PICK.get("kirp", {}).get(name)
    if kr:  # [y0, y1] oranları
        h0 = a.shape[0]
        a = a[int(kr[0] * h0):int(kr[1] * h0)]
    h0, w0 = a.shape[:2]
    if w0 / h0 > SW / SH * 1.05:  # yatay parça: bulanık zemin üstüne sığdır
        bg = cv2.GaussianBlur(cv2.resize(a, (SW, SH)), (0, 0), 30)
        bg = (bg * 0.55).astype(np.uint8)
        fh = int(SW * h0 / w0 * 1.25)
        fw = int(SW * 1.25)
        fg = cv2.resize(a, (fw, fh), interpolation=cv2.INTER_LANCZOS4)[:, (fw - SW) // 2:(fw - SW) // 2 + SW]
        y = (SH - fh) // 2
        m = np.ones((fh, SW), np.float32)
        r = 60
        m[:r] *= np.linspace(0, 1, r)[:, None]
        m[-r:] *= np.linspace(1, 0, r)[:, None]
        bg[y:y + fh] = (bg[y:y + fh] * (1 - m[..., None]) + fg * m[..., None]).astype(np.uint8)
        a = bg
    else:
        a = cv2.resize(a, (SW, SH), interpolation=cv2.INTER_LANCZOS4)
    bl = cv2.GaussianBlur(a, (0, 0), 1.6)
    a = cv2.addWeighted(a, 1.45, bl, -0.45, 0)
    if name in ("s18-manuscript", "s19-docs", "s15-desk"):
        a = cv2.bilateralFilter(a, 9, 40, 7)
        a = cv2.GaussianBlur(a, (0, 0), 1.3)
    _img_cache[name] = a
    return a


def cam(src, cx=0.5, cy=0.5, z=1.0, rot=0.0, dx=0.0, dy=0.0):
    """src içinde (cx,cy) oranlı noktayı ekran merkezine getirir; z=1 tüm genişlik görünür."""
    sh, sw = src.shape[:2]
    sc = W / sw * z
    M = cv2.getRotationMatrix2D((0, 0), rot, sc)
    px, py = cx * sw, cy * sh
    M[0, 2] = W / 2 - (M[0, 0] * px + M[0, 1] * py) + dx
    M[1, 2] = H / 2 - (M[1, 0] * px + M[1, 1] * py) + dy
    return cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def motion_blur(frame, length, angle=0):
    length = int(length)
    if length < 3:
        return frame
    k = np.zeros((length, length), np.float32)
    k[length // 2, :] = 1
    M = cv2.getRotationMatrix2D((length / 2 - 0.5, length / 2 - 0.5), angle, 1)
    k = cv2.warpAffine(k, M, (length, length))
    k /= k.sum()
    return cv2.filter2D(frame, -1, k)


def blend(a, b, t):
    return cv2.addWeighted(a, 1 - t, b, t, 0)


def over(frame, rgba, x, y, alpha=1.0):
    """BGR kareye RGBA (PIL düzeni RGB) yerleştirir; x,y sol üst."""
    h, w = rgba.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return frame
    sub = rgba[y0 - y:y1 - y, x0 - x:x1 - x]
    a = sub[..., 3:4].astype(np.float32) / 255 * alpha
    rgb = sub[..., 2::-1].astype(np.float32)
    roi = frame[y0:y1, x0:x1].astype(np.float32)
    frame[y0:y1, x0:x1] = (roi * (1 - a) + rgb * a).astype(np.uint8)
    return frame


def font(sz):
    return ImageFont.truetype(FONT, sz)


# ---------------------------------------------------------------- doku / efekt
GRAIN = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
yy, xx = np.mgrid[0:H, 0:W]
VIG = (1 - 0.55 * (((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.6)) ** 2)).clip(0.35, 1).astype(np.float32)[..., None]
DUST = rng.random((70, 4))  # x, y, hız, boyut


def finish(frame, t, era, flicker=0.0, dust=0.0):
    f = frame.astype(np.float32)
    if era == "orta":
        f *= np.array([0.86, 0.95, 1.08], np.float32)  # BGR: sıcak
    elif era == "paris":
        f *= np.array([1.06, 0.98, 0.92], np.float32)  # serin mavi-gri
    if flicker:
        n = 0.6 * math.sin(t * 13.1) + 0.3 * math.sin(t * 29.7 + 1) + 0.25 * math.sin(t * 7.3 + 2)
        f *= 1 + flicker * n
    f *= VIG
    g = cv2.resize(GRAIN[int(t * FPS) % 6], (W, H), interpolation=cv2.INTER_NEAREST)
    f += g[..., None] * 7
    out = f.clip(0, 255).astype(np.uint8)
    if dust:
        for i, (x, y, v, s) in enumerate(DUST):
            px = int((x * W + math.sin(t * 0.7 + i) * 30) % W)
            py = int((y * H - t * (20 + 60 * v)) % H)
            r = int(1 + s * 3)
            cv2.circle(out, (px, py), r, (190, 215, 235), -1, lineType=cv2.LINE_AA)
        out = cv2.addWeighted(out, 1 - 0.0, out, 0, 0) if False else out
    return out


def glow_spots(frame, pts, strength, radius=60, color=(40, 120, 255)):
    if strength <= 0:
        return frame
    layer = np.zeros_like(frame, np.float32)
    for (x, y) in pts:
        cv2.circle(layer, (int(x), int(y)), int(radius * 0.35), color, -1)
    layer = cv2.GaussianBlur(layer, (0, 0), radius * 0.5)
    return np.clip(frame.astype(np.float32) + layer * strength, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- etiket ve altyazı
_tag_cache = {}


def torn_tag(text, size=96, bg=ORANGE, fg=CREAM, angle=-6, pad=34):
    key = (text, size, bg, fg, angle)
    if key in _tag_cache:
        return _tag_cache[key]
    ft = font(size)
    lines = text.split("\n")
    bbs = [ft.getbbox(l) for l in lines]
    tw = max(b[2] - b[0] for b in bbs)
    lh = int(size * 1.12)
    th = lh * len(lines)
    w, h = tw + pad * 2, th + pad * 2 - int(size * 0.12)
    im = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pts = []
    r = np.random.default_rng(abs(hash(text)) % 999)
    for x in np.linspace(0, w, 24):
        pts.append((30 + x, 30 + r.uniform(-7, 5)))
    for y in np.linspace(0, h, 10):
        pts.append((30 + w + r.uniform(-5, 7), 30 + y))
    for x in np.linspace(w, 0, 24):
        pts.append((30 + x, 30 + h + r.uniform(-5, 7)))
    for y in np.linspace(h, 0, 10):
        pts.append((30 + r.uniform(-7, 5), 30 + y))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).polygon([(x + 8, y + 10) for x, y in pts], fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(9))
    im = Image.alpha_composite(im, sh)
    d = ImageDraw.Draw(im)
    d.polygon(pts, fill=bg + (255,))
    # kâğıt lifi
    arr = np.array(im)
    noise = r.normal(0, 9, arr.shape[:2])
    m = arr[..., 3] > 200
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[m] += noise[m]
        arr[..., c] = ch.clip(0, 255)
    im = Image.fromarray(arr)
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        b = ft.getbbox(l)
        lw = b[2] - b[0]
        d.text((30 + (w - lw) / 2 - b[0], 30 + pad - b[1] + i * lh), l, font=ft, fill=fg + (255,))
    im = im.rotate(angle, resample=Image.BICUBIC, expand=True)
    a = np.array(im)
    _tag_cache[key] = a
    return a


def place_tag(frame, text, cx, cy, u, dur, **kw):
    """u: etiketin kendi zamanı (0 = giriş). pop girişi, son 0.15 sn sönme."""
    if u < 0 or u > dur:
        return frame
    a = torn_tag(text, **kw)
    s = 1.0 + 0.35 * (1 - ease_out(u / 0.16)) if u < 0.16 else 1.0
    alpha = clamp(u / 0.06) * clamp((dur - u) / 0.15)
    if abs(s - 1) > 1e-3:
        a = cv2.resize(a, None, fx=s, fy=s, interpolation=cv2.INTER_LINEAR)
    h, w = a.shape[:2]
    return over(frame, a, int(cx - w / 2), int(cy - h / 2), alpha)


_sub_cache = {}


def sub_img(display):
    if display in _sub_cache:
        return _sub_cache[display]
    ft = font(80)
    words = display.split()
    toks = []
    for wd in words:
        hl = wd.startswith("*")
        toks.append((wd.strip("*"), hl))
    # en fazla 2 satır, ~20 karakter
    lines, cur = [], []
    for t in toks:
        if cur and len(" ".join(x[0] for x in cur + [t])) > 20:
            lines.append(cur)
            cur = []
        cur.append(t)
    if cur:
        lines.append(cur)
    space = ft.getlength(" ")
    lh = 96
    widths = [sum(ft.getlength(w) for w, _ in ln) + space * (len(ln) - 1) for ln in lines]
    im = Image.new("RGBA", (int(max(widths)) + 40, lh * len(lines) + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, ln in enumerate(lines):
        x = 20 + (im.width - 40 - widths[i]) / 2
        for w, hl in ln:
            d.text((x, 20 + i * lh), w, font=ft, fill=(ORANGE if hl else CREAM) + (255,), stroke_width=6,
                   stroke_fill=(12, 10, 9, 255))
            x += ft.getlength(w) + space
    a = np.array(im)
    _sub_cache[display] = a
    return a


def place_sub(frame, display, u):
    a = sub_img(display)
    s = 1.0 + 0.12 * (1 - ease_out(u / 0.12)) if u < 0.12 else 1.0
    if s != 1.0:
        a = cv2.resize(a, None, fx=s, fy=s)
    h, w = a.shape[:2]
    return over(frame, a, int(W / 2 - w / 2), int(1330 - h / 2), clamp(u / 0.05))


# ---------------------------------------------------------------- metin / zaman
TTS = open("/home/claude/volt/uretim/kara-kedi/metin.txt", encoding="utf-8").read().split()

SUBS = [  # (gösterim, tts kelime sayısı); None = altyazı yok (açılış etiketleri)
    (None, 5), (None, 9), (None, 8),
    ("PAPA IX. *GREGORIUS'UN*", 3), ("*VOX* *IN* *RAMA* MEKTUBU,", 4), ("*ALMANYA'DA* SAPKINLIKLA", 2),
    ("SUÇLANAN BİR GRUBU ANLATIYORDU.", 4), ("METNE GÖRE AYİNDE", 3), ("BİR KARA KEDİ *HEYKELİ* *CANLANIYOR,*", 5),
    ("*GERİ* *GERİ* YÜRÜYOR,", 3), ("MÜRİTLER ONU *ÖPÜYORDU.*", 3), ("*BEŞ* *YÜZ* *YIL* SONRA,", 4),
    ("*1730'LARIN* *PARİS'İ.*", 5), ("BİR *MATBAA* *ÇIRAĞI,*", 3), ("*YILLAR* *SONRA* YAZDIĞI ANISINDA", 4),
    ("ŞUNU ANLATIR:", 2), ("ÇIRAKLARA *ARTIK* *YEMEK,*", 3), ("USTANIN KEDİLERİNE *KIZARMIŞ* *TAVUK.*", 4),
    ("BİR ÇIRAK *GECELER* *BOYU*", 4), ("USTANIN PENCERESİNDE", 2), ("*KEDİ* *GİBİ* *BAĞIRDI.*", 3),
    ("BIKAN USTA,", 2), ("KEDİLERDEN *KURTULMALARINI* İSTEDİ.", 3), ("ÇIRAKLAR, USTANIN KARISININ", 3),
    ("*GÖZDESİ* DAHİL", 2), ("*BİRÇOK* *KEDİYİ* ÖLDÜRDÜ;", 3), ("SONRA *SAHTE* *BİR* *MAHKEME*", 4),
    ("KURUP *GÜLDÜLER.*", 2), ("TARİHÇİ *ROBERT* *DARNTON*", 3), ("ŞUNU SORDU:", 2), ("BU NEDEN ONLARA", 3),
    ("*KOMİK* GELMİŞTİ?", 2), ("ONA GÖRE SEBEP,", 3), ("*AĞIR* *ÇALIŞMA* *KOŞULLARI*", 3),
    ("VE USTAYA DUYULAN *ÖFKEYDİ.*", 4), ("KEDİ, DOKUNAMADIKLARI", 2), ("USTANIN *YERİNE* GEÇMİŞTİ.", 3),
    ("*TEK* *KAYNAK* BU ANI;", 4), ("DARNTON'IN YORUMU DA *TARTIŞILIYOR.*", 4), ("İKİ OLAY ARASINDA", 3),
    ("*KANITLANMIŞ* *BİR* *BAĞ* *YOK.*", 4), ("AMA İKİSİ DE ŞUNU SORDURUYOR:", 5), ("*KORKUMUZU* VE *ÖFKEMİZİ*", 3),
    ("HAYVANLARA MI YÜKLÜYORUZ?", 3), ("SEN *KARA* *KEDİ* GÖRÜNCE", 4), ("AKLINDAN *İLK* *NE* *GEÇİYOR?*", 4),
]
assert sum(n for _, n in SUBS) == len(TTS), (sum(n for _, n in SUBS), len(TTS))


def norm(w):
    w = w.lower().replace("i̇", "i")
    w = re.sub(r"[^\wçğıöşü]", "", w)
    return w


def word_times(kel_path, total_hint=59.0):
    """TTS kelimelerine (start,end) atar: whisper kelimeleriyle hizalar, eşleşmeyenleri ara-değerler."""
    n = len(TTS)
    if kel_path and os.path.exists(kel_path):
        wk = json.load(open(kel_path, encoding="utf-8"))
        a = [norm(x) for x in TTS]
        b = [norm(x["w"]) for x in wk]
        st = [None] * n
        en = [None] * n
        sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                for k in range(i2 - i1):
                    st[i1 + k] = wk[j1 + k]["start"]
                    en[i1 + k] = wk[j1 + k]["end"]
            elif tag == "replace" and j2 > j1:
                s0, e0 = wk[j1]["start"], wk[j2 - 1]["end"]
                for k in range(i2 - i1):
                    st[i1 + k] = s0 + (e0 - s0) * k / (i2 - i1)
                    en[i1 + k] = s0 + (e0 - s0) * (k + 1) / (i2 - i1)
        total = wk[-1]["end"] if wk else total_hint
    else:
        st, en, total = [None] * n, [None] * n, total_hint - 1.4
    # ara-değer
    known = [i for i in range(n) if st[i] is not None]
    if not known:
        lens = np.array([len(x) + 3 for x in TTS], float)
        c = np.concatenate([[0], np.cumsum(lens)]) / lens.sum() * total
        return [(c[i], c[i + 1]) for i in range(n)], total
    for i in range(n):
        if st[i] is None:
            p = max([k for k in known if k < i], default=None)
            q = min([k for k in known if k > i], default=None)
            if p is None:
                st[i] = en[i] = st[q] * i / q if q else 0
            elif q is None:
                st[i] = en[p] + 0.3 * (i - p)
                en[i] = st[i] + 0.3
            else:
                st[i] = en[p] + (st[q] - en[p]) * (i - p) / (q - p)
                en[i] = st[i]
    return list(zip(st, en)), total


def tok_index(word, after=0):
    for i in range(after, len(TTS)):
        if norm(TTS[i]).startswith(norm(word)):
            return i
    raise ValueError(word)


# ---------------------------------------------------------------- sahneler
SCENES = [  # id, başlangıç sözcüğü (tts), dönem
    ("S01", None, "orta"), ("S02", "papa,", "orta"), ("S03", "Ama", "orta"), ("S04", "Dokuzuncu", "orta"),
    ("S05", "Almanya'da", "orta"), ("S06", "Metne", "orta"), ("S07", "geri", "orta"), ("S08", "Beş", "paris"),
    ("S09", "matbaa", "paris"), ("S10", "Çıraklara", "paris"), ("S11", "geceler", "paris"), ("S12", "Bıkan", "paris"),
    ("S13", "Çıraklar,", "paris"), ("S14", "sonra", "paris"), ("S15", "Tarihçi", "paris"), ("S16", "Ona", "paris"),
    ("S17", "Kedi,", "paris"), ("S18", "Tek", "paris"), ("S19", "İki", "karma"), ("S20", "Ama", "karma"),
    ("S21", "Sen", "karma"),
]


def build_timeline(times, total):
    starts = []
    last = 0
    for sid, w, era in SCENES:
        if w is None:
            starts.append(0.0)
            continue
        i = tok_index(w, last)
        # sahneyi kelimeden 1 kare önce kes (ses kesmeyi önden çeker)
        starts.append(max(0.0, times[i][0] - 0.12))
        last = i + 1
    # S02 "Bir papa" — 'Bir' kelimesinden başlasın
    i = tok_index("kara")
    starts[1] = max(0.0, times[i][0] - 0.1)
    i = tok_index("Dokuzuncu")
    starts[3] = max(0.0, times[i - 1][0] - 0.1)
    i = tok_index("matbaa")
    starts[8] = max(0.0, times[i - 1][0] - 0.1)
    i = tok_index("geceler")
    starts[10] = max(0.0, times[i - 2][0] - 0.1)
    end = total + 1.0
    tl = []
    for k, (sid, w, era) in enumerate(SCENES):
        s = starts[k]
        e = starts[k + 1] if k + 1 < len(SCENES) else end
        tl.append({"id": sid, "start": s, "end": e, "era": era})
    return tl, end


def T(word, after_word=None):
    """bir kelimenin söylendiği an (global)"""
    a = tok_index(after_word) if after_word else 0
    return TIMES[tok_index(word, a)][0]


# ---- sahneye özel çizimler -------------------------------------------------
def eye_points(name):
    """görselde turuncu parlak göz lekelerini bulur (kaynak koordinatı)."""
    a = img(name)
    hsv = cv2.cvtColor(a, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] > 5) & (hsv[..., 0] < 28) & (hsv[..., 1] > 140) & (hsv[..., 2] > 170)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, stats, cent = cv2.connectedComponentsWithStats(m)
    blobs = sorted([(stats[i, 4], cent[i], stats[i]) for i in range(1, n)], key=lambda x: -x[0])
    return [(c, s) for _, c, s in blobs[:2] if _ > 300]


def src_to_screen(px, py, cx, cy, z, rot=0.0):
    sc = W / SW * z
    th = math.radians(-rot)
    dx, dy = px - cx * SW, py - cy * SH
    x = math.cos(th) * dx - math.sin(th) * dy
    y = math.sin(th) * dx + math.cos(th) * dy
    return W / 2 + x * sc, H / 2 + y * sc


def wax_seal(r=150):
    im = Image.new("RGBA", (r * 2 + 80, r * 2 + 80), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rg = np.random.default_rng(3)
    pts = []
    for k in range(48):
        ang = 2 * math.pi * k / 48
        rr = r * (1 + rg.uniform(-0.05, 0.07))
        pts.append((r + 40 + rr * math.cos(ang), r + 40 + rr * math.sin(ang)))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).polygon([(x + 10, y + 14) for x, y in pts], fill=(0, 0, 0, 170))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(im)
    d.polygon(pts, fill=(122, 22, 20, 255))
    d.ellipse((40 + r * 0.25, 40 + r * 0.25, 40 + r * 1.75, 40 + r * 1.75), outline=(90, 12, 12, 255), width=10)
    d.ellipse((40 + r * 0.3, 40 + r * 0.2, 40 + r * 1.2, 40 + r * 0.9), fill=(170, 50, 45, 90))
    ft = font(int(r * 0.62))
    tx = "1233"
    b = ft.getbbox(tx)
    d.text((r + 40 - (b[2] - b[0]) / 2 - b[0] + 3, r + 40 - (b[3] - b[1]) / 2 - b[1] + 4), tx, font=ft, fill=(70, 8, 8, 255))
    d.text((r + 40 - (b[2] - b[0]) / 2 - b[0], r + 40 - (b[3] - b[1]) / 2 - b[1]), tx, font=ft, fill=(205, 92, 70, 255))
    return np.array(im.filter(ImageFilter.GaussianBlur(0.6)))


SEAL = None


def paper_sheet(w, h, text=None):
    rg = np.random.default_rng(5)
    base = np.full((h, w, 3), (205, 222, 236), np.float32)  # BGR krem
    base += rg.normal(0, 7, (h, w, 1))
    base = cv2.GaussianBlur(base, (0, 0), 1.2)
    im = Image.fromarray(base[..., ::-1].clip(0, 255).astype(np.uint8))
    if text:
        d = ImageDraw.Draw(im)
        ft = font(118)
        for i, ln in enumerate(text.split("\n")):
            b = ft.getbbox(ln)
            d.text(((w - (b[2] - b[0])) / 2 - b[0], h * 0.33 + i * 135), ln, font=ft, fill=(60, 30, 25))
        # kırmızı mühür izi
        d.ellipse((w * 0.62, h * 0.68, w * 0.84, h * 0.68 + w * 0.22), outline=(150, 30, 25), width=8)
    return np.array(im)[..., ::-1].copy()


def tear_line(h, seed=2):
    rg = np.random.default_rng(seed)
    ys = np.arange(h)
    xs = np.cumsum(rg.normal(0, 3.0, h))
    xs = xs - np.linspace(xs[0], xs[-1], h)
    return xs


SHEET = None
TEAR = None


def render_s03(base, u, dur, t_tear):
    """yırtılan 'emir' kâğıdı."""
    global SHEET, TEAR
    sw, sh = 820, 1100
    if SHEET is None:
        SHEET = paper_sheet(sw, sh, "“KEDİLERİ\nÖLDÜRÜN”")
        TEAR = tear_line(sh)
    frame = base
    x0, y0 = (W - sw) // 2, 330
    slide = ease_out(u / 0.35)
    y0 = int(lerp(-sh, 330, slide))
    k = (u - t_tear) / 0.55
    if k < 0:
        # bütün kâğıt
        frame = over_bgr(frame, SHEET, x0, y0, shadow=True)
    else:
        kk = ease_in(clamp(k)) if k < 1 else 1
        mid = sw // 2
        for side in (0, 1):
            part = SHEET.copy()
            mask = np.zeros((sh, sw), np.uint8)
            for yv in range(sh):
                cut = int(mid + TEAR[yv])
                if side == 0:
                    mask[yv, :cut] = 255
                else:
                    mask[yv, cut:] = 255
            dxp = (-1 if side == 0 else 1) * kk * 900
            ang = (-1 if side == 0 else 1) * kk * 28
            M = cv2.getRotationMatrix2D((sw / 2, sh / 2), ang, 1.0)
            M[0, 2] += dxp
            M[1, 2] += kk * 140
            pw = cv2.warpAffine(part, M, (sw, sh), borderValue=(0, 0, 0))
            mw = cv2.warpAffine(mask, M, (sw, sh))
            frame = over_bgr(frame, pw, x0, y0, mask=mw, shadow=True)
    return frame


def over_bgr(frame, bgr, x, y, mask=None, shadow=False):
    h, w = bgr.shape[:2]
    if mask is None:
        mask = np.full((h, w), 255, np.uint8)
    if shadow:
        sm = cv2.GaussianBlur(mask, (0, 0), 14)
        rgba = np.zeros((h, w, 4), np.uint8)
        rgba[..., 3] = (sm * 0.55).astype(np.uint8)
        frame = over(frame, rgba, x + 14, y + 20)
    rgba = np.dstack([bgr[..., ::-1], mask])
    return over(frame, rgba, x, y)


def sketchify(a, p):
    """p=0 kalem çizimi, p=1 tam renk (kanalın çizim→boyama tarzı)."""
    g = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)
    inv = 255 - g
    bl = cv2.GaussianBlur(inv, (0, 0), 6)
    sk = cv2.divide(g, 255 - bl, scale=256)
    sk = cv2.cvtColor(sk, cv2.COLOR_GRAY2BGR)
    sk = (sk.astype(np.float32) * np.array([0.80, 0.88, 0.95])).astype(np.uint8)  # sepya kâğıt
    return blend(sk, a, ease(p))


def draw_route(frame, p, pts):
    n = len(pts)
    upto = p * (n - 1)
    for i in range(int(upto)):
        if i % 2 == 0:
            cv2.line(frame, pts[i], pts[i + 1], (30, 30, 120), 7, cv2.LINE_AA)
    return frame


def thread(frame, x0, y0, x1, y1, sag, col=(40, 40, 190)):
    pts = []
    for k in range(30):
        tt = k / 29
        x = lerp(x0, x1, tt)
        y = lerp(y0, y1, tt) + sag * math.sin(math.pi * tt) * tt
        pts.append((int(x), int(y)))
    cv2.polylines(frame, [np.array(pts)], False, col, 6, cv2.LINE_AA)
    return frame


def eyelid(frame, eyes_scr, closed):
    if closed <= 0:
        return frame
    for (x, y, w, h) in eyes_scr:
        hh = int(h * 0.6 * closed) + 1
        cv2.ellipse(frame, (int(x), int(y - h / 2 + hh / 2)), (int(w * 0.62), hh), 0, 0, 360, (12, 10, 10), -1, cv2.LINE_AA)
        cv2.ellipse(frame, (int(x), int(y + h / 2 - hh / 2)), (int(w * 0.62), hh), 0, 0, 360, (12, 10, 10), -1, cv2.LINE_AA)
    return frame


def magnifier(frame, cxs, cys, r=210, z=1.8):
    x0, y0 = int(cxs - r / z), int(cys - r / z)
    x0 = max(0, min(W - int(2 * r / z), x0))
    y0 = max(0, min(H - int(2 * r / z), y0))
    patch = frame[y0:y0 + int(2 * r / z), x0:x0 + int(2 * r / z)]
    patch = cv2.resize(patch, (2 * r, 2 * r))
    m = np.zeros((2 * r, 2 * r), np.uint8)
    cv2.circle(m, (r, r), r - 4, 255, -1, cv2.LINE_AA)
    frame = over_bgr(frame, patch, int(cxs - r), int(cys - r), mask=m, shadow=True)
    cv2.circle(frame, (int(cxs), int(cys)), r, (60, 140, 185), 16, cv2.LINE_AA)
    cv2.circle(frame, (int(cxs), int(cys)), r - 8, (120, 200, 230), 3, cv2.LINE_AA)
    return frame


# ---------------------------------------------------------------- sahne render
def scene_frame(sc, t):
    sid, s, e = sc["id"], sc["start"], sc["end"]
    u, dur = t - s, e - s
    p = clamp(u / dur)
    fl, du = 0.0, 0.0
    if sid == "S01":
        a = img(PICK["s01"])
        z = 1.55 + 0.04 * p
        f = cam(a, EYE01[0], EYE01[1], z)
        if 0.3 <= u < 0.4:
            f = cam(a, EYE01[0], EYE01[1], z, dx=rng.normal(0, 10), dy=rng.normal(0, 10))
        f = glow_spots(f, EYES01_SCR(z), 0.5 + 0.3 * math.sin(u * 9))
        fl = 0.05
        if u >= 0.3:
            k = clamp((u - 0.3) / 0.12)
            sz = lerp(2.2, 1.0, ease_in(k))
            sa = cv2.resize(SEAL, None, fx=sz * 0.9, fy=sz * 0.9)
            h_, w_ = sa.shape[:2]
            f = over(f, sa, int(760 - w_ / 2), int(1180 - h_ / 2), clamp(k * 3))
        f = place_tag(f, "1233", W / 2, 330, u - 0.3, 99, size=250, angle=-4)
    elif sid == "S02":
        a = img("s02-ritual")
        k = ease_out(clamp(u / 0.55))
        z = lerp(3.2, 1.08, k)
        f = cam(a, 0.5, lerp(0.42, 0.5, k), z, rot=lerp(8, 0, k))
        if u < 0.25:
            f = motion_blur(f, 40 * (1 - u / 0.25), 90)
        fl = 0.06
        f = place_tag(f, "ŞEYTANİ AYİN?", W / 2, 330, u - 0.15, dur - 0.1, size=120, angle=-8)
    elif sid == "S03":
        a = img("s03-desk")
        f = cam(a, 0.5, 0.5, 1.04 + 0.03 * p)
        fl = 0.05
        t_tear = T("yanlış:") - s
        f = render_s03(f, u, dur, t_tear)
        if u < t_tear + 0.2:
            f = place_tag(f, "EFSANE", W / 2 + 230, 1520, u - 0.4, t_tear - 0.2, size=90, angle=7, bg=CREAM, fg=INK)
        f = place_tag(f, "BÖYLE BİR\nEMİR YOK", W / 2, 1500, u - t_tear - 0.35, 99, size=130, angle=-5)
    elif sid == "S04":
        a = img(PICK["s04"])
        f = cam(a, 0.5, lerp(0.58, 0.52, ease(p)), lerp(1.05, 1.32, ease(p)))
        fl = 0.07
        f = place_tag(f, "PAPA IX. GREGORIUS · 1233", W / 2, 300, u - 0.1, 99, size=74, angle=-3, bg=CREAM, fg=INK)
    elif sid == "S05":
        a = img("s05-map")
        cx, cy, z, r = lerp(0.42, 0.38, ease(p)), lerp(0.60, 0.50, ease(p)), lerp(1.7, 2.1, ease(p)), lerp(-3, 2, p)
        f = cam(a, cx, cy, z, rot=r)
        fl = 0.03
        q = ease(clamp(u / (dur * 0.75)))
        rp = [(lerp(0.43, 0.36, k) + 0.025 * math.sin(k * math.pi), lerp(0.635, 0.455, k)) for k in np.linspace(0, 1, 40)]
        pts = [tuple(int(v) for v in src_to_screen(x0 * SW, y0 * SH, cx, cy, z, r)) for x0, y0 in rp]
        f = draw_route(f, q, pts)
        i = int(q * 39)
        cv2.circle(f, pts[0], 14, (30, 30, 150), -1, cv2.LINE_AA)
        cv2.circle(f, pts[i], 20, (40, 40, 170), -1, cv2.LINE_AA)
        cv2.circle(f, pts[i], 20, (200, 220, 235), 4, cv2.LINE_AA)
        if q > 0.85:
            ov = f.copy()
            cv2.circle(ov, pts[-1], int(170 * ease((q - 0.85) / 0.15)), (30, 30, 140), -1, cv2.LINE_AA)
            f = blend(f, ov, 0.4)
        f = place_tag(f, "ROMA", pts[0][0] + 120, pts[0][1] + 60, u - 0.1, dur * 0.7, size=60, angle=4, bg=CREAM, fg=INK)
        f = place_tag(f, "ALMANYA · “SAPKINLAR”", W / 2, 330, u - 0.35, 99, size=86, angle=-4)
    elif sid == "S06":
        a = img(PICK["s06"])
        k = ease(p)
        z = lerp(1.0, 1.38, k)
        cy = lerp(0.40, 0.52, k)
        f = cam(a, 0.5, cy, z)
        fl = 0.09
        du = 1
        f = place_tag(f, "HEYKEL CANLANIYOR", W / 2, 320, u - 0.35, 99, size=96, angle=-5)
    elif sid == "S07":
        a = img("s07-bow")
        ang = lerp(-5, 5, ease(p))
        f = cam(a, lerp(0.52, 0.6, ease(p)), lerp(0.62, 0.66, ease(p)), lerp(1.5, 1.8, ease(p)), rot=ang)
        fl = 0.09
        du = 1
        f = place_tag(f, "— SUÇLAMAYA GÖRE", W / 2, 320, u - 0.2, 99, size=80, angle=3, bg=CREAM, fg=INK)
        k = clamp((u - (dur - 0.55)) / 0.55)
        if k > 0:  # sayfaya düzleşme
            pg = paper_sheet(W, H)
            sc_ = lerp(1.0, 0.62, ease(k))
            small = cv2.resize(sketchify(f, 1 - k), None, fx=sc_, fy=sc_)
            base = blend(f, pg, ease(k))
            h_, w_ = small.shape[:2]
            f = over_bgr(base, small, (W - w_) // 2, (H - h_) // 2, shadow=True)
    elif sid == "S08":
        a = img("s08-typecase")
        f = cam(a, 0.5, lerp(0.68, 0.36, ease(p)), 1.25)
        fl = 0.03
        t_paris = T("Paris'i.") - s
        yr = "1233" if u < 0.25 else ("1730'LAR" if u > 0.9 else str(int(lerp(1233, 1730, ease((u - 0.25) / 0.65)))))
        f = place_tag(f, yr, W / 2, 760, u - 0.05, 99, size=210, angle=-3)
        f = place_tag(f, "PARİS", W / 2, 1060, u - t_paris + 0.1, 99, size=120, angle=4, bg=CREAM, fg=INK)
    elif sid == "S09":
        a1, a2 = img("s09-hand"), img("s09-shop")
        if p < 0.45:
            f = cam(a1, 0.5, 0.55, lerp(1.1, 1.5, ease(p / 0.45)))
            fl = 0.06
        else:
            q = (p - 0.45) / 0.55
            f2 = cam(sketchify(a2, clamp(q * 1.6 - 0.2)), 0.5, 0.5, lerp(1.35, 1.1, ease(q)))
            f1 = cam(a1, 0.5, 0.55, 1.5 + 0.6 * q)
            f = blend(f1, f2, ease(clamp(q * 4)))
        f = place_tag(f, "NICOLAS CONTAT’IN ANISI", W / 2, 300, u - 0.25, 99, size=76, angle=-3, bg=CREAM, fg=INK)
    elif sid == "S10":
        top = cam(img("s10-cat"), 0.5, 0.5, 1.6)[480:1440]
        bot = cam(img("s10-boys"), 0.5, 0.55, 1.5)[480:1440]
        comp = np.vstack([top, bot])
        tall = np.vstack([comp])
        oy = int(lerp(240, -240, ease(p)))
        f = np.full((H, W, 3), 20, np.uint8)
        canvas = np.vstack([np.full((480, W, 3), 15, np.uint8), comp, np.full((480, W, 3), 15, np.uint8)])
        f = canvas[480 - oy:480 - oy + H] if 0 <= 480 - oy <= canvas.shape[0] - H else cv2.resize(canvas, (W, H))
        # yırtık ayraç
        yl = 960 + oy
        rg = np.random.default_rng(9)
        pts = [(x, int(yl + rg.normal(0, 5))) for x in range(0, W + 30, 30)]
        cv2.polylines(f, [np.array(pts)], False, (205, 222, 236), 14, cv2.LINE_AA)
        f = place_tag(f, "KEDİ: TAVUK", W / 2 + 170, int(yl - 380), u - 0.2, 99, size=80, angle=5)
        f = place_tag(f, "ÇIRAK: ARTIK", W / 2 - 170, int(yl + 380), u - 0.6, 99, size=80, angle=-5, bg=CREAM, fg=INK)
    elif sid == "S11":
        a = img("s11-roof")
        f = cam(a, lerp(0.58, 0.42, ease(p)), 0.45, 1.25)
        f = place_tag(f, "GECELER BOYU", W / 2, 320, u - 0.4, 99, size=96, angle=-4)
    elif sid == "S12":
        a = img("s12-master")
        sh_ = 6 * math.sin(u * 17) + 4 * math.sin(u * 23)
        f = cam(a, 0.5 + sh_ / 4000, 0.48, lerp(1.12, 1.25, p), rot=-7 + 0.6 * math.sin(u * 3))
        fl = 0.1
        f = place_tag(f, "USTANIN EMRİ", W / 2, 320, u - 0.25, 99, size=100, angle=-5)
    elif sid == "S13":
        a1, a2 = img("s13-wall"), img("s13-cushion")
        if p < 0.62:
            q = p / 0.62
            f = cam(a1, 0.5, 0.5, 1.12)
            # mumlar soldan sağa söner: karartma bandı ilerler
            edge = lerp(-200, W + 200, ease(q))
            dark = np.clip((edge - xx[:H, :W]) / 260, 0, 1).astype(np.float32)[..., None]
            f = (f.astype(np.float32) * (1 - 0.55 * dark)).astype(np.uint8)
            fl = 0.08
        else:
            q = (p - 0.62) / 0.38
            f = cam(a2, 0.5, 0.55, lerp(1.25, 1.1, q))
            bl = int(lerp(25, 0, ease(q * 1.5))) * 2 + 1
            if bl > 1:
                f = cv2.GaussianBlur(f, (bl, bl), 0)
        f = place_tag(f, "BİRÇOK KEDİ", W / 2, 320, u - 0.3, 99, size=100, angle=-4)
    elif sid == "S14":
        a = img("s14-trial")
        rot = lerp(-4, 5, p)
        jig = 3 * math.sin(u * 22) if p < 0.85 else 0
        f = cam(a, 0.5, 0.5 + jig / 3000, 1.15, rot=rot)
        if p >= 0.85:
            g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
            sep = cv2.merge([(g * 0.78).astype(np.uint8), (g * 0.9).astype(np.uint8), g])
            f = blend(f, sep, ease((p - 0.85) / 0.15))
        f = place_tag(f, "SAHTE MAHKEME", W / 2, 320, u - 0.15, 99, size=100, angle=-5)
    elif sid == "S15":
        a = img("s15-desk")
        f = cam(a, lerp(0.40, 0.58, ease(p)), 0.52, 1.25)
        mx = lerp(380, 640, ease(p))
        my = lerp(1100, 980, ease(p))
        f = magnifier(f, mx, my)
        t_k = T("komik") - s
        f = place_tag(f, "ROBERT DARNTON · TARİHÇİ", W / 2, 300, u - 0.2, t_k - 0.1, size=76, angle=-3, bg=CREAM, fg=INK)
        f = place_tag(f, "NEDEN KOMİK?", W / 2, 300, u - t_k + 0.05, 99, size=120, angle=-5)
    elif sid == "S16":
        a = img("s16-press")
        bump = max(0, math.sin(u * 2 * math.pi / 0.7)) ** 8
        f = cam(a, lerp(0.42, 0.58, p), 0.5, 1.2, dy=8 * bump)
        fl = 0.07
        f = place_tag(f, "AĞIR ÇALIŞMA · ÖFKE", W / 2, 320, u - 0.25, 99, size=92, angle=-4)
    elif sid == "S17":
        f1 = cam(img("s17-man"), 0.5, 0.5, 1.1)
        f2 = cam(img("s17-cat"), 0.5, 0.5, 1.1)
        k = ease(clamp((u - 0.4) / max(0.6, dur - 1.0)))
        f = blend(f1, f2, k)
        fl = 0.1
        f = place_tag(f, "USTANIN YERİNE KEDİ", W / 2, 320, u - 0.3, 99, size=92, angle=-4)
    elif sid == "S18":
        a = img("s18-manuscript")
        zk = 1.05 + 0.3 * ease_out(clamp(u / 0.22))
        f = cam(a, 0.5, 0.5, zk + 0.03 * p)
        t_t = T("tartışılıyor.") - s
        f = place_tag(f, "TEK KAYNAK", W / 2, 700, u - 0.25, 99, size=150, angle=-8)
        f = place_tag(f, "TARTIŞMALI", W / 2, 980, u - t_t, 99, size=120, angle=6, bg=CREAM, fg=INK)
    elif sid == "S19":
        a = img("s19-docs")
        f = cam(a, 0.5, 0.5, lerp(1.45, 1.08, ease(p)))
        k = ease(clamp(u / (dur * 0.6)))
        gap = 70
        f = thread(f, 120, 1050, lerp(120, W / 2 - gap, k), 1050, 0)
        f = thread(f, W - 120, 1050, lerp(W - 120, W / 2 + gap, k), 1050, 0)
        if k >= 1:
            sag = 120 * ease(clamp((u - dur * 0.6) / 0.6))
            f = cam(a, 0.5, 0.5, lerp(1.45, 1.08, ease(p)))
            f = thread(f, 120, 1050, W / 2 - gap, 1050 + sag, -sag * 0.2)
            f = thread(f, W - 120, 1050, W / 2 + gap, 1050 + sag, -sag * 0.2)
        f = place_tag(f, "KANITLANMIŞ\nBAĞ YOK", W / 2, 700, u - 0.6, 99, size=120, angle=-4)
    elif sid == "S20":
        a = img("s20-alley")
        f = cam(a, lerp(0.45, 0.55, ease(p)), lerp(0.56, 0.5, ease(p)), lerp(1.1, 1.3, ease(p)), rot=lerp(-4, 3, p))
        du = 1
        t_o = T("öfkemizi") - s
        f = place_tag(f, "KORKU", W / 2 - 180, 320, u - (T("Korkumuzu") - s), 99, size=110, angle=-6)
        f = place_tag(f, "ÖFKE", W / 2 + 190, 330, u - t_o, 99, size=110, angle=5, bg=CREAM, fg=INK)
    elif sid == "S21":
        a = img(PICK["s21"])
        z = lerp(1.05, 1.55, ease(p))
        cx, cy = lerp(0.5, EYE21[0], ease(p)), lerp(0.48, EYE21[1], ease(p))
        f = cam(a, cx, cy, z)
        eyes = []
        for c, st in EYES21:
            x, y = src_to_screen(c[0], c[1], cx, cy, z)
            sc_ = W / SW * z
            eyes.append((x, y, st[2] * sc_ * 1.25, st[3] * sc_ * 1.35))
        bt = u - dur * 0.55
        closed = clamp(1 - abs(bt - 0.12) / 0.12) if 0 <= bt <= 0.24 else 0
        f = eyelid(f, eyes, closed)
        f = glow_spots(f, [(x, y) for x, y, _, _ in eyes], 0.35 * (1 - closed))
        fl = 0.05
        f = place_tag(f, "AKLINDAN İLK\nNE GEÇİYOR?", W / 2, 330, u - (T("aklından") - s), 99, size=110, angle=-4)
        # döngü: son 0.35 sn S01 karesine karış
        k = clamp((u - (dur - 0.35)) / 0.35)
        if k > 0:
            f0 = cam(img(PICK["s01"]), EYE01[0], EYE01[1], 1.55)
            f = blend(f, f0, ease(k))
    return f, fl, du


# ---------------------------------------------------------------- render
def frame_at(t, tl):
    for k, sc in enumerate(tl):
        if sc["start"] <= t < sc["end"]:
            break
    f, fl, du = scene_frame(sc, t)
    # geçiş: yeni sahnenin ilk 5 karesi önceki sahneyle kısa karışım (S02 whip, S08 kâğıt hariç)
    u = t - sc["start"]
    if k > 0 and u < 0.17 and sc["id"] not in ("S02", "S08", "S03"):
        prev = tl[k - 1]
        pf, _, _ = scene_frame(prev, min(t, prev["end"] - 1e-3))
        f = blend(pf, f, ease(u / 0.17))
    f = finish(f, t, sc["era"], fl, du)
    # altyazı
    for d, s0, s1 in SUB_TIMES:
        if s0 <= t < s1:
            f = place_sub(f, d, t - s0)
            break
    # kanal imzası
    f = over(f, SIG, 40, 46, 0.85)
    return f


def build_sig():
    ft = font(34)
    im = Image.new("RGBA", (500, 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((0, 6), "BİR DAKİKADA", font=ft, fill=CREAM + (255,), stroke_width=3, stroke_fill=(10, 10, 10, 200))
    x = ft.getlength("BİR DAKİKADA ")
    d.text((x, 6), "BİLİM", font=ft, fill=ORANGE + (255,), stroke_width=3, stroke_fill=(10, 10, 10, 200))
    return np.array(im)


# ---------------------------------------------------------------- ses
SR = 48000


def load_audio(path, gain_db=0.0, rate=1.0):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR)]
    if rate != 1.0:
        cmd += ["-af", f"asetrate={int(SR * rate)},aresample={SR}"]
    cmd += ["-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    a = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    return a * (10 ** (gain_db / 20))


def sfx_path(ad):
    d = json.load(open(f"{SESLER}/sesler/katalog.json"))
    for v in d.values():
        if isinstance(v, list):
            for x in v:
                if x.get("ad") == ad:
                    return f"{SESLER}/{x['dosya']}"
    raise KeyError(ad)


def add(buf, a, t, gain_db=0.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    a = a * (10 ** (gain_db / 20))
    n = min(len(a), len(buf) - i)
    buf[i:i + n] += a[:n]


def karplus(freq, dur, decay=0.996):
    n = int(SR * dur)
    p = int(SR / freq)
    buf = np.random.default_rng(int(freq)).uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = decay * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out


def music(total, tl):
    n = int(total * SR)
    tt = np.arange(n) / SR
    m = np.zeros(n)
    # drone (A minör): yavaş nefes alan alçak telli doku
    for f0, g in [(55, 0.5), (82.41, 0.28), (110, 0.22), (164.8, 0.08)]:
        for det in (-0.25, 0.25):
            ph = 2 * np.pi * (f0 + det) * tt
            m += g * (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.08 * tt + f0))
    m /= 4
    s08 = next(s["start"] for s in tl if s["id"] == "S08")
    s15 = next(s["start"] for s in tl if s["id"] == "S15")
    s13 = next(s for s in tl if s["id"] == "S13")
    s20 = next(s["start"] for s in tl if s["id"] == "S20")
    s21 = next(s["start"] for s in tl if s["id"] == "S21")
    # klavsen (Paris bölümü)
    notes = [220, 261.6, 329.6, 261.6, 196, 246.9, 293.7, 246.9]
    k = 0
    tcur = s08
    while tcur < s15:
        if not (s13["start"] <= tcur < s13["start"] + 1.2):
            pl = karplus(notes[k % len(notes)], 1.2, 0.993) * 0.16
            i = int(tcur * SR)
            m[i:i + len(pl)] += pl[:max(0, min(len(pl), n - i))]
        k += 1
        tcur += 0.36
    # piyano notası (yorum bölümü)
    tcur = s15
    pn = [440, 392, 349.2, 329.6]
    k = 0
    while tcur < s21:
        d = 2.2
        ti = np.arange(int(SR * d)) / SR
        f0 = pn[k % 4] / 2
        tone = (np.sin(2 * np.pi * f0 * ti) + 0.4 * np.sin(4 * np.pi * f0 * ti) + 0.15 * np.sin(6 * np.pi * f0 * ti)) * np.exp(-ti * 2.2) * 0.22
        i = int(tcur * SR)
        m[i:i + len(tone)] += tone[:max(0, min(len(tone), n - i))]
        k += 1
        tcur += 1.4
    # S13'te müzik çekilir
    env = np.ones(n)
    a0, a1 = int(s13["start"] * SR), int((s13["start"] + 1.3) * SR)
    env[a0:a1] = 0.15
    env = np.convolve(env, np.ones(2400) / 2400, mode="same")
    # S20 yükseliş, sonda iniş
    env *= 1 + 0.6 * np.clip((tt - s20) / 3.0, 0, 1) * (tt < s21)
    env *= np.clip((total - tt) / 1.2, 0, 1) * 0.6 + 0.4 * (tt < total - 1.2)
    m *= env
    m = np.stack([m, m], 1)
    m[:, 1] = np.roll(m[:, 1], 240)  # hafif stereo
    return m.astype(np.float32)


def build_audio(total, tl, voice_path, out_wav):
    n = int(total * SR) + SR
    voice = np.zeros((n, 2), np.float32)
    if voice_path:
        v = load_audio(voice_path)
        # konuşma -16 LUFS civarına (kaba RMS)
        rms = np.sqrt(np.mean(v[np.abs(v[:, 0]) > 0.01] ** 2) + 1e-9)
        v *= 0.12 / rms
        voice[:min(n, len(v))] += v[:n]
    mus = music(total + 1, tl)[:n]
    # ducking
    env = np.abs(voice[:, 0])
    env = np.convolve(env, np.ones(4800) / 4800, mode="same")
    duck = np.where(env > 0.01, 0.10, 0.32)
    duck = np.convolve(duck, np.ones(9600) / 9600, mode="same").astype(np.float32)
    mix = voice.copy()
    mix[:len(mus)] += mus * duck[:len(mus), None]
    sfx = np.zeros_like(mix)
    st = {s["id"]: s["start"] for s in tl}
    def S(ad, t, g=0.0, rate=1.0):
        try:
            add(sfx, load_audio(sfx_path(ad), rate=rate), t, g)
        except Exception as e:
            print("sfx yok", ad, e)
    S("impact_hit_434874", 0.3, -6)
    S("impactBell_heavy_000", 0.3, -20, 0.6)
    S("whoosh_494789", st["S02"] - 0.05, -10)
    S("page_flip_484933", st["S02"] + 0.4, -14)
    S("card-slide-1", st["S03"], -8)
    S("bookFlip2", T("yanlış:") - 0.05, -2, 0.8)
    S("cloth1", T("yanlış:") + 0.1, -8)
    S("impact_hit_209012", st["S04"] + 0.8, -12, 0.7)
    S("swoosh_transition_614169", st["S05"] + 0.1, -16)
    S("creak2", st["S06"] + 0.3, -14, 0.7)
    S("riser_cinematic_648732", st["S06"] + 0.2, -16)
    S("cloth3", st["S07"] + 0.3, -14)
    S("page_flip_437121", st["S08"] - 0.1, -8)
    S("impactBell_heavy_002", st["S08"] + 0.4, -22, 0.5)
    for k in range(6):
        S("chip-lay-%d" % (k % 3 + 1), st["S08"] + 0.15 + k * 0.12, -16, 0.7)
    S("page_flip_484940", st["S09"] + 0.2, -14)
    S("metalPot1", st["S10"] + 0.4, -18, 0.8)
    S("creak1", st["S12"] + 0.1, -12)
    S("crowd_gasp_333398", st["S14"] + 0.2, -26)
    S("clock_ticking_342299", st["S15"], -22)
    t0 = st["S16"]
    while t0 < st["S17"]:
        S("impactGeneric_light_001", t0 + 0.25, -12, 0.6)
        t0 += 0.7
    S("riser_cinematic_511876", st["S17"] - 0.5, -18)
    S("impact_hit_718749", st["S18"] + 0.25, -10)
    S("swoosh_transition_755054", st["S19"] + 0.2, -16)
    S("whoosh_222493", st["S20"], -24)
    S("heartbeat_451948", st["S21"] + 0.3, -18)
    mix += sfx
    peak = np.max(np.abs(mix)) + 1e-9
    if peak > 0.95:
        mix *= 0.95 / peak
    pcm = (mix[:int(total * SR)] * 32767).astype(np.int16)
    import wave
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------- ana
if __name__ == "__main__":
    args = sys.argv[1:]
    ses = "klon"
    out = os.path.join(ROOT, "kara_kedi_reels.mp4")
    prev = None
    if "--ses" in args:
        ses = args[args.index("--ses") + 1]
    if "--cikti" in args:
        out = args[args.index("--cikti") + 1]
    if "--onizleme" in args:
        prev = [float(x) for x in args[args.index("--onizleme") + 1].split(",")]
    PICK = json.load(open(os.path.join(ROOT, "secim.json")))
    vp = os.path.join(ROOT, "ses", f"{ses}.wav")
    kp = os.path.join(ROOT, "ses", f"{ses}.kelimeler.json")
    TIMES, total = word_times(kp if os.path.exists(kp) else None)
    TL, END = build_timeline(TIMES, total)
    # altyazı zamanları
    SUB_TIMES = []
    i = 0
    for d, nn in SUBS:
        s0 = TIMES[i][0]
        i += nn
        if d:
            SUB_TIMES.append([d, s0 - 0.05, None])
    for k in range(len(SUB_TIMES)):
        SUB_TIMES[k][2] = SUB_TIMES[k + 1][1] if k + 1 < len(SUB_TIMES) else END
    SEAL = wax_seal()
    SIG = build_sig()
    ep = eye_points(PICK["s01"])
    if ep:
        c = np.mean([e[0] for e in ep], 0)
        EYE01 = (c[0] / SW, c[1] / SH)
    else:
        EYE01 = (0.5, 0.45)
    EYES01 = ep

    def EYES01_SCR(z):
        return [src_to_screen(c[0], c[1], EYE01[0], EYE01[1], z) for c, _ in EYES01]

    EYES06 = eye_points(PICK["s06"])
    EYES21 = eye_points(PICK["s21"])
    if EYES21:
        c = np.mean([e[0] for e in EYES21], 0)
        EYE21 = (c[0] / SW, c[1] / SH + 0.02)
    else:
        EYE21 = (0.5, 0.45)
    json.dump({"timeline": TL, "subs": SUB_TIMES, "end": END}, open(os.path.join(ROOT, "zaman.json"), "w"), ensure_ascii=False, indent=1)
    if prev:
        frames = [frame_at(t, TL) for t in prev]
        sm = [cv2.resize(f, (360, 640)) for f in frames]
        rows = [np.hstack(sm[i:i + 6] + [np.zeros_like(sm[0])] * (6 - len(sm[i:i + 6]))) for i in range(0, len(sm), 6)]
        cv2.imwrite(os.path.join(ROOT, "onizleme.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
        print("önizleme yazıldı", [round(s["start"], 2) for s in TL], round(END, 2))
        sys.exit()
    wav = os.path.join(ROOT, "mix.wav")
    build_audio(END, TL, vp if os.path.exists(vp) else None, wav)
    nfr = int(END * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-tune", "grain", "-pix_fmt", "yuv420p", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000",
                           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out], stdin=subprocess.PIPE)
    for fi in range(nfr):
        ff.stdin.write(frame_at(fi / FPS, TL).tobytes())
        if fi % 150 == 0:
            print(f"{fi}/{nfr}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("bitti", out, round(END, 2))
