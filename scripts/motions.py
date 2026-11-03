"""Hareket kütüphanesi ve zamanlayıcı (kukla motoru için).

Kemik adları (standart kukla): legs, spine, head, [beard], uarmL, farmL, handL, uarmR, farmR, handR
"L" = görüntüde SOLDAKİ kol, "R" = görüntüde SAĞDAKİ kol. Açılar görüntü koordinatında derece:
0 = sağ, 90 = aşağı, 180 = sol, -90 = yukarı.

Sahne dili örneği:
    "el_salla:R@0.5/3.0, gulumse@3.4, evet@4.2, isaret_et:L@5.5/1.8"
    (eylem[:taraf]@başlangıç[/süre])

Her eylem yumuşak giriş/çıkış zarfıyla (ease) karışır; üst üste binen eylemler sırayla harmanlanır.
Kendiliğinden: nefes, hafif baş salınımı, rastgele göz kırpma.
"""
import re

import numpy as np

from puppet import ease

D2R = np.pi / 180


def wrap(a):
    return (a + np.pi) % (2 * np.pi) - np.pi


def rest_dir(b):
    return np.arctan2(b.tail[1] - b.head[1], b.tail[0] - b.head[0])


class Rig:
    """Kukla üzerinde dünya yönü / IK hedeflerini yerel kemik açılarına çeviren yardımcı."""

    def __init__(self, pup):
        self.p = pup
        self.B = pup.B

    def total_rot(self, name):
        """Kemiğin (ve atalarının) toplam dönüşü."""
        a, b = 0.0, self.B[name]
        while b is not None:
            a += b.angle
            b = self.B[b.parent] if b.parent else None
        return a

    def parent_rot(self, name):
        b = self.B[name]
        return self.total_rot(b.parent) if b.parent else 0.0

    def aim(self, name, world_deg):
        """Kemiği dünya yönüne çevirecek yerel açı."""
        b = self.B[name]
        return wrap(world_deg * D2R - rest_dir(b) - self.parent_rot(name))

    def ik(self, side, target, bend=1):
        """Kolun elini (bilek) hedef noktaya götürecek üst kol ve ön kol yerel açıları."""
        up, fo = self.B["uarm" + side], self.B["farm" + side]
        S, _ = self.p.bone_pos(up.name)
        L1 = np.hypot(up.tail[0] - up.head[0], up.tail[1] - up.head[1])
        L2 = np.hypot(fo.tail[0] - fo.head[0], fo.tail[1] - fo.head[1])
        v = np.array(target, float) - S
        d = np.clip(np.linalg.norm(v), abs(L1 - L2) + 1, L1 + L2 - 1)
        a0 = np.arctan2(v[1], v[0])
        al = np.arccos(np.clip((L1 ** 2 + d ** 2 - L2 ** 2) / (2 * L1 * d), -1, 1))
        uw = a0 + bend * al
        E = S + L1 * np.array([np.cos(uw), np.sin(uw)])
        T = S + d * np.array([np.cos(a0), np.sin(a0)])
        fw = np.arctan2(T[1] - E[1], T[0] - E[0])
        u_loc = wrap(uw - rest_dir(up) - self.parent_rot(up.name))
        f_loc = wrap(fw - rest_dir(fo) - (self.parent_rot(up.name) + u_loc))
        return u_loc, f_loc


def _out(side):
    """Kolun dışa doğru yönü (derece)."""
    return 180.0 if side == "L" else 0.0


def _mir(side, deg_for_L):
    """Sol kol için verilen açıyı sağ kola aynala (yatay eksende)."""
    return deg_for_L if side == "L" else 180.0 - deg_for_L


# ---------- eylemler ----------
# Her eylem: f(rig, tau, dur, side, args) -> dict
#   "aim": {kemik: dünya_açısı}, "ik": {side: hedef_nokta}, "add": {kemik: ek_açı_derece},
#   "stretch"/"width": {kemik: çarpan}, "tex": {ad: 0..1}, "sprite": {ad: 0..1}, "offset": (dx, dy)

