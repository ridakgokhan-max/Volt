"""Blender (Cycles, CPU) ile pirinç dişliler sahnesi: birbirine geçen 3 dişli, yavaş dönen kamera.
Kullanım: blender -b -P scripts/blender_disli.py -- cikti_klasoru [kare_sayisi]
"""
import math
import sys

import bmesh
import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["/tmp/disli"]
OUT = argv[0]
N = int(argv[1]) if len(argv) > 1 else 120

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 20
sc.cycles.use_denoising = True
sc.render.resolution_x = 720
sc.render.resolution_y = 720
sc.render.fps = 30
sc.frame_start, sc.frame_end = 1, N
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = OUT + "/k_"

world = bpy.data.worlds.new("dunya")
sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.03, 0.05, 0.10, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.6


def malzeme(ad, renk, metal=1.0, puruz=0.3):
    m = bpy.data.materials.new(ad)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*renk, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = puruz
    return m


PIRINC = malzeme("pirinc", (0.85, 0.62, 0.25))
BAKIR = malzeme("bakir", (0.80, 0.40, 0.25))
CELIK = malzeme("celik", (0.65, 0.68, 0.72), puruz=0.25)


def disli(ad, dis, r, kalinlik=0.25, mat=PIRINC):
    me = bpy.data.meshes.new(ad)
    bm = bmesh.new()
    pts = []
    h = 0.16
    for i in range(dis):
        a0 = 2 * math.pi * i / dis
        st = 2 * math.pi / dis
        for f, rr in ((0.0, r - h), (0.18, r + h), (0.5, r + h), (0.68, r - h)):
            a = a0 + f * st
            pts.append((rr * math.cos(a), rr * math.sin(a)))
    vs = [bm.verts.new((x, y, 0)) for x, y in pts]
    face = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, vec=(0, 0, kalinlik), verts=[v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)])
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(ad, me)
    sc.collection.objects.link(ob)
    ob.data.materials.append(mat)
    bev = ob.modifiers.new("pah", "BEVEL")
    bev.width = 0.02
    bev.segments = 2
    # göbek
    bpy.ops.mesh.primitive_cylinder_add(radius=r * 0.25, depth=kalinlik * 1.6, location=(0, 0, kalinlik / 2))
    gob = bpy.context.active_object
    gob.data.materials.append(CELIK)
    gob.parent = ob
    return ob


g1 = disli("buyuk", 18, 1.2)
g2 = disli("kucuk", 10, 0.7, mat=BAKIR)
g3 = disli("orta", 14, 0.95, mat=PIRINC)
g2.location = (1.2 + 0.7 - 0.02, 0, 0.02)
g3.location = (-0.35, -(1.2 + 0.95 - 0.02), -0.02)
for f in (1, N):
    k = (f - 1) / 30.0
    w = 0.9  # rad/sn
    g1.rotation_euler = (0, 0, w * k)
    g2.rotation_euler = (0, 0, -w * k * 18 / 10 + math.pi / 10)
    g3.rotation_euler = (0, 0, -w * k * 18 / 14 + math.pi / 14)
    for g in (g1, g2, g3):
        g.keyframe_insert("rotation_euler", frame=f)
for g in (g1, g2, g3):
    for fc in g.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

cam_data = bpy.data.cameras.new("kamera")
cam = bpy.data.objects.new("kamera", cam_data)
sc.collection.objects.link(cam)
sc.camera = cam
cam_data.lens = 45
hedef = bpy.data.objects.new("hedef", None)
sc.collection.objects.link(hedef)
hedef.location = (0.3, -0.5, 0)
tr = cam.constraints.new("TRACK_TO")
tr.target = hedef
for f in (1, N):
    a = math.radians(-60 + 40 * (f - 1) / max(N - 1, 1))
    cam.location = (6.0 * math.cos(a), 6.0 * math.sin(a), 4.2)
    cam.keyframe_insert("location", frame=f)

for ad, loc, en, guc in (("anahtar", (4, -3, 6), 3, 900), ("dolgu", (-5, 2, 3), 4, 300), ("arka", (0, 5, -1), 3, 500)):
    ld = bpy.data.lights.new(ad, "AREA")
    ld.energy = guc
    ld.size = en
    lo = bpy.data.objects.new(ad, ld)
    lo.location = loc
    sc.collection.objects.link(lo)
    t = lo.constraints.new("TRACK_TO")
    t.target = hedef

bpy.ops.render.render(animation=True)
print("blender bitti:", N, "kare")
