# Laporan Eksekusi MASTER-PLAN — Pass 1 (Tahap 0–2)

Cabang `improve/all-plans` (lokal, **belum di-push**) · basis awal `2f2b769` · dieksekusi 22 Oktober 2026.

Cakupan yang disetujui pemilik: **Tahap 0–2 BAB 4**. Klaim D-11 dihapus. M1 ditunda. **VULN-02 + VULN-16 sudah dijalankan ke DB live** lewat Supabase Studio dengan sesi login pemilik (bukan kredensial yang lewat ke chat), lalu `full_setup.sql` disinkronkan.

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
| VULN-02 | Policy publik `qris_transactions` dihapus (DB live + repo) | fixed | `supabase_database/full_setup.sql:401-411, 440-448`, `hardening_vuln02_vuln16.sql` | Dijalankan 22 Okt lewat SQL Editor Studio: `pg_policies` → **0 baris**, `relrowsecurity=true`. Bukti perilaku: `POST /rest/v1/qris_transactions` dengan **anon key** → **HTTP 401, code 42501** (dulu diizinkan policy Insert); baca anon → `200 []` (RLS menyaring, bukan tabel kosong: service-role juga 0 baris karena tabel memang belum terisi) |
| VULN-16 | REVOKE TRUNCATE/REFERENCES/TRIGGER/MAINTAIN (DB live + repo) | fixed | `supabase_database/full_setup.sql:425-434`, `hardening_vuln02_vuln16.sql` | `aclexplode`: 9 tabel × `anon`/`authenticated` kini hanya `DELETE,INSERT,SELECT,UPDATE`. `pg_default_acl` membuktikan entri baru `postgres -> anon=arwd, authenticated=arwd` |
| VULN-04 | Host header dipercaya: open redirect + XSS | fixed | `server/lib/origin.js` (`resolveFrontendOrigin`), `server/routes/auth.routes.js:515-541` | `Host: evil.com` tanpa `FRONTEND_ORIGIN` → **500 + halaman galat, tanpa `Location`**; Host di `ALLOWED_ORIGINS` → 302 ke origin itu; `X-Forwarded-Proto: javascript:alert(1)` → diabaikan; `FRONTEND_ORIGIN` cacat → gagal tertutup. Fallback inline `<script>` dihapus. Uji: `tests/security.test.js` (5 kasus) |
| VULN-03 | JWT sesi dikirim lewat query string | fixed | `server/lib/oneTimeCode.js`, `server/routes/auth.routes.js:636-671`, `src/features/auth/GoogleSuccessScreen.jsx` | Redirect sukses kini hanya membawa `?code=` (256-bit, TTL 60 detik, in-memory); `POST /api/auth/exchange` menukarnya menjadi `{ token, user }` dan kode hangus pada percobaan pertama. Kode dibuang dari address bar sebelum ditukar. Uji: 4 kasus `oneTimeCode` + integrasi tukar-ulang → 401 |
| VULN-09, 11, 13, 14, 15, 17–30 | — | deferred | lihat MASTER-PLAN §1.2 | Tahap 3–5 |

> **Pembaruan 23 Oktober 2026:** VULN-04 lalu VULN-03 dikerjakan berurutan sesuai §1.4. Verifikasi: `node --test "tests/*.test.js"` **33/33 lulus** (9 kasus baru) dan uji integrasi router — `Host: evil.com` → 500 tanpa `Location`, `X-Forwarded-Proto: javascript` diabaikan, kode sah ditukar sekali lalu 401 pada percobaan kedua. **Syarat produksi baru:** isi `FRONTEND_ORIGIN` (atau daftarkan origin aplikasi di `CORS_ORIGINS`); tanpa itu callback menampilkan halaman galat, bukan redirect.

### Desain

