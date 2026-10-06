

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
import { internalErrorDetail, wrap } from '../lib/http.js';
import {
  activatePaidMembership,
  activeSubscriptionConflict,
  insertTransaction,
  toRefCode
} from '../lib/membership.js';
import { QRIS_ADMIN_FEE } from '../lib/constants.js';
import { isOneOf, toBoundedInt, toPositiveNumber } from '../lib/validate.js';

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
    return res.status(400).json({ success: false, message: 'Aksi harus "approve" atau "reject".' });
  }

  const { data: tx } = await supabaseServer
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
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
    return res.status(409).json({
      success: false,
      message: 'Transaksi baru saja diproses permintaan lain. Silakan muat ulang daftar transaksi.'
    });
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
  const { plan_name, amount, admin_fee, total_paid, payment_method } = req.body;
  if (!plan_name || !amount) {
    return res.status(400).json({ success: false, message: 'Nama paket dan nominal wajib diisi.' });
  }

  
  
  const numAmount = toPositiveNumber(amount);
  if (numAmount === null) {
    return res.status(400).json({ success: false, message: 'Nominal pembayaran tidak valid.' });
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
    const numAdminFee = Number(admin_fee) || QRIS_ADMIN_FEE;
    const numTotal = Number(total_paid) || (numAmount + numAdminFee);
    const method = payment_method || 'Bank Transfer';

    const refNo = await insertTransaction({
      txId,
      userId: req.user.id,
      planName: plan_name,
      amount: numAmount,
      adminFee: numAdminFee,
      totalPaid: numTotal,
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
        amount: numAmount,
        adminFee: numAdminFee,
        totalPaid: numTotal,
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


