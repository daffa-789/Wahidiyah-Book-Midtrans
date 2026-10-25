
import { defineConfig } from 'vitest/config';

/**
 * Konfigurasi Vitest — Fase 4 roadmap arsitektur.
 *
 * Sengaja terpisah dari vite.config.js supaya unit test backend tidak
 * memuat plugin frontend (React, Tailwind, chunking PDF.js). Semua test
 * berjalan di lingkungan Node murni dan wajib deterministik: modul
 * database/jaringan di-mock, tidak ada panggilan Supabase/Midtrans nyata.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 15000
  }
});
