"""Eski telefon güvenlik kamerası efektleri: CC0 kütüphane (Kenney + Freesound) + sentez."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    # 1 giriş: çekmece, telefon fırlıyor, kamera olup kayda başlıyor
    p(S, st["giris"] + 0.1, B.katman(E("kapi_ac"), E("tahta")), 0.55)
    p(S, ara("telefon") - 0.1, B.katman(E("pop"), E("kumas")), 0.5)
    p(S, ara("kamerası"), B.katman(E("deklansor"), E("bip_iyi")), 0.6)
    p(S, ara("5") - 0.1, E("saat"), 0.35)
    # 2 kurulum: indirme çubukları, eşleşme
    p(S, st["kurulum"] + 0.3, B.katman(E("dijital"), B.blip(900, 0.1)), 0.4)
    p(S, ara("alfred"), E("pop"), 0.5)
    p(S, ara("aynı", st["kurulum"]) + 0.3, B.katman(E("dijital"), B.blip(1100, 0.1)), 0.4)
    p(S, ara("hesapla"), B.katman(E("kilit"), E("bip_iyi")), 0.55)
    # 3 roller: kamera gözü açılıyor, sinyal
    p(S, ara("kamera.", st["roller"]), B.katman(E("deklansor"), B.sonar() if hasattr(B, "sonar") else E("bip_iyi")), 0.5)
    p(S, ara("ekran"), B.katman(E("guc"), B.blip(1300, 0.1)), 0.45)
    # 4 soru: pil biterken düşüş, püf noktası parıltı
    p(S, ara("pil"), B.katman(E("dusus"), E("bip_hata")), 0.5)
    p(S, ara("püf"), B.katman(E("sihir"), E("jingle_vurgu")), 0.45)
    # 5 şarj: fiş, güneşe çarpı, rüzgar
    p(S, ara("şarja"), B.katman(E("tik"), E("guc")), 0.5)
    p(S, ara("güneş"), E("bip_hata"), 0.45)
    p(S, ara("havadar") - 0.1, E("hisirti"), 0.35)
    # 6 yerleşim: kamera dönüyor
    p(S, ara("kapıya"), B.katman(E("disli"), E("tik", perde=2)), 0.4)
    p(S, ara("balkona"), B.katman(E("disli"), E("tik", perde=2)), 0.4)
    # 7 bildirim: adımlar, tarama, zil
    b0 = st["bildirim"]
    t = b0 + 0.4
    while t < ara("bildirim") - 0.2:
        p(S, t, E("adim", perde=2), 0.4)
        t += 0.32
    p(S, ara("algılamayı"), B.scan(0.8) if hasattr(B, "scan") else E("lazer"), 0.35)
    p(S, ara("bildirim"), B.katman(E("zil"), E("bip_iyi"), E("vurus")), 0.7)
    # 8 sonuç: geri dönüşüm, göz
    p(S, ara("çöpten"), B.katman(E("kagit"), E("jingle_basari")), 0.5)
    p(S, ara("göz"), B.katman(E("sihir"), B.chime_up()), 0.45)
    # 9 yarın
    p(S, ara("yarın", st["yarin"]), B.katman(E("zap"), E("guc")), 0.5)
    p(S, ara("nasıl"), B.katman(E("boing"), E("pop")), 0.45)
    p(S, sure - 0.55, E("hisirti"), 0.35)
