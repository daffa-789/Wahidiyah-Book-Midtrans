import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { rateLimitStoreFor } from '../lib/supabaseRateLimitStore.js';
import {
  ALLOWED_ORIGINS,
  AUTH_IDENTIFIER_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  AUTH_RATE_LIMITED_PATHS,
  CSP_DIRECTIVES,
  CSP_REPORT_ONLY,
  QRIS_STATUS_RATE_LIMIT,
  TRUST_PROXY
} from '../config.js';

/* Report-only sampai CSP_ENFORCE=1: aplikasi tetap jalan sementara pelanggaran
 * dilaporkan di konsol peramban (VULN-09).
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: CSP_DIRECTIVES,
    reportOnly: CSP_REPORT_ONLY
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

export const corsPolicy = cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  }
});

export const responseCompression = compression({ threshold: 1024 });

export const jsonBody = express.json({ limit: '1mb' });

export const trustProxy = (app) => {
  app.set('trust proxy', TRUST_PROXY);
};

export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT.windowMs,
  max: AUTH_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: AUTH_RATE_LIMIT.message,
  keyGenerator: (req) => ipKeyGenerator(req.ip || 'unknown'),
  store: rateLimitStoreFor('auth-ip')
});

export const authRateLimitedPaths = AUTH_RATE_LIMITED_PATHS;

const normalizeAuthIdentifier = (req) => {
  const raw = req.body?.identifier || req.body?.email || req.body?.phone || '';
  return String(raw).trim().toLowerCase() || 'tanpa-identifier';
};

// Penghitung percobaan ikut identifier akun, bukan hanya alamat IP. Tanpa ini,
// satu penyerang bisa mengunci seluruh jamaah lewat limiter berbasis alamat.
export const authIdentifierRateLimiter = rateLimit({
  windowMs: AUTH_IDENTIFIER_RATE_LIMIT.windowMs,
  max: AUTH_IDENTIFIER_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: AUTH_IDENTIFIER_RATE_LIMIT.message,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip || 'unknown')}|${normalizeAuthIdentifier(req)}`,
  store: rateLimitStoreFor('auth-identifier')
});

export const AUTH_IDENTIFIER_LIMITED_PATHS = [
  '/api/auth/verify-registration',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password'
];

/* Status pembayaran dibatasi per akun, bukan per alamat: pengguna sah
 * memakainya setiap 3 detik, dan limiter berbasis IP bisa mengunci seluruh
 * pengguna yang berbagi jaringan kampus.
 */
export const qrisStatusRateLimiter = rateLimit({
  windowMs: QRIS_STATUS_RATE_LIMIT.windowMs,
  max: QRIS_STATUS_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: QRIS_STATUS_RATE_LIMIT.message,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || 'unknown'),
  store: rateLimitStoreFor('qris-status')
});

export const paymentRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan transaksi atau pembayaran. Coba lagi dalam 5 menit.' },
  store: rateLimitStoreFor('payment')
});
