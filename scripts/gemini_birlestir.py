"""Gemini bölüm seslerini (P*.wav) sırayla 0.32 sn arayla birleştirir, baş/son sessizliği kırpar ve
faster-whisper ile kelime zamanlarını çıkarır. Kullanım: python scripts/gemini_birlestir.py <klasor>"""
import glob, json, sys, subprocess
d = sys.argv[1]
parts = sorted(glob.glob(f"{d}/P*.wav"))
if not parts:
    sys.exit("bölüm yok")
lst = []
for i, p in enumerate(parts):
    t = f"/tmp/kirp{i}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,"
                    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse",
                    "-ar", "24000", "-ac", "1", t], check=True)
    lst.append(t)
    if i < len(parts) - 1:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.32", f"/tmp/bos{i}.wav"], check=True)
        lst.append(f"/tmp/bos{i}.wav")
open("/tmp/liste.txt", "w").write("".join(f"file '{x}'\n" for x in lst))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "/tmp/liste.txt", f"{d}/tam.wav"], check=True)
from faster_whisper import WhisperModel
m = WhisperModel("large-v3", device="cpu", compute_type="int8")
import numpy as np
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{d}/tam.wav", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
audio = np.frombuffer(raw, np.float32)
metin = open(sys.argv[2], encoding="utf-8").read() if len(sys.argv) > 2 else None
segs, _ = m.transcribe(audio, language="tr", word_timestamps=True, initial_prompt=metin[:200] if metin else None)
out = [{"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)} for s in segs for w in s.words]
json.dump(out, open(f"{d}/tam.kelimeler.json", "w"), ensure_ascii=False, indent=0)
print(len(out), "kelime;", " ".join(x["w"] for x in out))
