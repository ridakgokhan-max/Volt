"""Kukla motoru: tek bir karakter görselini eklemli 2D kuklaya çevirir (Spine/Live2D benzeri, tamamen yerel).

- Karakterin alfa maskesi üçgen ağa bölünür (Delaunay).
- Eklem noktalarından kemik hiyerarşisi kurulur; her ağ noktası yakınındaki kemiklere yumuşak ağırlıklarla bağlanır
  (doğrusal deri karışımı / linear blend skinning). Eklemlerde kırılma yerine yumuşak bükülme olur.
- Parçalar (gövde, baş, kollar) ayrı katmanlarda çizilip z-sırasıyla birleştirilir; böylece kol gövdenin önünden geçebilir.
- Sarkan parçalar (sakal, atkı ucu) yay-sönüm fiziğiyle hareketi gecikmeli takip eder ve salınır.
- Hareketler yumuşak (ease-in-out) anahtar karelerle tanımlanır.
"""
from dataclasses import dataclass, field

import cv2
import numpy as np
from scipy.spatial import Delaunay


def ease(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * x * (x * (6 * x - 15) + 10)  # smootherstep


def track(keys, t):
    """keys: [(zaman, değer), ...] — anahtar kareler arasında yumuşak geçiş."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            return v0 + (v1 - v0) * ease((t - t0) / max(t1 - t0, 1e-6))
    return keys[-1][1]


@dataclass
class Bone:
    name: str
    parent: str | None
    head: tuple  # eklem (dönme merkezi)
    tail: tuple
    part: str  # hangi katmanda çizileceği
    spring: dict | None = None  # sarkan parça ise yay ayarları {"k":..,"c":..,"follow":..}
    angle: float = 0.0  # yerel ek açı (radyan, görüntüde + saat yönü)
    stretch: float = 1.0  # kemik ekseni boyunca ölçek (nefes vb.)
    _phi: float = 0.0
    _vel: float = 0.0


def _rot_about(theta, c, stretch=1.0, axis=None):
    """c etrafında döndürme (+ isteğe bağlı eksen boyunca esneme) için 3x3 matris."""
    cx, cy = c
    T1 = np.array([[1, 0, -cx], [0, 1, -cy], [0, 0, 1.0]])
    T2 = np.array([[1, 0, cx], [0, 1, cy], [0, 0, 1.0]])
    S = np.eye(3)
    if stretch != 1.0 and axis is not None:
        a = np.array(axis, float)
        a /= np.linalg.norm(a) + 1e-9
        P = np.outer(a, a)
        S[:2, :2] = np.eye(2) + (stretch - 1) * P
    c_, s_ = np.cos(theta), np.sin(theta)
    R = np.array([[c_, -s_, 0], [s_, c_, 0], [0, 0, 1.0]])
    return T2 @ R @ S @ T1


@dataclass
class Puppet:
    rgba: np.ndarray  # H x W x 4, float32 (0..255 renk, 0..1 alfa)
    bones: list
    part_order: list
    spacing: int = 18
    blend: float = 14.0  # eklem çevresindeki yumuşak geçiş genişliği (px)
    textures: dict = field(default_factory=dict)  # ifade varyantları: ad -> rgba
    part_polys: dict = field(default_factory=dict)  # parça adı -> çokgen (x,y listesi); içindeki noktalar o parçaya ait

    def __post_init__(self):
        self.B = {b.name: b for b in self.bones}
        self.H, self.W = self.rgba.shape[:2]
        if self.part_polys:
            self._build_per_part()
        else:
            self._build_single()
        self._roots()
        self._weights()

    def _mesh(self, alpha_u8):
        """Bir maske için ızgara + kontur noktalarından üçgen ağ."""
        ys, xs = np.mgrid[0:self.H:self.spacing, 0:self.W:self.spacing]
        pts = np.column_stack([xs.ravel(), ys.ravel()]).astype(np.float32)
        pts = pts[alpha_u8[pts[:, 1].astype(int), pts[:, 0].astype(int)] > 0]
        cnts, _ = cv2.findContours(alpha_u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cpts = np.concatenate([c[::max(1, self.spacing // 2), 0, :] for c in cnts]).astype(np.float32)
        jp = np.array([b.head for b in self.bones] + [b.tail for b in self.bones], np.float32)
        jp = jp[alpha_u8[np.clip(jp[:, 1].astype(int), 0, self.H - 1), np.clip(jp[:, 0].astype(int), 0, self.W - 1)] > 0]
        V = np.unique(np.round(np.concatenate([pts, cpts, jp]), 1), axis=0)
        tri = Delaunay(V).simplices
        cen = V[tri].mean(1)
        keep = alpha_u8[np.clip(cen[:, 1].astype(int), 0, self.H - 1), np.clip(cen[:, 0].astype(int), 0, self.W - 1)] > 0
        e = np.linalg.norm(V[tri] - V[np.roll(tri, 1, 1)], axis=2).max(1)
        return V, tri[keep & (e < self.spacing * 3.2)]

    def _build_single(self):
        a = cv2.dilate((self.rgba[..., 3] > 0.05).astype(np.uint8), np.ones((9, 9), np.uint8))
        self.V, self.T = self._mesh(a)
        d = np.stack([self._seg_dist(b) for b in self.bones], 1)
        parts = np.array([b.part for b in self.bones]).astype(object)
        self.vpart = parts[d.argmin(1)]
        self.tri_part = np.array([max(set(r), key=list(r).count) for r in self.vpart[self.T]])
        self.part_alpha = {p: self.rgba[..., 3] for p in self.part_order}

    def _build_per_part(self):
        """Her parça kendi piksel maskesi ve kendi ağıyla: dikişsiz, birbirini sürüklemeyen parçalar."""
        alpha = self.rgba[..., 3]
        masks, union = {}, np.zeros((self.H, self.W), np.uint8)
        for name, poly in self.part_polys.items():
            m = np.zeros((self.H, self.W), np.uint8)
            cv2.fillPoly(m, [np.round(np.array(poly)).astype(np.int32)], 1)
            masks[name] = m
            union |= m
        self.part_alpha = {}
        for name in self.part_order:
            if name in masks:
                # çokgenli parça: 2 px taşarak örtüşür (dikiş görünmez)
                pa = alpha * cv2.dilate(masks[name], np.ones((5, 5), np.uint8))
            else:
                pa = alpha * (1 - union)
            self.part_alpha[name] = pa.astype(np.float32)
        Vs, Ts, vp, tp, off = [], [], [], [], 0
        for name in self.part_order:
            a = cv2.dilate((self.part_alpha[name] > 0.05).astype(np.uint8), np.ones((7, 7), np.uint8))
            if a.sum() == 0:
                continue
            V, T = self._mesh(a)
            Vs.append(V)
            Ts.append(T + off)
            vp += [name] * len(V)
            tp += [name] * len(T)
            off += len(V)
        self.V = np.concatenate(Vs)
        self.T = np.concatenate(Ts)
        self.vpart = np.array(vp, dtype=object)
        self.tri_part = np.array(tp, dtype=object)

    def _roots(self):
        self.root_of, self.attach = {}, {}
        for b in self.bones:
            if b.part not in self.root_of and (b.parent is None or self.B[b.parent].part != b.part):
                self.root_of[b.part] = b
                if b.parent is not None:
                    self.attach[b.part] = np.array(b.head, np.float32)

    def _seg_dist(self, b):
        a, c = np.array(b.head, np.float32), np.array(b.tail, np.float32)
        ab = c - a
        t = np.clip(((self.V - a) @ ab) / (ab @ ab + 1e-9), 0, 1)
        return np.linalg.norm(self.V - (a + t[:, None] * ab), axis=1)

    def _weights(self):
        V = self.V
        nb = len(self.bones)
        d = np.stack([self._seg_dist(b) for b in self.bones], 1)
        allowed = np.zeros((len(V), nb), bool)
        idx = {b.name: i for i, b in enumerate(self.bones)}
        for i, b in enumerate(self.bones):
            allowed[:, i] = self.vpart == b.part
        dd = np.where(allowed, d, np.inf)
        dmin = dd.min(1, keepdims=True)
        w = np.where(allowed, np.exp(-((dd - dmin) ** 2) / (2 * self.blend ** 2)), 0)
        w[dd - dmin > 3 * self.blend] = 0
        # bağlantı ekleminin yakınında ebeveyn kemiğe yumuşak geçiş (omuz/boyun dikişsiz kalsın)
        for part, rb in self.root_of.items():
            if rb.parent is None:
                continue
            sel = self.vpart == part
            dj = np.linalg.norm(V[sel] - np.array(rb.head, np.float32), axis=1)
            wp = np.exp(-(dj ** 2) / (2 * (self.blend * 1.3) ** 2))
            ws = w[sel] / np.maximum(w[sel].sum(1, keepdims=True), 1e-9)
            ws = ws * (1 - wp[:, None])
            ws[:, idx[rb.parent]] += wp
            w[sel] = ws
        self.Wt = w / np.maximum(w.sum(1, keepdims=True), 1e-9)

    # --- fizik ---
    def _world_angles(self):
        out = {}
        for b in self.bones:
            out[b.name] = b.angle + (out[b.parent] if b.parent else 0.0)
        return out

    def step_physics(self, dt):
        """Yaylı kemiklerin yerel açısını, ebeveynin dünya açısını gecikmeli takip edecek şekilde günceller."""
        wa = {}
        for b in self.bones:
            pw = wa[b.parent] if b.parent else 0.0
            if b.spring:
                k, c, follow = b.spring.get("k", 60), b.spring.get("c", 6), b.spring.get("follow", 0.5)
                target = pw * follow + b.spring.get("bias", 0.0)
                acc = -k * (b._phi - target) - c * b._vel
                b._vel += acc * dt
                b._phi += b._vel * dt
                b.angle = b._phi - pw
            wa[b.name] = pw + b.angle

    # --- deformasyon ---
    def matrices(self):
        M = {}
        for b in self.bones:
            P = M[b.parent] if b.parent else np.eye(3)
            axis = (b.tail[0] - b.head[0], b.tail[1] - b.head[1])
            M[b.name] = P @ _rot_about(b.angle, b.head, b.stretch, axis)
        return M

    def deformed(self):
        M = self.matrices()
        Vh = np.column_stack([self.V, np.ones(len(self.V))])
        out = np.zeros((len(self.V), 2))
        for i, b in enumerate(self.bones):
            out += self.Wt[:, i:i + 1] * (Vh @ M[b.name].T)[:, :2]
        return out

    def render(self, tex_mix=None):
        """Deforme olmuş kuklayı çizer. tex_mix: {varyant_adı: karışım 0..1} (ör. gülümseme, göz kırpma)."""
        src = self.rgba
        if tex_mix:
            src = src.copy()
            for name, m in tex_mix.items():
                if m > 0:
                    src = src * (1 - m) + self.textures[name] * m
        D = self.deformed().astype(np.float32)
        out = np.zeros((self.H, self.W, 4), np.float32)
        for part in self.part_order:
            idx = np.nonzero(self.tri_part == part)[0]
            if len(idx) == 0:
                continue
            dst = D[self.T[idx]]
            x0, y0 = np.floor(dst.reshape(-1, 2).min(0)).astype(int) - 2
            x1, y1 = np.ceil(dst.reshape(-1, 2).max(0)).astype(int) + 2
            x0, y0 = max(x0, 0), max(y0, 0)
            x1, y1 = min(x1, self.W), min(y1, self.H)
            if x1 <= x0 or y1 <= y0:
                continue
            ib = np.full((y1 - y0, x1 - x0), -1, np.int32)
            for j, k in enumerate(idx):
                cv2.fillConvexPoly(ib, np.round((dst[j] - [x0, y0]) * 16).astype(np.int32), int(j), cv2.LINE_8, 4)
            yy, xx = np.nonzero(ib >= 0)
            tid = ib[yy, xx]
            # her üçgen için hedef → kaynak afin dönüşüm
            S = self.V[self.T[idx]].astype(np.float64)
            Dd = dst.astype(np.float64)
            Dh = np.concatenate([Dd, np.ones((len(idx), 3, 1))], 2)  # n x 3 x 3
            A = np.linalg.solve(Dh, S)  # n x 3 x 2  (Dh @ A = S)
            px = np.column_stack([xx + x0, yy + y0, np.ones(len(xx))])
            sp = np.einsum("ni,nij->nj", px, A[tid])
            mx = np.full(ib.shape, -10, np.float32)
            my = np.full(ib.shape, -10, np.float32)
            mx[yy, xx] = sp[:, 0]
            my[yy, xx] = sp[:, 1]
            psrc = np.dstack([src[..., :3], self.part_alpha[part]])
            layer = cv2.remap(psrc, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            a = layer[..., 3:4]
            reg = out[y0:y1, x0:x1]
            reg[..., :3] = reg[..., :3] * (1 - a) + layer[..., :3] * a
            reg[..., 3:4] = reg[..., 3:4] * (1 - a) + a
        return out
