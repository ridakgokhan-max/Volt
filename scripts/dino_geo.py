"""Dinozor V2 için coğrafya: Natural Earth (kamu malı) kara poligonlarından Dünya dokusu, küre ve bölge haritası çizimi."""
import json
import os

import cv2
import numpy as np

GEO = os.environ.get("NE_DIR", "/tmp/claude-0/-home-claude/09dc13b7-8497-5c2d-801b-364dce738862/scratchpad/dino/geo")
CHICX = (21.40, -89.52)  # Chicxulub krater merkezi (enlem, boylam)
EARTH_R_KM = 6371.0


def land_polys(res="50m"):
    gj = json.load(open(os.path.join(GEO, f"ne_{res}_land.geojson")))
    out = []
    for f in gj["features"]:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for p in polys:
            out.append([np.array(r, np.float64) for r in p])  # her halka: (lon, lat)
    return out


def equirect_land_mask(w=4096, h=2048, res="50m"):
    m = np.zeros((h, w), np.uint8)
    for poly in land_polys(res):
        rings = []
        for r in poly:
            x = (r[:, 0] + 180) / 360 * w
            y = (90 - r[:, 1]) / 180 * h
            rings.append(np.round(np.column_stack([x, y]) * 8).astype(np.int32))
        cv2.fillPoly(m, rings[:1], 255, cv2.LINE_AA, 3)
        if len(rings) > 1:
            cv2.fillPoly(m, rings[1:], 0, cv2.LINE_AA, 3)
    return m


