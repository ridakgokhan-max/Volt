"""Kukla motoru demosu: çizim → boyama → kukla hareketi (el sallama, baş eğme, gülümseme, göz kırpma, sakal fiziği).

Kullanım: python scripts/puppet_demo.py cikti.mp4 [--preview]
"""
import subprocess
import sys
import wave

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from skimage import filters

sys.path.insert(0, "scripts")
from alive_demo import signal_room  # noqa: E402
from draw_demo import INK, caption, draw_times, line_mask, pencil, pencil_audio  # noqa: E402
from parchment import PAPER, grade, paper_texture, panel_mask  # noqa: E402
from puppet import Bone, Puppet, track  # noqa: E402

W, H = 1080, 1920
FPS = 30
TOTAL = 300
DRAW_END, FILL_END = 78, 108
ALIVE = (TOTAL - FILL_END) / FPS
PREVIEW_TIMES = (0.0, 1.0, 1.08, 2.0, 2.3, 4.0, 4.8, 6.3)
PREVIEW_SIZE, PREVIEW_CROP = (270, 480), (0, 0, 270, 480)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TEXT = "Mucit dede bizi görünce el salladı ve gülümsedi."
A = "out/assets/kukla1/"
CHAR, BG = A + "karakter-23.png", A + "arkaplan-5.png"
SMILE = "out/assets/kukla1-yuz/gulumseme.png"
FACE_MASK, EYE_MASK = "assets/masks/kukla1-yuz.png", "assets/masks/kukla1-gozler.png"
CHAR_RECT = (140, 15, 390, 1118)
FEET_Y, CHAR_H = 1795, 1380  # karakterin sahnedeki ayak çizgisi ve boyu (px)

# Eklemler (karakter görseli 640x1136 koordinatlarında)
J = {
    "hip": (325, 560), "feet": (325, 1100), "neck": (328, 238), "headtop": (330, 40),
    "chin": (332, 168), "beardtip": (332, 252),
    "shL": (206, 272), "elL": (176, 420), "wrL": (190, 600), "hdL": (205, 690),
    "shR": (418, 248), "elR": (478, 420), "wrR": (470, 560), "hdR": (458, 640),
}

# Parça çokgenleri (karakter görseli koordinatlarında): kol gövdeden, baş omuzlardan ayrı kesilir
POLYS = {
    "armL": [(224, 230), (200, 248), (180, 310), (165, 400), (152, 480), (145, 560), (150, 600), (165, 640),
             (178, 680), (200, 700), (222, 695), (228, 660), (222, 620), (222, 580), (224, 520), (222, 440),
             (226, 360), (232, 290), (238, 250)],
    "head": [(268, 18), (392, 18), (410, 90), (405, 150), (390, 200), (378, 262), (288, 262), (272, 200),
             (256, 150), (252, 90)],
}


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def cover_up(img):
    s = max(W / img.shape[1], H / img.shape[0])
    nw, nh = round(img.shape[1] * s), round(img.shape[0] * s)
    b = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
    x0, y0 = (nw - W) // 2, (nh - H) // 2
    return b[y0:y0 + H, x0:x0 + W]


EYES = [((315, 115), 14, 8), ((365, 113), 14, 8)]  # göz merkezleri (karakter görseli), göz kırpma için


def closed_eyes(bgr):
    """Gözleri kapalı çizer: göz alanını göz altı teniyle örter, üstüne kapalı göz kapağı çizgisi."""
    out = bgr.copy()
    for (cx, cy), rx, ry in EYES:
        skin = bgr[cy + 10:cy + 14, cx - 6:cx + 6].reshape(-1, 3).mean(0)
        cv2.ellipse(out, (cx, cy), (rx, ry), 0, 0, 360, skin.tolist(), -1, cv2.LINE_AA)
        cv2.ellipse(out, (cx, cy - 1), (rx - 2, 4), 0, 15, 165, (40, 34, 34), 2, cv2.LINE_AA)
    return cv2.GaussianBlur(out, (3, 3), 0) * 0 + out


