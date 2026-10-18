

import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { generateId, requireAdmin, requireAuth } from '../auth.js';
import {
  badRequest,
  fail,
  notFound,
  wrap
} from '../lib/http.js';
import { clippedText, parseBooleanFlag, toDateYmd } from '../lib/validate.js';
import { logger } from '../logger.js';
import { sendEventReminderNow, sendEventAnnouncementNow } from '../lib/eventReminder.js';

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


/* Pengingat H-1 dikirim segera setelah agenda disimpan, tetapi TIDAK boleh
   menggagalkan permintaan admin bila push service sedang bermasalah.
   Kalau jarak H-1 belum tiba (agenda masih jauh), fungsi ini tidak
   mengirim apa pun — penyapu berkala di server.js yang menyusul nanti. */
const trySendReminder = async (eventId) => {
  try {
    const result = await sendEventReminderNow(eventId);
    if (result.sent > 0) {
      logger.ok('PUSH', 'Pengingat H-1 langsung terkirim saat agenda disimpan', {
        agenda: eventId,
        perangkat: result.sent
      });
    }
    return result;
  } catch (error) {
    logger.warn('PUSH', 'Pengingat H-1 gagal dikirim (agenda tetap tersimpan)', {
      agenda: eventId,
      pesan: error.message
    });
    return null;
  }
};


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
    return badRequest(res, 'Judul, tanggal, dan lokasi wajib diisi');
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

  const broadcastNotification = req.body.broadcast_notification === undefined || parseBooleanFlag(req.body.broadcast_notification);
  let announcementSent = 0;
  if (broadcastNotification) {
    try {
      const annResult = await sendEventAnnouncementNow(id);
      announcementSent = annResult?.sent || 0;
    } catch (annError) {
      logger.warn('PUSH', 'Gagal menyiarkan pengumuman agenda baru', { agenda: id, pesan: annError.message });
    }
  }

  const reminder = await trySendReminder(id);

  res.status(201).json({
    success: true,
    message: carouselAdded ? 'Jadwal berhasil ditambahkan dan masuk ke carousel.' : 'Jadwal berhasil ditambahkan',
    eventId: id,
    carouselAdded,
    announcementSent,
    reminderSent: reminder?.sent || 0
  });
}));


eventsRouter.put('/events/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const row = toEventRow(req.body);
  if (!row.title || !row.event_date || !row.location) {
    return badRequest(res, 'Judul, tanggal, dan lokasi wajib diisi');
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
  if (!data?.length) return notFound(res, 'Agenda tidak ditemukan');

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

  /* Tanggal bisa berubah menjadi "besok", jadi pengingat dicek ulang.
     `sendEventReminderNow` menolak mengirim dua kali lewat `reminder_sent_at`. */
  const reminder = await trySendReminder(req.params.id);

  res.json({
    success: true,
    message: 'Agenda berhasil diperbarui',
    reminderSent: reminder?.sent || 0
  });
}));


eventsRouter.delete('/events/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { data, error } = await supabaseServer
    .from('events')
    .delete()
    .eq('id', req.params.id)
    .select('id');
  if (error) throw error;
  if (!data?.length) return notFound(res, 'Agenda tidak ditemukan');

  res.json({ success: true, message: 'Jadwal kegiatan berhasil dihapus' });
}));


/* Pemicu manual untuk admin: kirim ulang pengingat agenda tertentu tanpa
   menunggu jam pengingat — berguna saat pengujian atau bila ada perangkat
   yang baru mengaktifkan notifikasi setelah pengingat otomatis berjalan. */
eventsRouter.post('/events/:id/send-reminder', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { data: event, error } = await supabaseServer
    .from('events')
    .select('id, title, event_date')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) throw error;
  if (!event) return notFound(res, 'Agenda tidak ditemukan');

  const type = req.body?.type || req.query?.type || 'auto';
  const result = await sendEventReminderNow(req.params.id, { force: true, type });

  if (result.skipped && result.reason === 'vapid-not-configured') {
    return res.status(503).json({
      success: false,
      message: 'Notifikasi belum diaktifkan — kunci VAPID belum diisi di .env.'
    });
  }

  if (result.sent === 0) {
    return res.json({
      success: true,
      sent: 0,
      message: result.pruned
        ? 'Tidak ada perangkat aktif — langganan lama dibersihkan.'
        : 'Belum ada perangkat yang mengaktifkan notifikasi.'
    });
  }

  res.json({
    success: true,
    sent: result.sent,
    failed: result.failed || 0,
    message: `Pengumuman agenda berhasil disiarkan ke ${result.sent} perangkat.`
  });
}));
