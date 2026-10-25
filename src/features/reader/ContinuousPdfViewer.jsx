import { useEffect, useRef, useState, useCallback } from 'react';
import { pdfjsLib } from './pdfWorkerSetup';

/**
 * ContinuousPdfViewer
 * Penampil PDF dengan model gulir vertikal alami (Continuous Vertical Scroll),
 * pelacakan halaman aktif otomatis (Scroll-Spy), serta perbesaran proporsional
 * yang 100% responsif pada layar Mobile maupun Desktop.
 */
export const ContinuousPdfViewer = ({
  pdfBuffer,
  zoom,
  setZoom,
  currentPage,
  onPageChange,
  targetScrollPage,
  onTargetScrollHandled,
  bookId
}) => {
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageAspect, setPageAspect] = useState(1.414); // Rasio default A4 (tinggi / lebar)
  const [containerWidth, setContainerWidth] = useState(800);
  const [renderedPages, setRenderedPages] = useState({});
  const [loadError, setLoadError] = useState(null);

  // Status Render Task aktif untuk mencegah tabrakan render di canvas yang sama
  const renderTasksRef = useRef({});
  const canvasRefs = useRef({});
  const pageContainerRefs = useRef({});

  // Ref untuk mendeteksi Pinch-to-zoom (2 jari di mobile)
  const touchStartDistRef = useRef(0);
  const initialPinchZoomRef = useRef(100);
  const isPinchingRef = useRef(false);
  const pinchRafRef = useRef(null);

  // 1. Muat Dokumen PDF dari ArrayBuffer
  useEffect(() => {
    if (!pdfBuffer) return;
    let cancelled = false;

    setLoadError(null);
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      cMapPacked: true
    });

    loadingTask.promise
      .then(async (doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        onPageChange?.(1, doc.numPages);

        // Ambil ukuran halaman pertama untuk menghitung rasio aspek
        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0 });
          if (vp.width > 0 && vp.height > 0) {
            setPageAspect(vp.height / vp.width);
          }
        } catch (e) {
          console.warn('[ContinuousPdfViewer] Gagal membaca rasio halaman pertama:', e);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[ContinuousPdfViewer] Gagal memuat PDF:', err);
        setLoadError('Dokumen PDF tidak dapat didekode.');
      });

    return () => {
      cancelled = true;
      loadingTask.destroy().catch(() => {});
    };
  }, [pdfBuffer]);

  // 2. Pantau Lebar Kontainer secara Responsif (ResizeObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 3. Hitung Dimensi Halaman yang Pas (Fit-to-Width)
  // Di layar ponsel (misal lebar 440px): halaman selebar layar minus margin 16px.
  // Di layar desktop: batas kenyamanan membaca maks ~850px pada zoom 100%.
  const isMobile = containerWidth < 640;
  const baseFitWidth = isMobile
    ? Math.max(280, containerWidth - 16)
    : Math.min(Math.max(480, containerWidth - 48), 850);

  const displayPageWidth = Math.round(baseFitWidth * (zoom / 100));
  const displayPageHeight = Math.round(displayPageWidth * pageAspect);

  // 4. Deteksi Zoom Manual: Pinch 2 Jari (Mobile) & Ctrl + Wheel (Desktop)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialPinchZoomRef.current = zoom;
      isPinchingRef.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (isPinchingRef.current && e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartDistRef.current > 10) {
        if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
        pinchRafRef.current = requestAnimationFrame(() => {
          const factor = currentDist / touchStartDistRef.current;
          const targetZoom = Math.min(250, Math.max(50, Math.round(initialPinchZoomRef.current * factor)));
          setZoom(targetZoom);
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (isPinchingRef.current && e.touches.length < 2) {
      isPinchingRef.current = false;
      touchStartDistRef.current = 0;
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const step = delta > 0 ? 5 : -5;
        setZoom((prev) => Math.min(250, Math.max(50, prev + step)));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // 5. Scroll-Spy: Otomatis deteksi halaman yang sedang dibaca saat scroll ke bawah
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pdfDoc || totalPages === 0) return;

    let ticking = false;

    const checkVisiblePage = () => {
      const containerRect = el.getBoundingClientRect();
      const containerCenterY = containerRect.top + containerRect.height / 3;

      let closestPage = 1;
      let minDistance = Infinity;

      for (let p = 1; p <= totalPages; p++) {
        const pageEl = pageContainerRefs.current[p];
        if (!pageEl) continue;

        const rect = pageEl.getBoundingClientRect();
        // Cek jika halaman ini melintasi garis baca atas/tengah
        if (rect.top <= containerCenterY && rect.bottom >= containerCenterY) {
          closestPage = p;
          minDistance = 0;
          break;
        }

        const distance = Math.abs(rect.top - containerCenterY);
        if (distance < minDistance) {
          minDistance = distance;
          closestPage = p;
        }
      }

      if (closestPage !== currentPage) {
        onPageChange?.(closestPage, totalPages);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkVisiblePage);
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [pdfDoc, totalPages, currentPage, onPageChange]);

  // 6. IntersectionObserver untuk Lazy Rendering Canvas Halaman
  // Hanya me-render halaman yang terlihat atau berdekatan (rootMargin 400px)
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return;

    const visiblePages = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-page-number'));
          if (!pageNum) return;

          if (entry.isIntersecting) {
            visiblePages.add(pageNum);
          } else {
            visiblePages.delete(pageNum);
          }
        });

        // Update state halaman yang perlu dirender
        setRenderedPages((prev) => {
          const next = { ...prev };
          let changed = false;

          visiblePages.forEach((p) => {
            if (!next[p]) {
              next[p] = true;
              changed = true;
            }
          });

          return changed ? next : prev;
        });
      },
      {
        root: containerRef.current,
        rootMargin: '400px 0px 400px 0px',
        threshold: 0.01
      }
    );

    for (let p = 1; p <= totalPages; p++) {
      const el = pageContainerRefs.current[p];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pdfDoc, totalPages]);

  // 7. Render Halaman ke Canvas HTML5 Menggunakan PDF.js
  const renderPageCanvas = useCallback(
    async (pageNumber) => {
      if (!pdfDoc || !renderedPages[pageNumber]) return;
      const canvas = canvasRefs.current[pageNumber];
      if (!canvas) return;

      // Batalkan render task sebelumnya jika masih berjalan di canvas ini
      if (renderTasksRef.current[pageNumber]) {
        try {
          renderTasksRef.current[pageNumber].cancel();
        } catch {
          // Abaikan jika sudah selesai
        }
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Hitung skala rendering beresolusi tinggi (Retina / Sharpness)
        const dpr = window.devicePixelRatio || 1;
        const scale = (displayPageWidth / unscaledViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.style.width = `${displayPageWidth}px`;
        canvas.style.height = `${displayPageHeight}px`;

        const ctx = canvas.getContext('2d');
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const task = page.render(renderContext);
        renderTasksRef.current[pageNumber] = task;
        await task.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[ContinuousPdfViewer] Gagal merender halaman ${pageNumber}:`, err);
        }
      } finally {
        delete renderTasksRef.current[pageNumber];
      }
    },
    [pdfDoc, renderedPages, displayPageWidth, displayPageHeight]
  );

  // Trigger render canvas saat renderedPages atau displayPageWidth berubah
  // Debounce 180ms agar transisi animasi CSS zoom berjalan mulus (GPU hardware scaling) tanpa jank render
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.keys(renderedPages).forEach((pageStr) => {
        const pageNum = Number(pageStr);
        if (renderedPages[pageNum]) {
          renderPageCanvas(pageNum);
        }
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [renderedPages, displayPageWidth, renderPageCanvas]);

  // 8. Loncat ke Halaman yang Diminta (Smooth Scroll ke Halaman Tertentu)
  useEffect(() => {
    if (!pdfDoc || totalPages === 0 || !targetScrollPage) return;
    const timer = setTimeout(() => {
      if (targetScrollPage >= 1 && targetScrollPage <= totalPages) {
        const pageEl = pageContainerRefs.current[targetScrollPage];
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          onTargetScrollHandled?.();
        }
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [pdfDoc, targetScrollPage, totalPages, onTargetScrollHandled]);

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center text-ink-500">
        <p className="text-body font-medium text-semantic-danger">{loadError}</p>
      </div>
    );
  }

  // Buat array nomor halaman [1, 2, ..., totalPages]
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex-1 min-h-0 w-full h-full overflow-y-auto overflow-x-auto bg-canvas-subtle flex flex-col items-center py-4 px-2 sm:px-4 select-text overscroll-contain"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: zoom > 100 ? 'pan-x pan-y' : 'pan-y pinch-zoom'
      }}
    >
      {/* Tampilan Daftar Halaman yang Mengalir Vertikal (Continuous Scroll) */}
      <div
        className="flex flex-col items-center gap-4 will-change-[width,height]"
        style={{
          width: `${displayPageWidth}px`,
          transition: 'width 0.25s cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
        {pageNumbers.map((pageNum) => {
          const isVisible = Boolean(renderedPages[pageNum]);

          return (
            <div
              key={pageNum}
              id={`pdf-page-${pageNum}`}
              data-page-number={pageNum}
              ref={(el) => (pageContainerRefs.current[pageNum] = el)}
              className="relative shadow-md md:shadow-lg rounded-sm sm:rounded-md overflow-hidden bg-ui-card border border-ink-200/50 dark:border-ink-700/50 will-change-[width,height]"
              style={{
                width: `${displayPageWidth}px`,
                height: `${displayPageHeight}px`,
                transition: 'width 0.25s cubic-bezier(0.2, 0, 0, 1), height 0.25s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              {isVisible ? (
                <canvas
                  ref={(el) => (canvasRefs.current[pageNum] = el)}
                  className="block w-full h-full"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-ink-50/60 dark:bg-ink-900/40 text-caption text-ink-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mb-2" />
                  <span>Halaman {pageNum}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
