"""Gemini tam.wav: açılış kelimelerini sessizliklere göre hizalar, uzun duraklamaları kısaltır, hafif tempo verir.
Çıktı: ses/final.wav + ses/final.kelimeler.json"""
import json, re, subprocess, wave, sys
import numpy as np
D = "/home/claude/volt-istatistik/uretim/kara-kedi/gemini/tam2"
OUT = "/home/claude/karakedi/uretim/ses"
TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.06
SR = 48000
TTS = open("/home/claude/volt/uretim/kara-kedi/gemini/metin_tam.txt", encoding="utf-8").read().split()
wk = json.load(open(f"{D}/tam.kelimeler.json"))
syl = lambda w: max(1, len(re.findall("[aeıioöuüAEIİOÖUÜ]", w)))
# açılış: 5 ifade ↔ 5 konuşma bölgesi (silencedetect ile ölçüldü)
ifadeler = [(0, 5), (5, 14), (14, 19), (19, 22), (22, 29)]  # tts kelime aralıkları
bolgeler = [(0.02, 1.63), (1.99, 6.35), (6.88, 9.59), (10.10, 12.34), (12.75, 15.70)]
words = []
for (i0, i1), (t0, t1) in zip(ifadeler, bolgeler):
    ss = [syl(TTS[i]) for i in range(i0, i1)]
    c = np.concatenate([[0], np.cumsum(ss)]) / sum(ss) * (t1 - t0) + t0
    for k, i in enumerate(range(i0, i1)):
        words.append({"w": TTS[i], "start": round(c[k], 3), "end": round(c[k + 1], 3)})
words += wk  # whisper: 'Almanya'da'dan itibaren
print(len(words), "kelime (tts:", len(TTS), ")")
# ses + duraklama sıkıştırma
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{D}/tam.wav", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
hop = int(0.01 * SR)
fr = x[:len(x) // hop * hop].reshape(-1, hop)
db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
sil = db < -40
runs, i = [], 0
while i < len(sil):
    if sil[i]:
        j = i
        while j < len(sil) and sil[j]:
            j += 1
        runs.append((i, j)); i = j
    else:
        i += 1
korunan = [(1.5, 2.1, 0.5), (65.0, 68.6, 0.45)]  # (aralık başı, sonu, en fazla) — dramatik duraklamalar
out, tmap, pos, newpos = [], [], 0, 0
def seg(a, b):
    global newpos
    out.append(x[a:b]); tmap.append((a / SR, newpos / SR)); newpos += b - a; tmap.append((b / SR, newpos / SR))
for a, b in runs:
    t0, dur = a * 0.01, (b - a) * 0.01
    cap = 0.30
    for k0, k1, c in korunan:
        if k0 <= t0 <= k1:
            cap = c
    if dur > cap + 0.02 and a > 0:
        keep = cap / 2
        c0, c1 = int((t0 + keep) * SR), int((t0 + dur - keep) * SR)
        seg(pos, c0); pos = c1
seg(pos, len(x))
fade = int(0.006 * SR); y = []
for s in out:
    s = s.copy()
    if len(s) > 2 * fade:
        s[:fade] *= np.linspace(0, 1, fade); s[-fade:] *= np.linspace(1, 0, fade)
    y.append(s)
y = np.concatenate(y)
print("sıkışmış", round(len(y) / SR, 2), "sn; tempo", TEMPO, "→", round(len(y) / SR / TEMPO, 2), "sn")
with wave.open("/tmp/gsik.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).clip(-32768, 32767).astype(np.int16).tobytes())
af = (f"atempo={TEMPO}," if TEMPO != 1 else "") + "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90,loudnorm=I=-15:TP=-1.5:LRA=9"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "/tmp/gsik.wav", "-af", af, "-ar", "48000", f"{OUT}/final.wav"], check=True)
to = np.array([a for a, b in tmap]); tn = np.array([b for a, b in tmap])
mp = lambda t: round(float(np.interp(t, to, tn)) / TEMPO, 3)
json.dump([{"w": w["w"], "start": mp(w["start"]), "end": mp(w["end"])} for w in words], open(f"{OUT}/final.kelimeler.json", "w"), ensure_ascii=False, indent=0)
print("son kelime", mp(words[-1]["end"]))
