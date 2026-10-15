'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MapPin, Star, Shield, BookOpen, ArrowRightLeft, Gift, MessageCircle,
  UserPlus, UserMinus, Settings, Clock, CheckCircle2, XCircle, ShoppingBag,
  ExternalLink, Calendar, ShieldCheck, Sparkles, Trash2, Edit3, AlertTriangle, Loader2,
  QrCode, ChevronRight
} from 'lucide-react'
import { deleteBookListing } from '@/lib/books/listing-actions'
import { BookCard } from '@/components/books/book-card'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatPrice, formatRelativeTime } from '@/lib/utils'
import { acceptTransaction, rejectTransaction, acceptSwapRequest, rejectSwapRequest, createTestIncomingTransaction } from '@/lib/transactions/lifecycle'
import { MeetupDetailBadge } from '@/components/ui/meetup-badge'
import { MeetupQrModal } from '@/components/transactions/meetup-qr-modal'
import type { BookListing, Profile, Rating } from '@/types'

interface ProfileClientProps {
  profile: Profile & { city?: { name_ar: string; name_en: string }; area?: { name_ar: string; name_en: string }; genres?: Array<{ category: { id: string; name_ar: string; name_en: string; icon?: string } }> }
  listings: BookListing[]
  ratings: Rating[]
  followerCount: number
  isFollowing: boolean
  isOwnProfile: boolean
  currentUserId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingTransactions?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outgoingTransactions?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingSwaps?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outgoingSwaps?: any[]
}

