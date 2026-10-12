"""Parmak izi videosu için efekt yerleşimi. wt(i): i. kelimenin videodaki saniyesi; st: sahne başlangıçları."""


def cues(B, S, wt, st, sure):
    p = B.put
    # 1 giriş
    p(S, 0.0, B.boom(48, 1.6), 0.5)
    p(S, 0.0, B.shimmer(2.5), 0.6)
    p(S, wt(1) - 0.1, B.whoosh(0.9, 6000), 0.5)
    p(S, wt(4), B.ding(1568, 1.4, 0.4), 0.7)
    p(S, wt(4), B.sparkle(0.6), 0.4)
    # 2 fotoğraf
    p(S, wt(12) - 0.25, B.pop(500), 0.5)
    p(S, wt(12), B.shutter(), 0.9)
    p(S, wt(13), B.whoosh(0.35, 3000), 0.5)
    p(S, wt(14), B.stamp(), 0.9)
    # 3 yakın plan
    p(S, wt(16) - 0.2, B.riser(0.9), 0.5)
    p(S, wt(17), B.pop(640), 0.6)
    p(S, wt(19), B.pop(420), 0.6)
    p(S, wt(21), B.scan(1.3), 0.45)
    # 4 sensörler
    p(S, wt(26) - 0.3, B.whoosh(0.4, 3500), 0.5)
    p(S, wt(26), B.shimmer(1.2), 0.6)
    p(S, wt(35) - 0.5, B.whoosh(0.4, 3500), 0.5)
    p(S, wt(35), B.zap(0.5), 0.6)
    p(S, wt(40) - 0.4, B.whoosh(0.4, 3500), 0.5)
    p(S, wt(41), B.sonar(), 0.6)
    p(S, wt(43), B.sonar(980), 0.35)
    # 5 noktalar
    p(S, st["noktalar"] + 0.05, B.chalk(1.6), 0.6)
    p(S, wt(49), B.sparkle(0.7), 0.5)
    p(S, wt(54), B.blip(988, 0.15), 0.5)
    p(S, wt(54) + 0.12, B.blip(1319, 0.15), 0.4)
    p(S, wt(57), B.blip(1175, 0.15), 0.5)
    p(S, wt(57) + 0.12, B.blip(1568, 0.15), 0.4)
    # 6 harita: takımyıldız gibi bağlanır
    a, b = wt(60), wt(69)
    notes = [523, 587, 659, 784, 880, 1047, 880, 784, 1047, 1175, 1319, 1568]
    for k, f in enumerate(notes):
        p(S, a + (b - a) * k / len(notes), B.ding(f, 0.7, 0.2), 0.28)
    p(S, wt(69), B.chime_up(659, 1.26, 4, 0.08), 0.6)
    # 7 kasa
    p(S, wt(73), B.whoosh(0.6, 2500), 0.5)
    p(S, wt(76) - 0.1, B.ticks(max(0.3, wt(77) - wt(76)), 24), 0.45)
    p(S, wt(77), B.lock_close(), 1.0)
    p(S, wt(78) - 0.2, B.powerup(0.9), 0.6)
    p(S, wt(80), B.whoosh(0.8, 3000), 0.5)
    p(S, wt(80) + 0.85, B.thud(), 0.6)
    # 8 kontrol
    p(S, wt(84), B.tap(), 0.6)
    p(S, wt(87), B.pop(600), 0.5)
    p(S, wt(91), B.pop(760), 0.5)
    p(S, wt(92), B.meter(1.0), 0.45)
    p(S, wt(94), B.ding(1760, 1.2, 0.35), 0.6)
    p(S, wt(96) - 0.15, B.unlock(), 0.9)
    # 9 son
    p(S, wt(101), B.buzz(), 0.4)
    p(S, wt(104), B.sparkle(0.8), 0.55)
    p(S, wt(105) + 0.35, B.stinger(), 0.7)
