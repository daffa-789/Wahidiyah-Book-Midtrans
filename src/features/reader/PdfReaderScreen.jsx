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

  // Status Perbesaran Dokumen (Zoom)
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pelacak Halaman Terakhir
  const bookTotalPages = Number(activeBook?.pages || activeBook?.totalPages || (activeBook?.samplePages?.length || 1));
  const samplePages = activeBook?.samplePages || [];
  const totalPages = Math.max(1, samplePages.length || bookTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const extension = getExtension(activeBook);

  // Ambil halaman terakhir yang tersimpan saat pertama kali dibuka (tanpa popup mengganggu)
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

  // Penyesuaian Zoom
  const zoomIn = () => setZoom((prev) => Math.min(200, prev + 15));
  const zoomOut = () => setZoom((prev) => Math.max(60, prev - 15));
  const resetZoom = () => setZoom(100);

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
    <div className="min-h-screen flex flex-col bg-canvas-subtle text-ink-900 dark:text-cream-50 select-none">
      {/* Top Header Minimalis & Bersih */}
      <header className="sticky top-0 z-30 h-14 bg-ui-card/95 backdrop-blur-md border-b border-ink-200/70 dark:border-ink-800/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
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
          {/* Zoom Controls */}
          <div className="flex items-center bg-ink-100/80 dark:bg-ink-800/80 rounded-xl p-0.5 border border-ink-200/50 dark:border-ink-700/50 text-caption font-semibold">
            <button
              type="button"
              onClick={zoomOut}
              className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 hover:bg-ui-card dark:hover:bg-ink-700 transition cursor-pointer"
              title="Perkecil"
              aria-label="Perkecil"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="px-2 text-micro text-ink-700 dark:text-cream-200 hover:text-brand-700 transition cursor-pointer"
              title="Reset Zoom"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 hover:bg-ui-card dark:hover:bg-ink-700 transition cursor-pointer"
              title="Perbesar"
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

      {/* Main Reading Canvas */}
      <main className="flex-1 flex flex-col items-center justify-start py-3 sm:py-5 px-2 sm:px-4 overflow-y-auto">
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
            className="w-full bg-ui-card shadow-md rounded-2xl p-6 sm:p-12 md:p-16 my-4 border border-ink-200/60 dark:border-ink-800/80 leading-relaxed text-ink-900 dark:text-cream-50 select-text transition-all"
            style={{
              fontSize: `${(zoom / 100) * 1.05}rem`,
              maxWidth: `${Math.min(1200, Math.max(640, Math.round(860 * (zoom / 100))))}px`
            }}
          >
            <div
              className="prose dark:prose-invert max-w-none [&>p]:mb-4 [&>p]:leading-relaxed [&>h1]:text-2xl [&>h1]:font-black [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>table]:w-full [&>table]:border-collapse [&>table_td]:border [&>table_td]:border-cream-300 [&>table_td]:p-2 [&>table_th]:border [&>table_th]:border-cream-300 [&>table_th]:p-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 font-serif sm:font-sans"
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />
          </div>
        ) : PDF_TYPES.has(extension) && activeBook.contentUrl && pdfUrl ? (
          <div
            className="relative w-full max-w-4xl bg-ui-card shadow-md rounded-lg overflow-hidden border border-ink-200/60 dark:border-ink-800/70"
            style={{
              height: 'calc(100vh - 5.5rem)',
              maxWidth: `${Math.min(1200, Math.max(640, Math.round(896 * (zoom / 100))))}px`
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <iframe
              key={`${pdfUrl}-${currentPage}-${zoom}`}
              title={`Konten ${activeBook.title}`}
              src={`${pdfUrl}#page=${currentPage}&zoom=${zoom}&toolbar=0&navpanes=0`}
              className="h-full w-full border-0 select-none"
            />
          </div>
        ) : TEXT_TYPES.has(extension) && (textContent || docHtml) ? (
          <article className="relative w-full max-w-3xl bg-ui-card p-8 sm:p-14 rounded-2xl shadow-lg border border-ink-200/60 leading-relaxed text-body text-ink-800 dark:text-cream-100 whitespace-pre-wrap select-none">
            {textContent || 'Dokumen tidak berisi teks.'}
          </article>
        ) : totalPages > 0 && samplePages.length > 0 ? (
          <article className="relative w-full max-w-3xl bg-ui-card p-8 sm:p-12 rounded-2xl shadow-lg border border-ink-200/60 leading-relaxed text-body text-ink-800 dark:text-cream-100 select-none">
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
      <footer className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
        <form
          onSubmit={handlePageInputSubmit}
          className="flex items-center gap-2 bg-ui-card/95 backdrop-blur-md shadow-xl border border-ink-200/90 dark:border-ink-700/80 rounded-full px-3.5 py-1.5 text-caption font-medium text-ink-800 dark:text-cream-100"
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
