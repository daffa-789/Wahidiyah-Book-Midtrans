# 📁 Setup Database Supabase

Semua berkas SQL untuk database Supabase ada di folder ini. Tinggal **copy-paste manual**
ke Supabase Dashboard → SQL Editor → **+ New Query** → paste → **Run** (`Ctrl+Enter`).

| Item | Nilai |
|---|---|
| Project | **Skripsi_Project** |
| Project ref | `pdimjmbjutlzjdfjaqgt` |
| URL | `https://pdimjmbjutlzjdfjaqgt.supabase.co` |
| Region | Singapore |

> ⚠️ Project lama (`cfpmkwjkqfktagdkmlai`) **sudah dihapus** dari Supabase — URL-nya kini
> "Non-existent domain". Seluruh konfigurasi aplikasi sudah dipindah ke project baru di atas.

---

## 🚀 Cara pakai

**File:** [`full_setup.sql`](./full_setup.sql)

1. Buka Supabase Dashboard → project **Skripsi_Project**
2. Sidebar kiri → **SQL Editor** → **+ New Query**
3. Copy SELURUH isi `full_setup.sql` (Ctrl+A, Ctrl+C)
4. Paste ke editor → klik **RUN** (Ctrl+Enter)
5. Tunggu pesan: `Success. No rows returned`

✅ **Database dibuat KOSONG** — tidak ada data demo/seed sama sekali, siap diisi lewat aplikasi.

### Pilihan A: Setup Bersih Total (Reset Schema)
Gunakan SELURUH isi `full_setup.sql` jika ingin me-reset total skema dari awal (akan men-`DROP ... CASCADE` seluruh tabel). Skema di `full_setup.sql` sudah 100% aman dan menghasilkan **0 warning** di Supabase Linter.

---

### Pilihan B: Database Sudah Ada Data & Ingin Hilangkan 24 Warning (Tanpa Hapus Data)
Jika database Anda sudah berisi data pengguna/buku dan Anda ingin **menghilangkan seluruh 24 Security Warning di Supabase Linter tanpa kehilangan data**:

1. Buka `full_setup.sql` bagian **9. PATCH PERBAIKAN LINTER & KEAMANAN UNTUK DATABASE AKTIF** (di bagian bawah).
2. Salin baris-baris perintah SQL di dalam blok bagian 9 tersebut (atau hapus tanda `--`).
3. Paste ke Supabase SQL Editor → klik **RUN** (`Ctrl+Enter`).
4. Buka menu **Database** > **Linter** / **Security Advisor** > klik tombol refresh. Seluruh 24 warning akan hilang (**0 warnings**)!

---

### Pilihan C: Tambah Tabel Baru Saja (Tanpa Menyentuh Data Lain)

**File:** [`carousel_slides.sql`](./carousel_slides.sql)

Gunakan ini kalau database Anda **sudah berisi data** dan Anda hanya perlu
menambahkan tabel `carousel_slides` (fitur Hero Banner Carousel) **tanpa
menimpa/menghapus data apa pun**.

`full_setup.sql` dimulai dengan `DROP ... CASCADE` — menjalankannya pada database
yang sudah berisi data akan **menghapus semua data**. Karena itu tabel carousel
dipisah ke file sendiri yang **idempoten & non-destruktif**:

1. Buka Supabase Dashboard → **SQL Editor** → **+ New Query**
2. Copy SELURUH isi `carousel_slides.sql`
3. Paste → **RUN** (`Ctrl+Enter`)
4. Aman dijalankan berkali-kali — hanya `CREATE TABLE IF NOT EXISTS` +
   `CREATE INDEX IF NOT EXISTS` + policy yang dijaga blok `DO $$`.

File ini **hanya** membuat tabel `carousel_slides`, 2 index, mengaktifkan RLS,
menambah policy baca publik untuk slide aktif, dan menambahkan satu kolom
`events.show_in_carousel` (dijaga `IF NOT EXISTS`). Tidak ada `DROP` sama sekali.

---

## 📋 Isi database setelah setup

| Tabel | Fungsi |
|---|---|
| `users` | Akun pengguna (email/Google, `is_pro`, masa aktif) |
| `books` | Katalog buku & naskah (kategori = kolom teks `category`) |
| `events` | Jadwal acara & mujahadah |
| `subscriptions` | Riwayat paket langganan |
| `transactions` | Transaksi pembayaran resmi |
| `email_verifications` | Kode OTP 6 digit untuk pendaftaran & lupa password (berlaku 10 menit) |
| `password_resets` | **Peninggalan lama — kode tidak memakainya lagi.** Aman di-drop kapan pun |
| `qris_transactions` | Hub simulasi scan QR |
| `carousel_slides` | Slide Hero Banner Carousel di homepage (urutan, gambar, periode tampil, aktif/nonaktif) — lihat `carousel_slides.sql` |

> Tabel `ads` **sudah dibuang** — fitur iklan dihapus dari kode (R41). Enum
> `ad_placement` dan `ad_audience` ikut hilang, sehingga jumlah ENUM tinggal **6**.

Plus: 1 trigger (`fn_handle_qris_payment`), 3 RPC (`pay_qris_simulation`,
`create_qris_simulation`, `cancel_qris_simulation`), realtime pada `qris_transactions`,
`users`, `subscriptions`, dan `transactions`.

> Tabel `categories` **sudah dihapus**. Kategori kini atribut teks bebas `books.category`.

---

## 🕐 Zona waktu

Seluruh kolom waktu memakai `TIMESTAMPTZ` dengan `NOW()` polos, dan timezone database
di-set ke **`Asia/Jakarta` (WIB, UTC+7)**.

Postgres menyimpan waktu dalam UTC secara internal lalu menampilkannya sesuai timezone
sesi — jadi jam aplikasi **selalu mengikuti waktu Indonesia**, tidak terpengaruh lokasi
server (Singapore/India).

---

## ✅ Verifikasi setelah menjalankan SQL

```sql
-- 1. Harus mengembalikan 9 tabel — TANPA `ads`, DENGAN `email_verifications` & `carousel_slides`
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name;

-- 2. Harus 0 baris — tabel iklan benar-benar sudah tidak ada
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'ads';

-- 3. Harus rls_aktif = true — kode OTP tidak boleh terbaca dari peramban
SELECT relrowsecurity AS rls_aktif FROM pg_class WHERE relname = 'email_verifications';

-- 4. Timezone (harus: Asia/Jakarta)
SHOW timezone;

-- 5. Harus 0 baris semua — bukti tidak ada seed
SELECT
  (SELECT COUNT(*) FROM public.users) AS users,
  (SELECT COUNT(*) FROM public.books) AS books,
  (SELECT COUNT(*) FROM public.events) AS events;
```

---

## 📄 Catatan

Ada **dua** file SQL di folder ini, dengan peran yang berbeda:

| File | Sifat | Kapan dipakai |
|---|---|---|
| `full_setup.sql` | **Destruktif** (`DROP ... CASCADE` di awal) | Setup bersih total / reset skema dari nol |
| `carousel_slides.sql` | **Idempoten, non-destruktif** (hanya `IF NOT EXISTS`) | Menambah tabel carousel pada database aktif |

Jangan buat salinan di folder lain — dulu pernah ada duplikat (`setup/`) dan
keduanya jadi tidak sinkron. Edit file aslinya langsung. Jika menambah tabel baru
untuk database yang **sudah berisi data**, buat file SQL terpisah yang idempoten
seperti `carousel_slides.sql`, jangan jalankan ulang `full_setup.sql`.
