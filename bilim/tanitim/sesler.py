"""Kanal tanıtımı efektleri: CC0 kütüphane + sentez, katmanlı."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    # sorular
    p(S, 0.3, B.katman(E("guc"), B.powerup(0.8)), 0.4)
    p(S, ara("tabağı"), B.katman(E("pop"), E("cam")), 0.5)
    p(S, ara("yemeği"), B.katman(B.ding(1318, 1.0, 0.4), E("bip_iyi")), 0.5)
    p(S, st["soru2"] + 0.2, B.scan(1.6), 0.4)
    p(S, ara("tanır") - 0.2, B.chime_up(659, 1.26, 4, 0.06), 0.5)
    p(S, st["soru3"] + 0.2, B.shimmer(1.2), 0.5)
    p(S, ara("mavidir") - 0.4, B.katman(E("yukselis"), B.sparkle(0.6)), 0.5)
    # logo
    for i in range(3):
        p(S, st["logo"] + 0.15 + i * 0.22 + 0.12, B.katman(E("metal_agir"), B.thud()), 0.55)
    p(S, ara("hoş"), B.katman(B.boom(48, 1.4), E("patlama"), E("jingle_vurgu")), 0.65)
    # her gün
    h0 = st["hergun"]
    for i in range(14):
        p(S, h0 + i * 0.22, E("kagit", perde=2), 0.3)
    tt = h0 + 0.1
    while tt < h0 + 2.4:
        p(S, tt, E("adim", perde=2), 0.4)
        tt += 0.35
    p(S, ara("yeni"), B.katman(E("anahtar"), B.ding(1568, 1.2, 0.4)), 0.6)
    # kategoriler: başlıkta vurgu, her vinyette kayma + kendi sesi
    for kat, ad in (("bilim", "jingle_retro"), ("teknoloji", "dijital"), ("tarih", "kitap_ac"), ("diy", "tahta")):
        p(S, st[kat] + 0.05, B.katman(E(ad), B.pop(500)), 0.5)
    vin = {
        "uçaklar": B.katman(B.whoosh(1.0, 2500), E("motor")), "buzdolabı": E("kapi_kapa"), "kar": B.sparkle(0.8),
        "gps": E("bip_iyi"), "kare": B.ticks(0.8, 28), "kablosuz": B.powerup(1.0), "yapay": E("bilgisayar"),
        "fermuar": E("kumas"), "barkod": E("cizik"), "yapışkan": E("kagit"),
        "limondan": E("zap"), "iğneden": E("metal"), "eski": E("anahtar"),
    }
    for w, snd in vin.items():
        t0 = ara(w)
        p(S, t0 - 0.3, B.whoosh(0.35, 4500), 0.45)
        p(S, t0, snd, 0.5)
    # rakamlar
    p(S, ara("altı") - 0.1, B.katman(E("darbe_agir"), B.boom(60, 0.8)), 0.55)
    p(S, ara("otuz"), B.ticks(1.0, 30), 0.45)
    p(S, ara("dakika"), B.katman(E("zil"), B.ding(1760, 1.0, 0.3)), 0.5)
    # kapanış
    tk = ara("takip")
    p(S, tk - 0.8, B.whoosh(0.6, 2500), 0.3)
    p(S, tk, E("fare"), 0.9)
    p(S, tk + 0.05, B.katman(E("jingle_basari"), B.chime_up(784, 1.26, 4, 0.06)), 0.6)
    p(S, tk + 0.05, B.sparkle(0.9), 0.5)
    p(S, min(sure - 2.2, ara("yarın") + 0.8), B.stinger(), 0.6)
