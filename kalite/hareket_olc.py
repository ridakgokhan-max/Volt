"""Videoda 'ölü an' ölçer: 10 fps, 108x192 gri kareler, ardışık kare farkının 0,5 sn ortalaması.
Kullanım: python kalite/hareket_olc.py video.mp4 [esik]  → ölü pencereleri ve genel skoru yazar."""
import subprocess, sys
import numpy as np

v = sys.argv[1]
esik = float(sys.argv[2]) if len(sys.argv) > 2 else 1.2
W, H, FPS = 108, 192, 10
raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", v, "-vf", f"fps={FPS},scale={W}:{H},format=gray",
                      "-f", "rawvideo", "-"], capture_output=True).stdout
k = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)
# altyazı bandını (karaoke sürekli değişir) ölçümden çıkar: y 1220–1380 (1920 ölçeğinde)
maske = np.ones((H, W), bool); maske[int(H * 1220 / 1920):int(H * 1380 / 1920), :] = False
fark = np.array([np.abs(k[i] - k[i - 1])[maske].mean() for i in range(1, len(k))])
pen = FPS // 2
skor = [fark[i:i + pen].mean() for i in range(0, len(fark) - pen + 1, pen)]
olu, bas = [], None
for j, s in enumerate(skor):
    t = j * 0.5
    if s < esik:
        bas = t if bas is None else bas
    else:
        if bas is not None and t - bas >= 1.0: olu.append((bas, t))
        bas = None
if bas is not None and len(skor) * 0.5 - bas >= 1.0: olu.append((bas, len(skor) * 0.5))
print(f"ortalama hareket: {np.mean(skor):.2f}  en düşük pencere: {min(skor):.2f}  eşik: {esik}")
print("ölü aralıklar (>=1 sn):", [(round(a, 1), round(b, 1)) for a, b in olu] or "yok")
print("pencereler:", " ".join(f"{s:.1f}" for s in skor))
