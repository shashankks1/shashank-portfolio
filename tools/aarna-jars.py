# Blender jar mockup for the AARNA case study (see build-aarna.mjs for the full rebuild).
# Renders are mockups, not photographs: say so in every caption.
# AARNA pickle jars: five glass jars, each wrapped in its 8 x 2 in label (203 x 51 mm).
# blender -b --factory-startup --python jars.py -- <label_dir> <out.png> <width> <height> <samples>
import bpy, bmesh, math, sys, os, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
LABELS, OUT, W, H, SAMPLES = argv[0], argv[1], int(argv[2]), int(argv[3]), int(argv[4])

def lin(hexs):
    h = hexs.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1]

# ── scene
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'; prefs.get_devices()
for d in prefs.devices: d.use = d.type == 'OPTIX'
sc.cycles.device = 'GPU'
sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 16; sc.cycles.transmission_bounces = 16; sc.cycles.glossy_bounces = 8
sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = -0.15
sc.render.image_settings.file_format = 'PNG'
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = lin('#d9d4c8')
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.22

def spin(name, prof, steps=128):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=steps, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob

def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links, m.node_tree.nodes['Principled BSDF']

# glass
g, gn, gl, gb = mat('glass')
gb.inputs['Base Color'].default_value = (1, 1, 1, 1); gb.inputs['Transmission Weight'].default_value = 1
gb.inputs['Roughness'].default_value = 0.02; gb.inputs['IOR'].default_value = 1.47
# lid: satin dark with fine ridges on the side
lm, ln, ll, lb = mat('lid')
lb.inputs['Base Color'].default_value = lin('#1d1e1a'); lb.inputs['Roughness'].default_value = 0.38
lb.inputs['Metallic'].default_value = 0.6
wave = ln.new('ShaderNodeTexWave'); wave.wave_type = 'RINGS'; wave.rings_direction = 'Z'; wave.inputs['Scale'].default_value = 1
tc = ln.new('ShaderNodeTexCoord'); mp = ln.new('ShaderNodeMapping')
ll.new(tc.outputs['Object'], mp.inputs['Vector']); mp.inputs['Scale'].default_value = (0, 0, 0)
# radial ridges: use angle via a gradient on object coords -> cheap: skip if not needed
# paper sweep
pm, pn, pl, pb = mat('paper'); pb.inputs['Base Color'].default_value = lin('#b8b1a3'); pb.inputs['Roughness'].default_value = 0.92

FLAVOURS = [  # label file, contents palette (oil, chunk A, chunk B)
    ('label-01.png', ['#8a3a16', '#d48a30', '#a8521c']),   # mango
    ('label-02.png', ['#946016', '#e0b440', '#b97c22']),   # lemon
    ('label-03.png', ['#701c0e', '#b8381c', '#5a7a26']),   # chili
    ('label-04.png', ['#7a2412', '#c24a22', '#efe2c4']),   # chili-garlic
    ('label-05.png', ['#843614', '#e0802e', '#f0e6cc']),   # mix
]
R_OUT, R_IN = 0.0325, 0.0303
jar_prof = [(0, 0), (0.0300, 0), (0.0321, 0.0022), (R_OUT, 0.0060), (R_OUT, 0.0800), (0.0318, 0.0845), (0.0300, 0.0875),
            (0.0292, 0.0890), (0.0292, 0.0985), (0.0274, 0.0985), (0.0274, 0.0890), (0.0281, 0.0875), (0.0298, 0.0846),
            (R_IN, 0.0802), (R_IN, 0.0062), (0.0284, 0.0042), (0, 0.0042)]
