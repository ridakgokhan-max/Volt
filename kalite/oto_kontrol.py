"""Render sonrası otomatik kalite kontrolü: video bitince kendini 'izler ve dinler', hata arar.

Kullanım: python kalite/oto_kontrol.py <konu> [--whisper]
Kontroller:
  1. Teknik: 1080x1920, 30 fps, ses var, süre 15–90 sn
  2. Görüntü: siyah kare, donmuş kare (≥1 sn), 'ölü an' (≥1 sn hareketsiz; altyazı bandı hariç)
  3. Ses: yükseklik (hedef -14 LUFS ±2), tepe (≤ -1 dBTP), konuşma içinde uzun sessizlik, sondaki sessizlik
  4. Söz (--whisper): son videonun sesi yeniden yazıya dökülür, metin.txt ile karşılaştırılır →
     kalan tekrarlar, eksik/fazla kelimeler
Çıktı: kalite/rapor/<konu>.md ve .json; sonuç satırı: GEÇTİ / UYARI / KALDI
"""
import difflib, json, os, re, subprocess, sys
import numpy as np

konu = sys.argv[1]
WHISPER = "--whisper" in sys.argv
V = f"out/bilim/{konu}.mp4"
os.makedirs("kalite/rapor", exist_ok=True)
bulgular = []  # (seviye, alan, mesaj)


def ekle(sev, alan, msg):
    bulgular.append({"seviye": sev, "alan": alan, "mesaj": msg})
    print(f"[{sev}] {alan}: {msg}", flush=True)


def ff(args):
    return subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", V] + args + ["-f", "null", "-"],
                          capture_output=True, text=True).stderr


if not os.path.exists(V):
    ekle("KALDI", "Teknik", f"{V} bulunamadı — render başarısız")
    json.dump({"konu": konu, "sonuc": "KALDI", "bulgular": bulgular}, open(f"kalite/rapor/{konu}.json", "w"), ensure_ascii=False, indent=1)
    sys.exit(0)

# ---- 1. teknik ----
pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", V],
                               capture_output=True, text=True).stdout)
vs = [s for s in pr["streams"] if s["codec_type"] == "video"]
au = [s for s in pr["streams"] if s["codec_type"] == "audio"]
sure = float(pr["format"]["duration"])
if not vs or (vs[0]["width"], vs[0]["height"]) != (1080, 1920):
    ekle("KALDI", "Teknik", f"çözünürlük 1080x1920 değil: {vs[0]['width']}x{vs[0]['height']}" if vs else "görüntü yok")
fps = eval(vs[0].get("r_frame_rate", "30/1")) if vs else 0
if abs(fps - 30) > 0.5:
    ekle("UYARI", "Teknik", f"kare hızı {fps:.2f} (beklenen 30)")
if not au:
    ekle("KALDI", "Teknik", "ses kanalı yok")
if not 15 <= sure <= 90:
    ekle("UYARI", "Teknik", f"süre {sure:.1f} sn (Reels için 15–90 önerilir)")

# ---- 2. görüntü ----
err = ff(["-vf", "blackdetect=d=0.25:pix_th=0.06"])
for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+)", err):
    ekle("KALDI", "Görüntü", f"siyah ekran {float(m.group(1)):.2f}–{float(m.group(2)):.2f} sn")
err = ff(["-vf", "scale=270:480,freezedetect=n=0.002:d=1.0", "-an"])
for m in re.finditer(r"freeze_start: ([\d.]+).*?freeze_end: ([\d.]+)", err, re.S):
    ekle("KALDI", "Görüntü", f"donmuş görüntü {float(m.group(1)):.2f}–{float(m.group(2)):.2f} sn")

W, H, FPS = 108, 192, 10
raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", V, "-vf", f"fps={FPS},scale={W}:{H},format=gray",
                      "-f", "rawvideo", "-"], capture_output=True).stdout
k = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)
maske = np.ones((H, W), bool); maske[int(H * 1220 / 1920):int(H * 1380 / 1920), :] = False
fark = np.array([np.abs(k[i] - k[i - 1])[maske].mean() for i in range(1, len(k))])
pen = FPS // 2
skor = [fark[i:i + pen].mean() for i in range(0, len(fark) - pen + 1, pen)]
olu, bas = [], None
for j, s in enumerate(skor + [99]):
    t = j * 0.5
    if s < 1.2:
        bas = t if bas is None else bas
    else:
        if bas is not None and t - bas >= 1.0:
            olu.append((bas, t))
        bas = None
for a, b in olu:
    ekle("KALDI", "Hareket", f"ölü an {a:.1f}–{b:.1f} sn (ekran neredeyse duruyor)")
hareket_ort = float(np.mean(skor)) if skor else 0

# ---- 3. ses ----
err = ff(["-vn", "-af", "ebur128=peak=true"])
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)
TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)
lufs = float(I[-1]) if I else None
tp = float(TP[-1]) if TP else None
if lufs is not None and abs(lufs + 14) > 2:
    ekle("UYARI", "Ses", f"ses yüksekliği {lufs:.1f} LUFS (hedef -14 ±2)")
if tp is not None and tp > -1.0:
    ekle("UYARI", "Ses", f"tepe {tp:.1f} dBTP (≤ -1 olmalı, bozulma riski)")

