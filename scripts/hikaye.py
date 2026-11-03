"""Çok sahneli hikâye videosu: anlatım kaydını sahnelere böler, her sahneyi çizer/canlandırır, geçişlerle birleştirir,
gerçek kelime zamanlı altyazı + anlatım + efekt sesini ekler.

Kullanım: python scripts/hikaye.py hikaye/<ad>/hikaye.json cikti.mp4 [--sadece 2,3] [--onizleme]

hikaye.json:
{
  "ses": "hikaye/kedi/temiz.wav",                 # ses_kurgu.py çıktısı
  "kelimeler": "hikaye/kedi/temiz.kelimeler.json",
  "varsayilan": {"cizim_sn": 2.2, "boyama_sn": 0.9, "ayak_y": 1795, "boy": 1380},   # her sahneye uygulanır
  "sahneler": [
    {"basla": "Bir gün küçük bir kedi",          # sahnenin başladığı söz (kelimelerde aranır); ilk sahne için boş olabilir
     "arkaplan": "...png",                         # zorunlu
     "karakter": "...png", "poz": "...json", "sakal": false, "eller": {...}, "gulumseme": "...",   # isteğe bağlı (kukla)
     "hareket": "el_salla:L@\\"merhaba\\"/2.5, gulumse@3.0"}   # @"söz" = o söz söylendiği an; @sayı = sahne canlanınca geçen sn
  ],
  "gecis_sn": 0.35, "efekt_ses": 0.22, "altyazi_kelime": 4
}
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, "scripts")
import kukla_sahne  # noqa: E402
from ses_kurgu import norm  # noqa: E402

W, H, FPS = 1080, 1920, 30
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def find_phrase(words, phrase, start_idx=0):
    """Sözün (normalize) kelime listesinde ilk geçtiği yerin kelime indeksi."""
    target = [norm(x) for x in phrase.split() if norm(x)]
    toks = [norm(w["w"]) for w in words]
    for i in range(start_idx, len(toks) - len(target) + 1):
        if toks[i:i + len(target)] == target:
            return i
    raise ValueError(f"söz bulunamadı: «{phrase}»")


def anchor_motions(script, words, scene_t0, alive_t0):
    """@"söz" bağlarını canlanma başına göre saniyeye çevirir."""
    def rep(m):
        phrase = m.group(1)
        i = find_phrase(words, phrase)
        t = words[i]["start"] - scene_t0 - alive_t0
        return "@%.2f" % max(0.15, t)
    return re.sub(r'@"([^"]+)"', rep, script)


def caption_groups(words, n):
    """Altyazı satır grupları: noktalama veya n kelimede bir bölünür."""
    groups, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        if len(cur) >= n or re.search(r"[.!?…,;:]$", w["w"]):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def draw_caption(img, font, words, groups, t):
    d = ImageDraw.Draw(img)
    cur = -1
    for i, w in enumerate(words):
        if w["start"] <= t:
            cur = i
    if cur < 0:
        return
    g = next(g for g in groups if cur in g)
    if t > words[g[-1]]["end"] + 0.6:  # grup bittikten sonra kısa süre kalır
        return
    shown = [i for i in g if i <= cur]
    sp = d.textlength(" ", font=font)
    ws = [d.textlength(words[i]["w"], font=font) for i in shown]
    lines, line, lw = [], [], 0
    for i, wd in zip(shown, ws):
        if line and lw + sp + wd > W - 160:
            lines.append((line, lw))
            line, lw = [], 0
        lw = lw + (sp if line else 0) + wd
        line.append((i, wd))
    lines.append((line, lw))
    y = 1500
    for line, lw in lines:
        x = (W - lw) / 2
        for i, wd in line:
            col = (255, 212, 0) if i == cur else (255, 255, 255)
            d.text((x, y), words[i]["w"], font=font, fill=col, stroke_width=5, stroke_fill=(26, 20, 16))
            x += wd + sp
        y += 86


def read_wav(path):
    r = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "44100", "-f", "f32le", "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(r, np.float32).copy()


def main(cfg_path, dst, only=None, preview=False):
    C = json.load(open(cfg_path, encoding="utf-8"))
    WJ = json.load(open(C["kelimeler"], encoding="utf-8"))
    words, total_audio = WJ["kelimeler"], WJ["sure"]
    xf = C.get("gecis_sn", 0.35)
    base = C.get("varsayilan", {})
    scenes = C["sahneler"]

    # sahne başlangıç zamanları (söz eşleştirme)
    starts, last = [], 0
    for k, sc in enumerate(scenes):
        if k == 0 or not sc.get("basla"):
            idx = 0 if k == 0 else last
        else:
            idx = find_phrase(words, sc["basla"], last)
        last = idx
        starts.append(0.0 if k == 0 else max(0.0, words[idx]["start"] - 0.12))
    ends = starts[1:] + [total_audio + 0.6]
    print("sahne süreleri:", [round(e - s, 2) for s, e in zip(starts, ends)], flush=True)

    tmp = tempfile.mkdtemp(prefix="hikaye_")
    outs = []
    for k, sc in enumerate(scenes):
        dur = ends[k] - starts[k] + (xf if k < len(scenes) - 1 else 0)
        cfg = dict(base)
        cfg.update({kk: v for kk, v in sc.items() if kk not in ("basla",)})
        cfg["sure"] = round(dur, 3)
        alive_t0 = cfg.get("cizim_sn", 2.6) + cfg.get("boyama_sn", 1.0)
        if cfg.get("karakter"):
            cfg["hareket"] = anchor_motions(cfg.get("hareket", ""), words, starts[k], alive_t0) or "gulumse@999/0.1"
        cfg.pop("altyazi", None)
        path = os.path.join(tmp, f"sahne{k + 1:02d}.mp4")
        outs.append(path)
        if only and (k + 1) not in only:
            continue
        print(f"== sahne {k + 1}/{len(scenes)}  {starts[k]:.2f}-{ends[k]:.2f} sn  hareket: {cfg.get('hareket', '-')}", flush=True)
        if preview:
            kukla_sahne.main(cfg, path.replace(".mp4", ".jpg"), [0.3, max(0.4, dur - alive_t0 - 0.5)])
        else:
            kukla_sahne.main(cfg, path)
    if preview or only:
        print("sahneler:", tmp)
        return tmp

    # 1) sahneleri yumuşak geçişle birleştir (görüntü)
    inputs, filt, prev, acc = [], [], "[0:v]", 0.0
    for k, p in enumerate(outs):
        inputs += ["-i", p]
    for k in range(1, len(outs)):
        acc += ends[k - 1] - starts[k - 1]
        lab = f"[v{k}]"
        filt.append(f"{prev}[{k}:v]xfade=transition=fade:duration={xf}:offset={acc - 0.0:.3f}{lab}")
        prev = lab
    joined = os.path.join(tmp, "birlesik.mp4")
    cmd = ["ffmpeg", "-v", "error", "-y"] + inputs
    if filt:
        cmd += ["-filter_complex", ";".join(filt), "-map", prev]
    else:
        cmd += ["-map", "0:v"]
    cmd += ["-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", joined]
    subprocess.run(cmd, check=True)

    # 2) efekt sesleri (kalem) sahne başlangıçlarına yerleştirilir
    n_total = int((total_audio + 0.6) * 44100)
    fx = np.zeros(n_total + 44100, np.float32)
    for k, p in enumerate(outs):
        a = read_wav(p)
        s0 = int(starts[k] * 44100)
        a = a[:max(0, min(len(a), len(fx) - s0))]
        fx[s0:s0 + len(a)] += a
    narr = read_wav(C["ses"])
    mix = fx[:n_total] * C.get("efekt_ses", 0.22)
    mix[:len(narr)] += narr[:n_total]
    mix = mix / max(1.0, np.abs(mix).max() / 0.95)
    wav = os.path.join(tmp, "karisim.wav")
    with wave.open(wav, "wb") as wv:
        wv.setnchannels(1)
        wv.setsampwidth(2)
        wv.setframerate(44100)
        wv.writeframes((mix * 32767).astype(np.int16).tobytes())

    # 3) altyazı (gerçek kelime zamanları) + ses
    font = ImageFont.truetype(FONT, 64)
    groups = caption_groups(words, C.get("altyazi_kelime", 4))
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", joined, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
                            "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", dst], stdin=subprocess.PIPE)
    f = 0
    fb = W * H * 3
    while True:
        buf = dec.stdout.read(fb)
        if len(buf) < fb:
            break
        img = Image.frombytes("RGB", (W, H), buf)
        draw_caption(img, font, words, groups, f / FPS)
        enc.stdin.write(img.tobytes())
        f += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print("bitti:", dst, f, "kare")


if __name__ == "__main__":
    only = None
    if "--sadece" in sys.argv:
        only = [int(x) for x in sys.argv[sys.argv.index("--sadece") + 1].split(",")]
    main(sys.argv[1], sys.argv[2], only, preview="--onizleme" in sys.argv)