export function ProfileClient({
  profile,
  listings,
  ratings,
  followerCount,
  isFollowing: initialFollowing,
  isOwnProfile,
  currentUserId,
  incomingTransactions = [],
  outgoingTransactions = [],
  incomingSwaps = [],
  outgoingSwaps = [],
}: ProfileClientProps) {
  const { lang } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<string>('books')
  const [following, setFollowing] = useState(initialFollowing)
  const [follCount, setFollCount] = useState(followerCount)

  const handleFollow = async () => {
    if (!currentUserId) return
    const wasFollowing = following
    setFollowing(!wasFollowing)
    setFollCount(c => c + (wasFollowing ? -1 : 1))

    if (wasFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: profile.id,
      })
    }
  }

  const [userListings, setUserListings] = useState<BookListing[]>(listings)
  const [listingToDelete, setListingToDelete] = useState<BookListing | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteListing = async () => {
    if (!listingToDelete) return
    setIsDeleting(true)
    try {
      await deleteBookListing(listingToDelete.id)
      setUserListings(prev => prev.filter(l => l.id !== listingToDelete.id))
      showFeedback(
        lang === 'ar'
          ? 'تمت إزالة الكتاب من قائمتك بنجاح 🗑️'
          : 'Book removed from your list successfully 🗑️'
      )
      setListingToDelete(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'فشل حذف الكتاب، يرجى المحاولة لاحقاً' : 'Failed to delete book')
      showFeedback(msg, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const [incomingTxList, setIncomingTxList] = useState(incomingTransactions)
  const [outgoingTxList, setOutgoingTxList] = useState(outgoingTransactions)
  const [incomingSwapsList, setIncomingSwapsList] = useState(incomingSwaps)
  const [outgoingSwapsList, setOutgoingSwapsList] = useState(outgoingSwaps)
  const [dealsSubFilter, setDealsSubFilter] = useState<'all' | 'accepted' | 'incoming' | 'outgoing' | 'loans'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [chatLoadingKey, setChatLoadingKey] = useState<string | null>(null)

  // QR Meetup Verification Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean
    transactionId?: string
    swapId?: string
    bookTitle: string
    meetupLocation?: string
    transactionType: 'BUY' | 'SWAP' | 'BORROW'
    isBorrowReturn?: boolean
    otherPartyId: string
    otherPartyName?: string
    listingId?: string
    swapListingId?: string
  } | null>(null)

  const handleVerifiedSuccess = (newStatus: string) => {
    if (!qrModalData) return
    const id = qrModalData.transactionId || qrModalData.swapId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      status: newStatus,
      ...(newStatus === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {}),
    }

    if (qrModalData.swapId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingSwapsList(prev => prev.map((s: any) => s.id === id ? { ...s, ...updates } : s))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOutgoingSwapsList(prev => prev.map((s: any) => s.id === id ? { ...s, ...updates } : s))
    }
    if (qrModalData.transactionId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingTxList(prev => prev.map((t: any) => t.id === id ? { ...t, ...updates } : t))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOutgoingTxList(prev => prev.map((t: any) => t.id === id ? { ...t, ...updates } : t))
    }

    showFeedback(lang === 'ar' ? 'تم تأكيد المعاملة بنجاح عبر رمز QR! 🎉' : 'Transaction confirmed via QR! 🎉')
  }

  // Open direct conversation with counterparty
  const handleChatWithUser = async (otherUserId?: string | null, listingId?: string, key?: string) => {
    if (!otherUserId || !currentUserId) return
    if (key) setChatLoadingKey(key)

    try {
      const p1 = currentUserId < otherUserId ? currentUserId : otherUserId
      const p2 = currentUserId < otherUserId ? otherUserId : currentUserId

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
          .insert({ participant_1: p1, participant_2: p2, listing_id: listingId || null })
          .select('id')
          .single()
        convId = newConv?.id
      }

      if (convId) router.push(`/messages/${convId}`)
    } catch (err) {
      console.error('Error opening chat:', err)
    } finally {
      if (key) setChatLoadingKey(null)
    }
  }

  // Helper: Extract Book Object whether relations return an array or single item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractBook = (listing: any) => {
    if (!listing?.book) return null
    return Array.isArray(listing.book) ? listing.book[0] : listing.book
  }

  // Helper: Parse Loan Note
  const parseLoanInfo = (note?: string) => {
    if (!note) return null
    try {
      const d = JSON.parse(note)
      if (d?.mode === 'BORROW') return d
    } catch {
      return null
    }
    return null
  }

  // Helper: Parse Meetup Info from either direct columns, buyer_note JSON, or swap message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseMeetupInfo = (item: any) => {
    if (!item) return null

    if (item.meetup_location || item.proposed_meetup_location || item.agreed_meetup_location) {
      return {
        location: item.agreed_meetup_location || item.meetup_location || item.proposed_meetup_location,
        deliveryMethod: item.preferred_delivery || item.delivery_method || 'MEETUP',
        times: Array.isArray(item.proposed_times) ? item.proposed_times : [],
        isConfirmed: Boolean(item.agreed_meetup_location || item.meetup_at),
        at: item.agreed_meetup_at || item.meetup_at || null,
      }
    }

    if (item.buyer_note) {
      try {
        const d = JSON.parse(item.buyer_note)
        if (d?.meetup) {
          return {
            location: d.meetup.location,
            deliveryMethod: d.meetup.preferred_delivery || 'MEETUP',
            times: Array.isArray(d.meetup.proposed_times) ? d.meetup.proposed_times : [],
            isConfirmed: false,
          }
        }
      } catch {}
    }

    if (typeof item.message === 'string' && item.message.includes('[المقابلة المقترحة:')) {
      const match = item.message.match(/\[المقابلة المقترحة:\s*([^\]]+)\]/)
      if (match) {
        return {
          location: match[1],
          deliveryMethod: 'MEETUP',
          times: [],
          isConfirmed: false,
        }
      }
    }

    return null
  }

  // Helper: Due Date Countdown
  const getLoanCountdown = (dueDateStr?: string) => {
    if (!dueDateStr) return null
    const diffDays = Math.ceil((new Date(dueDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) {
      return {
        isOverdue: true,
        textAr: `متأخر ${Math.abs(diffDays)} يوم عن موعد الإرجاع`,
        textEn: `Overdue by ${Math.abs(diffDays)} days`,
        color: 'bg-red-500/10 text-red-600 border-red-500/30',
      }
    } else if (diffDays <= 2) {
      return {
        isOverdue: false,
        textAr: `متبقي ${diffDays} يوم فقط على الإرجاع`,
        textEn: `${diffDays} days left to return`,
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      }
    }
    return {
      isOverdue: false,
      textAr: `متبقي ${diffDays} يوماً على موعد الإرجاع`,
      textEn: `${diffDays} days remaining`,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    }
  }

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text })
    setTimeout(() => setFeedbackMsg(null), 4500)
  }

  const [creatingSampleRequest, setCreatingSampleRequest] = useState(false)

  const handleCreateSampleIncomingRequest = async (mode: 'BORROW' | 'BUY' = 'BORROW') => {
    setCreatingSampleRequest(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdTx: any = null
      try {
        createdTx = await createTestIncomingTransaction({
          sellerId: profile.id,
          mode,
        })
      } catch {
        const res = await fetch('/api/transactions/test-incoming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerId: profile.id, mode }),
        })
        const data = await res.json()
        if (data.transaction) {
          createdTx = data.transaction
        } else {
          throw new Error(data.error || 'فشل إنشاء الطلب التجريبي')
        }
      }

      if (createdTx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setIncomingTxList(prev => [createdTx, ...prev.filter((t: any) => t.id !== createdTx.id)])
        showFeedback(
          lang === 'ar'
            ? 'تم إنشاء طلب استعارة وارد تجريبي بنجاح! يمكنك الآن قبوله أو رفضه مباشرة من هنا. 🎉'
            : 'Test incoming request created! You can now accept or decline it right here. 🎉'
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ أثناء إنشاء الطلب التجريبي'
      showFeedback(msg, 'error')
    } finally {
      setCreatingSampleRequest(false)
    }
  }

  const handleAcceptTx = async (tx: any) => {
    setActionLoading(`tx-accept-${tx.id}`)
    try {
      const loanInfo = (() => {
        try { return tx.buyer_note ? JSON.parse(tx.buyer_note) : null } catch { return null }
      })()
      await acceptTransaction({
        transactionId: tx.id,
        sellerId: profile.id,
        buyerId: tx.buyer?.id || tx.buyer_id,
        listingId: tx.listing?.id || tx.listing_id,
        bookTitle: tx.listing?.book?.title,
        isBorrow: Boolean(loanInfo?.mode === 'BORROW'),
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingTxList(prev => prev.map((t: any) => t.id === tx.id ? { ...t, status: 'ACCEPTED' } : t))
      showFeedback(lang === 'ar' ? 'تمت الموافقة على الطلب بنجاح! تم إشعار القارئ وتأكيد الحجز. 🎉' : 'Request accepted! Reader notified. 🎉')
    } catch (err: any) {
      showFeedback(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء قبول الطلب' : 'Failed to accept request'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectTx = async (tx: any) => {
    setActionLoading(`tx-reject-${tx.id}`)
    try {
      await rejectTransaction({
        transactionId: tx.id,
        sellerId: profile.id,
        buyerId: tx.buyer?.id || tx.buyer_id,
        bookTitle: tx.listing?.book?.title,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingTxList(prev => prev.map((t: any) => t.id === tx.id ? { ...t, status: 'REJECTED' } : t))
      showFeedback(lang === 'ar' ? 'تم رفض الطلب بنجاح.' : 'Request declined.')
    } catch (err: any) {
      showFeedback(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء رفض الطلب' : 'Failed to decline request'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptSwap = async (swap: any) => {
    setActionLoading(`swap-accept-${swap.id}`)
    try {
      await acceptSwapRequest({
        swapId: swap.id,
        responderId: profile.id,
        requesterId: swap.requester?.id || swap.requester_id,
        listingId: swap.listing?.id || swap.listing_id,
        offeredListingId: swap.offered_listing?.id || swap.offered_listing_id,
        bookTitle: swap.listing?.book?.title,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingSwapsList(prev => prev.map((s: any) => s.id === swap.id ? { ...s, status: 'ACCEPTED' } : s))
      showFeedback(lang === 'ar' ? 'تمت الموافقة على المبادلة بنجاح! تم إشعار القارئ وحجز الكتابين. 🔄' : 'Swap accepted! Both books reserved. 🔄')
    } catch (err: any) {
      showFeedback(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء قبول المبادلة' : 'Failed to accept swap'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectSwap = async (swap: any) => {
    setActionLoading(`swap-reject-${swap.id}`)
    try {
      await rejectSwapRequest({
        swapId: swap.id,
        responderId: profile.id,
        requesterId: swap.requester?.id || swap.requester_id,
        listingId: swap.listing?.id || swap.listing_id,
        offeredListingId: swap.offered_listing?.id || swap.offered_listing_id,
        bookTitle: swap.listing?.book?.title,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingSwapsList(prev => prev.map((s: any) => s.id === swap.id ? { ...s, status: 'REJECTED' } : s))
      showFeedback(lang === 'ar' ? 'تم رفض طلب المبادلة.' : 'Swap declined.')
    } catch (err: any) {
      showFeedback(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء رفض المبادلة' : 'Failed to decline swap'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // Count pending incoming requests waiting for this user's action
  const pendingIncomingCount =
    incomingTxList.filter(t => t.status === 'PENDING').length +
    incomingSwapsList.filter(s => s.status === 'PENDING').length

  // Filter active loans
  const activeLoans = [...incomingTxList, ...outgoingTxList].filter(t => {
    try {
      const parsed = t.buyer_note ? JSON.parse(t.buyer_note) : null
      return parsed?.mode === 'BORROW' && (t.status === 'ACCEPTED' || t.status === 'BORROWED' || t.status === 'PENDING')
    } catch {
      return false
    }
  })

  // ─────────────────────────────────────────────────────────────
  // ACCEPTED & ACTIVE DEALS (All Request Types: BORROW / SWAP / BUY)
  // Visible to BOTH users (owner/seller/lender & requester/buyer/borrower)
  // ─────────────────────────────────────────────────────────────

  // 1. Accepted transactions where user is seller (Sale or Loan)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acceptedIncomingTx = incomingTxList
    .filter((t: any) => t.transaction_type !== 'SWAP' && (t.status === 'ACCEPTED' || t.status === 'BORROWED'))
    .map((t: any) => ({
      ...t,
      _kind: 'TRANSACTION' as const,
      _role: 'SELLER_OR_LENDER' as const,
    }))

  // 2. Accepted transactions where user is buyer/borrower
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acceptedOutgoingTx = outgoingTxList
    .filter((t: any) => t.transaction_type !== 'SWAP' && (t.status === 'ACCEPTED' || t.status === 'BORROWED'))
    .map((t: any) => ({
      ...t,
      _kind: 'TRANSACTION' as const,
      _role: 'BUYER_OR_BORROWER' as const,
    }))

  // 3. Accepted swaps where user is owner of the requested listing (incoming)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acceptedIncomingSwaps = incomingSwapsList
    .filter((s: any) => s.status === 'ACCEPTED')
    .map((s: any) => ({
      ...s,
      _kind: 'SWAP' as const,
      _role: 'LISTING_OWNER' as const,
    }))

  // 4. Accepted swaps where user is requester (outgoing)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acceptedOutgoingSwaps = outgoingSwapsList
    .filter((s: any) => s.status === 'ACCEPTED')
    .map((s: any) => ({
      ...s,
      _kind: 'SWAP' as const,
      _role: 'REQUESTER' as const,
    }))

  // Combined all accepted active deals for both users
  const acceptedDeals = [
    ...acceptedIncomingSwaps,
    ...acceptedOutgoingSwaps,
    ...acceptedIncomingTx,
    ...acceptedOutgoingTx,
  ]

  const tabs = isOwnProfile
    ? ['books', 'requests', 'reviews', 'about']
    : ['books', 'reviews', 'about']

  const TabLabels: Record<string, { ar: string; en: string }> = {
    books: { ar: 'الكتب', en: 'Books' },
    requests: { ar: 'طلباتي ومعاملاتي', en: 'Requests & Deals' },
    reviews: { ar: 'التقييمات', en: 'Reviews' },
    about: { ar: 'عني', en: 'About' },
  }

  const BADGE_ICONS: Record<string, string> = {
    BOOK_COLLECTOR: '📚',
    SWAP_MASTER: '🔄',
    TRUSTED_READER: '⭐',
    ACTIVE_READER: '🔥',
    GENEROUS_READER: '🎁',
    COMMUNITY_BUILDER: '🏆',
  }

  return (
    <MainLayout user={currentUserId ? { id: currentUserId } : null}>
      <div className="page-container py-6 max-w-4xl">

        {/* Profile Header */}
        <div className="rounded-2xl border bg-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 ring-4 ring-primary/20">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.full_name ?? ''} width={80} height={80} className="object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {profile.full_name?.charAt(0) ?? '?'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">
                  {lang === 'ar' && profile.full_name_ar ? profile.full_name_ar : profile.full_name}
                </h1>
                {profile.is_verified && (
                  <span title="Verified" aria-label="Verified">
                    <Shield className="h-4 w-4 text-blue-500" />
                  </span>
                )}
              </div>

              {/* Rating */}
              {profile.rating_average > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('h-4 w-4', s <= Math.round(profile.rating_average) ? 'fill-amber-400 text-amber-400' : 'text-muted')} />
                  ))}
                  <span className="text-sm font-medium ms-1">{profile.rating_average.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({profile.rating_count})</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  {profile.total_listings} {lang === 'ar' ? 'كتاب' : 'books'}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  {profile.total_swaps} {lang === 'ar' ? 'مبادلة' : 'swaps'}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Gift className="h-3.5 w-3.5" />
                  {profile.total_donations} {lang === 'ar' ? 'تبرع' : 'gifts'}
                </span>
                <span className="text-muted-foreground">
                  👥 {follCount} {lang === 'ar' ? 'متابعون' : 'followers'}
                </span>
              </div>

              {/* Location */}
              {profile.area && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {lang === 'ar' ? profile.area.name_ar : profile.area.name_en}
                  {profile.city && `, ${lang === 'ar' ? profile.city.name_ar : profile.city.name_en}`}
                </p>
              )}

              {/* Genres */}
              {profile.genres && profile.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.genres.map((g: { category: { id: string; name_ar: string; name_en: string; icon?: string } }) => (
                    <span key={g.category.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {g.category.icon} {lang === 'ar' ? g.category.name_ar : g.category.name_en}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {isOwnProfile ? (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <Link href="/transactions">
                    <Button size="sm" className="w-full font-bold gap-1.5 bg-primary shadow-xs">
                      <ArrowRightLeft className="h-4 w-4" />
                      {lang === 'ar' ? 'معاملاتي وكتبي المستعارة' : 'My Deals & Loans'}
                    </Button>
                  </Link>
                  <Link href="/profile/settings">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 font-semibold">
                      <Settings className="h-4 w-4" />
                      {lang === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={following ? 'outline' : 'default'}
                    onClick={handleFollow}
                    className="w-full"
                    id="follow-btn"
                  >
                    {following
                      ? <><UserMinus className="h-4 w-4" /> {lang === 'ar' ? 'إلغاء متابعة' : 'Unfollow'}</>
                      : <><UserPlus className="h-4 w-4" /> {lang === 'ar' ? 'متابعة' : 'Follow'}</>
                    }
                  </Button>
                  <Link href="/messages">
                    <Button size="sm" variant="outline" className="w-full">
                      <MessageCircle className="h-4 w-4" />
                      {lang === 'ar' ? 'رسالة' : 'Message'}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {profile.badges.map(badge => (
                <span key={badge.badge_type} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                  {BADGE_ICONS[badge.badge_type]} {badge.badge_type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Active Accepted Deals Alert Banner */}
        {isOwnProfile && acceptedDeals.length > 0 && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-primary/5 border-2 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                🤝
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    {lang === 'ar'
                      ? `لديك ${acceptedDeals.length} معاملة مقبولة بانتظار المقابلة والتسليم!`
                      : `You have ${acceptedDeals.length} accepted deal(s) ready for meetup!`}
                  </h3>
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                    {lang === 'ar' ? 'جاهز للمقابلة' : 'Ready for Handover'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'فحص تفاصيل الكتب، مواقع اللقاء، وإظهار أو مسح رمز QR مباشرة من هنا.'
                    : 'Check both book details, agreed locations, and show or scan the meetup QR pass.'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setActiveTab('requests')
                setDealsSubFilter('accepted')
              }}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap gap-1.5"
            >
              <QrCode className="h-4 w-4" />
              <span>{lang === 'ar' ? 'عرض تفاصيل المعاملات المقبولة ورمز QR' : 'View Accepted Deals & QR'}</span>
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5',
                activeTab === tab ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{lang === 'ar' ? TabLabels[tab].ar : TabLabels[tab].en}</span>
              {tab === 'books' && ` (${userListings.length})`}
              {tab === 'requests' && (
                <div className="flex items-center gap-1">
                  {acceptedDeals.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white" title={lang === 'ar' ? 'معاملات مقبولة وجارية' : 'Accepted deals'}>
                      🤝 {acceptedDeals.length}
                    </span>
                  )}
                  {pendingIncomingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white" title={lang === 'ar' ? 'طلبات واردة بانتظار ردك' : 'Pending requests'}>
                      {pendingIncomingCount}
                    </span>
                  )}
                </div>
              )}
              {tab === 'reviews' && ratings.length > 0 && ` (${ratings.length})`}
            </button>
          ))}
        </div>

        {/* Books Tab */}
        {activeTab === 'books' && (
          userListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {userListings.map(listing => (
                <div key={listing.id} className="relative group flex flex-col">
                  <BookCard listing={listing} />
                  {isOwnProfile && (
                    <div className="mt-2 flex items-center gap-1.5 px-0.5">
                      <Link href={`/books/${listing.id}/edit`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-[11px] font-bold rounded-lg border-primary/30 text-primary hover:bg-primary/10 gap-1 px-2 cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setListingToDelete(listing)}
                        className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-red-500/30 text-red-600 hover:text-red-700 hover:bg-red-500/10 gap-1 cursor-pointer"
                        title={lang === 'ar' ? 'حذف من قائمتي' : 'Remove from my list'}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        <span className="hidden sm:inline">{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-medium">{lang === 'ar' ? 'لسه مفيش كتب' : 'No books yet'}</p>
              {isOwnProfile && (
                <Link href="/books/add" className="mt-3">
                  <Button size="sm">{lang === 'ar' ? 'أضف كتاب' : 'Add Book'}</Button>
                </Link>
              )}
            </div>
          )
        )}

        {/* Requests & Deals Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setDealsSubFilter('accepted')}
                className={cn(
                  'p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between',
                  dealsSubFilter === 'accepted' ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500' : 'bg-card hover:border-emerald-500/40'
                )}
              >
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block truncate">
                    {lang === 'ar' ? 'صفقات مقبولة وجارية' : 'Accepted Deals'}
                  </span>
                  <span className="text-2xl font-black text-emerald-600">{acceptedDeals.length}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  🤝
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDealsSubFilter('incoming')}
                className={cn(
                  'p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between',
                  dealsSubFilter === 'incoming' ? 'border-red-500 bg-red-500/10 shadow-xs ring-1 ring-red-500' : 'bg-card hover:border-red-500/40'
                )}
              >
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block truncate">
                    {lang === 'ar' ? 'طلبات واردة جديدة' : 'Incoming Pending'}
                  </span>
                  <span className="text-2xl font-black text-foreground">{pendingIncomingCount}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-black">
                  📥
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDealsSubFilter('outgoing')}
                className={cn(
                  'p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between',
                  dealsSubFilter === 'outgoing' ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary' : 'bg-card hover:border-primary/40'
                )}
              >
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block truncate">
                    {lang === 'ar' ? 'طلبات أرسلتها' : 'Sent Requests'}
                  </span>
                  <span className="text-2xl font-black text-foreground">
                    {outgoingTxList.length + outgoingSwapsList.length}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  📤
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDealsSubFilter('loans')}
                className={cn(
                  'p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between',
                  dealsSubFilter === 'loans' ? 'border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500' : 'bg-card hover:border-amber-500/40'
                )}
              >
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block truncate">
                    {lang === 'ar' ? 'استعارات نشطة' : 'Active Loans'}
                  </span>
                  <span className="text-2xl font-black text-foreground">{activeLoans.length}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                  ⏳
                </div>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setDealsSubFilter('all')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                  dealsSubFilter === 'all'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                )}
              >
                {lang === 'ar' ? 'جميع المعاملات' : 'All Deals'}
              </button>

              <button
                type="button"
                onClick={() => setDealsSubFilter('accepted')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                  dealsSubFilter === 'accepted'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                )}
              >
                <span>🤝 {lang === 'ar' ? 'المعاملات المقبولة الجارية' : 'Active Accepted Deals'}</span>
                {acceptedDeals.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {acceptedDeals.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDealsSubFilter('incoming')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                  dealsSubFilter === 'incoming'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                )}
              >
                <span>📥 {lang === 'ar' ? 'طلبات واردة جديدة' : 'Incoming Pending'}</span>
                {pendingIncomingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white">
                    {pendingIncomingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDealsSubFilter('outgoing')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                  dealsSubFilter === 'outgoing'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                )}
              >
                <span>📤 {lang === 'ar' ? 'طلبات أرسلتها' : 'Sent Requests'}</span>
                <span className="text-[10px] opacity-70">({outgoingTxList.length + outgoingSwapsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDealsSubFilter('loans')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                  dealsSubFilter === 'loans'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                )}
              >
                <span>⏳ {lang === 'ar' ? 'الاستعارات والمهلة' : 'Active Loans'}</span>
                {activeLoans.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700">
                    {activeLoans.length}
                  </span>
                )}
              </button>
            </div>

            {/* Hub Shortcut Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  {lang === 'ar' ? 'مركز إدارة الصفقات والمبادلات الشامل' : 'Full Deals & Swaps Hub'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'يمكنك إدارة تأكيد المقابلات، فحص تواريخ الإرجاع، واسترداد مبالغ التأمين بالكامل من مركز المعاملات.'
                    : 'Manage meetups, loan return dates, and security deposits from the main Deals Hub.'}
                </p>
              </div>
              <Link href="/transactions">
                <Button size="sm" className="font-black gap-1.5 rounded-xl whitespace-nowrap shadow-xs">
                  {lang === 'ar' ? 'فتح مركز المعاملات ↗' : 'Open Deals Hub ↗'}
                </Button>
              </Link>
            </div>

            {/* Feedback Toast */}
            {feedbackMsg && (
              <div className={cn(
                'p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in',
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
              )}>
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                )}
                <span className="text-xs font-bold">{feedbackMsg.text}</span>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 1. ACCEPTED & ACTIVE DEALS SECTION (SWAP, BORROW, BUY)        */}
            {/* ───────────────────────────────────────────────────────────── */}
            {(dealsSubFilter === 'all' || dealsSubFilter === 'accepted') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-black text-foreground">
                      🤝 {lang === 'ar' ? 'المعاملات المقبولة الجارية (بانتظار المقابلة والتسليم):' : 'Active Accepted Deals (Ready for Meetup & Handover):'}
                    </h3>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">
                    {acceptedDeals.length} {lang === 'ar' ? 'معاملة مقبولة' : 'accepted'}
                  </Badge>
                </div>

                {acceptedDeals.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <span className="text-4xl block">🤝</span>
                    <p className="font-bold text-sm text-foreground">
                      {lang === 'ar' ? 'لا توجد معاملات مقبولة جارية حالياً' : 'No active accepted deals right now'}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {lang === 'ar'
                        ? 'بمجرد قبول طلب شراء، مبادلة، أو استعارة، ستظهر تفاصيل الكتابين ومكان المقابلة ورمز QR هنا لكلا الطرفين.'
                        : 'Once a swap, buy, or borrow request is accepted, full book details, meetup locations, and QR verification pass will appear here for both users.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {acceptedDeals.map((deal: any) => {
                      const isSwap = deal._kind === 'SWAP'
                      const loan = !isSwap ? parseLoanInfo(deal.buyer_note) : null
                      const isBorrow = Boolean(loan)
                      const isBuy = !isSwap && !isBorrow
                      const isLenderOrSeller = deal._role === 'SELLER_OR_LENDER' || deal._role === 'LISTING_OWNER'

                      // Books Info
                      let myBook: any = null
                      let otherBook: any = null
                      let myCover: string | null = null
                      let otherCover: string | null = null
                      let counterparty: any = null
                      let counterpartyRoleText = ''

                      if (isSwap) {
                        if (deal._role === 'LISTING_OWNER') {
                          myBook = extractBook(deal.listing)
                          otherBook = extractBook(deal.offered_listing)
                          myCover = deal.listing?.images?.[0]?.url || myBook?.cover_image_url
                          otherCover = deal.offered_listing?.images?.[0]?.url || otherBook?.cover_image_url
                          counterparty = deal.requester
                          counterpartyRoleText = lang === 'ar' ? 'طالب المبادلة' : 'Requester'
                        } else {
                          myBook = extractBook(deal.offered_listing)
                          otherBook = extractBook(deal.listing)
                          myCover = deal.offered_listing?.images?.[0]?.url || myBook?.cover_image_url
                          otherCover = deal.listing?.images?.[0]?.url || otherBook?.cover_image_url
                          counterparty = deal.listing?.seller
                          counterpartyRoleText = lang === 'ar' ? 'مالك الكتاب' : 'Book Owner'
                        }
                      } else {
                        myBook = extractBook(deal.listing)
                        myCover = deal.listing?.images?.[0]?.url || myBook?.cover_image_url
                        if (isLenderOrSeller) {
                          counterparty = deal.buyer
                          counterpartyRoleText = isBorrow ? (lang === 'ar' ? 'المستعير' : 'Borrower') : (lang === 'ar' ? 'المشتري' : 'Buyer')
                        } else {
                          counterparty = deal.seller
                          counterpartyRoleText = isBorrow ? (lang === 'ar' ? 'صاحب الكتاب (المُعير)' : 'Lender') : (lang === 'ar' ? 'البائع' : 'Seller')
                        }
                      }

                      const meetupInfo = parseMeetupInfo(deal)
                      const countdown = loan ? getLoanCountdown(loan.due_date) : null

                      return (
                        <div
                          key={`accepted-${deal._kind}-${deal.id}`}
                          className="rounded-3xl border-2 border-emerald-500/50 bg-card p-5 sm:p-6 shadow-sm hover:border-emerald-500 transition-all space-y-4"
                        >
                          {/* Header: Deal Type & Counterparty */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isSwap && (
                                <Badge variant="swap" className="text-xs font-black">
                                  🔄 {lang === 'ar' ? 'صفقة تبادل مقبولة' : 'Accepted Swap Deal'}
                                </Badge>
                              )}
                              {isBorrow && (
                                <Badge className="text-xs font-black bg-emerald-600 text-white">
                                  ⏳ {isLenderOrSeller ? (lang === 'ar' ? 'كتابك المُعار' : 'Book Lent') : (lang === 'ar' ? 'كتاب استعرته' : 'Book Borrowed')}
                                </Badge>
                              )}
                              {isBuy && (
                                <Badge variant="sell" className="text-xs font-black">
                                  💰 {isLenderOrSeller ? (lang === 'ar' ? 'بيع مقبول' : 'Accepted Sale') : (lang === 'ar' ? 'شراء مقبول' : 'Accepted Buy')}
                                </Badge>
                              )}

                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px] font-black">
                                {deal.status === 'BORROWED'
                                  ? (lang === 'ar' ? 'مُعار حالياً ⏱️' : 'Currently Borrowed')
                                  : (lang === 'ar' ? 'مقبول — بانتظار المقابلة والتسليم 🤝' : 'Accepted — Ready for Meetup 🤝')}
                              </Badge>
                            </div>

                            {/* Counterparty Pill */}
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-xs text-primary ring-2 ring-primary/20 shrink-0">
                                {counterparty?.avatar_url ? (
                                  <Image src={counterparty.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                                ) : (
                                  counterparty?.full_name?.charAt(0) || '👤'
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-muted-foreground block">{counterpartyRoleText}:</span>
                                <span className="text-xs font-black text-foreground truncate block">
                                  {counterparty?.full_name_ar || counterparty?.full_name || 'قارئ'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Body: Books Showcase */}
                          {isSwap ? (
                            /* SWAP: Side-by-side books */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-muted/20 p-4 rounded-2xl border border-border/60">
                              {/* My Book */}
                              <div className="flex items-center gap-3">
                                <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                                  {myCover ? <Image src={myCover} alt="" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center text-sm">📖</div>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                                    {deal._role === 'LISTING_OWNER' ? (lang === 'ar' ? 'كتابك المطلوب منك تسليمه' : 'Your Book (to give)') : (lang === 'ar' ? 'كتابك المعروض بالمقابل' : 'Your Offered Book')}
                                  </span>
                                  <p className="text-sm font-black text-foreground truncate">{myBook?.title_ar || myBook?.title || 'كتاب'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{myBook?.author}</p>
                                </div>
                              </div>

                              {/* Their Book */}
                              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-s border-border/80 pt-3 sm:pt-0 sm:ps-4">
                                <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                                  {otherCover ? <Image src={otherCover} alt="" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center text-sm">📚</div>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                                    {deal._role === 'LISTING_OWNER' ? (lang === 'ar' ? 'كتاب القارئ المطلوب استلامه' : 'Their Book (to receive)') : (lang === 'ar' ? 'الكتاب المطلوب من المالك' : 'Requested Book')}
                                  </span>
                                  <p className="text-sm font-black text-foreground truncate">{otherBook?.title_ar || otherBook?.title || 'كتاب'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{otherBook?.author}</p>
                                </div>
                              </div>
                            </div>
                          ) : isBorrow ? (
                            /* BORROW: Book + Loan Details */
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-2xl border border-border/60">
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                                  {myCover ? <Image src={myCover} alt="" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center text-sm">📖</div>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-black text-foreground truncate">{myBook?.title_ar || myBook?.title || 'كتاب'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{myBook?.author}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold text-foreground">
                                    <span className="text-primary font-black">
                                      {lang === 'ar' ? 'المدة:' : 'Duration:'} {loan?.loan_days} {lang === 'ar' ? 'يوم' : 'days'}
                                    </span>
                                    <span>•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {lang === 'ar' ? 'تأمين مسترد:' : 'Deposit:'} {loan?.deposit || deal.deposit_amount || 0} ج.م
                                    </span>
                                    <span>•</span>
                                    <span className="text-muted-foreground">
                                      {lang === 'ar' ? 'الرسم:' : 'Fee:'} {loan?.borrow_fee ? `${loan.borrow_fee} ج.م` : (lang === 'ar' ? 'مجاناً' : 'Free')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Due Date Countdown Pill */}
                              {countdown && (
                                <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                  <Badge className={cn('text-xs font-black py-1.5 px-3 rounded-xl border', countdown.color)}>
                                    <Calendar className="h-3.5 w-3.5 me-1.5" />
                                    <span>{lang === 'ar' ? countdown.textAr : countdown.textEn}</span>
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* BUY: Book + Agreed Price */
                            <div className="flex items-center gap-3.5 bg-muted/20 p-4 rounded-2xl border border-border/60">
                              <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                                {myCover ? <Image src={myCover} alt="" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center text-sm">📖</div>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-foreground truncate">{myBook?.title_ar || myBook?.title || 'كتاب'}</p>
                                <p className="text-xs text-muted-foreground truncate">{myBook?.author}</p>
                                <div className="flex flex-wrap items-center gap-3 text-xs mt-2 font-bold">
                                  <span className="text-primary font-black">
                                    {lang === 'ar' ? 'السعر المتفق عليه:' : 'Agreed Price:'} {deal.price ? formatPrice(deal.price) : (lang === 'ar' ? 'حسب الاتفاق' : 'Agreed')}
                                  </span>
                                  <span className="text-muted-foreground">
                                    • {lang === 'ar' ? 'الدفع نقداً عند المقابلة والتسليم' : 'Cash on Handover'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Meetup Details Badge */}
                          <MeetupDetailBadge meetup={meetupInfo} lang={lang} />

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 border-t border-border/50">
                            {/* Message / Chat Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleChatWithUser(counterparty?.id, deal.listing_id || deal.listing?.id, `chat-${deal.id}`)}
                              loading={chatLoadingKey === `chat-${deal.id}`}
                              className="font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>{lang === 'ar' ? 'محادثة' : 'Message'}</span>
                            </Button>

                            {/* Details Hub Link */}
                            <Link href={`/transactions?id=${deal.id}`} className="shrink-0">
                              <Button variant="outline" size="sm" className="font-bold text-xs gap-1 rounded-xl cursor-pointer">
                                <span>{isBorrow ? (lang === 'ar' ? 'إدارة الإرجاع والتأمين ↗' : 'Manage Return ↗') : (lang === 'ar' ? 'مركز المعاملات ↗' : 'Deal Hub ↗')}</span>
                              </Button>
                            </Link>

                            {/* In-Person Meetup QR Pass Trigger */}
                            <Button
                              size="sm"
                              onClick={() => setQrModalData({
                                isOpen: true,
                                transactionId: !isSwap ? deal.id : undefined,
                                swapId: isSwap ? deal.id : undefined,
                                bookTitle: (myBook?.title_ar || myBook?.title || 'كتاب'),
                                meetupLocation: meetupInfo?.location || undefined,
                                transactionType: isSwap ? 'SWAP' : (isBorrow ? 'BORROW' : 'BUY'),
                                isBorrowReturn: deal.status === 'BORROWED',
                                otherPartyId: counterparty?.id,
                                otherPartyName: counterparty?.full_name,
                                listingId: deal.listing_id || deal.listing?.id,
                                swapListingId: deal.offered_listing_id || deal.offered_listing?.id,
                              })}
                              className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl cursor-pointer shadow-md shadow-emerald-600/20"
                            >
                              <QrCode className="h-4 w-4" />
                              <span>
                                {isBorrow && deal.status === 'BORROWED'
                                  ? (lang === 'ar' ? 'رمز QR لإرجاع الكتاب واسترداد التأمين 📱' : 'QR Return & Deposit Pass 📱')
                                  : (lang === 'ar' ? 'رمز QR للمقابلة والتسليم 📱' : 'Meetup QR Pass 📱')}
                              </span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 2. PENDING INCOMING REQUESTS SECTION                          */}
            {/* ───────────────────────────────────────────────────────────── */}
            {(dealsSubFilter === 'all' || dealsSubFilter === 'incoming') && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-foreground flex items-center justify-between">
                  <span>📥 {lang === 'ar' ? 'الطلبات الواردة الجديدة (قيد مراجعتك):' : 'Pending Incoming Requests (Awaiting Your Review):'}</span>
                  <span className="text-xs font-bold text-muted-foreground">({pendingIncomingCount})</span>
                </h3>

                {incomingTxList.filter((t: any) => t.status === 'PENDING').length === 0 &&
                 incomingSwapsList.filter((s: any) => s.status === 'PENDING').length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed text-xs text-muted-foreground bg-muted/20 space-y-3">
                    <p className="font-bold text-foreground">{lang === 'ar' ? 'لا توجد طلبات جديدة بانتظار موافقتك حالياً.' : 'No pending incoming requests.'}</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      {lang === 'ar'
                        ? 'عندما يرسل القراء طلبات لاستعارة أو شراء أو مبادلة كتبك ستظهر هنا فوراً مع خيارات القبول والرفض.'
                        : 'Incoming borrow, swap, and buy requests for your books will appear here.'}
                    </p>
                    {isOwnProfile && (
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCreateSampleIncomingRequest('BORROW')}
                          loading={creatingSampleRequest}
                          className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? '⚡ إنشاء طلب استعارة وارد تجريبي' : '⚡ Create Test Borrow'}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateSampleIncomingRequest('BUY')}
                          loading={creatingSampleRequest}
                          className="font-black text-xs rounded-xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer gap-1.5"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? '⚡ إنشاء طلب شراء وارد تجريبي' : '⚡ Create Test Buy'}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Incoming transactions (Borrow & Buy) */}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {incomingTxList.filter((t: any) => t.status === 'PENDING').map((tx: any) => {
                      const loan = parseLoanInfo(tx.buyer_note)
                      const book = tx.listing?.book
                      const buyer = tx.buyer
                      const cover = tx.listing?.images?.[0]?.url || book?.cover_image_url

                      return (
                        <div
                          key={tx.id}
                          className="p-4 sm:p-5 rounded-2xl border border-primary/40 shadow-xs ring-1 ring-primary/20 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative h-16 w-12 shrink-0 rounded-xl overflow-hidden bg-muted border">
                              {cover ? (
                                <Image src={cover} alt="" fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {loan ? (
                                  <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-600 bg-emerald-500/10 font-bold">
                                    ⏳ {lang === 'ar' ? 'طلب استعارة' : 'Borrow Request'}
                                  </Badge>
                                ) : (
                                  <Badge variant="sell" className="text-[10px] font-bold">
                                    💰 {lang === 'ar' ? 'طلب شراء' : 'Buy Request'}
                                  </Badge>
                                )}
                                <Badge className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/30">
                                  {lang === 'ar' ? 'قيد الانتظار ⏳' : 'Pending ⏳'}
                                </Badge>
                              </div>
                              <p className="text-xs font-black text-foreground mt-1 truncate">{book?.title || 'كتاب'}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {lang === 'ar' ? 'من:' : 'From:'} <span className="font-bold text-foreground">{buyer?.full_name || 'قارئ'}</span> • {formatRelativeTime(tx.created_at, lang)}
                                {loan && ` • تأمين: ${loan.deposit} ج.م (المدة: ${loan.loan_days} يوم)`}
                                {!loan && tx.price && ` • السعر: ${tx.price} ج.م`}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons for the Owner */}
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectTx(tx)}
                              loading={actionLoading === `tx-reject-${tx.id}`}
                              className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer"
                            >
                              {lang === 'ar' ? 'رفض' : 'Decline'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptTx(tx)}
                              loading={actionLoading === `tx-accept-${tx.id}`}
                              className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{lang === 'ar' ? 'قبول الطلب' : 'Accept'}</span>
                            </Button>
                            <Link href={`/transactions?tab=incoming&id=${tx.id}`} className="w-full sm:w-auto">
                              <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl w-full sm:w-auto cursor-pointer">
                                {lang === 'ar' ? 'تفاصيل' : 'Details'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}

                    {/* Incoming Swaps */}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {incomingSwapsList.filter((s: any) => s.status === 'PENDING').map((s: any) => {
                      const book = s.listing?.book
                      const offeredBook = s.offered_listing?.book
                      const requester = s.requester
                      const cover = s.listing?.images?.[0]?.url || book?.cover_image_url

                      return (
                        <div
                          key={s.id}
                          className="p-4 sm:p-5 rounded-2xl border border-primary/40 shadow-xs ring-1 ring-primary/20 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative h-16 w-12 shrink-0 rounded-lg overflow-hidden bg-muted border">
                              {cover ? (
                                <Image src={cover} alt="" fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs">🔄</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="swap" className="text-[10px] font-bold">
                                  🔄 {lang === 'ar' ? 'طلب مبادلة وارد' : 'Incoming Swap'}
                                </Badge>
                                <Badge className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/30">
                                  {lang === 'ar' ? 'قيد الانتظار ⏳' : 'Pending ⏳'}
                                </Badge>
                              </div>
                              <p className="text-xs font-black text-foreground mt-1 truncate">{book?.title || 'كتاب'}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {lang === 'ar' ? 'عرض مبادلة بكتاب:' : 'Offered book:'} <span className="font-bold text-foreground truncate">{offeredBook?.title || 'كتاب آخر'}</span>
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {lang === 'ar' ? 'من:' : 'From:'} <span className="font-bold text-foreground">{requester?.full_name || 'قارئ'}</span> • {formatRelativeTime(s.created_at, lang)}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons for the Owner */}
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectSwap(s)}
                              loading={actionLoading === `swap-reject-${s.id}`}
                              className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer"
                            >
                              {lang === 'ar' ? 'رفض' : 'Decline'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptSwap(s)}
                              loading={actionLoading === `swap-accept-${s.id}`}
                              className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{lang === 'ar' ? 'قبول المبادلة' : 'Accept'}</span>
                            </Button>
                            <Link href={`/transactions?tab=incoming&id=${s.id}`} className="w-full sm:w-auto">
                              <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl w-full sm:w-auto cursor-pointer">
                                {lang === 'ar' ? 'تفاصيل' : 'Details'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 3. ACTIVE LOANS & DEADLINES                                   */}
            {/* ───────────────────────────────────────────────────────────── */}
            {(dealsSubFilter === 'all' || dealsSubFilter === 'loans') && activeLoans.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-foreground flex items-center justify-between">
                  <span>⏳ {lang === 'ar' ? 'الاستعارات النشطة ومواعيد الإرجاع:' : 'Active Loans & Deadlines:'}</span>
                  <span className="text-xs font-bold text-emerald-600">({activeLoans.length})</span>
                </h3>
                <div className="space-y-2.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {activeLoans.map((tx: any) => {
                    const loan = parseLoanInfo(tx.buyer_note)
                    const isLender = tx.seller_id === profile.id
                    const book = tx.listing?.book
                    const countdown = loan ? getLoanCountdown(loan.due_date) : null

                    return (
                      <div key={tx.id} className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                              {isLender ? (lang === 'ar' ? 'كتابك المُعار' : 'Book Lent') : (lang === 'ar' ? 'كتاب استعرته' : 'Book Borrowed')}
                            </Badge>
                            <span className="text-xs font-bold text-foreground">{book?.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                            <Calendar className="h-3 w-3 text-emerald-600" />
                            <span>{lang === 'ar' ? 'موعد الإرجاع:' : 'Due Date:'} {loan?.due_date ? new Date(loan.due_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : 'قريباً'}</span>
                            <span>• التأمين: {loan?.deposit} ج.م</span>
                            {countdown && (
                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md border', countdown.color)}>
                                {lang === 'ar' ? countdown.textAr : countdown.textEn}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => setQrModalData({
                              isOpen: true,
                              transactionId: tx.id,
                              bookTitle: book?.title || 'كتاب',
                              meetupLocation: tx.meetup_location,
                              transactionType: 'BORROW',
                              isBorrowReturn: true,
                              otherPartyId: isLender ? tx.buyer?.id : tx.seller?.id,
                              otherPartyName: isLender ? tx.buyer?.full_name : tx.seller?.full_name,
                              listingId: tx.listing_id || tx.listing?.id,
                            })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'رمز QR للإرجاع' : 'Return QR Pass'}</span>
                          </Button>
                          <Link href="/transactions">
                            <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl">
                              {lang === 'ar' ? 'إدارة التأمين' : 'Manage'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 4. SENT REQUESTS                                              */}
            {/* ───────────────────────────────────────────────────────────── */}
            {(dealsSubFilter === 'all' || dealsSubFilter === 'outgoing') && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-foreground flex items-center justify-between">
                  <span>📤 {lang === 'ar' ? 'طلبات أرسلتها للآخرين:' : 'Sent Requests to Others:'}</span>
                  <span className="text-xs font-bold text-muted-foreground">({outgoingTxList.length + outgoingSwapsList.length})</span>
                </h3>

                {outgoingTxList.length === 0 && outgoingSwapsList.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed text-xs text-muted-foreground bg-muted/20">
                    {lang === 'ar' ? 'لم ترسل أي طلبات شراء أو مبادلة أو استعارة بعد.' : 'No sent requests yet.'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {outgoingTxList.map((tx: any) => {
                      const loan = parseLoanInfo(tx.buyer_note)
                      const book = tx.listing?.book
                      const seller = tx.seller

                      return (
                        <div key={tx.id} className="p-4 rounded-2xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {loan ? (
                                <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-600 bg-emerald-500/10 font-bold">
                                  ⏳ {lang === 'ar' ? 'طلب استعارة أرسلته' : 'Sent Borrow Request'}
                                </Badge>
                              ) : (
                                <Badge variant="sell" className="text-[10px] font-bold">
                                  💰 {lang === 'ar' ? 'طلب شراء أرسلته' : 'Sent Buy Order'}
                                </Badge>
                              )}
                              <Badge className={cn('text-[10px] font-bold', tx.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : tx.status === 'REJECTED' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600 border-amber-500/30')}>
                                {tx.status === 'ACCEPTED' ? (lang === 'ar' ? 'تم القبول ✅' : 'Accepted') : tx.status === 'REJECTED' ? (lang === 'ar' ? 'مرفوض ❌' : 'Declined') : (lang === 'ar' ? 'قيد الانتظار ⏳' : 'Pending')}
                              </Badge>
                            </div>
                            <p className="text-xs font-black text-foreground mt-1 truncate max-w-xs">{book?.title || 'كتاب'}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {lang === 'ar' ? 'المالك:' : 'Owner:'} {seller?.full_name || 'قارئ'} • {formatRelativeTime(tx.created_at, lang)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {tx.status === 'ACCEPTED' && (
                              <Button
                                size="sm"
                                onClick={() => setQrModalData({
                                  isOpen: true,
                                  transactionId: tx.id,
                                  bookTitle: book?.title || 'كتاب',
                                  meetupLocation: tx.meetup_location,
                                  transactionType: loan ? 'BORROW' : 'BUY',
                                  otherPartyId: seller?.id,
                                  otherPartyName: seller?.full_name,
                                  listingId: tx.listing_id || tx.listing?.id,
                                })}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 rounded-xl cursor-pointer"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                                <span>{lang === 'ar' ? 'رمز QR للمقابلة' : 'Meetup QR'}</span>
                              </Button>
                            )}
                            <Link href="/transactions">
                              <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl">
                                {lang === 'ar' ? 'تفاصيل الطلب' : 'Details'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}

                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {outgoingSwapsList.map((s: any) => {
                      const book = s.listing?.book
                      const seller = s.listing?.seller

                      return (
                        <div key={s.id} className="p-4 rounded-2xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="swap" className="text-[10px] font-bold">
                                🔄 {lang === 'ar' ? 'طلب مبادلة أرسلته' : 'Sent Swap Request'}
                              </Badge>
                              <Badge className={cn('text-[10px] font-bold', s.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : s.status === 'REJECTED' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600 border-amber-500/30')}>
                                {s.status === 'ACCEPTED' ? (lang === 'ar' ? 'تم القبول ✅' : 'Accepted') : s.status === 'REJECTED' ? (lang === 'ar' ? 'مرفوض ❌' : 'Declined') : (lang === 'ar' ? 'قيد الانتظار ⏳' : 'Pending')}
                              </Badge>
                            </div>
                            <p className="text-xs font-black text-foreground mt-1 truncate max-w-xs">{book?.title || 'كتاب'}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {lang === 'ar' ? 'المالك:' : 'Owner:'} {seller?.full_name || 'قارئ'} • {formatRelativeTime(s.created_at, lang)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.status === 'ACCEPTED' && (
                              <Button
                                size="sm"
                                onClick={() => setQrModalData({
                                  isOpen: true,
                                  swapId: s.id,
                                  bookTitle: book?.title || 'كتاب',
                                  meetupLocation: s.agreed_meetup_location || s.proposed_meetup_location,
                                  transactionType: 'SWAP',
                                  otherPartyId: seller?.id,
                                  otherPartyName: seller?.full_name,
                                  listingId: s.listing_id || s.listing?.id,
                                  swapListingId: s.offered_listing_id || s.offered_listing?.id,
                                })}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 rounded-xl cursor-pointer"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                                <span>{lang === 'ar' ? 'رمز QR للمقابلة' : 'Meetup QR'}</span>
                              </Button>
                            )}
                            <Link href="/transactions">
                              <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl">
                                {lang === 'ar' ? 'تفاصيل الطلب' : 'Details'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.map(rating => {
                const rater = rating.rater as unknown as Profile
                return (
                  <div key={rating.id} className="rounded-xl border p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${rater?.id}`}>
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {rater?.avatar_url ? (
                            <Image src={rater.avatar_url} alt="" width={36} height={36} className="object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-primary">{rater?.full_name?.charAt(0)}</span>
                          )}
                        </div>
                      </Link>
                      <div>
                        <p className="text-sm font-semibold">{rater?.full_name}</p>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={cn('h-3.5 w-3.5', s <= rating.overall ? 'fill-amber-400 text-amber-400' : 'text-muted')} />
                          ))}
                        </div>
                      </div>
                      <span className="ms-auto text-xs text-muted-foreground">{formatRelativeTime(rating.created_at, lang)}</span>
                    </div>
                    {rating.review && <p className="text-sm text-muted-foreground">{rating.review}</p>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Star className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-medium">{lang === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
            </div>
          )
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="rounded-xl border p-5 space-y-4">
            {profile.bio || profile.bio_ar ? (
              <div>
                <h3 className="font-semibold mb-2">{lang === 'ar' ? 'نبذة' : 'About'}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? (profile.bio_ar ?? profile.bio) : (profile.bio ?? profile.bio_ar)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{lang === 'ar' ? 'لا يوجد وصف.' : 'No bio yet.'}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{lang === 'ar' ? 'عضو منذ' : 'Member since'}</p>
                <p className="font-medium">{new Date(profile.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{lang === 'ar' ? 'معدل الاستجابة' : 'Response rate'}</p>
                <p className="font-medium">{profile.response_rate > 0 ? `${profile.response_rate}%` : (lang === 'ar' ? 'غير متاح' : 'N/A')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Book Confirmation Modal */}
        {listingToDelete && (
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
                    {lang === 'ar' ? 'هل أنت متأكد من حذف هذا الكتاب من رفوفك؟' : 'Are you sure you want to remove this book from your shelf?'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-3">
                {(listingToDelete.images?.[0]?.url || listingToDelete.book?.cover_image_url) && (
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={listingToDelete.images?.[0]?.url || listingToDelete.book?.cover_image_url || ''}
                      alt={listingToDelete.book?.title ?? ''}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black line-clamp-1 text-foreground">
                    {lang === 'ar' && listingToDelete.book?.title_ar ? listingToDelete.book.title_ar : listingToDelete.book?.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {lang === 'ar' && listingToDelete.book?.author_ar ? listingToDelete.book.author_ar : listingToDelete.book?.author}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] font-bold">
                    {listingToDelete.listing_type}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  {lang === 'ar'
                    ? 'تنبيه: لن يظهر الكتاب للآخرين في المتجر أو البحث، وسيتم إلغاء أي طلبات جديدة عليه.'
                    : 'Warning: This book will disappear from search and explore, and readers will no longer be able to send requests for it.'}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isDeleting}
                  onClick={() => setListingToDelete(null)}
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

        {/* Meetup QR Verification Modal */}
        {qrModalData && (
          <MeetupQrModal
            isOpen={qrModalData.isOpen}
            onClose={() => setQrModalData(null)}
            transactionId={qrModalData.transactionId}
            swapId={qrModalData.swapId}
            bookTitle={qrModalData.bookTitle}
            meetupLocation={qrModalData.meetupLocation}
            transactionType={qrModalData.transactionType}
            isBorrowReturn={qrModalData.isBorrowReturn}
            currentUserId={profile.id}
            otherPartyId={qrModalData.otherPartyId}
            otherPartyName={qrModalData.otherPartyName}
            listingId={qrModalData.listingId}
            swapListingId={qrModalData.swapListingId}
            onVerifiedSuccess={handleVerifiedSuccess}
          />
        )}
      </div>
    </MainLayout>
  )
}
