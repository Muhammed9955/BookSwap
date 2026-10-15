'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Truck,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  ShoppingBag,
  Sparkles,
  BookOpen,
  QrCode,
  AlertTriangle,
  User,
  Star,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAvatarUrl, cn, formatPrice, formatPriceEn } from '@/lib/utils'

export interface DealCounterparty {
  id: string
  full_name?: string | null
  full_name_ar?: string | null
  avatar_url?: string | null
  rating_average?: number | null
  whatsapp_number?: string | null
  phone?: string | null
  show_whatsapp?: boolean | null
  city?: { name_ar?: string; name_en?: string } | null
  area?: { name_ar?: string; name_en?: string } | null
}

export interface DealBook {
  id?: string
  title?: string | null
  title_ar?: string | null
  author?: string | null
  cover_image_url?: string | null
  page_count?: number | null
  language?: string | null
  category?: { name_ar?: string; name_en?: string; icon?: string } | null
}

export interface DealListing {
  id: string
  price?: number | null
  condition?: string | null
  description?: string | null
  book?: DealBook | null
  images?: Array<{ url: string; is_primary?: boolean }> | null
}

export interface DetailedDealCardProps {
  id: string
  type: 'BUY' | 'BORROW' | 'SWAP' | 'GIVEAWAY'
  status: string
  createdAt: string
  completedAt?: string | null
  isIncoming: boolean // true = user is owner/receiver of request; false = user is buyer/requester
  counterparty?: DealCounterparty | null
  primaryListing?: DealListing | null // For Buy/Borrow/Giveaway or the requested book in Swap
  offeredListing?: DealListing | null // For Swap only: the book offered in return
  // Loan specifics:
  loanDays?: number | null
  dueDate?: string | null
  returnedAt?: string | null
  depositAmount?: number | null
  // Buy specifics:
  price?: number | null
  // Meetup & Handover details:
  meetupLocation?: string | null
  meetupAt?: string | null
  proposedTimes?: Array<{ label: string; iso?: string }> | string[] | null
  deliveryMethod?: 'MEETUP' | 'COMMUNITY_HUB' | 'COURIER' | string | null
  buyerNote?: string | null
  sellerNote?: string | null
  // Actions:
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  onOpenQrModal?: () => void
  onChat?: () => void
  isBorrowReturn?: boolean
  isActionLoading?: boolean
  isAcceptLoading?: boolean
  isRejectLoading?: boolean
  isCancelLoading?: boolean
  isChatLoading?: boolean
  lang?: 'ar' | 'en'
  highlighted?: boolean
}

// Helper: Format WhatsApp Click-to-Chat URL
function getWhatsAppUrl(phone?: string | null, message: string = ''): string | null {
  if (!phone) return null
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('01')) {
    cleaned = '2' + cleaned
  } else if (!cleaned.startsWith('20') && cleaned.length === 10) {
    cleaned = '20' + cleaned
  }
  if (cleaned.length < 10) return null
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

// Helper: Format Phone for Display
function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

// Helper: Book Condition Badge
function getConditionBadgeDetails(condition?: string | null, lang: 'ar' | 'en' = 'ar') {
  switch (condition) {
    case 'NEW':
      return { label: lang === 'ar' ? 'جديد تماماً ✨' : 'Brand New', variant: 'new' as const }
    case 'LIKE_NEW':
      return { label: lang === 'ar' ? 'كالجديد 💎' : 'Like New', variant: 'like-new' as const }
    case 'VERY_GOOD':
      return { label: lang === 'ar' ? 'ممتازة ⭐' : 'Very Good', variant: 'very-good' as const }
    case 'GOOD':
      return { label: lang === 'ar' ? 'جيدة 👍' : 'Good', variant: 'good' as const }
    case 'ACCEPTABLE':
      return { label: lang === 'ar' ? 'مقبولة 📖' : 'Acceptable', variant: 'acceptable' as const }
    default:
      return { label: lang === 'ar' ? 'حالة جيدة' : 'Good', variant: 'good' as const }
  }
}

