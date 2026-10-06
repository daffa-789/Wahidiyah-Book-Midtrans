import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, Lock, Type } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiRequest, authHeaders } from '@lib/api';

const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
const PDF_TYPES = new Set(['pdf']);

const getExtension = (book) => String(book?.contentExtension || book?.contentType || '').toLowerCase().replace('.', '');

export const PdfReaderScreen = () => {
  const { activeBook, navigateTo } = useApp();
  const [fontSize, setFontSize] = useState('base');
  const [textContent, setTextContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [contentStatus, setContentStatus] = useState('idle');

  const [reloadToken, setReloadToken] = useState(0);
  const extension = getExtension(activeBook);

  const samplePages = activeBook?.samplePages || [];
  const totalPages = samplePages.length;

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
    return <div className="flex min-h-screen items-center justify-center bg-ink-900 p-6"><div className="max-w-sm rounded-3xl bg-cream-50 p-7 text-center shadow-2xl"><FileText className="mx-auto h-8 w-8 text-brand-600" /><h1 className="mt-4 font-black text-ink-900">Buku belum dipilih</h1><p className="mt-2 text-sm text-ink-400">Pilih buku dari katalog untuk mulai membaca.</p><button type="button" onClick={() => navigateTo('home')} className="mt-5 rounded-2xl bg-brand-700 px-4 py-3 text-sm font-bold text-white">Kembali ke katalog</button></div></div>;
  }

  const lockedCard = (
    <div className="reader-empty-state">
      <Lock className="mx-auto h-9 w-9 text-amber-400" />
      <h2 className="mt-4 text-lg font-black text-white">Konten khusus pembaca Pro</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-300">Aktifkan paket Pro untuk membuka kitab eksklusif ini.</p>
      <button type="button" onClick={() => navigateTo('pro')} className="mt-5 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700">Lihat Paket Pro</button>
    </div>
  );

  const errorCard = (
    <div className="reader-empty-state" role="alert">
      <FileText className="mx-auto h-9 w-9 text-ink-300" />
      <h2 className="mt-4 text-lg font-black text-white">Konten belum dapat dimuat</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-300">Server atau basis data tidak menjawab permintaan konten ini.</p>
      <button type="button" onClick={retryLoadContent} className="mt-5 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700">Coba muat ulang</button>
    </div>
  );

  const renderContent = () => {
    if (PDF_TYPES.has(extension) && activeBook.contentUrl) {

      if (contentStatus === 'locked') return lockedCard;
      if (contentStatus === 'error') return errorCard;
      if (contentStatus === 'loading' || !pdfUrl) {
        return <div className="reader-empty-state" role="status" aria-live="polite">Memuat konten buku…</div>;
      }
      return <div className="mx-auto h-[calc(100vh-6rem)] w-full max-w-5xl overflow-hidden rounded-2xl border border-ink-500 bg-cream-50 shadow-2xl"><iframe title={`Konten ${activeBook.title}`} src={`${pdfUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-0" /></div>;
    }

    if (TEXT_TYPES.has(extension) && activeBook.contentUrl) {
      if (contentStatus === 'loading') return <div className="reader-empty-state" role="status" aria-live="polite">Memuat konten buku…</div>;
      if (contentStatus === 'locked') return lockedCard;
      if (contentStatus === 'error') return errorCard;
      return <article className={`mx-auto w-full max-w-3xl whitespace-pre-wrap rounded-2xl bg-cream-50 p-7 leading-8 text-ink-800 shadow-2xl sm:p-12 ${fontClass} select-text cursor-text`}>{textContent || 'Dokumen tidak berisi teks.'}</article>;
    }

    if (totalPages > 0) {
      return <div className="flex w-full flex-col items-center gap-6 sm:gap-10">{samplePages.map((page, index) => <article key={page.pageNumber || index} className={`w-full max-w-3xl rounded-2xl bg-cream-50 p-7 text-ink-800 shadow-2xl sm:p-12 ${fontClass} select-text cursor-text`}><header className="flex justify-between border-b border-cream-300 pb-4 text-micro font-bold tracking-wider text-ink-300"><span>PERPUSTAKAAN DIGITAL</span><span>HALAMAN {index + 1} DARI {totalPages}</span></header>{page.arabicHeading && <p className="font-arabic my-8 text-center text-2xl text-brand-900">{page.arabicHeading}</p>}<h2 className="mb-6 text-center text-xl font-black text-brand-800">{page.title}</h2><p className="whitespace-pre-line leading-8">{page.content}</p></article>)}</div>;
    }

    return <div className="reader-empty-state"><FileText className="mx-auto h-9 w-9 text-brand-400" /><h2 className="mt-4 text-lg font-black text-white">Lampiran siap dibaca</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-cream-300">{activeBook.contentName ? `${activeBook.contentName} (${extension.toUpperCase() || 'dokumen'}) telah tersimpan.` : 'Konten buku belum ditambahkan.'} Pratinjau format ini belum tersedia di aplikasi. Tidak ada fitur unduh yang disediakan.</p></div>;
  };

  return (
    <main className="flex min-h-screen flex-col bg-ink-800 page-transition">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-900/95 px-3 py-3 text-white backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2"><button type="button" onClick={() => navigateTo('home')} className="rounded-xl p-2 -m-1 min-h-11 min-w-11 flex items-center justify-center text-cream-300 transition hover:bg-cream-50/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Kembali ke katalog" aria-label="Kembali ke katalog"><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0"><h1 className="truncate text-sm font-bold">{activeBook.title}</h1><p className="truncate text-caption text-ink-300">{activeBook.author} {activeBook.contentName ? `• ${activeBook.contentName}` : ''}</p></div></div>
          <div className="flex items-center gap-1"><button type="button" onClick={cycleFontSize} className="rounded-xl p-2 -m-1 min-h-11 min-w-11 flex items-center justify-center text-cream-300 transition hover:bg-cream-50/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Ubah ukuran teks" aria-label="Ubah ukuran teks"><Type className="h-4 w-4" /></button><span className="hidden rounded-lg border border-white/10 px-2 py-1 text-micro font-bold text-cream-300 sm:inline">Baca saja</span></div>
        </div>
      </header>
      <section className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(16,185,129,.13),transparent_32rem)] p-3 sm:p-7">
        {renderContent()}
      </section>
    </main>
  );
};
