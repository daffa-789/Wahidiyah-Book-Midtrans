# -*- coding: utf-8 -*-
"""
Fix the 2 malformed rows in Table 6 (Tabel 2.1) that patch_citations.py mangled:
  - row "Kusumo dkk. (2021)"  (was Saekup, non-SINTA -> replaced by Kusumo)
  - row "Nariswari dkk. (2023)" (rebuilt cleanly)

Rebuild each <w:tc> with the proper prologue:
  <w:tc><w:tcPr><w:tcW w:type="dxa" w:w="W"/></w:tcPr>
    <w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:after="40"/><w:jc w:val="JC"/></w:pPr>
      <w:r/><w:r><w:rPr><w:rFonts .../><w:sz w:val="18"/></w:rPr><w:t>TEXT</w:t></w:r></w:p></w:tc>

Cell widths in this table: 1587 / 2041 / 2041 / 2268
First cell  -> jc="center"; other cells -> jc="both"
"""
import re, sys, io

SRC = "document_new5.xml"          # current (has XML error, but text is final)
OUT = "document_new6.xml"

data = open(SRC, "r", encoding="utf-8").read()

FONT = ('<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" '
        'w:cs="Times New Roman" w:eastAsia="Times New Roman"/>')

def cell(text, width, jc):
    return (
        f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{width}"/></w:tcPr>'
        f'<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:after="40"/>'
        f'<w:jc w:val="{jc}"/></w:pPr>'
        f'<w:r/><w:r><w:rPr>{FONT}<w:sz w:val="18"/></w:rPr>'
        f'<w:t xml:space="preserve">{text}</w:t></w:r></w:p></w:tc>'
    )

def row(cells):
    return "<w:tr>" + "".join(cells) + "</w:tr>"

# ---- Rebuilt rows (text preserved from final XML) ----
ROW_KUSUMO = row([
    cell("Kusumo dkk. (2021)", 1587, "center"),
    cell("Rancang bangun sistem informasi penjualan berbasis web; metode waterfall.", 2041, "both"),
    cell("Transaksi penjualan tercatat dan laporan tersaji daring.", 2041, "both"),
    cell("Sejalan pada modul transaksi; penelitian ini menambahkan idempotensi penyelesaian.", 2268, "both"),
])

ROW_NARISWARI = row([
    cell("Nariswari dkk. (2023)", 1587, "center"),
    cell("Rancang bangun sistem e-tiket berbasis payment gateway.", 2041, "both"),
    cell("Pemesanan dan pembayaran tiket terotomatisasi melalui gateway.", 2041, "both"),
    cell("Sejalan pada integrasi gateway; penelitian ini menambahkan pencegahan aktivasi ganda.", 2268, "both"),
])

ROW_PUTRI = row([
    cell("Putri (2022)", 1587, "center"),
    cell("Pengujian usability aplikasi e-wallet dengan metode System Usability Scale.", 2041, "both"),
    cell("Skor SUS menunjukkan tingkat penerimaan pengguna yang terukur.", 2041, "both"),
    cell("Sejalan pada evaluasi kegunaan; penelitian ini menambahkan pengujian ISO/IEC 25010 dan SUS.", 2268, "both"),
])

def _esc(s):
    return re.escape(s)

old_kusumo = re.compile(
    r"<w:tr><w:tc>Kusumo dkk\. \(2021\)</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Rancang bangun sistem informasi penjualan berbasis web; metode waterfall\.</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Transaksi penjualan tercatat dan laporan tersaji daring\.</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Sejalan pada modul transaksi; penelitian ini menambahkan idempotensi penyelesaian\.</w:t></w:r></w:p></w:tc></w:tr>"
)

old_naris = re.compile(
    r"<w:tr><w:tc>Nariswari dkk\. \(2023\)</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Rancang bangun sistem e-tiket berbasis payment gateway\.</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Pemesanan dan pembayaran tiket terotomatisasi melalui gateway\.</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Sejalan pada integrasi gateway; penelitian ini menambahkan pencegahan aktivasi ganda\.</w:t></w:r></w:p></w:tc></w:tr>"
)

old_putri = re.compile(
    r"<w:tr><w:tc>Putri \(2022\)</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Pengujian usability aplikasi e-wallet dengan metode System Usability Scale\.</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Skor SUS menunjukkan tingkat penerimaan pengguna yang terukur\.</w:t></w:r></w:p></w:tc>"
    r"<w:tc>Sejalan pada evaluasi kegunaan; penelitian ini menambahkan pengujian ISO/IEC 25010 dan SUS\.</w:t></w:r></w:p></w:tc></w:tr>"
)

n1 = len(old_kusumo.findall(data))
print("found malformed Kusumo row :", n1)
if n1 != 1:
    print("!! unexpected match count, aborting")
    sys.exit(1)

data = old_kusumo.sub(lambda m: ROW_KUSUMO, data, count=1)
# Nariswari row is already well-formed; only rebuild if actually malformed
n2 = len(old_naris.findall(data))
print("found malformed Nariswari row:", n2)
if n2:
    data = old_naris.sub(lambda m: ROW_NARISWARI, data, count=1)

n3 = len(old_putri.findall(data))
print("found malformed Putri row   :", n3)
if n3 != 1:
    print("!! unexpected Putri match count, aborting")
    sys.exit(1)
data = old_putri.sub(lambda m: ROW_PUTRI, data, count=1)

open(OUT, "w", encoding="utf-8").write(data)

# validate
import xml.dom.minidom
try:
    xml.dom.minidom.parseString(data)
    print("OK -> wrote", OUT)
except Exception as e:
    print("XML FAIL after fix:", e)
    sys.exit(1)
