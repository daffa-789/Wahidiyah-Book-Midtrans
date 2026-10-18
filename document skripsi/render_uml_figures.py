# -*- coding: utf-8 -*-
"""
Renderer PNG Gambar UML Skripsi Wahidiyah Book (DPI 200)
Menghasilkan:
1. fig_use_case.png
2. fig_activity_qris.png
3. fig_sequence_qris.png
di folder _fig/ untuk siap disisipkan ke berkas skripsi Microsoft Word (.docx).
"""

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FIG_DIR = os.path.join(os.path.dirname(HERE), "docs", "diagrams")
os.makedirs(FIG_DIR, exist_ok=True)

DPI = 200
PPCM = DPI / 2.54

ARIAL = "C:/Windows/Fonts/arial.ttf"
ARIALB = "C:/Windows/Fonts/arialbd.ttf"

# Palet Warna Standar Akademik
INK = (30, 41, 59)
LINE_DARK = (71, 85, 105)

BLUE_BG = (224, 242, 254)      # #e0f2fe
BLUE_LINE = (2, 132, 199)      # #0284c7

GREEN_BG = (220, 252, 231)     # #dcfce7
GREEN_LINE = (22, 163, 74)     # #16a34a

AMBER_BG = (254, 243, 199)     # #fef3c7
AMBER_LINE = (217, 119, 6)     # #d97706

ORANGE_BG = (255, 237, 213)    # #ffedd5
ORANGE_LINE = (234, 88, 12)    # #ea580c

ROSE_BG = (254, 226, 226)      # #fee2e2
ROSE_LINE = (220, 38, 38)      # #dc2626

GRAY_BG = (241, 245, 249)      # #f1f5f9
GRAY_LINE = (100, 116, 139)    # #64748b


def _f(pt, bold=False):
    font_path = ARIALB if bold else ARIAL
    return ImageFont.truetype(font_path, int(round(pt / 72 * DPI)))


def canvas(w_cm, h_cm):
    img = Image.new("RGB", (int(round(w_cm * PPCM)), int(round(h_cm * PPCM))), "white")
    return img, ImageDraw.Draw(img)


def save(img, filename):
    out = os.path.join(FIG_DIR, filename)
    img.save(out, "PNG", dpi=(DPI, DPI))
    print(f"  [RENDER PNG] {filename} ({os.path.getsize(out):,} bytes)")
    return out


