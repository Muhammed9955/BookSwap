import type { Bookstore, StoreOffer, StoreEvent, RSVPStatus, StoreType, OfferType, StoreInventoryItem } from '@/types/store'
import { createClient } from '@/lib/supabase/client'

type SupabaseClient = any

// ─────────────────────────────────────────────────────────────
// CURATED EGYPTIAN BOOKSTORE DEMO DATA (Fallback & Seeding)
// ─────────────────────────────────────────────────────────────

export const DEMO_STORES: Bookstore[] = [
  {
    id: 'store-diwan-zamalek',
    owner_id: 'user-diwan-admin',
    name: 'Diwan Bookstore',
    name_ar: 'مكتبة ديوان',
    slug: 'diwan-bookstore',
    description: 'Premier boutique bookstore offering curated Arabic and English literature, art books, stationery, and cultural events.',
    description_ar: 'المكتبة الثقافية الرائدة في مصر. تشكيلة مختارة بعناية من أحدث الروايات العربية والإنجليزية، كتب الفكر والفن، وفعاليات توقيع الكتب الأسبوعية.',
    store_type: 'BOTH',
    address: '159 26th of July St, Zamalek, Cairo',
    latitude: 30.0612,
    longitude: 31.2185,
    opening_hours: {
      'السبت - الخميس': '9:00 ص - 11:00 م',
      'الجمعة': '1:00 م - 11:00 م',
    },
    website_url: 'https://diwanegypt.com',
    social_links: {
      facebook: 'https://facebook.com/diwanegypt',
      instagram: 'https://instagram.com/diwanstores',
      whatsapp: '+201001234567',
    },
    logo_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
    cover_url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
    is_verified: true,
    total_listings: 1420,
    total_sales: 580,
    total_events: 18,
    rating_average: 4.9,
    rating_count: 240,
    follower_count: 1840,
    is_active: true,
    created_at: '2025-01-10T10:00:00Z',
    offers_count: 2,
  },
  {
    id: 'store-shorouk-downtown',
    owner_id: 'user-shorouk-admin',
    name: 'Dar El Shorouk',
    name_ar: 'دار الشروق',
    slug: 'dar-el-shorouk',
    description: 'Iconic Egyptian publishing house and bookstore home to Naguib Mahfouz, Radwa Ashour, and timeless Arabic literature.',
    description_ar: 'دار النشر العريقة ومكتبة الأدب العربي الكلاسيكي والمعاصر. الموطن الحصري لأعمال أديب نوبل نجيب محفوظ ورضوى عاشور وتوفيق الحكيم.',
    store_type: 'BOTH',
    address: '1 Talaat Harb Square, Downtown, Cairo',
    latitude: 30.0478,
    longitude: 31.2389,
    opening_hours: {
      'يومياً': '10:00 ص - 10:00 م',
    },
    website_url: 'https://shorouk.com',
    social_links: {
      facebook: 'https://facebook.com/shorouk',
      instagram: 'https://instagram.com/shoroukpublish',
      whatsapp: '+201112233445',
    },
    logo_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=250&q=80',
    cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    is_verified: true,
    total_listings: 2600,
    total_sales: 920,
    total_events: 24,
    rating_average: 4.8,
    rating_count: 310,
    follower_count: 2450,
    is_active: true,
    created_at: '2025-01-05T09:00:00Z',
    offers_count: 2,
  },
  {
    id: 'store-azbakeya-heritage',
    owner_id: 'user-azbakeya-admin',
    name: 'Azbakeya Heritage Treasures',
    name_ar: 'كنوز سور الأزبكية التاريخي',
    slug: 'azbakeya-heritage',
    description: 'Centuries of rare, out-of-print, and collectible secondhand books directly from Cairo’s legendary open-air book market.',
    description_ar: 'تراث سور الأزبكية العريق بين يديك: نوادر الكتب، المجلات التاريخية، الطبعات القديمة النادرة، وباقات الكتب المخفضة بأسعار لا تُنافس.',
    store_type: 'OFFLINE',
    address: 'Stall #14, Azbakeya Book Market, Attaba, Cairo',
    latitude: 30.0522,
    longitude: 31.2465,
    opening_hours: {
      'يومياً': '10:00 ص - 9:00 م',
    },
    social_links: {
      facebook: 'https://facebook.com/azbakeya.heritage',
      whatsapp: '+201223344556',
    },
    logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=250&q=80',
    cover_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80',
    is_verified: true,
    total_listings: 980,
    total_sales: 440,
    total_events: 6,
    rating_average: 4.7,
    rating_count: 180,
    follower_count: 980,
    is_active: true,
    created_at: '2025-02-01T12:00:00Z',
    offers_count: 1,
  },
  {
    id: 'store-readers-corner-alex',
    owner_id: 'user-alex-admin',
    name: 'Readers Corner Alexandria',
    name_ar: 'ركن القراء — الإسكندرية',
    slug: 'readers-corner-alex',
    description: 'Cozy coastal community bookstore and reading lounge right on Alexandria’s Corniche, hosting weekly book exchange clubs.',
    description_ar: 'ملتقى عشاق القراءة والكتب على كورنيش الإسكندرية. مساحة هادئة للمطالعة، تبادل الروايات، وباقات كتب شهرية مع فواصل وإهداءات خاصة.',
    store_type: 'OFFLINE',
    address: '42 Corniche El Nile, Shatby, Alexandria',
    latitude: 31.2156,
    longitude: 29.9192,
    opening_hours: {
      'يومياً': '10:00 ص - 12:00 منتصف الليل',
    },
    social_links: {
      facebook: 'https://facebook.com/readerscorner.alex',
      instagram: 'https://instagram.com/readerscorner_alex',
      whatsapp: '+201099887766',
    },
    logo_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=250&q=80',
    cover_url: 'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80',
    is_verified: true,
    total_listings: 730,
    total_sales: 310,
    total_events: 14,
    rating_average: 4.9,
    rating_count: 155,
    follower_count: 1280,
    is_active: true,
    created_at: '2025-02-15T14:00:00Z',
    offers_count: 1,
  },
  {
    id: 'store-bookish-online',
    owner_id: 'user-bookish-admin',
    name: 'Bookish Egypt (Online Deals)',
    name_ar: 'بوكيش إيجيبت — عروض أونلاين',
    slug: 'bookish-egypt',
    description: 'The favorite online book boutique for bundle deals (10, 20, 25 books packages) with custom bookmark gifts and Egypt-wide shipping.',
    description_ar: 'المتجر الإلكتروني الأول لحزم وعروض الكتب المخفضة (باقات 10، 20، 25 كتاب مع هدايا فواصل خشبية ودفاتر قراءة وتوصيل سريع لكافة المحافظات).',
    store_type: 'ONLINE',
    opening_hours: {
      'خدمة العملاء والواتساب': 'متاح 24/7 لاستقبال الطلبات',
    },
    social_links: {
      facebook: 'https://facebook.com/bookishegypt',
      instagram: 'https://instagram.com/bookish_eg',
      whatsapp: '+201011122233',
    },
    logo_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=250&q=80',
    cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
    is_verified: true,
    total_listings: 850,
    total_sales: 1120,
    total_events: 4,
    rating_average: 4.9,
    rating_count: 420,
    follower_count: 3600,
    is_active: true,
    created_at: '2025-01-20T11:00:00Z',
    offers_count: 2,
  },
]

