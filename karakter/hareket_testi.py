import math, subprocess, sys, wave
import numpy as np
from playwright.sync_api import sync_playwright
from merakli import figure, INK, ACC, RED, CYAN

sys.path.insert(0, __import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)), "..", "scripts"))
import bilim_ses as B

W, H, FPS, DUR = 1080, 1920, 30, 12.4
GROUND = 1500
S = 2.0
TAU = 2 * math.pi

def cl(x): return max(0.0, min(1.0, x))
def ez(x): x = cl(x); return x * x * (3 - 2 * x)
def lerp(a, b, k):
    if isinstance(a, tuple): return tuple(lerp(x, y, k) for x, y in zip(a, b))
    if isinstance(a, (int, float)) and isinstance(b, (int, float)): return a + (b - a) * k
    return b if k > 0.5 else a

BASE = dict(lean=0, armL=(-24, 0), armR=(24, 0), legL=(-12, 0), legR=(12, 0), mood="neutral", look=(0, 0), talk=0.0,
            curl=0.0, flap=0.0, gb=0.0, tilt=0.0, headdy=0.0, sx=1.0, sy=1.0)

def P(**k):
    d = dict(BASE); d.update(k); return d

# ---------- segmentler: (başlangıç, bitiş, ad, fonksiyon(t yerel) -> (poz, x, yükseklik)) ----------
def walk(t, x0=-180, x1=540, d=2.4, rate=1.7, run=False):
    p_ = t * TAU * rate
    s = math.sin(p_)
    amp = 34 if run else 26
    k = lambda ph: -(55 if run else 38) * max(0.0, -math.cos(ph))
    pose = P(lean=16 if run else 5, mood="happy" if not run else "excited",
             legL=(amp * s, k(p_)), legR=(-amp * s, k(p_ + math.pi)),
             armL=(-amp * 0.9 * s, 70 if run else 22), armR=(amp * 0.9 * s, 70 if run else 22),
             curl=-0.6 + 0.3 * math.sin(p_ * 2 - 0.8), flap=-0.8 + 0.25 * math.sin(p_ * 2), tilt=2 * math.sin(p_))
    x = lerp(x0, x1, t / d) if not run else x0 + (x1 - x0) * (t / d) ** 1.4
    return pose, x, abs(math.sin(p_)) * (14 if run else 9)

def wave_(t):
    w = math.sin(t * 13)
    return P(mood="happy", armR=(112, 40 + 32 * w), armL=(-20, 10), talk=max(0, math.sin(t * 9)) * 0.8 if t < 0.9 else 0, tilt=-4 + 2 * w, curl=0.2 * w), 540, 0

def jump(t):
    if t < 0.32:  # hazırlık
        k = ez(t / 0.32)
        return P(mood="neutral", legL=(lerp(-12, -32, k), lerp(0, 62, k)), legR=(lerp(12, 32, k), lerp(0, -62, k)),
                 armL=(lerp(-24, 30, k), 20), armR=(lerp(24, -30, k), -20), sy=lerp(1, 0.9, k), curl=0.3 * k), 540, -lerp(0, 22, k) * 0
    if t < 1.02:  # havada
        u = (t - 0.32) / 0.7
        h = 4 * u * (1 - u) * 330
        return P(mood="excited", legL=(-20, 45 * (1 - u)), legR=(20, -45 * (1 - u)), armL=(-112, -45), armR=(112, 45),
                 sy=lerp(1.12, 1.0, u), sx=lerp(0.92, 1, u), curl=-0.8 + u, flap=0.9 - u, gb=-6 * (1 - u)), 540, h
    k = ez((t - 1.02) / 0.35)  # iniş
    return P(mood="happy", legL=(lerp(-32, -12, k), lerp(55, 0, k)), legR=(lerp(32, 12, k), lerp(-55, 0, k)),
             sy=lerp(0.86, 1, k), sx=lerp(1.08, 1, k), gb=4 * (1 - k), curl=0.6 * (1 - k)), 540, 0

