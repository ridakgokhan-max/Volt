"""Blender (Cycles, CPU) ile 3B fermuar: sürgü aşağıdan yukarı çıkar, pirinç dişler birer birer
iç içe geçip kapanır; kamera sürgüyü takip eder. 600x800 dikey, 210 kare (7 sn).
Kullanım: blender -b -P scripts/blender_fermuar.py -- cikti_klasoru
"""
import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["/tmp/fermuar"]
OUT = argv[0]
N = 210

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 16
sc.cycles.use_denoising = True
sc.render.resolution_x = 600
sc.render.resolution_y = 800
sc.render.fps = 30
sc.frame_start, sc.frame_end = 1, N
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = OUT + "/k_"

world = bpy.data.worlds.new("dunya")
sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.03, 0.05, 0.10, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.5


def malzeme(ad, renk, metal=1.0, puruz=0.3):
    m = bpy.data.materials.new(ad)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*renk, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = puruz
    return m


PIRINC = malzeme("pirinc", (0.85, 0.62, 0.25), puruz=0.28)
CELIK = malzeme("celik", (0.70, 0.72, 0.76), puruz=0.22)
KUMAS = malzeme("kumas", (0.10, 0.17, 0.33), metal=0.0, puruz=0.9)


def kutu(ad, boyut, konum, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=konum)
    o = bpy.context.active_object
    o.name = ad
    o.scale = boyut
    o.data.materials.append(mat)
    b = o.modifiers.new("pah", "BEVEL")
    b.width = 0.015
    b.segments = 2
    return o


DIS = 30
ADIM = 0.2
L = DIS * ADIM
linkler = []
for i in range(DIS):
    s = -1 if i % 2 == 0 else 1
    z = i * ADIM
    kok = bpy.data.objects.new(f"link{i}", None)
    sc.collection.objects.link(kok)
    kok.location = (0, 0, z)
    bpy.context.view_layer.update()
    dis = kutu(f"dis{i}", (0.42, 0.16, 0.16), (s * 0.06, 0, z), PIRINC)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(-s * 0.1, -0.05, z + 0.03))
    tum = bpy.context.active_object
    tum.data.materials.append(PIRINC)
    serit = kutu(f"serit{i}", (1.1, 0.05, ADIM * 1.02), (s * (0.27 + 0.55), 0.02, z), KUMAS)
    for o in (dis, tum, serit):
        o.parent = kok
        o.matrix_parent_inverse = kok.matrix_world.inverted()
    linkler.append((kok, s, z))

# sürgü
surgu = bpy.data.objects.new("surgu", None)
sc.collection.objects.link(surgu)
govde = kutu("govde", (0.62, 0.34, 0.36), (0, -0.06, 0), CELIK)
dil = kutu("dil", (0.14, 0.05, 0.55), (0, -0.3, -0.3), CELIK)
dil.rotation_euler = (math.radians(-18), 0, 0)
for o in (govde, dil):
    o.parent = surgu


def surgu_z(f):
    k = min(1, max(0, (f - 15) / (N - 45)))
    k = k * k * (3 - 2 * k)
    return -0.2 + k * (L + 0.2)


def aciklik(z, sz):
    if z <= sz:
        return 0.0
    return min(1.0, (z - sz) / (L * 0.45)) * 0.75


for f in range(1, N + 1, 3):
    sz = surgu_z(f)
    surgu.location = (0, 0, sz)
    surgu.keyframe_insert("location", frame=f)
    for kok, s, z in linkler:
        a = aciklik(z, sz)
        kok.location = (s * a, 0, z)
        kok.rotation_euler = (0, s * a * 0.25, 0)
        kok.keyframe_insert("location", frame=f)
        kok.keyframe_insert("rotation_euler", frame=f)

cam_data = bpy.data.cameras.new("kamera")
cam = bpy.data.objects.new("kamera", cam_data)
sc.collection.objects.link(cam)
sc.camera = cam
cam_data.lens = 42
hedef = bpy.data.objects.new("hedef", None)
sc.collection.objects.link(hedef)
tr = cam.constraints.new("TRACK_TO")
tr.target = hedef
for f in range(1, N + 1, 10):
    sz = surgu_z(f)
    hedef.location = (0, 0, sz + 0.4)
    hedef.keyframe_insert("location", frame=f)
    a = math.radians(-70 + 35 * (f - 1) / (N - 1))
    cam.location = (3.6 * math.cos(a), 3.6 * math.sin(a), sz + 1.6)
    cam.keyframe_insert("location", frame=f)

for ad, loc, en, guc in (("anahtar", (3, -3, 7), 3, 700), ("dolgu", (-4, -2, 3), 4, 250), ("arka", (0, 4, 4), 3, 400)):
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
