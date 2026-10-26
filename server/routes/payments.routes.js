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
import { notFound, wrap } from '../lib/http.js';
import { isPaymentSimulationAllowed } from '../config.js';
import { paymentRateLimiter, qrisStatusRateLimiter } from '../middleware/security.js';
import {
  cancelQris,
  createQrisCharge,
  getQrImage,
  getQrisStatus,
  midtransNotification,
  simulatePaid
} from '../controllers/payment.controller.js';

export const paymentsRouter = Router();

const qrImageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan kode QR. Tunggu sebentar.' }
});

/* Gerbang dievaluate SEBELUM requireAuth supaya rute ini benar-benar tidak
 * ada (404) saat flag opt-in mati — termasuk bagi pengunjung yang belum
 * masuk, dan supaya `curl` verifikasi tidak perlu membawa token sesi.
 */
const requirePaymentSimulation = (req, res, next) => {
  if (isPaymentSimulationAllowed(process.env)) return next();
  return notFound(res, 'Rute tidak tersedia.');
};

paymentsRouter.post('/qris/charge', paymentRateLimiter, requireAuth, wrap(createQrisCharge));

paymentsRouter.get('/qris/:orderId/status', requireAuth, qrisStatusRateLimiter, wrap(getQrisStatus));

paymentsRouter.post('/qris/:orderId/cancel', paymentRateLimiter, requireAuth, wrap(cancelQris));

paymentsRouter.post(
  '/qris/:orderId/simulate-paid',
  paymentRateLimiter,
  requirePaymentSimulation,
  requireAuth,
  wrap(simulatePaid)
);

paymentsRouter.get('/qris/:orderId/qr.png', qrImageRateLimiter, requireAuth, wrap(getQrImage));

paymentsRouter.post('/midtrans/notification', midtransNotification);
