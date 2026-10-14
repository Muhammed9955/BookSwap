'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Star, ArrowRightLeft, Gift } from 'lucide-react'
import { BookListing } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn, formatPrice, getConditionLabel, getListingTypeLabel, formatRelativeTime, getImageUrl, slugify } from '@/lib/utils'
import { useLanguage } from '@/i18n/language-context'

interface BookCardProps {
  listing: BookListing
  className?: string
  compact?: boolean
  showDistance?: boolean
  distance?: number
  isWishlisted?: boolean
  onWishlistToggle?: (listingId: string) => void
  matchScore?: number
}

export function BookCard({
  listing,
  className,
  compact = false,
  showDistance = false,
  distance,
  isWishlisted = false,
  onWishlistToggle,
  matchScore,
}: BookCardProps) {
  const { lang, isRTL } = useLanguage()
  const book = listing.book
  const seller = listing.seller

  const primaryImage = listing.images?.find(img => img.is_primary)?.url
    || listing.images?.[0]?.url
    || book?.cover_image_url

  const bookSlug = listing.id

  const ListingTypeBadge = () => {
    const typeMap: Record<string, { label: string; variant: 'sell' | 'swap' | 'giveaway' | 'sell-swap'; icon?: React.ReactNode }> = {
      SELL: { label: lang === 'ar' ? 'للبيع' : 'For Sale', variant: 'sell' },
      SWAP: { label: lang === 'ar' ? 'مبادلة' : 'Swap', variant: 'swap', icon: <ArrowRightLeft className="h-2.5 w-2.5" /> },
      SELL_OR_SWAP: { label: lang === 'ar' ? 'بيع/مبادلة' : 'Sale/Swap', variant: 'sell-swap' },
      GIVEAWAY: { label: lang === 'ar' ? 'مجاني' : 'Free', variant: 'giveaway', icon: <Gift className="h-2.5 w-2.5" /> },
    }
    const info = typeMap[listing.listing_type] ?? { label: listing.listing_type, variant: 'sell' as const }
    return (
      <Badge variant={info.variant} className="text-[10px] px-1.5 py-0.5">
        {info.icon}
        {info.label}
      </Badge>
    )
  }

  if (compact) {
    return (
      <Link href={`/books/${bookSlug}`} className={cn('book-card flex gap-3 p-3', className)}>
        {/* Cover */}
        <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={book?.title ?? 'Book cover'}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl bg-gradient-to-br from-primary/10 to-primary/20">
              📚
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
            {lang === 'ar' && book?.title_ar ? book.title_ar : book?.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {lang === 'ar' && book?.author_ar ? book.author_ar : book?.author}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <ListingTypeBadge />
            <span className="text-sm font-bold text-foreground">
              {listing.listing_type === 'GIVEAWAY' ? (lang === 'ar' ? 'مجاني' : 'Free') : formatPrice(listing.price)}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/books/${bookSlug}`} className={cn('book-card group flex flex-col h-full justify-between', className)}>
      {/* Cover Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted shrink-0">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={book?.title ?? 'Book cover'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/15 to-purple-500/10">
            <span className="text-5xl">📚</span>
          </div>
        )}

        {/* Realistic Book Spine Depth & Highlights */}
        <div className="pointer-events-none absolute inset-y-0 start-0 w-3.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 start-3.5 w-[1px] bg-black/15 z-10" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-1 bg-gradient-to-l from-black/20 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent z-10" />

        {/* Overlay badges */}
        <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-start justify-between">
          <ListingTypeBadge />
          <div className="flex flex-col items-end gap-1">
            {listing.is_featured && (
              <span className="featured-badge shadow-sm">⭐ {lang === 'ar' ? 'مميز' : 'Featured'}</span>
            )}
            {matchScore !== undefined && matchScore > 70 && (
              <span className="badge bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 shadow-sm">
                🔥 {matchScore}%
              </span>
            )}
          </div>
        </div>

        {/* Wishlist button */}
        {onWishlistToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onWishlistToggle(listing.id)
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
              'absolute bottom-2.5 end-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 cursor-pointer z-20 touch-manipulation select-none active:scale-90',
              isWishlisted
                ? 'bg-red-500 text-white scale-110'
                : 'bg-card/90 text-muted-foreground hover:bg-card hover:text-red-500 hover:scale-110 backdrop-blur-md'
            )}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 justify-between p-3 sm:p-4">
        <div className="space-y-1">
          {/* Standardized Title Container Height */}
          <div className="h-[2.5rem] sm:h-[2.85rem] overflow-hidden flex items-start">
            <h3 className="text-xs sm:text-sm md:text-base font-black leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {lang === 'ar' && book?.title_ar ? book.title_ar : book?.title}
            </h3>
          </div>
          {/* Standardized Author Container Height */}
          <div className="h-4 sm:h-5 overflow-hidden">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold line-clamp-1">
              {lang === 'ar' && book?.author_ar ? book.author_ar : book?.author}
            </p>
          </div>
        </div>

        {/* Price & Location Bottom Section */}
        <div className="mt-auto pt-2 space-y-1.5">
          {/* Price & Condition Row */}
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-xs sm:text-base font-black',
              listing.listing_type === 'GIVEAWAY' ? 'text-green-600 dark:text-green-400' : 'text-foreground'
            )}>
              {listing.listing_type === 'GIVEAWAY'
                ? (lang === 'ar' ? '🎁 مجاني' : '🎁 Free')
                : formatPrice(listing.price)}
            </span>
            <Badge
              variant={
                listing.condition === 'NEW' ? 'new' :
                listing.condition === 'LIKE_NEW' ? 'like-new' :
                listing.condition === 'VERY_GOOD' ? 'very-good' :
                listing.condition === 'GOOD' ? 'good' : 'acceptable'
              }
              className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5"
            >
              {getConditionLabel(listing.condition, lang)}
            </Badge>
          </div>

          {/* Seller & Location */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-primary">
                  {seller?.full_name?.charAt(0) ?? 'U'}
                </span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground truncate">
                {seller?.full_name ?? (lang === 'ar' ? 'مجهول' : 'Unknown')}
              </span>
              {seller?.rating_average && seller.rating_average > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                  <Star className="h-3 w-3 fill-current" />
                  {seller.rating_average.toFixed(1)}
                </span>
              )}
            </div>

            {(showDistance && distance !== undefined) ? (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground flex-shrink-0">
                <MapPin className="h-3 w-3" />
                {`${distance.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}`}
              </span>
            ) : listing.area ? (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground flex-shrink-0 truncate max-w-[90px]">
                <MapPin className="h-3 w-3" />
                {lang === 'ar' ? listing.area.name_ar : listing.area.name_en}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function BookCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex gap-3 p-3 rounded-xl border bg-card">
        <div className="skeleton h-20 w-14 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="skeleton h-5 w-1/3 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="skeleton aspect-[2/3]" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-5 w-1/3 rounded-full" />
      </div>
    </div>
  )
}
