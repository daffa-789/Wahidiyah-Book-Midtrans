import path from 'path';
import { Router } from 'express';
import mammoth from 'mammoth';
import { supabaseServer } from '../db.js';
import { generateId, hasActivePro, requireAdmin, requireAuth } from '../auth.js';
import {
  badRequest,
  fail,
  forbidden,
  notFound,
  safeContentMime,
  sendDataUrl,
  wrap
} from '../lib/http.js';
import { toDataUrl, toWebp } from '../lib/images.js';
import { matchesContentExtension, sniffDataUrlImage, sniffImageMime } from '../lib/sniff.js';
import { BOOK_FIELDS, CONTENT_EXTENSIONS } from '../lib/constants.js';
import { bookInputSchema, parseBooleanFlag } from '../lib/validate.js';
import { sanitizeHtml } from '../lib/sanitizeHtml.js';
import { uploadBookFiles } from '../middleware/uploads.js';
import {
  CONTENT_BUCKET,
  CONTENT_MAX_BYTES,
  CONTENT_PATH_PREFIX,
  createUploadTicket,
  contentRef,
  headBytes,
  objectInfo,
  readContentBuffer,
  removeContent,
  resolveReadUrl
} from '../lib/storage.js';

export const booksRouter = Router();

const UPLOAD_PATH_PATTERN = /^naskah\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/;

const MAX_CONTENT_MB = Math.round(CONTENT_MAX_BYTES / 1048576);

/* Nama objek di penyimpanan dibuat aman; nama asli tetap disimpan terpisah
 * untuk tampilan, karena ekstensi berkas menentukan cara naskah disajikan.
 */
const safeContentName = (filename, extension) => {
  const base = String(filename || '')
    .replace(/\.[^.]*$/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  return `${base || 'naskah'}.${extension}`;
};

/** Berkasnya sudah ada di penyimpanan; diperiksa ukuran dan isi aslinya. */
const storedContentFields = async (contentPath, originalName) => {
  if (typeof contentPath !== 'string' || !UPLOAD_PATH_PATTERN.test(contentPath)) {
    return { message: 'Lokasi konten tidak valid. Unggah ulang berkasnya.' };
  }
  const extension = path.extname(contentPath).toLowerCase();
  if (!CONTENT_EXTENSIONS.has(extension)) {
    return { message: 'Konten mendukung PDF, TXT, DOC/DOCX, RTF, ODT, EPUB, Markdown, atau CSV.' };
  }
  const info = await objectInfo(contentPath);
  const size = Number(info?.size) || 0;
  if (!info || size <= 0) {
    return { message: 'Berkas konten belum sampai ke penyimpanan. Coba unggah ulang.' };
  }
  if (size > CONTENT_MAX_BYTES) {
    return { message: `Ukuran konten maksimal ${MAX_CONTENT_MB} MB.` };
  }
  const head = await headBytes(contentPath);
  if (!matchesContentExtension(head, extension)) {
    return {
      message: `Isi berkas tidak cocok dengan ekstensi ${extension}. Periksa apakah berkasnya benar-benar jenis tersebut.`
    };
  }
  return {
    fields: {
      content_url: contentRef(contentPath),
      content_name: String(originalName || path.basename(contentPath)),
      content_extension: extension.replace(/^\./, ''),
      content_size: size
    }
  };
};


const toBookResponse = (book) => ({
  ...book,
  pages: Number(book.pages || 1),
  is_locked: Boolean(book.is_locked),
  has_thumbnail: Boolean(book.cover_url || book.thumbnail_url),
  has_content: Number(book.content_size) > 0
});


booksRouter.get('/books', async (req, res) => {
  try {
    const { search, sort } = req.query;
    let query = supabaseServer.from('books').select(BOOK_FIELDS);

    if (search && typeof search === 'string') {
      const trimmed = search.trim();
      if (trimmed) {
        const safe = trimmed.replace(/[%_,()]/g, '');
        if (safe) {
          query = query.ilike('title', `%${safe}%`);
        }
      }
    }

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'title_asc') {
      query = query.order('title', { ascending: true });
    } else if (sort === 'title_desc') {
      query = query.order('title', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, books: (data || []).map(toBookResponse) });
  } catch (error) {
    fail(res, error);
  }
});

booksRouter.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseServer
      .from('books')
      .select(BOOK_FIELDS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res, 'Buku tidak ditemukan');
    res.json({ success: true, book: toBookResponse(data) });
  } catch (error) {
    fail(res, error);
  }
});


