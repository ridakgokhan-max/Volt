"""sesler/ altındaki her sesi süre, ses düzeyi, kategori, lisans ve kaynakla sesler/katalog.json'a yazar.
Ayrıca sesler/KATALOG.md (insan için okunur liste) üretir.
"""
import glob
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "sesler")
AUDIO = (".ogg", ".wav", ".mp3", ".flac")

# dosya adındaki İngilizce kelimelerden Türkçe kategori
KAT = [
    ("tik", r"click|tick|tap|select|switch|toggle"),
    ("bip", r"beep|blip|bong|confirm|error|glitch|notification|ping"),
    ("darbe", r"impact|punch|hit|thud|knock|slam|footstep"),
    ("metal", r"metal|chain|anvil|sword|knife"),
    ("kagit", r"paper|page|book|cloth|card"),
    ("lazer", r"laser|zap|phaser|shot|engine|thruster|forcefield|computer|space"),
    ("dijital", r"digital|powerup|power_up|power-up|tone|pep|zap|twoTone|threeTone|phase"),
    ("kapi", r"door|lock|creak|drawer"),
    ("para", r"coin|chip|dice|handle"),
    ("ziplama", r"jump|bounce|drop|pluck|maximize|minimize|open|close"),
    ("muzik", r"jingle|music|loop|win|lose|success"),
]


def dur(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True)
    try:
        return round(float(r.stdout.strip()), 3)
    except ValueError:
        return 0.0


def kategori(path):
    name = os.path.basename(path).lower() + " " + os.path.basename(os.path.dirname(path)).lower()
    for k, rx in KAT:
        if re.search(rx, name, re.I):
            return k
    return "diger"


def main():
    items = []
    for kj in sorted(glob.glob(os.path.join(S, "**", "kaynak.json"), recursive=True)):
        meta = json.load(open(kj, encoding="utf-8"))
        d = os.path.dirname(kj)
        for f in sorted(os.listdir(d)):
            if not f.lower().endswith(AUDIO) or f.lower().startswith("preview"):
                continue
            p = os.path.join(d, f)
            rel = os.path.relpath(p, ROOT)
            items.append({
                "ad": os.path.splitext(f)[0], "dosya": rel, "kategori": kategori(p), "sure": dur(p),
                "paket": meta["paket"], "kaynak": meta["kaynak"], "sayfa": meta["sayfa"], "lisans": meta["lisans"],
            })
    json.dump({"ses_sayisi": len(items), "sesler": items}, open(os.path.join(S, "katalog.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    by = {}
    for it in items:
        by.setdefault(it["kategori"], []).append(it)
    lines = ["# Ses kütüphanesi", "", f"Toplam **{len(items)}** ses. Hepsi CC0 (kamu malı): ticari kullanım serbest, kaynak belirtmek gerekmez, depoda paylaşmak serbest.", "",
             "Videolarda `scripts/bilim_ses.py` içindeki `ornek()` ile kullanılır. Her kullanımda perde ve ses düzeyi hafifçe değiştirilir.", ""]
    lines += ["| Kategori | Ses sayısı | Örnekler |", "|---|---|---|"]
    for k in sorted(by):
        ex = ", ".join(sorted({i["ad"] for i in by[k]})[:6])
        lines.append(f"| {k} | {len(by[k])} | {ex} |")
    lines += ["", "## Paketler", ""]
    for kj in sorted(glob.glob(os.path.join(S, "**", "kaynak.json"), recursive=True)):
        m = json.load(open(kj, encoding="utf-8"))
        lines.append(f"- [{m['kaynak']} — {m['paket']}]({m['sayfa']}): {m['dosya']} ses, lisans: {m['lisans']}")
    open(os.path.join(S, "KATALOG.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"katalog: {len(items)} ses, {len(by)} kategori")
    for k in sorted(by):
        print(f"  {k}: {len(by[k])}")


if __name__ == "__main__":
    main()
