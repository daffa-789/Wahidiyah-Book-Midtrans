/**
 * Route Layer — Modul Pembayaran (Fase 2 roadmap arsitektur).
 *
 * Berkas ini sengaja tipis: hanya pemetaan URL → middleware (rate limiter,
 * otentikasi, gerbang flag) → method controller. Seluruh logika bisnis ada di
 * `server/services/payment.service.js`; pemformatan HTTP ada di
 * `server/controllers/payment.controller.js`.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import { paymentRateLimiter, qrisStatusRateLimiter } from '../middleware/security.js';
import {
  cancelQris,
  createQrisCharge,
  getQrImage,
  getQrisStatus,
  midtransNotification
} from '../controllers/payment_controller.js';

export const paymentsRouter = Router();

const qrImageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan kode QR. Tunggu sebentar.' }
});

paymentsRouter.post('/qris/charge', paymentRateLimiter, requireAuth, wrap(createQrisCharge));

paymentsRouter.get('/qris/:orderId/status', requireAuth, qrisStatusRateLimiter, wrap(getQrisStatus));

paymentsRouter.post('/qris/:orderId/cancel', paymentRateLimiter, requireAuth, wrap(cancelQris));

paymentsRouter.get('/qris/:orderId/qr.png', qrImageRateLimiter, requireAuth, wrap(getQrImage));

paymentsRouter.post('/midtrans/notification', midtransNotification);
