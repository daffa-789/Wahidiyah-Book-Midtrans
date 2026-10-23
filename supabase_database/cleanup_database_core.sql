-- ════════════════════════════════════════════════════════════════════════════
-- SKRIP PEMBERSIHAN BASIS DATA (CORE CLEANUP)
-- Jalankan di SQL Editor Supabase untuk merapikan database yang sedang aktif.
-- AMAN: Tidak menghapus data pengguna, transaksi, atau buku yang sudah ada.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Hapus tabel-tabel yang sudah tidak digunakan (bekas fitur lama / redundan)
DROP TABLE IF EXISTS public.ads CASCADE;
DROP TABLE IF EXISTS public.password_resets CASCADE;
DROP TABLE IF EXISTS public.qris_transactions CASCADE;
DROP TABLE IF EXISTS public.user_bookmarks CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

-- 2. Hapus indeks kategori buku jika ada
DROP INDEX IF EXISTS public.idx_books_category;

-- 3. Hapus kolom-kolom yang tidak diperlukan dari tabel books agar ringkas
ALTER TABLE public.books
    DROP COLUMN IF EXISTS subtitle,
    DROP COLUMN IF EXISTS author,
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS total_pages,
    DROP COLUMN IF EXISTS thumbnail_url;

-- 4. Muat ulang cache skema PostgREST Supabase
NOTIFY pgrst, 'reload schema';
