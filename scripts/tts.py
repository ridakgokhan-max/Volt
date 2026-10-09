"""scenes.json -> public/audio/<id>.mp3 + src/timeline.json (kelime zamanlamalarıyla)."""
import asyncio
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAD = 0.45  # her sahnenin sonunda bırakılan sessizlik (sn)


def estimate_words(text, duration):
    words = text.split()
    total = sum(len(w) + 2 for w in words) or 1
    t, out = 0.0, []
    for w in words:
        d = duration * (len(w) + 2) / total
        out.append({"text": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def probe_duration(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


async def synth(text, voice, rate, path):
    import edge_tts

    try:
        com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    except TypeError:
        com = edge_tts.Communicate(text, voice, rate=rate)
    words = []
    with open(path, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append({"text": ch["text"], "start": round(s, 3), "end": round(s + ch["duration"] / 1e7, 3)})
    return words


async def main(placeholder=False):
    cfg = json.load(open(os.path.join(ROOT, "scenes.json"), encoding="utf-8"))
    os.makedirs(os.path.join(ROOT, "public", "audio"), exist_ok=True)
    out = []
    for sc in cfg["scenes"]:
        if placeholder:
            dur = max(2.5, len(sc["text"]) / 15)
            words = estimate_words(sc["text"], dur)
            audio = None
        else:
            rel = f"audio/{sc['id']}.mp3"
            path = os.path.join(ROOT, "public", rel)
            words = await synth(sc["text"], cfg["voice"], cfg["rate"], path)
            dur = probe_duration(path)
            # Sadece cümle zamanlaması gelirse ya da hiç gelmezse kelimeleri tahmin et
            if len(words) < max(2, len(sc["text"].split()) // 2):
                words = estimate_words(sc["text"], dur)
            audio = rel
        out.append({"id": sc["id"], "text": sc["text"], "audio": audio, "duration": round(dur + PAD, 3), "words": words})
        print(sc["id"], round(dur, 2), "sn,", len(words), "kelime")
    with open(os.path.join(ROOT, "src", "timeline.json"), "w", encoding="utf-8") as f:
        json.dump({"scenes": out}, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    asyncio.run(main(placeholder="--placeholder" in sys.argv))
