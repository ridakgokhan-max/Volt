"""Fermuar efektleri: CC0 kütüphane + sentez, katmanlı."""


def fermuar_sesi(B, d=0.6):
    """Fermuar çekme sesi: hızlı tık dizisi + hışırtı."""
    import numpy as np
    n = int(d * B.SR)
    out = np.zeros(n)
    rate0, rate1 = 40, 90
    t, k = 0.0, 0
    while t < d - 0.02:
        B.put(out, t, B.click() * (0.6 + 0.4 * np.random.rand()), 0.7)
        t += 1 / (rate0 + (rate1 - rate0) * t / d)
        k += 1
    out += B.whoosh(d, 6000)[:n] * 0.25
    return out


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    # 1 giriş: dev fermuar kapanıyor
    p(S, 0.1, fermuar_sesi(B, 0.9), 0.8)
    p(S, 1.0, B.katman(E("metal"), B.thud()), 0.5)
    p(S, ara("hüzünlü"), E("dusus"), 0.45)
    # 2 Judson: eski zamana geçiş, yıl sayacı, patent damgası, ayakkabı bağcığı
    j0 = st["judson"]
    p(S, j0, B.katman(B.riser(0.4), B.shimmer(1.0)), 0.45)
    p(S, ara("1893'te") - 0.4, B.ticks(0.6, 24), 0.45)
    p(S, ara("patentlendi"), B.stamp(), 0.8)
    p(S, ara("ayakkabı"), E("kumas"), 0.6)
    p(S, ara("uğraşmamak"), E("bip_hata"), 0.35)
    # 3 sorun: yürüyüş, ayakkabı açılır, kalabalık yüz çevirir
    s0 = st["sorun"]
    t = s0 + 0.2
    while t < ara("açılıveriyor") - 0.1:
        p(S, t, E("adim", perde=2), 0.45)
        t += 0.29
    p(S, ara("açılıyordu"), fermuar_sesi(B, 0.25), 0.6)
    p(S, ara("açılıveriyor"), B.katman(E("pop"), fermuar_sesi(B, 0.3), E("darbe_hafif")), 0.7)
    p(S, ara("vermedi") - 0.3, B.katman(E("bong"), E("dusus")), 0.45)
    # 4 Sundback: takvim çevrilir, plan çizilir
    p(S, ara("yirmi") - 0.2, B.katman(B.ticks(0.9, 26), E("kagit")), 0.5)
    p(S, ara("1913'te"), B.ding(1318, 1.0, 0.35), 0.5)
    p(S, st["sundback"] + 0.3, B.chalk(1.5), 0.35)
    p(S, ara("dişler"), B.katman(E("metal"), B.sparkle(0.6)), 0.5)
    # 5 mekanizma: diş diş kilitlenme
    m0 = ara("sürgü")
    for k in range(16):
        p(S, m0 + 0.2 + k * 0.17, B.katman(B.click(), E("tik", perde=3)), 0.45)
    p(S, ara("kilitleniyor"), B.katman(E("kilit"), E("metal_agir")), 0.7)
    p(S, ara("hâlâ"), B.katman(B.ding(1568, 1.2, 0.4), B.sparkle(0.6)), 0.5)
    # 6 isim: 1920'ler, zip!
    p(S, st["isim"] + 0.1, B.shimmer(1.2), 0.35)
    p(S, ara("\"zipper\"") - 0.15, fermuar_sesi(B, 0.45), 0.9)
    p(S, ara("=zip"), B.katman(fermuar_sesi(B, 0.3), E("jingle_vurgu")), 0.8)
    # 7 yarın: çekmece açılır, telefon
    y0 = st["yarin"]
    p(S, ara("çekmecende"), B.katman(E("kapi_ac"), E("tahta")), 0.55)
    p(S, ara("bedava") - 0.1, B.katman(E("guc"), B.pop(700)), 0.5)
    p(S, ara("güvenlik"), B.katman(E("bip_iyi"), B.blip(1200, 0.12)), 0.5)
    p(S, min(sure - 2.0, ara("başla") + 0.4), B.stinger(), 0.6)
