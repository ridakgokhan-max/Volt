"""Freesound'dan YALNIZCA CC0 (Creative Commons 0 — atıf bile gerekmez) sesleri indirir.

Gerekli: depo ayarlarında FREESOUND_KEY gizli anahtarı (freesound.org/apiv2/apply ücretsiz).
Kullanım: FREESOUND_KEY=... python scripts/freesound_indir.py "whoosh" "page flip" ...
Çıktı  : sesler/freesound/<arama>_<id>.mp3  +  sesler/freesound/kaynaklar.json (id, ad, yazar, lisans, adres)
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

KEY = os.environ.get("FREESOUND_KEY", "")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "sesler", "freesound")


def api(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Token {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main(aramalar, adet=4):
    if not KEY:
        sys.exit("FREESOUND_KEY yok: freesound.org'da ücretsiz hesap açıp API anahtarını depo gizli ayarlarına ekleyin.")
    os.makedirs(OUT, exist_ok=True)
    kayit_yolu = os.path.join(OUT, "kaynaklar.json")
    kayit = json.load(open(kayit_yolu)) if os.path.exists(kayit_yolu) else {}
    for q in aramalar:
        prm = urllib.parse.urlencode({"query": q, "filter": 'license:"Creative Commons 0" duration:[0.1 TO 6]',
                                      "fields": "id,name,username,license,url,previews", "page_size": adet, "sort": "rating_desc"})
        for s in api(f"https://freesound.org/apiv2/search/text/?{prm}")["results"]:
            if "publicdomain/zero" not in s["license"]:
                continue  # güvenlik: CC0 dışını asla alma
            ad = re.sub(r"[^a-z0-9]+", "_", q.lower()).strip("_") + f"_{s['id']}.mp3"
            urllib.request.urlretrieve(s["previews"]["preview-hq-mp3"], os.path.join(OUT, ad))
            kayit[ad] = {"id": s["id"], "ad": s["name"], "yazar": s["username"], "lisans": s["license"], "adres": s["url"]}
            print("indirildi:", ad)
    json.dump(kayit, open(kayit_yolu, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1:])
