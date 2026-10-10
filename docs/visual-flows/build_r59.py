# -*- coding: utf-8 -*-
"""
R59 — Diagram Use Case + Diagram Aktivitas (Activity) untuk skripsi Wahidiyah Book.
Menghasilkan satu berkas .drawio multi-halaman dengan gaya yang sama seperti
Skripsi-Diagram-Wahidiyah-v2.drawio (metaUml=*, Helvetica, palet flat-ui).

Halaman:
  01 Use Case (lengkap, 9 aktor-asosiasi + include/extend)
  02A Aktivitas Registrasi Akun
  02B Aktivitas Reset Password (OTP)
  02C Aktivitas Baca Buku PDF Terproteksi
  02D Aktivitas Kelola Buku (Admin CRUD)

Jalankan:  python build_r59.py
Keluaran:  Skripsi-Diagram-UseCase-Activity-R59.drawio
"""

import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Skripsi-Diagram-UseCase-Activity-R59.drawio")

# ----------------------------------------------------------------------------
# Gaya (persis dari v2)
# ----------------------------------------------------------------------------
FONT = "fontFamily=Helvetica;"
S_BOUND = ("metaUml=system-boundary;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=13;"
           "fontStyle=1;fillColor=none;strokeColor=#495057;strokeWidth=2;dashed=0;shadow=0;glass=0;"
           "rounded=0;align=center;verticalAlign=top;spacingTop=6;pointerEvents=0;fontColor=#212529;")
S_UCGROUP = ("metaUml=uc-group;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=11;fontStyle=1;"
             "fillColor=none;strokeColor=#495057;strokeWidth=1.5;dashed=1;shadow=0;glass=0;rounded=0;"
             "align=center;verticalAlign=top;spacingTop=4;fontColor=#495057;")
S_USECASE = ("metaUml=usecase;ellipse;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=10;"
             "fillColor=#a5d8ff;strokeColor=#1971c2;strokeWidth=2;shadow=0;glass=0;"
             "align=center;verticalAlign=middle;")
S_ACTOR = ("metaUml=actor;shape=umlActor;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=11;"
           "fontStyle=1;fontColor=#2f9e44;fillColor=none;strokeColor=#2f9e44;strokeWidth=2;"
           "verticalLabelPosition=bottom;verticalAlign=top;labelPosition=center;align=center;"
           "shadow=0;glass=0;")
# CATATAN PENTING (revisi tata letak ke-4):
# edgeStyle=none  -> draw.io menggambar POLILINE lurus tepat melewati titik
#                    (Array as="points") yang kita tentukan. Tidak ada router
#                    yang ikut campur, sehingga render identik di draw.io
#                    desktop, viewer.diagrams.net, maupun ekspor PNG.
#                    (Sebelumnya orthogonalEdgeStyle + jettySize=auto: router
#                    menghitung ulang jetty saat file dibuka -> berantakan.)
# Selain itu, garis asosiasi TIDAK BOLEH melintasi elips kolom lain; karena
# itu setiap aktor hanya terhubung ke kolom yang bersebelahan dengannya.
S_ASSOC = ("metaUml=assoc;edgeStyle=none;html=1;endArrow=none;startArrow=none;"
           "strokeColor=#495057;strokeWidth=1.5;rounded=0;noJump=1;shadow=0;")
S_INCLUDE = ("metaUml=include;edgeStyle=none;html=1;endArrow=open;endFill=0;"
             "startArrow=none;strokeColor=#495057;strokeWidth=1.5;dashed=1;fontSize=10;"
             "fontFamily=Helvetica;fontColor=#495057;noJump=1;shadow=0;")
S_EXTEND = ("metaUml=extend;edgeStyle=none;html=1;endArrow=open;endFill=0;"
            "startArrow=none;strokeColor=#495057;strokeWidth=1.5;dashed=1;fontSize=10;"
            "fontFamily=Helvetica;fontColor=#495057;noJump=1;shadow=0;")
S_EXTLBL = ("metaUml=extend-label;text;html=1;align=center;verticalAlign=middle;fontFamily=Helvetica;"
            "fontSize=10;fontColor=#495057;strokeColor=none;fillColor=#ffffff;rounded=0;")
S_NOTEBIG = ("metaUml=note;shape=note;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=11;"
             "fillColor=#fff9db;strokeColor=#e67700;strokeWidth=1.5;size=18;align=left;"
             "verticalAlign=top;spacingLeft=8;spacingTop=6;fontColor=#212529;")
S_LEGBOX = ("metaUml=legend-box;html=1;fillColor=none;strokeColor=#495057;strokeWidth=1.5;"
            "dashed=1;rounded=0;shadow=0;glass=0;")
S_LEGTITLE = ("metaUml=legend-title;text;html=1;fontFamily=Helvetica;fontSize=12;fontStyle=1;"
              "fontColor=#212529;align=left;verticalAlign=middle;strokeColor=none;fillColor=none;")
S_LEGTEXT = ("metaUml=legend-text;text;html=1;fontFamily=Helvetica;fontSize=10;fontColor=#495057;"
             "align=left;verticalAlign=middle;strokeColor=none;fillColor=none;")
S_LEGSWATCH = ("metaUml=legend-swatch;html=1;fillColor=#a5d8ff;strokeColor=#1971c2;strokeWidth=1.5;"
               "shadow=0;glass=0;rounded=0;")
S_CAPTION = ("metaUml=caption;text;html=1;fontFamily=Helvetica;fontSize=11;fontColor=#495057;"
             "align=left;verticalAlign=middle;strokeColor=none;fillColor=none;")
S_TITLE = ("metaUml=title;text;html=1;fontFamily=Helvetica;fontSize=15;fontStyle=1;fontColor=#212529;"
           "align=left;verticalAlign=middle;strokeColor=none;fillColor=none;")

# --- Activity (02*), persis dari halaman 02A v2 ---
S_LANE = ("metaUml=lane;swimlane;html=1;startSize=30;horizontal=0;fontFamily=Helvetica;fontSize=12;"
          "fontStyle=1;fontColor=#2f9e44;fillColor=#ffffff;strokeColor=#2f9e44;strokeWidth=2;"
          "swimlaneFillColor=#b2f2bb;shadow=0;glass=0;align=center;verticalAlign=middle;")
S_ACTION = ("metaUml=action;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=11;fillColor=#b2f2bb;"
            "strokeColor=#2f9e44;strokeWidth=2;shadow=0;glass=0;verticalAlign=middle;align=center;"
            "rounded=1;arcSize=14;")
S_ACTION_ACTION = S_ACTION  # alias
S_DECISION = ("metaUml=decision;rhombus;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=10;"
              "fillColor=#ffec99;strokeColor=#e67700;strokeWidth=2;shadow=0;glass=0;align=center;"
              "verticalAlign=middle;")
