import { supabaseServer } from '../db.js';
import {
  generateId,
  loadMembershipUser,
  settleExpiredMembership,
  toPublicUser,
  TRANSACTION_PENDING_STATUS
} from '../auth.js';
import {
  activatePaidMembership,
  activeSubscriptionConflict,
  insertTransaction,
  toRefCode
} from '../lib/membership.js';
import { QRIS_ADMIN_FEE, findPlan } from '../lib/constants.js';
import {
  MIDTRANS_IS_PRODUCTION,
  MIDTRANS_PAYMENT_METHOD_LABEL,
  MIDTRANS_QRIS_EXPIRY_MINUTES
} from '../config.js';
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

export const FAILED_MIDTRANS_STATUSES = new Set(['expire', 'cancel', 'deny']);

export const TRANSACTION_COLUMNS =
  'id, ref_no, user_id, plan_name, amount, admin_fee, total_paid, payment_method, status, verified_at, created_at, midtrans_transaction_id, midtrans_qr_url, midtrans_qr_string, expires_at';

export const paymentsService = {
  async loadOwnTransaction(orderId, user) {
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
  },

  async settleTransaction(transaction) {
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
  },

  async rejectTransaction(transaction, reason) {
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
  },

  async createCharge({ user, planId, phone }) {
    if (!isMidtransConfigured) {
      const err = new Error('Payment gateway Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env.');
      err.code = 'MIDTRANS_NOT_CONFIGURED';
      err.statusCode = 503;
      throw err;
    }

    const plan = findPlan(planId);
    const amount = plan.price;
    const adminFee = QRIS_ADMIN_FEE;
    const totalPaid = amount + adminFee;

    await settleExpiredMembership(user.id);
    const membership = (await loadMembershipUser(user.id)) || user;

    const conflict = activeSubscriptionConflict(membership);
    if (conflict) {
      return {
        alreadyPro: true,
        message: conflict.message,
        user: toPublicUser(membership)
      };
    }

    // Cek transaksi pending aktif yang bisa dipakai kembali
    const { data: pendingTx } = await supabaseServer
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('user_id', user.id)
      .eq('status', TRANSACTION_PENDING_STATUS)
      .eq('payment_method', MIDTRANS_PAYMENT_METHOD_LABEL)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const reusable = pendingTx && (pendingTx.midtrans_qr_string || pendingTx.midtrans_qr_url);
    if (reusable) {
      return {
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
      };
    }

    const orderId = generateId('tx');
    const expiredAt = new Date(Date.now() + MIDTRANS_QRIS_EXPIRY_MINUTES * 60_000).toISOString();

    const refNo = await insertTransaction({
      txId: orderId,
      userId: user.id,
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
          phone: phone || undefined
        }
      });
    } catch (chargeError) {
      await this.rejectTransaction(pendingRow, 'charge gagal');
      throw chargeError;
    }

    const qrString = extractQrString(charge);
    const qrAction = extractQrAction(charge);

    if (!qrString && !qrAction) {
      await this.rejectTransaction(pendingRow, 'tanpa QR');
      logger.error('MIDTRANS', 'Respons charge tidak berisi qr_string maupun URL QR', { orderId });
      const err = new Error('Midtrans tidak mengembalikan kode QR. Coba beberapa saat lagi.');
      err.statusCode = 502;
      throw err;
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

    return {
      orderId,
      refNo,
      qrString,
      qrImageUrl: qrAction ? `/api/payments/qris/${orderId}/qr.png` : null,
      ...(MIDTRANS_IS_PRODUCTION ? {} : { qrMidtransUrl: qrAction?.url || null }),
      planName: plan.name,
      amount,
      adminFee,
      totalPaid,
      status: TRANSACTION_PENDING_STATUS,
      expiredAt,
      user: toPublicUser(membership)
    };
  },

  async checkStatus(orderId, user) {
    const { transaction, forbidden } = await this.loadOwnTransaction(orderId, user);
    if (!transaction) {
      return { transaction: null, forbidden };
    }

    const baseResponse = {
      orderId: transaction.id,
      totalPaid: transaction.total_paid,
      expiredAt: transaction.expires_at
    };

    if (transaction.status === 'success') {
      return { ...baseResponse, status: 'settlement', isPaid: true };
    }
    if (transaction.status === 'rejected') {
      return { ...baseResponse, status: 'expire', isPaid: false };
    }

    if (transaction.expires_at && new Date(transaction.expires_at).getTime() < Date.now()) {
      await this.rejectTransaction(transaction, 'kedaluwarsa');
      return { ...baseResponse, status: 'expire', isPaid: false };
    }

    try {
      const status = await getTransactionStatus(transaction.id);
      const transactionStatus = String(status?.transaction_status || 'pending').toLowerCase();
      const fraudStatus = String(status?.fraud_status || '').toLowerCase();

      if (transactionStatus === 'settlement' && fraudStatus === 'accept') {
        await this.settleTransaction(transaction);
        return { ...baseResponse, status: 'settlement', isPaid: true };
      }

      if (FAILED_MIDTRANS_STATUSES.has(transactionStatus)) {
        await this.rejectTransaction(transaction, transactionStatus);
        return { ...baseResponse, status: transactionStatus, isPaid: false };
      }

      return { ...baseResponse, status: transactionStatus, isPaid: false };
    } catch (error) {
      logger.warn('MIDTRANS', 'Gagal memeriksa status ke Midtrans', { pesan: error.message });
      return { ...baseResponse, status: 'pending', isPaid: false };
    }
  },

  async handleNotification(payload) {
    const verification = verifySignatureKey(payload);
    if (!verification.ok) {
      return { ok: false, status: 401, message: 'Notifikasi tidak terautentikasi.' };
    }

    const { data: transaction } = await supabaseServer
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('id', payload.order_id)
      .maybeSingle();

    if (!transaction) {
      return { ok: false, status: 404, message: 'Transaksi tidak ditemukan.' };
    }

    const notifiedAmount = Math.round(Number(payload.gross_amount));
    const storedAmount = Math.round(Number(transaction.total_paid));
    if (!Number.isFinite(notifiedAmount) || notifiedAmount !== storedAmount) {
      return { ok: false, status: 400, message: 'Nominal pembayaran tidak sesuai.' };
    }

    const transactionStatus = String(payload.transaction_status || '').toLowerCase();
    const fraudStatus = String(payload.fraud_status || '').toLowerCase();

    if (transactionStatus === 'settlement' && fraudStatus === 'accept') {
      const { alreadyProcessed } = await this.settleTransaction(transaction);
      return { ok: true, alreadyProcessed, status: 'settlement' };
    }

    if (FAILED_MIDTRANS_STATUSES.has(transactionStatus)) {
      const { alreadyProcessed } = await this.rejectTransaction(transaction, transactionStatus);
      return { ok: true, alreadyProcessed, status: transactionStatus };
    }

    return { ok: true, status: transactionStatus || 'pending' };
  }
};
