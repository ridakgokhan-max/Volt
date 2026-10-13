"""Yapay zekâ seslendirmesi (demo ve taslaklar için): bilim/<konu>/metin.txt -> bilim/<konu>/ses.mp3 (edge-tts).
Asıl videolarda Kadir'in kendi sesi kullanılır; bu sadece demo/taslak içindir.
Kullanım: python scripts/seslendir.py <konu> [ses] [hız]
"""
import asyncio
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


async def main(konu, voice, rate):
    import edge_tts

    d = os.path.join(ROOT, "bilim", konu)
    text = open(os.path.join(d, "metin.txt"), encoding="utf-8").read().strip()
    await edge_tts.Communicate(text, voice, rate=rate).save(os.path.join(d, "ses.mp3"))
    print(konu, "seslendirildi:", voice, rate)


if __name__ == "__main__":
    k = sys.argv[1]
    v = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else "tr-TR-AhmetNeural"
    r = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "+8%"
    asyncio.run(main(k, v, r))
