import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { internalErrorDetail, wrap } from '../lib/http.js';
import { MIDTRANS_IS_PRODUCTION } from '../config.js';
import rateLimit from 'express-rate-limit';
import { fetchQrImage, isMidtransConfigured } from '../lib/midtrans.js';
import { logger } from '../logger.js';
import { paymentsService } from '../services/payments.service.js';

export const paymentsRouter = Router();

const paymentRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan pembayaran. Coba lagi dalam 5 menit.' }
});

const qrImageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan kode QR. Tunggu sebentar.' }
});

paymentsRouter.post('/qris/charge', paymentRateLimiter, requireAuth, wrap(async (req, res) => {
  if (!isMidtransConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Payment gateway Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env.'
    });
  }

  try {
    const result = await paymentsService.createCharge({
      user: req.user,
      planId: req.body?.planId,
      phone: req.body?.phone
    });

    if (result.alreadyPro) {
      return res.json({ success: true, ...result });
    }

    const statusCode = result.reused ? 200 : 201;
    return res.status(statusCode).json({ success: true, ...result });
  } catch (error) {
    if (error?.code === 'MIDTRANS_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, message: error.message });
    }
    logger.error('MIDTRANS', 'Gagal membuat charge QRIS', { pesan: error.message });
    res.status(error.statusCode || 502).json({
      success: false,
      message: error.message || 'Gagal membuat transaksi di Midtrans.',
      error: internalErrorDetail(error)
    });
  }
}));

paymentsRouter.get('/qris/:orderId/status', requireAuth, wrap(async (req, res) => {
  const result = await paymentsService.checkStatus(req.params.orderId, req.user);
  if (result.transaction === null) {
    return res.status(result.forbidden ? 403 : 404).json({
      success: false,
      message: result.forbidden ? 'Transaksi ini bukan milik Anda.' : 'Transaksi tidak ditemukan.'
    });
  }
  return res.json(result);
}));

paymentsRouter.post('/qris/:orderId/simulate-paid', paymentRateLimiter, requireAuth, wrap(async (req, res) => {
  if (MIDTRANS_IS_PRODUCTION) {
    return res.status(404).json({ success: false, message: 'Rute tidak tersedia.' });
  }

  const { transaction, forbidden } = await paymentsService.loadOwnTransaction(req.params.orderId, req.user);
  if (!transaction) {
    return res.status(forbidden ? 403 : 404).json({
      success: false,
      message: forbidden ? 'Transaksi ini bukan milik Anda.' : 'Transaksi tidak ditemukan.'
    });
  }

  if (transaction.status === 'success') {
    return res.json({ success: true, alreadyProcessed: true, status: 'settlement', isPaid: true });
  }

  if (transaction.expires_at && new Date(transaction.expires_at).getTime() < Date.now()) {
    await paymentsService.rejectTransaction(transaction, 'kedaluwarsa');
    return res.status(410).json({ success: false, message: 'Kode QR sudah kedaluwarsa. Buat ulang dulu.' });
  }

  const { alreadyProcessed } = await paymentsService.settleTransaction(transaction);
  logger.warn('MIDTRANS', 'Settlement DISIMULASIKAN dari UI (mode sandbox)', {
    orderId: transaction.id,
    userId: transaction.user_id
  });

  return res.json({ success: true, alreadyProcessed, status: 'settlement', isPaid: true });
}));

paymentsRouter.get('/qris/:orderId/qr.png', qrImageRateLimiter, requireAuth, wrap(async (req, res) => {
  const { transaction, forbidden } = await paymentsService.loadOwnTransaction(req.params.orderId, req.user);
  if (!transaction) {
    return res.status(forbidden ? 403 : 404).json({
      success: false,
      message: forbidden ? 'Transaksi ini bukan milik Anda.' : 'Transaksi tidak ditemukan.'
    });
  }

  if (!transaction.midtrans_qr_url) {
    return res.status(404).json({
      success: false,
      message: 'Transaksi ini memakai payload QR (qr_string); tidak ada gambar dari Midtrans.'
    });
  }

  try {
    const image = await fetchQrImage(transaction.midtrans_qr_url);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(image);
  } catch (error) {
    logger.error('MIDTRANS', 'Gagal mengambil gambar QR', { pesan: error.message });
    res.status(502).json({ success: false, message: 'Gagal memuat kode QR dari Midtrans.' });
  }
}));

paymentsRouter.post('/midtrans/notification', async (req, res) => {
  const payload = req.body || {};
  try {
    const result = await paymentsService.handleNotification(payload);
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('MIDTRANS', 'Gagal memproses notifikasi', { pesan: error.message });
    res.status(500).json({
      success: false,
      message: 'Gagal memproses notifikasi.',
      error: internalErrorDetail(error)
    });
  }
});
