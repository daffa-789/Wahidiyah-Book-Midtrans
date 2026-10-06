import { useState } from 'react';
import { AlertCircle, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJson } from '@lib/api';
import { layout } from '@lib/styles';

export const ForgotPasswordScreen = () => {
  const { navigateTo, setVerification } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const target = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(target)) {
      setError('Masukkan alamat email yang valid.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const result = await apiJson('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target })
      });
      setVerification({ email: target, purpose: 'reset', devOtp: result.devOtp });
      navigateTo('verify-email');
    } catch (requestError) {
      setError(requestError.message || 'Permintaan belum dapat diproses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <button type="button" onClick={() => navigateTo('login')} className="mb-6 inline-flex min-h-6 items-center gap-1 px-1 text-xs font-bold text-ink-400 transition hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Kembali ke masuk</button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><KeyRound className="h-6 w-6" /></div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink-900">Atur ulang password</h1>
        <p className={typography.helperRelaxed}>
          Masukkan email akun Anda. Kami akan mengirim kode verifikasi 6 angka ke alamat itu.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <label className="block">
            <span className="auth-label">Alamat email</span>
            <span className={controls.inputWrap}>
              <Mail className="auth-input-icon" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(''); }}
                placeholder="nama@email.com"
              />
            </span>
          </label>

          {error && <div role="alert" className="auth-alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? <><span className="auth-spinner" />Memproses…</> : 'Kirim kode verifikasi'}
          </button>
        </form>

        <p className="mt-5 text-center text-caption leading-relaxed text-ink-400">
          Akun yang dibuat lewat Google tidak punya password. Untuk akun seperti itu, gunakan tombol{' '}
          <strong className="text-ink-600">Login dengan Google</strong> di halaman masuk.
        </p>
      </section>
    </main>
  );
};
