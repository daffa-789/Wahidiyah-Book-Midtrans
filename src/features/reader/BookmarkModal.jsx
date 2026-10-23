import React from 'react';
import { Bookmark, X, Trash2 } from 'lucide-react';

export const BookmarkModal = ({
  isOpen,
  onClose,
  modalRef,
  currentPage,
  isCurrentPageBookmarked,
  onToggleCurrentBookmark,
  bookmarks,
  onSelectBookmark,
  onDeleteBookmark
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmark-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-cream-50 max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-cream-200 space-y-4 focus-visible:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <div className="flex items-center gap-2 text-brand-800">
            <Bookmark className="h-5 w-5 text-brand-700" />
            <h3 id="bookmark-modal-title" className="text-body font-bold text-ink-900">
              Pembatas Buku
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-cream-100 transition cursor-pointer"
            aria-label="Tutup pembatas buku"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Aksi Tandai Halaman Ini */}
        <button
          type="button"
          onClick={onToggleCurrentBookmark}
          className={`w-full py-2.5 px-4 rounded-xl text-caption font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
            isCurrentPageBookmarked
              ? 'bg-semantic-dangerLight text-semantic-danger border border-semantic-danger/30 hover:bg-semantic-dangerLight/80'
              : 'bg-brand-700 text-cream-50 hover:bg-brand-800'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
          <span>
            {isCurrentPageBookmarked ? `Lepas Penanda Hal. ${currentPage}` : `+ Tandai Halaman Ini (Hal. ${currentPage})`}
          </span>
        </button>

        {/* Daftar Penanda yang Tersimpan */}
        <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
          {bookmarks?.length > 0 ? (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-cream-200 bg-cream-100/50 hover:bg-cream-100 transition group"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectBookmark(bm.page);
                    onClose();
                  }}
                  className="flex-1 text-left min-w-0 cursor-pointer"
                  title={`Buka halaman ${bm.page}`}
                >
                  <p className="text-small font-bold text-ink-900 group-hover:text-brand-700 transition">
                    Halaman {bm.page}
                  </p>
                  {bm.note && (
                    <p className="text-caption text-ink-500 truncate">{bm.note}</p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBookmark(bm.id)}
                  className="p-1.5 rounded-lg text-semantic-danger hover:bg-semantic-dangerLight transition cursor-pointer shrink-0"
                  title="Hapus penanda ini"
                  aria-label={`Hapus penanda halaman ${bm.page}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-caption text-ink-500">
              <Bookmark className="h-8 w-8 text-ink-300 mx-auto mb-2 opacity-50" />
              <p>Belum ada halaman yang ditandai.</p>
              <p className="text-micro text-ink-400 mt-1">Tekan tombol di atas untuk menandai halaman ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
