"""Dinozor V2 ses kurgusu: anlatım + CC0 efektler + kodla üretilmiş özgün müzik.

Kullanım: python scripts/dino_ses.py <calisma_klasoru> <cikti.wav>
Çalışma klasöründe: timeline.json (dino_v2.py yazar), parts/P*.wav (kırpılmış anlatım), sesler klasörü yolu SESLER env.
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
SESLER = os.environ.get("SESLER", os.path.join(os.path.dirname(__file__), "..", "sesler", "freesound"))
rng = np.random.default_rng(1)


def load(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def fx(name):
    return load(os.path.join(SESLER, name))


def norm(x, peak=1.0):
    m = np.abs(x).max() + 1e-9
    return x / m * peak


def place(buf, clip, t, gain=1.0, fade_in=0.0, fade_out=0.05, length=None):
    if length is not None:
        clip = clip[:int(length * SR)]
    clip = clip.copy()
    n = len(clip)
    if fade_in > 0:
        k = min(n, int(fade_in * SR))
        clip[:k] *= np.linspace(0, 1, k)[:, None]
    if fade_out > 0:
        k = min(n, int(fade_out * SR))
        clip[n - k:] *= np.linspace(1, 0, k)[:, None]
    i = int(t * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + n)
    buf[i:j] += clip[:j - i] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1, f2], "band", fs=SR, output="sos"), x, axis=0)


def reverb(x, secs=2.8, wet=0.35):
    n = int(secs * SR)
    t = np.arange(n) / SR
    ir = rng.normal(0, 1, (n, 2)) * np.exp(-t / (secs / 5))[:, None]
    ir = lp(ir, 5000)
    ir[:int(0.012 * SR)] = 0
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    y = norm(y, np.abs(x).max() + 1e-9)
    return x * (1 - wet) + y * wet


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pad(dur, notes, amp=0.2, bright=900, detune=0.12):
    """Yumuşak yaylı/synth pad: hafif ayarsız testere dalgaları + alçak geçiren."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for m in notes:
        f = midi(m)
        for c, dt in enumerate((-detune, detune)):
            ph = rng.uniform(0, 1)
            fr = f * 2 ** (dt / 12)
            saw = 2 * ((t * fr + ph) % 1) - 1
            out[:, c] += saw * (1 + 0.15 * np.sin(2 * np.pi * 0.17 * t + m))
    out = lp(out, bright, 2) * amp / max(1, len(notes))
    return out


def env(n, a, r):
    e = np.ones(n)
    ka, kr = int(a * SR), int(r * SR)
    e[:ka] = np.linspace(0, 1, ka) ** 2
    e[n - kr:] *= np.linspace(1, 0, kr) ** 1.5
    return e[:, None]


def drum(f0=55, dur=1.6, amp=1.0):
    t = np.arange(int(dur * SR)) / SR
    f = f0 * (1 + 1.6 * np.exp(-t * 18))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    nz = lp(rng.normal(0, 1, len(t)), 900) * np.exp(-t * 20) * 0.4
    x = (body + nz) * amp
    return np.stack([x, x], 1)


def bell(f, dur=2.5, amp=0.12):
    t = np.arange(int(dur * SR)) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.01 * t) + 0.12 * np.sin(2 * np.pi * f * 3.98 * t))
    x *= np.exp(-t * 2.2) * amp
    return np.stack([x * 0.9, x], 1)


