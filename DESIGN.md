# Design System Specification — Wahidiyah Book & Digital Library
**Document Version:** 3.0.0  
**Status:** Living Design System & Production Architecture  
**Target:** Skripsi Perpustakaan Digital Wahidiyah + Integrasi Pembayaran Real Midtrans Core API  
**Single Source of Truth:** [`Master_Memory_Workflow.md`](./Master_Memory_Workflow.md)

---

## 1. Visual Atmosphere & Design POV

Wahidiyah Book adalah platform perpustakaan digital dan komunitas spiritual untuk pengamal Sholawat Wahidiyah. Antarmukanya mencerminkan nilai-nilai:
* **Berwibawa & Teduh (Sacred & Serene):** Tidak berisik seperti SaaS modern generik, melainkan memiliki ketenangan manuskrip klasik dan kehangatan ruang baca perpustakaan pesantren.
* **Presisi Akademis (Academic Rigor):** Tipografi teks dan sitasi yang rapi, layout hierarkis terstruktur, keterbacaan tinggi untuk membaca PDF kitab tebal berjam-jam tanpa kelelahan mata.
* **Kepercayaan Transaksi Finansial (Midtrans Trust):** Alur checkout QRIS dan keanggotaan Pro yang transparan, aman, responsif, dan memberikan umpan balik instan.

### Tiga Dial Desain (Core Configuration)
* **`DESIGN_VARIANCE: 6`** — Keseimbangan antara keteraturan editorial katalog buku dan dinamika kartu asimetris pada hero section.
* **`MOTION_INTENSITY: 4`** — Gerakan halus, berpijak pada spring physics alami (`stiffness: 120, damping: 20`). Tanpa animasi berulang yang mengganggu kekhusyukan membaca.
* **`VISUAL_DENSITY: 5`** — Ruang bernapas yang cukup pada halaman bacaan dan katalog, namun ringkas dan efisien pada tabel administrasi dan data transaksi.

---

## 1.5 3 Color Key & Prinsip 60-30-10 (Wajib Semua Route)

Seluruh route — auth (login, register, OTP, lupa password, callback), katalog & beranda, pembayaran Midtrans, profil, hingga admin — **wajib** memakai TIGA color key dari Tema 1 "Editorial Elegan" dengan distribusi proporsi **60-30-10**:

| Peran | Proporsi | Warna | Token Tailwind | Pemakaian |
|---|---|---|---|---|
| **Dominan** | ±60% | Krem Hangat `#FBF8F3` | `cream-*`, `ui-bg/surface/card`, `ink-*` | Latar kanvas, kartu, panel, teks, border |
| **Sekunder** | ±30% | Hijau Zamrud Tua `#14523A` | `brand-*`, `primary` | Sidebar, tombol aksi, header, ikon, state aktif |
| **Aksen** | ±10% | Emas Antik `#B8860B` | `gold-*`, `accent-gold` | Lencana PRO, highlight, ornamen, detail premium |

Aturan penerapan:
* **Status fungsional** (sukses, peringatan, error, info — termasuk badge transaksi Midtrans `SETTLEMENT`/`PENDING`/`EXPIRE`) memakai token `semantic-success/warning/danger/info` — bukan warna dekoratif, dan tidak dihitung dalam proporsi 60-30-10.
* **DILARANG** memakai kelas palet Tailwind mentah (`slate-*`, `gray-*`, `zinc-*`, `indigo-*`, `violet-*`, `rose-*`, `red-*`, `blue-*`, `amber-*`, `emerald-*`, `teal-*`, dst.) untuk warna struktural; semua warna struktural wajib melewati token.
* **Pengecualian terdokumentasi:** logo Google multicolor pada tombol OAuth, logo resmi metode pembayaran (QRIS, BCA, BRI, dll.) di `public/payments/`, bendera negara, serta token merah QRIS `qris-600/700` (`#E30613`/`#C00511` — kemasan merah resmi QRIS, sengaja *fixed* dan tidak mengikuti tema; dipakai header kartu pembayaran QRIS, bukan sebagai status) — brand pihak ketiga tidak diubah.
* **Mode malam** tetap mengikuti proporsi yang sama melalui variable tema (charcoal hangat menggantikan krem, zamrud dinaikkan terangnya agar tetap terbaca sebagai teks).

---

## 2. 6 Koleksi Tema Terkalibrasi (Theme Palettes)

Semua tema dirancang anti-slop (bebas dari gradien neon ungu/biru AI, bebas dari hitam mati murni `#000000`, dan bebas dari putih silau `#FFFFFF`).

