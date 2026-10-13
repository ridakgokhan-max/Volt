"""Yapay zekâ seslendirmesi (demo ve taslaklar için): bilim/<konu>/metin.txt -> bilim/<konu>/ses.wav
Piper (açık kaynak, çevrimdışı) Türkçe ses modeli kullanır; asıl videolarda Kadir'in kendi sesi kullanılır.
Kullanım: python scripts/seslendir.py <konu> [ses] [hız]   ses: fettah | dfki | fahrettin   hız: 1.0 = normal, 0.9 = daha hızlı
"""
import os
import sys
import urllib.request
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/tr/tr_TR/{n}/medium/tr_TR-{n}-medium.onnx"
CACHE = os.path.expanduser("~/.cache/piper")


def model(name):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, f"tr_TR-{name}-medium.onnx")
    for url, dst in ((HF.format(n=name), p), (HF.format(n=name) + ".json", p + ".json")):
        if not os.path.exists(dst):
            urllib.request.urlretrieve(url, dst)
    return p


def main(konu, name, scale):
    from piper import PiperVoice

    d = os.path.join(ROOT, "bilim", konu)
    text = open(os.path.join(d, "metin.txt"), encoding="utf-8").read().strip()
    voice = PiperVoice.load(model(name))
    out = os.path.join(d, "ses.wav")
    with wave.open(out, "wb") as wf:
        try:
            from piper import SynthesisConfig

            voice.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=scale))
        except ImportError:
            voice.synthesize(text, wf, length_scale=scale)
    print(konu, "seslendirildi:", name, "hız", scale, "->", out)


if __name__ == "__main__":
    k = sys.argv[1]
    v = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else "fettah"
    r = float(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 0.95
    main(k, v, r)