def music(tl, total):
    """Özgün müzik: gerilim → çarpışmada zirve → kısa sessizlik → kasvet → umut → yumuşak bitiş."""
    buf = np.zeros((int(total * SR) + SR, 2))
    imp = tl["impact"]
    st, du = tl["starts"], tl["durs"]
    # 1) gerilim: D minör drone, giderek yükselir
    d = imp
    x = pad(d, [26, 33, 38], amp=0.55, bright=380) * env(int(d * SR), 0.05, 0.02)
    x *= np.linspace(0.45, 1.0, len(x))[:, None]
    place(buf, x, 0)
    # kalp atışı gibi hızlanan derin davul
    t = 0.0
    k = 0
    while t < imp - 0.6:
        place(buf, drum(48, 1.2, 0.55 + 0.4 * t / imp), t)
        t += max(0.38, 1.05 - 0.09 * k)
        k += 1
    # yükselen yaylı (oktav kayan)
    n = int((imp - 0.2) * SR)
    tt = np.arange(n) / SR
    f = midi(50) * 2 ** (tt / tt[-1] * 1.0)
    rs = (2 * ((np.cumsum(f) / SR) % 1) - 1)
    rs = lp(rs, 2400) * (tt / tt[-1]) ** 3 * 0.22
    place(buf, np.stack([rs, rs * 0.92], 1), 0.2, fade_out=0.02)
    # 2) çarpışma: müzik zirve vuruşu, sonra 0.6 sn sessizlik
    place(buf, drum(36, 3.5, 1.6), imp)
    hit = pad(3.0, [26, 38, 45, 50], amp=0.9, bright=1600) * env(int(3.0 * SR), 0.005, 2.6)
    place(buf, hit, imp)
    # 3) kasvet (sahne 2-3): Dm - Bb - Gm - A
    t0 = imp + 0.9
    t_hope = st[3] + du[3] * 0.62  # "Ama yaşam sona ermedi"
    chords = [[38, 45, 50, 53], [34, 41, 46, 50], [31, 43, 46, 50], [33, 40, 45, 49]]
    t = t0
    i = 0
    while t < t_hope:
        L = min(4.0, t_hope - t + 1.2)
        c = pad(L, chords[i % 4], amp=0.42, bright=700) * env(int(L * SR), 1.0, 1.2)
        place(buf, c, t)
        if i % 2 == 0:
            place(buf, drum(44, 2.0, 0.35), t)
        t += 4.0
        i += 1
    # 4) umut (sahne 4 sonu - 6): F - C - Dm - Bb, çan arpejleri
    hope = [[41, 48, 53, 57], [36, 48, 52, 55], [38, 50, 53, 57], [34, 46, 50, 53]]
    t = t_hope
    i = 0
    end = total - 0.3
    while t < end:
        L = min(4.4, end - t + 1.5)
        c = pad(L, hope[i % 4], amp=0.40, bright=1300) * env(int(L * SR), 0.6, 1.6)
        place(buf, c, t)
        for j, m in enumerate(hope[i % 4][1:] + [hope[i % 4][1] + 12]):
            place(buf, bell(midi(m + 12), 2.2, 0.06), t + 0.5 * j + 0.25)
            place(buf, bell(midi(m + 12), 2.2, 0.04), t + 2.0 + 0.5 * j + 0.25)
        t += 4.0
        i += 1
    buf = reverb(buf, 3.2, 0.4)
    # çarpışma sonrası kısa sessizlik
    a, b = int((imp + 0.25) * SR), int((imp + 0.85) * SR)
    buf[a:b] *= np.linspace(1, 0.02, b - a)[:, None] ** 3
    # genel bitiş kısma
    fe = int((total - 2.2) * SR)
    buf[fe:] *= np.linspace(1, 0, len(buf) - fe)[:, None] ** 2
    return buf


