"""Efektler."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, ara("kuruyacak"), E("dusus"), 0.35)
    p(S, ara("pet"), E("pop"), 0.4)
    p(S, ara("delik"), B.katman(E("tik"), E("pop")), 0.45)
    p(S, ara("suyla"), E("su_akis", perde=0), 0.35)
    p(S, ara("kapat"), E("tik"), 0.4)
    p(S, ara("sula"), E("su_sicrama"), 0.4)
    p(S, ara("ters"), E("hisirti"), 0.35)
    p(S, ara("göm"), E("darbe_hafif"), 0.45)
    p(S, ara("neden"), E("pop"), 0.4)
    p(S, ara("hava", st["hava"]), E("baloncuk"), 0.4)
    p(S, ara("büyükse"), E("su_gider", perde=0), 0.4)
    p(S, ara("kendisi"), E("jingle_basari"), 0.4)
