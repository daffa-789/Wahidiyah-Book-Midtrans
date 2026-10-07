import { Router } from 'express';
import path from 'path';
import { effectiveIsPro, requireAdmin, requireAuth } from '../auth.js';
import { fail, safeContentMime, sendDataUrl, wrap } from '../lib/http.js';
import { CONTENT_EXTENSIONS } from '../lib/constants.js';
import { uploadBookFiles } from '../middleware/uploads.js';
import { booksService } from '../services/books.service.js';

export const booksRouter = Router();

booksRouter.get('/books', async (req, res) => {
  try {
    const books = await booksService.getAllBooks();
    res.json({ success: true, books });
  } catch (error) {
    fail(res, error);
  }
});

booksRouter.post('/books', requireAuth, requireAdmin, wrap(async (req, res) => {
  const bookId = await booksService.createBook(req.body);
  res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', bookId });
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

  const bookId = await booksService.uploadBookWithFiles({
    title, subtitle, author, category, pages, is_locked, description, thumbnail, content
  });

  res.status(201).json({ success: true, message: 'Buku berhasil diunggah', bookId });
}));

booksRouter.get('/books/:id/thumbnail', wrap(async (req, res) => {
  const book = await booksService.getBookById(req.params.id, 'cover_url, thumbnail_url');
  const url = book?.thumbnail_url || book?.cover_url;
  if (!url) return res.status(404).json({ success: false, message: 'Thumbnail tidak ditemukan' });

  if (sendDataUrl(res, url, { cacheControl: 'public, max-age=86400' })) return;
  return res.redirect(url);
}));

booksRouter.get('/books/:id/content', requireAuth, wrap(async (req, res) => {
  const book = await booksService.getBookById(req.params.id, 'content_url, content_name, content_mime, content_extension, is_locked');
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
  await booksService.updateBook(req.params.id, req.body);
  res.json({ success: true, message: 'Buku berhasil diperbarui' });
}));

booksRouter.delete('/books/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  await booksService.deleteBook(req.params.id);
  res.json({ success: true, message: 'Buku berhasil dihapus' });
}));
