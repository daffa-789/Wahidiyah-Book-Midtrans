import { useState, useCallback, useEffect } from 'react';
import { apiJson, readableError } from '@lib/api';
import { normalizeBook, normalizeEvent, normalizeCarouselSlide } from '@lib/normalizers';

export const useCatalogSlice = ({ navigateTo }) => {
  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);
  const [events, setEvents] = useState([]);
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [catalogError, setCatalogError] = useState(null);
  const [agendaError, setAgendaError] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(true);

  const refreshBooks = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      const payload = await apiJson('/api/books');
      const nextBooks = (payload.books || []).map(normalizeBook);
      setBooks(nextBooks);
      setActiveBook((current) => nextBooks.find((book) => book.id === current?.id) || null);
      setCatalogError(null);
      return nextBooks;
    } catch (loadError) {
      setCatalogError(readableError(loadError));
      throw loadError;
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      setLoadingAgenda(true);
      const payload = await apiJson('/api/events');
      const nextEvents = (payload.events || []).map(normalizeEvent);
      setEvents(nextEvents);
      setAgendaError(null);
      return nextEvents;
    } catch (loadError) {
      setAgendaError(readableError(loadError));
      throw loadError;
    } finally {
      setLoadingAgenda(false);
    }
  }, []);

  const refreshCarousel = useCallback(async () => {
    try {
      const payload = await apiJson('/api/carousel');
      setCarouselSlides((payload.slides || []).map(normalizeCarouselSlide));
    } catch {
      setCarouselSlides([]);
    }
  }, []);

  const openReader = useCallback(
    (book) => {
      setActiveBook(book);
      navigateTo('reader');
    },
    [navigateTo],
  );

  useEffect(() => {
    refreshBooks().catch(() => {});
    refreshEvents().catch(() => {});
    refreshCarousel().catch(() => {});
  }, [refreshBooks, refreshEvents, refreshCarousel]);

  return {
    books,
    setBooks,
    activeBook,
    setActiveBook,
    loadingCatalog,
    catalogError,
    refreshBooks,
    openReader,
    events,
    setEvents,
    loadingAgenda,
    agendaError,
    refreshEvents,
    carouselSlides,
    setCarouselSlides,
    refreshCarousel,
  };
};
