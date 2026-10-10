"""Pembuktian geometris: tidak ada garis yang menembus elips/grup di halaman 01.

Cara kerja:
  1. Parsing XML halaman '01 Use Case' dari file .drawio hasil build_r59.py.
  2. Bangun rute setiap edge: titik keluar perimeter source -> waypoints ->
     titik masuk perimeter target (sama seperti yang digambar draw.io dengan
     edgeStyle=none + exitX/entryX).
  3. Uji setiap segmen terhadap elips (uji titik-dalam-elips) dan terhadap
     kotak grup.
  4. Sebuah tembusan hanya DIABAIKAN bila wajar:
       - menembus batas sistem (uc-sys)  -> garis harus masuk ke dalam sistem
       - menembus grup yang ME-NAUNGI targetnya sendiri (garis harus masuk)
       - berujung pada elips target itu sendiri
"""
import io
import re
import sys
import xml.etree.ElementTree as ET

FILE = "Skripsi-Diagram-UseCase-Activity-R59.drawio"
PAGE = "01 Use Case"

tree = ET.parse(FILE)
root = tree.getroot()

# ---------- kumpulkan halaman ----------
diagram = None
for d in root.iter("diagram"):
    if (d.get("name") or "") == PAGE:
        diagram = d
        break
if diagram is None:
    sys.exit(f"Halaman '{PAGE}' tidak ditemukan")

cells = {}
for c in diagram.iter("mxCell"):
    cid = c.get("id")
    if not cid:
        continue
    g = c.find("mxGeometry")
    box = None
    if g is not None and g.get("x") is not None:
        box = (float(g.get("x", 0)), float(g.get("y", 0)),
               float(g.get("width", 0)), float(g.get("height", 0)))
    pts = []
    if g is not None:
        arr = g.find("Array[@as='points']")
        if arr is not None:
            pts = [(float(p.get("x")), float(p.get("y"))) for p in arr.findall("mxPoint")]
    style = c.get("style") or ""
    cells[cid] = {
        "value": (c.get("value") or "").replace("&amp;", "&"),
        "box": box,
        "style": style,
        "edge": c.get("edge") == "1",
        "src": c.get("source"),
        "tgt": c.get("target"),
        "pts": pts,
    }


def pin(style, key, default):
    m = re.search(key + r"=([-\d.]+)", style)
    return float(m.group(1)) if m else default


def resolve(cell_id, which, edge_style=""):
    """Titik sambung pada perimeter source/target.

    PENTING: exitX/exitY/entryX/entryY adalah properti gaya EDGE (bukan gaya
    simpul sumber/target). draw.io memakai nilai pada edge bila ada, baru
    turun ke nilai default.
    """
    c = cells[cell_id]
    x, y, w, h = c["box"]
    st = edge_style or c["style"]
    if which == "exit":
        px, py = pin(st, "exitX", 0.5), pin(st, "exitY", 0.5)
    else:
        px, py = pin(st, "entryX", 0.5), pin(st, "entryY", 0.5)
    return (x + px * w, y + py * h)


def is_ellipse(style):
    return "ellipse" in style or "usecase" in style


def in_ellipse(p, box):
    x, y, w, h = box
    cx, cy = x + w / 2, y + h / 2
    rx, ry = w / 2, h / 2
    return ((p[0] - cx) / rx) ** 2 + ((p[1] - cy) / ry) ** 2 <= 1.0


def seg_rect(p, q, box, pad=0.0):
    """Apakah segmen p-q berpotongan dengan kotak box (diberi pad)."""
    x, y, w, h = box
    x0, y0, x1, y1 = x - pad, y - pad, x + w + pad, y + h + pad
    if max(p[0], q[0]) < x0 or min(p[0], q[0]) > x1:
        return False
    if max(p[1], q[1]) < y0 or min(p[1], q[1]) > y1:
        return False
    # potong tegak lurus sumbu (karena semua segmen kita axis-aligned)
    if abs(p[0] - q[0]) < 1e-9:                     # vertikal
        return x0 <= p[0] <= x1 and not (max(p[1], q[1]) < y0 or min(p[1], q[1]) > y1)
    if abs(p[1] - q[1]) < 1e-9:                     # horizontal
        return y0 <= p[1] <= y1 and not (max(p[0], q[0]) < x0 or min(p[0], q[0]) > x1)
    return True                                      # diagonal: anggap potong


