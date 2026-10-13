"""Bir Dakikada Bilim — kurgu: kaydı temizler, boşlukları kısaltır, altyazı/sahne zaman çizelgesini
ve efekt+müzik miksini üretir.

Girdi : bilim/<konu>/ses.*  kelimeler.json (transkript.py)  kurgu.json  sesler.py
Çıktı : public/bilim/<konu>/mix.m4a  ses_temiz.wav   src/bilim/data/<konu>.json
Kullanım: python scripts/bilim_kurgu.py <konu>
"""
import glob
import importlib.util
import json
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bilim_ses as B  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = B.SR
PAD = 0.05
GAP = {".": 0.30, "?": 0.30, "!": 0.30, ",": 0.17, ":": 0.2, "…": 0.2}
GAP_DEF = 0.12


def decode(path):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def silences(path, db=-35, d=0.2):
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", path, "-af", f"silencedetect=noise={db}dB:d={d}", "-f", "null", "-"],
                       capture_output=True, text=True)
    out, st = [], None
    for line in r.stderr.splitlines():
        if "silence_start:" in line:
            st = float(line.split("silence_start:")[1].split()[0])
        elif "silence_end:" in line and st is not None:
            out.append((max(0.0, st), float(line.split("silence_end:")[1].split()[0])))
            st = None
    return out


