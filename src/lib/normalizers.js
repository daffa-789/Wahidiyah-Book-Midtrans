

const EVENT_BADGE_COLORS = {
  Mujahadah: 'bg-brand-50 text-brand-700 border-brand-200',
  Pengajian: 'bg-blue-50 text-blue-700 border-blue-200',
  Kubro: 'bg-amber-50 text-amber-700 border-amber-200',
  Peringatan: 'bg-violet-50 text-violet-700 border-violet-200'
};

export const EMPTY_USER = {
  id: null,
  name: '',
  email: '',
  role: 'user',
  loginMethod: 'email',
  isPro: false,
  activePlan: null,
  avatar: null,
  dob: null,
  subscriptionPeriod: null,
  subscriptionExpiresAt: null,
  createdAt: null
};

export const normalizeUser = (data = {}) => {
  const isPro = Boolean(data.is_pro ?? data.isPro);
  return {
    id: data.id ?? null,
    name: data.name ?? '',
    email: data.email ?? '',
    role: data.role === 'admin' ? 'admin' : 'user',
    loginMethod: data.login_method ?? data.loginMethod ?? 'email',
    isPro,
    activePlan: null,
    avatar: data.avatar || null,
    dob: data.dob || null,
    subscriptionPeriod: isPro ? (data.subscription_period ?? data.subscriptionPeriod ?? null) : null,
    subscriptionExpiresAt: isPro ? (data.subscription_expires_at ?? data.subscriptionExpiresAt ?? null) : null,
    createdAt: data.created_at ?? data.createdAt ?? null
  };
};

export const userSignature = (target = EMPTY_USER) => JSON.stringify([
  target.id ?? null,
  target.name ?? '',
  target.email ?? '',
  target.role ?? 'user',
  target.loginMethod ?? 'email',
  Boolean(target.isPro),
  target.activePlan ?? null,
  target.avatar ?? null,
  target.dob ?? null,
  target.subscriptionPeriod ?? null,
  target.subscriptionExpiresAt ?? null,
  target.createdAt ?? null
]);

export const normalizeBook = (book = {}) => ({
  id: book.id,
  title: book.title || 'Tanpa judul',
  subtitle: book.subtitle || '',
  author: book.author || 'Tidak diketahui',
  category: book.category || 'Umum',
  pages: Number(book.total_pages || book.pages || 0),
  totalPages: Number(book.total_pages || 0),
  isLocked: Boolean(book.is_locked ?? book.isLocked),
  coverUrl: book.has_thumbnail
    ? `/api/books/${encodeURIComponent(book.id)}/thumbnail`
    : (book.cover_url || book.coverUrl || null),
  contentUrl: book.has_content
    ? `/api/books/${encodeURIComponent(book.id)}/content`
    : (book.contentUrl || null),
  contentName: book.content_name || book.contentName || null,
  contentType: book.content_type || book.contentType || (book.content_extension || '').replace('.', ''),
  contentExtension: book.content_extension || '',
  hasContent: Boolean(book.has_content ?? book.hasContent),
  description: book.description || '',
  samplePages: Array.isArray(book.samplePages) ? book.samplePages : [],
  createdAt: book.created_at || book.createdAt || null
});

export const normalizeEvent = (event = {}) => {
  const dateStr = String(event.event_date ?? event.date ?? '').slice(0, 10);
  const timeStart = event.time_start ?? event.timeStart ?? '';
  const timeEnd = event.time_end ?? event.timeEnd ?? '';
  const category = event.category || '';
  return {
    id: event.id,
    title: event.title || 'Tanpa judul',
    date: dateStr,
    timeStart,
    timeEnd,

    time: event.time || [timeStart, timeEnd].filter(Boolean).join(' – '),
    location: event.location || '',
    category,
    description: event.description || '',
    organizer: event.organizer || '',

    showInCarousel: Boolean(event.show_in_carousel ?? event.showInCarousel),
    badgeColor: event.badgeColor || EVENT_BADGE_COLORS[category] || 'bg-cream-100 text-ink-700 border-cream-300',
    createdAt: event.created_at ?? event.createdAt ?? null
  };
};

export const normalizeCarouselSlide = (slide = {}) => {
  const rawImage = String(slide.image_url ?? slide.imageUrl ?? '');
  return {
    id: slide.id,
    title: slide.title || 'Tanpa judul',
    description: slide.description || '',
    imageUrl: /^(data:image\/|https?:\/\/)/i.test(rawImage) ? rawImage : null,
    eventId: slide.event_id ?? slide.eventId ?? null,
    eventDate: String(slide.event_date ?? slide.eventDate ?? '').slice(0, 10) || null,
    sortOrder: Number(slide.sort_order ?? slide.sortOrder ?? 0) || 0,
    isActive: Boolean(slide.is_active ?? slide.isActive ?? true),
    startsAt: String(slide.starts_at ?? slide.startsAt ?? '').slice(0, 10) || null,
    endsAt: String(slide.ends_at ?? slide.endsAt ?? '').slice(0, 10) || null,
    createdAt: slide.created_at ?? slide.createdAt ?? null
  };
};

export const normalizeTransaction = (tx = {}) => ({
  id: tx.id,
  refNo: tx.ref_no ?? tx.refNo ?? '',
  planName: tx.plan_name ?? tx.planName ?? '',
  amount: Number(tx.amount ?? 0),
  adminFee: Number(tx.admin_fee ?? tx.adminFee ?? 0),
  totalPaid: Number(tx.total_paid ?? tx.totalPaid ?? 0),
  paymentMethod: tx.payment_method ?? tx.paymentMethod ?? '',
  status: tx.status ?? '',
  verifiedAt: tx.verified_at ?? tx.verifiedAt ?? null,
  createdAt: tx.created_at ?? tx.createdAt ?? null,
  userName: tx.userName ?? '',
  userEmail: tx.userEmail ?? ''
});
