"""Kukla sahnesi: çizim → boyama → kukla hareketleri (otomatik iskelet + hareket kütüphanesi + el değiştirme).

Kullanım: python scripts/kukla_sahne.py ayar.json cikti.mp4 [--onizleme 0.5,2.0,4.0]
Ayar dosyası:
{
  "karakter": "out/assets/kukla1/karakter-23.png",
  "arkaplan": "out/assets/kukla1/arkaplan-5.png",
  "poz": "out/rig/kukla1/karakter-23.json",      # detect_pose.py çıktısı
  "sakal": true,
  "gulumseme": "out/assets/kukla1-yuz/gulumseme.png",   # isteğe bağlı (yüz inpaint)
  "eller": {"acik": "...png", "isaret": "...png"},       # isteğe bağlı (el değiştirme çizimleri)
  "hareket": "el_salla:L@0.6/3.0, gulumse@3.8/2.4",
  "altyazi": "Mucit dede bizi görünce el salladı.",
  "sure": 10.0, "cizim_sn": 2.6, "boyama_sn": 1.0,
  "ayak_y": 1795, "boy": 1380
}
"""
import json
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
from motions import Timeline  # noqa: E402
from parchment import PAPER, grade, paper_texture, panel_mask  # noqa: E402
from puppet import Bone, Puppet, Sprite  # noqa: E402
from rig_auto import auto_rig  # noqa: E402

W, H, FPS = 1080, 1920, 30
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def cover_up(img):
    s = max(W / img.shape[1], H / img.shape[0])
    nw, nh = round(img.shape[1] * s), round(img.shape[0] * s)
    b = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
    x0, y0 = (nw - W) // 2, (nh - H) // 2
    return b[y0:y0 + H, x0:x0 + W]


def segment_plain(bgr, rect=None):
    """Düz zemin üzerindeki karakteri/çizimi ayırır."""
    h, w = bgr.shape[:2]
    rect = rect or (int(w * 0.04), int(h * 0.01), int(w * 0.92), int(h * 0.98))
    mask = np.zeros((h, w), np.uint8)
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(bgr, mask, rect, bgm, fgm, 6, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    m = np.where(lab == 1 + np.argmax(st[1:, 4]), 255, 0).astype(np.uint8)
    ff = m.copy()
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 255)
    return m | cv2.bitwise_not(ff)


