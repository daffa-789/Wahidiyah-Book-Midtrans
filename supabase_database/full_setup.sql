-- ════════════════════════════════════════════════════════════════════════════
-- PERINGATAN: skrip ini MENGHAPUS seluruh tabel di bawah lalu membangunnya
-- ulang dari nol. Jangan dijalankan pada database yang sudah berisi data.
-- Untuk database yang sudah berjalan, pakai migrasi bertarget seperti
-- remove_avatar_column.sql.
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

-- Catatan: kolom `avatar` sengaja tidak ada. Fitur foto profil dicabut
-- (commit 68aac84) dan kode tidak lagi membaca/menulisnya. Database lama yang
-- masih punya kolom itu dirapikan lewat remove_avatar_column.sql.
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
    period VARCHAR(100) NOT NULL,
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
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);

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
-- CATATAN: blok serupa juga tersedia sebagai berkas berdiri sendiri di
--          `carousel_slides.sql` — pakai itu bila HANYA ingin menambah tabel
--          carousel tanpa menyentuh apa pun yang lain.
--
-- BASIS DATA SUDAH TERISI? Bagian di atas tidak boleh dijalankan (ia DROP
-- TABLE). Untuk membawa basis data yang sudah ada ke kondisi aman, pakai
--          `hardening_vuln02_vuln16.sql` — idempoten, berisi pencabutan
--          grant tingkat tabel + verifikasi.
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
