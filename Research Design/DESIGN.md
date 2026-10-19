# Design System Specification — Wahidiyah Book & Digital Library
**Document Version:** 2.6.0  
**Status:** Living Design System & Theme Research Suite  
**Target:** Skripsi Perpustakaan Digital Wahidiyah + Integrasi Pembayaran Real Midtrans Core API  
**Path:** `Research Design/`

---

## 1. Visual Atmosphere & Design POV

Wahidiyah Book adalah platform perpustakaan digital dan komunitas spiritual untuk pengamal Sholawat Wahidiyah. Antarmukanya harus mencerminkan nilai-nilai:
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
* **Monospace / Angka Finansial:** *JetBrains Mono* untuk nomor rekening VA Midtrans, nominal QRIS (tabular numbers), kode transaksi, dan indeks halaman buku.

---

## 4. Arsitektur Navigasi Terpadu

### 4.1 Navigasi Desktop (Sidebar)
* **Lebar Terbuka:** `248px`
* **Lebar Terlipat (Collapsed):** `68px` (hanya menampilkan ikon + tooltip cerdas)
* **Grup Menu:**
  1. **Utama:** Beranda (Home), Kalender Mujahadah, Langganan Pro, Pusat Bantuan, Tentang.
  2. **Akun:** Profil Pengamal, Riwayat Langganan & Transaksi, Logout.
  3. **Administrasi:** Overview Metrik, Manajemen Kitab, Data Anggota, Kalender Acara, Banner Carousel, Log Sistem.
* **Indikator Aktif:** Bar vertikal 3px di sisi kiri + latar belakang tinted brand dengan transisi 200ms.

### 4.2 Navigasi Atas (Top Header Bar)
* Menampilkan BrandMark SVG inline resmi Wahidiyah Book.
* Breadcrumbs dinamis sesuai halaman aktif.
* Global search trigger dengan shortcut keyboard `Ctrl + K`.
* Pill status sinkronisasi backend: `Midtrans Sandbox Connected` & `Supabase Database Online`.
* Audio player widget mini untuk melantunkan Sholawat Wahidiyah secara kontinyu saat membaca.
* Theme quick switcher & Device View Switcher (Desktop vs Mobile Preview).

### 4.3 Navigasi Mobile (Bottom Dock Bar)
* Bar melayang di bagian bawah dengan radius `20px` dan bayangan lembut.
* 4 tombol utama: Beranda, Kalender, Pro (dengan lencana bintang emas), dan Profil.
* Target sentuh minimal `44px × 44px` sesuai standar aksesibilitas mobile WCAG.

---

## 5. Layar Wireframe Inti

1. **Katalog & Beranda (Home):**
   * Banner pahlawan (Hero) dengan pengumuman Mujahadah Kubro Kedunglo.
   * Filter kategori multi-chips: Tasawuf, Kuliah Wahidiyah, Kitab Kuning, Doa & Dzikir, dsb.
   * Kartu buku dengan rasio 3:4.2, tulang buku realistis, lencana PRO emas, dan status progres baca.
2. **Digital PDF Reader:**
   * Bilah kontrol atas: daftar isi, zoom in/out, tema kertas (putih/sepia/malam), bookmark.
   * Lembar bacaan dengan kutipan kaligrafi Sholawat Wahidiyah berharakat lengkap dan terjemahan.
   * Bilah bawah dengan scrubber halaman (contoh: Hal 42 / 180) dan persentase selesai.
3. **Membership Pro & Alur Midtrans QRIS:**
   * Komparasi paket Santri Gratis vs Pro Pengamal (Rp15.000/bln) vs Donatur Abadi.
   * Pilihan metode bayar: QRIS Midtrans, BCA VA, BRI VA, SeaBank, E-Wallet.
   * Tampilan scan QRIS interaktif dengan timer hitung mundur 15 menit dan simulasi webhook sukses.
   * Kuitansi digital otomatis saat transaksi sukses.
4. **Kalender Kegiatan Mujahadah:**
   * Matriks kalender bulanan interaktif.
   * Daftar kegiatan: Mujahadah Kubro Kedunglo, Mujahadah Usbuiyah Wilayah, Haul Muallif.
   * Pengingat in-app notification switch.
5. **Admin Management Dashboard:**
   * Kartu KPI statistik: Anggota terdaftar, Akumulasi QRIS, Buku terbit, Pembaca aktif.
   * Tabel transaksi Midtrans lengkap dengan badge status (`SETTLEMENT`, `PENDING`, `EXPIRE`).
   * Modal input tambah/edit buku baru.
6. **Profil Pengamal:**
   * Kartu identitas santri/pengamal, lencana Pro aktif, riwayat transaksi, dan preferensi akun.

---

## 6. Anti-Patterns & Standar Kualitas (Banned Clichés)

* **DILARANG:** Gradien ungu-neon atau biru AI (`linear-gradient(to right, #8B5CF6, #EC4899)`).
* **DILARANG:** Hitam pekat murni `#000000` atau putih silau `#FFFFFF` sebagai kanvas utama.
* **DILARANG:** Baris 3 kartu identik tanpa ritme komposisi.
* **DILARANG:** Teks placeholder generik seperti *Lorem Ipsum*, nama palsu *John Doe* atau *Acme Corp*.
* **DILARANG:** Animasi tak beralasan yang memakan beban prosesor.
* **DILARANG:** Kelas warna palet Tailwind mentah di luar token design system (mis. `bg-gray-100`, `text-slate-600`, `bg-indigo-50`, `text-emerald-700`); gunakan token `brand/cream/ink/ui/gold/semantic` sesuai seksi 1.5.
* **WAJIB:** Rasio kontras teks minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar (WCAG AA).
* **WAJIB:** Penggunaan tripel RGB CSS variables yang kompatibel langsung dengan Tailwind CSS `rgb(var(--brand-700) / <alpha>)`.
