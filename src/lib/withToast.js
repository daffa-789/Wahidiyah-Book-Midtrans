import { toast } from 'sonner';

/**
 * Jalankan aksi asinkron dan laporkan kegagalannya lewat toast — sekali panggil.
 *
 * Sebelumnya pola ini ditulis tangan 17 kali di seluruh aplikasi:
 *
 *   try {
 *     await simpanData();
 *     toast.success('Tersimpan.');
 *   } catch (err) {
 *     toast.error(err.message || 'Gagal menyimpan.');
 *   }
 *
 * Menjadi:
 *
 *   await withToast(() => simpanData(), 'Gagal menyimpan.', 'Tersimpan.');
 *
 * `fallbackMessage` dipakai HANYA bila `error.message` kosong, persis seperti
 * perilaku `err.message || '...'` yang digantikannya — jadi pesan galat asli
 * dari server tetap tampil utuh.
 *
 * `successMessage` boleh berupa fungsi `(value) => string` bila teksnya perlu
 * memuat hasil aksi (mis. jumlah baris & nama berkas ekspor).
 *
 * Mengembalikan `{ ok, value, error }` alih-alih melempar ulang: pemanggil
 * yang butuh tahu hasilnya bisa memeriksa `ok`, sementara pemanggil yang hanya
 * ingin toast bisa mengabaikannya. Ini menghindari `try/catch` kedua di luar.
 */
const resolveSuccess = (successMessage, value) =>
  typeof successMessage === 'function' ? successMessage(value) : successMessage;

export const withToast = async (action, fallbackMessage, successMessage) => {
  try {
    const value = await action();
    const text = resolveSuccess(successMessage, value);
    if (text) toast.success(text);
    return { ok: true, value, error: null };
  } catch (error) {
    toast.error(error?.message || fallbackMessage);
    return { ok: false, value: undefined, error };
  }
};

/**
 * Varian sinkron untuk aksi yang langsung menghasilkan nilai tanpa promise
 * (mis. ekspor Excel yang menghitung lalu memicu unduhan di memori).
 *
 * Menerima pula fungsi yang mengembalikan promise, sehingga pemanggil bisa
 * memakai `() => import('...').then(...)` untuk memuat modul secara malas
 * tanpa perlu menandai handler sebagai `async`.
 */
export const withToastSync = (action, fallbackMessage, successMessage) => {
  try {
    const value = action();
    if (value && typeof value.then === 'function') {
      return value.then(
        (resolved) => {
          const text = resolveSuccess(successMessage, resolved);
          if (text) toast.success(text);
          return { ok: true, value: resolved, error: null };
        },
        (error) => {
          toast.error(error?.message || fallbackMessage);
          return { ok: false, value: undefined, error };
        },
      );
    }
    const text = resolveSuccess(successMessage, value);
    if (text) toast.success(text);
    return { ok: true, value, error: null };
  } catch (error) {
    toast.error(error?.message || fallbackMessage);
    return { ok: false, value: undefined, error };
  }
};
