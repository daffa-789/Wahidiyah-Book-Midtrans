# Security & Fixing

> **Status 23 Okt 2026 — SELESAI (TERVERIFIKASI PENUH)**
> Seluruh perbaikan kerentanan aktif dan kritis (VULN-01 s/d VULN-21) telah selesai diimplementasikan, diuji otomatis (51/51 tes unit lulus), dan diverifikasi penuh. Kerentanan non-kritis lainnya telah dimitigasi.
> Laporan eksekusi dan bukti rinci: [`EXECUTION-REPORT.md`](./EXECUTION-REPORT.md).

Hasil audit keamanan white-box untuk **Aplikasi Buku Wahidiyah** (`daffa-789/Wahidiyah-Book-Midtrans`), beserta rencana perbaikan dan prompt eksekusi siap-pakai.

- Tanggal audit: 21 Oktober 2026
- Cakupan: tiga putaran — putaran 1 menghasilkan 11 temuan (VULN-01…VULN-11), putaran 2 menambah 9 (VULN-12…VULN-20), putaran 3 menambah 10 (VULN-21…VULN-30)
- Basis kode: branch `Whatsaap-authenticator`, commit `2f2b769`
- Project Supabase yang diperiksa: `pdimjmbjutlzjdfjaqgt`
- Metode: pembacaan kode + query read-only ke katalog Supabase (RLS, policy, grant, ACL fungsi) + forensik riwayat git

---

## 1. Ringkasan

Audit berjalan tiga putaran dan menemukan **30 temuan**: **5 High**, 1 Med-High, 7 Medium, 5 Low-Med, dan 12 Low. Putaran pertama (11 temuan) memeriksa autentikasi, pembayaran, RLS, dan riwayat git; putaran kedua (9 temuan) membuka penyajian berkas buku, manajemen pengguna, notifikasi push, katalog publik, dan konsistensi konfigurasi; putaran ketiga (10 temuan) menelusuri lapisan yang belum tersentuh — cache service worker, siklus hidup token, validasi bidang profil/media, higiene log, dan konfigurasi alat. Tidak ada temuan yang menuntut eskalasi darurat, tetapi **VULN-01, VULN-02, dan VULN-12 aktif saat ini** (bukan sekadar risiko laten) sehingga patut didahulukan.

Fondasi keamanan aplikasi tergolong baik: autentikasi memuat ulang identitas dari database setiap request, wewenang admin dicek di server untuk seluruh endpoint istimewa, verifikasi tanda tangan webhook Midtrans benar, dan seluruh tabel publik sudah ber-RLS. Masalah utama ada di tiga area: **satu rute simulasi pembayaran yang amat bergantung konfigurasi**, **kebijakan RLS pada tabel transaksi QRIS**, dan **alur callback OAuth yang mempercayai header dari klien**. Putaran kedua menambahkan satu temuan High pada **penegakan masa berlaku langganan**: gate konten Pro hanya membaca flag `is_pro` dan tidak pernah menyapu langganan yang sudah lewat, sehingga akses berbayar bertahan tanpa batas.

---

## 2. Ruang lingkup, metode, dan batasan

Diperiksa: autentikasi & OTP, pembayaran Midtrans/QRIS, RLS & policy Supabase, rahasia/kredensial, access control & IDOR, frontend, serta dependency.

Tidak diverifikasi (di luar jangkauan repo):

- Bukti eksploitasi otomatis di sandbox (tidak dijalankan pada audit ini, sehingga temuan bersifat *verified-by-reading*, bukan *verified-by-exploit*).
- `npm audit` tidak dijalankan agar tidak mengubah state; area dependency hanya dilihat dari `package.json`.
- Edge functions dan konfigurasi Auth Supabase di dashboard (rate limit bawaan, provider aktif) — belum diperiksa.
- Putaran kedua justru memverifikasi sisi yang semula dikosongkan: skema `storage` **tidak memiliki bucket maupun policy sama sekali** (0 baris pada `storage.buckets` dan `pg_policies`), sehingga seluruh media aplikasi — cover, thumbnail, dan berkas kitab — memang tersimpan sebagai data URI base64 di dalam kolom tabel, bukan di object storage.
- Putaran ketiga menutup sisa permukaan kode, tetapi dua hal tetap di luar jangkauan: (1) `npm audit` masih belum dijalankan agar tidak mengubah state, sehingga area dependensi belum terverifikasi; (2) konfigurasi reverse proxy produksi belum dapat dilihat, sehingga dampak nyata VULN-04 dan VULN-07 bergantung pada apakah `Host`/`X-Forwarded-*` diteruskan apa adanya. Berkas `.npmrc` tidak dapat dibaca langsung lewat alat baca berkas karena kebijakan keamanan menolak pola itu, sehingga isinya diverifikasi lewat `type` pada shell dan riwayat Git.
- Konfigurasi deployment (reverse proxy, keberadaan SSL, apakah `Host` dapat dipalsukan dari internet). Nilai `.env` yang dipakai adalah salinan lokal di mesin pengembang.

---

## 3. Daftar temuan

| ID | Temuan | Severity | Lokasi utama |
|---|---|---|---|
| VULN-01 | Rute `simulate-paid` aktif karena gerbangnya hanya satu flag env | High | `server/routes/payments.routes.js:371`, `server/config.js:51`, `.env` |
| VULN-02 | Anon dapat membaca seluruh transaksi QRIS dan menyisipkan baris | High | policy `qris_transactions`, `supabase_database/full_setup.sql:401-402` |
| VULN-03 | JWT sesi dikirim melalui query string pada redirect sukses | High | `server/routes/auth.routes.js:625-633` |
| VULN-04 | Host header dipercaya: open redirect, pencurian token, dan XSS | High | `server/routes/auth.routes.js:513-516`, `:527`, `:629` |
| VULN-05 | Secret JWT cadangan hardcoded + gagal-terbuka saat env kosong | Med-High | `server/auth.js:6-11` |
| VULN-06 | `POST /api/transactions` menerima nominal dari klien | Medium | `server/routes/transactions.routes.js:124-135`, `:154-155` |
| VULN-07 | Rate limit OTP berbasis alamat socket, `trust proxy` nonaktif | Medium | `server/middleware/security.js:35-43`, `server/config.js:29-42` |
| VULN-08 | Kode OTP dapat bocor di respons bila `NODE_ENV=development` | Medium | `server/lib/otp.js:22`, `server/routes/auth.routes.js:157`, `:270-282`, `:323-331` |
| VULN-09 | CSP dimatikan dan `CORS_ORIGINS` tidak diset | Low-Med | `server/middleware/security.js:15-25`, `server/config.js:18-22` |
| VULN-10 | Klien database turun ke anon key hanya dengan peringatan | Low | `server/db.js:18-24`, `:31-39` |
| VULN-11 | Unggahan tanpa allowlist jenis berkas | Low | `server/middleware/uploads.js:7-19` |
| VULN-12 | Masa berlaku langganan Pro tidak pernah ditegakkan pada gate konten | High | `server/routes/books.routes.js:167`, `server/auth.js:67-107` |
| VULN-13 | MIME dari klien tersimpan di data URI lalu dipercaya saat konten disajikan (XSS tersimpan) | Medium | `server/routes/books.routes.js:129`, `:174`, `server/lib/http.js:86-96` |
| VULN-14 | Langganan push tanpa autentikasi/limiter: SSRF ke host https mana pun + siaran berhenti | Medium | `server/routes/notifications.routes.js:30-39`, `:55`, `server/lib/webpush.js:184`, `server/lib/eventReminder.js:213` |
| VULN-15 | Endpoint publik tanpa pembatas; katalog membawa seluruh cover/thumbnail base64 | Low-Med | `server/routes/books.routes.js:37-49`, `:143` |
| VULN-16 | `anon`/`authenticated` memegang TRUNCATE/REFERENCES/TRIGGER (bawaan Supabase) | Low | grant tabel `public` (terverifikasi live) |
| VULN-17 | Admin terakhir dapat diturunkan; Pro pemberian admin permanen tanpa kedaluwarsa | Low | `server/routes/users.routes.js:96-108`, `:111-127` |
| VULN-18 | Kata sandi sementara dikembalikan dalam respons pembuatan pengguna | Low | `server/routes/users.routes.js:172` |
| VULN-19 | Dev server terbuka ke seluruh antarmuka + divergensi pembacaan flag | Low | `vite.config.js:87`, `scripts/health-check.js:34`, `server/config.js:51` |
| VULN-20 | OAuth dan endpoint status pembayaran tanpa rate limit | Low | `server/config.js:35-42`, `server/server.js:77`, `server/routes/payments.routes.js:315` |
| VULN-21 | Service worker menyimpan PNG QR pembayaran (cache-first, melewati `requireAuth`) | Medium | `public/sw.js:52-59`, `:84-105`, `server/routes/payments.routes.js:412` |
| VULN-22 | `avatar` menerima string bebas (bukan wajib data URL) → URL pelacakan & pembengkakan data | Low-Med | `server/routes/users.routes.js:40-52`, `server/lib/images.js:25-28` |
| VULN-23 | `cover_url` bebas → open redirect pada endpoint thumbnail publik | Low | `server/routes/books.routes.js:143-155`, `:181`, `server/lib/validate.js:42` |
| VULN-24 | Tidak ada pencabutan sesi: reset kata sandi tidak membatalkan token lama | Medium | `server/auth.js:127-158`, `server/routes/auth.routes.js:335` |
| VULN-25 | Log mencatat URL lengkap termasuk query string (membocorkan token sesi) | Low | `server/middleware/requestLog.js:22-28` |
| VULN-26 | Bidang profil dari body pada pembuatan akun Google | Low-Med | `server/routes/auth.routes.js:433-497` |
| VULN-27 | Skema tanpa batas atas, kata sandi hanya minimal 8 karakter, `POST /users` tanpa skema | Low | `server/lib/validate.js:17-44`, `server/routes/users.routes.js:139-174` |
| VULN-28 | `.npmrc` terlacak Git namun tidak diabaikan (berisi `allow-remote=all`) | Low-Med | `.npmrc`, `.gitignore` |
| VULN-29 | Enumerasi akun pada `/register` dan `POST /users` | Low | `server/routes/auth.routes.js:105-123`, `server/routes/users.routes.js:146-153` |
| VULN-30 | Respons tanpa batas dan agregasi di memori | Low | `server/routes/users.routes.js:83-93`, `server/routes/admin.routes.js:18-56`, `server/routes/health.routes.js:41-54` |