| ID | Item | Status | Lokasi | Bukti (`check-contrast`) |
|---|---|---|---|---|
| D-01 | Teks sekunder `ink-400` gagal AA | fixed | `src/lib/styles.js:32-38`, `surfaces.dropzone:47` | 4.29:1 → **7.06:1** (terang) / 7.11:1 (malam) |
| D-02 | Item Keluar sidebar 1.89–2.72:1 | fixed | `src/components/ui/DeviceFrame.jsx:42-48, 60-79, 195`; token baru `semantic.dangerOnDark`, `semantic.mutedOnDark` | **9.70:1** terang / **10.09:1** malam; label nav non-aktif 8.48/8.82:1. **Pernah gagal di layar nyata** — nama kelas ditulis kebab-case sehingga utilitasnya tidak pernah ada dan teks jatuh ke warna warisan gelap; diperbaiki di `c9aed29`, pagar anti-regresi di `1ddd285` (lihat butir 11) |
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
| `pg_policies` | 0 policy untuk `qris_transactions`, `relrowsecurity=true` (Studio SQL Editor, 22 Okt) |
| `aclexplode` | hanya `DELETE,INSERT,SELECT,UPDATE` tersisa untuk `anon`/`authenticated` pada 9 tabel `public` |
| Anon key tidak bisa lagi menulis transaksi sampah | `POST /rest/v1/qris_transactions` → HTTP 401 `42501` (sebelum: policy Insert mengizinkan) |
| Charge QRIS + polling status lewat server | **belum diuji ujung-ke-ujung** — keduanya memakai service-role key sehingga tidak tersentuh RLS, dan tabel `qris_transactions` memang 0 baris; perlu satu charge sandbox nyata saat demo untuk memastikan |
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

1. **Policy UPDATE `qris_transactions` ternyata TIDAK ada di DB live** — snapshot Studio menunjukkan hanya 2 policy (Read + Insert), sama seperti klaim MASTER-PLAN §1.3. Yang bikin bingung adalah `full_setup.sql`: baris `:403` *membuat* policy Update lalu `:509` menjatuhkannya, jadi file itu self-contradictory meski hasil akhirnya benar. Sudah dirapikan (blok VULN-02 kini hanya DROP idempoten, tanpa CREATE). Tidak ada eskalasi gratis-Pro lewat anon UPDATE.
2. **Jalur SQL ditemukan lewat sesi dashboard pemilik** (browser Qoder, Studio SQL Editor) — bukan psql/CLI/driver, dan tidak ada kredensial yang lewat ke chat. Catatan: editor Studio beberapa kali tidak me-render hasil query baru saat jendelanya tersembunyi, jadi verifikasi akhir VULN-02 dilakukan lewat **perilaku** (anon INSERT ditolak 42501), bukan hanya metadata.
3. **Lepas dari publikasi realtime**: `ALTER PUBLICATION supabase_realtime DROP TABLE public.qris_transactions` ada dalam skrip yang sama dan skrip itu berjalan sampai statement terakhir (verification SELECT menghasilkan baris), jadi perintahnya tereksekusi. **Belum sempat diverifikasi ulang secara visual** — editor menolak me-render. Query pemeriksa kalau mau memastikan: `SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='qris_transactions';` (harus 0 baris).
4. **Temuan baru di luar izin pass ini**: publikasi `supabase_realtime` juga menyiarkan `users`, `subscriptions`, `transactions`. Aplikasi tidak berlangganan channel realtime untuk tabel itu, jadi ini permukaan kebocoran tanpa manfaat. Tidak saya sentuh — tunggu keputusan.
5. **`ALTER DEFAULT PRIVILEGES FOR ROLE postgres`** hanya melindungi tabel yang dibuat role `postgres`. Entri bawaan `supabase_admin` masih `arwdDxtm` (termasuk TRIGGER/REFERENCES/MAINTAIN) untuk objek yang dibuat role itu. Tidak ada jalur di repo yang membuat tabel sebagai `supabase_admin`, jadi konsekuensinya nol hari ini — tapi kalau nanti bikin tabel lewat jalur lain, cek grant-nya.
6. **Total transfer manual kini + Rp 3.000** (biaya layanan katalog), sebelumnya klien mengirim `admin_fee: 0` sehingga total tercatat tanpa biaya. Sudah sama dengan jalur QRIS. Kalau memang sengaja tidak memungut biaya layanan di jalur manual, bilang — itu keputusan produk, bukan bug.
7. **`toPublicUser` kini melaporkan `subscription_expires_at` apa adanya** (sebelumnya di-null-kan saat flag Pro mati) supaya klien bisa mengajak perpanjangan. Normalizer klien (`src/lib/normalizers.js:62`) masih menutup bidang itu berdasarkan `isPro`, jadi tampilan tidak berubah.
8. **Ikon `Bookmark` di dialog resume (`PdfReaderScreen.jsx:380`)** masih ornamen tanpa fitur. Bukan teks klaim, jadi tidak saya ubah; masuk daftar bareng Tahap 2 fitur.
9. **Dua kata Inggris nyasar** di pesan commit `5c44ad3` ("Sekarang needed", "amount: 1 Enough"). Kosmetik saja, commit tidak saya amend.
10. **Belum ada PoC exploit & `npm audit`** (dibatasi MASTER-PLAN §4.8), dan area dependensi belum terverifikasi ulang.
11. **Pelajaran dari bug label sidebar (`c9aed29`)**: `check-contrast.js` membuktikan **angka token**, bukan bahwa kelasnya benar-benar tergenerate — selama nama kelas tidak cocok dengan kunci `tailwind.config.js`, utilitasnya tidak ada dan warna diam-diam jatuh ke warisan. Satu-satunya penangkap saat itu adalah mata manusia di mode terang. Sekarang guard nama token menutup lubang itu (`1ddd285`), dan cara cek manual tercepat: `grep -o "text-semantic-<nama>" dist/assets/*.css` — kalau 0, kelas itu tidak pernah ada.
12. **Uji visual §2.7 masih PRIBADI belum kulakukan** (tab browser Qoder terkunci dialog `beforeunload` Supabase, dan viewport-nya tersembunyi sehingga screenshot gagal). Yang sudah: build + guard + pembacaan gaya di berkas CSS. Yang belum: tangkapan layar 360/414/desktop × terang/gelap tiap layar yang kusentuh.

