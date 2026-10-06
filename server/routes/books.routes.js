

import path from 'path';
import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { effectiveIsPro, generateId, requireAdmin, requireAuth } from '../auth.js';
import {
  fail,
  isSafeRawImageFallback,
  safeContentMime,
  sendDataUrl,
  wrap
} from '../lib/http.js';
import { toDataUrl, toWebp } from '../lib/images.js';
import { BOOK_FIELDS, CONTENT_EXTENSIONS } from '../lib/constants.js';
import { parseBooleanFlag } from '../lib/validate.js';
import { uploadBookFiles } from '../middleware/uploads.js';

export const booksRouter = Router();


const toBookResponse = (book) => ({
  ...book,
  category: book.category || 'Umum',
  is_locked: Boolean(book.is_locked),
  has_thumbnail: Boolean(book.thumbnail_url || book.cover_url),
  
  
  
  has_content: Number(book.content_size) > 0
});


booksRouter.get('/books', async (req, res) => {
  try {
    const { data, error } = await supabaseServer
      .from('books')
      .select(BOOK_FIELDS)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, books: (data || []).map(toBookResponse) });
  } catch (error) {
    fail(res, error);
  }
});


booksRouter.post('/books', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { title, subtitle, author, category, pages, is_locked, cover_url, description } = req.body;
  if (!title || !author || !category) {
    return res.status(400).json({ success: false, message: 'Judul, Penulis, dan Kategori wajib diisi' });
  }

  const id = generateId('buku');
  const { error } = await supabaseServer.from('books').insert({
    id,
    title: title.trim(),
    subtitle: subtitle || '',
    author: author.trim(),
    category: String(category).trim(),
    pages: Number(pages) || 100,
    total_pages: Number(pages) || 100,
    is_locked: parseBooleanFlag(is_locked),
    cover_url: cover_url || '',
    description: description || ''
  });
  if (error) throw error;

  res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', bookId: id });
}));


booksRouter.post('/books/upload', requireAuth, requireAdmin, uploadBookFiles, wrap(async (req, res) => {
  const { title, subtitle, author, category, pages, is_locked, description } = req.body;
  const thumbnail = req.files?.thumbnail?.[0];
  const content = req.files?.content?.[0];
  const contentExtension = content ? path.extname(content.originalname).toLowerCase() : '';

  if (!title || !author || !category || !content) {
    return res.status(400).json({ success: false, message: 'Judul, penulis, kategori, dan file konten wajib diisi' });
  }
  if (thumbnail && !thumbnail.mimetype.startsWith('image/')) {
    return res.status(415).json({ success: false, message: 'Thumbnail harus berupa file gambar' });
  }
  if (thumbnail && thumbnail.size > 5 * 1024 * 1024) {
    return res.status(413).json({ success: false, message: 'Ukuran thumbnail maksimal 5 MB' });
  }
  if (!CONTENT_EXTENSIONS.has(contentExtension)) {
    return res.status(415).json({ success: false, message: 'Konten mendukung PDF, TXT, DOC/DOCX, RTF, ODT, EPUB, Markdown, atau CSV.' });
  }

  const id = generateId('buku');
  let thumbnailBuffer = null;
  let thumbnailMime = null;

  if (thumbnail?.buffer) {
    const result = await toWebp(thumbnail.buffer, {
      width: 600,
      quality: 80,
      fallbackMime: thumbnail.mimetype
    });
    if (!result.converted && !isSafeRawImageFallback(thumbnail.mimetype)) {
      return res.status(415).json({
        success: false,
        message: 'Thumbnail tidak dapat diproses. Gunakan PNG, JPG, atau WebP.'
      });
    }
    thumbnailBuffer = result.buffer;
    thumbnailMime = result.mime;
  }

  
  
  
  const coverUrl = toDataUrl(thumbnailBuffer, thumbnailMime);
  const extension = contentExtension.replace(/^\./, '');

  const { error } = await supabaseServer.from('books').insert({
    id,
    title: title.trim(),
    subtitle: subtitle || '',
    author: author.trim(),
    category: String(category).trim(),
    pages: Number(pages) || 1,
    total_pages: Number(pages) || 1,
    is_locked: is_locked === 'true' || is_locked === true || is_locked === 1,
    cover_url: coverUrl,
    thumbnail_url: coverUrl,
    content_url: `data:${content.mimetype || 'application/pdf'};base64,${content.buffer.toString('base64')}`,
    content_name: content.originalname,
    content_extension: extension,
    content_mime: content.mimetype,
    content_size: content.size,
    content_type: extension,
    description: description || ''
  });
  if (error) throw error;

  res.status(201).json({ success: true, message: 'Buku berhasil diunggah', bookId: id });
}));


booksRouter.get('/books/:id/thumbnail', wrap(async (req, res) => {
  const { data: book } = await supabaseServer
    .from('books')
    .select('cover_url, thumbnail_url')
    .eq('id', req.params.id)
    .maybeSingle();

  const url = book?.thumbnail_url || book?.cover_url;
  if (!url) return res.status(404).json({ success: false, message: 'Thumbnail tidak ditemukan' });

  if (sendDataUrl(res, url, { cacheControl: 'public, max-age=86400' })) return;
  return res.redirect(url);
}));


booksRouter.get('/books/:id/content', requireAuth, wrap(async (req, res) => {
  const { data: book } = await supabaseServer
    .from('books')
    .select('content_url, content_name, content_mime, content_extension, is_locked')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!book?.content_url) return res.status(404).json({ success: false, message: 'Konten buku tidak ditemukan' });

  if (book.is_locked && !effectiveIsPro(req.user) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Buku ini khusus pembaca Pro. Aktifkan paket Pro untuk membukanya.' });
  }

  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(book.content_name || 'book.pdf')}`);
  res.setHeader('Cache-Control', 'private, max-age=3600');

  if (sendDataUrl(res, book.content_url, { fallbackMime: safeContentMime(book) })) return;
  return res.redirect(book.content_url);
}));


booksRouter.put('/books/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, author, category, pages, is_locked, cover_url, description } = req.body;

  if (!title || !author || !category) {
    return res.status(400).json({ success: false, message: 'Judul, Penulis, dan Kategori wajib diisi' });
  }

  const { error } = await supabaseServer.from('books').update({
    title: title.trim(),
    subtitle: subtitle || '',
    author: author.trim(),
    category: String(category).trim(),
    pages: Number(pages) || 1,
    is_locked: parseBooleanFlag(is_locked),
    cover_url: cover_url || '',
    description: description || '',
    updated_at: new Date().toISOString()
  }).eq('id', id);
  if (error) throw error;

  res.json({ success: true, message: 'Buku berhasil diperbarui' });
}));


booksRouter.delete('/books/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;

  
  
  const { data: existing } = await supabaseServer
    .from('books')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
  }

  const { error } = await supabaseServer.from('books').delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true, message: 'Buku berhasil dihapus' });
}));
