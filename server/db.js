import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();



const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pdimjmbjutlzjdfjaqgt.supabase.co';
const supaKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-6KjklXt9Oti0_ikobXiVw_aWdjxQ0Q';

export const supabaseServer = (supaUrl && supaKey) ? createClient(supaUrl, supaKey) : null;


export async function testConnection() {
  if (!supabaseServer) {
    logger.error('DB', 'Supabase belum terkonfigurasi — set SUPABASE_URL & SUPABASE_SECRET_KEY di .env');
    return false;
  }
  try {
    const { error } = await supabaseServer.from('users').select('id').limit(1);
    if (error) throw error;
    logger.ok('DB', 'Berhasil terhubung ke Supabase Cloud (Skripsi_Project)');
    return true;
  } catch (e) {
    logger.error('DB', 'Gagal terhubung ke Supabase', { reason: e.message });
    return false;
  }
}


export async function isDatabaseHealthy() {
  if (!supabaseServer) {
    return { ok: false, code: 'NO_CONFIG', message: 'Supabase belum terkonfigurasi.' };
  }
  try {
    const { error } = await supabaseServer.from('users').select('id').limit(1);
    if (error) throw error;
    return { ok: true, provider: 'supabase', message: 'Database Supabase Cloud terhubung aktif' };
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'UNKNOWN',
      message: 'Koneksi Supabase tidak tersedia.'
    };
  }
}
