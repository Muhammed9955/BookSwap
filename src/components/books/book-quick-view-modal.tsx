'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  X,
  BookOpen,
  MapPin,
  Star,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Tag,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatPrice, getConditionLabel, getAvatarUrl } from '@/lib/utils'
import type { DealListing, DealBook, DealCounterparty } from '@/components/transactions/detailed-deal-card'

export interface BookQuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  listing?: DealListing | null
  book?: DealBook | null
  owner?: DealCounterparty | null
  roleLabel?: string
  lang?: 'ar' | 'en'
}

export function BookQuickViewModal({
  isOpen,
  onClose,
  listing,
  book,
  owner,
  roleLabel,
  lang = 'ar',
}: BookQuickViewModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBook: any = listing?.book || book || (listing as any)?.title ? listing : null
  const resolvedBook = Array.isArray(rawBook) ? rawBook[0] : rawBook

  const title = (lang === 'ar' && resolvedBook?.title_ar)
    ? resolvedBook.title_ar
    : resolvedBook?.title || (lang === 'ar' ? 'تفاصيل الكتاب' : 'Book Details')
  const author = resolvedBook?.author || (lang === 'ar' ? 'مؤلف غير معروف' : 'Unknown Author')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const condition = getConditionLabel(((listing?.condition || resolvedBook?.condition || 'GOOD') as any), lang)

  // Primary cover image with fallback
  const images = listing?.images || []
  const primaryImg =
    images.find(img => img.is_primary)?.url ||
    images[0]?.url ||
    resolvedBook?.cover_image_url ||
    resolvedBook?.cover_url ||
    (listing as any)?.cover_image_url ||
    '/images/placeholders/book-cover.svg'

  const whatsappPhone = owner?.whatsapp_number || owner?.phone
  const cleanPhone = whatsappPhone ? whatsappPhone.replace(/[^0-9]/g, '') : ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-background border border-border shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              {roleLabel && (
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block truncate">
                  {roleLabel}
                </span>
              )}
              <h3 id="book-modal-title" className="text-sm sm:text-base font-black truncate">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Book Card Banner */}
          <div className="flex flex-col sm:flex-row gap-4 items-start bg-muted/30 p-4 rounded-2xl border border-border/60">
            {/* Book Cover */}
            <div className="relative h-44 w-32 shrink-0 rounded-xl overflow-hidden bg-muted border border-border shadow-md mx-auto sm:mx-0">
              <Image
                src={primaryImg}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Core Info */}
            <div className="flex-1 min-w-0 space-y-2.5 w-full">
              <div>
                <h4 className="text-lg font-black text-foreground leading-snug">
                  {title}
                </h4>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {lang === 'ar' ? 'بقلم:' : 'By:'} <span className="text-foreground">{author}</span>
                </p>
              </div>

              {/* Tags: Condition, Category, Language */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5">
                  {condition}
                </Badge>

                {resolvedBook?.category && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    <span>{resolvedBook.category.icon || '🏷️'}</span>
                    <span>{lang === 'ar' ? resolvedBook.category.name_ar : resolvedBook.category.name_en}</span>
                  </span>
                )}

                {resolvedBook?.language && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-semibold">
                    {resolvedBook.language}
                  </span>
                )}

                {resolvedBook?.page_count && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-semibold">
                    {resolvedBook.page_count} {lang === 'ar' ? 'صفحة' : 'pages'}
                  </span>
                )}
              </div>

              {/* Price / Type Info */}
              {listing?.price != null && listing.price > 0 && (
                <div className="pt-1">
                  <span className="text-xs text-muted-foreground font-bold block">
                    {lang === 'ar' ? 'السعر المحدد:' : 'Price:'}
                  </span>
                  <span className="text-lg font-black text-primary">
                    {formatPrice(listing.price)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Photos Strip if available */}
          {images.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground">
                {lang === 'ar' ? 'صور إضافية للكتاب من البائع:' : 'Additional Seller Photos:'}
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-16 h-20 rounded-xl overflow-hidden border border-border shrink-0 hover:ring-2 hover:ring-primary transition-all shadow-xs"
                    title={lang === 'ar' ? 'فتح الصورة بحجم كامل' : 'View full image'}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Description / Condition Details */}
          {listing?.description && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-card border border-border/80">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>{lang === 'ar' ? 'وصف وحالة النسخة من المالك:' : 'Condition & Owner Description:'}</span>
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* Owner / Counterparty Contact Card */}
          {owner && (
            <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-primary/10 border border-primary/20 shrink-0">
                    <Image
                      src={getAvatarUrl(owner.avatar_url, owner.full_name || 'U')}
                      alt={owner.full_name || 'Owner'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-foreground block">
                      {lang === 'ar' && owner.full_name_ar ? owner.full_name_ar : owner.full_name || 'قارئ ورقي'}
                    </span>
                    {(owner.city || owner.area) && (
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {lang === 'ar'
                            ? [owner.city?.name_ar, owner.area?.name_ar].filter(Boolean).join('، ')
                            : [owner.city?.name_en, owner.area?.name_en].filter(Boolean).join(', ')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {owner.rating_average != null && owner.rating_average > 0 && (
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/20 text-xs font-black">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{owner.rating_average.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Quick Contact Buttons */}
              {whatsappPhone && (
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <a
                    href={`tel:${whatsappPhone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 fill-current" />
                    <span>{lang === 'ar' ? 'اتصال بالمالك' : 'Call Owner'}</span>
                  </a>

                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      lang === 'ar'
                        ? `مرحباً! أستفسر بخصوص كتاب "${title}" على منصة وَرَق.`
                        : `Hi! Inquiring about "${title}" on WARAQ.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'محادثة واتساب' : 'WhatsApp'}</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/70 bg-muted/20 flex items-center justify-between gap-3">
          {listing?.id ? (
            <Link
              href={`/books/${listing.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              onClick={onClose}
            >
              <span>{lang === 'ar' ? 'عرض الصفحة الكاملة للكتاب' : 'Open Full Listing Page'}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : <div />}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold px-4 cursor-pointer"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  )
}
