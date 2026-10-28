
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ stub: undefined }));

vi.mock('../server/db.js', async () => {
  const { createSupabaseStub } = await import('./helpers/supabase-stub.js');
  h.stub = createSupabaseStub();
  return { supabaseServer: h.stub.client };
});

vi.mock('../server/lib/midtrans.js', () => ({
  isMidtransConfigured: true,
  verifySignatureKey: vi.fn(),
  getTransactionStatus: vi.fn(),
  isTransactionSettled: vi.fn(),
  isVoidAcknowledged: vi.fn(),
  extractQrString: vi.fn(),
  extractQrAction: vi.fn(),
  createQrisCharge: vi.fn(),
  expireQrisTransaction: vi.fn(),
  cancelQrisTransaction: vi.fn(),
  fetchQrImage: vi.fn(),
  isAllowedQrUrl: vi.fn()
}));

vi.mock('../server/lib/membership.js', () => ({
  activatePaidMembership: vi.fn(),
  activeSubscriptionConflict: vi.fn(() => null),
  insertTransaction: vi.fn(() => '000012345678'),
  restorePendingTransaction: vi.fn(async (transactionId) => {
    const result = await h.stub.client.from('transactions')
      .update({ status: 'pending', verified_at: null })
      .eq('id', transactionId)
      .eq('status', 'success');
    if (result.error) throw result.error;
  }),
  toRefCode: (refNo) => 'REF-' + String(refNo).slice(-8),
  matchCatalogPlan: vi.fn(),
  resolveManualTransferPricing: vi.fn(),
  startMembershipSweeper: vi.fn(),
  ACTIVE_SUBSCRIPTION_STATUS: 'Aktif',
  ENDED_SUBSCRIPTION_STATUS: 'Berakhir'
}));

import * as midtrans from '../server/lib/midtrans.js';
import * as membership from '../server/lib/membership.js';
import {
  cancelQrisForUser,
  handleMidtransNotification,
  rejectTransaction,
  resolveQrisStatus,
  settleTransaction
} from '../server/services/payment_service.js';

const stub = () => h.stub;

const baseTx = (overrides = {}) => ({
  id: 'tx-1',
  user_id: 'u1',
  ref_no: '000012345678',
  plan_name: 'Paket Bulanan',
  amount: 25000,
  admin_fee: 3000,
  total_paid: 28000,
  status: 'pending',
  expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  ...overrides
});

beforeEach(() => {
  stub().reset();
  vi.clearAllMocks();
  stub().enqueue({ data: null });  // default aman untuk satu await
});


describe('payment.service: settleTransaction — idempotensi klaim (§4.3)', () => {
  it('transaksi yang sudah success tidak diproses ulang (webhook duplikat)', async () => {
    const result = await settleTransaction(baseTx({ status: 'success' }));

    expect(result.alreadyProcessed).toBe(true);
    expect(stub().ops('update')).toHaveLength(0);
    expect(membership.activatePaidMembership).not.toHaveBeenCalled();
  });

  it('klaim UPDATE bersyarat MENANG → Pro diaktifkan tepat satu kali', async () => {
    stub().reset();
    stub().enqueue({ data: [{ id: 'tx-1' }] });  // klaim menang
    membership.activatePaidMembership.mockResolvedValue({ subscriptionId: 'sub-9' });

    const result = await settleTransaction(baseTx());

    expect(result.alreadyProcessed).toBe(false);
    expect(result.activated.subscriptionId).toBe('sub-9');
    expect(stub().last('update').patch.status).toBe('success');
    expect(membership.activatePaidMembership).toHaveBeenCalledOnce();
    expect(membership.activatePaidMembership).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', refCode: 'REF-12345678' })
    );
  });

  it('klaim KALAH (webhook lain lebih dulu) → diabaikan tanpa aktivasi kedua', async () => {
    stub().reset();
    stub().enqueue({ data: [] });  // 0 baris berubah: sudah diklaim pihak lain

    const result = await settleTransaction(baseTx());

    expect(result.alreadyProcessed).toBe(true);
    expect(membership.activatePaidMembership).not.toHaveBeenCalled();
  });

  it('aktivasi gagal → status dikembalikan ke pending agar notifikasi ulang mencoba lagi', async () => {
    stub().reset();
    stub().enqueue({ data: [{ id: 'tx-1' }] });   // klaim menang
    stub().enqueue({ data: null });               // rollback ke pending
    membership.activatePaidMembership.mockRejectedValue(new Error('DB sibuk'));

    await expect(settleTransaction(baseTx())).rejects.toThrow('DB sibuk');

    const updates = stub().ops('update');
    expect(updates.at(-1).patch).toEqual({ status: 'pending', verified_at: null });
  });
});


