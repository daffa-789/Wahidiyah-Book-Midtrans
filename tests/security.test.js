import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { resolveJwtSecret, decideTransactionVerification } from '../server/auth.js';
import { resolveSupabaseCredentials } from '../server/db.js';
import { canExposeDevOtp, isLoopbackAddress, resendCooldownRemaining } from '../server/lib/otp.js';
import { isAllowedQrUrl, isTransactionSettled, verifySignatureKey } from '../server/lib/midtrans.js';
import { findPlan, DEFAULT_PLAN_ID, SUBSCRIPTION_PLANS } from '../server/lib/constants.js';
import { MIDTRANS_SERVER_KEY } from '../server/config.js';

test('resolveJwtSecret: produksi tanpa secret menolak boot', () => {
  assert.throws(
    () => resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: '' }),
    /JWT_SECRET wajib diset di produksi/
  );
  assert.throws(
    () => resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: '   ' }),
    /JWT_SECRET wajib diset di produksi/
  );
});

test('resolveJwtSecret: memakai nilai env bila ada', () => {
  assert.equal(resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'rahasia-uji-panjang' }), 'rahasia-uji-panjang');
});

test('resolveJwtSecret: development tanpa secret memakai nilai acak yang berbeda tiap proses', () => {
  const a = resolveJwtSecret({ NODE_ENV: 'development' });
  const b = resolveJwtSecret({ NODE_ENV: 'development' });
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
});

test('resolveSupabaseCredentials: produksi tanpa kunci service-role menolak boot', () => {
  assert.throws(
    () => resolveSupabaseCredentials({ NODE_ENV: 'production', VITE_SUPABASE_ANON_KEY: 'anon-saja' }),
    /SUPABASE_SECRET_KEY/
  );
});

test('resolveSupabaseCredentials: prioritas service-role lalu anon, tanpa literal bawaan', () => {
  const withSecret = resolveSupabaseCredentials({ SUPABASE_SECRET_KEY: 'secret-kunci', VITE_SUPABASE_ANON_KEY: 'anon-kunci' });
  assert.equal(withSecret.key, 'secret-kunci');
  assert.equal(withSecret.hasServiceRoleKey, true);

  const anonOnly = resolveSupabaseCredentials({ VITE_SUPABASE_ANON_KEY: 'anon-kunci' });
  assert.equal(anonOnly.key, 'anon-kunci');
  assert.equal(anonOnly.hasServiceRoleKey, false);

  const kosong = resolveSupabaseCredentials({});
  assert.equal(kosong.key, '');
});

test('isLoopbackAddress: hanya alamat loopback', () => {
  assert.equal(isLoopbackAddress('127.0.0.1'), true);
  assert.equal(isLoopbackAddress('127.5.6.7'), true);
  assert.equal(isLoopbackAddress('::1'), true);
  assert.equal(isLoopbackAddress('::ffff:127.0.0.1'), true);
  assert.equal(isLoopbackAddress('203.0.113.5'), false);
  assert.equal(isLoopbackAddress(''), false);
  assert.equal(isLoopbackAddress(undefined), false);
});

test('canExposeDevOtp: matriks flag, NODE_ENV, dan asal permintaan', () => {
  assert.equal(canExposeDevOtp({ NODE_ENV: 'development' }, '127.0.0.1'), false, 'tanpa flag eksplisit tidak pernah bocor');
  assert.equal(canExposeDevOtp({ NODE_ENV: 'development', EXPOSE_DEV_OTP: '0' }, '127.0.0.1'), false);
  assert.equal(canExposeDevOtp({ NODE_ENV: 'development', EXPOSE_DEV_OTP: '1 ' }, '127.0.0.1'), false, 'perbandingan ketat');
  assert.equal(canExposeDevOtp({ NODE_ENV: 'development', EXPOSE_DEV_OTP: '1' }, '127.0.0.1'), true);
  assert.equal(canExposeDevOtp({ NODE_ENV: 'development', EXPOSE_DEV_OTP: '1' }, '203.0.113.9'), false, 'bukan loopback ditolak');
  assert.equal(canExposeDevOtp({ NODE_ENV: 'production', EXPOSE_DEV_OTP: '1' }, '127.0.0.1'), false, 'produksi ditolak');
  assert.equal(canExposeDevOtp({ NODE_ENV: 'development', EXPOSE_DEV_OTP: '1' }), true, 'laporan boot tanpa permintaan');
  assert.equal(canExposeDevOtp({ NODE_ENV: 'production', EXPOSE_DEV_OTP: '1' }), false, 'laporan boot produksi');
});

