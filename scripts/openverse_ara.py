"""Openverse'ten yalnızca CC0 / kamu malı (pdm) fotoğraf adaylarını indirir.
Kullanım: python scripts/openverse_ara.py <klasör> "ad|arama terimi" ...
Çıktı: <klasör>/<ad>_<n>.jpg ve <klasör>/adaylar.json (lisans, sahip, kaynak)."""
import json, os, sys, urllib.parse, urllib.request
kl = sys.argv[1]; os.makedirs(kl, exist_ok=True)
UA = {"User-Agent": "BirDakikadaBilim/1.0 (github.com/ridakgokhan-max/Volt)"}
kayit = []
for arg in sys.argv[2:]:
    ad, q = arg.split("|", 1)
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({"q": q, "license": "cc0,pdm", "page_size": 12, "mature": "false"})
    try:
        veri = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
    except Exception as e:
        print("arama hatası", ad, e); continue
    n = 0
    for r in veri.get("results", []):
        if n >= 6: break
        src = r.get("url")
        if not src: continue
        try:
            b = urllib.request.urlopen(urllib.request.Request(src, headers=UA), timeout=30).read()
            if len(b) < 20000: continue
            p = os.path.join(kl, f"{ad}_{n}.jpg"); open(p, "wb").write(b)
            kayit.append({"dosya": os.path.basename(p), "ad": ad, "baslik": r.get("title"), "sahip": r.get("creator"),
                          "lisans": r.get("license"), "kaynak": r.get("foreign_landing_url"), "url": src})
            n += 1
        except Exception as e:
            print("indirme hatası", src, e)
    print(ad, n, "aday")
json.dump(kayit, open(os.path.join(kl, "adaylar.json"), "w"), ensure_ascii=False, indent=1)
