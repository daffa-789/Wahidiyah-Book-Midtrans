import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, Download } from 'lucide-react';
import { formatRupiah } from '@lib/formatUtils';

export const PaymentReceiptModal = ({ isOpen, onClose, details, user }) => {
  if (!isOpen) return null;

  const refNo = details?.refNo || details?.ref || `WB-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = details?.dateStr || details?.createdAt || new Date().toLocaleString('id-ID');
  const planName = details?.planName || 'Paket Bulanan Pro';
  const amount = Number(details?.amount || 25000);
  const adminFee = Number(details?.adminFee || 3000);
  const totalPaid = Number(details?.totalPaid || (amount + adminFee));
  const userName = user?.name || user?.fullName || 'Pengguna Wahidiyah';
  const userEmail = user?.email || '-';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-cream-50 print:hidden">
          <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-brand-700" />
            <span>Kwitansi Pembayaran Resmi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-800 hover:bg-cream-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-6 overflow-y-auto bg-white text-ink-900">
          {/* Header Branding */}
          <div className="text-center pb-5 border-b-2 border-brand-800/20 space-y-1">
            <div className="inline-flex items-center justify-center gap-2 text-brand-800 font-black text-xl tracking-tight">
              <span>WAHIDIYAH BOOK</span>
            </div>
            <p className="text-xs text-ink-400 font-medium">Perpustakaan Digital & Dokumen Pengamalan Wahidiyah</p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                PEMBAYARAN LUNAS (SETTLED)
              </span>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-ink-400 font-medium">Nomor Kwitansi</p>
              <p className="font-mono font-bold text-ink-800 text-sm mt-0.5">{refNo}</p>
            </div>
            <div className="text-right">
              <p className="text-ink-400 font-medium">Waktu Transaksi</p>
              <p className="font-bold text-ink-800 mt-0.5">{dateStr}</p>
            </div>
            <div>
              <p className="text-ink-400 font-medium">Diterbitkan Untuk</p>
              <p className="font-bold text-ink-800 mt-0.5">{userName}</p>
              <p className="text-ink-500 text-micro">{userEmail}</p>
            </div>
            <div className="text-right">
              <p className="text-ink-400 font-medium">Metode Pembayaran</p>
              <p className="font-bold text-brand-800 mt-0.5">QRIS Midtrans Core API</p>
            </div>
          </div>

          {/* Item Breakdown Table */}
          <div className="border border-cream-300 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-cream-100 border-b border-cream-300 text-ink-600 font-bold">
                <tr>
                  <th className="px-4 py-2.5 text-left">Deskripsi Layanan</th>
                  <th className="px-4 py-2.5 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                <tr>
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink-800">{planName}</p>
                    <p className="text-micro text-ink-400">Akses Penuh Seluruh Kitab & Dokumen Pro (30 Hari)</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-ink-800">
                    {formatRupiah(amount)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-ink-500">Biaya Administrasi & Gateway</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-ink-700">
                    {formatRupiah(adminFee)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-brand-50 border-t-2 border-brand-800/20">
                <tr>
                  <td className="px-4 py-3 font-black text-brand-900 text-sm">TOTAL PEMBAYARAN</td>
                  <td className="px-4 py-3 text-right font-black text-brand-900 text-base">
                    {formatRupiah(totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal / Notes */}
          <div className="pt-2 text-center text-micro text-ink-400 space-y-1">
            <p>Bukti pembayaran ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.</p>
            <p className="font-mono text-ink-300">ID Keamanan: {Math.random().toString(36).slice(2, 10).toUpperCase()}-VERIFIED</p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-cream-50 border-t border-cream-200 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-cream-300 text-ink-600 text-xs font-bold hover:bg-cream-100 transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kwitansi / Simpan PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