### Tema 1: Editorial Elegan (Default Skripsi — Emerald Heritage)
*Karakter:* Tradisional, berwibawa, prestisius. Terinspirasi dari jilid kitab klasik kulit beraksen emas.
* **Primary (Brand):** Hijau Zamrud Tua (`#14523A`, hover `#0E3D2C`, light `#DCEDE4`)
* **Background:** Krem Hangat Alami (`#FBF8F3`, surface `#F7F2E9`, card `#FFFDFA`)
* **Accent Gold:** Emas Antik Halus (`#B8860B`, highlight `#D4AF4F`)
* **Text / Ink:** Tinta Arang Hangat (`#1D1B17`, secondary `#5A544C`, muted `#7C756C`)
* **Border:** Garis Krem Lembut (`#E4D9C6`)

### Tema 2: Modern Sage Islamic (Clean Contemporary Sand)
*Karakter:* Minimalis, sejuk, lapang. Menggabungkan estetika studio arsitektur Skandinavia dengan keteduhan Islam modern.
* **Primary (Brand):** Sage Green Teduh (`#2D5A46`, hover `#1F3E30`, light `#E4EDE7`)
* **Background:** Pasir Halus / Warm Sand (`#F8F7F4`, surface `#EFECE6`, card `#FFFFFF`)
* **Accent Bronze:** Perunggu Muted (`#A37D45`, hover `#8C6834`)
* **Text / Ink:** Slate Hitam Teduh (`#1A201D`, secondary `#525E57`, muted `#7E8B84`)
* **Border:** Batu Alami Terang (`#DFDDD7`)

### Tema 3: Royal Islamic Blue & Amber (Lapis Lazuli Heritage)
*Karakter:* Intelektual, ningrat, terinspirasi dari iluminasi manuskrip Al-Qur'an dan keramik Dinasti Abbasiyah.
* **Primary (Brand):** Biru Safir Persia / Lapis Lazuli (`#1E3A5F`, hover `#142740`, light `#DBE6F2`)
* **Background:** Pualam Putih Lembut / Alabaster (`#F9F9F6`, surface `#F1F2EE`, card `#FFFFFF`)
* **Accent Gold:** Amber Ochre Bercahaya (`#C88A2C`, hover `#B0741E`)
* **Text / Ink:** Arang Kebiruan Dalam (`#151B22`, secondary `#4A5568`, muted `#718096`)
* **Border:** Platinum Lembut (`#DEE2E6`)

### Tema 4: Spiritual Twilight (Midnight Obsidian Oasis)
*Karakter:* Khusus mode malam, hening, dirancang untuk mujahadah malam hari tanpa radiasi cahaya biru yang menyilaukan.
* **Primary (Brand):** Giok Luminesen Hijau (`#34D399`, dark `#10B981`, deep base `#12291F`)
* **Background:** Obsidian Hutan Malam (`#0C1612`, surface `#13221C`, card `#1B2D26`)
* **Accent Amber:** Lilin Emas Lembut (`#F3C766`, hover `#E5B64E`)
* **Text / Ink:** Putih Pasir Hangat (`#E8ECE9`, secondary `#A3B5AC`, muted `#6E8076`)
* **Border:** Zamrud Gelap Muted (`#273F34`)

### Tema 5: Monochrome Academic Litho (Warm Paper & Carbon)
*Karakter:* Tipe cetak monograf perpustakaan nasional, fokus mutlak pada tipografi dan bobot teks.
* **Primary (Brand):** Karbon Linotype (`#181818`, hover `#000000`, light `#E6E4DD`)
* **Background:** Kertas Cetak Litografi (`#F5F3EF`, surface `#EBE7DF`, card `#FAFAF7`)
* **Accent Ochre:** Tinta Stempel Kayu (`#8C6239`, hover `#734F2C`)
* **Text / Ink:** Tinta Cetak Hitam Pekat (`#161616`, secondary `#57544E`, muted `#827E77`)
* **Border:** Serat Kertas Kering (`#DCD7CB`)

### Tema 6: Terracotta & Olive Nusantara (Tradisional Kontemporer)
*Karakter:* Membumi, hangat, mencerminkan bata merah pesantren Jawa dan dedaunan pohon trembesi.
* **Primary (Brand):** Zaitun Hutan Pesantren (`#3B4E3E`, hover `#2B3B2E`, light `#E6EDE7`)
* **Background:** Kertas Beras Krem (`#FAF7F2`, surface `#F2ECE2`, card `#FFFFFF`)
* **Accent Terracotta:** Tanah Liat Hangat (`#B4533C`, hover `#9A3F2A`)
* **Text / Ink:** Tinta Umber Gelap (`#231E1B`, secondary `#5E534D`, muted `#8A7E77`)
* **Border:** Bata Krem Pudar (`#E2D8CC`)

