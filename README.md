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

- 📖 **Katalog Buku** — jelajahi koleksi buku digital Wahidiyah dengan carousel dan pencarian.
- 📕 **Reader PDF** — baca buku langsung di browser.
- 💳 **Membership Pro & Pembayaran QRIS** — upgrade membership lewat QRIS menggunakan **Midtrans Core API (Sandbox)**; status transaksi terpantau melalui webhook.
- 🔐 **Autentikasi Lengkap** — registrasi/login dengan **JWT + bcrypt**, verifikasi **OTP** (email Gmail via Google Auth Library), dan dukungan **WhatsApp gateway multi-provider** untuk notifikasi/authenticator.
- 🛠️ **Panel Admin** — kelola buku, carousel, event, pengguna, dan transaksi (`/admin`).
- 📅 **Kalender & Event** — agenda kegiatan dengan **pengingat otomatis** (scheduler) dan **Web Push notification** (VAPID).
- 🖼️ **Upload Gambar** — unggah & optimasi aset memakai `multer` + `sharp`.
- 🛡️ **Keamanan** — `helmet`, security headers, CORS policy, rate limiting pada endpoint auth, validasi **Zod**, dan 20+ indikator security hardening.
- 🧾 **Laporan/Data** — ekspor data dengan **ExcelJS**.

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
