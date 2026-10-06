

import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DIR = path.resolve(here, '..');

export const PORT = process.env.PORT || 5000;

export const FRONTEND_PORT = Number(process.env.VITE_PORT || 3000);

export const USE_VITE_MIDDLEWARE = process.env.VITE_MIDDLEWARE === '1';

export const LISTEN_PORT = USE_VITE_MIDDLEWARE ? FRONTEND_PORT : Number(PORT);

export const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const SERVE_STATIC = String(process.env.SERVE_STATIC ?? 'true').trim().toLowerCase() !== 'false';

export const STATIC_DIR = path.resolve(ROOT_DIR, 'dist');
export const STATIC_INDEX_FILE = path.join(STATIC_DIR, 'index.html');

export const AUTH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }
};

export const AUTH_RATE_LIMITED_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-registration',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/auth/resend-verification',
];

export const QRIS_WEBHOOK_SECRET = (process.env.QRIS_WEBHOOK_SECRET || '').trim();


export const MIDTRANS_SERVER_KEY = (process.env.MIDTRANS_SERVER_KEY || '').trim();

export const MIDTRANS_CLIENT_KEY = (process.env.MIDTRANS_CLIENT_KEY || '').trim();

export const MIDTRANS_IS_PRODUCTION = String(process.env.MIDTRANS_IS_PRODUCTION ?? 'false').trim().toLowerCase() === 'true';

export const MIDTRANS_QRIS_ACQUIRER = (process.env.MIDTRANS_QRIS_ACQUIRER || 'gopay').trim();

export const MIDTRANS_QRIS_EXPIRY_MINUTES = (() => {
  const parsed = Number(process.env.MIDTRANS_QRIS_EXPIRY_MINUTES);
  return Number.isFinite(parsed) && parsed >= 15 ? Math.floor(parsed) : 15;
})();


export const MIDTRANS_PAYMENT_METHOD_LABEL = 'QRIS Midtrans';
