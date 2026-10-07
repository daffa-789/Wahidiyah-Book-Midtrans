import { useMemo, useRef, useState } from 'react';
import {
  ImagePlus,
  Images,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { apiJson, authHeaders } from '@lib/api';
import { dateLabel, getTodayStr } from '@lib/date';
import { layout, typography, surfaces, controls } from '@lib/styles';

const EMPTY_SLIDE_FORM = {
  title: '',
  description: '',
  event_date: '',
  sort_order: 0,
  is_active: true,
  starts_at: '',
  ends_at: ''
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const periodLabel = (slide) => {
  if (!slide.startsAt && !slide.endsAt) return 'Tanpa batas waktu';
  if (slide.startsAt && slide.endsAt) return `${dateLabel(slide.startsAt)} – ${dateLabel(slide.endsAt)}`;
  if (slide.startsAt) return `Mulai ${dateLabel(slide.startsAt)}`;
  return `Sampai ${dateLabel(slide.endsAt)}`;
};

const isCurrentlyShowing = (slide) => {
  const today = getTodayStr();
  if (!slide.isActive) return false;
  if (slide.startsAt && slide.startsAt > today) return false;
  if (slide.endsAt && slide.endsAt < today) return false;
  return true;
};

export const CarouselTab = ({ slides, carouselReady, refreshCarousel, sessionToken }) => {
  const [form, setForm] = useState(EMPTY_SLIDE_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const imageInputRef = useRef(null);

  const headers = useMemo(() => authHeaders(sessionToken), [sessionToken]);

  const resetForm = () => {
    setForm(EMPTY_SLIDE_FORM);
    setEditingId(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const startEdit = (slide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title,
      description: slide.description,
      event_date: slide.eventDate || '',
      sort_order: slide.sortOrder,
      is_active: slide.isActive,
      starts_at: slide.startsAt || '',
      ends_at: slide.endsAt || ''
    });
  };

  const uploadImage = async (slideId, file) => {
    if (!(file instanceof File)) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Ukuran gambar melebihi 8 MB.');
      return;
    }
    const data = new FormData();
    data.set('image', file);
    try {
      await apiJson(`/api/carousel/${encodeURIComponent(slideId)}/image`, {
        method: 'POST',
        headers,
        body: data,
        timeoutMs: 60000
      });
      toast.success('Gambar banner diperbarui.');
      await refreshCarousel();
    } catch (error) {
      toast.error(error.message || 'Gambar banner gagal diunggah.');
    }
  };

  const submitSlide = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Judul banner wajib diisi.');
      return;
    }
    if (form.starts_at && form.ends_at && form.ends_at < form.starts_at) {
      toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        event_date: form.event_date || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null
      };

      if (editingId) {
        await apiJson(`/api/carousel/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Banner berhasil diperbarui.');
      } else {
        const created = await apiJson('/api/carousel', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Banner berhasil ditambahkan.');
        const file = imageInputRef.current?.files?.[0];
        if (file && created.slideId) {
          await uploadImage(created.slideId, file);
        }
      }

      resetForm();
      await refreshCarousel();
    } catch (error) {
      toast.error(error.message || 'Banner gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (slide) => {
    setBusyId(slide.id);
    try {
      await apiJson(`/api/carousel/${encodeURIComponent(slide.id)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !slide.isActive })
      });
      toast.success(slide.isActive ? 'Banner dinonaktifkan.' : 'Banner diaktifkan.');
      await refreshCarousel();
    } catch (error) {
      toast.error(error.message || 'Status banner gagal diubah.');
    } finally {
      setBusyId(null);
    }
  };

  const moveSlide = async (slide, direction) => {
    const ordered = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
    const position = ordered.findIndex((item) => item.id === slide.id);
    const neighbour = ordered[position + direction];
    if (!neighbour) return;

    setBusyId(slide.id);
    try {
      const patch = (id, sortOrder) => apiJson(`/api/carousel/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: sortOrder })
      });
      await Promise.all([
        patch(slide.id, neighbour.sortOrder),
        patch(neighbour.id, slide.sortOrder)
      ]);
      await refreshCarousel();
    } catch (error) {
      toast.error(error.message || 'Urutan banner gagal diubah.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteSlide = async (slide) => {
    if (!window.confirm(`Hapus banner “${slide.title}”?`)) return;
    setBusyId(slide.id);
    try {
      await apiJson(`/api/carousel/${encodeURIComponent(slide.id)}`, { method: 'DELETE', headers });
      toast.success('Banner berhasil dihapus.');
      if (editingId === slide.id) resetForm();
      await refreshCarousel();
    } catch (error) {
      toast.error(error.message || 'Banner gagal dihapus.');
    } finally {
      setBusyId(null);
    }
  };

  const orderedSlides = useMemo(
    () => [...slides].sort((a, b) => a.sortOrder - b.sortOrder),
    [slides]
  );

  return (
    <section className="space-y-6">
      <div className={layout.toolbarRow}>
        <div>
          <h2 className={typography.sectionTitle}>Banner beranda</h2>
          <p className={typography.helper}>
            Slide yang tayang di beranda jemaah. Agenda yang ditandai “Tampilkan di Carousel” di tab Agenda
            otomatis muncul di sini.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-2xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-800 sm:self-auto">
          <Images className={controls.iconBrand} />
          {orderedSlides.length} banner · {orderedSlides.filter(isCurrentlyShowing).length} tayang
        </span>
      </div>

      {carouselReady === false && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tabel <code className="font-mono">carousel_slides</code> belum ada di basis data. Jalankan
          <code className="font-mono"> supabase_database/full_setup.sql </code>
          di SQL Editor Supabase, lalu muat ulang halaman ini.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)] items-start">

        <div className="space-y-3">
          {orderedSlides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-cream-300 bg-cream-50 p-10 text-center">
              <Images className={controls.emptyIcon} />
              <p className="mt-3 font-bold text-ink-700">Belum ada banner</p>
              <p className={typography.helper}>
                Tambahkan dari formulir di samping, atau centang “Tampilkan di Carousel” pada sebuah agenda.
              </p>
            </div>
          ) : (
            orderedSlides.map((slide, index) => (
              <article
                key={slide.id}
                className={`flex flex-wrap items-center gap-4 rounded-3xl border bg-cream-50 p-4 shadow-sm transition ${
                  editingId === slide.id ? 'border-brand-400 ring-1 ring-brand-200' : 'border-cream-300'
                }`}
              >
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 to-brand-900">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt="" className={layout.media} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImagePlus className="h-5 w-5 text-cream-100/70" />
                    </div>
                  )}
                </div>

                <div className="min-w-[180px] flex-1">
                  <div className={layout.rowWrap}>
                    <span className="rounded-md bg-cream-200 px-1.5 py-0.5 font-mono text-micro font-bold text-ink-500">
                      #{index + 1}
                    </span>
                    <h3 className="font-bold text-ink-900">{slide.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-micro font-bold ${
                      isCurrentlyShowing(slide)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-cream-200 text-ink-500'
                    }`}>
                      {isCurrentlyShowing(slide) ? 'Tayang' : 'Tidak tayang'}
                    </span>
                    {slide.eventId && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-micro font-bold text-sky-700">
                        Dari agenda
                      </span>
                    )}
                  </div>
                  {slide.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-ink-500">{slide.description}</p>
                  )}
                  <p className="mt-1 text-caption text-ink-400">
                    {slide.eventDate ? `${dateLabel(slide.eventDate)} · ` : ''}{periodLabel(slide)}
                  </p>
                </div>

                <div className={layout.rowShrink}>
                  <button
                    type="button"
                    onClick={() => moveSlide(slide, -1)}
                    disabled={index === 0 || busyId === slide.id}
                    className="rounded-lg border border-cream-300 p-1.5 text-ink-500 transition hover:bg-cream-100 disabled:opacity-40"
                    title="Naikkan urutan"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(slide, 1)}
                    disabled={index === orderedSlides.length - 1 || busyId === slide.id}
                    className="rounded-lg border border-cream-300 p-1.5 text-ink-500 transition hover:bg-cream-100 disabled:opacity-40"
                    title="Turunkan urutan"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(slide)}
                    disabled={busyId === slide.id}
                    className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                      slide.isActive
                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {slide.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(slide)}
                    className="rounded-xl border border-cream-300 p-2 text-ink-600 transition hover:bg-cream-100"
                    title="Ubah banner"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSlide(slide)}
                    disabled={busyId === slide.id}
                    className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    title="Hapus banner"
                  >
                    {busyId === slide.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {editingId === slide.id && (
                  <div className="w-full border-t border-cream-200 pt-3">
                    <label className={typography.fieldLabel} htmlFor={`slide-image-${slide.id}`}>
                      Ganti gambar banner
                    </label>
                    <input
                      id={`slide-image-${slide.id}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      onChange={(e) => uploadImage(slide.id, e.target.files?.[0])}
                      className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-brand-700"
                    />
                    <p className="mt-1 text-caption text-ink-400">PNG/JPEG/WebP, maksimal 8 MB. Otomatis dikompres ke WebP 1600 px.</p>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <form onSubmit={submitSlide} className="space-y-4 rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-cream-200 pb-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
              {editingId ? <Pencil className={controls.iconBrand} /> : <Plus className={controls.iconBrand} />}
              {editingId ? 'Ubah banner' : 'Tambah banner'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 text-xs font-bold text-ink-400 transition hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" /> Batal
              </button>
            )}
          </div>

          <div>
            <label htmlFor="slide-title" className={typography.fieldLabel}>Judul banner *</label>
            <input
              id="slide-title"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Contoh: Mujahadah Kubro Rojabiyah"
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            />
          </div>

          <div>
            <label htmlFor="slide-description" className={typography.fieldLabel}>Deskripsi singkat</label>
            <textarea
              id="slide-description"
              rows="3"
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Keterangan singkat yang tampil di bawah judul..."
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            />
          </div>

          <div>
            <label htmlFor="slide-event-date" className={typography.fieldLabel}>Tanggal kegiatan</label>
            <input
              id="slide-event-date"
              type="date"
              value={form.event_date}
              onChange={(e) => setForm((prev) => ({ ...prev, event_date: e.target.value }))}
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="slide-starts" className={typography.fieldLabel}>Mulai tayang</label>
              <input
                id="slide-starts"
                type="date"
                value={form.starts_at}
                onChange={(e) => setForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              />
            </div>
            <div>
              <label htmlFor="slide-ends" className={typography.fieldLabel}>Selesai tayang</label>
              <input
                id="slide-ends"
                type="date"
                value={form.ends_at}
                onChange={(e) => setForm((prev) => ({ ...prev, ends_at: e.target.value }))}
                className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              />
            </div>
          </div>
          <p className="-mt-2 text-caption text-ink-400">Kosongkan keduanya untuk banner tanpa batas waktu.</p>

          <div className="grid grid-cols-2 items-end gap-2">
            <div>
              <label htmlFor="slide-order" className={typography.fieldLabel}>Urutan slide</label>
              <input
                id="slide-order"
                type="number"
                min="0"
                max="9999"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-cream-300 px-3 text-xs font-bold text-ink-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-cream-300 text-brand-700 focus:ring-brand-300"
              />
              Aktifkan banner
            </label>
          </div>

          {!editingId && (
            <div>
              <label htmlFor="slide-image-new" className={typography.fieldLabel}>
                <Upload className="mr-1 inline h-3.5 w-3.5" /> Gambar banner (opsional)
              </label>
              <input
                id="slide-image-new"
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-brand-700"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className={controls.spinner} /> : (editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
            {editingId ? 'Simpan perubahan' : 'Tambah banner'}
          </button>
        </form>
      </div>
    </section>
  );
};
