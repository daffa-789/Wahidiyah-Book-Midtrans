import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { requireAuth } from '../auth.js';
import { badRequest, fail } from '../lib/http.js';

export const readingRouter = Router();

// Helper untuk menangani kasus saat tabel migrasi belum dijalankan di database
const isTableMissingError = (err) => {
  if (!err) return false;
  const msg = String(err.message || '');
  const code = String(err.code || '');
  return code === '42P01' || code === 'PGRST205' || msg.includes('does not exist') || msg.includes('schema cache');
};

/**
 * GET /api/reading-progress
 * Mengambil daftar riwayat membaca terbaru milik pengguna saat ini (untuk bagian Lanjutkan Membaca)
 */
readingRouter.get('/reading-progress', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseServer
      .from('reading_progress')
      .select(`
        id,
        book_id,
        last_page,
        total_pages,
        updated_at,
        book:books (
          id,
          title,
          author,
          category,
          cover_url,
          thumbnail_url,
          is_locked
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(6);

    if (error) {
      if (isTableMissingError(error)) {
        return res.json({ success: true, reading_progress: [], degraded: true });
      }
      throw error;
    }

    res.json({ success: true, reading_progress: data || [] });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /api/reading-progress/:bookId
 * Mengambil progres membaca buku tertentu
 */
readingRouter.get('/reading-progress/:bookId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    const { data, error } = await supabaseServer
      .from('reading_progress')
      .select('id, book_id, last_page, total_pages, updated_at')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        return res.json({ success: true, progress: null, degraded: true });
      }
      throw error;
    }

    res.json({ success: true, progress: data || null });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * PUT /api/reading-progress/:bookId
 * Memperbarui atau menyimpan posisi halaman membaca terakhir (upsert)
 */
readingRouter.put('/reading-progress/:bookId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;
    const lastPage = Number(req.body.last_page);
    const totalPages = req.body.total_pages ? Number(req.body.total_pages) : null;

    if (!Number.isInteger(lastPage) || lastPage < 1) {
      return badRequest(res, 'Nomor halaman harus berupa bilangan bulat positif.');
    }

    const payload = {
      user_id: userId,
      book_id: bookId,
      last_page: lastPage,
      total_pages: totalPages,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseServer
      .from('reading_progress')
      .upsert(payload, { onConflict: 'user_id,book_id' })
      .select()
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        // Degraded mode: database belum bermigrasi, respons sukses ramah fallback
        return res.json({ success: true, progress: payload, degraded: true });
      }
      throw error;
    }

    res.json({ success: true, progress: data || payload });
  } catch (error) {
    fail(res, error);
  }
});
