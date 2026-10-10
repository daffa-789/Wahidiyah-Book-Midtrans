"""Pembuktian kedua: tidak ada KOTAK yang saling timpa di halaman 01.

Menguji secara berpasangan semua simpul (elips use case, kotak grup, aktor,
label relasi, legenda, catatan) KECUALI pasangan yang memang wajar berhimpit:
  - batas sistem (uc-sys) dengan isinya
  - grup dengan elips yang dinaunginya
  - elips dengan label relasi yang menempel padanya (sengaja, latar putih)
"""
import sys
import xml.etree.ElementTree as ET

FILE = "Skripsi-Diagram-UseCase-Activity-R59.drawio"
PAGE = "01 Use Case"

root = ET.parse(FILE).getroot()
diagram = next((d for d in root.iter("diagram") if (d.get("name") or "") == PAGE), None)
if diagram is None:
    sys.exit("halaman tidak ditemukan")

nodes = {}
for c in diagram.iter("mxCell"):
    if c.get("edge") == "1" or not c.get("id"):
        continue
    g = c.find("mxGeometry")
    if g is None or g.get("x") is None:
        continue
    nodes[c.get("id")] = {
        "v": (c.get("value") or "").replace("&amp;", "&") or "(tanpa teks)",
        "s": c.get("style") or "",
        "b": (float(g.get("x")), float(g.get("y")),
              float(g.get("width")), float(g.get("height"))),
    }

groups = {k: v for k, v in nodes.items() if "uc-group" in v["s"]}
usecases = {k: v for k, v in nodes.items() if "usecase" in v["s"]}
sysbox = {k: v for k, v in nodes.items() if k == "uc-sys"}


def owner_group(uid):
    ux, uy, uw, uh = nodes[uid]["b"]
    for gid, g in groups.items():
        gx, gy, gw, gh = g["b"]
        if gx <= ux and gy <= uy and ux + uw <= gx + gw and uy + uh <= gy + gh:
            return gid
    return None


def rect_hit(a, b, gap=0.0):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return not (ax + aw <= bx - gap or bx + bw <= ax - gap
                or ay + ah <= by - gap or by + bh <= ay - gap)


def ell_hit(uid, box, gap=0.0):
    """Kotak `box` berpotongan dengan elips `uid`? (uji bounding box dulu,
    lalu uji sudut-sudut kotak terhadap persamaan elips.)"""
    ux, uy, uw, uh = nodes[uid]["b"]
    if not rect_hit((ux, uy, uw, uh), box, gap):
        return False
    cx, cy = ux + uw / 2, uy + uh / 2
    rx, ry = uw / 2 + gap, uh / 2 + gap
    bx, by, bw, bh = box
    for px, py in ((bx, by), (bx + bw, by), (bx, by + bh), (bx + bw, by + bh)):
        if ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1.0:
            return True
    # kotak sepenuhnya di dalam elips?
    if ((bx + bw / 2 - cx) / rx) ** 2 + ((by + bh / 2 - cy) / ry) ** 2 <= 1.0:
        return True
    return False


bad = []
ids = sorted(nodes)
for i in range(len(ids)):
    for j in range(i + 1, len(ids)):
        a, b = ids[i], ids[j]
        ba, bb = nodes[a]["b"], nodes[b]["b"]
        # --- pengecualian yang wajar ---
        if a == "uc-sys" or b == "uc-sys":
            continue                                   # batas sistem berisi semua
        if (a == "uc-legbox" and b.startswith("uc-leg")) or \
           (b == "uc-legbox" and a.startswith("uc-leg")):
            continue                                   # kotak legenda berisi isinya
        if a in groups and owner_group(b) == a:
            continue                                   # grup vs anaknya
        if b in groups and owner_group(a) == b:
            continue
        if a in groups and b in groups:
            if not rect_hit(ba, bb, 0):                 # grup vs grup: wajib ada jarak
                continue
            bad.append((a, b, "grup", 0))
            continue
        if a in usecases and b in usecases:
            # dua elips: uji kotak lawan terhadap masing-masing elips
            if ell_hit(a, bb, 0) or ell_hit(b, ba, 0):
                bad.append((a, b, "elips", 0))
            continue
        if a in usecases or b in usecases:
            uc = a if a in usecases else b
            other = b if a in usecases else a
            # PENTING: yang diuji harus kotak SIMPUL SEBERANGNYA, bukan
            # kotak elips itu sendiri (kalau tidak, pasti selalu "timpa").
            obox = bb if uc == a else ba
            if ell_hit(uc, obox, 0):
                kind = "elips-label" if (other.startswith("uc-extlbl")
                                         or other.startswith("uc-inclbl")) else "elips-lain"
                bad.append((a, b, kind, 0))
            continue
        if rect_hit(ba, bb, 0):
            bad.append((a, b, "kotak", 0))

print(f"Halaman  : {PAGE}")
print(f"Simpul   : {len(nodes)}  (grup {len(groups)}, use case {len(usecases)})")
print()
if bad:
    print(f"!!! {len(bad)} PASANGAN SALING TIMPA:")
    for (a, b, kind, _) in bad:
        print(f"  {kind:12s} {a:14s} '{nodes[a]['v']}'  <->  {b:14s} '{nodes[b]['v']}'")
    sys.exit(1)

# --- laporan jarak terdekat antar-grup (bukti ada jarak nyata) ---
print("HASIL: 0 kotak saling timpa.")
print()
print("Jarak vertikal antar grup DALAM SATU KOLOM (bukti ada ruang napas):")
cols = {}
for n, g in groups.items():
    cols.setdefault(round(g["b"][0]), []).append((n, g))
for cx in sorted(cols):
    order = sorted(cols[cx], key=lambda kv: kv[1]["b"][1])
    for k in range(len(order) - 1):
        (n1, g1), (n2, g2) = order[k], order[k + 1]
        y1 = g1["b"][1] + g1["b"][3]
        y2 = g2["b"][1]
        print(f"  kolom x={cx}: {n1:8s} bawah={y1:.0f}  ->  {n2:8s} atas={y2:.0f}   jarak={y2 - y1:.0f}px")
print()
print("Jarak horizontal antar kolom:")
xs = sorted(cols)
for k in range(len(xs) - 1):
    print(f"  kolom x={xs[k]} (lebar 310, berakhir {xs[k]+310})  ->  "
          f"kolom x={xs[k+1]}   celah={xs[k+1] - (xs[k]+310)}px")
