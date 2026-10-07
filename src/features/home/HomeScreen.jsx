import React, { useState, useCallback, useRef, useMemo } from 'react';
import { BookOpen, Lock, Sparkles, Search, X } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import HeroCarousel from './HeroCarousel';

const CATEGORIES = [
  'Semua',
  'Tasawuf',
  'Bimbingan',
  'Kitab Kuning',
  'Ajaran',
  'Tauhid',
  'Doa & Zikir',
  'Sejarah',
  'Amalan'
];

const CATEGORY_STYLES = {
  'Tasawuf': {
    bg: 'bg-brand-50/90',
    text: 'text-brand-700',
    border: 'border-brand-200/70',
    dot: 'bg-brand-600'
  },
  'Bimbingan': {
    bg: 'bg-blue-50/90',
    text: 'text-blue-700',
    border: 'border-blue-200/70',
    dot: 'bg-blue-500'
  },
  'Kitab Kuning': {
    bg: 'bg-amber-50/90',
    text: 'text-amber-800',
    border: 'border-amber-200/70',
    dot: 'bg-amber-500'
  },
  'Ajaran': {
    bg: 'bg-indigo-50/90',
    text: 'text-indigo-700',
    border: 'border-indigo-200/70',
    dot: 'bg-indigo-500'
  },
  'Tauhid': {
    bg: 'bg-brand-50/90',
    text: 'text-brand-800',
    border: 'border-brand-200/70',
    dot: 'bg-brand-600'
  },
  'Doa & Zikir': {
    bg: 'bg-rose-50/90',
    text: 'text-rose-700',
    border: 'border-rose-200/70',
    dot: 'bg-rose-500'
  },
  'Sejarah': {
    bg: 'bg-amber-50/90',
    text: 'text-amber-800',
    border: 'border-amber-200/70',
    dot: 'bg-amber-500'
  },
  'Amalan': {
    bg: 'bg-cyan-50/90',
    text: 'text-cyan-700',
    border: 'border-cyan-200/70',
    dot: 'bg-cyan-500'
  }
};

