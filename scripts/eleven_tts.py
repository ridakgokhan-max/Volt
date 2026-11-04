"""ElevenLabs ile seslendirme (ücretsiz plan). Ortam: ELEVEN_API_KEY.
Kullanım: python scripts/eleven_tts.py <ayar.json> <cikti_klasoru>
ayar.json: {"metin": "...", "varyantlar": [{"ad":"A","ses":["Brian","George"],"model":"eleven_v3","stability":0.5}], ...}
Ses adı listede ilk bulunan kullanılır (hazır sesler). v3 başarısız olursa eleven_multilingual_v2 ile tekrar dener.
Ayrıca hesabın ses listesini ve kalan kotayı sesler.json / kota.json olarak yazar.
"""
import json, os, sys, time
import requests

KEY = os.environ["ELEVEN_API_KEY"]
H = {"xi-api-key": KEY}
ayar = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
os.makedirs(out, exist_ok=True)

tani = {"anahtar_uzunlugu": len(KEY.strip()), "bosluk_var": KEY != KEY.strip()}
KEY = KEY.strip()
H = {"xi-api-key": KEY}
r = requests.get("https://api.elevenlabs.io/v1/voices", headers=H, timeout=60)
tani["voices"] = [r.status_code, r.text[:300] if not r.ok else "ok"]
print("voices", r.status_code)
voices = r.json().get("voices", []) if r.ok else []
json.dump([{"ad": v["name"], "id": v["voice_id"], "tur": v.get("category"), "etiket": v.get("labels")} for v in voices],
          open(f"{out}/sesler.json", "w"), ensure_ascii=False, indent=1)
try:
    rs = requests.get("https://api.elevenlabs.io/v1/user/subscription", headers=H, timeout=60)
    tani["subscription"] = [rs.status_code, rs.text[:300] if not rs.ok else "ok"]
    s = rs.json()
    json.dump({k: s.get(k) for k in ("tier", "character_count", "character_limit", "next_character_count_reset_unix")},
              open(f"{out}/kota_once.json", "w"), indent=1)
    print("kota", s.get("tier"), s.get("character_count"), "/", s.get("character_limit"))
except Exception as e:
    print("kota okunamadı", e)

def bul(adlar):
    for a in adlar:
        for v in voices:
            if v["name"].lower().startswith(a.lower()):
                return v["voice_id"], v["name"]
    if voices:
        return voices[0]["voice_id"], voices[0]["name"]
    # liste okunamazsa bilinen hazır ses kimlikleri
    HAZIR = {"brian": "nPczCjzI2devNBz1zQrb", "george": "JBFqnCBsd6RMkjVDRZzb", "alice": "Xb7hH8MSUJpSbSDYk0k2",
             "adam": "pNInz6obpgDQGcFmaJgB", "daniel": "onwK4e9ZLuTAKqWW03F9", "matilda": "XrExE9yKIg1WjnnlVkGX"}
    for a in adlar:
        if a.lower() in HAZIR:
            return HAZIR[a.lower()], a
    return None, None

rapor = []
for va in ayar["varyantlar"]:
    vid, vad = bul(va["ses"])
    metin = va.get("metin", ayar["metin"])
    for model in [va.get("model", "eleven_v3"), "eleven_multilingual_v2"]:
        body = {"text": metin if model == "eleven_v3" else ayar.get("metin_etiketsiz", metin),
                "model_id": model, "language_code": "tr",
                "voice_settings": {"stability": va.get("stability", 0.5), "similarity_boost": 0.75}}
        if model != "eleven_v3":
            body["voice_settings"].update({"style": va.get("style", 0.35), "use_speaker_boost": True})
        rr = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                           headers={**H, "Content-Type": "application/json"}, json=body, timeout=300)
        print(va["ad"], vad, model, rr.status_code, rr.text[:200] if not rr.ok else "")
        tani.setdefault("tts", []).append([va["ad"], vad, model, rr.status_code, rr.text[:300] if not rr.ok else "ok"])
        if rr.ok:
            open(f"{out}/{va['ad']}.mp3", "wb").write(rr.content)
            rapor.append({"ad": va["ad"], "ses": vad, "model": model, "stability": va.get("stability")})
            break
        time.sleep(2)
json.dump(rapor, open(f"{out}/rapor.json", "w"), ensure_ascii=False, indent=1)
json.dump(tani, open(f"{out}/tani.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(rapor, ensure_ascii=False))
