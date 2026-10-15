"""Kablosuz şarj efektleri: Kenney + Freesound CC0 + sentez."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    # 1 giriş
    p(S, ara("kablo") + 0.2, E("bip_hata"), 0.4)
    p(S, ara("elektrik"), B.katman(E("zap"), E("guc")), 0.45)
    p(S, ara("mıknatıs") - 0.1, B.katman(E("vurus"), E("metal")), 0.55)
    # 2 bobin
    p(S, ara("bobin"), B.katman(E("disli"), B.blip(900, 0.1)), 0.4)
    p(S, ara("100") - 0.1, B.ticks(1.0), 0.35)
    p(S, ara("yön"), E("bilgisayar"), 0.3)
    # 3 alan
    p(S, ara("manyetik") - 0.2, B.katman(E("kalkan"), B.shimmer(1.0)), 0.4)
    p(S, ara("ikinci"), E("pop"), 0.4)
    p(S, ara("elektrik", st["alan"]), B.katman(E("guc"), B.chime_up()), 0.45)
    # 4 kayma
    p(S, ara("kaydırınca") - 0.2, E("kaydir"), 0.45)
    p(S, ara("duruyor"), B.katman(E("dusus"), E("bip_hata")), 0.45)
    p(S, ara("milimetrede"), E("tik"), 0.4)
    # 5 ısı
    p(S, ara("enerji"), E("hisirti"), 0.35)
    p(S, ara("ısınıyor"), E("bip_hata"), 0.35)
    p(S, ara("kalın"), E("kumas"), 0.45)
    # 6 sonuç
    p(S, ara("değil", st["sonuc"]), E("vurus"), 0.5)
    p(S, ara("saklı"), B.katman(E("sihir"), E("jingle_basari")), 0.45)
