# 📘 Panduan Pengembang (Developer Guide) — Wahidiyah Book

Selamat datang di panduan pengembang **Wahidiyah Book**. Dokumen ini dirancang agar siapa pun pengembang yang membaca atau melanjutkan proyek ini dapat memahaminya dengan cepat, mudah, dan tanpa pusing.

---

## 💡 Filosofi & Teknologi (Murni JS & React JSX — Tanpa Angular)

Proyek ini sengaja dibangun menggunakan fondasi web modern yang ringan, stabil, dan mudah dipahami:
- **Frontend**: **React 18** murni (`.jsx` dan `.js`) + **Vite** (Single Page Application / SPA) + **Tailwind CSS**.
  > *Catatan: Tidak menggunakan Angular, Next.js, TypeScript, atau meta-framework berat lainnya. Semua alur state dan render menggunakan standar React Hooks dan komponen JSX.*
- **Backend**: **Node.js** + **Express.js** murni (`.js`) dengan struktur rute standar (`server/routes/`).
- **Database**: **Supabase Cloud** (PostgreSQL) melalui client `@supabase/supabase-js`.
- **Payment Gateway**: **Midtrans Core API** (Mode Sandbox QRIS Real-time).

---

## 📂 Struktur Direktori Proyek

```text
├── docs/                       # Dokumentasi teknis sistem
│   ├── ARCHITECTURE.md         # Diagram sistem, alur data & arsitektur client-server
│   ├── API_SPECIFICATION.md    # Kontrak dan spesifikasi endpoint REST API
│   └── DEVELOPER_GUIDE.md      # Panduan developer (berkas ini)
├── scripts/                    # Skrip pembantu operasional
│   ├── dev.js                  # Menjalankan frontend + backend di mode pengembangan
│   ├── start.js                # Menjalankan server tunggal di mode produksi (port 5000)
│   └── get-gmail-token.js      # Generator refresh token OAuth2 Gmail
├── server/                     # Backend API (Murni Node.js Express .js)
│   ├── auth.js                 # Helper otentikasi, JWT, OTP, dan hashing password
│   ├── config.js               # Validasi & pemuatan variabel lingkungan (.env)
│   ├── db.js                   # Client Supabase PostgreSQL Server
│   ├── middleware/             # Middleware otentikasi JWT, role check, upload Multer
│   ├── lib/                    # Helper formatting, image processing (Sharp), konstanta
│   ├── routes/                 # Rute Express standar yang menangani endpoint & database
│   │   ├── auth.routes.js      # Endpoint login, registrasi, OTP, dan Google OAuth
│   │   ├── books.routes.js     # Endpoint katalog buku, upload PDF, dan thumbnail
│   │   ├── payments.routes.js  # Endpoint transaksi Midtrans QRIS & status
│   │   ├── stats.routes.js     # Endpoint statistik & analitik admin
│   │   └── ...
│   └── server.js               # Entry point Express, registrasi rute & penyajian file statis
├── src/                        # Frontend UI (Murni React 18 .jsx dan .js)
│   ├── assets/                 # Ikon, logo, dan gambar statis
│   ├── context/                # Pengelola State Global React
│   │   ├── slices/             # Modular Slice Hooks (useCatalogSlice, usePaymentSlice, dll)
│   │   └── AppContext.jsx      # Orkestrator utama, menyediakan hook useApp()
│   ├── features/               # Halaman & Komponen Fitur JSX
│   │   ├── admin/              # Panel Manajemen Admin
│   │   ├── auth/               # Layar Login, Registrasi & Verifikasi OTP
│   │   ├── books/              # Komponen Detail Buku & Reader PDF/EPUB
│   │   ├── calendar/           # Kalender Kegiatan & Mujahadah
│   │   └── profile/            # Pengaturan Akun & Riwayat Langganan
│   ├── lib/                    # Helper frontend (api client, normalizers, formatters)
│   ├── ui/                     # Komponen UI atomik/reusable (Modal, Button, Input, Card)
│   ├── App.jsx                 # Komponen akar React
│   └── main.jsx                # Entry point render React DOM
├── supabase_database/          # Skrip Skema SQL Supabase
│   └── full_setup.sql          # Skrip instalasi lengkap database (tabel, RLS, view, indeks)
├── .env.example                # Template variabel lingkungan
└── package.json                # Dependensi & skrip npm
```