---

## 3. Tipografi & Hirarki Skala

* **Display / Judul:** Serif bermartabat (*Newsreader*, *Cinzel*, atau *Playfair*) dipadu dengan *Plus Jakarta Sans* untuk keterbacaan modern.
* **Body / Teks Bacaan:** *Plus Jakarta Sans* (400 Regular / 500 Medium / 600 SemiBold), `line-height: 1.65`, batas maksimal paragraf `65ch`.
* **Ayat & Kaligrafi Arab:** Font *Amiri* atau *Scheherazade New*, ukuran proporsional 1.3x lebih besar dibanding teks latin dengan ruang vertikal yang lapang untuk harakat.
* **Monospace / Angka Finansial:** *JetBrains Mono* untuk nomor referensi Midtrans, nominal QRIS (tabular numbers), kode transaksi, dan indeks halaman buku.

---

## 4. Arsitektur Navigasi Terpadu (Responsive Design)

### 4.1 Navigasi Desktop (Sidebar Ramping)
* **Lebar Terbuka:** `218px` (ringkas dan pas dengan kanvas konten)
* **Lebar Terlipat (Collapsed):** `68px` (hanya menampilkan ikon + tooltip cerdas)
* **Grup Menu:**
  1. **Utama:** Beranda (Home), Kalender Mujahadah, Langganan Pro.
  2. **Akun & Profil:** Profil Pengamal (Hub Akun terpadu yang memuat Riwayat, Bantuan, dan Tentang).
  3. **Administrasi:** Overview Metrik, Manajemen Kitab, Data Anggota, Kalender Acara, Banner Carousel, Log Sistem.
* **Penyederhanaan UI:** Menu sekunder (Tentang, Pusat Bantuan, Riwayat Langganan) serta badge tombol EB yang redundan telah dihilangkan dari sidebar, dikoordinasikan secara rapi di dalam Hub Profil.
* **Indikator Aktif:** Bar vertikal 3px di sisi kiri + latar belakang tinted brand dengan transisi 200ms.

### 4.2 Universal Sticky Top Back Button Header (`DeviceFrame.jsx`)
* Header navigasi sub-halaman hadir seragam di **Desktop, Tablet, dan Mobile** (`← [Judul]`) untuk rute:
  - `/about`: `← Tentang Aplikasi`
  - `/help`: `← Pusat Bantuan`
  - `/riwayat`: `← Riwayat Langganan`
  - `/profile`: `← Profil`
* **Penempatan & Margin Responsif:** Terletak di bagian atas konten dengan penyesuaian margin kiri terhadap sidebar (`md:ml-[218px]` terbuka, `md:ml-[68px]` ciut), menjamin posisi yang selalu sejajar dan tidak tumpang tindih.
* **Smart Navigation Fallback:** Memanfaatkan `window.history.back()` jika terdapat riwayat jelajah sebelumnya, atau otomatis fallback ke Hub Profil / Beranda.

### 4.3 Navigasi Mobile (Bottom Dock Bar)
* Bar melayang di bagian bawah dengan radius `20px` dan bayangan lembut.
* 4 tombol utama: Beranda, Kalender, Pro (dengan lencana bintang emas), dan Profil.
* Target sentuh minimal `44px × 44px` sesuai standar aksesibilitas mobile WCAG.

---

## 5. Layar Wireframe Inti

1. **Katalog & Beranda (Home):**
   * Banner pahlawan (Hero Carousel) dinamis dan minimalis.
   * Kartu buku minimalis ala e-reader modern (Moco-style): rasio proporsional, sampul jilid dominan, judul kitab tegas, tanpa label penulis generik, badge status PRO emas, dan status keterbacaan.
   * Navigasi pencarian instan yang cepat dan terfokus.
2. **Universal Document Reader (PDF & DOCX):**
   * **Continuous Vertical Scroll Canvas:** Menggunakan Mozilla PDF.js murni dengan gulir vertikal kontinyu, auto scroll-spy sinkronisasi halaman, kanvas berasio aspek tetap, pelacak persentase zoom real-time, dan titik jangkar baca (*reading anchor*) yang menjaga posisi teks saat perbesaran.
   * Bilah kontrol atas: nomor halaman, zoom in/out berdampingan dengan layar penuh (*fullscreen*), tema kertas (Terang, Sepia Hangat, dan Malam).
   * Mesin render ganda: PDF.js untuk naskah .pdf dan Mammoth engine untuk konversi instan berkas Word .docx ke HTML semantik terproteksi.
   * Lapisan proteksi hak cipta: tanda air dinamis nama pembaca & ID transaksi, pelarangan klik kanan (`contextmenu`), dan penonaktifan seleksi teks (`user-select: none`).
