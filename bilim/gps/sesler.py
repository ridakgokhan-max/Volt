"""Efektler."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.1, B.sonar(), 0.4)
    p(S, ara("internete"), E("bip_hata"), 0.4)
    p(S, ara("30"), E("dijital"), 0.4)
    p(S, ara("buradayım"), B.sonar(), 0.4)
    p(S, ara("saat", st["yayin"]), E("saat"), 0.35)
    p(S, ara("uzaklığı"), E("tik"), 0.4)
    p(S, ara("birkaç"), B.katman(E("pop"), E("bip_iyi")), 0.45)
    p(S, ara("38"), E("jingle_vurgu"), 0.45)
    p(S, ara("kilometrelerce"), E("dusus"), 0.4)
    p(S, ara("teşekkür"), E("sihir"), 0.4)
