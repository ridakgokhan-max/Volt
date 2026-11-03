"""Otomatik kukla kurulumu: DWPose noktaları + karakter maskesi -> eklemler, parça maskeleri, göz konumları.

Kullanım (kod içinden):
    rig = auto_rig(bgr, mask, pose_json_path, beard=True)
    rig["joints"]  -> {"hip","feet","neck","headtop","chin","beardtip","shL","elL","wrL","hdL","shR",...}
    rig["masks"]   -> {"armL": HxW uint8, "armR": ..., "head": ...}
    rig["eyes"]    -> [((cx,cy), rx, ry), ...]  (görüntüde soldan sağa)
    rig["mouth"]   -> ((cx,cy), w, h)
"""
import json

import cv2
import numpy as np

# COCO-WholeBody indeksleri
NOSE, EYE_L, EYE_R = 0, 1, 2
SH = (5, 6)
EL = (7, 8)
WR = (9, 10)
HIP = (11, 12)
KNEE = (13, 14)
ANK = (15, 16)
FACE0 = 23
HAND0 = (91, 112)  # kişinin sol eli, sağ eli
THR = 0.3


def _seg_dist(shape, a, b):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a, b = np.array(a, np.float32), np.array(b, np.float32)
    ab = b - a
    t = np.clip(((xx - a[0]) * ab[0] + (yy - a[1]) * ab[1]) / (ab @ ab + 1e-9), 0, 1)
    return np.hypot(xx - (a[0] + t * ab[0]), yy - (a[1] + t * ab[1]))


def _largest(m, touch=None):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    if n <= 1:
        return m.astype(np.uint8)
    if touch is not None:
        ids = np.unique(lab[touch > 0])
        ids = ids[ids > 0]
        if len(ids):
            k = ids[np.argmax(st[ids, 4])]
            return (lab == k).astype(np.uint8)
    return (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)


