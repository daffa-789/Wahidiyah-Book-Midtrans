-- ─────────────────────────────────────────────────────────────
-- Migrasi ADDITIF untuk integrasi Midtrans Core API QRIS.
-- Aman dijalankan berulang (IF NOT EXISTS) dan TIDAK menghapus data.
--
-- Cara pakai: buka Supabase → SQL Editor → tempel isi file ini → Run.
--
-- CATATAN: jangan jalankan full_setup.sql untuk migrasi ini,
--          file itu berisi DROP TABLE ... CASCADE dan akan menghapus data.
-- ─────────────────────────────────────────────────────────────

-- Menyimpan referensi transaksi dari Midtrans
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(100);

-- URL gambar QR yang dikembalikan Midtrans (actions[generate-qr-code-v2])
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_qr_url TEXT;

-- Batas waktu berlaku QR (default 15 menit)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Indeks bantu untuk pencarian cepat berdasarkan id transaksi Midtrans
CREATE INDEX IF NOT EXISTS idx_transactions_midtrans_transaction_id
  ON public.transactions (midtrans_transaction_id);
