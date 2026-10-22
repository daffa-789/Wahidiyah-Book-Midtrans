# Next Feature

> **Status 23 Okt 2026** — berkas ini **arsip analisis**, bukan status terkini.
> Status eksekusi terbaru: [`EXECUTION-REPORT.md`](./EXECUTION-REPORT.md).
> Dua butir sudah berubah: `flag-icons` dicabut (bendera di-vendor di `public/flags/`)
> dan foto profil dicabut seluruhnya.

Analisis fitur lanjutan untuk **Aplikasi Buku Wahidiyah**: apa yang sudah ada, celah yang terverifikasi, kandidat pengembangan, dan urutan pengerjaan yang disarankan.

- Tanggal analisis: 21 Oktober 2026
- Cakupan: tiga putaran — 20 kandidat awal, 14 tambahan, lalu 19 lagi (total 53 kandidat pada §3)
- Basis kode: branch `Whatsaap-authenticator`, commit `2f2b769`
- Sumber pembanding: `Master_Memory_Workflow.md` §9 (panduan penambahan fitur) dan §15 (roadmap)

---

## 1. Kondisi saat ini

Fitur inti sudah berjalan dan saling terhubung:

| Area | Status |
|---|---|
| Katalog buku | Grid kartu + badge kategori, hero carousel yang dikelola admin |
| Agenda majelis | `CalendarScreen` + pengingat H-1 + notifikasi push (`public/sw.js` v10) |
| E-Reader PDF | Tema terang/gelap, zoom, rotate, fullscreen, dialog resume halaman terakhir |
| Keanggotaan | Satu paket Pro (Rp 25.000/bulan + biaya layanan) dengan riwayat langganan |
| Pembayaran | QRIS Midtrans Core API: charge, polling status 3 detik, settle idempoten, struk |
| Autentikasi | OTP WhatsApp multi-provider / email, Google OAuth, reset password |
| Admin | Statistik (AreaChart + PieChart), kelola buku/pengguna/agenda/carousel, log, ekspor Excel |
| Platform | PWA app-shell, service worker, sistem tema, ekspor Excel |

Kesimpulan roadmap §15 bahwa seluruh fitur inti selesai memang akurat. Karena itu, pengembangan berikutnya paling produktif diarahkan ke **retensi pembaca**, **penemuan konten**, dan **pendalaman monetisasi** — bukan menambah modul baru dari nol.

---

## 2. Celah yang terverifikasi

Bagian ini bukan dugaan; setiap butir disertai lokasi di kode.

### 2.1 Bookmark belum ada, tetapi Help Center mengklaim sudah ada

`src/data/mockData.js:89` menyatakan pembaca PDF menyediakan "bookmark ... serta akses offline untuk pengguna berlangganan Pro". Kenyataannya ikon `Bookmark` hanya dipakai sebagai ornamen pada dialog resume halaman (`src/features/reader/PdfReaderScreen.jsx:380`). Tidak ada daftar tandai, tidak ada tabel `bookmarks`, dan tidak ada rute terkait.

Dampak: ketidaksesuaian antara dokumentasi bantuan dan produk nyata — berisiko muncul sebagai temuan saat UAT.

### 2.2 Progres baca hanya lokal per perangkat

```javascript
// src/features/reader/PdfReaderScreen.jsx:80-90
    const saved = localStorage.getItem(storageKey);
      localStorage.setItem(`last_read_page_${activeBook.id}`, String(page));
```

Konsekuensinya: progres hilang saat cache peramban dibersihkan, tidak berpindah antar perangkat (HP ke laptop), dan tidak ada data bagi admin tentang kitab yang benar-benar dibaca.

### 2.3 Tidak ada pencarian atau filter katalog

Kolom `category` sudah tersimpan di tabel `books` (`server/routes/books.routes.js:27`, `:115-123`) dan tampil sebagai badge di `src/features/home/HomeScreen.jsx:59-111`, tetapi tidak ada kotak pencarian, filter kategori, maupun pengurutan. `useCatalogSlice` hanya memuat seluruh katalog. Untuk aplikasi perpustakaan, ini celah UX terbesar dan paling murah diperbaiki.

