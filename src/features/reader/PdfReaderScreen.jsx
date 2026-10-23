import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  Lock,
  Type,
  Sun,
  Moon,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJson, apiRequest, authHeaders, readableError } from '@lib/api';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';

const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
const PDF_TYPES = new Set(['pdf']);

const getExtension = (book) => String(book?.contentExtension || book?.contentType || '').toLowerCase().replace('.', '');

const THEMES = {
  light: {
    id: 'light',
    name: 'Terang',
    bgMain: 'bg-cream-50',
    bgArticle: 'bg-cream-100 text-ink-900 border-cream-300',
    header: 'bg-ink-900/95 text-cream-50',
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
  const { activeBook, navigateTo, user } = useApp();
  const [fontSize, setFontSize] = useState('base');
  const [textContent, setTextContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [contentStatus, setContentStatus] = useState('idle');
  const [reloadToken, setReloadToken] = useState(0);

  // Theme Reader (Light / Sepia / Dark)
  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem('wb_reader_theme');
    if (stored) return stored;
    const appIsDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return appIsDark ? 'dark' : 'light';
  });

  // Pelacak Halaman Terakhir
  const bookTotalPages = Number(activeBook?.pages || activeBook?.totalPages || (activeBook?.samplePages?.length || 1));
  const [currentPage, setCurrentPage] = useState(1);
  const [resumePrompt, setResumePrompt] = useState(null);



  const extension = getExtension(activeBook);
  const samplePages = activeBook?.samplePages || [];
  const totalPages = samplePages.length || bookTotalPages;

  // Cek Halaman Terakhir yang Tersimpan dari Server & Penyimpanan Lokal
  useEffect(() => {
    if (!activeBook?.id) return;
    let active = true;

    const checkResume = async () => {
      // 1. Cek dari penyimpanan lokal
      const storageKey = `last_read_page_${activeBook.id}`;
      const localSaved = Number(localStorage.getItem(storageKey));

      // 2. Coba sinkronisasi dengan server
      try {
        const res = await apiJson(`/api/reading-progress/${activeBook.id}`);
        if (active && res?.progress?.last_page && res.progress.last_page > 1) {
          setResumePrompt({ page: res.progress.last_page });
          return;
        }
      } catch {
        // Abaikan galat jaringan
      }

      if (active && localSaved > 1) {
        setResumePrompt({ page: localSaved });
      }
    };

    checkResume();
    return () => { active = false; };
  }, [activeBook?.id]);



  // Simpan halaman saat ini ke lokal & server
  const saveCurrentPage = useCallback((page) => {
    setCurrentPage(page);
    if (activeBook?.id) {
      localStorage.setItem(`last_read_page_${activeBook.id}`, String(page));
      // Sinkronkan ke server secara asinkron
      apiJson(`/api/reading-progress/${activeBook.id}`, {
        method: 'PUT',
        body: { last_page: page, total_pages: totalPages || null }
      }).catch(() => {
        // Abaikan galat jaringan
      });
    }
  }, [activeBook?.id, totalPages]);

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

  // Tambah pembatas pada halaman saat ini

  // Muat konten PDF / Teks
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

  const fontClass = useMemo(() => ({ sm: 'text-small', base: 'text-body', lg: 'text-lead' }[fontSize]), [fontSize]);
  const cycleFontSize = () => setFontSize((current) => current === 'sm' ? 'base' : current === 'base' ? 'lg' : 'sm');

  const retryLoadContent = () => {
    setContentStatus('loading');
    setReloadToken((token) => token + 1);
  };

  if (!activeBook) {
    return (
      <div className="theme-light-scope flex min-h-screen items-center justify-center bg-ink-900 p-6">
        <div className="max-w-sm rounded-3xl bg-cream-50 p-7 text-center shadow-2xl">
          <FileText className="mx-auto h-8 w-8 text-brand-600" />
          <h1 className="mt-4 font-black text-ink-900 text-h3">Buku belum dipilih</h1>
          <p className="mt-2 text-caption text-ink-400">Pilih buku dari katalog untuk mulai membaca.</p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="mt-5 rounded-2xl bg-brand-700 px-4 py-3 text-caption font-bold text-cream-50"
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
      <Lock className="mx-auto h-9 w-9 text-gold-400" />
      <h2 className="mt-4 text-h3 font-black text-cream-50">Konten khusus pembaca Pro</h2>
      <p className="mt-2 max-w-md text-caption leading-relaxed text-cream-300">
        Aktifkan paket Pro untuk membuka kitab eksklusif ini.
      </p>
      <button
        type="button"
        onClick={() => navigateTo('pro')}
        className="mt-5 rounded-2xl bg-brand-700 px-5 py-3 text-caption font-bold text-cream-50 transition hover:bg-brand-800"
      >
        Lihat Paket Pro
      </button>
    </div>
  );

  const errorCard = (
    <div className="reader-empty-state" role="alert">
      <FileText className="mx-auto h-9 w-9 text-ink-300" />
      <h2 className="mt-4 text-h3 font-black text-cream-50">Konten belum dapat dimuat</h2>
      <p className="mt-2 max-w-md text-caption leading-relaxed text-cream-300">
        Server atau basis data tidak menjawab permintaan konten ini.
      </p>
      <button
        type="button"
        onClick={retryLoadContent}
        className="mt-5 rounded-2xl bg-brand-700 px-5 py-3 text-caption font-bold text-cream-50 transition hover:bg-brand-800"
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
        <div 
          className="relative mx-auto h-[calc(100vh-7.5rem)] w-full max-w-5xl overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-2xl select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <iframe
            key={`${pdfUrl}-${currentPage}`}
            title={`Konten ${activeBook.title}`}
            src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
            className="h-full w-full border-0 select-none"
          />
        </div>
      );
    }

    if (TEXT_TYPES.has(extension) && activeBook.contentUrl) {
      if (contentStatus === 'loading') return <div className="reader-empty-state">Memuat teks dokumen…</div>;
      if (contentStatus === 'locked') return lockedCard;
      if (contentStatus === 'error') return errorCard;
      return (
        <article className={`relative mx-auto w-full max-w-3xl whitespace-pre-wrap rounded-2xl p-7 leading-8 shadow-2xl sm:p-12 ${fontClass} ${currentTheme.bgArticle} border select-none`}>
          <div className="relative z-10">
            {textContent || 'Dokumen tidak berisi teks.'}
          </div>
        </article>
      );
    }

    if (totalPages > 0 && samplePages.length > 0) {
      const activeSample = samplePages[currentPage - 1] || samplePages[0];
      return (
        <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
          <article className={`w-full max-w-3xl rounded-2xl p-7 shadow-2xl sm:p-12 ${fontClass} ${currentTheme.bgArticle} border select-none`}>
            <header className="flex justify-between border-b border-cream-300/40 pb-4 text-micro font-bold tracking-wider opacity-70">
              <span>PERPUSTAKAAN DIGITAL WAHIDIYAH</span>
              <span>HALAMAN {currentPage} DARI {totalPages}</span>
            </header>
            {activeSample?.arabicHeading && (
              <p className="font-arabic my-8 text-center text-2xl text-brand-700">
                {activeSample.arabicHeading}
              </p>
            )}
            <h2 className="mb-6 text-center text-h2 font-black text-brand-800">
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
        <h2 className="mt-4 text-h3 font-black text-cream-50">Lampiran Dokumen</h2>
        <p className="mt-2 max-w-md text-caption leading-relaxed text-cream-300">
          {activeBook.contentName ? `${activeBook.contentName} telah tersimpan.` : 'Konten buku belum ditambahkan.'}
        </p>
      </div>
    );
  };

  return (
    <main className={`theme-light-scope flex min-h-screen flex-col ${currentTheme.bgMain} transition-colors duration-300 page-transition`}>
      {/* Top Sticky Header */}
      <header className={`sticky top-0 z-30 border-b border-cream-300/20 ${currentTheme.header} px-3 py-3 backdrop-blur sm:px-6 shadow-sm`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="rounded-xl p-2 -m-1 min-h-11 min-w-11 flex items-center justify-center opacity-80 hover:opacity-100 transition hover:bg-cream-100/10 focus-visible:outline-none"
              title="Kembali ke katalog"
              aria-label="Kembali ke katalog"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-small font-bold">{activeBook.title}</h1>
              <p className="truncate text-caption opacity-70">
                {activeBook.author} {activeBook.contentName ? `• ${activeBook.contentName}` : ''}
              </p>
            </div>
          </div>

          {/* Controls: Page Navigation + Themes + Font Size */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Page Tracker & Navigator */}
            <div className="flex items-center gap-1 bg-cream-50/10 px-2 py-1 rounded-xl text-caption font-semibold">
              <button
                type="button"
                onClick={() => saveCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-cream-50/10 disabled:opacity-30 cursor-pointer"
                title="Halaman Sebelumnya"
                aria-label="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 text-micro sm:text-caption">
                Hal. {currentPage} {totalPages > 1 ? `/ ${totalPages}` : ''}
              </span>
              <button
                type="button"
                onClick={() => saveCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-cream-50/10 disabled:opacity-30 cursor-pointer"
                title="Halaman Berikutnya"
                aria-label="Halaman Berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Theme Selector (Light, Sepia, Dark) */}
            <div className="flex items-center bg-cream-50/10 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${themeMode === 'light' ? 'bg-cream-50 text-ink-900 shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                title="Mode Terang"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('sepia')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${themeMode === 'sepia' ? 'bg-[#FAF4E6] text-[#433422] shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                title="Mode Sepia (Hangat)"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${themeMode === 'dark' ? 'bg-[#1E1B18] text-[#E4D9C6] shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                title="Mode Malam (Gelap)"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Font Size Toggle */}
            <button
              type="button"
              onClick={cycleFontSize}
              className="rounded-xl p-2 min-h-9 min-w-9 flex items-center justify-center opacity-80 hover:opacity-100 transition hover:bg-cream-50/10 cursor-pointer"
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
          <div className="flex items-center justify-between gap-3 bg-brand-800 text-cream-50 px-4 py-2.5 rounded-2xl shadow-xl border border-brand-600">
            <div className="flex items-center gap-2 text-caption">
              <BookOpen className="h-4 w-4 text-gold-300" />
              <span>Terakhir Anda membaca di <strong>Halaman {resumePrompt.page}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResumePage}
                className="px-2.5 py-1 bg-cream-50 text-brand-900 rounded-lg text-micro font-bold shadow-xs hover:bg-cream-100 transition cursor-pointer"
              >
                Lanjutkan
              </button>
              <button
                type="button"
                onClick={handleDismissResume}
                className="px-2 py-1 text-cream-200 hover:text-cream-50 text-micro font-medium cursor-pointer"
              >
                Abaikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Area */}
      <section className="flex-1 overflow-auto p-3 sm:p-7 select-none">
        {renderContent()}
      </section>

      </main>
  );
};
