import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper universal standar (shadcn/tailwind) untuk menggabungkan class Tailwind secara kondisional
 * dan otomatis menghapus konflik class (misal: 'px-2' dan 'px-4' -> 'px-4').
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
