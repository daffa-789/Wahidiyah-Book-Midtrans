import { useCallback } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { layout, typography, surfaces, controls } from '@lib/styles';

export const ProScreen = () => {
  const { user, setSelectedPlan, navigateTo, isSubscriptionActive, clearLastPaymentResult } = useApp();

  const isSubscribed = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);
  const isMonthlyActive = isSubscribed;

  const handleSelectPlan = useCallback((planId, title, price, period, formatted) => {
    if (isSubscribed) return;

    clearLastPaymentResult?.();
    setSelectedPlan({
      id: planId,
      title,
      price,
      period,
      formattedPrice: formatted
    });
    navigateTo('payment-method');
  }, [isSubscribed, setSelectedPlan, navigateTo, clearLastPaymentResult]);

  return (
    <div className="min-h-[700px] flex flex-col bg-cream-50 page-transition pb-8">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <div className="max-w-2xl">
          <h1 className="font-display text-displaySm sm:text-displayLg font-bold leading-tight text-ink-900 tracking-tight">
            Pro
          </h1>
          <p className={typography.helperMuted}>
            Buka seluruh koleksi kitab eksklusif Wahidiyah.
          </p>
        </div>

        <div className="flex justify-center max-w-lg mx-auto items-stretch">

          <div className="w-full bg-cream-50 rounded-3xl p-6 sm:p-7 border border-cream-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group hover:border-brand-200">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-micro font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100">
                      Paket Reguler
                    </span>
                    {isMonthlyActive && (
                      <span className="text-micro font-extrabold bg-brand-100 text-brand-800 border border-brand-300 px-2.5 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-ink-900 mt-2">Paket Bulanan</h3>
                  <p className={typography.metaTight}>Fleksibel, bayar per bulan tanpa komitmen panjang</p>
                </div>
              </div>

              <div className="mt-5 pb-5 border-b border-cream-200">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">Rp 25.000</span>
                  <span className="text-xs font-semibold text-ink-400">/bulan</span>
                </div>
                <p className="text-caption text-ink-500 mt-1">Dapat dibatalkan sewaktu-waktu</p>
              </div>

              <div className="mt-5 space-y-3 text-xs text-ink-700">
                <div className={layout.rowStartGap}>
                  <div className={surfaces.statBadge}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Akses penuh ke Perpustakaan Buku Wahidiyah</span>
                </div>
                <div className={layout.rowStartGap}>
                  <div className={surfaces.statBadge}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Bebas iklan & membaca lebih khusyuk</span>
                </div>
                <div className={layout.rowStartGap}>
                  <div className={surfaces.statBadge}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Dukungan pelanggan standar</span>
                </div>
                <div className={layout.rowStartGap}>
                  <div className={surfaces.statBadge}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Sinkronisasi riwayat pembacaan offline</span>
                </div>
              </div>
            </div>

            {isSubscribed ? (
              <button
                type="button"
                disabled
                className="w-full mt-6 py-3.5 bg-cream-200 text-ink-300 text-xs font-bold rounded-2xl cursor-not-allowed border border-cream-300 flex items-center justify-center gap-1.5"
                title="Anda telah memiliki langganan aktif"
              >
                {isMonthlyActive && <Check className="w-4 h-4 text-brand-600" />}
                <span>{isMonthlyActive ? 'Paket Sedang Aktif' : 'Tidak Tersedia (Sedang Berlangganan)'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPlan('monthly', 'Paket Bulanan', 25000, '/bulan', 'Rp 25.000')}
                className="w-full mt-6 py-3.5 bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-cream-50 text-xs font-extrabold rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Berlangganan Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
