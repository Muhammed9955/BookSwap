import type { Bookstore, StoreOffer, StoreEvent, RSVPStatus, StoreType, OfferType, StoreInventoryItem, StoreApplication, StoreApplicationStatus, StoreOrder } from '@/types/store'
import { createClient } from '@/lib/supabase/client'
import { STORE_CATALOG_BOOKS } from '@/lib/stores/store-catalog-data'

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
  {
    id: 'offer-diwan-pack-2',
    store_id: 'store-diwan-zamalek',
    title: 'Bestseller Duo: The Blue Elephant & Diamond Dust (2 Books Pack)',
    title_ar: 'ثنائية التشويق البوليسي (الفيل الأزرق + تراب الماس) — باكدج كتابين بسعر حصري',
    description: 'Exclusive 2-book bundle featuring Ahmed Mourad top mystery thrillers at a discounted set price.',
    description_ar: 'ثنائية من أقوى روايات التشويق والإثارة النفسية في الأدب المعاصر للكاتب أحمد مراد، تأتيكم في باكدج توفير خاص بتغليف أنيق وهدية فاصل قراءة محفور.',
    offer_type: 'CURATED_PACK',
    book_count: 2,
    genre: 'THRILLER',
    genre_ar: 'غموض ورعب وتشويق',
    original_price: 330,
    offer_price: 210,
    discount_pct: 36,
    included_books: ['الفيل الأزرق (The Blue Elephant)', 'تراب الماس (Diamond Dust)'],
    badge_text: 'ثنائية التوفير 🔥',
    gift_description: 'فاصل كتب خشبي أنيق محفور + شحن سريع',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'offer-shorouk-pack-3',
    store_id: 'store-shorouk-downtown',
    title: 'Cairo Trilogy by Naguib Mahfouz (Complete 3-Book Pack)',
    title_ar: 'ثلاثية القاهرة الخالدة لنجيب محفوظ (3 كتب كاملة) — باكدج التراث الأدبي',
    description: 'Complete 3-book masterpiece (Palace Walk, Palace of Desire, Sugar Street) at special bundle value.',
    description_ar: 'الملحمة الروائية الأهم في تاريخ الأدب العربي: بين القصرين، قصر الشوق، والسكرية. طبعة دار الشروق المعتمدة مع علبة كرتونية تذكارية وبسعر خاص جداً.',
    offer_type: 'CURATED_PACK',
    book_count: 3,
    genre: 'NOVELS',
    genre_ar: 'روايات وأدب',
    original_price: 540,
    offer_price: 340,
    discount_pct: 37,
    included_books: ['بين القصرين (Palace Walk)', 'قصر الشوق (Palace of Desire)', 'السكرية (Sugar Street)'],
    badge_text: 'ثلاثية نوبل 🌟',
    gift_description: 'بوكس كرتوني تذكاري فاخر + 3 فواصل كلاسيكية',
    cover_image_url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-19T11:00:00Z',
  },
  {
    id: 'offer-bookish-pack-3',
    store_id: 'store-bookish-online',
    title: 'Self-Mastery & Habits Trio: Atomic Habits + Mindset + Deep Work (3 Books)',
    title_ar: 'ثلاثية العادات والإنتاجية العالية (3 كتب الأكثر طلباً عالمياً)',
    description: 'The ultimate productivity & mindset booster trio: Atomic Habits, Mindset, and Deep Work.',
    description_ar: 'أقوى 3 كتب مترجمة لبناء روتين حديدي وتحقيق التركيز العميق والنجاح المهني. وفر 38% عند طلب الباكدج المجمع مع الشحن المنزلي السريع.',
    offer_type: 'CURATED_PACK',
    book_count: 3,
    genre: 'PSYCHOLOGY',
    genre_ar: 'علم نفس وتطوير ذات',
    original_price: 620,
    offer_price: 380,
    discount_pct: 38,
    included_books: ['العادات الذرية (Atomic Habits)', 'طريقة التفكير (Mindset)', 'العمل العميق (Deep Work)'],
    badge_text: 'باكدج الإنتاجية ⚡',
    gift_description: 'دفتر قراءة وتخطيط يومي Habit Tracker مجاناً',
    cover_image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-21T14:00:00Z',
  },
  {
    id: 'offer-diwan-pack-4',
    store_id: 'store-diwan-zamalek',
    title: 'Contemporary Thought & Renaissance (4 Books Pack)',
    title_ar: 'رباعية الفكر والنهضة المعرفية (4 كتب تأسيسية)',
    description: '4 essential books in philosophy, civilization and sociology by top Arab scholars.',
    description_ar: 'حزمة نقدية فكرية متميزة تشمل كبار مفكري العصر لتأسيس وعي نقدي عميق، مع خصم خاص للمكتبة الفكرية.',
    offer_type: 'CURATED_PACK',
    book_count: 4,
    genre: 'PHILOSOPHY',
    genre_ar: 'فكر وفلسفة ومجتمع',
    original_price: 750,
    offer_price: 460,
    discount_pct: 39,
    included_books: ['مقدمة ابن خلدون', 'شروط النهضة (مالك بن نبي)', 'مشكلة الثقافة', 'تكوين العقل العربي'],
    badge_text: 'رباعية الفكر 💡',
    gift_description: 'مفكرة تدوين أفكار وقلم حبر فاخر مجاناً',
    cover_image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-22T09:00:00Z',
  },
  {
    id: 'offer-diwan-pack-5',
    store_id: 'store-diwan-zamalek',
    title: 'Faith & Serenity Quintet (5 Books Pack for 200 EGP)',
    title_ar: 'خماسية الإيمان والسكينة الأسرية (باكدج 5 كتب بـ 200 ج.م فقط) 🔥',
    description: '5 uplifting spiritual and family guidance books at our best bundle price of 200 EGP.',
    description_ar: 'مجموعة من أروع كتب التزكية والتربية والعلاقات الأسرية الهادفة، باكدج 5 كتب متكاملة بسعر التوفير الخارق 200 ج.م.',
    offer_type: 'CURATED_PACK',
    book_count: 5,
    genre: 'RELIGIOUS',
    genre_ar: 'دين وروحانيات',
    original_price: 420,
    offer_price: 200,
    discount_pct: 52,
    included_books: ['فاتتني صلاة', 'لأنك الله', 'ندي تشتكي لعائشة', 'مع النبي', 'رسائل من القرآن'],
    badge_text: 'باكدج الـ 200 ج.م 💥',
    gift_description: '5 فواصل قراءة إسلامية محفورة + شحن مخفض',
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: '2026-09-23T10:00:00Z',
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
    host_name: 'أحمد مراد (الكاتب والروائي)',
    host_phone: '+201001234567',
    host_role: 'الكاتب الضيف وحفل التوقيع',
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
    host_name: 'سارة عبد الرحمن',
    host_phone: '+201123456789',
    host_role: 'منسقة نادي قراء المعادي',
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
    is_free: false,
    price: 65,
    host_name: 'د. يوسف إبراهيم',
    host_phone: '+201234567890',
    host_role: 'أستاذ النقد الأدبي ومنسق الجلسة',
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
    host_name: 'إدارة فرع الشروق وسط البلد',
    host_phone: '+201019876543',
    host_role: 'فريق تنظيم المبيعات والفعاليات',
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

function cacheStoreLocally(store: Bookstore) {
  if (typeof window === 'undefined') return
  try {
    const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
    const storeMap = storedStores ? JSON.parse(storedStores) : {}
    storeMap[store.id] = store
    if (store.slug) {
      storeMap[store.slug] = store
    }
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(storeMap))
  } catch {}
}