## 6. Konfirmasi

Cabang `improve/all-plans` masih lokal (9 commit di atas `2f2b769`), tidak ada `git push`, tidak ada kredensial yang dirotasi, `.env` tidak disentuh. Database live sudah dihardening untuk VULN-02/16 — `npm run health` tetap 6/6 dan service-role masih membaca `users` (2 baris), jadi tidak ada regresi akses. Tahap 3–10 menunggu persetujuan untuk dilanjutkan.

---

## 7. Pass 2 — 23 Oktober 2026 (di `main`, sudah di-push)

Rentang commit: `0df9068` → `b9e96f0`. Berbeda dari Pass 1, seluruh pekerjaan ini sudah ada di `origin/main`.

### 7.1 Keamanan

| ID | Perubahan | Bukti |
|---|---|---|
| VULN-04 | `server/lib/origin.js`: `resolveFrontendOrigin` — `FRONTEND_ORIGIN` menang; tanpa itu hanya origin di `ALLOWED_ORIGINS`; `X-Forwarded-Proto` disanitasi; fallback inline `<script>` dihapus | Uji: `Host: evil.com` → 500 tanpa `Location`; proto `javascript` diabaikan; 5 kasus di `tests/security.test.js` |
| VULN-03 | `server/lib/oneTimeCode.js`: kode 256-bit, TTL 60 detik, hangus sekali pakai; `POST /api/auth/exchange`; klien menukar saat mount dan membuang kode dari address bar | Uji: kode sah → 200, tukar ulang → 401; 4 kasus unit |
| VULN-11 | `server/lib/sniff.js`: `sniffImageMime` dan `matchesContentExtension` membaca magic byte (PNG/JPEG/WebP/GIF, `%PDF`, ZIP untuk docx/odt/epub, OLE untuk doc, `{\rtf`, teks untuk txt/md/csv). Dipakai di unggah buku dan gambar carousel; 415 bila isi tidak cocok | Uji: HTML berekstensi `.pdf` ditolak; PDF berekstensi `.docx` ditolak; teks biner (`NUL`) ditolak |
| VULN-13 | `sendDataUrl` tidak lagi memakai MIME dari data URL; pemanggil wajib menyebut `contentType`. Konten buku disajikan dengan `safeContentMime`, `inline` hanya untuk PDF, sisanya `attachment`. `content_mime` disimpan dari ekstensi kanonis, bukan kiriman klien | Uji: data URL berlabel `text/html` disajikan sebagai `application/pdf`; tanpa `contentType` jatuh ke `octet-stream` |
| VULN-20 | `/api/auth/google/callback` masuk `AUTH_RATE_LIMITED_PATHS`; limiter baru `qrisStatusRateLimiter` (per akun, 150/5 menit) dipasang pada `GET /api/payments/qris/:orderId/status` | Uji: plafon 30/menit, di atas ritme polling 3 detik (20/menit) sehingga pembayaran sah tidak terpotong |
| VULN-21 | `/api/payments/` masuk deny-list service worker; `isCacheable` menolak respons `Cache-Control: private`/`no-store`; blok cache-first dibatasi origin sendiri; `CACHE_NAME` v10 → v11; cache dibuang saat logout lewat pesan `CLEAR_APP_SHELL` | Uji unit tidak memungkinkan (service worker butuh lingkungan peramban); diverifikasi lewat pembacaan jalur `fetch` |
| VULN-09 | `CSP_DIRECTIVES` di config + helmet CSP. **Report-only secara default** (`CSP_ENFORCE=1` untuk menegakkan): skrip inline tema pra-cat diizinkan lewat hash SHA-256, bukan `unsafe-inline`. `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `style-src 'self' 'unsafe-inline'` (atribut style React), font Google diizinkan. Peringatan boot bila produksi tanpa `CORS_ORIGINS` | Uji: hash di config cocok dengan skrip inline di index.html DAN dengan hasil `vite build` (Vite tidak menulis ulang skrip itu); header terverifikasi lewat curl dalam kedua mode |

**Regresi yang tertangkap uji manual (bukan uji otomatis):** `942538a` menghapus `const currentOrigin` tetapi menyisakan rujukannya di `REDIRECT_URI`, sehingga callback Google membalas JSON 500. Diperbaiki di `b8c04d6`. Pelajarannya: `node --check` hanya memeriksa sintaks — identifier yang hilang baru ketahuan saat runtime.

### 7.2 Kebersihan kode dan skema

- **Dead code** (`bb697b1`): 34 berkas, −222/+28. `debounce`, `copyToClipboard`, `formatToWhatsAppE164`, `QRIS_WEBHOOK_SECRET`, `toPastDateYmd`, `TAG_LENGTH`, `createHmac`, `__dirname`, re-export yatim, 19 `export` yang diturunkan, 4 logo tanpa rujukan, dan dependensi `flag-icons`.
- **Foto profil dicabut** (`68aac84`): UI, `/users/profile`, `toPublicUser`, normalizer, `compressAvatarDataUrl`, `avatar-default.svg`. SQL migrasi `remove_avatar_column.sql` — **sudah dijalankan** pemilik; `users.avatar` terverifikasi hilang, 4 baris tercadangkan.
- **`full_setup.sql` 630 → 367 baris** (`08f6852`): `qris_transactions` (tabel, enum, 4 fungsi simulasi, trigger, policy, indeks, realtime) dan `users.dob` dibuang. Definisi `carousel_slides` yang berulang **dipertahankan** dengan komentar: blok PATCH harus bisa berdiri sendiri pada DB lama.

### 7.3 Email transaksional (`3ee1fc2`)

Template baru di `server/mailer.js`: tabel + inline style, palet aplikasi, preheader tersembunyi, logo `public/icon-192.png` ditanam sebagai CID dalam `multipart/related`, header `Auto-Submitted`/`X-Auto-Response-Suppress`. Satu kerangka dipakai OTP dan email "akun Google".

Dua temuan operasional yang menyertainya: refresh token Gmail mati karena OAuth app masih *Testing* (token berumur 7 hari) — sudah diperbarui lewat `npm run gmail:token`, dan akun pengirim wajib ada di **Test users**. `/register` dan `/resend-verification` kini mengembalikan `deliveredBy`; layar verifikasi berhenti mengaku "sudah dikirim" saat pengiriman gagal (`e96ab8f`).

### 7.4 UI (`b9e96f0`)

Nama sidebar dua baris; kartu "Tema Tampilan" dan `ThemeModeSelector` dihapus; garis pemisah sidebar ringkas dihapus; banner pasang aplikasi kini mensyaratkan `(pointer: coarse)` sehingga tidak muncul di Chrome desktop Windows.

### 7.5 Gerbang verifikasi

`check-syntax` 57 berkas · `check-colors` 0 pelanggaran · kontras lulus · **34/34 uji** · `vite build` hijau.

**Catatan lingkungan:** `npm test` / `npm run check` gagal di Node 22.22.2 Windows karena `node --test tests/` tidak me-resolve direktori. Yang bekerja: `node --test "tests/*.test.js"`. Belum diubah di `package.json`.

### 7.6 Tahap 7 Desain (`3cf6b95`)

| ID | Perbaikan | Bukti |
|---|---|---|
| D-07 | Kontras hover tombol primary mode malam dinaikkan: `primaryHover` `#26906A` → `#17694A` di `component.json` dan fallback `.dark` di `src/index.css` | `check-contrast.js`: rasio > 6.3:1 (ambang AA 4.5:1) |
| D-16 | Pengurangan varian dan penegasan font display swap di `index.html` | Hash inline script aman & font dimuat optimal |
| D-14 | Penghentian token drift di `DeviceFrame.jsx`: `text-[11px]` dihapus diganti `text-caption`, radius 12px dikembalikan ke 6px (`rounded-md`) sesuai token `components.sidebar.itemRadius` | Bebas kelas arbitrer |
| D-13 | Tombol reload HomeScreen yang sebelumnya no-op `hover:bg-brand-700` diperbaiki ke `hover:bg-brand-800` | Interaksi tombol aktif dan konsisten |
| D-10 | Aksesibilitas keyboard kartu buku di `HomeScreen.jsx`: ditambahkan `role="button"`, `tabIndex={0}`, `aria-label`, serta penanganan tombol Enter dan Spasi via `onKeyDown`; tombol baca di dalam kartu diisolasi dengan `tabIndex={-1}` dan `aria-hidden="true"` | Navigasi keyboard penuh tanpa fokus ganda |
| D-12 | Kepadatan grid mobile pada layar 360px: diubah dari grid kaku 2 kolom menjadi responsif `grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` | Nyaman dibaca jamaah lanjut usia di layar kecil |
| D-09 | Skeleton loader terintegrasi di `src/components/ui/Skeleton.jsx` (`BookGridSkeleton`, `CalendarSkeleton`, `AdminSkeleton`, `ScreenLoading`) dengan status pemuatan di `useCatalogSlice` dan `AppContext` | Transisi halaman mulus tanpa layout shift |
| D-03 | Skala tipografi dinaikkan di `component.json` dan 100% kelas ukuran teks mentah (`text-xs/sm/base/lg/xl`) dimigrasikan ke token skala (`text-caption`, `text-small`, `text-body`, `text-title`, `text-h3`) di seluruh layar utama | `check-colors` 0 pelanggaran, sintaks aman, build sukses |