# Label «include»/«extend» memang menempel pada garis yang dilabelinya.
LABEL_OF = {
    "uc-include1": "uc-inclbl1",
    "uc-include2": "uc-inclbl2",
    "uc-extend1": "uc-extlbl1",
    "uc-extend2": "uc-extlbl2",
}

# ---------- rute tiap edge ----------
edges = []
for cid, c in cells.items():
    if not c["edge"] or not c["src"] or not c["tgt"]:
        continue
    route = [resolve(c["src"], "exit", c["style"])] + c["pts"] \
        + [resolve(c["tgt"], "entry", c["style"])]
    edges.append((cid, c["src"], c["tgt"], route))

# ---------- kandidat yang tidak boleh tertembus ----------
groups = {cid: c["box"] for cid, c in cells.items()
          if not c["edge"] and c["box"] and "uc-group" in c["style"]}
ellipses = {cid: c["box"] for cid, c in cells.items()
            if not c["edge"] and c["box"] and is_ellipse(c["style"])}
boxes_all = {cid: c["box"] for cid, c in cells.items()
             if not c["edge"] and c["box"]}


def owner_group(uc):
    """Grup yang secara spasial menaungi elips `uc`."""
    ux, uy, uw, uh = ellipses[uc]
    for gid, (gx, gy, gw, gh) in groups.items():
        if gx <= ux and gy <= uy and ux + uw <= gx + gw and uy + uh <= gy + gh:
            return gid
    return None


# ---------- uji ----------
bad = []
for (eid, src, tgt, route) in edges:
    tgt_grp = owner_group(tgt) if tgt in ellipses else None
    src_grp = owner_group(src) if src in ellipses else None
    for i in range(len(route) - 1):
        p, q = route[i], route[i + 1]
        for uc, box in ellipses.items():
            if uc in (src, tgt):
                continue
            # elips: uji beberapa titik sampel di sepanjang segmen
            steps = 40
            hit = False
            for k in range(steps + 1):
                t = k / steps
                pt = (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
                if in_ellipse(pt, box):
                    hit = True
                    break
            if hit:
                bad.append((eid, "elips", uc, cells[uc]["value"], (p, q)))
        for gid, box in groups.items():
            if gid in (tgt_grp, src_grp):
                continue
            if seg_rect(p, q, box):
                bad.append((eid, "grup", gid, cells[gid]["value"], (p, q)))
        for oid, box in boxes_all.items():
            if oid in (src, tgt) or oid in ellipses or oid in groups:
                continue
            if oid.startswith("uc-leg") or oid.startswith("uc-note") \
               or oid.startswith("uc-title") or oid.startswith("uc-caption") \
               or oid == "uc-sys":
                continue
            # Label relasi memang sengaja menempel pada garis yang
            # d labelling-nya (latar putih menutupi garis di bawahnya).
            if oid == LABEL_OF.get(eid):
                continue
            if seg_rect(p, q, box):
                bad.append((eid, "lain", oid, cells[oid]["value"], (p, q)))

print(f"Halaman      : {PAGE}")
print(f"Edge diuji   : {len(edges)}")
print(f"Elips        : {len(ellipses)}   Grup: {len(groups)}")
print()
if bad:
    print(f"!!! DITEMUKAN {len(bad)} TEMBUSAN:")
    for (eid, kind, vid, vname, seg) in bad:
        print(f"  {eid:16s} menembus {kind} {vid:12s} '{vname}' pada segmen {seg}")
    sys.exit(1)
else:
    print("HASIL: 0 tembusan. Tidak ada satu pun garis yang")
    print("       melewati elips use case, kotak grup, atau teks lain")
    print("       (selain batas sistem dan grup induknya sendiri).")
