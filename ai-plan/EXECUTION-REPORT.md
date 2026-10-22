# Laporan Eksekusi MASTER-PLAN — Pass 1 (Tahap 0–2)

Cabang `improve/all-plans` (lokal, **belum di-push**) · basis awal `2f2b769` · dieksekusi 22 Oktober 2026.

Cakupan yang disetujui pemilik: **Tahap 0–2 BAB 4**. SQL live dijalankan sendiri lewat Supabase Studio (file sudah disiapkan). Klaim D-11 dihapus. M1 ditunda.

## 1. Tabel status

### Keamanan

| ID | Item | Status | Lokasi | Bukti |
|---|---|---|---|---|
| VULN-01 | Gerbang `simulate-paid` opt-in eksplisit | fixed | `server/config.js:82-85`, `server/routes/payments.routes.js:371-381` | `curl -X POST .../simulate-paid` → **404** tanpa flag; **401** dengan `ALLOW_PAYMENT_SIMULATION=1` (gerbang terbuka, sesi tetap diminta). Uji: `tests/payments.test.js` matriks §1.11 |
| VULN-05 | Secret JWT cadangan hardcoded dihapus, fail-closed | fixed | `server/auth.js:6-20` (`resolveJwtSecret`) | `npm test` → produksi tanpa `JWT_SECRET` melempar |
| VULN-06 | Transfer manual dihargai dari katalog server | fixed | `server/lib/membership.js:110-160` (`resolveManualTransferPricing`), `server/routes/transactions.routes.js:124-146` | Uji: `amount: 1` → `ok:false, conflict:true`; `admin_fee`/`total_paid` klien diabaikan |
| VULN-07 | `TRUST_PROXY` + limiter per-identifier | fixed | `server/config.js:53-63`, `server/middleware/security.js:31-77`, `server/server.js:79-80` | Kunci limiter kini `req.ip`; 3 rute auth dapat plafon per-akun |
| VULN-08 | Eksposur OTP perlu flag + loopback | fixed | `server/lib/otp.js:22-39`, 4 pemanggil di `server/routes/auth.routes.js`, `server/server.js:226-241` | Uji matriks flag/`NODE_ENV`/IP di `tests/security.test.js` |
| VULN-10 | DB key fail-closed, literal publishable key dihapus | fixed | `server/db.js:15-32` (`resolveSupabaseCredentials`) | Uji: produksi tanpa service-role → throw; tanpa kunci sama sekali → `key === ''` |
| VULN-12 | Masa berlaku Pro ditegakkan | fixed | `server/auth.js:60-105` (`hasActivePro`, `toPublicUser`), `server/routes/books.routes.js:167`, `server/lib/membership.js:92,100-127` | Uji matriks §1.11 (masa depan / lewat / tepat batas / null / flag false / tanggal cacat) di `tests/membership.test.js`; penyapu berjalan saat boot (log `[MEMBERSHIP] Penyapu kedaluwarsa langganan berjalan`) |
| VULN-02 | Policy publik `qris_transactions` | **deferred** | `supabase_database/full_setup.sql:401-403` | Alasan: SQL tidak bisa dijalankan dari repo (tanpa psql/CLI/driver). Berkas siap-tempel: `supabase_database/hardening_vuln02_vuln16.sql`. **Temuan baru:** ada policy **ketiga** (Update) yang tidak ada di §1.9 MASTER-PLAN — perlu keputusan pemilik (lihat §5) |
| VULN-16 | REVOKE TRUNCATE/REFERENCES/TRIGGER/MAINTAIN | deferred | sama | Satu sesi dengan VULN-02, sudah termasuk di berkas SQL |
| VULN-03, 04 | JWT di query string & Host header dipercaya | deferred | `server/routes/auth.routes.js:513-516, 625-633` | Tetap High dan **aktif**; keduanya satu berkas dan harus berurutan (04 sebelum 03). Bukan bagian Tahap 0–2 |
| VULN-09, 11, 13, 14, 15, 17–30 | — | deferred | lihat MASTER-PLAN §1.2 | Tahap 3–5 |

