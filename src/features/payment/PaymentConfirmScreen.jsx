import { useState, useRef, useCallback } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  QrCode,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '@context/AppContext';
import { useQrisPayment } from './useQrisPayment';
import { layout, typography, surfaces, controls } from '@lib/styles';

export const PaymentConfirmScreen = () => {
  const {
    user,
    selectedPlan,
    selectedPaymentMethod,
    paymentPhone,
    setPaymentPhone,
    paymentAgreed,
    setPaymentAgreed,
    completePayment,
    navigateTo,
    isSubscriptionActive
  } = useApp();

  const isSubscribed = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const isQrisMethod = selectedPaymentMethod?.id === 'qris' ||
                       selectedPaymentMethod?.name?.toLowerCase().includes('qris');

  const handlePaymentSuccess = useCallback(async () => {
    try {
      await completePayment();
    } finally {
      navigateTo('payment-success');
    }
  }, [completePayment, navigateTo]);

  const {
    qrTransaction,
    isGeneratingQr,
    qrError,
    isQrisPaid,
    isExpired,
    formattedCountdown,
    regenerateQr
  } = useQrisPayment({
    selectedPlan,
    user,
    onPaymentSuccess: handlePaymentSuccess,
    isQrisActive: isQrisMethod && !isSubscribed,
    phone: paymentPhone
  });

  const handlePay = (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      setError('Harap masukkan nomor telepon pembayaran');
      return;
    }
    if (!paymentAgreed) {
      setError('Harap setujui syarat & ketentuan sebelum melanjutkan');
      return;
    }

    setError('');
    setIsProcessing(true);

    timerRef.current = setTimeout(async () => {
      try {
        await completePayment();
      } finally {
        setIsProcessing(false);
        navigateTo('payment-success');
      }
    }, 1800);
  };

  if (isSubscribed) {
    return (
      <div className="min-h-[640px] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 bg-cream-50 page-transition">
        <div className="max-w-xl mx-auto w-full text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-100 text-brand-700 mx-auto flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className={typography.subTitle}>Langganan Anda Sedang Aktif</h2>
          <p className="text-xs text-ink-500 leading-relaxed max-w-md mx-auto">
            Akun Anda telah memiliki status langganan aktif (Pro).
            Anda tidak dapat melakukan konfirmasi pembayaran baru karena akun Anda sudah berstatus Pro.
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
    <div className="relative min-h-[640px] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 bg-cream-50 page-transition">
      <div className={layout.contentCenter}>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-ink-900">
            {isQrisMethod ? 'Pembayaran QRIS' : 'Konfirmasi Pembayaran'}
          </h2>
          <p className="text-xs text-ink-400">
            {isQrisMethod ? 'Pindai kode QR untuk mengaktifkan langganan' : 'Lengkapi data pembayaran'}
          </p>
        </div>

        <div className="bg-cream-50 border border-cream-300 shadow-sm rounded-3xl p-5 mb-6 space-y-4 hover:shadow-md transition">
          <div className="flex justify-between items-center pb-4 border-b border-cream-200">
            <span className="text-xs font-medium text-ink-400">Metode Pembayaran</span>
            <div className="flex items-center gap-3">
              {selectedPaymentMethod?.logoUrl && (
                <div className="w-10 h-8 p-1 rounded-lg bg-cream-50 border border-cream-200 shadow-sm flex items-center justify-center">
                  <img
                    src={selectedPaymentMethod.logoUrl}
                    alt={selectedPaymentMethod.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <span className="font-bold text-sm text-ink-900">{selectedPaymentMethod?.name || 'QRIS (Semua Pembayaran)'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-cream-200">
            <span className="text-xs font-medium text-ink-400">Harga Paket</span>
            <span className="text-sm font-bold text-ink-800">{selectedPlan.formattedPrice}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-cream-200 text-xs">
            <span className="font-medium text-ink-400">Biaya Administrasi</span>
            <span className="font-bold text-ink-700 bg-cream-200 px-2 py-0.5 rounded-md border border-cream-300">
              Rp 3.000
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 text-xs">
            <span className="font-bold text-ink-700">Total Pembayaran</span>
            <span className="text-lg font-black text-brand-800">
              Rp {(Number(selectedPlan.price || 25000) + 3000).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {isQrisMethod ? (
          <div className="bg-cream-100 border border-cream-300 rounded-3xl p-6 shadow-sm space-y-5 text-center">

            <div className="flex items-center justify-between bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                <span className="font-black text-xs tracking-wider uppercase">QRIS PEMBAYARAN</span>
              </div>
              <span className="text-micro font-bold bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                WAHIDIYAH BOOK
              </span>
            </div>

            {!isQrisPaid && qrTransaction && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Masa berlaku QR:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {formattedCountdown}
                </span>
              </div>
            )}

            <div className="relative mx-auto w-64 h-64 bg-cream-50 p-4 rounded-3xl border-2 border-dashed border-cream-300 shadow-inner flex flex-col items-center justify-center">
              {isGeneratingQr ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                  <span className="text-xs text-ink-400 font-medium">Membuat Kode QR...</span>
                </div>
              ) : qrError ? (
                <div className="p-3 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-xs text-rose-600 font-medium">{qrError}</p>
                  <button
                    onClick={regenerateQr}
                    className="px-3 py-1.5 bg-cream-300 hover:bg-cream-300 rounded-lg text-xs font-bold text-ink-800 inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              ) : isQrisPaid ? (
                <div className="flex flex-col items-center gap-2 text-brand-600 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <span className="text-sm font-black">PEMBAYARAN LUNAS!</span>
                  <span className={typography.helperInline}>Mengaktifkan paket Pro...</span>
                </div>
              ) : isExpired ? (
                <div className="flex flex-col items-center gap-2 text-amber-600">
                  <Clock className="w-8 h-8" />
                  <span className="text-xs font-bold">Kode QR kedaluwarsa</span>
                  <button
                    onClick={regenerateQr}
                    className="px-3 py-1.5 bg-cream-300 hover:bg-cream-400 rounded-lg text-xs font-bold text-ink-800 inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Buat Ulang</span>
                  </button>
                </div>
              ) : qrTransaction?.qrImageUrl ? (
                <img
                  src={qrTransaction.qrImageUrl}
                  alt="Kode QRIS pembayaran"
                  className="w-56 h-56 object-contain"
                />
              ) : null}
            </div>

          </div>
        ) : (

          <form onSubmit={handlePay} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="payment-phone-input" className="block text-xs font-semibold text-ink-700">
                Detail Pembayaran (Nomor Handphone)
              </label>
              <input
                id="payment-phone-input"
                type="text"
                data-testid="payment-phone"
                value={paymentPhone}
                onChange={(e) => {
                  setPaymentPhone(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Contoh: 082377464017"
                className="w-full px-4 py-3.5 text-sm rounded-2xl border border-cream-300 focus:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-50 focus-visible:bg-cream-50 transition font-medium text-ink-900 placeholder:text-ink-400 bg-cream-100/50 shadow-sm"
              />
            </div>

            <div className="pt-2 bg-brand-50/30 p-4 rounded-2xl border border-brand-100/50">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="payment-terms-checkbox"
                  checked={paymentAgreed}
                  onChange={(e) => {
                    setPaymentAgreed(e.target.checked);
                    if (error) setError('');
                  }}
                  className="h-6 w-6 shrink-0 mt-0.5 text-brand-800 rounded border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus:ring-brand-500 accent-brand-500"
                />
                <span className="text-xs text-ink-500 leading-snug">
                  Saya menyetujui seluruh <span className="text-brand-800 font-semibold">Syarat & Ketentuan</span> berlangganan Buku Wahidiyah
                </span>
              </label>
            </div>

            {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full mt-4 bg-brand-700 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold py-3.5 rounded-2xl shadow-md shadow-brand-600/20 transition text-sm flex items-center justify-center gap-2"
            >
              <span>Bayar Sekarang</span>
            </button>
          </form>
        )}

      </div>

      {isProcessing && (
        <div data-testid="payment-processing-modal" role="alertdialog" aria-labelledby="payment-processing-title" className="absolute inset-0 bg-cream-50/95 backdrop-blur-md z-50 flex flex-col justify-between p-6 page-transition">
          <div>
            <button
              type="button"
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setIsProcessing(false);
              }}
              className="p-2 -m-1 min-h-11 min-w-11 flex items-center justify-center text-ink-400 hover:text-ink-800 rounded-full hover:bg-cream-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              title="Batal Memproses"
              aria-label="Batal memproses pembayaran"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center text-center my-auto">
            <div className="relative mb-6">
              <Loader2 className="w-16 h-16 text-brand-800 animate-spin stroke-[2.5]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
            </div>
            <h3 id="payment-processing-title" className="text-lg font-bold text-ink-900">Memproses pembayaran...</h3>
            <p className="text-xs text-ink-400 mt-2 max-w-xs leading-relaxed">
              Mohon jangan menutup aplikasi sementara kami menghubungkan transaksi dengan payment gateway Midtrans.
            </p>
          </div>

          <div className="text-center text-caption text-ink-400 py-4 font-medium">
            Pembayaran QRIS Midtrans
          </div>
        </div>
      )}
    </div>
  );
};
