'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  MapPin,
  Star,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  Gift,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  Check,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Tag,
  ArrowRight,
  Bookmark,
  Layers,
  Phone,
  Truck,
  Filter,
  ShieldCheck,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn, formatPrice } from '@/lib/utils'
import {
  toggleStoreFollow,
  getStoreFollowState,
  getStoreRatingState,
  submitStoreRating,
  submitStoreOrder,
  rsvpEvent,
} from '@/lib/stores/store-service'
import {
  STORE_CATALOG_BOOKS,
  STORE_BUNDLE_TIERS,
  GENRE_CATEGORIES,
} from '@/lib/stores/store-catalog-data'
import type {
  Bookstore,
  StoreOffer,
  StoreEvent,
  RSVPStatus,
  StoreCatalogBook,
  StoreBundleTier,
  BookGenreCategory,
  StoreInventoryItem,
  StoreOrder,
} from '@/types/store'

interface StoreDetailClientProps {
  store: Bookstore
  offers: StoreOffer[]
  events: StoreEvent[]
  initialInventory?: StoreInventoryItem[]
  currentUserId?: string | null
}

type TabType = 'books' | 'bundle' | 'offers' | 'events' | 'about'

const EGYPT_GOVERNORATES = [
  'القاهرة (Cairo)',
  'الجيزة (Giza)',
  'الإسكندرية (Alexandria)',
  'الدقهلية (Mansoura)',
  'الغربية (Tanta)',
  'الشرقية (Zagazig)',
  'القليوبية (Benha)',
  'المنوفية (Shebin El Koum)',
  'البحيرة (Damanhour)',
  'دمياط (Damietta)',
  'بورسعيد (Port Said)',
  'الإسماعيلية (Ismailia)',
  'السويس (Suez)',
  'الفيوم (Fayoum)',
  'بني سويف (Beni Suef)',
  'المنيا (Minya)',
  'أسيوط (Asyut)',
  'سوهاج (Sohag)',
  'قنا (Qena)',
  'الأقصر (Luxor)',
  'أسوان (Aswan)',
]

