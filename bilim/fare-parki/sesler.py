"""Efektler: kafes metali, şişe, kalp, kapanış."""


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    p(S, 0.05, B.katman(E("sihir"), B.shimmer(1.0)), 0.3)
    p(S, ara("kafese"), B.lock_close(), 0.35)
    p(S, ara("normal"), E("pop"), 0.35)
    p(S, ara("uyuşturucu", st["siseler"]), B.zap(0.4), 0.25)
    p(S, ara("bağımlılık", st["icme"]), B.stamp(), 0.5)
    p(S, ara("nokta", st["icme"]), B.thud(), 0.55)
    p(S, ara("merak", st["merak"]), B.ding(), 0.3)
    p(S, ara("kafes", st["merak"]), B.stinger(), 0.35)
    p(S, ara("park", st["park"]), B.katman(B.riser(0.6), E("jingle_basari")), 0.4)
    p(S, ara("arkadaşları"), B.chime_up(), 0.35)
    p(S, ara("dokunmadı"), E("pop"), 0.35)
    p(S, ara("geri", st["donus"]), B.chime_up(), 0.3)
    p(S, ara("yayınlanmadı"), B.stamp(), 0.45)
    p(S, ara("ama", st["dipnot"]), B.sparkle(), 0.3)
    p(S, ara("bağ", st["final"], 1), B.katman(E("sihir"), B.shimmer(1.4)), 0.4)