3. **Membership Pro & Alur Midtrans QRIS:**
   * Paket Pro tunggal terstandarisasi (Rp 25.000/bulan) tanpa tiering membingungkan.
   * Tampilan scan QRIS EMVCo dinamis dengan timer hitung mundur 15 menit, tombol unduh PNG resolusi tinggi untuk pemindaian via galeri perbankan (BCA, Mandiri, DANA, GoPay).
   * Fitur kemudahan pengujian: Tombol *"Salin Kode QR String"* dan link langsung ke *Midtrans QRIS Simulator*.
   * Tombol *"▶ Bayar Sekarang (Mode Simulasi)"* langsung di UI (`ALLOW_PAYMENT_SIMULATION=1`) untuk demo sidang skripsi yang lancar dan terkontrol.
   * **Faktur Kwitansi Pembayaran Resmi (A4 Client-Side PDF):**
     - Dibuat instan di sisi klien via pustaka `jspdf` tanpa dialog print peramban.
     - Desain elegan A4 resmi ber-branding hijau zamrud tua, metadata 2 kolom rapi, rincian pembayaran, dan stempel verifikasi digital resmi.
     - Riwayat langganan dilengkapi fallback otomatis ke tabel transaksi sehingga riwayat transaksi tidak pernah kosong.
4. **Kalender Kegiatan Mujahadah:**
   * Matriks kalender bulanan interaktif dengan agenda majelis dan sinkronisasi zona waktu `Asia/Jakarta`.
   * Pemisahan teks nama lokasi dengan tautan navigasi presisi Google Maps.
5. **Admin Management Dashboard (Modular Sub-Tabs):**
   * Dekomposisi 6 sub-tab terisolasi: `OverviewTab`, `BooksTab`, `UsersTab`, `EventsTab`, `CarouselTab`, `LogsTab`.
   * Formasi metrik 3+2: 3 kartu baris atas (Anggota Terdaftar, Total Pendapatan, Kitab Digital) dan 2 kartu baris bawah (Transaksi Sukses, Pembaca Aktif).
   * Grafik visual analitik tren pendapatan dan pertumbuhan anggota berbasis Recharts.
   * Ekspor 1-klik ke Microsoft Excel (`.xlsx`) terpusat pada tab Overview.
6. **Cupertino Inset Grouped Profile Hub (`EditProfileScreen.jsx`):**
   * Tata letak modern terinspirasi iOS/Cupertino Inset Grouped design.
   * Seksi Data Akun di paling atas dengan kartu profil taktil yang elegan, tombol ubah kata sandi, dan switch slider tema gelap/terang.
   * Menu navigasi sub-halaman: Riwayat Langganan & Transaksi, Pusat Bantuan (bersih tanpa judul ganda), dan Tentang Aplikasi (bersih tanpa logo besar).
   * Tombol Keluar dengan label yang jelas dan penanganan sesi aman.
7. **Autentikasi Pengguna:**
   * Formulir login, pendaftaran, dan pemulihan kata sandi yang bersih dan proporsional.
   * Tombol registrasi sederhana dengan label tunggal *"Daftar"*.
   * Verifikasi OTP registrasi via email terverifikasi, serta alokasi WhatsApp sebagai fallback pemulihan lupa sandi.

---

## 6. Anti-Patterns & Standar Kualitas (Banned Clichés)

* **DILARANG:** Gradien ungu-neon atau biru AI (`linear-gradient(to right, #8B5CF6, #EC4899)`).
* **DILARANG:** Hitam pekat murni `#000000` atau putih silau `#FFFFFF` sebagai kanvas utama.
* **DILARANG:** Baris 3 kartu identik tanpa ritme komposisi.
* **DILARANG:** Teks placeholder generik seperti *Lorem Ipsum*, nama palsu *John Doe* atau *Acme Corp*.
* **DILARANG:** Animasi tak beralasan yang memakan beban prosesor.
* **DILARANG:** Kelas warna palet Tailwind mentah di luar token design system (mis. `bg-gray-100`, `text-slate-600`, `bg-indigo-50`, `text-emerald-700`); gunakan token `brand/cream/ink/ui/gold/semantic` sesuai seksi 1.5.
* **WAJIB:** Rasio kontras teks minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar (17 pasangan WCAG AA lulus).
* **WAJIB:** Penggunaan tripel RGB CSS variables yang kompatibel langsung dengan Tailwind CSS `rgb(var(--brand-700) / <alpha>)`.
