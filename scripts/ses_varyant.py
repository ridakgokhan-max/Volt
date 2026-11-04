"""Chatterbox ile ayar varyantları: her cümle için birkaç deneme üretir, whisper ile metne en uyanı seçer.
Kullanım: python scripts/ses_varyant.py <referans.wav> <metin.txt> <cikti.wav> <exaggeration> <cfg> <deneme>
Hızlandırma YOK; cümle sonu 0.38 sn, iki nokta sonrası 0.22 sn boşluk.
"""
import difflib, re, sys
import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

ref, metin_yolu, cikti, ex, cfg, n = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
metin = open(metin_yolu, encoding="utf-8").read().replace("\n", " ")
parcalar = [c.strip() for c in re.split(r"(?<=[.!?:])\s+", metin) if c.strip()]
try:
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu", t3_model="v3")
except TypeError:
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
wm = WhisperModel("medium", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^\wçğıöşü ]", "", s.lower())
out = []
for i, c in enumerate(parcalar):
    best, bs = None, -1
    for k in range(n):
        torch.manual_seed(101 + 17 * i + k)
        w = model.generate(c, language_id="tr", audio_prompt_path=ref, exaggeration=ex, cfg_weight=cfg)
        ta.save("/tmp/aday.wav", w, model.sr)
        segs, _ = wm.transcribe("/tmp/aday.wav", language="tr")
        txt = " ".join(s.text for s in segs)
        sc = difflib.SequenceMatcher(None, norm(c), norm(txt)).ratio()
        sure = w.shape[1] / model.sr
        print(f"{i+1}.{k+1} skor {sc:.3f} süre {sure:.2f}s | {txt.strip()[:70]}", flush=True)
        if sc > bs:
            best, bs = w, sc
    out.append(best)
    out.append(torch.zeros(1, int(model.sr * (0.22 if c.endswith(":") else 0.38))))
ta.save(cikti, torch.cat(out, dim=1), model.sr)
print("bitti", cikti)
