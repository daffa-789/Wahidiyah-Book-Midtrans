import { BookOpen, Shield, Award } from 'lucide-react';
import { layout, typography, surfaces, controls } from '@lib/styles';

export const AboutScreen = () => {
  return (
    <div className="min-h-[700px] flex flex-col justify-between px-4 sm:px-6 py-6 bg-cream-50 page-transition">
      <div className={layout.contentCenter}>

        <div className="text-center my-4">
          <div className="w-20 h-20 bg-gradient-to-tr from-brand-800 to-brand-900 rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg shadow-brand-700/20 mb-3">
            <BookOpen className="w-10 h-10 stroke-[2]" />
          </div>
          <h3 className="text-xl font-bold text-ink-900">Buku Wahidiyah</h3>
          <p className="text-xs text-brand-800 font-semibold mt-0.5">Perpustakaan Digital Sholawat Wahidiyah</p>
        </div>

        <div className="space-y-4 mt-6">

          <div className="bg-cream-100/80 rounded-3xl p-5 border border-cream-200 space-y-2">
            <div className={layout.rowGap2}>
              <Award className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-800">Tujuan Aplikasi</h4>
            </div>
            <p className="text-xs text-ink-500 leading-relaxed text-justify">
              Mengelola profil bacaan, melacak riwayat langganan, dan memberikan akses literatur ajaran Sholawat Wahidiyah secara digital, terpadu, dan berkesinambungan bagi seluruh pengamal di mana pun berada.
            </p>
          </div>

          <div className="bg-cream-100/80 rounded-3xl p-5 border border-cream-200 space-y-3 text-xs">
            <div className={layout.rowGap2}>
              <Shield className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-800">Informasi Versi</h4>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-cream-300/60">
              <span className="text-ink-400">Versi Sistem</span>
              <span className="font-bold text-ink-900 bg-brand-100 text-brand-600 text-caption px-2.5 py-0.5 rounded-full">
                1.0.0
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-cream-300/60">
              <span className="text-ink-400">Terakhir Diperbarui</span>
              <span className="font-medium text-ink-800">20 Mei 2024</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-ink-400">Layanan Support</span>
              <span className="font-semibold text-brand-800">support@bukuku.id</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
