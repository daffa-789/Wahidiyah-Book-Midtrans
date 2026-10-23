import React from 'react';
import { BookOpen, Lock } from 'lucide-react';

export const CATEGORY_STYLES = {
  'Tasawuf': {
    bg: 'bg-brand-50/90',
    text: 'text-brand-700',
    border: 'border-brand-200/70',
    dot: 'bg-brand-600'
  },
  'Bimbingan': {
    bg: 'bg-semantic-infoLight',
    text: 'text-semantic-info',
    border: 'border-semantic-info/30',
    dot: 'bg-semantic-info'
  },
  'Kitab Kuning': {
    bg: 'bg-gold-400/15',
    text: 'text-gold-700',
    border: 'border-gold-500/40',
    dot: 'bg-gold-500'
  },
  'Ajaran': {
    bg: 'bg-semantic-infoLight',
    text: 'text-semantic-info',
    border: 'border-semantic-info/30',
    dot: 'bg-semantic-info'
  },
  'Tauhid': {
    bg: 'bg-brand-50/90',
    text: 'text-brand-800',
    border: 'border-brand-200/70',
    dot: 'bg-brand-600'
  },
  'Doa & Zikir': {
    bg: 'bg-cream-100',
    text: 'text-ink-700',
    border: 'border-cream-300/70',
    dot: 'bg-ink-400'
  },
  'Sejarah': {
    bg: 'bg-semantic-warningLight',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning/30',
    dot: 'bg-semantic-warning'
  },
  'Amalan': {
    bg: 'bg-semantic-successLight',
    text: 'text-semantic-success',
    border: 'border-semantic-success/30',
    dot: 'bg-semantic-success'
  }
};

export const BookCard = React.memo(({ book, isLocked, onBookClick, onPaywallClick, hasError, onError }) => {
  const catStyle = CATEGORY_STYLES[book.category] || {
    bg: 'bg-cream-100',
    text: 'text-ink-700',
    border: 'border-cream-300/70',
    dot: 'bg-ink-300'
  };

  return (
    <div
      data-testid={`book-card-${book.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Buka buku ${book.title}${book.author ? ` karya ${book.author}` : ''}${isLocked ? ' (Terkunci Pro)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isLocked) onPaywallClick(book);
          else onBookClick(book);
        }
      }}
      className="group relative bg-cream-50 rounded-3xl border border-cream-300/80 p-3.5 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-brand-900/10 hover:border-brand-300/80 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden ring-1 ring-ink-800/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      onClick={() => {
        if (isLocked) onPaywallClick(book);
        else onBookClick(book);
      }}
    >
      <div className="relative w-full aspect-[3/4.2] bg-ink-800 rounded-2xl overflow-hidden mb-3 flex items-center justify-center shadow-md shadow-cream-300/80 group-hover:shadow-lg group-hover:shadow-brand-900/15 transition-all duration-300">
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-ink-900/40 via-cream-50/20 to-transparent pointer-events-none z-10 rounded-l-2xl" />
        <div className="absolute inset-0 ring-1 ring-inset ring-ink-900/10 pointer-events-none z-10 rounded-2xl" />

        {!hasError && book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
            decoding="async"
            onError={() => onError(book.id)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center select-none w-full h-full bg-gradient-to-b from-brand-900 to-ink-900">
            <BookOpen className="w-8 h-8 text-gold-400 mb-2 opacity-70 group-hover:scale-110 transition-transform" />
            <span className="text-micro font-bold text-cream-200 line-clamp-2 px-1">
              {book.title}
            </span>
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 z-20">
          {isLocked ? (
            <span className="flex items-center gap-1 bg-ink-900/90 text-gold-300 text-micro font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border border-gold-500/30">
              <Lock className="w-3 h-3 text-gold-400" />
              <span>PRO</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-brand-800/90 text-cream-50 text-micro font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md border border-brand-600/40">
              GRATIS
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-micro font-bold px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
              {book.category}
            </span>
          </div>

          <h3 className="font-display font-bold text-body text-ink-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors pt-0.5">
            {book.title}
          </h3>

          <p className="text-caption text-ink-500 font-medium truncate">
            {book.author || 'Penyusun Wahidiyah'}
          </p>
        </div>

        {isLocked ? (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-testid={`locked-btn-${book.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPaywallClick(book);
            }}
            className="w-full min-h-11 mt-3.5 py-2.5 px-3 bg-gradient-to-r from-gold-600 via-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-700 active:from-gold-600 active:to-gold-700 text-cream-50 text-small font-bold rounded-xl shadow-sm hover:shadow-md hover:shadow-gold-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
            <span>Terkunci (Pro)</span>
          </button>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-testid={`read-btn-${book.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onBookClick(book);
            }}
            className="w-full min-h-11 mt-3.5 py-2.5 px-3 bg-gradient-to-r from-brand-800 to-brand-900 hover:from-brand-900 active:from-brand-900 text-cream-50 text-small font-bold rounded-xl shadow-sm hover:shadow-md hover:shadow-brand-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
            <span>Baca</span>
          </button>
        )}
      </div>
    </div>
  );
});
