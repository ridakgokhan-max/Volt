"""LottieFiles'tan (Lottie Simple License: ücretsiz, ticari kullanım serbest, atıf gerekmez) animasyon indirir.
Kullanım: python scripts/lottie_indir.py ad=https://...lottie [ad2=...]
.lottie dosyası bir zip; içindeki animations/*.json -> public/lottie/<ad>.json, kaynaklar public/lottie/KAYNAKLAR.md
"""
import io
import json
import os
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "lottie")
os.makedirs(OUT, exist_ok=True)
kay = os.path.join(OUT, "KAYNAKLAR.md")
satir = []
for arg in sys.argv[1:]:
    ad, url = arg.split("=", 1)
    istek = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", "Accept": "*/*", "Referer": "https://lottiefiles.com/"})
    try:
        veri = urllib.request.urlopen(istek, timeout=60).read()
    except Exception as e:  # noqa: BLE001
        print("HATA:", ad, e)
        continue
    if url.endswith(".json"):
        js = json.loads(veri)
    else:
        z = zipfile.ZipFile(io.BytesIO(veri))
        isim = sorted(n for n in z.namelist() if n.startswith("animations/") and n.endswith(".json"))[0]
        js = json.loads(z.read(isim))
        # gömülü görseller varsa (images/) data URI olarak içine koy
        for a in js.get("assets", []):
            if a.get("p") and not str(a.get("p")).startswith("data:") and a.get("u") is not None:
                yol = "images/" + a["p"]
                if yol in z.namelist():
                    import base64
                    uz = a["p"].rsplit(".", 1)[-1]
                    a["p"] = f"data:image/{uz};base64," + base64.b64encode(z.read(yol)).decode()
                    a["u"] = ""
                    a["e"] = 1
    json.dump(js, open(os.path.join(OUT, f"{ad}.json"), "w"), separators=(",", ":"))
    satir.append(f"- `{ad}.json` — {url} — Lottie Simple License")
    print("indirildi:", ad, js.get("op"), "kare,", js.get("fr"), "fps")
eski = open(kay).read() if os.path.exists(kay) else "# Lottie animasyonları\n\nHepsi LottieFiles, Lottie Simple License (ücretsiz, ticari kullanım serbest).\n\n"
open(kay, "w").write(eski + "\n".join(satir) + "\n")
