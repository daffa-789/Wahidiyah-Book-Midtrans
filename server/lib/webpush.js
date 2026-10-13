/* Web Push (RFC 8030 + RFC 8291) tanpa dependensi pihak ketiga.
 *
 * Kenapa ditulis sendiri: pustaka populer `web-push` menarik 20+ paket
 * turunan (jose, https-proxy-agent, …) yang harus diaudit. Yang sebenarnya
 * dibutuhkan hanya tiga hal, dan semuanya sudah tersedia di modul `crypto`
 * bawaan Node:
 *
 *   1. VAPID (RFC 8292) — menandatangani JWT ES256 supaya push service
 *      (FCM/Mozilla/WNS) percaya kita pemilik sah aplikasi.
 *   2. Enkripsi payload `aes128gcm` (RFC 8291) — HKDF-SHA256 untuk menurunkan
 *      dua kunci, lalu AES-128-GCM untuk isi pesan.
 *   3. POST ke endpoint langganan dengan header Authorization + TTL.
 *
 * Berkas ini sengaja murni fungsi (tanpa I/O database) supaya mudah diuji.
 */

import crypto from 'crypto';

const { createECDH, createHmac, randomBytes, createCipheriv } = crypto;

/* Ukuran tetap sesuai RFC 8291 §4 — jangan diubah. */
const RECORD_SIZE = 4096;
const TAG_LENGTH = 16;
const KEY_LENGTH = 16;
const CURVE = 'prime256v1';

const b64url = (buffer) =>
  Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlDecode = (value) =>
  Buffer.from(String(value).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/* ── 1. VAPID ──────────────────────────────────────────────────────────────
 * Kunci dibuat sekali dengan `npm run vapid:keys` dan disimpan di .env.
 * Kunci publik dikirim ke peramban lewat GET /api/notifications/public-key;
 * kunci privat tidak pernah meninggalkan server.
 */

/* JWT ES256.
 *
 * Jebakan: `ECDH` di Node hanya bisa membuat *shared secret*, bukan tanda
 * tangan — tidak ada `ecdh.sign()`. Penandatanganan harus lewat
 * `crypto.createSign` dengan kunci berformat JWK, dan hasilnya HARUS diubah
 * dari DER ke bentuk mentah R||S (64 byte). Inilah yang paling sering membuat
 * implementasi VAPID buatan sendiri ditolak push service dengan 401.
 */
const derToRawSignature = (der) => {
  let offset = 2; // lewati SEQUENCE 0x30 + panjang
  if (der[1] & 0x80) offset += der[1] & 0x7f; // panjang bentuk panjang

  const readInt = (index) => {
    if (der[index] !== 0x02) throw new Error('Tanda tangan DER tidak valid.');
    let length = der[index + 1];
    let start = index + 2;
    // Angka besar (bit tertinggi 1) diberi awalan 0x00 — buang kelebihannya.
    while (length > 32 && der[start] === 0x00) { start += 1; length -= 1; }
    const value = Buffer.alloc(32);
    der.copy(value, 32 - length, start, start + length);
    return { value, next: start + length };
  };

  const r = readInt(offset);
  const s = readInt(r.next);
  return Buffer.concat([r.value, s.value]);
};

const buildVapidJwt = ({ audience, subject, publicKey, privateKey, expiresInSeconds = 12 * 60 * 60 }) => {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + expiresInSeconds, sub: subject };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

  const publicBytes = Buffer.isBuffer(publicKey) ? publicKey : b64urlDecode(publicKey);
  const privateBytes = Buffer.isBuffer(privateKey) ? privateKey : b64urlDecode(privateKey);

  const keyObject = crypto.createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: b64url(privateBytes),
      x: b64url(publicBytes.subarray(1, 33)),
      y: b64url(publicBytes.subarray(33, 65))
    },
    format: 'jwk'
  });

  const derSignature = crypto.sign('sha256', Buffer.from(signingInput), {
    key: keyObject,
    dsaEncoding: 'der'
  });

  return `${signingInput}.${b64url(derToRawSignature(derSignature))}`;
};

const vapidHeaders = ({ endpoint, subject, publicKey, privateKey }) => {
  const audience = new URL(endpoint).origin;
  const jwt = buildVapidJwt({ audience, subject, publicKey, privateKey });
  return `vapid t=${jwt}, k=${b64url(publicKey)}`;
};

/* ── 2. HKDF (RFC 5869) ────────────────────────────────────────────────────
 * Node punya `crypto.hkdfSync`, tetapi tanda tangannya mudah salah dibaca.
 * Pembungkus tipis ini membuat alurnya eksplisit.
 */
