"""Bir Dakikada Bilim — efekt ve müzik kütüphanesi (tamamen sentez, telifsiz).

Her fonksiyon 48 kHz mono numpy dizisi döndürür. put(buf, saniye, ses, kazanç) ile yerleştirilir.
"""
import numpy as np

SR = 48000
_rng = np.random.default_rng(3)


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))


def put(buf, t0, sig, g=1.0):
    i = int(max(0, t0) * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i] * g


def onepole(x, cut):
    """Sabit veya zamanla değişen kesimli tek kutuplu alçak geçiren."""
    y = np.empty_like(x)
    s = 0.0
    cuts = np.broadcast_to(np.asarray(cut, float), x.shape)
    a = np.exp(-2 * np.pi * cuts / SR)
    for k in range(len(x)):
        s = (1 - a[k]) * x[k] + a[k] * s
        y[k] = s
    return y


def hp(x, cut):
    return x - onepole(x, cut)


def fadeio(x, a=0.01, b=0.05):
    n = len(x)
    t = np.arange(n) / SR
    return x * np.minimum(1, np.minimum(t / max(a, 1e-4), (n / SR - t) / max(b, 1e-4)))


def sine_sweep(f0, f1, d, curve=1.0):
    n = int(d * SR)
    k = (np.arange(n) / n) ** curve
    f = f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ---------- efektler ----------
def whoosh(d=0.55, hi=4500):
    n = int(d * SR)
    t = np.arange(n) / n
    y = onepole(_rng.normal(0, 1, n), 250 + hi * np.sin(np.pi * t) ** 2)
    return y * np.sin(np.pi * t) ** 1.4 * 1.2


def riser(d=1.5):
    n = int(d * SR)
    t = np.arange(n) / n
    y = onepole(_rng.normal(0, 1, n), 200 + 6000 * t ** 2) * t ** 2
    y += 0.25 * sine_sweep(150, 900, d, 2) * t ** 2
    return fadeio(y, 0.05, 0.03)


def boom(f=55, d=1.2):
    n = int(d * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(f * (1 + 2.5 * np.exp(-t * 18))) / SR) * np.exp(-t * 3.2)
    click = onepole(_rng.normal(0, 1, n), 1800) * np.exp(-t * 45)
    return body * 1.1 + click * 0.6


def thud():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(90 * (1 + 1.5 * np.exp(-t * 40))) / SR) * np.exp(-t * 14) + onepole(_rng.normal(0, 1, n), 1200) * np.exp(-t * 60) * 0.8


def pop(f=520):
    n = int(0.13 * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 1.6 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.002, 0.035)


def blip(f=880, d=0.12):
    n = int(d * SR)
    t = np.arange(n) / SR
    return (np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t) * 0.6) * env(n, 0.002, d / 3)


def ding(f=1318.5, d=1.6, decay=0.45):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * m * t) * w for m, w in [(1, 1), (2.76, 0.35), (5.4, 0.12)])
    return x * env(n, 0.002, decay) * 0.6


def chime_up(base=784, step=1.26, n_notes=4, gap=0.07):
    out = np.zeros(int((n_notes * gap + 1.0) * SR))
    f = base
    for k in range(n_notes):
        s = ding(f, 0.9, 0.3) * 0.5
        i = int(k * gap * SR)
        out[i:i + len(s)] += s[: len(out) - i]
        f *= step
    return out


def sparkle(d=0.9):
    out = np.zeros(int((d + 0.6) * SR))
    for k, f in enumerate([1568, 2093, 2637, 3136, 4186]):
        s = ding(f, 0.6, 0.18) * 0.35
        i = int(k * d / 6 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out


def shutter():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    c1 = hp(_rng.normal(0, 1, n), 1500) * np.exp(-t * 90)
    c2 = np.zeros(n)
    k = int(0.09 * SR)
    c2[k:] = hp(_rng.normal(0, 1, n - k), 1000) * np.exp(-t[: n - k] * 70)
    return (c1 + c2 * 0.9) * 0.9


def stamp():
    return thud() * 1.2 + np.pad(hp(_rng.normal(0, 1, int(0.08 * SR)), 2000) * env(int(0.08 * SR), 0.001, 0.02), (0, int(0.27 * SR)))


def zap(d=0.35):
    n = int(d * SR)
    t = np.arange(n) / SR
    saw = 2 * ((t * 140) % 1) - 1
    crack = (_rng.random(n) < 0.02) * _rng.normal(0, 1, n)
    y = (saw * 0.5 + hp(_rng.normal(0, 1, n), 3000) * 0.6 + crack) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 37 * t)))
    return fadeio(y, 0.003, 0.08) * 0.7


def sonar(f=1150):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 4)
    echo = np.zeros(n)
    k = int(0.32 * SR)
    echo[k:] = x[: n - k] * 0.4
    return x + echo


def scan(d=1.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 600 + 900 * ((t * 1.3) % 1)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + np.sin(2 * np.pi * 60 * t) * 0.2
    return fadeio(y, 0.05, 0.1)


def chalk(d=1.5):
    n = int(d * SR)
    t = np.arange(n) / SR
    strokes = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 2.2 * t))
    y = hp(_rng.normal(0, 1, n), 2500) * strokes * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * t))
    return fadeio(onepole(y, 7000), 0.02, 0.1) * 0.6


