-- ==============================================================================
-- Migrasi: Penambahan Dukungan Nomor Telepon (WhatsApp) pada Tabel Users
-- Branch: Whatsaap-authenticator
-- ==============================================================================

-- 1. Tambah kolom phone ke tabel public.users jika belum ada
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE DEFAULT NULL;

-- 2. Buat indeks untuk mempercepat pencarian akun berdasarkan nomor telepon
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 3. Komentar dokumentasi kolom
COMMENT ON COLUMN public.users.phone IS 'Nomor telepon/WhatsApp pengguna dalam format internasional 628xxx';
