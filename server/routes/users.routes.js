

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
import { fail, internalErrorDetail, wrap } from '../lib/http.js';
import { compressAvatarDataUrl } from '../lib/images.js';
import { ENDED_SUBSCRIPTION_STATUS } from '../lib/membership.js';
import { parseBooleanFlag, toPastDateYmd } from '../lib/validate.js';
import { logger } from '../logger.js';

export const usersRouter = Router();


usersRouter.put('/users/profile', requireAuth, async (req, res) => {
  const { name, dob, avatar } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
  }

  try {
    const updates = { name: name.trim() };

    
    
    if (dob !== undefined) {
      const validDob = toPastDateYmd(dob);
      if (dob && !validDob) {
        return res.status(400).json({ success: false, message: 'Format tanggal lahir tidak valid (YYYY-MM-DD).' });
      }
      updates.dob = validDob;
    }

    
    if (avatar !== undefined) {
      if (!avatar) {
        updates.avatar = null;
      } else {
        const compressed = await compressAvatarDataUrl(avatar);
        if (compressed && 'rejected' in compressed) {
          return res.status(415).json({
            success: false,
            message: 'Avatar tidak dapat diproses. Gunakan PNG, JPG, atau WebP.'
          });
        }
        updates.avatar = compressed?.dataUrl ?? avatar;
      }
    }

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
      dob: updates.dob || null
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
    res.json({ success: true, users: (data || []).map(toPublicUser) });
  } catch (error) {
    fail(res, error);
  }
});


usersRouter.put('/users/:id/role', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role harus user atau admin' });
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
  const { name, email, role, is_pro, password, dob } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi' });
  }

  const normalizedEmail = normalizeEmail(email);
  const { data: existing } = await supabaseServer
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .limit(1);
  if (existing && existing.length > 0) {
    return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
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
    dob: dob || null
  });
  if (error) throw error;

  const created = { success: true, message: 'Pengguna berhasil ditambahkan', userId: id };
  if (!password) created.temporaryPassword = temporaryPassword;
  res.status(201).json(created);
}));


usersRouter.delete('/users/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;

  
  
  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun sendiri.' });
  }

  const { data: existing } = await supabaseServer
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
  }

  const { error } = await supabaseServer.from('users').delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true, message: 'Pengguna berhasil dihapus' });
}));