def closed_eyes(bgr, eyes):
    out = bgr.copy()
    for (cx, cy), rx, ry in eyes:
        rx, ry = rx + 2, ry + 2
        skin = bgr[cy + ry + 2:cy + ry + 6, cx - 5:cx + 5].reshape(-1, 3).mean(0)
        cv2.ellipse(out, (cx, cy), (rx, ry), 0, 0, 360, skin.tolist(), -1, cv2.LINE_AA)
        cv2.ellipse(out, (cx, cy - 1), (max(rx - 2, 3), max(ry // 2, 3)), 0, 15, 165, (40, 34, 34), 2, cv2.LINE_AA)
    return out


def hand_sprite(path, mirror=False):
    """El çizimini ayırır; bilek (pivot) ve orta parmak ucu (tip) noktalarını bulur.
    Beklenen: parmaklar yukarı, kol manşeti aşağıda."""
    bgr = cv2.imread(path)
    if mirror:
        bgr = cv2.flip(bgr, 1)
    m = segment_plain(bgr, (int(bgr.shape[1] * 0.08), 4, int(bgr.shape[1] * 0.84), bgr.shape[0] - 8))
    ys, xs = np.nonzero(m)
    top = ys.min()
    tip = (float(xs[ys < top + 10].mean()), float(top))
    # bilek: ten rengindeki en alt satır (manşet beyaz/açık renkli)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    skin = (m > 0) & (hsv[..., 1] > 45) & (hsv[..., 0] < 25) & (hsv[..., 2] > 90)
    rows = np.nonzero(skin.sum(1) > 6)[0]
    wy = rows.max() if len(rows) else ys.max() * 0.85
    wx = float(xs[np.abs(ys - wy) < 4].mean())
    rgb = grade(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32))
    a = cv2.GaussianBlur(m, (3, 3), 0).astype(np.float32) / 255
    return np.dstack([rgb, a]), (wx, float(wy)), tip


def main(cfg_path, dst, preview=None):
    C = cfg_path if isinstance(cfg_path, dict) else json.load(open(cfg_path, encoding="utf-8"))
    total = int(round(C.get("sure", 10.0) * FPS))
    draw_end = int(round(C.get("cizim_sn", 2.6) * FPS))
    fill_end = draw_end + int(round(C.get("boyama_sn", 1.0) * FPS))
    feet_y, char_h = C.get("ayak_y", 1795), C.get("boy", 1380)

    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    has_char = bool(C.get("karakter"))
    pup = tl = base = bgr_f = Mp = None
    if has_char:
        bgr = cv2.imread(C["karakter"])
        m = segment_plain(bgr)
        R = auto_rig(bgr, m, C["poz"], beard=C.get("sakal", False))
        J = R["joints"]
        bgr_f = cv2.inpaint(bgr, cv2.bitwise_not(cv2.erode(m, np.ones((3, 3), np.uint8))), 5, cv2.INPAINT_TELEA)

        ys = np.nonzero(m.any(1))[0]
        sc = char_h / (ys.max() - ys.min())
        ox = W / 2 - J["hip"][0] * sc
        oy = feet_y - ys.max() * sc
        Mp = np.float32([[sc, 0, ox], [0, sc, oy]])

        def place(img_bgr, alpha):
            col = cv2.warpAffine(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB), Mp, (W, H), flags=cv2.INTER_LANCZOS4,
                                 borderMode=cv2.BORDER_REPLICATE)
            a = cv2.warpAffine(alpha, Mp, (W, H), flags=cv2.INTER_LINEAR)
            return np.dstack([grade(col.astype(np.float32)), a])

        def P(name):
            x, y = J[name]
            return (x * sc + ox, y * sc + oy)

        alpha = cv2.GaussianBlur(m, (3, 3), 0).astype(np.float32) / 255
        base = place(bgr_f, alpha)
        tex = {"blink": place(closed_eyes(bgr_f, R["eyes"]), alpha)}
        if C.get("gulumseme"):
            sm = cv2.imread(C["gulumseme"])
            if sm is not None:
                # sadece yüz bölgesini al; gözlük gibi koyu çizgileri orijinalden koru
                face = np.zeros(m.shape, np.uint8)
                (mx, my), mw, mh = R["mouth"]
                e0, e1 = R["eyes"][0], R["eyes"][-1]
                cx, cy = (e0[0][0] + e1[0][0]) / 2, (e0[0][1] + my) / 2
                ax = int(abs(e1[0][0] - e0[0][0]) * 1.25 + 10)
                ay = int((my - e0[0][1]) * 1.25 + 20)
                cv2.ellipse(face, (int(cx), int(cy)), (ax, ay), 0, 0, 360, 255, -1)
                fm = cv2.GaussianBlur(face, (21, 21), 0).astype(np.float32)[..., None] / 255
                sm = (bgr_f * (1 - fm) + sm * fm).astype(np.uint8)
                gray = cv2.cvtColor(bgr_f, cv2.COLOR_BGR2GRAY)
                gm = ((gray < 80) & (face > 0)).astype(np.uint8)
                for (ex, ey), rx, ry in R["eyes"]:
                    cv2.ellipse(gm, (ex, ey), (rx + 4, ry + 4), 0, 0, 360, 0, -1)
                (mx_, my_), mw_, mh_ = R["mouth"]
                cv2.ellipse(gm, (int(mx_), int(my_)), (int(mw_ * 0.8) + 4, int(mh_ * 1.2) + 6), 0, 0, 360, 0, -1)
                gm = cv2.GaussianBlur(gm * 255, (3, 3), 0).astype(np.float32)[..., None] / 255
                sm = (sm * (1 - gm) + bgr_f * gm).astype(np.uint8)
                tex["smile"] = place(sm, alpha)

        masks = {n: cv2.warpAffine(v * 255, Mp, (W, H), flags=cv2.INTER_NEAREST) for n, v in R["masks"].items()}
        bones = [
            Bone("legs", None, P("hip"), P("feet"), "body"),
            Bone("spine", "legs", P("hip"), P("neck"), "body"),
            Bone("head", "spine", P("neck"), P("headtop"), "head"),
        ]
        if C.get("sakal"):
            bones.append(Bone("beard", "head", P("chin"), P("beardtip"), "head", spring={"k": 55, "c": 5.5, "follow": 0.55}))
        for S in ("L", "R"):
            bones += [Bone("uarm" + S, "spine", P("sh" + S), P("el" + S), "arm" + S),
                      Bone("farm" + S, "uarm" + S, P("el" + S), P("wr" + S), "arm" + S),
                      Bone("hand" + S, "farm" + S, P("wr" + S), P("hd" + S), "arm" + S)]

        # el değiştirme çizimleri: orijinal el (bilekten öte) gizlenir
        sprites = {}
        for S in ("L", "R"):
            e, wr = np.array(P("el" + S)), np.array(P("wr" + S))
            ax = wr - e
            t = ((X - e[0]) * ax[0] + (Y - e[1]) * ax[1]) / (ax @ ax)
            hide = ((t > 0.97) & (masks["arm" + S] > 0)).astype(np.float32)
            hide = cv2.GaussianBlur(hide, (9, 9), 0)
            for kind, path in C.get("eller", {}).items():
                # "el_tarafi": çizimin doğrudan uyduğu kol (görüntüde L/R); diğer kol için aynalanır
                rgba, piv, tip = hand_sprite(path, mirror=(S != C.get("el_tarafi", "R")))
                olc = C.get("el_olcek", {})
                olc = olc.get(kind, 1.15) if isinstance(olc, dict) else olc
                sprites[kind + S] = Sprite(rgba, piv, tip, "hand" + S, hide=hide, scale=olc)

        pup = Puppet(base, bones, ["body", "head", "armR", "armL"], spacing=16, blend=16, textures=tex,
                     part_masks=masks, sprites=sprites)
        tl = Timeline(pup, C["hareket"])
        print("kukla:", len(pup.V), "nokta,", len(pup.T), "üçgen; el çizimleri:", list(sprites), flush=True)

    bg = grade(cover_up(cv2.cvtColor(cv2.imread(C["arkaplan"]), cv2.COLOR_BGR2RGB)).astype(np.float32))
    shadow_base = np.exp(-(((X - W / 2) / 260) ** 2 + ((Y - feet_y + 6) / 34) ** 2))

    tx = paper_texture(H, W, 5)
    pm, dist = panel_mask(H, W, 5)
    edge = np.exp(-np.abs(dist + 4) / 5.0) * 0.35
    rr = np.sqrt(((X - W / 2) / (W * 0.75)) ** 2 + ((Y - H / 2) / (H * 0.75)) ** 2)
    vig = (1 - 0.38 * np.clip(rr - 0.45, 0, 1) ** 1.4)[..., None]
    paperc = np.broadcast_to(PAPER, (H, W, 3)).astype(np.float32)

    def finish(c):
        o = c * pm + paperc * (1 - pm)
        o = o * (1 - edge) + np.array([90, 70, 50], np.float32) * edge
        o = o * (1 - 0.06 * pm) + paperc * 0.06 * pm
        return o * tx * vig

    PAPER_ONLY = finish(paperc)
    alive_frames = total - fill_end

    def compose(f, t, amp, physics=True):
        if not has_char:  # sadece arka plan: daha belirgin kamera hareketi
            p = smooth(max(0, f - fill_end) / alive_frames)
            zoom = 1 + 0.09 * p
            M = np.float32([[zoom, 0, (1 - zoom) * W / 2 - 40 * p], [0, zoom, (1 - zoom) * H * 0.5]])
            return finish(cv2.warpAffine(bg, M, (W, H), borderMode=cv2.BORDER_REFLECT)), np.zeros(2)
        texm, sprm, off = tl.apply(t, amp)
        if physics:
            pup.step_physics(1 / FPS)
        ch = pup.render(texm, sprm)
        p = smooth(max(0, f - fill_end) / alive_frames)
        D, zoom = 28 * p, 1 + 0.06 * p

        def cam(k, dx=0.0, dy=0.0):
            return np.float32([[zoom, 0, (1 - zoom) * W / 2 - D * k + dx * zoom],
                               [0, zoom, (1 - zoom) * H * 0.62 + dy * zoom]])

        sh = np.roll(shadow_base, int(off[0]), axis=1)[..., None] * (1 - min(1, abs(off[1]) / 120) * 0.5)
        b = cv2.warpAffine(bg * (1 - 0.35 * sh), cam(0.4), (W, H), borderMode=cv2.BORDER_REFLECT)
        c = cv2.warpAffine(ch, cam(0.85, off[0], off[1]), (W, H), borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        return finish(b * (1 - c[..., 3:4]) + c[..., :3]), off

    if preview:
        tiles = []
        for t in preview:
            tl_frame = fill_end + int(t * FPS)
            o, _ = compose(tl_frame, t, 1.0, physics=False)
            tiles.append(cv2.resize(o.clip(0, 255).astype(np.uint8), (270, 480)))
        cv2.imwrite(dst, cv2.cvtColor(np.hstack(tiles), cv2.COLOR_RGB2BGR))
        return

    still, off0 = compose(fill_end, 0.0, 0.0, physics=False)
    raw = cover_up(cv2.cvtColor(cv2.imread(C["arkaplan"]), cv2.COLOR_BGR2RGB)).astype(np.float32)
    if has_char and abs(off0[0]) < 50:  # karakter başta sahnedeyse çizime dahil
        craw = cv2.warpAffine(cv2.cvtColor(bgr_f, cv2.COLOR_BGR2RGB), Mp, (W, H), flags=cv2.INTER_LANCZOS4).astype(np.float32)
        raw = raw * (1 - base[..., 3:4]) + craw * base[..., 3:4]
    lm = line_mask(Image.fromarray(raw.clip(0, 255).astype(np.uint8)))
    lm &= cv2.erode((pm[..., 0] > 0.5).astype(np.uint8), np.ones((13, 13), np.uint8)) > 0
    tm = draw_times(lm)
    rng = np.random.default_rng(3)
    wipe = filters.gaussian(rng.random((H // 8, W // 8)), 3)
    wipe = cv2.resize((wipe / wipe.max()).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)

    font = ImageFont.truetype(FONT, 64)
    words = C.get("altyazi", "").split()
    ff = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p", dst + ".noaudio.mp4"],
        stdin=subprocess.PIPE)
    active = np.zeros(total)
    prev = -1.0
    for f in range(total):
        if f < fill_end:
            p = 1 - (1 - min(1.0, f / max(draw_end, 1))) ** 1.6
            drawn = (tm <= p).astype(np.float32)
            fillp = np.clip((f - draw_end) / max(fill_end - draw_end, 1), 0, 1)
            Am = np.clip((fillp * 1.4 - wipe) / 0.35, 0, 1)[..., None]
            ink = drawn[..., None] * (1 - 0.75 * Am)
            frame = (PAPER_ONLY * (1 - Am) + still * Am) * (1 - ink) + INK * ink
            img = Image.fromarray(frame.clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img)
            if f < draw_end:
                front = (tm > prev) & (tm <= p)
                if front.any():
                    yy, xx = np.nonzero(front)
                    pencil(d, xx.mean(), yy.mean())
                    active[f] = 1
            prev = p
        else:
            t = (f - fill_end) / FPS
            o, _ = compose(f, t, smooth(t / 1.0))
            img = Image.fromarray(o.clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img)
        if words:
            caption(d, font, words, min(len(words), int(f / (total * 0.85) * len(words)) + 1))
        ff.stdin.write(np.asarray(img).tobytes())
        if f % 60 == 0:
            print("kare", f, "/", total, flush=True)
    ff.stdin.close()
    ff.wait()

    sr, pcm = pencil_audio(total, active)
    audio = pcm.astype(np.float32) / 32767 + signal_room(len(pcm), sr)
    with wave.open(dst + ".wav", "wb") as wv:
        wv.setnchannels(1)
        wv.setsampwidth(2)
        wv.setframerate(sr)
        wv.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", dst + ".noaudio.mp4", "-i", dst + ".wav", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", dst], check=True)


if __name__ == "__main__":
    pv = None
    if "--onizleme" in sys.argv:
        pv = [float(x) for x in sys.argv[sys.argv.index("--onizleme") + 1].split(",")]
    main(sys.argv[1], sys.argv[2], pv)
