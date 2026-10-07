import clsx from 'clsx';

/**
 * Helper universal untuk menggabungkan class Tailwind secara kondisional.
 * Menghilangkan kebutuhan string template literal ternary yang panjang.
 * 
 * Contoh:
 * cn('btn', isActive && 'btn-active', isError && 'border-red-500')
 */
export function cn(...inputs) {
  return clsx(inputs);
}
