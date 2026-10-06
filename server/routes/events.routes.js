

import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { generateId, requireAdmin, requireAuth } from '../auth.js';
import { fail, wrap } from '../lib/http.js';
import { clippedText, parseBooleanFlag, toDateYmd } from '../lib/validate.js';

export const eventsRouter = Router();


const DEFAULT_TIME_START = '19:30';
const DEFAULT_TIME_END = '21:00';
const DEFAULT_CATEGORY = 'Mujahadah';
const DEFAULT_ORGANIZER = 'DPP PSW';

const TIME_PATTERN = /^\d{2}:\d{2}$/;


const toEventRow = (body = {}) => {
  const timeStart = TIME_PATTERN.test(String(body.time_start || '')) ? body.time_start : DEFAULT_TIME_START;
  const timeEnd = TIME_PATTERN.test(String(body.time_end || '')) ? body.time_end : DEFAULT_TIME_END;
  return {
    title: clippedText(body.title, 200).trim(),
    event_date: toDateYmd(body.event_date),
    time_start: timeStart,
    time_end: timeEnd,
    location: clippedText(body.location, 200).trim(),
    category: clippedText(body.category, 50).trim() || DEFAULT_CATEGORY,
    description: clippedText(body.description, 1000),
    organizer: clippedText(body.organizer, 150).trim() || DEFAULT_ORGANIZER
  };
};


const isMissingColumn = (error, column) =>
  error?.code === '42703' || String(error?.message || '').includes(column);

const isMissingCarouselTable = (error) =>
  error?.code === '42P01' || String(error?.message || '').includes('carousel_slides');


const syncEventSlide = async (eventId, { title, eventDate, location, description, showInCarousel }) => {
  const { data: existing } = await supabaseServer
    .from('carousel_slides')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (!showInCarousel) {
    if (!existing) return false;
    await supabaseServer.from('carousel_slides').delete().eq('event_id', eventId);
    return false;
  }

  if (existing) {
    await supabaseServer.from('carousel_slides').update({
      title,
      description: description || location || '',
      event_date: eventDate,
      updated_at: new Date().toISOString()
    }).eq('id', existing.id);
    return true;
  }

  await supabaseServer.from('carousel_slides').insert({
    id: generateId('slide'),
    title,
    description: description || location || '',
    event_id: eventId,
    event_date: eventDate,
    is_active: true,
    sort_order: 0,
    starts_at: null,
    ends_at: null,
    image_url: null
  });
  return true;
};


eventsRouter.get('/events', async (req, res) => {
  try {
    const { data } = await supabaseServer
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    res.json({ success: true, events: data || [] });
  } catch (error) {
    fail(res, error);
  }
});


eventsRouter.post('/events', requireAuth, requireAdmin, wrap(async (req, res) => {
  const row = toEventRow(req.body);
  if (!row.title || !row.event_date || !row.location) {
    return res.status(400).json({ success: false, message: 'Judul, tanggal, dan lokasi wajib diisi' });
  }

  const showInCarousel = parseBooleanFlag(req.body.show_in_carousel);
  const id = generateId('evt');

  let insertError = null;
  const withFlag = await supabaseServer
    .from('events')
    .insert({ id, ...row, show_in_carousel: showInCarousel })
    .then(() => true)
    .catch((error) => { insertError = error; return false; });

  
  if (!withFlag) {
    if (!isMissingColumn(insertError, 'show_in_carousel')) throw insertError;
    const { error } = await supabaseServer.from('events').insert({ id, ...row });
    if (error) throw error;
  }

  let carouselAdded = false;
  if (showInCarousel) {
    try {
      carouselAdded = await syncEventSlide(id, {
        title: row.title,
        eventDate: row.event_date,
        location: row.location,
        description: row.description,
        showInCarousel: true
      });
    } catch (slideError) {
      if (!isMissingCarouselTable(slideError)) throw slideError;
    }
  }

  res.status(201).json({
    success: true,
    message: carouselAdded ? 'Jadwal berhasil ditambahkan dan masuk ke carousel.' : 'Jadwal berhasil ditambahkan',
    eventId: id,
    carouselAdded
  });
}));


eventsRouter.put('/events/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const row = toEventRow(req.body);
  if (!row.title || !row.event_date || !row.location) {
    return res.status(400).json({ success: false, message: 'Judul, tanggal, dan lokasi wajib diisi' });
  }

  const showInCarousel = parseBooleanFlag(req.body.show_in_carousel);
  const patch = { ...row, show_in_carousel: showInCarousel };

  const { data, error } = await supabaseServer
    .from('events')
    .update(patch)
    .eq('id', req.params.id)
    .select('id')
    .then((result) => (isMissingColumn(result.error, 'show_in_carousel')
      ? supabaseServer.from('events').update(row).eq('id', req.params.id).select('id')
      : result));

  if (error) throw error;
  if (!data?.length) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });

  try {
    await syncEventSlide(req.params.id, {
      title: row.title,
      eventDate: row.event_date,
      location: row.location,
      description: row.description,
      showInCarousel
    });
  } catch (slideError) {
    if (!isMissingCarouselTable(slideError)) throw slideError;
  }

  res.json({ success: true, message: 'Agenda berhasil diperbarui' });
}));


eventsRouter.delete('/events/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { data, error } = await supabaseServer
    .from('events')
    .delete()
    .eq('id', req.params.id)
    .select('id');
  if (error) throw error;
  if (!data?.length) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });

  res.json({ success: true, message: 'Jadwal kegiatan berhasil dihapus' });
}));
