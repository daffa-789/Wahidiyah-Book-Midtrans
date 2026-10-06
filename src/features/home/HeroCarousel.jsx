import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { dateLabel, fullDateLabel } from '@lib/date';
import { layout } from '@lib/styles';

const SWIPE_THRESHOLD_PX = 45;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

const HeroCarousel = ({ slides, autoPlay = true, intervalMs = 6000 }) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasFailedImage, setHasFailedImage] = useState({});
  const touchStartX = useRef(null);

  const total = slides.length;

  const goTo = useCallback((next) => {
    if (total === 0) return;
    setIndex(((next % total) + total) % total);
  }, [total]);

  useEffect(() => {
    setIndex(0);
  }, [total]);

  const canAutoPlay = autoPlay && total > 1 && !isPaused && !prefersReducedMotion();

  useEffect(() => {
    if (!canAutoPlay) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [canAutoPlay, intervalMs, total]);

  useEffect(() => {
    if (!autoPlay) return undefined;
    const onHidden = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, [autoPlay]);

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? startX) - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    goTo(deltaX < 0 ? index + 1 : index - 1);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
  };

  const active = slides[index];
  const activeLabel = useMemo(() => {
    if (!active?.eventDate) return null;
    return { short: dateLabel(active.eventDate), long: fullDateLabel(active.eventDate) };
  }, [active]);

  if (total === 0) return null;

  return (
    <section
      className="w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="Pengumuman agenda majelis"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="relative w-full overflow-hidden rounded-3xl border border-brand-200/70 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 shadow-lg shadow-brand-900/10"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/8]">
          {active?.imageUrl && !hasFailedImage[active.id] ? (
            <img
              key={active.id}
              src={active.imageUrl}
              alt={active.title}
              loading="eager"
              decoding="async"
              onError={() => setHasFailedImage((prev) => ({ ...prev, [active.id]: true }))}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,134,11,0.30),transparent_58%)]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-900/45 to-transparent" />

          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-4 sm:p-6 lg:p-8">
              {activeLabel && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/20 px-2.5 py-1 text-micro font-extrabold uppercase tracking-wider text-gold-300 ring-1 ring-gold-400/40">
                  <span aria-hidden="true">🗓️</span>
                  <time dateTime={active.eventDate}>{activeLabel.short}</time>
                  <span className="sr-only"> — {activeLabel.long}</span>
                </p>
              )}
              <h1 className="mt-2.5 font-display text-lg font-bold leading-snug text-cream-50 line-clamp-2 sm:text-2xl lg:text-displayMd">
                {active.title}
              </h1>
              {active.description && (
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-cream-100/80 line-clamp-2 sm:text-sm">
                  {active.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Banner sebelumnya"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-brand-950/45 p-2 text-cream-50 backdrop-blur transition hover:bg-brand-950/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Banner berikutnya"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-brand-950/45 p-2 text-cream-50 backdrop-blur transition hover:bg-brand-950/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className={layout.rowStart} role="tablist" aria-label="Pilih banner">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Banner ${dotIndex + 1}: ${slide.title}`}
                onClick={() => goTo(dotIndex)}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  dotIndex === index ? 'w-7 bg-brand-700' : 'w-2 bg-brand-200 hover:bg-brand-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {autoPlay && (
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                aria-label={isPaused ? 'Jalankan banner otomatis' : 'Jeda banner otomatis'}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-cream-300 bg-white px-2.5 py-1 text-caption font-bold text-ink-600 transition hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span className="hidden sm:inline">{isPaused ? 'Putar' : 'Jeda'}</span>
              </button>
            )}
            <span className="text-caption font-semibold text-ink-400">
              {index + 1} / {total}
            </span>
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        Banner {index + 1} dari {total}: {active?.title}
        {active?.eventDate ? `, ${fullDateLabel(active.eventDate)}` : ''}
      </p>
    </section>
  );
};

export default HeroCarousel;
