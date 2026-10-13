"""Demo videosu efektleri: CC0 kütüphane (B.efekt) + sentez yedekler, katmanlı."""

ZIPLA = [0.55, 1.0, 1.32, 1.55, 1.71, 1.82]  # demo.tsx ile aynı


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    # 1 açılış: yükseliş + her harfe metal darbe + patlama
    p(S, 0.0, B.riser(0.6), 0.5)
    for i in range(4):
        p(S, 0.15 + i * 0.16 + 0.12, B.katman(E("metal_agir"), B.thud()), 0.55)
    for i in range(13):
        p(S, 0.9 + i * 0.07, E("tik", perde=3), 0.25)
    p(S, ara("demo"), B.katman(B.boom(50, 1.4), E("patlama")), 0.6)
    p(S, ara("demo") + 0.05, B.sparkle(0.8), 0.45)
    p(S, ara("dakikada") - 0.4, E("pop"), 0.5)
    for i in range(8):
        p(S, ara("dakikada") + i * 0.2, E("tik", perde=0), 0.3)
    # 2 karakter: ayak sesleri, merhaba balonu, duygu değişimleri
    t0 = st["karakter"]
    stop = ara("yürüyebiliyor") + 1.3
    tt = t0 + 0.2
    while tt < stop:
        p(S, tt, E("adim", perde=2), 0.5)
        tt += 0.35
    p(S, ara("el"), B.katman(E("pop"), B.ding(1046, 0.8, 0.3)), 0.5)
    for i, ad in enumerate(["bip_iyi", "bong", "dusus", "jingle_retro"]):
        p(S, ara("duygularını") + i * 0.55, E(ad), 0.4)
    # 3 çizim: tebeşir, dişli, ampul yanar
    c0 = st["cizim"]
    p(S, c0 + 0.2, B.chalk(2.6), 0.7)
    for i in range(10):
        p(S, c0 + 2.0 + i * 0.25, E("tik", perde=1), 0.2)
    p(S, ara("adım"), B.katman(E("anahtar"), B.ding(1568, 1.4, 0.5)), 0.6)
    for i in range(3):
        p(S, ara("adım") - 0.6 + i * 0.3, E("pop"), 0.35)
    # 4 geçişler
    p(S, ara("daire") - 0.15, B.katman(B.whoosh(0.5, 4000), E("kalkan")), 0.55)
    p(S, ara("kaydırma") - 0.15, B.katman(B.whoosh(0.45, 5000), E("kart")), 0.6)
    p(S, ara("yakınlaşma") - 0.2, B.katman(B.riser(0.6), E("yukselis")), 0.5)
    p(S, ara("parazit") - 0.15, B.katman(E("bip_hata"), B.zap(0.4), E("bilgisayar")), 0.55)
    # 5 fizik: her sekmede yumuşak darbe (giderek azalır), sarkaç tıkırtısı, yörünge parıltısı
    tz = ara("zıplıyor") - 0.3
    for i, b in enumerate(ZIPLA):
        p(S, tz + b, B.katman(E("darbe_hafif"), B.thud()), 0.7 * (0.75 ** i))
    ts = ara("sallanıyor")
    for i in range(5):
        p(S, ts + 0.37 + i * 0.75, E("tahta", perde=1), 0.25)
    p(S, ara("yörüngede") - 0.3, B.shimmer(2.0), 0.6)
    p(S, ara("yörüngede") - 0.3, E("guc"), 0.35)
    # 6 grafik: sayaç tıkırtısı, çubuklar, halka
    ts = ara("sayılar") - 0.2
    p(S, ts, B.ticks(1.6, 26), 0.5)
    p(S, ts + 1.6, B.ding(1760, 1.0, 0.3), 0.5)
    for i in range(5):
        p(S, ara("grafikler") - 0.2 + i * 0.12, B.pop(400 + i * 120), 0.5)
    p(S, ara("veriler") - 0.2, B.meter(1.0), 0.45)
    p(S, ara("veriler") + 0.8, E("bip_iyi"), 0.5)
    # 7 derinlik: rüzgârımsı uğultu + küp belirir
    d0 = st["derinlik"]
    p(S, d0, B.whoosh(2.5, 900), 0.5)
    p(S, d0, B.shimmer(3.0), 0.35)
    p(S, ara("üç") - 0.2, B.katman(E("lazer_buyuk"), E("guc")), 0.5)
    # 8 kamera: düşüş, ağır darbe, yakınlaşma, spot ışığı
    th = ara("sarsılıyor")
    p(S, th - 0.45, B.whoosh(0.45, 3000), 0.5)
    p(S, th, B.katman(E("darbe_agir"), B.boom(45, 1.3), E("metal_agir")), 0.8)
    p(S, ara("yakınlaşıyor") - 0.1, B.katman(B.riser(0.5), E("yukselis")), 0.5)
    p(S, ara("ışık") - 0.1, B.katman(E("anahtar"), B.boom(70, 0.8)), 0.6)
    # 9 kinetik yazı
    for w, ad in (("her", "kaydir"), ("kelime", "kart"), ("vurgulanıyor", "jingle_vurgu"), ("büyüyüp", "guc"), ("renk", "dijital")):
        p(S, ara(w) - 0.1, B.katman(B.whoosh(0.3, 4000), E(ad)), 0.5)
    # 10 kapanış: simgeler, tık, başarı, final
    k0 = st["kapanis"]
    for i in range(8):
        p(S, k0 + 0.2 + i * 0.13, B.pop(500 + i * 70), 0.4)
    tk = ara("takip")
    p(S, tk - 0.9, B.whoosh(0.6, 2500), 0.3)
    p(S, tk, E("fare"), 0.9)
    p(S, tk + 0.05, B.katman(E("jingle_basari"), B.chime_up(784, 1.26, 4, 0.06)), 0.6)
    p(S, tk + 0.05, B.sparkle(0.9), 0.5)
    p(S, min(sure - 2.2, tk + 0.9), B.stinger(), 0.6)
