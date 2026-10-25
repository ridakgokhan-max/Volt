"""Açık arşivlerden gerçek fotoğraf ve kısa video klip adayları bulur ve indirir.

Kaynaklar (yalnızca serbest kullanım: CC0 / kamu malı; --ccby verilirse CC BY de alınır ve
kaynak/sahip bilgisi açıklamaya yazılmak üzere kaydedilir):
  - Wikimedia Commons (fotoğraf + video)
  - NASA Görsel Kütüphanesi (fotoğraf + video, kamu malı)
  - Openverse (fotoğraf)

Kullanım:
  python scripts/arsiv_ara.py <klasör> [--video] [--ccby] [--adet N] "ad|arama terimi" ...
Çıktı:
  <klasör>/<ad>_<n>.jpg  (fotoğraf)  veya  <klasör>/<ad>_<n>.mp4 (≤8 sn, 1080 genişlik, sessiz klip)
  <klasör>/adaylar.json  (dosya, kaynak, lisans, sahip, bağlantı)
  <klasör>/pafta.jpg     (tüm adayların numaralı küçük resimleri — seçim için)
"""
import json, os, re, subprocess, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "BirDakikadaBilim/1.0 (github.com/ridakgokhan-max/Volt; bilim videolari)"}
SERBEST = {"cc0", "pdm", "pd", "public domain", "cc-zero", "cc0 1.0", "public domain mark"}


def getj(url, dene=4):
    for i in range(dene):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40))
        except Exception as e:
            print("  istek hatası:", str(e)[:120]); time.sleep(6 * (i + 1))
    return None


def indir(url, yol, en_az=15000):
    try:
        b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
        if len(b) < en_az:
            return False
        open(yol, "wb").write(b)
        return True
    except Exception as e:
        print("  indirme hatası:", str(e)[:120]); return False


def lisans_uygun(lis, ccby):
    l = (lis or "").lower().strip()
    if any(s == l or l.startswith(s) for s in SERBEST) or "public domain" in l or l in ("cc0", "pdm"):
        return "serbest"
    if ccby and re.match(r"^cc[ -]by(?![ -]?(nc|nd|sa))", l):
        return "atif"
    return None


def temizle(html):
    return re.sub(r"<[^>]+>", "", html or "").strip()[:160]


# ---------------- kaynaklar ----------------

def commons(q, video, ccby, adet):
    tur = "filetype:video" if video else "filetype:bitmap"
    p = {"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
         "gsrsearch": f"{q} {tur}", "gsrlimit": 30, "prop": "imageinfo",
         "iiprop": "url|extmetadata|mime|size", "iiurlwidth": 1600}
    v = getj("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p))
    sonuc = []
    for sayfa in sorted(((v or {}).get("query", {}).get("pages", {}) or {}).values(), key=lambda s: s.get("index", 99)):
        ii = (sayfa.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        lis = md.get("LicenseShortName", {}).get("value", "")
        tur_l = lisans_uygun(lis, ccby)
        if not tur_l:
            continue
        url = ii.get("url") if video else (ii.get("thumburl") or ii.get("url"))
        if not url:
            continue
        if not video and (ii.get("width", 0) < 900):
            continue
        sonuc.append({"kaynak_site": "Wikimedia Commons", "url": url, "baslik": sayfa.get("title"),
                      "sahip": temizle(md.get("Artist", {}).get("value")), "lisans": lis, "lisans_turu": tur_l,
                      "sayfa": ii.get("descriptionurl")})
        if len(sonuc) >= adet * 2:
            break
    return sonuc


def nasa(q, video, adet):
    v = getj("https://images-api.nasa.gov/search?" + urllib.parse.urlencode({"q": q, "media_type": "video" if video else "image"}))
    sonuc = []
    for it in ((v or {}).get("collection", {}).get("items", []))[:adet * 2]:
        d = (it.get("data") or [{}])[0]
        nid = d.get("nasa_id")
        if not nid:
            continue
        varl = getj(f"https://images-api.nasa.gov/asset/{urllib.parse.quote(nid)}")
        hrefs = [x.get("href", "") for x in ((varl or {}).get("collection", {}).get("items", []))]
        if video:
            sec = [h for h in hrefs if h.endswith("~mobile.mp4")] or [h for h in hrefs if h.endswith("~small.mp4")] or [h for h in hrefs if h.endswith(".mp4")]
        else:
            sec = [h for h in hrefs if h.endswith("~large.jpg")] or [h for h in hrefs if h.endswith("~medium.jpg")] or [h for h in hrefs if h.endswith(".jpg")]
        if not sec:
            continue
        sonuc.append({"kaynak_site": "NASA", "url": sec[0].replace("http://", "https://"), "baslik": d.get("title"),
                      "sahip": d.get("center") or "NASA", "lisans": "Kamu malı (NASA)", "lisans_turu": "serbest",
                      "sayfa": f"https://images.nasa.gov/details/{nid}"})
    return sonuc


def openverse(q, ccby, adet):
    lis = "cc0,pdm,by" if ccby else "cc0,pdm"
    v = getj("https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({"q": q, "license": lis, "page_size": adet * 2, "mature": "false"}))
    sonuc = []
    for r in (v or {}).get("results", []):
        if not r.get("url"):
            continue
        l = r.get("license", "")
        sonuc.append({"kaynak_site": "Openverse", "url": r["url"], "baslik": r.get("title"), "sahip": r.get("creator"),
                      "lisans": l, "lisans_turu": "serbest" if l in ("cc0", "pdm") else "atif",
                      "sayfa": r.get("foreign_landing_url")})
    return sonuc


# ---------------- işleme ----------------

def klip_hazirla(ham, yol):
    """Videodan en hareketli 8 saniyeyi değil, baştan 1 sn sonrasından 8 sn alır; sessiz, 1080 genişlik, 30 fps."""
    sure = 0.0
    try:
        sure = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ham],
                                    capture_output=True, text=True).stdout.strip() or 0)
    except Exception:
        pass
    bas = 1.0 if sure > 10 else 0.0
    r = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", str(bas), "-i", ham, "-t", "8", "-an",
                        "-vf", "scale=1080:-2:flags=lanczos,fps=30", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
                        "-pix_fmt", "yuv420p", "-movflags", "+faststart", yol], capture_output=True)
    return r.returncode == 0 and os.path.exists(yol) and os.path.getsize(yol) > 50000


