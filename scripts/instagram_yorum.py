"""Instagram yorumları: çek ve (Kadir onayladıktan sonra) yanıtla.

Kullanım:
  python3 instagram_yorum.py cek      -> <klasör>/yorumlar.json  (son Reels'lerin yorumları, cevaplanmış mı)
  python3 instagram_yorum.py yanitla  -> <klasör>/yanitlar.json içindeki ONAYLI cevapları gönderir

yanitlar.json biçimi:
  [{"yorum_id": "...", "metin": "...", "onay": true},          # bir yoruma cevap
   {"medya_id": "...", "metin": "...", "onay": true}]          # videonun altına kendi yorumumuz (ilk yorum)
Gönderilenler "gonderildi" alanıyla işaretlenir, tekrar gönderilmez.

Gerekli izin: instagram_business_manage_comments. Yorumlar kişisel veri olduğu için GİZLİ depoya yazılır.
"""
import datetime
import json
import os
import sys
import urllib.parse
import urllib.request

TOKEN = os.environ.get("INSTAGRAM_TOKEN", "")
API = "https://graph.instagram.com/v22.0"
OUT = os.environ.get("ISTATISTIK_KLASOR") or "istatistik"


def istek(yol, yontem="GET", **prm):
    prm["access_token"] = TOKEN
    veri = urllib.parse.urlencode(prm)
    if yontem == "GET":
        req = urllib.request.Request(f"{API}/{yol}?{veri}")
    else:
        req = urllib.request.Request(f"{API}/{yol}", data=veri.encode(), method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        hata = e.read().decode(errors="replace")[:300]
        raise RuntimeError(f"{e.code} {hata}") from None


def cek():
    ben = istek("me", fields="id,username")
    medya = istek("me/media", fields="id,caption,media_product_type,timestamp,permalink,comments_count", limit=15).get("data", [])
    sonuc, ozet = [], []
    for m in medya:
        if m.get("media_product_type") != "REELS":
            continue
        try:
            yorumlar = istek(f"{m['id']}/comments", fields="id,text,timestamp,username,like_count,replies{id,text,username,timestamp}", limit=50).get("data", [])
        except RuntimeError as e:
            sys.exit(f"Yorumlar okunamadı (izin eksik olabilir: instagram_business_manage_comments): {e}")
        ozet.append({"video": (m.get("caption") or "")[:40], "sayac": m.get("comments_count"), "gelen": len(yorumlar)})
        for y in yorumlar:
            cevaplar = (y.get("replies") or {}).get("data", [])
            sonuc.append({
                "video": (m.get("caption") or "").split("\n")[0][:50], "medya_id": m["id"], "adres": m["permalink"],
                "yorum_id": y["id"], "kisi": y.get("username", ""), "metin": y.get("text", ""), "zaman": y.get("timestamp", ""),
                "begeni": y.get("like_count", 0), "bizim_yorum": y.get("username") == ben.get("username"),
                "cevaplandi": any(c.get("username") == ben.get("username") for c in cevaplar),
                "cevaplar": [{"kisi": c.get("username"), "metin": c.get("text")} for c in cevaplar],
            })
    os.makedirs(OUT, exist_ok=True)
    json.dump({"tarih": datetime.datetime.now().isoformat(timespec="minutes"), "yorumlar": sonuc, "ozet": ozet},
              open(os.path.join(OUT, "yorumlar.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    bekleyen = [y for y in sonuc if not y["cevaplandi"] and not y["bizim_yorum"]]
    print(f"{len(sonuc)} yorum, {len(bekleyen)} cevap bekliyor")


def yanitla():
    yol = os.path.join(OUT, "yanitlar.json")
    if not os.path.exists(yol):
        sys.exit("yanitlar.json yok")
    liste = json.load(open(yol, encoding="utf-8"))
    gonderilen = 0
    for c in liste:
        if not c.get("onay") or c.get("gonderildi") or not c.get("metin"):
            continue
        try:
            if c.get("yorum_id"):
                r = istek(f"{c['yorum_id']}/replies", "POST", message=c["metin"])
            else:
                r = istek(f"{c['medya_id']}/comments", "POST", message=c["metin"])
            c["gonderildi"] = datetime.datetime.now().isoformat(timespec="minutes")
            c["yeni_id"] = r.get("id")
            gonderilen += 1
            print("gönderildi:", c.get("yorum_id") or c.get("medya_id"))
        except RuntimeError as e:
            c["hata"] = str(e)[:200]
            print("HATA:", e)
    json.dump(liste, open(yol, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{gonderilen} cevap gönderildi")


if __name__ == "__main__":
    if not TOKEN:
        sys.exit("INSTAGRAM_TOKEN yok")
    {"cek": cek, "yanitla": yanitla}[sys.argv[1] if len(sys.argv) > 1 else "cek"]()