### 2.4 Offline PDF bertabrakan dengan proteksi konten

```javascript
// public/sw.js:51-59
  // JANGAN cache endpoint buku berbayar/privat & autentikasi (Invarian Keamanan Konten)
  if (
    url.pathname.includes('/api/books/') && url.pathname.endsWith('/content') ||
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/api/subscriptions/') ||
    url.pathname.startsWith('/api/transactions')
  ) {
    return;
  }
```

Service worker sengaja tidak pernah menyimpan berkas PDF berbayar. Roadmap §15.1 poin 5 ingin "caching offline cerdas", yang berarti menulis PDF berbayar ke penyimpanan pengguna. Ini keputusan desain, bukan sekadar pekerjaan teknis: perlu mekanisme unduhan terkontrol (masa berlaku, tanda air, atau penyimpanan terenkripsi) agar tetap dapat dipertanggungjawabkan sebagai proteksi hak cipta pada bab pembahasan.

### 2.5 Pengingat langganan masih di sisi klien

`src/lib/reminders.js` menghitung sisa masa aktif di peramban. Tidak ada penjadwal di server yang mengirim pengingat perpanjangan, padahal infrastruktur push sudah lengkap (`server/lib/webpush.js`, `server/lib/eventReminder.js`, tabel `push_subscriptions`).

### 2.6 Belum ada ulasan, pusat notifikasi, voucher, referral, dan i18n

- Tidak ditemukan apa pun terkait ulasan/rating pada `src/` maupun `server/`.
- Notifikasi hanya berupa push satu arah (`server/routes/notifications.routes.js` menyediakan `public-key`, `subscribe`, `unsubscribe`, `status`) — tidak ada riwayat notifikasi yang dapat dibaca ulang.
- Kolom `subscriptions.ref_code` sudah ada tetapi belum dipakai untuk program referral.
- `SUBSCRIPTION_PLANS` (`server/lib/constants.js:39-48`) memang sudah berbentuk array, tetapi baru berisi satu paket.
- Input nomor HP sudah mendukung 245 negara (`src/components/ui/PhoneInput.jsx` + `public/flags/`), namun seluruh antarmuka berbahasa Indonesia dengan string hardcoded dan `dayjs.locale('id')`.

### 2.7 Media disimpan sebagai base64 di dalam tabel (utang teknis terbesar)

Pemeriksaan langsung ke Supabase: `storage.buckets` berisi **0 baris** dan tidak ada satu pun policy di skema `storage`. Artinya seluruh media — cover, thumbnail, gambar carousel, dan berkas kitab — disimpan di dalam kolom tabel sebagai data URI base64:

```javascript
// server/routes/books.routes.js:129
    content_url: `data:${content.mimetype || 'application/pdf'};base64,${content.buffer.toString('base64')}`,
```

Konsekuensinya berlapis: overhead sekitar 33% dari ukuran berkas; batas unggah 25 MB (`server/middleware/uploads.js:9`) menjadi plafon keras untuk kitab besar; `GET /api/books` ikut membawa setiap cover dan thumbnail base64 karena `BOOK_FIELDS` memuat keduanya (`server/lib/constants.js:28-33`); dan setiap permintaan `/content` membangun ulang buffer penuh di memori. Memindahkan media ke object storage dengan signed URL adalah prasyarat teknis bagi EPUB, kitab besar, dan unduhan offline.

### 2.8 Masa berlaku Pro tidak ditegakkan

Temuan VULN-12 pada `Security-and-Fixing.md`: gate konten berbayar hanya membaca flag `is_pro` (`server/routes/books.routes.js:167`), sedangkan `settleExpiredMembership` dipanggil hanya di dua alur pembayaran. Pengguna yang masa aktifnya sudah habis tetap dapat membuka kitab Pro tanpa batas. Ini bukan sekadar masalah keamanan — ia menandai absennya **grace period dan alur perpanjangan yang eksplisit**: pengingat menjelang berakhir, tombol perpanjang yang jelas, dan penegakan yang konsisten di server.

