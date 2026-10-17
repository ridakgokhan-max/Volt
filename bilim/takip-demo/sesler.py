"""Takip demosu efektleri."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.1, E("saat"), 0.3)
    p(S, ara("her") , E("pop"), 0.4)
    for k in ("kamera", "tokyo", "sarj", "fermuar"):
        p(S, st[k] + 0.1, B.katman(E("deklansor"), E("pop")), 0.4)
    p(S, st["ozet"] + 0.1, B.katman(E("kart"), E("kart")), 0.4)
    p(S, ara("merak") , E("jingle_vurgu"), 0.4)
    p(S, ara("takip"), B.katman(E("jingle_basari"), B.chime_up()), 0.45)
