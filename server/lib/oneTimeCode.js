/* Kode sekali-pakai untuk menukar sesi setelah redirect OAuth (VULN-03).
 *
 * Browser hanya menerima kode acak 256-bit berumur 60 detik. Kode mentah
 * tidak pernah disimpan; hash dan payload sesi disimpan di tabel Supabase
 * agar callback dan penukaran tetap bekerja pada instance Vercel berbeda.
 * DELETE ... RETURNING membuat penukaran atomik: satu permintaan saja yang
 * dapat mengambil payload, termasuk saat dua permintaan tiba bersamaan.
 */

import crypto from 'node:crypto';
import { supabaseServer } from '../db.js';

const DEFAULT_TTL_MS = 60 * 1000;
const PURPOSE = 'oauth_session';
const INTERNAL_EMAIL = 'oauth-session@internal.invalid';

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const requireStore = () => {
  if (!supabaseServer) throw new Error('Penyimpanan sesi OAuth belum dikonfigurasi.');
  return supabaseServer;
};

/** Simpan payload sesi di store bersama dan kembalikan kode acak base64url. */
export const createOneTimeCode = async (
  payload,
  { ttlMs = DEFAULT_TTL_MS, now = Date.now() } = {},
) => {
  const supabase = requireStore();
  const code = crypto.randomBytes(32).toString('base64url');
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + Math.max(1, ttlMs)).toISOString();

  const { error: cleanupError } = await supabase
    .from('email_verifications')
    .delete()
    .eq('purpose', PURPOSE)
    .lte('expires_at', createdAt);
  if (cleanupError) throw cleanupError;

  const { error } = await supabase.from('email_verifications').insert({
    email: INTERNAL_EMAIL,
    purpose: PURPOSE,
    code_hash: hashCode(code),
    payload,
    expires_at: expiresAt,
  });
  if (error) throw error;

  return code;
};

/** Tukar kode sekali-pakai menjadi payload; setiap percobaan menghabiskan kode. */
export const redeemOneTimeCode = async (code, { now = Date.now() } = {}) => {
  if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(code)) return null;

  const { data, error } = await requireStore()
    .from('email_verifications')
    .delete()
    .eq('purpose', PURPOSE)
    .eq('code_hash', hashCode(code))
    .select('payload, expires_at')
    .maybeSingle();

  if (error) throw error;
  const expiresAt = Date.parse(data?.expires_at);
  if (!data || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
  return data.payload || null;
};