### 2.9 Plumbing yang sudah ada tetapi belum dipakai

Beberapa kapabilitas sudah hidup di kode dan tinggal diaktifkan:

- `planDaysFromPeriod` (`server/lib/membership.js:16-28`) sudah mampu membaca "1 Tahun", "3 Bulan", atau "30 hari", tetapi `activatePaidMembership` selalu dipanggil tanpa `periodFallback` sehingga semua langganan berjalan 30 hari. Multi-plan praktis tidak memerlukan logika baru.
- `subscriptions.ref_code` sudah terisi lewat `toRefCode` (`:35-38`) tetapi belum pernah dibaca — pondasi program referral.
- `push_subscriptions` menyimpan `user_agent`, `is_active`, dan `updated_at` (`server/lib/eventReminder.js:70-76`) — cukup untuk fitur "kelola perangkat saya".
- `events.reminder_sent_at` bersama `sendEventAnnouncementNow` (`:254-284`) sudah menyediakan jalur siaran pengumuman; yang belum ada hanya riwayat dan tombol kirim ulang di panel admin.
- `/api/stats` (`server/routes/health.routes.js:41-54`) menjumlahkan pendapatan dengan memuat **semua** baris transaksi sukses — sekaligus alasan teknis untuk memindahkan pelaporan ke agregasi SQL.

### 2.10 Pembayaran baru punya satu metode dan tanpa jalur pembatalan

`SUBSCRIPTION_PLANS` masih berisi satu paket, metode pembayaran hanya QRIS (Core API), dan tidak ada jalur pembatalan maupun refund: `cancel_qris_simulation` ada di database tetapi tidak pernah dipanggil dari kode, sedangkan transfer manual yang perlu dibatalkan admin juga tidak punya endpointnya.

### 2.11 Tidak ada pengelolaan sesi maupun perangkat

Temuan VULN-24 pada `Security-and-Fixing.md` punya sisi fitur yang jelas terasa pengguna. Daftar rute autentikasi (`server/routes/auth.routes.js`) hanya memuat `login`, `register`, `verify-registration`, `request-password-reset`, `reset-password`, `resend-verification`, `google-supabase`, `google/callback`, dan `me` — **tidak ada ganti kata sandi dan tidak ada "keluar dari semua perangkat"**. Token berlaku 12 jam (`server/auth.js:12`) dan keluar akun sepenuhnya di sisi klien (`src/lib/api.js:31`).

Artinya pengguna tidak dapat melihat dari perangkat mana saja akunnya diakses, tidak dapat mengakhiri sesi yang mencurigakan, dan tidak dapat mengganti kata sandinya sendiri tanpa alur lupa-sandi lengkap. Menariknya, bahan untuk fitur ini sudah tersimpan: `push_subscriptions` mencatat `user_agent`, `is_active`, dan `updated_at` (`server/lib/eventReminder.js:70-76`). Halaman "Perangkat saya" hampir gratis secara teknis, sekalipun tabel sesi khusus tetap lebih rapi.

### 2.12 Panel admin tanpa jejak audit dan tanpa observability

`GET /api/admin/logs` (`server/routes/admin.routes.js:18-56`) bukan audit trail. Ia menurunkan ulang 200 langganan terbaru dan 200 pengguna terbaru lalu menggabungkannya di memori pada setiap permintaan: tidak ada catatan siapa mengubah apa, kapan, dan dari nilai berapa. Tidak ada tabel `audit_log`, tidak ada penangkapan galat (error tracking) di klien maupun server, dan tidak ada pemantauan uptime.

Untuk aplikasi yang menyimpan data pembayaran dan identitas jamaah, ini juga celah kepatuhan: belum ada mekanisme ekspor data pribadi maupun penghapusan akun atas permintaan pengguna. Penguji UAT biasanya menanyakan justru bagian ini, dan jawabannya saat ini adalah "belum ada".

