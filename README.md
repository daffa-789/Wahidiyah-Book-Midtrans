# 📚 Wahidiyah Book — Digital Library & Midtrans QRIS

**Perpustakaan digital** dengan sistem **membership Pro** dan pembayaran **QRIS via Midtrans Core API (Sandbox)** — aplikasi web full-stack: **Express + React 19 + Vite 6 + TailwindCSS 4 + Supabase (PostgreSQL)** dengan arsitektur *unified single-port* (Express sekaligus melayani API dan hasil build SPA).

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19.3-61dafb?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.1-646cff?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-3fcf8e?logo=supabase&logoColor=white)
![Midtrans](https://img.shields.io/badge/Payment-Midtrans%20Core%20API%20(QRIS)-0052cc)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Fitur

- 📖 **Katalog Buku Digital Minimalis** — jelajahi koleksi buku dan manuskrip Sholawat Wahidiyah dengan antarmuka elegan ala e-reader (fokus sampul & judul) dan pencarian instan.
- 📕 **Universal Document Reader (PDF & DOCX)** — baca naskah buku langsung di peramban tanpa software eksternal: mendukung berkas **PDF** (PDF.js) dan dokumen Microsoft Word **DOCX** (dikonversi ke HTML semantik via `mammoth`), dilengkapi 3 tema baca (Terang, Sepia, Malam) dan proteksi konten (tanda air kanvas dinamis, larangan seleksi teks, pemblokiran menu klik kanan).
- 💳 **Membership Pro & QRIS Real Midtrans** — sistem keanggotaan Pro tunggal (Rp 25.000) terintegrasi gateway **Midtrans Core API Sandbox** (QRIS EMVCo dinamis, unduh QR PNG, polling status 3 detik, webhook idempoten, dan tombol simulasi bayar instan `ALLOW_PAYMENT_SIMULATION=1` untuk kemudahan demo sidang).
- 🔐 **Autentikasi Dual-Channel Lengkap** — registrasi & login dengan **JWT + bcrypt**, verifikasi **OTP** ganda via Gmail API OAuth2 & WhatsApp Multi-Provider (Fonnte, Wablas, WhaCenter, Twilio, Webhook), serta Google OAuth 2.0.
- 🛠️ **Panel Administrasi Terpadu** — kelola buku, banner carousel beranda, agenda kegiatan, data anggota, dan transaksi dengan visualisasi analitik grafik (`recharts`) formasi 3+2 yang bersih.
- 📅 **Kalender & Agenda Majelis** — jadwal kegiatan mujahadah dengan zona waktu terstandarisasi `Asia/Jakarta`.
- 🖼️ **Optimasi Gambar Otomatis** — kompresi & konversi sampul otomatis ke format WebP via `sharp`.
- 🛡️ **Arsitektur Basis Data Bersih & Aman** — skema 7 tabel inti Supabase (PostgreSQL) ber-RLS fail-closed, bebas dari kolom usang, dan lolos 30 indikator security hardening.
- 🧾 **Laporan & Ekspor Data 1-Klik** — unduh laporan transaksi, pengguna, dan katalog langsung ke berkas Microsoft Excel (`.xlsx`) via `exceljs`.

## 🏗️ Arsitektur

```
┌────────────────────────────────────────────┐
│  Express 4 (unified single port)           │
│                                            │
│  /api/*  ──►  routes/ (auth, books,        │
│               payments, subscriptions,     │
│               transactions, admin, ...)    │
│                                            │
│  /*       ──►  SPA React 19 (Vite build)   │
│                                            │
│  Mode dev: vite.middlewares (HMR)          │
└───────────────┬────────────────────────────┘
                ▼
      Supabase (PostgreSQL)   Midtrans Core API
```

## 📁 Struktur Proyek

```
Wahidiyah-Book-Midtrans/
├── server/                 # Backend Express (ESM)
│   ├── server.js           # Entry point & middleware pipeline
│   ├── config.js env.js    # Konfigurasi & validasi environment
│   ├── routes/             # REST API: admin, auth, books, carousel,
│   │                       #   events, health, notifications,
│   │                       #   payments, subscriptions, transactions, users
│   ├── lib/                # midtrans, membership, otp, webpush,
│   │                       #   images, eventReminder, validate, ...
│   ├── middleware/         # security, errors, requestLog, uploads
│   ├── mailer.js           # Gmail (google-auth-library)
│   └── whatsapp.js         # Multi-provider WhatsApp gateway
├── src/                    # Frontend React 19 + Vite
│   ├── features/           # auth, home, reader, payment, subscription,
│   │                       #   admin, calendar, profile, about, help
│   ├── components/ context/ data/ lib/ theme/
│   └── App.jsx main.jsx index.css
├── supabase_database/
│   └── full_setup.sql      # Skema database lengkap
├── docs/diagrams/          # Diagram UML (drawio), use case, activity, dll.
├── document skripsi/       # Dokumen skripsi terkait proyek
├── scripts/                # dev, start, health-check, check, dll.
└── Master_Memory_Workflow.md  # Single source of truth dokumentasi teknis
```

## 🚀 Quick Start

### Prasyarat

- **Node.js ≥ 22**
- Akun **Supabase** (PostgreSQL) dan akun **Midtrans** (Sandbox untuk QRIS)

### Setup

```bash
# 1. Buat database: jalankan supabase_database/full_setup.sql di Supabase SQL Editor

# 2. Konfigurasi environment (lihat .env / dokumentasi di Master_Memory_Workflow.md)
#    - SUPABASE_URL / SUPABASE_KEY
#    - MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY (sandbox)
#    - JWT_SECRET
#    - MAIL_* (Gmail OAuth) dan kredensial WhatsApp gateway
#    - VAPID keys (npm run vapid:keys)

# 3. Install & jalankan
npm install
npm run dev          # dev mode (Vite middleware + API dalam satu port)
```

### Build & Jalankan Produksi

```bash
npm run build        # vite build
npm start            # node scripts/start.js
npm run health       # health check
```

### Utilitas

```bash
npm run check            # cek syntax, warna, dan build
npm run audit:security   # npm audit (level high)
npm run gmail:token      # ambil token Gmail OAuth
npm run vapid:keys       # generate kunci VAPID untuk Web Push
npm run clean:ports      # bersihkan port yang dipakai
```

## 💳 Alur Pembayaran QRIS (Sandbox)

1. Pengguna memilih paket **Membership Pro**.
2. Server membuat transaksi QRIS via **Midtrans Core API** dan mengembalikan QR string.
3. Pengguna membayar dengan aplikasi e-wallet/bank apa pun yang mendukung QRIS.
4. Midtrans mengirim **webhook** → server memverifikasi signature dan mengaktifkan membership.

> Catatan: proyek ini berjalan di **Midtrans Sandbox** — tidak ada uang nyata yang berpindah.

## 📖 Dokumentasi

Dokumentasi teknis lengkap (arsitektur, spesifikasi REST API, alur Midtrans QRIS, gateway WhatsApp, skema Supabase, standar keamanan, panduan akademik/Zotero) terkonsolidasi dalam **[`Master_Memory_Workflow.md`](./Master_Memory_Workflow.md)** — *single source of truth* proyek ini. Diagram UML tersedia di [`docs/diagrams/`](./docs/diagrams).

---

Dibuat dengan ☕ oleh **daffa-789** untuk Perpustakaan Wahidiyah.
