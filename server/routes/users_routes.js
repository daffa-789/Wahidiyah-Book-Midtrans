

import crypto from 'crypto';
import { Router } from 'express';
import { supabaseServer } from '../db.js';
import {
  generateId,
  hashPassword,
  normalizeEmail,
  requireAdmin,
  requireAuth,
  toPublicUser
} from '../auth.js';
import {
  badRequest,
  conflict,
  fail,
  internalErrorDetail,
  notFound,
  wrap
} from '../lib/http.js';
import { ENDED_SUBSCRIPTION_STATUS } from '../lib/membership.js';
import { parseBooleanFlag } from '../lib/validate.js';
import { logger } from '../logger.js';

export const usersRouter = Router();


usersRouter.put('/users/profile', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return badRequest(res, 'Nama lengkap wajib diisi.');
  }

  try {
    const updates = { name: name.trim() };

    const { data: updatedUser, error: updateError } = await supabaseServer
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('*')
      .maybeSingle();
    if (updateError) throw updateError;

    logger.data('PROFILE', 'Profil diperbarui', {
      id: req.user.id,
      name: updates.name,
    });

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: toPublicUser(updatedUser || req.authUser)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil.',
      error: internalErrorDetail(error)
    });
  }
});


usersRouter.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data } = await supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    res.json({ success: true, users: (data || []).map((u) => toPublicUser(u)) });
  } catch (error) {
    fail(res, error);
  }
});


usersRouter.put('/users/:id/role', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (id === req.user.id && role !== 'admin') {
    return badRequest(res, 'Anda tidak dapat mencabut hak akses admin akun sendiri.');
  }

  if (!['user', 'admin'].includes(role)) {
    return badRequest(res, 'Role harus user atau admin');
  }

  const { error } = await supabaseServer.from('users').update({ role }).eq('id', id);
  if (error) throw error;

  res.json({ success: true, message: `Role pengguna berhasil diubah ke ${role}` });
}));


usersRouter.put('/users/:id/pro', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;
  
  
  
  const isProBool = parseBooleanFlag(req.body.is_pro);

  const { error } = await supabaseServer.from('users').update({
    is_pro: isProBool,
    subscription_expires_at: null
  }).eq('id', id);
  if (error) throw error;

  if (!isProBool) {
    await supabaseServer
      .from('subscriptions')
      .update({ status: ENDED_SUBSCRIPTION_STATUS })
      .eq('user_id', id)
      .eq('status', 'Aktif');
  }

  res.json({
    success: true,
    message: `Status Pro pengguna berhasil ${isProBool ? 'diaktifkan' : 'dinonaktifkan'}`
  });
}));


usersRouter.post('/users', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { name, email, role, is_pro, password } = req.body;
  if (!name || !email) {
    return badRequest(res, 'Nama dan email wajib diisi');
  }

  if (password && String(password).length < 8) {
    return badRequest(res, 'Password minimal 8 karakter');
  }

  const normalizedEmail = normalizeEmail(email);
  const { data: existing } = await supabaseServer
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .limit(1);
  if (existing && existing.length > 0) {
    return conflict(res, 'Email sudah terdaftar');
  }

  const temporaryPassword = password || crypto.randomBytes(6).toString('hex');
  const id = generateId('usr');

  const { error } = await supabaseServer.from('users').insert({
    id,
    name: name.trim(),
    email: normalizedEmail,
    password: await hashPassword(temporaryPassword),
    
    
    role: role === 'admin' ? 'admin' : 'user',
    login_method: 'email',
    is_pro: parseBooleanFlag(is_pro),
  });
  if (error) throw error;

  const created = { success: true, message: 'Pengguna berhasil ditambahkan', userId: id };
  if (!password) created.temporaryPassword = temporaryPassword;
  res.status(201).json(created);
}));


usersRouter.delete('/users/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;

  
  
  if (id === req.user.id) {
    return badRequest(res, 'Anda tidak dapat menghapus akun sendiri.');
  }

  const { data, error } = await supabaseServer
    .from('users')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    return notFound(res, 'Pengguna tidak ditemukan');
  }
  if (error) throw error;
  res.json({ success: true, message: 'Pengguna berhasil dihapus' });
}));
