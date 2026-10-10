/* Web Push — sisi peramban.
 *
 * Dipisah dari komponen supaya logika izin/kirim-token bisa diuji dan dipakai
 * ulang. Semua fungsi di sini harus dipanggil dari konteks aman (https atau
 * localhost) — peramban menolak Push API pada http biasa.
 */

import { apiJson } from './api';

const SERVICE_WORKER_URL = '/sw.js';

const postJson = (path, body) => apiJson(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const getPermission = () =>
  (typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported');

/** URL service worker diubah dari base64url ke Uint8Array — format yang
 *  diminta `pushManager.subscribe` (bukan string). */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

/** Daftarkan service worker bila belum ada. Aman dipanggil berulang kali. */
const ensureServiceWorker = async () => {
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  // `ready` menunggu sampai SW benar-benar aktif — tanpa ini, `subscribe`
  // bisa gagal pada kunjungan pertama.
  await navigator.serviceWorker.ready;
  return registration;
};

const fetchVapidPublicKey = async () => {
  const data = await apiJson('/api/notifications/public-key');
  return data?.enabled ? data.publicKey : null;
};

/** Baca langganan yang sudah ada tanpa meminta izin baru. */
const getExistingSubscription = async () => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
};

/**
 * Alur lengkap mengaktifkan notifikasi:
 *   1. minta izin ke pengguna
 *   2. daftarkan service worker
 *   3. buat langganan push dengan kunci VAPID server
 *   4. kirim langganan ke server agar tersimpan
 */
export const enablePushNotifications = async () => {
  if (!isPushSupported()) {
    return { ok: false, reason: 'unsupported', message: 'Peramban ini tidak mendukung notifikasi.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      reason: permission === 'denied' ? 'denied' : 'dismissed',
      message: permission === 'denied'
        ? 'Izin notifikasi diblokir. Aktifkan lewat setelan situs di peramban Anda.'
        : 'Izin notifikasi belum diberikan.'
    };
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    return {
      ok: false,
      reason: 'server-disabled',
      message: 'Notifikasi belum diaktifkan oleh pengelola aplikasi.'
    };
  }

  const registration = await ensureServiceWorker();

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  const json = subscription.toJSON();
  await postJson('/api/notifications/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys
  });

  return { ok: true, message: 'Notifikasi aktif — Anda akan diingatkan sehari sebelum agenda.' };
};

/** Matikan notifikasi: batalkan di peramban DAN hapus di server. */
export const disablePushNotifications = async () => {
  const subscription = await getExistingSubscription();
  if (!subscription) return { ok: true, message: 'Notifikasi memang tidak aktif.' };

  const endpoint = subscription.endpoint;

  try {
    await postJson('/api/notifications/unsubscribe', { endpoint });
  } catch {
    /* Server tidak terjangkau — tetap lanjut membatalkan di peramban supaya
       pengguna tidak terjebak dalam keadaan "tidak bisa dimatikan". */
  }

  await subscription.unsubscribe();
  return { ok: true, message: 'Notifikasi dimatikan untuk perangkat ini.' };
};

/** Status ringkas untuk menyalakan tombol di UI. */
export const getPushStatus = async () => {
  if (!isPushSupported()) return { supported: false, subscribed: false, permission: 'unsupported' };

  const permission = getPermission();
  if (permission !== 'granted') {
    return { supported: true, subscribed: false, permission };
  }

  const subscription = await getExistingSubscription();
  return { supported: true, subscribed: Boolean(subscription), permission };
};