// ─────────────────────────────────────────────────────────────
// DEMO STORE OFFERS (Packages: 10, 20, 25 books with gifts)
// ─────────────────────────────────────────────────────────────

export const DEMO_OFFERS: StoreOffer[] = [
  {
    id: 'offer-bundle-20-books',
    store_id: 'store-bookish-online',
    title: 'The Ultimate Reader Bundle: 20 Novels + Bookmarks & Reading Journal Gift',
    title_ar: 'باقة القارئ النهم: حزمة 20 رواية متنوعة + فواصل خشبية ومفكرة قراءة هدية 🎁',
    description: 'A handpicked package of 20 bestselling fiction, mystery, and classics. Comes with 3 laser-cut wooden bookmarks, aesthetic stickers, and a reading journal.',
    description_ar: 'العرض الأقوى لعشاق القراءة! اختر 20 رواية من أحدث الإصدارات والأكثر مبيعاً بخصم 40%، مع هدية خاصة: 3 فواصل خشبية محفورة بالليزر، ومفكرة أنيقة لتدوين الاقتباسات، وشحن مخفض.',
    offer_type: 'BUNDLE',
    discount_pct: 40,
    bundle_buy_qty: 20,
    bundle_free_qty: 2,
    bundle_price: 650,
    gift_description: '3 فواصل كتب خشبية فاخرة + مفكرة تدوين الاقتباسات + ستيكرز أدبية',
    starts_at: '2026-09-01T00:00:00Z',
    ends_at: '2026-10-31T23:59:59Z',
    stock_limit: 50,
    redemption_count: 34,
    promo_code: 'BUNDLE20',
    cover_image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'offer-bundle-10-books',
    store_id: 'store-bookish-online',
    title: 'Self-Development & Mindset Box: 10 Essential Books',
    title_ar: 'باقة تطوير الذات والإنتاجية: 10 كتب تأسيسية بخصم 35% + فاصل معدني 🎁',
    description: '10 fundamental books in psychology, habits, and mindset including Atomic Habits, Deep Work, and Thinking Fast and Slow in Arabic.',
    description_ar: 'حزمة الـ 10 كتب الأكثر تأثيراً في بناء العادات، التركيز العميق، وإدارة المال والوقت، تشمل العادات الذرية وكتاب الأب الغني والأب الفقير بخصم كبير.',
    offer_type: 'BUNDLE',
    discount_pct: 35,
    bundle_buy_qty: 10,
    bundle_price: 380,
    gift_description: 'فاصل قراءة معدني أنيق مطلي بالذهب + قائمة تتبع القراءة الشهرية',
    starts_at: '2026-09-10T00:00:00Z',
    ends_at: '2026-11-15T23:59:59Z',
    stock_limit: 100,
    redemption_count: 62,
    promo_code: 'GROWTH10',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'offer-diwan-buy3get1',
    store_id: 'store-diwan-zamalek',
    title: 'Buy 3 Get 1 Free on all Contemporary Arabic Literature',
    title_ar: 'عرض ديوان: اشتري 3 كتب واحصل على الرابع مجاناً من قسم الروايات',
    description: 'Select any 4 books from our contemporary Arabic literature collection and the 4th book of equal or lesser value is completely free.',
    description_ar: 'استمتع بأحدث الروايات الصادرة هذا العام. اختر أي 4 روايات عربية وسيكون الكتاب الرابع هدية مجانية بالكامل من مكتبة ديوان.',
    offer_type: 'BUNDLE',
    bundle_buy_qty: 3,
    bundle_free_qty: 1,
    gift_description: 'حقيبة قماشية أنيقة Tote Bag خاصة بمكتبة ديوان مجاناً مع الطلب',
    starts_at: '2026-09-15T00:00:00Z',
    ends_at: '2026-10-25T23:59:59Z',
    redemption_count: 85,
    promo_code: 'DIWAN3PLUS1',
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'offer-azbakeya-clearance',
    store_id: 'store-azbakeya-heritage',
    title: 'Azbakeya Super Box: 25 Vintage & Classic Books for 299 EGP',
    title_ar: 'صندوق الأزبكية الخارق: 25 كتاب كلاسيكي وتاريخي بـ 299 ج فقط! 🔥',
    description: 'Massive clearance package of 25 assorted books from our vintage collection. Great for building your personal home library.',
    description_ar: 'فرصة ذهبية لتأسيس مكتبتك المنزلية! 25 كتاباً من كنوز الأدب العربي والتاريخ والمسرحيات والروايات المترجمة في كرتونة واحدة بسعر التصفية.',
    offer_type: 'CLEARANCE',
    discount_pct: 60,
    bundle_buy_qty: 25,
    bundle_price: 299,
    gift_description: 'مجموعة مجلات أثرية عتيقة من الستينيات هدية تذكارية',
    starts_at: '2026-09-20T00:00:00Z',
    ends_at: '2026-10-30T23:59:59Z',
    stock_limit: 20,
    redemption_count: 16,
    cover_image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    is_featured: false,
    status: 'ACTIVE',
    created_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'offer-shorouk-discount',
    store_id: 'store-shorouk-downtown',
    title: 'Nobel & Classics Month: 25% Off Naguib Mahfouz Complete Works',
    title_ar: 'شهر نوبل: خصم 25% على كافة أعمال أديب نوبل نجيب محفوظ',
    description: 'Special 25% discount on all single editions and boxsets of Naguib Mahfouz at Dar El Shorouk.',
    description_ar: 'احتفالاً بتراث الأدب المصري، خصم 25% فوري على كافة روايات نجيب محفوظ الكلاسيكية والأعمال الكاملة المجلدة.',
    offer_type: 'DISCOUNT',
    discount_pct: 25,
    starts_at: '2026-09-01T00:00:00Z',
    ends_at: '2026-10-31T23:59:59Z',
    promo_code: 'NOBEL25',
    redemption_count: 45,
    cover_image_url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-01T12:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────
// DEMO STORE EVENTS (Author signings, clubs, meetups, RSVP)
// ─────────────────────────────────────────────────────────────

export const DEMO_EVENTS: StoreEvent[] = [
  {
    id: 'event-ahmed-mourad-signing',
    store_id: 'store-diwan-zamalek',
    title: 'Book Signing & Open Discussion with Author Ahmed Mourad',
    title_ar: 'حفل توقيع ومناقشة مفتوحة مع الكاتب أحمد مراد',
    description: 'Join us at Diwan Zamalek for an evening discussing contemporary Egyptian thrillers, screenwriting, and novel adaptations with bestselling author Ahmed Mourad.',
    description_ar: 'أمسية أدبية مميزة في فرع الزمالك لمناقشة أحدث الأعمال الروائية، كواليس الكتابة البوليسية والسيناريو، وتوقيع نسخ القراء.',
    event_type: 'SIGNING',
    starts_at: '2026-10-16T18:00:00Z',
    ends_at: '2026-10-16T21:00:00Z',
    location: 'Diwan Zamalek — Main Garden Hall',
    address: '159 26th of July St, Zamalek, Cairo',
    is_free: true,
    cover_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    max_attendees: 120,
    current_attendees: 84,
    is_active: true,
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'event-cilantro-maadi-swap',
    title: 'Cilantro Maadi Community Book Swap & Coffee Morning',
    title_ar: 'لقاء سيلانترو المعادي: ملتقى تبادل الكتب والقهوة الصباحية ☕📖',
    description: 'Bring 1 to 5 books you have loved and exchange them with fellow Cairo readers over coffee at Cilantro Degla Maadi.',
    description_ar: 'أحضر من كتاب إلى 5 كتب قرأتها وتبادلها مجاناً مع أصدقاء القراءة في المعادي. فرصة رائعة لاكتشاف ترشيحات جديدة والتعرف على مجتمع القراء.',
    event_type: 'EXCHANGE',
    starts_at: '2026-10-17T15:00:00Z',
    ends_at: '2026-10-17T18:00:00Z',
    location: 'Cilantro Cafe, Street 218, Degla, Maadi, Cairo',
    address: 'Cilantro Cafe, Street 218, Degla, Maadi',
    is_free: true,
    cover_image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    max_attendees: 45,
    current_attendees: 38,
    is_active: true,
    created_at: '2026-09-22T14:00:00Z',
  },
  {
    id: 'event-alex-corniche-discussion',
    store_id: 'store-readers-corner-alex',
    title: 'Alexandria Seafront Readers Club: Granada Trilogy Discussion',
    title_ar: 'نادي قراء الإسكندرية: مناقشة ملحمة ثلاثية غرناطة لرئيسة الأدب رضوى عاشور',
    description: 'An open literary circle discussing Radwa Ashour’s Granada Trilogy facing the Mediterranean sunset.',
    description_ar: 'جلسة حوارية ملهمة أمام البحر لمناقشة رائعة رضوى عاشور "ثلاثية غرناطة" في مساحة ركن القراء بالشاطبي مع شاي بالنعناع.',
    event_type: 'DISCUSSION',
    starts_at: '2026-10-22T17:00:00Z',
    ends_at: '2026-10-22T20:00:00Z',
    location: 'Readers Corner Lounge, Shatby Corniche, Alexandria',
    address: '42 Corniche El Nile, Shatby, Alexandria',
    is_free: true,
    cover_image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    max_attendees: 35,
    current_attendees: 29,
    is_active: true,
    created_at: '2026-09-25T11:00:00Z',
  },
  {
    id: 'event-shorouk-summer-sale',
    store_id: 'store-shorouk-downtown',
    title: 'Downtown Cairo Autumn Book Fair & Flash Clearance Day',
    title_ar: 'مهرجان الشروق لخصومات الخريف وتصفية أعداد الكتب النادرة',
    description: 'Up to 50% discount on thousands of literary works, art catalogues, and children’s literature at Talaat Harb branch.',
    description_ar: 'يوم حافل بخصومات تصل إلى 50% على آلاف العناوين والمجلدات الفاخرة وكتب الأطفال بفرع طلعت حرب وسط البلد.',
    event_type: 'SALE',
    starts_at: '2026-10-24T10:00:00Z',
    ends_at: '2026-10-25T22:00:00Z',
    location: 'Dar El Shorouk Downtown, 1 Talaat Harb Square, Cairo',
    address: '1 Talaat Harb Square, Downtown, Cairo',
    is_free: true,
    cover_image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    max_attendees: 300,
    current_attendees: 210,
    is_active: true,
    created_at: '2026-09-26T16:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS (Database-first with fallback to demo data)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all bookstores with optional filters (store_type, city_id, search query)
 */
export async function getBookstores(params?: {
  storeType?: StoreType | 'ALL'
  cityId?: string
  query?: string
  _client?: SupabaseClient
}): Promise<Bookstore[]> {
  try {
    if (!params?._client) return filterDemoStores(params)
    const supabase = params._client
    let q = supabase
      .from('bookstores')
      .select('*')
      .eq('is_active', true)
      .order('rating_average', { ascending: false })

    if (params?.storeType && params.storeType !== 'ALL') {
      q = q.eq('store_type', params.storeType)
    }
    if (params?.cityId) {
      q = q.eq('city_id', params.cityId)
    }

    const { data, error } = await q
    if (error || !data || data.length === 0) {
      return filterDemoStores(params)
    }

    return data as Bookstore[]
  } catch {
    return filterDemoStores(params)
  }
}

function filterDemoStores(params?: {
  storeType?: StoreType | 'ALL'
  cityId?: string
  query?: string
}): Bookstore[] {
  let list = [...DEMO_STORES]
  if (params?.storeType && params.storeType !== 'ALL') {
    list = list.filter(s => s.store_type === params.storeType || s.store_type === 'BOTH')
  }
  if (params?.query) {
    const term = params.query.toLowerCase()
    list = list.filter(
      s =>
        s.name.toLowerCase().includes(term) ||
        (s.name_ar && s.name_ar.includes(term)) ||
        (s.address && s.address.toLowerCase().includes(term))
    )
  }
  return list
}

/**
 * Get bookstore by slug with its active offers and events
 */
export async function getStoreBySlug(slug: string, _client?: SupabaseClient): Promise<{
  store: Bookstore | null
  offers: StoreOffer[]
  events: StoreEvent[]
}> {
  try {
    if (!_client) {
      const demoStore = DEMO_STORES.find(s => s.slug === slug) || null
      if (!demoStore) return { store: null, offers: [], events: [] }
      const offers = DEMO_OFFERS.filter(o => o.store_id === demoStore.id)
      const events = DEMO_EVENTS.filter(e => e.store_id === demoStore.id)
      return { store: demoStore, offers, events }
    }
    const supabase = _client
    const { data: store, error } = await supabase
      .from('bookstores')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !store) {
      const demoStore = DEMO_STORES.find(s => s.slug === slug) || null
      if (!demoStore) return { store: null, offers: [], events: [] }

      const offers = DEMO_OFFERS.filter(o => o.store_id === demoStore.id)
      const events = DEMO_EVENTS.filter(e => e.store_id === demoStore.id)
      return { store: demoStore, offers, events }
    }

    // Fetch store offers & events
    const [{ data: offers }, { data: events }] = await Promise.all([
      supabase.from('store_offers').select('*').eq('store_id', store.id).eq('status', 'ACTIVE'),
      supabase.from('events').select('*').eq('store_id', store.id).eq('is_active', true),
    ])

    return {
      store: store as Bookstore,
      offers: (offers && offers.length > 0 ? offers : DEMO_OFFERS.filter(o => o.store_id === store.id)) as StoreOffer[],
      events: (events && events.length > 0 ? events : DEMO_EVENTS.filter(e => e.store_id === store.id)) as StoreEvent[],
    }
  } catch {
    const demoStore = DEMO_STORES.find(s => s.slug === slug) || null
    if (!demoStore) return { store: null, offers: [], events: [] }
    const offers = DEMO_OFFERS.filter(o => o.store_id === demoStore.id)
    const events = DEMO_EVENTS.filter(e => e.store_id === demoStore.id)
    return { store: demoStore, offers, events }
  }
}

/**
 * Get all active offers & bundle deals across all bookstores in Egypt
 */
export async function getAllOffers(params?: {
  offerType?: OfferType | 'ALL'
  featuredOnly?: boolean
  _client?: SupabaseClient
}): Promise<StoreOffer[]> {
  try {
    if (!params?._client) return filterDemoOffers(params)
    const supabase = params._client
    let q = supabase
      .from('store_offers')
      .select('*, store:bookstores(id, name, name_ar, slug, logo_url, store_type, address)')
      .eq('status', 'ACTIVE')
      .order('is_featured', { ascending: false })

    if (params?.offerType && params.offerType !== 'ALL') {
      q = q.eq('offer_type', params.offerType)
    }
    if (params?.featuredOnly) {
      q = q.eq('is_featured', true)
    }

    const { data, error } = await q
    if (error || !data || data.length === 0) {
      return filterDemoOffers(params)
    }

    return data as StoreOffer[]
  } catch {
    return filterDemoOffers(params)
  }
}

function filterDemoOffers(params?: {
  offerType?: OfferType | 'ALL'
  featuredOnly?: boolean
}): StoreOffer[] {
  let list = DEMO_OFFERS.map(offer => {
    const store = DEMO_STORES.find(s => s.id === offer.store_id)
    return { ...offer, store }
  })

  if (params?.offerType && params.offerType !== 'ALL') {
    list = list.filter(o => o.offer_type === params.offerType)
  }
  if (params?.featuredOnly) {
    list = list.filter(o => o.is_featured)
  }
  return list
}

/**
 * Get all bookstore & reader community events
 */
export async function getAllEvents(_client?: SupabaseClient): Promise<StoreEvent[]> {
  try {
    if (!_client) {
      return DEMO_EVENTS.map(event => {
        const store = DEMO_STORES.find(s => s.id === event.store_id)
        return { ...event, store }
      })
    }
    const supabase = _client
    const { data, error } = await supabase
      .from('events')
      .select('*, store:bookstores(id, name, name_ar, slug, logo_url)')
      .eq('is_active', true)
      .order('starts_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return DEMO_EVENTS.map(event => {
        const store = DEMO_STORES.find(s => s.id === event.store_id)
        return { ...event, store }
      })
    }

    return data as StoreEvent[]
  } catch {
    return DEMO_EVENTS.map(event => {
      const store = DEMO_STORES.find(s => s.id === event.store_id)
      return { ...event, store }
    })
  }
}

/**
 * Follow or unfollow a bookstore
 */
export async function toggleStoreFollow(storeId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: existing } = await supabase
      .from('store_follows')
      .select('store_id')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await supabase.from('store_follows').delete().eq('store_id', storeId).eq('user_id', userId)
      return false // Now not following
    } else {
      await supabase.from('store_follows').insert({ store_id: storeId, user_id: userId })
      return true // Now following
    }
  } catch {
    return true
  }
}

