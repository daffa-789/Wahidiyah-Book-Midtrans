# -*- coding: utf-8 -*-
"""
Pembuat gambar (diagram) untuk proposal skripsi rancang bangun.
Menghasilkan berkas PNG di folder _fig/ yang disisipkan ke dokumen .docx.
"""

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FIG_DIR = os.path.join(os.path.dirname(HERE), "docs", "diagrams")
os.makedirs(FIG_DIR, exist_ok=True)

DPI = 200
PPCM = DPI / 2.54          # piksel per cm  (~78.74)
ARIAL = "C:/Windows/Fonts/arial.ttf"
ARIALB = "C:/Windows/Fonts/arialbd.ttf"

INK = (33, 37, 41)
BLUE = (31, 73, 125)
BLUE_FILL = (222, 234, 246)
GREEN_FILL = (226, 239, 218)
GREEN_LINE = (56, 118, 29)
AMBER_FILL = (255, 242, 204)
AMBER_LINE = (191, 143, 0)
GRAY_FILL = (240, 240, 240)
GRAY_LINE = (120, 120, 120)
ROSE_FILL = (251, 228, 225)
ROSE_LINE = (176, 58, 46)


def _f(pt, bold=False):
    return ImageFont.truetype(ARIALB if bold else ARIAL, int(round(pt / 72 * DPI)))


def _wrap(d, text, font, maxpx):
    out = []
    for para in str(text).split("\n"):
        words = para.split()
        if not words:
            out.append("")
            continue
        line = words[0]
        for w in words[1:]:
            trial = line + " " + w
            if d.textbbox((0, 0), trial, font=font)[2] <= maxpx:
                line = trial
            else:
                out.append(line)
                line = w
        out.append(line)
    return out


def box(d, x, y, w, h, text, fill=BLUE_FILL, line=BLUE, fs=10,
        bold=False, tcolor=INK, radius=0.18):
    x0, y0 = x * PPCM, y * PPCM
    x1, y1 = (x + w) * PPCM, (y + h) * PPCM
    d.rounded_rectangle([x0, y0, x1, y1], radius=int(radius * PPCM),
                        fill=fill, outline=line, width=max(1, int(0.035 * PPCM)))
    if not text:
        return
    f = _f(fs, bold)
    lines = _wrap(d, text, f, (x1 - x0) - 0.5 * PPCM)
    lh = fs / 72 * DPI * 1.28
    ty = y0 + ((y1 - y0) - len(lines) * lh) / 2
    for ln in lines:
        tw = d.textbbox((0, 0), ln, font=f)[2]
        d.text((x0 + ((x1 - x0) - tw) / 2, ty), ln, font=f, fill=tcolor)
        ty += lh


def diamond(d, cx, cy, w, h, text, fill=AMBER_FILL, line=AMBER_LINE, fs=9):
    hw, hh = w / 2 * PPCM, h / 2 * PPCM
    px, py = cx * PPCM, cy * PPCM
    d.polygon([(px, py - hh), (px + hw, py), (px, py + hh), (px - hw, py)],
              fill=fill, outline=line, width=max(1, int(0.035 * PPCM)))
    f = _f(fs)
    lines = _wrap(d, text, f, hw * 1.45)
    lh = fs / 72 * DPI * 1.25
    ty = py - len(lines) * lh / 2
    for ln in lines:
        tw = d.textbbox((0, 0), ln, font=f)[2]
        d.text((px - tw / 2, ty), ln, font=f, fill=INK)
        ty += lh


def arrow_v(d, x, y1, y2, label=None, color=INK, w=2, fs=8, dashed=False):
    px = x * PPCM
    a, b = y1 * PPCM, y2 * PPCM
    if dashed:
        step = 0.22 * PPCM
        yy = a
        while yy < b:
            d.line([(px, yy), (px, min(yy + step * 0.55, b))], fill=color, width=int(w))
            yy += step
    else:
        d.line([(px, a), (px, b)], fill=color, width=int(w))
    s = 0.20 * PPCM
    d.polygon([(px, b), (px - s * 0.55, b - s), (px + s * 0.55, b - s)], fill=color)
    if label:
        f = _f(fs)
        bb = d.textbbox((0, 0), label, font=f)
        d.text((px + 0.18 * PPCM, (a + b) / 2 - (bb[3] - bb[1]) / 2), label,
               font=f, fill=color)


