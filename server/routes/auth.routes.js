

import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { supabaseServer } from '../db.js';
import {
  createSessionToken,
  generateId,
  hashPassword,
  normalizeEmail,
  requireAuth,
  toPublicUser,
  verifyPassword
} from '../auth.js';
import {
  DB_DOWN_MESSAGE,
  authFailureMessage,
  badRequest,
  conflict,
  internalErrorDetail,
  isDbDown,
  unauthorized,
  wrap
} from '../lib/http.js';
import { canExposeDevOtp, consumeOtp, issueOtp, resendCooldownRemaining } from '../lib/otp.js';
import { findLatestOtp, deleteOtpByEmailPurpose, deleteOtpById } from '../otpStore.js';
import { sendGoogleAccountEmail, isMailerConfigured } from '../mailer.js';
import { logger } from '../logger.js';
import { loginSchema, registerSchema } from '../lib/validate.js';
import { normalizePhone, isValidPhone } from '../whatsapp.js';

export const authRouter = Router();

const replyAuthFailure = (res, error, { dbMessage = DB_DOWN_MESSAGE } = {}) => {
  const isDbError = isDbDown(error);
  return res.status(isDbError ? 503 : 500).json({
    success: false,
    message: isDbError ? dbMessage : authFailureMessage(error),
    error: internalErrorDetail(error),
    isDatabaseError: isDbError
  });
};

const INVALID_CREDENTIALS_MESSAGE =
  'Email atau password belum sesuai. Jika Anda menggunakan akun Google, silakan klik tombol "Login dengan Google" di bawah.';

const GOOGLE_ACCOUNT_MESSAGE =
  'Akun ini terdaftar lewat Google. Silakan klik tombol "Login dengan Google" di bawah.';

authRouter.post('/login', async (req, res) => {
  const { identifier, email, password } = req.body;
  const userEmail = normalizeEmail(email || identifier);

  const parsed = loginSchema.safeParse({ email: userEmail, password });
  if (!parsed.success) {
    return badRequest(res, parsed.error.issues[0]?.message || 'Input tidak valid');
  }

  try {
    const { data: user, error: lookupError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!user) return unauthorized(res, INVALID_CREDENTIALS_MESSAGE);

    const passwordOk = await verifyPassword(password, user.password);
    if (!passwordOk) {
      return unauthorized(res, user.password ? INVALID_CREDENTIALS_MESSAGE : GOOGLE_ACCOUNT_MESSAGE);
    }

    logger.ok('AUTH', 'Login berhasil', { email: userEmail, role: user.role || 'user' });

    res.json({
      success: true,
      message: 'Login berhasil',
      token: createSessionToken(user),
      user: toPublicUser(user)
    });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, deliveryMethod } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const chosenMethod = deliveryMethod === 'whatsapp' ? 'whatsapp' : 'email';

    const parsed = registerSchema.safeParse({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      deliveryMethod: chosenMethod
    });
    if (!parsed.success) {
      return badRequest(res, parsed.error.issues[0]?.message || 'Input tidak valid');
    }

    const { data: existingEmail } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (existingEmail) {
      return conflict(res, 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.');
    }

    if (normalizedPhone) {
      const { data: existingPhone } = await supabaseServer
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();
      if (existingPhone) {
        return conflict(res, 'Nomor WhatsApp sudah terdaftar pada akun lain. Silakan masuk atau gunakan nomor lain.');
      }
    }

    const targetIdentifier = chosenMethod === 'whatsapp' ? normalizedPhone : normalizedEmail;

    const { code, deliveredBy } = await issueOtp({
      email: normalizedEmail,
      phone: normalizedPhone,
      identifier: targetIdentifier,
      deliveryMethod: chosenMethod,
      purpose: 'register',
      payload: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        deliveryMethod: chosenMethod,
        passwordHash: await hashPassword(password)
      }
    });

    logger.info('OTP', 'Kode pendaftaran dikirim', {
      identifier: targetIdentifier,
      method: chosenMethod,
      deliveredBy
    });

    const targetLabel = chosenMethod === 'whatsapp' ? `nomor WhatsApp ${normalizedPhone}` : `email ${normalizedEmail}`;

    return res.status(202).json({
      success: true,
      message: `Kode verifikasi telah dikirim ke ${targetLabel} dan berlaku 10 menit.`,
      email: normalizedEmail,
      phone: normalizedPhone,
      identifier: targetIdentifier,
      deliveryMethod: chosenMethod,
      devOtp: deliveredBy === 'demo' && canExposeDevOtp(process.env, req.ip) ? code : undefined
    });
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
});

