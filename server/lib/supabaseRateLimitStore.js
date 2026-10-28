import crypto from 'node:crypto';
import { supabaseServer } from '../db.js';

const hashSecret = () =>
  process.env.RATE_LIMIT_HASH_SECRET ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : process.env.JWT_SECRET || 'local-rate-limit-key');

/**
 * Store express-rate-limit yang berbagi hitungan lewat Supabase, jadi batas
 * tetap berlaku saat request Vercel berpindah ke instance serverless lain.
 * Hanya HMAC dari namespace dan key yang disimpan; IP/email tidak dikirim ke DB.
 */
export class SupabaseRateLimitStore {
  constructor({ namespace }) {
    if (!namespace) throw new TypeError('Namespace rate limit wajib diisi.');
    this.namespace = namespace;
    this.windowMs = 60_000;
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const secret = hashSecret();
    if (!secret) throw new Error('RATE_LIMIT_HASH_SECRET atau kunci Supabase server wajib diset.');
    if (!supabaseServer) throw new Error('Penyimpanan rate limit Supabase belum dikonfigurasi.');

    const bucketKey = crypto
      .createHmac('sha256', secret)
      .update(`${this.namespace}:${key}`)
      .digest('hex');

    const { data, error } = await supabaseServer.rpc('increment_api_rate_limit', {
      p_bucket_key: bucketKey,
      p_window_ms: this.windowMs
    });
    if (error) throw error;

    const bucket = Array.isArray(data) ? data[0] : data;
    if (!bucket || !Number.isFinite(Number(bucket.total_hits)) || !bucket.reset_time) {
      throw new Error('Respons penyimpanan rate limit Supabase tidak valid.');
    }

    return {
      totalHits: Number(bucket.total_hits),
      resetTime: new Date(bucket.reset_time)
    };
  }

  async decrement(key) {
    return this.#call('decrement_api_rate_limit', key);
  }

  async resetKey(key) {
    return this.#call('reset_api_rate_limit', key);
  }

  async #call(functionName, key) {
    const secret = hashSecret();
    if (!secret) throw new Error('RATE_LIMIT_HASH_SECRET atau kunci Supabase server wajib diset.');
    if (!supabaseServer) throw new Error('Penyimpanan rate limit Supabase belum dikonfigurasi.');

    const bucketKey = crypto
      .createHmac('sha256', secret)
      .update(`${this.namespace}:${key}`)
      .digest('hex');
    const { error } = await supabaseServer.rpc(functionName, {
      p_bucket_key: bucketKey,
      p_window_ms: this.windowMs
    });
    if (error) throw error;
  }
}

/** Enable only after the additive database patch has been applied. */
export const rateLimitStoreFor = (namespace) =>
  process.env.SHARED_RATE_LIMITS === 'true'
    ? new SupabaseRateLimitStore({ namespace })
    : undefined;
