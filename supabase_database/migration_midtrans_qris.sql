-- ─────────────────────────────────────────────────────────────
-- Migrasi ADDITIF untuk integrasi Midtrans Core API QRIS.
-- Aman dijalankan BERULANG (idempoten) dan TIDAK menghapus data.
--
-- Cara pakai: buka Supabase → SQL Editor → tempel isi file ini → Run.
--
-- CATATAN: JANGAN jalankan full_setup.sql untuk migrasi ini —
--          file itu berisi DROP TABLE ... CASCADE dan akan menghapus data.
--
-- Hasil: menambahkan 4 kolom Midtrans ke tabel `transactions`
--        yang sudah ada (tabel TIDAK dibuat/diubah strukturnya).
-- ─────────────────────────────────────────────────────────────

-- Referensi transaction_id dari Midtrans (mis. "3c8e7ad1-4814-4cec-96b2-e84e7643527b")
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(100);

-- URL gambar QR dari Midtrans (actions[generate-qr-code-v2]) — dipakai sebagai CADANGAN
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_qr_url TEXT;

-- Payload QR mentah EMVCo (qr_string) — sumber UTAMA untuk merender QRIS di klien.
-- Kolom ini yang membuat QR bisa digambar sebagai SVG tajam tanpa request gambar.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_qr_string TEXT;

-- Batas waktu berlaku QR (default 15 menit)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Indeks bantu pencarian berdasarkan id transaksi Midtrans
CREATE INDEX IF NOT EXISTS idx_transactions_midtrans_transaction_id
  ON public.transactions (midtrans_transaction_id);

-- Paksa PostgREST memuat ulang skema cache.
-- Tanpa ini, REST API bisa masih menganggap kolom baru "does not exist".
NOTIFY pgrst, 'reload schema';
