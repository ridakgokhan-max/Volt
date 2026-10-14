"""Kadir'in sesiyle metin okutma (Chatterbox Multilingual, MIT lisans, Türkçe destekli).
Kullanım: python scripts/ses_klon.py <referans.wav> <metin.txt> <cikti.wav>
Metin cümle cümle üretilir, araya kısa boşluk konur.
"""
import re
import sys

import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

ref, metin_yolu, cikti = sys.argv[1:4]
metin = open(metin_yolu, encoding="utf-8").read()
cumleler = [c.strip() for c in re.split(r"(?<=[.!?])\s+", metin.replace("\n", " ")) if c.strip()]
try:
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu", t3_model="v3")
except TypeError:
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
parcalar = []
for i, c in enumerate(cumleler):
    torch.manual_seed(7 + i)
    w = model.generate(c, language_id="tr", audio_prompt_path=ref, exaggeration=0.45, cfg_weight=0.5)
    parcalar.append(w)
    soru = c.endswith("?")
    parcalar.append(torch.zeros(1, int(model.sr * (0.32 if c.endswith((".", "!", "?")) else 0.18))))
    print(f"{i + 1}/{len(cumleler)}: {c[:50]}", flush=True)
ta.save(cikti, torch.cat(parcalar, dim=1), model.sr)
print("bitti:", cikti)
