import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { BookOpen, Lock, Sparkles, Search, X, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import { BookGridSkeleton } from '@ui/Skeleton';
import { apiJson } from '@lib/api';
import HeroCarousel from './HeroCarousel';

const CATEGORY_STYLES = {
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

export const HomeScreen = () => {
  const {
    books,
    loadingCatalog,
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
  const [sortBy, setSortBy] = useState('newest');
  const [recentReading, setRecentReading] = useState([]);

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

  // Muat riwayat membaca terbaru dari server atau penyimpanan lokal
  useEffect(() => {
    let active = true;
    const fetchRecent = async () => {
      try {
        if (!user) {
          setRecentReading([]);
          return;
        }
        const res = await apiJson('/api/reading-progress');
        if (active && res?.reading_progress?.length > 0) {
          setRecentReading(res.reading_progress);
          return;
        }
      } catch {
        // Fallback ke penyimpanan lokal bila offline atau rute belum tersinkron
      }

      try {
        if (typeof window !== 'undefined' && window.localStorage && books.length > 0) {
          const keys = Object.keys(localStorage).filter((k) => k.startsWith('last_read_page_'));
          if (keys.length > 0) {
            const items = keys.map((k) => {
              const bId = k.replace('last_read_page_', '');
              const b = books.find((x) => x.id === bId);
              const p = Number(localStorage.getItem(k)) || 1;
              return b ? { book: b, last_page: p, book_id: b.id } : null;
            }).filter(Boolean);
            if (active) setRecentReading(items.slice(0, 3));
          }
        }
      } catch {
        // Abaikan bila storage tidak dapat diakses
      }
    };
    fetchRecent();
    return () => { active = false; };
  }, [user, books]);

  // Daftar kategori yang tersedia di koleksi
  const categories = useMemo(() => {
    const set = new Set();
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return ['Semua', ...Array.from(set)];
  }, [books]);

  // Filter dan pengurutan buku
  const filteredBooks = useMemo(() => {
    let list = [...books];

    if (selectedCategory !== 'Semua') {
      list = list.filter((b) => (b.category || 'Umum') === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) =>
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortBy === 'title_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'title_desc') {
      list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list;
  }, [books, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="flex-1 flex flex-col justify-between bg-cream-50 page-transition min-h-[calc(100vh-2rem)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 flex flex-col justify-between items-center">
        {loadingCatalog ? (
          <div className="w-full">
            <BookGridSkeleton count={10} />
          </div>
        ) : catalogError ? (
          <section className="my-auto w-full max-w-xl rounded-3xl border border-dashed border-semantic-danger/40 bg-semantic-dangerLight p-10 text-center" role="alert">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-semantic-danger/15 text-semantic-danger"><BookOpen className="h-7 w-7" /></div>
            <h1 className="mt-5 font-display text-h2 font-bold tracking-tight text-ink-900">Koleksi gagal dimuat</h1>
            <p className="mx-auto mt-2 max-w-md text-body leading-relaxed text-ink-500">{catalogError}</p>
            <button type="button" onClick={() => refreshBooks().catch(() => {})} className="mt-5 rounded-2xl bg-brand-700 px-4 py-3 text-small font-bold text-cream-50 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Coba muat ulang</button>
          </section>
        ) : books.length === 0 ? (
          <section className="my-auto w-full max-w-xl rounded-3xl border border-dashed border-cream-300 bg-cream-100 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><BookOpen className="h-7 w-7" /></div>
            <h1 className="mt-5 font-display text-h2 font-bold tracking-tight text-ink-900">Koleksi sedang disiapkan</h1>
            <p className="mx-auto mt-2 max-w-md text-body leading-relaxed text-ink-500">Belum ada buku yang tersedia. Administrator dapat menambahkan buku beserta thumbnail dan lampiran bacaan dari dashboard.</p>
          </section>
        ) : (
          <div className="w-full">
            {carouselSlides.length > 0 && (
              <div className="w-full mb-5 sm:mb-7">
                <HeroCarousel slides={carouselSlides} />
              </div>
            )}

            {/* Bagian Lanjutkan Membaca */}
            {recentReading.length > 0 && !searchQuery && selectedCategory === 'Semua' && (
              <section className="w-full mb-7" aria-label="Lanjutkan Membaca">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-body font-bold text-ink-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-700" />
                    <span>Lanjutkan Membaca</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {recentReading.slice(0, 3).map((item) => {
                    const b = item.book || books.find((x) => x.id === item.book_id);
                    if (!b) return null;
                    return (
                      <div
                        key={item.id || item.book_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleBookClick(b)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleBookClick(b);
                          }
                        }}
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-cream-300/80 bg-cream-50 hover:bg-cream-100/70 hover:border-brand-300/80 transition cursor-pointer shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        <div className="w-12 h-16 rounded-xl bg-ink-800 shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                          {b.coverUrl ? (
                            <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-cream-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-small font-bold text-ink-900 truncate group-hover:text-brand-700 transition">
                            {b.title}
                          </p>
                          <p className="text-caption text-ink-500 mt-0.5 truncate">
                            {b.author || b.category}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-micro font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                              Halaman {item.last_page}{item.total_pages ? ` / ${item.total_pages}` : ''}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Bilah Pencarian dan Pengurutan */}
            <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul kitab, penyusun, atau ajaran..."
                  className="w-full rounded-2xl border border-cream-300 bg-cream-50 pl-10 pr-10 py-2.5 text-body text-ink-900 placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 transition shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Bersihkan pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-ink-400 hover:text-ink-700 hover:bg-cream-200/60 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="sort-books" className="text-caption font-semibold text-ink-500 whitespace-nowrap">
                  Urutkan:
                </label>
                <select
                  id="sort-books"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-2xl border border-cream-300 bg-cream-50 px-3 py-2 text-caption font-bold text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer shadow-sm"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="title_asc">Judul (A-Z)</option>
                  <option value="title_desc">Judul (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Pilihan Kategori */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none" role="tablist" aria-label="Kategori Buku">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-4 py-2 rounded-2xl text-caption font-bold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-700 text-cream-50 shadow-md shadow-brand-700/20'
                        : 'bg-cream-100/80 text-ink-600 hover:bg-cream-200/80 border border-cream-300/60'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Grid Koleksi Buku atau Keadaan Kosong */}
            {filteredBooks.length === 0 ? (
              <div className="w-full py-16 text-center bg-cream-100/40 rounded-3xl border border-dashed border-cream-300 p-8 my-4">
                <BookOpen className="h-10 w-10 text-ink-400 mx-auto mb-3" />
                <h3 className="text-body font-bold text-ink-900">Buku tidak ditemukan</h3>
                <p className="text-caption text-ink-500 mt-1 max-w-sm mx-auto">
                  Tidak ada buku yang cocok dengan kriteria pencarian atau kategori yang dipilih.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Semua');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-cream-50 text-caption font-bold transition shadow-sm cursor-pointer"
                >
                  Reset Pencarian &amp; Kategori
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 justify-center items-stretch">
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
          </div>
        )}
      </div>

      {paywallBook && (
        <div
          data-testid="paywall-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4 duration-200"
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
            <div className="w-16 h-16 bg-gradient-to-br from-gold-400/25 to-gold-400/45 rounded-3xl mx-auto flex items-center justify-center text-gold-600 shadow-inner border border-gold-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-micro font-bold uppercase tracking-wider text-gold-700 bg-gold-400/15 px-2.5 py-1 rounded-full border border-gold-500/30">
                Koleksi Eksklusif
              </span>
              <h3 id="paywall-modal-title" className="text-h3 font-extrabold text-ink-900 mt-2">
                Akses Khusus Pembaca Pro
              </h3>
              <p className="text-caption text-ink-500 mt-1.5 leading-relaxed px-2">
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
                className="w-full min-h-11 py-3 bg-gradient-to-r from-brand-800 to-brand-900 hover:from-brand-900 text-cream-50 font-bold text-small rounded-2xl shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-gold-300" />
                <span>Lihat Paket Langganan Pro</span>
              </button>
              <button
                type="button"
                onClick={() => setPaywallBook(null)}
                className="w-full min-h-11 py-2.5 text-caption text-ink-500 hover:text-ink-800 font-semibold transition"
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
