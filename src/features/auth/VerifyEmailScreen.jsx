import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJson } from '@lib/api';
import { layout } from '@lib/styles';

export const VerifyEmailScreen = () => {
  const { verification, clearVerification, login, navigateTo } = useApp();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState('');
  const [done, setDone] = useState(false);

  const [completedEmail, setCompletedEmail] = useState('');

  const [devOtp, setDevOtp] = useState(verification?.devOtp || '');
  const codeInputRef = useRef(null);

  const email = verification?.email || '';
  const purpose = verification?.purpose === 'reset' ? 'reset' : 'register';
  const isReset = purpose === 'reset';

  const startedRef = useRef(false);
  useEffect(() => {
    if (email) {
      startedRef.current = true;
      return;
    }
    if (!startedRef.current) {
      navigateTo(isReset ? 'forgot-password' : 'register', { replace: true });
    }
  }, [email, isReset, navigateTo]);

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Kode verifikasi tidak valid.');
      return;
    }
    if (isReset) {
      if (password.length < 8) return setError('Password baru minimal 8 karakter.');
      if (password !== confirmation) return setError('Konfirmasi password belum sesuai.');
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (isReset) {
        await apiJson('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: trimmed, password })
        });
        clearVerification();
        setCompletedEmail(email);
        setDone(true);
      } else {
        const result = await apiJson('/api/auth/verify-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: trimmed })
        });
        clearVerification();

        login(result.user, result.token);
      }
    } catch (requestError) {
      setError(requestError.message || 'Kode belum dapat diverifikasi.');
      setCode('');
      codeInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    setResendNotice('');
    try {
      const result = await apiJson('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose })
      });
      setResendNotice(result.message || 'Kode baru telah dikirim.');
      if (result.devOtp) setDevOtp(result.devOtp);
      setCode('');
      codeInputRef.current?.focus();
      setResendCooldown(60);
    } catch (requestError) {
      setError(requestError.message || 'Kode belum dapat dikirim ulang.');
    } finally {
      setIsResending(false);
    }
  };

  if (done) {
    return (
      <main className={layout.authShell}>
        <section className={layout.authCard}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><CheckCircle2 className="h-6 w-6" /></div>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink-900">Password diperbarui</h1>
          <p className={typography.helperRelaxed}>
            Password akun <strong className="text-ink-700">{completedEmail || email}</strong> sudah diganti.
            Silakan masuk dengan password baru Anda.
          </p>
          <button type="button" onClick={() => navigateTo('login', { replace: true })} className="auth-primary-button mt-7">Masuk sekarang</button>
        </section>
      </main>
    );
  }

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <button type="button" onClick={() => { clearVerification(); navigateTo(isReset ? 'forgot-password' : 'register', { replace: true }); }} className="mb-6 inline-flex min-h-6 items-center gap-1 px-1 text-xs font-bold text-ink-400 transition hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Kembali</button>

        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Cek email Anda</h1>
        <p className={typography.helperRelaxed}>
          {isReset
            ? 'Kami mengirim kode pemulihan ke '
            : 'Kami mengirim kode verifikasi ke '}
          <strong className="text-ink-700">{email}</strong>. Buka kotak masuk (dan folder spam),
          lalu masukkan kodenya di bawah. Kode berlaku 10 menit.
        </p>

        {devOtp && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-caption font-bold uppercase tracking-wide text-amber-700">Mode pengembangan — pengiriman email belum aktif</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Email belum dikonfigurasi, jadi kode ditampilkan di sini. Kode Anda:{' '}
              <strong className="font-mono text-base tracking-[0.2em]">{devOtp}</strong>
            </p>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="auth-label">Kode verifikasi</span>
            <span className={controls.inputWrap}>
              <input
                ref={codeInputRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => { setCode(event.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="Kode"
                className="font-mono tracking-[0.35em]"
              />
            </span>
          </label>

          {isReset && (
            <>
              <label className="block">
                <span className="auth-label">Password baru</span>
                <span className={controls.inputWrap}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError(''); }}
                    placeholder="Minimal 8 karakter"
                  />
                </span>
              </label>
              <label className="block">
                <span className="auth-label">Ulangi password baru</span>
                <span className={controls.inputWrap}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => { setConfirmation(event.target.value); setError(''); }}
                    placeholder="Tulis ulang password"
                  />
                </span>
              </label>
            </>
          )}

          {error && <div role="alert" className="auth-alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          {resendNotice && <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs font-semibold text-brand-800">{resendNotice}</div>}

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting
              ? <><span className="auth-spinner" />Memverifikasi…</>
              : (isReset ? 'Simpan password baru' : 'Verifikasi & buat akun')}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button type="button" onClick={resend} disabled={isResending || resendCooldown > 0} className="auth-link text-xs font-bold disabled:opacity-50">
            {resendCooldown > 0 ? `Kirim ulang kode (${resendCooldown} dtk)` : 'Kirim ulang kode'}
          </button>
        </div>

        {!isReset && (
          <p className="mt-4 text-center text-caption leading-relaxed text-ink-400">
            Salah menulis email?{' '}
            <button type="button" onClick={() => { clearVerification(); navigateTo('register', { replace: true }); }} className="auth-link">Daftar ulang</button>
          </p>
        )}
      </section>
    </main>
  );
};