def arrow_h(d, y, x1, x2, label=None, color=INK, w=2, fs=8, above=True, dashed=False):
    py = y * PPCM
    a, b = x1 * PPCM, x2 * PPCM
    if dashed:
        step = 0.22 * PPCM
        xx = a
        while xx < b:
            d.line([(xx, py), (min(xx + step * 0.55, b), py)], fill=color, width=int(w))
            xx += step
    else:
        d.line([(a, py), (b, py)], fill=color, width=int(w))
    s = 0.20 * PPCM
    d.polygon([(b, py), (b - s, py - s * 0.55), (b - s, py + s * 0.55)], fill=color)
    if label:
        f = _f(fs)
        bb = d.textbbox((0, 0), label, font=f)
        tx = (a + b) / 2 - bb[2] / 2
        ty = py - (bb[3] - bb[1]) - 0.12 * PPCM if above else py + 0.12 * PPCM
        d.text((tx, ty), label, font=f, fill=color)


def canvas(w_cm, h_cm):
    img = Image.new("RGB", (int(w_cm * PPCM), int(h_cm * PPCM)), "white")
    return img, ImageDraw.Draw(img)


def save(img, name):
    p = os.path.join(FIG_DIR, name)
    img.save(p, "PNG", dpi=(DPI, DPI))
    print(f"  [fig] {name} ({os.path.getsize(p):,} bytes)")
    return p


# =====================================================================
# GAMBAR 2.1 — Arsitektur sistem tiga lapis
# =====================================================================
def fig_arsitektur():
    img, d = canvas(15.0, 9.6)

    box(d, 1.2, 0.4, 12.6, 1.5,
        "LAPIS PRESENTASI  —  Klien web (PWA)\n"
        "React 18 + Vite 6 (SPA) · Tailwind CSS · Service Worker · BroadcastChannel",
        fill=BLUE_FILL, line=BLUE, fs=9.5)

    arrow_v(d, 7.5, 1.9, 2.5, "HTTP / JSON  (REST API)", fs=8)

    box(d, 1.2, 2.5, 12.6, 2.3,
        "LAPIS LOGIKA APLIKASI  —  Node.js + Express 4 (ESM)\n"
        "helmet · express-rate-limit · zod · JWT · bcryptjs (12 rounds) · multer · sharp",
        fill=GREEN_FILL, line=GREEN_LINE, fs=9.5)

    arrow_v(d, 2.65, 4.8, 6.2, fs=8)
    arrow_v(d, 7.5, 4.8, 6.2, "charge QRIS / status()", fs=7.5)
    arrow_v(d, 12.35, 4.8, 6.2, fs=8)
    arrow_v(d, 9.0, 6.2, 4.8, "webhook", fs=7.5, dashed=True, color=(90, 90, 90))

    box(d, 0.3, 6.2, 4.7, 2.6,
        "BASIS DATA\nSupabase (PostgreSQL)\nRLS · trigger fn_handle_qris_payment()\ntransactions · subscriptions · books",
        fill=GRAY_FILL, line=GRAY_LINE, fs=8.5)
    box(d, 5.15, 6.2, 4.7, 2.6,
        "PEMBAYARAN\nMidtrans Core API\nQRIS (charge) · status()\nnotification (SHA-512)",
        fill=AMBER_FILL, line=AMBER_LINE, fs=8.5)
    box(d, 10.0, 6.2, 4.7, 2.6,
        "SUREL\nGmail API (OAuth 2.0)\nMIME RFC 2822 → base64url\n(buildMimeMessage)",
        fill=ROSE_FILL, line=ROSE_LINE, fs=8.5)

    return save(img, "fig_arsitektur.png")


# =====================================================================
# GAMBAR 2.2 — Alur penyelesaian transaksi QRIS yang idempoten
# =====================================================================
def fig_idempoten():
    img, d = canvas(14.0, 13.0)

    box(d, 1.0, 0.3, 12.0, 1.15,
        "Notifikasi diterima (POST /midtrans/notification)  atau  hasil polling GET /qris/:id/status",
        fs=9)
    arrow_v(d, 7.0, 1.45, 1.95, fs=8)

    diamond(d, 7.0, 2.85, 10.0, 1.8, "signature SHA-512 valid\ndan nominal cocok?", fs=8.5)
    d.text((7.0 * PPCM + 5.4 * PPCM, 2.85 * PPCM - 0.55 * PPCM), "TIDAK", font=_f(8, True), fill=ROSE_LINE)
    arrow_h(d, 2.85, 12.2, 13.6, fs=8)
    box(d, 10.6, 2.28, 3.2, 1.15, "Tolak — HTTP 401\n(fail closed)", fill=ROSE_FILL,
        line=ROSE_LINE, fs=8)

    arrow_v(d, 7.0, 3.75, 4.3, "YA", fs=8)

    box(d, 1.0, 4.3, 12.0, 1.55,
        "UPDATE transactions SET status='success'\nWHERE id = ? AND status = 'pending'   ← compare-and-swap",
        fill=GREEN_FILL, line=GREEN_LINE, fs=9, bold=False)

    arrow_v(d, 7.0, 5.85, 6.35, fs=8)

    diamond(d, 7.0, 7.25, 10.0, 1.8, "baris terpengaruh = 1?", fs=9)
    d.text((7.0 * PPCM + 5.4 * PPCM, 7.25 * PPCM - 0.55 * PPCM), "0", font=_f(8, True), fill=GRAY_LINE)
    arrow_h(d, 7.25, 12.2, 13.6, fs=8)
    box(d, 10.6, 6.68, 3.2, 1.15, "Sudah diproses\n→ hentikan (idempoten)", fill=GRAY_FILL,
        line=GRAY_LINE, fs=8)

    arrow_v(d, 7.0, 8.15, 8.65, "1", fs=8)

    box(d, 1.0, 8.65, 12.0, 1.15,
        "Aktivasi langganan: activatePaidMembership()  →  tabel subscriptions",
        fill=BLUE_FILL, line=BLUE, fs=9)
    arrow_v(d, 7.0, 9.8, 10.3, fs=8)

    diamond(d, 7.0, 11.2, 10.0, 1.8, "aktivasi berhasil?", fs=9)
    d.text((7.0 * PPCM + 5.4 * PPCM, 11.2 * PPCM - 0.55 * PPCM), "GAGAL", font=_f(8, True), fill=ROSE_LINE)
    arrow_h(d, 11.2, 12.2, 13.6, fs=8)
    box(d, 10.6, 10.63, 3.2, 1.15, "Kompensasi:\nstatus ← 'pending'", fill=ROSE_FILL,
        line=ROSE_LINE, fs=8)

    return save(img, "fig_idempoten.png")


