"""İstanbul'un Fethi — film ses tasarımı.

muzik(): konuya özel film müziği + ortam katmanları (ses altında kısılır: sidechain).
cues(): anlık efektler (top, çarpma, kese, mühür, çan, davul, sikke...).
Yönetmen ilkesi: "her şey susuyor" sözünde HER ŞEY susar — yalnızca fitil cızırtısı ve bir kalp atışı kalır;
sonra top. Geri dönüş (1452) uğultulu koro; son saldırıda davul + çan + savaş çığlığı; sonda açılışın ortamına dönülür.
Kaynaklar: sesler/freesound (yalnızca CC0) — kaynaklar.json.
"""
import os
import subprocess

import numpy as np

FS = "sesler/freesound/"


def _yukle(B, ad, bas=0.0):
    yol = os.path.join(B._ROOT, FS + ad)
    if not os.path.exists(yol):
        print("ses yok:", ad)
        return np.zeros(int(0.1 * B.SR))
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", str(bas), "-i", yol, "-ac", "1", "-ar", str(B.SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    tepe = np.max(np.abs(x)) if len(x) else 1
    return x / max(tepe, 1e-6)


def _yerlestir(B, buf, t0, t1, x, g, fi=0.8, fo=0.8):
    """x sesini [t0, t1] aralığına (gerekirse döngüyle) yumuşak giriş/çıkışla koyar."""
    SR = B.SR
    i0, i1 = int(max(0, t0) * SR), min(len(buf), int(t1 * SR))
    n = i1 - i0
    if n <= 0 or len(x) == 0:
        return
    if len(x) < n:
        x = np.tile(x, n // len(x) + 1)
    y = x[:n].copy()
    a, b = min(n, int(fi * SR)), min(n, int(fo * SR))
    if a:
        y[:a] *= np.linspace(0, 1, a)
    if b:
        y[-b:] *= np.linspace(1, 0, b)
    buf[i0:i1] += y * g


def _cizirti(B, d):
    """fitil cızırtısı: tıslayan gürültü + rastgele çıtırtılar"""
    SR = B.SR
    n = int(d * SR)
    r = np.random.default_rng(7)
    g = r.normal(0, 1, n)
    hiss = np.diff(np.concatenate([[0], g])) * 0.25  # tiz tıslama
    cit = np.zeros(n)
    for _ in range(int(d * 26)):
        k = r.integers(0, n - 400)
        cit[k:k + 400] += r.normal(0, 1, 400) * np.exp(-np.arange(400) / 60) * r.uniform(0.3, 1)
    mod = 0.7 + 0.3 * np.sin(np.arange(n) / SR * 2 * np.pi * 7)
    y = (hiss * mod + cit * 0.6)
    y[: int(0.2 * SR)] *= np.linspace(0, 1, int(0.2 * SR))
    return y / max(np.max(np.abs(y)), 1e-6)


def muzik(B, sure, ara):
    SR = B.SR
    m = np.zeros(int(sure * SR))
    # ---- zaman çizelgesi (kurgu sonrası saniye) ----
    t_sus = ara("susuyor")
    t_gur = ara("gürleme")
    t_toz = ara("toz")
    t_bir = ara("yıl") - 0.6  # "Bir yıl önce" — geri dönüş
    t_bab = ara("babil'in")
    t_haf = ara("haftalar")
    t_gem = ara("gemileri") - 0.9
    t_tek = ara("teklif") - 0.9
    t_kon = ara("konstantin")
    t_28 = ara("28")
    t_dav = ara("davullar")
    t_kil = ara("kilise")
    t_sal = ara("saldırı")
    t_29 = ara("29")
    t_anl = ara("anlatılanlara")
    t_gen = ara("genç")
    t_her = ara("her", sonra=t_gen)

    DRONE = _yukle(B, "cinematic_drone_dark_724667.mp3", 2)
    SUB = _yukle(B, "cinematic_drone_dark_452999.mp3")
    ORK = _yukle(B, "epic_orchestral_621294.mp3", 4.2)
    DAVUL = _yukle(B, "war_drum_loop_527829.mp3")
    KORO_A = _yukle(B, "choir_dark_685679.mp3")
    KORO_F = _yukle(B, "choir_dark_685680.mp3")
    KORO7 = _yukle(B, "choir_dark_730181.mp3", 2)
    RUZ = _yukle(B, "wind_howl_778384.mp3")
    ATES = _yukle(B, "fire_crackle_549208.mp3")
    CAN = _yukle(B, "church_bell_toll_329324.mp3")
    CAN2 = _yukle(B, "church_bell_toll_824588.mp3")
    SAVAS = _yukle(B, "battle_crowd_764046.mp3")
    SAVAS2 = _yukle(B, "battle_crowd_764047.mp3")
    GICIR = _yukle(B, "ship_wood_creak_452105.mp3")

    Y = lambda *a, **k: _yerlestir(B, m, *a, **k)  # noqa: E731
    # 1) açılış: karanlık uğultu + kamp ateşi + rüzgâr → "susuyor"da her şey kesilir
    Y(0, t_sus + 0.35, DRONE, 0.32, fi=1.2, fo=0.45)
    Y(0, t_sus + 0.35, ATES, 0.22, fi=0.6, fo=0.45)
    Y(0, t_sus + 0.35, RUZ, 0.12, fi=1.5, fo=0.45)
    # 2) top: alçak uğultu (sub) gürlemeden sonra
    Y(t_gur, t_gur + 7, SUB, 0.45, fi=0.05, fo=3)
    # 3) ordu görünür: davul + orkestra yükselir
    Y(t_toz - 0.5, t_bir + 0.2, DAVUL, 0.42, fi=2.5, fo=0.6)
    Y(t_toz - 0.2, t_bir + 0.3, ORK, 0.5, fi=2.0, fo=0.8)
    # 4) geri dönüş 1452: mırıldanan koro + ince uğultu; Babil sözünde koro vuruşu
    Y(t_bir, t_haf + 0.2, KORO_A, 0.32, fi=0.8, fo=0.6)
    Y(t_bir, t_haf + 0.2, DRONE[int(30 * SR):], 0.12, fi=1.0, fo=0.6)
    Y(t_bab - 0.4, t_haf + 0.2, KORO7, 0.32, fi=0.6, fo=0.5)
    # 5) haftalar: davul + orkestra (kaldığı yerden)
    Y(t_haf - 0.1, t_gem + 0.3, DAVUL[int(20 * SR):], 0.4, fi=0.6, fo=0.8)
    Y(t_haf - 0.1, t_gem + 0.4, ORK[int(26 * SR):], 0.45, fi=0.8, fo=0.8)
    # 6) gemiler: gece, gıcırtı, rüzgâr
    Y(t_gem, t_tek + 0.3, DRONE[int(12 * SR):], 0.3, fi=0.8, fo=0.6)
    Y(t_gem, t_tek + 0.3, GICIR, 0.32, fi=0.6, fo=0.6)
    Y(t_gem, t_tek + 0.3, RUZ, 0.1, fi=0.6, fo=0.6)
    # 7) teklif: gerilim (rüzgârlı bayraklar)
    Y(t_tek, t_kon + 0.2, RUZ[int(8 * SR):], 0.24, fi=0.6, fo=0.5)
    Y(t_tek, t_kon + 0.3, SUB, 0.22, fi=0.8, fo=0.6)
    # 8) Konstantin'in cevabı: koro + alçak orkestra
    Y(t_kon - 0.2, t_28 + 0.2, KORO7[int(14 * SR):], 0.34, fi=1.0, fo=1.2)
    Y(t_kon - 0.2, t_28 + 0.2, ORK[int(50 * SR):], 0.26, fi=1.5, fo=1.2)
    # 9) Ayasofya: hüzünlü koro + uzak çan
    Y(t_28 - 0.4, t_dav + 0.1, KORO_F, 0.4, fi=1.0, fo=0.4)
    Y(t_28 - 0.2, t_dav + 0.1, CAN2, 0.22, fi=0.8, fo=0.4)
    # 10) son saldırı: davul + çan + savaş çığlığı + orkestra
    Y(t_dav - 0.05, t_29 - 0.2, DAVUL[int(40 * SR):], 0.75, fi=0.05, fo=0.4)
    Y(t_kil - 0.05, t_29 - 0.2, CAN, 0.5, fi=0.1, fo=0.4)
    Y(t_sal - 0.3, t_29 - 0.2, SAVAS, 0.8, fi=0.2, fo=0.4)
    Y(t_sal + 0.6, t_29 - 0.2, SAVAS2, 0.55, fi=0.4, fo=0.4)
    Y(t_dav, t_29 - 0.2, ORK[int(70 * SR):], 0.4, fi=1.2, fo=0.4)
    # 11) 29 Mayıs sabahı: orkestra yükselir, sonra alçalır (anlatılanlara göre…)
    Y(t_29 - 0.1, t_gen + 0.2, ORK[int(80 * SR):], 0.55, fi=0.8, fo=0.8)
    Y(t_29, t_gen + 0.2, RUZ[int(20 * SR):], 0.18, fi=1.0, fo=0.8)
    # 12) beyit: boş saray, rüzgâr + tek koro
    Y(t_gen - 0.2, t_her + 0.3, RUZ, 0.3, fi=0.6, fo=0.5)
    Y(t_gen - 0.1, t_her + 0.3, KORO_A[int(3 * SR):], 0.25, fi=1.0, fo=0.6)
    # 13) son: açılışın ortamına dönüş (döngü)
    Y(t_her - 0.2, sure, DRONE, 0.3, fi=0.8, fo=1.2)
    Y(t_her - 0.2, sure, ATES, 0.2, fi=0.8, fo=1.2)
    tepe = np.max(np.abs(m))
    return m / max(tepe, 1e-6) * 0.9


def cues(B, S, wt, st, sure, ara):
    p, E = B.put, B.efekt
    Y = lambda ad, bas=0.0: _yukle(B, ad, bas)  # noqa: E731
    SR = B.SR
    t_son = ara("sonra")
    t_kus = ara("kuşlar")
    t_gur = ara("gürleme")
    t_car = ara("çarpıyor")
    # açılış (geleceğe sıçrama): videonun ilk karesinde top ateşi
    p(S, 0.0, Y("cannon_fire_853281.mp3"), 0.85)
    p(S, 0.01, Y("low_boom_cinematic_856174.mp3")[: int(1.6 * SR)] * np.linspace(1, 0, int(1.6 * SR)), 0.6)
    # fitil cızırtısı: "Sonra"dan gürlemeye kadar (sessizlikte tek ses o)
    p(S, t_son - 0.2, _cizirti(B, t_gur - t_son + 0.15), 0.16)
    p(S, t_kus + 0.75, E("kalp"), 0.4)  # sessizlikte tek kalp atışı
    for k in range(3):
        p(S, t_kus + k * 0.12, E("kumas"), 0.22)  # kuşların kanat çırpışı
    # GÜRLEME: katmanlı top sesi
    p(S, t_gur - 0.04, Y("cannon_fire_853281.mp3"), 1.0)
    p(S, t_gur - 0.02, Y("low_boom_cinematic_856174.mp3"), 0.85)
    p(S, t_gur, Y("cannon_fire_186930.mp3"), 0.55)
    p(S, t_gur + 0.35, B.whoosh(max(1.0, t_car - t_gur - 0.3)), 0.25)  # ağır çekim gülle
    # ÇARPMA
    p(S, t_car - 0.03, E("darbe_agir"), 0.8)
    p(S, t_car, Y("stone_impact_debris_569501.mp3"), 0.75)
    p(S, t_car + 0.08, Y("stone_impact_debris_569506.mp3"), 0.6)
    p(S, t_car + 0.2, Y("rubble_falling_462690.mp3"), 0.55)
    p(S, t_car, E("vurus"), 0.5)
    # ordu / isimler
    p(S, ara("mehmed") - 0.05, Y("war_drums_468903.mp3"), 0.45)
    p(S, ara("urban") - 0.05, E("darbe_hafif"), 0.35)
    # geri dönüş girişi
    t_bir = ara("yıl") - 0.6
    p(S, t_bir - 0.5, B.riser(0.6), 0.25)
    p(S, t_bir, E("deklansor"), 0.25)
    t_maas = ara("maaşını")
    p(S, t_maas + 0.55, E("para"), 0.45)  # keseden tek sikke
    p(S, ara("ödeyemedi"), E("darbe"), 0.6)  # mühür
    p(S, ara("ödeyemedi") + 0.02, E("kagit"), 0.35)
    t_urb = ara("urban", sonra=ara("ödeyemedi"))
    for k in range(5):
        p(S, t_urb + 0.1 + k * 0.33, E("adim"), 0.22)
    p(S, ara("toz", sonra=ara("babil'in")), Y("rubble_falling_462690.mp3"), 0.35)
    p(S, ara("toz", sonra=ara("babil'in")), Y("low_boom_cinematic_263895.mp3"), 0.4)
    # haftalar: uzak top atışları
    t_haf = ara("haftalar")
    p(S, t_haf - 0.3, B.whoosh(0.5), 0.3)
    for k in range(6):
        p(S, t_haf + 0.4 + k * 1.05, Y("cannon_blast_distant_565794.mp3"), 0.35 - k * 0.03)
    p(S, ara("indiriyor") + 0.35, E("su_sicrama"), 0.28)
    p(S, ara("teslim") - 0.35, E("kitap_ac"), 0.35)
    p(S, ara("ölmeye"), E("metal"), 0.3)
    p(S, ara("ayasofya'da") - 0.1, E("zil"), 0.18)
    # son saldırı
    p(S, ara("davullar") - 0.03, Y("war_drums_468903.mp3"), 0.6)
    p(S, ara("kilise") - 0.05, E("metal_agir"), 0.4)
    t_sal = ara("saldırı")
    p(S, t_sal, E("patlama"), 0.5)
    sv = Y("battle_crowd_764046.mp3")[: int(1.9 * SR)]
    sv[-int(0.5 * SR):] *= np.linspace(1, 0, int(0.5 * SR))
    p(S, t_sal + 0.55, sv, 0.45)  # savaş çığlığı: konuşma bittikten sonra öne çıkar
    for k, ad in enumerate(["sword_clash_326787.mp3", "sword_clash_326795.mp3", "sword_clash_326841.mp3", "sword_clash_326862.mp3"]):
        p(S, t_sal + 0.75 + k * 0.38, Y(ad), 0.32)
    # 29 Mayıs
    t_29 = ara("29")
    p(S, t_29 - 0.9, B.riser(0.9), 0.25)
    p(S, ara("sancağı"), E("kumas"), 0.4)
    p(S, ara("anlatılanlara") + 0.4, E("zil"), 0.15)
    p(S, ara("örümcek"), E("sihir"), 0.18)
    # son: uzak top yankısı + sikke
    t_g2 = ara("gürleme", sonra=ara("genç"))
    p(S, t_g2, Y("cannon_blast_distant_565794.mp3")[: int(2.0 * SR)] * np.linspace(1, 0, int(2.0 * SR)), 0.55)
    lb = Y("low_boom_cinematic_263895.mp3")[: int(1.2 * SR)]
    lb[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
    p(S, t_g2, lb, 0.3)
    t_m = ara("maaşla")
    p(S, t_m - 0.02, E("para"), 0.6)
    p(S, t_m + 0.03, E("metal"), 0.25)
    _ = (wt, st, sure, SR)
