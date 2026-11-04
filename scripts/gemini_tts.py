"""Google Gemini TTS (AI Studio anahtarı, ücretsiz katman). Ortam: GEMINI_API_KEY.
Kullanım: python scripts/gemini_tts.py <ayar.json> <cikti_klasoru>
ayar.json: {"metin": "...", "varyantlar": [{"ad": "A", "ses": "Charon", "yonerge": "..."}], "modeller": [...]}
Çıktı: <ad>.wav (24 kHz mono), rapor.json, tani.json (hata mesajları, anahtar yazılmaz).
"""
import base64, json, os, sys, time, wave
import requests

KEY = os.environ["GEMINI_API_KEY"].strip()
ayar = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
os.makedirs(out, exist_ok=True)
modeller = ayar.get("modeller", ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts"])
tani, rapor = {"anahtar_uzunlugu": len(KEY), "istekler": []}, []

def uret(model, ses, metin):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {"contents": [{"parts": [{"text": metin}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": ses}}}}}
    for deneme in range(4):
        r = requests.post(url, headers={"x-goog-api-key": KEY, "Content-Type": "application/json"}, json=body, timeout=300)
        tani["istekler"].append([model, ses, r.status_code, "ok" if r.ok else r.text[:400]])
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(25 * (deneme + 1)); continue
        if not r.ok:
            return None
        try:
            part = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]
            return base64.b64decode(part["data"]), part.get("mimeType", "")
        except Exception as e:
            tani["istekler"].append([model, ses, "parse", str(e)[:200], r.text[:300]])
            return None
    return None

calisan = None
for va in ayar["varyantlar"]:
    metin = va["yonerge"].strip() + "\n\n" + va.get("metin", ayar["metin"])
    for m in ([calisan] if calisan else []) + [x for x in modeller if x != calisan]:
        res = uret(m, va["ses"], metin)
        if res:
            pcm, mime = res
            rate = 24000
            if "rate=" in mime:
                rate = int(mime.split("rate=")[1].split(";")[0])
            with wave.open(f"{out}/{va['ad']}.wav", "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
            rapor.append({"ad": va["ad"], "ses": va["ses"], "model": m, "sure": round(len(pcm) / 2 / rate, 2)})
            calisan = m
            print(va["ad"], va["ses"], m, "ok", flush=True)
            break
        print(va["ad"], va["ses"], m, "olmadı", flush=True)
    time.sleep(8)
json.dump(rapor, open(f"{out}/rapor.json", "w"), ensure_ascii=False, indent=1)
json.dump(tani, open(f"{out}/tani.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(rapor, ensure_ascii=False))