### 2.13 Dokumentasi bantuan masih statis dan tidak bisa dikelola admin

`src/data/mockData.js:89` memuat teks HELP yang ikut ter-bundle, sehingga setiap koreksi kalimat memerlukan deploy ulang — dan versi yang ada sekarang sudah memuat klaim yang tidak sesuai kenyataan (bookmark serta akses offline Pro, lihat §2.1 dan §2.4). Memindahkan FAQ ke database yang dikelola admin menyelesaikan dua masalah sekaligus: isi selalu mutakhir tanpa deploy, dan tidak lagi menjadi sumber ketidaksesuaian dokumen dengan produk.

---

## 3. Kandidat fitur

Kolom "Ruang lingkup" menandakan besarnya pekerjaan relatif, bukan durasi.

| Fitur | Ruang lingkup | Lapisan yang disentuh | Catatan |
|---|---|---|---|
| Pencarian + filter + sort katalog | Rendah | `books.routes.js` (query param), `useCatalogSlice`, `HomeScreen` | Tanpa tabel baru; gunakan `ILIKE` + index pada `title`, `author`, `category` |
| Halaman detail buku + "Lanjutkan Membaca" | Rendah–sedang | `GET /api/books/:id`, `HomeScreen` | Memakai progres baca yang sudah ada |
| Bookmark tersinkron | Sedang | Tabel `user_bookmarks` + rute + slice | Menutup klaim `mockData.js:89`; §9 dokumen memori sudah memberi contoh skema ini |
| Progres baca di server | Sedang | Tabel `reading_progress` + rute + `PdfReaderScreen` | Dasar bagi fitur turunan berikutnya |
| Multi-plan (bulanan/tahunan/yayasan) | Rendah–sedang | `SUBSCRIPTION_PLANS`, `ProScreen`, `PaymentMethodScreen` | Struktur array sudah siap; berdampak langsung ke pendapatan |
| Kode voucher / promo | Sedang | Tabel `vouchers` + validasi di `payments.routes.js` | Perlu aturan kuota dan masa berlaku |
| Program referral | Sedang | Kolom `subscriptions.ref_code` yang sudah ada | Bisa menjadi rekomendasi manajerial untuk yayasan |
| Pengingat perpanjangan otomatis | Sedang | Penjadwal server + `push_subscriptions` | Menekan churn; memakai jalur push yang sudah terbukti |
| Pusat notifikasi in-app | Sedang | Tabel `notifications` + endpoint list/read | Melengkapi push yang kini bersifat sekali kirim |
| Ulasan + rating dengan moderasi | Sedang | Tabel `book_reviews` + tab moderasi admin | Butuh policy RLS ketat dan penanganan spam |
| RSVP/presensi majelis + ekspor ICS | Sedang | Tabel `event_attendees`, `CalendarScreen` | Nilai tinggi bagi jamaah, sejalan dengan fokus agenda |
| Analitik keterbacaan per kitab | Sedang | Turunan `reading_progress` → dashboard admin | Menyediakan data empiris baru untuk Bab IV |
| Riwayat unduhan / lisensi Pro | Sedang | Turunan `subscriptions` + `transactions` | Memudahkan klaim pengguna saat kendala akses |
| Refresh token + kelola sesi perangkat | Sedang | `server/auth.js` + tabel sesi | Saat ini JWT 12 jam tanpa refresh maupun logout semua perangkat |
| Uji otomatis + CI | Sedang | `tests/`, `npm test`, pipeline | Prasyarat agar fitur baru tidak meregresi |
| i18n ID/EN/AR + dukungan RTL | Tinggi | Layer i18n + konversi seluruh string | Selaras dengan jangkauan 245 negara; bahasa Arab memerlukan pencerminan tata letak |
| Dukungan EPUB | Tinggi | Parser + renderer + kolom format berkas | Membuka kontrol tipografi, pencarian teks, dan TTS |
| Text-to-Speech untuk lansia | Tinggi | Ekstraksi teks PDF/EPUB + Web Speech API | Kontribusi aksesibilitas yang kuat untuk sidang |
| Unduhan offline terkontrol (Pro) | Tinggi | CacheStorage/IndexedDB + enkripsi + masa berlaku | Wajib disertai kajian risiko hak cipta (lihat §2.4) |
| PWA ke Google Play (TWA) | Sedang | Bubblewrap + Play Console | Sudah tercantum di roadmap §15.1 poin 4; murni pengemasan |
| Migrasi media ke object storage + signed URL | Tinggi | `books.routes.js`, kolom media, `uploads.js`, `full_setup.sql` | Menghapus plafon 25 MB, memangkas overhead 33%, prasyarat EPUB & offline; sekaligus menutup VULN-15 |
| Grace period + alur perpanjangan | Sedang | `server/auth.js`, penjadwal, `ProScreen`, `reminders.js` | Pasangan wajib perbaikan VULN-12; pengingat H-3 memakai push yang sudah ada |
| Pembatalan/refund transaksi (QRIS & manual) | Sedang | `payments.routes.js`, `transactions.routes.js`, panel admin | `cancel_qris_simulation` sudah ada di database; dibutuhkan untuk pembukuan yayasan |
| Metode pembayaran lain (VA/e-wallet) | Sedang | Midtrans Snap/Core, `PaymentMethodScreen` | Memperluas jangkauan; memakai kredensial Midtrans yang sama |
| Manajemen perangkat & langganan push | Sedang | `push_subscriptions`, `notifications.routes.js` | Data `user_agent` sudah tersimpan; sekaligus memitigasi VULN-14 |
| Riwayat & kirim ulang siaran pengumuman | Rendah | `eventReminder.js`, tab agenda admin | `reminder_sent_at` + `sendEventAnnouncementNow` sudah tersedia |
| Broadcast pengumuman via WhatsApp | Sedang | `server/whatsapp.js` (fonnte/wablas/whacenter/twilio/webhook) | Menjangkau jamaah yang belum memasang PWA |
| Laporan pendapatan bulanan berbasis agregasi SQL | Sedang | `health.routes.js`, `admin.routes.js` | Sekaligus memperbaiki pemindaian penuh pada `/api/stats` |
| Ekspor kuitansi/struk PDF | Rendah–sedang | `transactions` + `ref_no`/`ref_code` | `toRefCode` sudah ada; berguna untuk pembukuan jamaah |
| 2FA untuk admin | Sedang | Infrastruktur OTP yang sudah ada | Sinergi keamanan + fitur; melindungi panel yang memegang data pembayaran |
| Rak/koleksi kurasi admin | Rendah | `carousel.routes.js`, `HomeScreen` | Memakai kembali mekanisme carousel sebagai rak tematik |
| Gamifikasi keterlibatan (streak, papan mujahadah) | Sedang | `reading_progress`, `HomeScreen` | Mendorong retensi; menyediakan data baru untuk Bab IV |
| Pencarian teks di dalam kitab | Sedang | `PdfReaderScreen` (text layer pdf.js) | Prasyarat TTS dan fitur kutipan |
| Audit trail perubahan data admin | Sedang | Tabel `audit_log` + hook pada rute admin | Halaman log yang ada hanya menurunkan data, bukan jejak perubahan |
| Halaman "Perangkat & sesi saya" + keluar dari semua perangkat | Sedang | `server/auth.js`, tabel sesi, `push_subscriptions` | Menutup VULN-24; `user_agent` sudah tersimpan (§2.11) |
| Ganti kata sandi untuk pengguna yang sudah masuk | Rendah | `auth.routes.js`, `EditProfileScreen` | Saat ini pengguna hanya bisa lewat alur lupa-sandi |
| Penangkapan galat klien & server (error tracking) | Sedang | `src/main.jsx`, `logger.js`, endpoint baru | Observability; menutup §2.12 |
| Pemantauan uptime + riwayat insiden | Rendah | `GET /api/health` yang sudah ada | Bukti kesiapan operasional untuk lembaga |
| Ekspor data pribadi & permintaan hapus akun | Sedang | Alur admin + tabel pengguna | Kepatuhan privasi; sering ditanyakan penguji |
| Pusat FAQ dinamis yang dikelola admin | Rendah | `mockData.js` → tabel | Menutup klaim tidak akurat (§2.13) |
| Panduan onboarding interaktif untuk jamaah senior | Rendah–sedang | `HomeScreen` + komponen tour | Adopsi pengguna lanjut usia |
| Aksesibilitas menyeluruh (ukuran font, kontras tinggi, label pembaca layar) | Sedang | Seluruh komponen UI | Inklusi; layak menjadi bab pembahasan tersendiri |
| Mode baca berdampingan (kitab + terjemah) | Sedang | `PdfReaderScreen` | Kebutuhan nyata pengajian; butuh EPUB/teks berlapis |
| Catatan & sorotan per halaman + ekspor catatan | Sedang | Tabel anotasi + reader | Melengkapi bookmark; bahan kajian pribadi |
| Generator kartu kutipan untuk dibagikan | Rendah | Canvas + data kutipan | Viral loop dakwah tanpa biaya iklan |
| Kuis/evaluasi pemahaman kitab + sertifikat | Tinggi | Modul baru + `reading_progress` | Kontribusi akademik (e-learning); mengangkat Bab IV |
| Absensi majelis via pemindaian QR + sertifikat kehadiran | Sedang | Agenda + kamera + tabel kehadiran | Memanfaatkan pola QR dan agenda yang sudah ada |
| Donasi/infaq QRIS dengan kampanye bertarget | Sedang | Memakai ulang alur QRIS yang sudah terbukti | Nilai tinggi bagi yayasan dengan biaya teknis rendah |
| Kitab audio / rekaman ceramah (player + playlist) | Sedang | Object storage + komponen player | Menjangkau jamaah saat berkendara; butuh Tahap nol |
| Manajemen petugas/mubaligh (roster tanpa jadwal bentrok) | Sedang | Tabel penugasan + `events` | Operasional lembaga, bukan sekadar jamaah |
| Bulk import kitab & pengguna via Excel/CSV | Rendah | ExcelJS sudah tersedia | Mempercepat pengelolaan awal dan migrasi data |
| Versi/revisi kitab + changelog | Sedang | `books` + tabel revisi | Transparansi perubahan isi kitab |
| API publik + webhook keluar untuk integrasi lembaga | Sedang | Layer API baru | Menyambung ke sistem pesantren/lembaga lain |

