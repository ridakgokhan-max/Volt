"""Ekip incelemesi için kanıt paketi hazırlar.
Kullanım: python kalite/inceleme_paket.py <konu> <cikti_klasoru>
Üretir: kareler_1.jpg/kareler_2.jpg (her saniye bir kare, zaman damgalı), hareket_seritleri.jpg
(her sahnenin ortasından 0,2 sn arayla 4 kare — hareketi görmek için), kapak.jpg, hareket.txt,
bilgi.txt (metin, sahne zamanları, kesimler, açıklama)."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw

konu, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
v = f"out/bilim/{konu}.mp4"
D = json.load(open(f"src/bilim/data/{konu}.json"))
sure = D["sure"]


def kare(t, w=216, h=384):
    p = f"/tmp/_k_{t:.2f}.png"
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", f"{t:.2f}", "-i", v, "-frames:v", "1", "-vf", f"scale={w}:{h}", p])
    return Image.open(p).convert("RGB")


def sayfa(ts, ad, cols=8):
    rows = (len(ts) + cols - 1) // cols
    sh = Image.new("RGB", (cols * 216, rows * 404), "white")
    d = ImageDraw.Draw(sh)
    for i, t in enumerate(ts):
        x, y = (i % cols) * 216, (i // cols) * 404
        sh.paste(kare(t), (x, y))
        d.rectangle([x, y + 384, x + 216, y + 402], fill="yellow")
        d.text((x + 4, y + 387), f"{t:.1f}s", fill="black")
    sh.save(os.path.join(out, ad), quality=82)


ts = [min(i + 0.3, sure - 0.1) for i in range(int(sure) + 1)]
yarim = (len(ts) + 1) // 2
sayfa(ts[:yarim], "kareler_1.jpg")
sayfa(ts[yarim:], "kareler_2.jpg")

# hareket şeritleri: her sahnenin %25, %50, %75 noktasında 0,2 sn arayla 4 kare
sc = D["sahneler"]
satirlar = []
for j, s in enumerate(sc):
    son = sc[j + 1]["bas"] if j + 1 < len(sc) else sure
    for f in (0.25, 0.5, 0.75):
        t0 = s["bas"] + (son - s["bas"]) * f
        satirlar.append((s["id"], [t0 + k * 0.2 for k in range(4)]))
sh = Image.new("RGB", (4 * 162 + 120, len(satirlar) * 300), "white")
d = ImageDraw.Draw(sh)
for r, (ad, tt) in enumerate(satirlar):
    d.text((4, r * 300 + 140), f"{ad}\n{tt[0]:.1f}s", fill="black")
    for c, t in enumerate(tt):
        sh.paste(kare(t, 162, 288), (120 + c * 162, r * 300))
sh.save(os.path.join(out, "hareket_seritleri.jpg"), quality=80)

kp = f"out/bilim/{konu}-kapak.png"
if os.path.exists(kp):
    k = Image.open(kp).convert("RGB"); k.thumbnail((540, 960)); k.save(os.path.join(out, "kapak.jpg"), quality=85)

h = subprocess.run([sys.executable, "kalite/hareket_olc.py", v], capture_output=True, text=True).stdout
open(os.path.join(out, "hareket.txt"), "w").write(h)

K = json.load(open(f"bilim/{konu}/kurgu.json"))
metin = open(f"bilim/{konu}/metin.txt").read() if os.path.exists(f"bilim/{konu}/metin.txt") else ""
aciklama = open(f"bilim/{konu}/aciklama.txt").read() if os.path.exists(f"bilim/{konu}/aciklama.txt") else ""
with open(os.path.join(out, "bilgi.txt"), "w") as f:
    f.write(f"KONU: {konu}\nSÜRE: {sure:.1f} sn\n\nOKUNAN METİN:\n{metin}\n\nKANCA: {K.get('kanca')}\n\n")
    f.write("SAHNELER (başlangıç sn):\n" + "\n".join(f"- {s['id']}: {s['bas']:.1f}" for s in sc) + "\n\n")
    f.write(f"SES KESİMLERİ (ham kayıt sn): {K.get('kesimler')}\n\nCTA: {K.get('cta')}\n\nAÇIKLAMA:\n{aciklama}\n")
print("paket hazır:", out)
