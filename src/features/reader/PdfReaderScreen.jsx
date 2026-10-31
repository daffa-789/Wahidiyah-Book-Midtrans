import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Lock,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJson, apiRequest, authHeaders } from '@lib/api';
import { ContinuousPdfViewer } from './ContinuousPdfViewer';
import { sanitizeHtml } from '@lib/sanitizeHtml';
import { useAnchoredPinchZoom } from './useAnchoredPinchZoom';

const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
const PDF_TYPES = new Set(['pdf']);
const DOCX_TYPES = new Set(['docx', 'doc', 'odt']);

const getExtension = (book) =>
  String(book?.contentExtension || book?.contentType || '')
    .toLowerCase()
    .replace('.', '');

export const PdfReaderScreen = () => {
  const { activeBook, navigateTo } = useApp();
  const [textContent, setTextContent] = useState('');
  const [docHtml, setDocHtml] = useState('');
  const [pdfBuffer, setPdfBuffer] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [contentStatus, setContentStatus] = useState('idle');
  const [reloadToken, setReloadToken] = useState(0);

  // Status Perbesaran Dokumen (Zoom) - Default 100%
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supportsNativeFullscreen =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  // Pelacak Halaman Terakhir & Navigasi Scroll
  const bookTotalPages = Number(
    activeBook?.pages || activeBook?.totalPages || activeBook?.samplePages?.length || 1,
  );
  const samplePages = activeBook?.samplePages || [];
  const [totalPages, setTotalPages] = useState(Math.max(1, samplePages.length || bookTotalPages));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [targetScrollPage, setTargetScrollPage] = useState(null);

  const extension = getExtension(activeBook);

  // Ambil halaman terakhir yang tersimpan saat pertama kali dibuka
  useEffect(() => {
    if (!activeBook?.id) return;
    const storageKey = `last_read_page_${activeBook.id}`;
    const localSaved = Number(localStorage.getItem(storageKey));
    if (localSaved && localSaved >= 1) {
      setCurrentPage(localSaved);
      setPageInput(String(localSaved));
      setTargetScrollPage(localSaved);
    }
  }, [activeBook?.id]);

  // Simpan posisi membaca saat halaman berubah
  const handlePageChange = useCallback(
    (page, total) => {
      const validPage = Math.max(1, Math.min(total || totalPages, page));
      setCurrentPage(validPage);
      setPageInput(String(validPage));
      if (total && total > 0) setTotalPages(total);

      if (activeBook?.id) {
        localStorage.setItem(`last_read_page_${activeBook.id}`, String(validPage));
      }
    },
    [activeBook?.id, totalPages],
  );

  // Update level zoom dengan batasan aman (40% - 300%)
  const setClampedZoom = useCallback((newValOrFn) => {
    setZoom((prev) => {
      const raw = typeof newValOrFn === 'function' ? newValOrFn(prev) : newValOrFn;
      return Math.min(300, Math.max(40, Math.round(raw)));
    });
  }, []);

  const readingSurfaceRef = useRef(null);
  const readingPreviewRef = useRef(null);
  const pinchZoomHandlers = useAnchoredPinchZoom({
    containerRef: readingSurfaceRef,
    previewRef: readingPreviewRef,
    zoom,
    setZoom: setClampedZoom,
  });

  const adjustZoom = (delta) => {
    pinchZoomHandlers.prepareZoom();
    setClampedZoom((prev) => prev + delta);
  };

  const resetZoom = () => {
    pinchZoomHandlers.prepareZoom();
    setClampedZoom(100);
  };

  // Toggle Layar Penuh
  const toggleFullscreen = () => {
    if (!supportsNativeFullscreen) return;

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

  // Input halaman manual di pill bawah: ketik nomor halaman lalu Enter untuk scroll ke sana
  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setTargetScrollPage(val);
      setCurrentPage(val);
      if (activeBook?.id) {
        localStorage.setItem(`last_read_page_${activeBook.id}`, String(val));
      }
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
    setPdfBuffer(null);
    setPdfUrl(null);

    if (!activeBook?.id) {
      setContentStatus('idle');
      return undefined;
    }

    const isPdf = PDF_TYPES.has(extension);
    const isDoc = DOCX_TYPES.has(extension);
    const isText = TEXT_TYPES.has(extension);

    if (
      !isPdf &&
      !isDoc &&
      !isText &&
      (!activeBook?.samplePages || activeBook.samplePages.length === 0)
    ) {
      setContentStatus('idle');
      return undefined;
    }

    setContentStatus('loading');

    if (isDoc || isText) {
      apiJson(`/api/books/${encodeURIComponent(activeBook.id)}/html`, { headers: authHeaders() })
        .then((res) => {
          if (cancelled) return;
          if (res?.html) {
            setDocHtml(sanitizeHtml(res.html));
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
          if (
            err?.status === 403 ||
            String(err?.message || '')
              .toLowerCase()
              .includes('pro')
          ) {
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
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          return { blob, buffer };
        })
        .then(({ blob, buffer }) => {
          if (cancelled) return;
          setPdfBuffer(buffer);
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
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
          <p className="mt-2 text-caption text-ink-500">
            Pilih buku dari beranda katalog terlebih dahulu.
          </p>
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

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-canvas-subtle text-ink-900 dark:text-cream-50 select-none overflow-hidden">
      {/* Header ringkas agar area halaman bacaan lebih luas */}
      <header
        aria-label={activeBook.title}
        className="h-12 shrink-0 z-30 bg-ui-card/95 backdrop-blur-md border-b border-ink-200/70 dark:border-ink-800/80 px-4 sm:px-6 flex items-center justify-between shadow-xs"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="p-2 -ml-2 rounded-xl text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800/80 transition cursor-pointer shrink-0"
            title="Kembali ke beranda"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <form
            onSubmit={handlePageInputSubmit}
            className="flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-1 font-mono text-small font-semibold text-ink-500 dark:text-ink-400"
            aria-label="Navigasi halaman"
          >
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={handlePageInputSubmit}
              className="min-w-[1ch] max-w-[4ch] bg-transparent text-right text-ink-800 dark:text-cream-100 focus-visible:outline-none"
              style={{ width: `${Math.max(1, pageInput.length)}ch` }}
              aria-label="Halaman saat ini"
              title="Ketik nomor halaman lalu tekan Enter"
            />
            <span aria-hidden="true">/</span>
            <span>{totalPages}</span>
          </form>
        </div>

        {/* Kontrol Kanan: Tombol Zoom di sebelah kiri Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Control Group */}
          <div className="flex items-center bg-cream-100/90 dark:bg-ink-800/90 rounded-xl p-0.5 border border-cream-300 dark:border-ink-700 shadow-2xs">
            <button
              type="button"
              onClick={() => adjustZoom(-10)}
              disabled={zoom <= 40}
              className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-cream-200/80 dark:hover:bg-ink-700/80 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              title="Perkecil (Zoom Out)"
              aria-label="Perkecil dokumen"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className={`px-2 py-0.5 rounded-md text-caption font-mono font-bold transition cursor-pointer ${
                zoom !== 100
                  ? 'text-brand-700 dark:text-brand-400 bg-cream-50 dark:bg-ink-900 shadow-2xs'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50'
              }`}
              title="Klik untuk reset ke 100%"
              aria-label={`Zoom ${zoom}%. Klik untuk reset ke 100%`}
            >
              {zoom}%
            </button>

            <button
              type="button"
              onClick={() => adjustZoom(10)}
              disabled={zoom >= 300}
              className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-cream-200/80 dark:hover:bg-ink-700/80 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              title="Perbesar (Zoom In)"
              aria-label="Perbesar dokumen"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {supportsNativeFullscreen && (
            <>
              <div className="h-4 w-px bg-cream-300 dark:bg-ink-700 mx-0.5" />

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 transition cursor-pointer"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Reading Canvas */}
      <main className="flex-1 min-h-0 w-full relative flex flex-col items-center p-0 overflow-hidden">
        {contentStatus === 'locked' ? (
          <div className="my-auto max-w-md w-full rounded-3xl border border-cream-300 bg-ui-card p-8 text-center shadow-xl">
            <Lock className="mx-auto h-10 w-10 text-gold-500 mb-3" />
            <h2 className="text-h3 font-bold text-ink-900 dark:text-cream-50">
              Konten Khusus Member Pro
            </h2>
            <p className="mt-2 text-caption text-ink-500">
              Aktifkan paket Pro untuk membuka dan membaca naskah lengkap ini.
            </p>
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
            <h2 className="text-h3 font-bold text-ink-900 dark:text-cream-50">
              Gagal Memuat Dokumen
            </h2>
            <p className="mt-2 text-caption text-ink-500">
              Berkas dokumen naskah tidak dapat dimuat atau diekstrak.
            </p>
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
            ref={readingSurfaceRef}
            onTouchStart={pinchZoomHandlers.handleTouchStart}
            onTouchEnd={pinchZoomHandlers.handleTouchEnd}
            onTouchCancel={pinchZoomHandlers.handleTouchEnd}
            className="w-full max-w-full md:max-w-4xl xl:max-w-5xl bg-ui-card shadow-none md:shadow-md rounded-none md:rounded-2xl p-4 sm:p-8 md:p-12 border-0 md:border border-ink-200/60 dark:border-ink-800/80 leading-relaxed text-ink-900 dark:text-cream-50 select-text overflow-y-auto h-full overscroll-contain"
            style={{
              fontSize: `${(zoom / 100) * 1.05}rem`,
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              overflowAnchor: 'none',
            }}
          >
            <div
              ref={readingPreviewRef}
              className="prose dark:prose-invert max-w-none [&>p]:mb-4 [&>p]:leading-relaxed [&>h1]:text-[1.5em] [&>h1]:font-black [&>h1]:mb-4 [&>h2]:text-[1.25em] [&>h2]:font-bold [&>h2]:mb-3 [&>table]:w-full [&>table]:border-collapse [&>table_td]:border [&>table_td]:border-cream-300 [&>table_td]:p-2 [&>table_th]:border [&>table_th]:border-cream-300 [&>table_th]:p-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 font-serif sm:font-sans"
              style={{ fontSize: `${(zoom / 100) * 1.05}rem` }}
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />
          </div>
        ) : PDF_TYPES.has(extension) && (pdfBuffer || pdfUrl) ? (
          /* Penampil PDF Berbasis Continuous Vertical Scroll Menggunakan HTML5 Canvas & PDF.js */
          <ContinuousPdfViewer
            pdfBuffer={pdfBuffer}
            zoom={zoom}
            setZoom={setClampedZoom}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            targetScrollPage={targetScrollPage}
            onTargetScrollHandled={() => setTargetScrollPage(null)}
            bookId={activeBook.id}
          />
        ) : TEXT_TYPES.has(extension) && (textContent || docHtml) ? (
          <div
            ref={readingSurfaceRef}
            onTouchStart={pinchZoomHandlers.handleTouchStart}
            onTouchEnd={pinchZoomHandlers.handleTouchEnd}
            onTouchCancel={pinchZoomHandlers.handleTouchEnd}
            className="w-full h-full flex flex-col items-center overflow-y-auto p-4 sm:p-8 overscroll-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              overflowAnchor: 'none',
            }}
          >
            <article
              ref={readingPreviewRef}
              className="relative w-full max-w-3xl bg-ui-card p-8 sm:p-14 rounded-2xl shadow-lg border border-ink-200/60 leading-relaxed text-body text-ink-800 dark:text-cream-100 whitespace-pre-wrap select-none my-auto"
              style={{ fontSize: `${(zoom / 100) * 1.05}rem` }}
            >
              {textContent || 'Dokumen tidak berisi teks.'}
            </article>
          </div>
        ) : totalPages > 0 && samplePages.length > 0 ? (
          <div
            ref={readingSurfaceRef}
            onTouchStart={pinchZoomHandlers.handleTouchStart}
            onTouchEnd={pinchZoomHandlers.handleTouchEnd}
            onTouchCancel={pinchZoomHandlers.handleTouchEnd}
            className="w-full h-full flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 overscroll-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              overflowAnchor: 'none',
            }}
          >
            <article
              ref={readingPreviewRef}
              className="relative w-full max-w-3xl bg-ui-card p-8 sm:p-12 rounded-2xl shadow-lg border border-ink-200/60 leading-relaxed text-body text-ink-800 dark:text-cream-100 select-none my-auto"
              style={{
                fontSize: `${(zoom / 100) * 1.05}rem`,
              }}
            >
              <header className="flex justify-between border-b border-ink-100 pb-3 text-micro font-bold text-ink-400">
                <span>PERPUSTAKAAN DIGITAL WAHIDIYAH</span>
                <span>
                  HALAMAN {currentPage} / {totalPages}
                </span>
              </header>
              {samplePages[currentPage - 1]?.arabicHeading && (
                <p
                  className="font-arabic my-6 text-center text-brand-700"
                  style={{ fontSize: '1.5em' }}
                >
                  {samplePages[currentPage - 1].arabicHeading}
                </p>
              )}
              <h2
                className="mb-4 text-center font-black text-brand-900 dark:text-cream-50"
                style={{ fontSize: '1.75em' }}
              >
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
              {activeBook.contentName
                ? `${activeBook.contentName} telah tersimpan.`
                : 'Konten naskah buku belum diunggah.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
