"""'Meraklı Gözlüklü' (B) karakteri: eklemli iskelet + ifadeler. SVG üretir."""
import math

INK = "#2b2420"; ACC = "#ffcf3a"; RED = "#d64933"; CREAM = "#f6eedd"; BLUSH = "#ff9a8a"; CYAN = "#5ce1ff"

def rad(d): return d * math.pi / 180

def limb(x, y, a1, a2, l1, l2):
    """a1: üst kemik açısı (aşağıdan, +sağ), a2: alt kemiğin ek açısı"""
    kx, ky = x + l1 * math.sin(rad(a1)), y + l1 * math.cos(rad(a1))
    ex, ey = kx + l2 * math.sin(rad(a1 + a2)), ky + l2 * math.cos(rad(a1 + a2))
    return (kx, ky), (ex, ey)

# ---------- yüz ----------
def brows(m):
    # (sol iç y, sol dış y, sağ iç y, sağ dış y) — negatif = yukarı
    B = {
        "neutral": (-32, -32, -32, -32), "happy": (-34, -33, -34, -33), "laugh": (-36, -34, -36, -34),
        "surprised": (-44, -42, -44, -42), "think": (-30, -30, -40, -44), "sad": (-38, -28, -38, -28),
        "angry": (-24, -36, -24, -36), "scared": (-42, -36, -42, -36), "excited": (-40, -38, -40, -38),
        "shy": (-36, -30, -36, -30), "sleepy": (-28, -28, -28, -28), "aha": (-44, -40, -44, -40), "wink": (-34, -32, -30, -36),
    }[m]
    li, lo, ri, ro = B
    return (f'<path d="M -8 {li} L -30 {lo}" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
            f'<path d="M 8 {ri} L 30 {ro}" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>')

def eye(cx, m, look, side):
    lx, ly = look
    px, py = cx + lx * 6, -4 + ly * 6
    if m in ("happy", "laugh", "excited", "aha") or (m == "wink" and side > 0):
        if m == "excited":
            pts = " ".join(f"{cx + (9 if k % 2 == 0 else 4) * math.sin(k * math.pi / 5):.1f},{-4 - (9 if k % 2 == 0 else 4) * math.cos(k * math.pi / 5):.1f}" for k in range(10))
            return f'<polygon points="{pts}" fill="{ACC}" stroke="{INK}" stroke-width="2"/>'
        return f'<path d="M {cx-8} {-2} q 8 -10 16 0" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    if m == "sleepy":
        return f'<path d="M {cx-8} -3 q 8 6 16 0" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    if m == "angry":
        return f'<ellipse cx="{px}" cy="{py+2}" rx="4.5" ry="4" fill="{INK}"/>'
    if m in ("surprised", "scared"):
        return f'<circle cx="{px}" cy="{py}" r="{3.2 if m=="scared" else 5}" fill="{INK}"/>'
    if m == "sad":
        return f'<ellipse cx="{px}" cy="{py+2}" rx="4.5" ry="5.5" fill="{INK}"/><path d="M {cx+6} 6 q 2 8 0 12" stroke="{CYAN}" stroke-width="3" fill="none"/>'
    return f'<ellipse cx="{px}" cy="{py}" rx="4.5" ry="6" fill="{INK}"/><circle cx="{px+1.5}" cy="{py-2}" r="1.5" fill="#fff"/>'

def mouth(m, talk=0.0):
    if talk > 0:
        h = 4 + 10 * talk
        return f'<ellipse cx="0" cy="26" rx="10" ry="{h/2:.1f}" fill="{RED}" stroke="{INK}" stroke-width="4"/>'
    M = {
        "neutral": f'<path d="M -9 25 Q 0 30 9 25" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
        "happy": f'<path d="M -14 22 Q 0 36 14 22" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
        "laugh": f'<path d="M -16 20 Q 0 44 16 20 Z" fill="{RED}" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
        "surprised": f'<ellipse cx="0" cy="27" rx="7" ry="10" fill="{INK}"/>',
        "think": f'<path d="M -8 27 Q 2 23 10 26" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
        "sad": f'<path d="M -12 30 Q 0 20 12 30" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
        "angry": f'<path d="M -12 28 L 12 28" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><path d="M -12 28 Q 0 24 12 28" stroke="{INK}" stroke-width="2" fill="none"/>',
        "scared": f'<path d="M -12 28 l 4 -4 l 4 4 l 4 -4 l 4 4 l 4 -4" stroke="{INK}" stroke-width="4" fill="none" stroke-linejoin="round"/>',
        "excited": f'<path d="M -16 20 Q 0 44 16 20 Z" fill="{RED}" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
        "shy": f'<path d="M -6 26 Q 0 30 6 26" stroke="{INK}" stroke-width="4" fill="none" stroke-linecap="round"/>',
        "sleepy": f'<ellipse cx="2" cy="27" rx="5" ry="6" fill="{INK}"/>',
        "aha": f'<path d="M -15 20 Q 0 40 15 20 Z" fill="{RED}" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
        "wink": f'<path d="M -12 24 Q 2 34 14 20" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
    }
    return M[m]

