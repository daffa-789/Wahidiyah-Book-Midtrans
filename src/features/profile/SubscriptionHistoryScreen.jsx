import { useState, useEffect } from 'react';
import { Clock, Sparkles, CreditCard } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { formatWIB } from '@lib/date';
import { layout, typography, surfaces, controls } from '@lib/styles';

export const SubscriptionHistoryScreen = () => {
  const { subscriptions, refreshSubscriptions, navigateTo } = useApp();
  const [displayCount, setDisplayCount] = useState(2);

  useEffect(() => {
    refreshSubscriptions?.();
  }, [refreshSubscriptions]);

  const isAllLoaded = displayCount >= subscriptions.length;

  const handleLoadMore = () => {
    if (!isAllLoaded) {
      setDisplayCount(prev => Math.min(subscriptions.length, prev + 2));
    }
  };

  return (
    <div className="min-h-[640px] flex flex-col justify-between px-4 sm:px-6 py-6 bg-cream-50 page-transition">
      <div className={layout.contentCenter}>

        <div className="mb-6">
          <h1 className={typography.subTitle}>Riwayat Langganan</h1>
        </div>

        {subscriptions.length === 0 ? (
          <div className="py-12 px-4 text-center bg-cream-100/70 rounded-3xl border border-dashed border-cream-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 mx-auto flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-ink-800">Belum Ada Riwayat Langganan</h3>
            <p className="text-xs text-ink-400 max-w-xs mx-auto">
              Anda belum memiliki transaksi langganan aktif maupun riwayat terdahulu.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('pro')}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 py-2 bg-brand-700 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lihat Paket Pro</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {subscriptions.slice(0, displayCount).map((sub) => {
              const isActive = sub.status === 'Aktif';
              return (
                <div
                  key={sub.id}
                  data-testid={`sub-card-${sub.id}`}
                  className="bg-cream-50 rounded-3xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                        <span>{sub.planName}</span>
                        {isActive && <Sparkles className={controls.iconSm} />}
                      </h3>
                      <p className="text-xs font-semibold text-brand-800 mt-0.5">{sub.price}</p>
                      <p className="text-micro text-ink-400 mt-1">Dibeli: {formatWIB(sub.createdAt)}</p>
                    </div>

                    <span className={`text-micro font-bold px-2.5 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-brand-100 text-brand-800 border-brand-300'
                        : 'bg-cream-200 text-ink-500 border-cream-300'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between text-xs text-ink-400">
                    <div className={layout.rowStart}>
                      <Clock className="w-3.5 h-3.5 text-ink-400" />
                      <span className="text-caption font-medium">{sub.period}</span>
                    </div>
                    <span className="text-micro font-mono text-ink-400">{sub.ref || 'REF-202301'}</span>
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
    </div>
  );
};
