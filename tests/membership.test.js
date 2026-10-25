import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ stub: undefined }));

vi.mock('../server/db.js', async () => {
  const { createSupabaseStub } = await import('./helpers/supabase-stub.js');
  h.stub = createSupabaseStub();
  return { supabaseServer: h.stub.client };
});

import {
  activeSubscriptionConflict,
  activatePaidMembership,
  insertTransaction,
  matchCatalogPlan,
  toRefCode
} from '../server/lib/membership.js';

const stub = () => h.stub;

const DAY_MS = 24 * 60 * 60 * 1000;
const futureIso = new Date(Date.now() + 10 * DAY_MS).toISOString();
const pastIso = new Date(Date.now() - 10 * DAY_MS).toISOString();

beforeEach(() => {
  stub().reset();
  vi.clearAllMocks();
});

describe('membership: toRefCode', () => {
  it('mengambil 8 digit terakhir ref_no sebagai kode REF', () => {
    expect(toRefCode('000012345678')).toBe('REF-12345678');
  });
});

describe('membership: matchCatalogPlan (pencocok ketat)', () => {
  it('mencocokkan berdasarkan planId dan nama (tidak peka kapital)', () => {
    expect(matchCatalogPlan({ planId: 'monthly' })?.name).toBe('Paket Bulanan');
    expect(matchCatalogPlan({ planName: ' PAKET BULANAN ' })?.id).toBe('monthly');
  });

  it('menolak paket tak dikenal dengan null — tidak ada fallback diam-diam', () => {
    expect(matchCatalogPlan({ planId: 'vip-mahal' })).toBeNull();
    expect(matchCatalogPlan({ planName: 'Paket VIP' })).toBeNull();
    expect(matchCatalogPlan({})).toBeNull();
    expect(matchCatalogPlan()).toBeNull();
  });
});

describe('membership: activeSubscriptionConflict', () => {
  it('Pro aktif dengan tanggal kedaluwarsa di masa depan → konflik', () => {
    const conflict = activeSubscriptionConflict({ is_pro: true, subscription_expires_at: futureIso });
    expect(conflict).not.toBeNull();
    expect(conflict.message).toContain('masih aktif');
  });

  it('Pro tanpa tanggal (pemberian manual admin) tetap dianggap aktif', () => {
    expect(activeSubscriptionConflict({ is_pro: true, subscription_expires_at: '' })).not.toBeNull();
  });

  it('Pro kedaluwarsa atau bukan Pro → boleh lanjut membayar (null)', () => {
    expect(activeSubscriptionConflict({ is_pro: true, subscription_expires_at: pastIso })).toBeNull();
    expect(activeSubscriptionConflict({ is_pro: false })).toBeNull();
    expect(activeSubscriptionConflict(null)).toBeNull();
  });
});

describe('membership: insertTransaction', () => {
  it('menyimpan baris pending dengan ref_no 12 digit berawalan 0000', async () => {
    stub().enqueue({ data: null });
    const refNo = await insertTransaction({
      txId: 'tx-1', userId: 'u1', planName: 'Paket Bulanan',
      amount: 25000, adminFee: 3000, totalPaid: 28000,
      method: 'QRIS Midtrans', status: 'pending'
    });

    expect(refNo).toMatch(/^0000\d{8}$/);
    const insert = stub().last('insert');
    expect(insert.rows[0]).toMatchObject({
      id: 'tx-1',
      user_id: 'u1',
      plan_name: 'Paket Bulanan',
      amount: 25000,
      admin_fee: 3000,
      total_paid: 28000,
      payment_method: 'QRIS Midtrans',
      status: 'pending'
    });
  });
});

describe('membership: activatePaidMembership (durasi & kedaluwarsa)', () => {
  it('periode tanpa satuan jatuh ke 30 hari dan menyetel is_pro', async () => {
    stub().enqueue({ data: null });  // users.update
    stub().enqueue({ data: null });  // subscriptions.insert

    const result = await activatePaidMembership({ userId: 'u1', planName: 'Paket Bulanan', price: 25000, refCode: 'REF-12345678' });

    expect(result.days).toBe(30);
    expect(result.period).toBe('Langganan Pro');
    expect(result.subscriptionId).toMatch(/^sub/);

    const userUpdate = stub().ops('update')[0];
    expect(userUpdate.patch.is_pro).toBe(true);
    expect(new Date(userUpdate.patch.subscription_expires_at).getTime())
      .toBeGreaterThan(Date.now() + 29 * DAY_MS);

    const subInsert = stub().last('insert');
    expect(subInsert.rows[0]).toMatchObject({
      plan_name: 'Paket Bulanan',
      price: 25000,
      status: 'Aktif',
      ref_code: 'REF-12345678'
    });
  });

  it('menerjemahkan periode "2 bulan" menjadi 60 hari', async () => {
    stub().enqueue({ data: null });
    stub().enqueue({ data: null });

    const result = await activatePaidMembership({ userId: 'u1', periodFallback: '2 bulan' });

    expect(result.days).toBe(60);
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now() + 59 * DAY_MS);
  });

  it('menerjemahkan periode tahunan menjadi 365 hari', async () => {
    stub().enqueue({ data: null });
    stub().enqueue({ data: null });

    const result = await activatePaidMembership({ userId: 'u1', periodFallback: 'tahunan' });

    expect(result.days).toBe(365);
  });
});
