"""Seslendirme kurgusu: tekrar edilen denemelerden en iyisini seçer, kekemelik/dolgu seslerini siler, sessizlikleri kısaltır.

Girdi : ses dosyası + kelimeler.json (hikaye_transkript.py / transkript.py çıktısı, kelime zamanlı)
Çıktı : <cikti>.wav               temiz ses (48 kHz mono)
        <cikti>.kelimeler.json    temiz sesteki kelimeler ve yeni zamanları (altyazı için)
        <cikti>.rapor.txt         neyin neden silindiği (zaman damgalarıyla)

Kullanım: python scripts/ses_kurgu.py ses.m4a kelimeler.json cikti_yolu [--bosluk 0.18] [--cumle-bosluk 0.34]
"""
import argparse
import difflib
import json
import re
import subprocess

import numpy as np

SR = 48000
DOLGU = {"ee", "eee", "eeee", "ı", "ıı", "ııı", "ıh", "hmm", "hm", "hımm", "ımm", "mm", "eh", "aa", "ah"}
DOLGU_BAGLAMLI = {"şey", "yani"}  # sadece duraklamayla çevriliyse dolgu sayılır
TR = str.maketrans("İIÂÎÛ", "iıaiu")


def norm(w):
    w = w.translate(TR).lower()
    return re.sub(r"[^\wçğıöşü]", "", w)


def load_audio(path):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def rms_env(a, hop=0.005):
    n = int(SR * hop)
    m = len(a) // n
    e = np.sqrt((a[:m * n].reshape(m, n) ** 2).mean(1) + 1e-12)
    return e, hop


def snap(t, env, hop, lo, hi):
    """t'yi [lo, hi] aralığındaki en sessiz ana kaydır."""
    i0, i1 = max(0, int(lo / hop)), min(len(env) - 1, int(hi / hop))
    if i1 <= i0:
        return t
    k = i0 + int(np.argmin(env[i0:i1 + 1]))
    return k * hop


def chunks(words, gap=0.55):
    """Duraklama ve noktalama ile söz öbeklerine böl."""
    out, cur = [], []
    for i, w in enumerate(words):
        if cur:
            prev = words[cur[-1]]
            if w["start"] - prev["end"] > gap or re.search(r"[.!?…]$", prev["w"]):
                out.append(cur)
                cur = []
        cur.append(i)
    if cur:
        out.append(cur)
    return out


def take_score(words, idx):
    ws = [words[i] for i in idx]
    p = np.mean([w["p"] for w in ws]) if ws else 0
    toks = [norm(w["w"]) for w in ws]
    stut = sum(1 for a, b in zip(toks, toks[1:]) if a and (a == b or (len(a) < len(b) and b.startswith(a))))
    fill = sum(1 for t in toks if t in DOLGU)
    gaps = sum(1 for a, b in zip(ws, ws[1:]) if b["start"] - a["end"] > 0.45)
    # normalden çok uzun süren kelime = içinde yazıya geçmemiş duraklama/takılma var
    longw = sum(1 for w in ws if (w["end"] - w["start"]) > 2.5 * (0.065 * len(norm(w["w"])) + 0.12) + 0.4)
    return p - 0.12 * stut - 0.08 * fill - 0.06 * gaps - 0.15 * longw


