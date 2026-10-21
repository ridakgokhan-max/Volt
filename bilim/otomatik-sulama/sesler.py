"""Efektler (Kendin Yap: kâğıt, bant, su)."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.1, E("kagit"), 0.45)
    p(S, ara("susayana"), E("darbe_hafif"), 0.45)
    p(S, ara("anlıyor"), E("bong"), 0.35)
    p(S, ara("iğneyle"), E("cizik"), 0.4)
    p(S, ara("doldur"), E("pop"), 0.4)
    p(S, ara("göm"), E("kart"), 0.4)
    p(S, ara("hava"), E("kagit"), 0.4)
    p(S, ara("giremiyor"), E("darbe_hafif"), 0.45)
    p(S, ara("kabarcıkları"), E("pop"), 0.4)
    p(S, ara("bırakıyor"), E("pop"), 0.35)
    p(S, ara("musluğu"), E("kilit"), 0.45)
    p(S, ara("pamuklu"), E("kumas"), 0.4)
    p(S, ara("tırmanarak"), E("yukselis"), 0.35)
    p(S, ara("günde"), E("dusus"), 0.4)
    p(S, ara("önce"), E("darbe"), 0.45)
