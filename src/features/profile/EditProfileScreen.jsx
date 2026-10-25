import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { useTheme } from '@theme/ThemeProvider';
import { apiJson, authHeaders } from '@lib/api';
import { typography, controls } from '@lib/styles';
import { parsePhoneNumber } from '@lib/countryCodes';
import { FlagIcon } from '@ui/FlagIcon';

export const EditProfileScreen = () => {

  const { user, patchUser, sessionToken, navigateTo } = useApp();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
    const timeoutRef = useRef(null);

  
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
        navigateTo('home');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan profil ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[640px] flex flex-col px-4 sm:px-6 py-8 bg-cream-50 page-transition">


      <div className="mx-auto w-full max-w-content-narrow">

        
        

        <form onSubmit={handleSave} className="space-y-5">

          <div>
            <label htmlFor="edit-name-input" className={typography.legend}>
              Nama
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
            <p className="mt-1.5 text-caption text-ink-400">
              Email tidak dapat diubah.
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
            <p className="mt-1.5 text-caption text-ink-400">
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

          
          {/* Pengaturan Mode Tampilan (Slider Mode Gelap / Terang) */}
          <div className="rounded-2xl border border-cream-300 bg-cream-50 p-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isDark ? 'bg-gold-500/15 text-gold-400' : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-body font-bold text-ink-900">
                    Mode Tampilan
                  </p>
                  <p className="text-caption text-ink-500">
                    {isDark ? 'Mode Gelap (Malam) aktif' : 'Mode Terang (Siang) aktif'}
                  </p>
                </div>
              </div>

              {/* Slider / Switch Toggle */}
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
                  className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-cream-50 shadow-md ring-0 transition duration-200 ease-in-out ${
                    isDark ? 'translate-x-5 text-brand-800' : 'translate-x-0 text-gold-600'
                  }`}
                >
                  {isDark ? (
                    <Moon className="h-3.5 w-3.5 text-brand-800" strokeWidth={2.2} />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-gold-600" strokeWidth={2.2} />
                  )}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
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
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