Peta fitur terhadap modul yang sudah ada:

```mermaid
flowchart LR
  subgraph Inti["Sudah ada"]
    A[Katalog + Carousel]
    B[Reader PDF]
    C[Langganan Pro + QRIS]
    D[Agenda + Push]
    E[Admin Dashboard]
  end
  subgraph Baca["Pengalaman Baca"]
    F[Pencarian dan filter]
    G[Bookmark + progres sinkron]
    H[EPUB + TTS]
    I[Offline terkontrol]
  end
  subgraph Uang["Monetisasi"]
    J[Multi-plan + voucher]
    K[Referral]
    L[Pengingat perpanjangan]
  end
  subgraph Sosial["Komunitas"]
    M[Ulasan + rating]
    N[RSVP majelis]
    O[Notifikasi in-app]
  end
  subgraph Ops["Operasional dan Kepercayaan"]
    P[Audit trail]
    Q[Pemantauan galat dan uptime]
    R[Privasi: ekspor dan hapus akun]
    S[Kelola sesi dan perangkat]
  end
  A --> F
  B --> G
  B --> H
  B --> I
  C --> J
  C --> K
  C --> L
  A --> M
  D --> N
  D --> O
  E --> P
  E --> Q
  A --> R
  B --> S
```

---

## 4. Urutan pengerjaan yang disarankan

