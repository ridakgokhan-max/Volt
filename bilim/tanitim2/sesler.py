"""Tanıtım v2 efektleri."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.05, B.katman(E("sihir"), B.shimmer(1.0)), 0.4)
    p(S, ara("açacağı"), B.katman(E("metal"), E("darbe")), 0.5)
    p(S, ara("uyduları"), B.sonar(), 0.4)
    p(S, ara("top"), E("baloncuk"), 0.45)
    p(S, ara("pet"), E("su_sicrama"), 0.4)
    p(S, st["yakinda"] + 0.1, B.katman(E("kart"), E("kart")), 0.4)
    p(S, ara("hangisini"), E("pop"), 0.4)