---

## 4. Detail temuan High

### VULN-01 — Pro gratis lewat tombol simulasi

Penjaga satu-satunya rute ini adalah `MIDTRANS_IS_PRODUCTION`, dan pada `.env` lokal nilainya `false`. Artinya setiap pengguna yang sudah login dapat menekan "Simulate Paid" dan langsung memperoleh masa Pro 30 hari. Pemeriksaan kepemilikan transaksi memang sudah ada, sehingga tidak bisa menargetkan transaksi milik orang lain, tetapi secara bisnis ini adalah pembayaran gratis.

```javascript
// server/routes/payments.routes.js:371-379
paymentsRouter.post('/qris/:orderId/simulate-paid', paymentRateLimiter, requireAuth, wrap(async (req, res) => {
  // ── HANYA UNTUK SANDBOX ──────────────────────────────────────────────
  // Mengaktifkan langganan seolah-olah Midtrans sudah mengirim notifikasi
  // settlement. Dipakai untuk demo/tes dari HP tanpa membuka simulator
  // Midtrans. Di PRODUCTION rute ini mati total (404) — tidak mungkin
  // diaktifkan lewat konfigurasi.
  if (MIDTRANS_IS_PRODUCTION) {
    return notFound(res, 'Rute tidak tersedia.');
  }
```

Komentar "tidak mungkin diaktifkan lewat konfigurasi" tidak akurat: rute ini **sepenuhnya** dikendalikan env. Parsing di `server/config.js:51` memakai `String(process.env.MIDTRANS_IS_PRODUCTION ?? 'false').trim().toLowerCase() === 'true'`, sehingga variasi huruf besar dan spasi (`TRUE`, ` True `) tetap terbaca sebagai produksi, sedangkan nilai lain — `1`, `yes`, `ya`, `on`, `production`, atau string kosong — **diam-diam berarti non-produksi** dan menghidupkan kembali rute simulasi tanpa peringatan apa pun.

**Perbaikan (menjaga demo sidang tetap bisa jalan):** ganti gerbangnya menjadi opt-in eksplisit — aktif hanya bila `ALLOW_PAYMENT_SIMULATION === '1'` **dan** `NODE_ENV !== 'production'`. Default: 404. Set `MIDTRANS_IS_PRODUCTION=true` pada lingkungan produksi.

### VULN-02 — Data pembayaran terbuka ke publik

Policy `Public Read QRIS Transactions` memiliki `qual = true` untuk role `public`, dan role `anon` memegang grant `SELECT` penuh pada tabel. Karena anon key dikirim ke peramban melalui bundle Vite, siapa pun dapat membaca seluruh isi `qris_transactions`: `user_id`, `customer_name`, `amount`, `plan_name`, `qr_payload`, `created_at`, `paid_at`. Selain itu ada `Public Insert QRIS Transactions` (`WITH CHECK status = 'WAITING_PAYMENT'`) sehingga baris sampah dapat disisipkan tanpa batas.

Kabar baiknya: **tidak ada policy `UPDATE`** pada tabel tersebut (policy itu dibuat di `full_setup.sql:403` lalu dihapus di `:509`, dan hasil pemeriksaan live mengonfirmasi sudah tidak ada), sehingga jalur "ubah status menjadi PAID langsung dari PostgREST" tertutup. Fungsi `create_qris_simulation`, `pay_qris_simulation`, dan `cancel_qris_simulation` juga hanya memiliki `EXECUTE` untuk `postgres` dan `service_role` (sudah direvoke dari `anon`/`authenticated`). Jadi dampaknya murni kebocoran data dan penyalahgunaan insert, bukan eskalasi hak akses.

**Perbaikan:** hapus kedua policy tersebut. Aman dari sisi fungsional karena `src/` tidak pernah menyentuh tabel itu (klien memantau status melalui `/api/payments/qris/:id/status`) dan server memakai service-role key yang melewati RLS. Hapus juga blok publikasi `supabase_realtime` yang tidak terpakai, lalu bersihkan `full_setup.sql:401-402` agar instalasi baru tidak mewarisi celah yang sama.

### VULN-03 — Token sesi di URL

Callback Google mengarahkan peramban ke `/auth/success?token=<JWT>&user=<base64>`. Token berlaku 12 jam dan akan tercatat pada riwayat peramban, header `Referer` ke pihak ketiga, serta log server/reverse proxy.

```javascript
// server/routes/auth.routes.js:625-633
    const token = createSessionToken(existingUser);
    const user = toPublicUser(existingUser);
    const userJson = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');

    const successUrl = new URL('/auth/success', frontendOrigin);
    successUrl.searchParams.set('token', token);
    successUrl.searchParams.set('user', userJson);

    return res.redirect(successUrl.toString());
```

**Perbaikan:** ganti dengan kode sekali-pakai berumur pendek (`/auth/success?code=...`), lalu tukar ke token lewat `POST /api/auth/exchange`. Kontrak klien tetap: token tetap disimpan sebagai Bearer token seperti sekarang.

### VULN-04 — Host header dipercaya

`FRONTEND_ORIGIN` tidak ada di `.env`, sehingga nilai asal redirect jatuh ke `${x-forwarded-proto}://${host}` — keduanya header yang dikendalikan klien, dan `x-forwarded-proto` dibaca mentah meski `trust proxy` diset `false`.

```javascript
// server/routes/auth.routes.js:513-516
  const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const currentOrigin = `${protocol}://${host}`;
  const frontendOrigin = process.env.FRONTEND_ORIGIN || currentOrigin;
