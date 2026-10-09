/* Rute Web Push Notification — pengingat agenda H-1.
 *
 * Rute sengaja PUBLIK (tanpa requireAuth): notifikasi menyasar SEMUA
 * pengunjung, termasuk yang belum punya akun. Yang dilindungi bukan
 * identitas, melainkan bentuk data — lihat validasi ketat di bawah.
 */

import { Router } from 'express';
import { wrap } from '../lib/http.js';
import {
  isPushConfigured,
  saveSubscription,
  removeSubscription,
  countActiveSubscriptions
} from '../lib/eventReminder.js';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { clippedText } from '../lib/validate.js';

export const notificationsRouter = Router();

const MAX_ENDPOINT_LENGTH = 1000;
const MAX_KEY_LENGTH = 200;

/* Endpoint WAJIB berupa URL https ke push service. Tanpa cek ini, penyerang
   bisa mendaftarkan endpoint internal (SSRF) dan menjadikan server sebagai
   pengirim permintaan ke jaringan dalam. */
const isAllowedEndpoint = (value) => {
  if (typeof value !== 'string') return false;
  if (value.length > MAX_ENDPOINT_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidKey = (value) =>
  typeof value === 'string' && value.length > 0 && value.length <= MAX_KEY_LENGTH &&
  /^[A-Za-z0-9_-]+=*$/.test(value);


notificationsRouter.get('/notifications/public-key', (req, res) => {
  res.json({
    success: true,
    enabled: isPushConfigured(),
    publicKey: isPushConfigured() ? VAPID_PUBLIC_KEY : null
  });
});


notificationsRouter.post('/notifications/subscribe', wrap(async (req, res) => {
  if (!isPushConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Fitur notifikasi belum diaktifkan pada server ini.'
    });
  }

  const endpoint = req.body?.endpoint;
  const keys = req.body?.keys || {};

  if (!isAllowedEndpoint(endpoint)) {
    return res.status(400).json({
      success: false,
      message: 'Endpoint langganan tidak valid — harus berupa URL https.'
    });
  }

  if (!isValidKey(keys.p256dh) || !isValidKey(keys.auth)) {
    return res.status(400).json({
      success: false,
      message: 'Kunci langganan perangkat tidak lengkap.'
    });
  }

  const result = await saveSubscription({
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    userAgent: clippedText(req.get('user-agent'), 255)
  }).catch((error) => {
    /* Tabel belum dibuat (pemilik belum menjalankan blok PATCH) — balas 503
       dengan petunjuk, bukan 500 mentah. */
    if (error?.schemaMissing) {
      return { schemaMissing: true };
    }
    throw error;
  });

  if (result.schemaMissing) {
    return res.status(503).json({
      success: false,
      message: 'Penyimpanan langganan belum disiapkan di server. Hubungi pengelola aplikasi.'
    });
  }

  const total = await countActiveSubscriptions();

  res.status(result.created ? 201 : 200).json({
    success: true,
    message: 'Perangkat ini akan menerima pengingat agenda.',
    subscriptionId: result.id,
    subscribers: total
  });
}));


notificationsRouter.post('/notifications/unsubscribe', wrap(async (req, res) => {
  const endpoint = req.body?.endpoint;

  if (!isAllowedEndpoint(endpoint)) {
    return res.status(400).json({ success: false, message: 'Endpoint langganan tidak valid.' });
  }

  await removeSubscription(endpoint);
  res.json({ success: true, message: 'Notifikasi untuk perangkat ini dimatikan.' });
}));


notificationsRouter.get('/notifications/status', wrap(async (req, res) => {
  if (!isPushConfigured()) {
    return res.json({ success: true, enabled: false, subscribers: 0 });
  }
  const subscribers = await countActiveSubscriptions();
  res.json({ success: true, enabled: true, subscribers });
}));