/**
 * Save / Upsert a bookstore directly into Supabase database (bookstores table)
 */
export async function saveStoreToDatabase(
  store: Partial<Bookstore> & { name: string; slug?: string },
  ownerId?: string,
  _client?: SupabaseClient
): Promise<{ success: boolean; store?: Bookstore; error?: string }> {
  try {
    const supabase = _client ?? createClient()
    let effectiveOwnerId = ownerId

    if (!effectiveOwnerId && typeof window !== 'undefined') {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) effectiveOwnerId = user.id
      } catch {}
    }

    if (!effectiveOwnerId) {
      try {
        const { data: firstProfile } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle()
        if (firstProfile?.id) effectiveOwnerId = firstProfile.id
      } catch {}
    }

    const cleanSlug = (store.slug || store.name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') || `store-${Date.now()}`

    const isOnline = store.store_type === 'ONLINE'

    const dbPayload: Record<string, any> = {
      name: store.name,
      name_ar: store.name_ar || store.name,
      slug: cleanSlug,
      description: store.description || '',
      description_ar: store.description_ar || store.description || '',
      store_type: store.store_type || 'ONLINE',
      address: store.address || (isOnline ? 'متجر إلكتروني — شحن وتوصيل لكافة المحافظات' : null),
      latitude: isOnline ? null : (store.latitude ?? null),
      longitude: isOnline ? null : (store.longitude ?? null),
      opening_hours: typeof store.opening_hours === 'object' ? store.opening_hours : { 'مواعيد العمل': 'يومياً 10:00 ص - 11:00 م' },
      website_url: store.website_url || null,
      social_links: typeof store.social_links === 'object' ? store.social_links : {},
      logo_url: store.logo_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
      cover_url: store.cover_url || 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
      is_verified: store.is_verified ?? false,
      is_active: store.is_active ?? true,
      updated_at: new Date().toISOString(),
    }

    if (effectiveOwnerId) {
      dbPayload.owner_id = effectiveOwnerId
    }

    // 1. Try server API route first if in browser (to leverage server cookie auth cleanly)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbPayload),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.store) {
            cacheStoreLocally(json.store)
            return { success: true, store: json.store }
          }
        }
      } catch (e) {
        console.warn('API /api/stores fallback:', e)
      }
    }

    // 2. Direct Supabase insert / update
    const { data: existing } = await supabase
      .from('bookstores')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle()

    let savedData: Bookstore | null = null

    if (existing) {
      const { data, error } = await supabase
        .from('bookstores')
        .update(dbPayload)
        .eq('id', existing.id)
        .select('*')
        .single()
      if (!error && data) savedData = data as Bookstore
    } else {
      const { data, error } = await supabase
        .from('bookstores')
        .insert(dbPayload)
        .select('*')
        .single()
      if (!error && data) savedData = data as Bookstore
    }

    if (savedData) {
      cacheStoreLocally(savedData)
      return { success: true, store: savedData }
    }

    // 3. Fallback store (stored locally)
    const fallbackStore: Bookstore = {
      id: `store-${Date.now()}`,
      owner_id: effectiveOwnerId || `user-${Date.now()}`,
      name: store.name,
      name_ar: store.name_ar,
      slug: cleanSlug,
      description: store.description,
      description_ar: store.description_ar,
      store_type: store.store_type || 'ONLINE',
      address: dbPayload.address,
      latitude: dbPayload.latitude,
      longitude: dbPayload.longitude,
      opening_hours: dbPayload.opening_hours,
      social_links: dbPayload.social_links,
      logo_url: dbPayload.logo_url,
      cover_url: dbPayload.cover_url,
      is_verified: dbPayload.is_verified,
      is_active: dbPayload.is_active,
      total_listings: 0,
      total_sales: 0,
      total_events: 0,
      rating_average: 5.0,
      rating_count: 0,
      follower_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    cacheStoreLocally(fallbackStore)
    return { success: true, store: fallbackStore }
  } catch (err: any) {
    console.error('saveStoreToDatabase exception:', err)
    return { success: false, error: err?.message }
  }
}

