

import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { generateId, requireAdmin, requireAuth } from '../auth.js';
import { isSafeRawImageFallback, wrap } from '../lib/http.js';
import { toDataUrl, toWebp } from '../lib/images.js';
import {
  CAROUSEL_DESCRIPTION_MAX,
  CAROUSEL_FIELDS,
  CAROUSEL_IMAGE_QUALITY,
  CAROUSEL_IMAGE_WIDTH,
  CAROUSEL_TITLE_MAX
} from '../lib/constants.js';
import {
  clippedText,
  parseBooleanFlag,
  toDateYmd,
  toRangedInt
} from '../lib/validate.js';
import { uploadCarouselImage } from '../middleware/uploads.js';
import { todayWib } from '../lib/time.js';

export const carouselRouter = Router();

const isMissingTable = (error) =>
  error?.code === '42P01' ||
  error?.code === 'PGRST205' ||
  String(error?.message || '').includes('carousel_slides');

const todayYmd = () => todayWib();

const isWithinPeriod = (slide, today) =>
  (!slide.starts_at || slide.starts_at <= today) &&
  (!slide.ends_at || slide.ends_at >= today);

const readSlideInput = (body = {}) => {
  const fields = {};
  const has = {};

  if (body.title !== undefined) {
    fields.title = clippedText(body.title, CAROUSEL_TITLE_MAX);
    has.title = true;
  }
  if (body.description !== undefined) {
    fields.description = clippedText(body.description, CAROUSEL_DESCRIPTION_MAX);
    has.description = true;
  }
  if (body.sort_order !== undefined) {
    fields.sort_order = toRangedInt(body.sort_order, { min: 0, max: 9999, fallback: 0 });
    has.sort_order = true;
  }
  if (body.is_active !== undefined) {
    fields.is_active = parseBooleanFlag(body.is_active);
    has.is_active = true;
  }
  if (body.event_date !== undefined) {
    fields.event_date = toDateYmd(body.event_date);
    has.event_date = true;
  }
  if (body.event_id !== undefined) {
    fields.event_id = clippedText(body.event_id, 50) || null;
    has.event_id = true;
  }
  for (const key of ['starts_at', 'ends_at']) {
    if (body[key] !== undefined) {
      fields[key] = toDateYmd(body[key]);
      has[key] = true;
    }
  }

  return { fields, has };
};

const isoToYmd = (value) => String(value ?? '').slice(0, 10) || null;

const toSlideResponse = (slide) => ({
  ...slide,
  is_active: Boolean(slide.is_active),
  sort_order: Number(slide.sort_order) || 0,
  event_date: isoToYmd(slide.event_date),
  starts_at: isoToYmd(slide.starts_at),
  ends_at: isoToYmd(slide.ends_at)
});

carouselRouter.get('/carousel', wrap(async (req, res) => {
  const today = todayYmd();
  const { data, error } = await supabaseServer
    .from('carousel_slides')
    .select(CAROUSEL_FIELDS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTable(error)) return res.json({ success: true, slides: [], carouselReady: false });
    throw error;
  }

  const slides = (data || [])
    .map(toSlideResponse)
    .filter((slide) => isWithinPeriod(slide, today));

  res.json({ success: true, slides, carouselReady: true });
}));

carouselRouter.get('/carousel/all', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { data, error } = await supabaseServer
    .from('carousel_slides')
    .select(CAROUSEL_FIELDS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTable(error)) return res.json({ success: true, slides: [], carouselReady: false });
    throw error;
  }
  res.json({ success: true, slides: (data || []).map(toSlideResponse), carouselReady: true });
}));

carouselRouter.post('/carousel', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { fields } = readSlideInput(req.body);
  if (!fields.title) {
    return res.status(400).json({ success: false, message: 'Judul banner wajib diisi' });
  }
  if (fields.starts_at && fields.ends_at && fields.ends_at < fields.starts_at) {
    return res.status(400).json({ success: false, message: 'Tanggal selesai tidak boleh sebelum tanggal mulai' });
  }

  const id = generateId('slide');
  const { error } = await supabaseServer.from('carousel_slides').insert({
    id,
    title: fields.title,
    description: fields.description ?? '',
    event_id: fields.event_id ?? null,
    event_date: fields.event_date ?? null,
    sort_order: fields.sort_order ?? 0,
    is_active: fields.is_active ?? true,
    starts_at: fields.starts_at ?? null,
    ends_at: fields.ends_at ?? null,
    image_url: null
  });
  if (error) {
    if (isMissingTable(error)) {
      return res.status(503).json({
        success: false,
        message: 'Tabel carousel_slides belum dibuat. Jalankan supabase_database/full_setup.sql di SQL Editor.'
      });
    }
    throw error;
  }

  res.status(201).json({ success: true, message: 'Banner berhasil ditambahkan', slideId: id });
}));

carouselRouter.put('/carousel/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { fields, has } = readSlideInput(req.body);
  if (has.title && !fields.title) {
    return res.status(400).json({ success: false, message: 'Judul banner wajib diisi' });
  }

  const startsAt = fields.starts_at;
  const endsAt = fields.ends_at;
  if (startsAt && endsAt && endsAt < startsAt) {
    return res.status(400).json({ success: false, message: 'Tanggal selesai tidak boleh sebelum tanggal mulai' });
  }

  const patch = { ...fields, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseServer
    .from('carousel_slides')
    .update(patch)
    .eq('id', req.params.id)
    .select('id');

  if (error) {
    if (isMissingTable(error)) {
      return res.status(503).json({ success: false, message: 'Tabel carousel_slides belum dibuat.' });
    }
    throw error;
  }
  if (!data?.length) return res.status(404).json({ success: false, message: 'Banner tidak ditemukan' });

  res.json({ success: true, message: 'Banner berhasil diperbarui' });
}));

carouselRouter.delete('/carousel/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { data, error } = await supabaseServer
    .from('carousel_slides')
    .delete()
    .eq('id', req.params.id)
    .select('id');

  if (error) {
    if (isMissingTable(error)) {
      return res.status(503).json({ success: false, message: 'Tabel carousel_slides belum dibuat.' });
    }
    throw error;
  }
  if (!data?.length) return res.status(404).json({ success: false, message: 'Banner tidak ditemukan' });

  res.json({ success: true, message: 'Banner berhasil dihapus' });
}));

carouselRouter.post('/carousel/:id/image', requireAuth, requireAdmin, uploadCarouselImage, wrap(async (req, res) => {
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ success: false, message: 'Tidak ada berkas gambar yang diterima' });
  }

  const originalMime = req.file.mimetype || 'application/octet-stream';
  const result = await toWebp(req.file.buffer, {
    width: CAROUSEL_IMAGE_WIDTH,
    quality: CAROUSEL_IMAGE_QUALITY,
    fallbackMime: originalMime
  });

  if (!result.converted && !isSafeRawImageFallback(originalMime)) {
    return res.status(415).json({ success: false, message: 'Format gambar tidak didukung. Gunakan PNG, JPEG, atau WebP.' });
  }

  const { data, error } = await supabaseServer
    .from('carousel_slides')
    .update({ image_url: toDataUrl(result.buffer, result.mime), updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('id');

  if (error) {
    if (isMissingTable(error)) {
      return res.status(503).json({ success: false, message: 'Tabel carousel_slides belum dibuat.' });
    }
    throw error;
  }
  if (!data?.length) return res.status(404).json({ success: false, message: 'Banner tidak ditemukan' });

  res.json({ success: true, message: 'Gambar banner berhasil diperbarui' });
}));
