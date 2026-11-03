"""Çizim → boyama → canlanma demosu (tamamen kendi kodumuz, dış servis yok).

Sahne üç katmana ayrılır (arka plan / karakter / ön plan masa). Çizim ve boyama bittikten sonra
aynı kare dikişsiz biçimde canlanır: derinlikli kamera, nefes alma, baş eğme, sakal salınımı,
göz kırpma, saniye ibreleri, mum ışığı ve toz parçacıkları.

Kullanım: python scripts/alive_demo.py girdi.jpg cikti.mp4
"""
import subprocess
import sys
import wave

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from skimage import filters

sys.path.insert(0, "scripts")
from draw_demo import INK, caption, draw_times, line_mask, pencil, pencil_audio  # noqa: E402
from parchment import PAPER, grade, paper_texture, panel_mask  # noqa: E402

W, H = 1080, 1920
FPS = 30
TOTAL = 300
DRAW_END, FILL_END = 78, 108
ALIVE_RAMP = 45
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TEXT = "Yaşlı saatçi her sabah aynı sessizlikte zamanı dinlerdi."

# Kaynak görsel (640x1136) üzerindeki noktalar
SRC_W, SRC_H = 640, 1136
CLOCKS = [((128, 208), 52), ((510, 212), 52)]
CANDLE = (242, 975)
EYES = [((289, 345), 21, 13), ((367, 346), 20, 13)]
NECK = (325, 470)
TABLE_Y = 912


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def segment(im):
    mask = np.full(im.shape[:2], cv2.GC_BGD, np.uint8)
    mask[175:895, 35:615] = cv2.GC_PR_FGD
    cv2.ellipse(mask, (325, 330), (85, 110), 0, 0, 360, cv2.GC_FGD, -1)
    cv2.rectangle(mask, (250, 430), (400, 700), cv2.GC_FGD, -1)
    cv2.rectangle(mask, (170, 520), (480, 860), cv2.GC_FGD, -1)
    for (c, _r) in CLOCKS:
        cv2.circle(mask, c, 75, cv2.GC_BGD, -1)
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(im, mask, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
    m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    m = np.where(lab == k, 255, 0).astype(np.uint8)
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))


def eyes_variant(rgb, closed):
    """Gözleri yarı ya da tam kapalı çizer (göz kırpma kareleri)."""
    out = rgb.copy()
    skin = rgb[300:312, 318:334].reshape(-1, 3).mean(0)  # alın/burun köprüsü ten rengi
    for (cx, cy), rx, ry in EYES:
        if closed >= 1:
            cv2.ellipse(out, (cx, cy), (rx, ry), 0, 0, 360, skin.tolist(), -1, cv2.LINE_AA)
            cv2.ellipse(out, (cx, cy + 2), (rx - 3, 6), 0, 10, 170, (40, 32, 30), 2, cv2.LINE_AA)
        else:
            cv2.ellipse(out, (cx, cy), (rx, ry), 0, 180, 360, skin.tolist(), -1, cv2.LINE_AA)
            cv2.line(out, (cx - rx + 2, cy), (cx + rx - 2, cy), (40, 32, 30), 2, cv2.LINE_AA)
    return out


def up(a, interp=cv2.INTER_LANCZOS4):
    """Kaynak boyuttan 1080x1920'ye (cover) büyüt."""
    s = max(W / SRC_W, H / SRC_H)
    nw, nh = round(SRC_W * s), round(SRC_H * s)
    b = cv2.resize(a, (nw, nh), interpolation=interp)
    x0, y0 = (nw - W) // 2, (nh - H) // 2
    return b[y0:y0 + H, x0:x0 + W]


S = max(W / SRC_W, H / SRC_H)
OX = (round(SRC_W * S) - W) // 2
OY = (round(SRC_H * S) - H) // 2


def P(x, y):
    return x * S - OX, y * S - OY