booksRouter.post('/books', requireAuth, requireAdmin, wrap(async (req, res) => {
  const parsed = bookInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, parsed.error.issues[0]?.message || 'Input buku tidak valid');
  }

  const { title, pages, is_locked, cover_url } = parsed.data;
  const id = generateId('buku');
  const { error } = await supabaseServer.from('books').insert({
    id,
    title: title.trim(),
    pages: Number(pages) || 1,
    is_locked: Boolean(is_locked),
    cover_url: cover_url || null,
  });
  if (error) throw error;

  res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', bookId: id });
}));



/* Tanda unggah sekali-pakai: peramban mengirim byte naskah langsung ke
 * Supabase Storage sehingga tidak menyentuh batas muatan function Vercel.
 */
booksRouter.post('/books/upload-intent', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { filename } = req.body || {};
  const extension = path.extname(String(filename || '')).toLowerCase();
  if (!CONTENT_EXTENSIONS.has(extension)) {
    return res.status(415).json({
      success: false,
      message: 'Konten mendukung PDF, TXT, DOC/DOCX, RTF, ODT, EPUB, Markdown, atau CSV.'
    });
  }

  const uploadId = generateId('tmp').toLowerCase();
  const target = `${CONTENT_PATH_PREFIX}/${uploadId}/${safeContentName(filename, extension.replace(/^\./, ''))}`;
  const ticket = await createUploadTicket(target);

  res.json({
    success: true,
    bucket: CONTENT_BUCKET,
    path: ticket.path,
    token: ticket.token,
    maxBytes: CONTENT_MAX_BYTES
  });
}));


booksRouter.post('/books/upload', requireAuth, requireAdmin, uploadBookFiles, wrap(async (req, res) => {
  const { title, pages, is_locked, content_path: contentPath, content_name: contentName } = req.body;
  const thumbnail = req.files?.thumbnail?.[0];

  if (!title || !thumbnail || !contentPath) {
    return badRequest(res, 'Judul, thumbnail, dan berkas konten wajib diisi');
  }
  /* Jenis berkas ditentukan dari isinya, bukan dari `mimetype` kiriman klien
   * (VULN-11). Sharp tetap dipakai untuk konversi, tetapi keputusan menerima
   * atau menolak dibuat di sini.
   */
  const thumbnailMimeDetected = sniffImageMime(thumbnail.buffer);
  if (!thumbnailMimeDetected) {
    return res.status(415).json({ success: false, message: 'Thumbnail harus berupa gambar PNG, JPG, WebP, atau GIF.' });
  }

  const stored = await storedContentFields(contentPath, contentName);
  if (stored.message) {
    return res.status(415).json({ success: false, message: stored.message });
  }

  const id = generateId('buku');
  const cover = await toWebp(thumbnail.buffer, {
    width: 600,
    quality: 80,
    fallbackMime: thumbnailMimeDetected
  });

  const { error } = await supabaseServer.from('books').insert({
    id,
    title: title.trim(),
    pages: Number(pages) || 1,
    is_locked: parseBooleanFlag(is_locked),
    cover_url: toDataUrl(cover.buffer, cover.mime),
    ...stored.fields
  });
  if (error) throw error;

  res.status(201).json({ success: true, message: 'Buku berhasil diunggah', bookId: id });
}));


booksRouter.get('/books/:id/thumbnail', wrap(async (req, res) => {
  const { data: book } = await supabaseServer
    .from('books')
    .select('cover_url')
    .eq('id', req.params.id)
    .maybeSingle();

  const url = book?.cover_url;
  if (!url) return notFound(res, 'Thumbnail tidak ditemukan');

  /* Jenis gambar ditentukan dari byte-nya, bukan label di data URL (VULN-13).
   * Data URL yang isinya bukan gambar tidak disajikan sama sekali.
   */
  if (url.startsWith('data:')) {
    const imageMime = sniffDataUrlImage(url);
    if (!imageMime) return notFound(res, 'Thumbnail tidak dapat disajikan');
    if (sendDataUrl(res, url, { contentType: imageMime, cacheControl: 'public, max-age=86400' })) return;
  }

  return res.redirect(url);
}));