def think(t):
    return P(mood="think", look=(0.6, -0.8), armR=(22, -150), armL=(-24, 62), tilt=8 + 4 * math.sin(t * 2.4),
             curl=0.3 * math.sin(t * 5), headdy=0), 540, 0

def aha(t):
    hop = 4 * cl(t / 0.45) * (1 - cl(t / 0.45)) * 80
    return P(mood="aha", armR=(100, 65), armL=(-30, -10), legR=(16, 0), gb=-5 * math.exp(-t * 4) * math.cos(t * 30),
             curl=-0.5 * math.exp(-t * 3) * math.cos(t * 18)), 540, hop

def explain(t):
    g = math.sin(t * 5)
    x = lerp(540, 330, ez(t / 0.4))
    return P(mood="happy" if g > 0 else "neutral", armR=(95 + 10 * g, -25 + 20 * g), armL=(-35 + 15 * g, 40),
             talk=max(0, math.sin(t * 15)) * 0.9, tilt=3 * g, look=(0.8, 0)), x, 0

def surprised(t):
    back = 4 * cl(t / 0.4) * (1 - cl(t / 0.4)) * 120
    return P(mood="surprised", armL=(-112, -40), armR=(112, 40), legL=(-18, 0), legR=(18, 0), lean=-8 * math.exp(-t * 3),
             gb=-10 * math.exp(-t * 4) * math.cos(t * 28), curl=0.9 * math.exp(-t * 3) * math.cos(t * 16)), 330 - 60 * ez(t / 0.4), back

SEG = [
    (0.0, 2.4, "YÜRÜME", lambda t: walk(t)),
    (2.4, 3.8, "EL SALLAMA", wave_),
    (3.8, 5.3, "ZIPLAMA", jump),
    (5.3, 7.0, "DÜŞÜNME", think),
    (7.0, 8.1, "AHA!", aha),
    (8.1, 9.8, "ANLATMA", explain),
    (9.8, 10.8, "ŞAŞIRMA", surprised),
    (10.8, DUR, "KOŞMA", lambda t: walk(t, 270, 1450, DUR - 10.8, 2.8, True)),
]

def state(t):
    for i, (a, b, lab, f) in enumerate(SEG):
        if a <= t < b or i == len(SEG) - 1:
            pose, x, h = f(t - a)
            if i > 0 and t - a < 0.22:  # önceki hareketten yumuşak geçiş
                pa, pb, _, pf = SEG[i - 1]
                pp, px, ph = pf(pb - pa - 1e-3)
                k = ez((t - a) / 0.22)
                pose = {kk: lerp(pp[kk], pose[kk], k) for kk in pose}
                x, h = lerp(px, x, k), lerp(ph, h, k)
            return pose, x, h, lab, t - a, i
    return None

