

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  ALLOWED_ORIGINS,
  AUTH_IDENTIFIER_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  AUTH_RATE_LIMITED_PATHS,
  TRUST_PROXY
} from '../config.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: false,
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

  keyGenerator: (req) => ipKeyGenerator(req.ip || 'unknown')
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
  keyGenerator: (req) => `${ipKeyGenerator(req.ip || 'unknown')}|${normalizeAuthIdentifier(req)}`
});

export const AUTH_IDENTIFIER_LIMITED_PATHS = [
  '/api/auth/verify-registration',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password'
];
