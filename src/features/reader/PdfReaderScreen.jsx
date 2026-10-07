import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ArrowLeft,
  FileText,
  Lock,
  Type,
  Sun,
  Moon,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiRequest, authHeaders } from '@lib/api';

const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
const PDF_TYPES = new Set(['pdf']);

const getExtension = (book) => String(book?.contentExtension || book?.contentType || '').toLowerCase().replace('.', '');

const THEMES = {
  light: {
    id: 'light',
    name: 'Terang',
    bgMain: 'bg-[#FBF8F3]',
    bgArticle: 'bg-white text-ink-900 border-cream-300',
    header: 'bg-ink-900/95 text-white',
    subText: 'text-ink-500'
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    bgMain: 'bg-[#F4ECD8]',
    bgArticle: 'bg-[#FAF4E6] text-[#433422] border-[#E2D5B8]',
    header: 'bg-[#2D2419] text-[#E8DFD0]',
    subText: 'text-[#7D6B53]'
  },
  dark: {
    id: 'dark',
    name: 'Malam',
    bgMain: 'bg-[#141210]',
    bgArticle: 'bg-[#1E1B18] text-[#E4D9C6] border-[#38332B]',
    header: 'bg-[#0D0B0A] text-[#E4D9C6]',
    subText: 'text-[#A89F91]'
  }
};

