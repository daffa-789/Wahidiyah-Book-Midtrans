
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ stub: undefined, getUserFromSupabase: undefined }));

vi.mock('../server/db.js', async () => {
  const { createSupabaseStub } = await import('./helpers/supabase-stub.js');
  h.stub = createSupabaseStub();
  return { supabaseServer: h.stub.client };
});

/* Klien Supabase anon yang dibuat dinamis di loginWithGoogleSupabase. */
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: h.getUserFromSupabase } }))
}));

/* OTP dan pengiriman dimock supaya test tidak menyentuh Gmail/WhatsApp. */
vi.mock('../server/lib/otp.js', () => ({
  canExposeDevOtp: vi.fn(() => false),
  consumeOtp: vi.fn(),
  issueOtp: vi.fn(),
  resendCooldownRemaining: vi.fn()
}));

vi.mock('../server/otpStore.js', () => ({
  initOtpStore: vi.fn(),
  deleteOtpByEmailPurpose: vi.fn(),
  insertOtp: vi.fn(),
  findLatestOtp: vi.fn(),
  incrementOtpAttempts: vi.fn(),
  deleteOtpById: vi.fn()
}));

vi.mock('../server/mailer.js', () => ({
  isMailerConfigured: vi.fn(() => false),
  sendOtpEmail: vi.fn(),
  sendGoogleAccountEmail: vi.fn()
}));

import * as otp from '../server/lib/otp.js';
import * as otpStore from '../server/otpStore.js';
import * as supabaseJs from '@supabase/supabase-js';
import { hashPassword } from '../server/auth.js';
import {
  authenticateWithPassword,
  beginRegistration,
  completeRegistration,
  exchangeSessionCode,
  loginWithGoogleSupabase,
  requestPasswordReset,
  resetPassword,
  resendVerificationOtp
} from '../server/services/auth.service.js';
import { createOneTimeCode } from '../server/lib/oneTimeCode.js';

const stub = () => h.stub;

const PASSWORD = 'RahasiaKuat123';

beforeEach(() => {
  stub().reset();
  vi.clearAllMocks();
  h.getUserFromSupabase = vi.fn();
  stub().enqueue({ data: null });  // default aman untuk satu await
});


describe('auth.service: authenticateWithPassword', () => {
  it('validasi input ditolak lebih dulu (email rusak / password pendek)', async () => {
    const badEmail = await authenticateWithPassword({ email: 'bukan-email', password: PASSWORD });
    expect(badEmail).toMatchObject({ ok: false, status: 400 });
    expect(badEmail.message).toContain('email');

    const shortPassword = await authenticateWithPassword({ email: 'a@b.com', password: '123' });
    expect(shortPassword).toMatchObject({ ok: false, status: 400, message: 'Password minimal 8 karakter' });
  });

  it('email tak terdaftar → 401 dengan pesan seragam (anti-enumerasi)', async () => {
    stub().reset();
    stub().enqueue({ data: null });

    const result = await authenticateWithPassword({ email: 'hantu@contoh.com', password: PASSWORD });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toContain('Email atau password belum sesuai');
  });

  it('password salah pada akun ber-password → pesan kredensial', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'u1', email: 'a@b.com', password: '$2a$10$hashpalsu', role: 'user' } });

    const result = await authenticateWithPassword({ email: 'a@b.com', password: PASSWORD });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toContain('Email atau password belum sesuai');
  });

  it('password salah pada akun Google (tanpa password) → diarahkan ke tombol Google', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'u1', email: 'a@b.com', password: null, role: 'user' } });

    const result = await authenticateWithPassword({ email: 'a@b.com', password: PASSWORD });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('Login dengan Google');
  });

  it('kredensial benar → token sesi + user publik tanpa password', async () => {
    stub().reset();
    const hash = await hashPassword(PASSWORD);
    stub().enqueue({ data: { id: 'u1', email: 'a@b.com', password: hash, role: 'user', name: 'Budi' } });

    const result = await authenticateWithPassword({ email: 'a@b.com', password: PASSWORD });

    expect(result.ok).toBe(true);
    expect(typeof result.token).toBe('string');
    expect(result.user).toMatchObject({ id: 'u1', email: 'a@b.com', is_pro: false });
    expect(result.user.password).toBeUndefined();
  });
});


