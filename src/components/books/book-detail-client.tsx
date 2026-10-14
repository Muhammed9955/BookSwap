'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart, Share2, Flag, MapPin, Star, Shield, ArrowRightLeft,
  ShoppingBag, MessageCircle, Check, ChevronLeft, Clock, Eye, Users,
  ShieldCheck, Calendar, AlertCircle, Edit3, Tag, Sparkles, CheckCircle2,
  Lock, PlusCircle, ExternalLink, Copy, AlertTriangle, ArrowRight, BookOpen, RefreshCw, Search,
  Trash2, Loader2
} from 'lucide-react'
import { deleteBookListing } from '@/lib/books/listing-actions'
import { BookListing, Profile } from '@/types'
import { BookCard } from '@/components/books/book-card'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatPrice, getConditionLabel, getListingTypeLabel, formatRelativeTime } from '@/lib/utils'
import { submitBuyRequest, submitBorrowRequest, submitSwapRequest, createTestIncomingTransaction } from '@/lib/transactions/lifecycle'
import type { MeetupProposal } from '@/lib/transactions/lifecycle'
import { MeetupPicker } from '@/components/ui/meetup-picker'

export interface ExistingRequestInfo {
  id: string
  type: 'BUY' | 'BORROW' | 'SWAP'
  status: string
  createdAt: string
  loanDays?: number
  deposit?: number
}

interface BookDetailClientProps {
  listing: BookListing
  user: { id: string; profile?: Record<string, unknown> | null } | null
  similarListings: BookListing[]
  sellerListings: BookListing[]
  isWishlisted: boolean
  wantCount: number
  userListings: Array<{ id: string; book: { title: string } }>
  existingRequest?: ExistingRequestInfo | null
}

