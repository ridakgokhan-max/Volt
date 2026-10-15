"""Tokyo sel sistemi efektleri: Freesound CC0 (yağmur, su, gök gürültüsü) + Kenney + sentez."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    # 1 giriş: yağmur, gök gürültüsü, yükselen su
    p(S, 0.0, E("yagmur", perde=0), 0.32)
    p(S, 0.15, E("gok_gurultu", perde=0), 0.38)
    p(S, 2.0, E("yagmur", perde=0), 0.26)
    p(S, 0.8, E("su_akis", perde=0), 0.22)
    p(S, ara("çeviremiyor"), E("bip_iyi"), 0.4)
    p(S, ara("neden"), B.katman(E("pop"), E("sihir")), 0.4)
    # 2 yerin altına iniş
    p(S, ara("altında") - 0.1, B.katman(E("dusus"), B.whoosh(1.2)), 0.45)
    p(S, ara("dünyanın"), E("tik"), 0.4)
    p(S, ara("tüneli"), B.katman(E("vurus"), E("darbe")), 0.55)
    # 3 kuyular dolar
    p(S, ara("taşmaya"), E("su_akis", perde=0), 0.45)
    p(S, ara("dökülüyor") - 0.3, E("su_sicrama"), 0.45)
    p(S, ara("5", st["kuyu"]), E("pop"), 0.4)
    p(S, ara("70"), B.katman(E("tik"), B.blip(700, 0.1)), 0.4)
    p(S, ara("20"), B.katman(E("yukselis"), B.chime_up()), 0.4)
    # 4 tünel
    p(S, ara("kuyular") + 0.2, E("su_akis", perde=0), 0.35)
    p(S, ara("bağlı"), E("bip_iyi"), 0.4)
    # 5 dev depo
    p(S, ara("su", st["depo"]), E("su_gider", perde=0), 0.35)
    p(S, ara("59") - 0.3, B.ticks(1.0), 0.3)
    p(S, ara("500") - 0.05, B.katman(E("darbe_agir"), E("vurus")), 0.7)
    # 6 pompalar
    p(S, ara("uçak") - 0.3, E("hisirti"), 0.45)
    p(S, ara("pompalar") - 0.2, B.katman(E("motor"), E("guc")), 0.45)
    p(S, ara("suyu"), E("su_akis", perde=0), 0.4)
    p(S, ara("200"), E("jingle_vurgu"), 0.4)
    # 7 havuz boşalır
    p(S, ara("olimpik"), E("su_gider", perde=0), 0.45)
    p(S, ara("13") - 0.2, E("saat"), 0.35)
    p(S, ara("boşaltır") + 0.4, E("bip_iyi"), 0.4)
    # 8 takvim damlaları
    t8 = ara("8", st["takvim"])
    for i in range(8):
        p(S, t8 - 0.6 + i * 0.16, E("baloncuk"), 0.3)
    # 9 terazi
    p(S, ara("50", st["terazi"]), E("kagit"), 0.4)
    p(S, ara("3", st["terazi"]), B.katman(E("para"), E("metal")), 0.5)
    # 10 sonuç
    p(S, ara("kader") + 0.3, E("bip_hata"), 0.4)
    p(S, ara("altyapı"), E("jingle_basari"), 0.45)
    p(S, ara("sence") - 0.1, E("pop"), 0.4)
    p(S, ara("yorumlara"), E("tik"), 0.4)
