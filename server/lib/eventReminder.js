/* Pengirim pengingat agenda H-1 via Web Push.
 *
 * Dijalankan DUA cara:
 *   1. Saat admin membuat/mengubah agenda yang jatuh tempo BESOK → langsung
 *      dikirim (dipanggil dari server/routes/events.routes.js).
 *   2. Penyapu berkala di server.js yang memeriksa agenda H-1 setiap 15 menit,
 *      sebagai jaring pengaman bila server mati saat jadwal kirim tiba.
 *
 * Idempotensi dijaga kolom `events.reminder_sent_at`: satu agenda = satu kali
 * kirim, berapa pun kali penjadwal berjalan.
 */

import { supabaseServer } from '../db.js';
import { logger } from '../logger.js';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_REMINDER_HOUR } from '../config.js';
import { generateId } from '../auth.js';
import { todayWib } from './time.js';
import { sendWebPush, isValidVapidPublicKey, isValidVapidPrivateKey } from './webpush.js';

export const isPushConfigured = () =>
  isValidVapidPublicKey(VAPID_PUBLIC_KEY) &&
  isValidVapidPrivateKey(VAPID_PRIVATE_KEY) &&
  Boolean(VAPID_SUBJECT);

const vapidConfig = () => ({
  publicKey: VAPID_PUBLIC_KEY,
  privateKey: VAPID_PRIVATE_KEY,
  subject: VAPID_SUBJECT
});

/* Kolom/tabel baru mungkin belum dibuat pemilik (blok PATCH di
   supabase_database/full_setup.sql belum dijalankan). Fitur notifikasi
   sebaiknya mati dengan tenang, bukan menjatuhkan server. */
const MISSING_SCHEMA_CODES = new Set(['42P01', '42703']);

const isMissingSchema = (error) =>
  MISSING_SCHEMA_CODES.has(error?.code) ||
  /does not exist|schema cache/i.test(String(error?.message || ''));

let schemaWarningLogged = false;

const warnSchemaOnce = (error, scope) => {
  if (schemaWarningLogged) return;
  schemaWarningLogged = true;
  logger.warn(scope, 'Tabel/kolom Web Push belum ada — fitur notifikasi dilewati', {
    pesan: error?.message,
    solusi: 'jalankan blok "PATCH Web Push" pada supabase_database/full_setup.sql di SQL Editor Supabase, lalu restart'
  });
};

/* ── Langganan ─────────────────────────────────────────────────────────── */

export const saveSubscription = async ({ endpoint, keys, userAgent }) => {
  const existing = await supabaseServer
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (existing.error) {
    if (isMissingSchema(existing.error)) {
      warnSchemaOnce(existing.error, 'PUSH');
      const error = new Error('Tabel push_subscriptions belum dibuat di basis data.');
      error.schemaMissing = true;
      throw error;
    }
    throw existing.error;
  }

  const payload = {
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: String(userAgent || '').slice(0, 255),
    is_active: true,
    updated_at: new Date().toISOString()
  };

  if (existing.data) {
    // Perangkat yang sama berlangganan ulang: cukup segarkan kuncinya.
    const { error } = await supabaseServer
      .from('push_subscriptions')
      .update(payload)
      .eq('id', existing.data.id);
    if (error) throw error;
    return { id: existing.data.id, created: false };
  }

  const id = generateId('sub');
  const { error } = await supabaseServer
    .from('push_subscriptions')
    .insert({ id, endpoint, ...payload });
  if (error) throw error;
  return { id, created: true };
};

export const removeSubscription = async (endpoint) => {
  const { error } = await supabaseServer
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);
  if (error) throw error;
};

const deactivateSubscription = async (id) => {
  await supabaseServer
    .from('push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
};

export const countActiveSubscriptions = async () => {
  const { count, error } = await supabaseServer
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) {
    if (isMissingSchema(error)) {
      warnSchemaOnce(error, 'PUSH');
      return 0;
    }
    throw error;
  }
  return count || 0;
};

/* ── Pesan ─────────────────────────────────────────────────────────────── */

const EVENT_ICON = '/icon-192.png';