export function BookDetailClient({
  listing,
  user,
  similarListings,
  sellerListings,
  isWishlisted: initialWishlisted,
  wantCount,
  userListings,
  existingRequest: initialExistingRequest = null,
}: BookDetailClientProps) {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const book = listing.book!
  const seller = listing.seller as unknown as Profile

  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [activeImage, setActiveImage] = useState(0)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  // Dynamic lending calculation (supporting normal vs. high-value books)
  const descText = listing.description || ''
  const depositMatch = descText.match(/(?:التأمين المسترد بالكامل|Refundable Deposit):\s*(\d+)/i)
  const feeMatch = descText.match(/(?:رسم الاستعارة الأسبوعي|Weekly Fee):\s*(\d+)/i)

  const bookPrice = listing.price && listing.price > 0 ? listing.price : 60
  const isExpensiveBook = bookPrice >= 300

  const parsedDeposit = depositMatch ? Number(depositMatch[1]) : null
  const parsedWeeklyFee = feeMatch ? Number(feeMatch[1]) : null

  // Default deposit: 100% replacement value for expensive books to safeguard owner
  const defaultDeposit = parsedDeposit ?? (isExpensiveBook ? Math.round(bookPrice) : Math.max(50, Math.round(bookPrice)))

  // Default weekly fee scaled to book value
  const defaultWeeklyFee = parsedWeeklyFee ?? (
    bookPrice > 500 ? Math.round(bookPrice * 0.08) :
    bookPrice > 250 ? Math.round(bookPrice * 0.10) :
    bookPrice > 100 ? Math.round(bookPrice * 0.12) : 15
  )

  const calcScaledFee = (days: number, weeklyFee: number) => {
    if (days <= 7) return weeklyFee
    if (days <= 14) return Math.round(weeklyFee * 1.75)
    if (days <= 21) return Math.round(weeklyFee * 2.4)
    return Math.round(weeklyFee * 3.0)
  }

  const [loanDays, setLoanDays] = useState(14)
  const currentDeposit = defaultDeposit
  const currentBorrowFee = calcScaledFee(loanDays, defaultWeeklyFee)
  const [borrowNote, setBorrowNote] = useState('')
  const [agreedToBorrowPolicy, setAgreedToBorrowPolicy] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>(listing.status || 'ACTIVE')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [copyToast, setCopyToast] = useState(false)
  const [offerNote, setOfferNote] = useState('')
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [swapMessage, setSwapMessage] = useState('')
  const [offerAmount, setOfferAmount] = useState(
    listing.price && listing.price > 10 ? String(Math.round(listing.price * 0.85)) : ''
  )
  const [selectedUserListing, setSelectedUserListing] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modalValidationError, setModalValidationError] = useState<string | null>(null)
  const [currentExistingRequest, setCurrentExistingRequest] = useState<ExistingRequestInfo | null>(initialExistingRequest)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Shared meetup proposal — same picker for Buy, Borrow, and Swap
  const defaultMeetup: MeetupProposal = { preferred_delivery: 'MEETUP' }
  const [buyMeetup, setBuyMeetup] = useState<MeetupProposal>(defaultMeetup)
  const [borrowMeetup, setBorrowMeetup] = useState<MeetupProposal>(defaultMeetup)
  const [swapMeetup, setSwapMeetup] = useState<MeetupProposal>(defaultMeetup)

  const images = listing.images ?? []
  const primaryImage = images.find(img => img.is_primary)?.url ?? images[0]?.url ?? book.cover_image_url

  const userRole = (user?.profile as any)?.role
  const userCityId = (user?.profile as any)?.city_id
  const isOwner = Boolean(
    user?.id && (
      user.id === listing.seller_id ||
      user.id === (seller as any)?.id
    )
  )
  const isSeller = isOwner
  const isAdminOrMod = userRole === 'ADMIN' || userRole === 'MODERATOR'
  const isSameCity = Boolean(!isOwner && userCityId && listing.city_id && userCityId === listing.city_id)

  const [testRequestSuccess, setTestRequestSuccess] = useState<string | null>(null)

  const handleCreateTestIncomingRequest = async (mode: 'BORROW' | 'BUY' = 'BORROW') => {
    setActionLoading(`test-${mode}`)
    setTestRequestSuccess(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdTx: any = null
      try {
        createdTx = await createTestIncomingTransaction({
          sellerId: listing.seller_id,
          listingId: listing.id,
          mode,
        })
      } catch {
        const res = await fetch('/api/transactions/test-incoming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId: listing.seller_id,
            listingId: listing.id,
            mode,
          }),
        })
        const data = await res.json()
        if (data.transaction) {
          createdTx = data.transaction
        } else {
          throw new Error(data.error || 'فشل إنشاء الطلب التجريبي')
        }
      }

      if (createdTx) {
        setTestRequestSuccess(createdTx.id)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ أثناء إنشاء الطلب التجريبي'
      setActionError(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleWishlist = async () => {
    if (!user) { setShowAuthModal(true); return }
    setWishlisted(v => !v)
    if (wishlisted) {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('book_id', listing.book_id!)
    } else {
      await supabase.from('wishlist_items').insert({ user_id: user.id, book_id: listing.book_id })
    }
  }

  const handleContact = async () => {
    if (!user) { setShowAuthModal(true); return }
    setActionLoading('contact')

    // Create or get conversation
    const p1 = user.id < seller.id ? user.id : seller.id
    const p2 = user.id < seller.id ? seller.id : user.id

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle()

    let convId = existing?.id

    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_1: p1, participant_2: p2, listing_id: listing.id })
        .select('id')
        .single()
      convId = newConv?.id
    }

    setActionLoading(null)
    if (convId) router.push(`/messages/${convId}`)
  }

  const handleSwapRequest = async () => {
    if (!user) { router.push('/login'); return }
    if (isOwner && process.env.NODE_ENV === 'production') {
      setModalValidationError(lang === 'ar' ? 'لا يمكنك إرسال طلب مبادلة لكتابك الخاص.' : 'You cannot swap with your own book.')
      return
    }
    if (currentExistingRequest) {
      setModalValidationError(
        lang === 'ar'
          ? 'لديك بالفعل طلب معلق لهذا الكتاب قيد مراجعة المالك. لا يمكن إرسال أكثر من طلب لنفس الكتاب.'
          : 'You already have an active request for this book awaiting owner review.'
      )
      return
    }
    if (!selectedUserListing) {
      setModalValidationError(
        lang === 'ar'
          ? '📚 يرجى اختيار أحد كتبك من مكتبتك لتقديمه كعرض مبادلة.'
          : '📚 Please select a book from your shelf to offer.'
      )
      return
    }

    // 1. Validate Meetup Location
    if (swapMeetup.preferred_delivery === 'MEETUP') {
      if (!swapMeetup.location || !swapMeetup.location.trim()) {
        setModalValidationError(
          lang === 'ar'
            ? '📍 يرجى اختيار مكان المقابلة من الأماكن العامة المقترحة أو كتابة مكان مخصص.'
            : '📍 Please select a safe public meetup location.'
        )
        return
      }
    } else if (swapMeetup.preferred_delivery === 'COMMUNITY_HUB') {
      if (!swapMeetup.hub_id && !swapMeetup.location) {
        setModalValidationError(
          lang === 'ar'
            ? '🏢 يرجى اختيار النقطة الآمنة المعتمدة للمجتمع للاستلام والتبادل.'
            : '🏢 Please select a community safe hub.'
        )
        return
      }
    }

    // 2. Validate Available Times
    if (swapMeetup.preferred_delivery !== 'COURIER') {
      if (!swapMeetup.proposed_times || swapMeetup.proposed_times.length === 0) {
        setModalValidationError(
          lang === 'ar'
            ? '⏰ يرجى اختيار موعد أو وقت مناسب واحد على الأقل لتسهيل المقابلة والتنسيق مع المالك.'
            : '⏰ Please select at least one available time slot.'
        )
        return
      }
    }

    setActionLoading('swap')
    setModalValidationError(null)
    setActionError(null)

    try {
      const offeredBook = userListings.find(l => l.id === selectedUserListing)?.book?.title
      const res = await submitSwapRequest({
        requesterId: user.id,
        ownerId: seller.id,
        listingId: listing.id,
        offeredListingId: selectedUserListing,
        message: swapMessage,
        targetBookTitle: book.title,
        offeredBookTitle: offeredBook,
        meetup: swapMeetup,
      })

      setActionSuccess('swap')
      setCurrentExistingRequest({
        id: (res as any)?.swapId || 'pending',
        type: 'SWAP',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      })
      setShowSwapModal(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'حدث خطأ أثناء إرسال طلب المبادلة.' : 'Error sending swap request.')
      setModalValidationError(msg)
      setActionError(msg)
      console.error('Swap request error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBuyRequest = async () => {
    if (!user) { router.push('/login'); return }
    if (isOwner && process.env.NODE_ENV === 'production') {
      setModalValidationError(lang === 'ar' ? 'لا يمكنك إرسال طلب شراء لكتابك الخاص.' : 'You cannot buy your own book.')
      return
    }
    if (currentExistingRequest) {
      setModalValidationError(
        lang === 'ar'
          ? 'لديك بالفعل طلب معلق لهذا الكتاب قيد مراجعة المالك. لا يمكن إرسال أكثر من طلب لنفس الكتاب.'
          : 'You already have an active request for this book awaiting owner review.'
      )
      return
    }

    // 1. Validate Meetup Location
    if (buyMeetup.preferred_delivery === 'MEETUP') {
      if (!buyMeetup.location || !buyMeetup.location.trim()) {
        setModalValidationError(
          lang === 'ar'
            ? '📍 يرجى اختيار مكان المقابلة من الأماكن العامة المقترحة أو كتابة مكان مخصص.'
            : '📍 Please select a safe public meetup location.'
        )
        return
      }
    } else if (buyMeetup.preferred_delivery === 'COMMUNITY_HUB') {
      if (!buyMeetup.hub_id && !buyMeetup.location) {
        setModalValidationError(
          lang === 'ar'
            ? '🏢 يرجى اختيار النقطة الآمنة المعتمدة للمجتمع للاستلام.'
            : '🏢 Please select a community safe hub.'
        )
        return
      }
    }

    // 2. Validate Available Times
    if (buyMeetup.preferred_delivery !== 'COURIER') {
      if (!buyMeetup.proposed_times || buyMeetup.proposed_times.length === 0) {
        setModalValidationError(
          lang === 'ar'
            ? '⏰ يرجى اختيار موعد أو وقت مناسب واحد على الأقل لتسهيل المقابلة والتسليم.'
            : '⏰ Please select at least one available time slot.'
        )
        return
      }
    }

    setActionLoading('buy')
    setModalValidationError(null)
    setActionError(null)

    try {
      const res = await submitBuyRequest({
        buyerId: user.id,
        sellerId: seller.id,
        listingId: listing.id,
        price: listing.price ?? null,
        bookTitle: book.title,
        meetup: buyMeetup,
      })

      setActionSuccess('buy')
      setCurrentExistingRequest({
        id: res.transactionId || 'pending',
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      })
      setShowBuyModal(false)
      if (res.conversationId) {
        setTimeout(() => router.push(`/messages/${res.conversationId}`), 1200)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'حدث خطأ أثناء إرسال طلب الشراء.' : 'Error sending buy request.')
      setModalValidationError(msg)
      setActionError(msg)
      console.error('Buy request error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBorrowRequest = async () => {
    if (!user) { router.push('/login'); return }
    if (isOwner && process.env.NODE_ENV === 'production') {
      setModalValidationError(lang === 'ar' ? 'لا يمكنك استعارة كتابك الخاص.' : 'You cannot borrow your own book.')
      return
    }
    if (currentExistingRequest) {
      setModalValidationError(
        lang === 'ar'
          ? 'لديك بالفعل طلب معلق لهذا الكتاب قيد مراجعة المالك. لا يمكن إرسال أكثر من طلب لنفس الكتاب.'
          : 'You already have an active request for this book awaiting owner review.'
      )
      return
    }

    // 1. Validate Meetup Location
    if (borrowMeetup.preferred_delivery === 'MEETUP') {
      if (!borrowMeetup.location || !borrowMeetup.location.trim()) {
        setModalValidationError(
          lang === 'ar'
            ? '📍 يرجى اختيار مكان المقابلة والتسليم من الأماكن العامة المقترحة أو كتابة مكان مخصص.'
            : '📍 Please select a safe public meetup location.'
        )
        return
      }
    } else if (borrowMeetup.preferred_delivery === 'COMMUNITY_HUB') {
      if (!borrowMeetup.hub_id && !borrowMeetup.location) {
        setModalValidationError(
          lang === 'ar'
            ? '🏢 يرجى اختيار النقطة الآمنة المعتمدة للمجتمع للاستلام والتسليم.'
            : '🏢 Please select a community safe hub.'
        )
        return
      }
    }

    // 2. Validate Available Times
    if (borrowMeetup.preferred_delivery !== 'COURIER') {
      if (!borrowMeetup.proposed_times || borrowMeetup.proposed_times.length === 0) {
        setModalValidationError(
          lang === 'ar'
            ? '⏰ يرجى اختيار موعد أو وقت مناسب واحد على الأقل لتسهيل المقابلة والتسليم مع المالك.'
            : '⏰ Please select at least one available time slot.'
        )
        return
      }
    }

    // 3. Validate Policy Agreement
    if (!agreedToBorrowPolicy) {
      setModalValidationError(
        lang === 'ar'
          ? '📋 يرجى تفعيل خانة الموافقة على سياسة الاستعارة والحفاظ على الكتاب للمتابعة.'
          : '📋 Please agree to the lending policy before submitting.'
      )
      return
    }

    setActionLoading('borrow')
    setModalValidationError(null)
    setActionError(null)

    try {
      const res = await submitBorrowRequest({
        borrowerId: user.id,
        lenderId: seller.id,
        listingId: listing.id,
        loanDays,
        deposit: currentDeposit,
        borrowFee: currentBorrowFee,
        note: borrowNote,
        bookTitle: book.title,
        meetup: borrowMeetup,
      })

      setActionSuccess('borrow')
      setCurrentExistingRequest({
        id: res.transactionId || 'pending',
        type: 'BORROW',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        loanDays,
        deposit: currentDeposit,
      })
      setShowBorrowModal(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'حدث خطأ أثناء إرسال طلب الاستعارة.' : 'Error sending borrow request.')
      setModalValidationError(msg)
      setActionError(msg)
      console.error('Borrow request error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `${book.title} - ${book.author} | WARAQ — ورق`,
          url: window.location.href,
        })
        return
      } catch {}
    }
    await navigator.clipboard.writeText(window.location.href)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 3000)
  }

  const handleToggleStatus = async (newStatus: 'ACTIVE' | 'RESERVED' | 'SOLD') => {
    setActionLoading('status_change')
    await supabase.from('book_listings').update({ status: newStatus }).eq('id', listing.id)
    setCurrentStatus(newStatus)
    setActionLoading(null)
    router.refresh()
  }

  const handleDeleteListing = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteBookListing(listing.id)
      setShowDeleteModal(false)
      router.push('/profile?tab=books')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'فشل حذف الكتاب، يرجى المحاولة مرة أخرى.' : 'Failed to delete listing, please try again.')
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendOffer = async () => {
    if (!user) { setShowAuthModal(true); return }
    const numOffer = Number(offerAmount)
    if (!numOffer || numOffer <= 0) return
    setActionLoading('offer')

    const p1 = user.id < seller.id ? user.id : seller.id
    const p2 = user.id < seller.id ? seller.id : user.id

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle()

    let convId = existing?.id

    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_1: p1, participant_2: p2, listing_id: listing.id })
        .select('id')
        .single()
      convId = newConv?.id
    }

    if (convId) {
      const offerText = lang === 'ar'
        ? `👋 أود تقديم عرض سعر لشراء كتاب "${book.title}" بقيمة ${numOffer} ج.م بدلاً من ${listing.price} ج.م.${offerNote ? `\n\nملاحظة: ${offerNote}` : ''}`
        : `👋 I would like to offer ${numOffer} EGP for "${book.title}" (listed for ${listing.price} EGP).${offerNote ? `\n\nNote: ${offerNote}` : ''}`

      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: offerText,
      })

      await supabase.from('notifications').insert({
        user_id: seller.id,
        type: 'BOOK_RESERVED',
        title: lang === 'ar' ? 'عرض سعر جديد' : 'New Price Offer',
        title_ar: 'عرض سعر جديد',
        body: lang === 'ar'
          ? `أرسل قارئ عرضاً بقيمة ${numOffer} ج.م لكتاب "${book.title}"`
          : `A reader offered ${numOffer} EGP for "${book.title}"`,
        action_url: `/messages/${convId}`,
      })

      setActionLoading(null)
      setActionSuccess('offer')
      setShowOfferModal(false)
      setTimeout(() => router.push(`/messages/${convId}`), 1000)
    } else {
      setActionLoading(null)
    }
  }

  return (
    <MainLayout user={user}>
      <div className="page-container py-6 max-w-5xl">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ChevronLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
          {lang === 'ar' ? 'رجوع' : 'Back'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
              {primaryImage ? (
                <Image
                  src={images[activeImage]?.url ?? primaryImage}
                  alt={book.title}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-8xl">📚</div>
              )}
              {listing.is_featured && (
                <div className="absolute top-3 start-3">
                  <span className="featured-badge">⭐ {lang === 'ar' ? 'مميز' : 'Featured'}</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors',
                      activeImage === i ? 'border-primary' : 'border-transparent'
                    )}
                  >
                    <Image src={img.url} alt={`View ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            {/* Category + Type */}
            <div className="flex flex-wrap items-center gap-2">
              {book.category && (
                <Badge variant="muted">
                  {book.category.icon} {lang === 'ar' ? book.category.name_ar : book.category.name_en}
                </Badge>
              )}
              <Badge variant={
                listing.listing_type === 'SELL' ? 'sell' :
                listing.listing_type === 'SWAP' ? 'swap' :
                listing.listing_type === 'GIVEAWAY' ? 'giveaway' : 'sell-swap'
              }>
                {getListingTypeLabel(listing.listing_type, lang)}
              </Badge>
              <Badge variant={
                listing.condition === 'NEW' ? 'new' :
                listing.condition === 'LIKE_NEW' ? 'like-new' :
                listing.condition === 'VERY_GOOD' ? 'very-good' :
                listing.condition === 'GOOD' ? 'good' : 'acceptable'
              }>
                {getConditionLabel(listing.condition, lang)}
              </Badge>
            </div>

            {/* Title & Author */}
            <div>
              <h1 className="text-2xl font-bold leading-tight mb-1">
                {lang === 'ar' && book.title_ar ? book.title_ar : book.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {lang === 'ar' && book.author_ar ? book.author_ar : book.author}
              </p>
              {book.publisher && (
                <p className="text-sm text-muted-foreground mt-0.5">{book.publisher}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn(
                'text-3xl font-extrabold',
                listing.listing_type === 'GIVEAWAY' ? 'text-green-600 dark:text-green-400' : 'text-foreground'
              )}>
                {listing.listing_type === 'GIVEAWAY'
                  ? (lang === 'ar' ? '🎁 مجاني' : '🎁 Free')
                  : formatPrice(listing.price)
                }
              </span>
              {listing.is_negotiable && listing.listing_type !== 'GIVEAWAY' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { setShowAuthModal(true); return }
                    setShowOfferModal(true)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'قابل للتفاوض — قدّم عرضك 💬' : 'Negotiable — Make an Offer 💬'}</span>
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {listing.view_count} {lang === 'ar' ? 'مشاهدة' : 'views'}
              </span>
              {wantCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {wantCount} {lang === 'ar' ? 'عايزين الكتاب ده' : 'want this'}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatRelativeTime(listing.created_at, lang)}
              </span>
            </div>

            {/* Description */}
            {(listing.description || book.description) && (
              <div>
                <h3 className="font-semibold mb-1">{lang === 'ar' ? 'الوصف' : 'Description'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {listing.description ?? book.description}
                </p>
              </div>
            )}

            {/* Location */}
            {listing.area && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {lang === 'ar' ? listing.area.name_ar : listing.area.name_en}
                  {listing.city && `, ${lang === 'ar' ? listing.city.name_ar : listing.city.name_en}`}
                </span>
              </div>
            )}

            {/* Success Messages */}
            {actionSuccess === 'swap' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
                <Check className="h-4 w-4" />
                {lang === 'ar' ? '✅ اتبعت طلب المبادلة!' : '✅ Swap request sent!'}
              </div>
            )}
            {actionSuccess === 'buy' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
                <Check className="h-4 w-4" />
                {lang === 'ar' ? '✅ اتبعت طلب الشراء! هيتواصل معك البائع.' : '✅ Purchase request sent! The seller will contact you.'}
              </div>
            )}
            {actionSuccess === 'borrow' && (
              <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-sm animate-in fade-in">
                <div className="flex items-center gap-2 font-black">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'ar' ? '✅ تم إرسال طلب الاستعارة للمالك بنجاح!' : '✅ Borrow request sent to owner!'}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === 'ar'
                    ? 'سيتم إشعار صاحب الكتاب لمراجعة طلبك والموافقة عليه لتحديد موعد ومكان التسليم. يمكنك متابعة حالة طلبك وتاريخ الإرجاع من صفحة معاملاتك.'
                    : 'The owner has been notified. You can track your loan status and return due date in your Deals Hub.'}
                </p>
                <div className="pt-1 flex gap-2">
                  <Link href="/transactions">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">
                      {lang === 'ar' ? 'الانتقال إلى معاملاتي والكتب المستعارة ⏳' : 'Go to My Deals & Loans ⏳'}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Action Error Banner */}
            {actionError && (
              <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-500/30 text-red-700 dark:text-red-400 text-sm animate-in fade-in">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">{actionError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionError(null)}
                  className="text-red-500 hover:text-red-700 shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Same City Highlight Edge Case (Only for potential buyers/borrowers, not the seller themselves) */}
            {isSameCity && !isSeller && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {lang === 'ar'
                    ? `📍 رائع! البائع في نفس مدينتك (${listing.city?.name_ar || ''}) — فرصة ممتازة للمقابلة والاستلام يداً بيد بدون شحن!`
                    : `📍 Great! Seller is in your city (${listing.city?.name_en || ''}) — perfect for easy local handover with zero shipping fees!`}
                </span>
              </div>
            )}

            {/* Edge Case 1: Owner Control Dashboard */}
            {isSeller && (
              <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xs">
                      👑
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-foreground">
                        {lang === 'ar' ? 'أنت صاحب هذا الإعلان' : 'You Own This Listing'}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {lang === 'ar' ? 'إدارتك الكاملة للكتاب ومتابعة الطلبات' : 'Full control of your listing & requests'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={currentStatus === 'ACTIVE' ? 'new' : currentStatus === 'RESERVED' ? 'warning' : 'muted'}
                    className="text-xs px-2.5 py-1 font-black"
                  >
                    {currentStatus === 'ACTIVE' ? (lang === 'ar' ? '✅ متاح للجميع' : '✅ Active') :
                     currentStatus === 'RESERVED' ? (lang === 'ar' ? '⏳ محجوز مؤقتاً' : '⏳ Reserved') :
                     (lang === 'ar' ? '🎉 تم البيع' : '🎉 Sold')}
                  </Badge>
                </div>

                {/* Primary Owner Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Link href={`/books/${listing.id}/edit`} className="w-full">
                    <Button className="w-full gap-2 font-black text-xs rounded-xl py-5 shadow-xs cursor-pointer">
                      <Edit3 className="h-4 w-4" />
                      {lang === 'ar' ? 'تعديل بيانات وسعر الكتاب' : 'Edit Listing & Price'}
                    </Button>
                  </Link>
                  <Link href="/transactions" className="w-full">
                    <Button variant="outline" className="w-full gap-2 font-bold text-xs rounded-xl py-5 border-primary/30 hover:bg-primary/10 cursor-pointer">
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      {lang === 'ar' ? 'متابعة الصفقات والاستعارة' : 'Deals & Loan Requests'}
                    </Button>
                  </Link>
                </div>

                {/* Remove from My List Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full gap-2 font-bold text-xs rounded-xl py-4 border-red-500/30 text-red-600 hover:text-red-700 hover:bg-red-500/10 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  {lang === 'ar' ? 'حذف الكتاب من قائمتي' : 'Remove Book from My List'}
                </Button>

                {/* Developer / Testing quick simulate block */}
                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/5 border-2 border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-black text-foreground">
                        {lang === 'ar' ? '🧪 تجربة دورة الطلبات الواردة (اختبار المالك):' : '🧪 Test Incoming Request Cycle:'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-600 font-bold">
                      {lang === 'ar' ? 'جاهز للاختبار' : 'Ready'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {lang === 'ar'
                      ? 'يمكنك كمالك إرسال طلب استعارة تجريبي وارد فوراً لهذا الكتاب للتحقق من وصول الإشعار وظهوره في صفحة "طلباتي ومعاملاتي" واختبار القبول والمقابلة.'
                      : 'Simulate an incoming borrow request for this book to test notifications, incoming requests, and meetup verification.'}
                  </p>

                  {testRequestSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>{lang === 'ar' ? 'تم إنشاء الطلب الوارد وإرسال الإشعار بنجاح! 🎉' : 'Incoming request created! 🎉'}</span>
                      </div>
                      <Link href={`/transactions?tab=incoming&id=${testRequestSuccess}`} className="block">
                        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg py-3 cursor-pointer">
                          {lang === 'ar' ? 'الذهاب فوراً للطلب الوارد وقبوله في مركز الصفقات ↗' : 'View Incoming Request in Deals Hub ↗'}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateTestIncomingRequest('BORROW')}
                        loading={actionLoading === 'test-BORROW'}
                        className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-4 shadow-xs cursor-pointer gap-1.5 flex-1"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? '⚡ إرسال طلب استعارة تجريبي وارد' : '⚡ Simulate Borrow Request'}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateTestIncomingRequest('BUY')}
                        loading={actionLoading === 'test-BUY'}
                        className="text-xs font-black border-primary/40 text-primary hover:bg-primary/10 rounded-xl py-4 cursor-pointer gap-1.5 flex-1"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? '⚡ إرسال طلب شراء تجريبي وارد' : '⚡ Simulate Buy Request'}</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Status Toggle */}
                <div className="pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-muted-foreground text-[11px]">
                    {lang === 'ar' ? 'تحديث سريع للحالة:' : 'Quick status change:'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentStatus !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus('ACTIVE')}
                        loading={actionLoading === 'status_change'}
                        className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-2.5 py-1 h-7 rounded-lg"
                      >
                        {lang === 'ar' ? 'تحديد كمتاح ✅' : 'Mark Active'}
                      </Button>
                    )}
                    {currentStatus !== 'RESERVED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus('RESERVED')}
                        loading={actionLoading === 'status_change'}
                        className="text-[11px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 px-2.5 py-1 h-7 rounded-lg"
                      >
                        {lang === 'ar' ? 'تحديد كمحجوز ⏳' : 'Mark Reserved'}
                      </Button>
                    )}
                    {currentStatus !== 'SOLD' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus('SOLD')}
                        loading={actionLoading === 'status_change'}
                        className="text-[11px] font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 px-2.5 py-1 h-7 rounded-lg"
                      >
                        {lang === 'ar' ? 'تحديد كمباع 🎉' : 'Mark Sold'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin / Moderator Listing Control */}
            {!isSeller && isAdminOrMod && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-foreground">
                    {lang === 'ar' ? 'صلاحيات المشرف / الإدارة' : 'Moderator / Admin Controls'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="border-red-500/30 text-red-600 hover:bg-red-500/10 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  {lang === 'ar' ? 'حذف الإعلان' : 'Delete Listing'}
                </Button>
              </div>
            )}

            {/* Edge Case 2: SOLD state for visitors */}
            {!isSeller && currentStatus === 'SOLD' && (
              <div className="rounded-3xl border-2 border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-black text-base">
                  <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{lang === 'ar' ? 'تم بيع هذا الكتاب بنجاح 🎉' : 'This book has been sold 🎉'}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === 'ar'
                    ? 'هذا الإعلان مكتمل ولم يعد متاحاً للشراء أو الاستعارة. يمكنك البحث عن نسخ أخرى متاحة لنفس الكتاب أو حفظه في قائمتك المفضلة لتصلك تنبيهات عند إضافة نسخ جديدة.'
                    : 'This listing is completed and no longer available. You can browse other copies or save it to your wishlist.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/explore?q=${encodeURIComponent(book.title)}`} className="flex-1">
                    <Button className="w-full gap-2 font-black text-xs rounded-xl py-5 shadow-xs cursor-pointer">
                      <Search className="h-4 w-4" />
                      {lang === 'ar' ? 'البحث عن نسخ أخرى لنفس الكتاب' : 'Search other copies'}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Edge Case 3: RESERVED state for visitors */}
            {!isSeller && currentStatus === 'RESERVED' && (
              <div className="rounded-3xl border-2 border-orange-500/30 bg-orange-500/10 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-orange-800 dark:text-orange-300 font-bold text-sm">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                  <span>{lang === 'ar' ? 'هذا الكتاب محجوز حالياً في صفقة قيد التنفيذ ⏳' : 'This book is currently reserved in an ongoing deal ⏳'}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === 'ar'
                    ? 'الكتاب محجوز مؤقتاً لقارئ آخر قيد الاستلام. إذا لم تكتمل الصفقة، سيعود متاحاً تلقائياً. يمكنك التواصل مع البائع للاستفسار.'
                    : 'This book is temporarily held for another reader. If the deal is cancelled, it will become available again.'}
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleContact}
                  loading={actionLoading === 'contact'}
                  className="w-full gap-2 font-black text-xs rounded-xl py-5 border-orange-500/30 hover:bg-orange-500/10 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-orange-600" />
                  {lang === 'ar' ? 'مراسلة البائع للاستفسار أو الانتظار' : 'Message seller to inquire'}
                </Button>
              </div>
            )}

            {/* Active Action Buttons for Buyers / Borrowers */}
            {!isSeller && currentStatus === 'ACTIVE' && (
              <div className="space-y-3">
                {/* Notice for Existing Pending Request */}
                {currentExistingRequest && (
                  <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 space-y-3 shadow-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black text-sm">
                          ⏳
                        </span>
                        <h4 className="text-sm font-black text-foreground">
                          {lang === 'ar' ? 'لديك طلب معلق بالفعل لهذا الكتاب' : 'You Already Have an Active Request'}
                        </h4>
                      </div>
                      <Badge variant="warning" className="text-xs font-black px-2.5 py-1">
                        {currentExistingRequest.status === 'ACCEPTED'
                          ? (lang === 'ar' ? 'تم القبول ✅' : 'Accepted ✅')
                          : (lang === 'ar' ? 'قيد المراجعة ⏳' : 'Under Review ⏳')}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                      <p>
                        {lang === 'ar' ? '• نوع الطلب: ' : '• Request Type: '}
                        <strong className="text-foreground">
                          {currentExistingRequest.type === 'BORROW'
                            ? (lang === 'ar' ? `استعارة مؤقتة (${currentExistingRequest.loanDays ?? 14} يوماً)` : `Borrow Loan (${currentExistingRequest.loanDays ?? 14} days)`)
                            : currentExistingRequest.type === 'SWAP'
                            ? (lang === 'ar' ? 'مبادلة كتاب' : 'Book Swap')
                            : (lang === 'ar' ? 'شراء مباشر' : 'Direct Purchase')}
                        </strong>
                        {currentExistingRequest.deposit ? ` • تأمين: ${currentExistingRequest.deposit} ج.م` : ''}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                        {lang === 'ar'
                          ? '💡 لا يمكن إرسال أكثر من طلب لنفس الكتاب حتى يبت صاحب الكتاب في طلبك الحالي لتجنب التكرار.'
                          : '💡 You cannot send multiple requests for the same book while one is pending.'}
                      </p>
                    </div>
                    <Link href={`/transactions?tab=outgoing&id=${currentExistingRequest.id}`} className="block">
                      <Button className="w-full gap-2 font-black text-xs rounded-xl py-5 shadow-xs cursor-pointer bg-amber-600 hover:bg-amber-700 text-white">
                        <ArrowRightLeft className="h-4 w-4" />
                        {lang === 'ar' ? 'عرض ومتابعة تفاصيل طلبك في صفقاتي ↗' : 'View Your Request in Deals Hub ↗'}
                      </Button>
                    </Link>
                  </div>
                )}

                {/* 1. Buy Flow */}
                {(listing.listing_type === 'SELL' || listing.listing_type === 'SELL_OR_SWAP') && (
                  <div className="space-y-2">
                    <Button
                      id="buy-btn"
                      size="lg"
                      className="w-full text-sm font-black py-6 rounded-2xl shadow-lg shadow-primary/25 cursor-pointer gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-primary-foreground hover:scale-[1.01] active:scale-[0.99] transition-all"
                      onClick={() => {
                        if (!user) { setShowAuthModal(true); return }
                        setModalValidationError(null)
                        setShowBuyModal(true)
                      }}
                      loading={actionLoading === 'buy'}
                      disabled={Boolean(actionSuccess || currentExistingRequest)}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>
                        {currentExistingRequest
                          ? (lang === 'ar' ? 'طلبك قيد المراجعة ⏳' : 'Request Pending ⏳')
                          : (lang === 'ar' ? '🛒 طلب شراء فوري' : '🛒 Buy Now')}
                      </span>
                      <span className="ms-auto font-black text-xs bg-white/20 px-2.5 py-1 rounded-xl">
                        {formatPrice(listing.price)}
                      </span>
                    </Button>

                    {/* Make an Offer Button if negotiable */}
                    {listing.is_negotiable && (
                      <Button
                        id="offer-btn"
                        size="lg"
                        variant="outline"
                        className="w-full border-dashed border-2 border-primary/40 hover:bg-primary/5 text-primary font-bold gap-2 rounded-2xl py-5 cursor-pointer text-xs"
                        onClick={() => {
                          if (!user) { setShowAuthModal(true); return }
                          setShowOfferModal(true)
                        }}
                        disabled={Boolean(actionSuccess || currentExistingRequest)}
                      >
                        <Tag className="h-4 w-4" />
                        {lang === 'ar' ? '💬 تقديم عرض سعر بديل (قابل للتفاوض)' : '💬 Make a Price Offer (Negotiate)'}
                      </Button>
                    )}
                  </div>
                )}

                {/* 2. Swap Flow */}
                {(listing.listing_type === 'SWAP' || listing.listing_type === 'SELL_OR_SWAP') && (
                  <Button
                    id="swap-btn"
                    size="lg"
                    variant="swap"
                    className="w-full font-black py-6 rounded-2xl shadow-md shadow-purple-500/20 cursor-pointer gap-2 text-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                    onClick={() => {
                      if (!user) { setShowAuthModal(true); return }
                      setModalValidationError(null)
                      setShowSwapModal(true)
                    }}
                    disabled={Boolean(actionSuccess || currentExistingRequest)}
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                    <span>
                      {currentExistingRequest
                        ? (lang === 'ar' ? 'طلبك قيد المراجعة ⏳' : 'Request Pending ⏳')
                        : (lang === 'ar' ? '🔄 طلب مبادلة بكتاب آخر من مكتبتك' : '🔄 Request Book Swap')}
                    </span>
                  </Button>
                )}

                {/* 3. Borrow Flow with Refundable Deposit */}
                {listing.listing_type !== 'GIVEAWAY' && (
                  <div className="rounded-2xl border-2 border-emerald-500/35 bg-emerald-500/5 p-3.5 space-y-2.5">
                    <Button
                      id="borrow-btn"
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-2xl shadow-md shadow-emerald-600/25 cursor-pointer gap-2 text-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                      onClick={() => {
                        if (!user) { setShowAuthModal(true); return }
                        setModalValidationError(null)
                        setShowBorrowModal(true)
                      }}
                      disabled={Boolean(actionSuccess || currentExistingRequest)}
                    >
                      <Clock className="h-5 w-5" />
                      <span>
                        {currentExistingRequest
                          ? (lang === 'ar' ? 'طلبك قيد المراجعة ⏳' : 'Request Pending ⏳')
                          : (lang === 'ar' ? '⏱️ طلب استعارة مؤقتة (تأمين مسترد)' : '⏱️ Borrow Book (Refundable Deposit)')}
                      </span>
                    </Button>
                    <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 px-1 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        {lang === 'ar' ? 'استعارة من 7 إلى 30 يوماً' : '7 to 30 days loan'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        {lang === 'ar' ? 'تأمين مسترد 100% فور الإرجاع' : '100% Refundable Deposit'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Giveaway Flow */}
                {listing.listing_type === 'GIVEAWAY' && (
                  <Button
                    id="giveaway-btn"
                    size="lg"
                    variant="giveaway"
                    className="w-full text-base font-black py-6 rounded-2xl shadow-xl shadow-green-500/25 cursor-pointer gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    onClick={() => {
                      if (!user) { setShowAuthModal(true); return }
                      handleBuyRequest()
                    }}
                    loading={actionLoading === 'buy'}
                    disabled={!!actionSuccess}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {lang === 'ar' ? '🎁 طلب الكتاب المجاني (هدية)' : '🎁 Request Free Book'}
                  </Button>
                )}

                {/* 5. Contact Seller Directly */}
                <Button
                  id="contact-seller-btn"
                  size="lg"
                  variant="outline"
                  className="w-full border-border hover:bg-muted font-bold py-5 rounded-2xl cursor-pointer gap-2 text-xs"
                  onClick={handleContact}
                  loading={actionLoading === 'contact'}
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {lang === 'ar' ? '💬 تواصل مع البائع مباشرة (محادثة فورية)' : '💬 Message Seller Directly (Instant Chat)'}
                </Button>
              </div>
            )}

            {/* Secondary actions: Wishlist, Share, Report */}
            <div className="flex gap-2 pt-1">
              <Button
                id="wishlist-btn"
                variant="outline"
                size="icon"
                onClick={handleWishlist}
                className={cn('rounded-xl h-11 w-11 transition-all cursor-pointer', wishlisted && 'text-red-500 border-red-200 bg-red-50/50 dark:bg-red-950/20')}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={cn('h-5 w-5', wishlisted && 'fill-current scale-110')} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                aria-label="Share"
                className="rounded-xl h-11 w-11 hover:text-primary transition-all cursor-pointer"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              {!isSeller && (
                <Button variant="outline" size="icon" aria-label="Report" className="rounded-xl h-11 w-11 text-muted-foreground hover:text-red-500 cursor-pointer">
                  <Flag className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Seller Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 space-y-3 shadow-xs">
              <h3 className="font-bold text-sm text-foreground">{lang === 'ar' ? 'معلومات البائع' : 'Seller Info'}</h3>
              <div className="flex items-center gap-3">
                <Link href={`/profile/${seller.username ?? seller.id}`}>
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    {seller.avatar_url ? (
                      <Image src={seller.avatar_url} alt={seller.full_name ?? ''} width={48} height={48} className="object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-primary">{seller.full_name?.charAt(0) ?? 'U'}</span>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${seller.username ?? seller.id}`} className="font-bold text-foreground hover:text-primary transition-colors block truncate">
                    {lang === 'ar' && seller.full_name_ar ? seller.full_name_ar : seller.full_name}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {seller.rating_average && seller.rating_average > 0 && (
                      <span className="flex items-center gap-0.5 font-bold text-amber-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {seller.rating_average.toFixed(1)}
                        {seller.rating_count > 0 && ` (${seller.rating_count})`}
                      </span>
                    )}
                    {seller.total_transactions > 0 && (
                      <span className="font-medium text-slate-600 dark:text-slate-400">{seller.total_transactions} {lang === 'ar' ? 'صفقة' : 'deals'}</span>
                    )}
                    {seller.is_verified && (
                      <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-bold">
                        <Shield className="h-3 w-3" />
                        {lang === 'ar' ? 'موثق' : 'Verified'}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/profile/${seller.username ?? seller.id}`}>
                  <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl border-slate-300 dark:border-slate-700 cursor-pointer">
                    {lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Modal */}
        {showSwapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl text-foreground">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-black text-foreground">
                    {lang === 'ar' ? 'طلب مبادلة كتاب' : 'Request Book Swap'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {lang === 'ar'
                  ? `اختر الكتاب من مكتبتك الذي ترغب في مبادلته بكتاب "${book.title}":`
                  : `Select a book from your listings to offer for "${book.title}":`
                }
              </p>

              {userListings.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {userListings.map((l: { id: string; book: { title: string } }) => {
                    const isSelected = selectedUserListing === l.id
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setSelectedUserListing(l.id)}
                        className={cn(
                          'w-full text-start p-3.5 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-between',
                          isSelected
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-purple-500/50'
                        )}
                      >
                        <span className="truncate">{l.book.title}</span>
                        {isSelected && <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="text-4xl">📚</div>
                  <h4 className="font-bold text-xs text-foreground">
                    {lang === 'ar' ? 'ليس لديك كتب معروضة للمبادلة حالياً' : "You don't have any books listed yet"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {lang === 'ar'
                      ? 'أضف أحد كتبك في دقيقة واحدة لتبدأ في طلب مبادلة هذا الكتاب مجاناً وبدون أي تكلفة.'
                      : 'Add a book from your shelf in 1 minute to start swapping for free with fellow readers.'}
                  </p>
                  <Link href={`/books/add?redirectTo=/books/${listing.id}`}>
                    <Button className="mt-1 font-black text-xs rounded-xl shadow-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
                      <PlusCircle className="h-4 w-4" />
                      {lang === 'ar' ? 'أضف كتاباً لمكتبتك الآن' : 'Add a Book to Swap'}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Meetup Proposal — same for Swap */}
              <div className="pt-1">
                <p className="text-xs font-black text-foreground mb-2">
                  {lang === 'ar' ? '📍 مكان وموعد المقابلة:' : '📍 Meetup Location & Times:'}
                </p>
                <MeetupPicker value={swapMeetup} onChange={setSwapMeetup} lang={lang} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {lang === 'ar' ? 'رسالة للمالك (اختياري):' : 'Message to owner (optional):'}
                </label>
                <textarea
                  value={swapMessage}
                  onChange={e => setSwapMessage(e.target.value)}
                  placeholder={lang === 'ar' ? 'أي ملاحظات إضافية؟' : 'Any additional notes?'}
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none"
                  rows={2}
                />
              </div>

              {/* Validation Error Alert */}
              {modalValidationError && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{modalValidationError}</span>
                  <button
                    type="button"
                    onClick={() => setModalValidationError(null)}
                    className="text-red-500 hover:text-red-700 shrink-0 font-black cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl font-bold cursor-pointer border-slate-300 dark:border-slate-700 py-5" onClick={() => setShowSwapModal(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 cursor-pointer py-5"
                  onClick={handleSwapRequest}
                  loading={actionLoading === 'swap'}
                  disabled={!selectedUserListing}
                >
                  {lang === 'ar' ? 'إرسال طلب المبادلة' : 'Send Swap Request'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Borrow Modal */}
        {showBorrowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-foreground">
              {/* Sticky Header */}
              <div className="p-4 sm:p-5 border-b border-border bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Clock className="h-5 w-5" />
                    </span>
                    {lang === 'ar' ? 'طلب استعارة كتاب (تأمين مسترد)' : 'Request Book Loan (Refundable Deposit)'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBorrowModal(false)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'ar'
                    ? `استعر "${book.title}" لقراءته وإرجاعه للمالك مع حماية كاملة للتأمين.`
                    : `Borrow "${book.title}" to read and return with full deposit security.`}
                </p>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Loan Duration Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground block">
                    {lang === 'ar' ? '1. اختر مدة الاستعارة المناسبة لك:' : '1. Select loan duration:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { days: 7, labelAr: '7 أيام', descAr: 'أسبوع واحد', labelEn: '7 Days', descEn: '1 Week' },
                      { days: 14, labelAr: '14 يوماً', descAr: 'أسبوعان (شائع)', labelEn: '14 Days', descEn: '2 Weeks (Popular)' },
                      { days: 21, labelAr: '21 يوماً', descAr: '3 أسابيع', labelEn: '21 Days', descEn: '3 Weeks' },
                      { days: 30, labelAr: '30 يوماً', descAr: 'شهر كامل', labelEn: '30 Days', descEn: '1 Month' },
                    ].map(opt => {
                      const isSelected = loanDays === opt.days
                      return (
                        <button
                          type="button"
                          key={opt.days}
                          onClick={() => {
                            setLoanDays(opt.days)
                          }}
                          className={cn(
                            'p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1',
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/25 scale-[1.02]'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-emerald-500/50 text-foreground font-bold'
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black">{lang === 'ar' ? opt.labelAr : opt.labelEn}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3] text-white" />}
                          </div>
                          <span className={cn('text-[10px]', isSelected ? 'text-white/90 font-bold' : 'text-muted-foreground')}>
                            {lang === 'ar' ? opt.descAr : opt.descEn}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dynamic Due Date Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'ar' ? 'موعد الإرجاع المقترح:' : 'Expected Return Date:'}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black underline decoration-emerald-500/50">
                    {new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* High-Value Book Protection Banner */}
                {isExpensiveBook && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1 animate-fade-in">
                    <div className="flex items-center gap-1.5 font-black">
                      <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{lang === 'ar' ? '💎 ضمان حماية المراجع والكتب القيّمة:' : '💎 High-Value Asset Protection:'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {lang === 'ar'
                        ? `هذا الكتاب يُعد مرجعاً عالي القيمة (${bookPrice} ج.م). مبلغ التأمين (${currentDeposit} ج.م) يضمن حماية ملكية صاحب الكتاب ويُرد إليك بالكامل بنسبة 100% فور استرجاع الكتاب سليم دون تلف.`
                        : `This book is a high-value reference (${bookPrice} EGP). The full deposit (${currentDeposit} EGP) protects the owner and is 100% refunded when returned intact.`}
                    </p>
                  </div>
                )}

                {/* Pricing & Refundable Deposit Breakdown (Fixed & Protected by System) */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        {lang === 'ar' ? 'رسوم الاستعارة للمالك:' : 'Lending Fee for Owner:'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {lang === 'ar' ? `(محددة لمدة ${loanDays} يوماً — لا يمكن تعديلها)` : `(calculated for ${loanDays} days — fixed)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600">
                      <span className="text-xs font-black text-foreground">{currentBorrowFee}</span>
                      <span className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'مبلغ التأمين المسترد بالكامل:' : 'Refundable Security Deposit:'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {lang === 'ar' ? '(محدد بمعايير الأمان ويُسترد 100% عند الإرجاع)' : '(set by safety policy & 100% refunded)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">{currentDeposit}</span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 flex items-center justify-between text-xs font-black">
                    <span className="text-foreground">{lang === 'ar' ? 'الإجمالي المدفوع عند المقابلة والتسليم:' : 'Total paid at handover:'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                      {currentBorrowFee + currentDeposit} {lang === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>

                {/* Library Guarantees & Condition Policy */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'قواعد وضمانات الاستعارة (نظام المكتبات):' : 'Borrowing & Library Rules:'}</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc list-inside">
                    <li>
                      <strong className="text-foreground">{lang === 'ar' ? 'فترة سماح 48 ساعة:' : '48-hour Grace Period:'}</strong>{' '}
                      {lang === 'ar' ? 'لا تُحسب أي غرامات في أول يومين بعد موعد الإرجاع.' : 'No late fees for first 2 days after due date.'}
                    </li>
                    <li>
                      <strong className="text-foreground">{lang === 'ar' ? 'غرامة التأخير اليومية:' : 'Daily Late Fee:'}</strong>{' '}
                      {lang === 'ar' ? '3 ج.م / يوم بعد فترة السماح (بحد أقصى 50% من التأمين).' : '3 EGP / day after grace period (capped at 50% of deposit).'}
                    </li>
                    <li>
                      <strong className="text-foreground">{lang === 'ar' ? 'سلامة الكتاب:' : 'Condition Check:'}</strong>{' '}
                      {lang === 'ar' ? 'الحفاظ على نظافة الكتاب دون قطع أو كتابة بالحبر لضمان استرداد كامل التأمين.' : 'Keep pages intact and clean to receive your full deposit back.'}
                    </li>
                  </ul>
                </div>

                {/* Meetup Proposal — same for Borrow */}
                <div>
                  <p className="text-xs font-black text-foreground mb-2">
                    {lang === 'ar' ? '📍 مكان وموعد استلام وتسليم الكتاب:' : '📍 Pickup / Handover Location & Times:'}
                  </p>
                  <MeetupPicker value={borrowMeetup} onChange={setBorrowMeetup} lang={lang} />
                </div>

                {/* Notes */}
                <textarea
                  value={borrowNote}
                  onChange={e => setBorrowNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'ملاحظة إضافية للمالك...' : 'Additional note for owner...'}
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none"
                  rows={2}
                />
              </div>

              {/* Sticky Footer - Always Visible */}
              <div className="p-4 sm:p-5 border-t border-border bg-slate-50 dark:bg-slate-900 shrink-0 space-y-3">
                {/* Validation Error Alert */}
                {modalValidationError && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <span className="flex-1 leading-relaxed">{modalValidationError}</span>
                    <button
                      type="button"
                      onClick={() => setModalValidationError(null)}
                      className="text-red-500 hover:text-red-700 shrink-0 font-black cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="agree-borrow-policy"
                    checked={agreedToBorrowPolicy}
                    onChange={e => setAgreedToBorrowPolicy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {lang === 'ar'
                      ? 'أوافق على سياسة الاستعارة، والحفاظ على الكتاب وإرجاعه بحالته في الموعد المحدد.'
                      : 'I agree to the lending policy, keeping the book safe and returning on schedule.'}
                  </span>
                </label>

                {/* Actions */}
                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    className="flex-1 font-bold rounded-xl cursor-pointer py-5"
                    onClick={() => setShowBorrowModal(false)}
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    className="flex-1 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/25 cursor-pointer py-5"
                    onClick={handleBorrowRequest}
                    loading={actionLoading === 'borrow'}
                  >
                    {lang === 'ar' ? 'تأكيد وإرسال الطلب' : 'Confirm & Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buy Request Modal (Direct purchase with Alexandria & Cairo Meetup spots) */}
        {showBuyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-foreground">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-border bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                      <ShoppingBag className="h-5 w-5" />
                    </span>
                    {lang === 'ar' ? 'تأكيد طلب شراء الكتاب' : 'Confirm Book Purchase'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBuyModal(false)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'ar'
                    ? `أنت على وشك طلب شراء "${book.title}" بسعر ${formatPrice(listing.price)}.`
                    : `You are requesting to buy "${book.title}" for ${formatPrice(listing.price)}.`}
                </p>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Book & Seller Summary Box */}
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📖</span>
                    <div>
                      <p className="font-black text-foreground">{book.title}</p>
                      <p className="text-[11px] text-muted-foreground">{book.author} — البائع: {seller.full_name || 'قارئ'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-primary px-3 py-1 rounded-xl bg-primary/10">
                    {formatPrice(listing.price)}
                  </span>
                </div>

                {/* Meetup Proposal Picker with Alexandria & Cairo Locations */}
                <div>
                  <MeetupPicker value={buyMeetup} onChange={setBuyMeetup} lang={lang} />
                </div>

                {/* Trust & Safety Tip */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {lang === 'ar'
                      ? 'الدفع نقداً عند الاستلام بعد معاينة الكتاب والتأكد من حالته. المقابلة في أماكن عامة تضمن سلامة الطرفين.'
                      : 'Pay cash in-hand after inspecting the book. Public meetups ensure safety for both sides.'}
                  </span>
                </div>

                {/* Validation Error Alert */}
                {modalValidationError && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <span className="flex-1 leading-relaxed">{modalValidationError}</span>
                    <button
                      type="button"
                      onClick={() => setModalValidationError(null)}
                      className="text-red-500 hover:text-red-700 shrink-0 font-black cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-border bg-white dark:bg-slate-900 shrink-0 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl font-bold cursor-pointer border-slate-300 dark:border-slate-700 py-5"
                  onClick={() => setShowBuyModal(false)}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 rounded-xl font-black gap-2 shadow-lg shadow-primary/25 cursor-pointer py-5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 text-white"
                  onClick={handleBuyRequest}
                  loading={actionLoading === 'buy'}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {lang === 'ar' ? 'تأكيد وإرسال طلب الشراء' : 'Confirm Purchase Request'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Make an Offer (Negotiate) Modal */}
        {showOfferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl text-foreground">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                    <Tag className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-black text-foreground">
                    {lang === 'ar' ? 'تقديم عرض سعر (تفاوض)' : 'Make a Price Offer'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold">
                  {lang === 'ar' ? 'السعر الأصلي المعروض:' : 'Original Asking Price:'}
                </span>
                <span className="text-sm font-black text-foreground">
                  {formatPrice(listing.price)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground block">
                  {lang === 'ar' ? 'عرض السعر المقترح منك:' : 'Your Proposed Offer:'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={listing.price ? listing.price - 1 : 1000}
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: 70' : 'e.g. 70'}
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-black text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {lang === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
                {/* Quick discount chips */}
                {listing.price && listing.price > 20 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-bold">
                      {lang === 'ar' ? 'اقتراحات سريعة:' : 'Quick shortcuts:'}
                    </span>
                    {[0.9, 0.85, 0.8].map(ratio => {
                      const val = Math.round(listing.price! * ratio)
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setOfferAmount(String(val))}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary hover:border-primary text-[10px] font-black transition-colors cursor-pointer text-foreground"
                        >
                          {val} {lang === 'ar' ? 'ج.م' : 'EGP'} (-{Math.round((1 - ratio) * 100)}%)
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Meetup Proposal — same for Buy/Offer */}
              <div>
                <p className="text-xs font-black text-foreground mb-2">
                  {lang === 'ar' ? '📍 مكان وموعد الاستلام المقترح:' : '📍 Proposed Pickup Location & Times:'}
                </p>
                <MeetupPicker value={buyMeetup} onChange={setBuyMeetup} lang={lang} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  {lang === 'ar' ? 'ملاحظة للبائع (اختياري):' : 'Note to seller (optional):'}
                </label>
                <textarea
                  value={offerNote}
                  onChange={e => setOfferNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'أي ملاحظات إضافية؟' : 'Any additional notes?'}
                  rows={2}
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl font-bold cursor-pointer border-slate-300 dark:border-slate-700 py-5" onClick={() => setShowOfferModal(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 rounded-xl font-black gap-2 shadow-md shadow-primary/25 cursor-pointer py-5"
                  onClick={handleSendOffer}
                  loading={actionLoading === 'offer'}
                  disabled={!offerAmount || Number(offerAmount) <= 0}
                >
                  <Tag className="h-4 w-4" />
                  {lang === 'ar' ? 'إرسال العرض للمالك' : 'Send Offer'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Auth Prompt Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-center text-foreground">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
                📚
              </div>
              <h3 className="text-lg font-black text-foreground">
                {lang === 'ar' ? 'سجل الدخول للمتابعة' : 'Sign In to Continue'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? `لإرسال طلبك ومراسلة صاحب كتاب "${book.title}"، سجل دخولك أو أنشئ حساباً مجانياً في ثوانٍ.`
                  : `To send a request and contact the owner of "${book.title}", please sign in or create a free account.`}
              </p>
              <div className="space-y-2 pt-2">
                <Link href={`/login?redirectTo=/books/${listing.id}`} className="block">
                  <Button className="w-full font-black rounded-xl py-5 cursor-pointer shadow-md shadow-primary/20">
                    {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                  </Button>
                </Link>
                <Link href={`/register?redirectTo=/books/${listing.id}`} className="block">
                  <Button variant="outline" className="w-full font-bold rounded-xl py-5 cursor-pointer border-slate-300 dark:border-slate-700">
                    {lang === 'ar' ? 'إنشاء حساب جديد مجاناً' : 'Create Free Account'}
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold pt-1 cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {lang === 'ar' ? 'حذف الكتاب من قائمتك' : 'Remove Book from Your List'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'ar' ? 'هذا الإجراء سيقوم بإزالة هذا الإعلان نهائياً' : 'This action will permanently remove this listing'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-3">
                {primaryImage && (
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={primaryImage}
                      alt={book?.title ?? ''}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black line-clamp-1 text-foreground">
                    {lang === 'ar' && book?.title_ar ? book.title_ar : book?.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {lang === 'ar' && book?.author_ar ? book.author_ar : book?.author}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] font-bold">
                    {listing.listing_type}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  {lang === 'ar'
                    ? 'تنبيه: لن يظهر الكتاب للآخرين في المتجر أو البحث، ولن يتمكن القراء من إرسال طلبات جديدة له.'
                    : 'Warning: This book will disappear from search and explore, and readers will no longer be able to send requests for it.'}
                </span>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteError(null)
                  }}
                  className="flex-1 rounded-xl py-5 font-bold text-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteListing}
                  className="flex-1 rounded-xl py-5 font-black text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {lang === 'ar' ? 'جاري الحذف...' : 'Removing...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      {lang === 'ar' ? 'نعم، احذف الكتاب' : 'Yes, Remove Book'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Copy Link Toast Feedback */}
        {copyToast && (
          <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black animate-in fade-in slide-in-from-bottom-4">
            <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600 stroke-[3]" />
            <span>{lang === 'ar' ? 'تم نسخ رابط الكتاب إلى الحافظة بنجاح! 📋' : 'Book link copied to clipboard! 📋'}</span>
          </div>
        )}

        {/* Similar & Seller Listings */}
        {similarListings.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title mb-4">
              {lang === 'ar' ? 'نفس الكتاب — عروض أخرى' : 'Same Book — Other Listings'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {similarListings.map(l => <BookCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        {sellerListings.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title mb-4">
              {lang === 'ar' ? 'كتب تانية من نفس البائع' : 'More From This Seller'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {sellerListings.map(l => <BookCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  )
}