describe('auth.service: beginRegistration', () => {
  const validBody = { name: 'Budi', email: 'budi@contoh.com', phone: '081234567890', password: PASSWORD };

  it('email sudah terdaftar → 409 sebelum OTP diterbitkan', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'existing' } });

    const result = await beginRegistration({ ...validBody });

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(otp.issueOtp).not.toHaveBeenCalled();
  });

  it('nomor WhatsApp sudah dipakai akun lain → 409', async () => {
    stub().reset();
    stub().enqueue({ data: null });            // cek email: bebas
    stub().enqueue({ data: { id: 'other' } }); // cek telepon: terpakai

    const result = await beginRegistration({ ...validBody });

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(result.message).toContain('Nomor WhatsApp sudah terdaftar');
  });

  it('valid → OTP diterbitkan via email, status 202; kode demo TIDAK dibocorkan', async () => {
    stub().reset();
    stub().enqueue({ data: null });  // cek email
    stub().enqueue({ data: null });  // cek telepon
    otp.issueOtp.mockResolvedValue({ code: '123456', deliveredBy: 'demo' });

    const result = await beginRegistration({ ...validBody });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(202);
    expect(result.body.message).toContain('gagal');  // deliveredBy demo = pengiriman gagal
    expect(result.body.devOtp).toBeUndefined();      // gerbang canExposeDevOtp false
    expect(otp.issueOtp).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'register',
      payload: expect.objectContaining({ passwordHash: expect.any(String) })
    }));
  });
});


describe('auth.service: completeRegistration', () => {
  const identity = { identifier: 'budi@contoh.com', email: 'budi@contoh.com', phone: '', code: '123456' };

  it('identitas atau kode kosong → 400', async () => {
    expect((await completeRegistration({ ...identity, code: '' })).status).toBe(400);
    expect((await completeRegistration({ ...identity, identifier: '', email: '', phone: '' })).status).toBe(400);
  });

  it('payload pendaftaran tidak lengkap → OTP dihanguskan + 400', async () => {
    otp.consumeOtp.mockResolvedValue({ ok: true, row: { id: 'otp-1', payload: {} } });

    const result = await completeRegistration(identity);

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(otpStore.deleteOtpById).toHaveBeenCalledWith('otp-1');
  });

  it('balapan unik (23505) pada email → 409 dan OTP dihanguskan', async () => {
    stub().reset();
    otp.consumeOtp.mockResolvedValue({
      ok: true,
      row: { id: 'otp-1', payload: { name: 'Budi', passwordHash: 'hash', email: 'budi@contoh.com' } }
    });
    stub().enqueue({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "users_email_key"' } });

    const result = await completeRegistration(identity);

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(result.message).toContain('Email sudah terdaftar');
    expect(otpStore.deleteOtpById).toHaveBeenCalledWith('otp-1');
  });

  it('sukses → pengguna dibuat, OTP dihanguskan, token sesi diterbitkan', async () => {
    stub().reset();
    otp.consumeOtp.mockResolvedValue({
      ok: true,
      row: { id: 'otp-1', payload: { name: 'Budi', passwordHash: 'hash', email: 'budi@contoh.com', phone: null } }
    });
    stub().enqueue({ data: null });  // insert users

    const result = await completeRegistration(identity);

    expect(result.ok).toBe(true);
    expect(typeof result.token).toBe('string');
    expect(result.user).toMatchObject({ name: 'Budi', email: 'budi@contoh.com', login_method: 'email' });
    expect(otpStore.deleteOtpById).toHaveBeenCalledWith('otp-1');
  });
});


describe('auth.service: requestPasswordReset', () => {
  it('email tidak valid → 400', async () => {
    const result = await requestPasswordReset({ method: 'email', email: 'rusak', clientIp: null });
    expect(result).toMatchObject({ ok: false, status: 400, message: 'Masukkan alamat email yang valid.' });
  });

  it('email tak terdaftar → respons seragam tanpa mengirim apa pun', async () => {
    stub().reset();
    stub().enqueue({ data: null });

    const result = await requestPasswordReset({ method: 'email', email: 'hantu@contoh.com', clientIp: null });

    expect(result).toEqual({ ok: true, kind: 'uniform-email' });
    expect(otp.issueOtp).not.toHaveBeenCalled();
  });

  it('akun Google → respons seragam (anti-enumerasi), tanpa OTP reset', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'u1', login_method: 'google' } });

    const result = await requestPasswordReset({ method: 'email', email: 'g@contoh.com', clientIp: null });

    expect(result).toEqual({ ok: true, kind: 'uniform-email' });
    expect(otp.issueOtp).not.toHaveBeenCalled();
  });

  it('akun ber-password → OTP reset diterbitkan via email', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'u1', login_method: 'email' } });
    otp.issueOtp.mockResolvedValue({ code: '654321', deliveredBy: 'demo' });

    const result = await requestPasswordReset({ method: 'email', email: 'a@b.com', clientIp: null });

    expect(result).toMatchObject({ ok: true, kind: 'sent-email', identifier: 'a@b.com' });
    expect(result.devOtp).toBeUndefined();
  });

  it('nomor WhatsApp rusak → 400 dengan contoh format', async () => {
    const result = await requestPasswordReset({ method: 'whatsapp', phone: 'abc', clientIp: null });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(result.message).toContain('081234567890');
  });
});