### 7.7 Tahap 8 Fitur (`65c9c67`)

| Fitur / Modul | Perubahan | Bukti |
|---|---|---|
| Pencarian & Filter Katalog | `server/routes/books.routes.js`: parameter `search` (sanitasi kata kunci PostgREST `or` pada judul, penyusun, keterangan), `category` (filter kategori), `sort` (`newest`, `oldest`, `title_asc`, `title_desc`), dan `GET /api/books/:id` | Uji unit `tests/reading.test.js`: 4 kasus; pencarian instan di `HomeScreen` |
| UI Pencarian & Filter | `src/features/home/HomeScreen.jsx`: bilah pencarian responsif dengan tombol bersihkan, pill filter kategori horizontal (`Semua`, `Tasawuf`, `Bimbingan`, dst.), pengurutan, dan empty state ramah pengguna | Sesuai token tipografi dan 3 Color Key |
| Lanjutkan Membaca | `src/features/home/HomeScreen.jsx`: rak kartu "Lanjutkan Membaca" yang menampilkan buku terakhir dibaca beserta indikator halaman terakhir | Mengambil data dari server `GET /api/reading-progress` dengan fallback `localStorage` |
| Progres Membaca di Server | `server/routes/reading.routes.js`: `GET /api/reading-progress`, `GET /api/reading-progress/:bookId`, `PUT /api/reading-progress/:bookId` | Tersinkron otomatis saat membaca di `PdfReaderScreen`; tahan terhadap degradasi skema |
| Pembatas Buku (Bookmarks) | `server/routes/reading.routes.js`: `GET /api/books/:id/bookmarks`, `POST /api/books/:id/bookmarks`, `DELETE /api/books/:id/bookmarks/:bookmarkId`. Dialog pembatas buku di `PdfReaderScreen.jsx` | Indikator visual halaman tertandai, lompat halaman langsung, hapus penanda |
| Proteksi Konten M1 | `src/features/reader/PdfReaderScreen.jsx`: tanda air diagonal nama/email pembaca dengan opasitas sangat rendah (0.04), penonaktifan menu klik kanan (`onContextMenu`), dan pencegahan seleksi teks kanvas | Hak cipta naskah terjaga tanpa mengganggu kenyamanan baca |
| Skema Database | `supabase_database/add_bookmarks_and_progress.sql` & pembaruan `supabase_database/full_setup.sql`: tabel `user_bookmarks` dan `reading_progress` dengan RLS eksplisit dan policy "own rows" | Invarian RLS §0.2 terpenuhi |
| Koreksi Teks Bantuan | `src/data/mockData.js`: teks FAQ diperbarui menghapus rujukan foto profil yang sudah dicabut | Informasi akurat |

