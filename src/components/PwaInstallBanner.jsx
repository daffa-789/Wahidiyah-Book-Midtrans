import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    /* Jangan tampilkan di desktop. Dulu syaratnya memakai window.innerWidth
       <= 768, sehingga jendela desktop yang sempit — atau DevTools yang
       menempel di kanan — dianggap HP, dan banner "pasang di layar HP" muncul
       di Windows. Yang dipakai sekarang penanda perangkat sungguhan. */
    const ua = navigator.userAgent;
    /* iPadOS 13+ mengirim UA "Macintosh", jadi perlu jumlah titik sentuh. */
    const isIpadOs = /macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
    const isMobileOrTablet = typeof navigator.userAgentData?.mobile === 'boolean'
      ? navigator.userAgentData.mobile || isIpadOs
      : /android|iphone|ipad|ipod/i.test(ua) || isIpadOs;

    /* Penjaga kedua: perangkat sentuh. Chrome desktop tetap memicu
       `beforeinstallprompt` di Windows, jadi UA saja tidak cukup — kursor
       halus (mouse/trackpad) berarti ini desktop, apa pun kata UA-nya. */
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches === true;

    if (!isMobileOrTablet || !hasCoarsePointer) {
      return;
    }

    // Cek apakah user sudah menutup banner
    if (localStorage.getItem('wb_pwa_dismissed') === 'true' || sessionStorage.getItem('wb_pwa_dismissed') === 'true') {
      return;
    }

    // Deteksi jika sudah dalam mode terinstall (standalone PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    // Tangkap event instalasi browser Android / Mobile Chromium
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Deteksi iOS Safari (termasuk iPad yang menyamar sebagai Mac)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || isIpadOs;
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
      // Tampilkan setelah jeda 3 detik agar tidak mengejutkan user
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('wb_pwa_dismissed', 'true');
    localStorage.setItem('wb_pwa_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="app-surface fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-ink-900 text-cream-50 shadow-2xl border border-cream-50/10 backdrop-blur-md">
        <div className="p-2.5 rounded-xl bg-brand-800 text-brand-300 shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs font-bold text-cream-50 tracking-wide">
            Pasang Aplikasi Wahidiyah Book
          </h4>
          <p className="mt-0.5 text-micro text-cream-300/80 leading-relaxed">
            {isIos ? (
              <span>
                Buka menu <Share className="w-3 h-3 inline mx-0.5" /> <strong>Bagikan</strong> di Safari, lalu pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>.
              </span>
            ) : (
              'Pasang di layar HP Anda untuk akses lebih cepat layaknya aplikasi native.'
            )}
          </p>

          {!isIos && deferredPrompt && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-cream-50 text-micro font-bold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Sekarang</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-lg text-cream-300/70 hover:text-cream-50 text-micro font-medium transition"
              >
                Nanti Saja
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-cream-300/60 hover:text-cream-50 hover:bg-cream-50/10 transition"
          aria-label="Tutup banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