describe('auth.service: resetPassword', () => {
  it('password baru terlalu pendek → 400', async () => {
    const result = await resetPassword({
      method: 'email', email: 'a@b.com', identifier: '', code: '123456', password: 'pendek'
    });
    expect(result).toMatchObject({ ok: false, status: 400, message: 'Password baru minimal 8 karakter.' });
  });

  it('akun Google ditolak dan OTP reset dihanguskan', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'u1', login_method: 'google' } });

    const result = await resetPassword({
      method: 'email', email: 'g@contoh.com', identifier: '', code: '123456', password: PASSWORD
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('terdaftar melalui Google');
    expect(otpStore.deleteOtpByEmailPurpose).toHaveBeenCalledWith('g@contoh.com', 'reset');
  });

  it('kode OTP salah → pesan consumeOtp diteruskan dengan statusnya', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'u1', login_method: 'email' } });
    otp.consumeOtp.mockResolvedValue({ ok: false, status: 400, message: 'Kode verifikasi salah.' });

    const result = await resetPassword({
      method: 'email', email: 'a@b.com', identifier: '', code: '000000', password: PASSWORD
    });

    expect(result).toEqual({ ok: false, status: 400, message: 'Kode verifikasi salah.' });
  });

  it('sukses → password diperbarui dan OTP dihanguskan', async () => {
    stub().reset();
    stub().enqueue({ data: { id: 'u1', login_method: 'email' } });  // cek akun
    otp.consumeOtp.mockResolvedValue({ ok: true, row: { id: 'otp-1' } });
    stub().enqueue({ data: null });  // update password

    const result = await resetPassword({
      method: 'email', email: 'a@b.com', identifier: '', code: '123456', password: PASSWORD
    });

    expect(result).toEqual({ ok: true });
    expect(otpStore.deleteOtpById).toHaveBeenCalledWith('otp-1');
    expect(stub().last('update').patch.password).toEqual(expect.any(String));
  });
});


