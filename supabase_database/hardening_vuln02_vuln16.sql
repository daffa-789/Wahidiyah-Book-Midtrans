-- ══════════════════════════════════════════════════════════════════════════
-- STATUS: SUDAH DIJALANKAN 22 Oktober 2026 lewat Supabase Studio (SQL Editor)
-- pada project pdimjmbjutlzjdfjaqgt, dan full_setup.sql sudah disinkronkan.
-- Hasil: 0 policy pada qris_transactions (rls=true), grant anon/authenticated
-- tersisa DELETE/INSERT/SELECT/UPDATE, anon INSERT ditolak 42501.
-- Berkas ini dipertahankan sebagai catatan rollback + jalan pulih untuk
-- environment lain (mis. kalau nanti bikin project Supabase baru).
-- ══════════════════════════════════════════════════════════════════════════
-- HARDENING SQL — VULN-02 (policy publik qris_transactions) & VULN-16 (grant)
-- ══════════════════════════════════════════════════════════════════════════
-- Project  : pdimjmbjutlzjdfjaqgt  (Skripsi_Project)
-- Berkas sumber yang harus disinkronkan setelah ini: supabase_database/full_setup.sql
-- Cara jalan: tempel SELURUHNYA sekali jalan di Supabase Studio > SQL Editor.
--
-- Kenapa file ini ada: tidak ada psql, tidak ada Supabase CLI, dan tidak ada
-- driver Postgres di node_modules — dan aturan repo melarang menambah
-- dependensi. Jadi migrasi dijalankan pemilik, bukan oleh agen.
--
-- URUTAN PENTING: jalankan bagian SNAPSHOT dulu dan SIMPAN keluarannya di
-- berkas (itu satu-satunya jalur rollback), baru bagian eksekusi.
-- ══════════════════════════════════════════════════════════════════════════


-- ── 1. SNAPSHOT (read-only, jalankan lebih dulu dan simpan hasilnya) ───────
SELECT policyname, cmd, roles::text AS peran, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'qris_transactions'
ORDER BY policyname, cmd;

SELECT c.relname AS tabel, a.grantee::regrole::text AS peran, a.privilege_type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(c.relacl) a
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND a.grantee::regrole::text IN ('anon', 'authenticated')
ORDER BY 1, 2, 3;

SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public';


-- ── 2. VULN-02 — qris_transactions jadi default-deny ───────────────────────
-- TIGA policy, bukan dua. full_setup.sql:401-403 membuat Read + Insert +
-- Update, lalu :509 menjatuhkan yang Update — file itu self-contradictory,
-- jadi state DB live wajib diverifikasi (lihat snapshot di atas).
--
-- Yang membocor ke anon key (ikut ter-bundle di klien Vite): user_id,
-- customer_name, amount, plan_name, qr_payload, created_at, paid_at.
-- Bila policy Update masih hidup, dampaknya bukan cuma baca: pemegang anon
-- key bisa menandai baris WAITING_PAYMENT menjadi PAID.
DROP POLICY IF EXISTS "Public Read QRIS Transactions"   ON public.qris_transactions;
DROP POLICY IF EXISTS "Public Insert QRIS Transactions" ON public.qris_transactions;
DROP POLICY IF EXISTS "Public Update QRIS Transactions" ON public.qris_transactions;
-- Sisa: tabel tetap ber-RLS dengan NOL policy = ditolak untuk anon &
-- authenticated. Server tidak terpengaruh karena memakai service-role key
-- yang melewati RLS. Tidak ada klien yang menyentuh tabel ini dari src/.

-- Realtime: siaran WAL untuk tabel pembayaran tidak dipakai aplikasi dan
-- hanya memperluas permukaan kebocoran baris transaksi.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public' AND tablename = 'qris_transactions'
       ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.qris_transactions;
    END IF;
END $$;


-- ── 3. VULN-16 — least privilege pada seluruh tabel skema public ────────────
-- Bawaan Supabase memberi anon/authenticated grant TRUNCATE, REFERENCES,
-- TRIGGER, MAINTAIN. RLS tidak membatasi operasi level tabel ini dan
-- aplikasi tidak pernah memerlukannya.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Tabel baru (termasuk tabel fitur nanti) mewarisi kebijakan yang sama.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES FROM anon, authenticated;


-- ── 4. VERIFIKASI (harus kembali kosong / hanya 4 privilege) ────────────────
-- 4a. Harus 0 baris:
SELECT tablename, policyname, roles::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'qris_transactions';

-- 4b. Harus hanya SELECT/INSERT/UPDATE/DELETE tersisa:
SELECT c.relname AS tabel, a.grantee::regrole::text AS peran,
       string_agg(a.privilege_type, ',' ORDER BY a.privilege_type) AS privilege
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(c.relacl) a
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND a.grantee::regrole::text IN ('anon', 'authenticated')
GROUP BY 1, 2
ORDER BY 1, 2;

-- 4c. qris_transactions tidak lagi disiarakan realtime (harus 0 baris):
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'qris_transactions';


-- ── 5. SESUDAH SQL: uji fungsional yang tidak boleh berubah ─────────────────
--  - Buat charge QRIS (sandbox)  -> sukses, baris WAITING_PAYMENT terbentuk.
--  - Polling GET /api/payments/qris/:orderId/status -> tetap 200.
--    (Keduanya memakai service-role key di server, jadi tidak tersentuh RLS.)
--  - Percobaan langsung dengan anon key harus DITOLAK:
--      curl "https://pdimjmbjutlzjdfjaqgt.supabase.co/rest/v1/qris_transactions?select=*" \
--           -H "apikey: <VITE_SUPABASE_ANON_KEY>" -H "Authorization: Bearer <VITE_SUPABASE_ANON_KEY>"
--    Harapan: {"code":"42501","message":"permission denied for relation ..."} atau
--    daftar kosong karena RLS menolak — yang penting bukan data transaksi.

-- ── 6. ROLLBACK (hanya bila diperlukan, dari snapshot langkah 1) ────────────
-- Policy yang pernah ada, agar tidak perlu mencari ulang:
--   CREATE POLICY "Public Read QRIS Transactions" ON public.qris_transactions FOR SELECT USING (true);
--   CREATE POLICY "Public Insert QRIS Transactions" ON public.qris_transactions
--     FOR INSERT TO anon, authenticated WITH CHECK (status = 'WAITING_PAYMENT');
--   CREATE POLICY "Public Update QRIS Transactions" ON public.qris_transactions
--     FOR UPDATE TO anon, authenticated USING (status = 'WAITING_PAYMENT')
--     WITH CHECK (status IN ('PAID', 'CANCELLED'));
-- Jangan restore policy Read/Insert/Update kecuali darurat — itulah celahnya.
-- Grant: REVOKE di langkah 3 aman dikembalikan dengan GRANT setara bila
-- aplikasi ternyata menolak menulis (tidak diharapkan; server tak memakai grant ini).
