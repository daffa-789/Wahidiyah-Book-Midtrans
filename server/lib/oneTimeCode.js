/* Kode sekali-pakai untuk menukar sesi setelah redirect OAuth (VULN-03).
 *
 * Token tidak boleh ikut di URL: URL tercatat di riwayat peramban, header
 * Referer, dan log proxy. Yang masuk URL hanya kode acak 256-bit berumur 60
 * detik, dan kode itu hangus pada penukaran pertama — berhasil maupun tidak.
 *
 * Penyimpanan in-memory disengaja: proses ini satu instance dan kode hanya
 * hidup sepanjang satu redirect. Restart server di antara redirect dan
 * penukaran cukup memaksa pengguna masuk ulang, bukan membocorkan apa pun.
 */

import crypto from 'crypto';

const DEFAULT_TTL_MS = 60 * 1000;
const MAX_ENTRIES = 2000;

const store = new Map();

const sweep = (now) => {
  for (const [code, entry] of store) {
    if (entry.expiresAt <= now) store.delete(code);
  }
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
};

/**
 * Simpan payload sesi dan kembalikan kode sekali-pakai.
 *
 * @param {object} payload - Bentuk `{ token, user }`.
 * @param {{ ttlMs?: number, now?: number }} [options]
 * @returns {string} Kode base64url 43 karakter.
 */
export const createOneTimeCode = (payload, { ttlMs = DEFAULT_TTL_MS, now = Date.now() } = {}) => {
  const code = crypto.randomBytes(32).toString('base64url');
  store.set(code, { payload, expiresAt: now + ttlMs });
  sweep(now);
  return code;
};

/**
 * Tukar kode menjadi payload. Kode selalu dihapus, termasuk saat kedaluwarsa.
 *
 * @param {string} code
 * @param {{ now?: number }} [options]
 * @returns {object|null} Payload bila sah dan belum kedaluwarsa.
 */
export const redeemOneTimeCode = (code, { now = Date.now() } = {}) => {
  if (typeof code !== 'string' || !code) return null;
  const entry = store.get(code);
  if (!entry) return null;
  store.delete(code);
  return entry.expiresAt > now ? entry.payload : null;
};
