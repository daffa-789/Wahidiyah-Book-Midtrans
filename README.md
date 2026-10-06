# Wahidiyah Book

Perpustakaan digital dengan katalog buku, membership **Pro**, dan pembayaran **QRIS memakai Midtrans Core API (Sandbox)** yang sesungguhnya.

> **Repo ini adalah versi REAL MIDTRANS.**
> Versi yang memakai API QRIS buatan sendiri (simulator) ada di repo terpisah
> `daffa-789/Skripsi-Project`, dan dipakai untuk mempelajari alur pembayaran.

---

## Fitur

- Katalog buku digital + pembaca PDF bawaan
- Autentikasi: email/password, verifikasi OTP lewat Gmail, dan login Google
- Membership Pro dengan masa aktif 30 hari
- **Pembayaran QRIS asli lewat Midtrans Core API** — kode QR dibuat oleh Midtrans, bukan dibuat sendiri
- Panel admin: kelola buku, pengguna, transaksi, event, dan carousel
- Pencarian & filter, riwayat langganan, ekspor data ke Excel

---

## Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 18 + Vite 6 + Tailwind CSS 3 |
| Backend | Express 4 (ESM) |
| Database | Supabase (PostgreSQL) |
| Pembayaran | Midtrans Core API — QRIS |
| Autentikasi | JWT + bcrypt, Google OAuth, OTP via Gmail API |

---

## Menjalankan

### 1. Prasyarat
- Node.js **>= 22**
- Akun Supabase (sudah terkonfigurasi)
- Akun Midtrans Sandbox

### 2. Pasang dependensi
```bash
npm install
```

### 3. Siapkan `.env`
Salin `.env.example` menjadi `.env`, lalu isi:

```env
PORT=5000
VITE_PORT=3000

MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_QRIS_ACQUIRER=gopay
MIDTRANS_QRIS_EXPIRY_MINUTES=15
```
Kunci sandbox diambil di **https://dashboard.sandbox.midtrans.com → Settings → Access Keys**.

> `.env` sudah masuk `.gitignore` — **jangan pernah** di-commit.

### 4. Jalankan migrasi database
Buka Supabase → **SQL Editor** → jalankan `supabase_database/migration_midtrans_qris.sql`.

> ⚠️ Jangan pakai `full_setup.sql` untuk migrasi — file itu berisi `DROP TABLE ... CASCADE`.

### 5. Nyalakan aplikasi
```bash
npm run dev
```
- Frontend: http://localhost:3000
- API: http://localhost:5000

---

## Alur pembayaran QRIS

```
Pilih paket
   → POST /api/payments/qris/charge      (server hitung harga + charge Midtrans)
   → tampilkan <img src=".../qr.png">    (proxy PNG, kunci server tidak bocor)
   → bayar lewat aplikasi apa pun / simulator sandbox
   → GET  /api/payments/qris/:id/status  (polling 3 detik, dicek ke Midtrans)
   → settlement + fraud accept           → membership Pro aktif otomatis
```

**Harga tidak pernah dikirim dari browser.** Server mengambilnya dari `SUBSCRIPTION_PLANS`
di `server/lib/constants.js` (paket bulanan Rp 25.000 + biaya admin Rp 3.000 = **Rp 28.000**).

Panduan lengkap, termasuk cara menguji di sandbox dan menguji webhook:
lihat **[`docs/MIDTRANS_QRIS.md`](docs/MIDTRANS_QRIS.md)**.

---

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Jalankan frontend + backend sekaligus |
| `npm run build` | Build produksi ke `dist/` |
| `npm start` | Build lalu jalankan server |
| `npm run server` | Jalankan backend saja |
| `npm run gmail:token` | Buat refresh token Gmail |

---

## Struktur folder

```
server/                 API Express
  lib/midtrans.js       Pembungkus Midtrans Core API
  routes/payments.*     Endpoint pembayaran QRIS
  routes/*.routes.js    Endpoint lain (auth, books, users, dll)
src/
  features/payment/     Layar & hook pembayaran QRIS
  features/*/           Fitur per halaman
  lib/                  Utilitas (api, auth, supabase, dll)
supabase_database/      Skrip SQL
docs/                   Dokumentasi
```

---

## Catatan penting

- Pembayaran memakai **Midtrans Sandbox** — tidak ada uang sungguhan yang berpindah.
- Untuk membayar di sandbox, buka **https://simulator.sandbox.midtrans.com/v2/qris/index**
  dan tempel URL gambar QR dari Midtrans.
- Validasi pembayaran **selalu di sisi server**. Browser tidak bisa menandai transaksi lunas.
- Aktivasi membership bersifat **idempoten** — webhook yang datang berulang tidak akan
  menambah masa aktif dua kali.
