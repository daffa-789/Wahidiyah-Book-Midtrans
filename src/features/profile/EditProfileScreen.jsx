import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ReceiptText,
  Sparkles,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Save,
  ShieldCheck,
  User,
  Mail,
  Phone,
  BookOpen
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

  const isNameChanged = name.trim() !== (user.name || '').trim();

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
    <div className="min-h-[640px] flex flex-col px-4 sm:px-6 py-6 sm:py-8 bg-cream-50 page-transition pb-24 md:pb-12">
      <div className="mx-auto w-full max-w-content-narrow space-y-6">

        {/* 1. Hero Identity Card (Editorial & Modern Inset Group) */}
        <div className="rounded-3xl border border-cream-300 bg-ui-card p-6 shadow-xs relative overflow-hidden">
          {/* Subtle decorative background accent */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-brand-50/60 dark:bg-brand-900/10 pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left relative z-10">
            {/* Avatar with status ring */}
            <div className="relative shrink-0">
              <div
                className={`flex h-18 w-18 sm:h-20 sm:w-20 items-center justify-center rounded-2xl font-display font-black text-2xl shadow-sm transition-transform duration-200 ${
                  isPro
                    ? 'bg-gradient-to-br from-brand-700 to-brand-900 text-cream-50 ring-2 ring-gold-400/60 shadow-gold-500/10'
                    : 'bg-brand-100 text-brand-800 ring-2 ring-brand-300/80'
                }`}
              >
                {userInitials}
              </div>
              {isPro && (
                <div
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-cream-50 shadow-sm ring-2 ring-cream-50"
                  title="Member Pro Aktif"
                >
                  <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <h1 className="text-lead font-bold text-ink-900 tracking-tight truncate">
                  {user.name || 'Pengguna Wahidiyah'}
                </h1>
              </div>

              <p className="text-caption text-ink-500 truncate mt-0.5">
                {user.email}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {isPro ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/15 text-gold-700 dark:text-gold-400 text-micro font-bold border border-gold-400/30 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                    Member Pro Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200/80 text-ink-600 text-micro font-semibold border border-cream-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-700" />
                    Akun Standar
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-100 text-ink-500 text-micro font-medium border border-cream-200">
                  <BookOpen className="w-3 h-3 text-ink-400" />
                  Pembaca Digital
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Menu Hub: Layanan & Langganan (Cupertino Inset Grouped) */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Layanan & Langganan
          </h2>
          <div className="rounded-3xl border border-cream-300 bg-ui-card overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => navigateTo('subscription-history')}
              className="w-full flex items-center justify-between p-4.5 hover:bg-cream-100 active:bg-cream-200/70 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
                    Riwayat Langganan & Kwitansi
                  </p>
                  <p className="text-caption text-ink-500 truncate mt-0.5">
                    Lihat riwayat transaksi dan kwitansi resmi
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>
        </div>

        {/* 3. Form Ubah Data Profil (Modern Form Card) */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Data Akun
          </h2>
          <div className="rounded-3xl border border-cream-300 bg-ui-card p-5 sm:p-6 shadow-xs">
            <form onSubmit={handleSave} className="space-y-4">
              {/* Field Nama Lengkap */}
              <div>
                <label htmlFor="edit-name-input" className={typography.legend}>
                  Nama Lengkap
                </label>
                <div className="relative mt-1 flex items-center">
                  <div className="pointer-events-none absolute left-3.5 flex items-center text-ink-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="edit-name-input"
                    type="text"
                    data-testid="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="h-12 w-full rounded-xl border border-cream-300 bg-cream-50 pl-10 pr-3.5 text-body font-medium text-ink-800 transition-colors duration-200 placeholder:text-ink-300 focus:border-brand-600 focus:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                  />
                </div>
              </div>

              {/* Field Email Terproteksi */}
              <div>
                <label htmlFor="edit-email-input" className={typography.legend}>
                  Email Akun
                </label>
                <div className="relative mt-1 flex items-center">
                  <div className="pointer-events-none absolute left-3.5 flex items-center text-ink-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="edit-email-input"
                    type="email"
                    data-testid="edit-email"
                    value={email}
                    readOnly
                    className="h-12 w-full cursor-not-allowed rounded-xl border border-cream-300 bg-cream-200/50 pl-10 pr-28 text-body font-medium text-ink-500 focus-visible:outline-none"
                  />
                  <div className="absolute right-3 flex items-center">
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-0.5 text-micro font-bold text-brand-800">
                      Terverifikasi
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-micro text-ink-400">
                  Email akun tidak dapat diubah karena terhubung dengan autentikasi keamanan.
                </p>
              </div>

              {/* Field WhatsApp */}
              <div>
                <label htmlFor="edit-phone-input" className={typography.legend}>
                  Nomor WhatsApp
                </label>
                <div className="relative mt-1 flex items-center">
                  <div className="pointer-events-none absolute left-3.5 flex items-center text-ink-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div
                    id="edit-phone-input"
                    data-testid="edit-phone"
                    className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-cream-300 bg-cream-200/50 pl-10 pr-3.5 text-body font-medium text-ink-700"
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
                    <span className="ml-auto inline-flex items-center rounded-md bg-cream-300/60 px-2 py-0.5 text-micro font-semibold text-ink-600">
                      Terkait
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-micro text-ink-400">
                  Nomor WhatsApp digunakan untuk pemulihan akun dan notifikasi resmi.
                </p>
              </div>

              {/* Status Pesan */}
              {errorMessage && (
                <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight p-3.5 text-caption font-semibold text-semantic-danger page-transition">
                  <AlertCircle className="h-4 w-4 shrink-0 text-semantic-danger" strokeWidth={2} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {savedSuccess && (
                <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-caption font-semibold text-brand-800 page-transition">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-700" strokeWidth={2} />
                  <span>Perubahan profil berhasil disimpan.</span>
                </div>
              )}

              {/* Tombol Simpan Perubahan */}
              <button
                type="submit"
                disabled={isSubmitting || !isNameChanged}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-body font-bold text-cream-50 shadow-sm transition-all duration-200 hover:bg-brand-800 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

        {/* 4. Menu Hub: Bantuan & Info Aplikasi */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Bantuan & Info
          </h2>
          <div className="rounded-3xl border border-cream-300 bg-ui-card overflow-hidden shadow-xs divide-y divide-cream-200/80">
            <button
              type="button"
              onClick={() => navigateTo('help-center')}
              className="w-full flex items-center justify-between p-4.5 hover:bg-cream-100 active:bg-cream-200/70 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-700 group-hover:bg-ink-200 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
                    Pusat Bantuan
                  </p>
                  <p className="text-caption text-ink-500 truncate mt-0.5">
                    Pertanyaan umum dan panduan penggunaan aplikasi
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('about')}
              className="w-full flex items-center justify-between p-4.5 hover:bg-cream-100 active:bg-cream-200/70 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-700 group-hover:bg-ink-200 transition-colors">
                  <Info className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
                    Tentang E-Book Wahidiyah
                  </p>
                  <p className="text-caption text-ink-500 truncate mt-0.5">
                    Informasi sistem perpustakaan dan legalitas
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>
        </div>

        {/* 5. Pengaturan Tampilan & Sesi Akun */}
        <div className="space-y-2">
          <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
            Pengaturan & Sesi
          </h2>
          <div className="rounded-3xl border border-cream-300 bg-ui-card p-5 sm:p-6 shadow-xs space-y-4">
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

            {/* Tombol Logout */}
            <div className="border-t border-cream-200 pt-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight text-semantic-danger text-caption font-bold hover:bg-semantic-danger/15 active:bg-semantic-danger/25 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info versi */}
        <p className="text-center text-micro text-ink-400 pt-2 pb-2">
          Wahidiyah Book v1.0.0 • Perpustakaan Digital Sholawat Wahidiyah
        </p>

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
