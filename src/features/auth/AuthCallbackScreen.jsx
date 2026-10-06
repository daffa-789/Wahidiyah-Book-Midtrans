

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase';
import { useApp } from '@context/AppContext';
import { apiJson } from '@lib/api';
import { AlertCircle } from 'lucide-react';
import { layout } from '@lib/styles';

export const AuthCallbackScreen = () => {
  const { login, navigateTo } = useApp();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase belum terkonfigurasi.');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error('Sesi Google tidak ditemukan. Silakan coba lagi.');
        }

        const result = await apiJson('/api/auth/google-supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token,
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name
                || session.user.user_metadata?.name
                || session.user.email?.split('@')[0] || 'Pengguna',
              avatar: session.user.user_metadata?.avatar_url || null,
            },
          }),
        });

        if (!cancelled && result.token && result.user) {
          login(result.user, result.token);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Gagal masuk dengan akun Google.');
        }
      }
    };

    handleCallback();
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
              <h2 className="text-lg font-bold text-ink-900">Gagal Masuk</h2>
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
          <p className="text-sm font-semibold text-ink-500">Memverifikasi akun Google…</p>
        </div>
      </section>
    </main>
  );
};