**Tahap nol — prasyarat teknis (kerjakan lebih dulu):**
Migrasi media ke object storage dengan signed URL, dan penegakan masa berlaku langganan (VULN-12) beserta grace period. Keduanya tidak langsung terlihat pengguna, tetapi membuka plafon 25 MB, memangkas beban gambar base64, dan memastikan langganan benar-benar berakhir — sehingga seluruh fitur monetisasi di tahap berikutnya berpijak pada fondasi yang benar.

**Tahap pertama — dampak besar, pekerjaan kecil:**
Pencarian dan filter katalog, lalu halaman detail buku dengan "Lanjutkan Membaca". Keduanya tidak memerlukan tabel baru dan langsung terasa oleh pengguna.

**Tahap kedua — menutup celah yang sudah diklaim:**
Bookmark tersinkron dan progres baca di server. Sekaligus membetulkan teks Help Center pada `src/data/mockData.js:89` agar sesuai kenyataan, dan membuka jalan bagi analitik keterbacaan.

**Tahap ketiga — monetisasi di atas fondasi yang sudah terbukti:**
Multi-plan dan voucher (backend sudah berbentuk katalog paket), disusul pengingat perpanjangan otomatis di server karena jalur push sudah berjalan.

**Tahap keempat — keterlibatan:**
RSVP/presensi majelis, ulasan dan rating dengan moderasi, serta pusat notifikasi in-app.