# ==============================================================================
# 1. FIG USE CASE PNG
# ==============================================================================
def render_use_case_png():
    img, d = canvas(16.5, 11.5)
    f_title = _f(10, bold=True)
    f_body = _f(8.5, bold=False)
    f_bold = _f(8.5, bold=True)
    f_sub = _f(7.5, bold=False)

    # Boundary Box
    d.rectangle([3.5 * PPCM, 0.4 * PPCM, 12.8 * PPCM, 11.0 * PPCM],
                outline=GRAY_LINE, fill=(248, 250, 252), width=int(0.04 * PPCM))
    d.text((4.0 * PPCM, 0.6 * PPCM),
           "SISTEM PERPUSTAKAAN DIGITAL & REAL MIDTRANS QRIS (WAHIDIYAH BOOK)",
           font=f_title, fill=INK)

    # Actor Helper
    def draw_actor(cx, cy, label, sub=""):
        # Head
        r = 0.35 * PPCM
        d.ellipse([cx * PPCM - r, cy * PPCM - r, cx * PPCM + r, cy * PPCM + r], outline=INK, width=2)
        # Body
        d.line([(cx * PPCM, cy * PPCM + r), (cx * PPCM, (cy + 0.8) * PPCM)], fill=INK, width=2)
        # Arms
        d.line([((cx - 0.45) * PPCM, (cy + 0.35) * PPCM), ((cx + 0.45) * PPCM, (cy + 0.35) * PPCM)], fill=INK, width=2)
        # Legs
        d.line([(cx * PPCM, (cy + 0.8) * PPCM), ((cx - 0.35) * PPCM, (cy + 1.4) * PPCM)], fill=INK, width=2)
        d.line([(cx * PPCM, (cy + 0.8) * PPCM), ((cx + 0.35) * PPCM, (cy + 1.4) * PPCM)], fill=INK, width=2)
        # Label
        tw = d.textbbox((0, 0), label, font=f_bold)[2]
        d.text(((cx * PPCM - tw / 2), (cy + 1.5) * PPCM), label, font=f_bold, fill=INK)
        if sub:
            stw = d.textbbox((0, 0), sub, font=f_sub)[2]
            d.text(((cx * PPCM - stw / 2), (cy + 1.85) * PPCM), sub, font=f_sub, fill=LINE_DARK)

    # Use Case Ellipse Helper
    def draw_uc(cx, cy, text, w=3.4, h=0.9, fill=BLUE_BG, line=BLUE_LINE):
        hw, hh = w / 2 * PPCM, h / 2 * PPCM
        x0, y0 = cx * PPCM - hw, cy * PPCM - hh
        x1, y1 = cx * PPCM + hw, cy * PPCM + hh
        d.ellipse([x0, y0, x1, y1], fill=fill, outline=line, width=max(1, int(0.03 * PPCM)))
        lines = text.split("\n")
        lh = 9.0 / 72 * DPI * 1.2
        ty = cy * PPCM - (len(lines) * lh) / 2
        for ln in lines:
            tw = d.textbbox((0, 0), ln, font=f_body)[2]
            d.text((cx * PPCM - tw / 2, ty), ln, font=f_body, fill=INK)
            ty += lh

    # Draw Actors
    draw_actor(1.7, 1.8, "Tamu", "(Publik)")
    draw_actor(1.7, 5.2, "Pengguna", "(Member)")
    draw_actor(1.7, 8.8, "Pengelola", "(Admin)")

    # Secondary Actors (Right)
    # Box Midtrans
    d.rounded_rectangle([13.1 * PPCM, 5.0 * PPCM, 16.1 * PPCM, 6.2 * PPCM], radius=int(0.15 * PPCM),
                        fill=ORANGE_BG, outline=ORANGE_LINE, width=2)
    d.text((13.3 * PPCM, 5.2 * PPCM), "Midtrans Core API\n(Payment Gateway)", font=f_bold, fill=(154, 52, 18))

    # Box OTP
    d.rounded_rectangle([13.1 * PPCM, 2.3 * PPCM, 16.1 * PPCM, 3.5 * PPCM], radius=int(0.15 * PPCM),
                        fill=GREEN_BG, outline=GREEN_LINE, width=2)
    d.text((13.3 * PPCM, 2.5 * PPCM), "Gateway OTP & Surel\n(WA & Gmail API)", font=f_bold, fill=(20, 83, 45))

    # Box DB
    d.rounded_rectangle([13.1 * PPCM, 7.8 * PPCM, 16.1 * PPCM, 9.0 * PPCM], radius=int(0.15 * PPCM),
                        fill=GRAY_BG, outline=GRAY_LINE, width=2)
    d.text((13.3 * PPCM, 8.0 * PPCM), "Supabase PostgreSQL\n(RLS Database)", font=f_bold, fill=INK)

    # Use Cases
    # Tamu
    draw_uc(5.8, 1.6, "UC01: Melihat Katalog &\nFilter Kategori", fill=BLUE_BG, line=BLUE_LINE)
    draw_uc(5.8, 2.7, "UC02: Membaca Buku\nPublik (Terbuka)", fill=BLUE_BG, line=BLUE_LINE)
    draw_uc(5.8, 3.8, "UC03: Pendaftaran Akun\n(Dual-Channel OTP)", fill=BLUE_BG, line=BLUE_LINE)
    draw_uc(10.2, 3.8, "UC04: Verifikasi OTP\n(10 Menit Lockout)", fill=ROSE_BG, line=ROSE_LINE)

    # Member
    draw_uc(5.8, 5.0, "UC05: Masuk / Login\n(Email & Google OAuth)", fill=BLUE_BG, line=BLUE_LINE)
    draw_uc(5.8, 6.1, "UC06: Membaca Buku Pro\n(Protected Reader)", fill=BLUE_BG, line=BLUE_LINE)
    draw_uc(10.2, 6.1, "UC07: Last-Read Tracker\n(Ingat Halaman)", fill=AMBER_BG, line=AMBER_LINE)
    draw_uc(5.8, 7.2, "UC08: Pemesanan Paket\nLangganan Pro", fill=BLUE_BG, line=BLUE_LINE)
    draw_uc(10.2, 7.2, "UC09: Bayar Real QRIS &\nCAS Idempoten", fill=ORANGE_BG, line=ORANGE_LINE)
    draw_uc(5.8, 8.3, "UC10: Unduh Faktur /\nKwitansi PDF", fill=BLUE_BG, line=BLUE_LINE)

    # Admin
    draw_uc(5.8, 9.4, "UC11: Kelola Buku &\nKompresi WebP", fill=AMBER_BG, line=AMBER_LINE)
    draw_uc(5.8, 10.3, "UC12: Kelola Agenda &\nBanner Karousel", fill=AMBER_BG, line=AMBER_LINE)
    draw_uc(10.2, 9.4, "UC14: Ekspor Laporan\nExcel (.xlsx 1-Klik)", fill=GREEN_BG, line=GREEN_LINE)
    draw_uc(10.2, 10.3, "UC15: Visual Analytics\nTren Pendapatan", fill=GREEN_BG, line=GREEN_LINE)

    # Lines: Tamu -> UC
    d.line([(2.5 * PPCM, 2.2 * PPCM), (4.1 * PPCM, 1.6 * PPCM)], fill=LINE_DARK, width=2)
    d.line([(2.5 * PPCM, 2.2 * PPCM), (4.1 * PPCM, 2.7 * PPCM)], fill=LINE_DARK, width=2)
    d.line([(2.5 * PPCM, 2.2 * PPCM), (4.1 * PPCM, 3.8 * PPCM)], fill=LINE_DARK, width=2)

    # Lines: Member -> UC
    d.line([(2.5 * PPCM, 5.6 * PPCM), (4.1 * PPCM, 5.0 * PPCM)], fill=BLUE_LINE, width=2)
    d.line([(2.5 * PPCM, 5.6 * PPCM), (4.1 * PPCM, 6.1 * PPCM)], fill=BLUE_LINE, width=2)
    d.line([(2.5 * PPCM, 5.6 * PPCM), (4.1 * PPCM, 7.2 * PPCM)], fill=BLUE_LINE, width=2)
    d.line([(2.5 * PPCM, 5.6 * PPCM), (4.1 * PPCM, 8.3 * PPCM)], fill=BLUE_LINE, width=2)

    # Generalization: Member -> Tamu
    d.line([(1.7 * PPCM, 4.9 * PPCM), (1.7 * PPCM, 3.8 * PPCM)], fill=LINE_DARK, width=2)
    d.polygon([(1.7 * PPCM, 3.5 * PPCM), (1.55 * PPCM, 3.8 * PPCM), (1.85 * PPCM, 3.8 * PPCM)],
              fill="white", outline=LINE_DARK)

    # Lines: Admin -> UC
    d.line([(2.5 * PPCM, 9.2 * PPCM), (4.1 * PPCM, 9.4 * PPCM)], fill=AMBER_LINE, width=2)
    d.line([(2.5 * PPCM, 9.2 * PPCM), (4.1 * PPCM, 10.3 * PPCM)], fill=AMBER_LINE, width=2)
    d.line([(2.5 * PPCM, 9.2 * PPCM), (8.5 * PPCM, 9.4 * PPCM)], fill=AMBER_LINE, width=2)
    d.line([(2.5 * PPCM, 9.2 * PPCM), (8.5 * PPCM, 10.3 * PPCM)], fill=AMBER_LINE, width=2)

    # Include / Extend lines
    d.line([(7.5 * PPCM, 3.8 * PPCM), (8.5 * PPCM, 3.8 * PPCM)], fill=ROSE_LINE, width=2)
    d.text((7.6 * PPCM, 3.5 * PPCM), "«include»", font=f_sub, fill=ROSE_LINE)

    d.line([(7.5 * PPCM, 7.2 * PPCM), (8.5 * PPCM, 7.2 * PPCM)], fill=ORANGE_LINE, width=2)
    d.text((7.6 * PPCM, 6.9 * PPCM), "«include»", font=f_sub, fill=ORANGE_LINE)

    d.line([(8.5 * PPCM, 6.1 * PPCM), (7.5 * PPCM, 6.1 * PPCM)], fill=AMBER_LINE, width=2)
    d.text((7.6 * PPCM, 5.8 * PPCM), "«extend»", font=f_sub, fill=AMBER_LINE)

    # System lines
    d.line([(11.9 * PPCM, 3.8 * PPCM), (13.1 * PPCM, 2.9 * PPCM)], fill=GREEN_LINE, width=2)
    d.line([(11.9 * PPCM, 7.2 * PPCM), (13.1 * PPCM, 5.6 * PPCM)], fill=ORANGE_LINE, width=2)
    d.line([(11.9 * PPCM, 9.4 * PPCM), (13.1 * PPCM, 8.4 * PPCM)], fill=GRAY_LINE, width=2)

    return save(img, "fig_use_case.png")


