import { CheckCircle2, Circle, Building2, Wallet } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { PAYMENT_METHODS } from '@data/mockData';
import { layout, typography, surfaces, controls } from '@lib/styles';

export const PaymentMethodScreen = () => {
  const {
    user,
    selectedPlan,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    navigateTo,
    isSubscriptionActive
  } = useApp();

  const isSubscribed = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);

  const handleContinue = () => {
    if (isSubscribed) return;
    navigateTo('payment-confirm');
  };

  if (isSubscribed) {
    return (
      <div className="min-h-[700px] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 bg-cream-50 page-transition">
        <div className="max-w-xl mx-auto w-full text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-100 text-brand-700 mx-auto flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className={typography.subTitle}>Langganan Anda Sedang Aktif</h2>
          <p className="text-xs text-ink-500 leading-relaxed max-w-md mx-auto">
            Akun Anda telah memiliki status langganan aktif (Pro).
            Anda tidak dapat melakukan pembayaran baru karena akun Anda sudah berstatus Pro.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('pro')}
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-brand-700 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Kembali ke Menu Pro
            </button>
            <button
              type="button"
              onClick={() => navigateTo('subscription-history')}
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-cream-200 hover:bg-cream-300 text-ink-700 text-xs font-bold rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Lihat Riwayat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[700px] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 bg-cream-50 page-transition">
      <div className="max-w-4xl mx-auto w-full flex-1">

        <div className="mb-6">
          <h2 className="font-display text-subtitle font-bold text-ink-900 tracking-tight">Pilih Metode Pembayaran</h2>
        </div>

        <div className="bg-gradient-to-r from-brand-600/10 via-brand-50 to-brand-600/10 border border-brand-200/80 rounded-2xl p-5 mb-6 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-caption font-bold text-brand-800 uppercase tracking-wider bg-brand-100/70 px-2.5 py-0.5 rounded-full">
              Paket Dipilih
            </span>
            <h3 className="text-base font-extrabold text-ink-900 mt-1">{selectedPlan.title}</h3>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-brand-800">{selectedPlan.formattedPrice}</span>
          </div>
        </div>

        <div className="space-y-6">
          {PAYMENT_METHODS.map((cat, catIdx) => (
            <div key={catIdx}>
              <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                {cat.category === 'Bank Transfer' ? <Building2 className={controls.iconSm} /> : <Wallet className={controls.iconSm} />}
                <span>{cat.category}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {cat.options.map((opt) => {
                  const isSelected = selectedPaymentMethod?.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(opt)}
                      aria-pressed={isSelected}
                      className={`w-full p-4 rounded-2xl border transition flex items-center justify-between text-left group hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/30 shadow-sm ring-1 ring-brand-500'
                          : 'border-cream-300 hover:border-brand-500/50 bg-cream-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 p-2 rounded-xl flex items-center justify-center font-bold text-xs bg-cream-50 border border-cream-200 shadow-sm overflow-hidden"
                        >
                          {opt.logoUrl ? (
                            <img
                              src={opt.logoUrl}
                              alt={opt.name}
                              className="w-full h-full object-contain drop-shadow-sm"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span
                            style={{ display: opt.logoUrl ? 'none' : 'flex', backgroundColor: opt.color }}
                            className="w-full h-full text-white items-center justify-center text-xs font-bold rounded-lg shadow-inner"
                          >
                            {opt.id.slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm font-bold transition ${isSelected ? 'text-brand-800' : 'text-ink-900 group-hover:text-brand-800'}`}>{opt.name}</p>
                          <p className={typography.metaTight}>
                            {cat.category === 'Bank Transfer' ? 'Transfer Otomatis' : 'Konfirmasi Instan'}
                          </p>
                        </div>
                      </div>

                      <div className="text-brand-800 shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-6 h-6 fill-brand-500 text-white drop-shadow-sm" />
                        ) : (
                          <Circle className="w-6 h-6 text-ink-200 group-hover:text-brand-800/40 transition" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-cream-200 mt-8">
          <div className="flex items-center justify-between mb-3 text-xs sm:text-sm">
            <span className="text-ink-400 font-medium">Total Pembayaran:</span>
            <span className="text-lg font-black text-ink-900">{selectedPlan.formattedPrice}</span>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-brand-700 hover:bg-brand-700 active:bg-brand-800 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-brand-600/20 transition text-sm"
          >
            Lanjutkan Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};