S_INITIAL = ("metaUml=initial;ellipse;html=1;fillColor=#212529;strokeColor=#212529;strokeWidth=2;"
             "shadow=0;glass=0;")
S_FINAL = ("metaUml=final;ellipse;html=1;fillColor=#212529;strokeColor=#212529;strokeWidth=2;"
           "shadow=0;glass=0;shape=endState;")
S_MERGE = ("metaUml=merge;rhombus;html=1;fillColor=#e9ecef;strokeColor=#495057;strokeWidth=2;"
           "shadow=0;glass=0;")
S_FORK = ("metaUml=fork;rounded=0;html=1;whiteSpace=wrap;fillColor=#212529;strokeColor=#212529;"
          "strokeWidth=2;shadow=0;glass=0;")
S_GUARD = ("metaUml=guard;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=10;fontColor=#1864ab;"
           "fillColor=#fff9db;strokeColor=none;rounded=1;arcSize=40;align=center;verticalAlign=middle;")
S_NOTE = ("metaUml=note;shape=note;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=10;"
          "fillColor=#fff9db;strokeColor=#e67700;strokeWidth=1.5;size=14;align=left;verticalAlign=top;"
          "spacingLeft=6;spacingTop=4;fontColor=#212529;")
S_FLOW = ("metaUml=flow;edgeStyle=orthogonalEdgeStyle;html=1;fontSize=10;fontColor=#1864ab;"
          "strokeColor=#1864ab;strokeWidth=2;endArrow=block;endFill=1;startArrow=none;startFill=0;"
          "rounded=1;jettySize=auto;orthogonalLoop=1;")