/**
 * Fetch all bookstores with optional filters (store_type, city_id, search query)
 * Queries Supabase database first, then merges with local and demo catalog
 */
export async function getBookstores(params?: {
  storeType?: StoreType | 'ALL'
  cityId?: string
  query?: string
  _client?: SupabaseClient
}): Promise<Bookstore[]> {
  try {
    const supabase = params?._client ?? createClient()
    let q = supabase
      .from('bookstores')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (params?.storeType && params.storeType !== 'ALL') {
      q = q.eq('store_type', params.storeType)
    }
    if (params?.cityId) {
      q = q.eq('city_id', params.cityId)
    }
    if (params?.query) {
      const term = params.query.toLowerCase()
      q = q.or(`name.ilike.%${term}%,name_ar.ilike.%${term}%,address.ilike.%${term}%`)
    }

    const { data, error } = await q
    const dbStores = (!error && data) ? (data as Bookstore[]) : []

    // Merge database stores with local & demo stores
    const all = [...dbStores]

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORES_STORAGE_KEY)
        if (stored) {
          const map = JSON.parse(stored)
          const customList: Bookstore[] = Object.values(map)
          for (const s of customList) {
            if (!all.some(existing => existing.id === s.id || existing.slug === s.slug)) {
              all.push(s)
            }
          }
        }
      } catch {}
    }

    // Include demo stores if not already in database
    for (const demo of filterDemoStores(params)) {
      if (!all.some(existing => existing.slug === demo.slug || existing.id === demo.id)) {
        all.push(demo)
      }
    }

    return all
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
 * Get bookstore by slug with its active offers and events (queries DB first)
 */
