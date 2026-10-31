import { Shield } from 'lucide-react';
import { layout } from '@lib/styles';

export const AboutScreen = () => {
  return (
    <div className="min-h-[700px] flex flex-col justify-between px-4 sm:px-6 py-6 bg-cream-50">
      <div className={layout.contentCenter}>
        <div className="bg-cream-100/80 rounded-3xl p-5 border border-cream-200 space-y-3 text-xs">
          <div className={layout.rowGap2}>
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-800">
              Informasi Versi
            </h4>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-cream-300/60">
            <span className="text-ink-400">Versi Sistem</span>
            <span className="font-bold text-ink-900 bg-brand-100 text-brand-600 text-caption px-2.5 py-0.5 rounded-full">
              1.0.0
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-cream-300/60">
            <span className="text-ink-400">Terakhir Diperbarui</span>
            <span className="font-medium text-ink-800">30 Oktober 2026</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-ink-400">Layanan Support</span>
            <span className="font-semibold text-brand-800">support@bukuku.id</span>
          </div>
        </div>
      </div>
    </div>
  );
};
