# Spesifikasi REST API — Aplikasi Buku Wahidiyah

Dokumen ini mendefinisikan seluruh endpoint REST API yang disediakan oleh backend Express.

* **Base URL:** `http://localhost:5000/api` (Development) / `/api` (Production)
* **Format Request/Response:** `application/json` (kecuali upload multipart)
* **Otentikasi:** Header `Authorization: Bearer <JWT_TOKEN>` untuk rute yang terproteksi.

---

## 1. Otentikasi (`/api/auth`)

### `POST /api/auth/login`
Masuk dengan kredensial email dan password.
* **Body:**
  ```json
  {
    "identifier": "user@email.com",
    "password": "password123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login berhasil",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "usr-12345678",
      "name": "Nama User",
      "email": "user@email.com",
      "role": "user",
      "isPro": false
    }
  }
  ```

---

### `POST /api/auth/register`
Mendaftarkan akun baru dan meminta pengiriman OTP ke email.
* **Body:**
  ```json
  {
    "name": "Nama Lengkap",
    "email": "user@email.com",
    "password": "password123",
    "dob": "1995-08-17"
  }
  ```
* **Response (202 Accepted):**
  ```json
  {
    "success": true,
    "message": "Kode verifikasi telah dikirim ke email Anda dan berlaku 10 menit.",
    "email": "user@email.com"
  }
  ```

---

### `POST /api/auth/verify-registration`
Memvalidasi kode OTP 6-digit untuk menyelesaikan pembuatan akun.
* **Body:**
  ```json
  {
    "email": "user@email.com",
    "code": "123456"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Akun berhasil dibuat.",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

---

### `POST /api/auth/request-password-reset`
Meminta OTP reset password.
* **Body:** `{ "email": "user@email.com" }`
* **Response (200 OK):** `{ "success": true, "message": "..." }`

---

### `POST /api/auth/reset-password`
Mereset password dengan OTP yang valid.
* **Body:**
  ```json
  {
    "email": "user@email.com",
    "code": "123456",
    "password": "newpassword123"
  }
  ```
* **Response (200 OK):** `{ "success": true, "message": "Password berhasil diperbarui." }`

---

### `GET /api/auth/me`
Mengambil data profil pengguna yang sedang login.
* **Header:** `Authorization: Bearer <TOKEN>`
* **Response (200 OK):** `{ "success": true, "user": { ... } }`

---

## 2. Katalog Buku (`/api/books`)

### `GET /api/books`
Mengambil daftar buku (terbuka untuk publik).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "books": [
      {
        "id": "buku-123",
        "title": "Buku Wahidiyah",
        "author": "Penyusun",
        "category": "Umum",
        "pages": 120,
        "is_locked": true,
        "has_thumbnail": true,
        "has_content": true
      }
    ]
  }
  ```

---

### `POST /api/books/upload`
Mengunggah buku baru beserta file thumbnail dan dokumen konten (PDF/EPUB).
* **Header:** `Authorization: Bearer <ADMIN_TOKEN>`
* **Content-Type:** `multipart/form-data`
* **Fields:** `title`, `author`, `category`, `pages`, `is_locked`, `description`
* **Files:** `thumbnail` (gambar max 5MB), `content` (dokumen max 25MB)
* **Response (201 Created):** `{ "success": true, "message": "Buku berhasil diunggah", "bookId": "buku-..." }`

---

### `GET /api/books/:id/content`
Membaca/mengunduh isi buku.
* **Header:** `Authorization: Bearer <TOKEN>`
* **Rules:** Pengguna biasa hanya dapat mengakses buku yang `is_locked: false`. Buku `is_locked: true` membutuhkan akun Pro atau role Admin (403 jika tidak Pro).
* **Response:** Stream konten file PDF/dokumen.

---

## 3. Pembayaran QRIS Midtrans (`/api/payments`)

### `POST /api/payments/qris/charge`
Membuat invoice pembayaran QRIS ke Midtrans.
* **Header:** `Authorization: Bearer <TOKEN>`
* **Body:** `{ "planId": "monthly", "phone": "081234567890" }`
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "orderId": "tx-123456",
    "refNo": "000012345678",
    "qrString": "00020101021226600016ID.CO.GOPAY.WWW0118...",
    "qrImageUrl": "/api/payments/qris/tx-123456/qr.png",
    "amount": 25000,
    "adminFee": 0,
    "totalPaid": 25000,
    "status": "pending",
    "expiredAt": "2026-10-07T22:30:00.000Z"
  }
  ```

---

### `GET /api/payments/qris/:orderId/status`
Mengecek status pembayaran (polling berkala).
* **Header:** `Authorization: Bearer <TOKEN>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "orderId": "tx-123456",
    "status": "settlement",
    "isPaid": true,
    "totalPaid": 25000
  }
  ```

---

### `POST /api/payments/midtrans/notification`
Webhook endpoint untuk menerima HTTP Notification dari server Midtrans.
* **Header:** `Content-Type: application/json`
* **Keamanan:** Verifikasi `signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)`
* **Response (200 OK):** `{ "success": true, "alreadyProcessed": false }`

---

## 4. Keanggotaan & Beranda

* `GET /api/subscriptions/my` — Mengambil riwayat paket langganan pengguna aktif.
* `GET /api/events` — Mengambil daftar agenda kegiatan Wahidiyah.
* `GET /api/carousel` — Mengambil daftar banner aktif di beranda.
* `GET /api/health` — Status kesehatan server dan koneksi database.