const buildEventPayload = (event, { type = 'auto' } = {}) => {
  const tomorrow = addDaysYmd(todayWib(), 1);
  const eventYmd = String(event.event_date || '').slice(0, 10);
  const isTomorrow = eventYmd === tomorrow;

  const time = [event.time_start, event.time_end].filter(Boolean).join('–');

  let formattedDate = '';
  try {
    if (event.event_date) {
      const [y, m, d] = String(event.event_date).slice(0, 10).split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      formattedDate = dt.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      });
    }
  } catch {}

  let title = '';
  let body = '';
  const isAnnouncement = type === 'announcement' || (!isTomorrow && type !== 'reminder');

  if (isAnnouncement) {
    title = `📢 Pengumuman Mujahadah: ${event.title}`;
    const parts = [
      formattedDate,
      time ? `Pukul ${time} WIB` : '',
      event.location ? `di ${event.location}` : ''
    ].filter(Boolean);
    body = parts.join(' · ') || 'Jadwal majelis baru telah diumumkan. Ketuk untuk melihat kalender.';
  } else {
    title = `⏰ Pengingat Besok: ${event.title}`;
    const parts = [
      time ? `Pukul ${time} WIB` : '',
      event.location ? `di ${event.location}` : ''
    ].filter(Boolean);
    body = parts.join(' · ') || 'Agenda majelis besok. Ketuk untuk membuka jadwal lengkap.';
  }

  return {
    title,
    body,
    icon: EVENT_ICON,
    badge: EVENT_ICON,
    tag: isAnnouncement ? `agenda-announcement-${event.id}` : `agenda-reminder-${event.id}`,
    url: '/calendar',
    kind: isAnnouncement ? 'event-announcement' : 'event-reminder'
  };
};

/* ── Kirim ke seluruh langganan ────────────────────────────────────────── */

const broadcastPush = async ({ payload, ttl = 24 * 60 * 60, urgency = 'normal' }) => {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, skipped: true, reason: 'vapid-not-configured' };
  }

  const { data: subs, error } = await supabaseServer
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('is_active', true);

  if (error) {
    if (isMissingSchema(error)) {
      warnSchemaOnce(error, 'PUSH');
      return { sent: 0, failed: 0, skipped: true, reason: 'schema-missing' };
    }
    throw error;
  }

  if (!subs?.length) return { sent: 0, failed: 0, skipped: false, reason: 'no-subscribers' };

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  /* Dikirim berurutan, bukan paralel: jumlah pelanggan skala kecil, dan
     push service dapat membalas 429 bila dihujani sekaligus. */
  for (const sub of subs) {
    try {
      const result = await sendWebPush({
        subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        vapid: vapidConfig(),
        ttl,
        urgency
      });

      if (result.ok) {
        sent += 1;
      } else if (result.reason === 'gone') {
        await deactivateSubscription(sub.id);
        pruned += 1;
      } else {
        failed += 1;
        logger.warn('PUSH', 'Pengiriman notifikasi gagal', {
          status: result.status,
          sebab: result.reason
        });
      }
    } catch (error) {
      failed += 1;
      logger.warn('PUSH', 'Pengiriman notifikasi error', { pesan: error.message });
    }
  }

  return { sent, failed, pruned, skipped: false };
};

/* ── Pengingat agenda ──────────────────────────────────────────────────── */

const addDaysYmd = (ymd, days) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Kirim PENGUMUMAN untuk SATU agenda ke seluruh perangkat jemaah yang aktif. */
export const sendEventAnnouncementNow = async (eventId) => {
  if (!isPushConfigured()) {
    return { sent: 0, skipped: true, reason: 'vapid-not-configured' };
  }

  const { data: event, error } = await supabaseServer
    .from('events')
    .select('id, title, event_date, time_start, time_end, location')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    if (isMissingSchema(error)) {
      warnSchemaOnce(error, 'PUSH');
      return { sent: 0, skipped: true, reason: 'schema-missing' };
    }
    throw error;
  }
  if (!event) return { sent: 0, skipped: true, reason: 'not-found' };

  const payload = buildEventPayload(event, { type: 'announcement' });
  const result = await broadcastPush({ payload });

  logger.ok('PUSH', 'Pengumuman agenda mujahadah berhasil disiarkan', {
    agenda: eventId,
    judul: event.title,
    terkirim: result.sent
  });

  return result;
};

