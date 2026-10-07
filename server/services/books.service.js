import { supabaseServer } from '../db.js';
import { generateId } from '../auth.js';
import { BOOK_FIELDS } from '../lib/constants.js';
import { parseBooleanFlag } from '../lib/validate.js';
import { toDataUrl, toWebp, isSafeRawImageFallback } from '../lib/images.js';
import path from 'path';

export const toBookResponse = (book) => ({
  ...book,
  category: book.category || 'Umum',
  is_locked: Boolean(book.is_locked),
  has_thumbnail: Boolean(book.thumbnail_url || book.cover_url),
  has_content: Number(book.content_size) > 0
});

export const booksService = {
  async getAllBooks() {
    const { data, error } = await supabaseServer
      .from('books')
      .select(BOOK_FIELDS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toBookResponse);
  },

  async getBookById(id, columns = '*') {
    const { data, error } = await supabaseServer
      .from('books')
      .select(columns)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createBook({ title, subtitle, author, category, pages, is_locked, cover_url, description }) {
    if (!title || !author || !category) {
      const err = new Error('Judul, Penulis, dan Kategori wajib diisi');
      err.statusCode = 400;
      throw err;
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
    return id;
  },

  async uploadBookWithFiles({ title, subtitle, author, category, pages, is_locked, description, thumbnail, content }) {
    if (!title || !author || !category || !content) {
      const err = new Error('Judul, penulis, kategori, dan file konten wajib diisi');
      err.statusCode = 400;
      throw err;
    }

    const contentExtension = path.extname(content.originalname).toLowerCase();
    let thumbnailBuffer = null;
    let thumbnailMime = null;

    if (thumbnail?.buffer) {
      const result = await toWebp(thumbnail.buffer, {
        width: 600,
        quality: 80,
        fallbackMime: thumbnail.mimetype
      });

      if (!result.converted && !isSafeRawImageFallback(thumbnail.mimetype)) {
        const err = new Error('Thumbnail tidak dapat diproses. Gunakan PNG, JPG, atau WebP.');
        err.statusCode = 415;
        throw err;
      }
      thumbnailBuffer = result.buffer;
      thumbnailMime = result.mime;
    }

    const id = generateId('buku');
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
      is_locked: parseBooleanFlag(is_locked),
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
    return id;
  },

  async updateBook(id, { title, subtitle, author, category, pages, is_locked, cover_url, description }) {
    if (!title || !author || !category) {
      const err = new Error('Judul, Penulis, dan Kategori wajib diisi');
      err.statusCode = 400;
      throw err;
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
  },

  async deleteBook(id) {
    const existing = await this.getBookById(id, 'id');
    if (!existing) {
      const err = new Error('Buku tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    const { error } = await supabaseServer.from('books').delete().eq('id', id);
    if (error) throw error;
  }
};