# konuşma bandındaki sessizlikler: müzik altta kaldığı için konuşma aralığını 300–3400 Hz ile süzüp ölç
err = ff(["-vn", "-af", "highpass=f=300,lowpass=f=3400,silencedetect=n=-38dB:d=1.2"])
ss = [(float(a), float(b)) for a, b in re.findall(r"silence_start: ([\d.]+).*?silence_end: ([\d.]+)", err, re.S)]
for a, b in ss:
    if a > 1.0 and b < sure - 1.5:
        ekle("UYARI", "Ses kurgusu", f"konuşmada {b - a:.1f} sn boşluk ({a:.1f}–{b:.1f})")
son = re.findall(r"silence_start: ([\d.]+)\s*$", err.strip(), re.M)
D = {}
dp = f"src/bilim/data/{konu}.json"
if os.path.exists(dp):
    D = json.load(open(dp))

# ---- 4. söz kontrolü ----
metin_p = f"bilim/{konu}/metin.txt"
if WHISPER and os.path.exists(metin_p):
    from faster_whisper import WhisperModel
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", V, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    model = WhisperModel("large-v3", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, language="tr", word_timestamps=True, beam_size=5, vad_filter=True,
                               initial_prompt="Konuşmayı aynen yaz: tekrarları ve yarım kelimeleri de yaz.")
    duyulan = []
    for s in segs:
        for w in s.words or []:
            duyulan.append((w.word.strip(), w.start))

    def norm(x):
        return re.sub(r"[^\wçğıöşü0-9]", "", x.lower().replace("İ", "i").replace("I", "ı"))

    hk = [(norm(w), t) for w, t in duyulan if norm(w)]
    _metin = open(metin_p).read()
    _kp = f"bilim/{konu}/kurgu.json"
    if os.path.exists(_kp):  # ön kayıt (ör. saçma giriş) metni de beklenen konuşmaya eklenir
        _ok = json.load(open(_kp)).get("on_kayit")
        if _ok and os.path.exists(_ok.get("metin", "")):
            _metin = open(_ok["metin"]).read() + " " + _metin
    bk = [norm(w) for w in _metin.split() if norm(w)]
    # kalan tekrar: aynı 3+ kelimelik öbek arka arkaya iki kez
    for n in (5, 4, 3):
        i = 0
        while i + 2 * n <= len(hk):
            a = [x[0] for x in hk[i:i + n]]; b = [x[0] for x in hk[i + n:i + 2 * n]]
            if a == b:
                ekle("KALDI", "Ses kurgusu", f"tekrar kalmış: '{' '.join(a)}' ({hk[i][1]:.1f} sn civarı)")
                i += 2 * n
            else:
                i += 1
    sm = difflib.SequenceMatcher(None, bk, [x[0] for x in hk], autojunk=False)
    oran = sm.ratio()
    for op, a1, a2, b1, b2 in sm.get_opcodes():
        if op == "equal":
            continue
        t = hk[min(b1, len(hk) - 1)][1] if hk else 0
        beklenen, duy = " ".join(bk[a1:a2]), " ".join(x[0] for x in hk[b1:b2])
        if op == "delete" and a2 - a1 >= 2:
            ekle("UYARI", "Söz", f"metinde olup duyulmayan: '{beklenen}' (~{t:.1f} sn)")
        elif op == "insert" and b2 - b1 >= 2:
            ekle("UYARI", "Söz", f"metinde olmayan fazladan söz: '{duy}' (~{t:.1f} sn)")
        elif op == "replace" and max(a2 - a1, b2 - b1) >= 3:
            ekle("UYARI", "Söz", f"farklı duyuluyor: metin '{beklenen}' ↔ duyulan '{duy}' (~{t:.1f} sn)")
    if oran < 0.85:
        ekle("KALDI", "Söz", f"duyulan konuşma metne yalnızca %{oran * 100:.0f} benziyor")
    else:
        ekle("BİLGİ", "Söz", f"duyulan konuşma metinle %{oran * 100:.0f} uyumlu")

# ---- sonuç ----
sev = [b["seviye"] for b in bulgular]
sonuc = "KALDI" if "KALDI" in sev else ("UYARI" if "UYARI" in sev else "GEÇTİ")
ozet = {"konu": konu, "sonuc": sonuc, "sure": round(sure, 2), "lufs": lufs, "tepe_dbtp": tp,
        "hareket_ortalama": round(hareket_ort, 2), "bulgular": bulgular}
json.dump(ozet, open(f"kalite/rapor/{konu}.json", "w"), ensure_ascii=False, indent=1)
satir = [f"# Otomatik kalite kontrolü — {konu}", "", f"**Sonuç: {sonuc}**", "",
         f"- Süre: {sure:.1f} sn · Ses: {lufs} LUFS, tepe {tp} dBTP · Ortalama hareket: {hareket_ort:.2f}", ""]
satir += [f"- **{b['seviye']}** · {b['alan']}: {b['mesaj']}" for b in bulgular] or ["- Sorun bulunmadı."]
open(f"kalite/rapor/{konu}.md", "w").write("\n".join(satir) + "\n")
if os.environ.get("GITHUB_STEP_SUMMARY"):
    open(os.environ["GITHUB_STEP_SUMMARY"], "a").write("\n".join(satir) + "\n")
print("SONUÇ:", sonuc)