/**
 * RSVP to an event (GOING, MAYBE, NOT_GOING)
 */
export async function rsvpEvent(
  eventId: string,
  userId: string,
  status: RSVPStatus
): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('event_rsvps').upsert({
      event_id: eventId,
      user_id: userId,
      status,
      created_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return true
  }
}

// ─────────────────────────────────────────────────────────────
// STORE INVENTORY & MERCHANT MANAGEMENT SERVICES
// ─────────────────────────────────────────────────────────────

export const DEMO_STORE_INVENTORY: StoreInventoryItem[] = [
  {
    id: 'inv-1',
    store_id: 'store-diwan-zamalek',
    title: 'The Blue Elephant (الفيل الأزرق)',
    title_ar: 'الفيل الأزرق',
    author: 'أحمد مراد (Ahmed Mourad)',
    isbn: '9789770932223',
    category_name: 'روايات وتشويق',
    condition: 'LIKE_NEW',
    price: 130,
    original_price: 170,
    stock_quantity: 18,
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'inv-2',
    store_id: 'store-diwan-zamalek',
    title: 'Palace Walk (بين القصرين)',
    title_ar: 'بين القصرين — ثلاثية القاهرة',
    author: 'نجيب محفوظ (Naguib Mahfouz)',
    isbn: '9789770912345',
    category_name: 'أدب عربي وكلاسيكيات',
    condition: 'NEW',
    price: 160,
    original_price: 200,
    stock_quantity: 25,
    cover_url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    created_at: '2026-09-02T11:00:00Z',
  },
  {
    id: 'inv-3',
    store_id: 'store-diwan-zamalek',
    title: 'Atomic Habits (العادات الذرية)',
    title_ar: 'العادات الذرية — النسخة العربية المعتمدة',
    author: 'جيمس كلير (James Clear)',
    isbn: '9786035091800',
    category_name: 'تطوير الذات وعلم النفس',
    condition: 'NEW',
    price: 190,
    original_price: 240,
    stock_quantity: 40,
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    created_at: '2026-09-03T12:00:00Z',
  },
  {
    id: 'inv-4',
    store_id: 'store-diwan-zamalek',
    title: 'Granada Trilogy (ثلاثية غرناطة)',
    title_ar: 'ثلاثية غرناطة',
    author: 'رضوى عاشور (Radwa Ashour)',
    isbn: '9789770908881',
    category_name: 'روايات وتاريخ',
    condition: 'LIKE_NEW',
    price: 175,
    original_price: 220,
    stock_quantity: 12,
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    created_at: '2026-09-04T13:00:00Z',
  },
  {
    id: 'inv-5',
    store_id: 'store-bookish-online',
    title: 'Mindset: The New Psychology of Success',
    title_ar: 'طريقة التفكير (السيكولوجية الجديدة للنجاح)',
    author: 'كارول دويك (Carol Dweck)',
    isbn: '9780345472327',
    category_name: 'تطوير الذات',
    condition: 'NEW',
    price: 140,
    original_price: 190,
    stock_quantity: 35,
    cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    created_at: '2026-09-05T14:00:00Z',
  },
  {
    id: 'inv-6',
    store_id: 'store-azbakeya-heritage',
    title: 'الأغاني للأصفهاني (طبعة نادرة مجلدة)',
    title_ar: 'كتاب الأغاني لأبي الفرج الأصفهاني (المجلد الأول والثاني)',
    author: 'أبو الفرج الأصفهاني',
    category_name: 'تراث ونوادر',
    condition: 'ACCEPTABLE',
    price: 250,
    original_price: 450,
    stock_quantity: 2,
    cover_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    created_at: '2026-09-06T15:00:00Z',
  },
]