# ==============================================================================
# 2. FIG ACTIVITY DIAGRAM PNG
# ==============================================================================
def render_activity_png():
    img, d = canvas(16.5, 12.0)
    f_title = _f(10, bold=True)
    f_lane = _f(9, bold=True)
    f_box = _f(8, bold=False)
    f_dec = _f(7.5, bold=True)

    # Swimlanes
    lanes = [
        ("PENGGUNA (PWA)", 0.5, 4.2, BLUE_BG, BLUE_LINE),
        ("BACKEND API (EXPRESS)", 4.2, 4.2, GREEN_BG, GREEN_LINE),
        ("MIDTRANS CORE API", 8.4, 4.0, ORANGE_BG, ORANGE_LINE),
        ("SUPABASE DATABASE", 12.4, 3.6, GRAY_BG, GRAY_LINE),
    ]

    for name, x, w, fill, line in lanes:
        d.rectangle([x * PPCM, 0.4 * PPCM, (x + w) * PPCM, 11.5 * PPCM],
                    fill=fill, outline=line, width=1)
        d.rectangle([x * PPCM, 0.4 * PPCM, (x + w) * PPCM, 1.0 * PPCM],
                    fill="white", outline=line, width=1)
        tw = d.textbbox((0, 0), name, font=f_lane)[2]
        d.text(((x + w / 2) * PPCM - tw / 2, 0.6 * PPCM), name, font=f_lane, fill=INK)

    # Helper Box
    def act_box(x, y, w, h, text, fill="white", outline=INK):
        d.rounded_rectangle([x * PPCM, y * PPCM, (x + w) * PPCM, (y + h) * PPCM],
                            radius=int(0.12 * PPCM), fill=fill, outline=outline, width=max(1, int(0.025 * PPCM)))
        lines = text.split("\n")
        lh = 8.5 / 72 * DPI * 1.25
        ty = (y + h / 2) * PPCM - (len(lines) * lh) / 2
        for ln in lines:
            tw = d.textbbox((0, 0), ln, font=f_box)[2]
            d.text(((x + w / 2) * PPCM - tw / 2, ty), ln, font=f_box, fill=INK)
            ty += lh

    # Start
    d.ellipse([2.45 * PPCM, 1.2 * PPCM, 2.75 * PPCM, 1.5 * PPCM], fill=INK, outline=INK)
    d.line([(2.6 * PPCM, 1.5 * PPCM), (2.6 * PPCM, 1.8 * PPCM)], fill=INK, width=2)

    # Step 1: Pilih Paket
    act_box(1.0, 1.8, 3.2, 0.8, "Pilih Paket Langganan Pro\n& Klik 'Bayar QRIS'")
    d.line([(4.2 * PPCM, 2.2 * PPCM), (4.7 * PPCM, 2.2 * PPCM)], fill=BLUE_LINE, width=2)

    # Step 2: Validasi Server
    act_box(4.7, 1.8, 3.2, 0.8, "Validasi JWT & Zod,\nGenerate Order ID Unik")
    d.line([(7.9 * PPCM, 2.2 * PPCM), (8.8 * PPCM, 2.2 * PPCM)], fill=GREEN_LINE, width=2)

    # Step 3: Midtrans Charge
    act_box(8.8, 1.8, 3.2, 0.8, "Generate QRIS EMVCo\n& Transaksi Pending")
    d.line([(10.4 * PPCM, 2.6 * PPCM), (10.4 * PPCM, 3.1 * PPCM)], fill=ORANGE_LINE, width=2)
    d.line([(10.4 * PPCM, 3.1 * PPCM), (6.3 * PPCM, 3.1 * PPCM)], fill=ORANGE_LINE, width=2)

    # Step 4: Simpan Pending Server
    act_box(4.7, 3.3, 3.2, 0.8, "Simpan Transaksi Awal\n(Status: 'pending')")
    d.line([(7.9 * PPCM, 3.7 * PPCM), (12.7 * PPCM, 3.7 * PPCM)], fill=GREEN_LINE, width=2)

    # Step 5: Supabase Insert
    act_box(12.7, 3.3, 3.0, 0.8, "INSERT INTO transactions\n(status: 'pending')")
    d.line([(12.7 * PPCM, 3.7 * PPCM), (6.3 * PPCM, 4.5 * PPCM)], fill=LINE_DARK, width=2)

    # Step 6: Kirim QRIS ke Klien
    act_box(4.7, 4.5, 3.2, 0.8, "Kirim Payload QRIS &\nTimer 15 Menit ke Klien")
    d.line([(4.7 * PPCM, 4.9 * PPCM), (4.2 * PPCM, 4.9 * PPCM)], fill=BLUE_LINE, width=2)

    # Step 7: Tampil QRIS Klien
    act_box(1.0, 4.5, 3.2, 0.8, "Tampilkan QR Code Interaktif\n& Timer Hitung Mundur")

    # Step 8: Transfer & Webhook
    d.line([(2.6 * PPCM, 5.3 * PPCM), (2.6 * PPCM, 5.8 * PPCM)], fill=BLUE_LINE, width=2)
    act_box(1.0, 5.8, 3.2, 0.8, "Scan QRIS & Transfer Dana\nvia Aplikasi E-Wallet")
    d.line([(4.2 * PPCM, 6.2 * PPCM), (8.8 * PPCM, 6.2 * PPCM)], fill=ORANGE_LINE, width=2)

    act_box(8.8, 5.8, 3.2, 0.8, "Midtrans Verifikasi Sukses\n& Kirim Webhook Notifikasi")
    d.line([(8.8 * PPCM, 6.2 * PPCM), (7.9 * PPCM, 7.0 * PPCM)], fill=ORANGE_LINE, width=2)

    # Step 9: Decision SHA-512
    act_box(4.7, 7.0, 3.2, 0.8, "Verifikasi Signature SHA-512\n& Nominal Sesuai?")
    d.line([(6.3 * PPCM, 7.8 * PPCM), (6.3 * PPCM, 8.2 * PPCM)], fill=GREEN_LINE, width=2)
    d.text((6.4 * PPCM, 7.9 * PPCM), "YA", font=f_dec, fill=GREEN_LINE)

    # Step 10: Compare-and-Swap
    act_box(4.7, 8.2, 3.2, 0.8, "CAS Atomik: UPDATE transactions\nSET status='success' WHERE pending", fill=GREEN_BG, outline=GREEN_LINE)
    d.line([(7.9 * PPCM, 8.6 * PPCM), (12.7 * PPCM, 8.6 * PPCM)], fill=GREEN_LINE, width=2)

    act_box(12.7, 8.2, 3.0, 0.8, "Eksekusi Update Database\nKembalikan Rows Affected")
    d.line([(14.2 * PPCM, 9.0 * PPCM), (14.2 * PPCM, 9.5 * PPCM)], fill=LINE_DARK, width=2)

    # Step 11: Aktivasi Langganan
    act_box(12.7, 9.5, 3.0, 0.8, "activatePaidMembership()\nINSERT INTO subscriptions", fill=GREEN_BG, outline=GREEN_LINE)
    d.line([(12.7 * PPCM, 9.9 * PPCM), (4.2 * PPCM, 10.2 * PPCM)], fill=GREEN_LINE, width=2)

    # Step 12: Notif Sukses Klien
    act_box(1.0, 9.8, 3.2, 0.8, "Terima Status Pro Sukses\n& Buka Akses Kitab Pro", fill=GREEN_BG, outline=GREEN_LINE)
    d.line([(2.6 * PPCM, 10.6 * PPCM), (2.6 * PPCM, 11.0 * PPCM)], fill=INK, width=2)

    # End
    d.ellipse([2.45 * PPCM, 11.0 * PPCM, 2.75 * PPCM, 11.3 * PPCM], fill=INK, outline=INK)
    d.ellipse([2.40 * PPCM, 10.95 * PPCM, 2.80 * PPCM, 11.35 * PPCM], outline=INK, width=1)

    return save(img, "fig_activity_qris.png")


