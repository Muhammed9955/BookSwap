'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Star,
  ShoppingBag,
  Flame,
  Check,
  Plus,
  Truck,
  Sparkles,
  Heart,
  X,
  BookOpen,
  Info,
  ShieldCheck,
  Share2,
  ExternalLink,
  Quote,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/language-context'
import { getStoreBookCover } from '@/lib/stores/store-catalog-data'
import type { StoreCatalogBook } from '@/types/store'

export interface StoreBookCardProps {
  book: StoreCatalogBook
  isSelectedInBundle?: boolean
  onToggleBundle?: (bookId: string) => void
  onOrderSingle?: (book: StoreCatalogBook) => void
  isFavorite?: boolean
  onToggleFavorite?: (bookId: string) => void
  className?: string
  viewMode?: 'grid' | 'bundle-picker' | 'modal-preview'
}

function StoreBookCardComponent({
  book,
  isSelectedInBundle = false,
  onToggleBundle,
  onOrderSingle,
  isFavorite: externalIsFavorite,
  onToggleFavorite,
  className,
  viewMode = 'grid',
}: StoreBookCardProps) {
  const { lang, isRTL } = useLanguage()
  const [imageError, setImageError] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [internalIsFavorite, setInternalIsFavorite] = useState(false)

  const isFav = externalIsFavorite !== undefined ? externalIsFavorite : internalIsFavorite

  const title = lang === 'ar' && book.title_ar ? book.title_ar : book.title
  const author = lang === 'ar' && book.author_ar ? book.author_ar : book.author
  const coverUrl = getStoreBookCover(book)
  const displayCover = imageError ? '/images/book-placeholder.svg' : coverUrl

  const originalPrice = book.original_price || (book.price > 0 ? book.price + 35 : 0)
  const hasDiscount = originalPrice > book.price
  const savings = hasDiscount ? originalPrice - book.price : 0
  const discountPercent = hasDiscount ? Math.round((savings / originalPrice) * 100) : 0
  const ratingValue = book.rating ? Number(book.rating).toFixed(1) : '4.8'

  const goodreadsUrl = (book as any).goodreads_url || (
    book.isbn
      ? `https://www.goodreads.com/search?q=${encodeURIComponent(book.isbn.replace(/-/g, ''))}`
      : `https://www.goodreads.com/search?q=${encodeURIComponent(`${title} ${author}`.trim())}`
  )

  const reviewsList = [
    {
      name: lang === 'ar' ? 'أحمد رضوان' : 'Ahmed Radwan',
      verified: true,
      rating: 5,
      date: lang === 'ar' ? 'منذ أسبوعين' : '2 weeks ago',
      avatar: lang === 'ar' ? 'أ' : 'A',
      text: lang === 'ar'
        ? `من أفضل وأعمق الأعمال في تصنيف ${book.category_name_ar || 'هذا المجال'}! أسلوب السرد واللغة يبهرك من البداية حتى السطر الأخير. طبعة ممتازة وتستحق الاقتناء.`
        : `One of the most captivating reads! The narrative depth and pacing are outstanding from start to finish. Highly recommended edition.`,
    },
    {
      name: lang === 'ar' ? 'سارة محمود' : 'Sarah M.',
      verified: true,
      rating: 5,
      date: lang === 'ar' ? 'منذ شهر' : '1 month ago',
      avatar: lang === 'ar' ? 'س' : 'S',
      text: lang === 'ar'
        ? `كتاب ملهم جداً يغير نظرتك للأمور. جودة ورق الطباعة ممتازة والتوصيل من المكتبة كان سريعاً ومغلّفاً بإتقان.`
        : `Truly inspiring and thought-provoking. The physical copy quality is pristine and delivery was exceptionally fast.`,
    },
    {
      name: lang === 'ar' ? 'د. كريم شريف' : 'Dr. Karim Sherif',
      verified: false,
      rating: 4,
      date: lang === 'ar' ? 'منذ 3 أسابيع' : '3 weeks ago',
      avatar: lang === 'ar' ? 'ك' : 'K',
      text: lang === 'ar'
        ? `إصدار رائع يجمع بين المتعة والعمق المعرفي، إضافة قيّمة جداً للمكتبة المنزلية ولأي قارئ شغوف.`
        : `A brilliant publication that balances depth with pure reading pleasure. A must-have for any home library.`,
    },
  ]

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (externalIsFavorite === undefined) {
      setInternalIsFavorite(prev => !prev)
    }
    onToggleFavorite?.(book.id)
  }

  // ==========================================
  // MODE: MODAL PREVIEW (Used in Checkout Modal)
  // ==========================================
  if (viewMode === 'modal-preview') {
    return (
      <div
        className={cn(
          'flex items-center gap-3.5 p-3 rounded-2xl bg-muted/40 border border-border/80 shadow-2xs',
          className
        )}
      >
        {/* Book Cover Thumbnail with spine depth */}
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60 shadow-xs">
          <Image
            src={displayCover}
            alt={title}
            fill
            className="object-cover"
            sizes="56px"
            onError={() => setImageError(true)}
            unoptimized={displayCover.endsWith('.svg')}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 w-2 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10" />
        </div>

        {/* Book Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
              {book.category_name_ar || book.category}
            </span>
            {book.badge && (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {book.badge}
              </span>
            )}
          </div>

          <h4 className="font-black text-xs sm:text-sm text-foreground line-clamp-1">{title}</h4>
          <p className="text-[11px] text-muted-foreground font-semibold line-clamp-1">{author}</p>

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-sm font-black text-primary">{book.price} ج.م</span>
            {hasDiscount && (
              <span className="text-[11px] text-muted-foreground line-through font-semibold">
                {originalPrice} ج.م
              </span>
            )}
            {savings > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                وفرت {savings} ج.م ({discountPercent}%)
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // MODE: BUNDLE PICKER (Used in "باكدجات التوفير" Tab)
  // ==========================================
  if (viewMode === 'bundle-picker') {
    return (
      <div
        onClick={() => onToggleBundle?.(book.id)}
        className={cn(
          'group rounded-2xl border p-2.5 cursor-pointer transition-all flex flex-col justify-between text-start select-none relative overflow-hidden shadow-2xs hover:shadow-md',
          isSelectedInBundle
            ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/40'
            : 'border-border/80 bg-card hover:border-primary/50'
        )}
      >
        {/* Cover with check overlay */}
        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted mb-2 border border-border/50">
          <Image
            src={displayCover}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
            unoptimized={displayCover.endsWith('.svg')}
          />
          {/* Spine depth */}
          <div className="pointer-events-none absolute inset-y-0 start-0 w-2.5 bg-gradient-to-r from-black/45 via-white/10 to-transparent z-10" />

          {/* Selection Indicator Top-End */}
          <div className="absolute top-1.5 end-1.5 z-20">
            <div
              className={cn(
                'h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border transition-transform shadow-xs',
                isSelectedInBundle
                  ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/30'
                  : 'bg-black/50 backdrop-blur-xs border-white/20 text-white hover:bg-black/70'
              )}
            >
              {isSelectedInBundle ? (
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </div>
          </div>

          {/* Category Tag on cover */}
          <div className="absolute bottom-1.5 start-1.5 z-20">
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold backdrop-blur-md bg-black/60 text-white border border-white/10 truncate max-w-[90px] block">
              {book.category_name_ar || book.category}
            </span>
          </div>
        </div>

        {/* Book Info */}
        <div className="space-y-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-black text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-[11px] text-muted-foreground font-semibold truncate">{author}</p>
        </div>

        {/* Price & Selection Pill */}
        <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center justify-between gap-1">
          <span className="text-xs font-black text-primary">{book.price} ج.م</span>
          <span
            className={cn(
              'text-[10px] font-black px-1.5 py-0.5 rounded-md transition-colors',
              isSelectedInBundle
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground group-hover:text-primary'
            )}
          >
            {isSelectedInBundle
              ? lang === 'ar' ? 'مختار ✓' : 'Selected'
              : lang === 'ar' ? '+ باكدج' : '+ Add'}
          </span>
        </div>
      </div>
    )
  }

  // ==========================================
  // MODE: GRID (Main Bookstore Catalog Card)
  // Full-width image, Fav button, Wide Add button, Details popup
  // ==========================================
  const bookDescription = (book as any).description || (
    lang === 'ar'
      ? `إصدار مميز ومطلوب للكاتب ${author}. يقدم هذا الكتاب تجربة قراءة فريدة وملهمة ضمن تصنيف ${book.category_name_ar || 'الأدب'}، وتوفره المكتبة بطبعة أصلية ممتازة مع توفر التوصيل السريع لكافة أنحاء مصر.`
      : `An exceptional title by ${author}. Features an insightful read in ${book.category_name_ar || 'literature'}, curated in premium condition with instant doorstep delivery across Egypt.`
  )

  return (
    <>
      <div
        onClick={() => setIsDetailsModalOpen(true)}
        className={cn(
          'group rounded-2xl sm:rounded-3xl border-2 bg-card overflow-hidden transition-all flex flex-col justify-between relative shadow-xs hover:shadow-xl hover:-translate-y-1 duration-300 cursor-pointer select-none',
          isSelectedInBundle
            ? 'border-primary bg-primary/[0.02] shadow-md shadow-primary/10 ring-2 ring-primary/40'
            : 'border-border/80 hover:border-primary/50',
          className
        )}
      >
        {/* Top: Full-Width Cover Image (Edge to Edge) */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted shrink-0">
          <Image
            src={displayCover}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
            unoptimized={displayCover.endsWith('.svg')}
            priority={false}
          />

          {/* Realistic Book Spine Texture & Highlights */}
          <div className="pointer-events-none absolute inset-y-0 start-0 w-3.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 start-3.5 w-[1px] bg-black/20 z-10" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-1 bg-gradient-to-l from-black/25 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />

          {/* Top Overlays: Category Badge (Start) & Fav Button (End) */}
          <div className="absolute top-2 inset-x-2 z-20 flex items-start justify-between gap-1.5 pointer-events-auto">
            {/* Category Pill */}
            <span className="px-2 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/65 text-white border border-white/20 shadow-xs truncate max-w-[110px]">
              {book.category_name_ar || book.category}
            </span>

            {/* Favorite (Heart) Button */}
            <button
              type="button"
              onClick={handleFavoriteToggle}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md backdrop-blur-md active:scale-90',
                isFav
                  ? 'bg-red-500 text-white shadow-red-500/30 scale-105'
                  : 'bg-black/45 text-white hover:bg-black/70 hover:text-red-400 hover:scale-105 border border-white/20'
              )}
              title={isFav ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove favorite') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to favorites')}
            >
              <Heart className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform', isFav && 'fill-current scale-110 text-white')} />
            </button>
          </div>

          {/* Badges Stack under Top */}
          <div className="absolute top-10 start-2 z-20 flex flex-col items-start gap-1">
            {book.badge && (
              <span className="px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black backdrop-blur-md bg-amber-500/90 text-white shadow-xs border border-amber-400/30">
                {book.badge}
              </span>
            )}
            {hasDiscount && (
              <span className="px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black bg-red-600 text-white shadow-xs">
                {lang === 'ar' ? `خصم %${discountPercent}` : `-${discountPercent}%`}
              </span>
            )}
          </div>

          {/* Bottom Overlays on Cover: Rating & Condition */}
          <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between text-white text-[10px]">
            {/* Rating */}
            <span className="inline-flex items-center gap-1 font-bold backdrop-blur-md bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 shadow-xs">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{ratingValue}</span>
            </span>

            {/* Condition Pill */}
            <span className="font-bold backdrop-blur-md bg-black/60 px-2 py-0.5 rounded-lg border border-white/10">
              {book.condition === 'NEW' || !book.condition
                ? (lang === 'ar' ? 'جديد 🏷️' : 'New')
                : (lang === 'ar' ? 'ممتاز ✨' : 'Like New')}
            </span>
          </div>
        </div>

        {/* Content Section below Full-Width Cover Image */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between space-y-2">
          <div className="space-y-1.5">
            {/* Standardized Title Container Height */}
            <div className="min-h-[2.85rem] sm:min-h-[3.25rem] flex items-start">
              <h3
                className="text-sm sm:text-base font-black leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors tracking-tight"
                title={title}
              >
                {title}
              </h3>
            </div>

            {/* Author */}
            <div className="h-4 sm:h-5 overflow-hidden flex items-center justify-between gap-1">
              <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold line-clamp-1 truncate">
                {author}
              </p>
            </div>

            {/* Stock & Shipping Status */}
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg w-fit">
              <Truck className="h-3 w-3" />
              <span>{lang === 'ar' ? 'متوفر للشحن الفوري' : 'In Stock'}</span>
            </div>

            {/* Pricing Row */}
            <div className="flex items-baseline justify-between pt-1">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black text-foreground">
                  {book.price} ج.م
                </span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through font-semibold">
                    {originalPrice} ج.م
                  </span>
                )}
              </div>

              {savings > 0 && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                  {lang === 'ar' ? `وفر ${savings} ج.م` : `-${savings} EGP`}
                </span>
              )}
            </div>
          </div>

          {/* ONE WIDE ADD TO BASKET BUTTON IN BOTTOM */}
          <div className="pt-2 mt-auto border-t border-border/60">
            <Button
              size="sm"
              variant={isSelectedInBundle ? 'default' : 'secondary'}
              onClick={(e) => {
                e.stopPropagation()
                onToggleBundle?.(book.id)
              }}
              className={cn(
                'w-full rounded-xl text-xs font-black gap-2 cursor-pointer shadow-2xs h-9 transition-all active:scale-[0.98]',
                isSelectedInBundle
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 ring-1 ring-primary/40'
                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/25'
              )}
              title={
                isSelectedInBundle
                  ? lang === 'ar' ? 'إزالة من السلة' : 'Remove from Basket'
                  : lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Basket'
              }
            >
              {isSelectedInBundle ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{lang === 'ar' ? 'مضاف في السلة ✓' : 'In Basket ✓'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'أضف إلى السلة' : 'Add to Basket'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* POPUP MODAL FOR ALL BOOK DETAILS           */}
      {/* ========================================== */}
      {isDetailsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsDetailsModalOpen(false)}
        >
          <div
            className="bg-card border border-border/80 rounded-3xl max-w-xl sm:max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-amber-500 to-emerald-500 shrink-0" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{book.category_name_ar || book.category}</span>
                </span>
                {book.badge && (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {book.badge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Favorite Toggle Button */}
                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  className={cn(
                    'h-8 w-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer',
                    isFav
                      ? 'bg-red-500/10 text-red-500 border-red-500/30'
                      : 'text-muted-foreground hover:bg-muted border-border/80 hover:text-foreground'
                  )}
                  title={isFav ? (lang === 'ar' ? 'في المفضلة' : 'Favorited') : (lang === 'ar' ? 'إضافة للمفضلة' : 'Add to favorites')}
                >
                  <Heart className={cn('h-4 w-4', isFav && 'fill-current text-red-500')} />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors cursor-pointer"
                  title={lang === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Top Section: Cover alongside Essential Info */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Book Cover with Spine Depth */}
                <div className="relative w-36 sm:w-44 aspect-[3/4] shrink-0 mx-auto sm:mx-0 rounded-2xl overflow-hidden bg-muted border-2 border-border/80 shadow-xl">
                  <Image
                    src={displayCover}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 144px, 176px"
                    onError={() => setImageError(true)}
                    unoptimized={displayCover.endsWith('.svg')}
                  />
                  <div className="pointer-events-none absolute inset-y-0 start-0 w-3 bg-gradient-to-r from-black/50 via-white/10 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-y-0 start-3 w-[1px] bg-black/20 z-10" />

                  {/* Condition badge pinned on cover */}
                  <div className="absolute bottom-2 start-2 end-2 z-20 text-center">
                    <span className="backdrop-blur-md bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/20 block truncate">
                      {book.condition === 'NEW' || !book.condition ? 'طبعة أصلية جديدة 🏷️' : 'مستعمل بحالة ممتازة ✨'}
                    </span>
                  </div>
                </div>

                {/* Details Next to Cover */}
                <div className="flex-1 min-w-0 space-y-3 w-full">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight tracking-tight">
                      {title}
                    </h2>
                    <p className="text-sm sm:text-base font-bold text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <span>{lang === 'ar' ? 'المؤلف:' : 'Author:'}</span>
                      <strong className="text-foreground">{author}</strong>
                    </p>
                  </div>

                  {/* Rating & Direct Goodreads Link */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <span>{ratingValue} / 5.0</span>
                    </div>

                    {/* Direct Clickable Goodreads Link */}
                    <a
                      href={goodreadsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#54381e]/10 hover:bg-[#54381e]/20 text-[#54381e] dark:text-[#f4ebd0] dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-[#54381e]/20 dark:border-amber-500/30 text-xs font-bold transition-all shadow-2xs group"
                      title={lang === 'ar' ? 'عرض الكتاب على جودريدز' : 'View book on Goodreads'}
                    >
                      <span className="font-serif font-black tracking-tight text-xs">goodreads</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        ({lang === 'ar' ? 'مراجعات القراء' : 'Reviews'})
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 flex items-baseline justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block">
                        {lang === 'ar' ? 'سعر الكتاب الحالي:' : 'Current Price:'}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-primary">{book.price} ج.م</span>
                        {hasDiscount && (
                          <span className="text-sm text-muted-foreground line-through font-semibold">
                            {originalPrice} ج.م
                          </span>
                        )}
                      </div>
                    </div>

                    {savings > 0 && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 self-center">
                        {lang === 'ar' ? `وفر ${savings} ج.م (${discountPercent}%) 🔥` : `Save ${savings} EGP (${discountPercent}%) 🔥`}
                      </span>
                    )}
                  </div>

                  {/* Shipping pill */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Truck className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'متوفر وجاهز للشحن الفوري للمنزل 🚚' : 'In stock & ready to ship 🚚'}</span>
                  </div>
                </div>
              </div>

              {/* Book Overview / Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'نبذة عن الكتاب:' : 'About the Book:'}</span>
                </span>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                  {bookDescription}
                </p>
              </div>

              {/* Specifications Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-bold">{lang === 'ar' ? 'التصنيف:' : 'Genre:'}</span>
                  <span className="font-bold text-foreground truncate block">{book.category_name_ar || book.category}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-bold">{lang === 'ar' ? 'الحالة:' : 'Condition:'}</span>
                  <span className="font-bold text-foreground truncate block">
                    {book.condition === 'NEW' || !book.condition ? (lang === 'ar' ? 'جديد 🏷️' : 'New') : (lang === 'ar' ? 'مستعمل ممتاز ✨' : 'Like New')}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-bold">ISBN:</span>
                  <span className="font-mono text-foreground font-bold truncate block">{book.isbn || '978-977-09-4321'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-bold">{lang === 'ar' ? 'الشحن:' : 'Delivery:'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                    {lang === 'ar' ? 'فوري لجميع المحافظات' : 'All Governorates'}
                  </span>
                </div>
              </div>

              {/* Reader Reviews & Goodreads Section */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-foreground">
                        {lang === 'ar' ? 'مراجعات وتقييمات القراء' : 'Reader Reviews & Ratings'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {lang === 'ar' ? 'تقييمات موثقة من مجتمع القراء على Goodreads' : 'Verified reviews from Goodreads community'}
                      </p>
                    </div>
                  </div>

                  {/* Goodreads Link Button */}
                  <a
                    href={goodreadsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#54381e] dark:text-[#f4ebd0] bg-[#54381e]/10 dark:bg-amber-500/10 hover:bg-[#54381e]/20 px-2.5 py-1 rounded-xl transition-all border border-[#54381e]/20 dark:border-amber-500/30 group"
                  >
                    <span className="font-serif font-black text-xs">goodreads</span>
                    <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>

                {/* Review Cards */}
                <div className="space-y-2.5">
                  {reviewsList.map((review, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-1.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary font-black text-[11px] flex items-center justify-center shrink-0">
                            {review.avatar}
                          </div>
                          <span className="text-xs font-black text-foreground">{review.name}</span>
                          {review.verified && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                              {lang === 'ar' ? 'قراءة موثقة ✓' : 'Verified Reader ✓'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star
                                key={starIdx}
                                className={cn(
                                  'h-2.5 w-2.5',
                                  starIdx < Math.floor(review.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-muted text-muted-foreground/30'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-semibold">{review.date}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        "{review.text}"
                      </p>
                    </div>
                  ))}
                </div>

                {/* Full Goodreads link button */}
                <a
                  href={goodreadsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-dashed border-border hover:border-primary/50 bg-muted/15 hover:bg-muted/30 text-xs font-bold text-muted-foreground hover:text-foreground transition-all group"
                >
                  <span className="font-serif font-black text-xs text-[#54381e] dark:text-[#f4ebd0]">goodreads</span>
                  <span>{lang === 'ar' ? 'عرض كافة مراجعات وتقييمات القراء على Goodreads' : 'View all community reviews on Goodreads'}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            {/* Modal Bottom Sticky Action Bar: ONE WIDE ADD TO BASKET BUTTON (WhatsApp removed) */}
            <div className="p-4 sm:p-5 bg-card/95 border-t border-border/80 backdrop-blur-sm shrink-0">
              <Button
                size="lg"
                variant={isSelectedInBundle ? 'default' : 'secondary'}
                onClick={() => {
                  onToggleBundle?.(book.id)
                }}
                className={cn(
                  'w-full rounded-2xl font-black text-sm sm:text-base h-12 gap-2.5 cursor-pointer shadow-lg transition-all active:scale-[0.99]',
                  isSelectedInBundle
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-2 border-primary/30'
                )}
              >
                {isSelectedInBundle ? (
                  <>
                    <Check className="h-5 w-5 stroke-[3]" />
                    <span>{lang === 'ar' ? 'مضاف في السلة والباكدج ✓ (انقر للإزالة)' : 'Added to Basket ✓ (Click to remove)'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    <span>{lang === 'ar' ? 'أضف هذا الكتاب للسلة' : 'Add to Basket'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const StoreBookCard = React.memo(StoreBookCardComponent)