authRouter.post('/verify-registration', async (req, res) => {
  try {
    const rawEmail = req.body?.email ? normalizeEmail(req.body.email) : '';
    const rawPhone = req.body?.phone ? normalizePhone(req.body.phone) : '';
    const rawIdentifier = req.body?.identifier ? String(req.body.identifier).trim() : '';
    const identifier = rawIdentifier || rawPhone || rawEmail;
    const code = String(req.body?.code || '').trim();

    if (!identifier || !code) {
      return badRequest(res, 'Identitas akun dan kode verifikasi wajib diisi.');
    }

    const result = await consumeOtp({ identifier, purpose: 'register', code });
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    const payload = result.row.payload || {};
    if (!payload.name || !payload.passwordHash) {
      await deleteOtpById(result.row.id);
      return badRequest(res, 'Data pendaftaran tidak lengkap. Silakan daftar ulang.');
    }

    const newId = generateId('usr');
    const newUser = {
      id: newId,
      name: payload.name,
      email: payload.email || rawEmail,
      phone: payload.phone || rawPhone || null,
      password: payload.passwordHash,
      role: 'user',
      login_method: 'email',
      is_pro: false
    };

    const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
    if (insertError) {
      if (insertError.code === '23505') {
        await deleteOtpById(result.row.id);
        const detail = insertError.message?.toLowerCase().includes('phone')
          ? 'Nomor WhatsApp sudah terdaftar.'
          : 'Email sudah terdaftar.';
        return conflict(res, `${detail} Silakan masuk.`);
      }
      throw insertError;
    }

    await deleteOtpById(result.row.id);

    logger.ok('AUTH', 'Registrasi akun baru berhasil', { email: newUser.email, phone: newUser.phone, id: newId });

    return res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat.',
      token: createSessionToken(newUser),
      user: toPublicUser(newUser)
    });
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
});

const RESET_UNIFORM_RESPONSE = {
  success: true,
  message: 'Jika akun tersebut terdaftar, kode pemulihan telah dikirim dan berlaku 10 menit.'
};

