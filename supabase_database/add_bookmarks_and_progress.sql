-- Migration: Tambah tabel user_bookmarks dan reading_progress (Tahap 8 Fitur)
-- Sesuai MASTER-PLAN §3.6 dan invarian RLS otomatis §0.2 poin 1

-- 1. Tabel user_bookmarks
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page integer NOT NULL CHECK (page >= 1),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id, page)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own bookmarks" ON public.user_bookmarks;
CREATE POLICY "own bookmarks" ON public.user_bookmarks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_book ON public.user_bookmarks(user_id, book_id);

-- 2. Tabel reading_progress
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  last_page integer NOT NULL DEFAULT 1 CHECK (last_page >= 1),
  total_pages integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own reading progress" ON public.reading_progress;
CREATE POLICY "own reading progress" ON public.reading_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_reading_progress_user_updated ON public.reading_progress(user_id, updated_at DESC);
