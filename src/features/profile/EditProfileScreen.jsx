import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  CreditCard,
  Sparkles,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Save,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { useTheme } from '@theme/ThemeProvider';
import { apiJson, authHeaders } from '@lib/api';
import { typography, controls } from '@lib/styles';
import { parsePhoneNumber } from '@lib/countryCodes';
import { FlagIcon } from '@ui/FlagIcon';
import { LogoutConfirmDialog } from '../../components/layout/LogoutConfirmDialog';

export const EditProfileScreen = () => {
  const { user, patchUser, sessionToken, navigateTo, logout, isSubscriptionActive } = useApp();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const timeoutRef = useRef(null);

  const isPro = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);
  const userInitials = (user?.name || 'U')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  useEffect(() => {
    if (user.name) setName(user.name);
  }, [user.name]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const payload = await apiJson('/api/users/profile', {
        method: 'PUT',
        headers: {
          ...authHeaders(sessionToken),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim()
        })
      });

      if (payload.user) {
        patchUser(payload.user);
      } else {
        patchUser({ name: name.trim() });
      }

      setSavedSuccess(true);
      toast.success('Profil berhasil diperbarui!');
      timeoutRef.current = setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan profil ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmLogout = useCallback(() => {
    setLogoutModalOpen(false);
    logout();
  }, [logout]);

  return (
    <div className="min-h-[640px] flex flex-col px-4 sm:px-6 py-6 sm:py-8 bg-cream-50 page-transition pb-24 md:pb-8">
      <div className="mx-auto w-full max-w-content-narrow space-y-6">

        {/* 1. Header Identitas Akun (Mobile Account Card) */}
        <div className="rounded-3xl border border-cream-300 bg-ui-card p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-title font-black text-brand-800 ring-2 ring-brand-300 shadow-xs">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-body sm:text-title font-bold text-ink-900 truncate">
              {user.name || 'Pengguna Wahidiyah'}
            </h1>
            <p className="text-caption text-ink-500 truncate mt-0.5">
              {user.email}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {isPro ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-micro font-bold border border-brand-300 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-brand-700" />
                  Member Pro Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 text-ink-600 text-micro font-semibold border border-cream-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-ink-500" />
                  Akun Standar
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Menu Hub: Layanan & Langganan (Native List Group) */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Layanan & Langganan
          </h2>
          <div className="rounded-2xl border border-cream-300 bg-ui-card overflow-hidden shadow-xs divide-y divide-cream-200">
            <button
              type="button"
              onClick={() => navigateTo('subscription-history')}
              className="w-full flex items-center justify-between p-4 hover:bg-cream-100 active:bg-cream-200 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-bold text-ink-900">Riwayat Langganan & Kwitansi</p>
                  <p className="text-caption text-ink-400 truncate">Lihat riwayat pembelian dan kwitansi resmi</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 transition-colors shrink-0 ml-2" />
            </button>
          </div>
        </div>

        {/* 3. Form Ubah Data Profil */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Data Akun
          </h2>
          <div className="rounded-2xl border border-cream-300 bg-ui-card p-5 shadow-xs">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="edit-name-input" className={typography.legend}>
                  Nama Lengkap
                </label>
                <input
                  id="edit-name-input"
                  type="text"
                  data-testid="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="h-12 w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 text-body font-medium text-ink-800 transition-colors duration-200 placeholder:text-ink-300 focus:border-brand-600 focus:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="edit-email-input" className={typography.legend}>
                  Email
                </label>
                <input
                  id="edit-email-input"
                  type="email"
                  data-testid="edit-email"
                  value={email}
                  readOnly
                  className="h-12 w-full cursor-not-allowed rounded-xl border border-cream-300 bg-cream-200/60 px-3.5 text-body font-medium text-ink-500 focus-visible:outline-none"
                />
                <p className="mt-1 text-micro text-ink-400">
                  Email akun tidak dapat diubah.
                </p>
              </div>

              <div>
                <label htmlFor="edit-phone-input" className={typography.legend}>
                  Nomor WhatsApp
                </label>
                <div
                  id="edit-phone-input"
                  data-testid="edit-phone"
                  className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-cream-300 bg-cream-200/60 px-3.5 text-body font-medium text-ink-700"
                >
                  {user.phone ? (
                    (() => {
                      const p = parsePhoneNumber(user.phone);
                      return (
                        <>
                          <FlagIcon
                            code={p.country.code}
                            name={p.country.name}
                            className="h-3.5 w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.12)] shrink-0"
                          />
                          <span className="font-semibold text-ink-800">{p.country.dial}</span>
                          <span className="text-ink-600 font-mono text-caption">{p.nationalNumber}</span>
                        </>
                      );
                    })()
                  ) : (
                    <span className="text-ink-400">-</span>
                  )}
                </div>
                <p className="mt-1 text-micro text-ink-400">
                  Nomor WhatsApp terdaftar untuk autentikasi dan pemulihan akun.
                </p>
              </div>

              {errorMessage && (
                <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight p-3 text-caption font-semibold text-semantic-danger page-transition">
                  <AlertCircle className="h-4 w-4 shrink-0 text-semantic-danger" strokeWidth={2} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {savedSuccess && (
                <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 p-3 text-caption font-semibold text-brand-800 page-transition">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-700" strokeWidth={2} />
                  <span>Perubahan profil berhasil disimpan.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-body font-bold text-cream-50 shadow-sm transition-colors duration-200 hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={controls.spinner} />
                    <span>Menyimpan…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 4. Menu Bantuan & Info Aplikasi */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Bantuan & Info
          </h2>
          <div className="rounded-2xl border border-cream-300 bg-ui-card overflow-hidden shadow-xs divide-y divide-cream-200">
            <button
              type="button"
              onClick={() => navigateTo('help')}
              className="w-full flex items-center justify-between p-4 hover:bg-cream-100 active:bg-cream-200 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700 group-hover:bg-ink-200 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-bold text-ink-900">Pusat Bantuan</p>
                  <p className="text-caption text-ink-400 truncate">Pertanyaan umum dan panduan penggunaan</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 transition-colors shrink-0 ml-2" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('about')}
              className="w-full flex items-center justify-between p-4 hover:bg-cream-100 active:bg-cream-200 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700 group-hover:bg-ink-200 transition-colors">
                  <Info className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-bold text-ink-900">Tentang E-Book Wahidiyah</p>
                  <p className="text-caption text-ink-400 truncate">Informasi aplikasi dan legalitas</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 transition-colors shrink-0 ml-2" />
            </button>
          </div>
        </div>

        {/* 5. Tampilan & Keluar Akun */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Pengaturan & Sesi
          </h2>
          <div className="rounded-2xl border border-cream-300 bg-ui-card p-4 shadow-xs space-y-4">
            {/* Slider Switch Mode Gelap / Terang */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-bold text-ink-900">
                  Mode Tampilan
                </p>
                <p className="text-caption text-ink-500">
                  {isDark ? 'Mode Gelap (Malam) aktif' : 'Mode Terang (Siang) aktif'}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  isDark ? 'bg-brand-700' : 'bg-cream-300'
                }`}
                title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
                aria-label="Peralihan tema gelap dan terang"
              >
                <span
                  className={`pointer-events-none inline-flex h-6 w-6 transform rounded-full bg-cream-50 shadow-md ring-0 transition duration-200 ease-in-out ${
                    isDark ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-cream-200 pt-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight text-semantic-danger text-caption font-bold hover:bg-semantic-danger/15 active:bg-semantic-danger/25 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Konfirmasi Log Out */}
      <LogoutConfirmDialog
        isOpen={logoutModalOpen}
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};
