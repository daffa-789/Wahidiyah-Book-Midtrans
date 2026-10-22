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

## 4. Status eksekusi — 23 Oktober 2026

Sumber kebenaran status ada di [`EXECUTION-REPORT.md`](./EXECUTION-REPORT.md) (Pass 1 untuk Tahap 0–2, Pass 2 untuk pekerjaan 23 Oktober). Ringkasnya:

**Selesai**

| Area | Item |
|---|---|
| Keamanan | VULN-01, 02, 03, 04, 05, 06, 07, 08, 10, 12, 16 |
| Desain | D-01, 02, 04, 05, 06, 08, 11, 15 |
| Skema | `users.avatar` dan `users.dob` dibuang; `qris_transactions` legacy dibuang; `full_setup.sql` 630 → 367 baris |
| Email | template transaksional baru (logo CID, `multipart/related`) + status pengiriman jujur |
| PWA | banner pasang hanya di perangkat sentuh |

**Berikutnya**

- VULN-09 (CSP), VULN-11/13 (magic byte + MIME), VULN-20/21 — Tahap 3–5.
- D-03/07/09/10/12/13/14/16 — Tahap 7.
- Performa: chunk `excel` 939 kB dan `charts` 350 kB belum dimuat malas.
- `ALLOW_PAYMENT_SIMULATION=1` hanya saat demo sidang.
