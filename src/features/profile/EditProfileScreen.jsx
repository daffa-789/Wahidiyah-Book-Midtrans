import { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { apiJson, authHeaders } from '@lib/api';
import { layout, typography, surfaces, controls } from '@lib/styles';

const toIsoDate = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
};

export const EditProfileScreen = () => {

  const { user, patchUser, sessionToken, navigateTo } = useApp();

  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');

  const [dob, setDob] = useState(toIsoDate(user.dob));
  const [avatar, setAvatar] = useState(user.avatar);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (user.avatar) setAvatar(user.avatar);
    if (user.name) setName(user.name);
    if (user.dob) setDob(toIsoDate(user.dob));
  }, [user.avatar, user.name, user.dob]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDateChange = (event) => {
    setDob(event.target.value);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('File harus berupa gambar (PNG, JPG, SVG, WebP).');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 2 MB.');
        return;
      }
      setErrorMessage('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
          name: name.trim(),
          dob,
          avatar: avatar || null
        })
      });

      if (payload.user) {

        patchUser(payload.user);
      } else {
        patchUser({ name: name.trim(), dob, avatar });
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

      <div className="w-full max-w-content mx-auto mb-7">
        <h1 className="font-display text-title font-bold leading-tight text-ink-900">
          Profil Saya
        </h1>
        <p className="mt-0.5 text-xs text-ink-500">
          Kelola identitas akun Anda
        </p>
      </div>

      <div className="mx-auto w-full max-w-content-narrow">

        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-brand-100 ring-1 ring-cream-300">
              <img
                src={avatar}
                alt={`Foto profil ${user.name || 'pengguna'}`}
                className={layout.media}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/avatars/avatar-default.svg';
                }}
              />
            </div>
            <label
              className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand-700 text-cream-50 shadow-sm ring-[3px] ring-cream-50 transition-colors duration-200 hover:bg-brand-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-500"
              aria-label="Ubah foto profil"
              title="Ubah foto profil"
            >
              <Camera className="h-4 w-4" strokeWidth={2} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <p className="mt-3 text-caption text-ink-400">Ketuk ikon kamera untuk mengubah foto</p>
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
            <label htmlFor="edit-dob-input" className={typography.legend}>
              Tanggal Lahir
            </label>
            <input
              id="edit-dob-input"
              type="date"
              data-testid="edit-dob"
              value={dob}
              onChange={handleDateChange}
              max={new Date().toISOString().slice(0, 10)}
              className="h-12 w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 text-sm font-medium text-ink-800 transition-colors duration-200 focus:border-brand-600 focus:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
            />
          </div>

          {errorMessage && (
            <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 page-transition">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" strokeWidth={2} />
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
            <button
              type="button"
              data-testid="cancel-edit-profile-btn"
              onClick={() => navigateTo('home')}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl text-sm font-semibold text-ink-500 transition-colors duration-200 hover:bg-cream-200 hover:text-ink-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