const INVENTORY_STORAGE_KEY = 'waraq_store_inventory_v1'
const STORES_STORAGE_KEY = 'waraq_custom_stores_v1'
const OFFERS_STORAGE_KEY = 'waraq_custom_offers_v1'
const EVENTS_STORAGE_KEY = 'waraq_custom_events_v1'

/**
 * Get bookstore inventory items
 */
export async function getStoreInventory(storeId: string): Promise<StoreInventoryItem[]> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${INVENTORY_STORAGE_KEY}_${storeId}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
  }
  return DEMO_STORE_INVENTORY.filter(item => item.store_id === storeId)
}

/**
 * Add a new book to the bookstore's inventory
 */
export async function addStoreBook(
  item: Omit<StoreInventoryItem, 'id' | 'created_at'>
): Promise<StoreInventoryItem> {
  const newItem: StoreInventoryItem = {
    ...item,
    id: `inv-${Date.now()}`,
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const current = await getStoreInventory(item.store_id)
      const updated = [newItem, ...current]
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${item.store_id}`, JSON.stringify(updated))
    } catch {}
  }

  return newItem
}

/**
 * Delete a book from bookstore inventory
 */
export async function deleteStoreBook(storeId: string, itemId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const current = await getStoreInventory(storeId)
      const updated = current.filter(i => i.id !== itemId)
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${storeId}`, JSON.stringify(updated))
      return true
    } catch {}
  }
  return true
}