def esc(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def cell(cid, value, style, x, y, w, h, parent="1"):
    return (
        f'        <mxCell id="{cid}" value="{esc(value)}" style="{style}" vertex="1" parent="{parent}">\n'
        f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />\n'
        f'        </mxCell>\n'
    )


def edge(cid, value, style, src, tgt, points=None, parent="1"):
    geo = '          <mxGeometry relative="1" as="geometry">'
    if points:
        geo += '\n            <Array as="points">\n'
        for (px, py) in points:
            geo += f'              <mxPoint x="{px}" y="{py}" />\n'
        geo += '            </Array>\n          '
    else:
        geo += ''
    geo += '</mxGeometry>\n'
    return (
        f'        <mxCell id="{cid}" value="{esc(value)}" style="{style}" edge="1" parent="{parent}" '
        f'source="{src}" target="{tgt}">\n{geo}        </mxCell>\n'
    )


def page(pid, name, body):
    return (f'  <diagram id="{pid}" name="{esc(name)}">\n'
            f'    <mxGraphModel dx="1422" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="1654" '
            f'math="0" shadow="0">\n      <root>\n'
            f'        <mxCell id="0" />\n        <mxCell id="1" parent="0" />\n'
            f'{body}'
            f'      </root>\n    </mxGraphModel>\n  </diagram>\n')


# ============================================================================
# HALAMAN 1 — USE CASE (lengkap)
# ============================================================================
def build_usecase():
    """Use Case — tata letak revisi ke-4.

    Prinsip anti-tabrakan (semua dibuktikan secara geometris, bukan dugaan):

    1. Satu aktor hanya terhubung ke SATU kolom yang bersebelahan dengannya.
       Jamaah  -> kolom kiri   (12 use case)
       Admin   -> kolom kanan  (6 use case)
       Google / QRIS -> kolom tengah (2 use case), dari BAWAH batas sistem.
       Akibatnya tidak ada satu pun garis asosiasi yang harus melintasi elips
       di kolom lain. (Revisi sebelumnya: garis Jamaah ke kolom tengah
       terpaksa horizontal dari x=670 ke x=1084 dan menembus uc1..uc4.)

    2. Asosiasi memakai SATU bus vertikal yang berada di LUAR batas sistem
       (x=430 untuk Jamaah, x=1900 untuk Admin). Ruang 430..614 dan
       1744..1900 benar-benar kosong -> nol perpotongan.

    3. «include» / «extend» memakai koridor vertikal di celah antar-kolom
       (celah kiri-tengah lebarnya 140px: x=910..1050). Keempat koridor
       dipak pada x=935 / 955 / 995 / 1025 dengan rentang-y yang saling
       menjauh sehingga tidak ada dua garis yang berhimpitan.

    4. edgeStyle=none -> draw.io menggambar poliline lurus persis melalui
       titik yang diberikan; tidak ada router yang menghitung ulang.
    """
    b = ""
    b += cell("uc-title", "Diagram 01 — Use Case: Aplikasi Buku Wahidiyah", S_TITLE, 40, 30, 1100, 26)

    # ---------------- Batas sistem ----------------
    # x: 560..1870   y: 150..1030
    b += cell("uc-sys", "Aplikasi Buku Wahidiyah", S_BOUND, 560, 150, 1310, 880)

    # ---------------- Aktor ----------------
    # Jamaah  : 300..340 , pusat keluar (340, 533)
    # Admin   : 1950..1990, pusat keluar (1950, 503)
    # Google  : 1370..1410, keluar atas (1390, 1090) -> lewat celah kanan
    # QRIS    : 1080..1120, keluar atas (1100, 1090) -> lurus dari bawah
    b += cell("uc-a-jamaah", "Jamaah (Pengguna)", S_ACTOR, 300, 500, 40, 66)
    b += cell("uc-a-admin", "Administrator", S_ACTOR, 1950, 470, 40, 66)
    b += cell("uc-a-google", "Google OAuth 2.0", S_ACTOR, 1370, 1090, 40, 66)
    b += cell("uc-a-qris", "QRIS Simulator", S_ACTOR, 1080, 1090, 40, 66)

    # ---------------- Kolom ----------------
    # kiri   : grup 600..910  | elips 614..894   (lebar elips 280)
    # tengah : grup 1050..1360| elips 1064..1344
    # kanan  : grup 1450..1760| elips 1464..1744
    # celah antar-kolom = 140px (kiri-tengah) dan 90px (tengah-kanan)
    GX = {"L": 600, "M": 1050, "R": 1450}
    UX = {"L": 614, "M": 1064, "R": 1464}
    UW, UH = 280, 46
    PAL = {
        "akun":    ("#a5d8ff", "#1971c2"),
        "katalog": ("#c3fae8", "#0c8599"),
        "bayar":   ("#ffec99", "#e67700"),
        "admin":   ("#d0bfff", "#9c36b5"),
        "ekst":    ("#ffd8a8", "#e8590c"),
    }

    def grp(gid, name, col, gy, gh, items, pal):
        fc, sc = PAL[pal]
        st = S_UCGROUP.replace("strokeColor=#495057", f"strokeColor={sc}")
        out = cell(gid, name, st, GX[col], gy, 310, gh)
        us = S_USECASE.replace("#a5d8ff", fc).replace("#1971c2", sc)
        for (uid, uname, uy) in items:
            out += cell(uid, uname, us, UX[col], uy, UW, UH)
        return out

    # --- Kolom kiri: milik Jamaah (12) ---
    b += grp("uc-g1", "«Akun &amp; Keamanan»", "L", 180, 260, [
        ("uc-uc1", "Masuk Email", 210),
        ("uc-uc2", "Masuk Google", 266),
        ("uc-uc3", "Lupa Password (OTP)", 322),
        ("uc-uc4", "Keluar / Logout", 378),
    ], "akun")
    b += grp("uc-g2", "«Katalog &amp; Bacaan»", "L", 452, 320, [
        ("uc-uc8", "Lihat Katalog Buku", 482),
        ("uc-uc9", "Filter Kategori", 538),
        ("uc-uc10", "Baca Buku Umum", 594),
        ("uc-uc11", "Baca Buku Pro", 650),
        ("uc-uc12", "Lihat Kalender &amp; Agenda", 706),
    ], "katalog")
    b += grp("uc-g3", "«Berlangganan &amp; Pembayaran»", "L", 784, 214, [
        ("uc-uc5", "Berlangganan Pro", 814),
        ("uc-uc6", "Pilih Metode Pembayaran", 870),
        ("uc-uc7", "Lihat Riwayat Langganan", 926),
    ], "bayar")

    # --- Kolom tengah: layanan eksternal (2) ---
    # uc13 (Google) di ATAS  -> dicapai dari celah KANAN (x=1390)
    # uc19 (QRIS)   di BAWAH -> dicapai lurus dari BAWAH (x=1100)
    # Dua elips bertumpuk tidak bisa berdua dipasok dari bawah: garis ke yang
    # atas pasti menembus yang bawah. Karena itu satu dipasok dari sisi kanan.
    b += grp("uc-g4", "«Layanan Eksternal»", "M", 600, 200, [
        ("uc-uc13", "Verifikasi Token Google", 640),
        ("uc-uc19", "Konfirmasi Pembayaran", 720),
    ], "ekst")

    # --- Kolom kanan: milik Administrator (6) ---
    b += grp("uc-g5", "«Administrasi»", "R", 180, 320, [
        ("uc-uc14", "Kelola Buku (CRUD)", 210),
        ("uc-uc15", "Verifikasi Transaksi", 266),
        ("uc-uc16", "Kelola Pengguna", 322),
        ("uc-uc17", "Kelola Agenda", 378),
        ("uc-uc18", "Kelola Iklan", 434),
    ], "admin")
    b += grp("uc-g6", "«Pemantauan»", "R", 512, 134, [
        ("uc-uc20", "Lihat Log Aktivitas", 542),
    ], "admin")

    # ---------------- Asosiasi Jamaah ----------------
    # bus vertikal x=430 (di luar batas sistem, kiri) -> horizontal ke x=614
    # (tepi kiri elips). Ruang 430..614 kosong. NOL perpotongan.
    jamaah = [("uc-uc1", 233), ("uc-uc2", 289), ("uc-uc3", 345), ("uc-uc4", 401),
              ("uc-uc8", 505), ("uc-uc9", 561), ("uc-uc10", 617), ("uc-uc11", 673),
              ("uc-uc12", 729), ("uc-uc5", 837), ("uc-uc6", 893), ("uc-uc7", 949)]
    for i, (uc, cy) in enumerate(jamaah):
        b += edge(f"uc-assoc-j{i}", "",
                  S_ASSOC + "exitX=1;exitY=0.5;entryX=0;entryY=0.5;",
                  "uc-a-jamaah", uc,
                  points=[(430, 533), (430, cy), (614, cy)])

    # ---------------- Asosiasi Administrator ----------------
    # bus vertikal x=1900 (di luar batas sistem, kanan) -> horizontal ke 1744
    admin = [("uc-uc14", 233), ("uc-uc15", 289), ("uc-uc16", 345),
             ("uc-uc17", 401), ("uc-uc18", 457), ("uc-uc20", 565)]
    for i, (uc, cy) in enumerate(admin):
        b += edge(f"uc-assoc-a{i}", "",
                  S_ASSOC + "exitX=0;exitY=0.5;entryX=1;entryY=0.5;",
                  "uc-a-admin", uc,
                  points=[(1900, 503), (1900, cy), (1744, cy)])

    # ---------------- Asosiasi aktor eksternal ----------------
    # QRIS  : lurus vertikal dari bawah ke tepi bawah uc19 (x=1100).
    #         Tidak melewati uc13 karena uc13 berada di ATAS uc19.
    # Google: naik lewat celah kanan (x=1390, celah 1360..1450) lalu masuk
    #         dari tepi KANAN uc13 (1344, 663). Celah itu kosong karena
    #         kolom kanan sudah berakhir di y=646.
    b += edge("uc-assoc-q", "",
              S_ASSOC + "exitX=0.5;exitY=0;entryX=0.13;entryY=1;",
              "uc-a-qris", "uc-uc19",
              points=[(1100, 900)])
    b += edge("uc-assoc-g", "",
              S_ASSOC + "exitX=0.5;exitY=0;entryX=1;entryY=0.5;",
              "uc-a-google", "uc-uc13",
              points=[(1390, 663)])

    # ---------------- «include» ----------------
    # uc2 Masuk Google  --include--> uc13 Verifikasi Token Google (koridor x=995)
    b += edge("uc-include1", "",
              S_INCLUDE + "exitX=1;exitY=0.5;entryX=0;entryY=0.5;",
              "uc-uc2", "uc-uc13",
              points=[(995, 289), (995, 663), (1064, 663)])
    # uc6 Pilih Metode Pembayaran --include--> uc19 Konfirmasi Pembayaran (x=1025)
    b += edge("uc-include2", "",
              S_INCLUDE + "exitX=1;exitY=0.5;entryX=0;entryY=0.5;",
              "uc-uc6", "uc-uc19",
              points=[(1025, 893), (1025, 743), (1064, 743)])

    # ---------------- «extend» ----------------
    # uc3 Lupa Password (OTP) --extend--> uc1 Masuk Email   (koridor x=935)
    b += edge("uc-extend1", "",
              S_EXTEND + "exitX=1;exitY=0.5;entryX=1;entryY=0.5;",
              "uc-uc3", "uc-uc1",
              points=[(935, 345), (935, 233), (894, 233)])
    # uc11 Baca Buku Pro --extend--> uc10 Baca Buku Umum   (koridor x=955)
    b += edge("uc-extend2", "",
              S_EXTEND + "exitX=1;exitY=0.5;entryX=1;entryY=0.5;",
              "uc-uc11", "uc-uc10",
              points=[(955, 673), (955, 617), (894, 617)])

    # Label relasi: sel terpisah ber-latar putih, menempel pada koridor
    b += cell("uc-inclbl1", "«include»", S_EXTLBL, 963, 470, 64, 18)
    b += cell("uc-inclbl2", "«include»", S_EXTLBL, 993, 815, 64, 18)
    # catatan: uc-extlbl1 DILARANG duduk di y=285..303 -- garis horizontal
    # «include» uc2->uc13 lewat di y=289. Ditaruh di y=320 (masih menempel
    # pada koridor x=935 yang membentang y=233..345).
    b += cell("uc-extlbl1", "«extend»", S_EXTLBL, 912, 320, 62, 18)
    b += cell("uc-extlbl2", "«extend»", S_EXTLBL, 910, 640, 62, 18)

    # ---------------- Legenda, catatan, caption ----------------
    b += cell("uc-legbox", "", S_LEGBOX, 600, 1200, 250, 142)
    b += cell("uc-legtitle", "Legenda", S_LEGTITLE, 612, 1206, 226, 20)
    legend = [
        ("#a5d8ff", "#1971c2", "akun &amp; keamanan"),
        ("#c3fae8", "#0c8599", "katalog &amp; bacaan"),
        ("#ffec99", "#e67700", "berlangganan &amp; bayar"),
        ("#d0bfff", "#9c36b5", "administrasi &amp; pantau"),
        ("#ffd8a8", "#e8590c", "layanan eksternal"),
    ]
    for i, (fc, sc, txt) in enumerate(legend):
        st = S_LEGSWATCH.replace("fillColor=#a5d8ff", f"fillColor={fc}").replace("strokeColor=#1971c2", f"strokeColor={sc}")
        b += cell(f"uc-legsw{i}", "", st, 612, 1233 + i * 20, 16, 14)
        b += cell(f"uc-legtx{i}", txt, S_LEGTEXT, 636, 1230 + i * 20, 202, 20)
    b += cell("uc-note",
              "Garis lurus = asosiasi aktor ↔ use case. Garis putus-putus = «include» (wajib) / «extend» (opsional). "
              "Verifikasi Transaksi (Administrator) berpasangan dengan Konfirmasi Pembayaran (QRIS) pada sisi penyelesaian transaksi.",
              S_NOTEBIG, 900, 1200, 970, 80)
    b += cell("uc-caption",
              "Aktor: Jamaah (pengguna), Administrator, serta sistem eksternal Google OAuth 2.0 dan QRIS Simulator. "
              "Use case dikelompokkan menurut aktor pemiliknya.",
              S_CAPTION, 40, 1360, 1500, 24)
    return page("r59-uc", "01 Use Case", b)




# ============================================================================
# Helper untuk halaman Activity
# ============================================================================
def activity_page(pid, page_name, title, lanes, nodes, edges, note, caption,
                  note_xy, note_wh, canvas_h):
    """lanes: [(id, label, x, w)]; nodes: (id,label,kind,x,y,w,h,parent)"""
    b = ""
    b += cell(pid + "-title", title, S_TITLE, 40, 30, 1000, 24)
    for (lid, llabel, lx, lw) in lanes:
        b += cell(lid, llabel, S_LANE, lx, 72, lw, canvas_h)
    kind_style = {
        "action": S_ACTION, "decision": S_DECISION, "initial": S_INITIAL,
        "final": S_FINAL, "merge": S_MERGE, "guard": S_GUARD, "note": S_NOTE,
        "fork": S_FORK,
    }
    for (nid, label, kind, x, y, w, h, parent) in nodes:
        b += cell(nid, label, kind_style[kind], x, y, w, h, parent)
    for e in edges:
        b += edge(e["id"], e.get("label", ""), S_FLOW, e["src"], e["tgt"], e.get("pts"))
    # Legend (kanan atas)
    LX, LY = 1352, 66
    b += cell(pid + "-legtitle", "Legenda", S_LEGTITLE, LX, LY, 226, 20)
    items = [
        ("initial", "start / final node"), ("action", "aktivitas sistem"),
        ("actionu", "aktivitas pengguna"), ("actiond", "operasi basis data"),
        ("decision", "decision"), ("guard", "guard pada edge keluar"),
        ("err", "notifikasi galat"), ("merge", "merge — cabang bergabung ulang"),
    ]
    for i, (k, txt) in enumerate(items):
        b += cell(f"{pid}-legsw{i}", "", SWATCH[k], LX + 10, LY + 24 + i * 20, 18, 14)
        b += cell(f"{pid}-legtx{i}", txt, S_LEGTEXT, LX + 34, LY + 21 + i * 20, 200, 20)
    b += cell(pid + "-note", note, S_NOTE, note_xy[0], note_xy[1], note_wh[0], note_wh[1])
    b += cell(pid + "-caption", caption, S_CAPTION, 40, 72 + canvas_h + 40, 1500, 24)
    return page(pid, page_name, b)


SWATCH = {
    "initial": "metaUml=legend-swatch;html=1;fillColor=#212529;strokeColor=#212529;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
    "action": "metaUml=legend-swatch;html=1;fillColor=#b2f2bb;strokeColor=#2f9e44;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
    "actionu": "metaUml=legend-swatch;html=1;fillColor=#a5d8ff;strokeColor=#1971c2;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
    "actiond": "metaUml=legend-swatch;html=1;fillColor=#d0bfff;strokeColor=#9c36b5;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
    "decision": "metaUml=legend-swatch;html=1;fillColor=#ffec99;strokeColor=#e67700;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
    "guard": "metaUml=legend-swatch;html=1;fillColor=#fff9db;strokeColor=none;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
    "err": "metaUml=legend-swatch;html=1;fillColor=#ffc9c9;strokeColor=#c92a2a;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
    "merge": "metaUml=legend-swatch;html=1;fillColor=#e9ecef;strokeColor=#495057;strokeWidth=1.5;shadow=0;glass=0;rounded=0;",
}


# ============================================================================
# HALAMAN 2 — 02A Aktivitas Registrasi Akun
# ============================================================================
def build_02a():
    lanes = [("a2-l0", "Jamaah (Pengguna)", 60, 360),
             ("a2-l1", "Sistem (Frontend React + Express)", 510, 370),
             ("a2-l2", "Basis Data Supabase & Gmail", 970, 310)]
    nodes = [
        ("a2-init", "", "initial", 227, 154, 26, 26, "1"),
        ("a2-n1", "Membuka halaman registrasi & mengisi nama, email, password, tanggal lahir", "action", 100, 232, 280, 66, "1"),
        ("a2-n2", "Validasi format input (Zod): nama, email, password min. 8 karakter, dob", "action", 550, 344, 290, 66, "1"),
        ("a2-d1", "Input valid?", "decision", 657, 500, 76, 76, "1"),
        ("a2-n3", "Notifikasi galat validasi (field tertentu)", "action", 100, 584, 280, 58, "1"),
        ("a2-n4", "POST /api/auth/register", "action", 550, 644, 290, 58, "1"),
        ("a2-n5", "Cek email terdaftar? SELECT id FROM users WHERE email = ?", "action", 1010, 644, 230, 66, "1"),
        ("a2-d2", "Email sudah ada?", "decision", 657, 800, 76, 76, "1"),
        ("a2-n6", "Notifikasi \"Email sudah terdaftar\" (HTTP 409)", "action", 100, 884, 280, 58, "1"),
        ("a2-n7", "Terbitkan OTP 6 digit (TTL 10 menit) via issueOtp()", "action", 550, 940, 290, 58, "1"),
        ("a2-n8", "Kirim email kode verifikasi melalui Gmail API", "action", 1010, 940, 230, 58, "1"),
        ("a2-fork", "", "fork", 240, 1042, 160, 10, "1"),
        ("a2-n9a", "Menerima email & membaca kode verifikasi", "action", 100, 1088, 280, 58, "1"),
        ("a2-n9b", "Masukkan kode ke layar verifikasi (10 menit)", "action", 100, 1164, 280, 58, "1"),
        ("a2-n10", "POST /api/auth/verify-registration { email, code }", "action", 550, 1108, 290, 58, "1"),
        ("a2-n11", "consumeOtp(): cari OTP aktif, cek kedaluwarsa & batas gagal", "action", 1010, 1108, 230, 66, "1"),
        ("a2-d3", "Kode valid & belum kedaluwarsa?", "decision", 657, 1256, 76, 76, "1"),
        ("a2-n12", "Notifikasi \"Kode salah / kedaluwarsa\", tawarkan kirim ulang", "action", 100, 1340, 280, 58, "1"),
        ("a2-n13", "INSERT INTO users (hash bcrypt 12, role=user, is_pro=false)", "action", 1010, 1332, 230, 66, "1"),
        ("a2-merge", "", "merge", 675, 1416, 40, 40, "1"),
        ("a2-n14", "Terbitkan JWT 12 jam; simpan token di localStorage", "action", 550, 1440, 290, 58, "1"),
        ("a2-n15", "Hapus OTP terpakai; notifikasi \"Akun berhasil dibuat\"", "action", 1010, 1440, 230, 58, "1"),
        ("a2-n16", "Redirect ke beranda; sesi aktif (badge sesuai is_pro)", "action", 550, 1544, 290, 58, "1"),
        ("a2-final", "", "final", 224, 1626, 32, 32, "1"),
    ]
    edges = [
        {"id": "a2-e1", "src": "a2-init", "tgt": "a2-n1", "pts": [[240, 180], [240, 232]]},
        {"id": "a2-e2", "src": "a2-n1", "tgt": "a2-n2", "pts": [[380, 265], [465, 265], [465, 377], [550, 377]]},
        {"id": "a2-e3", "src": "a2-n2", "tgt": "a2-d1", "pts": [[695, 410], [695, 500]]},
        {"id": "a2-e4", "src": "a2-d1", "tgt": "a2-n3", "pts": [[657, 538], [430, 538], [430, 613], [380, 613]]},
        {"id": "a2-e5", "src": "a2-d1", "tgt": "a2-n4", "pts": [[695, 576], [695, 644]]},
        {"id": "a2-e6", "src": "a2-n4", "tgt": "a2-n5", "pts": [[840, 673], [1010, 673]]},
        {"id": "a2-e7", "src": "a2-n5", "tgt": "a2-d2", "pts": [[1125, 710], [1125, 838], [733, 838]]},
        {"id": "a2-e8", "src": "a2-d2", "tgt": "a2-n6", "pts": [[657, 838], [430, 838], [430, 913], [380, 913]]},
        {"id": "a2-e9", "src": "a2-d2", "tgt": "a2-n7", "pts": [[695, 876], [695, 940]]},
        {"id": "a2-e10", "src": "a2-n7", "tgt": "a2-n8", "pts": [[840, 969], [1010, 969]]},
        {"id": "a2-e11", "src": "a2-n8", "tgt": "a2-fork", "pts": [[1125, 998], [1125, 1047], [400, 1047]]},
        {"id": "a2-e12", "src": "a2-fork", "tgt": "a2-n9a", "pts": [[240, 1052], [240, 1088]]},
        {"id": "a2-e13", "src": "a2-n9a", "tgt": "a2-n9b", "pts": []},
        {"id": "a2-e14", "src": "a2-n9b", "tgt": "a2-n10", "pts": [[380, 1193], [465, 1193], [465, 1137], [550, 1137]]},
        {"id": "a2-e15", "src": "a2-n10", "tgt": "a2-n11", "pts": [[840, 1137], [1010, 1137]]},
        {"id": "a2-e16", "src": "a2-n11", "tgt": "a2-d3", "pts": [[1125, 1174], [1125, 1294], [733, 1294]]},
        {"id": "a2-e17", "src": "a2-d3", "tgt": "a2-n12", "pts": [[657, 1294], [430, 1294], [430, 1369], [380, 1369]]},
        {"id": "a2-e18", "src": "a2-d3", "tgt": "a2-n13", "pts": [[733, 1294], [1010, 1365]]},
        {"id": "a2-e19", "src": "a2-n12", "tgt": "a2-merge", "pts": [[380, 1398], [695, 1398], [695, 1416]]},
        {"id": "a2-e20", "src": "a2-n13", "tgt": "a2-merge", "pts": [[1125, 1398], [695, 1398], [695, 1416]]},
        {"id": "a2-e21", "src": "a2-merge", "tgt": "a2-n14", "pts": [[695, 1456], [695, 1440]]},
        {"id": "a2-e22", "src": "a2-n14", "tgt": "a2-n15", "pts": [[840, 1469], [1010, 1469]]},
        {"id": "a2-e23", "src": "a2-n14", "tgt": "a2-n16", "pts": [[695, 1498], [695, 1544]]},
        {"id": "a2-e24", "src": "a2-n16", "tgt": "a2-final", "pts": [[695, 1602], [400, 1602], [400, 1642], [240, 1642]]},
    ]
    # override fork/merge styles already handled
    note = ("Registrasi memakai pola OTP berlapis: kode 6 digit hanya berlaku 10 menit dan dibatasi 5 kali salah. "
            "Akun baru dibuat (INSERT) baru setelah kode terbukti sah — status akun dianggap aktif sejak dibuat.\n\n"
            "[validasi Zod] memblokir input sebelum menyentuh basis data, sehingga query email terdaftar adalah "
            "satu-satunya akses DB pada jalur galat.")
    caption = ("Alur registrasi akun (email + kata sandi). Aktor: Jamaah. Kode OTP dikirim via Gmail API dan "
               "diverifikasi lewat email_verifications sebelum baris users dibuat.")
    return activity_page("r59-a", "02A Activity Diagram: Registrasi Akun", "Diagram 02A — Activity Diagram: Registrasi Akun", lanes, nodes,
                         edges, note, caption, (1340, 272), (560, 152), 1620)


# ============================================================================
# HALAMAN 3 — 02B Aktivitas Reset Password (OTP)
# ============================================================================
def build_02b():
    lanes = [("b2-l0", "Jamaah (Pengguna)", 60, 360),
             ("b2-l1", "Sistem (Frontend React + Express)", 510, 370),
             ("b2-l2", "Basis Data Supabase & Gmail", 970, 310)]
    nodes = [
        ("b2-init", "", "initial", 227, 154, 26, 26, "1"),
        ("b2-n1", "Klik \"Lupa Password\" & masukkan alamat email", "action", 100, 232, 280, 66, "1"),
        ("b2-n2", "POST /api/auth/request-password-reset { email }", "action", 550, 288, 290, 58, "1"),
        ("b2-n3", "normalizeEmail(); cari akun: SELECT id, login_method WHERE email = ?", "action", 1010, 288, 230, 66, "1"),
        ("b2-d1", "Email terdaftar?", "decision", 657, 420, 76, 76, "1"),
        ("b2-d2", "login_method = google?", "decision", 657, 640, 76, 76, "1"),
        ("b2-n4", "Kirim email pemberitahuan \"akun terdaftar via Google\"", "action", 1010, 640, 230, 58, "1"),
        ("b2-n5", "Terbitkan OTP reset (TTL 10 menit) & kirim via Gmail API", "action", 550, 776, 290, 58, "1"),
        ("b2-n6", "Kirim email kode pemulihan", "action", 1010, 776, 230, 58, "1"),
        ("b2-n7", "Respons seragam — tanpa membocorkan status akun (anti-enumerasi)", "action", 550, 884, 290, 58, "1"),
        ("b2-n8", "Notifikasi \"Jika email terdaftar, kode telah dikirim & berlaku 10 menit\"", "action", 100, 884, 280, 58, "1"),
        ("b2-n9", "Buka email & salin kode; isi kode + password baru di layar reset", "action", 100, 1004, 280, 66, "1"),
        ("b2-n10", "POST /api/auth/reset-password { email, code, password }", "action", 550, 1004, 290, 58, "1"),
        ("b2-n11", "consumeOtp() + validasi password baru (min. 8 karakter)", "action", 1010, 1004, 230, 66, "1"),
        ("b2-d3", "Kode valid & password memenuhi syarat?", "decision", 657, 1152, 76, 76, "1"),
        ("b2-n12", "Notifikasi galat (kode salah / kedaluwarsa / password terlalu pendek)", "action", 100, 1236, 280, 66, "1"),
        ("b2-n13", "UPDATE users SET password = hash bcrypt(12) WHERE email = ?", "action", 1010, 1236, 230, 66, "1"),
        ("b2-merge", "", "merge", 675, 1338, 40, 40, "1"),
        ("b2-n14", "Hapus OTP terpakai; notifikasi sukses + arahkan kembali ke Login", "action", 550, 1362, 290, 58, "1"),
        ("b2-n15", "Masuk dengan password baru (POST /api/auth/login)", "action", 100, 1436, 280, 58, "1"),
        ("b2-final", "", "final", 224, 1528, 32, 32, "1"),
    ]
    edges = [
        {"id": "b2-e1", "src": "b2-init", "tgt": "b2-n1", "pts": [[240, 180], [240, 232]]},
        {"id": "b2-e2", "src": "b2-n1", "tgt": "b2-n2", "pts": [[380, 265], [465, 265], [465, 317], [550, 317]]},
        {"id": "b2-e3", "src": "b2-n2", "tgt": "b2-n3", "pts": [[840, 317], [1010, 321]]},
        {"id": "b2-e4", "src": "b2-n3", "tgt": "b2-d1", "pts": [[1125, 354], [1125, 458], [733, 458]]},
        {"id": "b2-e5", "src": "b2-d1", "tgt": "b2-n8", "label": "[email tidak terdaftar]", "pts": [[657, 458], [430, 458], [430, 913], [380, 913]]},
        {"id": "b2-e6", "src": "b2-d1", "tgt": "b2-d2", "label": "[terdaftar]", "pts": [[695, 496], [695, 640]]},
        {"id": "b2-e7", "src": "b2-d2", "tgt": "b2-n4", "label": "[ya]", "pts": [[733, 678], [1010, 669]]},
        {"id": "b2-e8", "src": "b2-n4", "tgt": "b2-n7", "pts": [[1125, 698], [1125, 913], [840, 913]]},
        {"id": "b2-e9", "src": "b2-d2", "tgt": "b2-n5", "label": "[tidak]", "pts": [[695, 716], [695, 776]]},
        {"id": "b2-e10", "src": "b2-n5", "tgt": "b2-n6", "pts": [[840, 805], [1010, 805]]},
        {"id": "b2-e11", "src": "b2-n6", "tgt": "b2-n7", "pts": [[1125, 834], [1125, 913], [840, 913]]},
        {"id": "b2-e12", "src": "b2-n7", "tgt": "b2-n8", "pts": [[695, 942], [430, 942], [430, 913], [380, 913]]},
        {"id": "b2-e13", "src": "b2-n8", "tgt": "b2-n9", "pts": [[240, 942], [240, 1004]]},
        {"id": "b2-e14", "src": "b2-n9", "tgt": "b2-n10", "pts": [[380, 1037], [465, 1037], [465, 1033], [550, 1033]]},
        {"id": "b2-e15", "src": "b2-n10", "tgt": "b2-n11", "pts": [[840, 1033], [1010, 1037]]},
        {"id": "b2-e16", "src": "b2-n11", "tgt": "b2-d3", "pts": [[1125, 1070], [1125, 1190], [733, 1190]]},
        {"id": "b2-e17", "src": "b2-d3", "tgt": "b2-n12", "label": "[tidak]", "pts": [[657, 1190], [430, 1190], [430, 1269], [380, 1269]]},
        {"id": "b2-e18", "src": "b2-d3", "tgt": "b2-n13", "label": "[ya]", "pts": [[733, 1190], [1010, 1269]]},
        {"id": "b2-e19", "src": "b2-n12", "tgt": "b2-merge", "pts": [[380, 1302], [695, 1302], [695, 1338]]},
        {"id": "b2-e20", "src": "b2-n13", "tgt": "b2-merge", "pts": [[1125, 1302], [695, 1302], [695, 1338]]},
        {"id": "b2-e21", "src": "b2-merge", "tgt": "b2-n14", "pts": [[695, 1378], [695, 1362]]},
        {"id": "b2-e22", "src": "b2-n14", "tgt": "b2-n15", "pts": [[695, 1420], [400, 1420], [400, 1465], [380, 1465]]},
        {"id": "b2-e23", "src": "b2-n15", "tgt": "b2-final", "pts": [[240, 1494], [240, 1536]]},
    ]
    note = ("Reset password memakai respons seragam (uniform response) untuk mencegah enumerasi akun: klien selalu "
            "menerima pesan yang sama, baik email terdaftar maupun tidak.\n\n"
            "Akun yang terdaftar lewat Google tidak memiliki kolom password, sehingga permintaan reset dijawab "
            "dengan arahan memakai tombol \"Login dengan Google\".")
    caption = ("Alur pemulihan kata sandi lewat kode OTP. Aktor: Jamaah. Hanya akun login_email yang boleh mereset; "
               "akun Google diarahkan ke jalur OAuth.")
    return activity_page("r59-b", "02B Activity Diagram: Reset Password (OTP)", "Diagram 02B — Activity Diagram: Reset Password (OTP)",
                         lanes, nodes, edges, note, caption, (1340, 272), (560, 150), 1660)


# ============================================================================
# HALAMAN 4 — 02C Aktivitas Baca Buku PDF Terproteksi
# ============================================================================
def build_02c():
    lanes = [("c2-l0", "Jamaah (Pengguna)", 60, 360),
             ("c2-l1", "Sistem (Frontend React + Express)", 510, 370),
             ("c2-l2", "Basis Data Supabase & Storage", 970, 310)]
    nodes = [
        ("c2-init", "", "initial", 227, 154, 26, 26, "1"),
        ("c2-n1", "Membuka katalog & memilih buku dari grid", "action", 100, 232, 280, 58, "1"),
        ("c2-n2", "GET /api/books — muat daftar buku + thumbnail", "action", 550, 232, 290, 58, "1"),
        ("c2-n3", "SELECT * FROM books; sajikan thumbnail (publik, max-age 86400)", "action", 1010, 232, 230, 66, "1"),
        ("c2-n4", "Klik kartu buku → buka PdfReaderScreen", "action", 100, 356, 280, 58, "1"),
        ("c2-n5", "GET /api/books/:id/content dengan header Authorization", "action", 550, 356, 290, 58, "1"),
        ("c2-n6", "requireAuth → verifikasi JWT & muat user efektif", "action", 1010, 356, 230, 58, "1"),
        ("c2-d1", "Buku terkunci (is_locked) DAN bukan Pro/admin?", "decision", 657, 512, 76, 76, "1"),
        ("c2-n7", "HTTP 403 → kartu \"Konten khusus pembaca Pro\"", "action", 100, 596, 280, 58, "1"),
        ("c2-n8", "Tombol \"Lihat Paket Pro\" → alur berlangganan", "action", 100, 700, 280, 58, "1"),
        ("c2-n9", "Ambil konten (base64) → kirim inline; Cache-Control: private, max-age 3600", "action", 1010, 512, 230, 66, "1"),
        ("c2-n10", "Terima blob PDF → buat objek URL lokal", "action", 550, 640, 290, 58, "1"),
        ("c2-n11", "Tampilkan dalam iframe dengan #toolbar=0&navpanes=0; klik kanan dicegah", "action", 550, 752, 290, 66, "1"),
        ("c2-n12", "Membaca buku; navigasi halaman & atur tema pembaca", "action", 100, 836, 280, 66, "1"),
        ("c2-n13", "Simpan posisi halaman terakhir (per pengguna)", "action", 550, 872, 290, 58, "1"),
        ("c2-final", "", "final", 224, 964, 32, 32, "1"),
    ]
    edges = [
        {"id": "c2-e1", "src": "c2-init", "tgt": "c2-n1", "pts": [[240, 180], [240, 232]]},
        {"id": "c2-e2", "src": "c2-n1", "tgt": "c2-n2", "pts": [[380, 261], [465, 261], [465, 261], [550, 261]]},
        {"id": "c2-e3", "src": "c2-n2", "tgt": "c2-n3", "pts": [[840, 261], [1010, 265]]},
        {"id": "c2-e4", "src": "c2-n3", "tgt": "c2-n4", "pts": [[1125, 298], [1125, 385], [240, 385]]},
        {"id": "c2-e5", "src": "c2-n4", "tgt": "c2-n5", "pts": [[380, 385], [465, 385], [465, 385], [550, 385]]},
        {"id": "c2-e6", "src": "c2-n5", "tgt": "c2-n6", "pts": [[840, 385], [1010, 385]]},
        {"id": "c2-e7", "src": "c2-n6", "tgt": "c2-d1", "pts": [[1125, 414], [1125, 550], [733, 550]]},
        {"id": "c2-e8", "src": "c2-d1", "tgt": "c2-n7", "label": "[ya — terkunci]", "pts": [[657, 550], [430, 550], [430, 625], [380, 625]]},
        {"id": "c2-e9", "src": "c2-n7", "tgt": "c2-n8", "pts": []},
        {"id": "c2-e10", "src": "c2-d1", "tgt": "c2-n9", "label": "[tidak / Pro]", "pts": [[733, 550], [1010, 545]]},
        {"id": "c2-e11", "src": "c2-n9", "tgt": "c2-n10", "pts": [[1125, 578], [1125, 669], [840, 669]]},
        {"id": "c2-e12", "src": "c2-n10", "tgt": "c2-n11", "pts": [[695, 698], [695, 752]]},
        {"id": "c2-e13", "src": "c2-n11", "tgt": "c2-n12", "pts": [[695, 818], [400, 818], [400, 869], [380, 869]]},
        {"id": "c2-e14", "src": "c2-n12", "tgt": "c2-n13", "pts": [[380, 869], [465, 869], [465, 901], [550, 901]]},
        {"id": "c2-e15", "src": "c2-n13", "tgt": "c2-final", "pts": [[695, 930], [400, 930], [400, 980], [240, 980]]},
    ]
    note = ("Proteksi konten berlapis: (1) requireAuth + cek is_locked di server sebelum byte PDF dikirim; "
            "(2) PDF di-fetch sebagai blob sehingga tidak ada URL publik yang bisa dibagikan; "
            "(3) iframe memakai #toolbar=0&navpanes=0 dan klik kanan (context menu) dinonaktifkan.\n\n"
            "Catatan: ini adalah pencegahan tingkat aplikasi (deterrence), bukan DRM — pengguna teknis masih "
            "dapat menyimpan berkas yang tampil di peramban.")
    caption = ("Alur membaca buku PDF terproteksi. Aktor: Jamaah. Buku bertanda is_locked hanya terbuka untuk "
               "pengguna Pro atau Administrator.")
    return activity_page("r59-c", "02C Activity Diagram: Baca Buku PDF", "Diagram 02C — Activity Diagram: Baca Buku PDF Terproteksi",
                         lanes, nodes, edges, note, caption, (1340, 272), (560, 152), 1090)


# ============================================================================
# HALAMAN 5 — 02D Aktivitas Kelola Buku (Admin CRUD)
# ============================================================================
def build_02d():
    lanes = [("d2-l0", "Administrator", 60, 360),
             ("d2-l1", "Sistem (Frontend React + Express)", 510, 370),
             ("d2-l2", "Basis Data Supabase & Storage", 970, 310)]
    nodes = [
        ("d2-init", "", "initial", 227, 154, 26, 26, "1"),
        ("d2-n1", "Buka Panel Admin → tab Buku", "action", 100, 232, 280, 58, "1"),
        ("d2-n2", "requireAuth + requireAdmin (JWT & role dari sesi)", "action", 550, 232, 290, 58, "1"),
        ("d2-d1", "Peran = admin?", "decision", 657, 376, 76, 76, "1"),
        ("d2-n3", "HTTP 403 → kembali ke beranda", "action", 100, 460, 280, 58, "1"),
        ("d2-n4", "Pilih aksi: Tambah / Ubah / Hapus buku", "action", 550, 460, 290, 58, "1"),
        ("d2-fork", "", "fork", 240, 576, 160, 10, "1"),
        ("d2-n5", "Isi form (judul, penulis, kategori, halaman, is_locked) + unggah cover/PDF", "action", 100, 620, 280, 66, "1"),
        ("d2-n6", "POST /api/books/upload (multipart) — validasi & sanitasi berkas", "action", 550, 620, 290, 66, "1"),
        ("d2-n7", "Simpan thumbnail (Sharp → WebP) & konten (base64 content_url)", "action", 1010, 620, 230, 66, "1"),
        ("d2-n8", "Pilih buku → ubah bidang → simpan", "action", 100, 776, 280, 58, "1"),
        ("d2-n9", "PUT /api/books/:id — perbarui baris buku", "action", 550, 776, 290, 58, "1"),
        ("d2-n10", "Pilih buku → konfirmasi hapus", "action", 100, 900, 280, 58, "1"),
        ("d2-n11", "DELETE /api/books/:id — hapus baris + aset terkait", "action", 550, 900, 290, 58, "1"),
        ("d2-mergex", "", "merge", 675, 1004, 40, 40, "1"),
        ("d2-n12", "Muat ulang daftar buku (GET /api/books) & tampilkan perubahan", "action", 550, 1090, 290, 58, "1"),
        ("d2-final", "", "final", 689, 1184, 32, 32, "1"),
    ]
    edges = [
        {"id": "d2-e1", "src": "d2-init", "tgt": "d2-n1", "pts": [[240, 180], [240, 232]]},
        {"id": "d2-e2", "src": "d2-n1", "tgt": "d2-n2", "pts": [[380, 261], [465, 261], [465, 261], [550, 261]]},
        {"id": "d2-e3", "src": "d2-n2", "tgt": "d2-d1", "pts": [[695, 290], [695, 376]]},
        {"id": "d2-e4", "src": "d2-d1", "tgt": "d2-n3", "label": "[tidak]", "pts": [[657, 414], [430, 414], [430, 489], [380, 489]]},
        {"id": "d2-e5", "src": "d2-d1", "tgt": "d2-n4", "label": "[ya]", "pts": [[695, 452], [695, 460]]},
        {"id": "d2-e6", "src": "d2-n4", "tgt": "d2-fork", "pts": [[695, 518], [695, 581], [400, 581]]},
        {"id": "d2-e7", "src": "d2-fork", "tgt": "d2-n5", "pts": [[240, 586], [240, 620]]},
        {"id": "d2-e8", "src": "d2-n5", "tgt": "d2-n6", "pts": [[380, 653], [465, 653], [465, 653], [550, 653]]},
        {"id": "d2-e9", "src": "d2-n6", "tgt": "d2-n7", "pts": [[840, 653], [1010, 653]]},
        {"id": "d2-e10", "src": "d2-n7", "tgt": "d2-mergex", "pts": [[1125, 686], [1125, 1024], [715, 1024]]},
        {"id": "d2-e11", "src": "d2-fork", "tgt": "d2-n8", "pts": [[240, 586], [240, 776]]},
        {"id": "d2-e12", "src": "d2-n8", "tgt": "d2-n9", "pts": [[380, 805], [465, 805], [465, 805], [550, 805]]},
        {"id": "d2-e13", "src": "d2-n9", "tgt": "d2-mergex", "pts": [[840, 805], [900, 805], [900, 1024], [715, 1024]]},
        {"id": "d2-e14", "src": "d2-fork", "tgt": "d2-n10", "pts": [[240, 586], [240, 900]]},
        {"id": "d2-e15", "src": "d2-n10", "tgt": "d2-n11", "pts": [[380, 929], [465, 929], [465, 929], [550, 929]]},
        {"id": "d2-e16", "src": "d2-n11", "tgt": "d2-mergex", "pts": [[840, 929], [900, 929], [900, 1024], [715, 1024]]},
        {"id": "d2-e17", "src": "d2-mergex", "tgt": "d2-n12", "pts": [[695, 1044], [695, 1090]]},
        {"id": "d2-e18", "src": "d2-n12", "tgt": "d2-final", "pts": [[695, 1148], [695, 1184]]},
    ]
    note = ("Semua rute pengelolaan buku dijaga ganda: requireAuth (JWT sah) dan requireAdmin (peran dari basis data). "
            "Gagal salah satu → HTTP 403.\n\n"
            "Unggahan divalidasi tipe & ukurannya, cover dikompresi ke WebP, dan PDF disimpan sebagai base64 pada kolom "
            "content_url — menegaskan keputusan proyek untuk tidak memakai penyimpanan berkas terpisah.")
    caption = ("Alur CRUD buku oleh administrator (tambah / ubah / hapus). Aktor: Administrator — satu-satunya peran "
               "yang boleh menulis ke tabel books.")
    return activity_page("r59-d", "02D Activity Diagram: Kelola Buku (Admin)", "Diagram 02D — Activity Diagram: Kelola Buku (Admin CRUD)",
                         lanes, nodes, edges, note, caption, (1340, 272), (560, 150), 1180)


# ============================================================================
def main():
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<mxfile host="drawio" version="26.0.0">\n'
    xml += build_usecase()
    xml += build_02a()
    xml += build_02b()
    xml += build_02c()
    xml += build_02d()
    xml += '</mxfile>\n'
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(xml)
    print("OK ->", OUT, len(xml), "bytes")


if __name__ == "__main__":
    main()
