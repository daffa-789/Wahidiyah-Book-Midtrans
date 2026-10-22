import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { apiJson, authHeaders } from '@lib/api';
import { ThemeModeSelector } from '@ui/ThemeToggle';
import { NotificationToggle } from '@ui/NotificationToggle';
import { typography, controls } from '@lib/styles';
import { parsePhoneNumber } from '@lib/countryCodes';
import { FlagIcon } from '@ui/FlagIcon';

export const EditProfileScreen = () => {

  const { user, patchUser, sessionToken, navigateTo } = useApp();

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

        <div className="mb-6 rounded-2xl border border-cream-300 bg-cream-100 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-ink-800">Tema Tampilan</p>
              <p className="mt-0.5 text-caption leading-relaxed text-ink-400">
                Pilih mode terang, mode malam yang nyaman untuk mata, atau ikuti pengaturan perangkat.
              </p>
            </div>
            <ThemeModeSelector />
          </div>
        </div>

        <NotificationToggle />

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
              className="h-12 w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 text-sm font-medium text-ink-800 transition-colors duration-200 placeholder:text-ink-300 focus:border-brand-600 focus:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
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
              className="h-12 w-full cursor-not-allowed rounded-xl border border-cream-300 bg-cream-200/60 px-3.5 text-sm font-medium text-ink-500 focus-visible:outline-none"
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
              className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-cream-300 bg-cream-200/60 px-3.5 text-sm font-medium text-ink-700"
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
                      <span className="text-ink-600 font-mono text-xs">{p.nationalNumber}</span>
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
            <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight p-3 text-xs font-semibold text-semantic-danger page-transition">
              <AlertCircle className="h-4 w-4 shrink-0 text-semantic-danger" strokeWidth={2} />
              <span>{errorMessage}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs font-semibold text-brand-800 page-transition">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-700" strokeWidth={2} />
              <span>Perubahan profil berhasil disimpan.</span>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-bold text-cream-50 shadow-sm transition-colors duration-200 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-60 cursor-pointer"
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
