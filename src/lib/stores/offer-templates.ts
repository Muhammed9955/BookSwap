import type { StoreBundleTier, StoreOffer } from '@/types/store'

// ============================================================
// Ready-made offer templates a bookstore can pick from
// (or use as a starting point for a brand-new offer).
// ============================================================

export interface TierTemplate {
  books: number
  gift_books: number
  bookmarks: number
  price: number
}

export interface TierPresetTemplate {
  id: string
  name_ar: string
  name_en: string
  tagline_ar: string
  tiers: TierTemplate[]
}

export interface SeriesTemplate {
  id: string
  name_ar: string
  parts: number
  price: number
}

/** "Pick N books + gift books + bookmarks for a fixed price" ladders */
export const TIER_PRESET_TEMPLATES: TierPresetTemplate[] = [
  {
    id: 'preset-4-levels',
    name_ar: 'كل ما تزود… تكسب أكتر (4 مستويات)',
    name_en: 'The more you add, the more you win (4 levels)',
    tagline_ar: 'كل ما تزود… تكسب أكتر ❤️🔥',
    tiers: [
      { books: 3, gift_books: 1, bookmarks: 3, price: 120 },
      { books: 6, gift_books: 2, bookmarks: 6, price: 240 },
      { books: 10, gift_books: 3, bookmarks: 10, price: 400 },
      { books: 15, gift_books: 4, bookmarks: 15, price: 600 },
    ],
  },
  {
    id: 'preset-5-levels',
    name_ar: 'باقات الـ 5 مستويات (3 → 20 كتاب)',
    name_en: '5-level bundles (3 → 20 books)',
    tagline_ar: 'اختار كتبك والهدايا علينا ♡',
    tiers: [
      { books: 3, gift_books: 1, bookmarks: 3, price: 120 },
      { books: 5, gift_books: 2, bookmarks: 5, price: 200 },
      { books: 10, gift_books: 3, bookmarks: 10, price: 400 },
      { books: 15, gift_books: 4, bookmarks: 15, price: 600 },
      { books: 20, gift_books: 5, bookmarks: 20, price: 800 },
    ],
  },
]

/** 🌟 Arabic series offers */
export const SERIES_TEMPLATES: SeriesTemplate[] = [
  { id: 'series-noah-alalfy', name_ar: 'سلسلة نوح الألفي', parts: 6, price: 310 },
  { id: 'series-because-kiara', name_ar: 'سلسلة لأنها كيارا', parts: 4, price: 270 },
  { id: 'series-005', name_ar: 'سلسلة 005', parts: 4, price: 270 },
  { id: 'series-write-so-not', name_ar: 'سلسلة اكتب حتى لا', parts: 3, price: 200 },
  { id: 'series-ababil', name_ar: 'سلسلة أبابيل', parts: 5, price: 250 },
  { id: 'series-zikola', name_ar: 'سلسلة أرض زيكولا', parts: 3, price: 150 },
  { id: 'series-khawf', name_ar: 'سلسلة خوف', parts: 3, price: 150 },
  { id: 'series-rasael', name_ar: 'سلسلة رسائل', parts: 6, price: 310 },
  { id: 'series-no-man-breaks-me', name_ar: 'سلسلة لن يكسرني رجل', parts: 4, price: 180 },
  { id: 'series-because-god', name_ar: 'سلسلة لأنك الله', parts: 2, price: 100 },
  { id: 'series-recovery', name_ar: 'سلسلة التعافي', parts: 4, price: 220 },
  { id: 'series-off-script', name_ar: 'سلسلة الخروج عن النص', parts: 2, price: 100 },
  { id: 'series-arsas', name_ar: 'سلسلة أرسس', parts: 2, price: 100 },
  { id: 'series-fatsaq-theory', name_ar: 'سلسلة نظرية الفتسق', parts: 2, price: 100 },
  { id: 'series-two-neighbors-rules', name_ar: 'سلسلة قواعد جارتين', parts: 3, price: 150 },
  { id: 'series-balagha-kingdom', name_ar: 'سلسلة مملكة البلاغة', parts: 7, price: 350 },
  { id: 'series-eshq-alzein', name_ar: 'سلسلة عشق الزين', parts: 4, price: 300 },
  { id: 'series-mahfouz-trilogy', name_ar: 'ثلاثية نجيب محفوظ', parts: 3, price: 300 },
  { id: 'series-yasmin', name_ar: 'سلسلة الياسمين', parts: 3, price: 270 },
  { id: 'series-night-in-hell', name_ar: 'سلسلة ليلة في جهنم', parts: 3, price: 150 },
  { id: 'series-all-my-beautiful-things', name_ar: 'سلسلة أنت كل أشيائي الجميلة', parts: 3, price: 150 },
]