def earth_texture(w=4096, h=2048, seed=2):
    """Belgesel-illüstrasyon tarzı Dünya dokusu (okyanus mavi-arduvaz, kara toprak/yeşil tonlu, hafif doku)."""
    land = equirect_land_mask(w, h).astype(np.float32) / 255
    rng = np.random.default_rng(seed)
    lat = np.linspace(90, -90, h)[:, None] * np.ones((1, w))
    n = cv2.GaussianBlur(rng.random((h // 8, w // 8)).astype(np.float32), (0, 0), 3)
    n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
    n2 = cv2.resize(cv2.GaussianBlur(rng.random((h // 32, w // 32)).astype(np.float32), (0, 0), 2), (w, h))
    ocean = np.dstack([40 + 10 * n, 66 + 14 * n, 98 + 18 * n])  # RGB
    coast = cv2.GaussianBlur(land, (0, 0), 6) * (1 - land)
    ocean = ocean + coast[..., None] * np.array([40, 60, 60])
    arid = np.clip(1 - np.abs(np.abs(lat) - 23) / 14, 0, 1) * 0.8 + 0.2 * n2
    green = np.dstack([92 + 30 * n, 112 + 26 * n, 74 + 14 * n])
    desert = np.dstack([170 + 30 * n, 140 + 24 * n, 98 + 18 * n])
    landc = green * (1 - arid[..., None]) + desert * arid[..., None]
    ice = np.clip((np.abs(lat) - 66) / 8, 0, 1)[..., None]
    landc = landc * (1 - ice) + np.array([225, 230, 236]) * ice
    tex = ocean * (1 - land[..., None]) + landc * land[..., None]
    # kıyı mürekkep çizgisi (illüstrasyon hissi)
    edge = cv2.morphologyEx((land > 0.5).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
    edge = cv2.GaussianBlur(edge, (0, 0), 0.8)[..., None]
    tex = tex * (1 - 0.55 * edge) + np.array([30, 34, 44]) * 0.55 * edge
    return tex.astype(np.float32), land


def clouds_texture(w=2048, h=1024, seed=5):
    rng = np.random.default_rng(seed)
    c = np.zeros((h, w), np.float32)
    for s, a in ((4, 0.5), (16, 0.3), (64, 0.2)):
        n = rng.random((h // s + 1, w // s + 1)).astype(np.float32)
        c += cv2.resize(cv2.GaussianBlur(n, (0, 0), 1.2), (w, h), interpolation=cv2.INTER_CUBIC) * a
    c = np.clip((c - 0.52) * 3.2, 0, 1)
    return c


def render_globe(tex, cx, cy, R, lon0, lat0, W, H, light=(-0.55, -0.35, 0.76), clouds=None, cloud_lon=0.0,
                 veil=None, night_tint=0.0):
    """Ortografik küre. Döner: (rgb, alfa) — sadece disk alanı hesaplanır."""
    x0, x1 = int(max(0, cx - R - 30)), int(min(W, cx + R + 30))
    y0, y1 = int(max(0, cy - R - 30)), int(min(H, cy + R + 30))
    out = np.zeros((H, W, 3), np.float32)
    alpha = np.zeros((H, W), np.float32)
    if x1 <= x0 or y1 <= y0:
        return out, alpha
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    X = (xx - cx) / R
    Y = -(yy - cy) / R
    rr = X * X + Y * Y
    inside = rr <= 1.0
    Z = np.sqrt(np.clip(1 - rr, 0, 1))
    la0, lo0 = np.radians(lat0), np.radians(lon0)
    # ters ortografik projeksiyon
    lat = np.arcsin(np.clip(Z * np.sin(la0) + Y * np.cos(la0), -1, 1))
    lon = lo0 + np.arctan2(X, Z * np.cos(la0) - Y * np.sin(la0))
    th, tw = tex.shape[:2]
    u = ((np.degrees(lon) + 180) % 360) / 360 * tw
    v = (90 - np.degrees(lat)) / 180 * th
    col = cv2.remap(tex, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    if clouds is not None:
        ch, cw = clouds.shape
        uc = ((np.degrees(lon) + 180 + cloud_lon) % 360) / 360 * cw
        vc = (90 - np.degrees(lat)) / 180 * ch
        cl = cv2.remap(clouds, uc.astype(np.float32), vc.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        col = col * (1 - 0.75 * cl[..., None]) + 235 * 0.75 * cl[..., None]
    if veil is not None:  # karanlık toz örtüsü (enlem/boylam fonksiyonu)
        vv = veil(np.degrees(lat), np.degrees(lon))
        col = col * (1 - vv[..., None] * 0.82) + np.array([46, 38, 40]) * vv[..., None] * 0.82
    L = np.array(light) / np.linalg.norm(light)
    ndl = np.clip(X * L[0] + Y * -L[1] * -1 + Z * L[2], 0, 1)
    ndl = np.clip(X * L[0] + Y * L[1] + Z * L[2], 0, 1)
    shade = 0.16 + 0.84 * ndl ** 0.9
    col = col * shade[..., None]
    col = col * (1 - night_tint) + col * np.array([0.6, 0.55, 0.8]) * night_tint
    # atmosfer kenar ışıması
    rim = np.clip((np.sqrt(rr) - 0.82) / 0.18, 0, 1) ** 2 * inside
    col = col + rim[..., None] * np.array([90, 120, 200]) * (0.35 + 0.65 * ndl[..., None])
    a = np.clip((1.0 - np.sqrt(rr)) * R / 1.5, 0, 1)
    out[y0:y1, x0:x1] = col * inside[..., None]
    alpha[y0:y1, x0:x1] = a
    # dış hale
    halo = np.clip(1 - (np.sqrt(rr) - 1) / 0.06, 0, 1) * (rr > 1) * 0.55
    out[y0:y1, x0:x1] += halo[..., None] * np.array([110, 140, 230])
    alpha[y0:y1, x0:x1] = np.maximum(alpha[y0:y1, x0:x1], halo)
    return out, alpha


def latlon_to_screen(lat, lon, cx, cy, R, lon0, lat0):
    la, lo = np.radians(lat), np.radians(lon - lon0)
    la0 = np.radians(lat0)
    x = np.cos(la) * np.sin(lo)
    y = np.cos(la0) * np.sin(la) - np.sin(la0) * np.cos(la) * np.cos(lo)
    z = np.sin(la0) * np.sin(la) + np.cos(la0) * np.cos(la) * np.cos(lo)
    return cx + x * R, cy - y * R, z


def region_map(lon_min, lon_max, lat_min, lat_max, W, H, scale=1.0, land_col=(196, 178, 140), sea_col=(132, 152, 168)):
    """Eşdikdörtgen (enlem düzeltmeli) bölge haritası — parşömen tonlu, mürekkep kıyı çizgili."""
    k = np.cos(np.radians((lat_min + lat_max) / 2))
    pxdeg = W / ((lon_max - lon_min) * k)

    def P(lon, lat):
        return ((lon - lon_min) * k * pxdeg, (lat_max - lat) * pxdeg)

    m = np.zeros((H, W), np.uint8)
    for poly in land_polys("50m"):
        rings = [np.round(np.column_stack(P(r[:, 0], r[:, 1])) * 8).astype(np.int32) for r in poly]
        bb = rings[0]
        if bb[:, 0].max() < 0 or bb[:, 0].min() > W * 8 or bb[:, 1].max() < 0 or bb[:, 1].min() > H * 8:
            continue
        cv2.fillPoly(m, rings[:1], 255, cv2.LINE_AA, 3)
        if len(rings) > 1:
            cv2.fillPoly(m, rings[1:], 0, cv2.LINE_AA, 3)
    land = m.astype(np.float32) / 255
    rng = np.random.default_rng(3)
    n = cv2.resize(cv2.GaussianBlur(rng.random((H // 12 + 1, W // 12 + 1)).astype(np.float32), (0, 0), 1.5), (W, H))
    sea = np.array(sea_col, np.float32) * (0.92 + 0.12 * n[..., None])
    # kıyıya yakın sığ su açık ton
    near = cv2.GaussianBlur(land, (0, 0), 10) * (1 - land)
    sea = sea + near[..., None] * np.array([28, 26, 18])
    lc = np.array(land_col, np.float32) * (0.9 + 0.16 * n[..., None])
    img = sea * (1 - land[..., None]) + lc * land[..., None]
    edge = cv2.morphologyEx((land > 0.5).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
    edge = cv2.GaussianBlur(edge, (0, 0), 0.9)[..., None]
    img = img * (1 - 0.8 * edge) + np.array([46, 40, 36]) * 0.8 * edge
    # paralel/meridyen ince çizgileri
    for lon in range(int(np.ceil(lon_min / 5) * 5), int(lon_max) + 1, 5):
        x = int(P(lon, 0)[0])
        cv2.line(img, (x, 0), (x, H), (90, 84, 76), 1, cv2.LINE_AA)
    for lat in range(int(np.ceil(lat_min / 5) * 5), int(lat_max) + 1, 5):
        y = int(P(0, lat)[1])
        cv2.line(img, (0, y), (W, y), (90, 84, 76), 1, cv2.LINE_AA)
    return img, land, P, pxdeg