def _arm_mask(bgr, mask, chain, torso_poly, radius):
    """Kolu gövdeden renk + konumla (GrabCut) ayırır."""
    h, w = mask.shape
    d = np.min([_seg_dist((h, w), chain[i], chain[i + 1]) for i in range(len(chain) - 1)], axis=0)
    roi = (mask > 0) & (d < radius * 1.6)
    gc = np.full((h, w), cv2.GC_BGD, np.uint8)
    gc[roi] = cv2.GC_PR_BGD
    gc[roi & (d < radius * 0.9)] = cv2.GC_PR_FGD
    seed = np.zeros((h, w), np.uint8)
    for i in range(len(chain) - 1):
        cv2.line(seed, tuple(map(int, chain[i])), tuple(map(int, chain[i + 1])), 1, max(3, int(radius * 0.25)))
    gc[(seed > 0) & (mask > 0)] = cv2.GC_FGD
    tq = np.zeros((h, w), np.uint8)
    cv2.fillPoly(tq, [np.round(np.array(torso_poly)).astype(np.int32)], 1)
    gc[(tq > 0) & (gc != cv2.GC_FGD) & (mask > 0)] = cv2.GC_BGD
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(bgr, gc, None, bgm, fgm, 5, cv2.GC_INIT_WITH_MASK)
    arm = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)) & (mask > 0)
    arm = cv2.morphologyEx(arm.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    arm = _largest(arm, seed)
    arm = cv2.morphologyEx(arm, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    return arm


def auto_rig(bgr, mask, pose_path, beard=False):
    people = json.load(open(pose_path))["people"]

    def area(pp):  # gövde noktalarının kapladığı alan: en büyük kişi = asıl karakter
        k_ = np.array(pp["keypoints"])[:17]
        return np.ptp(k_[:, 0]) * np.ptp(k_[:, 1]) * float(np.mean(pp["scores"][:17]) > 0.3)
    P = max(people, key=area)
    k = np.array(P["keypoints"], np.float32)
    s = np.array(P["scores"], np.float32)
    h, w = mask.shape

    def mid(i, j):
        return (k[i] + k[j]) / 2

    # görüntüde soldaki/sağdaki taraf (kişinin sol/sağına göre değil)
    left_is_0 = k[SH[0]][0] < k[SH[1]][0]
    side_idx = {"L": 0 if left_is_0 else 1, "R": 1 if left_is_0 else 0}

    J = {}
    J["hip"] = mid(*HIP)
    J["feet"] = mid(*ANK)
    neck = mid(*SH)
    J["neck"] = neck - np.array([0, 0.04 * np.linalg.norm(k[SH[0]] - k[SH[1]])])
    face = k[FACE0:FACE0 + 68]
    fs = s[FACE0:FACE0 + 68]
    J["chin"] = face[8] if fs[8] > THR else k[NOSE] + (k[NOSE] - neck) * -0.35
    col = mask[:, max(0, int(k[NOSE][0]) - 6):int(k[NOSE][0]) + 6].max(1)
    top = np.nonzero(col)[0]
    J["headtop"] = np.array([k[NOSE][0], top[0] if len(top) else k[NOSE][1] - 120], np.float32)
    head_h = J["chin"][1] - J["headtop"][1]
    J["beardtip"] = J["chin"] + np.array([0, 0.55 * head_h])

    for S, i in side_idx.items():
        sh, el, wr = k[SH[i]], k[EL[i]], k[WR[i]]
        hb = HAND0[i]
        tip = k[hb + 12] if s[hb + 12] > THR else wr + (wr - el) * 0.4
        J["sh" + S], J["el" + S], J["wr" + S], J["hd" + S] = sh, el, wr, tip

    sw = np.linalg.norm(k[SH[0]] - k[SH[1]])
    radius = 0.2 * sw
    # gövde dörtgeni: omuzlar ve kalçalar (kalçalar dışa açılarak)
    hl, hr = k[HIP[side_idx["L"]]], k[HIP[side_idx["R"]]]
    hw = abs(hr[0] - hl[0])
    torso = [J["shL"] + [radius * 0.55, radius * 0.3], J["shR"] + [-radius * 0.55, radius * 0.3],
             hr + [hw * 0.35, 0], hl - [hw * 0.35, 0]]
    masks = {}
    for S in ("L", "R"):
        chain = [J["sh" + S], J["el" + S], J["wr" + S], J["hd" + S]]
        masks["arm" + S] = _arm_mask(bgr, mask, chain, torso, radius)

    # baş: boyun çizgisinin üstü; sakal varsa çenenin altındaki sakal rengi bölgesi de eklenir
    yy, xx = np.mgrid[0:h, 0:w]
    fw = np.linalg.norm(face[0] - face[16]) if fs[0] > THR and fs[16] > THR else sw * 0.6
    fc = face[27:36].mean(0) if fs[27:36].mean() > THR else k[NOSE]
    xw = np.where(yy < J["chin"][1], fw * 0.95, fw * 0.5)  # çenenin altında sadece boyun genişliği
    head = (mask > 0) & (yy < J["neck"][1] - 0.02 * sw) & (np.abs(xx - fc[0]) < xw)
    if beard:
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        smp = lab[int(J["chin"][1] + 0.12 * head_h):int(J["chin"][1] + 0.22 * head_h),
                  int(J["chin"][0] - 0.1 * fw):int(J["chin"][0] + 0.1 * fw)].reshape(-1, 3).mean(0)
        sim = np.linalg.norm(lab - smp, axis=2) < 28
        ell = ((xx - J["chin"][0]) / (fw * 0.62)) ** 2 + ((yy - J["chin"][1]) / (0.75 * head_h)) ** 2 < 1
        bm = (mask > 0) & sim & ell & (yy > J["chin"][1] - 0.1 * head_h)
        bm = cv2.morphologyEx(bm.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        head = head | (bm > 0)
        ys = np.nonzero(bm.any(1))[0]
        if len(ys):
            J["beardtip"] = np.array([J["chin"][0], ys.max() - 4], np.float32)
    for S in ("L", "R"):
        head &= masks["arm" + S] == 0
    head = _largest(cv2.morphologyEx(head.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)))
    masks["head"] = head

    eyes = []
    for a, b in ((36, 42), (42, 48)):
        pts, sc = face[a:b], fs[a:b]
        if sc.mean() > THR:
            c = pts.mean(0)
            rx = (pts[:, 0].max() - pts[:, 0].min()) / 2 * 1.15
            ry = max((pts[:, 1].max() - pts[:, 1].min()) / 2 * 1.3, rx * 0.5)
            eyes.append(((int(round(c[0])), int(round(c[1]))), int(round(rx)), int(round(ry))))
    eyes.sort(key=lambda e: e[0][0])
    mo = face[48:68]
    mouth = ((float(mo[:, 0].mean()), float(mo[:, 1].mean())), float(np.ptp(mo[:, 0])), float(np.ptp(mo[:, 1])))
    return {"joints": {n: tuple(map(float, v)) for n, v in J.items()}, "masks": masks, "eyes": eyes,
            "mouth": mouth, "sides": side_idx}