/** Rough retail value used to show "you saved X" when the store doesn't enter one */
const AVG_BOOK_RETAIL = 75

function oneMonthWindow() {
  return {
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function tierTitle(t: TierTemplate) {
  const booksWord = t.books >= 11 ? 'كتاب' : 'كتب'
  const giftWord = t.gift_books === 1 ? 'كتاب هدية' : t.gift_books === 2 ? 'كتابين هدية' : `${t.gift_books} كتب هدية`
  return `📚 ${t.books} ${booksWord} + ${giftWord} + ${t.bookmarks} بوك مارك = ${t.price}ج`
}

export function buildTierOffer(
  storeId: string,
  t: TierTemplate,
  opts?: { templateId?: string; tagline?: string; popular?: boolean }
): Omit<StoreOffer, 'id' | 'created_at'> {
  const originalValue = (t.books + t.gift_books) * AVG_BOOK_RETAIL
  return {
    store_id: storeId,
    title: `${t.books} books + ${t.gift_books} gift + ${t.bookmarks} bookmarks = ${t.price} EGP`,
    title_ar: tierTitle(t),
    description_ar: opts?.tagline || 'اختار اللي يعجبك من القائمة، والكتب الهدية من اختيار المكتبة عشوائي 😍',
    offer_type: 'BUNDLE_TIER',
    bundle_buy_qty: t.books,
    bundle_free_qty: t.gift_books,
    bundle_bookmarks: t.bookmarks,
    bundle_price: t.price,
    offer_price: t.price,
    original_price: originalValue,
    book_count: t.books,
    gift_description: `${t.gift_books} ${t.gift_books === 1 ? 'كتاب' : 'كتب'} هدية + ${t.bookmarks} بوك مارك 🔖`,
    template_id: opts?.templateId,
    is_featured: Boolean(opts?.popular),
    status: 'ACTIVE',
    ...oneMonthWindow(),
  }
}

export function buildSeriesOffer(
  storeId: string,
  s: { name_ar: string; parts: number; price: number; original_price?: number; templateId?: string; cover_image_url?: string; description_ar?: string }
): Omit<StoreOffer, 'id' | 'created_at'> {
  const partsLabel = s.parts === 2 ? 'جزئين' : `${s.parts} أجزاء`
  return {
    store_id: storeId,
    title: `${s.name_ar} (${s.parts} parts)`,
    title_ar: `${s.name_ar} — ${partsLabel}`,
    description_ar: s.description_ar || `السلسلة كاملة (${partsLabel}) بسعر خاص 🌟`,
    offer_type: 'SERIES',
    series_name: s.name_ar,
    series_parts: s.parts,
    book_count: s.parts,
    offer_price: s.price,
    bundle_price: s.price,
    original_price: s.original_price || undefined,
    badge_text: '🌟 عروض السلاسل',
    cover_image_url: s.cover_image_url,
    template_id: s.templateId,
    is_featured: false,
    status: 'ACTIVE',
    ...oneMonthWindow(),
  }
}

/**
 * Turn a store's BUNDLE_TIER offers into the tier ladder used by the
 * mix & match bundle builder. Returns null if the store hasn't set any.
 */
export function tiersFromOffers(offers: StoreOffer[]): StoreBundleTier[] | null {
  const tierOffers = offers
    .filter(o => o.offer_type === 'BUNDLE_TIER' && o.status !== 'PAUSED' && o.bundle_buy_qty && (o.offer_price || o.bundle_price))
    .sort((a, b) => (a.bundle_buy_qty || 0) - (b.bundle_buy_qty || 0))

  if (tierOffers.length === 0) return null

  // Keep one offer per book count (latest wins since offers are newest-first)
  const seen = new Set<number>()
  const unique = tierOffers.filter(o => {
    const qty = o.bundle_buy_qty!
    if (seen.has(qty)) return false
    seen.add(qty)
    return true
  })

  return unique.map((o, idx) => {
    const books = o.bundle_buy_qty!
    const gifts = o.bundle_free_qty ?? 0
    const price = (o.offer_price || o.bundle_price)!
    return {
      id: o.id,
      name_ar: o.title_ar || (books >= 11 ? `باكدج الـ ${books} كتاب` : `باكدج الـ ${books} كتب`),
      required_books: books,
      free_gift_books: gifts,
      free_bookmarks: o.bundle_bookmarks ?? books,
      price,
      original_value: o.original_price && o.original_price > price ? o.original_price : (books + gifts) * AVG_BOOK_RETAIL,
      popular: o.is_featured || (unique.length > 2 && idx === 1),
    }
  })
}
