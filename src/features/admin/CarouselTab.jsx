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
import { withToast } from '@lib/withToast';
import { layout, typography, controls } from '@lib/styles';

const EMPTY_SLIDE_FORM = {
  title: '',
  description: '',
  sort_order: 0,
  is_active: true
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const periodLabel = (slide) => {
  if (!slide.startsAt && !slide.endsAt) return '';
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
      description: slide.description || '',
      sort_order: slide.sortOrder,
      is_active: slide.isActive
    });
  };

  const uploadImage = (slideId, file) => {
    if (!(file instanceof File)) return undefined;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Ukuran gambar melebihi 8 MB.');
      return undefined;
    }
    const data = new FormData();
    data.set('image', file);
    return withToast(
      async () => {
        await apiJson(`/api/carousel/${encodeURIComponent(slideId)}/image`, {
          method: 'POST',
          headers,
          body: data,
          timeoutMs: 60000
        });
        await refreshCarousel();
      },
      'Gambar banner gagal diunggah.',
      'Gambar banner diperbarui.'
    );
  };

  const submitSlide = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Judul banner wajib diisi.');
      return;
    }

    setIsSaving(true);
    // Pesan sukses berbeda untuk tambah vs perbarui, jadi dipasang di dalam
    // aksi; pola galatnya tetap terpusat di `withToast`.
    return withToast(
      async () => {
        const payload = {
          title: form.title.trim(),
          description: (form.description || '').trim(),
          sort_order: Number(form.sort_order) || 0,
          is_active: form.is_active
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
      },
      'Banner gagal disimpan.'
    ).finally(() => setIsSaving(false));
  };

  const toggleActive = (slide) => {
    setBusyId(slide.id);
    return withToast(
      async () => {
        await apiJson(`/api/carousel/${encodeURIComponent(slide.id)}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !slide.isActive })
        });
        await refreshCarousel();
      },
      'Status banner gagal diubah.',
      slide.isActive ? 'Banner dinonaktifkan.' : 'Banner diaktifkan.'
    ).finally(() => setBusyId(null));
  };

  const moveSlide = (slide, direction) => {
    const ordered = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
    const position = ordered.findIndex((item) => item.id === slide.id);
    const neighbour = ordered[position + direction];
    if (!neighbour) return undefined;

    setBusyId(slide.id);
    return withToast(
      async () => {
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
      },
      'Urutan banner gagal diubah.'
    ).finally(() => setBusyId(null));
  };

  const deleteSlide = (slide) => {
    if (!window.confirm(`Hapus banner “${slide.title}”?`)) return undefined;
    setBusyId(slide.id);
    return withToast(
      async () => {
        await apiJson(`/api/carousel/${encodeURIComponent(slide.id)}`, { method: 'DELETE', headers });
        if (editingId === slide.id) resetForm();
        await refreshCarousel();
      },
      'Banner gagal dihapus.',
      'Banner berhasil dihapus.'
    ).finally(() => setBusyId(null));
  };

  const orderedSlides = useMemo(
    () => [...slides].sort((a, b) => a.sortOrder - b.sortOrder),
    [slides]
  );

  return (
    <section className="space-y-6">
      

      {carouselReady === false && (
        <div role="alert" className="rounded-2xl border border-cream-300 bg-cream-100 px-4 py-3 text-body text-ink-800">
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
                    
                    {slide.eventId && (
                      <span className="rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-micro font-bold text-brand-700">
                        Dari agenda
                      </span>
                    )}
                  </div>
                  {slide.description && (
                    <p className="mt-1 line-clamp-2 text-caption text-ink-500">{slide.description}</p>
                  )}
                  {(slide.eventDate || periodLabel(slide)) && (
                    <p className="mt-1 text-caption text-ink-400">
                      {slide.eventDate ? `${dateLabel(slide.eventDate)} ` : ''}{periodLabel(slide)}
                    </p>
                  )}
                </div>

                <div className={layout.rowShrink}>
                  <button
                    type="button"
                    onClick={() => startEdit(slide)}
                    className="rounded-xl border border-cream-300 p-2 text-ink-700 hover:bg-cream-100 transition cursor-pointer"
                    title="Ubah banner"
                  >
                    <Pencil className="h-4 w-4 text-brand-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSlide(slide)}
                    disabled={busyId === slide.id}
                    className="rounded-xl border border-semantic-danger/30 p-2 text-semantic-danger transition hover:bg-semantic-dangerLight disabled:opacity-50 cursor-pointer"
                    title="Hapus banner"
                  >
                    {busyId === slide.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                      className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-caption file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-caption file:font-bold file:text-brand-700"
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
            <h3 className="flex items-center gap-2 text-h3 font-bold text-ink-900">
              {editingId ? <Pencil className={controls.iconBrand} /> : <Plus className={controls.iconBrand} />}
              {editingId ? 'Ubah banner' : 'Tambah banner'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 text-caption font-bold text-ink-400 transition hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" /> Batal
              </button>
            )}
          </div>

          <div>
            <label htmlFor="slide-title" className={typography.fieldLabel}>Judul banner</label>
            <input
              id="slide-title"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Contoh: Mujahadah Kubro Rojabiyah"
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            />
          </div>

          <div>
            <label htmlFor="slide-description" className={typography.fieldLabel}>Deskripsi</label>
            <textarea
              id="slide-description"
              rows="3"
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Keterangan singkat yang tampil di bawah judul..."
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            />
          </div>

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
                className="w-full rounded-xl border border-cream-300 px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-cream-300 px-3 text-small font-bold text-ink-700">
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
                className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-caption file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-caption file:font-bold file:text-brand-700"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-small font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className={controls.spinner} /> : (editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
            {editingId ? 'Simpan perubahan' : 'Tambah banner'}
          </button>
        </form>
      </div>
    </section>
  );
};