# =====================================================================
# GAMBAR 2.3 — Registrasi dua fase berbasis OTP
# =====================================================================
def fig_registrasi():
    img, d = canvas(14.0, 12.4)

    box(d, 0.5, 0.3, 13.0, 1.3, "FASE 1 — Permintaan pendaftaran (belum ada baris di tabel users)",
        fill=AMBER_FILL, line=AMBER_LINE, fs=9.5, bold=True)
    box(d, 0.5, 1.9, 13.0, 1.5,
        "Validasi zod → bcryptjs(12) → simpan { name, passwordHash, dob }\n"
        "pada kolom payload (JSONB) tabel email_verifications, TTL 10 menit",
        fs=9)
    arrow_v(d, 7.0, 3.4, 3.9, fs=8)
    box(d, 0.5, 3.9, 13.0, 1.3, "Kirim kode OTP 6 digit melalui Gmail API (MIME RFC 2822)",
        fill=ROSE_FILL, line=ROSE_LINE, fs=9)

    arrow_v(d, 7.0, 5.2, 6.2, "kode diverifikasi (maks. 5 percobaan, lockout)", fs=8)

    box(d, 0.5, 6.2, 13.0, 1.3, "FASE 2 — Pembuatan akun (baris users dibuat HANYA setelah OTP terbukti)",
        fill=GREEN_FILL, line=GREEN_LINE, fs=9.5, bold=True)
    arrow_v(d, 7.0, 7.5, 8.0, fs=8)
    box(d, 0.5, 8.0, 13.0, 1.5,
        "INSERT INTO users (id, name, email, password, role='user', is_pro=false)\n"
        "penanganan pelanggaran unik (kode 23505) → respons 409 ramah",
        fs=9)
    arrow_v(d, 7.0, 9.5, 10.0, fs=8)
    box(d, 0.5, 10.0, 13.0, 1.5,
        "Keluaran: token sesi JWT + profil publik (toPublicUser)\n"
        "Tiket OTP dihapus; tidak ada akun yatim (unverified) di basis data",
        fill=BLUE_FILL, line=BLUE, fs=9)

    return save(img, "fig_registrasi.png")


# =====================================================================
# GAMBAR 2.4 — Kerangka konseptual
# =====================================================================
def fig_konseptual():
    img, d = canvas(15.5, 8.6)

    box(d, 0.3, 0.5, 4.3, 7.2,
        "MASUKAN\n\n"
        "• Pengguna (tamu/member/admin)\n"
        "• Katalog buku (judul, sinopsis,\n  berkas PDF, sampul)\n"
        "• Paket langganan Pro\n"
        "• Notifikasi & status Midtrans\n"
        "• Agenda/karousel (admin)",
        fill=BLUE_FILL, line=BLUE, fs=8.5, bold=False)

    arrow_h(d, 4.35, 4.6, 5.5, fs=8)
    arrow_h(d, 4.35, 11.2, 10.9, fs=8)

    box(d, 5.5, 0.5, 4.5, 7.2,
        "PROSES — Wahidiyah Book\n\n"
        "1. Autentikasi dua fase (OTP /\n   Google OAuth)\n"
        "2. Katalog & ruang baca digital\n   (gate langganan)\n"
        "3. Transaksi QRIS + penyelesaian\n   idempoten (CAS & kompensasi)\n"
        "4. PWA dengan cache bypass\n   selektif\n"
        "5. Dashboard admin (6 tab)",
        fill=GREEN_FILL, line=GREEN_LINE, fs=8.5)

    box(d, 10.9, 0.5, 4.3, 7.2,
        "LUARAN\n\n"
        "• Akun terverifikasi\n"
        "• Langganan aktif TANPA\n  aktivasi ganda\n"
        "• Konten berbayar terlindungi\n"
        "• Log & laporan admin\n"
        "• Skor ISO/IEC 25010 dan\n  SUS",
        fill=AMBER_FILL, line=AMBER_LINE, fs=8.5)

    return save(img, "fig_konseptual.png")


