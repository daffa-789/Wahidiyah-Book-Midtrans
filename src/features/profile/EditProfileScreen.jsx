import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Type } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { apiJson, authHeaders } from '@lib/api';
import { NotificationToggle } from '@ui/NotificationToggle';
import { typography, controls } from '@lib/styles';
import { parsePhoneNumber } from '@lib/countryCodes';
import { FlagIcon } from '@ui/FlagIcon';
import { getTextScale, setTextScale, TEXT_SCALE_OPTIONS } from '@lib/textSize';

export const EditProfileScreen = () => {

  const { user, patchUser, sessionToken, navigateTo } = useApp();

  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [textScale, setTextScaleState] = useState(getTextScale());
  const timeoutRef = useRef(null);

  const handleTextScaleChange = (scale) => {
    setTextScale(scale);
    setTextScaleState(scale);
    toast.success(`Ukuran teks diubah ke ${scale === 'large' ? 'Besar' : scale === 'xlarge' ? 'Sangat Besar' : 'Normal'}.`);
  };

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

        <NotificationToggle />

        {/* Mode Teks Besar (Ramah Jamaah Lansia) */}
        <div className="mb-6 rounded-2xl border border-cream-300 bg-cream-100/60 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
              <Type className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-body font-bold text-ink-900">
                Ukuran Teks Tampilan (Mode Ramah Lansia)
              </h3>
              <p className="mt-1 text-caption text-ink-500 leading-relaxed">
                Pilih ukuran teks yang nyaman dibaca di seluruh aplikasi. Pengaturan ini sangat membantu bagi jamaah lanjut usia.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TEXT_SCALE_OPTIONS.map((opt) => {
                  const isSelected = textScale === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTextScaleChange(opt.id)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm ring-1 ring-brand-600'
                          : 'border-cream-300 bg-cream-50 hover:bg-cream-100/80 text-ink-700'
                      }`}
                    >
                      <span className="text-small font-bold">{opt.label}</span>
                      <span className="text-caption text-ink-400 mt-0.5">{opt.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* Contoh pratinjau teks */}
              <div className="mt-3.5 rounded-xl border border-cream-300 bg-cream-50 p-3">
                <p className="text-caption font-semibold text-ink-400">Contoh keterbacaan teks:</p>
                <p className="text-body text-ink-900 font-medium mt-1">
                  YAA SAYYIDII YAA ROSUULALLOOH — Wahai Pemimpin Kami, Wahai Utusan Allah.
                </p>
              </div>
            </div>
          </div>
        </div>

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
