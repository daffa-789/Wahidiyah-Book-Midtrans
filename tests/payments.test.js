import test from 'node:test';
import assert from 'node:assert/strict';

import { isPaymentSimulationAllowed } from '../server/config.js';
import { matchCatalogPlan, resolveManualTransferPricing } from '../server/lib/membership.js';
import { QRIS_ADMIN_FEE } from '../server/lib/constants.js';

const DEV = { NODE_ENV: 'development' };

test('isPaymentSimulationAllowed: matriks flag dan lingkungan (VULN-01)', () => {
  assert.equal(isPaymentSimulationAllowed({ ...DEV, NODE_ENV: 'production' }), false, 'default produksi');
  assert.equal(isPaymentSimulationAllowed(DEV), false, 'default development tetap 404');
  assert.equal(isPaymentSimulationAllowed({ ...DEV, ALLOW_PAYMENT_SIMULATION: '1' }), true, 'opt-in saat demo');
  assert.equal(isPaymentSimulationAllowed({ NODE_ENV: 'production', ALLOW_PAYMENT_SIMULATION: '1' }), false, 'opt-in tidak menembus produksi');
  assert.equal(isPaymentSimulationAllowed({ ...DEV, ALLOW_PAYMENT_SIMULATION: '1 ' }), false, 'perbandingan ketat');
  assert.equal(isPaymentSimulationAllowed({ ...DEV, ALLOW_PAYMENT_SIMULATION: 'true' }), false, 'bukan kata sandang lain');
  assert.equal(
    isPaymentSimulationAllowed({ ...DEV, ALLOW_PAYMENT_SIMULATION: '1', MIDTRANS_IS_PRODUCTION: 'TRUE' }),
    false,
    'Midtrans mode produksi mematikan simulasi meski NODE_ENV development'
  );
});

test('matchCatalogPlan: pencocokan ketat id lalu nama', () => {
  assert.equal(matchCatalogPlan({ planId: 'monthly' }).id, 'monthly');
  assert.equal(matchCatalogPlan({ planName: '  Paket Bulanan  ' }).id, 'monthly');
  assert.equal(matchCatalogPlan({ planName: 'paket bulanan' }).id, 'monthly');
  assert.equal(matchCatalogPlan({ planId: 'tahunan' }), null, 'id asing tidak jatuh ke default');
  assert.equal(matchCatalogPlan({ planName: 'Paket Siluman' }), null);
  assert.equal(matchCatalogPlan({}), null);
  assert.equal(matchCatalogPlan(), null);
});

test('resolveManualTransferPricing: nominal diambil dari katalog server', () => {
  const priced = resolveManualTransferPricing({ plan_id: 'monthly' });
  assert.equal(priced.ok, true);
  assert.equal(priced.amount, 25000);
  assert.equal(priced.adminFee, QRIS_ADMIN_FEE);
  assert.equal(priced.totalPaid, 25000 + QRIS_ADMIN_FEE);
  assert.equal(priced.planName, 'Paket Bulanan');
});

test('resolveManualTransferPricing: nominal klien yang bertentangan ditolak', () => {
  const cheap = resolveManualTransferPricing({ plan_id: 'monthly', amount: 1 });
  assert.equal(cheap.ok, false);
  assert.equal(cheap.conflict, true);
  assert.match(cheap.message, /Rp 25000/);

  assert.equal(resolveManualTransferPricing({ plan_name: 'Paket Bulanan', amount: '25000' }).ok, true, 'string angka yang cocok boleh lewat');
  assert.equal(resolveManualTransferPricing({ plan_id: 'monthly', amount: 'abc' }).ok, false);
  assert.equal(resolveManualTransferPricing({ plan_id: 'monthly', amount: -5 }).ok, false);
});

test('resolveManualTransferPricing: paket tidak dikenal ditolak, bukan digratiskan', () => {
  for (const body of [{}, { plan_name: '' }, { plan_id: 'gratis-terus' }, { plan_name: 'Wahidiyah Pro Selamanya' }]) {
    const result = resolveManualTransferPricing(body);
    assert.equal(result.ok, false, JSON.stringify(body));
    assert.match(result.message, /tidak dikenali/);
  }
});

test('isVoidAcknowledged: hanya akui Midtrans benar-benar mematikan order', async () => {
  const { isVoidAcknowledged } = await import('../server/lib/midtrans.js');

  assert.equal(isVoidAcknowledged({ status_code: '204' }), true, 'berhasil di-expire/dibatalkan');
  assert.equal(isVoidAcknowledged({ status_code: '200', transaction_status: 'expired' }), true);
  assert.equal(
    isVoidAcknowledged({ status_code: '407', status_message: 'Success, transaction is expired' }),
    true,
    'expire QRIS berhasil — Midtrans memakai kode 4xx untuk sukses (terukur di sandbox)'
  );
  assert.equal(
    isVoidAcknowledged({ status_code: '412', status_message: 'Transaction status cannot be updated.' }),
    false,
    'cancel QRIS ditolak: order masih bisa dibayar'
  );
  assert.equal(
    isVoidAcknowledged({ status_code: '404', status_message: "Transaction doesn't exist." }),
    true,
    'order tidak ada di Midtrans = tidak ada yang bisa dibayar'
  );
  assert.equal(isVoidAcknowledged({ status_code: '404', status_message: 'Jaringan bermasalah' }), false);
  assert.equal(
    isVoidAcknowledged({ status_code: '407', status_message: 'Transaction is already settled' }),
    false,
    'sudah lunas: baris lokal tidak boleh dimatikan'
  );
  assert.equal(isVoidAcknowledged({}), false);
  assert.equal(isVoidAcknowledged(), false);
});

test('resolveManualTransferPricing: biaya layanan dan total dari klien diabaikan', () => {
  const result = resolveManualTransferPricing({
    plan_id: 'monthly',
    admin_fee: 0,
    total_paid: 1
  });
  assert.equal(result.ok, true);
  assert.equal(result.adminFee, QRIS_ADMIN_FEE);
  assert.equal(result.totalPaid, 25000 + QRIS_ADMIN_FEE);
});
