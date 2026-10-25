import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize
} from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJson, apiRequest, authHeaders } from '@lib/api';

const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
const PDF_TYPES = new Set(['pdf']);
const DOCX_TYPES = new Set(['docx', 'doc', 'odt']);

const getExtension = (book) =>
  String(book?.contentExtension || book?.contentType || '').toLowerCase().replace('.', '');

export const PdfReaderScreen = () => {
  const { activeBook, navigateTo, user } = useApp();
  const [textContent, setTextContent] = useState('');
  const [docHtml, setDocHtml] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [contentStatus, setContentStatus] = useState('idle');
  const [reloadToken, setReloadToken] = useState(0);

  // Status Perbesaran Dokumen (Zoom) - Default 100%
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showZoomToast, setShowZoomToast] = useState(false);
  const zoomToastTimerRef = useRef(null);

  // Ref untuk mendeteksi gestur sentuh (Touch Gestures: Swipe Halaman & Pinch-to-Zoom)
  const readerRootRef = useRef(null);
  const touchStartDistRef = useRef(0);
  const initialPinchZoomRef = useRef(100);
  const isPinchingRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Pelacak Halaman Terakhir
  const bookTotalPages = Number(activeBook?.pages || activeBook?.totalPages || (activeBook?.samplePages?.length || 1));
  const samplePages = activeBook?.samplePages || [];
  const totalPages = Math.max(1, samplePages.length || bookTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const extension = getExtension(activeBook);

  // Ambil halaman terakhir yang tersimpan saat pertama kali dibuka
  useEffect(() => {
    if (!activeBook?.id) return;
    let active = true;

    const loadLastPage = () => {
      const storageKey = `last_read_page_${activeBook.id}`;
      const localSaved = Number(localStorage.getItem(storageKey));
      if (localSaved && localSaved >= 1 && localSaved <= totalPages) {
        setCurrentPage(localSaved);
        setPageInput(String(localSaved));
      }
    };

    loadLastPage();
    return () => { active = false; };
  }, [activeBook?.id, totalPages]);

  // Simpan posisi membaca secara otomatis
  const saveCurrentPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(validPage);
    setPageInput(String(validPage));

    if (activeBook?.id) {
      localStorage.setItem(`last_read_page_${activeBook.id}`, String(validPage));
    }
  }, [activeBook?.id, totalPages]);

  // Tampilkan notifikasi indikator perbesaran (Toast Feedback) real-time
  const triggerZoomFeedback = useCallback(() => {
    setShowZoomToast(true);
    if (zoomToastTimerRef.current) {
      clearTimeout(zoomToastTimerRef.current);
    }
    zoomToastTimerRef.current = setTimeout(() => {
      setShowZoomToast(false);
    }, 1200);
  }, []);

  // Update level zoom dengan batasan aman (50% - 250%)
  const setClampedZoom = useCallback((newValOrFn) => {
    setZoom((prev) => {
      const raw = typeof newValOrFn === 'function' ? newValOrFn(prev) : newValOrFn;
      return Math.min(250, Math.max(50, Math.round(raw)));
    });
    triggerZoomFeedback();
  }, [triggerZoomFeedback]);

  // Tombol Zoom Manual
  const zoomIn = () => setClampedZoom((prev) => Math.min(250, prev + 15));
  const zoomOut = () => setClampedZoom((prev) => Math.max(50, prev - 15));
  const resetZoom = () => setClampedZoom(100);

  // Navigasi keyboard (Panah Kiri / Kanan)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        saveCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        saveCurrentPage(currentPage + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, saveCurrentPage]);

  // Deteksi Zoom Manual di Desktop: Ctrl + Mouse Wheel & Trackpad Pinch
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const step = delta > 0 ? 5 : -5;
        setClampedZoom((prev) => prev + step);
      }
    };

    const target = readerRootRef.current || window;
    target.addEventListener('wheel', handleWheel, { passive: false });
    return () => target.removeEventListener('wheel', handleWheel);
  }, [setClampedZoom]);

  // Deteksi Gestur Sentuh Mobile: Pinch-to-Zoom (2 Jari) & Swipe Navigasi Halaman (1 Jari)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // 2 Jari: Mulai Pinch-to-Zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialPinchZoomRef.current = zoom;
      isPinchingRef.current = true;
    } else if (e.touches.length === 1) {
      // 1 Jari: Mulai Deteksi Swipe / Scroll Halaman
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      hasMovedRef.current = false;
      isPinchingRef.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (isPinchingRef.current && e.touches.length === 2) {
      // Multi-Touch Pinch: Perbarui persentase zoom secara real-time
      if (e.cancelable) e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartDistRef.current > 10) {
        const factor = currentDist / touchStartDistRef.current;
        const calculatedZoom = initialPinchZoomRef.current * factor;
        setClampedZoom(calculatedZoom);
      }
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartXRef.current;
      const dy = e.touches[0].clientY - touchStartYRef.current;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        hasMovedRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (isPinchingRef.current) {
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
        touchStartDistRef.current = 0;
      }
      return;
    }

    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - touchStartXRef.current;
      const diffY = endY - touchStartYRef.current;
      const duration = Date.now() - touchStartTimeRef.current;

      // Usap / Swipe Halaman hanya aktif saat mode normal (zoom === 100%)
      // Pada saat zoom > 100%, sentuhan digunakan untuk scrolling/panning isi dokumen
      if (zoom === 100 && duration < 600) {
        // Swipe Vertikal (Usap atas = halaman lanjut, Usap bawah = halaman kembali)
        if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
          if (diffY < 0) {
            saveCurrentPage(currentPage + 1);
          } else {
            saveCurrentPage(currentPage - 1);
          }
          return;
        }

        // Swipe Horizontal (Usap kiri = halaman lanjut, Usap kanan = halaman kembali)
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.1) {
          if (diffX < 0) {
            saveCurrentPage(currentPage + 1);
          } else {
            saveCurrentPage(currentPage - 1);
          }
          return;
        }
      }
    }
  };

  // Toggle Layar Penuh
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Input halaman manual di pill bawah
  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val)) {
      saveCurrentPage(val);
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Muat konten PDF, Word (docx), atau teks
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    setTextContent('');
    setDocHtml('');
    setPdfUrl(null);

    if (!activeBook?.id) {
      setContentStatus('idle');
      return undefined;
    }

    const isPdf = PDF_TYPES.has(extension);
    const isDoc = DOCX_TYPES.has(extension);
    const isText = TEXT_TYPES.has(extension);

    if (!isPdf && !isDoc && !isText && (!activeBook?.samplePages || activeBook.samplePages.length === 0)) {
      setContentStatus('idle');
      return undefined;
    }

    setContentStatus('loading');

    if (isDoc || isText) {
      apiJson(`/api/books/${encodeURIComponent(activeBook.id)}/html`, { headers: authHeaders() })
        .then((res) => {
          if (cancelled) return;
          if (res?.html) {
            setDocHtml(res.html);
            setContentStatus('ready');
          } else if (res?.text) {
            setTextContent(res.text);
            setContentStatus('ready');
          } else {
            setContentStatus('error');
          }
        })
        .catch((err) => {
          if (cancelled) return;
          if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('pro')) {
            setContentStatus('locked');
          } else {
            setContentStatus('error');
          }
        });
    } else if (isPdf && activeBook?.contentUrl) {
      apiRequest(activeBook.contentUrl, { headers: authHeaders() })
        .then(async (response) => {
          if (response.status === 403) throw new Error('PRO_LOCKED');
          if (!response.ok) throw new Error('FETCH_FAILED');
          return response.blob();
        })
        .then((content) => {
          if (cancelled) return;
          if (content instanceof Blob) {
            objectUrl = URL.createObjectURL(content);
            setPdfUrl(objectUrl);
          }
          setContentStatus('ready');
        })
        .catch((err) => {
          if (!cancelled) setContentStatus(err.message === 'PRO_LOCKED' ? 'locked' : 'error');
        });
    } else if (activeBook?.samplePages && activeBook.samplePages.length > 0) {
      setContentStatus('ready');
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeBook?.id, activeBook?.contentUrl, extension, reloadToken]);

  const retryLoadContent = () => setReloadToken((prev) => prev + 1);

  if (!activeBook) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-subtle px-4 text-center">
        <div className="max-w-md rounded-3xl border border-cream-300 bg-ui-card p-8 shadow-xl">
          <BookOpen className="mx-auto h-12 w-12 text-ink-300" />
          <h2 className="mt-4 text-h2 font-black text-ink-900">Buku tidak ditemukan</h2>
          <p className="mt-2 text-caption text-ink-500">Pilih buku dari beranda katalog terlebih dahulu.</p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="mt-6 rounded-2xl bg-brand-700 px-6 py-3 text-caption font-bold text-white transition hover:bg-brand-800"
          >
            Kembali ke katalog
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.min(100, Math.max(1, Math.round((currentPage / totalPages) * 100)));

  return (
    <div
      ref={readerRootRef}
      className="fixed inset-0 z-40 flex flex-col bg-canvas-subtle text-ink-900 dark:text-cream-50 select-none overflow-hidden"
    >
      {/* Top Header Minimalis & Bersih */}
      <header className="h-14 shrink-0 z-30 bg-ui-card/95 backdrop-blur-md border-b border-ink-200/70 dark:border-ink-800/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        {/* Tombol Kembali & Judul Buku */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="p-2 -ml-2 rounded-xl text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800/80 transition cursor-pointer"
            title="Kembali ke beranda"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-body font-bold text-ink-900 dark:text-cream-50 truncate max-w-xs sm:max-w-md md:max-w-lg">
              {activeBook.title}
            </h1>
            {activeBook.author && !/^(tidak\s*diketahui|penyusun\s*wahidiyah)$/i.test(activeBook.author.trim()) && (
              <p className="text-caption text-ink-400 dark:text-ink-500 truncate -mt-0.5">
                {activeBook.author}
              </p>
            )}
          </div>
        </div>

        {/* Kontrol Kanan: Zoom & Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom Controls (Minus, Persentase Dinamis, Plus) */}
          <div className="flex items-center bg-ink-100/80 dark:bg-ink-800/80 rounded-xl p-0.5 border border-ink-200/50 dark:border-ink-700/50 text-caption font-semibold">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= 50}
              className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 hover:bg-ui-card dark:hover:bg-ink-700 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Perkecil (-15%)"
              aria-label="Perkecil"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className={`px-2 py-0.5 rounded-md text-micro font-mono font-bold transition cursor-pointer ${
                zoom !== 100
                  ? 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 shadow-xs'
                  : 'text-ink-700 dark:text-cream-200 hover:text-brand-700'
              }`}
              title={zoom === 100 ? 'Reset Zoom (100%)' : 'Klik untuk mengembalikan ke 100%'}
              aria-label={`Tingkat zoom ${zoom}%. Klik untuk reset ke 100%`}
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= 250}
              className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 hover:bg-ui-card dark:hover:bg-ink-700 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Perbesar (+15%)"
              aria-label="Perbesar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 transition cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Floating Zoom Toast Feedback (Muncul saat Zoom Berubah Manual) */}
      {showZoomToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200">
          <div className="px-3.5 py-1.5 rounded-full bg-ink-900/90 dark:bg-cream-100/90 backdrop-blur-md text-white dark:text-ink-900 text-caption font-bold shadow-xl flex items-center gap-2 border border-ink-700/30">
            <span>Zoom: {zoom}%</span>
            {zoom !== 100 && (
              <span className="text-micro font-medium opacity-80">(Klik untuk reset ke 100%)</span>
            )}
          </div>
        </div>
      )}

      {/* Tombol Cepat Navigasi Layar Sentuh Mobile (Kiri & Kanan Floating Chevrons) */}
      <div className="md:hidden fixed left-2 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => saveCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-ui-card/90 dark:bg-ink-900/90 backdrop-blur-md shadow-lg border border-ink-200/80 dark:border-ink-700/80 text-ink-700 dark:text-cream-200 disabled:opacity-0 active:scale-90 transition cursor-pointer"
          title="Halaman Sebelumnya"
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="md:hidden fixed right-2 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => saveCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-ui-card/90 dark:bg-ink-900/90 backdrop-blur-md shadow-lg border border-ink-200/80 dark:border-ink-700/80 text-ink-700 dark:text-cream-200 disabled:opacity-0 active:scale-90 transition cursor-pointer"
          title="Halaman Selanjutnya"
          aria-label="Halaman Selanjutnya"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Main Reading Canvas */}
      <main className="flex-1 min-h-0 w-full relative flex flex-col items-center p-0 md:p-2 overflow-hidden">
        {contentStatus === 'locked' ? (
          <div className="my-auto max-w-md w-full rounded-3xl border border-cream-300 bg-ui-card p-8 text-center shadow-xl">
            <Lock className="mx-auto h-10 w-10 text-gold-500 mb-3" />
            <h2 className="text-h3 font-bold text-ink-900 dark:text-cream-50">Konten Khusus Member Pro</h2>
            <p className="mt-2 text-caption text-ink-500">Aktifkan paket Pro untuk membuka dan membaca naskah lengkap ini.</p>
            <button
              type="button"
              onClick={() => navigateTo('pro')}
              className="mt-6 rounded-2xl bg-brand-700 px-6 py-2.5 text-caption font-bold text-white hover:bg-brand-800 transition cursor-pointer"
            >
              Lihat Paket Pro
            </button>
          </div>
        ) : contentStatus === 'error' ? (
          <div className="my-auto max-w-md w-full rounded-3xl border border-cream-300 bg-ui-card p-8 text-center shadow-xl">
            <FileText className="mx-auto h-10 w-10 text-semantic-danger mb-3" />
            <h2 className="text-h3 font-bold text-ink-900 dark:text-cream-50">Gagal Memuat Dokumen</h2>
            <p className="mt-2 text-caption text-ink-500">Berkas dokumen naskah tidak dapat dimuat atau diekstrak.</p>
            <button
              type="button"
              onClick={retryLoadContent}
              className="mt-6 rounded-2xl bg-brand-700 px-6 py-2.5 text-caption font-bold text-white hover:bg-brand-800 transition cursor-pointer"
            >
              Coba Muat Ulang
            </button>
          </div>
        ) : contentStatus === 'loading' ? (
          <div className="my-auto flex flex-col items-center justify-center p-12 text-ink-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mb-3" />
            <span className="text-caption font-medium">Memuat dan menyiapkan naskah bacaan...</span>
          </div>
        ) : (docHtml || DOCX_TYPES.has(extension)) && docHtml ? (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="w-full max-w-full md:max-w-4xl xl:max-w-5xl bg-ui-card shadow-none md:shadow-md rounded-none md:rounded-2xl p-4 sm:p-8 md:p-12 border-0 md:border border-ink-200/60 dark:border-ink-800/80 leading-relaxed text-ink-900 dark:text-cream-50 select-text transition-all overflow-y-auto h-full overscroll-contain"
            style={{
              fontSize: `${(zoom / 100) * 1.05}rem`,
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            <div
              className="prose dark:prose-invert max-w-none [&>p]:mb-4 [&>p]:leading-relaxed [&>h1]:text-2xl [&>h1]:font-black [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>table]:w-full [&>table]:border-collapse [&>table_td]:border [&>table_td]:border-cream-300 [&>table_td]:p-2 [&>table_th]:border [&>table_th]:border-cream-300 [&>table_th]:p-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 font-serif sm:font-sans"
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />
          </div>
        ) : PDF_TYPES.has(extension) && activeBook.contentUrl && pdfUrl ? (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="relative flex-1 min-h-0 w-full h-full max-w-full xl:max-w-[1600px] 2xl:max-w-[1800px] bg-ui-card shadow-none md:shadow-lg rounded-none md:rounded-2xl overflow-auto overscroll-contain border-0 md:border md:border-ink-200/60 dark:md:border-ink-800/70 transition-all duration-75 flex flex-col items-center"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: zoom > 100 ? 'pan-x pan-y' : 'pan-y pinch-zoom'
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Pembungkus Iframe dengan Scaling Visual yang Halus (Tanpa Reload Iframe) */}
            <div
              className="w-full h-full flex-1 flex flex-col items-center origin-top transition-transform duration-75 ease-out"
              style={{
                transform: zoom === 100 ? 'none' : `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                width: zoom > 100 ? `${zoom}%` : '100%',
                minHeight: zoom > 100 ? `${zoom}%` : '100%'
              }}
            >
              <iframe
                key={`${pdfUrl}-${currentPage}`}
                title={`Konten ${activeBook.title}`}
                src={`${pdfUrl}#page=${currentPage}&${zoom === 100 ? 'view=FitH' : ''}&toolbar=0&navpanes=0`}
                className="flex-1 min-h-[85vh] md:min-h-full w-full h-full border-0 select-none bg-canvas-subtle"
              />
            </div>

            {/* Gesture Detection Overlay Khusus Mobile (Mencegah Iframe Menelan Touch Events) */}
            {zoom === 100 && (
              <div
                className="absolute inset-0 z-20 md:hidden bg-transparent"
                style={{ touchAction: 'pan-y' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              />
            )}
          </div>
        ) : TEXT_TYPES.has(extension) && (textContent || docHtml) ? (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="w-full h-full flex flex-col items-center overflow-y-auto p-4 sm:p-8 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <article
              className="relative w-full max-w-3xl bg-ui-card p-8 sm:p-14 rounded-2xl shadow-lg border border-ink-200/60 leading-relaxed text-body text-ink-800 dark:text-cream-100 whitespace-pre-wrap select-none my-auto"
              style={{ fontSize: `${(zoom / 100) * 1.05}rem` }}
            >
              {textContent || 'Dokumen tidak berisi teks.'}
            </article>
          </div>
        ) : totalPages > 0 && samplePages.length > 0 ? (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="w-full h-full flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <article
              className="relative w-full max-w-3xl bg-ui-card p-8 sm:p-12 rounded-2xl shadow-lg border border-ink-200/60 leading-relaxed text-body text-ink-800 dark:text-cream-100 select-none my-auto transition-transform origin-top"
              style={{
                transform: zoom === 100 ? 'none' : `scale(${zoom / 100})`,
                transformOrigin: 'top center'
              }}
            >
              <header className="flex justify-between border-b border-ink-100 pb-3 text-micro font-bold text-ink-400">
                <span>PERPUSTAKAAN DIGITAL WAHIDIYAH</span>
                <span>HALAMAN {currentPage} / {totalPages}</span>
              </header>
              {samplePages[currentPage - 1]?.arabicHeading && (
                <p className="font-arabic my-6 text-center text-2xl text-brand-700">
                  {samplePages[currentPage - 1].arabicHeading}
                </p>
              )}
              <h2 className="mb-4 text-center text-h2 font-black text-brand-900 dark:text-cream-50">
                {samplePages[currentPage - 1]?.title}
              </h2>
              <p className="whitespace-pre-line leading-8">
                {samplePages[currentPage - 1]?.content}
              </p>
            </article>
          </div>
        ) : (
          <div className="my-auto max-w-md w-full rounded-3xl border border-cream-300 bg-ui-card p-8 text-center shadow-xl">
            <FileText className="mx-auto h-10 w-10 text-ink-300 mb-3" />
            <h2 className="text-h3 font-bold text-ink-900">Lampiran Dokumen</h2>
            <p className="mt-2 text-caption text-ink-500">
              {activeBook.contentName ? `${activeBook.contentName} telah tersimpan.` : 'Konten naskah buku belum diunggah.'}
            </p>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Pill (Persis seperti tampilan e-reader Moco / Gramedia) */}
      <footer className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <form
          onSubmit={handlePageInputSubmit}
          className="pointer-events-auto flex items-center gap-2 bg-ui-card/95 backdrop-blur-md shadow-xl border border-ink-200/90 dark:border-ink-700/80 rounded-full px-3.5 py-1.5 text-caption font-medium text-ink-800 dark:text-cream-100"
        >
          {/* Tombol Sebelumnya */}
          <button
            type="button"
            onClick={() => saveCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-full text-ink-700 dark:text-cream-200 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            title="Halaman Sebelumnya"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Kotak Halaman & Persentase */}
          <div className="flex items-center gap-1.5 px-1 font-mono text-small">
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputSubmit}
              className="w-8 sm:w-10 text-center font-bold text-ink-900 dark:text-cream-50 bg-ink-50 dark:bg-ink-800 rounded py-0.5 border border-ink-200 dark:border-ink-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 text-small"
              title="Ketik nomor halaman lalu tekan Enter"
            />
            <span className="text-ink-400">/</span>
            <span className="text-ink-600 dark:text-ink-300 font-semibold">{totalPages}</span>
            <span className="text-ink-300 dark:text-ink-600 mx-0.5">•</span>
            <span className="text-ink-500 dark:text-ink-400 text-caption font-sans">
              {percentage}%
            </span>
          </div>

          {/* Tombol Selanjutnya */}
          <button
            type="button"
            onClick={() => saveCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-full text-ink-700 dark:text-cream-200 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            title="Halaman Berikutnya"
            aria-label="Halaman Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};
