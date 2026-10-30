-- ════════════════════════════════════════════════════════════════════════════
-- PERINGATAN: ini adalah setup awal/reset total. Skrip menghapus seluruh
-- tabel di bawah beserta datanya lalu membangunnya ulang dari nol.
-- Jangan jalankan pada database yang sudah berisi data produksi.
-- Repositori hanya menyimpan berkas setup ini; perubahan pada database aktif
-- harus ditinjau dan diterapkan sebagai migrasi terpisah setelah backup.
-- ════════════════════════════════════════════════════════════════════════════

ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';

DROP TABLE IF EXISTS public.carousel_slides CASCADE;
DROP TABLE IF EXISTS public.qris_transactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.ads CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.password_resets CASCADE;
DROP TABLE IF EXISTS public.email_verifications CASCADE;
DROP TABLE IF EXISTS public.api_rate_limit_buckets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.login_method_type CASCADE;
DROP TYPE IF EXISTS public.active_plan_type CASCADE;
DROP TYPE IF EXISTS public.subscription_status CASCADE;
DROP TYPE IF EXISTS public.transaction_status CASCADE;
DROP TYPE IF EXISTS public.ad_placement CASCADE;
DROP TYPE IF EXISTS public.ad_audience CASCADE;

CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.login_method_type AS ENUM ('email', 'google');
CREATE TYPE public.subscription_status AS ENUM ('Aktif', 'Berakhir');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'success', 'rejected');

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Catatan: kolom `avatar` sengaja tidak ada karena kode aplikasi tidak lagi
-- membaca atau menulis foto profil.
CREATE TABLE public.users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT NULL,
    role public.user_role DEFAULT 'user',
    login_method public.login_method_type DEFAULT 'email',
    is_pro BOOLEAN DEFAULT FALSE,
    subscription_expires_at TIMESTAMPTZ DEFAULT NULL,
    phone VARCHAR(20) UNIQUE DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
COMMENT ON COLUMN public.users.phone IS 'Nomor telepon/WhatsApp pengguna dalam format internasional 628xxx';

