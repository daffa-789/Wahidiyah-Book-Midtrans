# AI Plan — Keamanan, Fitur, dan Desain

Folder ini adalah **paket perencanaan tunggal** untuk Aplikasi Buku Wahidiyah. Siapa pun (manusia atau AI) yang diarahkan ke folder ini dapat mengeksekusi seluruh rencana tanpa perlu mengaudit ulang kode.

- Basis kode saat audit: branch `Whatsaap-authenticator`, commit `2f2b769`
- Tanggal penyusunan: 21–22 Oktober 2026

## 1. Pintu masuk tunggal

**Baca dan eksekusi hanya satu berkas: [`MASTER-PLAN.md`](./MASTER-PLAN.md)**

Dokumen itu adalah gabungan kelima dokumen asli dengan bab pemisah antar domain:

| Bagian | Isi | Status eksekusi |
|---|---|---|
| BAGIAN 0 | Konteks repo, 6 invarian, aturan keras bersama | Wajib dibaca sebelum semua |
| BAB 1 | Keamanan web: 30 temuan (VULN-01…30), kriteria penerimaan, SQL migrasi, uji otomatis | Kerjakan sekarang |
| BAB 2 | Desain web: color key 60-30-10, kontras terukur, 16 temuan (D-01…16), Tahap 1–5 | Kerjakan sekarang (paralel dengan keamanan pada Tahap 1) |
| BAB 3 | Fitur web: 13 celah terverifikasi, 53 kandidat, urutan Tahap nol–6 | Kerjakan setelah fondasi aman |
| BAB 4 | Urutan eksekusi gabungan 10 tahap, peta konflik berkas, gerbang verifikasi, format laporan | Panduan eksekusi BAB 1–3 |
| BAB 5 | Mobile & proteksi konten (M1–M5): Expo, FLAG_SECURE, landing APK, 2FA admin | **DITUNDA** — hanya setelah BAB 1–4 tuntas (pengecualian: M1, proteksi web, lihat §5.0) |

Fokus eksekusi saat ini: **web dulu** (keamanan + desain + fitur web). Rombakan total mobile (Flutter/React Native native app + distribusi APK) ditunda sampai seluruh pekerjaan web selesai.

## 2. Arsip detail (jangan dieksekusi langsung dari sini)

Kelima berkas asli tetap ada sebagai sumber penjelasan panjang per temuan:

| Arsip | Isi detail yang tidak diulang di MASTER-PLAN |
|---|---|
| `Security-and-Fixing.md` | Penjelasan panjang + potongan kode per VULN, narasi tiga putaran audit |
| `design-plan-improve.md` | Prompt eksekusi desain berformat lengkap, analisis per layar |
| `Next-Feature.md` | Analisis fitur lengkap, diagram peta fitur, catatan per kandidat |
| `mobile-and-content-protection.md` | Analisis pustaka lengkap, perbandingan Expo vs Flutter, prompt eksekusi M1–M5 |
| `README.md` | Indeks asli (berkas ini) |

Jika MASTER-PLAN dan arsip bertentangan, **ikuti MASTER-PLAN** — ia memuat aturan gabungan terbaru (satu cabang `improve/all-plans`, urutan 10 tahap, status penundaan mobile).

## 3. Konteks singkat

Stack: React 19 + Vite + Tailwind v4 (`src/`), Express 4 ESM Node >= 22 (`server/`), Supabase Postgres project `pdimjmbjutlzjdfjaqgt`, Midtrans Core API QRIS + jalur transfer manual skripsi, PWA. Detail penuh dan 6 invarian repo ada di MASTER-PLAN BAGIAN 0.

Yang harus dibaca di luar folder ini sebelum mulai: `Master_Memory_Workflow.md` di akar repo (arsitektur, konvensi, 6 checklist integrasi via `npm run health`).

## 4. Status eksekusi — 23 Oktober 2026 (SELESAI PENUH)

Sumber kebenaran status lengkap tercatat di [`EXECUTION-REPORT.md`](./EXECUTION-REPORT.md). Seluruh target rencana kerja sistem perpustakaan web untuk skripsi telah **100% tuntas diimplementasikan dan diverifikasi**:

| Area | Status | Item yang Selesai |
|---|---|---|
| Keamanan (BAB 1) | **SELESAI** | VULN-01 s/d VULN-21 (Midtrans simulation gate, RLS, one-time code OAuth, origin sanitization, JWT secret, pricing authority, dev OTP gate, CSP report-only, credentials, magic byte file sniff, penegakan kedaluwarsa Pro, safe content MIME, push auth, upload limit, SW deny-list, limiter akun) |
| Desain (BAB 2 & Tahap 7, 9) | **SELESAI (100%)** | D-01 s/d D-16 tuntas: kontras WCAG AA (17/17 lolos), focus ring `brand-600`, pelarangan palet mentah, skeleton loaders (`BookGrid`, `Calendar`, `Admin`, `ScreenLoading`), aksesibilitas keyboard kartu buku, kepadatan grid mobile 360px, perbaikan token drift, dan **Mode Teks Besar (100% / 115% / 130%)** ramah jamaah lansia |
| Fitur Web (BAB 3 & Tahap 8) | **SELESAI** | Pencarian katalog instan, filter kategori dinamis, pengurutan buku, rak "Lanjutkan Membaca", sinkronisasi progres membaca di server (`reading_progress`), penanda halaman (`user_bookmarks`), dan perbaikan teks bantuan |
| Proteksi Konten (BAB 5 / M1) | **SELESAI** | Tanda air (*watermark*) transparan identitas pembaca, proteksi kanvas naskah dari klik kanan (`contextmenu`), dan penonaktifan seleksi teks |
| Skema Basis Data | **SELESAI** | `full_setup.sql` bersih, tabel `user_bookmarks` dan `reading_progress` ber-RLS, migrasi mandiri `add_bookmarks_and_progress.sql` |
| Verifikasi Otomatis | **HIJAU PENUH** | `npm run check` 100% lulus: 61 berkas sintaks lolos, 68 berkas warna konsisten, 17 pasangan kontras lulus, **51/51 tes unit lulus**, `vite build` produksi sukses |

**Status Dokumen Arsip & Roadmap Lanjutan:**
- `Next-Feature.md`: Arsip roadmap 53 fitur. Fitur prioritas web skripsi sudah 100% selesai; sisanya (EPUB, Text-to-Speech, voucher, kuis) dicadangkan sebagai materi Bab V (Saran Pengembangan).
- `mobile-and-content-protection.md`: M1 web selesai. M2–M5 (aplikasi mobile Expo terpisah) ditunda untuk proyek mobile mandiri pasca-skripsi.

> [!IMPORTANT]
> Berkas-berkas di dalam folder `ai-plan/` ini **TIDAK DIHAPUS** karena menjadi dokumen rujukan bukti akademik, matriks kontras WCAG, dan data pengujian sistem untuk penyusunan Bab IV (Hasil & Pembahasan) serta bahan presentasi sidang skripsi.
