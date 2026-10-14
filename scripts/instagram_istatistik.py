"""Instagram Reels istatistiklerini çeker (Instagram API with Instagram Login — Facebook sayfası gerekmez).

Gerekli: depo gizli ayarlarında INSTAGRAM_TOKEN (uzun ömürlü erişim anahtarı).
Çıktı : istatistik/reels.csv (her gün her Reels için bir satır, geçmiş birikir)
        istatistik/OZET.md (son durum: videolar, ortalama izlenme süresi, kaydetme/paylaşım)
"""
import csv
import datetime
import json
import os
import sys
import urllib.parse
import urllib.request

TOKEN = os.environ.get("INSTAGRAM_TOKEN", "")
API = "https://graph.instagram.com/v22.0"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get("ISTATISTIK_KLASOR") or os.path.join(ROOT, "istatistik")
METRIKLER = ["views", "reach", "saved", "shares", "likes", "comments", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"]


def get(yol, **prm):
    prm["access_token"] = TOKEN
    with urllib.request.urlopen(f"{API}/{yol}?{urllib.parse.urlencode(prm)}", timeout=30) as r:
        return json.loads(r.read())


def main():
    if not TOKEN:
        sys.exit("INSTAGRAM_TOKEN yok: anahtarı depo gizli ayarlarına ekleyin.")
    os.makedirs(OUT, exist_ok=True)
    hesap = get("me", fields="username,followers_count,media_count")
    medya, sonraki = [], get("me/media", fields="id,caption,media_product_type,timestamp,permalink", limit=50)
    while True:
        medya += sonraki.get("data", [])
        url = sonraki.get("paging", {}).get("next")
        if not url or len(medya) >= 200:
            break
        with urllib.request.urlopen(url, timeout=30) as r:
            sonraki = json.loads(r.read())
    bugun = datetime.date.today().isoformat()
    satirlar = []
    for m in medya:
        if m.get("media_product_type") != "REELS":
            continue
        d = {}
        for met in METRIKLER:  # biri desteklenmezse diğerleri yine gelsin
            try:
                for x in get(f"{m['id']}/insights", metric=met).get("data", []):
                    d[x["name"]] = x["values"][0]["value"]
            except Exception as e:  # noqa: BLE001
                d[met] = ""
                print("uyarı:", m["id"], met, str(e)[:80])
        ilk = (m.get("caption") or "").split("\n")[0][:60]
        satirlar.append({"tarih": bugun, "id": m["id"], "yayin": m["timestamp"][:10], "baslik": ilk, "adres": m["permalink"],
                         "takipci": hesap.get("followers_count", ""),
                         "izlenme": d.get("views", ""), "erisim": d.get("reach", ""), "kaydetme": d.get("saved", ""),
                         "paylasim": d.get("shares", ""), "begeni": d.get("likes", ""), "yorum": d.get("comments", ""),
                         "ort_izlenme_sn": round(d["ig_reels_avg_watch_time"] / 1000, 1) if d.get("ig_reels_avg_watch_time") else "",
                         "toplam_izlenme_dk": round(d["ig_reels_video_view_total_time"] / 60000, 1) if d.get("ig_reels_video_view_total_time") else ""})
    yol = os.path.join(OUT, "reels.csv")
    yeni = not os.path.exists(yol)
    with open(yol, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(satirlar[0].keys()) if satirlar else ["tarih"])
        if yeni:
            w.writeheader()
        w.writerows(satirlar)
    ozet = [f"# @{hesap.get('username')} — {bugun}", "", f"Takipçi: **{hesap.get('followers_count')}**", "",
            "| Yayın | Video | İzlenme | Ort. izlenme (sn) | Kaydetme | Paylaşım | Beğeni |", "|---|---|---|---|---|---|---|"]
    for s in sorted(satirlar, key=lambda s: s["yayin"], reverse=True):
        ozet.append(f"| {s['yayin']} | [{s['baslik'] or s['id']}]({s['adres']}) | {s['izlenme']} | {s['ort_izlenme_sn']} | {s['kaydetme']} | {s['paylasim']} | {s['begeni']} |")
    open(os.path.join(OUT, "OZET.md"), "w", encoding="utf-8").write("\n".join(ozet) + "\n")
    print(f"{len(satirlar)} Reels kaydedildi")


if __name__ == "__main__":
    main()