authRouter.post('/request-password-reset', wrap(async (req, res) => {
  const method = req.body?.method === 'whatsapp' || req.body?.phone ? 'whatsapp' : 'email';
  const rawEmail = req.body?.email;
  const rawPhone = req.body?.phone || req.body?.identifier;

  if (method === 'whatsapp') {
    const normalizedPhone = normalizePhone(rawPhone);
    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      return badRequest(res, 'Masukkan nomor WhatsApp yang valid (contoh: 081234567890).');
    }

    const { data: account } = await supabaseServer
      .from('users')
      .select('id, email, phone, login_method')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    const uniformWaResponse = {
      success: true,
      method: 'whatsapp',
      message: 'Jika nomor tersebut terdaftar, kode pemulihan telah dikirim ke WhatsApp dan berlaku 10 menit.'
    };

    if (!account) {
      logger.info('OTP', 'Permintaan reset untuk nomor WA tak terdaftar', { phone: normalizedPhone });
      return res.json(uniformWaResponse);
    }

    if (account.login_method === 'google') {
      logger.info('OTP', 'Reset password ditolak: akun terdaftar lewat Google', { phone: normalizedPhone });
      return res.json(uniformWaResponse);
    }

    const { code, deliveredBy } = await issueOtp({
      phone: normalizedPhone,
      identifier: normalizedPhone,
      purpose: 'reset',
      deliveryMethod: 'whatsapp'
    });
    const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp(process.env, req.ip);

    logger.info('OTP', 'Permintaan reset password via WhatsApp', {
      phone: normalizedPhone,
      deliveredBy,
      devOtpExposed: exposeDevOtp
    });

    return res.json({
      ...uniformWaResponse,
      phone: normalizedPhone,
      identifier: normalizedPhone,
      devOtp: exposeDevOtp ? code : undefined
    });
  }

  // Metode Email
  const email = normalizeEmail(rawEmail || req.body?.identifier);
  if (!email || !email.includes('@')) {
    return badRequest(res, 'Masukkan alamat email yang valid.');
  }

  const { data: account } = await supabaseServer
    .from('users')
    .select('id, login_method')
    .eq('email', email)
    .maybeSingle();

  if (!account) {
    logger.info('OTP', 'Permintaan reset untuk email tak terdaftar (respons disamakan)', { email });
    return res.json(RESET_UNIFORM_RESPONSE);
  }

  if (account.login_method === 'google') {
    let deliveredBy = 'demo';
    if (isMailerConfigured()) {
      try {
        await sendGoogleAccountEmail(email);
        deliveredBy = 'email';
      } catch (mailError) {
        logger.error('MAIL', 'Gagal mengirim pemberitahuan akun Google', { pesan: mailError.message });
      }
    }
    logger.info('OTP', 'Reset password ditolak: akun terdaftar lewat Google', { email, deliveredBy });
    return res.json(RESET_UNIFORM_RESPONSE);
  }

  const { code, deliveredBy } = await issueOtp({
    email,
    identifier: email,
    purpose: 'reset',
    deliveryMethod: 'email'
  });
  const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp(process.env, req.ip);

  logger.info('OTP', 'Permintaan reset password', { email, deliveredBy, devOtpExposed: exposeDevOtp });

  return res.json({
    ...RESET_UNIFORM_RESPONSE,
    method: 'email',
    identifier: email,
    devOtp: exposeDevOtp ? code : undefined
  });
}));

authRouter.post('/reset-password', wrap(async (req, res) => {
  const method = req.body?.method === 'whatsapp' || req.body?.phone ? 'whatsapp' : 'email';
  const target = method === 'whatsapp'
    ? normalizePhone(req.body?.phone || req.body?.identifier)
    : normalizeEmail(req.body?.email || req.body?.identifier);
  const code = String(req.body?.code || '').trim();
  const password = String(req.body?.password || '');

  if (!target || !code) {
    return badRequest(res, 'Identitas akun dan kode verifikasi wajib diisi.');
  }
  if (password.length < 8) {
    return badRequest(res, 'Password baru minimal 8 karakter.');
  }

  let userLookup = supabaseServer.from('users').select('id, login_method');
  userLookup = method === 'whatsapp' ? userLookup.eq('phone', target) : userLookup.eq('email', target);
  const { data: targetAccount } = await userLookup.maybeSingle();

  if (targetAccount?.login_method === 'google') {
    await deleteOtpByEmailPurpose(target, 'reset');
    logger.warn('OTP', 'Reset password ditolak: akun terdaftar lewat Google', { target });
    return badRequest(res, 'Akun ini terdaftar melalui Google sehingga tidak memiliki password. Silakan masuk dengan tombol "Login dengan Google".');
  }

  const result = await consumeOtp({ identifier: target, purpose: 'reset', code });
  if (!result.ok) {
    return res.status(result.status).json({ success: false, message: result.message });
  }

  await deleteOtpById(result.row.id);

  let userUpdate = supabaseServer.from('users').update({ password: await hashPassword(password) });
  userUpdate = method === 'whatsapp' ? userUpdate.eq('phone', target) : userUpdate.eq('email', target);
  await userUpdate;

  logger.ok('OTP', 'Password berhasil direset', { target, method });
  return res.json({ success: true, message: 'Password berhasil diperbarui.' });
}));

