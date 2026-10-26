"""Bir Dakikada Bilim — kurgu: kaydı temizler, boşlukları kısaltır, altyazı/sahne zaman çizelgesini
ve efekt+müzik miksini üretir.

Girdi : bilim/<konu>/ses.*  kelimeler.json (transkript.py)  kurgu.json  sesler.py
Çıktı : public/bilim/<konu>/mix.m4a  ses_temiz.wav   src/bilim/data/<konu>.json
Kullanım: python scripts/bilim_kurgu.py <konu>
"""
import glob
import importlib.util
import json, re
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bilim_ses as B  # noqa: E402
import ses_temizle  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = B.SR
PAD = 0.05
GAP = {".": 0.30, "?": 0.30, "!": 0.30, ",": 0.17, ":": 0.2, "…": 0.2}
GAP_DEF = 0.12
KISA_KELIME = {"bir", "ve", "bu", "o", "şu", "ile", "ya", "ne", "iki", "üç", "dört", "beş"}


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
    # kayıt önce temizlenir (EQ, kapı, 's' yumuşatma, sıkıştırma); yapay zekâ seslendirmesi zaten temiz
    if K.get("temizle", not os.path.exists(os.path.join(D, "metin.txt"))):
        ses_temiz = f"/tmp/temiz_{konu}.wav"
        ses_temizle.temizle(ses, ses_temiz)
        x = decode(ses_temiz)
    else:
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
    # metin.txt varsa (okunan metin) yazım metinden alınır: transkript metinle hizalanır,
    # kelime sayıları tutmayan yerlerde zamanlar birleştirilir ya da bölünür
    mt = os.path.join(D, "metin.txt")
    if os.path.exists(mt):
        import difflib
        toks = open(mt, encoding="utf-8").read().split()
        key = lambda z: z.replace("İ", "i").replace("I", "ı").lower().strip(".,:;!?\"'…").replace("â", "a").replace("'", "")
        sm = difflib.SequenceMatcher(a=[key(w["w"]) for w in words], b=[key(t) for t in toks], autojunk=False)
        out_w = []
        for op, a0, a1, b0, b1 in sm.get_opcodes():
            src, dst = words[a0:a1], toks[b0:b1]
            if op == "equal" or (op == "replace" and len(src) == len(dst)):
                for w, tok in zip(src, dst):
                    out_w.append({"w": tok, "start": w["start"], "end": w["end"]})
            elif op == "replace" or op == "insert":
                if src:
                    st, en = src[0]["start"], src[-1]["end"]
                else:
                    st = out_w[-1]["end"] if out_w else 0.0
                    en = st + 0.25 * len(dst)
                for k, tok in enumerate(dst):
                    out_w.append({"w": tok, "start": st + (en - st) * k / len(dst), "end": st + (en - st) * (k + 1) / len(dst)})
            # "delete": metinde olmayan konuşma (kekeleme vb.) altyazıya girmez
        print(f"metinle hizalandı: transkript {len(words)} -> metin {len(out_w)} kelime")
        words = out_w
    # --- ön kayıt (ör. "saçma giriş" cümlesi, ayrı kayıt/klon): sesin başına eklenir ---
    on_ses, on_kel = None, []
    OK = K.get("on_kayit")
    if OK and os.path.exists(OK["ses"]):
        on_ses = decode(OK["ses"])
        on_parca_bl = None
        if OK.get("parcalar"):  # klonun yalnızca temiz parçalarını al (aradaki anlamsız sesleri at)
            yeni, on_parca_bl, tt = [], [], 0.0
            for j, (pa, pb) in enumerate(OK["parcalar"]):
                seg = on_ses[int(pa * SR):int(pb * SR)].copy()
                n = len(seg); f = np.minimum(1, np.minimum(np.arange(n) / (0.01 * SR), (n - np.arange(n)) / (0.03 * SR)))
                yeni.append(seg * f); on_parca_bl.append((tt, tt + n / SR)); tt += n / SR
                if j < len(OK["parcalar"]) - 1:
                    gg = float(OK.get("parca_bosluk", 0.22)); yeni.append(np.zeros(int(gg * SR))); tt += gg
            on_ses = np.concatenate(yeni)
        # baş/son sessizliği kırp
        e = np.abs(on_ses) > 0.02
        if e.any() and on_parca_bl is None:
            i0, i1 = np.argmax(e), len(e) - np.argmax(e[::-1])
            on_ses = on_ses[max(0, i0 - int(0.03 * SR)):min(len(on_ses), i1 + int(0.08 * SR))]
        # ses yüksekliğini ana kayda eşitle (konuşma RMS)
        ana = x[np.abs(x) > 0.02]; onk = on_ses[np.abs(on_ses) > 0.02]
        if len(ana) and len(onk):
            on_ses = on_ses * float(np.sqrt(np.mean(ana ** 2)) / np.sqrt(np.mean(onk ** 2)))
        # kelime zamanları: enerji bloklarını cümle sayısına göre grupla, kelimeleri harf payına göre dağıt
        hop = SR // 100
        nz = len(on_ses) // hop
        zr = np.sqrt(np.mean(on_ses[:nz * hop].reshape(nz, hop) ** 2, axis=1))
        th = max(zr.max() * 0.06, 1e-4)
        bl, bas = [], None
        for j, v in enumerate(list(zr > th) + [False]):
            if v and bas is None: bas = j
            if not v and bas is not None:
                if bl and j / 100 - bl[-1][1] < 0.12: bl[-1] = (bl[-1][0], j / 100)
                else: bl.append((bas / 100, j / 100))
                bas = None
        if on_parca_bl is not None:
            kay = (np.argmax(np.abs(decode(OK["ses"])) > 0.02) / SR) if False else 0.0
            bl = on_parca_bl
        cum = [c.strip() for c in re.split(r"(?<=[.!?])\s+", open(OK["metin"], encoding="utf-8").read().strip()) if c.strip()]
        while len(bl) > len(cum):  # en kısa aralığı birleştir
            k = min(range(len(bl) - 1), key=lambda q: bl[q + 1][0] - bl[q][1])
            bl[k:k + 2] = [(bl[k][0], bl[k + 1][1])]
        if len(bl) < len(cum):  # yetersiz blok: tek blok kabul et, süreyi harfe göre böl
            bl = [(bl[0][0] if bl else 0.0, bl[-1][1] if bl else len(on_ses) / SR)]; cum = [" ".join(cum)]
        if OK.get("kelimeler") and on_parca_bl is not None:  # bilinen (whisper) kelime zamanları: klon zamanını yeni zamana çevir
            for w, ws_, we_ in OK["kelimeler"]:
                for (pa, pb), (na, nb) in zip(OK["parcalar"], on_parca_bl):
                    if pa - 0.05 <= ws_ <= pb:
                        on_kel.append({"w": w, "start": -1000 + na + (ws_ - pa), "end": -1000 + na + (min(we_, pb) - pa)}); break
            cum = []
        for (ba, bb), c in zip(bl, cum):
            ks = c.split(); top = sum(len(k) for k in ks); t0 = ba
            for k in ks:
                d = (bb - ba) * len(k) / top
                on_kel.append({"w": k, "start": -1000 + t0, "end": -1000 + t0 + d * 0.92}); t0 += d
        words = on_kel + words
        print(f"ön kayıt: {len(on_ses) / SR:.2f} sn, {len(on_kel)} kelime")
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
        for zt, zg in K.get("aralar", []):  # kurgu.json ile elle zorlanan cümle arası (ham saniye)
            if abs(zt - t_end) < 0.4:
                return float(zg)
        if last is None:
            return GAP_DEF
        return GAP.get(last["w"].strip()[-1:], GAP_DEF)

    # açılış: videonun en çarpıcı anı başta kısaca gösterilir, ses ondan sonra başlar
    AC = float(K["acilis"]["sure"]) if K.get("acilis") else 0.0
    out, mapping, tnew = [], [], 0.12 + AC
    out.append(np.zeros(int((0.12 + AC) * SR)))
    if on_ses is not None:
        out.append(on_ses); mapping.append((-1000.0, -1000.0 + len(on_ses) / SR, tnew)); tnew += len(on_ses) / SR
        g = float(OK.get("bosluk", 0.35)); out.append(np.zeros(int(g * SR))); tnew += g
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
    out.append(np.zeros(int(float(K.get("son_bosluk", 0.6)) * SR)))  # sondaki boşluk (takip çağrısı için uzatılabilir)
    voice = np.concatenate(out)
    sure = len(voice) / SR

    def remap(t, bas=False):
        # bas=True (kelime başı): sessizlik/kesim içine düşen başlangıç bir SONRAKİ parçanın başına gider
        # (whisper kesim sonrası ilk kelimeyi erken başlatır); kelime sonu ise önceki parçanın sonunda kalır
        best = None
        for a0, b0, n0 in mapping:
            if a0 <= t <= b0:
                return n0 + (t - a0)
            if t < a0:
                return n0 if (best is None or bas) else best
            best = n0 + (b0 - a0)
        return best

    kel = []
    for i, w in enumerate(words):
        s, e = remap(w["start"], bas=True), remap(w["end"])
        kel.append({"w": w["w"], "s": round(s, 3), "e": round(max(e, s + 0.08), 3), "vurgu": i in vurgu})
    # ses başlangıcına oturtma: kelime başı sessizliğe düşüyorsa 0,7 sn içindeki ilk ses başlangıcına kaydır
    hop10 = SR // 100
    nz = len(voice) // hop10
    zarf = np.sqrt(np.mean(voice[:nz * hop10].reshape(nz, hop10) ** 2, axis=1))
    esik = np.percentile(zarf[zarf > 1e-5], 60) * 0.12 if np.any(zarf > 1e-5) else 0.0
    oturan = 0
    def it_sonraki(ix):  # kaydırılan kelimenin ardından gelen kelime en az kelime süresi kadar sonra başlasın
        if ix + 1 < len(kel):
            k0, k1 = kel[ix], kel[ix + 1]
            k1["s"] = max(k1["s"], round(k0["s"] + max(0.15, 0.06 * len(k0["w"])), 3))
            k1["e"] = max(k1["e"], k1["s"] + 0.1)
            k0["e"] = min(k0["e"], k1["s"]) if k0["e"] > k1["s"] else k0["e"]
    for ix, k in enumerate(kel):
        i0 = int(k["s"] * 100)
        # kelime başından sonraki 0,45 sn içinde ≥150 ms sessizlik varsa kelime aslında o sessizlikten sonra başlıyor
        # (whisper başlangıcı bir önceki kelimenin kuyruğuna koymuş)
        if 0 <= i0 < nz and zarf[max(0, i0 - 2):i0 + 3].max() >= esik:
            j, sus = i0, 0
            while j < min(nz, i0 + 60):
                sus = sus + 1 if zarf[j] < esik else 0
                if sus >= 15:
                    break
                j += 1
            if sus >= 15:
                sus_bas = j - 15
                while j < min(nz, i0 + 120) and zarf[j] < esik:
                    j += 1
                # yalnızca kelimenin (whisper) sonu sessizliğin içine taşıyorsa: gerçek başlangıç sessizlikten sonradır
                if j < min(nz, i0 + 120) and k["e"] * 100 > sus_bas + 5:
                    yeni = round(j / 100 - 0.02, 3)
                    k["e"] = max(k["e"], yeni + 0.15)
                    k["s"] = yeni
                    oturan += 1
                    it_sonraki(ix)
                    continue
        if 0 <= i0 < nz and zarf[max(0, i0 - 2):i0 + 3].max() < esik:
            j = i0
            while j < min(nz, i0 + 120) and zarf[j] < esik:
                j += 1
            if j < min(nz, i0 + 120):
                yeni = round(j / 100 - 0.02, 3)
                k["e"] = max(k["e"], yeni + 0.12)
                k["s"] = yeni
                oturan += 1
                it_sonraki(ix)
    print(f"ses başlangıcına oturtulan kelime: {oturan}")
    for i in range(len(kel) - 1):  # sıralı ve çakışmasız
        kel[i + 1]["s"] = max(kel[i + 1]["s"], kel[i]["s"] + 0.05)
        if kel[i]["e"] > kel[i + 1]["s"]:
            kel[i]["e"] = kel[i + 1]["s"]
        kel[i + 1]["e"] = max(kel[i + 1]["e"], kel[i + 1]["s"] + 0.08)

    # --- altyazı satırları: cümleyi dengeli parçalara böl (satır başına ~24 harf, tek kelime kalmasın) ---
    def chars(a, b):
        return sum(len(z["w"]) + 1 for z in kel[a:b + 1])

    sents, a = [], 0
    for i, k in enumerate(kel):
        if k["w"].rstrip('"”’\'')[-1:] in ".?!" or i == len(kel) - 1:
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
    BAGLAR = {x.lower() for x in K.get("baglar", [])}
    # elle zorunlu satır sonu: kurgu.json "kir_sonra": ["kelime", ["kelime", n], ...] (n. geçişinden sonra)
    ZORUNLU = set()
    for z in K.get("kir_sonra", []):
        hedef, sira = (z[0], z[1]) if isinstance(z, list) else (z, 0)
        c = 0
        for ii, kk in enumerate(kel):
            if kk["w"].lower().strip(",.!?:;\"") == hedef.lower():
                if c == sira:
                    ZORUNLU.add(ii); break
                c += 1
    for a, b in parts:
        n = max(1, -(-chars(a, b) // 25))
        n = min(n, b - a + 1)
        target = chars(a, b) / n
        st, acc = a, 0
        for i in range(a, b + 1):
            acc += len(kel[i]["w"]) + 1
            if i in ZORUNLU and i < b:
                sat.append([st, i])
                st, acc = i + 1, 0
                continue
            left_words = b - i
            kalan_ok = left_words >= 2 or (left_words == 1 and len(kel[b]["w"]) >= 9)
            tirnak_acik = sum(z["w"].count('"') + z["w"].count('“') + z["w"].count('”') for z in kel[st:i + 1]) % 2 == 1
            kisa_son = kel[i]["w"].lower().strip(",") in KISA_KELIME
            bagli = i < b and f'{kel[i]["w"].lower().strip(",.")} {kel[i + 1]["w"].lower().strip(",.")}' in BAGLAR
            if acc >= target * 0.92 and kalan_ok and (b - st) > 1 and not tirnak_acik and bagli:
                # öbek bölünmesin: geriye doğru kısa kelime olmayan ilk yerde böl
                j = i - 1
                while j > st and kel[j]["w"].lower().strip(",") in KISA_KELIME:
                    j -= 1
                if j > st:
                    sat.append([st, j])
                    st, acc = j + 1, sum(len(z["w"]) + 1 for z in kel[j + 1:i + 1])
                    continue
            if acc >= target * 0.92 and kalan_ok and (b - st) > 1 and not tirnak_acik and not kisa_son and not bagli:
                sat.append([st, i])
                st, acc = i + 1, 0
        if st <= b:
            sat.append([st, b])

    # göz kırpan kartları birleştir: tek kelimelik ya da 0,7 sn'den kısa kart, aynı cümledeki komşusuyla (en fazla ~40 harf)
    def ksure(seg):
        return kel[seg[1]].get("e", kel[seg[1]]["s"] + 0.3) - kel[seg[0]]["s"]
    birlesti = True
    while birlesti:
        birlesti = False
        for idx, (x0, y0) in enumerate(sat):
            if not (y0 == x0 or ksure((x0, y0)) < 0.7):
                continue
            aday = []
            son_harf = lambda w: w.rstrip('"”’\'')[-1:]
            if idx > 0 and son_harf(kel[sat[idx - 1][1]]["w"]) not in ".?!" and sat[idx - 1][1] not in ZORUNLU:
                aday.append(idx - 1)
            if idx + 1 < len(sat) and son_harf(kel[y0]["w"]) not in ".?!" and y0 not in ZORUNLU:
                aday.append(idx + 1)
            aday.sort(key=lambda c: chars(min(sat[c][0], x0), max(sat[c][1], y0)))
            for c in aday:
                a2, b2 = min(sat[c][0], x0), max(sat[c][1], y0)
                if chars(a2, b2) <= 48:
                    sat[min(c, idx)] = [a2, b2]
                    del sat[max(c, idx)]
                    birlesti = True
                    break
            if birlesti:
                break

    # kelimeyi metinle bul: ara("daire") -> ilk geçen kelimenin indeksi (sonra=saniye sınırı)
    def norm(x):
        return x.replace("İ", "i").replace("I", "ı").lower().strip(".,!?:;\"'…")

    def ara(txt, sonra=0.0, n=0):
        tam = txt.startswith("=")  # "=ama": tam eşleşme
        q = norm(txt.lstrip("="))
        c = 0
        for i, k in enumerate(kel):
            if k["s"] >= sonra - 0.3 and (norm(k["w"]) == q if tam else norm(k["w"]).startswith(q)):
                if c == n:
                    return i
                c += 1
        raise KeyError(f"kelime bulunamadı: {txt}")

    def idx(v, sonra=0.0):  # int: kelime sırası, "kelime", ya da ["kelime", n]: n. geçişi
        if isinstance(v, int):
            return v
        if isinstance(v, list):
            return ara(v[0], sonra, v[1])
        return ara(v, sonra)

    # --- sahneler ---
    sc = []
    for j, s in enumerate(K["sahneler"]):
        bas = AC if j == 0 else round(kel[idx(s["ilk"], sc[-1]["bas"] if sc else 0)]["s"] - 0.22, 3)
        ev = {f"vur{n}": 0 for n in range(len(s.get("vur", [])))}
        sc.append({"id": s["id"], "bg": s["bg"], "bas": bas, "son": 0, "ev": ev, "_vur": s.get("vur", []), "gecis": s.get("gecis", "daire"), **{a: s[a] for a in ("gorsel", "video", "video_kutu", "derinlik") if s.get(a)}})
    for j, s in enumerate(sc):
        s["son"] = sc[j + 1]["bas"] if j + 1 < len(sc) else round(sure, 3)
        for n, wi in enumerate(s.pop("_vur")):
            wi = idx(wi, s["bas"])
            s["ev"][f"vur{n}"] = round(kel[wi]["s"] - s["bas"], 3)

    for v in K.get("vurgu", []):
        if isinstance(v, str):
            try:
                ex = [i for i, k in enumerate(kel) if norm(k["w"]) == norm(v)]
                kel[ex[0] if ex else ara(v)]["vurgu"] = True
            except KeyError:
                print("uyarı: vurgu kelimesi yok:", v)
    # --- ağız zarfı: Meraklı'nın dudak senkronu için kare başına ses şiddeti (0..1, 30 kare/sn) ---
    hop = SR // 30
    nfr = len(voice) // hop
    rms = np.sqrt(np.mean(voice[:nfr * hop].reshape(nfr, hop) ** 2, axis=1))
    ref = np.percentile(rms[rms > 1e-4], 92) if np.any(rms > 1e-4) else 1.0
    env = np.clip((rms / max(ref, 1e-6) - 0.08) / 0.92, 0, 1) ** 0.8
    sm = np.copy(env)
    for i in range(1, nfr):  # hızlı açılış, yavaş kapanış
        sm[i] = env[i] if env[i] > sm[i - 1] else sm[i - 1] * 0.55 + env[i] * 0.45
    data = {"konu": konu, "baslik": K["baslik"], "audio": f"bilim/{konu}/mix.m4a", "sure": round(sure, 3),
            "kelimeler": kel, "satirlar": sat, "sahneler": sc, "agiz": [round(float(v), 2) for v in sm]}
    for alan in ("seri", "kanca", "dongu", "acilis", "imza", "arka"):  # büyüme özellikleri: seri rozeti, kanca, döngü sonu, açılış
        if alan in K:
            data[alan] = dict(K[alan]) if isinstance(K[alan], dict) else K[alan]
    # etkileşim çağrısı (beğen / yorum / takip): {"tur", "kelime" [, "n", "ofset", "yazi"]} ya da {"tur", "son": true}
    if K.get("cta"):
        cta = []
        son_kelime = kel[-1]["e"]
        for c in K["cta"]:
            if c.get("son"):
                bas = son_kelime + float(c.get("ofset", 0.15))
            else:
                bas = kel[ara(c["kelime"], 0, c.get("n", 0))]["e"] + float(c.get("ofset", 0.1))
            if not c.get("son") and K.get("cta_bosluk", False):
                # dokunuş (bas+1.25) bir konuşma boşluğuna (≥0,3 sn) denk gelecek şekilde kaydır
                bos = [((kel[i]["e"] + kel[i + 1]["s"]) / 2) for i in range(len(kel) - 1) if kel[i + 1]["s"] - kel[i]["e"] >= 0.3]
                aday = [m for m in bos if m - 1.25 >= bas - 1.0]
                if aday:
                    m = min(aday, key=lambda m: abs(m - (bas + 1.25)))
                    bas = m - 1.25
            d = {"tur": c["tur"], "bas": round(bas, 3)}
            for alan in ("yazi", "kostum"):
                if c.get(alan) or K.get("cta_kostum") and alan == "kostum":
                    d[alan] = c.get(alan) or K.get("cta_kostum")
            cta.append(d)
        data["cta"] = cta
        print("CTA:", cta)
    if AC:  # açılış anı bir kelimeyle verildiyse sahne içindeki saniyeye çevir
        a = data["acilis"]
        hedef = next(x for x in sc if x["id"] == a["sahne"])
        if "kelime" in a:
            a["an"] = round(kel[ara(a["kelime"], hedef["bas"])]["s"] - hedef["bas"] + float(a.get("ofset", 0)), 3)
        a.setdefault("an", 0.0)
    os.makedirs(os.path.join(ROOT, "src", "bilim", "data"), exist_ok=True)
    json.dump(data, open(os.path.join(ROOT, "src", "bilim", "data", f"{konu}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # --- anlatım dinamiği: vurgulu sözleri yükselt, içten anları alçalt (kurgu.json "ses_vurgu") ---
    # [["kelime", dB, kelime_sayisi(1), n.gecis(0)], ...]  ör. ["gürleme", 3], ["ayasofya'da", -2, 7]
    if K.get("ses_vurgu"):
        kaz = np.zeros(len(voice))
        for v in K["ses_vurgu"]:
            i0 = ara(v[0], 0.0, v[3] if len(v) > 3 else 0)
            i1 = min(len(kel) - 1, i0 + (v[2] if len(v) > 2 else 1) - 1)
            a0, a1 = int(max(0, kel[i0]["s"] - 0.03) * SR), int((kel[i1]["e"] + 0.06) * SR)
            kaz[a0:a1] = np.where(np.abs(kaz[a0:a1]) < abs(v[1]), v[1], kaz[a0:a1])
        r = int(0.04 * SR)  # 40 ms yumuşak geçiş (tık sesi olmasın)
        kaz = np.convolve(kaz, np.ones(r) / r, mode="same")
        voice = voice * (10 ** (kaz / 20))
        print("ses vurgusu:", len(K["ses_vurgu"]), "yer")

    # --- efekt + müzik ---
    spec = importlib.util.spec_from_file_location("sesler", os.path.join(D, "sesler.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    N = len(voice)
    sfx = np.zeros(N)
    wt = lambda i: kel[i]["s"]  # noqa: E731
    starts = {s["id"]: s["bas"] for s in sc}
    for i, s in enumerate(sc):
        if (i > 0 or AC) and s.get("gecis") not in ("kes", "karar"):  # film kesmesinde hışırtı yok
            B.put(sfx, s["bas"] - 0.25, B.whoosh(0.55), float(K.get("gecis_ses", 0.55)))
    if AC:  # açılış vuruşu
        B.put(sfx, 0.0, B.katman(B.efekt("vurus", yedek=B.boom), B.riser(max(0.4, AC))), 0.6)
    cs = float(K.get("cta_ses", 1.0))
    for c in data.get("cta", []):  # CTA: yürüyüş, balon pıtı, dokunuş
        B.put(sfx, c["bas"] + 0.05, B.whoosh(0.5), 0.3 * cs)
        B.put(sfx, c["bas"] + 0.95, B.pop(), 0.45 * cs)
        B.put(sfx, c["bas"] + 1.25, B.katman(B.efekt("tik"), B.blip(1200, 0.08)), 0.55 * cs)
        if c["tur"] == "begen":
            B.put(sfx, c["bas"] + 1.3, B.chime_up(), 0.3 * cs)
    import inspect
    if "ara" in inspect.signature(mod.cues).parameters:
        mod.cues(B, sfx, wt, starts, sure, ara=lambda txt, sonra=0.0, n=0: kel[ara(txt, sonra, n)]["s"])
    else:
        mod.cues(B, sfx, wt, starts, sure)
    mus = None
    if hasattr(mod, "muzik"):  # konuya özel film müziği (sesler.py içinde muzik(B, sure, ara) -> dizi)
        mus = mod.muzik(B, sure, ara=lambda txt, sonra=0.0, n=0: kel[ara(txt, sonra, n)]["s"])
    if mus is None and K.get("muzik"):  # kurgu.json: "muzik": "merak" | "nostalji" | "teknoloji" | "neseli" | "duygusal"
        mus = B.muzik_dosyadan(sure, K["muzik"], anahtar=konu, parca=K.get("muzik_parca"))
    gercek_muzik = mus is not None
    if mus is not None and K.get("muzik_otomasyon"):  # [[kelime|saniye, kazanç], ...] doğrusal ses eğrisi
        nok = sorted((kel[ara(x)]["s"] if isinstance(x, str) else float(x), g) for x, g in K["muzik_otomasyon"])
        tt = np.arange(len(mus)) / SR
        mus = mus * np.interp(tt, [x for x, _ in nok], [g for _, g in nok])
    if mus is None:
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
    if K.get("efekt_sabit"):  # efektleri tepeye göre normalleştirme: kazançlar mutlak, tepeler sınırlayıcıda yumuşatılır
        (sfx * float(K["efekt_sabit"])).astype(np.float32).tofile(f"{tmp}/sfx.f32")
    else:
        save(f"{tmp}/sfx.wav", B.norm(sfx, 0.8))
    save(f"{tmp}/music.wav", B.norm(mus, 0.8))
    hp = f"highpass=f={K['ses_hp']}," if K.get("ses_hp") else ""  # ör. 90: "B" patlaması / uğultu
    on = (f"[0:a]{hp}loudnorm=I=-16:TP=-2:LRA=9,"
          "aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vk];"
          f"[1:a]{'highpass=f=%s,' % K['muzik_hp'] if K.get('muzik_hp') else ''}aformat=sample_rates=48000:channel_layouts=stereo,volume={K.get('muzik_ses', 0.22 if gercek_muzik else 0.30)}[m];"
          f"[m][vk]sidechaincompress=threshold={K.get('sc_threshold', 0.03)}:ratio={K.get('sc_ratio', 5)}:attack=20:release={K.get('sc_release', 400)}[md];"
          f"[2:a]{'highpass=f=%s,' % K['efekt_hp'] if K.get('efekt_hp') else ''}{'alimiter=limit=0.9:attack=2:release=60:level=false,' if K.get('efekt_sabit') else ''}aformat=sample_rates=48000:channel_layouts=stereo,volume={K.get('efekt_ses', 0.62)}[s];"
          "[v][md][s]amix=inputs=3:normalize=0:duration=first")
    girdiler = ["-i", f"{tmp}/voice.wav", "-i", f"{tmp}/music.wav"] + (
        ["-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", f"{tmp}/sfx.f32"] if K.get("efekt_sabit") else ["-i", f"{tmp}/sfx.wav"])
    son = "loudnorm=I=-14:TP=-2:LRA=11"
    if K.get("iki_gecis"):  # gerçek doğrusal: önce ölç, sonra sabit kazanç + tepe sınırlayıcı (vuruşlar ezilmez)
        r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner"] + girdiler + ["-filter_complex", on + ",ebur128=framelog=quiet[o]", "-map", "[o]", "-f", "null", "-"],
                           capture_output=True, text=True)
        I_olc = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1])
        kaz = -14.0 - I_olc
        son = f"volume={kaz:.2f}dB,alimiter=limit=0.75:attack=1:release=50:level=false"
        print(f"doğrusal yükseklik: ölçülen {I_olc:.2f} LUFS, kazanç {kaz:+.2f} dB")
    fc = on + f",{son},alimiter=limit=0.8:level=false[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + girdiler +
                   ["-filter_complex", fc, "-map", "[out]", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", os.path.join(pub, "mix.m4a")], check=True)
    print(f"{konu}: {total:.1f} sn kayıt -> {sure:.1f} sn video, {len(kel)} kelime, {len(sat)} altyazı satırı, {len(sc)} sahne")


if __name__ == "__main__":
    main(sys.argv[1])
