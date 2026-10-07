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

DROP FUNCTION IF EXISTS public.fn_handle_qris_payment() CASCADE;
DROP FUNCTION IF EXISTS public.pay_qris_simulation(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.cancel_qris_simulation(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_qris_simulation(TEXT, TEXT, NUMERIC, TEXT, TEXT) CASCADE;

DROP TYPE IF EXISTS public.qris_payment_status CASCADE;
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
CREATE TYPE public.qris_payment_status AS ENUM ('WAITING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED');

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(30) DEFAULT '',
    role public.user_role DEFAULT 'user',
    login_method public.login_method_type DEFAULT 'email',
    is_pro BOOLEAN DEFAULT FALSE,
    subscription_expires_at TIMESTAMPTZ DEFAULT NULL,
    dob DATE DEFAULT NULL,
    avatar TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.books (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(255) DEFAULT '',
    author VARCHAR(150) NOT NULL,
    category VARCHAR(100) DEFAULT 'Umum',
    pages INT DEFAULT 1,
    total_pages INT DEFAULT 1,
    is_locked BOOLEAN DEFAULT FALSE,
    cover_url TEXT DEFAULT NULL,
    thumbnail_url TEXT DEFAULT NULL,
    content_url TEXT DEFAULT NULL,
    content_name VARCHAR(255) DEFAULT NULL,
    content_extension VARCHAR(20) DEFAULT 'pdf',
    content_mime VARCHAR(100) DEFAULT 'application/pdf',
    content_size BIGINT DEFAULT 0,
    content_type VARCHAR(50) DEFAULT 'pdf',
    description TEXT,
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

CREATE TABLE public.qris_transactions (
    id VARCHAR(100) PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    qr_id VARCHAR(100) NOT NULL,
    merchant_name VARCHAR(150) NOT NULL DEFAULT 'Wahidiyah Book Store',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 25000,
    currency VARCHAR(10) DEFAULT 'IDR',
    status public.qris_payment_status DEFAULT 'WAITING_PAYMENT',
    plan_name VARCHAR(100) DEFAULT 'Paket Bulanan',
    user_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) DEFAULT 'Pembaca Wahidiyah',
    source VARCHAR(50) DEFAULT 'wahidiyah_book',
    qr_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
    paid_at TIMESTAMPTZ DEFAULT NULL,
    cancelled_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_books_category ON public.books(category);
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

CREATE INDEX idx_qris_txn_id ON public.qris_transactions(transaction_id);
CREATE INDEX idx_qris_status ON public.qris_transactions(status);
CREATE INDEX idx_qris_user ON public.qris_transactions(user_id);
CREATE INDEX idx_qris_created ON public.qris_transactions(created_at DESC);

CREATE INDEX idx_carousel_order ON public.carousel_slides(sort_order, id);
CREATE INDEX idx_carousel_active ON public.carousel_slides(is_active, starts_at, ends_at);

CREATE OR REPLACE FUNCTION public.fn_handle_qris_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id VARCHAR(50);
    v_plan VARCHAR(100);
    v_amount NUMERIC(12, 2);
    v_tx_id VARCHAR(100);
    v_sub_id VARCHAR(50);
    v_pay_tx_id VARCHAR(50);
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status <> 'PAID')) OR
       (TG_OP = 'INSERT' AND NEW.status = 'PAID') THEN

        v_user_id := NEW.user_id;
        v_plan := COALESCE(NEW.plan_name, 'Paket Bulanan');
        v_amount := COALESCE(NEW.amount, 25000);
        v_tx_id := NEW.transaction_id;
        v_sub_id := 'sub-qris-' || substr(md5(random()::text), 1, 8);
        v_pay_tx_id := 'tx-qris-' || substr(md5(random()::text), 1, 8);

        IF NEW.paid_at IS NULL THEN
            NEW.paid_at := NOW();
        END IF;

        IF v_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
            UPDATE public.users
            SET
                is_pro = TRUE,
                subscription_expires_at = NOW() + INTERVAL '30 days'
            WHERE id = v_user_id;

            INSERT INTO public.subscriptions (
                id, user_id, plan_name, price, status, period,
                expires_at, ref_code, created_at
            ) VALUES (
                v_sub_id, v_user_id, v_plan, v_amount, 'Aktif', '1 Bulan',
                NOW() + INTERVAL '30 days', v_tx_id, NOW()
            );

            IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE ref_no = v_tx_id) THEN
                INSERT INTO public.transactions (
                    id, ref_no, user_id, plan_name, amount, admin_fee,
                    total_paid, payment_method, status, verified_at, created_at
                ) VALUES (
                    v_pay_tx_id, v_tx_id, v_user_id, v_plan, v_amount, 0,
                    v_amount, 'QRIS Simulator', 'success', NOW(), NOW()
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.fn_handle_qris_payment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_on_qris_payment_paid ON public.qris_transactions;
CREATE TRIGGER trg_on_qris_payment_paid
BEFORE INSERT OR UPDATE ON public.qris_transactions
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_qris_payment();

CREATE OR REPLACE FUNCTION public.pay_qris_simulation(p_transaction_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_row public.qris_transactions%ROWTYPE;
BEGIN
    SELECT * INTO v_row
    FROM public.qris_transactions
    WHERE transaction_id = p_transaction_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'status', 'NOT_FOUND',
            'message', 'Transaksi QRIS tidak ditemukan di database Supabase.'
        );
    END IF;

    IF v_row.status = 'PAID' THEN
        RETURN json_build_object(
            'success', false,
            'status', 'FAILED',
            'message', 'Transaksi sudah berstatus PAID (lunas) sebelumnya.'
        );
    END IF;

    IF v_row.status IN ('EXPIRED', 'CANCELLED') THEN
        RETURN json_build_object(
            'success', false,
            'status', v_row.status,
            'message', 'Transaksi tidak dapat dibayar karena berstatus ' || v_row.status
        );
    END IF;

    UPDATE public.qris_transactions
    SET status = 'PAID', paid_at = NOW()
    WHERE transaction_id = p_transaction_id
    RETURNING * INTO v_row;

    RETURN json_build_object(
        'success', true,
        'status', 'PAID',
        'message', 'Pembayaran QRIS simulasi berhasil! Langganan Wahidiyah Book Anda telah aktif.',
        'transaction', row_to_json(v_row)
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.create_qris_simulation(
    p_user_id TEXT DEFAULT NULL,
    p_merchant_name TEXT DEFAULT 'Wahidiyah Book Store',
    p_amount NUMERIC DEFAULT 25000,
    p_plan_name TEXT DEFAULT 'Paket Bulanan',
    p_customer_name TEXT DEFAULT 'Pembaca Wahidiyah'
)
RETURNS JSON AS $$
DECLARE
    v_id TEXT;
    v_txn_id TEXT;
    v_qr_id TEXT;
    v_payload TEXT;
    v_row public.qris_transactions%ROWTYPE;
    v_rand TEXT;
    v_date TEXT;
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    v_rand := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    v_txn_id := 'TXN-' || v_date || '-' || v_rand;
    v_qr_id := 'QR-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    v_id := 'qtx-' || substr(md5(random()::text), 1, 10);
    v_payload := 'QRIS_SIMULATION|' || v_txn_id || '|' || v_qr_id || '|' || p_merchant_name || '|' || ROUND(p_amount)::TEXT;

    INSERT INTO public.qris_transactions (
        id, transaction_id, qr_id, merchant_name, amount, currency,
        status, plan_name, user_id, customer_name, source, qr_payload,
        created_at, expires_at
    ) VALUES (
        v_id, v_txn_id, v_qr_id, p_merchant_name, p_amount, 'IDR',
        'WAITING_PAYMENT', p_plan_name, p_user_id, p_customer_name,
        'wahidiyah_book', v_payload,
        NOW(), NOW() + INTERVAL '15 minutes'
    )
    RETURNING * INTO v_row;

    RETURN row_to_json(v_row);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.cancel_qris_simulation(p_transaction_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_row public.qris_transactions%ROWTYPE;
BEGIN
    SELECT * INTO v_row
    FROM public.qris_transactions
    WHERE transaction_id = p_transaction_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'status', 'NOT_FOUND',
            'message', 'Transaksi QRIS tidak ditemukan.'
        );
    END IF;

    IF v_row.status = 'PAID' THEN
        RETURN json_build_object(
            'success', false,
            'status', 'FAILED',
            'message', 'Transaksi sudah PAID dan tidak dapat dibatalkan.'
        );
    END IF;

    UPDATE public.qris_transactions
    SET status = 'CANCELLED', cancelled_at = NOW()
    WHERE transaction_id = p_transaction_id
    RETURNING * INTO v_row;

    RETURN json_build_object(
        'success', true,
        'status', 'CANCELLED',
        'message', 'Transaksi QRIS berhasil dibatalkan.',
        'transaction', row_to_json(v_row)
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qris_transactions ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Public Read QRIS Transactions" ON public.qris_transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert QRIS Transactions" ON public.qris_transactions FOR INSERT TO anon, authenticated WITH CHECK (status = 'WAITING_PAYMENT');
CREATE POLICY "Public Update QRIS Transactions" ON public.qris_transactions FOR UPDATE TO anon, authenticated USING (status = 'WAITING_PAYMENT') WITH CHECK (status IN ('PAID', 'CANCELLED'));

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = 'qris_transactions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.qris_transactions;
        END IF;

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
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time_start VARCHAR(5) DEFAULT '19:30';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time_end VARCHAR(5) DEFAULT '21:00';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer VARCHAR(150) DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_in_carousel BOOLEAN DEFAULT FALSE;

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
DROP POLICY IF EXISTS "Public Update QRIS Transactions" ON public.qris_transactions;

DO $$
DECLARE
    fn regprocedure;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'pay_qris_simulation',
              'create_qris_simulation',
              'cancel_qris_simulation'
          )
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    END LOOP;
END $$;

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

-- Paksa PostgREST memuat ulang skema cache.
NOTIFY pgrst, 'reload schema';