def air_friction(dur):
    """Atmosfere girişte hava sürtünmesi: yükselen bant geçiren gürültü + çatırtı."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = rng.normal(0, 1, (n, 2))
    out = np.zeros((n, 2))
    seglen = int(0.05 * SR)
    for i in range(0, n, seglen):
        p = i / n
        lo, hi = 150 + 900 * p, 900 + 4500 * p
        out[i:i + seglen] = bp(nz[i:i + seglen + 0], lo, hi, 2)[:len(out[i:i + seglen])]
    out = lp(out, 7000)
    out *= ((t / dur) ** 2.5)[:, None]
    crack = (rng.random((n, 1)) > 0.9993) * rng.normal(0, 1, (n, 1)) * 3
    out += lp(np.repeat(crack, 2, 1), 3000) * (t / dur)[:, None] ** 2
    return norm(out, 0.9)


def build(work, dst):
    tl = json.load(open(os.path.join(work, "timeline.json")))
    total = tl["total"]
    N = int(total * SR) + SR
    voice = np.zeros((N, 2))
    for i, vs in enumerate(tl["voice"]):
        v = load(os.path.join(work, "parts", f"P{i + 1}.wav"))
        place(voice, v, vs, 1.0, fade_out=0.03)
    sfx = np.zeros((N, 2))
    imp = tl["impact"]
    st, du = tl["starts"], tl["durs"]
    # yaklaşma: alçak gürleme
    rum = fx("cinematic_drone_dark_473725.mp3")
    place(sfx, norm(lp(rum, 300), 0.35), 0, fade_in=1.5, fade_out=0.05, length=imp)
    place(sfx, norm(fx("low_boom_cinematic_263895.mp3"), 0.5), max(0, imp - 2.8))
    # atmosfere giriş: hava sürtünmesi
    place(sfx, air_friction(3.0), imp - 3.0, 0.3, fade_out=0.01)
    place(sfx, norm(fx("riser_cinematic_806664.mp3"), 0.35), imp - 4.05, fade_out=0.02)
    # çarpışma: keskin vuruş + derin patlama, ardından kısa sessizlik, sonra uzak gürleme/moloz/rüzgâr
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    crack = lp(rng.normal(0, 1, (n, 2)), 6000) * np.exp(-tt * 14)[:, None]
    sub = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 2.5) + 28) / SR) * np.exp(-tt * 2.2)
    hitc = norm(crack * 0.7 + np.stack([sub, sub], 1), 1.0)
    place(sfx, hitc, imp, 2.4, fade_out=0.25)
    place(sfx, norm(fx("low_boom_cinematic_856174.mp3"), 2.0), imp, fade_out=0.3, length=0.75)
    place(sfx, norm(fx("impact_hit_535607.mp3"), 0.8), imp, fade_out=0.3, length=0.7)
    after = imp + 1.15
    place(sfx, norm(lp(fx("thunder_486558.mp3"), 1800), 0.45), after, fade_in=0.4, fade_out=1.0)
    place(sfx, norm(fx("rubble_falling_462690.mp3"), 0.3), after + 0.3, fade_in=0.3, fade_out=1.5, length=3.0)
    place(sfx, norm(fx("wind_howl_778384.mp3"), 0.3), after, fade_in=0.8, fade_out=1.0, length=st[1] + 2 - after)
    # sahne 2: harita - hafif whoosh'lar
    place(sfx, norm(hp(fx("riser_cinematic_648732.mp3"), 200), 0.25), st[1] + 0.1)
    place(sfx, norm(fx("stone_impact_debris_569501.mp3"), 0.3), st[1] + du[1] * 0.62 + 0.4)
    # sahne 3: yangın, toz rüzgârı
    place(sfx, norm(fx("fire_crackle_676385.mp3"), 0.5), st[2], fade_in=0.3, fade_out=0.8, length=du[2] * 0.4)
    place(sfx, norm(fx("wind_howl_331892.mp3"), 0.35), st[2] + du[2] * 0.33, fade_in=1.0, fade_out=1.5,
          length=du[2] * 0.67 + du[3] * 0.5)
    # sahne 4: sürü ve kuraklık - rüzgâr devam, sonunda ilk kuş
    place(sfx, norm(fx("birds_chirping_forest_395831.mp3"), 0.35), st[3] + du[3] * 0.78)
    # sahne 5: kuş sesleri, orman
    place(sfx, norm(fx("birds_chirping_forest_628953.mp3"), 0.4), st[4] + du[4] * 0.4, fade_in=0.4, fade_out=0.8)
    place(sfx, norm(fx("birds_chirping_forest_578859.mp3"), 0.35), st[4] + du[4] * 0.62, fade_in=0.2)
    place(sfx, norm(fx("forest_ambience_morning_395829.mp3"), 0.3), st[4] + du[4] * 0.8)
    # sahne 6: final - yakın kuş
    place(sfx, norm(fx("forest_ambience_morning_395829.mp3"), 0.3), st[5] + du[5] * 0.6)
    place(sfx, norm(fx("birds_chirping_forest_395830.mp3"), 0.3), st[5] + du[5] * 0.75, fade_out=0.6)
    mus = music(tl, total)[:N]
    # anlatım altında müzik/efekt kısma (sidechain benzeri)
    ve = np.abs(voice[:, 0])
    k = int(0.03 * SR)
    ve = np.convolve(ve, np.ones(k) / k, "same")
    duck = 1 - 0.45 * np.clip(ve / (ve.max() * 0.15 + 1e-9), 0, 1)
    duck = np.convolve(duck, np.ones(int(0.2 * SR)) / int(0.2 * SR), "same")[:, None]
    mix = voice * 1.0 + mus * 0.30 * duck + sfx * 0.55 * (0.55 + 0.45 * duck)
    a_, b_ = int((imp + 0.55) * SR), int((imp + 1.15) * SR)  # çarpışma sonrası sessizlik
    g = np.ones((len(mix), 1))
    g[a_:b_] = 0.06
    g = np.convolve(g[:, 0], np.ones(int(0.06 * SR)) / int(0.06 * SR), "same")[:, None]
    mix = mix * np.maximum(g, (np.abs(voice) > 0).any(1, keepdims=True) * 1.0)
    mix = mix[:int(total * SR)]
    tmp = dst + ".raw.wav"
    import wave
    w = wave.open(tmp, "wb")
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(norm(mix, 0.9), -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()
    # ses yüksekliği: limiter -> ölç -> -14 LUFS'e kazanç -> tepe limiteri (-1.5 dBTP)
    lim = "alimiter=limit=0.6:attack=4:release=90:level=false"
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", lim + ",ebur128", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    I = float(r[r.rindex("I:"):].split()[1])
    flt = f"{lim},volume={-13.4 - I:.2f}dB,alimiter=limit=0.84:attack=2:release=60:level=false"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", flt, "-ar", str(SR), dst], check=True)
    os.remove(tmp)


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