authRouter.post('/resend-verification', wrap(async (req, res) => {
  const method = req.body?.method === 'whatsapp' || req.body?.phone ? 'whatsapp' : 'email';
  const rawTarget = req.body?.identifier || req.body?.phone || req.body?.email;
  const target = method === 'whatsapp' ? normalizePhone(rawTarget) : normalizeEmail(rawTarget);
  const purpose = req.body?.purpose === 'reset' ? 'reset' : 'register';

  if (!target) {
    return badRequest(res, 'Identitas tujuan verifikasi tidak valid.');
  }

  const existing = await findLatestOtp(target, purpose);
  if (!existing) {
    return badRequest(res, 'Tidak ada permintaan verifikasi yang aktif. Silakan ulangi dari awal.');
  }
  if (purpose === 'register' && !existing.payload) {
    return badRequest(res, 'Data pendaftaran tidak ditemukan. Silakan daftar ulang dari awal.');
  }

  const cooldown = resendCooldownRemaining(existing);
  if (cooldown > 0) {
    return res.status(429).json({
      success: false,
      retryAfterSeconds: cooldown,
      message: `Mohon tunggu ${cooldown} detik sebelum meminta kode baru.`
    });
  }

  if (purpose === 'reset') {
    let checkLookup = supabaseServer.from('users').select('login_method');
    checkLookup = method === 'whatsapp' ? checkLookup.eq('phone', target) : checkLookup.eq('email', target);
    const { data: account } = await checkLookup.maybeSingle();
    if (!account || account.login_method === 'google') {
      return res.json({ success: true, message: 'Kode baru telah dikirim dan berlaku 10 menit.' });
    }
  }

  const { code, deliveredBy } = await issueOtp({
    identifier: target,
    phone: method === 'whatsapp' ? target : null,
    email: method === 'email' ? target : null,
    deliveryMethod: method,
    purpose,
    payload: existing.payload ?? null
  });
  const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp(process.env, req.ip);

  logger.info('OTP', 'Kode dikirim ulang', { identifier: target, method, purpose, deliveredBy });

  const destinationLabel = method === 'whatsapp' ? 'WhatsApp' : 'email';
  return res.json({
    success: true,
    message: `Kode baru telah dikirim ke ${destinationLabel} dan berlaku 10 menit.`,
    identifier: target,
    method,
    devOtp: exposeDevOtp ? code : undefined
  });
}));

