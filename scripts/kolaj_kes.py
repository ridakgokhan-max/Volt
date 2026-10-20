#!/usr/bin/env python3
"""Ücretsiz kolaj parçası üretici (gbro-collage-broll yerine kendi sistemimiz).

Kullanım: kolaj_kes.py <cikti_klasoru> "ad|kaynak.jpg" ["ad|kaynak.jpg" ...]
Her kaynak için:
  1) rembg (isnet-general-use) ile arka planı siler
  2) nesneye göre kırpar, uzun kenarı 900 px yapar
  3) hafif posterize + halftone (gazete noktası) dokusu ekler
  4) etrafına krem kâğıt kenarı (keyline) çizer
Çıktı: <cikti>/<ad>.png (şeffaf). Gölge ve kâğıt dokusu Remotion tarafında eklenir.
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageDraw
from rembg import remove, new_session

KREM = (244, 236, 216)
SES = new_session("isnet-general-use")


def halftone(rgb: Image.Image, adim=7, guc=0.30) -> Image.Image:
    """Parlaklığa göre büyüyen koyu noktalar; görüntüyle çarpılır."""
    w, h = rgb.size
    gri = np.asarray(rgb.convert("L"), dtype=np.float32) / 255.0
    desen = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(desen)
    for y in range(0, h, adim):
        off = (adim // 2) if (y // adim) % 2 else 0
        for x in range(off, w, adim):
            v = gri[min(h - 1, y + adim // 2), min(w - 1, x + adim // 2)]
            r = (1 - v) * adim * 0.62
            if r > 0.6:
                cx, cy = x + adim / 2, y + adim / 2
                d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=0)
    m = np.asarray(desen, dtype=np.float32) / 255.0
    m = 1 - guc * (1 - m)
    a = np.asarray(rgb, dtype=np.float32) * m[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def isle(kaynak: str, hedef: str):
    im = Image.open(kaynak).convert("RGB")
    im.thumbnail((1400, 1400))
    kes = remove(im, session=SES, post_process_mask=True)  # RGBA
    alfa = kes.getchannel("A").point(lambda v: 255 if v > 128 else 0).filter(ImageFilter.MedianFilter(5))
    kutu = alfa.getbbox()
    if not kutu:
        print("BOŞ:", kaynak); return
    kes = kes.crop(kutu); alfa = alfa.crop(kutu)
    s = 900 / max(kes.size)
    yeni = (max(1, int(kes.width * s)), max(1, int(kes.height * s)))
    kes = kes.resize(yeni, Image.LANCZOS); alfa = alfa.resize(yeni, Image.LANCZOS).point(lambda v: 255 if v > 128 else 0)

    rgb = kes.convert("RGB")
    rgb = ImageOps.autocontrast(rgb, cutoff=1)
    rgb = ImageOps.posterize(rgb, 5)
    rgb = halftone(rgb)

    kenar = 16
    W, H = rgb.width + 2 * kenar, rgb.height + 2 * kenar
    a_buyuk = Image.new("L", (W, H), 0); a_buyuk.paste(alfa, (kenar, kenar))
    keyline = a_buyuk.filter(ImageFilter.MaxFilter(2 * kenar - 1)).filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 255 if v > 110 else 0)

    out = Image.new("RGBA", (W, H), KREM + (0,))
    krem = Image.new("RGBA", (W, H), KREM + (255,))
    out.paste(krem, (0, 0), keyline)
    foto = Image.new("RGBA", (W, H), (0, 0, 0, 0)); foto.paste(rgb, (kenar, kenar)); foto.putalpha(a_buyuk)
    out = Image.alpha_composite(out, foto)
    out.save(hedef, optimize=True)
    print("OK", hedef, out.size)


def main():
    kl = sys.argv[1]
    os.makedirs(kl, exist_ok=True)
    for arg in sys.argv[2:]:
        ad, kaynak = arg.split("|", 1)
        try:
            isle(kaynak.strip(), os.path.join(kl, ad.strip() + ".png"))
        except Exception as e:
            print("HATA", arg, e)


if __name__ == "__main__":
    main()
