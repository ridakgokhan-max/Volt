"""Hazır videoyu Instagram'a Reels olarak paylaşır (sadece Kadir onay verdikten sonra elle başlatılır).
Kullanım: INSTAGRAM_TOKEN=... python scripts/instagram_paylas.py <konu>
Video: out/bilim/<konu>.mp4 (herkese açık GitHub adresinden Instagram çeker)
Açıklama: bilim/<konu>/aciklama.txt   Kapak: out/bilim/<konu>-kapak.png
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

T = os.environ["INSTAGRAM_TOKEN"]
API = "https://graph.instagram.com/v22.0"
HAM = "https://raw.githubusercontent.com/ridakgokhan-max/Volt/main"
konu = sys.argv[1]


def istek(yol, veri=None):
    veri = dict(veri or {}, access_token=T)
    if yol.startswith("GET "):
        url = f"{API}/{yol[4:]}?{urllib.parse.urlencode(veri)}"
        r = urllib.request.urlopen(url, timeout=60)
    else:
        r = urllib.request.urlopen(urllib.request.Request(f"{API}/{yol}", data=urllib.parse.urlencode(veri).encode()), timeout=60)
    return json.loads(r.read())


aciklama = open(f"bilim/{konu}/aciklama.txt", encoding="utf-8").read().strip()
veri = {"media_type": "REELS", "video_url": f"{HAM}/out/bilim/{konu}.mp4", "caption": aciklama, "share_to_feed": "true"}
if os.path.exists(f"out/bilim/{konu}-kapak.png"):
    veri["cover_url"] = f"{HAM}/out/bilim/{konu}-kapak.png"
kap = istek("me/media", veri)["id"]
print("kapsayıcı:", kap)
for _ in range(60):
    d = istek(f"GET {kap}", {"fields": "status_code,status"})
    print("durum:", d.get("status_code"), d.get("status", ""))
    if d.get("status_code") == "FINISHED":
        break
    if d.get("status_code") in ("ERROR", "EXPIRED"):
        sys.exit("Instagram videoyu işleyemedi: " + json.dumps(d, ensure_ascii=False))
    time.sleep(10)
yayin = istek("me/media_publish", {"creation_id": kap})
link = istek(f"GET {yayin['id']}", {"fields": "permalink"}).get("permalink")
print("YAYINLANDI:", link)