def main(src, dst):
    bgr = cv2.imread(src)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    cm = segment(bgr)

    # Arka plan: karakter alanını doldur (hareket sırasında açılan kenarlar için)
    hole = cv2.dilate(cm, np.ones((31, 31), np.uint8))
    bg_src = cv2.inpaint(bgr, hole, 9, cv2.INPAINT_TELEA)
    bg_src = cv2.cvtColor(bg_src, cv2.COLOR_BGR2RGB)

    char_alpha = cv2.GaussianBlur(cm, (5, 5), 0).astype(np.float32) / 255
    yy = np.arange(SRC_H)[:, None].repeat(SRC_W, 1)
    fg_alpha = np.clip((yy - TABLE_Y) / 6, 0, 1) * (1 - char_alpha)

    def layer(img):
        return grade(up(img).astype(np.float32))

    BG = layer(bg_src)
    FGL = layer(rgb)
    CH = {0: layer(rgb), 1: layer(eyes_variant(rgb, 0.5)), 2: layer(eyes_variant(rgb, 1))}
    A_CH = up(char_alpha, cv2.INTER_LINEAR)[..., None]
    A_FG = up(fg_alpha.astype(np.float32), cv2.INTER_LINEAR)[..., None]

    # Sabit kâğıt katmanları
    tex = paper_texture(H, W, 5)
    pm, dist = panel_mask(H, W, 5)
    edge = np.exp(-np.abs(dist + 4) / 5.0) * 0.35
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((X - W / 2) / (W * 0.75)) ** 2 + ((Y - H / 2) / (H * 0.75)) ** 2)
    vig = (1 - 0.38 * np.clip(r - 0.45, 0, 1) ** 1.4)[..., None]
    paperc = np.broadcast_to(PAPER, (H, W, 3)).astype(np.float32)

    def finish(content):
        o = content * pm + paperc * (1 - pm)
        o = o * (1 - edge) + np.array([90, 70, 50], np.float32) * edge
        o = o * (1 - 0.06 * pm) + paperc * 0.06 * pm
        return o * tex * vig

    PAPER_ONLY = finish(paperc)

    # Mum ışığı
    cx, cy = P(*CANDLE)
    glow = np.exp(-(((X - cx) ** 2 + (Y - cy) ** 2) / (2 * 190.0 ** 2)))[..., None]
    GLOW_COL = np.array([255, 185, 105], np.float32)

    rng = np.random.default_rng(7)
    dust = np.column_stack([rng.uniform(80, W - 80, 46), rng.uniform(300, 1700, 46), rng.uniform(1.5, 4, 46),
                            rng.uniform(0, 6.28, 46), rng.uniform(8, 22, 46)])

    def second_angle(t):
        sec = np.floor(t)
        fr = t - sec
        k = smooth(fr / 0.12) if fr < 0.12 else 1.0
        overshoot = 0.12 * np.sin(np.clip((fr - 0.12) / 0.15, 0, 1) * np.pi) if fr < 0.27 else 0
        return np.deg2rad((sec - 1 + k + overshoot) * 6 + 200)

    def compose(f, amp, t):
        """f: kare, amp: canlanma şiddeti 0..1, t: canlanma zamanı (sn)."""
        D = 34 * smooth(max(0, f - FILL_END) / (TOTAL - FILL_END))  # kamera kayması
        zoom = 1 + 0.06 * smooth(max(0, f - FILL_END) / (TOTAL - FILL_END))

        def shift_map(k, extra=None):
            mx = (X - W / 2) / zoom + W / 2 + D * k
            my = (Y - H / 2) / zoom + H / 2
            if extra is not None:
                mx, my = extra(mx, my)
            return mx.astype(np.float32), my.astype(np.float32)

        # Arka plan + saniye ibreleri
        bgl = BG.copy()
        for (c, rr), ph in zip(CLOCKS, (0.0, 0.5)):
            a = second_angle(t + ph) if amp > 0 else second_angle(ph)
            x0, y0 = P(*c)
            L = rr * S
            p1 = (int(x0 - np.cos(a) * L * 0.2), int(y0 - np.sin(a) * L * 0.2))
            p2 = (int(x0 + np.cos(a) * L), int(y0 + np.sin(a) * L))
            cv2.line(bgl, p1, p2, (120, 42, 32), 4, cv2.LINE_AA)
            cv2.circle(bgl, (int(x0), int(y0)), 7, (120, 42, 32), -1, cv2.LINE_AA)
        mx, my = shift_map(0.4)
        out = cv2.remap(bgl, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

        # Karakter: nefes, baş eğme, sakal salınımı, göz kırpma
        breath = np.sin(2 * np.pi * t / 3.2) * amp
        tilt = np.deg2rad(1.8) * np.sin(2 * np.pi * t / 5.0 - 0.6) * amp
        sway = 5.0 * np.sin(2 * np.pi * t / 2.6 + 0.8) * amp
        nx, ny = P(*NECK)
        ty = P(0, TABLE_Y)[1]
        bx, by = P(330, 600)

        def puppet(mx, my):
            sy = 1 + 0.010 * breath
            sx = 1 + 0.004 * breath
            my2 = ty + (my - ty) / sy
            mx2 = nx + (mx - nx) / sx
            w = smooth((ny + 70 - my2) / 110)  # boyundan yukarısı = baş
            dx, dy = mx2 - nx, my2 - ny
            ca, sa = np.cos(-tilt * w), np.sin(-tilt * w)
            mx3 = nx + ca * dx - sa * dy
            my3 = ny + sa * dx + ca * dy
            wb = np.exp(-(((mx3 - bx) / 150) ** 2 + ((my3 - by) / 210) ** 2)) * np.clip((my3 - ny) / 300, 0, 1)
            mx3 = mx3 - sway * wb
            return mx3, my3

        blink = 0
        for b0 in (172, 262):
            if f in (b0, b0 + 3):
                blink = 1
            elif f in (b0 + 1, b0 + 2):
                blink = 2
        mx, my = shift_map(0.75, puppet)
        ch = cv2.remap(CH[blink], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        ac = cv2.remap(A_CH, mx, my, cv2.INTER_LINEAR, borderValue=0)[..., None]
        out = out * (1 - ac) + ch * ac

        # Ön plan masa
        mx, my = shift_map(1.0)
        fgl = cv2.remap(FGL, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        af = cv2.remap(A_FG, mx, my, cv2.INTER_LINEAR, borderValue=0)[..., None]
        out = out * (1 - af) + fgl * af

        # Mum ışığı titremesi
        fl = 0.16 + amp * (0.05 * np.sin(t * 13.1) + 0.035 * np.sin(t * 29.7 + 1) + 0.02 * np.sin(t * 7.3))
        gsh = cv2.remap(glow, *shift_map(1.0), cv2.INTER_LINEAR)[..., None]
        out = out + GLOW_COL * gsh * fl * 0.55

        out = finish(out)

        # Toz parçacıkları
        if amp > 0:
            img = Image.fromarray(out.clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img, "RGBA")
            for x, y, s, ph, sp in dust:
                px = x + 14 * np.sin(t * 0.7 + ph) - D * 0.9
                py = (y - sp * t) % 1500 + 250
                a = int(110 * amp * (0.5 + 0.5 * np.sin(t * 1.3 + ph)))
                d.ellipse([px - s, py - s, px + s, py + s], fill=(255, 240, 210, a))
            out = np.asarray(img, dtype=np.float32)
        return out

    # Çizim için çizgi haritası ve sabit son kare
    still = compose(0, 0.0, 0.0)
    raw_up = Image.fromarray(up(rgb))
    m = line_mask(raw_up)
    inside = cv2.erode((pm[..., 0] > 0.5).astype(np.uint8), np.ones((13, 13), np.uint8)) > 0
    m &= inside
    tm = draw_times(m)
    wipe = filters.gaussian(rng.random((H // 8, W // 8)), 3)
    wipe = cv2.resize((wipe / wipe.max()).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)

    font = ImageFont.truetype(FONT, 66)
    words = TEXT.split()
    ff = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p", dst + ".noaudio.mp4"],
        stdin=subprocess.PIPE,
    )
    active = np.zeros(TOTAL)
    ticks = []
    prev = -1.0
    for f in range(TOTAL):
        if f < FILL_END:
            p = 1 - (1 - min(1.0, f / DRAW_END)) ** 1.6
            drawn = (tm <= p).astype(np.float32)
            fillp = np.clip((f - DRAW_END) / (FILL_END - DRAW_END), 0, 1)
            A = np.clip((fillp * 1.4 - wipe) / 0.35, 0, 1)[..., None]
            ink = drawn[..., None] * (1 - 0.75 * A)
            frame = (PAPER_ONLY * (1 - A) + still * A) * (1 - ink) + INK * ink
            img = Image.fromarray(frame.clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img)
            if f < DRAW_END:
                front = (tm > prev) & (tm <= p)
                if front.any():
                    ys, xs = np.nonzero(front)
                    pencil(d, xs.mean(), ys.mean())
                    active[f] = 1
            prev = p
        else:
            t = (f - FILL_END) / FPS
            amp = smooth((f - FILL_END) / ALIVE_RAMP)
            img = Image.fromarray(compose(f, amp, t).clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img)
        k = min(len(words), int(f / (TOTAL * 0.85) * len(words)) + 1)
        caption(d, font, words, k)
        ff.stdin.write(np.asarray(img).tobytes())
        if f % 50 == 0:
            print("kare", f, flush=True)
    ff.stdin.close()
    ff.wait()

    alive_dur = (TOTAL - FILL_END) / FPS
    for ph in (0.0, 0.5):
        for n in range(0, 20):
            tk = n - ph
            if 0 <= tk < alive_dur:
                ticks.append(FILL_END / FPS + tk)
    ticks.sort()
    sr, pcm = pencil_audio(TOTAL, active)
    audio = pcm.astype(np.float32) / 32767
    rng2 = np.random.default_rng(9)
    for i, tk in enumerate(ticks):
        n0 = int(tk * sr)
        n = int(0.035 * sr)
        tt = np.arange(n) / sr
        freq = 2600 if i % 2 == 0 else 2100
        click = (np.sin(2 * np.pi * freq * tt) * 0.6 + rng2.normal(0, 0.4, n)) * np.exp(-tt * 140) * 0.22
        audio[n0:n0 + n] += click[: max(0, len(audio) - n0)]
    room = signal_room(len(audio), sr)
    audio += room
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    with wave.open(dst + ".wav", "wb") as wv:
        wv.setnchannels(1)
        wv.setsampwidth(2)
        wv.setframerate(sr)
        wv.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", dst + ".noaudio.mp4", "-i", dst + ".wav", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", dst], check=True)


def signal_room(n, sr):
    """Çok hafif oda ambiyansı (sessizlik hissini doğal yapar)."""
    from scipy import signal as sg

    b, a = sg.butter(2, 400 / (sr / 2), "low")
    x = sg.lfilter(b, a, np.random.default_rng(4).normal(0, 1, n))
    return x / (np.abs(x).max() + 1e-9) * 0.012


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
