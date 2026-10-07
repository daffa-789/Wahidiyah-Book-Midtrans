
import { Router } from 'express';
import { supabaseServer } from '../db.js';
import {
  generateId,
  loadMembershipUser,
  requireAuth,
  settleExpiredMembership,
  toPublicUser,
  TRANSACTION_PENDING_STATUS
} from '../auth.js';
import { internalErrorDetail, wrap } from '../lib/http.js';
import {
  activatePaidMembership,
  activeSubscriptionConflict,
  insertTransaction,
  toRefCode
} from '../lib/membership.js';
import { QRIS_ADMIN_FEE, findPlan } from '../lib/constants.js';
import { MIDTRANS_IS_PRODUCTION, MIDTRANS_PAYMENT_METHOD_LABEL, MIDTRANS_QRIS_EXPIRY_MINUTES } from '../config.js';
import rateLimit from 'express-rate-limit';
import {
  createQrisCharge,
  extractQrAction,
  extractQrString,
  fetchQrImage,
  getTransactionStatus,
  isMidtransConfigured,
  verifySignatureKey
} from '../lib/midtrans.js';
import { logger } from '../logger.js';

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


const FAILED_MIDTRANS_STATUSES = new Set(['expire', 'cancel', 'deny']);


const TRANSACTION_COLUMNS = 'id, ref_no, user_id, plan_name, amount, admin_fee, total_paid, payment_method, status, verified_at, created_at, midtrans_transaction_id, midtrans_qr_url, midtrans_qr_string, expires_at';


async function loadOwnTransaction(orderId, user) {
  const { data, error } = await supabaseServer
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { transaction: null, forbidden: false };
  if (data.user_id !== user?.id && user?.role !== 'admin') {
    return { transaction: null, forbidden: true };
  }
  return { transaction: data, forbidden: false };
}


async function settleTransaction(transaction) {
  if (!transaction || transaction.status === 'success') {
    return { alreadyProcessed: true, activated: null };
  }

  const { data: claimed, error: claimError } = await supabaseServer
    .from('transactions')
    .update({ status: 'success', verified_at: new Date().toISOString() })
    .eq('id', transaction.id)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .select('id');

  if (claimError) throw claimError;
  if (!claimed || claimed.length === 0) {
    return { alreadyProcessed: true, activated: null };
  }

  let activated;
  try {
    activated = await activatePaidMembership({
      userId: transaction.user_id,
      planName: transaction.plan_name,
      price: transaction.amount,
      refCode: toRefCode(transaction.ref_no)
    });
  } catch (activationError) {
    
    
    
    await supabaseServer
      .from('transactions')
      .update({ status: TRANSACTION_PENDING_STATUS, verified_at: null })
      .eq('id', transaction.id);

    logger.error('MIDTRANS', 'Aktivasi gagal — status dikembalikan ke pending', {
      orderId: transaction.id,
      pesan: activationError.message
    });
    throw activationError;
  }

  logger.ok('MIDTRANS', 'Langganan Pro diaktifkan', {
    orderId: transaction.id,
    userId: transaction.user_id,
    subscriptionId: activated.subscriptionId
  });

  return { alreadyProcessed: false, activated };
}


async function rejectTransaction(transaction, reason) {
  if (!transaction || transaction.status !== TRANSACTION_PENDING_STATUS) {
    return { alreadyProcessed: true };
  }

  const { data: claimed, error } = await supabaseServer
    .from('transactions')
    .update({ status: 'rejected', verified_at: new Date().toISOString() })
    .eq('id', transaction.id)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .select('id');

  if (error) throw error;
  logger.warn('MIDTRANS', `Transaksi ditandai gagal (${reason})`, { orderId: transaction.id });
  return { alreadyProcessed: !claimed || claimed.length === 0 };
}


