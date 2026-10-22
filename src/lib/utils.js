/**
 * @file utils.js
 * @description Kumpulan fungsi utilitas umum untuk aplikasi Wahidiyah Book.
 * Menggabungkan clsx dan tailwind-merge untuk resolusi kelas CSS Tailwind dinamis.
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan nama-nama kelas CSS Tailwind dengan resolusi konflik otomatis.
 * Sangat berguna untuk komponen reusable, varian state, dan class kondisional.
 *
 * @param {...any} inputs - Daftar string, array, atau objek kondisi kelas CSS
 * @returns {string} String kelas CSS yang telah di-merge secara rapi
 *
 * @example
 * cn('bg-brand-700 text-cream-50', isSuccess && 'bg-gold-600', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Menghambat eksekusi fungsi selama durasi tertentu (Debounce).
 * Berguna untuk input pencarian real-time dan resize event.
 *
 * @template {Function} T
 * @param {T} fn - Fungsi yang akan di-debounce
 * @param {number} delay - Jeda waktu dalam milidetik (default: 300ms)
 * @returns {T} Fungsi yang ter-debounce
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Menyalin teks ke clipboard pengguna secara aman dengan fallback.
 *
 * @param {string} text - Teks yang akan disalin
 * @returns {Promise<boolean>} Status berhasil/gagal
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
