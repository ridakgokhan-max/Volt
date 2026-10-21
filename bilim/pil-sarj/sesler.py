"""Efektler (kolaj: kâğıt sesleri + vurgu)."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.1, E("kagit"), 0.45)
    p(S, ara("yoruyorsun"), E("bip_hata"), 0.4)
    p(S, ara("lityum"), E("kart"), 0.4)
    p(S, ara("balon"), E("yukselis"), 0.35)
    p(S, ara("kalıcı"), E("darbe_hafif"), 0.45)
    p(S, ara("beşte"), E("kagit"), 0.45)
    p(S, ara("%4'"), E("bip_iyi"), 0.4)
    p(S, ara("sıcaklık"), E("kagit"), 0.4)
    p(S, ara("yastık"), E("darbe"), 0.4)
    p(S, ara("sıfıra"), E("dusus"), 0.35)
    p(S, ara("%20"), E("kart"), 0.4)
    p(S, ara("koruması"), E("tik"), 0.45)
    p(S, ara("%80'"), E("kilit"), 0.45)
