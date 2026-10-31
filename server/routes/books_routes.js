/**
 * Route Layer — Katalog Buku.
 *
 * Hanya berisi pendaftaran URL, middleware, ekstraksi DTO dari `req`, dan
 * pembentukan respons HTTP. Semua query database dan aturan bisnis berada di
 * `server/services/books_service.js`.
 */

import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { notFound, sendDataUrl, wrap } from '../lib/http.js';
import { sniffDataUrlImage } from '../lib/sniff.js';
import { uploadBookFiles } from '../middleware/uploads.js';
import {
  createBook,
  createBookWithContent,
  createContentUploadIntent,
  deleteBook,
  getBookById,
  getThumbnailTarget,
  listBooks,
  loadContentTarget,
  loadHtmlContent,
  parseBookInput,
  updateBook,
} from '../services/books_service.js';

export const booksRouter = Router();

const viewerOf = (req) => ({ user: req.user, authUser: req.authUser });

booksRouter.get(
  '/books',
  wrap(async (req, res) => {
    const books = await listBooks(req.query);
    res.json({ success: true, books });
  }),
);

booksRouter.get(
  '/books/:id',
  wrap(async (req, res) => {
    const book = await getBookById(req.params.id);
    res.json({ success: true, book });
  }),
);

booksRouter.post(
  '/books',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { title, pages, is_locked, cover_url } = parseBookInput(req.body);
    const bookId = await createBook({
      title,
      pages,
      isLocked: is_locked,
      coverUrl: cover_url,
    });
    res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', bookId });
  }),
);

booksRouter.post(
  '/books/upload-intent',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const ticket = await createContentUploadIntent(req.body?.filename);
    res.json({ success: true, ...ticket });
  }),
);

booksRouter.post(
  '/books/upload',
  requireAuth,
  requireAdmin,
  uploadBookFiles,
  wrap(async (req, res) => {
    const { title, pages, is_locked, content_path, content_name } = req.body;
    const bookId = await createBookWithContent({
      title,
      pages,
      isLocked: is_locked,
      contentPath: content_path,
      contentName: content_name,
      thumbnailBuffer: req.files?.thumbnail?.[0]?.buffer,
    });
    res.status(201).json({ success: true, message: 'Buku berhasil diunggah', bookId });
  }),
);

booksRouter.get(
  '/books/:id/thumbnail',
  wrap(async (req, res) => {
    const url = await getThumbnailTarget(req.params.id);

    /* Jenis gambar ditentukan dari byte-nya, bukan label di data URL (VULN-13).
     * Data URL yang isinya bukan gambar tidak disajikan sama sekali.
     */
    if (url.startsWith('data:')) {
      const imageMime = sniffDataUrlImage(url);
      if (!imageMime) return notFound(res, 'Thumbnail tidak dapat disajikan');
      if (sendDataUrl(res, url, { contentType: imageMime, cacheControl: 'public, max-age=86400' }))
        return;
    }

    return res.redirect(url);
  }),
);

booksRouter.get(
  '/books/:id/html',
  requireAuth,
  wrap(async (req, res) => {
    const { html, type } = await loadHtmlContent({ id: req.params.id, viewer: viewerOf(req) });
    res.json({ success: true, html, type });
  }),
);

booksRouter.get(
  '/books/:id/content',
  requireAuth,
  wrap(async (req, res) => {
    const { target, mime, name, disposition } = await loadContentTarget({
      id: req.params.id,
      viewer: viewerOf(req),
    });

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(name)}`,
    );
    /* Alihan ke URL bertanda tidak boleh ikut tersimpan di tepi CDN: alamat itu
     * memberi akses baca tanpa sesi, dan usianya sengaja pendek.
     */
    res.setHeader(
      'Cache-Control',
      target.startsWith('http') ? 'no-store' : 'private, max-age=3600',
    );

    if (sendDataUrl(res, target, { contentType: mime })) return;
    return res.redirect(target);
  }),
);

booksRouter.put(
  '/books/:id',
  requireAuth,
  requireAdmin,
  uploadBookFiles,
  wrap(async (req, res) => {
    const { title, pages, is_locked, content_path, content_name } = req.body;
    await updateBook({
      id: req.params.id,
      title,
      pages,
      isLocked: is_locked,
      contentPath: content_path,
      contentName: content_name,
      thumbnailBuffer: req.files?.thumbnail?.[0]?.buffer,
    });
    res.json({ success: true, message: 'Buku berhasil diperbarui' });
  }),
);

booksRouter.delete(
  '/books/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    await deleteBook(req.params.id);
    res.json({ success: true, message: 'Buku berhasil dihapus' });
  }),
);
