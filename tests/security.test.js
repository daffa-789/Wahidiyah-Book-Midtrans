import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveJwtSecret, decideTransactionVerification } from '../server/auth.js';
import { resolveSupabaseCredentials } from '../server/db.js';
import { canExposeDevOtp, isLoopbackAddress, resendCooldownRemaining } from '../server/lib/otp.js';
import { isAllowedQrUrl, isTransactionSettled, verifySignatureKey } from '../server/lib/midtrans.js';
import { findPlan, DEFAULT_PLAN_ID, SUBSCRIPTION_PLANS } from '../server/lib/constants.js';
import { AUTH_RATE_LIMITED_PATHS, CSP_DIRECTIVES, MIDTRANS_SERVER_KEY, QRIS_STATUS_RATE_LIMIT } from '../server/config.js';
import { normalizeOrigin, resolveFrontendOrigin, sanitizeForwardedProto } from '../server/lib/origin.js';
import { createOneTimeCode, redeemOneTimeCode } from '../server/lib/oneTimeCode.js';
import { matchesContentExtension, sniffDataUrlImage, sniffImageMime } from '../server/lib/sniff.js';
import { safeContentMime, sendDataUrl } from '../server/lib/http.js';

const fakeReq = ({ host = 'localhost:3000', protocol = 'http', forwardedProto } = {}) => ({
  get: (name) => (String(name).toLowerCase() === 'host' ? host : undefined),
  protocol,
  headers: forwardedProto === undefined ? {} : { 'x-forwarded-proto': forwardedProto }
});

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

test('resolveFrontendOrigin: FRONTEND_ORIGIN mengalahkan Host penyerang', () => {
  const origin = resolveFrontendOrigin(
    { FRONTEND_ORIGIN: 'https://app.wahidiyah.id' },
    fakeReq({ host: 'evil.com' }),
    ['http://localhost:3000']
  );
  assert.equal(origin, 'https://app.wahidiyah.id');
});

test('resolveFrontendOrigin: Host tak dikenal tanpa FRONTEND_ORIGIN ditolak', () => {
  assert.equal(resolveFrontendOrigin({}, fakeReq({ host: 'evil.com' }), ['http://localhost:3000']), null);
  assert.equal(resolveFrontendOrigin({ FRONTEND_ORIGIN: '' }, fakeReq({ host: 'evil.com' }), []), null);
});

test('resolveFrontendOrigin: Host yang ada di allowlist diizinkan', () => {
  assert.equal(
    resolveFrontendOrigin({}, fakeReq({ host: 'localhost:3000' }), ['http://localhost:3000']),
    'http://localhost:3000'
  );
});

test('resolveFrontendOrigin: x-forwarded-proto tidak sah diabaikan', () => {
  assert.equal(sanitizeForwardedProto('javascript'), null);
  assert.equal(sanitizeForwardedProto('https, http'), 'https');
  const origin = resolveFrontendOrigin(
    {},
    fakeReq({ host: 'localhost:3000', forwardedProto: 'javascript:alert(1)' }),
    ['http://localhost:3000']
  );
  assert.equal(origin, 'http://localhost:3000');
});

test('resolveFrontendOrigin: FRONTEND_ORIGIN cacat gagal tertutup', () => {
  assert.equal(normalizeOrigin('javascript:alert(1)'), null);
  assert.equal(
    resolveFrontendOrigin(
      { FRONTEND_ORIGIN: 'javascript:alert(1)' },
      fakeReq({ host: 'localhost:3000' }),
      ['http://localhost:3000']
    ),
    null
  );
});

test('resolveFrontendOrigin: x-forwarded-host dipakai bila proxy menulis ulang Host', () => {
  const proxied = {
    ...fakeReq({ host: 'localhost:5000' }),
    headers: { 'x-forwarded-host': 'localhost:3000', 'x-forwarded-proto': 'http' }
  };
  assert.equal(resolveFrontendOrigin({}, proxied, ['http://localhost:3000']), 'http://localhost:3000');

  const hostile = { ...proxied, headers: { 'x-forwarded-host': 'evil.com' } };
  assert.equal(resolveFrontendOrigin({}, hostile, ['http://localhost:3000']), null);
});

test('oneTimeCode: hanya bisa ditukar sekali', () => {
  const code = createOneTimeCode({ token: 'tok', user: { id: 'u1' } });
  assert.deepEqual(redeemOneTimeCode(code), { token: 'tok', user: { id: 'u1' } });
  assert.equal(redeemOneTimeCode(code), null);
});

test('oneTimeCode: kedaluwarsa tepat pada batas TTL', () => {
  const now = 1_700_000_000_000;
  const fresh = createOneTimeCode({ token: 'a' }, { ttlMs: 60_000, now });
  assert.equal(redeemOneTimeCode(fresh, { now: now + 59_999 })?.token, 'a');

  const stale = createOneTimeCode({ token: 'b' }, { ttlMs: 60_000, now });
  assert.equal(redeemOneTimeCode(stale, { now: now + 60_000 }), null);
});

test('oneTimeCode: kode acak atau kosong ditolak', () => {
  assert.equal(redeemOneTimeCode('tidak-pernah-dibuat'), null);
  assert.equal(redeemOneTimeCode(''), null);
  assert.equal(redeemOneTimeCode(null), null);
});

