import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { formatWIB } from '@lib/date';
import { layout, controls } from '@lib/styles';
import { PaymentReceiptModal } from '../payment/PaymentReceiptModal';

export const SubscriptionHistoryScreen = () => {
  const { subscriptions, refreshSubscriptions, navigateTo, user } = useApp();
  const [displayCount, setDisplayCount] = useState(2);
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    refreshSubscriptions?.();
  }, [refreshSubscriptions]);

  const isAllLoaded = displayCount >= subscriptions.length;

  const handleLoadMore = () => {
    if (!isAllLoaded) {
      setDisplayCount((prev) => Math.min(subscriptions.length, prev + 2));
    }
  };

  return (
    <div className="min-h-[640px] flex flex-col justify-between px-4 sm:px-6 py-6 bg-cream-50">
      <div className={layout.contentCenter}>
        {subscriptions.length === 0 ? (
          <div className="min-h-[460px] flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
            <h3 className="font-bold text-body text-ink-800">Belum Ada Riwayat Langganan</h3>
            <p className="text-caption text-ink-400 max-w-xs mx-auto">
              Anda belum memiliki transaksi langganan aktif maupun riwayat terdahulu.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('pro')}
              className="inline-flex items-center justify-center min-h-10 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-cream-50 text-caption font-bold rounded-xl shadow-sm transition mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            >
              Lihat Paket Pro
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {subscriptions.slice(0, displayCount).map((sub) => {
              const isActive = sub.status === 'Aktif';
              const refNumber = sub.ref || sub.orderId || 'REF-86331757';

              return (
                <div
                  key={sub.id}
                  data-testid={`sub-card-${sub.id}`}
                  onClick={() => setSelectedSub(sub)}
                  className="bg-cream-50 rounded-3xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                        <span>{sub.planName}</span>
                        {isActive && <Sparkles className={controls.iconSm} />}
                      </h3>
                      <p className="text-xs font-semibold text-brand-800 mt-0.5">{sub.price}</p>
                      <p className="text-micro font-mono text-ink-400 mt-0.5">{refNumber}</p>
                      <p className="text-micro text-ink-400 mt-1">
                        Dibeli: {formatWIB(sub.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`text-micro font-bold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-brand-100 text-brand-800 border-brand-300'
                          : 'bg-cream-200 text-ink-500 border-cream-300'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {subscriptions.length > 0 && !isAllLoaded && (
        <div className="pt-6">
          <button
            type="button"
            data-testid="load-more-btn"
            onClick={handleLoadMore}
            className="w-full py-3.5 bg-cream-100 hover:bg-brand-50 text-brand-800 text-xs font-bold rounded-2xl border border-brand-200 transition text-center shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}

      {/* Kwitansi / Invoice Resmi Popup */}
      <PaymentReceiptModal
        isOpen={Boolean(selectedSub)}
        onClose={() => setSelectedSub(null)}
        details={
          selectedSub
            ? {
                refNo: selectedSub.ref || selectedSub.orderId,
                dateStr: formatWIB(selectedSub.createdAt),
                planName: selectedSub.planName || 'Paket Bulanan Pro',
                amount: selectedSub.rawPrice || 25000,
                adminFee: selectedSub.adminFee || 0,
                totalPaid: selectedSub.totalPaid || 25000,
                periodStr: selectedSub.period || '1 Bulan Langganan Pro',
              }
            : null
        }
        user={user}
      />
    </div>
  );
};