### Desain

| ID | Item | Status | Lokasi | Bukti (`check-contrast`) |
|---|---|---|---|---|
| D-01 | Teks sekunder `ink-400` gagal AA | fixed | `src/lib/styles.js:32-38`, `surfaces.dropzone:47` | 4.29:1 → **7.06:1** (terang) / 7.11:1 (malam) |
| D-02 | Item Keluar sidebar 1.89–2.72:1 | fixed | `src/components/ui/DeviceFrame.jsx:42-48, 60-79, 195`; token baru `semantic.dangerOnDark`, `semantic.mutedOnDark` | **9.70:1** terang / **10.09:1** malam; label nav non-aktif 8.48/8.82:1 |
| D-06 | Ring fokus `brand-400` 2.84:1 | fixed | `src/lib/styles.js:53-60` | `brand-600` **6.06:1**, ring 2px + offset 2px |
| D-04 | Guard warna berlubang | fixed (sisa) | `scripts/check-colors.js:21-52` | Kini juga melarang `text-white`, `ring-black`, `border-white`, hex arbitrer; whitelist per-baris. Migrasi **55 `text-white`** + `ring-black` + `border-white` di 21 berkas. Gate: 66 berkas, 0 pelanggaran |
| D-05 | `DESIGN.md` tidak resolve | fixed | `DESIGN.md` (dipindah dari `Research Design/`) | Rujukan `check-colors.js:7,13` & `tailwind.config.js:60` kini menunjuk berkas yang ada |
| D-08 | Tanpa `prefers-reduced-motion` | fixed | `src/index.css:193-217` | Scroll halus/transisi/animasi mati saat reduce; **spinner dikecualikan** agar sinyal loading tetap ada |
| D-11 | Klaim Pro tanpa implementasi | fixed | `src/features/subscription/ProScreen.jsx:67,79`, `src/data/mockData.js:89` | "Bebas iklan", "Sinkronisasi riwayat pembacaan offline", "bookmark … akses offline" dihapus dan diganti pernyataan yang benar hari ini |
| D-15 | `theme-color` tunggal | fixed | `index.html:34-48` | Ikut dipasang saat pra-cat, mengikuti `applyTheme` (`themeMode.js:44`) |
| D-03, 07, 09, 10, 12, 13, 14, 16 | tipografi mentah (285), hover malam, skeleton, kartu `<div onClick>`, grid 360px, hover no-op, drift token, font | deferred | — | Tahap 7 (Desain Tahap 2–3) & Tahap 9 |

### Fitur (BAB 3) & mobile (BAB 5)

Semua deferred — tidak termasuk pass ini. Catatan: jalur yang membuka plumbing menganggur (`planDaysFromPeriod`, `ref_code`, `reminder_sent_at`) sudah disentuh **tidak** ada; `startMembershipSweeper` adalah penjadwal pertama yang menyapu langganan (sebelumnya hanya agenda).

## 2. Berkas yang berubah