test('sniffImageMime: jenis gambar ditentukan dari magic byte', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
  const gif = Buffer.from('GIF89a......', 'latin1');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]);

  assert.equal(sniffImageMime(png), 'image/png');
  assert.equal(sniffImageMime(jpeg), 'image/jpeg');
  assert.equal(sniffImageMime(gif), 'image/gif');
  assert.equal(sniffImageMime(webp), 'image/webp');
  assert.equal(sniffImageMime(Buffer.from('<html>halo</html>')), null);
  assert.equal(sniffImageMime(Buffer.alloc(0)), null);
  assert.equal(sniffImageMime(null), null);
});

test('matchesContentExtension: isi berkas harus cocok dengan ekstensinya', () => {
  const pdf = Buffer.from('%PDF-1.7\nisi');
  const html = Buffer.from('<html><script>alert(1)</script></html>');
  const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('docx')]);
  const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);

  assert.equal(matchesContentExtension(pdf, '.pdf'), true);
  assert.equal(matchesContentExtension(html, '.pdf'), false);
  assert.equal(matchesContentExtension(zip, '.docx'), true);
  assert.equal(matchesContentExtension(pdf, '.docx'), false);
  assert.equal(matchesContentExtension(ole, '.doc'), true);
  assert.equal(matchesContentExtension(Buffer.from('{\\rtf1\\ansi'), '.rtf'), true);
  assert.equal(matchesContentExtension(Buffer.from('judul,isi\n1,2'), '.csv'), true);
  assert.equal(matchesContentExtension(Buffer.from([0, 1, 2, 3]), '.csv'), false);
  assert.equal(matchesContentExtension(pdf, '.exe'), false);
});

test('sniffDataUrlImage: label di dalam data URL tidak dipercaya', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const asPng = `data:image/png;base64,${png.toString('base64')}`;
  const disguised = `data:image/png;base64,${Buffer.from('<html>x</html>').toString('base64')}`;

  assert.equal(sniffDataUrlImage(asPng), 'image/png');
  assert.equal(sniffDataUrlImage(disguised), null);
  assert.equal(sniffDataUrlImage('https://contoh.id/x.png'), null);
});

test('safeContentMime: memakai ekstensi, bukan MIME tersimpan', () => {
  assert.equal(safeContentMime({ content_extension: 'pdf' }), 'application/pdf');
  assert.equal(safeContentMime({ content_extension: '.PDF' }), 'application/pdf');
  assert.equal(safeContentMime({ content_extension: 'html' }), 'application/octet-stream');
  assert.equal(safeContentMime({}), 'application/octet-stream');
});

const fakeResponse = () => {
  const headers = {};
  let body = null;
  return {
    setHeader: (key, value) => { headers[key.toLowerCase()] = value; },
    type: (value) => { headers['content-type'] = value; },
    send: (value) => { body = value; },
    headers,
    body: () => body
  };
};

test('sendDataUrl: MIME di dalam data URL tidak pernah dipercaya', () => {
  const payload = Buffer.from('<script>alert(1)</script>').toString('base64');
  const res = fakeResponse();

  assert.equal(sendDataUrl(res, `data:text/html;base64,${payload}`, { contentType: 'application/pdf' }), true);
  assert.equal(res.headers['content-type'], 'application/pdf');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.body().toString('utf8'), '<script>alert(1)</script>');
});

test('sendDataUrl: tanpa contentType jatuh ke octet-stream, bukan text/html', () => {
  const payload = Buffer.from('<html>x</html>').toString('base64');
  const res = fakeResponse();

  sendDataUrl(res, `data:text/html;base64,${payload}`);
  assert.equal(res.headers['content-type'], 'application/octet-stream');
});

test('sendDataUrl: URL non-data tidak ditangani', () => {
  assert.equal(sendDataUrl(fakeResponse(), 'https://contoh.id/x.pdf'), false);
  assert.equal(sendDataUrl(fakeResponse(), ''), false);
});

test('plafon status QRIS memberi ruang bagi polling 3 detik', () => {
  const perMenit = QRIS_STATUS_RATE_LIMIT.max / (QRIS_STATUS_RATE_LIMIT.windowMs / 60000);
  assert.ok(
    perMenit >= 20,
    `plafon ${perMenit}/menit harus di atas ritme polling 20 permintaan/menit`
  );
  assert.equal(QRIS_STATUS_RATE_LIMIT.windowMs, 5 * 60 * 1000);
});

test('callback Google ikut dibatasi limiter auth', () => {
  assert.equal(AUTH_RATE_LIMITED_PATHS.includes('/api/auth/google/callback'), true);
  assert.equal(AUTH_RATE_LIMITED_PATHS.includes('/api/auth/exchange'), true);
});

test('hash CSP cocok dengan skrip inline di index.html', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);

  assert.ok(match, 'skrip inline tidak ditemukan di index.html');
  const hash = crypto.createHash('sha256').update(match[1], 'utf8').digest('base64');
  assert.equal(
    CSP_DIRECTIVES['script-src'].includes(`'sha256-${hash}'`),
    true,
    'THEME_INIT_HASH di config.js tidak cocok dengan index.html — perbarui hash'
  );
  assert.equal(CSP_DIRECTIVES['script-src'].includes("'unsafe-inline'"), false);
  assert.equal(CSP_DIRECTIVES['object-src'][0], "'none'");
  assert.equal(CSP_DIRECTIVES['frame-ancestors'][0], "'none'");
});