def head(m="neutral", look=(0, 0), talk=0.0, curl=0.0, glasses_bounce=0.0, tilt=0.0):
    blush = (f'<ellipse cx="-30" cy="14" rx="9" ry="5" fill="{BLUSH}" opacity="0.8"/><ellipse cx="30" cy="14" rx="9" ry="5" fill="{BLUSH}" opacity="0.8"/>'
             if m in ("shy", "laugh", "happy", "excited") else "")
    sweat = f'<path d="M 44 -24 q 6 10 0 14 q -6 -4 0 -14 Z" fill="{CYAN}" stroke="{INK}" stroke-width="2"/>' if m in ("scared",) else ""
    zz = f'<text x="54" y="-48" font-family="Inter" font-weight="900" font-size="26" fill="{INK}">z</text><text x="70" y="-70" font-family="Inter" font-weight="900" font-size="20" fill="{INK}">z</text>' if m == "sleepy" else ""
    anger = f'<path d="M 36 -52 l 8 8 m 0 -8 l -8 8 m 16 -4 l -6 6" stroke="{RED}" stroke-width="4" stroke-linecap="round"/>' if m == "angry" else ""
    gb = glasses_bounce
    c = curl
    curl_path = f'M -4 -50 C {-10 + c*6:.1f} -96 {40 + c*14:.1f} {-102 + abs(c)*4:.1f} {38 + c*10:.1f} -72 C {36 + c*8:.1f} -54 {12 + c*4:.1f} -60 12 -42'
    return (f'<g transform="rotate({tilt})">'
            f'<path d="{curl_path}" stroke="{INK}" stroke-width="9" fill="none" stroke-linecap="round"/>'
            f'<circle r="52" fill="{CREAM}" stroke="{INK}" stroke-width="9"/>'
            + blush + brows(m)
            + f'<g transform="translate(0 {gb:.1f})">'
            f'<circle cx="-19" cy="-4" r="17" fill="#ffffff" stroke="{INK}" stroke-width="6"/><circle cx="19" cy="-4" r="17" fill="#ffffff" stroke="{INK}" stroke-width="6"/>'
            f'<line x1="-3" y1="-6" x2="3" y2="-6" stroke="{INK}" stroke-width="6"/>'
            + eye(-19, m, look, -1) + eye(19, m, look, 1) + '</g>'
            + mouth(m, talk) + sweat + zz + anger + '</g>')

def scarf(flap=0.0):
    f = flap
    return (f'<path d="M -22 52 Q 0 64 22 52 L 18 66 Q 0 74 -18 66 Z" fill="{ACC}" stroke="{INK}" stroke-width="5"/>'
            f'<path d="M 10 64 L {30 + f*24:.1f} {110 - abs(f)*30:.1f} L {14 + f*20:.1f} {106 - abs(f)*24:.1f} Z" fill="{ACC}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>')

# ---------- tüm karakter ----------
def figure(p, ink=INK):
    """p: lean (gövde eğimi, +sağ), armL/armR/legL/legR = (üst açı, alt ek açı) aşağıdan ölçülür (+ sağ),
    mood, look, talk, curl, flap, gb, tilt, headdy, sx, sy (ezilme/esneme, ayak tabanından)"""
    lean = p.get("lean", 0)
    hip = (0.0, 190.0)
    top = (math.sin(rad(lean)) * 120, 190 - math.cos(rad(lean)) * 120)
    neck = (top[0] + math.sin(rad(lean)) * 24, top[1] - math.cos(rad(lean)) * 24)
    parts = [f'<path d="M {hip[0]} {hip[1]} L {neck[0]:.1f} {neck[1]:.1f}" />']
    for side, d in (("legL", (-12, 0)), ("legR", (12, 0))):
        a1, a2 = p.get(side, d)
        (kx, ky), (fx, fy) = limb(hip[0], hip[1], a1, a2, 58, 58)
        parts.append(f'<path d="M {hip[0]} {hip[1]} L {kx:.1f} {ky:.1f} L {fx:.1f} {fy:.1f}" />')
    for side, d in (("armL", (-24, 0)), ("armR", (24, 0))):
        a1, a2 = p.get(side, d)
        (ex, ey), (wx, wy) = limb(top[0], top[1], a1, a2, 52, 50)
        parts.append(f'<path d="M {top[0]:.1f} {top[1]:.1f} L {ex:.1f} {ey:.1f} L {wx:.1f} {wy:.1f}" />')
    body = f'<g stroke="{ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">' + "".join(parts) + '</g>'
    hc = (top[0] + math.sin(rad(lean)) * 70, top[1] - math.cos(rad(lean)) * 70 + p.get("headdy", 0))
    h = head(p.get("mood", "neutral"), p.get("look", (0, 0)), p.get("talk", 0), p.get("curl", 0), p.get("gb", 0), p.get("tilt", 0) + lean * 0.5)
    sc = f'<g transform="translate({top[0]:.1f} {top[1]-70:.1f}) rotate({lean*0.5:.1f} 0 60)">{scarf(p.get("flap", 0))}</g>'
    sx, sy = p.get("sx", 1), p.get("sy", 1)
    return f'<g transform="translate(0 306) scale({sx} {sy}) translate(0 -306)">{body}{sc}<g transform="translate({hc[0]:.1f} {hc[1]:.1f})">{h}</g></g>'