| Berkas | Tujuan |
|---|---|
| `server/auth.js` | `resolveJwtSecret` fail-closed; `hasActivePro` + `toPublicUser` jujur |
| `server/db.js` | `resolveSupabaseCredentials`, tanpa literal kunci bawaan |
| `server/config.js` | `TRUST_PROXY`, `AUTH_IDENTIFIER_RATE_LIMIT`, `isPaymentSimulationAllowed`, parser flag tunggal |
| `server/middleware/security.js` | kunci limiter `req.ip`, limiter per-identifier + `AUTH_IDENTIFIER_LIMITED_PATHS` |
| `server/server.js` | mount limiter per-identifier, log OTP selaras flag, `startMembershipSweeper` |
| `server/lib/otp.js` | `canExposeDevOtp(env, ip)` + `isLoopbackAddress` |
| `server/lib/membership.js` | `hasActivePro`, penyapu harian, `matchCatalogPlan`, `resolveManualTransferPricing` |
| `server/routes/auth.routes.js` | 4 pemanggil OTP membawa `req.ip` |
| `server/routes/books.routes.js` | gerbang konten memakai baris DB mentah + `hasActivePro` |
| `server/routes/payments.routes.js` | middleware `requirePaymentSimulation` sebelum `requireAuth` |
| `server/routes/transactions.routes.js` | harga dari katalog; field body tidak dipercaya |
| `src/lib/styles.js`, `src/components/ui/DeviceFrame.jsx`, `component.json`, `tailwind.config.js`, `src/theme/themeInjector.js`, `src/index.css`, `index.html` | token kontras baru + ring fokus + reduced motion + theme-color + garis tipis panel gelap |
| 21 berkas `src/**` | migrasi `text-white`/`ring-black`/`border-white` ke token |
| `src/features/subscription/ProScreen.jsx`, `src/data/mockData.js` | klaim D-11 dihapus |
| `src/context/slices/usePaymentSlice.js` | kirim `plan_id`, berhenti mengirim `admin_fee`/`total_paid` |
| `scripts/check-contrast.js` (baru), `scripts/check-colors.js`, `scripts/check-syntax.js`, `package.json` | gerbang kontras + perluasan guard + `npm test` |
| `tests/security.test.js`, `tests/membership.test.js`, `tests/payments.test.js` (baru) | 24 uji unit tanpa jaringan/DB |
| `supabase_database/hardening_vuln02_vuln16.sql` (baru) | SQL siap-tempel untuk VULN-02 + VULN-16 |
| `ai-plan/*` | masuk versi + koreksi §0.7 |
| `DESIGN.md` | dipindah ke akar |

## 3. Hasil verifikasi

| Gerbang §4.3 | Hasil |
|---|---|
| `npm run check` | hijau — 55 berkas sintaks, 66 berkas warna (0 pelanggaran), 17 pasangan kontras lulus, 24 uji pass, `vite build` 9s |
| `npm test` | 24 pass / 0 fail |
| Boot server nyata | `GET /api/health` → 200; `[MEMBERSHIP]` penyapu berjalan; tanpa error |
| `simulate-paid` tanpa flag | **404** (sesuai kriteria) |
| `simulate-paid` dengan flag dev | **401** (gerbang terbuka, sesi diminta) |
| `pg_policies` / `aclexplode` | **belum** — menunggu SQL dijalankan pemilik |
| Login Google, kedaluwarsa Pro manual, QR di perangkat | **belum** — VULN-03/04/21 di Tahap berikutnya; uji manual kedaluwarsa butuh akses DB |
| Matriks visual 360/414/desktop × terang/gelap | **belum diverifikasi di peramban.** Guard menghitung angka kontras dan migrasi token sudah dijaga otomatis, tetapi tidak ada satu pun tangkapan layar yang diperiksa. Perubahan tata letak: nol (hanya warna/ikon), jadi risiko utama adalah warna — dan `text-cream-50` di luar `.app-surface` sudah ditelusuri: semua rute duduk di dalam shell (`App.jsx:91,95`), kecuali `ErrorBoundary` yang pasangan `bg-brand-700`+`text-cream-50`-nya tetap terbaca karena kedua token berbalik bersama. |
| `git status` | bersih; `.env` tidak tersentuh; tidak ada rahasia di diff (dipindai sebelum commit `ai-plan/`) |

## 4. Nilai env yang harus diset manual (tidak satu baris pun `.env` disunting)

