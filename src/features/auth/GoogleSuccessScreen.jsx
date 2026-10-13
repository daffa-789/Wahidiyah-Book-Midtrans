

import { useEffect, useState } from 'react';
import { useApp } from '@context/AppContext';
import { AuthStatus } from '@ui/AuthStatus';

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
      <AuthStatus
        error={error}
        errorTitle="Login Google Gagal"
        onBack={() => navigateTo('login', { replace: true })}
      />
    );
  }

  return <AuthStatus loadingText="Menyiapkan sesi Google…" />;
};
