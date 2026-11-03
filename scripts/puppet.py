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

    def __post_init__(self):
        self.B = {b.name: b for b in self.bones}
        self.H, self.W = self.rgba.shape[:2]
        alpha = (self.rgba[..., 3] > 0.05).astype(np.uint8)
        alpha = cv2.dilate(alpha, np.ones((9, 9), np.uint8))
        ys, xs = np.mgrid[0:self.H:self.spacing, 0:self.W:self.spacing]
        pts = np.column_stack([xs.ravel(), ys.ravel()]).astype(np.float32)
        pts = pts[alpha[pts[:, 1].astype(int), pts[:, 0].astype(int)] > 0]
        cnts, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cpts = np.concatenate([c[::max(1, self.spacing // 2), 0, :] for c in cnts]).astype(np.float32)
        joints = np.array([b.head for b in self.bones] + [b.tail for b in self.bones], np.float32)
        self.V = np.unique(np.round(np.concatenate([pts, cpts, joints]), 1), axis=0)
        tri = Delaunay(self.V).simplices
        cen = self.V[tri].mean(1)
        keep = alpha[np.clip(cen[:, 1].astype(int), 0, self.H - 1), np.clip(cen[:, 0].astype(int), 0, self.W - 1)] > 0
        # çok uzun kenarlı (boşluğu aşan) üçgenleri at
        e = np.linalg.norm(self.V[tri] - self.V[np.roll(tri, 1, 1)], axis=2).max(1)
        self.T = tri[keep & (e < self.spacing * 3.2)]
        self._weights()
        names = [b.name for b in self.bones]
        dom = self.Wt[self.T].sum(1).argmax(1)
        self.tri_part = np.array([self.B[names[i]].part for i in dom])

    def _weights(self):
        V = self.V
        d = []
        for b in self.bones:
            a, c = np.array(b.head, np.float32), np.array(b.tail, np.float32)
            ab = c - a
            t = np.clip(((V - a) @ ab) / (ab @ ab + 1e-9), 0, 1)
            proj = a + t[:, None] * ab
            d.append(np.linalg.norm(V - proj, axis=1))
        d = np.stack(d, 1)
        dmin = d.min(1, keepdims=True)
        w = np.exp(-((d - dmin) ** 2) / (2 * self.blend ** 2))
        w[d - dmin > 3 * self.blend] = 0
        self.Wt = w / w.sum(1, keepdims=True)

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
            layer = cv2.remap(src, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            a = layer[..., 3:4]
            reg = out[y0:y1, x0:x1]
            reg[..., :3] = reg[..., :3] * (1 - a) + layer[..., :3] * a
            reg[..., 3:4] = reg[..., 3:4] * (1 - a) + a
        return out