export const PdfReaderScreen = () => {
  const { activeBook, navigateTo } = useApp();
  const [fontSize, setFontSize] = useState('base');
  const [textContent, setTextContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [contentStatus, setContentStatus] = useState('idle');
  const [reloadToken, setReloadToken] = useState(0);

  // Theme Reader (Light / Sepia / Dark)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('wb_reader_theme') || 'light';
  });

  // Last Read Tracker
  const bookTotalPages = Number(activeBook?.pages || activeBook?.totalPages || (activeBook?.samplePages?.length || 1));
  const [currentPage, setCurrentPage] = useState(1);
  const [resumePrompt, setResumePrompt] = useState(null);

  const extension = getExtension(activeBook);
  const samplePages = activeBook?.samplePages || [];
  const totalPages = samplePages.length || bookTotalPages;

  // Cek Halaman Terakhir yang Tersimpan
  useEffect(() => {
    if (!activeBook?.id) return;
    const storageKey = `last_read_page_${activeBook.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved && Number(saved) > 1) {
      const pageNum = Number(saved);
      setResumePrompt({ page: pageNum });
    }
  }, [activeBook?.id]);

  const saveCurrentPage = useCallback((page) => {
    setCurrentPage(page);
    if (activeBook?.id) {
      localStorage.setItem(`last_read_page_${activeBook.id}`, String(page));
    }
  }, [activeBook?.id]);

  const handleResumePage = () => {
    if (resumePrompt?.page) {
      saveCurrentPage(resumePrompt.page);
    }
    setResumePrompt(null);
  };

  const handleDismissResume = () => {
    setResumePrompt(null);
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('wb_reader_theme', mode);
  };

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    setTextContent('');
    setPdfUrl(null);
    if (!activeBook?.contentUrl || (!TEXT_TYPES.has(extension) && !PDF_TYPES.has(extension))) {
      setContentStatus('idle');
      return undefined;
    }
    setContentStatus('loading');
    apiRequest(activeBook.contentUrl, { headers: authHeaders() })
      .then(async (response) => {
        if (response.status === 403) throw new Error('PRO_LOCKED');
        if (!response.ok) throw new Error('FETCH_FAILED');
        return TEXT_TYPES.has(extension) ? response.text() : response.blob();
      })
      .then((content) => {
        if (cancelled) return;
        if (content instanceof Blob) {
          objectUrl = URL.createObjectURL(content);
          setPdfUrl(objectUrl);
        } else {
          setTextContent(content);
        }
        setContentStatus('ready');
      })
      .catch((loadError) => {
        if (!cancelled) setContentStatus(loadError.message === 'PRO_LOCKED' ? 'locked' : 'error');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeBook?.contentUrl, extension, reloadToken]);

  const fontClass = useMemo(() => ({ sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[fontSize]), [fontSize]);
  const cycleFontSize = () => setFontSize((current) => current === 'sm' ? 'base' : current === 'base' ? 'lg' : 'sm');

  const retryLoadContent = () => {
    setContentStatus('loading');
    setReloadToken((token) => token + 1);
  };

  if (!activeBook) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 p-6">
        <div className="max-w-sm rounded-3xl bg-cream-50 p-7 text-center shadow-2xl">
          <FileText className="mx-auto h-8 w-8 text-brand-600" />
          <h1 className="mt-4 font-black text-ink-900">Buku belum dipilih</h1>
          <p className="mt-2 text-sm text-ink-400">Pilih buku dari katalog untuk mulai membaca.</p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="mt-5 rounded-2xl bg-brand-700 px-4 py-3 text-sm font-bold text-white"
          >
            Kembali ke katalog
          </button>
        </div>
      </div>
    );
  }

  const currentTheme = THEMES[themeMode] || THEMES.light;

  const lockedCard = (
    <div className="reader-empty-state">
      <Lock className="mx-auto h-9 w-9 text-amber-400" />
      <h2 className="mt-4 text-lg font-black text-white">Konten khusus pembaca Pro</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-300">
        Aktifkan paket Pro untuk membuka kitab eksklusif ini.
      </p>
      <button
        type="button"
        onClick={() => navigateTo('pro')}
        className="mt-5 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        Lihat Paket Pro
      </button>
    </div>
  );

  const errorCard = (
    <div className="reader-empty-state" role="alert">
      <FileText className="mx-auto h-9 w-9 text-ink-300" />
      <h2 className="mt-4 text-lg font-black text-white">Konten belum dapat dimuat</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-300">
        Server atau basis data tidak menjawab permintaan konten ini.
      </p>
      <button
        type="button"
        onClick={retryLoadContent}
        className="mt-5 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        Coba muat ulang
      </button>
    </div>
  );

  const renderContent = () => {
    if (PDF_TYPES.has(extension) && activeBook.contentUrl) {
      if (contentStatus === 'locked') return lockedCard;
      if (contentStatus === 'error') return errorCard;
      if (contentStatus === 'loading' || !pdfUrl) {
        return (
          <div className="reader-empty-state" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-3"></div>
            Memuat dokumen PDF…
          </div>
        );
      }
      return (
        <div className="mx-auto h-[calc(100vh-7.5rem)] w-full max-w-5xl overflow-hidden rounded-2xl border border-ink-500 bg-cream-50 shadow-2xl">
          <iframe
            key={`${pdfUrl}-${currentPage}`}
            title={`Konten ${activeBook.title}`}
            src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
            className="h-full w-full border-0"
          />
        </div>
      );
    }

    if (TEXT_TYPES.has(extension) && activeBook.contentUrl) {
      if (contentStatus === 'loading') return <div className="reader-empty-state">Memuat teks dokumen…</div>;
      if (contentStatus === 'locked') return lockedCard;
      if (contentStatus === 'error') return errorCard;
      return (
        <article className={`mx-auto w-full max-w-3xl whitespace-pre-wrap rounded-2xl p-7 leading-8 shadow-2xl sm:p-12 ${fontClass} ${currentTheme.bgArticle} border select-text cursor-text`}>
          {textContent || 'Dokumen tidak berisi teks.'}
        </article>
      );
    }

    if (totalPages > 0 && samplePages.length > 0) {
      const activeSample = samplePages[currentPage - 1] || samplePages[0];
      return (
        <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
          <article className={`w-full max-w-3xl rounded-2xl p-7 shadow-2xl sm:p-12 ${fontClass} ${currentTheme.bgArticle} border select-text cursor-text`}>
            <header className="flex justify-between border-b border-cream-300/40 pb-4 text-micro font-bold tracking-wider opacity-70">
              <span>PERPUSTAKAAN DIGITAL WAHIDIYAH</span>
              <span>HALAMAN {currentPage} DARI {totalPages}</span>
            </header>
            {activeSample?.arabicHeading && (
              <p className="font-arabic my-8 text-center text-2xl text-brand-700">
                {activeSample.arabicHeading}
              </p>
            )}
            <h2 className="mb-6 text-center text-xl font-black text-brand-800">
              {activeSample?.title}
            </h2>
            <p className="whitespace-pre-line leading-8">
              {activeSample?.content}
            </p>
          </article>
        </div>
      );
    }

    return (
      <div className="reader-empty-state">
        <FileText className="mx-auto h-9 w-9 text-brand-400" />
        <h2 className="mt-4 text-lg font-black text-white">Lampiran Dokumen</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-300">
          {activeBook.contentName ? `${activeBook.contentName} telah tersimpan.` : 'Konten buku belum ditambahkan.'}
        </p>
      </div>
    );
  };

  return (
    <main className={`flex min-h-screen flex-col ${currentTheme.bgMain} transition-colors duration-300 page-transition`}>
      {/* Top Sticky Header */}
      <header className={`sticky top-0 z-30 border-b border-white/10 ${currentTheme.header} px-3 py-3 backdrop-blur sm:px-6 shadow-sm`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="rounded-xl p-2 -m-1 min-h-11 min-w-11 flex items-center justify-center opacity-80 hover:opacity-100 transition hover:bg-white/10 focus-visible:outline-none"
              title="Kembali ke katalog"
              aria-label="Kembali ke katalog"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold">{activeBook.title}</h1>
              <p className="truncate text-caption opacity-70">
                {activeBook.author} {activeBook.contentName ? `• ${activeBook.contentName}` : ''}
              </p>
            </div>
          </div>

          {/* Controls: Page Navigation + Themes + Font Size */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Page Tracker & Navigator */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => saveCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 text-micro sm:text-xs">
                Hal. {currentPage} {totalPages > 1 ? `/ ${totalPages}` : ''}
              </span>
              <button
                type="button"
                onClick={() => saveCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Theme Selector (Light, Sepia, Dark) */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-1.5 rounded-lg transition ${themeMode === 'light' ? 'bg-white text-ink-900 shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                title="Mode Terang"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('sepia')}
                className={`p-1.5 rounded-lg transition ${themeMode === 'sepia' ? 'bg-[#FAF4E6] text-[#433422] shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                title="Mode Sepia (Hangat)"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-1.5 rounded-lg transition ${themeMode === 'dark' ? 'bg-[#1E1B18] text-[#E4D9C6] shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                title="Mode Malam (Gelap)"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Font Size Toggle */}
            <button
              type="button"
              onClick={cycleFontSize}
              className="rounded-xl p-2 min-h-9 min-w-9 flex items-center justify-center opacity-80 hover:opacity-100 transition hover:bg-white/10"
              title="Ubah ukuran teks"
            >
              <Type className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Prompt: Lanjut Membaca */}
      {resumePrompt && (
        <div className="sticky top-16 z-20 mx-auto my-2 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between gap-3 bg-brand-800 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-brand-600">
            <div className="flex items-center gap-2 text-xs">
              <Bookmark className="h-4 w-4 text-amber-300" />
              <span>Terakhir Anda membaca di <strong>Halaman {resumePrompt.page}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResumePage}
                className="px-2.5 py-1 bg-white text-brand-900 rounded-lg text-micro font-bold shadow-xs hover:bg-cream-100 transition"
              >
                Lanjutkan
              </button>
              <button
                type="button"
                onClick={handleDismissResume}
                className="px-2 py-1 text-white/70 hover:text-white text-micro font-medium"
              >
                Abaikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Area */}
      <section className="flex-1 overflow-auto p-3 sm:p-7">
        {renderContent()}
      </section>
    </main>
  );
};
