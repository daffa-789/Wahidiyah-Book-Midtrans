import { useApp } from '@context/AppContext';
import { layout, typography, surfaces, controls } from '@lib/styles';

export const PaymentSuccessScreen = () => {
  const { lastPaymentResult, selectedPlan, selectedPaymentMethod, navigateTo } = useApp();

  const fallbackAmount = Number(selectedPlan?.price || 25000);
  const fallbackAdminFee = 3000;
  const details = lastPaymentResult || {
    refNo: null,
    dateStr: new Date().toLocaleString('id-ID'),
    periodStr: null,
    amount: fallbackAmount,
    adminFee: fallbackAdminFee,
    totalPaid: fallbackAmount + fallbackAdminFee,
    methodName: selectedPaymentMethod?.name || 'QRIS',
    planName: selectedPlan?.title || 'Paket Bulanan'
  };

  const hasRef = Boolean(details.refNo) && details.refNo !== '—';
  const hasPeriod = Boolean(details.periodStr) && details.periodStr !== '—';
  const total = Number(details.totalPaid ?? (Number(details.amount || 25000) + Number(details.adminFee || 3000)));

  const rows = [
    ['Nomor referensi', hasRef ? details.refNo : 'Tidak tersedia'],
    ['Waktu', details.dateStr],
    ['Paket', details.planName],
    ['Masa aktif', hasPeriod ? details.periodStr : 'Aktif tanpa batas'],
    ['Biaya layanan', Number(details.adminFee || 0) === 0 ? 'Gratis (Rp 0)' : `Rp ${Number(details.adminFee).toLocaleString('id-ID')}`]
  ];

  return (
    <div className="min-h-[640px] bg-cream-50 px-4 py-8 page-transition sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
            {details.pendingVerification ? 'Menunggu konfirmasi pembayaran' : 'Pembayaran berhasil'}
          </h1>

          {details.pendingVerification ? (
            <p className="mt-2 text-sm text-ink-400">
              Transaksi Anda tercatat. Paket Pro aktif setelah payment gateway
              mengonfirmasi pembayaran.
            </p>
          ) : null}
        </div>
        <section className="overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 shadow-xl shadow-brand-900/5">
          <div className="space-y-4 p-5 sm:p-6">
            <div className="border-b border-cream-200 pb-4 text-center">
              <p className="text-micro font-bold uppercase tracking-wider text-ink-300">Total pembayaran</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-ink-900">Rp {total.toLocaleString('id-ID')}</p>
              <p className={typography.helperTight}>{details.methodName}</p>
            </div>
            <dl className="space-y-3 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-5 border-b border-cream-200 pb-3 last:border-0 last:pb-0">
                  <dt className="text-ink-400">{label}</dt>
                  <dd className="text-right text-xs font-bold text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          Kembali ke koleksi
        </button>
      </div>
    </div>
  );
};