def main(konu):
    D = os.path.join(ROOT, "bilim", konu)
    ses = sorted(glob.glob(os.path.join(D, "ses.*")))[0]
    K = json.load(open(os.path.join(D, "kurgu.json"), encoding="utf-8"))
    T = json.load(open(os.path.join(D, "kelimeler.json"), encoding="utf-8"))
    x = decode(ses)
    total = len(x) / SR

    # --- kelimeler ---
    words = [{"w": w["w"], "start": w["start"], "end": w["end"]} for s in T["segmentler"] for w in s["kelimeler"]]
    seen, uniq = set(), []
    for w in words:  # whisper bazen son cümleyi tekrarlar
        key = (round(w["start"], 2), w["w"])
        if key not in seen:
            seen.add(key)
            uniq.append(w)
    words = [w for i, w in enumerate(uniq) if i not in set(K.get("kelime_sil", []))]
    words += K.get("kelime_ekle", [])
    words.sort(key=lambda w: w["start"])
    # yapay zekâ seslendirmesinde metin bilinir: kelime sayısı tutuyorsa yazımı metinden al
    mt = os.path.join(D, "metin.txt")
    if os.path.exists(mt):
        toks = open(mt, encoding="utf-8").read().split()
        if len(toks) == len(words):
            for w, tok in zip(words, toks):
                w["w"] = tok
        else:
            print(f"uyarı: metin {len(toks)} kelime, transkript {len(words)} kelime; yazım düzeltilmedi")
    for i, txt in K.get("duzelt", {}).items():
        words[int(i)]["w"] = txt
    vurgu = set(v for v in K.get("vurgu", []) if isinstance(v, int))

    # --- konuşma parçaları (sessizlikler ve kesimler dışı) ---
    sil = silences(ses)
    cuts = [tuple(c) for c in K.get("kesimler", [])]
    speech, cur = [], 0.0
    for a, b in sil:
        if a > cur:
            speech.append([cur, a])
        cur = b
    if cur < total:
        speech.append([cur, total])
    pieces = []
    for a, b in speech:
        segs = [[a, b]]
        for ca, cb in cuts:
            nxt = []
            for sa, sb in segs:
                if cb <= sa or ca >= sb:
                    nxt.append([sa, sb])
                else:
                    if ca > sa:
                        nxt.append([sa, ca])
                    if cb < sb:
                        nxt.append([cb, sb])
            segs = nxt
        pieces += [s for s in segs if s[1] - s[0] > 0.06]
    # her parçanın sonundaki son kelimeye göre ara
    def gap_after(t_end):
        last = None
        for w in words:
            if w["start"] < t_end + 0.05:
                last = w
        if last is None:
            return GAP_DEF
        return GAP.get(last["w"].strip()[-1:], GAP_DEF)

    out, mapping, tnew = [], [], 0.12
    out.append(np.zeros(int(0.12 * SR)))
    for i, (a, b) in enumerate(pieces):
        a0, b0 = max(0, a - PAD), min(total, b + PAD)
        seg = x[int(a0 * SR):int(b0 * SR)].copy()
        n = len(seg)
        f = np.minimum(1, np.minimum(np.arange(n) / (0.012 * SR), (n - np.arange(n)) / (0.02 * SR)))
        out.append(seg * f)
        mapping.append((a0, b0, tnew))
        tnew += n / SR
        if i < len(pieces) - 1:
            g = gap_after(b)
            out.append(np.zeros(int(g * SR)))
            tnew += g
    out.append(np.zeros(int(0.6 * SR)))
    voice = np.concatenate(out)
    sure = len(voice) / SR

    def remap(t):
        best = None
        for a0, b0, n0 in mapping:
            if a0 <= t <= b0:
                return n0 + (t - a0)
            if t < a0:
                return n0 if best is None else best
            best = n0 + (b0 - a0)
        return best

    kel = []
    for i, w in enumerate(words):
        s, e = remap(w["start"]), remap(w["end"])
        kel.append({"w": w["w"], "s": round(s, 3), "e": round(max(e, s + 0.08), 3), "vurgu": i in vurgu})
    for i in range(len(kel) - 1):  # sıralı ve çakışmasız
        kel[i + 1]["s"] = max(kel[i + 1]["s"], kel[i]["s"] + 0.05)

    # --- altyazı satırları: cümleyi dengeli parçalara böl (satır başına ~24 harf, tek kelime kalmasın) ---
    def chars(a, b):
        return sum(len(z["w"]) + 1 for z in kel[a:b + 1])

    sents, a = [], 0
    for i, k in enumerate(kel):
        if k["w"][-1:] in ".?!" or i == len(kel) - 1:
            sents.append((a, i))
            a = i + 1
    parts = []
    for a, b in sents:  # önce uzun virgül parçaları
        st = a
        for i in range(a, b + 1):
            if kel[i]["w"][-1:] == "," and i < b and chars(st, i) >= 12 and chars(i + 1, b) >= 12:
                parts.append((st, i))
                st = i + 1
        parts.append((st, b))
    sat = []
    for a, b in parts:
        n = max(1, -(-chars(a, b) // 25))
        n = min(n, b - a + 1)
        target = chars(a, b) / n
        st, acc = a, 0
        for i in range(a, b + 1):
            acc += len(kel[i]["w"]) + 1
            left_words = b - i
            if len(sat) < 10 ** 6 and acc >= target * 0.92 and left_words >= 2 and (b - st) > 1:
                sat.append([st, i])
                st, acc = i + 1, 0
        if st <= b:
            sat.append([st, b])

    # kelimeyi metinle bul: ara("daire") -> ilk geçen kelimenin indeksi (sonra=saniye sınırı)
    def norm(x):
        return x.lower().replace("İ", "i").replace("I", "ı").strip(".,!?:;\"'…")

    def ara(txt, sonra=0.0, n=0):
        q = norm(txt)
        c = 0
        for i, k in enumerate(kel):
            if k["s"] >= sonra - 0.3 and norm(k["w"]).startswith(q):
                if c == n:
                    return i
                c += 1
        raise KeyError(f"kelime bulunamadı: {txt}")

    def idx(v, sonra=0.0):
        return v if isinstance(v, int) else ara(v, sonra)

    # --- sahneler ---
    sc = []
    for j, s in enumerate(K["sahneler"]):
        bas = 0.0 if j == 0 else round(kel[idx(s["ilk"], sc[-1]["bas"] if sc else 0)]["s"] - 0.22, 3)
        ev = {f"vur{n}": 0 for n in range(len(s.get("vur", [])))}
        sc.append({"id": s["id"], "bg": s["bg"], "bas": bas, "son": 0, "ev": ev, "_vur": s.get("vur", []), "gecis": s.get("gecis", "daire")})
    for j, s in enumerate(sc):
        s["son"] = sc[j + 1]["bas"] if j + 1 < len(sc) else round(sure, 3)
        for n, wi in enumerate(s.pop("_vur")):
            wi = idx(wi, s["bas"])
            s["ev"][f"vur{n}"] = round(kel[wi]["s"] - s["bas"], 3)

    for v in K.get("vurgu", []):
        if isinstance(v, str):
            try:
                kel[ara(v)]["vurgu"] = True
            except KeyError:
                print("uyarı: vurgu kelimesi yok:", v)
    data = {"konu": konu, "baslik": K["baslik"], "audio": f"bilim/{konu}/mix.m4a", "sure": round(sure, 3),
            "kelimeler": kel, "satirlar": sat, "sahneler": sc}
    os.makedirs(os.path.join(ROOT, "src", "bilim", "data"), exist_ok=True)
    json.dump(data, open(os.path.join(ROOT, "src", "bilim", "data", f"{konu}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # --- efekt + müzik ---
    spec = importlib.util.spec_from_file_location("sesler", os.path.join(D, "sesler.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    N = len(voice)
    sfx = np.zeros(N)
    wt = lambda i: kel[i]["s"]  # noqa: E731
    starts = {s["id"]: s["bas"] for s in sc}
    for i, s in enumerate(sc):
        if i > 0:
            B.put(sfx, s["bas"] - 0.25, B.whoosh(0.55), 0.55)
    import inspect
    if "ara" in inspect.signature(mod.cues).parameters:
        mod.cues(B, sfx, wt, starts, sure, ara=lambda txt, sonra=0.0, n=0: kel[ara(txt, sonra, n)]["s"])
    else:
        mod.cues(B, sfx, wt, starts, sure)
    mus = B.music(sure, full_from=sc[1]["bas"] if len(sc) > 1 else 3.0, outro_at=max(sure - 2.6, 5))

    pub = os.path.join(ROOT, "public", "bilim", konu)
    os.makedirs(pub, exist_ok=True)
    tmp = "/tmp/bilim_" + konu
    os.makedirs(tmp, exist_ok=True)
    import wave

    def save(p, sig):
        sig = np.clip(sig, -1, 1)
        with wave.open(p, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((sig * 32767).astype(np.int16).tobytes())

    save(f"{tmp}/voice.wav", B.norm(voice, 0.9))
    save(f"{tmp}/sfx.wav", B.norm(sfx, 0.8))
    save(f"{tmp}/music.wav", B.norm(mus, 0.8))
    fc = ("[0:a]highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-16:TP=-2:LRA=9,"
          "aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vk];"
          "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.30[m];"
          "[m][vk]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=400[md];"
          "[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.62[s];"
          "[v][md][s]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-2:LRA=11,alimiter=limit=0.8:level=false[out]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{tmp}/voice.wav", "-i", f"{tmp}/music.wav", "-i", f"{tmp}/sfx.wav",
                    "-filter_complex", fc, "-map", "[out]", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", os.path.join(pub, "mix.m4a")], check=True)
    print(f"{konu}: {total:.1f} sn kayıt -> {sure:.1f} sn video, {len(kel)} kelime, {len(sat)} altyazı satırı, {len(sc)} sahne")


if __name__ == "__main__":
    main(sys.argv[1])
