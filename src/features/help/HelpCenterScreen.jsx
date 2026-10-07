import { useState } from 'react';
import { ChevronDown, Mail, MessageCircleQuestion, Clock } from 'lucide-react';
import { FAQ_ITEMS } from '@data/mockData';
import { layout, typography, surfaces, controls } from '@lib/styles';

const CONTACT_EMAIL = 'support@bukuku.id';

export const HelpCenterScreen = () => {
  const [expandedId, setExpandedId] = useState(FAQ_ITEMS[0]?.id ?? null);

  const toggleAccordion = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-[640px] flex flex-col justify-between px-4 sm:px-6 py-6 bg-cream-50 page-transition">
      <div className={layout.contentCenter}>

        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center shrink-0">
            <MessageCircleQuestion className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className={typography.sectionTitle}>Pusat Bantuan</h1>
          </div>
        </div>

        <section className="mt-6">
          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, index) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-cream-50 overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? 'border-brand-300 shadow-md shadow-brand-900/5'
                      : 'border-cream-300 shadow-sm hover:border-brand-200 hover:shadow'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    aria-expanded={isExpanded}
                    className="w-full min-h-14 px-4 py-3.5 flex items-center gap-3.5 text-left transition cursor-pointer"
                  >

                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-caption font-black shrink-0 transition ${
                      isExpanded
                        ? 'bg-brand-700 text-white'
                        : 'bg-cream-200 text-ink-400'
                    }`}>
                      {index + 1}
                    </span>

                    <span className={`flex-1 text-sm font-bold leading-snug transition ${
                      isExpanded ? 'text-brand-900' : 'text-ink-800'
                    }`}>
                      {item.question}
                    </span>

                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-brand-800' : 'text-ink-300'
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="pl-[3.5rem] pr-1 text-xs text-ink-500 leading-relaxed border-t border-cream-200 pt-3">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <div className="grid gap-3 sm:grid-cols-2">

            <div className="rounded-2xl border border-cream-300 bg-cream-50 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink-900">Email Dukungan</h3>
              <p className="mt-0.5 text-xs text-ink-400 leading-relaxed">
                Kirim kendala teknis atau pertanyaan seputar akun & langganan.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-flex items-center min-h-11 text-xs font-bold text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="rounded-2xl border border-cream-300 bg-cream-50 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink-900">Jam Layanan</h3>
              <p className="mt-0.5 text-xs text-ink-400 leading-relaxed">
                Tim kami siap membantu pada hari kerja.
              </p>
              <p className="mt-3 text-xs font-bold text-ink-800">
                Senin – Jumat · 08.00 – 17.00 WIB
              </p>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
};