def decide(words):
    """Silinecek kelime indeksleri ve gerekçeleri."""
    toks = [norm(w["w"]) for w in words]
    drop, why = set(), {}

    def kill(ids, reason):
        for i in ids:
            if i not in drop:
                drop.add(i)
                why[i] = reason

    # 1) tekrar edilen cümle denemeleri: birkaç öbek ileriye kadar benzer öbekler aynı "satırın" denemeleridir
    #    (ör. A B A' B' gibi sırayla yeniden okumalar). Her satırın en iyi denemesi kalır, satırlar ilk geçtikleri sırayla dizilir.
    ch = chunks(words)

    def toks_of(c):
        return [toks[i] for i in c if toks[i] not in DOLGU]

    def similar(a, b, adjacent):
        if not a or not b:
            return False
        pre = 0
        while pre < min(len(a), len(b)) and a[pre] == b[pre]:
            pre += 1
        sim = difflib.SequenceMatcher(None, a, b).ratio()
        if adjacent and pre >= 1 and len(a) <= 2:
            return True  # "Bir..." → "Bir gün..." gibi yarım başlangıç
        return (pre >= 2 and min(len(a), len(b)) >= 2) or (sim >= 0.62 and min(len(a), len(b)) >= 3)

    line_of = [None] * len(ch)
    lines = []
    for k in range(len(ch)):
        if line_of[k] is not None:
            continue
        line_of[k] = len(lines)
        line = [k]
        for j in range(k + 1, min(len(ch), k + 7)):
            if line_of[j] is None and similar(toks_of(ch[line[-1]]), toks_of(ch[j]), j == line[-1] + 1):
                line_of[j] = len(lines)
                line.append(j)
        lines.append(line)

    def complete(c):
        return 1.0 if re.search(r"[.!?…]$", words[c[-1]]["w"]) else 0.0

    order = []
    for line in lines:
        if len(line) > 1:
            best = max(range(len(line)), key=lambda q: (take_score(words, ch[line[q]]) + 0.15 * complete(ch[line[q]])
                                                        + 0.004 * len(ch[line[q]]) + 0.001 * q))
            for q, c in enumerate(line):
                if q != best:
                    kill(ch[c], f"tekrar denemesi ({len(line)} denemeden {best + 1}. olan tutuldu)")
            order += ch[line[best]]
        else:
            order += ch[line[0]]

    # 2) öbek içi kekemelik: art arda aynı kelime / yarım kelime / 2-3 kelimelik art arda tekrar
    keep = [i for i in order if i not in drop]
    for n in (3, 2):
        for x in range(len(keep) - 2 * n + 1):
            a = [toks[i] for i in keep[x:x + n]]
            b = [toks[i] for i in keep[x + n:x + 2 * n]]
            if all(a) and a == b and not any(i in drop for i in keep[x:x + 2 * n]):
                kill(keep[x:x + n], f"{n} kelimelik tekrar")
    keep = [i for i in order if i not in drop]
    for a, b in zip(keep, keep[1:]):
        ta, tb = toks[a], toks[b]
        if not ta:
            continue
        if ta == tb:
            kill([a], "kelime tekrarı (kekemelik)")
            if words[a]["w"][:1].isupper() and words[b]["w"][:1].islower():
                words[b]["w"] = words[b]["w"][:1].upper() + words[b]["w"][1:]
        elif len(ta) < len(tb) and tb.startswith(ta) and len(ta) <= max(3, len(tb) - 2):
            kill([a], "yarım kalan kelime")
        elif words[a]["w"].rstrip().endswith("-"):
            kill([a], "yarım kalan kelime")
    # 3) dolgu sesleri ("şey"/"yani" sadece önünde veya arkasında duraklama varsa)
    for i, t in enumerate(toks):
        if t in DOLGU:
            kill([i], "dolgu sesi")
        elif t in DOLGU_BAGLAMLI:
            before = words[i]["start"] - words[i - 1]["end"] if i > 0 else 1.0
            after = words[i + 1]["start"] - words[i]["end"] if i + 1 < len(words) else 1.0
            if (before > 0.25 and after > 0.25) or words[i]["w"].rstrip().endswith((",", "...", "…")) and before > 0.2:
                kill([i], "dolgu sesi")
    return drop, why, [i for i in order if i not in drop]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ses")
    ap.add_argument("kelimeler")
    ap.add_argument("cikti")
    ap.add_argument("--bosluk", type=float, default=0.18, help="kelimeler arası en uzun sessizlik (sn)")
    ap.add_argument("--cumle-bosluk", type=float, default=0.34, help="cümle sonu sessizlik (sn)")
    A = ap.parse_args()

    J = json.load(open(A.kelimeler, encoding="utf-8"))
    words = [w for s in J["segmentler"] for w in s["kelimeler"]]
    audio = load_audio(A.ses)
    env, hop = rms_env(audio)
    drop, why, kept = decide(words)

    # ardışık (orijinalde bitişik) kelimeleri koşulara grupla
    runs = []
    for i in kept:
        if runs and runs[-1][-1] == i - 1:
            runs[-1].append(i)
        else:
            runs.append([i])

    # her koşuyu ses dalgasına göre konuşma parçalarına böl (whisper zamanları sessizliğe taşabilir)
    thr = max(0.012, np.percentile(env, 20) * 2.5)
    voiced = env > thr
    pieces_src = []  # (bas, son, [kelimeler])
    dropped_spans = []
    for r in runs:
        lo = max(0.0, words[r[0]]["start"] - 0.12)
        hi = min(len(audio) / SR, words[r[-1]]["end"] + 0.15)
        i0, i1 = int(lo / hop), int(hi / hop)
        v = voiced[i0:i1].copy()
        # kısa boşlukları doldur (kelime içi duraklar), çok kısa sesleri at
        gapmax, minlen = int(0.12 / hop), int(0.04 / hop)
        idx = np.nonzero(v)[0]
        ivs = []
        for k in idx:
            if ivs and k - ivs[-1][1] <= gapmax:
                ivs[-1][1] = k
            else:
                ivs.append([k, k])
        ivs = [(a, b) for a, b in ivs if b - a >= minlen]
        if not ivs:
            ivs = [(int((words[r[0]]["start"] - lo) / hop), int((words[r[-1]]["end"] - lo) / hop))]
        # 0.3 sn'den kısa iç sessizlikleri parçalamadan bırak
        merged = []
        for a, b in ivs:
            if merged and (a - merged[-1][1]) * hop < 0.3:
                merged[-1][1] = b
            else:
                merged.append([a, b])
        spans = [(lo + a * hop, lo + (b + 1) * hop) for a, b in merged]
        owner = {}
        for i in r:  # her kelime en çok örtüştüğü (yoksa en yakın) parçaya
            ws_, we_ = words[i]["start"], words[i]["end"]
            ov = [max(0.0, min(we_, pe) - max(ws_, ps)) for ps, pe in spans]
            if max(ov) > 0:
                q = int(np.argmax(ov))
            else:
                mid = (ws_ + we_) / 2
                q = int(np.argmin([min(abs(mid - ps), abs(mid - pe)) for ps, pe in spans]))
            owner.setdefault(q, []).append(i)
        for q, (ps, pe) in enumerate(spans):
            if q in owner:
                pieces_src.append([ps, pe, owner[q]])
            elif pe - ps > 0.08:  # hiçbir kelimeye ait olmayan ses: yazıya geçmemiş takılma/nefes — atılır
                dropped_spans.append((ps, pe))

    # parçaları birleştir: aralarda hedef sessizlik (cümle sonu daha uzun), doğal giriş/çıkış payı
    pieces, new_words, t_out, report_gaps = [], [], 0.0, 0
    fade = int(0.008 * SR)
    pre, post = 0.04, 0.07
    for k, (ps, pe, ids) in enumerate(pieces_src):
        s2 = max(0.0, ps - pre)
        e2 = min(len(audio) / SR, pe + post)
        piece = audio[int(s2 * SR):int(e2 * SR)].copy()
        if len(piece) > 2 * fade:
            piece[:fade] *= np.linspace(0, 1, fade)
            piece[-fade:] *= np.linspace(1, 0, fade)
        for i in ids:
            w = words[i]
            ws_ = min(max(w["start"], s2), e2)
            we_ = min(max(w["end"], ws_), e2)
            new_words.append({"w": w["w"], "start": round(t_out + ws_ - s2, 3), "end": round(t_out + we_ - s2, 3)})
        pieces.append(piece)
        t_out += len(piece) / SR
        if k + 1 < len(pieces_src):
            nps = pieces_src[k + 1][0]
            orig_gap = max(0.0, nps - pe) if pieces_src[k + 1][2][0] > ids[-1] else 1.0
            end_sent = bool(re.search(r"[.!?…]$", words[ids[-1]]["w"]))
            comma = bool(re.search(r"[,;:]$", words[ids[-1]]["w"]))
            target = A.cumle_bosluk if end_sent else (A.bosluk + 0.08 if comma else A.bosluk)
            g = max(0.0, min(orig_gap, target) - pre - post)
            if orig_gap > target + 0.02:
                report_gaps += 1
            if g > 0:
                pieces.append(np.zeros(int(g * SR), np.float32))
                t_out += g
    # ekleri ("'nın", "'lu") önceki kelimeye bitiştir
    merged_words = []
    for w in new_words:
        if merged_words and re.match(r"^['’]", w["w"]):
            merged_words[-1]["w"] += w["w"]
            merged_words[-1]["end"] = w["end"]
        else:
            merged_words.append(dict(w))
    new_words = merged_words
    out = np.concatenate(pieces) if pieces else np.zeros(1, np.float32)
    # ses seviyesini düzenle (tepe -1 dBFS)
    out = out / (np.abs(out).max() + 1e-9) * 0.89
    pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
    import wave
    with wave.open(A.cikti + ".wav", "wb") as wv:
        wv.setnchannels(1)
        wv.setsampwidth(2)
        wv.setframerate(SR)
        wv.writeframes(pcm.tobytes())
    json.dump({"sure": round(len(out) / SR, 3), "kelimeler": new_words}, open(A.cikti + ".kelimeler.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    lines = [f"Orijinal süre: {len(audio) / SR:.1f} sn  →  temiz süre: {len(out) / SR:.1f} sn",
             f"Silinen kelime: {len(drop)}  |  kısaltılan sessizlik: {report_gaps}", "", "SİLİNENLER:"]
    i = 0
    srt = sorted(drop)
    while i < len(srt):
        j = i
        while j + 1 < len(srt) and srt[j + 1] == srt[j] + 1 and why[srt[j + 1]] == why[srt[i]]:
            j += 1
        a, b = words[srt[i]], words[srt[j]]
        txt = " ".join(words[x]["w"] for x in range(srt[i], srt[j] + 1))
        lines.append(f"  [{a['start']:6.2f}-{b['end']:6.2f}] «{txt}»  — {why[srt[i]]}")
        i = j + 1
    for ps, pe in dropped_spans:
        lines.append(f"  [{ps:6.2f}-{pe:6.2f}] (yazıya geçmemiş ses: takılma/nefes)")
    lines += ["", "TEMİZ METİN:", " ".join(w["w"] for w in new_words)]
    open(A.cikti + ".rapor.txt", "w", encoding="utf-8").write("\n".join(lines))
    print("\n".join(lines))


if __name__ == "__main__":
    main()
