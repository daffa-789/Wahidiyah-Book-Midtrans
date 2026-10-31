import { supabaseServer } from '../db.js';
import {
  decideTransactionVerification,
  generateId,
  loadMembershipUser,
  settleExpiredMembership,
  toPublicUser,
  TRANSACTION_PENDING_STATUS,
} from '../auth.js';
import {
  activatePaidMembership,
  activeSubscriptionConflict,
  insertTransaction,
  resolveManualTransferPricing,
  restorePendingTransaction,
  toRefCode,
} from '../lib/membership.js';
import { createServiceError } from '../lib/errors.js';
import { toBoundedInt } from '../lib/validate.js';

/**
 * Daftar transaksi untuk panel admin, terbaru di atas.
 * `limit` dari query string dijepit ke 1..200 (bawaan 50).
 */
export async function listTransactions({ limit } = {}) {
  let query = supabaseServer
    .from('transactions')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(toBoundedInt(limit, { min: 1, max: 200, fallback: 50 }));
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => ({
    ...row,
    userName: row.users?.name,
    userEmail: row.users?.email,
  }));
}

/**
 * Memverifikasi transaksi transfer manual.
 *
 * Hasil yang bukan galat dikembalikan sebagai `outcome`:
 *  - `idempotent` — status sudah sama dengan aksi; tidak menambah masa aktif.
 *  - `verified`   — klaim baris berhasil dan (bila approve) Pro diaktifkan.
 * Galat aturan bisnis dilempar sebagai `createServiceError` (404/409).
 */
export async function verifyTransaction({ id, action }) {
  const { data: tx, error: transactionError } = await supabaseServer
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (transactionError) throw transactionError;
  if (!tx) {
    throw createServiceError('Transaksi tidak ditemukan', { statusCode: 404 });
  }

  const decision = decideTransactionVerification(tx.status, action);

  if (decision.kind === 'idempotent') {
    return {
      outcome: 'idempotent',
      status: tx.status,
      message: `Transaksi sudah berada pada status "${tx.status}" sehingga verifikasi diulang tanpa menambahkan masa aktif.`,
    };
  }

  if (decision.kind === 'conflict') {
    throw createServiceError(
      `Transaksi tidak dapat diverifikasi ulang: statusnya sudah "${tx.status}". ` +
        'Hanya transaksi berstatus "pending" yang boleh diproses.',
      { statusCode: 409, extra: { status: tx.status } },
    );
  }

  const { data: claimed, error: claimError } = await supabaseServer
    .from('transactions')
    .update({ status: decision.targetStatus, verified_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .select('id');
  if (claimError) throw claimError;

  if (!claimed || claimed.length === 0) {
    throw createServiceError(
      'Transaksi baru saja diproses permintaan lain. Silakan muat ulang daftar transaksi.',
      { statusCode: 409 },
    );
  }

  if (action === 'approve') {
    try {
      await activatePaidMembership({
        userId: tx.user_id,
        planName: tx.plan_name,
        price: tx.amount,
        refCode: toRefCode(tx.ref_no),
      });
    } catch (activationError) {
      try {
        await restorePendingTransaction(id);
      } catch (rollbackError) {
        activationError.rollbackError = rollbackError;
      }
      throw activationError;
    }
  }

  return {
    outcome: 'verified',
    status: decision.targetStatus,
    message: `Transaksi berhasil ${action === 'approve' ? 'diverifikasi' : 'ditolak'}`,
  };
}

/**
 * Mencatat transaksi transfer manual baru (VULN-06).
 *
 * Nominal, nama paket, dan biaya layanan dibaca dari katalog server; nilai
 * `amount` dari klien hanya klaim yang harus cocok — `admin_fee`/`total_paid`
 * kiriman klien tidak dibaca sama sekali.
 *
 * Hasil: `already-pro` (tidak perlu membuat transaksi) atau `pending`
 * (transaksi tersimpan, menunggu konfirmasi gateway).
 */
export async function createManualTransaction({ user, body = {} }) {
  const pricing = resolveManualTransferPricing(body);
  if (!pricing.ok) {
    throw createServiceError(pricing.message, { statusCode: 400 });
  }

  await settleExpiredMembership(user.id);
  const membership = (await loadMembershipUser(user.id)) || user;

  const conflict = activeSubscriptionConflict(membership);
  if (conflict) {
    return {
      outcome: 'already-pro',
      message: conflict.message,
      user: toPublicUser(membership),
    };
  }

  const txId = generateId('tx');
  const method = body.payment_method || 'Bank Transfer';

  const refNo = await insertTransaction({
    txId,
    userId: user.id,
    planName: pricing.planName,
    amount: pricing.amount,
    adminFee: pricing.adminFee,
    totalPaid: pricing.totalPaid,
    method,
    status: TRANSACTION_PENDING_STATUS,
  });

  return {
    outcome: 'pending',
    transaction: {
      id: txId,
      refNo,
      amount: pricing.amount,
      adminFee: pricing.adminFee,
      totalPaid: pricing.totalPaid,
      planName: 'Pro',
      paymentMethod: method,
      status: TRANSACTION_PENDING_STATUS,
    },
    user: toPublicUser(membership),
  };
}