booksRouter.get('/books/:id/html', requireAuth, wrap(async (req, res) => {
  const { data: book } = await supabaseServer
    .from('books')
    .select('content_url, content_name, content_extension, is_locked')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!book?.content_url) return notFound(res, 'Konten buku tidak ditemukan');

  if (book.is_locked && !hasActivePro(req.authUser || req.user) && req.user.role !== 'admin') {
    return forbidden(res, 'Buku ini khusus pembaca Pro. Aktifkan paket Pro untuk membukanya.');
  }

  let buffer;
  try {
    buffer = await readContentBuffer(book.content_url);
  } catch {
    return notFound(res, 'Gagal mengambil isi berkas');
  }

  const ext = (book.content_extension || path.extname(book.content_name || '')).toLowerCase().replace('.', '');

  if (ext === 'docx' || ext === 'doc') {
    try {
      const conversion = await mammoth.convertToHtml({ buffer });
      const safeHtml = sanitizeHtml(conversion.value);
      return res.json({ success: true, html: safeHtml, type: 'docx' });
    } catch {
      return res.status(500).json({ success: false, message: 'Gagal mengonversi dokumen Word' });
    }
  }

  if (ext === 'txt' || ext === 'md' || ext === 'csv' || ext === 'rtf') {
    const text = buffer.toString('utf-8');
    return res.json({
      success: true,
      html: `<div style="white-space: pre-wrap; font-family: inherit;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`,
      type: ext
    });
  }

  return res.status(400).json({ success: false, message: 'Format bukan dokumen naskah/Word' });
}));

booksRouter.get('/books/:id/content', requireAuth, wrap(async (req, res) => {
  const { data: book } = await supabaseServer
    .from('books')
    .select('content_url, content_name, content_extension, is_locked')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!book?.content_url) return notFound(res, 'Konten buku tidak ditemukan');

  if (book.is_locked && !hasActivePro(req.authUser || req.user) && req.user.role !== 'admin') {
    return forbidden(res, 'Buku ini khusus pembaca Pro. Aktifkan paket Pro untuk membukanya.');
  }

  /* PDF boleh tampil langsung di penampil; jenis lain dipaksa unduh supaya
   * tidak pernah dirender sebagai HTML (VULN-13).
   */
  const contentMime = safeContentMime(book);
  const disposition = contentMime === 'application/pdf' ? 'inline' : 'attachment';
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename*=UTF-8''${encodeURIComponent(book.content_name || 'book.pdf')}`
  );
  const target = await resolveReadUrl(book.content_url);
  /* Alihan ke URL bertanda tidak boleh ikut tersimpan di tepi CDN: alamat itu
   * memberi akses baca tanpa sesi, dan usianya sengaja pendek.
   */
  res.setHeader('Cache-Control', target.startsWith('http') ? 'no-store' : 'private, max-age=3600');

  if (sendDataUrl(res, target, { contentType: contentMime })) return;
  return res.redirect(target);
}));


booksRouter.put('/books/:id', requireAuth, requireAdmin, uploadBookFiles, wrap(async (req, res) => {
  const { id } = req.params;
  const { title, pages, is_locked, content_path: contentPath, content_name: contentName } = req.body;

  if (!title || !title.trim()) {
    return badRequest(res, 'Judul buku wajib diisi');
  }

  const updatePayload = {
    title: title.trim(),
    pages: Number(pages) || 1,
    is_locked: parseBooleanFlag(is_locked),
    updated_at: new Date().toISOString()
  };

  const thumbnail = req.files?.thumbnail?.[0];
  if (thumbnail?.buffer) {
    const thumbnailMimeDetected = sniffImageMime(thumbnail.buffer);
    if (!thumbnailMimeDetected) {
      return res.status(415).json({ success: false, message: 'Thumbnail harus berupa gambar PNG, JPG, WebP, atau GIF.' });
    }
    const result = await toWebp(thumbnail.buffer, {
      width: 600,
      quality: 80,
      fallbackMime: thumbnailMimeDetected
    });
    updatePayload.cover_url = toDataUrl(result.buffer, result.mime);
  }

  let previousContentUrl = null;
  if (contentPath) {
    const stored = await storedContentFields(contentPath, contentName);
    if (stored.message) {
      return res.status(415).json({ success: false, message: stored.message });
    }
    const { data: current } = await supabaseServer
      .from('books')
      .select('content_url')
      .eq('id', id)
      .maybeSingle();
    previousContentUrl = current?.content_url || null;
    Object.assign(updatePayload, stored.fields);
  }

  const { error } = await supabaseServer.from('books').update(updatePayload).eq('id', id);
  if (error) throw error;

  /* Objek lama dibuang setelah barisnya pasti menunjuk yang baru, supaya
   * kegagalan di tengah jalan tidak meninggalkan buku tanpa naskah.
   */
  if (previousContentUrl && previousContentUrl !== updatePayload.content_url) {
    await removeContent(previousContentUrl);
  }

  res.json({ success: true, message: 'Buku berhasil diperbarui' });
}));


booksRouter.delete('/books/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;

  const { data: current } = await supabaseServer
    .from('books')
    .select('content_url')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await supabaseServer.from('books').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data?.length) {
    return notFound(res, 'Buku tidak ditemukan');
  }

  await removeContent(current?.content_url);

  res.json({ success: true, message: 'Buku berhasil dihapus' });
}));