fill_prof = [(0, 0.0046), (0.0282, 0.0046), (R_IN - 0.0002, 0.0066), (R_IN - 0.0002, 0.0800), (0.0295, 0.0836), (0, 0.0836)]
lid_prof = [(0, 0.1035), (0.0300, 0.1035), (0.0314, 0.1022), (0.0316, 0.1005), (0.0316, 0.0896), (0.0306, 0.0886), (0, 0.0886)]
core_prof = [(0, 0.0046), (0.0130, 0.0046), (0.0140, 0.0066), (0.0140, 0.0795), (0.0135, 0.081), (0, 0.081)]
oilm, on_, ol_, ob_ = mat('oil'); ob_.inputs['Base Color'].default_value = lin('#4a1708'); ob_.inputs['Roughness'].default_value = 0.15; ob_.inputs['Coat Weight'].default_value = 0.5
rng = random.Random(7); CHUNKS = int(os.environ.get('CHUNKS', '1100'))
ph = bpy.data.materials.new('ph'); CHUNK_MESHES = []
for v in range(6):
    me = bpy.data.meshes.new(f'chunk{v}'); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=4, use_grid_fill=True)
    sq = [rng.uniform(0.75, 1.25) for _ in range(3)]
    for vert in bm.verts:
        n = vert.co.normalized(); vert.co = vert.co.lerp(n * 1.2, 0.6)
        vert.co = Vector((vert.co.x * sq[0], vert.co.y * sq[1], vert.co.z * sq[2])) + Vector((rng.uniform(-0.08, 0.08), rng.uniform(-0.08, 0.08), rng.uniform(-0.08, 0.08)))
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.append(ph); CHUNK_MESHES.append(me)
R_LAB, Z0, Z1 = R_OUT + 0.00025, 0.0225, 0.0735

U_FRONT = float(os.environ.get("U_FRONT", "0.29"))
def label_mesh(name, steps=256):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); uv = bm.loops.layers.uv.new()
    rows = []
    for i in range(steps + 1):
        u = i / steps; th = math.tau * (u - U_FRONT) - math.pi / 2   # u = 0.25 (front of the label) faces -Y
        rows.append((bm.verts.new((R_LAB * math.cos(th), R_LAB * math.sin(th), Z0)), bm.verts.new((R_LAB * math.cos(th), R_LAB * math.sin(th), Z1)), u))
    for i in range(steps):
        a0, a1, u0 = rows[i]; b0, b1, u1 = rows[i + 1]
        f = bm.faces.new((a0, b0, b1, a1))
        for loop, (uu, vv) in zip(f.loops, ((u0, 0), (u1, 0), (u1, 1), (u0, 1))): loop[uv].uv = (uu, vv)
    bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob

