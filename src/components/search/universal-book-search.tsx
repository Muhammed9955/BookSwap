'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Heart,
  Loader2,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  Tag,
  ArrowRightLeft,
  Check,
  Flame,
  Globe2,
  BookMarked,
  Calendar,
  Hash,
  ExternalLink,
  Library,
  ChevronRight,
  Eye,
  Star,
  ShoppingBag,
  Store,
  BookCopy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UniversalBookSearchResult } from '@/app/api/books/universal-search/route'

interface UniversalBookSearchProps {
  initialQuery?: string
  embedded?: boolean
}

// ----------------------------------------------------------------
// Book Detail Modal
// ----------------------------------------------------------------
interface BookDetailModalProps {
  book: UniversalBookSearchResult | null
  onClose: () => void
  lang: string
  isRTL: boolean
  isWishlisted: boolean
  isWishlistBusy: boolean
  onWishlistToggle: (book: UniversalBookSearchResult) => void
}

function BookDetailModal({
  book,
  onClose,
  lang,
  isRTL,
  isWishlisted,
  isWishlistBusy,
  onWishlistToggle,
}: BookDetailModalProps) {
  useEffect(() => {
    if (book) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [book])

  if (!book) return null

  const sourceLabel: Record<string, string> = {
    bookswap: 'WaraqConnect | ورق كونكت',
    archive: 'Internet Archive',
    wikipedia: 'ويكيبيديا',
    openlibrary: 'Open Library',
    google: 'Google Books',
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={book.title}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet panel — slides up on mobile, centered card on desktop */}
      <div
        className={cn(
          'relative z-10 w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto',
          'bg-card border border-border/60 shadow-2xl',
          'rounded-t-3xl sm:rounded-3xl',
          'animate-in fade-in slide-in-from-bottom-4 duration-300'
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 z-20 p-2 rounded-xl bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero Cover + Title */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-indigo-900 via-purple-900 to-amber-900 overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
          {/* Background blur copy of cover */}
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110"
            />
          )}

          <div className="relative flex items-end gap-5 p-6 h-full">
            {/* Cover image */}
            <div className="flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 book-cover-3d bg-muted">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-indigo-800 to-purple-900">
                  <BookMarked className="h-8 w-8 text-white/60 mb-1" />
                  <span className="text-xs text-white/70 font-bold leading-tight">{book.title}</span>
                </div>
              )}
            </div>

            {/* Title + author */}
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-3">
                {book.title}
              </h2>
              <p className="text-sm text-white/80 font-semibold mt-1">{book.author}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {book.exists_on_platform && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {lang === 'ar' ? 'متوفر على WaraqConnect' : 'Available on WaraqConnect'}
                  </span>
                )}
                {book.published_year && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                    {book.published_year}
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 font-semibold">
                  {sourceLabel[book.source] || book.source}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Book metadata pills */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {book.isbn && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-foreground">{book.isbn}</span>
              </span>
            )}
            {book.category_name && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Library className="h-3 w-3" />
                {book.category_name}
              </span>
            )}
            {book.published_year && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border text-foreground">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {book.published_year}
              </span>
            )}
          </div>

          {/* Description */}
          {book.description && (
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/60">
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">
                {lang === 'ar' ? '📖 عن الكتاب' : '📖 About this book'}
              </p>
              <p className="text-sm text-foreground leading-relaxed line-clamp-6">
                {book.description}
              </p>
            </div>
          )}

          {/* Platform availability details */}
          {book.exists_on_platform && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {lang === 'ar'
                  ? `${book.listing_count} ${book.listing_count === 1 ? 'نسخة متاحة' : 'نسخ متاحة'} في مصر`
                  : `${book.listing_count} ${book.listing_count === 1 ? 'copy' : 'copies'} available in Egypt`}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {/* New price */}
                {book.new_min_price != null && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                    <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                    <span>{lang === 'ar' ? `جديد: ${book.new_min_price} ج.م` : `New: ${book.new_min_price} EGP`}</span>
                  </div>
                )}
                {/* Used price */}
                {book.used_min_price != null && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span>{lang === 'ar' ? `مستعمل: ${book.used_min_price} ج.م` : `Used: ${book.used_min_price} EGP`}</span>
                  </div>
                )}
                {/* Swap count */}
                {book.swap_count > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                    <span>{lang === 'ar' ? `تبادل: ${book.swap_count}` : `Swap: ${book.swap_count}`}</span>
                  </div>
                )}
                {/* Borrow count */}
                {book.borrow_count > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                    <BookCopy className="h-3.5 w-3.5 shrink-0" />
                    <span>{lang === 'ar' ? `استعارة: ${book.borrow_count}` : `Borrow: ${book.borrow_count}`}</span>
                  </div>
                )}
                {/* Store count */}
                {book.store_count > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    <Store className="h-3.5 w-3.5 shrink-0" />
                    <span>{lang === 'ar' ? `مكتبة: ${book.store_count}` : `Store: ${book.store_count}`}</span>
                  </div>
                )}
                {/* Giveaway */}
                {book.has_giveaway && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <span>🎁</span>
                    <span>{lang === 'ar' ? 'مجانية' : 'Free'}</span>
                  </div>
                )}
              </div>
              {/* City breakdown */}
              {book.city_breakdown && book.city_breakdown.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {book.city_breakdown.slice(0, 4).map(({ city, count }) => (
                    <span key={city} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted border border-border text-xs font-semibold">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {city}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Not on platform callout */}
          {!book.exists_on_platform && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">💡</span>
              <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                {lang === 'ar'
                  ? 'هذا الكتاب غير متوفر بعد على منصة WaraqConnect (ورق كونكت). إذا كان في مكتبتك، أضفه الآن لقرّاء مدينتك. أو سجّل اهتمامك وسنرسل لك إشعار فور توفره.'
                  : 'This book is not yet on WaraqConnect. If you own it, list it now. Or save it to your wishlist for instant notifications.'}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-1 border-t border-border/50">
            {book.exists_on_platform ? (
              <>
                <Link
                  href={book.internal_book_id ? `/books/${book.internal_book_id}` : `/explore?q=${encodeURIComponent(book.title)}`}
                  onClick={onClose}
                  className="flex-1"
                >
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black cursor-pointer gap-2 rounded-xl shadow-md hover:shadow-emerald-500/25">
                    <BookOpen className="h-4 w-4" />
                    {lang === 'ar' ? 'تصفح النسخ المتاحة' : 'View Available Copies'}
                    <ArrowRight className={cn('h-4 w-4 ms-auto', isRTL && 'rotate-180')} />
                  </Button>
                </Link>
                <Link
                  href={`/books/add?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&isbn=${encodeURIComponent(book.isbn || '')}`}
                  onClick={onClose}
                >
                  <Button variant="outline" className="font-bold cursor-pointer gap-1.5 rounded-xl">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    {lang === 'ar' ? 'أضف نسختك' : 'List your copy'}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/books/add?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&isbn=${encodeURIComponent(book.isbn || '')}&cover=${encodeURIComponent(book.cover_url || '')}`}
                  onClick={onClose}
                  className="flex-1"
                >
                  <Button
                    variant="premium"
                    className="w-full font-black cursor-pointer gap-2 rounded-xl shadow-md hover:shadow-amber-500/25"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {lang === 'ar' ? 'أضف هذا الكتاب (بيع / تبادل)' : 'List this Book'}
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant={isWishlisted ? 'default' : 'outline'}
                  onClick={() => onWishlistToggle(book)}
                  disabled={isWishlistBusy}
                  className="font-bold cursor-pointer gap-2 rounded-xl"
                >
                  {isWishlistBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isWishlisted ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Heart className="h-4 w-4 text-rose-500" />
                  )}
                  {isWishlisted
                    ? (lang === 'ar' ? 'في قائمة رغباتك ✓' : 'In Wishlist ✓')
                    : (lang === 'ar' ? '🔔 نبهني أول ما يتوفر' : '🔔 Alert Me')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Main Search Component
// ----------------------------------------------------------------
export function UniversalBookSearch({
  initialQuery = '',
  embedded = false,
}: UniversalBookSearchProps) {
  const { lang, isRTL } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<'all' | 'available' | 'missing'>('all')
  const [results, setResults] = useState<UniversalBookSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [wishlistedMap, setWishlistedMap] = useState<Record<string, boolean>>({})
  const [wishlistLoading, setWishlistLoading] = useState<Record<string, boolean>>({})
  const [stats, setStats] = useState({ total: 0, platformCount: 0, externalCount: 0 })
  const [selectedBook, setSelectedBook] = useState<UniversalBookSearchResult | null>(null)

  const popularSuggestions = [
    { label: 'ساق البامبو', icon: '🎋' },
    { label: 'ثلاثية غرناطة', icon: '🏰' },
    { label: 'الفيل الأزرق', icon: '🐘' },
    { label: 'أحمد خالد توفيق', icon: '👽' },
    { label: 'مصطفى محمود', icon: '🔭' },
    { label: 'Atomic Habits', icon: '⚡' },
    { label: 'يوتوبيا', icon: '🏙️' },
    { label: 'مقدمة ابن خلدون', icon: '📜' },
  ]

  const performSearch = useCallback(async (searchQuery: string, currentFilter: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([])
      setHasSearched(false)
      setStats({ total: 0, platformCount: 0, externalCount: 0 })
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const res = await fetch(
        `/api/books/universal-search?q=${encodeURIComponent(searchQuery.trim())}&filter=${currentFilter}`
      )
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
        setStats({
          total: data.total || 0,
          platformCount: data.platformCount || 0,
          externalCount: data.externalCount || 0,
        })
      }
    } catch (err) {
      console.error('Universal search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, filter)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filter, performSearch])

  // Handle wishlist toggle
  const handleWishlistToggle = async (book: UniversalBookSearchResult) => {
    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    const key = book.id
    setWishlistLoading(prev => ({ ...prev, [key]: true }))

    try {
      let bookId = book.internal_book_id

      // If book isn't in internal DB yet, create the book entry first!
      if (!bookId) {
        const { data: newBook, error: bookErr } = await supabase
          .from('books')
          .insert({
            title: book.title,
            title_ar: book.title_ar || null,
            author: book.author,
            author_ar: book.author_ar || null,
            isbn: book.isbn || null,
            published_year: book.published_year || null,
            cover_image_url: book.cover_url || null,
            description: book.description || null,
            created_by: user.id,
          })
          .select('id')
          .single()

        if (!bookErr && newBook) {
          bookId = newBook.id
          book.internal_book_id = bookId
        }
      }

      if (bookId) {
        const isCurrentlySaved = wishlistedMap[key]

        if (isCurrentlySaved) {
          await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
            .eq('book_id', bookId)
          setWishlistedMap(prev => ({ ...prev, [key]: false }))
        } else {
          await supabase
            .from('wishlist_items')
            .insert({
              user_id: user.id,
              book_id: bookId,
              notes: 'Added from Universal Book Search',
            })
          setWishlistedMap(prev => ({ ...prev, [key]: true }))
        }
      }
    } catch (err) {
      console.error('Wishlist error:', err)
    } finally {
      setWishlistLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <>
      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          lang={lang}
          isRTL={isRTL}
          isWishlisted={!!wishlistedMap[selectedBook.id]}
          isWishlistBusy={!!wishlistLoading[selectedBook.id]}
          onWishlistToggle={handleWishlistToggle}
        />
      )}

      <div className={cn('w-full', !embedded && 'max-w-4xl mx-auto space-y-6')}>
        {/* Catchy Glowing Search Box */}
        <div className="relative group">
          <div className="glow-border rounded-[26px]">
            <div className="relative flex items-center bg-card/95 backdrop-blur-xl rounded-[24px] overflow-hidden transition-all duration-300">
              <div className="ps-5 pe-3 text-primary flex items-center justify-center">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Search className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'ابحث بـ: اسم الكتاب، المؤلف (أحمد خالد توفيق)، أو رقم الـ ISBN...'
                    : 'Search by: book title, author name, or ISBN...'
                }
                className="w-full h-16 bg-transparent text-base md:text-lg font-medium text-foreground placeholder:text-muted-foreground/80 focus:outline-none px-2"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setResults([])
                    setHasSearched(false)
                  }}
                  className="p-2 me-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              <Button
                type="button"
                onClick={() => performSearch(query, filter)}
                className="m-2 h-12 px-6 rounded-2xl font-black cursor-pointer hidden sm:flex items-center gap-2 shadow-md hover:shadow-primary/30"
              >
                <Sparkles className="h-4 w-4" />
                <span>{lang === 'ar' ? 'فحص التوفر' : 'Check'}</span>
              </Button>
            </div>
          </div>

          {/* Suggestion Chips */}
          {!hasSearched && query.length < 2 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-foreground/90 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary">
                <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>{lang === 'ar' ? 'جرّب البحث بـ:' : 'Try searching:'}</span>
              </span>
              {popularSuggestions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setQuery(item.label)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border shadow-2xs transition-all duration-200 cursor-pointer font-semibold text-xs active:scale-95"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hint for author search */}
          {!hasSearched && query.length < 2 && (
            <p className="mt-3 text-xs text-muted-foreground/70 font-medium flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'يمكنك البحث باسم المؤلف مباشرة، مثل: "أحمد خالد توفيق" أو "مصطفى محمود"'
                  : 'You can search directly by author name, e.g. "نجيب محفوظ" or "Naguib Mahfouz"'}
              </span>
            </p>
          )}
        </div>

        {/* Filter Tabs & Live Stats Bar */}
        {hasSearched && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Catchy Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card border border-border shadow-xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5',
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>🌟</span>
                <span>{lang === 'ar' ? `الكل (${stats.total})` : `All (${stats.total})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('available')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer border',
                  filter === 'available'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                    : 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                )}
              >
                <span className="radar-dot text-emerald-400" />
                <span>{lang === 'ar' ? `متوفر في مصر (${stats.platformCount})` : `Available in Egypt (${stats.platformCount})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('missing')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer border',
                  filter === 'missing'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
                    : 'border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                )}
              >
                <span>✨</span>
                <span>{lang === 'ar' ? `غير متوفر بعد (${stats.externalCount})` : `Not on platform (${stats.externalCount})`}</span>
              </button>
            </div>

            {/* Search Result Summary */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <Globe2 className="h-3.5 w-3.5 text-primary" />
              <span>
                {lang === 'ar'
                  ? `وجدنا ${stats.total} نتيجة لـ "${query}"`
                  : `Found ${stats.total} results for "${query}"`}
              </span>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-4">
          {results.map((book) => {
            const isWishlisted = !!wishlistedMap[book.id]
            const isWishlistBusy = !!wishlistLoading[book.id]

            return (
              <div
                key={book.id}
                className={cn(
                  'group relative flex flex-col md:flex-row gap-4 p-4 md:p-5 rounded-3xl border transition-all duration-300',
                  book.exists_on_platform
                    ? 'bg-card border-emerald-500/40 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/70'
                    : 'bg-card/85 backdrop-blur-md border-border hover:border-primary/30 shadow-xs hover:shadow-lg hover:shadow-primary/8'
                )}
              >
                {/* 3D Book Cover — clickable for detail */}
                <button
                  type="button"
                  onClick={() => setSelectedBook(book)}
                  className="relative w-24 h-36 md:w-28 md:h-40 flex-shrink-0 self-center md:self-start book-cover-3d overflow-hidden bg-muted cursor-pointer hover:scale-105 transition-transform duration-200 rounded-md"
                  aria-label={`View details for ${book.title}`}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-amber-900/20 text-muted-foreground">
                      <BookMarked className="h-8 w-8 mb-1.5 text-primary opacity-60" />
                      <span className="text-xs font-bold leading-tight line-clamp-3 text-foreground">{book.title}</span>
                    </div>
                  )}
                  {/* Eye overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </button>

                {/* Book Details */}
                <div className="flex-1 flex flex-col justify-between space-y-2.5 min-w-0">
                  <div>
                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {book.exists_on_platform ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-500/30">
                          <span className="radar-dot text-emerald-500" />
                          <span>
                            {lang === 'ar'
                              ? `متوفر • ${book.listing_count} ${book.listing_count === 1 ? 'نسخة' : 'نسخ'}`
                              : `Available • ${book.listing_count} ${book.listing_count === 1 ? 'copy' : 'copies'}`}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-muted text-muted-foreground font-bold text-xs border border-border">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span>{lang === 'ar' ? 'غير متوفر بعد على WaraqConnect' : 'Not yet on WaraqConnect'}</span>
                        </span>
                      )}
                      {book.category_name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/15">
                          {book.category_name}
                        </span>
                      )}
                      {book.published_year && (
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground">
                          {book.published_year}
                        </span>
                      )}
                    </div>

                    {/* Title & Author — click to open modal */}
                    <button
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="text-start cursor-pointer"
                    >
                      <h3 className="text-lg md:text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                    </button>
                    <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                      {lang === 'ar' ? 'المؤلف:' : 'Author:'}{' '}
                      <span className="text-foreground font-bold">{book.author}</span>
                    </p>

                    {/* ISBN display */}
                    {book.isbn && (
                      <p className="text-xs text-muted-foreground/80 mt-0.5 font-mono">
                        ISBN: <span className="font-semibold text-foreground/80">{book.isbn}</span>
                      </p>
                    )}

                    {/* Description snippet */}
                    {book.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {book.description}
                      </p>
                    )}

                    {/* Available listing highlights — rich format */}
                    {book.exists_on_platform && (
                      <div className="mt-3 p-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 space-y-2">
                        {/* Header */}
                        <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="radar-dot text-emerald-500" />
                          {lang === 'ar'
                            ? `${book.listing_count} نسخة متاحة`
                            : `${book.listing_count} ${book.listing_count === 1 ? 'copy' : 'copies'} available`}
                        </p>
                        {/* Price row */}
                        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                          {book.new_min_price != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                              <ShoppingBag className="h-3 w-3" />
                              {lang === 'ar' ? `💰 جديد: ${book.new_min_price} ج.م` : `💰 New: ${book.new_min_price} EGP`}
                            </span>
                          )}
                          {book.used_min_price != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                              <Tag className="h-3 w-3" />
                              {lang === 'ar' ? `♻️ مستعمل: ${book.used_min_price} ج.م` : `♻️ Used: ${book.used_min_price} EGP`}
                            </span>
                          )}
                          {!book.new_min_price && !book.used_min_price && book.min_price != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                              <Tag className="h-3 w-3" />
                              {lang === 'ar' ? `من ${book.min_price} ج.م` : `From ${book.min_price} EGP`}
                            </span>
                          )}
                        </div>
                        {/* Type row */}
                        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                          {book.swap_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                              <ArrowRightLeft className="h-3 w-3" />
                              {lang === 'ar' ? `🔄 تبادل: ${book.swap_count}` : `🔄 Swap: ${book.swap_count}`}
                            </span>
                          )}
                          {book.borrow_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25">
                              <BookCopy className="h-3 w-3" />
                              {lang === 'ar' ? `📖 استعارة: ${book.borrow_count}` : `📖 Borrow: ${book.borrow_count}`}
                            </span>
                          )}
                          {book.store_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                              <Store className="h-3 w-3" />
                              {lang === 'ar' ? `🏪 مكتبة: ${book.store_count}` : `🏪 Store: ${book.store_count}`}
                            </span>
                          )}
                          {book.has_giveaway && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                              🎁 {lang === 'ar' ? 'مجاني' : 'Free'}
                            </span>
                          )}
                        </div>
                        {/* City breakdown */}
                        {book.city_breakdown && book.city_breakdown.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {book.city_breakdown.slice(0, 3).map(({ city, count }) => (
                              <span key={city} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted border border-border/60 text-xs font-semibold">
                                <MapPin className="h-2.5 w-2.5 text-red-500" />
                                {city}: {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2.5 flex flex-wrap items-center gap-2 border-t border-border/50">
                    {/* Quick preview button */}
                    <button
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer px-3 py-1.5 rounded-xl hover:bg-primary/8 border border-transparent hover:border-primary/20"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {lang === 'ar' ? 'تفاصيل' : 'Details'}
                    </button>

                    {book.exists_on_platform ? (
                      <>
                        <Link
                          href={book.internal_book_id ? `/books/${book.internal_book_id}` : `/explore?q=${encodeURIComponent(book.title)}`}
                          className="cursor-pointer"
                        >
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 px-4 rounded-xl text-xs"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'تصفح النسخ' : 'View Copies'}</span>
                            <ArrowRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                          </Button>
                        </Link>
                        <Link
                          href={`/books/add?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&isbn=${encodeURIComponent(book.isbn || '')}`}
                          className="cursor-pointer"
                        >
                          <Button size="sm" variant="outline" className="font-bold cursor-pointer flex items-center gap-1 text-xs rounded-xl">
                            <PlusCircle className="h-3.5 w-3.5 text-primary" />
                            <span>{lang === 'ar' ? 'أضف نسختك' : 'List yours'}</span>
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/books/add?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&isbn=${encodeURIComponent(book.isbn || '')}&cover=${encodeURIComponent(book.cover_url || '')}`}
                          className="cursor-pointer"
                        >
                          <Button
                            size="sm"
                            variant="premium"
                            className="font-black cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-amber-500/30 px-4 rounded-xl text-xs"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'أضف الكتاب' : 'List this Book'}</span>
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant={isWishlisted ? 'default' : 'outline'}
                          onClick={() => handleWishlistToggle(book)}
                          disabled={isWishlistBusy}
                          className="font-bold cursor-pointer flex items-center gap-1.5 text-xs rounded-xl"
                        >
                          {isWishlistBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isWishlisted ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                          )}
                          <span>
                            {isWishlisted
                              ? (lang === 'ar' ? 'في قائمتك ✓' : 'In Wishlist ✓')
                              : (lang === 'ar' ? '🔔 نبهني' : '🔔 Alert Me')}
                          </span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {hasSearched && !loading && results.length === 0 && (
            <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border bg-card/60 space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-3xl shadow-sm">
                📚
              </div>
              <h4 className="text-lg font-black text-foreground">
                {lang === 'ar' ? 'لم نجد نتائج' : 'No books found'}
              </h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'تأكد من كتابة الاسم بشكل صحيح. يمكنك البحث بالاسم العربي للكتاب أو المؤلف أو الـ ISBN. أو أضف هذا الكتاب بنفسك في 30 ثانية!'
                  : 'Double-check the title, author name, or ISBN. Or list this book yourself in 30 seconds!'}
              </p>
              <div className="pt-2">
                <Link href={`/books/add?title=${encodeURIComponent(query)}`}>
                  <Button size="lg" className="font-black cursor-pointer shadow-md hover:shadow-lg">
                    <PlusCircle className="h-4 w-4 me-2" />
                    <span>{lang === 'ar' ? 'أضف هذا الكتاب الآن' : 'Add this book now'}</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-5 rounded-3xl border border-border bg-card animate-pulse">
                  <div className="w-24 h-36 rounded-md bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-3 bg-muted rounded-full w-1/4" />
                    <div className="h-5 bg-muted rounded-full w-3/4" />
                    <div className="h-3 bg-muted rounded-full w-1/3" />
                    <div className="h-3 bg-muted rounded-full w-2/3" />
                    <div className="h-3 bg-muted rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
