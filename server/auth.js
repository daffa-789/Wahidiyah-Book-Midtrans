import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseServer } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_FALLBACK_SECRET = 'wahidiyah-local-development-secret-change-me';
const activeJwtSecret = JWT_SECRET || JWT_FALLBACK_SECRET;
if (!JWT_SECRET) {
  console.warn('\x1b[33m[AUTH] ⚠️  JWT_SECRET belum diset di server/.env — memakai secret fallback development. Set JWT_SECRET agar token tidak dapat dipalsukan bila source terbaca orang lain.\x1b[0m');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const BCRYPT_ROUNDS = 12;

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const MAX_ID_LENGTH = 50;

export const generateId = (prefix) => {
  const id = `${prefix}-${crypto.randomUUID().replace(/-/g, '')}`;
  if (id.length > MAX_ID_LENGTH) {
    throw new RangeError(`ID "${id}" melebihi batas VARCHAR(${MAX_ID_LENGTH})`);
  }
  return id;
};

const toIsoOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const hashPassword = (password) => bcrypt.hash(String(password), BCRYPT_ROUNDS);

export const verifyPassword = async (plainPassword, storedHash) => {
  const plain = String(plainPassword ?? '');
  const stored = String(storedHash ?? '');

  if (!stored || !plain) return false;

  if (!/^\$2[aby]\$/.test(stored)) return false;
  try {
    return await bcrypt.compare(plain, stored);
  } catch {

    return false;
  }
};

export const toPublicUser = (user) => {
  const isPro = Boolean(user?.is_pro === true || user?.is_pro === 1 || user?.is_pro === '1' || user?.is_pro === 'true' || user?.isPro === true);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role || 'user',
    login_method: user.login_method || 'email',
    is_pro: isPro,

    subscription_expires_at: isPro ? toIsoOrNull(user.subscription_expires_at) : null,
    dob: user.dob || null,
    avatar: user.avatar || null,
    created_at: toIsoOrNull(user.created_at)
  };
};

export const effectiveIsPro = (user) => {
  return Boolean(user?.is_pro === true || user?.is_pro === 1 || user?.is_pro === '1' || user?.is_pro === 'true' || user?.isPro === true);
};

export const loadMembershipUser = async (userId) => {
  try {
    const { data: supaUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return supaUser || null;
  } catch (error) {
    return null;
  }
};

export const settleExpiredMembership = async (userId = null) => {
  const nowIso = new Date().toISOString();
  try {

    let subQuery = supabaseServer
      .from('subscriptions')
      .update({ status: 'Berakhir' })
      .eq('status', 'Aktif')
      .not('expires_at', 'is', null)
      .lt('expires_at', nowIso);
    if (userId) subQuery = subQuery.eq('user_id', userId);
    await subQuery;

    let userQuery = supabaseServer
      .from('users')
      .update({ is_pro: false, subscription_expires_at: null })
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', nowIso);
    if (userId) userQuery = userQuery.eq('id', userId);
    await userQuery;
  } catch (error) {
    console.warn('[DB] Penegakan kedaluwarsa langganan dilewati:', error.message);
  }
};

export const TRANSACTION_PENDING_STATUS = 'pending';
const TRANSACTION_SUCCESS_STATUS = 'success';

const verificationTargetStatus = (action) => (
  action === 'approve' ? TRANSACTION_SUCCESS_STATUS : 'rejected'
);

export const decideTransactionVerification = (currentStatus, action) => {
  const targetStatus = verificationTargetStatus(action);
  if (currentStatus === TRANSACTION_PENDING_STATUS) {
    return { kind: 'apply', targetStatus };
  }
  if (currentStatus === targetStatus) {
    return { kind: 'idempotent', status: currentStatus };
  }
  return { kind: 'conflict', status: currentStatus, targetStatus };
};

export const createSessionToken = (user) => jwt.sign(
  { sub: user.id },
  activeJwtSecret,
  { expiresIn: JWT_EXPIRES_IN }
);

const getBearerToken = (authorization = '') => {
  const [scheme, token] = String(authorization).split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : null;
};

export const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req.get('authorization'));
  if (!token) {
    return res.status(401).json({ success: false, message: 'Sesi masuk tidak ditemukan. Silakan masuk kembali.' });
  }

  try {
    const payload = jwt.verify(token, activeJwtSecret);
    const row = await loadMembershipUser(payload.sub);

    if (!row) {
      return res.status(401).json({ success: false, message: 'Akun tidak lagi tersedia. Silakan masuk kembali.' });
    }

    req.authUser = row;
    req.user = toPublicUser(row);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesi masuk telah berakhir. Silakan masuk kembali.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses ini hanya tersedia untuk administrator.' });
  }
  return next();
};