paymentsRouter.post('/qris/charge', paymentRateLimiter, requireAuth, wrap(async (req, res) => {
  if (!isMidtransConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Payment gateway Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env.'
    });
  }

  const plan = findPlan(req.body?.planId);
  const amount = plan.price;
  const adminFee = QRIS_ADMIN_FEE;
  const totalPaid = amount + adminFee;

  try {
    await settleExpiredMembership(req.user.id);
    const membership = (await loadMembershipUser(req.user.id)) || req.user;

    const conflict = activeSubscriptionConflict(membership);
    if (conflict) {
      return res.json({
        success: true,
        alreadyPro: true,
        message: conflict.message,
        user: toPublicUser(membership)
      });
    }

    
    
    
    const { data: pendingTx } = await supabaseServer
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('user_id', req.user.id)
      .eq('status', TRANSACTION_PENDING_STATUS)
      .eq('payment_method', MIDTRANS_PAYMENT_METHOD_LABEL)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const reusable = pendingTx && (pendingTx.midtrans_qr_string || pendingTx.midtrans_qr_url);
    if (reusable) {
      return res.json({
        success: true,
        reused: true,
        orderId: pendingTx.id,
        refNo: pendingTx.ref_no,
        qrString: pendingTx.midtrans_qr_string || null,
        qrImageUrl: pendingTx.midtrans_qr_url ? `/api/payments/qris/${pendingTx.id}/qr.png` : null,
        qrMidtransUrl: pendingTx.midtrans_qr_url || null,
        planName: pendingTx.plan_name,
        amount: pendingTx.amount,
        adminFee: pendingTx.admin_fee,
        totalPaid: pendingTx.total_paid,
        status: TRANSACTION_PENDING_STATUS,
        expiredAt: pendingTx.expires_at,
        user: toPublicUser(membership)
      });
    }

    const orderId = generateId('tx');
    const expiredAt = new Date(Date.now() + MIDTRANS_QRIS_EXPIRY_MINUTES * 60_000).toISOString();

    
    
    
    const refNo = await insertTransaction({
      txId: orderId,
      userId: req.user.id,
      planName: plan.name,
      amount,
      adminFee,
      totalPaid,
      method: MIDTRANS_PAYMENT_METHOD_LABEL,
      status: TRANSACTION_PENDING_STATUS
    });
    await supabaseServer
      .from('transactions')
      .update({ expires_at: expiredAt })
      .eq('id', orderId);

    const pendingRow = { id: orderId, status: TRANSACTION_PENDING_STATUS };

    let charge;
    try {
      charge = await createQrisCharge({
        orderId,
        grossAmount: totalPaid,
        itemDetails: [
          { id: plan.id, price: amount, quantity: 1, name: `Langganan ${plan.name}` },
          { id: 'admin-fee', price: adminFee, quantity: 1, name: 'Biaya Administrasi' }
        ],
        customerDetails: {
          first_name: membership?.name || 'Pembaca Wahidiyah',
          email: membership?.email || undefined,
          phone: req.body?.phone || undefined
        }
      });
    } catch (chargeError) {
      await rejectTransaction(pendingRow, 'charge gagal');
      throw chargeError;
    }

    const qrString = extractQrString(charge);
    const qrAction = extractQrAction(charge);

    if (!qrString && !qrAction) {
      await rejectTransaction(pendingRow, 'tanpa QR');
      logger.error('MIDTRANS', 'Respons charge tidak berisi qr_string maupun URL QR', { orderId });
      return res.status(502).json({
        success: false,
        message: 'Midtrans tidak mengembalikan kode QR. Coba beberapa saat lagi.'
      });
    }

    await supabaseServer
      .from('transactions')
      .update({
        midtrans_transaction_id: charge?.transaction_id || null,
        midtrans_qr_url: qrAction?.url || null,
        midtrans_qr_string: qrString || null,
        expires_at: expiredAt
      })
      .eq('id', orderId);

    logger.ok('MIDTRANS', 'Charge QRIS dibuat', {
      orderId,
      totalPaid,
      acquirer: charge?.acquirer,
      sumberQr: qrString ? 'qr_string' : 'image'
    });

    res.status(201).json({
      success: true,
      orderId,
      refNo,
      // Sumber utama: payload EMVCo → dirender jadi QR di sisi klien (SVG tajam, tanpa latensi).
      qrString,
      // Cadangan: endpoint gambar kita sendiri (proxy PNG dari Midtrans).
      qrImageUrl: qrAction ? `/api/payments/qris/${orderId}/qr.png` : null,
      ...(MIDTRANS_IS_PRODUCTION ? {} : { qrMidtransUrl: qrAction?.url || null }),
      planName: plan.name,
      amount,
      adminFee,
      totalPaid,
      status: TRANSACTION_PENDING_STATUS,
      expiredAt,
      user: toPublicUser(membership)
    });
  } catch (error) {
    if (error?.code === 'MIDTRANS_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, message: error.message });
    }
    logger.error('MIDTRANS', 'Gagal membuat charge QRIS', { pesan: error.message });
    res.status(502).json({
      success: false,
      message: 'Gagal membuat transaksi di Midtrans.',
      error: internalErrorDetail(error)
    });
  }
}));