# ==============================================================================
# 3. FIG SEQUENCE DIAGRAM PNG
# ==============================================================================
def render_sequence_png():
    img, d = canvas(16.5, 12.0)
    f_title = _f(10, bold=True)
    f_box = _f(8.5, bold=True)
    f_msg = _f(7.5, bold=False)

    parts = [
        ("Pengguna", 1.8),
        ("Klien React", 5.0),
        ("Express API", 8.4),
        ("Midtrans API", 11.8),
        ("Supabase DB", 14.8)
    ]

    # Draw Lifelines
    for name, x in parts:
        d.rounded_rectangle([(x - 1.2) * PPCM, 0.5 * PPCM, (x + 1.2) * PPCM, 1.2 * PPCM],
                            radius=int(0.1 * PPCM), fill=BLUE_BG, outline=BLUE_LINE, width=2)
        tw = d.textbbox((0, 0), name, font=f_box)[2]
        d.text((x * PPCM - tw / 2, 0.75 * PPCM), name, font=f_box, fill=INK)
        # Vertical dashed line
        yy = 1.3 * PPCM
        while yy < 11.2 * PPCM:
            d.line([(x * PPCM, yy), (x * PPCM, min(yy + 0.25 * PPCM, 11.2 * PPCM))], fill=LINE_DARK, width=1)
            yy += 0.45 * PPCM

    # Arrows Helper
    def msg(x1, x2, y, label, ret=False, note=""):
        px1, px2 = x1 * PPCM, x2 * PPCM
        py = y * PPCM
        if ret:
            # Dashed return line
            xx = min(px1, px2)
            maxx = max(px1, px2)
            while xx < maxx:
                d.line([(xx, py), (min(xx + 0.2 * PPCM, maxx), py)], fill=GRAY_LINE, width=2)
                xx += 0.35 * PPCM
            # Open arrow
            s = 0.15 * PPCM
            if px2 < px1:
                d.line([(px2, py), (px2 + s, py - s * 0.7)], fill=GRAY_LINE, width=2)
                d.line([(px2, py), (px2 + s, py + s * 0.7)], fill=GRAY_LINE, width=2)
            else:
                d.line([(px2, py), (px2 - s, py - s * 0.7)], fill=GRAY_LINE, width=2)
                d.line([(px2, py), (px2 - s, py + s * 0.7)], fill=GRAY_LINE, width=2)
        else:
            # Solid line
            d.line([(px1, py), (px2, py)], fill=INK, width=2)
            s = 0.18 * PPCM
            if px2 > px1:
                d.polygon([(px2, py), (px2 - s, py - s * 0.55), (px2 - s, py + s * 0.55)], fill=INK)
            else:
                d.polygon([(px2, py), (px2 + s, py - s * 0.55), (px2 + s, py + s * 0.55)], fill=INK)

        # Text label
        tx = (px1 + px2) / 2
        tw = d.textbbox((0, 0), label, font=f_msg)[2]
        d.text((tx - tw / 2, py - 0.28 * PPCM), label, font=f_msg, fill=INK)

    # Sequence Messages
    msg(1.8, 5.0, 1.8, "1. Klik Beli Langganan Pro")
    msg(5.0, 8.4, 2.5, "2. POST /api/payments/qris/charge (JWT)")
    msg(8.4, 11.8, 3.2, "3. POST /v2/charge (Midtrans QRIS)")
    msg(11.8, 8.4, 3.9, "4. 200 OK (qr_string, timer 15m)", ret=True)
    msg(8.4, 14.8, 4.6, "5. INSERT transactions (status: 'pending')")
    msg(14.8, 8.4, 5.2, "6. Pending tersimpan", ret=True)
    msg(8.4, 5.0, 5.8, "7. 201 Created { qr_string, order_id }", ret=True)
    msg(5.0, 1.8, 6.4, "8. Render QR Code & Timer Hitung Mundur", ret=True)

    # Payment & Webhook
    msg(1.8, 11.8, 7.2, "9. Scan QR & Bayar via E-Wallet")
    msg(11.8, 8.4, 8.0, "10. POST /midtrans/notification (Jalur A Webhook)")
    msg(8.4, 14.8, 8.8, "11. CAS: UPDATE status='success' WHERE pending")
    msg(14.8, 8.4, 9.4, "12. Rows Affected = 1 (Klaim Berhasil)", ret=True)
    msg(8.4, 14.8, 10.0, "13. activatePaidMembership() -> INSERT subscriptions")
    msg(5.0, 8.4, 10.4, "14. Polling GET /qris/:id/status (Jalur B)")
    msg(8.4, 5.0, 10.8, "15. 200 OK (status: success, is_pro: true)", ret=True)
    msg(5.0, 1.8, 11.2, "16. Tampilkan Sukses & Akses Kitab Pro Terbuka", ret=True)

    return save(img, "fig_sequence_qris.png")


if __name__ == "__main__":
    print("Membuat berkas gambar PNG untuk proposal/skripsi...")
    render_use_case_png()
    render_activity_png()
    render_sequence_png()
    print("Selesai render PNG.")
