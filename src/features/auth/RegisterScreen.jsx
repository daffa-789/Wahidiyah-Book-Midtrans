import { useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, FileText, Lock, Mail, UserRound, X } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import { apiJson } from '@lib/api';
import { ServerStatusBanner } from '@ui/ServerStatusBanner';
import { PhoneInput } from '@ui/PhoneInput';
import { AuthBrandHeader } from './AuthBrandHeader';
import { layout, controls } from '@lib/styles';
import { useSubmit } from '@lib/useSubmit';

const POLICY_COPY = {
  terms: {
    title: 'Ketentuan Layanan',
    paragraphs: [
      'Ini adalah teks ketentuan sementara untuk prototipe Buku Wahidiyah. Akun digunakan untuk mengakses koleksi digital dan fitur yang tersedia sesuai peran akun.',
      'Pengguna menjaga kerahasiaan password, menggunakan layanan dengan itikad baik, dan tidak menyebarkan kembali materi berhak cipta tanpa izin.',
      'Ketentuan ini akan diganti dengan dokumen resmi sebelum aplikasi dipublikasikan.'
    ]
  },
  privacy: {
    title: 'Kebijakan Privasi',
    paragraphs: [
      'Prototipe menyimpan nama, email, nomor WhatsApp, password yang sudah di-hash, serta pengaturan akun di database Supabase Cloud untuk menjalankan fitur aplikasi.',
      'Aplikasi mengirim kode verifikasi OTP melalui WhatsApp atau email sesuai preferensi pendaftaran Anda.',
      'Kebijakan ini akan diperbarui dengan kebijakan resmi saat aplikasi dipublikasikan.'
    ]
  }
};

const PolicyModal = ({ type, onClose }) => {
  const policy = POLICY_COPY[type];
  const panelRef = useRef(null);

  useDialogFocusTrap(panelRef, { isOpen: Boolean(type), onClose });

  if (!type || !policy) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="policy-title">
      <article ref={panelRef} tabIndex={-1} className="w-full max-w-lg rounded-3xl bg-cream-50 p-6 shadow-2xl page-transition focus:outline-none">
        <div className={layout.rowEnd}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><FileText className="h-5 w-5" /></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-500 transition hover:bg-cream-200 hover:text-ink-700" aria-label="Tutup"><X className="h-5 w-5" /></button>
        </div>
        <h2 id="policy-title" className="mt-4 text-xl font-black tracking-tight text-ink-900">{policy.title}</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-500">{policy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <button type="button" onClick={onClose} className="auth-primary-button mt-6">Saya mengerti</button>
      </article>
    </div>
  );
};

export const RegisterScreen = () => {
  const { navigateTo, setVerification } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const deliveryMethod = 'email';

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { error, setError, isSubmitting, runSubmit } = useSubmit('Pendaftaran belum dapat diproses.');
  const [policy, setPolicy] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return setError('Nama lengkap wajib diisi.');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Masukkan alamat email yang valid.');
    
    const standardPhone = String(phone || '').trim().replace(/[^0-9]/g, '');
    if (!standardPhone || standardPhone.length < 8 || standardPhone.length > 15) {
      return setError('Masukkan nomor WhatsApp yang valid.');
    }

    if (password.length < 8) return setError('Password minimal 8 karakter.');
    if (password !== confirmation) return setError('Konfirmasi password belum sesuai.');
    if (!agreed) return setError('Setujui ketentuan layanan dan kebijakan privasi terlebih dahulu.');

    return runSubmit(async () => {
      const targetEmail = email.trim().toLowerCase();
      const result = await apiJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: targetEmail,
          phone: standardPhone,
          password,
          deliveryMethod
        })
      });

      setVerification({
        email: targetEmail,
        phone: standardPhone,
        method: deliveryMethod,
        identifier: result.identifier,
        purpose: 'register',
        deliveredBy: result.deliveredBy,
        devOtp: result.devOtp
      });
      navigateTo('verify-email');
    });
  };

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <AuthBrandHeader title="Buat akun" />

        <ServerStatusBanner />

        <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
          <label className="block"><span className="auth-label">Nama lengkap</span><span className={controls.inputWrap}><UserRound className="auth-input-icon" /><input value={name} onChange={(event) => { setName(event.target.value); setError(''); }} autoComplete="name" placeholder="Nama Anda" /></span></label>
          <label className="block"><span className="auth-label">Alamat email</span><span className={controls.inputWrap}><Mail className="auth-input-icon" /><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} autoComplete="email" placeholder="nama@email.com" /></span></label>
          
          <div className="block">
            <label htmlFor="reg-phone" className="auth-label">Nomor WhatsApp <span className="font-normal text-ink-400">(untuk pemulihan akun)</span></label>
            <PhoneInput
              id="reg-phone"
              value={phone}
              onChange={(val) => { setPhone(val); setError(''); }}
              className="mt-1.5"
            />
          </div>

          <label className="block"><span className="auth-label">Password</span><span className={controls.inputWrap}><Lock className="auth-input-icon" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoComplete="new-password" placeholder="Minimal 8 karakter" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="auth-icon-button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
          <label className="block"><span className="auth-label">Konfirmasi password</span><span className={controls.inputWrap}><Lock className="auth-input-icon" /><input type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(''); }} autoComplete="new-password" placeholder="Tulis ulang password" /><button type="button" onClick={() => setShowConfirmation((value) => !value)} className="auth-icon-button" aria-label={showConfirmation ? 'Sembunyikan konfirmasi password' : 'Tampilkan ulang password'}>{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>

          <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs leading-relaxed text-ink-500">
            <input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setError(''); }} className="mt-0.5 h-6 w-6 shrink-0 rounded border-cream-300 accent-brand-700" />
            <span>Saya menyetujui <button type="button" onClick={(event) => { event.preventDefault(); setPolicy('terms'); }} className="auth-link">Ketentuan Layanan</button> dan <button type="button" onClick={(event) => { event.preventDefault(); setPolicy('privacy'); }} className="auth-link">Kebijakan Privasi</button>.</span>
          </label>

          {error && <div role="alert" className="auth-alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          <button type="submit" disabled={isSubmitting} className="auth-primary-button">{isSubmitting ? <><span className="auth-spinner" />Mengirim kode…</> : 'Daftar & verifikasi email'}</button>
        </form>

        <div className="mt-6 border-t border-cream-200 pt-5 text-center text-sm text-ink-500">Sudah punya akun? <button type="button" onClick={() => navigateTo('login')} className="auth-link font-bold">Masuk</button></div>
      </section>
      <PolicyModal type={policy} onClose={() => setPolicy(null)} />
    </main>
  );
};