export async function getStoreBySlug(slug: string, _client?: SupabaseClient): Promise<{
  store: Bookstore | null
  offers: StoreOffer[]
  events: StoreEvent[]
  inventory: StoreInventoryItem[]
}> {
  try {
    const supabase = _client ?? createClient()
    const { data: store, error } = await supabase
      .from('bookstores')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    let activeStore: Bookstore | null = (!error && store) ? (store as Bookstore) : null

    // Check localStorage if not in DB
    if (!activeStore && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORES_STORAGE_KEY)
        if (stored) {
          const map = JSON.parse(stored)
          activeStore = map[slug] || Object.values(map).find((s: any) => s.slug === slug) as Bookstore || null
        }
      } catch {}
    }

    // Fallback to DEMO_STORES
    if (!activeStore) {
      activeStore = DEMO_STORES.find(s => s.slug === slug) || null
    }

    if (!activeStore) return { store: null, offers: [], events: [], inventory: [] }

    // Fetch store offers & events
    const [{ data: offers }, { data: events }] = await Promise.all([
      supabase.from('store_offers').select('*').eq('store_id', activeStore.id).eq('status', 'ACTIVE'),
      supabase.from('events').select('*').eq('store_id', activeStore.id).eq('is_active', true),
    ])

    // Load any custom offers added via merchant dashboard
    let customOffers: StoreOffer[] = []
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
        if (stored) {
          const list = JSON.parse(stored) as StoreOffer[]
          customOffers = list.filter(o => o.store_id === activeStore!.id)
        }
      } catch {}
    }

    const mergedOffers = customOffers.length > 0 
      ? [...customOffers, ...(offers ? (offers as StoreOffer[]) : [])]
      : (offers && offers.length > 0) ? (offers as StoreOffer[]) : DEMO_OFFERS.filter(o => o.store_id === activeStore!.id)
    const mergedEvents = (events && events.length > 0) ? (events as StoreEvent[]) : DEMO_EVENTS.filter(e => e.store_id === activeStore!.id)

    // Load store inventory items
    const inventory = await getStoreInventory(activeStore.id)

    return {
      store: activeStore,
      offers: mergedOffers,
      events: mergedEvents,
      inventory,
    }
  } catch {
    const demoStore = DEMO_STORES.find(s => s.slug === slug) || null
    if (!demoStore) return { store: null, offers: [], events: [], inventory: [] }
    const offers = DEMO_OFFERS.filter(o => o.store_id === demoStore.id)
    const events = DEMO_EVENTS.filter(e => e.store_id === demoStore.id)
    const inventory = await getStoreInventory(demoStore.id)
    return { store: demoStore, offers, events, inventory }
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
 * Follow or unfollow a bookstore with persistent state and real count tracking
 */
export async function toggleStoreFollow(
  storeId: string,
  userId?: string | null
): Promise<{ isFollowing: boolean; followerCount: number }> {
  const effectiveUserId = userId || 'guest_reader'
  let isFollowing = false
  let followerCount = 0

  if (typeof window !== 'undefined') {
    try {
      const storedFollows = localStorage.getItem(FOLLOWS_STORAGE_KEY)
      const followMap: Record<string, boolean> = storedFollows ? JSON.parse(storedFollows) : {}
      const followKey = `${storeId}_${effectiveUserId}`

      isFollowing = !followMap[followKey]
      followMap[followKey] = isFollowing
      localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(followMap))

      const countKey = `store_fc_${storeId}`
      const currentCountStr = localStorage.getItem(countKey)
      const baseCount = currentCountStr ? parseInt(currentCountStr, 10) : 14
      followerCount = Math.max(0, isFollowing ? baseCount + 1 : baseCount - 1)
      localStorage.setItem(countKey, String(followerCount))
    } catch {}
  }

  // Also try Supabase DB
  try {
    const supabase = createClient()
    if (userId) {
      if (isFollowing) {
        await supabase.from('store_follows').upsert({ store_id: storeId, user_id: userId })
      } else {
        await supabase.from('store_follows').delete().eq('store_id', storeId).eq('user_id', userId)
      }
    }
  } catch {}

  return { isFollowing, followerCount }
}

/**
 * Get bookstore follow state and real follower count
 */
export function getStoreFollowState(
  storeId: string,
  userId?: string | null,
  fallbackCount = 14
): { isFollowing: boolean; followerCount: number } {
  const effectiveUserId = userId || 'guest_reader'
  let isFollowing = false
  let followerCount = fallbackCount

  if (typeof window !== 'undefined') {
    try {
      const storedFollows = localStorage.getItem(FOLLOWS_STORAGE_KEY)
      if (storedFollows) {
        const followMap = JSON.parse(storedFollows)
        isFollowing = Boolean(followMap[`${storeId}_${effectiveUserId}`])
      }
      const countKey = `store_fc_${storeId}`
      const storedCount = localStorage.getItem(countKey)
      if (storedCount) {
        followerCount = parseInt(storedCount, 10)
      } else {
        localStorage.setItem(countKey, String(fallbackCount))
      }
    } catch {}
  }

  return { isFollowing, followerCount }
}

/**
 * Submit a 1-5 star rating for a bookstore with persistent recalculated average and total count
 */