test('isAllowedQrUrl: hanya host Midtrans lewat HTTPS', () => {
  assert.equal(isAllowedQrUrl('https://app.midtrans.com/qrcode/abc.png'), true);
  assert.equal(isAllowedQrUrl('https://midtrans.com/x.png'), true);
  assert.equal(isAllowedQrUrl('https://midtrans.com.evil.com/x.png'), false);
  assert.equal(isAllowedQrUrl('https://evil.com/?x=midtrans.com'), false);
  assert.equal(isAllowedQrUrl('http://app.midtrans.com/x.png'), false);
  assert.equal(isAllowedQrUrl('bukan-url'), false);
});

test('isTransactionSettled: settlement dan capture dengan fraud_status', () => {
  assert.equal(isTransactionSettled('settlement', ''), true);
  assert.equal(isTransactionSettled('settlement', 'accept'), true);
  assert.equal(isTransactionSettled('settlement', 'deny'), false);
  assert.equal(isTransactionSettled('capture', 'accept'), true);
  assert.equal(isTransactionSettled('capture', ''), false);
  assert.equal(isTransactionSettled('pending', ''), false);
  assert.equal(isTransactionSettled('deny', ''), false);
});

test('verifySignatureKey: menolak hash salah dan panjang salah', () => {
  const payload = { order_id: 'OID-1', status_code: '200', gross_amount: '25000' };
  assert.equal(verifySignatureKey({ ...payload, signature_key: 'x' }).ok, false);
  assert.equal(verifySignatureKey({ ...payload, signature_key: 'f'.repeat(200) }).ok, false);
  assert.equal(verifySignatureKey({ ...payload }).ok, false);

  if (!MIDTRANS_SERVER_KEY) return;
  const expected = crypto
    .createHash('sha512')
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex');
  assert.equal(verifySignatureKey({ ...payload, signature_key: expected }).ok, true);
  assert.equal(verifySignatureKey({ ...payload, gross_amount: '1', signature_key: expected }).ok, false);
});

test('decideTransactionVerification: pending, idempoten, dan konflik', () => {
  assert.deepEqual(decideTransactionVerification('pending', 'approve'), { kind: 'apply', targetStatus: 'success' });
  assert.deepEqual(decideTransactionVerification('pending', 'reject'), { kind: 'apply', targetStatus: 'rejected' });
  assert.deepEqual(decideTransactionVerification('success', 'approve'), { kind: 'idempotent', status: 'success' });
  assert.deepEqual(decideTransactionVerification('rejected', 'approve'), {
    kind: 'conflict',
    status: 'rejected',
    targetStatus: 'success'
  });
});

test('findPlan: katalog server adalah satu-satunya sumber harga', () => {
  assert.equal(findPlan('monthly').price, 25000);
  assert.equal(findPlan('  monthly  ').id, 'monthly');
  assert.equal(findPlan('tidak-ada-di-katalog').id, DEFAULT_PLAN_ID);
  assert.equal(findPlan(undefined).id, DEFAULT_PLAN_ID);
  assert.ok(SUBSCRIPTION_PLANS.every((plan) => Number.isFinite(plan.price) && plan.price > 0));
});

test('resendCooldownRemaining: memakai created_at baris', () => {
  assert.equal(resendCooldownRemaining(null), 0);
  assert.equal(resendCooldownRemaining({ created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }), 0);
  const baru = resendCooldownRemaining({ created_at: new Date().toISOString() });
  assert.ok(baru > 0 && baru <= 60, `sisa cooldown ${baru} detik harus di rentang 1..60`);
});
