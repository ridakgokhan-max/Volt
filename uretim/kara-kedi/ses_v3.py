import json, subprocess, wave, glob
import numpy as np
G = "/home/claude/volt-istatistik/uretim/kara-kedi/gemini"
OUT = "/home/claude/karakedi/v3/ses"
SR = 48000
parts = sorted(glob.glob(f"{G}/v3/P[1-4]*.wav")) + [f"{G}/v3p5/P5_final.wav"]
seg, offs, pos = [], [], 0.0
for i, p in enumerate(parts):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-af",
                          "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,"
                          "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse",
                          "-ar", str(SR), "-ac", "1", "-f", "f32le", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    offs.append(pos); seg.append(a); pos += len(a) / SR
    if i < len(parts) - 1:
        seg.append(np.zeros(int(0.32 * SR), np.float32)); pos += 0.32
x = np.concatenate(seg)
w3 = json.load(open(f"{G}/v3/tam.kelimeler.json"))
w5 = json.load(open(f"{G}/v3p5/tam.kelimeler.json"))
# not: v3 birleştirmesi 24 kHz ile aynı kırpmayı yaptı; P5 başlangıcından önceki kelimeleri al
words = [w for w in w3 if w["start"] < offs[4] - 0.2] + [{"w": w["w"], "start": w["start"] + offs[4], "end": w["end"] + offs[4]} for w in w5]
print("ham süre", round(len(x) / SR, 2), "P5 ofset", round(offs[4], 2), "kelime", len(words))
# duraklama sıkıştırma
hop = int(0.01 * SR)
fr = x[:len(x) // hop * hop].reshape(-1, hop)
sil = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9) < -40
runs, i = [], 0
while i < len(sil):
    if sil[i]:
        j = i
        while j < len(sil) and sil[j]:
            j += 1
        runs.append((i, j)); i = j
    else:
        i += 1
q_soru = [w for w in words if w["w"].lower().startswith("sen")][-1]["start"]
out, tmap, p0, npos = [], [], 0, 0
def add(a, b):
    global npos
    out.append(x[a:b]); tmap.append((a / SR, npos / SR)); npos += b - a; tmap.append((b / SR, npos / SR))
for a, b in runs:
    t0, dur = a * 0.01, (b - a) * 0.01
    cap = 0.45 if abs(t0 + dur - q_soru) < 0.6 else 0.30
    if dur > cap + 0.02 and a > 0:
        c0, c1 = int((t0 + cap / 2) * SR), int((t0 + dur - cap / 2) * SR)
        add(p0, c0); p0 = c1
add(p0, len(x))
fade = int(0.006 * SR); y = []
for s in out:
    s = s.copy()
    if len(s) > 2 * fade:
        s[:fade] *= np.linspace(0, 1, fade); s[-fade:] *= np.linspace(1, 0, fade)
    y.append(s)
y = np.concatenate(y)
print("sıkışmış", round(len(y) / SR, 2))
with wave.open("/tmp/v3sik.wav", "wb") as wv:
    wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((y * 32767).clip(-32768, 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "/tmp/v3sik.wav", "-af",
                "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90,loudnorm=I=-15:TP=-1.5:LRA=9",
                "-ar", "48000", f"{OUT}/final.wav"], check=True)
to = np.array([a for a, b in tmap]); tn = np.array([b for a, b in tmap])
mp = lambda t: round(float(np.interp(t, to, tn)), 3)
json.dump([{"w": w["w"], "start": mp(w["start"]), "end": mp(w["end"])} for w in words], open(f"{OUT}/final.kelimeler.json", "w"), ensure_ascii=False, indent=0)
print("son kelime", mp(words[-1]["end"]))
