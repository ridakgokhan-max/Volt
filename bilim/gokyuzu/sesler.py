"""Efektler."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.05, B.katman(E("sihir"), B.shimmer(1.0)), 0.4)
    p(S, ara("renkler"), B.chime_up(), 0.4)
    p(S, ara("moleküllere"), E("baloncuk"), 0.4)
    p(S, ara("kırmızıdan"), E("hisirti"), 0.3)
    p(S, ara("neden"), E("pop"), 0.4)
    p(S, ara("sonuç"), E("jingle_vurgu"), 0.45)
    p(S, ara("akşam"), E("hisirti"), 0.35)
    p(S, ara("gözümüz", st["sonuc"]), B.katman(E("sihir"), E("jingle_basari")), 0.4)