authRouter.post('/google-supabase', async (req, res) => {
  const { access_token, user: googleUser } = req.body;
  if (!access_token || !googleUser?.email) {
    return badRequest(res, 'Token dan informasi akun Google wajib diisi.');
  }

  try {

    const { createClient } = await import('@supabase/supabase-js');
    const supaUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supaAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supaAuth = createClient(supaUrl, supaAnonKey);
    const { data: { user: supaUser }, error: authError } = await supaAuth.auth.getUser(access_token);
    if (authError || !supaUser) {
      return unauthorized(res, 'Token Google tidak valid atau sudah kedaluwarsa.');
    }

    const email = normalizeEmail(supaUser.email);

    let { data: existingUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!existingUser) {
      const newId = generateId('usr');
      const newUser = {
        id: newId,
        name: googleUser.name || email.split('@')[0],
        email,
        password: null,
        role: 'user',
        login_method: 'google',
        is_pro: false,
        avatar: googleUser.avatar || null,
      };
      const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
      if (insertError) {

        if (insertError.code === '23505') {
          const { data: raceUser } = await supabaseServer
            .from('users').select('*').eq('email', email).maybeSingle();
          existingUser = raceUser;
        } else {
          throw insertError;
        }
      } else {
        existingUser = newUser;
      }
      logger.ok('AUTH', 'Registrasi akun baru via Google (Supabase Auth)', { email, id: existingUser.id });
    } else {
      logger.ok('AUTH', 'Login via Google (Supabase Auth)', { email, role: existingUser.role || 'user' });
    }

    res.json({
      success: true,
      message: 'Login Google berhasil.',
      token: createSessionToken(existingUser),
      user: toPublicUser(existingUser),
    });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
});

const parseCookies = (header) => {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
};

authRouter.get('/google/callback', async (req, res) => {
  const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const currentOrigin = `${protocol}://${host}`;
  const frontendOrigin = process.env.FRONTEND_ORIGIN || currentOrigin;

  const failRedirect = (message, code = 'google_oauth') => {
    try {
      const url = new URL('/login', frontendOrigin);
      url.searchParams.set('error', code);
      url.searchParams.set('message', message);
      logger.warn('GOOGLE_OAUTH', message);
      return res.redirect(url.toString());
    } catch (redirectError) {
      logger.error('GOOGLE_OAUTH', 'Gagal menyusun URL redirect', { pesan: redirectError.message });
      return res.status(302).send(`<script>window.location.href='${frontendOrigin}/login';</script>`);
    }
  };

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) return failRedirect(`Google mengembalikan kesalahan: ${oauthError}.`);
    if (!code) return failRedirect('Kode otorisasi tidak ditemukan.');
    if (!state) return failRedirect('State OAuth tidak ditemukan.');

    const cookies = parseCookies(req.headers.cookie || '');
    const expectedState = cookies.google_oauth_state;

    res.setHeader('Set-Cookie', 'google_oauth_state=; Path=/; Max-Age=0; SameSite=Lax');
    if (!expectedState || expectedState !== state) {
      return failRedirect('State OAuth tidak cocok (kemungkinan CSRF). Coba lagi dari halaman masuk.');
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return failRedirect('Konfigurasi Google OAuth di server belum lengkap.');
    }
    const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI
      || `${currentOrigin}/api/auth/google/callback`;

    const oauthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    let tokens;
    try {
      const response = await oauthClient.getToken(code);
      tokens = response.tokens;
    } catch (exchangeError) {
      logger.error('GOOGLE_OAUTH', 'Penukaran code dengan token gagal', { pesan: exchangeError.message });
      return failRedirect('Penukaran kode OAuth dengan Google gagal.');
    }
    if (!tokens?.id_token) {
      return failRedirect('Google tidak mengembalikan id_token.');
    }

    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      logger.error('GOOGLE_OAUTH', 'Verifikasi id_token gagal', { pesan: verifyError.message });
      return failRedirect('id_token tidak valid atau tidak cocok dengan client ID kita.');
    }
    if (!payload?.email_verified) {
      return failRedirect('Email Google belum diverifikasi oleh Google.');
    }

    const email = normalizeEmail(payload.email);
    if (!email) return failRedirect('Email Google kosong.');

    let { data: existingUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!existingUser) {
      const newId = generateId('usr');
      const newUser = {
        id: newId,
        name: payload.name || email.split('@')[0],
        email,
        password: null,
        role: 'user',
        login_method: 'google',
        is_pro: false,
        avatar: payload.picture || null
      };
      const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
      if (insertError) {

        if (insertError.code === '23505') {
          const { data: raceUser } = await supabaseServer
            .from('users').select('*').eq('email', email).maybeSingle();
          existingUser = raceUser;
        } else {
          throw insertError;
        }
      } else {
        existingUser = newUser;
      }
      logger.ok('AUTH', 'Registrasi akun baru via Google (direct OAuth)', { email, id: existingUser.id });
    } else {
      logger.ok('AUTH', 'Login via Google (direct OAuth)', { email, role: existingUser.role || 'user' });
    }

    if (!existingUser) {
      return failRedirect('Gagal membuat atau mengambil akun Google.');
    }

    const token = createSessionToken(existingUser);
    const user = toPublicUser(existingUser);
    const userJson = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');

    const successUrl = new URL('/auth/success', frontendOrigin);
    successUrl.searchParams.set('token', token);
    successUrl.searchParams.set('user', userJson);

    return res.redirect(successUrl.toString());
  } catch (error) {
    return replyAuthFailure(res, error);
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();
    res.json({ success: true, user: toPublicUser(user || req.authUser) });
  } catch (error) {
    res.json({ success: true, user: toPublicUser(req.authUser) });
  }
});
