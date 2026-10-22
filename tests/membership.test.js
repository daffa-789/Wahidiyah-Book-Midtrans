import test from 'node:test';
import assert from 'node:assert/strict';

import { hasActivePro, toPublicUser, effectiveIsPro } from '../server/auth.js';

const NOW = new Date('2026-10-22T12:00:00.000Z');
const row = (overrides) => ({
  id: 'usr-1',
  name: 'Yatim',
  email: 'yatim@contoh.id',
  role: 'user',
  is_pro: true,
  subscription_expires_at: '2026-11-01T00:00:00.000Z',
  ...overrides
});

test('hasActivePro: matriks masa berlaku (VULN-12)', () => {
  assert.equal(hasActivePro(row({}, NOW), NOW), true, 'kedaluwarsa di masa depan = aktif');
  assert.equal(hasActivePro(row({ subscription_expires_at: '2026-10-01T00:00:00.000Z' }), NOW), false, 'lewat = tidak aktif');
  assert.equal(hasActivePro(row({ subscription_expires_at: NOW.toISOString() }), NOW), false, 'tepat batas = tidak aktif');
  assert.equal(hasActivePro(row({ subscription_expires_at: null }), NOW), true, 'pemberian admin tanpa tanggal tetap aktif');
  assert.equal(hasActivePro(row({ is_pro: false }), NOW), false, 'flag mati selalu mati');
});

test('hasActivePro: bentuk flag yang sama dengan effectiveIsPro', () => {
  for (const truthy of [true, 1, '1', 'true']) {
    assert.equal(hasActivePro(row({ is_pro: truthy }), NOW), true, `is_pro=${truthy}`);
  }
  assert.equal(hasActivePro(row({ is_pro: true, subscription_expires_at: undefined }), NOW), true);
  assert.equal(hasActivePro({ isPro: true, subscriptionExpiresAt: '2026-12-31T00:00:00.000Z' }, NOW), true);
  for (const falsy of [false, 0, '0', 'false', null, undefined]) {
    assert.equal(hasActivePro(row({ is_pro: falsy }), NOW), false, `is_pro=${String(falsy)}`);
  }
});

test('hasActivePro: tanggal cacat dianggap berakhir, bukan gagal-terbuka', () => {
  assert.equal(hasActivePro(row({ subscription_expires_at: 'bukan-tanggal' }), NOW), false);
  assert.equal(hasActivePro(row({ subscription_expires_at: '' }), NOW), true, 'string kosong = pemberian admin');
  assert.equal(hasActivePro(null, NOW), false);
  assert.equal(hasActivePro({}, NOW), false);
});

test('effectiveIsPro tetap hanya membaca flag (bukan penegakan)', () => {
  assert.equal(effectiveIsPro(row({ subscription_expires_at: '2020-01-01T00:00:00.000Z' })), true);
});

test('toPublicUser: tidak lagi melaporkan Pro aktif yang sudah kedaluwarsa', () => {
  const expired = toPublicUser(row({ subscription_expires_at: '2026-10-01T00:00:00.000Z' }), NOW);
  assert.equal(expired.is_pro, false, 'klien tidak boleh melihat lencana Pro palsu');
  assert.equal(expired.subscription_expires_at, '2026-10-01T00:00:00.000Z', 'tanggal tetap dilaporkan untuk ajakan perpanjangan');

  const active = toPublicUser(row({}, NOW), NOW);
  assert.equal(active.is_pro, true);
  assert.equal(active.subscription_expires_at, '2026-11-01T00:00:00.000Z');

  const granted = toPublicUser(row({ subscription_expires_at: null }), NOW);
  assert.equal(granted.is_pro, true);
  assert.equal(granted.subscription_expires_at, null);
});
