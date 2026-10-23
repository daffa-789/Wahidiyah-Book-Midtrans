

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
import { BOOK_FIELDS, CONTENT_EXTENSIONS, CONTENT_MIME_BY_EXTENSION } from '../lib/constants.js';
import { bookInputSchema, parseBooleanFlag } from '../lib/validate.js';
import { uploadBookFiles } from '../middleware/uploads.js';

export const booksRouter = Router();


const toBookResponse = (book) => ({
  ...book,
  pages: Number(book.pages || 1),
  is_locked: Boolean(book.is_locked),
  has_thumbnail: Boolean(book.cover_url || book.thumbnail_url),
  has_content: Number(book.content_size) > 0
});


booksRouter.get('/books', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = supabaseServer.from('books').select(BOOK_FIELDS);

    if (category && category !== 'Semua') {
      query = query.eq('category', category);
    }

    if (search && typeof search === 'string') {
      const trimmed = search.trim();
      if (trimmed) {
        // Hilangkan karakter pengendali PostgREST sebelum dimasukkan ke pola pencarian
        const safe = trimmed.replace(/[%_,()]/g, '');
        if (safe) {
          query = query.or(`title.ilike.%${safe}%,author.ilike.%${safe}%,description.ilike.%${safe}%`);
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

  const id = generateId('buku');
  const { error } = await supabaseServer.from('books').insert({
    id,
    title: title.trim(),
    pages: Number(pages) || 1,
    is_locked: is_locked === 'true' || is_locked === true || is_locked === 1,
    cover_url: coverUrl,
    content_url: `data:${canonicalContentMime};base64,${content.buffer.toString('base64')}`,
    content_name: content.originalname,
    content_extension: extension,
    content_mime: canonicalContentMime,
    content_size: content.size,
    content_type: extension
  });
  if (error) throw error;

  res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', bookId: id });
}));



booksRouter.post('/books/upload', requireAuth, requireAdmin, uploadBookFiles, wrap(async (req, res) => {
  const { title, subtitle, author, category, pages, is_locked, description } = req.body;
  const thumbnail = req.files?.thumbnail?.[0];
  const content = req.files?.content?.[0];
  const contentExtension = content ? path.extname(content.originalname).toLowerCase() : '';

  if (!title || !content || !thumbnail) {
    return badRequest(res, 'Judul, thumbnail, dan file konten wajib diisi');
  }
  /* Jenis berkas ditentukan dari isinya, bukan dari `mimetype` kiriman klien
   * (VULN-11). Sharp tetap dipakai untuk konversi, tetapi keputusan menerima
   * atau menolak dibuat di sini.
   */
  const thumbnailMimeDetected = thumbnail?.buffer ? sniffImageMime(thumbnail.buffer) : null;
  if (thumbnail && !thumbnailMimeDetected) {
    return res.status(415).json({ success: false, message: 'Thumbnail harus berupa gambar PNG, JPG, WebP, atau GIF.' });
  }
  if (thumbnail && thumbnail.size > 5 * 1024 * 1024) {
    return res.status(413).json({ success: false, message: 'Ukuran thumbnail maksimal 5 MB' });
  }
  if (!CONTENT_EXTENSIONS.has(contentExtension)) {
    return res.status(415).json({ success: false, message: 'Konten mendukung PDF, TXT, DOC/DOCX, RTF, ODT, EPUB, Markdown, atau CSV.' });
  }
  if (!matchesContentExtension(content.buffer, contentExtension)) {
    return res.status(415).json({
      success: false,
      message: `Isi berkas tidak cocok dengan ekstensi ${contentExtension}. Periksa apakah berkasnya benar-benar jenis tersebut.`
    });
  }

  const id = generateId('buku');
  let thumbnailBuffer = null;
  let thumbnailMime = null;

  if (thumbnail?.buffer) {
    const result = await toWebp(thumbnail.buffer, {
      width: 600,
      quality: 80,
      fallbackMime: thumbnailMimeDetected
    });
    thumbnailBuffer = result.buffer;
    thumbnailMime = result.mime;
  }

  
  
  
  const coverUrl = toDataUrl(thumbnailBuffer, thumbnailMime);
  const extension = contentExtension.replace(/^\./, '');
  /* MIME kanonis dari ekstensi yang sudah lolos pemeriksaan magic byte —
   * bukan `content.mimetype` kiriman klien (VULN-13).
   */
  const canonicalContentMime = CONTENT_MIME_BY_EXTENSION[extension] || 'application/octet-stream';
  const safeAuthor = (author && String(author).trim()) || '';
  const safeCategory = (category && String(category).trim()) || 'Kitab';
  const safeDescription = (description && String(description).trim()) || '';

  const { error } = await supabaseServer.from('books').insert({
    id,
    title: title.trim(),
    subtitle: subtitle || '',
    author: safeAuthor,
    category: safeCategory,
    pages: Number(pages) || 1,
    total_pages: Number(pages) || 1,
    is_locked: is_locked === 'true' || is_locked === true || is_locked === 1,
    cover_url: coverUrl,
    thumbnail_url: coverUrl,
    content_url: `data:${canonicalContentMime};base64,${content.buffer.toString('base64')}`,
    content_name: content.originalname,
    content_extension: extension,
    content_mime: canonicalContentMime,
    content_size: content.size,
    content_type: extension,
    description: safeDescription
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
    .select('content_url, content_name, content_mime, content_extension, is_locked')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!book?.content_url) return notFound(res, 'Konten buku tidak ditemukan');

  if (book.is_locked && !hasActivePro(req.authUser || req.user) && req.user.role !== 'admin') {
    return forbidden(res, 'Buku ini khusus pembaca Pro. Aktifkan paket Pro untuk membukanya.');
  }

  let buffer;
  if (book.content_url.startsWith('data:')) {
    const base64Data = book.content_url.split(',')[1];
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    const fetched = await fetch(book.content_url);
    if (!fetched.ok) return notFound(res, 'Gagal mengambil isi berkas');
    const arrayBuf = await fetched.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
  }

  const ext = (book.content_extension || path.extname(book.content_name || '')).toLowerCase().replace('.', '');

  if (ext === 'docx' || ext === 'doc') {
    try {
      const conversion = await mammoth.convertToHtml({ buffer });
      return res.json({ success: true, html: conversion.value, type: 'docx' });
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
    .select('content_url, content_name, content_mime, content_extension, is_locked')
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
  res.setHeader('Cache-Control', 'private, max-age=3600');

  if (sendDataUrl(res, book.content_url, { contentType: contentMime })) return;
  return res.redirect(book.content_url);
}));


booksRouter.put('/books/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, author, category, pages, is_locked, cover_url, description } = req.body;

  if (!title || !author || !category) {
    return badRequest(res, 'Judul, Penulis, dan Kategori wajib diisi');
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
    return notFound(res, 'Buku tidak ditemukan');
  }

  const { error } = await supabaseServer.from('books').delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true, message: 'Buku berhasil dihapus' });
}));
