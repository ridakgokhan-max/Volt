"""Bir Dakikada Bilim: bilim/<konu>/ses.* kaydını kelime kelime zamanlı yazıya döker.

Çıktı: bilim/<konu>/kelimeler.json
  {"model":..., "sure":..., "segmentler":[{"start","end","text","kelimeler":[{"w","start","end","p"}]}]}

Kullanım: python scripts/transkript.py [konu-klasoru]   (boşsa kelimeler.json'u olmayan tüm klasörler)
"""
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get("WHISPER_MODEL", "large-v3")
# Kekemelik ve tekrarları atlamaması için örnek: whisper bu üslubu taklit eder
PROMPT = "Ee, şey... Telefonun, telefonun parmak izini nasıl, nasıl tanıyor? Hmm, yani."


def hedefler():
    if len(sys.argv) > 1 and sys.argv[1].strip():
        return [os.path.join(ROOT, "bilim", sys.argv[1].strip())]
    out = []
    for d in sorted(glob.glob(os.path.join(ROOT, "bilim", "*"))):
        if glob.glob(os.path.join(d, "ses.*")) and not os.path.exists(os.path.join(d, "kelimeler.json")):
            out.append(d)
    return out


def main():
    from faster_whisper import WhisperModel

    dirs = hedefler()
    if not dirs:
        print("Yazıya dökülecek yeni kayıt yok.")
        return
    model = WhisperModel(MODEL, device="cpu", compute_type="int8")
    for d in dirs:
        ses = sorted(glob.glob(os.path.join(d, "ses.*")))[0]
        # PyAV sürüm uyumsuzluklarından kaçınmak için sesi ffmpeg ile çözüp diziyle veriyoruz
        import subprocess
        import numpy as np
        raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", ses, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                             capture_output=True, check=True).stdout
        audio = np.frombuffer(raw, np.float32)
        segs, info = model.transcribe(
            audio, language="tr", word_timestamps=True, beam_size=5,
            initial_prompt=PROMPT, condition_on_previous_text=False,
            vad_filter=False,
        )
        out = []
        for s in segs:
            out.append({
                "start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(),
                "kelimeler": [{"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "p": round(w.probability, 3)} for w in (s.words or [])],
            })
            print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}")
        json.dump({"model": MODEL, "sure": round(info.duration, 3), "segmentler": out},
                  open(os.path.join(d, "kelimeler.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(os.path.basename(d), "tamam:", sum(len(s["kelimeler"]) for s in out), "kelime")


if __name__ == "__main__":
    main()