# =====================================================================
# GAMBAR 3.1 — Tahapan prosedur pengembangan (model prototyping)
# =====================================================================
def fig_prosedur():
    img, d = canvas(15.5, 8.2)

    box(d, 0.4, 0.6, 4.5, 1.7, "1. Analisis kebutuhan\n(observasi, wawancara,\nstudi pustaka)", fs=9)
    box(d, 5.5, 0.6, 4.5, 1.7, "2. Perancangan\n(use case, ERD, arsitektur,\nkontrak API, antarmuka)", fs=9)
    box(d, 10.6, 0.6, 4.5, 1.7, "3. Implementasi\n(React + Express +\nSupabase + Midtrans)", fs=9)

    box(d, 10.6, 5.0, 4.5, 1.7, "4. Pengujian internal\n(black box, ISO/IEC 25010,\nuji idempotensi)", fs=9)
    box(d, 5.5, 5.0, 4.5, 1.7, "5. Uji coba pengguna\n(skenario tugas + SUS\n± 30 responden)", fs=9)
    box(d, 0.4, 5.0, 4.5, 1.7, "6. Evaluasi & rilis iteratif\n(perbaikan → rilis baru)", fs=9)

    arrow_h(d, 1.45, 4.9, 5.5, fs=8)
    arrow_h(d, 1.45, 10.0, 10.6, fs=8)
    arrow_v(d, 12.85, 2.3, 5.0, fs=8)
    arrow_h(d, 5.85, 10.6, 5.5, fs=8)
    arrow_h(d, 5.85, 5.5, 0.4, fs=8)
    arrow_v(d, 2.65, 5.0, 2.3, fs=8)

    d.text((3.6 * PPCM, 3.85 * PPCM), " siklus iteratif — diulang sampai spesifikasi terpenuhi ",
           font=_f(8.5, True), fill=GREEN_LINE)

    return save(img, "fig_prosedur.png")


# =====================================================================
# GAMBAR 2.5 — Dua jalur penyelesaian transaksi
# =====================================================================
def fig_dualpath():
    img, d = canvas(15.0, 7.4)

    box(d, 0.3, 0.3, 4.0, 1.2, "Aplikasi pembayar\n(e-wallet / m-Banking)", fs=9)

    box(d, 5.6, 0.3, 4.0, 1.2, "Midtrans Core API\n(charge QRIS)", fill=AMBER_FILL,
        line=AMBER_LINE, fs=9)

    box(d, 10.7, 3.0, 4.0, 1.5, "settleTransaction()\nTERLINDUNGI CAS", fill=GREEN_FILL,
        line=GREEN_LINE, fs=9, bold=True)

    box(d, 5.6, 3.0, 4.0, 1.5,
        "GET /api/payments/qris/:id/status\n(server otoritatif)", fill=BLUE_FILL, line=BLUE, fs=8.5)

    box(d, 10.7, 5.8, 4.0, 1.4,
        "Langganan aktif —\nkeduanya aman karena idempoten",
        fill=GRAY_FILL, line=GRAY_LINE, fs=8.5)

    arrow_h(d, 0.9, 4.3, 5.6, "bayar QRIS", fs=8)
    arrow_h(d, 0.9, 9.6, 12.7, fs=8)
    arrow_v(d, 12.7, 0.9, 3.0, "Jalur A: webhook", fs=8)
    arrow_v(d, 7.6, 1.5, 3.0, "status()", fs=8)
    arrow_h(d, 3.75, 9.6, 10.7, "Jalur B", fs=8)
    arrow_v(d, 12.7, 4.5, 5.8, fs=8)

    d.text((0.35 * PPCM, 7.0 * PPCM),
           "Jalur A aktif bila server memiliki URL publik; Jalur B menjembatani pengembangan lokal (localhost).",
           font=_f(8), fill=GRAY_LINE)

    return save(img, "fig_dualpath.png")


if __name__ == "__main__":
    print("Membuat gambar ...")
    fig_arsitektur()
    fig_idempoten()
    fig_registrasi()
    fig_konseptual()
    fig_prosedur()
    fig_dualpath()
    print("Selesai ->", FIG_DIR)
