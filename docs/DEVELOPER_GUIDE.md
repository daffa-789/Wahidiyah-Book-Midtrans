# 📘 Panduan Pengembang (Developer Guide) — Wahidiyah Book

Selamat datang di panduan pengembang **Wahidiyah Book**. Dokumen ini dirancang agar siapa pun pengembang yang membaca atau melanjutkan proyek ini dapat memahaminya dengan cepat, mudah, dan tanpa pusing.

---

## 💡 Filosofi & Teknologi (Tanpa Framework Rumit)

Proyek ini sengaja dibangun menggunakan fondasi web modern yang ringan, stabil, dan mudah dipahami:
- **Frontend**: **React 18** murni + **Vite** (Single Page Application / SPA) + **Tailwind CSS**.
  > *Catatan: Tidak menggunakan Angular, Next.js, atau meta-framework berat lainnya. Semua alur state dan render menggunakan standar React Hooks.*
- **Backend**: **Node.js** + **Express.js** murni dengan arsitektur *Service Layer Pattern*.
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
├── server/                     # Backend API (Node.js Express)
│   ├── config.js               # Validasi & pemuatan variabel lingkungan (.env)
│   ├── middleware/             # Middleware otentikasi JWT, role check, upload Multer
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   ├── services/               # [Service Layer] Logika bisnis & manipulasi database
│   │   ├── auth.service.js     # Login, OTP email, registrasi, Google OAuth
│   │   ├── books.service.js    # Katalog buku, upload PDF/EPUB, konversi Sharp WebP
│   │   └── payments.service.js # Integrasi Midtrans QRIS, polling, status webhook
│   ├── routes/                 # [Transport Layer] Definisi rute Express yang ramping
│   │   ├── auth.routes.js
│   │   └── payments.routes.js
│   └── server.js               # Entry point Express, registrasi rute & penyajian file statis
├── src/                        # Frontend UI (Pure React 18)
│   ├── assets/                 # Ikon, logo, dan gambar statis
│   ├── context/                # Pengelola State Global
│   │   ├── slices/             # Modular Slice Hooks
│   │   │   ├── useCatalogSlice.js    # State buku, acara kalender, banner carousel
│   │   │   ├── usePaymentSlice.js    # State checkout, transaksi QRIS, status langganan
│   │   │   └── useNavigationSlice.js # State tab aktif & navigasi layar
│   │   └── AppContext.jsx      # Orkestrator utama, menyediakan hook useApp()
│   ├── features/               # Halaman & Modul Fitur
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

## 🛠️ Panduan Menambah Fitur Baru

Untuk menjaga kode tetap bersih (*Clean Code*) dan mudah dirawat, selalu ikuti 4 langkah ini saat menambahkan fitur baru:

### Langkah 1: Buat Logika Bisnis di Backend Service (`server/services/`)
Jangan menaruh query database atau logika kalkulasi rumit di dalam file route. Buat fungsi di service:
```javascript
// Contoh: server/services/bookmark.service.js
import { supabase } from '../lib/supabaseClient.js';

export const bookmarkService = {
  async getUserBookmarks(userId) {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
};
```

### Langkah 2: Daftarkan Rute di Express (`server/routes/`)
File route bertugas menerima HTTP request, memvalidasi input sederhana, memanggil service, dan mengembalikan JSON:
```javascript
// Contoh: server/routes/bookmark.routes.js
import { Router } from 'express';
import { bookmarkService } from '../services/bookmark.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const bookmarkRouter = Router();

bookmarkRouter.get('/', requireAuth, async (req, res) => {
  try {
    const data = await bookmarkService.getUserBookmarks(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```
Daftarkan `bookmarkRouter` di `server/server.js`:
```javascript
app.use('/api/bookmarks', bookmarkRouter);
```

### Langkah 3: Tambahkan State di Frontend Slice (`src/context/slices/`)
Buat custom hook untuk mengelola state fitur tersebut:
```javascript
// Contoh: src/context/slices/useBookmarkSlice.js
import { useState, useCallback } from 'react';
import { api } from '../../lib/api';

export function useBookmarkSlice(token) {
  const [bookmarks, setBookmarks] = useState([]);

  const fetchBookmarks = useCallback(async () => {
    if (!token) return;
    const res = await api.get('/api/bookmarks', token);
    if (res.success) setBookmarks(res.data);
  }, [token]);

  return { bookmarks, fetchBookmarks };
}
```
Lalu panggil slice ini di `src/context/AppContext.jsx` dan gabungkan ke nilai `value` yang di-export `useApp()`.

### Langkah 4: Tampilkan di Komponen UI (`src/features/`)
Gunakan hook `useApp()` di komponen React:
```jsx
// Contoh komponen React
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
   Setiap fungsi async di backend dan frontend wajib menangani potensi error dengan pesan yang manusiawi.
2. **Keamanan Kunci Rahasia**:
   - Jangan pernah menyematkan `SUPABASE_SERVICE_ROLE_KEY` atau `MIDTRANS_SERVER_KEY` di kode frontend (`src/`).
   - Variabel yang aman dibaca frontend hanya yang berawalan `VITE_` (misalnya `VITE_SUPABASE_ANON_KEY`).
3. **Penyimpanan Password**:
   - Password pengguna wajib di-hash menggunakan `bcryptjs` dengan *salt rounds* 10 sebelum disimpan ke database.
4. **Sanitasi File Upload**:
   - Gambar sampul buku selalu dikonversi dan dikompresi ke format **WebP** via library `sharp` sebelum disimpan ke bucket storage.
   - File dokumen buku (PDF/EPUB) diverifikasi MIME type-nya (`application/pdf`, dll) di layer Multer.

---

## 🔍 Checklist Verifikasi Sebelum Commit

Sebelum melakukan commit atau rilis ke Git:
- [ ] Jalankan `node --check server/server.js` (Memastikan tidak ada galat sintaks di backend).
- [ ] Jalankan `npm run build` (Memastikan bundling Vite berhasil 100% tanpa error).
- [ ] Pastikan tidak ada berkas `.env` atau kredensial rahasia yang ter-track di Git.