**Tahap kelima — pekerjaan besar bernilai akademik:**
EPUB dan Text-to-Speech, lalu unduhan offline terkontrol. Dua yang terakhir menuntut kajian trade-off (aksesibilitas, hak cipta, keamanan konten) sehingga paling layak dijadikan kontribusi skripsi, bukan sekadar penambahan layar.

**Tahap keenam — kepercayaan, kepatuhan, dan operasional lembaga:**
Pengelolaan sesi dan perangkat, audit trail perubahan data, pemantauan galat serta uptime, dan alur privasi (ekspor data pribadi dan penghapusan akun). Inilah bagian yang membuat aplikasi layak dipakai dalam lingkup lembaga, bukan hanya cukup untuk demo sidang.

**Berjalan paralel kapan saja:**
Uji otomatis dan CI, refresh token dengan pengelolaan sesi perangkat, serta pengemasan TWA ke Google Play.

---

## 5. Catatan teknis penting

### 5.1 Tabel baru otomatis ber-RLS, dan tanpa policy berarti default deny

Supabase pada project ini memiliki event trigger `rls_auto_enable` (`SECURITY DEFINER`) yang mengaktifkan RLS pada setiap tabel baru di skema `public`. Artinya tabel seperti `user_bookmarks`, `reading_progress`, `book_reviews`, atau `vouchers` akan **otomatis terkunci** begitu dibuat, dan akses dari klien akan gagal tanpa pesan yang jelas bila policy belum ditulis.

Aturan yang perlu diikuti untuk setiap tabel baru:

1. Aktifkan RLS secara eksplisit dan tulis policy sesuai kebutuhan (baca sendiri, tulis sendiri).
2. Ingat bahwa role `anon`/`authenticated` pada project ini memegang grant tabel penuh (perilaku bawaan Supabase), sehingga RLS adalah satu-satunya pembatas — jangan pernah menulis policy dengan `USING (true)` untuk data pengguna.
3. Tambahkan definisinya ke `supabase_database/full_setup.sql` agar instalasi bersih menghasilkan skema yang sama, dan hindari policy bergaya publik seperti yang menjadi temuan VULN-02 di `Security-and-Fixing.md`.

### 5.2 Ikuti pola tiga langkah pada §9

Setiap fitur mengikuti alur yang sudah didokumentasikan: rute di `server/routes/`, state slice di `src/context/slices/` yang disambungkan lewat `AppContext`, lalu komponen di `src/features/`. Contoh `user_bookmarks` pada §9 dokumen memori sudah selaras dengan kebutuhan §2.1.

### 5.3 Jangan regresi pada invarian yang sudah ada