ONLY = os.environ.get("ONLY")
if ONLY: FLAVOURS = [FLAVOURS[int(k)] for k in ONLY.split(",")]
N = len(FLAVOURS); GAP = 0.079
CAM = tuple(float(v) for v in os.environ.get("CAM", "0,-1.02,0.2").split(","))
for i, (lab, pal) in enumerate(FLAVOURS):
    x = (i - (N - 1) / 2) * GAP
    rot = math.atan2(x - CAM[0], -CAM[1])   # turn each jar to face the camera
    parts = []
    jar = spin(f'jar{i}', jar_prof); jar.data.materials.append(g); jar.visible_shadow = False; parts.append(jar)
    root = bpy.data.objects.new(f'jarroot{i}', None); sc.collection.objects.link(root); root.location.x = x; root.rotation_euler.z = rot
    core = spin(f'core{i}', core_prof); core.data.materials.append(oilm); parts.append(core)
    cm, cn, cl, cb = mat(f'chunk{i}')
    oi = cn.new('ShaderNodeObjectInfo'); ramp = cn.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = lin(pal[0]); cr.elements[1].position = 1.0; cr.elements[1].color = lin(pal[2])
    e = cr.elements.new(0.5); e.color = lin(pal[1])
    cl.new(oi.outputs['Random'], ramp.inputs['Fac']); cl.new(ramp.outputs['Color'], cb.inputs['Base Color'])
    nz = cn.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900; bp = cn.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.3; bp.inputs['Distance'].default_value = 0.0004
    cl.new(nz.outputs['Fac'], bp.inputs['Height']); cl.new(bp.outputs['Normal'], cb.inputs['Normal'])
    cb.inputs['Roughness'].default_value = 0.3; cb.inputs['Coat Weight'].default_value = 0.6; cb.inputs['Coat Roughness'].default_value = 0.06
    cb.inputs['Subsurface Weight'].default_value = 0.25; cb.inputs['Subsurface Scale'].default_value = 0.0015
    for k in range(CHUNKS):
        ob = bpy.data.objects.new(f'c{i}_{k}', CHUNK_MESHES[rng.randrange(len(CHUNK_MESHES))]); sc.collection.objects.link(ob)
        s = 0.0032 + rng.random() * 0.0026
        a = rng.random() * math.tau; rr = R_IN - s * 1.9 - 0.0004 - rng.random() * 0.006; z = 0.0064 + 1.6 * s + rng.random() * (0.0798 - 0.0064 - 3.2 * s)
        ob.location = (rr * math.cos(a), rr * math.sin(a), z)
        ob.scale = (s * (0.85 + rng.random() * 0.3), s * (0.85 + rng.random() * 0.3), s * (0.7 + rng.random() * 0.35))
        ob.rotation_euler = (rng.random() * 6.28, rng.random() * 6.28, rng.random() * 6.28)
        ob.material_slots[0].link = 'OBJECT'; ob.material_slots[0].material = cm
        ob.parent = root
    lid = spin(f'lid{i}', lid_prof); lid.data.materials.append(lm); parts.append(lid)
    lo = label_mesh(f'label{i}'); parts.append(lo)
    am, an, al, ab = mat(f'label{i}')
    img = an.new('ShaderNodeTexImage'); img.image = bpy.data.images.load(os.path.join(LABELS, lab)); img.interpolation = 'Cubic'
    al.new(img.outputs['Color'], ab.inputs['Base Color']); ab.inputs['Roughness'].default_value = 0.42
    ab.inputs['Specular IOR Level'].default_value = 0.35
    lo.data.materials.append(am)
    for p in parts: p.parent = root

# sweep: floor running into a curved back wall
me = bpy.data.meshes.new('sweep'); bm = bmesh.new()
prof = [(-1.2, 0)] + [(0.18 + 0.32 * math.sin(a), 0.32 - 0.32 * math.cos(a)) for a in [k * math.pi / 2 / 16 for k in range(17)]] + [(0.5, 1.4)]
cols = []
for xx in (-1.5, 1.5): cols.append([bm.verts.new((xx, y, z)) for y, z in prof])
for k in range(len(prof) - 1): bm.faces.new((cols[0][k], cols[1][k], cols[1][k + 1], cols[0][k + 1]))
bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
sw = bpy.data.objects.new('sweep', me); sc.collection.objects.link(sw); sw.data.materials.append(pm)

def area(name, loc, size, energy, target=(0, 0, 0.05), color='#ffffff'):
    ld = bpy.data.lights.new(name, 'AREA'); ld.size = size; ld.energy = energy; ld.color = lin(color)[:3]
    ob = bpy.data.objects.new(name, ld); sc.collection.objects.link(ob); ob.location = loc
    tr = ob.constraints.new('TRACK_TO'); tg = bpy.data.objects.new(name + '_t', None); sc.collection.objects.link(tg); tg.location = target
    tr.target = tg; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'; return ob
area('key', (-0.55, -0.5, 0.5), 0.8, 16, color='#fff6ea')
area('fill', (0.7, -0.45, 0.2), 0.9, 4.5, color='#eef2ff')
area('rim', (0.1, 0.4, 0.35), 0.5, 9)
area('top', (0, -0.1, 0.7), 0.5, 3)

cd = bpy.data.cameras.new('cam'); cd.lens = 85; cd.dof.use_dof = True; cd.dof.aperture_fstop = 6.3
cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); cam.location = CAM; sc.camera = cam
ct = bpy.data.objects.new('cam_t', None); sc.collection.objects.link(ct); ct.location = (0, 0, float(os.environ.get("TZ", "0.048")))
tr = cam.constraints.new('TRACK_TO'); tr.target = ct; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
cd.dof.focus_object = ct

sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('WROTE', OUT)
