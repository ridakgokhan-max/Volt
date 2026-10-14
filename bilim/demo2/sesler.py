"""Demo 2 efektleri: her özellik kendi sesiyle (CC0 kütüphane + sentez)."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    # 1 kanca: saat tik tak, sonra patlama
    for k in range(7):
        p(S, 0.05 + k * 0.29, B.katman(B.click(), E("tik", perde=2)), 0.5)
    p(S, 0.0, B.katman(B.boom(), E("darbe_agir")), 0.55)
    p(S, ara("işte"), B.katman(E("patlama"), B.sparkle(0.8), E("jingle_vurgu")), 0.7)
    # 2 rozet: rozet damgası, sayaç, kategori bipleri
    p(S, st["rozet"] + 0.1, E("dijital"), 0.4)
    p(S, ara("köşesinde"), B.katman(E("pop"), B.blip(900, 0.1)), 0.5)
    p(S, ara("seri"), B.katman(B.stamp(), E("bong")), 0.55)
    for k in range(4):
        p(S, ara("kategori") + k * 0.45, B.blip(600 + k * 180, 0.09), 0.45)
    # 3 kostüm: dolap kapısı, kumaş, her kostümde jingle
    p(S, ara("giyiniyor") - 0.3, E("kapi_ac"), 0.55)
    for w in ("şapka", "önlük", "baret"):
        p(S, ara(w), B.katman(E("kumas"), E("pop"), B.sparkle(0.5)), 0.55)
    # 4 ağız: mikrofon açılışı
    p(S, st["agiz"] + 0.1, B.katman(B.powerup(), E("bip_iyi")), 0.4)
    p(S, ara("birlikte"), E("jingle_basari"), 0.4)
    # 5 derinlik: katmanlar ayrılır, kamera süzülür
    p(S, st["derinlik"], B.katman(B.shimmer(1.4), B.riser(0.6)), 0.4)
    p(S, ara("derinlik") + 0.4, B.katman(E("kaydir"), E("kagit")), 0.5)
    p(S, ara("kamera"), B.whoosh(1.2, 2500), 0.45)
    # 6 blender: motor ve metal dişliler
    b0 = st["blender"]
    p(S, b0 + 0.1, B.katman(E("motor"), E("metal")), 0.45)
    for k in range(10):
        p(S, b0 + 0.4 + k * 0.32, E("tik", perde=1), 0.3)
    p(S, ara("üç"), B.katman(E("darbe"), B.ding(1046, 0.8, 0.3)), 0.5)
    # 7 nesneler: her biri pop
    n0 = st["nesneler"]
    for k in range(12):
        p(S, n0 + 0.15 + k * 0.12, B.pop(500 + k * 60), 0.35)
    p(S, ara("hızlı"), B.katman(E("lazer"), B.zap()), 0.45)
    # 8 platform: üç telefon, ayar klikleri
    for w in ("Instagram", "tiktok", "youtube"):
        p(S, ara(w) - 0.25, B.katman(E("kart"), B.whoosh(0.3, 5000)), 0.5)
    p(S, ara("ayarlanıyor"), B.katman(E("kilit"), E("bip_iyi")), 0.55)
    # 9 taslak: kâğıtlar, onay damgası
    t0 = ara("sahneleri")
    for k in range(6):
        p(S, t0 - 0.2 + k * 0.1, E("kagit", perde=2), 0.35)
    p(S, ara("sunuyorum") + 0.1, B.katman(B.stamp(), E("darbe_agir")), 0.7)
    # 10 döngü: dönen ses, başa sar
    p(S, st["dongu"] + 0.1, B.riser(1.2), 0.4)
    p(S, ara("başa"), B.katman(E("jingle_retro"), B.chime_up()), 0.5)
    p(S, sure - 0.55, B.whoosh(0.5), 0.5)
