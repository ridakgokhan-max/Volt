import sys
from playwright.sync_api import sync_playwright
from merakli import figure, INK, ACC

E = [
    ("Mutlu", dict(mood="happy", armL=(-30, -20), armR=(30, 20))),
    ("Kahkaha", dict(mood="laugh", armL=(-35, 95), armR=(35, -95), lean=-4, tilt=-6)),
    ("Şaşkın", dict(mood="surprised", armL=(-112, -40), armR=(112, 40), gb=-4, legL=(-16, 0), legR=(16, 0))),
    ("Meraklı", dict(mood="think", look=(0.6, -0.7), armR=(20, -150), armL=(-25, 60), tilt=8)),
    ("Üzgün", dict(mood="sad", armL=(-13, 0), armR=(13, 0), lean=0, headdy=8, tilt=-10)),
    ("Kızgın", dict(mood="angry", armL=(-40, 110), armR=(40, -110), lean=0)),
    ("Korkmuş", dict(mood="scared", armL=(-95, -75), armR=(95, 75), legL=(-16, 22), legR=(16, -22), sy=0.95)),
    ("Heyecanlı", dict(mood="excited", armL=(-105, -55), armR=(105, 55), legL=(-25, 0), legR=(25, 0))),
    ("Utangaç", dict(mood="shy", look=(-0.8, 0.6), armL=(-20, 70), armR=(20, -70), tilt=-12, legL=(-6, 0), legR=(10, 0))),
    ("Uykulu", dict(mood="sleepy", armL=(-12, 0), armR=(12, 0), tilt=14, headdy=6, lean=3)),
    ("Aha!", dict(mood="aha", armR=(100, 65), armL=(-30, 0), legR=(16, 0))),
    ("Göz kırpan", dict(mood="wink", armR=(80, -60), armL=(-24, 0), tilt=6)),
]
cols = 4
cw, ch = 380, 470
W, H = cols * cw + 40, 3 * ch + 40
cells = ""
bgs = ["#efe3c8", "#e6efe6", "#e3ecf6", "#f6e6e3"]
for i, (lab, p) in enumerate(E):
    r, c = divmod(i, cols)
    x0, y0 = 20 + c * cw, 20 + r * ch
    extra = ""
    if lab == "Aha!":
        extra = (f'<g transform="translate({x0+cw/2+90} {y0+70})"><circle r="70" fill="#fff2a8" opacity="0.6"/>'
                 f'<path d="M 0 30 C -30 30 -36 0 -24 -14 C -16 -24 -16 -32 -16 -40 L 16 -40 C 16 -32 16 -24 24 -14 C 36 0 30 30 0 30 Z" fill="{ACC}" stroke="{INK}" stroke-width="5"/>'
                 f'<rect x="-12" y="30" width="24" height="12" rx="3" fill="#bbb" stroke="{INK}" stroke-width="4"/></g>')
    if lab == "Meraklı":
        extra = f'<text x="{x0+cw/2+95}" y="{y0+95}" font-family="Inter" font-weight="900" font-size="60" fill="{INK}">?</text>'
    cells += (f'<rect x="{x0+8}" y="{y0+8}" width="{cw-16}" height="{ch-16}" rx="26" fill="{bgs[c]}"/>' + extra +
              f'<g transform="translate({x0+cw/2} {y0+125}) scale(0.92)">{figure(p)}</g>'
              f'<text x="{x0+cw/2}" y="{y0+ch-30}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="{INK}">{lab}</text>')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="#faf6ec"/>{cells}</svg>'
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H})
    pg.set_content(f'<html><body style="margin:0">{svg}</body></html>'); pg.screenshot(path=sys.argv[1]); b.close()
print("ok")