paymentsRouter.get('/qris/:orderId/status', requireAuth, wrap(async (req, res) => {
  const { transaction, forbidden } = await loadOwnTransaction(req.params.orderId, req.user);

  if (!transaction) {
    return res.status(forbidden ? 403 : 404).json({
      success: false,
      message: forbidden ? 'Transaksi ini bukan milik Anda.' : 'Transaksi tidak ditemukan.'
    });
  }

  const baseResponse = {
    success: true,
    orderId: transaction.id,
    totalPaid: transaction.total_paid,
    expiredAt: transaction.expires_at
  };

  if (transaction.status === 'success') {
    return res.json({ ...baseResponse, status: 'settlement', isPaid: true });
  }

  if (transaction.status === 'rejected') {
    return res.json({ ...baseResponse, status: 'expire', isPaid: false });
  }

  
  
  
  if (transaction.expires_at && new Date(transaction.expires_at).getTime() < Date.now()) {
    await rejectTransaction(transaction, 'kedaluwarsa');
    return res.json({ ...baseResponse, status: 'expire', isPaid: false });
  }

  try {
    const status = await getTransactionStatus(transaction.id);
    const transactionStatus = String(status?.transaction_status || 'pending').toLowerCase();
    const fraudStatus = String(status?.fraud_status || '').toLowerCase();

    if (transactionStatus === 'settlement' && fraudStatus === 'accept') {
      await settleTransaction(transaction);
      return res.json({ ...baseResponse, status: 'settlement', isPaid: true });
    }

    if (FAILED_MIDTRANS_STATUSES.has(transactionStatus)) {
      await rejectTransaction(transaction, transactionStatus);
      return res.json({ ...baseResponse, status: transactionStatus, isPaid: false });
    }

    return res.json({ ...baseResponse, status: transactionStatus, isPaid: false });
  } catch (error) {
    logger.warn('MIDTRANS', 'Gagal memeriksa status ke Midtrans', { pesan: error.message });
    return res.json({ ...baseResponse, status: 'pending', isPaid: false });
  }
}));


paymentsRouter.post('/qris/:orderId/simulate-paid', paymentRateLimiter, requireAuth, wrap(async (req, res) => {
  // ── HANYA UNTUK SANDBOX ──────────────────────────────────────────────
  // Mengaktifkan langganan seolah-olah Midtrans sudah mengirim notifikasi
  // settlement. Dipakai untuk demo/tes dari HP tanpa membuka simulator
  // Midtrans. Di PRODUCTION rute ini mati total (404) — tidak mungkin
  // diaktifkan lewat konfigurasi.
  if (MIDTRANS_IS_PRODUCTION) {
    return res.status(404).json({ success: false, message: 'Rute tidak tersedia.' });
  }

  const { transaction, forbidden } = await loadOwnTransaction(req.params.orderId, req.user);

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
    await rejectTransaction(transaction, 'kedaluwarsa');
    return res.status(410).json({ success: false, message: 'Kode QR sudah kedaluwarsa. Buat ulang dulu.' });
  }

  // Sengaja memakai settleTransaction() yang sama dengan jalur webhook asli,
  // supaya perilaku (termasuk idempotensi & rollback) persis identik.
  const { alreadyProcessed } = await settleTransaction(transaction);

  logger.warn('MIDTRANS', 'Settlement DISIMULASIKAN dari UI (mode sandbox)', {
    orderId: transaction.id,
    userId: transaction.user_id
  });

  return res.json({ success: true, alreadyProcessed, status: 'settlement', isPaid: true });
}));


paymentsRouter.get('/qris/:orderId/qr.png', qrImageRateLimiter, requireAuth, wrap(async (req, res) => {
  const { transaction, forbidden } = await loadOwnTransaction(req.params.orderId, req.user);

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

  const verification = verifySignatureKey(payload);
  if (!verification.ok) {
    logger.warn('MIDTRANS', 'Notifikasi ditolak: signature tidak valid', {
      orderId: payload.order_id,
      alasan: verification.reason,
      ip: req.ip
    });
    return res.status(401).json({ success: false, message: 'Notifikasi tidak terautentikasi.' });
  }

  try {
    const { data: transaction } = await supabaseServer
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('id', payload.order_id)
      .maybeSingle();

    if (!transaction) {
      logger.warn('MIDTRANS', 'Notifikasi untuk order yang tidak dikenal', { orderId: payload.order_id });
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    const notifiedAmount = Math.round(Number(payload.gross_amount));
    const storedAmount = Math.round(Number(transaction.total_paid));
    if (!Number.isFinite(notifiedAmount) || notifiedAmount !== storedAmount) {
      logger.warn('MIDTRANS', 'Notifikasi ditolak: nominal tidak cocok', {
        orderId: payload.order_id,
        notifiedAmount,
        storedAmount
      });
      return res.status(400).json({ success: false, message: 'Nominal pembayaran tidak sesuai.' });
    }

    const transactionStatus = String(payload.transaction_status || '').toLowerCase();
    const fraudStatus = String(payload.fraud_status || '').toLowerCase();

    if (transactionStatus === 'settlement' && fraudStatus === 'accept') {
      const { alreadyProcessed } = await settleTransaction(transaction);
      return res.json({ success: true, alreadyProcessed });
    }

    if (FAILED_MIDTRANS_STATUSES.has(transactionStatus)) {
      const { alreadyProcessed } = await rejectTransaction(transaction, transactionStatus);
      return res.json({ success: true, alreadyProcessed });
    }

    return res.json({ success: true, status: transactionStatus || 'pending' });
  } catch (error) {
    logger.error('MIDTRANS', 'Gagal memproses notifikasi', { pesan: error.message });
    res.status(500).json({
      success: false,
      message: 'Gagal memproses notifikasi.',
      error: internalErrorDetail(error)
    });
  }
});
