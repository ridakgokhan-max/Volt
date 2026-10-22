"""Efektler."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.1, E("kagit"), 0.45)
    p(S, ara("okur"), E("bip_iyi"), 0.4)
    p(S, ara("nasıl"), E("bong"), 0.35)
    p(S, ara("1994"), E("dijital"), 0.35)
    p(S, ara("araba"), E("metal"), 0.35)
    p(S, ara("go"), E("tahta"), 0.4)
    p(S, ara("kaysa"), E("tahta"), 0.35)
    p(S, ara("birden"), E("pop"), 0.4)
    p(S, ara("tamamlanıyor"), E("bip_iyi"), 0.4)
    p(S, ara("üç"), E("tik"), 0.4)
    p(S, ara("gökdelene"), E("yukselis"), 0.35)
    p(S, ara("tanıyor"), E("bip_iyi"), 0.4)
    p(S, ara("karanlık"), E("bip_hata"), 0.45)
    p(S, ara("sahte"), E("kagit"), 0.45)
    p(S, ara("adrese"), E("tik"), 0.45)
    p(S, ara("açma", sonra=st["cozum"] + 3), E("darbe"), 0.45)
