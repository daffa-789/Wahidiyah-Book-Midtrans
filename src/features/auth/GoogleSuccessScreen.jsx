

import { useEffect, useState } from 'react';
import { useApp } from '@context/AppContext';
import { AlertCircle } from 'lucide-react';
import { layout } from '@lib/styles';

const decodeBase64Url = (value) => {

  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    + '='.repeat((4 - (value.length % 4)) % 4);
  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const GoogleSuccessScreen = () => {
  const { login, navigateTo } = useApp();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);

    const oauthError = params.get('error');
    if (oauthError) {
      setError(params.get('message') || 'Login Google dibatalkan.');

      window.history.replaceState({}, '', '/auth/success');
      return undefined;
    }

    const token = params.get('token');
    const userEncoded = params.get('user');
    if (!token || !userEncoded) {
      setError('Data sesi Google tidak lengkap. Silakan coba lagi.');
      return undefined;
    }

    const user = decodeBase64Url(userEncoded);
    if (!user) {
      setError('Data pengguna tidak dapat dibaca.');
      return undefined;
    }

    try {
      login(user, token);
    } catch (loginError) {
      if (!cancelled) setError(loginError.message || 'Gagal menyimpan sesi.');
    }

    return () => { cancelled = true; };
  }, [login]);

  if (error) {
    return (
      <main className={layout.authShell}>
        <section className={layout.authCard}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Login Google Gagal</h2>
              <p className={typography.helperMuted}>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('login', { replace: true })}
              className="auth-primary-button mt-2"
            >
              Kembali ke halaman masuk
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <span className="h-5 w-5 rounded-full border-2 border-brand-300 border-t-brand-700 animate-spin" />
          <p className="text-sm font-semibold text-ink-500">Menyiapkan sesi Google…</p>
        </div>
      </section>
    </main>
  );
};