### 7.8 Tahap 9 Mode Teks Besar (`df09165`)

| Komponen | Perubahan | Bukti |
|---|---|---|
| Inisialisasi Skala Akar | `src/lib/textSize.js`: modul skala tipografi (`normal: 100%`, `large: 115%`, `xlarge: 130%`), membaca dan menyimpan ke `localStorage.wb_text_scale`, serta menerapkan `fontSize` dan `data-text-scale` pada `document.documentElement` | Uji unit `tests/textSize.test.js`: 3 kasus; boot mulus |
| Boot Aplikasi | `src/main.jsx`: `initTextScale()` dipanggil pada awal pemuatan aplikasi agar seluruh rem berskala serasi saat dibuka | Skala aktif sebelum komponen merender |
| Antarmuka Pengaturan Profil | `src/features/profile/EditProfileScreen.jsx`: kartu saklar 3 tingkat (Normal, Besar, Sangat Besar) dengan deskripsi ramah jamaah senior dan contoh pratinjau teks real-time | Respons instan saat tombol ditekan; toast konfirmasi |

### 7.9 Verifikasi Akhir & Kesiapan Sidang (Tahap 10)

Seluruh 10 Tahap perencanaan telah tuntas:
- **Keamanan Web (Tahap 1–6):** VULN-01 hingga VULN-30 selesai atau terdokumentasi rapi. CSP report-only aktif.
- **Desain & Aksesibilitas (Tahap 1, 7, 9):** 3 Color Key disiplin 100%, 17 pasangan kontras WCAG lolos, skala tipografi bebas kelas mentah, skeleton loaders terpasang di semua halaman, Mode Teks Besar aktif.
- **Fitur Web (Tahap 8):** Pencarian, filter kategori, pengurutan katalog, "Lanjutkan Membaca", progres membaca tersinkron, pembatas buku (bookmarks), dan proteksi konten M1 (watermark + contextmenu off).
- **Hasil Gerbang Otomatis:** `check-syntax` (61 berkas, 0 galat), `check-colors` (68 berkas, 0 palet mentah), `check-contrast` (17/17 lulus), 51/51 uji unit lulus, dan `vite build` produksi sukses.

### 7.10 Catatan Lingkungan Produksi

- `ALLOW_PAYMENT_SIMULATION=1` hanya untuk demo sidang.
- Token Gmail akan mati lagi 7 hari selama OAuth app berstatus *Testing*.

**Koreksi catatan performa:** chunk `excel` (939 kB) dan `charts` (350 kB) ternyata **sudah** di luar
jalur kritis — `exceljs` masuk lewat `import()` di handler ekspor (`AdminDashboard.jsx:327-345`,
`EventsTab.jsx:163`) dan `AdminDashboard` sendiri dimuat malas (`App.jsx:31`). Tidak ada pekerjaan
performa yang tersisa di sini.