- Service worker wajib mengecualikan `/api/books/*/content` dari cache (`public/sw.js:51-59`). Setiap fitur offline harus menghormati invarian ini atau menggantinya secara sadar disertai mekanisme pengaman.
- `CACHE_NAME` perlu di-bump setiap deploy (aturan §R5.6 di dokumen memori).
- Nama berkas rute, pola respons `{ success, ... }`, dan pesan berbahasa Indonesia harus konsisten dengan yang sudah ada.
- `npm run check` wajib 0 error sebelum commit, dan `npm run health` untuk memeriksa 6 checklist integrasi.

### 5.4 Batas penyimpanan media yang harus disadari sebelum menambah format

Karena berkas disimpan sebagai base64 di kolom tabel (§2.7), ada tiga batas keras: ukuran unggah maksimum 25 MB, overhead sekitar 33%, dan tidak adanya dukungan `Range`/streaming sehingga pembaca harus mengunduh seluruh berkas sebelum halaman pertama tampil. EPUB, kitab besar, dan unduhan offline tidak layak dikerjakan sebelum media dipindahkan ke object storage.

### 5.5 Manfaatkan yang sudah ada, jangan bangun ulang

Sebelum menulis modul baru, periksa §2.9: periodisasi paket (`planDaysFromPeriod`), kode referral (`ref_code`), metadata perangkat (`push_subscriptions`), jalur siaran pengumuman (`sendEventAnnouncementNow` + `reminder_sent_at`), dan katalog paket (`SUBSCRIPTION_PLANS`) sudah tersedia. Beberapa kandidat fitur di §3 pada praktiknya hanya perlu "menyalakan" plumbing tersebut, bukan menambah tabel dan rute baru.

### 5.6 Setiap endpoint sensitif baru wajib memperbarui aturan service worker

Service worker memakai daftar kecuali (`public/sw.js:52-59`) yang tidak memuat `/api/payments/`, sehingga gambar QR pembayaran justru ikut tersimpan di CacheStorage (VULN-21 di `Security-and-Fixing.md`). Karena polanya deny-list, endpoint sensitif baru apa pun — misalnya riwayat anotasi, kuis, atau sertifikat pada §3 — akan otomatis tercache kecuali daftar itu diperbarui. Lebih aman membalik pendekatannya: allow-list eksplisit untuk jalur yang boleh dicache, dan jangan pernah menyimpan respons ber-`Cache-Control: private`.

### 5.7 Deklarasikan batas panjang untuk setiap bidang baru

`jsonBody` membatasi body 1 MB (`server/middleware/security.js:29`) dan skema zod belum memakai `.max()` (VULN-27). Jadi setiap bidang teks baru yang muncul dari fitur di §3 — catatan, ulasan, kutipan, deskripsi kuis — harus mendeklarasikan batas panjangnya sendiri, bukan mengandalkan batas body. Perhatikan juga bahwa tabel baru otomatis ber-RLS (§5.1) dan endpoint baru perlu ditambahkan ke daftar limiter serta aturan cache.

---

## 6. Yang belum diperiksa

Dokumen naskah (`document skripsi/`) dan folder `Research Design/` belum dibuka pada analisis ini. Pemetaan fitur ke bab pembahasan — khususnya Bab IV dan Bab V — masih perlu diselaraskan dengan isi naskah, agar fitur yang dikerjakan benar-benar mendukung rumusan masalah dan bukan menjadi pekerjaan tambahan yang tidak terpakai di sidang.

Putaran kedua sudah menutup sisi kode: penyimpanan media, penegakan masa berlaku langganan, notifikasi push, katalog publik, panel admin, dan konfigurasi pengembangan semuanya sudah diperiksa. Putaran ketiga menambahkan lapisan yang sebelumnya terlewat — cache service worker, siklus hidup token sesi, validasi bidang media/profil, higiene log, dan konfigurasi alat — sehingga kandidat pada §3 tidak lagi bersandar pada asumsi. Yang tersisa hanya sinkronisasi dengan naskah dan keputusan prioritas Anda.