def segment_char(bgr):
    mask = np.zeros(bgr.shape[:2], np.uint8)
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(bgr, mask, CHAR_RECT, bgm, fgm, 6, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    m = np.where(lab == 1 + np.argmax(st[1:, 4]), 255, 0).astype(np.uint8)
    ff = m.copy()
    h, w = m.shape
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 255)
    return m | cv2.bitwise_not(ff)


def main(dst, preview=False):
    bgr = cv2.imread(CHAR)
    m = segment_char(bgr)
    # kenar renk taşmasını önle: maske dışını içerideki renklerle doldur
    bgr_f = cv2.inpaint(bgr, cv2.bitwise_not(cv2.erode(m, np.ones((3, 3), np.uint8))), 5, cv2.INPAINT_TELEA)

    def variant(path, mask_path):
        try:
            v = cv2.imread(path)
            mk = cv2.imread(mask_path, 0).astype(np.float32)[..., None] / 255
            return (bgr_f * (1 - mk) + v * mk).astype(np.uint8)
        except Exception:
            return None

    sc = CHAR_H / (CHAR_RECT[3] - 2)
    ox = W / 2 - J["hip"][0] * sc
    oy = FEET_Y - 1118 * sc
    Mplace = np.float32([[sc, 0, ox], [0, sc, oy]])

    def place(img_bgr, alpha):
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        col = cv2.warpAffine(rgb, Mplace, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        a = cv2.warpAffine(alpha, Mplace, (W, H), flags=cv2.INTER_LINEAR)
        return np.dstack([grade(col.astype(np.float32)), a])

    alpha = cv2.GaussianBlur(m, (3, 3), 0).astype(np.float32) / 255
    base = place(bgr_f, alpha)
    tex = {}
    smile = variant(SMILE, FACE_MASK)
    if smile is not None:
        # modelin değiştirdiği gözlük çerçevesini orijinaliyle geri koy (geçişte gözlük şekil değiştirmesin)
        gray = cv2.cvtColor(bgr_f, cv2.COLOR_BGR2GRAY)
        gm = np.zeros(gray.shape, np.uint8)
        gm[94:140, 284:394] = (gray[94:140, 284:394] < 85).astype(np.uint8)
        for (cx, cy), _rx, _ry in EYES:
            cv2.ellipse(gm, (cx, cy), (16, 10), 0, 0, 360, 0, -1)
        gm = cv2.GaussianBlur(cv2.dilate(gm * 255, np.ones((3, 3), np.uint8)), (3, 3), 0).astype(np.float32)[..., None] / 255
        smile = (smile * (1 - gm) + bgr_f * gm).astype(np.uint8)
        tex["smile"] = place(smile, alpha)
    tex["blink"] = place(closed_eyes(bgr_f), alpha)

    def P_xy(x, y):
        return (x * sc + ox, y * sc + oy)

    def P(name):
        return P_xy(*J[name])

    bones = [
        Bone("legs", None, P("hip"), P("feet"), "body"),
        Bone("spine", "legs", P("hip"), P("neck"), "body"),
        Bone("head", "spine", P("neck"), P("headtop"), "head"),
        Bone("beard", "head", P("chin"), P("beardtip"), "head", spring={"k": 55, "c": 5.5, "follow": 0.55}),
        Bone("uarmL", "spine", P("shL"), P("elL"), "armL"),
        Bone("farmL", "uarmL", P("elL"), P("wrL"), "armL"),
        Bone("handL", "farmL", P("wrL"), P("hdL"), "armL"),
    ]
    polys = {name: [P_xy(x, y) for x, y in pts] for name, pts in POLYS.items()}
    pup = Puppet(base, bones, ["body", "head", "armL"], spacing=16, blend=16, textures=tex, part_polys=polys)
    print("kukla:", len(pup.V), "nokta,", len(pup.T), "üçgen,", "varyantlar:", list(tex), flush=True)

    # arka plan + zemin gölgesi
    bg = grade(cover_up(cv2.cvtColor(cv2.imread(BG), cv2.COLOR_BGR2RGB)).astype(np.float32))
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    shadow = np.exp(-(((X - W / 2) / 260) ** 2 + ((Y - FEET_Y + 6) / 34) ** 2))[..., None]
    bg = bg * (1 - 0.35 * shadow)

    # kâğıt bitişi
    tx = paper_texture(H, W, 5)
    pm, dist = panel_mask(H, W, 5)
    edge = np.exp(-np.abs(dist + 4) / 5.0) * 0.35
    r = np.sqrt(((X - W / 2) / (W * 0.75)) ** 2 + ((Y - H / 2) / (H * 0.75)) ** 2)
    vig = (1 - 0.38 * np.clip(r - 0.45, 0, 1) ** 1.4)[..., None]
    paperc = np.broadcast_to(PAPER, (H, W, 3)).astype(np.float32)

    def finish(c):
        o = c * pm + paperc * (1 - pm)
        o = o * (1 - edge) + np.array([90, 70, 50], np.float32) * edge
        o = o * (1 - 0.06 * pm) + paperc * 0.06 * pm
        return o * tx * vig

    PAPER_ONLY = finish(paperc)
    rng = np.random.default_rng(7)
    dust = np.column_stack([rng.uniform(80, W - 80, 40), rng.uniform(300, 1700, 40), rng.uniform(1.5, 3.5, 40),
                            rng.uniform(0, 6.28, 40), rng.uniform(8, 20, 40)])

    deg = np.deg2rad

    def pose(t, amp):
        """Canlanma zamanı t (sn) için kemik açıları ve yüz karışımları."""
        B = pup.B
        B["spine"].stretch = 1 + 0.011 * np.sin(2 * np.pi * t / 3.0) * amp
        raise_ = track([(0, 0), (0.55, 0), (1.45, 1), (3.55, 1), (4.45, 0)], t)
        B["uarmL"].angle = deg(129) * raise_
        B["farmL"].angle = deg(58) * track([(0, 0), (0.75, 0), (1.55, 1), (3.5, 1), (4.4, 0)], t)
        env = smooth((t - 1.45) / 0.3) * (1 - smooth((t - 3.25) / 0.3))
        wave = deg(19) * np.sin(2 * np.pi * 1.55 * (t - 1.45)) * env
        B["farmL"].angle += wave
        B["spine"].angle = deg(2.2) * raise_ * amp  # el kalkarken gövde hafifçe karşı yöne yaslanır
        smile = track([(0, 0), (3.85, 0), (4.5, 1)], t) if "smile" in tex else 0
        tilt = deg(7) * track([(0, 0), (3.7, 0), (4.5, 1), (5.6, 1), (6.4, 0.6)], t)
        B["head"].angle = (deg(1.2) * np.sin(2 * np.pi * t / 4.3) - deg(2.5) * raise_ + tilt) * amp
        blink = 0.0
        if "blink" in tex:
            for b0 in (1.05, 5.5):
                dtb = t - b0
                if 0 <= dtb < 0.17:
                    blink = 1.0 if 0.04 <= dtb < 0.12 else 0.55
        return {"smile": smile * amp, "blink": blink}

    def compose(f, amp, t, physics=True):
        mix = pose(t, amp) if amp > 0 else {}
        if physics:
            pup.step_physics(1 / FPS)
        ch = pup.render(mix)
        D = 30 * smooth(max(0, f - FILL_END) / (TOTAL - FILL_END))
        zoom = 1 + 0.07 * smooth(max(0, f - FILL_END) / (TOTAL - FILL_END))

        def cam(k):
            return np.float32([[zoom, 0, (1 - zoom) * W / 2 - D * k], [0, zoom, (1 - zoom) * H * 0.62]])

        b = cv2.warpAffine(bg, cam(0.4), (W, H), borderMode=cv2.BORDER_REFLECT)
        c = cv2.warpAffine(ch, cam(0.85), (W, H), borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        out = b * (1 - c[..., 3:4]) + c[..., :3]
        out = finish(out)
        if amp > 0:
            img = Image.fromarray(out.clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img, "RGBA")
            for x, y, s, ph, sp in dust:
                px = x + 12 * np.sin(t * 0.7 + ph) - D * 0.9
                py = (y - sp * t) % 1500 + 250
                a = int(100 * amp * (0.5 + 0.5 * np.sin(t * 1.3 + ph)))
                d.ellipse([px - s, py - s, px + s, py + s], fill=(255, 240, 210, a))
            out = np.asarray(img, dtype=np.float32)
        return out

    if preview:
        frames = []
        for t in PREVIEW_TIMES:
            for b in pup.bones:
                b.angle, b.stretch = 0.0, 1.0
            pose(t, 1.0)
            ch = pup.render(pose(t, 1.0))
            o = bg * (1 - ch[..., 3:4]) + ch[..., :3]
            frames.append(cv2.resize(o.clip(0, 255).astype(np.uint8), PREVIEW_SIZE)[PREVIEW_CROP[1]:PREVIEW_CROP[3], PREVIEW_CROP[0]:PREVIEW_CROP[2]])
        cv2.imwrite(dst, cv2.cvtColor(np.hstack(frames), cv2.COLOR_RGB2BGR))
        return

    still = compose(0, 0.0, 0.0, physics=False)
    raw = (cover_up(cv2.cvtColor(cv2.imread(BG), cv2.COLOR_BGR2RGB)).astype(np.float32))
    craw = cv2.warpAffine(cv2.cvtColor(bgr_f, cv2.COLOR_BGR2RGB), Mplace, (W, H), flags=cv2.INTER_LANCZOS4).astype(np.float32)
    raw = raw * (1 - base[..., 3:4]) + craw * base[..., 3:4]
    lm = line_mask(Image.fromarray(raw.clip(0, 255).astype(np.uint8)))
    lm &= cv2.erode((pm[..., 0] > 0.5).astype(np.uint8), np.ones((13, 13), np.uint8)) > 0
    tm = draw_times(lm)
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
    prev = -1.0
    for f in range(TOTAL):
        if f < FILL_END:
            p = 1 - (1 - min(1.0, f / DRAW_END)) ** 1.6
            drawn = (tm <= p).astype(np.float32)
            fillp = np.clip((f - DRAW_END) / (FILL_END - DRAW_END), 0, 1)
            Am = np.clip((fillp * 1.4 - wipe) / 0.35, 0, 1)[..., None]
            ink = drawn[..., None] * (1 - 0.75 * Am)
            frame = (PAPER_ONLY * (1 - Am) + still * Am) * (1 - ink) + INK * ink
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
            amp = smooth(t / 1.2)
            img = Image.fromarray(compose(f, amp, t).clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img)
        k = min(len(words), int(f / (TOTAL * 0.85) * len(words)) + 1)
        caption(d, font, words, k)
        ff.stdin.write(np.asarray(img).tobytes())
        if f % 50 == 0:
            print("kare", f, flush=True)
    ff.stdin.close()
    ff.wait()

    sr, pcm = pencil_audio(TOTAL, active)
    audio = pcm.astype(np.float32) / 32767 + signal_room(len(pcm), sr)
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    with wave.open(dst + ".wav", "wb") as wv:
        wv.setnchannels(1)
        wv.setsampwidth(2)
        wv.setframerate(sr)
        wv.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", dst + ".noaudio.mp4", "-i", dst + ".wav", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", dst], check=True)


if __name__ == "__main__":
    main(sys.argv[1], preview="--preview" in sys.argv)
