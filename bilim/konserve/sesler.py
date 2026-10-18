"""Efektler."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, ara("yoktu"), B.katman(E("bip_hata"), E("metal")), 0.45)
    p(S, ara("50"), E("kagit"), 0.4)
    p(S, ara("patentlendi"), B.stamp(), 0.55)
    p(S, ara("denizcilere"), E("hisirti"), 0.35)
    p(S, ara("ağırdı"), E("darbe_agir"), 0.5)
    p(S, ara("keski"), B.katman(E("metal"), E("darbe")), 0.5)
    for w in ("süngü", "bıçak", "tüfek"):
        p(S, ara(w), B.katman(E("metal"), E("tik")), 0.45)
    p(S, st["acacak"] + 0.2, E("sayfa"), 0.4)
    p(S, ara("açacaklar"), E("jingle_basari"), 0.45)
    p(S, ara("başka"), E("pop"), 0.4)