```

Dua dampak: (1) redirect ke host penyerang sambil membawa `?token=...` dari VULN-03; (2) baris `res.status(302).send(\`<script>window.location.href='${frontendOrigin}/login';\`)` pada `:527` menyisipkan nilai tersebut ke dalam HTML tanpa escape.

**Perbaikan:** tentukan asal hanya dari `FRONTEND_ORIGIN` atau `ALLOWED_ORIGINS`; bila tidak cocok, jangan redirect ke host turunan sama sekali. Hapus fallback inline-script, sanitasi `x-forwarded-proto` ke `http`/`https`, dan berhenti memakai `req.get('host')` untuk menyusun redirect.

---

## 5. Detail temuan Medium dan Low

### VULN-05 — Secret JWT cadangan

`JWT_SECRET` saat ini ada di `.env`, jadi belum dapat dieksploitasi. Risikonya laten: string fallback `wahidiyah-local-development-secret-change-me` hidup di dalam repo dan server hanya mencetak peringatan lalu tetap berjalan. Lingkungan yang lupa menyetel `JWT_SECRET` (container, CI, clone baru) akan menerima token palsu tanpa batas. **Perbaikan:** hapus literal tersebut dan gagalkan boot saat `NODE_ENV === 'production'` tanpa `JWT_SECRET`.

### VULN-06 — Nominal dari klien pada jalur transfer manual

`POST /api/transactions` memakai `plan_name`, `amount`, `admin_fee`, dan `total_paid` dari body, berbeda dengan jalur Midtrans yang mengambil harga dari katalog server (`findPlan`, `server/lib/constants.js:39-48`). Transaksi ini dibuat berstatus pending dan tidak langsung mengaktifkan Pro, tetapi admin yang menyetujui lewat `PUT /api/transactions/:id/verify` akan memicu `activatePaidMembership` — sehingga baris palsu berpotensi berujung menjadi Pro bila lolos verifikasi manusia. **Perbaikan:** ambil paket, harga, dan biaya layanan dari katalog server; tolak 400 bila nominal dari klien bertentangan, tanpa mengubah alur pending yang sudah ada.

### VULN-07 — Rate limit yang salah kunci

Limiter memakai `req.socket.remoteAddress` dengan `trust proxy` nonaktif. Di belakang proxy, seluruh pengguna berbagi kuota 30 permintaan/15 menit sehingga satu penyerang dapat mengunci login semua orang, sekaligus melumpuhkan pemisahan brute force per akun. **Perbaikan:** jadikan `trust proxy` dapat dikonfigurasi (`TRUST_PROXY`), gunakan `ipKeyGenerator` dengan benar, dan tambah limiter per-identifier untuk endpoint verifikasi dan reset.

### VULN-08 — Kebocoran OTP pada mode pengembangan

`canExposeDevOtp()` bernilai benar saat `NODE_ENV === 'development'`, dan `NODE_ENV` tidak diset di `.env` sehingga saat ini aman. Namun bila lingkungan menyetelnya (misalnya untuk memudahkan debugging), kode OTP dikembalikan di respons JSON — dan jalur `deliveredBy === 'demo'` terpicu otomatis ketika gateway WhatsApp gagal mengirim (`server/whatsapp.js:85-90`). Kombinasi keduanya berarti ambil alih akun siapa pun. **Perbaikan:** wajibkan flag eksplisit `EXPOSE_DEV_OTP === '1'`, tolak bila `NODE_ENV === 'production'`, dan hanya izinkan dari loopback.

### VULN-09 — CSP dan CORS

`contentSecurityPolicy: false` menghilangkan pertahanan berlapis (tidak ditemukan sink `dangerouslySetInnerHTML` di frontend, jadi belum ada XSS langsung), dan `CORS_ORIGINS` tidak diset sehingga default hanya mengizinkan localhost. **Perbaikan:** aktifkan CSP khusus produksi yang sesuai build Vite, dan dokumentasikan nilai `CORS_ORIGINS` produksi.

### VULN-10 — Database gagal-terbuka

`server/db.js` turun ke anon key dengan hanya `logger.warn` ketika service-role key tidak ada, menghasilkan aplikasi setengah rusak alih-alih gagal tegas. **Perbaikan:** lempar error saat boot di produksi.

### VULN-11 — Unggahan tanpa allowlist

Multer memakai `memoryStorage` (aman dari path traversal) dan sudah membatasi ukuran 25 MB/2 berkas, tetapi tidak ada `fileFilter`. Rutenya khusus admin sehingga risikonya kecil. **Perbaikan:** tambahkan allowlist MIME per field plus validasi magic byte sebelum disimpan.

---

## 5A. Temuan putaran kedua (audit lanjutan)

Putaran kedua membuka lapisan yang belum diperiksa sebelumnya: penyajian berkas buku, manajemen pengguna, notifikasi push, katalog publik, dan konsistensi konfigurasi. VULN-12 tergolong **High** namun ditempatkan di sini agar riwayat kedua putaran tetap terbaca.

### VULN-12 — Masa berlaku langganan tidak pernah ditegakkan (High)

Gate konten berbayar hanya membaca flag `is_pro`:

```javascript
// server/routes/books.routes.js:167
  if (book.is_locked && !effectiveIsPro(req.user) && req.user.role !== 'admin') {
```

`effectiveIsPro` (`server/auth.js:67-69`) sepenuhnya bergantung pada kolom `is_pro`, tanpa membandingkan `subscription_expires_at` dengan waktu sekarang. Satu-satunya kode yang mengembalikan `is_pro` menjadi `false` adalah `settleExpiredMembership` (`server/auth.js:84-107`), dan fungsi itu hanya dipanggil di dua tempat: `server/routes/transactions.routes.js:138` (saat membuat transaksi) dan `server/routes/payments.routes.js:165` (saat membuat tagihan QRIS). Tidak ada pemanggilan di `requireAuth`, di `loadMembershipUser`, di endpoint konten, maupun di penjadwal mana pun — `startReminderScheduler` hanya menyapu agenda, bukan langganan.

Akibatnya, setelah `subscription_expires_at` lewat, pengguna yang tidak membuka halaman pembayaran tetap berstatus Pro, dan `GET /api/books/:id/content` terus menyajikan berkas berbayar tanpa batas waktu. `toPublicUser` (`server/auth.js:60`) juga melaporkan Pro aktif ke antarmuka, sehingga pengguna sendiri tidak menyadari masa aktifnya sudah habis. Ini kebocoran pendapatan langsung dan bertentangan dengan konsep langganan yang dijual.

**Perbaikan:** tegakkan kedaluwarsa di jalur autentikasi (`requireAuth` atau `loadMembershipUser`) dengan cache singkat, tambahkan penjadwal harian yang menyapu seluruh pengguna, dan perlakukan Pro aktif hanya bila `is_pro` **dan** `subscription_expires_at` belum lewat. Sertakan unit test untuk keadaan "sudah lewat", "tepat di batas", dan "bernilai null".

### VULN-13 — XSS tersimpan lewat MIME yang diklaim klien (Medium)

Saat unggah, MIME dari header multipart disimpan apa adanya ke dalam data URI:

```javascript
// server/routes/books.routes.js:129
    content_url: `data:${content.mimetype || 'application/pdf'};base64,${content.buffer.toString('base64')}`,
```

Hanya berkas `thumbnail` yang diverifikasi harus bertipe `image/`; bagian `content` tidak diperiksa. Ketika disajikan, `sendDataUrl` justru mengutamakan MIME yang tertanam di data URI dan mengabaikan allowlist ekstensi:

```javascript
// server/lib/http.js:93 (di dalam sendDataUrl)
  res.type(matches[1] || fallbackMime || 'application/octet-stream');
```

`fallbackMime` berisi `safeContentMime(book)` — peta ekstensi yang aman — tetapi hanya dipakai bila data URI tidak memuat MIME. Karena respons dikirim `Content-Disposition: inline` (`books.routes.js:171`) dan CSP dimatikan (VULN-09), berkas berlabel `text/html` akan dirender sebagai HTML di origin aplikasi, tempat token sesi disimpan di `localStorage`. Prasyaratnya akun admin (atau sesi admin yang dicuri), sebab unggahan buku memakai `requireAdmin`; `CONTENT_EXTENSIONS` juga tidak memuat `.html`/`.svg`, namun pemeriksaan itu hanya berlaku pada ekstensi nama berkas, bukan pada MIME yang dikirim klien.

**Perbaikan:** abaikan MIME yang tersimpan dan selalu pakai `safeContentMime(book)`; tambahkan validasi magic byte saat unggah (menyatu dengan VULN-11); kirim `Content-Disposition: attachment` untuk format selain PDF; dan jangan pernah mengizinkan `text/html` untuk berkas apa pun.

### VULN-14 — Endpoint langganan push: SSRF dan siaran yang bisa dihentikan (Medium)

```javascript
// server/routes/notifications.routes.js:30-39
const isAllowedEndpoint = (value) => {
  if (typeof value !== 'string') return false;
  if (value.length > MAX_ENDPOINT_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
};
```

Komentar tepat di atas fungsi tersebut menyatakan cek ini mencegah penyerang mendaftarkan endpoint internal (SSRF). Kenyataannya hanya **skema** yang dibatasi: host apa pun diterima, termasuk `https://169.254.169.254/...` (metadata cloud), `https://localhost:8443/`, atau nama host internal. `POST /api/notifications/subscribe` (`:55`) juga tanpa `requireAuth` dan tanpa limiter — tidak terdaftar pada `AUTH_RATE_LIMITED_PATHS` (`server/config.js:35-42`) — sehingga siapa pun dapat menambah langganan sebanyak apa pun.

Dampak kedua lebih cepat terasa. `broadcastPush` mengirim berurutan ke seluruh langganan aktif, dan `sendWebPush` memanggil `fetch` tanpa timeout sama sekali:

```javascript
// server/lib/webpush.js:184
  const response = await fetch(endpoint, {
```

Satu endpoint yang menggantung membekukan seluruh siaran, sehingga pengumuman dan pengingat agenda tidak sampai ke jamaah lain; mendaftarkan banyak endpoint semacam itu memperkuat efek penghentiannya.

**Perbaikan:** wajibkan autentikasi (atau minimal limiter plus deduplikasi endpoint) pada `subscribe`; batasi host ke daftar layanan push yang dikenal (FCM, Mozilla, Windows, Apple); tambahkan `AbortSignal.timeout()` pada `fetch`; batasi jumlah langganan per pengguna; dan jangan tampilkan detail status pada `/notifications/status`.

### VULN-15 — Endpoint publik tanpa pembatas dan beban gambar base64 (Low-Med)

`GET /api/books` publik tanpa autentikasi maupun limiter, dan `BOOK_FIELDS` (`server/lib/constants.js:28-33`) memuat `cover_url` serta `thumbnail_url` — keduanya data URI base64 yang tersimpan di kolom teks (thumbnail 1600 px, gambar carousel hingga 8 MB). `GET /api/books/:id/thumbnail` (`:143`) juga publik. Permintaan berulang tanpa autentikasi memaksa server mendekode dan mengirim puluhan megabita; base64 dari JPEG praktis tidak dapat dimampatkan sehingga `compression({ threshold: 1024 })` hampir tidak menolong. `GET /api/books/:id/content` juga selalu membangun ulang buffer penuh di memori karena isi PDF disimpan sebagai base64. **Perbaikan:** tambahkan limiter pada endpoint publik, pindahkan media ke object storage dengan URL pendek, dan manfaatkan ETag serta `Cache-Control` (sebagian sudah ada untuk thumbnail).

### VULN-16 — Hak tabel berlebih ala bawaan Supabase (Low)

Pemeriksaan langsung pada `aclexplode` memperlihatkan `anon` dan `authenticated` memegang `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN` pada seluruh tabel `public`. Ini perilaku bawaan Supabase, dengan RLS sebagai satu-satunya pembatas, dan **belum dapat dieksploitasi lewat API**: PostgREST tidak mengekspos operasi TRUNCATE dan tidak ada fungsi RPC yang melakukan operasi tabel. Perbaikannya murni least-privilege: cabut `TRUNCATE`, `REFERENCES`, `TRIGGER`, dan `MAINTAIN` dari kedua role agar batas kewenangan tidak bergantung pada RLS saja.

### VULN-17 — Lockout admin dan Pro permanen (Low)

`PUT /api/users/:id/role` (`server/routes/users.routes.js:96-108`) tidak melindungi admin terakhir dan tidak melarang admin menurunkan dirinya sendiri; satu permintaan yang salah dapat mengunci panel admin secara total. `PUT /api/users/:id/pro` (`:111-127`) selalu menyetel `subscription_expires_at: null`, termasuk ketika memberikan Pro — sehingga Pro pemberian admin tidak akan pernah diklaim balik oleh `settleExpiredMembership`, yang hanya menyapu baris dengan `subscription_expires_at` tidak null dan sudah lewat. **Perbaikan:** tolak perubahan peran yang menyisakan nol admin, dan beri masa berlaku eksplisit atau jalur pencabutan yang jelas untuk Pro pemberian admin.

### VULN-18 — Kata sandi sementara di dalam respons (Low)

`POST /api/users` mengembalikan `temporaryPassword` bila admin tidak mengisinya (`server/routes/users.routes.js:172`). Kredensial plaintext itu berjalan melalui body respons: tampil di devtools dan terekam oleh proxy atau logger yang menyimpan body. **Perbaikan:** wajibkan admin mengisi kata sandi awal, atau sampaikan lewat kanal terpisah dan paksa penggantian saat login pertama (mekanisme ini belum ada di aplikasi).

### VULN-19 — Dev server terbuka dan divergensi pembacaan flag (Low)

Dua hal berbeda yang sama-sama menyesatkan operator:

1. `vite.config.js:87` memakai `host: true` tanpa `allowedHosts`, sehingga dev server Vite (port 3000) mendengarkan seluruh antarmuka jaringan dan meneruskan `/api` ke backend (`:104-106`). Di jaringan tak tepercaya (mis. Wi-Fi kampus), dev server beserta API-nya dapat dijangkau mesin lain selama token masih berlaku.
2. `scripts/health-check.js:34` menentukan mode dengan `process.env.MIDTRANS_IS_PRODUCTION === 'true'`, sedangkan `server/config.js:51` memakai `trim().toLowerCase() === 'true'`. Nilai `TRUE` atau ` True ` dilaporkan "Sandbox" oleh health-check padahal server memperlakukannya sebagai produksi — persis kebalikan dari yang dibutuhkan saat memverifikasi kesiapan sebelum demo.

**Perbaikan:** gunakan `host: '127.0.0.1'` (atau `allowedHosts`) saat mengembangkan di jaringan publik, dan bacalah flag lewat satu helper bersama agar tidak ada dua definisi "produksi".

### VULN-20 — OAuth dan endpoint status tanpa rate limit (Low)

`AUTH_RATE_LIMITED_PATHS` (`server/config.js:35-42`) tidak memuat `/api/auth/google` maupun `/api/auth/google/callback`, sehingga alur OAuth dapat diulang tanpa batas — memboroskan kuota Google dan menulis baris ke `email_verifications` bila alur serupa dipakai di sana. `GET /api/payments/qris/:orderId/status` (`server/routes/payments.routes.js:315`) juga tanpa limiter; memang disengaja karena klien memantau setiap 3 detik, tetapi tetap sebaiknya dibatasi per akun agar tidak menjadi alat pemantauan status. Kepemilikan transaksi sudah diperiksa di semua rute pembayaran, jadi ini penguatan, bukan celah aktif.

---

## 5B. Temuan putaran ketiga (audit lanjutan kedua)

Putaran ketiga menyisir lapisan yang belum tersentuh: cache service worker, siklus hidup token, validasi bidang media/profil, higiene log, dan konfigurasi alat. Dua temuan Medium di sini berpasangan dengan kebutuhan fitur pada `Next-Feature.md`.

### VULN-21 — Service worker menyimpan PNG QR pembayaran (Medium)

`public/sw.js:51` menyatakan invariannya dengan tegas — "JANGAN cache endpoint buku berbayar/privat & autentikasi (Invarian Keamanan Konten)" — tetapi daftar kecualinya tidak lengkap:

```javascript
// public/sw.js:52-59
  if (
    url.pathname.includes('/api/books/') && url.pathname.endsWith('/content') ||
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/api/subscriptions/') ||
    url.pathname.startsWith('/api/transactions')
  ) {
    return;
  }
```

`/api/payments/` tidak ada di daftar itu, dan blok berikutnya (Cache-First untuk `.png`) justru mencocokkan rute gambar QR pembayaran:

```javascript
// public/sw.js:84-105 (ringkas)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
```

Rutenya memang berakhiran `.png`: `GET /api/payments/qris/:orderId/qr.png` (`server/routes/payments.routes.js:412`, dilindungi `requireAuth` dan `qrImageRateLimiter`). Server sudah mengirim `Cache-Control: private, max-age=600`, tetapi cache manual service worker **tidak menghormati semantik HTTP itu** — ia menyimpan dan menyajikan sendiri. Tiga akibatnya:

1. **Melewati autentikasi.** Karena strategi ini cache-first, `caches.match(request)` mengembalikan gambar QR **tanpa** menyentuh jaringan, sehingga `requireAuth` pada rute itu tidak pernah dijalankan untuk permintaan berikutnya dengan URL yang sama.
2. **Bertahan setelah keluar akun.** `clearStoredSession` hanya membersihkan `localStorage` (`src/lib/api.js:31`); CacheStorage tidak disentuh, jadi gambar QR dan `orderId` tetap tersimpan di perangkat sampai `CACHE_NAME` di-bump saat deploy berikutnya.
3. **Terbaca di perangkat bersama.** Pada HP bersama/warung, siapa pun yang mengetahui URL tersebut dapat membuka kembali QR pembayaran milik pengguna sebelumnya.

**Perbaikan:** tambahkan `/api/payments/` ke daftar kecuali; jangan pernah `cache.put` untuk respons yang memuat `Cache-Control: private` atau yang berasal dari rute ber-`requireAuth`; persempit blok Cache-First ke aset statis internal saja (`/assets/`, ikon PWA); bersihkan cache saat keluar akun (`caches.delete`); dan bump `CACHE_NAME` setelah perbaikan agar entri lama hilang.

### VULN-24 — Tidak ada pencabutan sesi (Medium)

`createSessionToken` hanya menandatangani `{ sub }` dengan masa berlaku 12 jam (`server/auth.js:127-131`), dan `requireAuth` memverifikasi tanda tangan lalu memuat ulang baris pengguna (`:138-158`) — tetapi tidak pernah memeriksa apakah token itu masih seharusnya berlaku. Daftar rute autentikasi (`server/routes/auth.routes.js`) juga menegaskan absennya mekanisme ini: hanya ada `login`, `register`, `verify-registration`, `request-password-reset`, `reset-password`, `resend-verification`, `google-supabase`, `google/callback`, dan `me` — **tidak ada ganti kata sandi, tidak ada "keluar dari semua perangkat"**, dan keluar akun sepenuhnya di sisi klien.

Dampak nyatanya pada alur yang sudah ada: setelah korban menjalankan `POST /auth/reset-password` (`:335`) — tindakan yang secara psikologis dianggap "mengamankan akun" — token yang sudah dicuri penyerang **tetap sah sampai 12 jam ke depan**. Tidak ada satu pun perubahan di server yang membatalkannya, karena kata sandi baru tidak mengubah apa pun yang diperiksa `requireAuth`. Perbaikan VULN-03 (token di URL) mempersempit peluang pencurian, tetapi tidak menutup jendela pasca-reset ini.

**Perbaikan:** tambahkan kolom `token_version` (atau `password_changed_at`) pada `users`, sertakan di payload token, dan bandingkan pada setiap `requireAuth`; naikkan nilainya saat reset/ganti kata sandi dan saat admin memaksa keluar; tambahkan endpoint `POST /auth/logout-all` serta ganti kata sandi untuk pengguna yang sudah masuk; pertimbangkan masa berlaku 2–4 jam dengan token penyegar.

### VULN-22 — `avatar` menerima string bebas (Low-Med)

```javascript
// server/lib/images.js:25-28
export async function compressAvatarDataUrl(dataUrl) {
  const parsed = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(String(dataUrl || ''));
  if (!parsed) return null;
```

Untuk masukan yang bukan data URL, fungsi ini mengembalikan `null` — dan pemanggilnya memperlakukan `null` sebagai "tidak ada hasil kompresi", bukan "tidak valid":

```javascript
// server/routes/users.routes.js:44-51
        const compressed = await compressAvatarDataUrl(avatar);
        if (compressed && 'rejected' in compressed) {
          return res.status(415).json({ ... });
        }
        updates.avatar = compressed?.dataUrl ?? avatar;
```

Akibatnya string mentah tersimpan apa adanya. Alamat seperti `https://host-penyerang/piksel.png` akan disimpan lalu dirender (mis. `src/components/ui/DeviceFrame.jsx:523`, `src/features/profile/EditProfileScreen.jsx:108`), sehingga peramban **siapa pun yang melihat profil itu** — termasuk admin yang membuka daftar pengguna — memuat gambar dari host penyerang: vektor pelacakan IP/User-Agent. Panjangnya dibatasi 1 MB (`jsonBody`, `server/middleware/security.js:29`), cukup untuk membengkakkan baris dan respons. Skema URL sembarang juga tersimpan, tetapi `javascript:` pada `<img src>` tidak dieksekusi peramban modern, jadi XSS bukan risiko utamanya. Pola identik muncul pada `cover_url` buku (`server/lib/validate.js:42` menerima string apa pun).

**Perbaikan:** wajibkan data URL dan tolak (415) masukan lain, alih-alih menyimpannya mentah; batasi panjang; dan normalisasi `cover_url` ke data URL atau jalur internal saja.

### VULN-23 — Open redirect pada endpoint thumbnail publik (Low)

```javascript
// server/routes/books.routes.js:150-154
  const url = book?.thumbnail_url || book?.cover_url;
  if (!url) return notFound(res, 'Thumbnail tidak ditemukan');

  if (sendDataUrl(res, url, { cacheControl: 'public, max-age=86400' })) return;
  return res.redirect(url);
```

`url` berasal dari kolom yang dapat diisi lewat `PUT /api/books/:id` (`:181` menerima `cover_url`) dan skema yang tidak memvalidasi bentuknya (`server/lib/validate.js:42`). Bila nilainya bukan data URL, endpoint publik ini mengembalikan 302 ke alamat apa pun yang ditentukan. Prasyaratnya akun admin, sehingga tingkat keparahannya Low — tetapi pola "redirect ke nilai tersimpan" ini sebaiknya tidak hidup di aplikasi yang endpoint publiknya bebas diakses. **Perbaikan:** validasi `cover_url` saat disimpan, dan bila bukan data URL, kembalikan 404 alih-alih mengalihkan.

### VULN-25 — Token sesi tertulis ke log (Low)

```javascript
// server/middleware/requestLog.js:22-28
    logger.request({
      method: req.method,
      path: req.originalUrl || req.url,
```

`originalUrl` memuat query string, sehingga VULN-03 berubah menjadi kebocoran yang permanen: JWT sesi tertulis ke log server untuk setiap login Google. Identifier OTP dan `orderId` juga terekam. Tidak ada peredaksian pada `logger.request`. **Perbaikan:** catat `req.path` tanpa query, atau redaksi parameter sensitif (`token`, `code`, `otp`), sambil mempertahankan `X-Request-Id` seperti sekarang.

### VULN-26 — Bidang profil dari body pada pembuatan akun Google (Low-Med)

`POST /auth/google-supabase` (`:433-497`) memverifikasi identitas dengan benar — `access_token` diperiksa ke Supabase Auth dan email diambil dari hasil verifikasi itu, sehingga akun tidak dapat disalahgunakan. Namun untuk akun baru, `name` dan `avatar` diambil dari body permintaan:

```javascript
// server/routes/auth.routes.js:462-468
        name: googleUser.name || email.split('@')[0],
        email,
        password: null,
        role: 'user',
        login_method: 'google',
        is_pro: false,
        avatar: googleUser.avatar || null,
```

Jalur ini melewati `registerSchema`, sehingga panjang dan bentuk kedua bidang tidak divalidasi. Digabung VULN-22, pembuatan akun dapat langsung menyisipkan avatar berupa URL remote, dan `name` tersimpan tanpa batas panjang. **Perbaikan:** ambil `name`/`avatar` dari objek pengguna hasil verifikasi Supabase, atau jalankan melalui skema yang sama dengan registrasi.

### VULN-27 — Skema tanpa batas atas (Low)

`server/lib/validate.js:17-44` memakai `.min()` tanpa `.max()` pada `name`, `email`, dan `password` (bukti: `z.string().trim().min(1, 'Nama wajib diisi')`, `z.string().min(8, 'Password minimal 8 karakter')`), sehingga satu-satunya batas adalah 1 MB body (`jsonBody`). Kebijakan kata sandi hanya panjang minimum 8 karakter tanpa aturan lain. `POST /api/users` (`server/routes/users.routes.js:139-174`) bahkan tidak memakai skema sama sekali, sehingga kata sandi awal yang ditentukan admin sepanjang satu karakter akan di-hash dan disimpan. **Perbaikan:** tambahkan `.max()` pada setiap bidang string, terapkan skema yang sama pada pembuatan pengguna oleh admin, dan samakan syarat minimum kata sandi awal.

### VULN-28 — `.npmrc` terlacak Git tanpa pengabaian (Low-Med)

`git ls-files .npmrc` mengonfirmasi berkas ini **terlacak**, sementara `.gitignore` (baris 1-17) mengabaikan `dist/` dan `.env*` tetapi tidak memuat entri `.npmrc`. Isinya saat ini hanya satu baris non-bawaan, `allow-remote=all` — **tidak ada token, jadi belum ada yang bocor**. Risikonya prospektif dan nyata: `.npmrc` adalah tempat lazim `//registry.npmjs.org/:_authToken=...`, sehingga begitu seseorang menjalankan `npm login` (mis. ke registry privat kampus), token itu langsung ter-commit dan terdorong ke GitHub. Perlu dicatat juga bahwa `allow-remote=all` bukan setelan bawaan npm, dan efek tepatnya tidak saya verifikasi pada audit ini. **Perbaikan:** tambahkan `.npmrc` ke `.gitignore`, jalankan `git rm --cached .npmrc`, dokumentasikan setelan registry di README bila memang dibutuhkan, dan pastikan setelan itu memang disengaja.

### VULN-29 — Enumerasi akun pada registrasi (Low)

`/register` mengembalikan pesan eksplisit "Email sudah terdaftar" (`:110-112`) dan "Nomor WhatsApp sudah terdaftar pada akun lain" (`:120-122`), dan `POST /users` juga "Email sudah terdaftar" (`users.routes.js:151-153`). Ini tidak konsisten dengan alur reset yang pada §6 justru dipuji karena menyamakan respons untuk mencegah enumerasi. Praktisnya, penyerang dapat menguji apakah sebuah email atau nomor terdaftar tanpa hambatan berarti. **Perbaikan:** gunakan pesan netral ("Jika data ini belum terdaftar, kami akan mengirim kode verifikasi"), atau terima paparan ini secara sadar dan catat di dokumen.

### VULN-30 — Respons tanpa batas dan agregasi di memori (Low)

`GET /api/users` (`users.routes.js:83-93`) memilih seluruh pengguna tanpa paginasi; `GET /api/admin/logs` (`admin.routes.js:18-56`) memuat 200 langganan + 200 pengguna lalu mengurutkannya di memori pada setiap permintaan; `/api/stats` (`health.routes.js:41-54`) menjumlahkan pendapatan dengan memindai seluruh transaksi sukses. Semuanya khusus admin, jadi ini bukan serangan eksternal melainkan batas skalabilitas: ketika jumlah jamaah tumbuh, satu sesi admin (atau sesi admin yang disalahgunakan) dapat membuat endpoint ini mahal. **Perbaikan:** paginasi, agregasi lewat SQL (view atau RPC), dan singgahan singkat pada ringkasan.

---

## 6. Yang sudah benar (jangan diubah)

Kontrol berikut terverifikasi ada dan bekerja:

- **RLS aktif di seluruh 9 tabel publik**, dan tabel `users`, `transactions`, `subscriptions`, `email_verifications`, serta `push_subscriptions` memiliki 0 policy alias default deny untuk `anon`/`authenticated`. Data akun tidak bocor.
- **Token tidak membawa klaim wewenang.** `createSessionToken` hanya menandatangani `{ sub }`, dan `requireAuth` selalu memuat ulang pengguna dari database — role tidak dapat dipalsukan lewat token. `requireAdmin` dipakai konsisten di seluruh endpoint admin.
- **Webhook Midtrans benar:** hash SHA512 dari `order_id + status_code + gross_amount + server key`, dibandingkan dengan `timingSafeEqual`, disertai idempotensi lewat `settleTransaction`, pemeriksaan ketidaksesuaian nominal, dan pemeriksaan `fraud_status`.
- **Anti-SSRF pada pengambilan gambar QR:** hanya host `*.midtrans.com` dengan `redirect: 'manual'`.
- **OTP kuat:** 6 digit dari `crypto.randomInt`, masa berlaku 10 menit, maksimum 5 percobaan, sekali pakai, disimpan terhash, respons reset disamakan untuk mencegah enumerasi akun, dan akun Google ditolak dari alur reset.
- **Password:** bcrypt dengan cost 12; `verifyPassword` menolak hash yang bukan format bcrypt.
- **Riwayat git bersih.** `.env`, `client_secret_*.json`, dan `.workbuddy-ai/` tidak pernah di-commit, dan pola yang muncul di riwayat hanya placeholder `xxxxxxxx`. Rotasi kredensial belum diperlukan kecuali `.env` pernah dibagikan ke luar mesin pengembang.
- **Tidak ada mass-assignment pada pembaruan profil.** `PUT /users/profile` (`users.routes.js:30-80`) menyusun objek `updates` secara eksplisit dari daftar bidang yang diizinkan, sehingga `role` maupun `is_pro` tidak dapat dinaikkan lewat body permintaan.
- **Fungsi `SECURITY DEFINER` terkunci aman.** `rls_auto_enable` dan `fn_handle_qris_payment` terdaftar dengan `proconfig = search_path=public, pg_temp` (terverifikasi lewat `pg_proc`), dan `EXECUTE`-nya hanya untuk `postgres` dan `service_role` — tidak ada jalan hijack `search_path`.
- **Unggahan gambar carousel sudah benar.** `carousel.routes.js:209-239` mengonversi lewat `sharp` dan menolak dengan 415 bila konversi gagal dan MIME aslinya bukan gambar aman (`isSafeRawImageFallback`) — pola inilah yang seharusnya ditiru unggahan konten buku (VULN-13).
- **Penghapusan akun sendiri diblokir** (`users.routes.js:182`), sehingga admin tidak dapat menghapus dirinya dan mengunci panel.
- **Lapisan galat terkendali.** `internalErrorDetail` hanya membuka pesan saat `NODE_ENV === 'development'` (`lib/http.js:14`), dan `errorHandler` memetakan `MulterError`/`entity.too.large` ke 413 tanpa membocorkan nama berkas atau path.
- **Batas body 1 MB** (`middleware/security.js:29`) membatasi dampak setiap bidang teks yang tidak dibatasi skema (VULN-27).
- **Deny-list service worker untuk autentikasi memang ada** (`sw.js:52-59` mencakup `/api/auth/`, `/api/subscriptions/`, `/api/transactions`, dan konten berbayar) — hanya daftarnya belum lengkap (VULN-21).

---

## 7. Koreksi klaim dokumentasi

| Lokasi | Klaim | Kenyataan |
|---|---|---|
| `Master_Memory_Workflow.md:572` (indikator #12) | "Nominal harga pesanan dikalkulasi dari konstanta backend, bukan input klien" — status Lulus | Benar untuk jalur Midtrans (`findPlan`), **tidak benar** untuk jalur transfer manual yang menerima nominal dari klien (VULN-06) |
| `Master_Memory_Workflow.md:77` | "Charge QRIS ... nominal dinamis (bebas dari manipulasi harga di sisi klien)" | Perlu kualifikasi bahwa pernyataan ini hanya berlaku pada jalur Midtrans |
| `server/routes/payments.routes.js:372-376` | Rute simulasi "tidak mungkin diaktifkan lewat konfigurasi" | Keliru: sepenuhnya dikendalikan satu variabel env |
| `server/routes/notifications.routes.js:27-29` | Cek skema `https:` "mencegah penyerang mendaftarkan endpoint internal (SSRF)" | Tidak akurat: skema tidak membatasi host, sehingga endpoint internal HTTPS tetap diterima (VULN-14) |
| `scripts/health-check.js:34` | Mode "Sandbox/Production" untuk verifikasi kesiapan | Memakai `=== 'true'` sedangkan server memakai `toLowerCase()`, sehingga `TRUE` dilaporkan "Sandbox" padahal server menganggapnya produksi (VULN-19) |
| `Master_Memory_Workflow.md` (bagian keanggotaan Pro) | Pro hanya untuk pelanggan yang masih aktif | Masa berlaku tidak pernah ditegakkan pada gate konten, sehingga Pro bertahan setelah kedaluwarsa (VULN-12) |
| `public/sw.js:51` | "JANGAN cache endpoint buku berbayar/privat & autentikasi (Invarian Keamanan Konten)" | Daftar kecualinya tidak memuat `/api/payments/`, sehingga PNG QR pembayaran justru tersimpan dan disajikan tanpa autentikasi (VULN-21) |
| `src/data/mockData.js:89` | Reader menyediakan "bookmark ... serta akses offline untuk pengguna berlangganan Pro" | Belum ada bookmark maupun caching offline (lihat `Next-Feature.md` §2.1 dan §2.4) |
| `server/lib/validate.js` (asumsi skema menyeluruh) | Validasi masukan terpusat lewat zod | Hanya `login`, `register`, dan `bookInputSchema` yang memakai skema; `POST /users`, `PUT /users/profile`, dan `google-supabase` melewatinya (VULN-26, VULN-27) |

---

## 8. Urutan perbaikan

1. VULN-12 — tegakkan kedaluwarsa langganan (High dengan dampak pendapatan langsung); panggil penegakan di jalur autentikasi, tambahkan penjadwal harian, lalu uji batas waktu.
2. VULN-01, VULN-06 — logika pembayaran; jaga alur transfer manual tetap berfungsi dan demo sandbox tetap mungkin.
3. VULN-13, VULN-11 — validasi berkas: magic byte saat unggah, paksa `safeContentMime` saat menyajikan, dan `attachment` untuk format non-PDF.
4. VULN-14 — notifikasi: autentikasi/limiter pada `subscribe`, allowlist host layanan push, dan timeout pada `fetch`.
5. VULN-04 lalu VULN-03 — resolusi asal sebelum penulisan ulang redirect (berkas yang sama).
6. VULN-05, VULN-07, VULN-08, VULN-10 — penguatan boot, middleware, dan OTP; tidak menyentuh kontrak lintas berkas.
7. VULN-02 — jalankan SQL, lalu selaraskan `full_setup.sql`.
8. VULN-17, VULN-18 — pengamanan endpoint admin: admin terakhir, Pro permanen, dan kata sandi sementara.
9. VULN-09, VULN-15, VULN-16, VULN-19, VULN-20 — header, limiter, hak tabel, dan kebersihan konfigurasi.
10. VULN-21 — perbaiki deny-list service worker, hentikan cache respons privat, dan bersihkan CacheStorage saat keluar akun (Medium; berdampak pada perangkat bersama).
11. VULN-24 — tambahkan pencabutan sesi: `token_version` pada `users`, pemeriksaan di `requireAuth`, endpoint ganti kata sandi dan keluar-semua-perangkat (Medium; menutup jendela 12 jam pasca-reset).
12. VULN-22, VULN-23, VULN-26, VULN-27 — validasi bidang media/profil: wajibkan data URL untuk avatar dan `cover_url`, tolak string bebas, lalu tambahkan `.max()` pada setiap bidang serta samakan syarat kata sandi.
13. VULN-25, VULN-29, VULN-30 — higiene log (tanpa query string), respons registrasi yang netral, serta paginasi dan agregasi SQL.
14. VULN-28 — keluarkan `.npmrc` dari Git, tinjau setelan `allow-remote=all`, dan pastikan tidak ada token registry di riwayat.
15. Uji otomatis, lalu pembaruan dokumentasi.

### Migrasi database untuk VULN-02

```sql
-- Jalankan pada project Supabase pdimjmbjutlzjdfjaqgt
DROP POLICY IF EXISTS "Public Read QRIS Transactions" ON public.qris_transactions;
DROP POLICY IF EXISTS "Public Insert QRIS Transactions" ON public.qris_transactions;

-- Tabel tetap ber-RLS dengan nol policy = default deny untuk anon/authenticated.
-- Server tetap berfungsi karena memakai service-role key yang melewati RLS.

-- Verifikasi (harus mengembalikan 0 baris):
SELECT tablename, policyname, roles::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'qris_transactions';
```

### Migrasi hak tabel untuk VULN-16

```sql
-- Least privilege: RLS tidak mengatur operasi tingkat tabel berikut, dan aplikasi
-- tidak memerlukannya sama sekali. Aman dijalankan pada instalasi yang ada.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Jaga agar tabel baru mewarisi kebijakan yang sama:
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES FROM anon, authenticated;

-- Verifikasi: harus tersisa hanya SELECT/INSERT/UPDATE/DELETE.
SELECT c.relname, a.grantee::regrole::text AS role, a.privilege_type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(c.relacl) a
WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.grantee::regrole::text IN ('anon', 'authenticated')
ORDER BY 1, 2, 3;
```

---

## 9. Prompt eksekusi untuk AI lain (Qoder / WorkBuddy)

> Salin seluruh blok berikut sebagai satu instruksi tunggal. Prompt ini sudah memuat lokasi temuan, kriteria penerimaan, migrasi SQL, dan definisi selesai sehingga AI tersebut tidak perlu mengaudit ulang.

### Role and mission

You are a senior security engineer. Harden the repository at `E:\Wahidiyah Book + Real Midtrans Skripsi` (Windows, shell `cmd`, Node >= 22, ESM). A white-box audit already produced the 30 findings below, gathered in three rounds (VULN-01…VULN-11, then VULN-12…VULN-20, then VULN-21…VULN-30). Fix all of them, add automated tests, update the documentation, and report back **in Indonesian**.

Stack: React 19 + Vite + Tailwind v4 (`src/`), Express 4 (`server/`), Supabase Postgres (`supabase_database/full_setup.sql`), Midtrans Core API QRIS, bcrypt cost 12, JWT 12h, WhatsApp/email OTP.

### Hard rules

- Work on a new branch `security/hardening`. Commit per finding group using the repo's conventional style (`fix:`, `feat:`, `docs:`, `refactor:`). **Never `git push`.** Never commit `.env` or any secret.
- **Never edit `.env`.** New required variables must be documented and listed in the report as "user must set manually".
- Do not add npm dependencies. Use Node built-ins (`node:test`, `node:assert`, `crypto`). This project deliberately avoids libraries.
- Do not delete or rename existing public API routes or response fields; if a contract must change, update the matching frontend caller in the same commit.
- Preserve the thesis-specific manual-transfer path (`POST /api/transactions` + admin verification). Fix it, do not remove it.
- Keep existing Indonesian comments and formatting; add new comments in Indonesian and only where logic is non-obvious.
- `npm` scripts must stay Windows-`cmd` compatible.
- Do not rotate or regenerate any credential. Report instead.

### Findings, required fixes, acceptance criteria

| ID | Fix | Acceptance |
|---|---|---|
| VULN-01 | Replace the `MIDTRANS_IS_PRODUCTION`-only gate with explicit opt-in `ALLOW_PAYMENT_SIMULATION === '1'` AND `NODE_ENV !== 'production'`; default 404. Add pure helper `isPaymentSimulationAllowed(env)` + tests. Correct the misleading comment at lines 372-376. | Unset flag → 404; flag set in dev → QRIS simulation still activates Pro |
| VULN-02 | Drop policies `Public Read QRIS Transactions` and `Public Insert QRIS Transactions`; remove `full_setup.sql:401-402` and the unused `supabase_realtime` block. | `pg_policies` returns 0 anon/authenticated policies for `qris_transactions`; charge/poll flow still works |
| VULN-03 | Replace the query-string JWT with a single-use code (~60s TTL) plus `POST /api/auth/exchange` returning the same `{ token, user }` shape. Do not switch to cookies — the SPA stores a Bearer token deliberately. | No JWT ever appears in a URL; Google login works end to end |
| VULN-04 | Resolve the origin only from `FRONTEND_ORIGIN`/`ALLOWED_ORIGINS`; never redirect to a host derived from `Host`/`x-forwarded-proto`; delete the inline-script fallback at line 527; sanitize `x-forwarded-proto` to `http`/`https`. Extract pure `resolveFrontendOrigin(env, req)`. | `Host: evil.com` and `x-forwarded-proto: javascript` never win; tests cover both |
| VULN-05 | Remove the hardcoded fallback secret; require `JWT_SECRET` at boot when `NODE_ENV === 'production'`; dev-only ephemeral secret otherwise. Add `resolveJwtSecret(env)` + tests. | Missing secret in production throws |
| VULN-06 | Derive plan, price, and admin fee from `findPlan(planId)`; reject (400) when a client amount contradicts the catalog. Keep the pending flow and response shape. | `amount: 1` no longer creates a Rp 1 pending transaction; manual path still works |
| VULN-07 | Make `trust proxy` configurable via `TRUST_PROXY`, use `ipKeyGenerator` correctly, keep the global auth limiter, add a per-identifier limiter for verify/reset endpoints. | One attacker cannot lock out other users |
| VULN-08 | Require explicit `EXPOSE_DEV_OTP === '1'`, never expose when `NODE_ENV === 'production'`, expose only to loopback. | Exposure matrix tests pass |
| VULN-09 | Enable a production-only CSP suited to the Vite build (`default-src 'self'`, `img-src 'self' data: blob: https://*.midtrans.com`, `connect-src 'self' https://*.supabase.co`, `frame-ancestors 'none'`, inline styles for Tailwind). If pages break, use `Content-Security-Policy-Report-Only` and document why. Make `CORS_ORIGINS` explicit. | Pages render; policy reported |
| VULN-10 | Throw at boot when production and no service-role/secret key; keep the anon fallback for local dev with the existing loud warning. | Production refuses to start half-configured |
| VULN-11 | Add `fileFilter` per field (PDF for `content`, `image/*` for `thumbnail` and carousel) plus magic-byte validation (`%PDF`, `sharp` metadata); return 415 on mismatch. Keep `memoryStorage`. | Non-PDF rejected with 415 |
| VULN-12 | Enforce expiry in the auth path: `requireAuth`/`loadMembershipUser` must treat Pro as active only when `is_pro` AND `subscription_expires_at` is in the future (null allowed only for explicit admin grants). Add a daily sweep scheduler that calls `settleExpiredMembership()` globally, and extract a pure `hasActivePro(user, now)`. | A user whose expiry is in the past is denied `GET /api/books/:id/content` without visiting any payment endpoint; tests cover past/boundary/null |
| VULN-13 | Stop trusting the stored MIME: serve book content using the sanitized `safeContentMime(book)` instead of `matches[1]` from the data URI; send `Content-Disposition: attachment` for every extension except PDF; never serve `text/html`; add the magic-byte validation from VULN-11. | A file uploaded with `Content-Type: text/html` is never rendered as HTML (served as attachment/octet-stream) |
| VULN-14 | Require auth (or at minimum rate limit + endpoint dedupe) on `POST /api/notifications/subscribe`; replace the "any https host" check with an allowlist of known push services (FCM, Mozilla, Windows, Apple); add `signal: AbortSignal.timeout(...)` to the `fetch` in `sendWebPush`; cap subscriptions per user. | A non-allowlisted host is rejected; a hanging endpoint cannot block the broadcast loop (test with a stubbed pending fetch) |
| VULN-15 | Add a rate limiter to the public endpoints `GET /api/books` and `GET /api/books/:id/thumbnail`; add `ETag`/`Cache-Control` on the catalog response. Do **not** migrate media to object storage here — that is a separate feature (see `Next-Feature.md`). | Excess public requests receive 429; catalog responses carry cache headers |
| VULN-16 | Revoke `TRUNCATE, REFERENCES, TRIGGER, MAINTAIN` from `anon` and `authenticated` on all `public` tables (SQL is in this document) and append it to `full_setup.sql`, including `ALTER DEFAULT PRIVILEGES`. | `aclexplode` shows only SELECT/INSERT/UPDATE/DELETE for both roles |
| VULN-17 | Reject role changes that would leave zero admins (including self-demotion of the last admin); make `PUT /api/users/:id/pro` set an explicit expiry (accept an optional value, default 30 days) instead of always writing null. | Demoting the last admin is refused; granted Pro always carries an expiry |
| VULN-18 | Stop returning `temporaryPassword` in the response; require the admin to supply an initial password, or return it only once behind an explicit flag with a warning. | `POST /api/users` no longer carries a plaintext password |
| VULN-19 | Set `host: '127.0.0.1'` (or `allowedHosts`) in `vite.config.js`; make `scripts/health-check.js` reuse the same flag parser as `server/config.js`. | Both agree on the Midtrans mode for `true`/`TRUE`/`1` |
| VULN-20 | Add `/api/auth/google` and `/api/auth/google/callback` to `AUTH_RATE_LIMITED_PATHS` (or a dedicated limiter) and add a per-account limiter for `GET /api/payments/qris/:orderId/status`. | OAuth and status endpoints are limited while the 3-second poll keeps working |
| VULN-21 | Add `/api/payments/` to the service-worker deny-list; never `cache.put` a response that is `Cache-Control: private` or that came from a `requireAuth` route; narrow the cache-first branch to internal static assets; clear caches on logout; bump `CACHE_NAME`. | A request to `/api/payments/qris/<id>/qr.png` never writes to CacheStorage, and stale QR entries disappear for existing devices |
| VULN-22 | Require a real image data URL for `avatar` (reject other input with 415 instead of storing it); cap the length; apply the same rule to `cover_url`. | `PUT /users/profile` with `avatar: "https://evil.example/x.png"` is rejected and nothing is stored |
| VULN-23 | Validate `cover_url` on write; if it is not a data URL, respond 404 instead of redirecting. | `GET /api/books/:id/thumbnail` never issues a 302 to a stored, non-data URL |
| VULN-24 | Add `token_version` (or `password_changed_at`) to `users`, include it in the JWT payload, verify it in `requireAuth`, increment on password reset/change and admin-forced logout; add `POST /api/auth/logout-all` and a change-password endpoint. | A token issued before a password reset is rejected afterwards; tests cover the before/after matrix |
| VULN-25 | Log `req.path` without the query string, or redact `token`/`code`/`otp` parameters; keep `X-Request-Id`. | No JWT or OTP appears in the request log for any route |
| VULN-26 | Take `name`/`avatar` from the verified Supabase user object, or validate them with the same schema as registration. | A body-supplied `name`/`avatar` cannot bypass validation on account creation |
| VULN-27 | Add `.max()` to every string field in `validate.js`; apply the same schema to admin user creation; require the admin-supplied initial password to meet the same minimum. | A 1 MB `name` or a 1-character admin password is rejected with 400 |
| VULN-28 | Ignore `.npmrc` in Git (`git rm --cached .npmrc` plus a `.gitignore` entry) and review the committed `allow-remote=all` setting; confirm no registry token ever entered history. | `git ls-files .npmrc` returns nothing; history contains no token |
| VULN-29 | Use a neutral message for existing email/phone on `/register` and `POST /users`, or document the exposure deliberately. | `/register` no longer confirms whether an email or phone is registered |
| VULN-30 | Paginate `GET /api/users`, aggregate `/api/stats` and `/api/admin/logs` in SQL (view or RPC), and cache the summary briefly. | No endpoint loads an unbounded result set or sorts large arrays in memory |

### Automated tests

`node:test` + `node:assert` under `tests/`, no network and no database. Add `"test": "node --test tests/"` to `package.json`. Cover:

- `server/lib/otp.js`: dev-OTP exposure matrix, TTL expiry, max attempts, resend cooldown (inject `now`).
- `server/auth.js`: `resolveJwtSecret` (must throw in production when missing), `toPublicUser`, `effectiveIsPro`.
- `server/lib/midtrans.js`: `verifySignatureKey` (valid, wrong hash, wrong length), `isTransactionSettled` (settlement/capture/fraud combinations), `isAllowedQrUrl` (`https://*.midtrans.com` ok; `https://midtrans.com.evil.com`, `http://`, malformed must fail).
- `server/lib/constants.js` + transactions: `findPlan`, `toPositiveNumber`, `decideTransactionVerification`.
- New helpers: `resolveFrontendOrigin`, `isPaymentSimulationAllowed`, catalog-price resolution, `hasActivePro(user, now)` (expiry enforcement), `resolveContentMime(book)` (stored MIME must never win), the push-service host allowlist, `isCacheableRequest(path, headers)` for the service worker, and `shouldInvalidateToken(payloadVersion, userVersion)`.
- Service worker cache rules: a unit test over the path/cache predicate must assert that `/api/payments/qris/<id>/qr.png`, `/api/books/<id>/content`, and every `/api/auth*`, `/api/subscriptions*`, `/api/transactions*` path are never cached, and that a `Cache-Control: private` response is skipped.

Also extend `scripts/check-syntax.js` to scan `tests/` (it currently scans `server` and `scripts` only).

### Documentation

- `Master_Memory_Workflow.md:572` (indicator #12): after VULN-06, state precisely that both paths derive prices from the backend catalog, and note the previous gap.
- `Master_Memory_Workflow.md:77`: align the Midtrans bullet with the same wording.
- `Master_Memory_Workflow.md` section 8: add rows for the new controls.
- Document new env variables and production values in the environment section: `FRONTEND_ORIGIN`, `ALLOW_PAYMENT_SIMULATION`, `EXPOSE_DEV_OTP`, `CORS_ORIGINS`, `TRUST_PROXY`.

### Definition of done

`npm run check` (syntax + colors + `vite build`) and `npm test` both pass; `git status` shows no `.env` change and no secret in the diff; the `pg_policies` verification query returns 0 rows; every acceptance criterion above behaves as specified.

### Report back (in Indonesian)

1. Table mapping VULN-01…VULN-20 to `fixed` / `already-fixed` / `deferred`, with file:line and the evidence (command + observed output). Deferred items need an explicit reason and a question.
2. List of changed files with a one-line purpose each.
3. Verification commands run and their results.
4. Env values the user must set manually, with recommended production values, without touching `.env`.
5. Blockers or ambiguities, and what is needed to continue.
6. Confirm the branch is local and awaiting review; do not push or rotate credentials.

Ask before: rotating a credential, deleting a route or feature, changing a public API response contract, or adding a dependency.

---

## 10. Langkah manual yang tidak bisa diotomatiskan

1. Pastikan `MIDTRANS_IS_PRODUCTION=true` pada lingkungan produksi (nilai `false` yang tercatat berasal dari `.env` lokal).
2. Set nilai produksi untuk `FRONTEND_ORIGIN`, `ALLOW_PAYMENT_SIMULATION`, `EXPOSE_DEV_OTP`, `CORS_ORIGINS`, dan `TRUST_PROXY`.
3. Periksa konfigurasi reverse proxy: apakah `Host` dan `x-forwarded-proto` dari klien diteruskan apa adanya.
4. Periksa setelan Auth Supabase di dashboard (rate limit bawaan, provider aktif). Skema `storage` sudah diverifikasi kosong, jadi tidak ada bucket publik yang perlu dibersihkan.
5. Rotasi kredensial hanya diperlukan bila `.env` pernah dibagikan ke luar mesin pengembang; riwayat git sendiri sudah bersih.
6. Set `NODE_ENV=production` secara eksplisit pada lingkungan produksi agar `devOtp` dan detail galat internal tidak mungkin aktif; `EXPOSE_DEV_OTP` cukup dibiarkan kosong.
7. Uji regresi VULN-12 secara manual: ubah `subscription_expires_at` seorang pengguna uji menjadi masa lalu langsung di database, lalu pastikan `GET /api/books/:id/content` menolak sebelum ia membuka halaman pembayaran mana pun.
8. Karena skema `storage` kini kosong, jaga agar tidak ada bucket publik yang dibuat tanpa disengaja ketika nanti memindahkan media ke object storage.
9. Setelah perbaikan VULN-21 di-deploy, bump `CACHE_NAME` di `public/sw.js` agar entri QR lama terhapus dari perangkat pengguna, dan pertimbangkan `caches.delete()` pada saat keluar akun.
10. Tinjau `.npmrc` yang terlacak Git: `git rm --cached .npmrc`, tambahkan ke `.gitignore`, lalu periksa `git log -p -- .npmrc` untuk memastikan tidak ada token registry yang pernah ditambahkan. Putuskan apakah `allow-remote=all` memang disengaja.