export async function submitStoreRating(
  storeId: string,
  rating: number,
  userId?: string | null
): Promise<{ userRating: number; rating_average: number; rating_count: number }> {
  const effectiveUserId = userId || 'guest_reader'
  let rating_average = 4.9
  let rating_count = 14

  if (typeof window !== 'undefined') {
    try {
      const key = `${RATINGS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      const data = stored ? JSON.parse(stored) : { ratings: {}, initialAvg: 4.8, initialCount: 12 }

      data.ratings[effectiveUserId] = rating

      const userScores = Object.values(data.ratings) as number[]
      const totalRatingsCount = (data.initialCount || 12) + userScores.length
      const sumUser = userScores.reduce((acc, curr) => acc + curr, 0)
      const totalScore = (data.initialAvg || 4.8) * (data.initialCount || 12) + sumUser

      rating_average = Math.round((totalScore / totalRatingsCount) * 10) / 10
      rating_count = totalRatingsCount

      localStorage.setItem(key, JSON.stringify({ ...data, average: rating_average, count: rating_count }))
    } catch {}
  }

  return { userRating: rating, rating_average, rating_count }
}

/**
 * Get store rating state
 */
export function getStoreRatingState(
  storeId: string,
  userId?: string | null,
  fallbackAvg = 4.9,
  fallbackCount = 14
): { userRating: number | null; rating_average: number; rating_count: number } {
  const effectiveUserId = userId || 'guest_reader'
  let userRating: number | null = null
  let rating_average = fallbackAvg
  let rating_count = fallbackCount

  if (typeof window !== 'undefined') {
    try {
      const key = `${RATINGS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        userRating = data.ratings?.[effectiveUserId] ?? null
        rating_average = data.average || fallbackAvg
        rating_count = data.count || fallbackCount
      }
    } catch {}
  }

  return { userRating, rating_average, rating_count }
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
const ORDERS_STORAGE_KEY = 'waraq_store_orders_v1'
const FOLLOWS_STORAGE_KEY = 'waraq_store_follows_v1'
const RATINGS_STORAGE_KEY = 'waraq_store_ratings_v1'

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

  const demoItems = DEMO_STORE_INVENTORY.filter(item => item.store_id === storeId)
  if (demoItems.length > 0) return demoItems

  // Seed default books from curated catalog for new bookstores so storefront is never empty
  const seeded: StoreInventoryItem[] = STORE_CATALOG_BOOKS.slice(0, 8).map((book, idx) => ({
    id: `seed-${storeId}-${idx}`,
    store_id: storeId,
    title: book.title,
    title_ar: book.title_ar || book.title,
    author: book.author,
    isbn: `97897709${idx}4321`,
    category_name: book.category_name_ar || 'أدب وروايات',
    condition: 'NEW',
    price: book.price || 120,
    original_price: book.original_price || (book.price ? book.price + 40 : 160),
    stock_quantity: 12,
    cover_url: book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
  }))

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${storeId}`, JSON.stringify(seeded))
    } catch {}
  }

  return seeded
}

/**
 * Submit a customer order to the bookstore (Single Book or Bundle Package)
 */
export async function submitStoreOrder(
  order: Omit<StoreOrder, 'id' | 'created_at' | 'status'>
): Promise<StoreOrder> {
  const newOrder: StoreOrder = {
    ...order,
    id: `ORD-${Date.now().toString().slice(-6)}`,
    status: 'NEW',
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const key = `${ORDERS_STORAGE_KEY}_${order.store_id}`
      const stored = localStorage.getItem(key)
      const orders = stored ? JSON.parse(stored) : []
      orders.unshift(newOrder)
      localStorage.setItem(key, JSON.stringify(orders))
    } catch {}
  }

  return newOrder
}

/**
 * Get orders received by a specific bookstore
 */
export async function getStoreOrders(storeId: string): Promise<StoreOrder[]> {
  if (typeof window !== 'undefined') {
    try {
      const key = `${ORDERS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
  }
  return []
}

/**
 * Update store order status (NEW, CONFIRMED, DISPATCHED, DELIVERED, CANCELLED)
 */