---

## 🚀 Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- **Node.js**: Versi `>= 18.0.0` (disarankan LTS v20 atau v22).
- Konfigurasi berkas `.env` sudah terisi dengan kredensial Supabase dan Midtrans Sandbox.

### 2. Mode Pengembangan (*Development*)
Jalankan perintah berikut:
```bash
npm run dev
```
Perintah ini akan menyalakan server Express di port `5000` dan Vite HMR di port `3000`. Akses UI di `http://localhost:3000`.

### 3. Mode Produksi (*Production*)
Jalankan perintah berikut:
```bash
npm run start
```
Perintah ini akan secara otomatis memastikan frontend sudah di-build ke folder `dist/` dan Express akan menyajikan aplikasi penuh di port `5000` (`http://localhost:5000`).

---

## 🛠️ Panduan Menambah Fitur Baru (Simpel & Cepat)

Untuk menambah fitur baru secara rapi dan standar Express + React:

### Langkah 1: Daftarkan Rute di Express (`server/routes/`)
Buat file rute baru di `server/routes/` atau tambahkan endpoint ke file rute yang sudah ada:
```javascript
// Contoh: server/routes/bookmarks.routes.js
import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { requireAuth } from '../auth.js';

export const bookmarksRouter = Router();

bookmarksRouter.get('/bookmarks', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseServer
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, bookmarks: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```
Daftarkan `bookmarksRouter` di `server/server.js`:
```javascript
app.use('/api', bookmarksRouter);
```

### Langkah 2: Tambahkan State di Frontend Slice (`src/context/slices/`)
Buat custom hook untuk mengelola data fitur tersebut:
```javascript
// Contoh: src/context/slices/useBookmarkSlice.js
import { useState, useCallback } from 'react';
import { api } from '../../lib/api';

export function useBookmarkSlice(token) {
  const [bookmarks, setBookmarks] = useState([]);

  const fetchBookmarks = useCallback(async () => {
    if (!token) return;
    const res = await api.get('/api/bookmarks', token);
    if (res.success) setBookmarks(res.bookmarks);
  }, [token]);

  return { bookmarks, fetchBookmarks };
}
```
Lalu sambungkan slice ini di `src/context/AppContext.jsx` ke dalam objek `value` yang dikembalikan oleh `useApp()`.

### Langkah 3: Tampilkan di Komponen JSX (`src/features/`)
Gunakan hook `useApp()` di komponen React:
```jsx
// Contoh komponen React JSX
import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export function BookmarkList() {
  const { bookmarks, fetchBookmarks } = useApp();

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return (
    <div className="space-y-2">
      {bookmarks.map((item) => (
        <div key={item.id} className="p-3 bg-white rounded-lg shadow-sm">
          {item.title}
        </div>
      ))}
    </div>
  );
}
```

---

## 🛡️ Konvensi Kode & Standar Keamanan

1. **Gunakan Async/Await dengan Try-Catch Bersih**:
   Setiap fungsi async di backend dan frontend wajib menangani potensi error dengan respons JSON yang jelas.
2. **Keamanan Kunci Rahasia**:
   - Kunci sensitif seperti `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` hanya boleh diakses di backend (`server/`).
   - Variabel yang aman dibaca frontend hanya yang berawalan `VITE_` (misalnya `VITE_SUPABASE_ANON_KEY`).
3. **Penyimpanan Password**:
   - Password pengguna wajib di-hash menggunakan `bcryptjs` dengan *salt rounds* 10 sebelum disimpan ke database.
4. **Sanitasi File Upload**:
   - Gambar sampul buku dikonversi dan dikompresi ke format **WebP** via library `sharp` sebelum disimpan.
   - File dokumen buku (PDF/EPUB) diverifikasi tipe kontennya di middleware Multer.

---

## 🔍 Checklist Verifikasi Sebelum Commit

Sebelum melakukan commit atau push:
- [ ] Jalankan `node --check server/server.js` (Memastikan tidak ada galat sintaks di backend).
- [ ] Jalankan `npm run build` (Memastikan bundling Vite React berhasil 100% tanpa error).