def el_salla(rig, tau, dur, side="R", a=None):
    osc = 20 * np.sin(2 * np.pi * 1.6 * max(0, tau - 0.7)) * ease((tau - 0.7) / 0.3)
    return {"aim": {"uarm" + side: _mir(side, 235), "farm" + side: _mir(side, 268) + (osc if side == "R" else -osc),
                    "hand" + side: _mir(side, 268)},
            "add": {"spine": (2.0 if side == "L" else -2.0), "head": (-2.5 if side == "L" else 2.5)},
            "sprite": {"acik" + side: 1.0}}


def isaret_et(rig, tau, dur, side="R", a=None):
    up = -30 + 4 * np.sin(2 * np.pi * 0.5 * tau)
    d = _mir(side, 180 - up)
    return {"aim": {"uarm" + side: d, "farm" + side: d, "hand" + side: d},
            "add": {"head": (-5 if side == "L" else 5)},
            "sprite": {("isaret" if "isaret" + side in rig.p.sprites else "acik") + side: 1.0}}


def evet(rig, tau, dur, side=None, a=None):
    k = np.abs(np.sin(2 * np.pi * 1.4 * tau))
    return {"stretch": {"head": 1 - 0.055 * k}, "add": {"head": 0}}


def hayir(rig, tau, dur, side=None, a=None):
    s = np.sin(2 * np.pi * 1.5 * tau)
    return {"add": {"head": 6 * s}, "width": {"head": 1 - 0.035 * abs(s)}}


def omuz_silk(rig, tau, dur, side=None, a=None):
    return {"aim": {"uarmL": 106, "farmL": 188, "handL": 230, "uarmR": 74, "farmR": -8, "handR": -50},
            "add": {"head": 7}, "stretch": {"spine": 1.018}, "sprite": {"acikL": 1.0, "acikR": 1.0}}


def dusun(rig, tau, dur, side="R", a=None):
    hb = rig.B["head"]
    h, t = rig.p.bone_pos("head")
    chin = h + (t - h) * 0.32  # çene, boyun ile tepe arasında
    hl = np.linalg.norm(t - h)
    off = 0.17 * hl if side == "R" else -0.17 * hl
    tgt = (chin[0] + off, chin[1] + 0.3 * hl)  # yumruk sakalın yanında, çenenin altında
    tap = 4 * np.sin(2 * np.pi * 1.2 * tau) * ease((tau - 0.8) / 0.3)
    return {"ik": {side: (tgt[0], tgt[1] + tap)}, "aim": {"hand" + side: -90},
            "add": {"head": (-4 if side == "R" else 4)}, "sprite": {"yumruk" + side: 1.0}}


def sevin(rig, tau, dur, side=None, a=None):
    hop = -38 * np.abs(np.sin(2 * np.pi * 1.4 * tau))
    w = 10 * np.sin(2 * np.pi * 2.8 * tau)
    return {"aim": {"uarmL": 240, "farmL": 265 - w, "handL": 265, "uarmR": -60, "farmR": -85 + w, "handR": -85},
            "tex": {"smile": 1.0}, "sprite": {"acikL": 1.0, "acikR": 1.0}, "offset": (0, hop)}


def gulumse(rig, tau, dur, side=None, a=None):
    return {"tex": {"smile": 1.0}, "add": {"head": 4}}


def gir(rig, tau, dur, side="L", a=None):
    """Sahneye yandan, hafif zıplayarak yürüyerek girer (side: hangi taraftan)."""
    p = ease(tau / max(dur - 0.35, 0.1))
    dx = (-1 if side == "L" else 1) * 760 * (1 - p)
    step = np.abs(np.sin(2 * np.pi * 1.8 * tau)) * (1 - p)
    sway = 3.5 * np.sin(2 * np.pi * 1.8 * tau) * (1 - p)
    return {"offset": (dx, -22 * step), "add": {"spine": sway, "head": -sway * 0.6},
            "aim_add": {"uarmL": sway * 3, "uarmR": sway * 3}}


ACTIONS = {"el_salla": el_salla, "isaret_et": isaret_et, "evet": evet, "hayir": hayir, "omuz_silk": omuz_silk,
           "dusun": dusun, "sevin": sevin, "gulumse": gulumse, "gir": gir}
DEFAULT_DUR = {"el_salla": 2.8, "isaret_et": 1.8, "evet": 1.2, "hayir": 1.4, "omuz_silk": 1.4, "dusun": 2.4,
               "sevin": 1.8, "gulumse": 2.0, "gir": 1.8}


