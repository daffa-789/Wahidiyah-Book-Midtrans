

import { Router } from 'express';
import { supabaseServer } from '../db.js';
import {
  decideTransactionVerification,
  generateId,
  loadMembershipUser,
  requireAdmin,
  requireAuth,
  settleExpiredMembership,
  toPublicUser,
  TRANSACTION_PENDING_STATUS
} from '../auth.js';
import {
  badRequest,
  conflict,
  internalErrorDetail,
  notFound,
  wrap
} from '../lib/http.js';
import {
  activatePaidMembership,
  activeSubscriptionConflict,
  insertTransaction,
  resolveManualTransferPricing,
  toRefCode
} from '../lib/membership.js';
import { isOneOf, toBoundedInt } from '../lib/validate.js';

export const transactionsRouter = Router();


transactionsRouter.get('/transactions', requireAuth, requireAdmin, wrap(async (req, res) => {
  let query = supabaseServer
    .from('transactions')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });
  
  if (req.query.limit) query = query.limit(toBoundedInt(req.query.limit, { min: 1, max: 200, fallback: 50 }));

  const { data, error } = await query;
  if (error) throw error;

  res.json({
    success: true,
    transactions: (data || []).map((row) => ({
      ...row,
      userName: row.users?.name,
      userEmail: row.users?.email
    }))
  });
}));


transactionsRouter.put('/transactions/:id/verify', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; 

  
  
  if (!isOneOf(action, ['approve', 'reject'])) {
    return badRequest(res, 'Aksi harus "approve" atau "reject".');
  }

  const { data: tx } = await supabaseServer
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!tx) {
    return notFound(res, 'Transaksi tidak ditemukan');
  }

  const decision = decideTransactionVerification(tx.status, action);

  if (decision.kind === 'idempotent') {
    return res.json({
      success: true,
      alreadyVerified: true,
      status: tx.status,
      message: `Transaksi sudah berada pada status "${tx.status}" sehingga verifikasi diulang tanpa menambahkan masa aktif.`
    });
  }

  if (decision.kind === 'conflict') {
    return res.status(409).json({
      success: false,
      status: tx.status,
      message: `Transaksi tidak dapat diverifikasi ulang: statusnya sudah "${tx.status}". ` +
        'Hanya transaksi berstatus "pending" yang boleh diproses.'
    });
  }

  const { data: claimed, error: claimError } = await supabaseServer
    .from('transactions')
    .update({ status: decision.targetStatus, verified_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .select('id');
  if (claimError) throw claimError;

  if (!claimed || claimed.length === 0) {
    return conflict(res, 'Transaksi baru saja diproses permintaan lain. Silakan muat ulang daftar transaksi.');
  }

  if (action === 'approve') {
    await activatePaidMembership({
      userId: tx.user_id,
      planName: tx.plan_name,
      price: tx.amount,
      refCode: toRefCode(tx.ref_no)
    });
  }

  res.json({
    success: true,
    status: decision.targetStatus,
    message: `Transaksi berhasil ${action === 'approve' ? 'diverifikasi' : 'ditolak'}`
  });
}));


transactionsRouter.post('/transactions', requireAuth, async (req, res) => {
  const body = req.body || {};

  /* VULN-06: nominal, nama paket, dan biaya layanan dibaca dari katalog
     server. Nilai `amount` dari klien hanya sebuah klaim yang harus cocok;
     `admin_fee` dan `total_paid` tidak lagi dipercaya sama sekali. */
  const pricing = resolveManualTransferPricing(body);
  if (!pricing.ok) {
    return badRequest(res, pricing.message);
  }

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

    const txId = generateId('tx');
    const method = body.payment_method || 'Bank Transfer';

    const refNo = await insertTransaction({
      txId,
      userId: req.user.id,
      planName: pricing.planName,
      amount: pricing.amount,
      adminFee: pricing.adminFee,
      totalPaid: pricing.totalPaid,
      method,
      status: TRANSACTION_PENDING_STATUS
    });

    
    
    res.status(202).json({
      success: true,
      pendingVerification: true,
      message: 'Transaksi tercatat dan menunggu konfirmasi pembayaran. Paket Pro aktif setelah payment gateway mengonfirmasi pembayaran.',
      transaction: {
        id: txId,
        refNo,
        amount: pricing.amount,
        adminFee: pricing.adminFee,
        totalPaid: pricing.totalPaid,
        planName: 'Wahidiyah Pro',
        paymentMethod: method,
        status: TRANSACTION_PENDING_STATUS
      },
      user: toPublicUser(membership)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memproses transaksi.',
      error: internalErrorDetail(error)
    });
  }
});