export function StoreDetailClient({
  store,
  offers,
  events,
  initialInventory = [],
  currentUserId,
}: StoreDetailClientProps) {
  const { lang, isRTL } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>('books')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(store.follower_count)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [rsvps, setRsvps] = useState<Record<string, RSVPStatus>>({})

  // Real Rating States
  const [ratingAvg, setRatingAvg] = useState(store.rating_average || 4.9)
  const [ratingCount, setRatingCount] = useState(store.rating_count || 14)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [ratingHover, setRatingHover] = useState<number | null>(null)
  const [ratingSuccess, setRatingSuccess] = useState(false)

  // Curated 2-5 Books Pack Modal State & Genre Filter
  const [selectedCuratedPack, setSelectedCuratedPack] = useState<StoreOffer | null>(null)
  const [packModalOpen, setPackModalOpen] = useState(false)
  const [selectedPackGenre, setSelectedPackGenre] = useState<BookGenreCategory | 'ALL'>('ALL')

  // Store Books Catalog & Bundle State
  const [selectedGenre, setSelectedGenre] = useState<BookGenreCategory | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [bundleSelectedBookIds, setBundleSelectedBookIds] = useState<string[]>([])

  // Ordering Modals State
  const [orderingBook, setOrderingBook] = useState<StoreCatalogBook | null>(null)
  const [bundleModalOpen, setBundleModalOpen] = useState(false)

  // Order Details Form State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerCity, setCustomerCity] = useState(EGYPT_GOVERNORATES[0])
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [orderSentSuccess, setOrderSentSuccess] = useState(false)

  // Load Real Follow & Rating State on Mount
  useEffect(() => {
    const followState = getStoreFollowState(store.id, currentUserId, store.follower_count)
    setIsFollowing(followState.isFollowing)
    setFollowerCount(followState.followerCount)

    const ratingState = getStoreRatingState(store.id, currentUserId, store.rating_average, store.rating_count)
    setUserRating(ratingState.userRating)
    setRatingAvg(ratingState.rating_average)
    setRatingCount(ratingState.rating_count)
  }, [store.id, currentUserId, store.follower_count, store.rating_average, store.rating_count])

  // Combine store-specific inventory with curated catalog
  const storeCatalogBooks = useMemo<StoreCatalogBook[]>(() => {
    if (initialInventory && initialInventory.length > 0) {
      const mappedInventory: StoreCatalogBook[] = initialInventory.map(item => ({
        id: item.id,
        title: item.title,
        title_ar: item.title_ar || item.title,
        author: item.author,
        author_ar: item.author,
        category: 'NOVELS',
        category_name_ar: item.category_name || 'أدب وروايات',
        price: item.price,
        original_price: item.original_price || (item.price + 35),
        in_stock: item.stock_quantity > 0,
        cover_url: item.cover_url,
        badge: item.condition === 'NEW' ? 'جديد 🏷️' : 'مستعمل بحالة ممتازة ✨',
      }))
      const existingTitles = new Set(mappedInventory.map(b => b.title.toLowerCase()))
      const rest = STORE_CATALOG_BOOKS.filter(b => !existingTitles.has(b.title.toLowerCase()))
      return [...mappedInventory, ...rest]
    }
    return STORE_CATALOG_BOOKS
  }, [initialInventory])

  // Filtered offers by selected genre (applies to Curated Packs, leaves open mix-and-match bundles visible)
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const isCuratedPack = offer.offer_type === 'CURATED_PACK' || (Boolean(offer.book_count) && offer.book_count! <= 5)
      // 2nd bundle can have many genres so no need to search for: keep it visible!
      if (!isCuratedPack) return true
      if (selectedPackGenre === 'ALL') return true
      return offer.genre === selectedPackGenre
    })
  }, [offers, selectedPackGenre])

  // Filtered books catalog
  const filteredBooks = useMemo(() => {
    return storeCatalogBooks.filter(book => {
      const matchesGenre = selectedGenre === 'ALL' || book.category === selectedGenre
      const q = searchQuery.trim().toLowerCase()
      if (!q) return matchesGenre
      const matchesQuery =
        book.title.toLowerCase().includes(q) ||
        (book.title_ar && book.title_ar.toLowerCase().includes(q)) ||
        book.author.toLowerCase().includes(q) ||
        (book.author_ar && book.author_ar.toLowerCase().includes(q))
      return matchesGenre && matchesQuery
    })
  }, [storeCatalogBooks, selectedGenre, searchQuery])

  // Mix & Match calculations
  const selectedBooksList = useMemo(() => {
    return storeCatalogBooks.filter(b => bundleSelectedBookIds.includes(b.id))
  }, [storeCatalogBooks, bundleSelectedBookIds])

  const selectedCount = selectedBooksList.length

  const currentTier = useMemo(() => {
    if (selectedCount >= 20) return STORE_BUNDLE_TIERS[4]
    if (selectedCount >= 15) return STORE_BUNDLE_TIERS[3]
    if (selectedCount >= 10) return STORE_BUNDLE_TIERS[2]
    if (selectedCount >= 5) return STORE_BUNDLE_TIERS[1]
    if (selectedCount >= 3) return STORE_BUNDLE_TIERS[0]
    return null
  }, [selectedCount])

  const nextTier = useMemo(() => {
    if (selectedCount < 3) return STORE_BUNDLE_TIERS[0]
    if (selectedCount < 5) return STORE_BUNDLE_TIERS[1]
    if (selectedCount < 10) return STORE_BUNDLE_TIERS[2]
    if (selectedCount < 15) return STORE_BUNDLE_TIERS[3]
    if (selectedCount < 20) return STORE_BUNDLE_TIERS[4]
    return null
  }, [selectedCount])

  const booksToNextTier = nextTier ? nextTier.required_books - selectedCount : 0

  const toggleBookInBundle = (bookId: string) => {
    setBundleSelectedBookIds(prev =>
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    )
  }

  const handleOpenSingleBookOrder = (book: StoreCatalogBook) => {
    setOrderingBook(book)
    setOrderSentSuccess(false)
  }

  const handleOpenBundleOrder = () => {
    if (!currentTier) {
      alert(lang === 'ar' ? 'يرجى اختيار 3 كتب على الأقل من القائمة لتفعيل باكدج التوفير!' : 'Please pick at least 3 books to unlock a bundle tier!')
      return
    }
    setBundleModalOpen(true)
    setOrderSentSuccess(false)
  }

  const handleOpenCuratedPackOrder = (pack: StoreOffer) => {
    setSelectedCuratedPack(pack)
    setPackModalOpen(true)
    setOrderSentSuccess(false)
  }

  const executeSingleBookWhatsApp = async (book: StoreCatalogBook) => {
    const storeWhatsapp = store.social_links?.whatsapp || '01012345678'
    const cleanPhone = storeWhatsapp.replace(/[^0-9]/g, '')
    const targetPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone

    // Persist to store orders
    try {
      await submitStoreOrder({
        store_id: store.id,
        order_type: 'SINGLE_BOOK',
        total_price: book.price,
        customer_name: customerName || 'قارئ مهتم',
        customer_phone: customerPhone || 'مذكور في المحادثة',
        customer_city: customerCity,
        customer_address: customerAddress || 'توصيل منزلي',
        customer_notes: customerNotes,
        items: [{
          book_id: book.id,
          title: book.title,
          title_ar: book.title_ar,
          author: book.author,
          price: book.price,
          quantity: 1,
          cover_url: book.cover_url,
        }],
      })
    } catch (e) {
      console.warn('submitStoreOrder error:', e)
    }

    const message = `مرحباً، أود طلب كتاب من مكتبة *${lang === 'ar' && store.name_ar ? store.name_ar : store.name}* عبر منصة *WaraqConnect (ورق كونكت)*:
📖 *الكتاب:* ${book.title_ar || book.title}
✍️ *المؤلف:* ${book.author_ar || book.author}
💰 *السعر:* ${book.price} ج.م (بدلاً من ${book.original_price} ج.م)

*بيانات التوصيل والاستلام:*
👤 *اسم المستلم:* ${customerName || 'قارئ مهتم'}
📱 *رقم الهاتف:* ${customerPhone || 'سيتم تأكيده في المحادثة'}
📍 *المحافظة والعنوان:* ${customerCity} - ${customerAddress || 'المقر'}
${customerNotes ? `📝 *ملاحظات:* ${customerNotes}` : ''}

يرجى تأكيد التوافر وموعد الشحن. شكراً!`

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank')
    setOrderSentSuccess(true)
  }

  const executeBundleWhatsApp = async () => {
    if (!currentTier) return
    const storeWhatsapp = store.social_links?.whatsapp || '01012345678'
    const cleanPhone = storeWhatsapp.replace(/[^0-9]/g, '')
    const targetPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone

    const titlesList = selectedBooksList.map((b, idx) => `${idx + 1}. ${b.title_ar || b.title}`).join('\n')

    // Persist to store orders
    try {
      await submitStoreOrder({
        store_id: store.id,
        order_type: 'BUNDLE_PACKAGE',
        bundle_title: currentTier.name_ar,
        bundle_size: currentTier.required_books,
        total_price: currentTier.price,
        customer_name: customerName || 'قارئ مهتم',
        customer_phone: customerPhone || 'مذكور في المحادثة',
        customer_city: customerCity,
        customer_address: customerAddress || 'توصيل منزلي',
        customer_notes: customerNotes,
        items: selectedBooksList.map(b => ({
          book_id: b.id,
          title: b.title,
          title_ar: b.title_ar,
          author: b.author,
          price: b.price,
          quantity: 1,
          cover_url: b.cover_url,
        })),
      })
    } catch (e) {
      console.warn('submitStoreOrder error:', e)
    }

    const message = `🔥 *طلب باكدج عروض التوفير والهدايا (${currentTier.required_books} كتب)* من مكتبة *${lang === 'ar' && store.name_ar ? store.name_ar : store.name}* عبر منصة *WaraqConnect (ورق كونكت)*:

📦 *نوع الباكدج:* ${currentTier.name_ar}
💰 *السعر الإجمالي:* ${currentTier.price} ج.م (وفرت أكثر من ${currentTier.original_value - currentTier.price} ج.م!)
🎁 *الهدايا المجانية المتضمنة:*
- ${currentTier.free_gift_books} كتاب هدية عشوائي من اختيار المكتبة 😍
- ${currentTier.free_bookmarks} بوك مارك فواصل كتب مجانية 🔖

📚 *قائمة الكتب التي اخترتها بنفسي (${selectedBooksList.length} كتب):*
${titlesList}

*بيانات التوصيل والاستلام:*
👤 *اسم المستلم:* ${customerName || 'قارئ مهتم'}
📱 *رقم الهاتف:* ${customerPhone || 'مذكور في المحادثة'}
📍 *المحافظة والعنوان:* ${customerCity} - ${customerAddress || 'يرجى التنسيق'}
${customerNotes ? `📝 *ملاحظات:* ${customerNotes}` : ''}

يرجى تجهيز الباكدج وتأكيد الشحن. شكراً جزيلاً!`

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank')
    setOrderSentSuccess(true)
  }

  const executeCuratedPackWhatsApp = async () => {
    if (!selectedCuratedPack) return
    const storeWhatsapp = store.social_links?.whatsapp || '01012345678'
    const cleanPhone = storeWhatsapp.replace(/[^0-9]/g, '')
    const targetPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone

    const packTitle = lang === 'ar' && selectedCuratedPack.title_ar ? selectedCuratedPack.title_ar : selectedCuratedPack.title
    const packPrice = selectedCuratedPack.offer_price || selectedCuratedPack.bundle_price || 200
    const booksListText = (selectedCuratedPack.included_books || []).map((t, idx) => `${idx + 1}. ${t}`).join('\n')

    // Persist to store orders
    try {
      await submitStoreOrder({
        store_id: store.id,
        order_type: 'CURATED_PACK',
        pack_title: packTitle,
        pack_image_url: selectedCuratedPack.cover_image_url,
        total_price: packPrice,
        customer_name: customerName || 'قارئ مهتم',
        customer_phone: customerPhone || 'سيتم التأكيد عبر واتساب',
        customer_city: customerCity,
        customer_address: customerAddress || 'توصيل منزلي',
        customer_notes: customerNotes,
        items: (selectedCuratedPack.included_books || []).map((t, idx) => ({
          book_id: `pack-item-${idx}`,
          title: t,
          title_ar: t,
          price: Math.round(packPrice / (selectedCuratedPack.book_count || 2)),
          quantity: 1,
          cover_url: selectedCuratedPack.cover_image_url,
        })),
      })
    } catch (e) {
      console.warn('Error saving store order:', e)
    }

    const message = `🔥 *طلب باكدج عروض خاص (${selectedCuratedPack.book_count || 2} كتب)* من مكتبة *${lang === 'ar' && store.name_ar ? store.name_ar : store.name}* عبر منصة *WaraqConnect (ورق كونكت)*:
📦 *اسم الباكدج:* ${packTitle}
💰 *السعر المخفض للباكدج:* ${packPrice} ج.م ${selectedCuratedPack.original_price ? `(بدلاً من ${selectedCuratedPack.original_price} ج.م)` : ''}
${selectedCuratedPack.gift_description ? `🎁 *الهدايا المرفقة:* ${selectedCuratedPack.gift_description}\n` : ''}
📚 *الكتب المتضمنة في هذا الباكدج:*
${booksListText || 'حسب وصف الباكدج'}

*بيانات الشحن والاستلام:*
👤 *اسم المستلم:* ${customerName || 'قارئ مهتم'}
📱 *رقم الهاتف:* ${customerPhone || 'سيتم التأكيد في المحادثة'}
📍 *المحافظة والعنوان:* ${customerCity} - ${customerAddress || 'المقر'}
${customerNotes ? `📝 *ملاحظات:* ${customerNotes}` : ''}

يرجى تأكيد استلام الطلب وتجهيز الشحن. شكراً!`

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank')
    setOrderSentSuccess(true)
  }

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لمتابعة المتجر' : 'Please log in to follow this store')
      return
    }

    const nextState = !isFollowing
    setIsFollowing(nextState)
    setFollowerCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      await toggleStoreFollow(store.id, currentUserId)
    } catch {
      setIsFollowing(!nextState)
      setFollowerCount(prev => (nextState ? Math.max(0, prev - 1) : prev + 1))
    }
  }

  const handleRatingClick = async (star: number) => {
    setUserRating(star)
    try {
      const res = await submitStoreRating(store.id, star, currentUserId)
      setRatingAvg(res.rating_average)
      setRatingCount(res.rating_count)
      setRatingSuccess(true)
      setTimeout(() => setRatingSuccess(false), 3000)
    } catch {}
  }

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleRsvp = async (eventId: string, status: RSVPStatus) => {
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول لتسجيل الحضور' : 'Please log in to RSVP')
      return
    }
    setRsvps(prev => ({ ...prev, [eventId]: status }))
    await rsvpEvent(eventId, currentUserId, status)
  }

  const storeName = lang === 'ar' && store.name_ar ? store.name_ar : store.name
  const storeDesc = lang === 'ar' && store.description_ar ? store.description_ar : store.description

  return (
    <MainLayout>
      {/* Cover & Hero Section */}
      <div className="relative">
        <div className="relative h-56 sm:h-80 w-full overflow-hidden bg-muted">
          {store.cover_url ? (
            <Image src={store.cover_url} alt={store.name} fill className="object-cover" priority />
          ) : (
            <Image src="/images/cover-placeholder.svg" alt={store.name} fill className="object-cover" priority />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        {/* Store Header Card */}
        <div className="page-container relative -mt-20 sm:-mt-24 z-10">
          <div className="rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              {/* Logo & Basic Info */}
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-4 border-card bg-card shadow-lg shrink-0">
                  {store.logo_url ? (
                    <Image src={store.logo_url} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-black text-2xl text-primary bg-primary/10">
                      {store.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {storeName}
                    </h1>
                    {store.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/15 text-primary border border-primary/30">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'مكتبة موثقة' : 'Verified Store'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                    {storeDesc}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                    {/* Interactive Real Rating Widget */}
                    <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 shadow-2xs">
                      <div className="flex items-center gap-0.5" title={lang === 'ar' ? 'اضغط لتقييم المتجر مباشرة' : 'Click to rate this store'}>
                        {[1, 2, 3, 4, 5].map(star => {
                          const active = (ratingHover !== null ? star <= ratingHover : (userRating ? star <= userRating : star <= Math.round(ratingAvg)))
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingClick(star)}
                              onMouseEnter={() => setRatingHover(star)}
                              onMouseLeave={() => setRatingHover(null)}
                              className="p-0.5 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                              aria-label={`Rate ${star} stars`}
                            >
                              <Star className={cn(
                                "h-3.5 w-3.5 transition-colors",
                                active ? "fill-amber-500 text-amber-500" : "text-amber-500/30"
                              )} />
                            </button>
                          )
                        })}
                      </div>
                      <span className="ms-1 text-xs font-black">{ratingAvg}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">({ratingCount} {lang === 'ar' ? 'تقييم' : 'reviews'})</span>
                      {ratingSuccess && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black animate-in fade-in ms-1">
                          ✓ {lang === 'ar' ? 'تم التقييم!' : 'Saved!'}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{followerCount} {lang === 'ar' ? 'متابع' : 'followers'}</span>
                    </span>

                    {store.address && (
                      <span className="flex items-center gap-1 font-semibold truncate max-w-xs">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions: Follow & Contact Buttons */}
              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing ? 'secondary' : 'default'}
                  className="rounded-xl font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  {isFollowing
                    ? lang === 'ar' ? '✓ تتابع المتجر' : '✓ Following'
                    : lang === 'ar' ? '+ متابعة المتجر' : '+ Follow Store'}
                </Button>

                {store.social_links?.whatsapp && (
                  <a
                    href={`https://wa.me/${store.social_links.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      lang === 'ar'
                        ? `مرحباً، أود الاستفسار عن عروض الكتب من ${storeName} عبر منصة WaraqConnect (ورق كونكت)`
                        : `Hello, I'd like to ask about book offers from ${storeName} via WaraqConnect`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-xl font-bold text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'تواصل واتساب' : 'WhatsApp'}</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-t border-border/80 pt-4 overflow-x-auto">
              {[
                {
                  id: 'books',
                  labelAr: `كتب وأسعار المكتبة (${storeCatalogBooks.length}) 📚`,
                  labelEn: `Books & Prices (${storeCatalogBooks.length}) 📚`,
                  icon: BookOpen,
                },
                {
                  id: 'bundle',
                  labelAr: `عروض باقات التوفير والهدايا 🔥`,
                  labelEn: `Bundle Deals & Gifts 🔥`,
                  icon: Flame,
                },
                {
                  id: 'offers',
                  labelAr: `عروض وكوبونات المتجر (${offers.length}) 🎁`,
                  labelEn: `Store Offers (${offers.length}) 🎁`,
                  icon: Gift,
                },
                {
                  id: 'events',
                  labelAr: `الفعاليات وتوقيع الكتب (${events.length}) 📅`,
                  labelEn: `Events & Signings (${events.length}) 📅`,
                  icon: Calendar,
                },
                {
                  id: 'about',
                  labelAr: 'عن المكتبة والموقع والمواعيد ℹ️',
                  labelEn: 'About & Hours ℹ️',
                  icon: Store,
                },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="page-container py-10 max-w-5xl">
        {/* TAB 0: BOOKS CATALOG & PRICES */}
        {activeTab === 'books' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Promo Banner: Viral Bundle Deal */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-amber-500/10 to-card p-6 sm:p-8 shadow-lg">
              <div className="absolute top-0 end-0 -mt-6 -me-6 h-36 w-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-primary/20 text-primary border border-primary/30">
                  <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500 animate-bounce" />
                  <span>{lang === 'ar' ? 'عرض المكتبة الناري الأقوى' : 'Bestseller Store Offer'}</span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground">
                    {lang === 'ar'
                      ? '🔥 إنت تختار الكتب… وإحنا نزودلك الهدايا 🎁📚'
                      : '🔥 You Choose the Books… We Shower You With Gifts 🎁📚'}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground max-w-2xl">
                    {lang === 'ar'
                      ? 'اختار اللي يعجبك من القائمة، والكتب الهدية من اختيار المكتبة عشوائي 😍 كل ما تزود… تكسب أكتر ❤️🔥'
                      : 'Pick any books from our catalog, and receive free mystery books chosen by our bookstore team!'}
                  </p>
                </div>

                {/* 4 Bundle Tiers Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {STORE_BUNDLE_TIERS.map(tier => (
                    <div
                      key={tier.id}
                      onClick={() => setActiveTab('bundle')}
                      className={cn(
                        "rounded-2xl border p-4 transition-all cursor-pointer relative bg-card/80 backdrop-blur-sm hover:scale-[1.02] hover:shadow-md",
                        tier.popular ? "border-amber-500/60 shadow-xs ring-1 ring-amber-500/40" : "border-border"
                      )}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 start-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-xs">
                          {lang === 'ar' ? 'الأكثر طلباً 🔥' : 'Most Popular'}
                        </span>
                      )}
                      <div className="text-sm font-black text-foreground">{tier.name_ar}</div>
                      <div className="mt-1 text-lg font-black text-primary">
                        {tier.price} ج.م
                        <span className="text-[11px] text-muted-foreground line-through font-semibold ms-1.5">
                          {tier.original_value} ج.م
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground font-semibold">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <BookOpen className="h-3 w-3 text-primary shrink-0" />
                          <span>اختر <strong>{tier.required_books}</strong> كتب</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                          <Gift className="h-3 w-3 shrink-0" />
                          <span>+ {tier.free_gift_books} كتاب هدية عشوائي</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Bookmark className="h-3 w-3 shrink-0" />
                          <span>+ {tier.free_bookmarks} بوك مارك فواصل</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      {lang === 'ar'
                        ? 'يمكنك طلب أي كتاب منفرداً بسعره المخفض، أو تجميع باكدج لتوفير أقصى مبلغ!'
                        : 'Order individual books or mix & match bundles to maximize savings!'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('bundle')}
                    className="rounded-xl font-black text-xs gap-1.5 bg-primary text-primary-foreground shadow-sm cursor-pointer"
                  >
                    <span>{lang === 'ar' ? 'تجميع باكدج التوفير التفاعلي' : 'Open Bundle Builder'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث عن أي كتاب أو كاتب من الـ 115+ عنواناً...' : 'Search books or authors...'}
                    className="w-full rounded-2xl border border-border/80 bg-card ps-10 pe-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Counter of matching books */}
                <div className="text-xs font-black text-muted-foreground shrink-0 self-center">
                  <span>{filteredBooks.length} {lang === 'ar' ? 'كتاب معروض' : 'books shown'}</span>
                </div>
              </div>

              {/* Genre Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {GENRE_CATEGORIES.map(cat => {
                  const isActive = selectedGenre === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedGenre(cat.id)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border shrink-0",
                        isActive
                          ? "bg-foreground text-background border-foreground shadow-xs"
                          : "border-border/80 bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                      )}
                    >
                      <span>{cat.emoji}</span>
                      <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBooks.map(book => {
                const isSelectedInBundle = bundleSelectedBookIds.includes(book.id)
                const title = lang === 'ar' && book.title_ar ? book.title_ar : book.title
                const author = lang === 'ar' && book.author_ar ? book.author_ar : book.author

                return (
                  <div
                    key={book.id}
                    className={cn(
                      "group rounded-3xl border-2 bg-card p-4 transition-all flex flex-col justify-between relative shadow-xs hover:shadow-lg",
                      isSelectedInBundle
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/40"
                        : "border-border/80 hover:border-primary/50"
                    )}
                  >
                    {/* Top action: Bundle selection toggle button */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                        {book.category_name_ar || book.category}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleBookInBundle(book.id)}
                        className={cn(
                          "px-2 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs",
                          isSelectedInBundle
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/70 text-muted-foreground hover:bg-primary/15 hover:text-primary border border-border"
                        )}
                        title={isSelectedInBundle ? "إزالة من باكدج التوفير" : "إضافة إلى باكدج التوفير"}
                      >
                        {isSelectedInBundle ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>في الباكدج</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            <span>باكدج 🔥</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Book Visual Mockup */}
                    <div className="space-y-3">
                      <div className={cn(
                        "relative h-36 rounded-2xl p-4 flex flex-col justify-between text-white shadow-inner bg-gradient-to-tr overflow-hidden",
                        book.cover_color || "from-slate-700 to-slate-900"
                      )}>
                        {/* Book Spine texture & styling */}
                        <div className="absolute top-0 bottom-0 start-0 w-3 bg-black/25 border-e border-white/20" />
                        <div className="space-y-1 relative z-10 ms-2">
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Waraq Books</div>
                          <div className="text-xs font-black line-clamp-2 leading-snug drop-shadow-sm">{title}</div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] opacity-90 relative z-10 ms-2">
                          <span className="truncate max-w-[100px] font-semibold">{author}</span>
                          <span className="flex items-center gap-0.5 font-bold">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            <span>{book.rating || 4.8}</span>
                          </span>
                        </div>

                        <div className="absolute -bottom-4 -end-4 h-16 w-16 rounded-full bg-white/10 blur-xl pointer-events-none" />
                      </div>

                      {/* Info & Price */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {title}
                        </h3>
                        <p className="text-xs text-muted-foreground font-semibold line-clamp-1">
                          {author}
                        </p>
                      </div>

                      {/* Pricing Tag */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-black text-foreground">
                          {book.price} ج.م
                        </span>
                        {book.original_price && (
                          <span className="text-xs text-muted-foreground line-through font-semibold">
                            {book.original_price} ج.م
                          </span>
                        )}
                        <span className="ms-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                          متوفر للشحن
                        </span>
                      </div>
                    </div>

                    {/* Action: Single Book Order button */}
                    <div className="pt-3 mt-3 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSingleBookOrder(book)}
                        className="w-full rounded-xl text-xs font-bold gap-1.5 border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer shadow-2xs"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        <span>{lang === 'ar' ? 'طلب الكتاب منفرد' : 'Order Single'}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-5xl">🔍</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد كتب مطابقة لبحثك' : 'No books matched your search'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'جرب البحث باسم كتاب آخر أو اختر تصنيفاً مختلفاً من القائمة.'
                    : 'Try searching another title or select a different category.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchQuery(''); setSelectedGenre('ALL') }}
                  className="rounded-xl text-xs font-bold mt-2 cursor-pointer"
                >
                  {lang === 'ar' ? 'عرض جميع الكتب' : 'Show All Books'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: MIX & MATCH BUNDLE BUILDER */}
        {activeTab === 'bundle' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Header description */}
            <div className="space-y-2 border-b border-border/80 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                <Flame className="h-4 w-4" />
                <span>{lang === 'ar' ? 'عروض باقات التوفير الكبرى' : 'Mega Bundle Deals'}</span>
              </div>
              <h2 className="text-2xl font-black text-foreground">
                {lang === 'ar'
                  ? 'مجمّع باقات التوفير والهدايا (Mix & Match)'
                  : 'Mix & Match Bundle Builder'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                {lang === 'ar'
                  ? 'اختر كتبك المفضلة من القائمة، وبمجرد وصولك لأحد مستويات الباكدج (3، 6، 10، أو 15 كتاباً) ستحصل على السعر المخفض وهدايا فواصل وكتب مجانية عشوائية من اختيار المكتبة!'
                  : 'Select your preferred books. As soon as you hit 3, 6, 10, or 15 books, you unlock the discounted bundle pricing plus free gifts!'}
              </p>
            </div>

            {/* 4 Tiers Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STORE_BUNDLE_TIERS.map(tier => {
                const isCurrent = currentTier?.id === tier.id
                const isReached = selectedCount >= tier.required_books

                return (
                  <div
                    key={tier.id}
                    className={cn(
                      "rounded-3xl border-2 p-6 transition-all relative overflow-hidden flex flex-col justify-between",
                      isCurrent
                        ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/40"
                        : isReached
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-border/80 bg-card"
                    )}
                  >
                    {tier.popular && (
                      <span className="absolute top-4 end-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                        {lang === 'ar' ? 'الأكثر طلباً 🔥' : 'Most Popular'}
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📚</span>
                          <h3 className="text-lg font-black text-foreground">{tier.name_ar}</h3>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-black text-primary">{tier.price} ج.م</span>
                          <span className="text-xs text-muted-foreground line-through font-semibold">
                            {tier.original_value} ج.م
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg ms-auto">
                            {lang === 'ar' ? `وفرت ${tier.original_value - tier.price} ج.م` : `Save ${tier.original_value - tier.price} EGP`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs font-semibold rounded-2xl bg-muted/40 p-3.5 border border-border/60">
                        <div className="flex items-center gap-2 text-foreground font-bold">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span>اختر <strong>{tier.required_books}</strong> كتب من قائمتنا</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
                          <Gift className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>+ {tier.free_gift_books} كتاب هدية عشوائي من اختيار المكتبة 😍</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                          <Bookmark className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>+ {tier.free_bookmarks} بوك مارك فواصل كتب مجاناً 🔖</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        {selectedCount >= tier.required_books
                          ? '✅ تم فتح هذا العرض'
                          : `تبقّى ${tier.required_books - selectedCount} كتب للفتح`}
                      </span>

                      {isCurrent && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-primary text-primary-foreground shadow-xs">
                          {lang === 'ar' ? 'العرض النشط حالياً ✨' : 'Current Active Tier'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Current Selection Status & Big Action Bar */}
            <div className="rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <span>{lang === 'ar' ? 'كتبك المختارة في الباكدج' : 'Selected Bundle Books'}</span>
                    <Badge variant="default" className="text-xs font-black">
                      {selectedCount} {lang === 'ar' ? 'كتب' : 'books'}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentTier
                      ? lang === 'ar'
                        ? `🎉 تهانينا! فتحت "${currentTier.name_ar}" بسعر ${currentTier.price} ج.م + ${currentTier.free_gift_books} كتاب هدية!`
                        : `Congratulations! Unlocked ${currentTier.name_ar} for ${currentTier.price} EGP!`
                      : lang === 'ar'
                      ? `اختر ${booksToNextTier} كتب إضافية لتفعيل باكدج الـ 3 كتب والحصول على كتاب هدية مجاناً!`
                      : `Pick ${booksToNextTier} more books to unlock the first 3-book tier!`}
                  </p>
                </div>

                {/* Progress bar towards next tier */}
                {nextTier && (
                  <div className="w-full sm:w-64 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                      <span>التقدم نحو: {nextTier.name_ar}</span>
                      <span>{selectedCount} / {nextTier.required_books}</span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (selectedCount / nextTier.required_books) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Books Pills */}
              {selectedBooksList.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedBooksList.map((b, idx) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-muted/60 border border-border text-xs font-bold text-foreground"
                    >
                      <span className="text-[10px] text-muted-foreground font-mono">{idx + 1}.</span>
                      <span className="truncate max-w-[160px]">{b.title_ar || b.title}</span>
                      <button
                        type="button"
                        onClick={() => toggleBookInBundle(b.id)}
                        className="p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive text-muted-foreground cursor-pointer transition-colors"
                        title="إزالة من الباكدج"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setBundleSelectedBookIds([])}
                    className="text-xs font-bold text-destructive hover:underline self-center px-2 cursor-pointer"
                  >
                    {lang === 'ar' ? 'تفريغ الكل' : 'Clear All'}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground">
                  {lang === 'ar'
                    ? 'لم تختر أي كتب بعد. تصفح القائمة أدناه أو اضغط على "باكدج 🔥" على أي كتاب لإضافته!'
                    : 'No books selected yet. Check books below to add them to your bundle.'}
                </div>
              )}

              {/* Order Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
                <div className="text-xs text-muted-foreground">
                  {currentTier ? (
                    <span className="font-bold text-foreground">
                      السعر الإجمالي المطلوب: <strong className="text-primary text-base font-black">{currentTier.price} ج.م</strong> + الهدايا مجانية!
                    </span>
                  ) : (
                    <span>اختر 3 كتب على الأقل لإتاحة زر إتمام الطلب</span>
                  )}
                </div>

                <Button
                  disabled={!currentTier}
                  onClick={handleOpenBundleOrder}
                  className="w-full sm:w-auto rounded-2xl font-black text-xs px-8 py-3 gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'إتمام طلب الباكدج الآن عبر واتساب' : 'Checkout Bundle on WhatsApp'}</span>
                </Button>
              </div>
            </div>

            {/* Quick Picker from Books Catalog */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground">
                  {lang === 'ar' ? 'قائمة الكتب المتاحة للاختيار (115+ عنواناً)' : 'Available Books Catalog'}
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  اضغط على أي كتاب لإضافته أو حذفه من باكدجك
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {STORE_CATALOG_BOOKS.map(b => {
                  const isChecked = bundleSelectedBookIds.includes(b.id)
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBookInBundle(b.id)}
                      className={cn(
                        "rounded-2xl border p-3 cursor-pointer transition-all flex flex-col justify-between text-start select-none",
                        isChecked
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                          : "border-border/80 bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] text-muted-foreground truncate">{b.category_name_ar}</span>
                        <div className={cn(
                          "h-4 w-4 rounded-md flex items-center justify-center shrink-0 border transition-colors",
                          isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                        )}>
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-black text-foreground line-clamp-2 leading-snug">
                        {b.title_ar || b.title}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground truncate">
                        {b.author_ar || b.author}
                      </div>
                      <div className="mt-2 pt-1 border-t border-border/60 text-xs font-black text-primary">
                        {b.price} ج.م
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OFFERS & BUNDLE PACKAGES */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                  {lang === 'ar' ? 'باقات وحزم التوفير الحصرية' : 'Exclusive Bundles & Packages'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'عروض حزم الكتب (10، 20، 25 كتاب) بخصومات ضخمة وهدايا فواصل ومفكرات قراءة مجانية'
                    : 'Curated book bundles (10, 20, 25 books packages) with discounts & free reader gifts'}
                </p>
              </div>
            </div>

            {/* Genre Filter Pills for Curated Packs (2, 3, 4, 5 Books) */}
            <div className="rounded-3xl border-2 border-border/80 bg-gradient-to-r from-card via-background to-muted/30 p-4 space-y-2.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'تصنيف باكدجات الكتب (2، 3، 4، 5 كتب):' : 'Filter Curated Packs by Genre:'}
                  </span>
                  {selectedPackGenre !== 'ALL' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {GENRE_CATEGORIES.find(c => c.id === selectedPackGenre)?.nameAr}
                    </span>
                  )}
                </div>

                {selectedPackGenre !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedPackGenre('ALL')}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    {lang === 'ar' ? 'عرض كل الباكدجات ↺' : 'Show All Packs ↺'}
                  </button>
                )}
              </div>

              {/* Genre Filter Scrollable Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {GENRE_CATEGORIES.map(cat => {
                  const isSelected = selectedPackGenre === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedPackGenre(cat.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs',
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-102 font-black'
                          : 'bg-card border border-border/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}
                    >
                      <span>{cat.emoji}</span>
                      <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOffers.map(offer => {
                const offerTitle = lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title
                const offerDesc = lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description
                const isCuratedPack = offer.offer_type === 'CURATED_PACK' || (Boolean(offer.book_count) && offer.book_count! <= 5)
                const priceToShow = offer.offer_price || offer.bundle_price

                return (
                  <div
                    key={offer.id}
                    className={cn(
                      "group rounded-3xl border-2 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between",
                      isCuratedPack
                        ? "border-emerald-500/40 hover:border-emerald-500 ring-1 ring-emerald-500/20"
                        : "border-border/80 hover:border-primary/50"
                    )}
                  >
                    <div>
                      {/* Offer Cover */}
                      <div className="relative h-52 w-full overflow-hidden bg-muted">
                        {offer.cover_image_url ? (
                          <Image
                            src={offer.cover_image_url}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-tr from-emerald-500/20 via-amber-500/20 to-primary/20 flex items-center justify-center text-4xl">
                            📚
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                        {/* Badges on cover */}
                        <div className="absolute top-3 start-3 flex flex-wrap items-center gap-1.5">
                          {isCuratedPack && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-md flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              <span>{offer.badge_text || (offer.book_count ? `باكدج ${offer.book_count} كتب` : 'باكدج توفير')}</span>
                            </span>
                          )}
                          {isCuratedPack && offer.genre_ar && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold backdrop-blur-md bg-black/60 text-white border border-white/20">
                              {offer.genre_ar}
                            </span>
                          )}
                          {offer.discount_pct && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-red-600 text-white shadow-md">
                              %{offer.discount_pct} {lang === 'ar' ? 'خصم' : 'OFF'}
                            </span>
                          )}
                          {offer.bundle_buy_qty && !isCuratedPack && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black backdrop-blur-md bg-black/60 text-white border border-white/20">
                              {lang === 'ar' ? `حزمة ${offer.bundle_buy_qty} كتب` : `${offer.bundle_buy_qty}-Book Bundle`}
                            </span>
                          )}
                        </div>

                        {/* Bundle Price Tag pinned at bottom */}
                        {priceToShow && (
                          <div className="absolute bottom-3 end-3 px-3.5 py-1.5 rounded-2xl backdrop-blur-md bg-white/95 dark:bg-slate-900/95 shadow-lg border border-border flex items-baseline gap-2">
                            {offer.original_price && offer.original_price > priceToShow && (
                              <span className="text-xs text-muted-foreground line-through font-bold">
                                {offer.original_price} ج.م
                              </span>
                            )}
                            <div>
                              <span className="text-[10px] text-muted-foreground block leading-none font-semibold">
                                {lang === 'ar' ? 'سعر الباكدج:' : 'Offer Price:'}
                              </span>
                              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                {formatPrice(priceToShow)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                            {offerTitle}
                          </h3>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {offerDesc}
                        </p>

                        {/* Included Books List for Curated 2, 3, 4, 5 Books Pack */}
                        {offer.included_books && offer.included_books.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-1.5">
                            <span className="text-[11px] font-black text-foreground flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{lang === 'ar' ? `الكتب المتضمنة في هذا الباكدج (${offer.included_books.length} كتب):` : 'Included Books in Pack:'}</span>
                            </span>
                            <ul className="space-y-1 text-xs">
                              {offer.included_books.map((bTitle, idx) => (
                                <li key={idx} className="flex items-center gap-2 font-bold text-foreground">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="line-clamp-1">{bTitle}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Free Gift Alert */}
                        {offer.gift_description && (
                          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                            <Gift className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                              <span className="font-black block">{lang === 'ar' ? 'هدية مجانية مع العرض:' : 'Free Gift Included:'}</span>
                              <p className="text-[11px] font-semibold mt-0.5">{offer.gift_description}</p>
                            </div>
                          </div>
                        )}

                        {/* Promo Code Chip */}
                        {offer.promo_code && (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 border border-border/80 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                              <span>{lang === 'ar' ? 'كود الخصم:' : 'Promo Code:'}</span>
                              <span className="font-mono text-primary font-black uppercase text-xs">{offer.promo_code}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyPromo(offer.promo_code!)}
                              className="h-7 px-2.5 font-bold text-[11px] gap-1 cursor-pointer"
                            >
                              <Copy className="h-3 w-3" />
                              {copiedCode === offer.promo_code
                                ? lang === 'ar' ? 'تم النسخ!' : 'Copied!'
                                : lang === 'ar' ? 'نسخ' : 'Copy'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Action Button */}
                    <div className="p-5 pt-0">
                      {isCuratedPack ? (
                        <Button
                          onClick={() => handleOpenCuratedPackOrder(offer)}
                          className="w-full rounded-2xl font-black text-xs py-3 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          <span>
                            {lang === 'ar'
                              ? `اطلب هذا الباكدج الآن (${priceToShow} ج.م) 🚀`
                              : `Order This Pack (${priceToShow} EGP) 🚀`}
                          </span>
                        </Button>
                      ) : store.social_links?.whatsapp ? (
                        <a
                          href={`https://wa.me/${store.social_links.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            lang === 'ar'
                              ? `مرحباً، أود طلب "${offerTitle}" المعروض على منصة WaraqConnect بسعر ${priceToShow ? `${priceToShow} ج.م` : ''}`
                              : `Hello! I would like to order the "${offerTitle}" offer from WaraqConnect.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button className="w-full rounded-2xl font-black text-xs gap-2 shadow-md shadow-primary/20 cursor-pointer">
                            <MessageCircle className="h-4 w-4" />
                            <span>{lang === 'ar' ? 'اطلب العرض الآن عبر واتساب' : 'Order Bundle via WhatsApp'}</span>
                          </Button>
                        </a>
                      ) : (
                        <Button className="w-full rounded-2xl font-black text-xs gap-2 cursor-pointer">
                          <span>{lang === 'ar' ? 'طلب العرض' : 'Order Offer'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredOffers.length === 0 && offers.length > 0 && (
              <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-4xl">🔍</div>
                <h3 className="text-base font-bold text-foreground">
                  {lang === 'ar'
                    ? `لا توجد باكدجات مجهزة في قسم "${GENRE_CATEGORIES.find(c => c.id === selectedPackGenre)?.nameAr}" حالياً`
                    : 'No curated packs found in this genre yet'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'يمكنك تصفح باقي الأقسام أو الضغط على "عرض كل الباكدجات" لمشاهدة جميع العروض.'
                    : 'Browse other genres or reset the filter to view all available offers.'}
                </p>
                <Button
                  size="sm"
                  onClick={() => setSelectedPackGenre('ALL')}
                  className="rounded-xl font-bold text-xs"
                >
                  {lang === 'ar' ? 'عرض كل الباكدجات 📚' : 'Show All Packs'}
                </Button>
              </div>
            )}

            {offers.length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-5xl">🎁</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد عروض نشطة حالياً' : 'No active offers right now'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'تابع المتجر ليصلك إشعار فوري عند نشر باقات أو خصومات جديدة.'
                    : 'Follow this bookstore to receive notifications when new offers drop.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STORE EVENTS & SIGNINGS */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {lang === 'ar' ? 'الفعاليات الأدبية وتوقيع الكتب' : 'Literary Events & Signings'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'حفلات توقيع الكتّاب، حلقات النقاش، وأمسيات القراءة المنظمة في المتجر'
                    : 'Author signings, book club circles, and reading evenings hosted by the store'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {events.map(event => {
                const eventTitle = lang === 'ar' && event.title_ar ? event.title_ar : event.title
                const eventDesc = lang === 'ar' && event.description_ar ? event.description_ar : event.description
                const userStatus = rsvps[event.id]

                return (
                  <div
                    key={event.id}
                    className="rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row gap-6"
                  >
                    {/* Event image */}
                    {event.cover_image_url && (
                      <div className="relative h-44 md:h-auto md:w-56 rounded-2xl overflow-hidden bg-muted shrink-0">
                        <Image src={event.cover_image_url} alt="" fill className="object-cover" />
                        <div className="absolute top-2 start-2">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/70 text-white">
                            {event.is_free ? (lang === 'ar' ? 'دخول مجاني' : 'Free Entry') : `${event.price} EGP`}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-bold text-xs border-primary/30 text-primary">
                            {event.event_type}
                          </Badge>
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(event.starts_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-foreground">{eventTitle}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{eventDesc}</p>

                        {event.location && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                            <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {/* Event Host Details */}
                        {event.host_name && (
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border/80 text-xs mt-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-lg bg-primary/10 text-primary text-sm">🎙️</span>
                              <div>
                                <p className="font-bold text-foreground text-xs">{event.host_name}</p>
                                {event.host_role && (
                                  <p className="text-[11px] text-muted-foreground">{event.host_role}</p>
                                )}
                              </div>
                            </div>
                            {event.host_phone && (
                              <a
                                href={`https://wa.me/${event.host_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                  lang === 'ar'
                                    ? `مرحباً، أود الاستفسار والتنسيق بخصوص فعالية: ${eventTitle}`
                                    : `Hello, I'd like to ask about the event: ${eventTitle}`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-[11px] transition-colors"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{lang === 'ar' ? 'تواصل مع المنسق' : 'Contact Host'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RSVP Buttons */}
                      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary" />
                          <span>
                            {event.current_attendees} {lang === 'ar' ? 'قارئ أكدوا الحضور' : 'readers confirmed RSVP'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userStatus === 'GOING' ? 'default' : 'outline'}
                            onClick={() => handleRsvp(event.id, 'GOING')}
                            className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {userStatus === 'GOING'
                              ? lang === 'ar' ? '✓ سأحضر مؤكد' : '✓ Going'
                              : lang === 'ar' ? 'سأحضر' : 'Going'}
                          </Button>

                          <Button
                            size="sm"
                            variant={userStatus === 'MAYBE' ? 'secondary' : 'ghost'}
                            onClick={() => handleRsvp(event.id, 'MAYBE')}
                            className="rounded-xl font-bold text-xs cursor-pointer"
                          >
                            {lang === 'ar' ? 'ربما' : 'Interested'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {events.length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-5xl">📅</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد فعاليات قادمة حالياً' : 'No upcoming events right now'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'تابع المتجر ليصلك إشعار بالفعاليات وحفلات التوقيع القادمة فور إعلانها.'
                    : 'Follow this bookstore to receive notifications when new events are scheduled.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ABOUT & LOCATION */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About Card */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                {lang === 'ar' ? 'نبذة عن المكتبة' : 'About the Bookstore'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {storeDesc}
              </p>

              {store.social_links && (
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <span className="text-xs font-black text-muted-foreground block">
                    {lang === 'ar' ? 'وسائل التواصل الرسمية:' : 'Official Social Links:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {store.social_links.facebook && (
                      <a href={store.social_links.facebook} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
                          <span>فيسبوك Facebook</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    {store.social_links.instagram && (
                      <a href={store.social_links.instagram} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
                          <span>إنستغرام Instagram</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Opening Hours & Location Card */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {lang === 'ar' ? 'مواعيد العمل والعنوان' : 'Hours & Location'}
              </h3>

              {store.address && (
                <div className="flex items-start gap-2.5 bg-muted/40 p-3.5 rounded-2xl border border-border/60">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      {lang === 'ar' ? 'العنوان الفعلي:' : 'Physical Address:'}
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5">{store.address}</p>
                    {store.latitude && store.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${store.latitude},${store.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline mt-1.5"
                      >
                        <span>{lang === 'ar' ? 'عرض على خرائط Google' : 'Open in Google Maps'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {store.opening_hours && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-black text-muted-foreground block">
                    {lang === 'ar' ? 'ساعات استقبال القراء:' : 'Working Hours:'}
                  </span>
                  <div className="divide-y divide-border/60 rounded-2xl border border-border/60 overflow-hidden bg-muted/20">
                    {Object.entries(store.opening_hours).map(([days, hours]) => (
                      <div key={days} className="flex items-center justify-between p-3 text-xs">
                        <span className="font-bold text-foreground">{days}</span>
                        <span className="font-semibold text-muted-foreground">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING STICKY BUNDLE FOOTER BAR */}
      {bundleSelectedBookIds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-card/95 backdrop-blur-md border-t-2 border-primary/40 shadow-2xl animate-in slide-in-from-bottom">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary/30">
                {selectedCount}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-foreground">
                    {currentTier ? currentTier.name_ar : `${selectedCount} كتب في الباكدج`}
                  </span>
                  {currentTier && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                      +{currentTier.free_gift_books} هدية 🎁
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {currentTier
                    ? `الإجمالي: ${currentTier.price} ج.م فقط (وفرت ${currentTier.original_value - currentTier.price} ج.م)`
                    : `أضف ${booksToNextTier} كتب لتفعيل باكدج الـ 3 كتب والحصول على كتاب هدية!`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setBundleSelectedBookIds([])}
                className="px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
              >
                {lang === 'ar' ? 'تفريغ' : 'Clear'}
              </button>

              <Button
                disabled={!currentTier}
                onClick={handleOpenBundleOrder}
                className="flex-1 sm:flex-initial rounded-xl font-black text-xs px-6 py-2.5 gap-2 bg-primary text-primary-foreground shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span>
                  {currentTier
                    ? lang === 'ar' ? `اطلب الباكدج (${currentTier.price} ج.م)` : `Order Bundle (${currentTier.price} EGP)`
                    : lang === 'ar' ? `اختر ${booksToNextTier} كتب إضافية` : `Pick ${booksToNextTier} more`}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE BOOK ORDER MODAL */}
      {orderingBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-card border-2 border-border/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-inner shrink-0 bg-gradient-to-tr",
                  orderingBook.cover_color || "from-slate-700 to-slate-900"
                )}>
                  📖
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {lang === 'ar' ? 'طلب كتاب منفرد' : 'Order Single Book'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {orderingBook.title_ar || orderingBook.title} — {orderingBook.author_ar || orderingBook.author}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOrderingBook(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Price tag in modal */}
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground block">سعر الكتاب المخفض:</span>
                <span className="text-xl font-black text-primary">{orderingBook.price} ج.م</span>
                {orderingBook.original_price && (
                  <span className="text-xs text-muted-foreground line-through ms-2 font-semibold">
                    {orderingBook.original_price} ج.م
                  </span>
                )}
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                متوفر للشحن الفوري
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'اسم المستلم الثلاثي *' : 'Recipient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={lang === 'ar' ? 'أحمد محمد علي' : 'Full Name'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'المحافظة *' : 'Governorate *'}
                  </label>
                  <select
                    value={customerCity}
                    onChange={e => setCustomerCity(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'العنوان بالتفصيل (الحي، الشارع، رقم العمارة):' : 'Detailed Address:'}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: حي الجامعة، شارع 10، عمارة 5' : 'Street address, building, apt'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-muted-foreground">
                  {lang === 'ar' ? 'ملاحظات إضافية (اختياري):' : 'Notes (optional):'}
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'أي ملاحظات بخصوص موعد التوصيل...' : 'Any special requests...'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border/80">
              <Button
                onClick={() => executeSingleBookWhatsApp(orderingBook)}
                className="w-full rounded-xl font-black text-xs py-3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تأكيد وإرسال الطلب عبر واتساب 💬' : 'Confirm & Order via WhatsApp'}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setOrderingBook(null)}
                className="w-full rounded-xl text-xs font-bold text-muted-foreground"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BUNDLE PACKAGE ORDER MODAL */}
      {bundleModalOpen && currentTier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-card border-2 border-border/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Flame className="h-3 w-3" />
                  <span>{currentTier.name_ar}</span>
                </div>
                <h3 className="text-lg font-black text-foreground mt-1">
                  {lang === 'ar' ? 'إتمام طلب باكدج التوفير والهدايا 🔥' : 'Confirm Bundle & Free Gifts'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setBundleModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Offer Summary Highlights */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-amber-500/10 to-muted/40 p-4 border border-primary/30 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block">سعر الباكدج الإجمالي:</span>
                  <span className="text-2xl font-black text-primary">{currentTier.price} ج.م</span>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                  وفرت {currentTier.original_value - currentTier.price} ج.م!
                </span>
              </div>

              <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs font-bold text-foreground">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Gift className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>+ {currentTier.free_gift_books} كتاب هدية عشوائي من اختيار المكتبة 😍</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Bookmark className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>+ {currentTier.free_bookmarks} بوك مارك فواصل كتب مجانية 🔖</span>
                </div>
              </div>
            </div>

            {/* Selected Books List in Modal */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-foreground block">
                الكتب التي اخترتها بنفسك ({selectedBooksList.length} كتب):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-2xl bg-muted/30 p-2.5 border border-border text-xs divide-y divide-border/60">
                {selectedBooksList.map((b, idx) => (
                  <div key={b.id} className="pt-1 first:pt-0 flex items-center justify-between text-muted-foreground">
                    <span className="font-bold text-foreground truncate max-w-[260px]">
                      {idx + 1}. {b.title_ar || b.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{b.author_ar || b.author}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Inputs */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'اسم المستلم *' : 'Recipient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={lang === 'ar' ? 'أحمد محمد علي' : 'Full Name'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'المحافظة *' : 'Governorate *'}
                  </label>
                  <select
                    value={customerCity}
                    onChange={e => setCustomerCity(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'العنوان بالتفصيل:' : 'Detailed Address:'}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder={lang === 'ar' ? 'الحي، الشارع، رقم العمارة' : 'Street address'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-muted-foreground">
                  {lang === 'ar' ? 'ملاحظات خاصة بالتوصيل:' : 'Delivery Notes:'}
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: يرجى الاتصال قبل الوصول' : 'Any notes'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border/80">
              <Button
                onClick={executeBundleWhatsApp}
                className="w-full rounded-xl font-black text-xs py-3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إرسال تفاصيل الباكدج بالكامل عبر واتساب 💬' : 'Send Full Bundle to WhatsApp'}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setBundleModalOpen(false)}
                className="w-full rounded-xl text-xs font-bold text-muted-foreground"
              >
                {lang === 'ar' ? 'إغلاق ومتابعة اختيار الكتب' : 'Close & Continue Selecting'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CURATED 2 OR 3 BOOKS PACK ORDER MODAL */}
      {packModalOpen && selectedCuratedPack && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-card border-2 border-border/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  <span>{selectedCuratedPack.badge_text || (selectedCuratedPack.book_count ? `باكدج ${selectedCuratedPack.book_count} كتب` : 'عرض باكدج مميز')}</span>
                </div>
                <h3 className="text-lg font-black text-foreground mt-1">
                  {lang === 'ar' && selectedCuratedPack.title_ar ? selectedCuratedPack.title_ar : selectedCuratedPack.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPackModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Pack Visual & Price Summary */}
            <div className="flex gap-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-muted/40 border border-emerald-500/30">
              {selectedCuratedPack.cover_image_url && (
                <div className="relative h-24 w-20 rounded-xl overflow-hidden shrink-0 border border-border shadow-xs bg-muted">
                  <Image src={selectedCuratedPack.cover_image_url} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-black text-primary">
                    {selectedCuratedPack.offer_price || selectedCuratedPack.bundle_price} ج.م
                  </span>
                  {selectedCuratedPack.original_price && selectedCuratedPack.original_price > (selectedCuratedPack.offer_price || selectedCuratedPack.bundle_price || 0) && (
                    <span className="text-xs text-muted-foreground line-through font-bold">
                      {selectedCuratedPack.original_price} ج.م
                    </span>
                  )}
                </div>

                {selectedCuratedPack.original_price && selectedCuratedPack.original_price > (selectedCuratedPack.offer_price || selectedCuratedPack.bundle_price || 0) && (
                  <span className="inline-block text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    وفرت {(selectedCuratedPack.original_price) - (selectedCuratedPack.offer_price || selectedCuratedPack.bundle_price || 0)} ج.م عند طلب هذا الباكدج!
                  </span>
                )}

                {selectedCuratedPack.gift_description && (
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 mt-1">
                    <Gift className="h-3.5 w-3.5 shrink-0" />
                    <span>{selectedCuratedPack.gift_description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Included Books Preview */}
            {selectedCuratedPack.included_books && selectedCuratedPack.included_books.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-black text-foreground block">
                  الكتب المتضمنة في هذا الباكدج ({selectedCuratedPack.included_books.length} كتب):
                </span>
                <div className="space-y-1 rounded-2xl bg-muted/40 p-3 border border-border text-xs divide-y divide-border/60">
                  {selectedCuratedPack.included_books.map((bTitle, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center gap-2 font-bold text-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3] shrink-0" />
                      <span>{bTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Inputs */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'اسم المستلم *' : 'Recipient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={lang === 'ar' ? 'أحمد محمد علي' : 'Full Name'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'المحافظة *' : 'Governorate *'}
                  </label>
                  <select
                    value={customerCity}
                    onChange={e => setCustomerCity(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'العنوان بالتفصيل (الحي، الشارع، رقم العمارة):' : 'Detailed Address:'}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: حي الجامعة، شارع 10، عمارة 5' : 'Street address, building, apt'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-muted-foreground">
                  {lang === 'ar' ? 'ملاحظات إضافية (اختياري):' : 'Notes (optional):'}
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'أي ملاحظات بخصوص موعد التوصيل...' : 'Any special requests...'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border/80">
              <Button
                onClick={executeCuratedPackWhatsApp}
                className="w-full rounded-xl font-black text-xs py-3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تأكيد وإرسال طلب الباكدج عبر واتساب 💬' : 'Confirm & Order Pack via WhatsApp'}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setPackModalOpen(false)}
                className="w-full rounded-xl text-xs font-bold text-muted-foreground"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