/** Kirim pengingat untuk SATU agenda, bila agendanya jatuh tempo besok (atau force). */
export const sendEventReminderNow = async (eventId, { force = false, type = 'auto' } = {}) => {
  if (!isPushConfigured()) {
    return { sent: 0, skipped: true, reason: 'vapid-not-configured' };
  }

  const { data: event, error } = await supabaseServer
    .from('events')
    .select('id, title, event_date, time_start, time_end, location, reminder_sent_at')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    if (isMissingSchema(error)) {
      warnSchemaOnce(error, 'PUSH');
      return { sent: 0, skipped: true, reason: 'schema-missing' };
    }
    throw error;
  }
  if (!event) return { sent: 0, skipped: true, reason: 'not-found' };

  if (!force && event.reminder_sent_at) {
    return { sent: 0, skipped: true, reason: 'already-sent' };
  }

  const tomorrow = addDaysYmd(todayWib(), 1);
  const eventYmd = String(event.event_date || '').slice(0, 10);
  if (eventYmd !== tomorrow && !force) {
    return { sent: 0, skipped: true, reason: 'not-due-tomorrow' };
  }

  const payloadType = type !== 'auto' ? type : (eventYmd === tomorrow ? 'reminder' : 'announcement');
  const result = await broadcastPush({ payload: buildEventPayload(event, { type: payloadType }) });

  /* Tandai terkirim HANYA bila benar-benar ada yang menerima dan memang jadwal besok */
  if (result.sent > 0 && eventYmd === tomorrow) {
    const { error: markError } = await supabaseServer
      .from('events')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', eventId);
    /* Kolom penanda belum ada → notifikasi tetap terkirim, hanya tidak tercatat.
       Agendanya bisa terkirim ulang oleh penyapu berikutnya, jadi peringatkan. */
    if (markError && isMissingSchema(markError)) warnSchemaOnce(markError, 'PUSH');
  }

  return result;
};

/**
 * Penyapu berkala: cari semua agenda H-1 yang belum dikirim pengingatnya.
 * Dipanggil saat boot dan setiap 15 menit setelahnya.
 */
const sweepDueReminders = async () => {
  if (!isPushConfigured()) return { checked: 0, sent: 0, skipped: true };

  const tomorrow = addDaysYmd(todayWib(), 1);

  const { data: due, error } = await supabaseServer
    .from('events')
    .select('id, title')
    .eq('event_date', tomorrow)
    .is('reminder_sent_at', null);

  if (error) {
    if (isMissingSchema(error)) {
      warnSchemaOnce(error, 'PUSH');
      return { checked: 0, sent: 0, skipped: true, reason: 'schema-missing' };
    }
    throw error;
  }

  if (!due?.length) return { checked: 0, sent: 0, skipped: false };

  /* Jam kirim: agenda H-1 baru dinotifikasi setelah lewat PUSH_REMINDER_HOUR
     WIB, supaya notifikasi tidak datang tengah malam. */
  const nowWib = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date());

  const [targetHour, targetMinute] = PUSH_REMINDER_HOUR.split(':').map(Number);
  const [nowHour, nowMinute] = nowWib.split(':').map(Number);
  const dueAt = targetHour * 60 + targetMinute;
  const nowAt = nowHour * 60 + nowMinute;

  /* Lewat tengah malam setelah jam kirim hari ini (mis. 23:00 > 08:00) tetap
     dianggap waktunya — pengingat menyusul, lebih baik daripada tidak sama sekali. */
  const afterWindow = nowAt >= dueAt;

  if (!afterWindow) return { checked: due.length, sent: 0, skipped: true, reason: 'before-window' };

  let sent = 0;
  for (const event of due) {
    try {
      const result = await sendEventReminderNow(event.id);
      if (result.sent > 0) sent += 1;
    } catch (error) {
      logger.warn('PUSH', 'Pengingat agenda gagal dikirim', {
        event: event.id,
        pesan: error.message
      });
    }
  }

  if (sent > 0) logger.ok('PUSH', 'Pengingat agenda H-1 terkirim', { agenda: sent });
  return { checked: due.length, sent, skipped: false };
};

/** Loop penyapu — dijadwalkan dari server.js saat boot. */
export const startReminderScheduler = ({ intervalMs = 15 * 60 * 1000 } = {}) => {
  if (!isPushConfigured()) {
    logger.warn('PUSH', 'Notifikasi mati — kunci VAPID belum diisi di .env', {
      cara_mengaktifkan: 'jalankan `node scripts/generate-vapid-keys.js`, tempel hasilnya ke .env, lalu restart'
    });
    return null;
  }

  const run = () => {
    sweepDueReminders().catch((error) => {
      logger.warn('PUSH', 'Penyapu pengingat gagal', { pesan: error.message });
    });
  };

  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();

  logger.ok('PUSH', 'Notifikasi Web Push aktif', {
    jam_kirim: `${PUSH_REMINDER_HOUR} WIB`,
    penyapu: `setiap ${Math.round(intervalMs / 60000)} menit`
  });

  return timer;
};
