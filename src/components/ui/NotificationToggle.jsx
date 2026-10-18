import { useCallback, useEffect, useState } from 'react';
import { BellRing, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPushStatus,
  enablePushNotifications,
  disablePushNotifications
} from '@lib/push';

/**
 * Tombol aktif/nonaktifkan notifikasi pengingat agenda.
 *
 * `variant="panel"` dipakai di halaman Profil (kartu penuh dengan penjelasan),
 * `variant="compact"` dipakai di layar publik / header (hanya tombol).
 */
export const NotificationToggle = ({ variant = 'panel', className = '' }) => {
  const [status, setStatus] = useState({ supported: true, subscribed: false, permission: 'default' });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getPushStatus());
    } catch {
      setStatus({ supported: false, subscribed: false, permission: 'unsupported' });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleToggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = status.subscribed
        ? await disablePushNotifications()
        : await enablePushNotifications();

      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Notifikasi gagal diubah.');
      }
      await refresh();
    } catch (error) {
      toast.error(error?.message || 'Notifikasi gagal diubah. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }, [busy, status.subscribed, refresh]);

  if (!status.supported) return null;

  const isOn = status.subscribed;
  const blocked = status.permission === 'denied';

  const Icon = busy ? Loader2 : isOn ? BellRing : BellOff;
  const label = busy
    ? 'Memproses…'
    : isOn
      ? 'Notifikasi aktif'
      : blocked
        ? 'Notifikasi diblokir'
        : 'Aktifkan notifikasi';

  const buttonClass = isOn
    ? 'border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100'
    : 'border-cream-300 bg-cream-50 text-ink-600 hover:bg-cream-100';

  if (variant === 'compact' || variant === 'header-compact') {
    const isHeader = variant === 'header-compact';
    const compactClass = isHeader
      ? (isOn
          ? 'border-emerald-400/40 bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800 shadow-sm'
          : 'border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm')
      : buttonClass;

    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy || blocked}
        aria-pressed={isOn}
        title={label}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-caption font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60 ${compactClass} ${className}`}
      >
        <Icon className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} strokeWidth={2} />
        <span>{isOn ? 'Notifikasi Aktif' : 'Ingatkan Pengumuman'}</span>
      </button>
    );
  }

  return (
    <div className={`mb-6 rounded-2xl border border-cream-300 bg-cream-100 p-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-800">Pengumuman & Pengingat Mujahadah</p>
          <p className="mt-0.5 text-caption leading-relaxed text-ink-400">
            {blocked
              ? 'Izin notifikasi diblokir di peramban ini. Aktifkan lewat setelan situs, lalu muat ulang halaman.'
              : 'Dapatkan pemberitahuan otomatis saat agenda mujahadah baru diumumkan serta pengingat H-1 sebelum majelis dimulai.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || blocked}
          aria-pressed={isOn}
          data-testid="notification-toggle"
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-caption font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
        >
          <Icon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} strokeWidth={2} />
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationToggle;