def pafta(kl, kayit):
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return
    kucuk = []
    for k in kayit:
        p = os.path.join(kl, k["dosya"])
        try:
            if p.endswith(".mp4"):
                tmp = p + ".kare.jpg"
                subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", "2", "-i", p, "-frames:v", "1", tmp])
                im = Image.open(tmp).convert("RGB"); os.remove(tmp)
            else:
                im = Image.open(p).convert("RGB")
            im.thumbnail((300, 300)); kucuk.append((k["dosya"], im))
        except Exception:
            continue
    if not kucuk:
        return
    cols = 5; rows = (len(kucuk) + cols - 1) // cols
    sh = Image.new("RGB", (cols * 310, rows * 330), "white"); d = ImageDraw.Draw(sh)
    for i, (ad, im) in enumerate(kucuk):
        x, y = (i % cols) * 310, (i // cols) * 330
        sh.paste(im, (x + 5, y + 5)); d.text((x + 6, y + 310), ad, fill="black")
    sh.save(os.path.join(kl, "pafta.jpg"), quality=80)


def main():
    arg = sys.argv[1:]
    if not arg:
        print(__doc__); sys.exit(1)
    kl = arg.pop(0); video = "--video" in arg; ccby = "--ccby" in arg
    adet = 4
    if "--adet" in arg:
        i = arg.index("--adet"); adet = int(arg[i + 1]); del arg[i:i + 2]
    arg = [a for a in arg if a not in ("--video", "--ccby")]
    os.makedirs(kl, exist_ok=True)
    yol_json = os.path.join(kl, "adaylar.json")
    kayit = json.load(open(yol_json)) if os.path.exists(yol_json) else []
    for a in arg:
        ad, q = a.split("|", 1)
        ad = re.sub(r"[^a-z0-9-]", "-", ad.lower())
        adaylar = commons(q, video, ccby, adet) + nasa(q, video, adet)
        if not video:
            adaylar += openverse(q, ccby, adet)
        n = 0
        for c in adaylar:
            if n >= adet:
                break
            if video:
                ham = os.path.join(kl, f"_ham_{ad}_{n}")
                if not indir(c["url"], ham, 100000):
                    continue
                yol = os.path.join(kl, f"{ad}_{n}.mp4")
                ok = klip_hazirla(ham, yol); os.remove(ham)
                if not ok:
                    continue
            else:
                yol = os.path.join(kl, f"{ad}_{n}.jpg")
                if not indir(c["url"], yol):
                    continue
            c.update({"dosya": os.path.basename(yol), "ad": ad, "arama": q})
            kayit.append(c); n += 1
            time.sleep(1)
        print(f"{ad}: {n} aday ({'video' if video else 'fotoğraf'})", flush=True)
    json.dump(kayit, open(yol_json, "w"), ensure_ascii=False, indent=1)
    pafta(kl, kayit)
    atif = [k for k in kayit if k.get("lisans_turu") == "atif"]
    if atif:
        print("UYARI: CC BY dosyalar kullanılırsa açıklamaya atıf eklenmeli:")
        for k in atif:
            print(f"  {k['dosya']}: {k.get('sahip')} — {k.get('lisans')} — {k.get('sayfa')}")


if __name__ == "__main__":
    main()
