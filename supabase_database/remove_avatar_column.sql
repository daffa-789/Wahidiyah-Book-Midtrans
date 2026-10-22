-- Cabut fitur foto profil: lepas kolom public.users.avatar.
--
-- Jalankan HANYA setelah kode tanpa avatar ter-deploy (commit "cabut foto
-- profil"). Kode lama masih membaca kolom ini; menjalankan skrip lebih dulu
-- akan membuat profil gagal disimpan.
--
-- Supabase Studio → SQL Editor → tempel seluruh berkas ini → Run.
-- Aman diulang: semua langkah memakai IF EXISTS / IF NOT EXISTS.

begin;

-- 1. Cadangkan nilai yang masih terisi. Tanpa ini, DROP COLUMN tidak bisa
--    dibatalkan dan foto pengguna hilang permanen.
create table if not exists public.users_avatar_backup as
select id, avatar
from public.users
where avatar is not null;

-- 2. Tabel cadangan jangan sampai terbaca lewat API publik Supabase.
alter table public.users_avatar_backup enable row level security;
revoke all on public.users_avatar_backup from anon, authenticated;

-- 3. Lepas kolomnya.
alter table public.users drop column if exists avatar;

commit;

-- 4. Verifikasi — hasil harus 0 baris.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
  and column_name = 'avatar';

-- 5. Berapa baris yang tercadangkan (opsional, untuk laporan skripsi).
select count(*) as baris_tercadangkan from public.users_avatar_backup;
