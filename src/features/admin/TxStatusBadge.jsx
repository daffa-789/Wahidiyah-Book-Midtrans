/**
 * Lencana status transaksi bersama (dipakai tampilan mobile & desktop).
 *
 * Sebelumnya ternary yang sama disalin dua kali di `AdminDashboard`, sehingga
 * ada risiko keduanya berbeda saat salah satu diubah.
 */
const STATUS_MAP = {
  success: { label: 'Sukses', className: 'bg-brand-50 text-brand-700 border border-brand-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200' }
};

const FALLBACK = { label: 'Gagal', className: 'bg-rose-50 text-rose-700 border border-rose-200' };

export const TxStatusBadge = ({ status }) => {
  const { label, className } = STATUS_MAP[status] || FALLBACK;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-micro font-bold ${className}`}>
      {label}
    </span>
  );
};