export function DetailedDealCard({
  id,
  type,
  status,
  createdAt,
  completedAt,
  isIncoming,
  counterparty,
  primaryListing,
  offeredListing,
  loanDays,
  dueDate,
  returnedAt,
  depositAmount,
  price,
  meetupLocation,
  meetupAt,
  proposedTimes,
  deliveryMethod = 'MEETUP',
  buyerNote,
  sellerNote,
  onAccept,
  onReject,
  onCancel,
  onOpenQrModal,
  onChat,
  isBorrowReturn = false,
  isActionLoading = false,
  isAcceptLoading = false,
  isRejectLoading = false,
  isCancelLoading = false,
  isChatLoading = false,
  lang = 'ar',
  highlighted = false,
}: DetailedDealCardProps) {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState(false)

  const isAccepted = status === 'ACCEPTED'
  const isPending = status === 'PENDING'
  const isCompleted = status === 'COMPLETED'
  const isRejected = status === 'REJECTED' || status === 'CANCELLED'

  // Extract Books
  const primaryBook = Array.isArray(primaryListing?.book) ? primaryListing?.book[0] : primaryListing?.book
  const offeredBook = Array.isArray(offeredListing?.book) ? offeredListing?.book[0] : offeredListing?.book

  const primaryCover =
    primaryListing?.images?.[0]?.url || primaryBook?.cover_image_url || '/images/book-placeholder.svg'
  const offeredCover =
    offeredListing?.images?.[0]?.url || offeredBook?.cover_image_url || '/images/book-placeholder.svg'

  // Secondary Photos for Primary Book
  const additionalPhotos = (primaryListing?.images || []).map(img => img.url).filter(Boolean)

  // Counterparty Names
  const counterpartyName =
    lang === 'ar'
      ? counterparty?.full_name_ar || counterparty?.full_name || 'قارئ'
      : counterparty?.full_name || counterparty?.full_name_ar || 'Reader'

  const counterpartyArea = counterparty?.area
    ? lang === 'ar'
      ? counterparty.area.name_ar
      : counterparty.area.name_en
    : null
  const counterpartyCity = counterparty?.city
    ? lang === 'ar'
      ? counterparty.city.name_ar
      : counterparty.city.name_en
    : null

  // Phone / WhatsApp Setup
  const phone = counterparty?.whatsapp_number || counterparty?.phone
  const displayPhone = formatPhoneDisplay(phone)
  const bookTitleForMessage = primaryBook?.title_ar || primaryBook?.title || 'الكتاب'
  const defaultWhatsAppText =
    lang === 'ar'
      ? `مرحباً ${counterpartyName}! أتواصل معك بخصوص طلب ${type === 'BORROW' ? 'استعارة' : type === 'SWAP' ? 'تبادل' : 'شراء'} كتاب "${bookTitleForMessage}" على منصة بدّلها (ورق).`
      : `Hi ${counterpartyName}! Reaching out regarding our book ${type} on BookSwap for "${bookTitleForMessage}".`
  const whatsAppUrl = getWhatsAppUrl(phone, defaultWhatsAppText)

  // Meetup formatting
  const formattedTimes: string[] = []
  if (meetupAt) {
    formattedTimes.push(
      new Date(meetupAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    )
  } else if (proposedTimes && Array.isArray(proposedTimes)) {
    proposedTimes.forEach(t => {
      if (typeof t === 'string') formattedTimes.push(t)
      else if (t?.label) formattedTimes.push(t.label)
    })
  }

  // Loan Countdown Calculation
  let loanCountdownBadge = null
  if (type === 'BORROW' && dueDate) {
    const dueTime = new Date(dueDate).getTime()
    const nowTime = new Date().getTime()
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24))

    if (returnedAt) {
      loanCountdownBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {lang === 'ar' ? 'تم استرجاع الكتاب واسترداد التأمين بنجاح' : 'Returned & Deposit Refunded'}
        </span>
      )
    } else if (diffDays < 0) {
      loanCountdownBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5" />
          {lang === 'ar' ? `متأخر عن موعد الإرجاع (${Math.abs(diffDays)} يوم)` : `Overdue by ${Math.abs(diffDays)} days`}
        </span>
      )
    } else if (diffDays <= 3) {
      loanCountdownBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          <Clock className="h-3.5 w-3.5" />
          {lang === 'ar' ? `متبقي ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'} على موعد الإرجاع` : `${diffDays} days left to return`}
        </span>
      )
    } else {
      loanCountdownBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <Clock className="h-3.5 w-3.5" />
          {lang === 'ar' ? `متبقي ${diffDays} يوماً على موعد الإرجاع` : `${diffDays} days left to return`}
        </span>
      )
    }
  }

  const primaryCondition = getConditionBadgeDetails(primaryListing?.condition, lang)
  const offeredCondition = getConditionBadgeDetails(offeredListing?.condition, lang)

  return (
    <div
      className={cn(
        'rounded-3xl border-2 bg-card p-5 sm:p-6 shadow-xs space-y-5 transition-all overflow-hidden',
        highlighted ? 'ring-2 ring-primary border-primary shadow-lg' : 'border-border',
        isAccepted && 'border-emerald-500/50 bg-gradient-to-br from-card via-card to-emerald-500/5',
        isCompleted && 'border-muted bg-muted/20 opacity-90'
      )}
    >
      {/* ── 1. HEADER: TYPE, STATUS & CREATION DATE ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {type === 'BORROW' && (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-black text-xs px-3 py-1">
              ⏱️ {lang === 'ar' ? 'استعارة بضمان وتأمين' : 'Borrow / Loan'}
            </Badge>
          )}
          {type === 'SWAP' && (
            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 font-black text-xs px-3 py-1">
              🔄 {lang === 'ar' ? 'مبادلة كتاب بكتاب' : '1-to-1 Book Swap'}
            </Badge>
          )}
          {type === 'BUY' && (
            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-black text-xs px-3 py-1">
              💰 {lang === 'ar' ? 'شراء مباشر' : 'Direct Purchase'}
            </Badge>
          )}
          {type === 'GIVEAWAY' && (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-black text-xs px-3 py-1">
              🎁 {lang === 'ar' ? 'إهداء مجاني' : 'Free Book Gift'}
            </Badge>
          )}

          {/* Status Badge */}
          {isPending && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
              <Clock className="h-3 w-3" />
              {isIncoming ? (lang === 'ar' ? 'بانتظار موافقتك' : 'Pending Your Approval') : (lang === 'ar' ? 'قيد مراجعة المالك' : 'Pending Owner Review')}
            </span>
          )}
          {isAccepted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />
              {lang === 'ar' ? 'تمت الموافقة ✅ (جاهز للمقابلة)' : 'Approved ✅ (Ready for Handover)'}
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              🎉 {lang === 'ar' ? 'معاملة مكتملة' : 'Completed'}
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              <XCircle className="h-3 w-3" />
              {lang === 'ar' ? 'طلب ملغي / معتذر عنه' : 'Declined / Cancelled'}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>
            {new Date(createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* ── 2. COUNTERPARTY CONTACT & IDENTITY CARD ── */}
      {counterparty && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/70">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
              <Image
                src={getAvatarUrl(counterparty.avatar_url, counterpartyName)}
                alt={counterpartyName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">
                  {isIncoming
                    ? (type === 'BORROW' ? (lang === 'ar' ? 'المستعير:' : 'Borrower:') : (lang === 'ar' ? 'المشتري / مقدم العرض:' : 'Buyer / Requester:'))
                    : (type === 'BORROW' ? (lang === 'ar' ? 'مالك الكتاب:' : 'Lender / Owner:') : (lang === 'ar' ? 'مالك الكتاب المعروض:' : 'Seller / Owner:'))}
                </span>
                <h4 className="text-sm font-black text-foreground">{counterpartyName}</h4>
              </div>

              {/* Area & Rating */}
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                {(counterpartyArea || counterpartyCity) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {counterpartyArea}{counterpartyCity && counterpartyArea ? `، ${counterpartyCity}` : counterpartyCity}
                  </span>
                )}
                {Boolean(counterparty.rating_average && counterparty.rating_average > 0) && (
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {counterparty.rating_average?.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Communication Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
            {/* Direct Phone / WhatsApp button */}
            {phone && (
              <>
                {whatsAppUrl && (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                  </a>
                )}
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                  title={displayPhone}
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span dir="ltr" className="font-mono text-[11px] font-bold">{displayPhone}</span>
                </a>
              </>
            )}

            {/* In-App Direct Chat */}
            {onChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={onChat}
                disabled={isChatLoading}
                className="font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5 text-indigo-500" />
                <span>{lang === 'ar' ? 'محادثة' : 'Chat'}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── 3. BOOK SHOWCASE & VISUALS ── */}
      {type === 'SWAP' && offeredBook ? (
        /* SWAP: SIDE-BY-SIDE BOOKS COMPARISON */
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {lang === 'ar' ? 'مقارنة الكتابين المتبادلين:' : 'Books Being Swapped:'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Book 1: My Book / The Book on Offer */}
            <div className="flex gap-3.5 p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5">
              <div className="relative h-24 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border border-border shadow-xs">
                <Image src={primaryCover} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-600 block">
                  {isIncoming
                    ? (lang === 'ar' ? '📖 كتابك المطلوب منك' : 'Your Book (You give)')
                    : (lang === 'ar' ? '📖 الكتاب الذي طلبته' : 'The Book You Want (You get)')}
                </span>
                <h4 className="text-sm font-black text-foreground truncate">
                  {primaryBook?.title_ar || primaryBook?.title || 'الكتاب'}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{primaryBook?.author}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant={primaryCondition.variant} className="text-[10px] font-bold px-2 py-0">
                    {primaryCondition.label}
                  </Badge>
                  {primaryBook?.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-semibold text-muted-foreground">
                      {primaryBook.category.icon} {lang === 'ar' ? primaryBook.category.name_ar : primaryBook.category.name_en}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Book 2: Offered Book */}
            <div className="flex gap-3.5 p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5">
              <div className="relative h-24 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border border-border shadow-xs">
                <Image src={offeredCover} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-[10px] font-black uppercase text-purple-600 block">
                  {isIncoming
                    ? (lang === 'ar' ? '🔄 الكتاب المعروض عليك بالمقابل' : 'Offered Book (You get)')
                    : (lang === 'ar' ? '🔄 كتابك المعروض بالمقابل' : 'Your Offered Book (You give)')}
                </span>
                <h4 className="text-sm font-black text-foreground truncate">
                  {offeredBook?.title_ar || offeredBook?.title || 'كتاب الطرف الآخر'}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{offeredBook?.author}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant={offeredCondition.variant} className="text-[10px] font-bold px-2 py-0">
                    {offeredCondition.label}
                  </Badge>
                  {offeredBook?.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-semibold text-muted-foreground">
                      {offeredBook.category.icon} {lang === 'ar' ? offeredBook.category.name_ar : offeredBook.category.name_en}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE BOOK: BUY, BORROW, OR GIVEAWAY */
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-border bg-muted/10">
          {/* Main Book Cover */}
          <div className="flex sm:flex-col items-center gap-2">
            <div className="relative h-28 w-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border shadow-md">
              <Image
                src={selectedPhotoUrl || primaryCover}
                alt={primaryBook?.title || 'Book Cover'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Thumbnail Strip if multiple photos */}
            {additionalPhotos.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[120px] pt-1">
                {additionalPhotos.slice(0, 3).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPhotoUrl(url)}
                    className={cn(
                      'relative w-7 h-9 rounded-md overflow-hidden border transition-all cursor-pointer shrink-0',
                      (selectedPhotoUrl || primaryCover) === url ? 'border-primary ring-1 ring-primary' : 'border-border/60 opacity-60'
                    )}
                  >
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Book Metadata */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="text-base font-black text-foreground">
                {primaryBook?.title_ar || primaryBook?.title || 'عنوان الكتاب'}
              </h3>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">
                {lang === 'ar' ? 'المؤلف:' : 'Author:'} {primaryBook?.author || 'غير محدد'}
              </p>
            </div>

            {/* Tags & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={primaryCondition.variant} className="text-xs font-bold">
                {primaryCondition.label}
              </Badge>

              {primaryBook?.category && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  <span>{primaryBook.category.icon || '📖'}</span>
                  <span>{lang === 'ar' ? primaryBook.category.name_ar : primaryBook.category.name_en}</span>
                </span>
              )}

              {primaryBook?.page_count && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
                  📄 {primaryBook.page_count} {lang === 'ar' ? 'صفحة' : 'pages'}
                </span>
              )}

              {primaryBook?.language && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
                  🌐 {primaryBook.language === 'ARABIC' ? 'العربية' : primaryBook.language}
                </span>
              )}
            </div>

            {/* Financial / Loan Breakdown */}
            <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-4 text-xs font-bold">
              {type === 'BUY' && (
                <div className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  {lang === 'ar' ? 'السعر المتفق عليه:' : 'Agreed Price:'}{' '}
                  <span>{price ? (lang === 'en' ? formatPriceEn(price) : formatPrice(price)) : (lang === 'ar' ? 'مجاني' : 'Free')}</span>
                </div>
              )}

              {type === 'BORROW' && (
                <div className="flex flex-wrap items-center gap-3">
                  {Boolean(depositAmount && depositAmount > 0) && (
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20 font-black">
                      🛡️ {lang === 'ar' ? `مبلغ التأمين: ${depositAmount} ج.م (مسترد)` : `Deposit: ${depositAmount} EGP (Refundable)`}
                    </span>
                  )}
                  {Boolean(loanDays && loanDays > 0) && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 font-black">
                      ⏱️ {lang === 'ar' ? `مدة الاستعارة: ${loanDays} يوماً` : `Duration: ${loanDays} days`}
                    </span>
                  )}
                  {loanCountdownBadge}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MEETUP, TIME, AND LOCATION DETAILS ── */}
      {(meetupLocation || formattedTimes.length > 0 || deliveryMethod) && (
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              {deliveryMethod === 'COMMUNITY_HUB' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-4 w-4" />
                  {lang === 'ar' ? 'نقطة تسليم آمنة (Community Hub)' : 'Safe Community Hub Drop-off'}
                </span>
              ) : deliveryMethod === 'COURIER' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400">
                  <Truck className="h-4 w-4" />
                  {lang === 'ar' ? 'توصيل عبر شركة شحن' : 'Courier Delivery'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  <MapPin className="h-4 w-4" />
                  {lang === 'ar' ? 'مقابلة شخصية لتسليم الكتاب' : 'In-Person Handover Meetup'}
                </span>
              )}
            </div>

            {isAccepted && (
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {lang === 'ar' ? 'موعد متفق عليه ومؤكد ✅' : 'Confirmed Handover ✅'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {meetupLocation && (
              <div className="flex items-start gap-2 bg-card p-3 rounded-xl border border-border/60">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-muted-foreground font-bold block">
                    {lang === 'ar' ? 'مكان اللقاء المتفق عليه:' : 'Handover Location:'}
                  </span>
                  <p className="font-black text-foreground text-xs mt-0.5 truncate">{meetupLocation}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetupLocation)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline mt-1"
                  >
                    <span>{lang === 'ar' ? 'فتح في خرائط Google 🗺️' : 'View on Google Maps 🗺️'}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            )}

            {formattedTimes.length > 0 && (
              <div className="flex items-start gap-2 bg-card p-3 rounded-xl border border-border/60">
                <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-muted-foreground font-bold block">
                    {lang === 'ar' ? 'الموعد المحدد / المقترح:' : 'Scheduled Date & Time:'}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formattedTimes.map((time, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary font-black text-[11px]"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes toggle */}
          {(buyerNote || sellerNote) && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <span>{lang === 'ar' ? 'ملاحظات الطرفين' : 'Deal Notes'}</span>
                {showNotes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showNotes && (
                <div className="mt-2 p-2.5 rounded-xl bg-card border border-border/70 text-xs text-muted-foreground space-y-1 animate-in fade-in">
                  {buyerNote && (
                    <p>
                      <strong className="text-foreground">{lang === 'ar' ? 'ملاحظة مقدم الطلب:' : 'Requester Note:'}</strong> {buyerNote}
                    </p>
                  )}
                  {sellerNote && (
                    <p>
                      <strong className="text-foreground">{lang === 'ar' ? 'ملاحظة المالك:' : 'Owner Note:'}</strong> {sellerNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 5. ACTION BUTTONS ── */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
        <span className="text-[10px] text-muted-foreground font-mono">
          ID: {id.slice(0, 8)}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {/* Incoming Pending Actions */}
          {isIncoming && isPending && onAccept && onReject && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                loading={isRejectLoading}
                disabled={isActionLoading || isRejectLoading || isAcceptLoading}
                className="text-xs font-bold border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
              >
                <XCircle className="h-4 w-4 me-1" />
                {lang === 'ar' ? 'اعتذار / رفض' : 'Decline'}
              </Button>
              <Button
                size="sm"
                onClick={onAccept}
                loading={isAcceptLoading}
                disabled={isActionLoading || isAcceptLoading || isRejectLoading}
                className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="h-4 w-4 me-1" />
                {lang === 'ar' ? 'موافقة على الطلب ✅' : 'Accept Request ✅'}
              </Button>
            </>
          )}

          {/* Outgoing Pending Cancellation */}
          {!isIncoming && isPending && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              loading={isCancelLoading}
              disabled={isActionLoading || isCancelLoading}
              className="text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
            >
              <XCircle className="h-4 w-4 me-1" />
              {lang === 'ar' ? 'إلغاء الطلب' : 'Cancel Request'}
            </Button>
          )}

          {/* QR Code Verification for Accepted Deals or Borrow Return */}
          {(isAccepted || (type === 'BORROW' && status === 'BORROWED')) && onOpenQrModal && (
            <Button
              size="sm"
              onClick={onOpenQrModal}
              className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <QrCode className="h-4 w-4" />
              <span>
                {isBorrowReturn
                  ? (lang === 'ar' ? 'تأكيد إرجاع الكتاب واسترداد التأمين برمز QR 📱' : 'Verify Return via QR 📱')
                  : (lang === 'ar' ? 'تأكيد المقابلة برمز QR 📱' : 'Verify Meetup with QR 📱')}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
