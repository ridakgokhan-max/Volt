"""CC0 ses paketlerini indirir: sesler/<kaynak>/<paket>/...  (sadece kamu malı / CC0 lisanslı kaynaklar)

Kenney (kenney.nl) paket sayfasındaki zip bağlantısını bulur, indirir, ses dosyalarını çıkarır.
Kullanım: python scripts/ses_indir.py
"""
import io
import json
import os
import re
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "sesler")
KENNEY = [
    "interface-sounds", "impact-sounds", "digital-audio", "sci-fi-sounds", "ui-audio",
    "rpg-audio", "casino-audio", "music-jingles", "foley-sounds", "voiceover-pack",
]
AUDIO = (".ogg", ".wav", ".mp3", ".flac")
UA = {"User-Agent": "Mozilla/5.0 (volt-ses-indirici)"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def kenney(slug):
    page = f"https://kenney.nl/assets/{slug}"
    html = get(page).decode("utf-8", "ignore")
    m = re.search(r'href="([^"]+\.zip)"', html)
    if not m:
        raise RuntimeError("zip bağlantısı yok")
    url = m.group(1)
    if url.startswith("/"):
        url = "https://kenney.nl" + url
    lic = "CC0" if re.search(r"CC0|Creative Commons Zero|public domain", html, re.I) else "BİLİNMİYOR"
    if lic != "CC0":
        raise RuntimeError("sayfada CC0 lisansı bulunamadı, atlandı")
    z = zipfile.ZipFile(io.BytesIO(get(url)))
    d = os.path.join(OUT, "kenney", slug)
    os.makedirs(d, exist_ok=True)
    n = 0
    for info in z.infolist():
        name = info.filename
        low = name.lower()
        if low.endswith(AUDIO):
            dst = os.path.join(d, os.path.basename(name))
            with open(dst, "wb") as f:
                f.write(z.read(info))
            n += 1
        elif os.path.basename(low) in ("license.txt", "readme.txt"):
            with open(os.path.join(d, os.path.basename(name)), "wb") as f:
                f.write(z.read(info))
    json.dump({"kaynak": "Kenney", "paket": slug, "sayfa": page, "zip": url, "lisans": "CC0 1.0 (kamu malı)", "dosya": n},
              open(os.path.join(d, "kaynak.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return n


def main():
    os.makedirs(OUT, exist_ok=True)
    for slug in KENNEY:
        try:
            n = kenney(slug)
            print(f"kenney/{slug}: {n} ses")
        except Exception as e:  # noqa: BLE001
            print(f"kenney/{slug}: ATLANDI ({e})")


if __name__ == "__main__":
    main()