def parse(script):
    """'el_salla:R@0.5/3.0, gulumse@3.4' -> [(ad, taraf, başlangıç, süre), ...]"""
    out = []
    for tok in [t.strip() for t in script.split(",") if t.strip()]:
        m = re.match(r"(\w+)(?::(\w))?@([\d.]+)(?:/([\d.]+))?$", tok)
        if not m:
            raise ValueError("anlaşılmadı: " + tok)
        name, side, st, du = m.groups()
        out.append((name, side, float(st), float(du) if du else DEFAULT_DUR[name]))
    return out


class Timeline:
    def __init__(self, pup, script, fade=0.45, seed=1, blinks=True):
        self.p, self.rig = pup, Rig(pup)
        self.items = sorted(parse(script), key=lambda x: x[2])
        self.fade = fade
        rng = np.random.default_rng(seed)
        self.blink_times = np.cumsum(rng.uniform(2.4, 3.8, 20)) - 1.6 if blinks else []
        self.rest = {b.name: (b.stretch, b.width) for b in pup.bones}

    def weight(self, st, du, t):
        if t < st or t > st + du:
            return 0.0
        return float(ease((t - st) / self.fade) * ease((st + du - t) / self.fade))

    def apply(self, t, amp=1.0):
        """t anındaki pozu kuklaya uygular; (tex_mix, sprite_mix, offset) döndürür."""
        B = self.p.B
        for b in self.p.bones:
            if not b.spring:
                b.angle = 0.0
            b.stretch, b.width = 1.0, 1.0
        # kendiliğinden hareketler
        B["spine"].stretch = 1 + 0.011 * np.sin(2 * np.pi * t / 3.0) * amp
        B["head"].angle = 1.2 * D2R * np.sin(2 * np.pi * t / 4.3) * amp
        for s in ("L", "R"):
            if "uarm" + s in B:
                B["uarm" + s].angle = 1.2 * D2R * np.sin(2 * np.pi * t / 3.0 + (0.5 if s == "R" else 0)) * amp
        tex, spr, off = {}, {}, np.zeros(2)
        order = ["legs", "spine", "head", "uarmL", "farmL", "handL", "uarmR", "farmR", "handR"]
        for name, side, st, du in self.items:
            if name == "gir" and t < st:  # girişten önce karakter sahne dışında bekler
                off += np.array(gir(self.rig, 0.0, du, side or "L")["offset"])
                continue
            w = self.weight(st, du, t) * amp
            if w <= 0:
                continue
            r = ACTIONS[name](self.rig, t - st, du, side or ("R" if name in ("el_salla", "isaret_et", "dusun") else "L"))
            for k, v in r.get("add", {}).items():
                B[k].angle += v * D2R * w
            for k, v in r.get("stretch", {}).items():
                B[k].stretch *= 1 + (v - 1) * w
            for k, v in r.get("width", {}).items():
                B[k].width *= 1 + (v - 1) * w
            for sd, tgt in r.get("ik", {}).items():
                u, f = self.rig.ik(sd, tgt)
                B["uarm" + sd].angle += wrap(u - B["uarm" + sd].angle) * w
                B["farm" + sd].angle += wrap(f - B["farm" + sd].angle) * w
            aims = r.get("aim", {})
            for k in order:  # ebeveyn önce: çocuk yönleri güncel ebeveyne göre hesaplanır
                if k in aims and k in B:
                    want = self.rig.aim(k, aims[k])
                    B[k].angle += wrap(want - B[k].angle) * w
            for k, v in r.get("aim_add", {}).items():
                if k in B:
                    B[k].angle += v * D2R * w
            for k, v in r.get("tex", {}).items():
                tex[k] = max(tex.get(k, 0), v * w)
            for k, v in r.get("sprite", {}).items():
                spr[k] = max(spr.get(k, 0), v * w)
            if "offset" in r:
                off += np.array(r["offset"]) * (1 if name == "gir" else w)
        # göz kırpma
        for b0 in self.blink_times:
            d = t - b0
            if 0 <= d < 0.17:
                tex["blink"] = (1.0 if 0.04 <= d < 0.12 else 0.55) * amp
        # el çizimi görünürken el kemiği gerçek ele hizalı: kol kalkıyorsa el, ön kol doğrultusunda
        return tex, spr, off
