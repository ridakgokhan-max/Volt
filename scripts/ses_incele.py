"""Şüpheli ses aralıklarını kelimesi kelimesine (kekeme/tekrar dahil) yeniden yazıya döker.
Kullanım: python scripts/ses_incele.py <ses> "a-b;a-b;..." <cikti.json>"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

ses, araliklar, cikti = sys.argv[1], sys.argv[2], sys.argv[3]
model = WhisperModel("large-v3", device="cpu", compute_type="int8")
PROMPT = "Konuşmayı aynen yaz: yarım kalan kelimeleri, tekrarları ve kekelemeleri de yaz. Örnek: sağ- sağlamlığın, dola- dolandırıcılar, aç- açmadan, ee, ıı."
sonuc = []
for ar in araliklar.split(";"):
    a, b = [float(x) for x in ar.split("-")]
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", str(a), "-to", str(b), "-i", ses,
                          "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
    audio = np.frombuffer(raw, dtype=np.float32)
    segs, _ = model.transcribe(audio, language="tr", word_timestamps=True, beam_size=5, initial_prompt=PROMPT,
                               condition_on_previous_text=False, vad_filter=False)
    kel = []
    for s in segs:
        for w in s.words or []:
            kel.append({"w": w.word.strip(), "start": round(a + w.start, 2), "end": round(a + w.end, 2), "p": round(w.probability, 2)})
    sonuc.append({"aralik": [a, b], "kelimeler": kel, "metin": " ".join(k["w"] for k in kel)})
    print(a, b, "→", sonuc[-1]["metin"], flush=True)
json.dump(sonuc, open(cikti, "w"), ensure_ascii=False, indent=1)