describe('auth.service: resendVerificationOtp', () => {
  it('masa tunggu berjalan → 429 dengan retryAfterSeconds', async () => {
    otpStore.findLatestOtp.mockResolvedValue({ id: 'o1', payload: { name: 'Budi' }, created_at: new Date().toISOString() });
    otp.resendCooldownRemaining.mockReturnValue(30);

    const result = await resendVerificationOtp({
      method: 'email', identifier: 'a@b.com', purpose: 'register', clientIp: null
    });

    expect(result).toMatchObject({ ok: false, status: 429, retryAfterSeconds: 30 });
  });

  it('tidak ada permintaan aktif → 400', async () => {
    otpStore.findLatestOtp.mockResolvedValue(null);

    const result = await resendVerificationOtp({
      method: 'email', identifier: 'a@b.com', purpose: 'register', clientIp: null
    });

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('reset untuk akun tak dikenal → sukses senyap (anti-enumerasi), tanpa OTP nyata', async () => {
    otpStore.findLatestOtp.mockResolvedValue({ id: 'o1', payload: null, created_at: new Date(Date.now() - 120_000).toISOString() });
    otp.resendCooldownRemaining.mockReturnValue(0);
    stub().reset();
    stub().enqueue({ data: null });  // akun tidak ditemukan

    const result = await resendVerificationOtp({
      method: 'email', identifier: 'hantu@contoh.com', purpose: 'reset', clientIp: null
    });

    expect(result).toEqual({ ok: true, kind: 'silent-success' });
    expect(otp.issueOtp).not.toHaveBeenCalled();
  });

  it('kirim ulang register → OTP diterbitkan dengan payload asli', async () => {
    otpStore.findLatestOtp.mockResolvedValue({
      id: 'o1', created_at: new Date(Date.now() - 120_000).toISOString(), payload: { name: 'Budi' }
    });
    otp.resendCooldownRemaining.mockReturnValue(0);
    otp.issueOtp.mockResolvedValue({ code: '111222', deliveredBy: 'email' });

    const result = await resendVerificationOtp({
      method: 'email', identifier: 'a@b.com', purpose: 'register', clientIp: null
    });

    expect(result.ok).toBe(true);
    expect(result.kind).toBe('sent');
    expect(result.body.deliveredBy).toBe('email');
    expect(otp.issueOtp).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'register',
      payload: { name: 'Budi' }
    }));
  });
});


describe('auth.service: loginWithGoogleSupabase', () => {
  it('token atau email kosong → 400', async () => {
    const result = await loginWithGoogleSupabase({ accessToken: '', googleName: '', googleEmail: '' });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('token Supabase tidak valid → 401', async () => {
    h.getUserFromSupabase.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } });

    const result = await loginWithGoogleSupabase({
      accessToken: 'token-rusak', googleName: 'Budi', googleEmail: 'budi@contoh.com'
    });

    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it('pengguna sudah ada → sesi diterbitkan tanpa INSERT', async () => {
    stub().reset();
    h.getUserFromSupabase.mockResolvedValue({ data: { user: { email: 'Budi@Contoh.com' } }, error: null });
    stub().enqueue({ data: { id: 'u1', email: 'budi@contoh.com', login_method: 'google' } });

    const result = await loginWithGoogleSupabase({
      accessToken: 'token-ok', googleName: 'Budi', googleEmail: 'budi@contoh.com'
    });

    expect(result.ok).toBe(true);
    expect(typeof result.token).toBe('string');
    expect(result.user.id).toBe('u1');
    expect(stub().ops('insert')).toHaveLength(0);
  });

  it('pengguna baru → INSERT akun Google', async () => {
    stub().reset();
    h.getUserFromSupabase.mockResolvedValue({ data: { user: { email: 'baru@contoh.com' } }, error: null });
    stub().enqueue({ data: null });  // select: belum ada
    stub().enqueue({ data: null });  // insert baru

    const result = await loginWithGoogleSupabase({
      accessToken: 'token-ok', googleName: 'Baru', googleEmail: 'baru@contoh.com'
    });

    expect(result.ok).toBe(true);
    const insert = stub().last('insert');
    expect(insert.rows[0]).toMatchObject({ email: 'baru@contoh.com', login_method: 'google' });
  });
});


describe('auth.service: exchangeSessionCode (kode sekali-pakai, VULN-03)', () => {
  it('kode valid ditukar sekali, pemakaian kedua hangus', () => {
    const code = createOneTimeCode({ token: 'jwt-token', user: { id: 'u1' } });

    const first = exchangeSessionCode(code);
    expect(first.token).toBe('jwt-token');
    expect(first.user.id).toBe('u1');

    expect(exchangeSessionCode(code)).toBeNull();
  });

  it('kode asing → null', () => {
    expect(exchangeSessionCode('kode-tidak-pernah-ada')).toBeNull();
    expect(exchangeSessionCode('')).toBeNull();
  });
});