describe('payment.service: rejectTransaction — idempotensi', () => {
  it('hanya menyentuh baris yang masih pending', async () => {
    stub().reset();
    stub().enqueue({ data: [{ id: 'tx-1' }] });

    const result = await rejectTransaction(baseTx(), 'expire');

    expect(result.alreadyProcessed).toBe(false);
    expect(stub().last('update').patch.status).toBe('rejected');
  });

  it('baris non-pending dibiarkan (sudah final)', async () => {
    const result = await rejectTransaction(baseTx({ status: 'success' }), 'expire');
    expect(result.alreadyProcessed).toBe(true);
    expect(stub().ops('update')).toHaveLength(0);
  });
});


describe('payment.service: resolveQrisStatus (mesin status polling)', () => {
  it('status success lokal menang tanpa memanggil Midtrans', async () => {
    const result = await resolveQrisStatus({ transaction: baseTx({ status: 'success' }) });

    expect(result).toEqual({ status: 'settlement', isPaid: true });
    expect(midtrans.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('rejected lokal dilaporkan expire', async () => {
    const result = await resolveQrisStatus({ transaction: baseTx({ status: 'rejected' }) });
    expect(result).toEqual({ status: 'expire', isPaid: false });
  });

  it('pending yang melewati batas waktu dimatikan lokal, tanpa tanya Midtrans', async () => {
    stub().reset();
    stub().enqueue({ data: [{ id: 'tx-1' }] });  // rejectTransaction klaim menang

    const result = await resolveQrisStatus({
      transaction: baseTx({ expires_at: new Date(Date.now() - 1000).toISOString() })
    });

    expect(result).toEqual({ status: 'expire', isPaid: false });
    expect(midtrans.getTransactionStatus).not.toHaveBeenCalled();
    expect(stub().last('update').patch.status).toBe('rejected');
  });

  it('Midtrans melaporkan settlement → klaim settle dijalankan', async () => {
    stub().reset();
    stub().enqueue({ data: [{ id: 'tx-1' }] });  // klaim settle menang
    midtrans.getTransactionStatus.mockResolvedValue({ transaction_status: 'settlement' });
    midtrans.isTransactionSettled.mockReturnValue(true);
    membership.activatePaidMembership.mockResolvedValue({ subscriptionId: 'sub-9' });

    const result = await resolveQrisStatus({ transaction: baseTx() });

    expect(result).toEqual({ status: 'settlement', isPaid: true });
  });

  it('status gagal Midtrans (expire/cancel/deny) diturunkan ke rejected', async () => {
    stub().reset();
    stub().enqueue({ data: [{ id: 'tx-1' }] });  // rejectTransaction
    midtrans.getTransactionStatus.mockResolvedValue({ transaction_status: 'cancel' });
    midtrans.isTransactionSettled.mockReturnValue(false);

    const result = await resolveQrisStatus({ transaction: baseTx() });

    expect(result.status).toBe('cancel');
    expect(stub().last('update').patch.status).toBe('rejected');
  });

  it('Midtrans tak terjangkau → tetap pending, bukan galat (polling tahan gangguan)', async () => {
    midtrans.getTransactionStatus.mockRejectedValue(new Error('timeout'));

    const result = await resolveQrisStatus({ transaction: baseTx() });

    expect(result).toEqual({ status: 'pending', isPaid: false });
  });
});


describe('payment.service: handleMidtransNotification (webhook berlapis verifikasi)', () => {
  const payload = (overrides = {}) => ({
    order_id: 'tx-1',
    transaction_status: 'settlement',
    gross_amount: '28000.00',
    ...overrides
  });

  it('signature palsu ditolak 401 tanpa menyentuh database', async () => {
    midtrans.verifySignatureKey.mockReturnValue({ ok: false, reason: 'Signature key tidak valid.' });

    const result = await handleMidtransNotification(payload());

    expect(result.outcome).toBe('invalid-signature');
    expect(stub().calls).toHaveLength(0);
  });

  it('order tak dikenal dilaporkan tanpa diproses', async () => {
    stub().reset();
    stub().enqueue({ data: null });  // select maybeSingle → tidak ada
    midtrans.verifySignatureKey.mockReturnValue({ ok: true });

    const result = await handleMidtransNotification(payload());

    expect(result.outcome).toBe('unknown-order');
  });

  it('nominal tidak cocok ditolak (anti-manipulasi gross_amount)', async () => {
    stub().reset();
    stub().enqueue({ data: baseTx() });
    midtrans.verifySignatureKey.mockReturnValue({ ok: true });

    const result = await handleMidtransNotification(payload({ gross_amount: '1000.00' }));

    expect(result.outcome).toBe('amount-mismatch');
    expect(result.notifiedAmount).toBe(1000);
    expect(result.storedAmount).toBe(28000);
  });

  it('settlement sah → klaim menang, aktivasi berjalan sekali', async () => {
    stub().reset();
    stub().enqueue({ data: baseTx() });          // load transaksi
    stub().enqueue({ data: [{ id: 'tx-1' }] });  // klaim settle menang
    midtrans.verifySignatureKey.mockReturnValue({ ok: true });
    midtrans.isTransactionSettled.mockReturnValue(true);
    membership.activatePaidMembership.mockResolvedValue({ subscriptionId: 'sub-9' });

    const result = await handleMidtransNotification(payload());

    expect(result).toEqual({ outcome: 'settled', alreadyProcessed: false });
    expect(membership.activatePaidMembership).toHaveBeenCalledOnce();
  });

  it('webhook duplikat setelah settle → alreadyProcessed true tanpa aktivasi ulang', async () => {
    stub().reset();
    stub().enqueue({ data: baseTx({ status: 'success' }) });  // load: sudah final
    midtrans.verifySignatureKey.mockReturnValue({ ok: true });
    midtrans.isTransactionSettled.mockReturnValue(true);

    const result = await handleMidtransNotification(payload());

    expect(result).toEqual({ outcome: 'settled', alreadyProcessed: true });
    expect(membership.activatePaidMembership).not.toHaveBeenCalled();
  });

  it('status expire → transaksi diturunkan ke rejected', async () => {
    stub().reset();
    stub().enqueue({ data: baseTx() });
    stub().enqueue({ data: [{ id: 'tx-1' }] });  // rejectTransaction
    midtrans.verifySignatureKey.mockReturnValue({ ok: true });
    midtrans.isTransactionSettled.mockReturnValue(false);

    const result = await handleMidtransNotification(payload({ transaction_status: 'expire' }));

    expect(result).toEqual({ outcome: 'rejected', alreadyProcessed: false });
    expect(stub().last('update').patch.status).toBe('rejected');
  });

  it('status pending hanya diabaikan (tidak mengubah baris)', async () => {
    stub().reset();
    stub().enqueue({ data: baseTx() });
    midtrans.verifySignatureKey.mockReturnValue({ ok: true });
    midtrans.isTransactionSettled.mockReturnValue(false);

    const result = await handleMidtransNotification(payload({ transaction_status: 'pending' }));

    expect(result).toEqual({ outcome: 'ignored', status: 'pending' });
    expect(stub().ops('update')).toHaveLength(0);
  });
});


describe('payment.service: cancelQrisForUser (pembatalan QRIS)', () => {
  it('Midtrans mengakui void → baris ditutup ke rejected', async () => {
    stub().reset();
    stub().enqueue({ data: null });  // update cancel
    midtrans.expireQrisTransaction.mockResolvedValue({ status_code: '200' });
    midtrans.isVoidAcknowledged.mockReturnValue(true);

    const result = await cancelQrisForUser({ transaction: baseTx() });

    expect(result.voidedByMidtrans).toBe(true);
    expect(stub().last('update').patch).toMatchObject({ status: 'rejected' });
  });

  it('Midtrans menolak void (412 khas QRIS) → hanya masa berlaku ditarik, status tetap pending', async () => {
    stub().reset();
    stub().enqueue({ data: null });  // update expires_at saja
    midtrans.expireQrisTransaction.mockResolvedValue({ status_code: '412' });
    midtrans.cancelQrisTransaction.mockResolvedValue({ status_code: '412' });
    midtrans.isVoidAcknowledged.mockReturnValue(false);

    const result = await cancelQrisForUser({ transaction: baseTx() });

    expect(result.voidedByMidtrans).toBe(false);
    const patch = stub().last('update').patch;
    expect(patch.status).toBeUndefined();
    expect(new Date(patch.expires_at).getTime()).toBeLessThanOrEqual(Date.now());
  });
});