def ticks(d=0.8, rate=22):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        f = 1800 + _rng.integers(0, 6) * 300
        put(out, k / rate, blip(f, 0.03), 0.6)
    return out


def click():
    n = int(0.06 * SR)
    return hp(_rng.normal(0, 1, n), 2500) * env(n, 0.0005, 0.008) + pop(1400)[:n] * 0.4


def lock_close():
    out = np.zeros(int(0.4 * SR))
    put(out, 0, click(), 1)
    put(out, 0.07, click(), 0.8)
    put(out, 0.07, thud(), 0.5)
    return out


def unlock():
    out = np.zeros(int(1.4 * SR))
    put(out, 0, click(), 1)
    put(out, 0.05, chime_up(880, 1.25, 4, 0.06), 0.9)
    return out


def powerup(d=0.9):
    n = int(d * SR)
    t = np.arange(n) / SR
    y = sine_sweep(80, 420, d, 0.6) + 0.3 * sine_sweep(160, 840, d, 0.6)
    return fadeio(y * (0.4 + 0.6 * t / d), 0.02, 0.12) * 0.5


def meter(d=1.0):
    n = int(d * SR)
    y = sine_sweep(300, 1200, d, 1.0) * 0.4
    pulses = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * np.arange(n) / SR))
    return fadeio(y * pulses, 0.01, 0.05)


def buzz():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 116 * t)) * 0.5
    return onepole(x, 1800) * env(n, 0.005, 0.2) * 0.6


def tap():
    out = thud() * 0.5
    put(out, 0, pop(300), 0.4)
    return out


def shimmer(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * (f + 4 * np.sin(2 * np.pi * 6 * t)) * t) for f in (880, 1320, 1760)) / 3
    return fadeio(x, 0.4, 0.5) * 0.35


def stinger():
    out = np.zeros(int(2.4 * SR))
    for f in (261.63, 329.63, 392.0, 523.25):
        put(out, 0, ding(f, 2.3, 0.9), 0.5)
    put(out, 0, boom(65, 1.5), 0.5)
    return out


# ---------- müzik ----------
def pluck(f, d=1.0, damp=0.996):
    n = int(d * SR)
    p = max(2, int(SR / f))
    buf = _rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for k in range(n):
        out[k] = buf[k % p]
        buf[k % p] = 0.5 * (buf[k % p] + buf[(k + 1) % p]) * damp
    return out * env(n, 0.002, 0.5)


NOTES = {n: 440 * 2 ** ((i - 9) / 12 + o - 4) for o in range(2, 7) for i, n0 in enumerate("C C# D D# E F F# G G# A A# B".split()) for n in [f"{n0}{o}"]}


def music(dur, bpm=100, full_from=4.0, outro_at=None):
    """Hafif, merak uyandıran pluck + ritim. dur saniye."""
    N = int(dur * SR)
    M = np.zeros(N)
    beat = 60 / bpm
    prog = [("A2", ["A4", "C5", "E5"]), ("F2", ["A4", "C5", "F5"]), ("C3", ["G4", "C5", "E5"]), ("G2", ["G4", "B4", "D5"])]
    mel = ["E5", "D5", "C5", "A4", "C5", "E5", "G5", "E5"]
    cache = {}

    def pl(nm, d):
        key = (nm, d)
        if key not in cache:
            cache[key] = pluck(NOTES[nm], d)
        return cache[key]

    kick = boom(52, 0.45) * 0.9
    n_h = int(0.05 * SR)
    hat = hp(_rng.normal(0, 1, n_h), 6000) * env(n_h, 0.001, 0.012)
    t = 0.0
    bar = 0
    end = outro_at if outro_at else dur - 2.0
    while t < end:
        root, ch = prog[bar % 4]
        full = t >= full_from
        put(M, t, pl(root, 2.0), 0.55)
        for k in range(8):
            tt = t + k * beat / 2
            if tt >= end:
                break
            nm = ch[k % 3] if k % 2 == 0 else mel[(bar * 8 + k) % 8]
            put(M, tt, pl(nm, 0.8), 0.22 if k % 2 == 0 else 0.15)
            if full:
                put(M, tt, hat, 0.12 if k % 2 else 0.07)
        if full:
            for k in (0, 2):
                put(M, t + k * beat, kick, 0.5)
        n = int(4 * beat * SR)
        tp = np.arange(n) / SR
        pad = sum(np.sin(2 * np.pi * NOTES[x] / 2 * tp) for x in ch) / 3
        put(M, t, fadeio(pad, 0.6, 0.6), 0.10)
        t += 4 * beat
        bar += 1
    for nm, g in (("A2", 0.5), ("A4", 0.3), ("C5", 0.25), ("E5", 0.2)):
        put(M, end, pl(nm, 2.2), g)
    tt = np.arange(N) / SR
    M *= np.minimum(1, tt / 0.8)
    return M


def norm(x, peak=0.8):
    return x / (np.max(np.abs(x)) + 1e-9) * peak
