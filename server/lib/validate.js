

import { z } from 'zod';

export const booleanFlagSchema = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
  }
  return false;
}, z.boolean());

export const loginSchema = z.object({
  email: z.string({ required_error: 'Alamat email wajib diisi' })
    .trim()
    .email('Format email tidak valid'),
  password: z.string({ required_error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  dob: z.string().optional().nullable()
});

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, 'Judul buku wajib diisi'),
  subtitle: z.string().optional().default(''),
  author: z.string().trim().min(1, 'Penulis wajib diisi'),
  category: z.string().trim().min(1, 'Kategori wajib diisi'),
  pages: z.coerce.number().int().positive().default(100),
  is_locked: booleanFlagSchema.default(false),
  cover_url: z.string().optional().default(''),
  description: z.string().optional().default('')
});

export function parseBooleanFlag(value) {
  const result = booleanFlagSchema.safeParse(value);
  return result.success ? result.data : false;
}

export function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function toBoundedInt(value, { min = 1, max = 100, fallback = 20 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function isOneOf(value, allowed) {
  return typeof value === 'string' && allowed.includes(value);
}

export function toDateYmd(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== trimmed) return null;
  return trimmed;
}

export function toPastDateYmd(value) {
  const valid = toDateYmd(value);
  if (!valid) return null;
  if (new Date(`${valid}T00:00:00Z`).getTime() > Date.now()) return null;
  return valid;
}

export function clippedText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

export function toRangedInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