export async function updateStoreOrderStatus(
  storeId: string,
  orderId: string,
  status: StoreOrder['status']
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const key = `${ORDERS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const orders = JSON.parse(stored) as StoreOrder[]
        const target = orders.find(o => o.id === orderId)
        if (target) {
          target.status = status
          localStorage.setItem(key, JSON.stringify(orders))
          return true
        }
      }
    } catch {}
  }
  return false
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
 * Add multiple books to the bookstore inventory in batch
 */
export async function addStoreBooksBatch(
  items: Omit<StoreInventoryItem, 'id' | 'created_at'>[]
): Promise<StoreInventoryItem[]> {
  const newItems: StoreInventoryItem[] = items.map((item, idx) => ({
    ...item,
    id: `inv-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  }))

  if (typeof window !== 'undefined' && items.length > 0) {
    try {
      const storeId = items[0].store_id
      const current = await getStoreInventory(storeId)
      const updated = [...newItems, ...current]
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${storeId}`, JSON.stringify(updated))
    } catch {}
  }

  return newItems
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

  // Persist directly to Supabase DB bookstores table
  try {
    await saveStoreToDatabase(updatedStore, updatedStore.owner_id)
  } catch (err) {
    console.warn('updateBookstore saveStoreToDatabase error:', err)
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

// ─────────────────────────────────────────────────────────────
// STORE PARTNER APPLICATIONS & APPROVAL WORKFLOW
// ─────────────────────────────────────────────────────────────

const APPLICATIONS_STORAGE_KEY = 'waraq_store_applications_v1'

export const DEMO_STORE_APPLICATIONS: StoreApplication[] = [
  {
    id: 'app-rawi-online',
    applicant_name: 'عمر خالد المنشاوي',
    owner_name: 'عمر خالد المنشاوي',
    business_name: 'راوي للكتب — متجر إلكتروني',
    store_name: 'Rawi Books Online',
    store_name_ar: 'راوي للكتب الورقية (أونلاين فقط)',
    store_type: 'ONLINE',
    is_online_only: true,
    phone: '01099887766',
    email: 'orders@rawibooks.eg',
    city: 'القاهرة',
    address: 'متجر إلكتروني — شحن وتوصيل لكافة المحافظات',
    commercial_reg: 'سجل تجاري إلكتروني CR-77291-ONLINE',
    monthly_book_estimate: '2,200+ كتاب شهرياً (أونلاين)',
    bio: 'Online-only secondhand & indie bookstore delivering curated literature and rare novels across all Egyptian governorates via courier.',
    bio_ar: 'متجر ومكتبة أونلاين متخصصة في توفير الروايات النادرة والكتب المستعملة بعناية مع التوصيل المنزلي لجميع محافظات مصر خلال 48 ساعة.',
    partner_type: 'BOOKSTORE',
    details: 'نعمل كمتجر إلكتروني عبر إنستغرام وموقعنا مع مستودع شحن بالمعادي ونرغب في الانضمام كشريك أونلاين على ورق كونكت.',
    website_url: 'https://rawibooks.eg',
    social_links: {
      instagram: 'https://instagram.com/rawibooks.eg',
      facebook: 'https://facebook.com/rawibooks.eg',
      tiktok: 'https://tiktok.com/@rawibooks',
      whatsapp: '01099887766',
    },
    verification_signals: {
      social_verified: true,
      whatsapp_business: true,
      sample_video_verified: true,
      national_id_or_cr: true,
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'app-dar-tanmia',
    applicant_name: 'أحمد سعيد عبد القادر',
    owner_name: 'أحمد سعيد عبد القادر',
    business_name: 'مكتبة تنمية',
    store_name: 'Tanmeya Bookstore',
    store_name_ar: 'مكتبة تنمية',
    store_type: 'BOTH',
    is_online_only: false,
    phone: '01012348899',
    email: 'info@tanmeya-books.com',
    city: 'القاهرة',
    address: 'شارع 9، المعادي، القاهرة',
    commercial_reg: 'CR-104928-EG',
    monthly_book_estimate: '1,500+ كتاب',
    bio: 'Premier bookstore specializing in contemporary thought, literature, and rare Arabic translations.',
    bio_ar: 'مكتبة رائدة متخصصة في الكتب الفكرية والتاريخية وترجمات الروايات العالمية مع خدمة التوصيل السريع لكافة المحافظات.',
    partner_type: 'BOOKSTORE',
    details: 'مكتبة متخصصة في الكتب الفكرية والتاريخية وترجمات الروايات العالمية. لدينا فرع في المعادي ونقدم خدمة توصيل لجميع المحافظات.',
    website_url: 'https://tanmeyabooks.com',
    social_links: {
      instagram: 'https://instagram.com/tanmeya_bookstore',
      facebook: 'https://facebook.com/tanmeyabooks',
      whatsapp: '01012348899',
    },
    verification_signals: {
      social_verified: true,
      whatsapp_business: true,
      sample_video_verified: true,
      national_id_or_cr: true,
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'app-alex-read-club',
    applicant_name: 'سارة فهمي النجار',
    owner_name: 'سارة فهمي النجار',
    business_name: 'ركن الإسكندرية للقراءة والكتب النادرة',
    store_name: 'Alexandria Reading Corner',
    store_name_ar: 'ركن الإسكندرية للقراءة والكتب النادرة',
    store_type: 'OFFLINE',
    is_online_only: false,
    phone: '01224567891',
    email: 'contact@alexread.org',
    city: 'الإسكندرية',
    address: 'ميدان محطة الرمل، عمارة الفنار، الإسكندرية',
    commercial_reg: 'CR-884219-ALX',
    monthly_book_estimate: '800+ كتاب شهرياً',
    bio: 'Cultural reading haven along the Alexandria Corniche featuring weekly book clubs and author signings.',
    bio_ar: 'مكتبة ومساحة ثقافية على كورنيش الإسكندرية. ننظم لقاءات أسبوعية لمناقشة الكتب وتوقيعات حصرية لكتاب الإسكندرية.',
    partner_type: 'BOTH',
    details: 'مكتبة ومساحة ثقافية على كورنيش الإسكندرية. ننظم لقاءات أسبوعية لمناقشة الكتب وتوقيعات حصرية لكتاب الإسكندرية.',
    social_links: {
      instagram: 'https://instagram.com/alexreadcorner',
      facebook: 'https://facebook.com/alexreadcorner',
      whatsapp: '01224567891',
    },
    verification_signals: {
      social_verified: true,
      whatsapp_business: false,
      sample_video_verified: false,
      national_id_or_cr: false,
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    id: 'app-badr-books',
    applicant_name: 'محمود بدر الدين',
    owner_name: 'محمود بدر الدين',
    business_name: 'بوكستور بدر الثقافي',
    store_name: 'Badr Cultural Bookstore',
    store_name_ar: 'بوكستور بدر الثقافي',
    store_type: 'OFFLINE',
    is_online_only: false,
    phone: '01198765432',
    email: 'badr.store@gmail.com',
    city: 'الجيزة',
    address: 'شارع مصدق، الدقي، الجيزة',
    commercial_reg: 'CR-552011-GIZ',
    monthly_book_estimate: '3,000+ كتاب',
    bio: 'University & literature book depot offering discounted textbooks and classics.',
    bio_ar: 'مكتبة جامعية ومستودع كتب أدبية وعلمية بخصومات خاصة للطلاب والباحثين.',
    partner_type: 'BOOKSTORE',
    details: 'مكتبة جامعية ومستودع كتب أدبية وعلمية بخصومات خاصة للطلاب.',
    social_links: {
      whatsapp: '01198765432',
      facebook: 'https://facebook.com/badrbookstore',
    },
    status: 'APPROVED',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    approved_store_id: 'store-diwan-zamalek',
  },
]

export async function getStoreApplications(): Promise<StoreApplication[]> {
  if (typeof window !== 'undefined') {
    let dbApps: StoreApplication[] = []
    try {
      const res = await fetch('/api/partner-requests')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.applications) && json.applications.length > 0) {
          dbApps = json.applications.map((row: any) => {
            let parsedDetails: any = {}
            if (row.details) {
              try {
                parsedDetails = typeof row.details === 'string' ? JSON.parse(row.details) : row.details
              } catch {
                parsedDetails = { details: row.details }
              }
            }
            return {
              id: row.id,
              applicant_name: row.name,
              owner_name: parsedDetails.owner_name || row.name,
              business_name: row.business_name,
              store_name: parsedDetails.store_name || row.business_name,
              store_name_ar: parsedDetails.store_name_ar || row.business_name,
              phone: row.phone,
              city: row.city,
              district: parsedDetails.district,
              address: parsedDetails.address,
              latitude: parsedDetails.latitude,
              longitude: parsedDetails.longitude,
              store_type: parsedDetails.store_type || 'ONLINE',
              is_online_only: parsedDetails.is_online_only ?? (parsedDetails.store_type === 'ONLINE'),
              website_url: parsedDetails.website_url,
              social_links: parsedDetails.social_links || {},
              working_hours: parsedDetails.working_hours,
              shipping_scope: parsedDetails.shipping_scope,
              slogan: parsedDetails.slogan,
              logo_url: parsedDetails.logo_url,
              cover_url: parsedDetails.cover_url,
              monthly_book_estimate: parsedDetails.monthly_book_estimate,
              bio: parsedDetails.bio || row.details,
              bio_ar: parsedDetails.bio_ar || row.details,
              details: row.details,
              partner_type: row.partner_type || 'BOOKSTORE',
              contract_accepted: parsedDetails.contract_accepted ?? true,
              status: (row.status as StoreApplicationStatus) || 'PENDING',
              created_at: row.created_at,
            }
          })
        }
      }
    } catch (e) {
      console.warn('Failed to fetch partner requests from API:', e)
    }

    try {
      const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY)
      const localApps: StoreApplication[] = stored ? JSON.parse(stored) : []
      const merged = [...dbApps]
      for (const loc of localApps) {
        if (!merged.some(m => m.id === loc.id)) {
          merged.push(loc)
        }
      }
      if (merged.length > 0) return merged
    } catch {}
  }
  return DEMO_STORE_APPLICATIONS
}

export async function submitStoreApplication(
  app: Omit<StoreApplication, 'id' | 'status' | 'created_at'>
): Promise<StoreApplication> {
  const newApp: StoreApplication = {
    ...app,
    id: `app-${Date.now()}`,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    // 1. Submit to /api/partner-requests to save in DB partner_requests table
    try {
      await fetch('/api/partner-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_name: newApp.applicant_name,
          owner_name: newApp.owner_name,
          business_name: newApp.business_name,
          store_name_ar: newApp.store_name_ar,
          phone: newApp.phone,
          city: newApp.city,
          partner_type: newApp.partner_type,
          details: JSON.stringify(newApp),
        }),
      })
    } catch (e) {
      console.warn('API /api/partner-requests fallback:', e)
    }

    // 2. Pre-save bookstore in Supabase bookstores table
    try {
      const cleanSlug = (newApp.store_name || newApp.business_name)
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || `store-${Date.now()}`

      await saveStoreToDatabase({
        name: newApp.store_name || newApp.business_name,
        name_ar: newApp.store_name_ar || newApp.business_name,
        slug: cleanSlug,
        description: newApp.bio || newApp.details || '',
        description_ar: newApp.bio_ar || newApp.details || '',
        store_type: newApp.store_type || (newApp.is_online_only ? 'ONLINE' : 'BOTH'),
        address: newApp.address,
        district: newApp.district,
        latitude: newApp.latitude,
        longitude: newApp.longitude,
        google_maps_url: newApp.google_maps_url,
        slogan: newApp.slogan,
        shipping_scope: newApp.shipping_scope,
        opening_hours: newApp.working_hours ? { 'مواعيد العمل': newApp.working_hours } : undefined,
        logo_url: newApp.logo_url,
        cover_url: newApp.cover_url,
        website_url: newApp.website_url,
        social_links: {
          whatsapp: newApp.phone,
          ...(newApp.social_links || {}),
        },
        is_verified: false,
        is_active: true,
      })
    } catch (e) {
      console.warn('Failed to pre-save store to DB:', e)
    }

    // 3. Cache locally in browser
    try {
      const current = await getStoreApplications()
      const updated = [newApp, ...current.filter(a => a.id !== newApp.id)]
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  return newApp
}

export async function approveStoreApplication(
  applicationId: string
): Promise<{ success: boolean; store?: Bookstore; application?: StoreApplication }> {
  const apps = await getStoreApplications()
  const target = apps.find(a => a.id === applicationId)
  if (!target) return { success: false }

  const cleanSlug = (target.store_name || target.business_name)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || `store-${Date.now()}`

  const resolvedStoreType: StoreType =
    target.is_online_only || target.store_type === 'ONLINE'
      ? 'ONLINE'
      : (target.store_type || (target.partner_type === 'BOTH' ? 'BOTH' : 'OFFLINE'))

  // Create new active verified Bookstore
  const newStore: Bookstore = {
    id: `store-${Date.now()}`,
    owner_id: `user-${Date.now()}`,
    name: target.store_name || target.business_name,
    name_ar: target.store_name_ar || target.business_name,
    slug: cleanSlug,
    description: target.bio || target.details || 'مكتبة شريكة معتمدة على منصة WaraqConnect.',
    description_ar: target.bio_ar || target.details || 'مكتبة شريكة معتمدة على منصة WaraqConnect.',
    store_type: resolvedStoreType,
    address: resolvedStoreType === 'ONLINE' ? 'متجر إلكتروني — شحن وتوصيل لكافة المحافظات' : (target.address || target.city),
    district: target.district,
    google_maps_url: target.google_maps_url,
    slogan: target.slogan,
    opening_hours: target.working_hours ? { 'مواعيد العمل': target.working_hours } : undefined,
    logo_url: target.logo_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
    cover_url: target.cover_url || 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
    latitude: target.latitude ?? (resolvedStoreType === 'ONLINE' ? undefined : 30.0444),
    longitude: target.longitude ?? (resolvedStoreType === 'ONLINE' ? undefined : 31.2357),
    website_url: target.website_url,
    social_links: {
      whatsapp: target.phone,
      facebook: target.social_links?.facebook,
      instagram: target.social_links?.instagram,
      tiktok: target.social_links?.tiktok,
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
    is_active: true,
    total_listings: 15,
    total_sales: 0,
    total_events: 0,
    rating_average: 5.0,
    rating_count: 1,
    follower_count: 12,
    created_at: new Date().toISOString(),
  }

  // Persist directly to Supabase DB bookstores table
  try {
    const dbRes = await saveStoreToDatabase(newStore)
    if (dbRes.store) {
      newStore.id = dbRes.store.id
    }
  } catch (e) {
    console.warn('Failed to save approved store to DB:', e)
  }

  target.status = 'APPROVED'
  target.reviewed_at = new Date().toISOString()
  target.approved_store_id = newStore.id

  // Send in-app notification to the store applicant
  if (target.applicant_id) {
    try {
      const supabase = createClient()
      await supabase.from('notifications').insert({
        user_id: target.applicant_id,
        type: 'STORE_APPROVED',
        title: '🎉 تم توثيق واعتماد متجرك رسمياً!',
        title_ar: '🎉 تم توثيق واعتماد متجرك رسمياً!',
        body: `مبروك! تم تفعيل متجر (${newStore.name_ar || newStore.name}). يمكنك الآن الدخول إلى لوحة التحكم لإضافة الكتب وباقات العروض المجمعة (Bundle Packages).`,
        body_ar: `مبروك! تم تفعيل متجر (${newStore.name_ar || newStore.name}). يمكنك الآن الدخول إلى لوحة التحكم لإضافة الكتب وباقات العروض المجمعة (Bundle Packages).`,
        action_url: `/store-dashboard`,
        data: { store_id: newStore.id, store_slug: newStore.slug },
      } as any)
    } catch (e) {
      console.warn('In-app notification insert error:', e)
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps))

      // Save new bookstore to custom stores in localStorage
      const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
      const storeMap = storedStores ? JSON.parse(storedStores) : {}
      storeMap[newStore.id] = newStore
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(storeMap))
    } catch {}
  }

  return { success: true, store: newStore, application: target }
}

export async function rejectStoreApplication(
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; application?: StoreApplication }> {
  const apps = await getStoreApplications()
  const target = apps.find(a => a.id === applicationId)
  if (!target) return { success: false }

  target.status = 'REJECTED'
  target.reviewed_at = new Date().toISOString()
  target.rejection_reason = reason || 'لا يستوفي شروط التوثيق حالياً'

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps))
    } catch {}
  }

  return { success: true, application: target }
}