const BookCard = React.memo(({ book, isLocked, onBookClick, onPaywallClick, hasError, onError }) => {
  const catStyle = CATEGORY_STYLES[book.category] || {
    bg: 'bg-cream-100',
    text: 'text-ink-700',
    border: 'border-cream-300/70',
    dot: 'bg-ink-300'
  };

  return (
    <div
      data-testid={`book-card-${book.id}`}
      className="group relative bg-cream-50 rounded-3xl border border-cream-300/80 p-3.5 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-brand-900/10 hover:border-brand-300/80 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden ring-1 ring-ink-800/5"
      onClick={() => onBookClick(book)}
    >

      <div className="relative w-full aspect-[3/4.2] bg-ink-800 rounded-2xl overflow-hidden mb-3 flex items-center justify-center shadow-md shadow-cream-300/80 group-hover:shadow-lg group-hover:shadow-brand-900/15 transition-all duration-300">
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/20 to-transparent pointer-events-none z-10 rounded-l-2xl" />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none z-10 rounded-2xl" />

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
          <div className="w-full h-full bg-gradient-to-br from-brand-900 via-brand-800 to-brand-800 p-4 flex flex-col justify-end text-white text-left">

            <div>
              <p className="font-extrabold text-sm leading-snug line-clamp-2">{book.title}</p>
              <p className="text-micro text-brand-100 mt-1">{book.author}</p>
            </div>
          </div>
        )}

        {isLocked && (
          <div
            data-testid={`lock-badge-${book.id}`}
            className="absolute top-2.5 left-2.5 z-20 bg-gradient-to-r from-amber-700 to-amber-800 text-white text-micro font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-amber-500/30 border border-amber-300/30 tracking-wider uppercase"
          >
            <Lock className="w-3 h-3" />
            <span>Pro</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className={`inline-flex items-center text-micro font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              {book.category}
            </span>
            <span className="text-caption font-semibold text-ink-500">
              {book.pages} Hal
            </span>
          </div>
          <h3 className="font-bold text-sm sm:text-lead text-ink-900 line-clamp-1 leading-snug group-hover:text-brand-700 transition-colors duration-200">
            {book.title}
          </h3>
          <p className="text-caption font-medium text-ink-400 line-clamp-1 mt-0.5">{book.author}</p>
          <p className="text-caption text-ink-500 line-clamp-2 mt-1.5 leading-relaxed">
            {book.description}
          </p>
        </div>

        {isLocked ? (
          <button
            type="button"
            data-testid={`read-btn-${book.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPaywallClick(book);
            }}
            className="w-full min-h-11 mt-3.5 py-2.5 px-3 bg-gradient-to-r from-amber-700 via-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 active:from-amber-700 active:to-orange-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md hover:shadow-amber-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
            <span>Terkunci (Pro)</span>
          </button>
        ) : (
          <button
            type="button"
            data-testid={`read-btn-${book.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onBookClick(book);
            }}
            className="w-full min-h-11 mt-3.5 py-2.5 px-3 bg-gradient-to-r from-brand-800 to-brand-900 hover:from-brand-900 active:from-brand-900 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md hover:shadow-brand-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
            <span>Baca</span>
          </button>
        )}
      </div>
    </div>
  );
});

export const HomeScreen = () => {
  const {
    books,
    catalogError,
    refreshBooks,
    openReader,
    user,
    navigateTo,
    carouselSlides
  } = useApp();

  const [imgErrors, setImgErrors] = useState({});
  const [paywallBook, setPaywallBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const paywallPanelRef = useRef(null);

  const handleImgError = useCallback((id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleBookClick = useCallback((book) => {
    const isLocked = book.isLocked && !user.isPro;
    if (isLocked) {
      setPaywallBook(book);
    } else {
      openReader(book);
    }
  }, [user.isPro, openReader]);

  useDialogFocusTrap(paywallPanelRef, { isOpen: Boolean(paywallBook), onClose: () => setPaywallBook(null) });

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchCategory = selectedCategory === 'Semua' || book.category === selectedCategory;
      if (!matchCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (book.title || '').toLowerCase().includes(q) ||
        (book.author || '').toLowerCase().includes(q) ||
        (book.description || '').toLowerCase().includes(q) ||
        (book.category || '').toLowerCase().includes(q)
      );
    });
  }, [books, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col justify-between bg-cream-50 page-transition min-h-[calc(100vh-2rem)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 flex flex-col justify-between items-center">
        {catalogError ? (
          <section className="my-auto w-full max-w-xl rounded-3xl border border-dashed border-rose-300 bg-rose-50 p-10 text-center" role="alert">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"><BookOpen className="h-7 w-7" /></div>
            <h1 className="mt-5 font-display text-xl font-bold tracking-tight text-ink-900">Koleksi gagal dimuat</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{catalogError}</p>
            <button type="button" onClick={() => refreshBooks().catch(() => {})} className="mt-5 rounded-2xl bg-brand-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700">Coba muat ulang</button>
          </section>
        ) : books.length === 0 ? (
          <section className="my-auto w-full max-w-xl rounded-3xl border border-dashed border-cream-300 bg-cream-100 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><BookOpen className="h-7 w-7" /></div>
            <h1 className="mt-5 font-display text-xl font-bold tracking-tight text-ink-900">Koleksi sedang disiapkan</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-400">Belum ada buku yang tersedia. Administrator dapat menambahkan buku beserta thumbnail dan lampiran bacaan dari dashboard.</p>
          </section>
        ) : (
          <>
            {carouselSlides.length > 0 && (
              <div className="w-full mb-5 sm:mb-7">
                <HeroCarousel slides={carouselSlides} />
              </div>
            )}

            {/* Pencarian Cepat & Filter Kategori */}
            <div className="w-full space-y-3 mb-5 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul kitab, penulis, atau topik..."
                    className="w-full pl-10 pr-9 py-2.5 bg-cream-100/90 border border-cream-300 rounded-2xl text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-0.5 rounded-full hover:bg-cream-200"
                      aria-label="Hapus pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-ink-500 font-semibold px-0.5">
                  <span>{filteredBooks.length} Kitab {selectedCategory !== 'Semua' ? `• ${selectedCategory}` : ''}</span>
                  {(searchQuery || selectedCategory !== 'Semua') && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
                      className="text-brand-700 hover:underline font-bold text-xs"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Horizontal Scrollable Category Chips */}
              <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-brand-700 text-white shadow-sm shadow-brand-900/15'
                            : 'bg-cream-100/90 border border-cream-300/70 text-ink-600 hover:bg-cream-200/70 hover:text-ink-900'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <section className="my-8 w-full max-w-md rounded-3xl border border-dashed border-cream-300 bg-cream-100/60 p-8 text-center mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-200 text-ink-500">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-ink-900">Tidak ada kitab yang cocok</h3>
                <p className="mt-1 text-xs text-ink-400">
                  Coba kata kunci lain atau pilih kategori kitab yang berbeda.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
                  className="mt-4 rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-800"
                >
                  Tampilkan Semua Kitab
                </button>
              </section>
            ) : (
              <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5 lg:gap-6 justify-center items-stretch">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isLocked={Boolean(book.isLocked && !user.isPro)}
                    onBookClick={handleBookClick}
                    onPaywallClick={setPaywallBook}
                    hasError={Boolean(imgErrors[book.id])}
                    onError={handleImgError}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {paywallBook && (
        <div
          data-testid="paywall-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-modal-title"
          onClick={() => setPaywallBook(null)}
        >
          <div
            ref={paywallPanelRef}
            tabIndex={-1}
            className="bg-cream-50 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-cream-200 text-center space-y-4 duration-200 focus-visible:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-3xl mx-auto flex items-center justify-center text-amber-600 shadow-inner border border-amber-300/40">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-micro font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Koleksi Eksklusif
              </span>
              <h3 id="paywall-modal-title" className="text-base font-extrabold text-ink-900 mt-2">
                Akses Khusus Pembaca Pro
              </h3>
              <p className="text-xs text-ink-500 mt-1.5 leading-relaxed px-2">
                Buku <strong className="text-ink-900">"{paywallBook.title}"</strong> merupakan bagian dari koleksi eksklusif Pro. Silakan tingkatkan akun Anda untuk membaca seluruh naskah tanpa batas.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                data-testid="paywall-upgrade-btn"
                onClick={() => {
                  setPaywallBook(null);
                  navigateTo('pro');
                }}
                className="w-full min-h-11 py-3 bg-gradient-to-r from-brand-800 to-brand-900 hover:from-brand-900 text-white font-bold text-xs rounded-2xl shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Lihat Paket Langganan Pro</span>
              </button>
              <button
                type="button"
                onClick={() => setPaywallBook(null)}
                className="w-full min-h-11 py-2.5 text-xs text-ink-400 hover:text-ink-800 font-semibold transition"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
