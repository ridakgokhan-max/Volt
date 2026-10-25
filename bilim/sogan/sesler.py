"""Efektler — soğan."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.1, E("bicak"), 0.5)
    p(S, ara("suçlu"), E("darbe"), 0.4)
    p(S, ara("bıçak."), E("bong"), 0.35)
    p(S, ara("savunuyor"), E("kalkan"), 0.4)
    p(S, ara("ayrı"), E("kapi_kapa"), 0.35)
    p(S, ara("parçaladığı"), E("bicak"), 0.45)
    p(S, ara("karışıyor"), E("pop"), 0.4)
    p(S, ara("gaz", sonra=st["gaz"]), E("yukselis"), 0.3)
    p(S, ara("yanıyor"), E("bip_hata"), 0.4)
    p(S, ara("yıka"), E("zil"), 0.35)
    p(S, ara("2002"), E("dijital"), 0.35)
    p(S, ara("enzim"), E("anahtar"), 0.4)
    p(S, ara("nobel"), E("jingle_basari"), 0.3)
    p(S, ara("peki"), E("bong"), 0.35)
    p(S, ara("kamerayla"), E("kart"), 0.4)
    p(S, ara("bastırıyor"), E("darbe_hafif"), 0.4)
    p(S, ara("fışkırtıyor"), E("patlama"), 0.25)
    p(S, ara("140"), E("lazer"), 0.3)
    p(S, ara("keskin"), E("bicak"), 0.4)
    p(S, ara("ulaşamıyor"), E("bip_iyi"), 0.4)
    p(S, ara("bıçağa"), E("darbe"), 0.45)