/**
 * Update bookstore details (profile, working hours, map location, social channels)
 */
export async function updateBookstore(
  storeId: string,
  updates: Partial<Bookstore>
): Promise<Bookstore> {
  const target = DEMO_STORES.find(s => s.id === storeId) || DEMO_STORES[0]
  const updatedStore: Bookstore = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORES_STORAGE_KEY)
      const map = stored ? JSON.parse(stored) : {}
      map[storeId] = updatedStore
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }

  return updatedStore
}

/**
 * Create a new store offer / bundle package
 */
export async function createStoreOffer(
  offer: Omit<StoreOffer, 'id' | 'created_at'>
): Promise<StoreOffer> {
  const newOffer: StoreOffer = {
    ...offer,
    id: `offer-${Date.now()}`,
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
      const list = stored ? JSON.parse(stored) : []
      list.unshift(newOffer)
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(list))
    } catch {}
  }

  return newOffer
}

/**
 * Delete a store offer
 */
export async function deleteStoreOffer(offerId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        const updated = list.filter((o: any) => o.id !== offerId)
        localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch {}
  }
  return true
}

/**
 * Create a new store event / signing
 */
export async function createStoreEvent(
  event: Omit<StoreEvent, 'id' | 'created_at' | 'current_attendees'>
): Promise<StoreEvent> {
  const newEvent: StoreEvent = {
    ...event,
    id: `event-${Date.now()}`,
    current_attendees: 0,
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
      const list = stored ? JSON.parse(stored) : []
      list.unshift(newEvent)
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(list))
    } catch {}
  }

  return newEvent
}

/**
 * Delete a store event
 */
export async function deleteStoreEvent(eventId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        const updated = list.filter((e: any) => e.id !== eventId)
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch {}
  }
  return true
}