const hkdf = (salt, ikm, info, length) =>
  Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, length));

/* ── 3. Enkripsi payload aes128gcm ─────────────────────────────────────────
 * Struktur badan permintaan (RFC 8188):
 *   salt(16) | record size(4, big-endian) | key id length(1) | key id(65) | ciphertext
 * Ciphertext = konten || padding(0x02) , di-AES-128-GCM (termasuk tag 16 byte).
 */
export const encryptPayload = ({ payload, p256dh, auth }) => {
  const clientPublicKey = Buffer.isBuffer(p256dh) ? p256dh : b64urlDecode(p256dh);
  const authSecret = Buffer.isBuffer(auth) ? auth : b64urlDecode(auth);

  const salt = randomBytes(16);

  // Kunci ephemeral milik server untuk pertukaran ECDH.
  const serverEcdh = createECDH(CURVE);
  serverEcdh.generateKeys();
  const serverPublicKey = serverEcdh.getPublicKey();

  const sharedSecret = serverEcdh.computeSecret(clientPublicKey);

  // RFC 8291 §3.3 — prk_key divalidasi lewat titik kurva klien, agar kunci
  // yang cacat tidak menghasilkan enkripsi yang tidak bisa dibuka peramban.
  const authInfo = Buffer.concat([
    Buffer.from('WebPush: info\0'),
    clientPublicKey,
    serverPublicKey
  ]);
  const ikm = hkdf(authSecret, sharedSecret, authInfo, 32);

  const contentEncryptionKeyInfo = Buffer.concat([
    Buffer.from('Content-Encoding: aes128gcm\0')
  ]);
  const nonceInfo = Buffer.concat([Buffer.from('Content-Encoding: nonce\0')]);

  const contentEncryptionKey = hkdf(salt, ikm, contentEncryptionKeyInfo, KEY_LENGTH);
  const nonce = hkdf(salt, ikm, nonceInfo, 12);

  const plaintext = Buffer.concat([
    Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf8'),
    Buffer.from([0x02])
  ]);

  const cipher = createCipheriv('aes-128-gcm', contentEncryptionKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const recordSizeBuffer = Buffer.alloc(4);
  recordSizeBuffer.writeUInt32BE(RECORD_SIZE, 0);
  const keyIdLength = Buffer.from([serverPublicKey.length]);

  return {
    body: Buffer.concat([salt, recordSizeBuffer, keyIdLength, serverPublicKey, ciphertext]),
    salt
  };
};

/* ── 4. Kirim ──────────────────────────────────────────────────────────────
 * `fetch` bawaan Node 22 dipakai supaya tidak menambah dependensi.
 */
export const sendWebPush = async ({
  subscription,
  payload,
  vapid,
  ttl = 12 * 60 * 60,
  urgency = 'normal'
}) => {
  const { endpoint, keys } = subscription;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return { ok: false, reason: 'invalid-subscription' };
  }

  const { body } = encryptPayload({
    payload,
    p256dh: keys.p256dh,
    auth: keys.auth
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidHeaders({
        endpoint,
        subject: vapid.subject,
        publicKey: vapid.publicKey,
        privateKey: vapid.privateKey
      }),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: urgency
    },
    body
  });

  /* 404/410 = langganan sudah tidak berlaku (peramban dibersihkan, izin
     dicabut, atau perangkat diganti). Pemanggil wajib menonaktifkannya. */
  if (response.status === 404 || response.status === 410) {
    return { ok: false, reason: 'gone', status: response.status };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return { ok: false, reason: 'http-error', status: response.status, detail: detail.slice(0, 200) };
  }

  return { ok: true, status: response.status };
};

/* ── 5. Kunci VAPID ────────────────────────────────────────────────────────
 * Dipakai `scripts/generate-vapid-keys.js` dan verifikasi saat boot.
 */
export const generateVapidKeys = () => {
  const ecdh = createECDH(CURVE);
  ecdh.generateKeys();
  return {
    publicKey: b64url(ecdh.getPublicKey()),
    privateKey: b64url(ecdh.getPrivateKey())
  };
};

export const isValidVapidPublicKey = (value) => {
  try {
    const bytes = b64urlDecode(value);
    return bytes.length === 65 && bytes[0] === 0x04;
  } catch {
    return false;
  }
};

export const isValidVapidPrivateKey = (value) => {
  try {
    const ecdh = createECDH(CURVE);
    ecdh.setPrivateKey(b64urlDecode(value));
    return true;
  } catch {
    return false;
  }
};