def frame_svg(t):
    pose, x, h, lab, lt, i = state(t)
    fy = GROUND - 306 * S - h
    out = []
    # arka plan + zemin
    out.append(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    for k in range(9):
        xx = ((k * 160 - (t * 260 if i == 7 else 0)) % 1300) - 100
        out.append(f'<path d="M {xx} {GROUND+40} q 24 -16 48 0" stroke="{INK}" stroke-width="5" fill="none" opacity="0.25"/>')
    out.append(f'<line x1="0" y1="{GROUND}" x2="{W}" y2="{GROUND}" stroke="{INK}" stroke-width="8"/>')
    sh = max(0.35, 1 - h / 400)
    out.append(f'<ellipse cx="{x}" cy="{GROUND+6}" rx="{110*sh}" ry="{16*sh}" fill="{INK}" opacity="{0.22*sh}"/>')
    # sahneye özel nesneler
    if lab == "EL SALLAMA" and lt < 1.3:
        k = ez(lt / 0.25)
        out.append(f'<g transform="translate({x+300} {fy+20}) scale({k})"><path d="M -40 70 L -90 130 L 10 70 Z" fill="#fff" stroke="{INK}" stroke-width="6"/>'
                   f'<rect x="-170" y="-60" width="340" height="140" rx="44" fill="#fff" stroke="{INK}" stroke-width="7"/>'
                   f'<text x="0" y="30" text-anchor="middle" font-family="Inter" font-weight="900" font-size="68" fill="{INK}">Merhaba!</text></g>')
    if lab == "DÜŞÜNME":
        for q in range(3):
            u = ((lt * 0.7 + q * 0.33) % 1)
            out.append(f'<text x="{x + 170 + q*40 + math.sin(u*6)*15}" y="{fy - 40 - u*260}" font-family="Inter" font-weight="900" font-size="{80+q*14}" fill="{[RED, CYAN, ACC][q]}" stroke="{INK}" stroke-width="3" opacity="{1-u}">?</text>')
    if lab == "AHA!":
        k = 1 + 0.25 * math.exp(-lt * 5) * math.sin(lt * 25)
        bx, by = x + 190, fy - 120 - h
        out.append(f'<g transform="translate({bx} {by}) scale({min(1, lt/0.15)*k*1.6})"><circle r="90" fill="#fff2a8" opacity="0.65"/>'
                   + "".join(f'<line x1="{math.cos(a)*62:.1f}" y1="{math.sin(a)*62:.1f}" x2="{math.cos(a)*84:.1f}" y2="{math.sin(a)*84:.1f}" stroke="{ACC}" stroke-width="7" stroke-linecap="round"/>' for a in [j * math.pi / 4 for j in range(8)])
                   + f'<path d="M 0 30 C -30 30 -36 0 -24 -14 C -16 -24 -16 -32 -16 -40 L 16 -40 C 16 -32 16 -24 24 -14 C 36 0 30 30 0 30 Z" fill="{ACC}" stroke="{INK}" stroke-width="5"/>'
                   f'<rect x="-12" y="30" width="24" height="12" rx="3" fill="#bbb" stroke="{INK}" stroke-width="4"/></g>')
    if lab == "ANLATMA":
        k = ez((lt - 0.2) / 0.4)
        out.append(f'<g transform="translate(790 {GROUND-560}) scale({k})"><rect x="-180" y="-150" width="360" height="300" rx="20" fill="#ffffff" stroke="{INK}" stroke-width="8"/>'
                   f'<line x1="-60" y1="150" x2="-80" y2="280" stroke="{INK}" stroke-width="8"/><line x1="60" y1="150" x2="80" y2="280" stroke="{INK}" stroke-width="8"/>'
                   + "".join(f'<ellipse rx="110" ry="38" fill="none" stroke="{CYAN}" stroke-width="6" transform="rotate({r})"/>' for r in (0, 60, 120))
                   + f'<circle r="22" fill="{RED}" stroke="{INK}" stroke-width="5"/>'
                   + "".join(f'<circle cx="{math.cos(lt*4+j*2.1)*110*math.cos(math.radians(j*60)) - math.sin(lt*4+j*2.1)*38*math.sin(math.radians(j*60)):.1f}" cy="{math.cos(lt*4+j*2.1)*110*math.sin(math.radians(j*60)) + math.sin(lt*4+j*2.1)*38*math.cos(math.radians(j*60)):.1f}" r="11" fill="{ACC}" stroke="{INK}" stroke-width="3"/>' for j in range(3))
                   + '</g>')
    if lab == "ŞAŞIRMA":
        k = min(1, lt / 0.12)
        out.append(f'<g transform="translate(720 {GROUND-140}) scale({k*(1+0.2*math.exp(-lt*6)*math.sin(lt*30))})"><rect x="-90" y="-90" width="180" height="180" rx="20" fill="{RED}" stroke="{INK}" stroke-width="8"/>'
                   f'<text x="0" y="45" text-anchor="middle" font-family="Inter" font-weight="900" font-size="130" fill="#fff">!</text></g>')
        for j in range(10):
            a = j * TAU / 10; r = 100 + lt * 400
            if lt < 0.5: out.append(f'<line x1="{720+math.cos(a)*r*0.7}" y1="{GROUND-140+math.sin(a)*r*0.7}" x2="{720+math.cos(a)*r}" y2="{GROUND-140+math.sin(a)*r}" stroke="{ACC}" stroke-width="8" stroke-linecap="round" opacity="{1-lt*2}"/>')
    if lab == "KOŞMA":
        for j in range(5):
            yy = fy + 150 + j * 70
            out.append(f'<line x1="{x-260-j*20}" y1="{yy}" x2="{x-130-j*10}" y2="{yy}" stroke="{INK}" stroke-width="6" stroke-linecap="round" opacity="0.35"/>')
        for j in range(4):
            u = (lt * 2.5 + j * 0.25) % 1
            out.append(f'<circle cx="{x - 80 - u*180}" cy="{GROUND - 10 - u*40}" r="{14 + u*20}" fill="#cbb994" opacity="{0.6*(1-u)}"/>')
    # karakter
    out.append(f'<g transform="translate({x} {fy}) scale({S})">{figure(pose)}</g>')
    # etiket + ilerleme
    k = ez(lt / 0.25)
    out.append(f'<g transform="translate(540 300) scale({0.8+0.2*k})" opacity="{k}"><rect x="-230" y="-55" width="460" height="110" rx="55" fill="{ACC}" stroke="{INK}" stroke-width="7"/>'
               f'<text x="0" y="22" text-anchor="middle" font-family="Inter" font-weight="900" font-size="60" fill="{INK}">{lab}</text></g>')
    out.append(f'<text x="540" y="170" text-anchor="middle" font-family="Inter" font-weight="800" font-size="34" fill="{INK}" opacity="0.6" letter-spacing="4">MERAKLI · HAREKET TESTİ</text>')
    defs = (f'<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ecd2"/><stop offset="1" stop-color="#e8d6ae"/></linearGradient></defs>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">{defs}{"".join(out)}</svg>'

def sounds(path):
    N = int(DUR * B.SR); S_ = np.zeros(N); p, E = B.put, B.efekt
    # adımlar: bacak yön değiştirdikçe
    for (a, b, rate, g) in ((0.0, 2.4, 1.7, 0.5), (10.8, DUR, 2.8, 0.45)):
        tt = a + 0.05
        while tt < b:
            p(S_, tt, E("adim", perde=2), g); tt += 1 / (2 * rate)
    p(S_, 2.45, B.katman(E("pop"), B.ding(1046, 0.8, 0.3)), 0.5)
    p(S_, 3.8, B.riser(0.35), 0.35); p(S_, 4.12, B.whoosh(0.5, 4000), 0.5); p(S_, 4.82, B.katman(E("darbe_hafif"), B.thud()), 0.7)
    for j in range(6): p(S_, 5.4 + j * 0.25, E("tik", perde=2), 0.25)
    p(S_, 7.0, B.katman(E("anahtar"), B.ding(1568, 1.3, 0.45), B.sparkle(0.6)), 0.6)
    p(S_, 8.1, B.whoosh(0.4, 3000), 0.4)
    for j in range(5): p(S_, 8.4 + j * 0.28, B.pop(500 + j * 90), 0.35)
    p(S_, 9.8, B.katman(E("bong"), E("darbe")), 0.6)
    p(S_, 10.8, B.whoosh(1.2, 5000), 0.5)
    M = B.music(DUR, full_from=2.4, outro_at=DUR - 1.4)
    y = B.norm(S_, 0.8) * 1.0 + B.norm(M, 0.8) * 0.35
    y = B.norm(y, 0.85)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(B.SR); w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())

if __name__ == "__main__":
    out = sys.argv[1]
    sounds("/tmp/merakli_ses.wav")
    n = int(DUR * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-", "-i", "/tmp/merakli_ses.wav",
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H})
        pg.set_content('<html><body style="margin:0"><div id="r"></div></body></html>')
        for i in range(n):
            pg.evaluate("s => document.getElementById('r').innerHTML = s", frame_svg(i / FPS))
            ff.stdin.write(pg.screenshot(type="png"))
        b.close()
    ff.stdin.close(); ff.wait()
    print("ok", n)
