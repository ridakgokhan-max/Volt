"""Efektler (Canva demosu: konserve videosunun ilk 20 saniyesi)."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, ara("yoktu"), B.katman(E("bip_hata"), E("metal")), 0.45)
    p(S, ara("50"), E("kagit"), 0.4)
    p(S, ara("patentlendi"), B.stamp(), 0.55)
    p(S, ara("denizcilere"), E("hisirti"), 0.35)
    p(S, ara("ağırdı"), E("darbe_agir"), 0.5)