| Variabel | Dev | Produksi disarankan | Fungsi |
|---|---|---|---|
| `ALLOW_PAYMENT_SIMULATION` | `1` **hanya** saat demo sidang | **kosongkan** | menghidupkan rute simulasi bayar (VULN-01) |
| `EXPOSE_DEV_OTP` | kosong (`1` hanya untuk debug OTP lokal) | **kosongkan** | menampilkan OTP di respons dari localhost (VULN-08) |
| `TRUST_PROXY` | kosong (= perilaku lama) | `1` atau jumlah hop proxy | kunci limiter & `req.ip` (VULN-07) |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | `https://<domain-produksi>` | **diperlukan Tahap berikutnya** (VULN-04), belum dibaca kode |
| `CORS_ORIGINS` | `http://localhost:3000` | `https://<domain-produksi>` | VULN-09, belum disentuh |
| `JWT_SECRET` | sudah ada di `.env` | nilai acak berbeda dari dev | VULN-05 — kini wajib ada di produksi |
| `NODE_ENV` | `development` | `production` eksplisit | hampir semua gerbang |

**Berubah secara perilaku:** demo sidang tidak akan bisa menekan "simulasi bayar" sampai `ALLOW_PAYMENT_SIMULATION=1` diset di `.env` dev. Itu memang tujuannya, tapi perlu diketahui sebelum sidang.

## 5. Blocker, temuan baru, dan keputusan yang dibutuhkan

1. **Policy UPDATE `qris_transactions` masih tertulis di `full_setup.sql:403`** dan hanya dijatuhkan di `:509`. MASTER-PLAN §1.3/§1.9 mengira tidak ada policy Update dan hanya menyiapkan 2 `DROP`. Berkas SQL yang saya siapkan menjatuhkan ketiganya. **Tanya:** jalankan dulu bagian snapshot di Studio dan kirim keluarannya, supaya bisa dipastikan apakah DB live benar-benar tanpa policy Update (kalau ada, ini eskalasi gratis-Pro, bukan sekadar bocor baca).
2. **Tidak ada jalur SQL dari repo.** `psql` tidak ada, Supabase CLI tidak ada, `pg` tidak terpasang, `.env` tidak berisi connection string DB. Karena itu VULN-02 (High, aktif) tertahan di tangan pemilik. Opsi kalau mau otomatis nanti: `supabase login` + CLI, atau PAT Management API, atau `pg` sebagai devDependency (melanggar aturan "tanpa dependensi baru", perlu izin).
3. **`full_setup.sql` belum saya sunting** (Tahap 6). Setelah SQL dijalankan, berkas itu wajib dibersihkan dari 3 policy + blok realtime `qris_transactions` + tambah `ALTER DEFAULT PRIVILEGES`, agar setup ulang tidak mengembalikan lubang yang sama.
4. **Total transfer manual kini + Rp 3.000** (biaya layanan katalog), sebelumnya klien mengirim `admin_fee: 0` sehingga total tercatat tanpa biaya. Sudah sama dengan jalur QRIS. Kalau memang sengaja tidak memungut biaya layanan di jalur manual, bilang — itu keputusan produk, bukan bug.
5. **`toPublicUser` kini melaporkan `subscription_expires_at` apa adanya** (sebelumnya di-null-kan saat flag Pro mati) supaya klien bisa mengajak perpanjangan. Normalizer klien (`src/lib/normalizers.js:62`) masih menutup bidang itu berdasarkan `isPro`, jadi tampilan tidak berubah.
6. **Ikon `Bookmark` di dialog resume (`PdfReaderScreen.jsx:380`)** masih ornamen tanpa fitur. Bukan teks klaim, jadi tidak saya ubah; masuk daftar bareng Tahap 2 fitur.
7. **Dua kata Inggris nyasar** di pesan commit `5c44ad3` ("Sekarang needed", "amount: 1 Enough"). Kosmetik saja, commit tidak saya amend.
8. **Belum ada PoC exploit & `npm audit`** (dibatasi MASTER-PLAN §4.8), dan area dependensi belum terverifikasi ulang.

## 6. Konfirmasi

Cabang `improve/all-plans` masih lokal (7 commit di atas `2f2b769`), tidak ada `git push`, tidak ada kredensial yang dirotasi, `.env` tidak disentuh. Tahap 3–10 menunggu persetujuan untuk dilanjutkan.