CREATE TABLE public.books (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    pages INT DEFAULT 1,
    is_locked BOOLEAN DEFAULT FALSE,
    cover_url TEXT DEFAULT NULL,
    content_url TEXT DEFAULT NULL,
    content_name VARCHAR(255) DEFAULT NULL,
    content_extension VARCHAR(20) DEFAULT 'pdf',
    content_mime VARCHAR(100) DEFAULT 'application/pdf',
    content_size BIGINT DEFAULT 0,
    content_type VARCHAR(50) DEFAULT 'pdf',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    time_start VARCHAR(5) DEFAULT '19:30',
    time_end VARCHAR(5) DEFAULT '21:00',
    location VARCHAR(200) DEFAULT '',
    category VARCHAR(50) DEFAULT 'Nasional',
    description TEXT DEFAULT '',
    organizer VARCHAR(150) DEFAULT '',
    show_in_carousel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banner beranda. Baris yang lahir dari agenda menyimpan `event_id`, sehingga
-- agenda yang dihapus otomatis menarik banner turunannya ikut hilang.
CREATE TABLE public.carousel_slides (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT NULL,
    event_id VARCHAR(50) REFERENCES public.events(id) ON DELETE CASCADE,
    event_date DATE DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at DATE DEFAULT NULL,
    ends_at DATE DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    status public.subscription_status DEFAULT 'Aktif',
    expires_at TIMESTAMPTZ DEFAULT NULL,
    ref_code VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transactions (
    id VARCHAR(50) PRIMARY KEY,
    ref_no VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    admin_fee NUMERIC(12, 2) DEFAULT 0,
    total_paid NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status public.transaction_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ DEFAULT NULL,
    -- Kolom integrasi Midtrans Core API QRIS
    midtrans_transaction_id VARCHAR(100),
    midtrans_qr_url TEXT,
    midtrans_qr_string TEXT,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_verifications (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    purpose VARCHAR(20) NOT NULL,
    code_hash VARCHAR(128) NOT NULL,
    payload JSONB DEFAULT NULL,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_subs_user ON public.subscriptions(user_id);
CREATE INDEX idx_subs_status ON public.subscriptions(status);
CREATE INDEX idx_tx_user ON public.transactions(user_id);
CREATE INDEX idx_tx_status ON public.transactions(status);
CREATE INDEX idx_transactions_midtrans_transaction_id ON public.transactions(midtrans_transaction_id);

CREATE INDEX idx_email_verifications_lookup
    ON public.email_verifications (email, purpose, id DESC);
CREATE INDEX idx_email_verifications_expires
    ON public.email_verifications (expires_at);

CREATE INDEX idx_carousel_order ON public.carousel_slides(sort_order, id);
CREATE INDEX idx_carousel_active ON public.carousel_slides(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_event_id ON public.carousel_slides(event_id);


ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Email Verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Public Manage Email Verifications" ON public.email_verifications;

CREATE POLICY "Public Read Books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Active Carousel" ON public.carousel_slides
    FOR SELECT USING (
        is_active = TRUE
        AND (starts_at IS NULL OR starts_at <= CURRENT_DATE)
        AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)
    );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
    ) THEN
        ALTER FUNCTION public.rls_auto_enable() SET search_path = public, pg_temp;
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

-- VULN-16: RLS tidak membatasi operasi tingkat tabel, dan bawaan Supabase
-- memberi anon/authenticated TRUNCATE, REFERENCES, TRIGGER, MAINTAIN. Aplikasi
-- tidak pernah memerlukannya (server memakai service-role), jadi dicabut.
-- ALTER DEFAULT PRIVILEGES menjaga tabel yang BARU dibuat (termasuk tabel fitur
-- nanti) ikut warisan; jalankan sebagai role yang sama dengan yang membuat
-- tabel di dashboard (postgres).
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES FROM anon, authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = 'users'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- Bagian PATCH — idempoten, AMAN untuk basis data yang sudah berisi data.
--
-- Bagian di atas dimulai dengan DROP TABLE, jadi menjalankannya dua kali akan
-- mengosongkan seluruh data. Jalankan blok di bawah ini saja bila basis data
-- sudah terisi dan hanya perlu ditambahi banner carousel + kolom agenda baru.
--
-- CATATAN: bagian ini menjadi bagian dari satu-satunya berkas setup.
-- Jangan jalankan seluruh berkas pada basis data yang sudah berisi data.
-- Untuk basis data aktif, salin hanya patch yang relevan setelah meninjau
-- skema target dan membuat backup.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time_start VARCHAR(5) DEFAULT '19:30';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time_end VARCHAR(5) DEFAULT '21:00';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer VARCHAR(150) DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_in_carousel BOOLEAN DEFAULT FALSE;

-- Sengaja mengulang CREATE TABLE dari bagian utama: blok PATCH ini harus bisa
-- dijalankan SENDIRI pada basis data lama yang belum punya tabel carousel.
-- IF NOT EXISTS membuatnya tidak berefek saat tabelnya sudah ada.
CREATE TABLE IF NOT EXISTS public.carousel_slides (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT NULL,
    event_id VARCHAR(50) REFERENCES public.events(id) ON DELETE CASCADE,
    event_date DATE DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at DATE DEFAULT NULL,
    ends_at DATE DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_order ON public.carousel_slides(sort_order, id);
CREATE INDEX IF NOT EXISTS idx_carousel_active ON public.carousel_slides(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_event_id ON public.carousel_slides(event_id);

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'carousel_slides'
          AND policyname = 'Public Read Active Carousel'
    ) THEN
        CREATE POLICY "Public Read Active Carousel" ON public.carousel_slides
            FOR SELECT USING (
                is_active = TRUE
                AND (starts_at IS NULL OR starts_at <= CURRENT_DATE)
                AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)
            );
    END IF;
END $$;

DROP POLICY IF EXISTS "Public Read Users" ON public.users;

-- ════════════════════════════════════════════════════════════════════════════
-- PATCH Midtrans — idempoten, aman untuk basis data yang sudah berisi data.
-- Menambahkan 4 kolom integrasi Midtrans Core API QRIS ke tabel transactions.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(100);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_qr_url TEXT;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_qr_string TEXT;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_transactions_midtrans_transaction_id
  ON public.transactions (midtrans_transaction_id);

-- ════════════════════════════════════════════════════════════════════════════
-- PATCH Web Push — idempoten, aman untuk basis data yang sudah berisi data.
--
-- Web Push Notification untuk pengingat agenda H-1. Notifikasi ditujukan
-- kepada SEMUA pengunjung (tidak wajib punya akun), jadi tabel langganan
-- sengaja TIDAK memiliki foreign key ke users.
--
-- KEAMANAN: tabel ini menyimpan `endpoint` + kunci enkripsi perangkat.
-- Siapa pun yang memegang pasangan kunci itu bisa mengirim notifikasi ke
-- perangkat tersebut. Karena itu RLS diaktifkan TANPA policy apa pun —
-- hanya service-role key (dipakai server Express) yang bisa membaca/menulis.
-- Anon key tidak bisa menyentuh tabel ini sama sekali.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    failure_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON public.push_subscriptions (is_active);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tidak ada policy SELECT/INSERT/UPDATE/DELETE: akses hanya lewat service role.

-- Penanda "pengingat H-1 sudah dikirim" agar agenda yang diedit tidak
-- mengirim notifikasi berulang ke perangkat yang sama.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Pengaturan jam pengiriman pengingat (WIB). Default 08:00 pagi.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reminder_hour VARCHAR(5) DEFAULT '08:00';

-- Paksa PostgREST memuat ulang skema cache.
NOTIFY pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════════
-- PATCH Distributed Rate Limits — idempoten, hanya untuk deployment server.
--
-- Rate-limit counters dibagi antar-instance Vercel lewat Supabase RPC.
-- Key yang tersimpan berupa HMAC, bukan IP/email mentah. Tabel tidak memiliki
-- policy RLS: hanya service_role yang mendapat hak melalui API server.
-- Blok ini aman dijalankan sendiri pada database berisi data.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.api_rate_limit_buckets (
    bucket_key VARCHAR(64) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    hit_count BIGINT NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
    PRIMARY KEY (bucket_key)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limit_buckets_window
    ON public.api_rate_limit_buckets (window_start);

-- Menutup temuan advisor Supabase tanpa mengasumsikan tabel carousel ada pada
-- setiap instalasi lama yang hanya mengambil patch rate-limit ini.
DO $$
BEGIN
    IF to_regclass('public.carousel_slides') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_carousel_slides_event_id
            ON public.carousel_slides (event_id);
    END IF;
END;
$$;

ALTER TABLE public.api_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.api_rate_limit_buckets TO service_role;

CREATE OR REPLACE FUNCTION public.increment_api_rate_limit(
    p_bucket_key TEXT,
    p_window_ms INTEGER
)
RETURNS TABLE(total_hits BIGINT, reset_time TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now TIMESTAMPTZ := clock_timestamp();
    v_window_ms INTEGER := LEAST(GREATEST(p_window_ms, 1), 86400000);
    v_window_start TIMESTAMPTZ;
    v_hits BIGINT;
BEGIN
    IF p_bucket_key !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Invalid rate-limit key';
    END IF;

    INSERT INTO public.api_rate_limit_buckets AS buckets (bucket_key, window_start, hit_count)
    VALUES (p_bucket_key, v_now, 1)
    ON CONFLICT (bucket_key)
    DO UPDATE SET
        window_start = CASE
            WHEN buckets.window_start + v_window_ms * INTERVAL '1 millisecond' <= v_now
                THEN v_now
            ELSE buckets.window_start
        END,
        hit_count = CASE
            WHEN buckets.window_start + v_window_ms * INTERVAL '1 millisecond' <= v_now
                THEN 1
            ELSE buckets.hit_count + 1
        END
    RETURNING hit_count, window_start INTO v_hits, v_window_start;

    -- Incremental cleanup keeps expired buckets bounded without scanning the
    -- table on every request. A small fraction of calls removes at most 250.
    IF random() < 0.01 THEN
        DELETE FROM public.api_rate_limit_buckets
        WHERE ctid IN (
            SELECT ctid
            FROM public.api_rate_limit_buckets
            WHERE window_start < v_now - INTERVAL '24 hours'
            ORDER BY window_start
            LIMIT 250
        );
    END IF;

    total_hits := v_hits;
    reset_time := v_window_start + v_window_ms * INTERVAL '1 millisecond';
    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_api_rate_limit(
    p_bucket_key TEXT,
    p_window_ms INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_window_ms INTEGER := LEAST(GREATEST(p_window_ms, 1), 86400000);
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF p_bucket_key !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Invalid rate-limit key';
    END IF;

    UPDATE public.api_rate_limit_buckets
    SET hit_count = GREATEST(hit_count - 1, 0)
    WHERE bucket_key = p_bucket_key
      AND window_start + v_window_ms * INTERVAL '1 millisecond' > v_now
      AND hit_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_api_rate_limit(
    p_bucket_key TEXT,
    p_window_ms INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_window_ms INTEGER := LEAST(GREATEST(p_window_ms, 1), 86400000);
BEGIN
    IF p_bucket_key !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Invalid rate-limit key';
    END IF;

    DELETE FROM public.api_rate_limit_buckets
    WHERE bucket_key = p_bucket_key;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_api_rate_limit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrement_api_rate_limit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_api_rate_limit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_rate_limit(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_api_rate_limit(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_api_rate_limit(TEXT, INTEGER) TO service_role;

-- ════════════════════════════════════════════════════════════════════════════
-- PATCH Naskah di Storage — idempoten, aman untuk basis data yang sudah berisi data.
--
-- Naskah buku disimpan di bucket privat `buku`, bukan sebagai data URL di
-- kolom books.content_url, karena function Vercel menolak muatan di atas 4,5 MB.
-- Bucket ini harus ada sebelum admin bisa mengunggah buku.
--
-- Tidak ada kebijakan RLS yang dibuat dengan sengaja: unggah memakai tanda
-- unggah sekali-pakai dan baca memakai peran layanan, jadi keduanya sudah tidak
-- bergantung pada RLS. Menambahkan kebijakan justru membuka isi naskah berbayar.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('buku', 'buku', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit;

NOTIFY pgrst, 'reload schema';
