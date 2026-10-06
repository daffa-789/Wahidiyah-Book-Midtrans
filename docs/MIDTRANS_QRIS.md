# Integrasi Midtrans Core API — QRIS (Sandbox)

Dokumen ini menjelaskan alur pembayaran QRIS yang **sudah memakai Midtrans asli**, menggantikan
QRIS simulator buatan sendiri yang sebelumnya berjalan di `localhost:8000`.

---

## 1. Alur pembayaran

```
Pengguna (non-Pro)
  │ pilih paket
  ▼
PaymentConfirmScreen
  │ panggil hook useQrisPayment
  ▼
POST /api/payments/qris/charge        ──► server hitung harga dari SUBSCRIPTION_PLANS
  │                                        server charge ke Midtrans Core API (payment_type: qris)
  ▼                                        simpan transaksi status = pending
Midtrans balas actions[]                simpan URL gambar QR + waktu kedaluwarsa
  │
  ▼
<img src="/api/payments/qris/:orderId/qr.png">   ──► server proxy PNG dari Midtrans (Basic Auth)
  │
  │  pengguna memindai QR / membayar lewat simulator sandbox
  ▼
Polling tiap 3 detik: GET /api/payments/qris/:orderId/status
  │  server menanyakan status langsung ke Midtrans
  ▼
transaction_status = settlement + fraud_status = accept
  │
  ▼
server mengaktifkan membership Pro (activatePaidMembership) — SEKALI SAJA
```

**Satu-satunya sumber kebenaran adalah Midtrans.** Frontend tidak pernah boleh menyatakan
"lunas"; ia hanya menerima `isPaid: true` dari server.

---

## 2. Endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/payments/qris/charge` | JWT | Buat transaksi + charge QRIS |
| GET | `/api/payments/qris/:orderId/status` | JWT | Cek status ke Midtrans, aktifkan Pro kalau lunas |
| GET | `/api/payments/qris/:orderId/qr.png` | JWT | Proxy gambar QR (PNG) |
| POST | `/api/payments/midtrans/notification` | Signature SHA512 | Webhook Midtrans |

Request `charge` hanya perlu `{ planId, phone }`. **Harga tidak pernah dikirim dari client** —
server mengambilnya dari `SUBSCRIPTION_PLANS` di `server/lib/constants.js`
(paket bulanan Rp 25.000 + biaya admin Rp 3.000 = **Rp 28.000**).

---

## 3. Setup

### 3.1 Ambil kunci sandbox
1. Buka https://dashboard.sandbox.midtrans.com
2. Masuk → **Settings → Access Keys**
3. Salin **Server Key** (`SB-Mid-server-…`) dan **Client Key** (`SB-Mid-client-…`)

> Jangan pernah memakai kunci production untuk pengujian.

### 3.2 Isi `.env`
```
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_QRIS_ACQUIRER=gopay
MIDTRANS_QRIS_EXPIRY_MINUTES=15
```
`.env` sudah masuk `.gitignore`, jadi aman. Server key **tidak pernah** dikirim ke browser.

### 3.3 Jalankan migrasi database
Buka Supabase → **SQL Editor** → jalankan isi `supabase_database/migration_midtrans_qris.sql`.
Migrasi ini **additif** (menambah kolom `midtrans_transaction_id`, `midtrans_qr_url`, `expires_at`)
dan aman dijalankan berulang.

> Jangan jalankan `full_setup.sql` untuk ini — file itu berisi `DROP TABLE ... CASCADE`.

### 3.4 Jalankan aplikasi
```bash
npm run dev
```
Vite di port 3000, API di port 5000.

---

## 4. Cara menguji pembayaran di sandbox

Karena komputer development berada di `localhost` (tidak punya URL publik), Midtrans
**tidak bisa** mengirim webhook ke kita. Karena itu aktivasi Pro mengandalkan **polling**
yang dilakukan server — webhook tidak wajib untuk fungsi utama.

1. Login sebagai pengguna yang **belum Pro**.
2. Masuk ke halaman berlangganan → pilih paket → lanjut ke pembayaran.
3. Kode QR harus muncul. Kalau muncul pesan error, cek log server dan pastikan kunci sudah benar.
4. Buka **https://simulator.sandbox.midtrans.com/v2/qris/index**
5. Tempel **URL gambar QR** Midtrans (nilai `qrMidtransUrl` dari respons charge), lalu bayar.
6. Tunggu maksimal ~3 detik. Polling akan mendeteksi `settlement` dan membership Pro aktif otomatis.

### Menguji webhook secara manual
```bash
# signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
ORDER_ID=tx-test123
STATUS_CODE=200
GROSS=28000.00
SERVER_KEY=SB-Mid-server-xxxxxxxx
SIG=$(printf "%s%s%s%s" "$ORDER_ID" "$STATUS_CODE" "$GROSS" "$SERVER_KEY" | sha512sum | cut -d' ' -f1)

curl -X POST http://localhost:5000/api/payments/midtrans/notification \
  -H 'Content-Type: application/json' \
  -d "{\"order_id\":\"$ORDER_ID\",\"status_code\":\"$STATUS_CODE\",\"gross_amount\":\"$GROSS\",\"transaction_status\":\"settlement\",\"fraud_status\":\"accept\",\"signature_key\":\"$SIG\"}"
```
Kirim dua kali — respons harus tetap sukses dan masa aktif Pro **tidak bertambah ganda**.

---

## 5. Catatan penting

- **QR bukan `qr_string`.** Respon charge QRIS Midtrans hanya berisi `actions[]` berupa URL gambar
  PNG (`generate-qr-code` tanpa border, `generate-qr-code-v2` dengan border ASPI).
  Kode memilih `generate-qr-code-v2`, fallback ke `generate-qr-code`.
- Masa berlaku QR default **15 menit** — sama dengan hitungan mundur di UI.
- `orderId` dipakai ganda: sebagai primary key `transactions.id` sekaligus `order_id` Midtrans.
- **Idempoten:** pembaruan memakai pola
  `UPDATE ... WHERE id = ? AND status = 'pending'`.
  Kalau tidak ada baris yang terubah, transaksi dianggap sudah diproses dan membership
  **tidak** diaktifkan ulang. Ini mencegah dobel aktivasi dari webhook berulang dan polling.
- Status gagal (`expire` / `cancel` / `deny`) menandai transaksi `rejected`.

---

## 6. Troubleshooting

| Gejala | Kemungkinan |
|---|---|
| "Payment gateway Midtrans belum dikonfigurasi" (503) | `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` masih kosong di `.env` |
| "Midtrans tidak mengembalikan kode QR" (502) | Respons charge tidak berisi `actions[]` — cek log server |
| QR muncul tapi tidak pernah lunas | Pembayaran belum dilakukan di simulator sandbox, atau QR sudah kedaluwarsa |
| Notifikasi ditolak 401 | `signature_key` salah — pastikan urutan `order_id + status_code + gross_amount + ServerKey` |
| Notifikasi 400 | Nominal `gross_amount` tidak sama dengan `total_paid` yang tersimpan |
