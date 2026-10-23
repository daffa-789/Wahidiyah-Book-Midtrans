import React, { useState, useCallback, useRef, useMemo } from 'react';
import { BookOpen, Lock, Sparkles, Search, X } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import { BookGridSkeleton } from '@ui/Skeleton';
import HeroCarousel from './HeroCarousel';

import { BookCard } from './BookCard';

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
