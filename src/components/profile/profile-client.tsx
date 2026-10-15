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
import { DetailedDealCard } from '@/components/transactions/detailed-deal-card'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { getAvatarUrl } from '@/lib/utils'
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
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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

  const handleCancelTx = async (tx: any) => {
    setActionLoading(`tx-cancel-${tx.id}`)
    try {
      await supabase.from('transactions').update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
      }).eq('id', tx.id)
      setOutgoingTxList(prev => prev.map((t: any) => t.id === tx.id ? { ...t, status: 'CANCELLED' } : t))
      showFeedback(lang === 'ar' ? 'تم إلغاء الطلب بنجاح.' : 'Request cancelled.')
    } catch {
      showFeedback(lang === 'ar' ? 'حدث خطأ أثناء إلغاء الطلب' : 'Failed to cancel request', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSwap = async (swap: any) => {
    setActionLoading(`swap-cancel-${swap.id}`)
    try {
      await supabase.from('swap_requests').update({
        status: 'REJECTED',
        responded_at: new Date().toISOString(),
      }).eq('id', swap.id)
      setOutgoingSwapsList(prev => prev.map((s: any) => s.id === swap.id ? { ...s, status: 'REJECTED' } : s))
      showFeedback(lang === 'ar' ? 'تم إلغاء طلب المبادلة.' : 'Swap request cancelled.')
    } catch {
      showFeedback(lang === 'ar' ? 'حدث خطأ أثناء إلغاء الطلب' : 'Failed to cancel swap', 'error')
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

  const getCleanBuyerNote = (note?: string | null) => {
    if (!note) return null
    try {
      const d = JSON.parse(note)
      return d.note || d.buyer_note || d.message || null
    } catch {
      return note
    }
  }

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
            <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 ring-4 ring-primary/20 relative">
              <Image
                src={getAvatarUrl(currentProfile.avatar_url, currentProfile.full_name)}
                alt={currentProfile.full_name ?? 'Avatar'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">
                  {lang === 'ar' && currentProfile.full_name_ar ? currentProfile.full_name_ar : currentProfile.full_name}
                </h1>
                {currentProfile.username && (
                  <span className="text-xs text-primary font-bold">@{currentProfile.username}</span>
                )}
                {currentProfile.is_verified && (
                  <span title="Verified" aria-label="Verified">
                    <Shield className="h-4 w-4 text-blue-500" />
                  </span>
                )}
              </div>

              {/* Bio */}
              {currentProfile.bio && (
                <p className="text-xs text-foreground/80 my-1.5 p-2 rounded-lg bg-muted/30 border border-border/40 italic">
                  &quot;{currentProfile.bio}&quot;
                </p>
              )}

              {/* Rating */}
              {currentProfile.rating_average > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('h-4 w-4', s <= Math.round(currentProfile.rating_average) ? 'fill-amber-400 text-amber-400' : 'text-muted')} />
                  ))}
                  <span className="text-sm font-medium ms-1">{currentProfile.rating_average.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({currentProfile.rating_count})</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  {currentProfile.total_listings} {lang === 'ar' ? 'كتاب' : 'books'}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  {currentProfile.total_swaps} {lang === 'ar' ? 'مبادلة' : 'swaps'}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Gift className="h-3.5 w-3.5" />
                  {currentProfile.total_donations} {lang === 'ar' ? 'تبرع' : 'gifts'}
                </span>
                <span className="text-muted-foreground">
                  👥 {follCount} {lang === 'ar' ? 'متابعون' : 'followers'}
                </span>
              </div>

              {/* Location */}
              {currentProfile.area && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {lang === 'ar' ? currentProfile.area.name_ar : currentProfile.area.name_en}
                  {currentProfile.city && `, ${lang === 'ar' ? currentProfile.city.name_ar : currentProfile.city.name_en}`}
                </p>
              )}

              {/* Genres */}
              {currentProfile.genres && currentProfile.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentProfile.genres.map((g: { category: { id: string; name_ar: string; name_en: string; icon?: string } }) => (
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
                  <div className="flex items-center gap-1.5 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex-1 gap-1.5 font-bold cursor-pointer"
                      id="edit-profile-btn"
                    >
                      <Edit3 className="h-4 w-4 text-primary" />
                      {lang === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
                    </Button>
                    <Link href="/profile/settings" title={lang === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}>
                      <Button variant="outline" size="sm" className="px-2.5 cursor-pointer">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
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
                      const isBorrow = Boolean(loan) || deal.transaction_type === 'BORROW'
                      const isListingOwner = deal._role === 'LISTING_OWNER' || deal._role === 'SELLER_OR_LENDER'

                      const counterparty = isSwap
                        ? (isListingOwner ? deal.requester : deal.listing?.seller)
                        : (isListingOwner ? deal.buyer : deal.seller)

                      const meetup = parseMeetupInfo(deal)
                      const myBook = extractBook(deal.listing)

                      return (
                        <DetailedDealCard
                          key={`accepted-${deal._kind}-${deal.id}`}
                          id={deal.id}
                          type={isSwap ? 'SWAP' : (isBorrow ? 'BORROW' : (deal.transaction_type || 'BUY'))}
                          status={deal.status}
                          createdAt={deal.created_at}
                          completedAt={deal.completed_at || deal.responded_at}
                          isIncoming={isListingOwner}
                          counterparty={counterparty}
                          primaryListing={deal.listing}
                          offeredListing={isSwap ? deal.offered_listing : undefined}
                          loanDays={loan?.loan_days}
                          dueDate={loan?.due_date || deal.borrow_due_date}
                          returnedAt={deal.borrow_returned_at}
                          depositAmount={loan?.deposit || deal.deposit_amount}
                          price={deal.price || deal.listing?.price}
                          meetupLocation={deal.meetup_location || deal.agreed_meetup_location || deal.proposed_meetup_location || meetup?.location}
                          meetupAt={deal.meetup_at || deal.agreed_meetup_at || meetup?.at}
                          proposedTimes={meetup?.times}
                          deliveryMethod={deal.delivery_method || deal.preferred_delivery || meetup?.deliveryMethod || 'MEETUP'}
                          buyerNote={isSwap ? deal.message : getCleanBuyerNote(deal.buyer_note)}
                          sellerNote={isSwap ? deal.response_message : deal.seller_note}
                          isBorrowReturn={deal.status === 'BORROWED'}
                          onChat={counterparty?.id ? () => handleChatWithUser(counterparty.id, deal.listing_id || deal.listing?.id, `chat-${deal.id}`) : undefined}
                          isChatLoading={chatLoadingKey === `chat-${deal.id}`}
                          onOpenQrModal={() => setQrModalData({
                            isOpen: true,
                            transactionId: !isSwap ? deal.id : undefined,
                            swapId: isSwap ? deal.id : undefined,
                            bookTitle: (myBook?.title_ar || myBook?.title || 'كتاب'),
                            meetupLocation: meetup?.location || undefined,
                            transactionType: isSwap ? 'SWAP' : (isBorrow ? 'BORROW' : 'BUY'),
                            isBorrowReturn: deal.status === 'BORROWED',
                            otherPartyId: counterparty?.id,
                            otherPartyName: counterparty?.full_name,
                            listingId: deal.listing_id || deal.listing?.id,
                            swapListingId: deal.offered_listing_id || deal.offered_listing?.id,
                          })}
                          lang={lang}
                        />
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
                  <div className="space-y-4">
                    {/* Incoming transactions (Borrow & Buy) */}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {incomingTxList.filter((t: any) => t.status === 'PENDING').map((tx: any) => {
                      const loan = parseLoanInfo(tx.buyer_note)
                      const isBorrow = Boolean(loan) || tx.transaction_type === 'BORROW'
                      const meetup = parseMeetupInfo(tx)

                      return (
                        <DetailedDealCard
                          key={`incoming-tx-${tx.id}`}
                          id={tx.id}
                          type={isBorrow ? 'BORROW' : (tx.transaction_type || 'BUY')}
                          status={tx.status}
                          createdAt={tx.created_at}
                          isIncoming={true}
                          counterparty={tx.buyer}
                          primaryListing={tx.listing}
                          loanDays={loan?.loan_days}
                          dueDate={loan?.due_date}
                          depositAmount={loan?.deposit}
                          price={tx.price || tx.listing?.price}
                          meetupLocation={tx.meetup_location || meetup?.location}
                          meetupAt={tx.meetup_at || meetup?.at}
                          proposedTimes={meetup?.times}
                          deliveryMethod={tx.delivery_method || meetup?.deliveryMethod || 'MEETUP'}
                          buyerNote={getCleanBuyerNote(tx.buyer_note)}
                          sellerNote={tx.seller_note}
                          onAccept={() => handleAcceptTx(tx)}
                          onReject={() => handleRejectTx(tx)}
                          isAcceptLoading={actionLoading === `tx-accept-${tx.id}`}
                          isRejectLoading={actionLoading === `tx-reject-${tx.id}`}
                          onChat={tx.buyer?.id ? () => handleChatWithUser(tx.buyer.id, tx.listing_id || tx.listing?.id, `chat-${tx.id}`) : undefined}
                          isChatLoading={chatLoadingKey === `chat-${tx.id}`}
                          lang={lang}
                        />
                      )
                    })}

                    {/* Incoming Swaps */}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {incomingSwapsList.filter((s: any) => s.status === 'PENDING').map((s: any) => {
                      const meetup = parseMeetupInfo(s)

                      return (
                        <DetailedDealCard
                          key={`incoming-swap-${s.id}`}
                          id={s.id}
                          type="SWAP"
                          status={s.status}
                          createdAt={s.created_at}
                          isIncoming={true}
                          counterparty={s.requester}
                          primaryListing={s.listing}
                          offeredListing={s.offered_listing}
                          meetupLocation={s.agreed_meetup_location || s.proposed_meetup_location || meetup?.location}
                          meetupAt={s.agreed_meetup_at || meetup?.at}
                          proposedTimes={meetup?.times}
                          deliveryMethod={s.preferred_delivery || meetup?.deliveryMethod || 'MEETUP'}
                          buyerNote={s.message}
                          sellerNote={s.response_message}
                          onAccept={() => handleAcceptSwap(s)}
                          onReject={() => handleRejectSwap(s)}
                          isAcceptLoading={actionLoading === `swap-accept-${s.id}`}
                          isRejectLoading={actionLoading === `swap-reject-${s.id}`}
                          onChat={s.requester?.id ? () => handleChatWithUser(s.requester.id, s.listing_id || s.listing?.id, `chat-swap-${s.id}`) : undefined}
                          isChatLoading={chatLoadingKey === `chat-swap-${s.id}`}
                          lang={lang}
                        />
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
                <div className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {activeLoans.map((tx: any) => {
                    const loan = parseLoanInfo(tx.buyer_note)
                    const isLender = tx.seller_id === profile.id
                    const counterparty = isLender ? tx.buyer : tx.seller
                    const book = tx.listing?.book
                    const meetup = parseMeetupInfo(tx)

                    return (
                      <DetailedDealCard
                        key={`loan-${tx.id}`}
                        id={tx.id}
                        type="BORROW"
                        status={tx.status}
                        createdAt={tx.created_at}
                        isIncoming={isLender}
                        counterparty={counterparty}
                        primaryListing={tx.listing}
                        loanDays={loan?.loan_days}
                        dueDate={loan?.due_date || tx.borrow_due_date}
                        returnedAt={tx.borrow_returned_at}
                        depositAmount={loan?.deposit || tx.deposit_amount}
                        price={tx.price || tx.listing?.price}
                        meetupLocation={tx.meetup_location || meetup?.location}
                        meetupAt={tx.meetup_at || meetup?.at}
                        proposedTimes={meetup?.times}
                        deliveryMethod={tx.delivery_method || meetup?.deliveryMethod || 'MEETUP'}
                        buyerNote={getCleanBuyerNote(tx.buyer_note)}
                        sellerNote={tx.seller_note}
                        isBorrowReturn={true}
                        onChat={counterparty?.id ? () => handleChatWithUser(counterparty.id, tx.listing_id || tx.listing?.id, `chat-${tx.id}`) : undefined}
                        isChatLoading={chatLoadingKey === `chat-${tx.id}`}
                        onOpenQrModal={() => setQrModalData({
                          isOpen: true,
                          transactionId: tx.id,
                          bookTitle: book?.title || 'كتاب',
                          meetupLocation: tx.meetup_location || meetup?.location,
                          transactionType: 'BORROW',
                          isBorrowReturn: true,
                          otherPartyId: counterparty?.id,
                          otherPartyName: counterparty?.full_name,
                          listingId: tx.listing_id || tx.listing?.id,
                        })}
                        lang={lang}
                      />
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
                  <div className="space-y-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {outgoingTxList.map((tx: any) => {
                      const loan = parseLoanInfo(tx.buyer_note)
                      const isBorrow = Boolean(loan) || tx.transaction_type === 'BORROW'
                      const book = tx.listing?.book
                      const seller = tx.seller
                      const meetup = parseMeetupInfo(tx)

                      return (
                        <DetailedDealCard
                          key={`outgoing-tx-${tx.id}`}
                          id={tx.id}
                          type={isBorrow ? 'BORROW' : (tx.transaction_type || 'BUY')}
                          status={tx.status}
                          createdAt={tx.created_at}
                          isIncoming={false}
                          counterparty={seller}
                          primaryListing={tx.listing}
                          loanDays={loan?.loan_days}
                          dueDate={loan?.due_date}
                          depositAmount={loan?.deposit}
                          price={tx.price || tx.listing?.price}
                          meetupLocation={tx.meetup_location || meetup?.location}
                          meetupAt={tx.meetup_at || meetup?.at}
                          proposedTimes={meetup?.times}
                          deliveryMethod={tx.delivery_method || meetup?.deliveryMethod || 'MEETUP'}
                          buyerNote={getCleanBuyerNote(tx.buyer_note)}
                          sellerNote={tx.seller_note}
                          onCancel={tx.status === 'PENDING' ? () => handleCancelTx(tx) : undefined}
                          isCancelLoading={actionLoading === `tx-cancel-${tx.id}`}
                          onChat={seller?.id ? () => handleChatWithUser(seller.id, tx.listing_id || tx.listing?.id, `chat-out-${tx.id}`) : undefined}
                          isChatLoading={chatLoadingKey === `chat-out-${tx.id}`}
                          onOpenQrModal={tx.status === 'ACCEPTED' ? () => setQrModalData({
                            isOpen: true,
                            transactionId: tx.id,
                            bookTitle: book?.title || 'كتاب',
                            meetupLocation: tx.meetup_location || meetup?.location,
                            transactionType: isBorrow ? 'BORROW' : (tx.transaction_type || 'BUY'),
                            otherPartyId: seller?.id,
                            otherPartyName: seller?.full_name,
                            listingId: tx.listing_id || tx.listing?.id,
                          }) : undefined}
                          lang={lang}
                        />
                      )
                    })}

                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {outgoingSwapsList.map((s: any) => {
                      const book = s.listing?.book
                      const seller = s.listing?.seller
                      const meetup = parseMeetupInfo(s)

                      return (
                        <DetailedDealCard
                          key={`outgoing-swap-${s.id}`}
                          id={s.id}
                          type="SWAP"
                          status={s.status}
                          createdAt={s.created_at}
                          isIncoming={false}
                          counterparty={seller}
                          primaryListing={s.listing}
                          offeredListing={s.offered_listing}
                          meetupLocation={s.agreed_meetup_location || s.proposed_meetup_location || meetup?.location}
                          meetupAt={s.agreed_meetup_at || meetup?.at}
                          proposedTimes={meetup?.times}
                          deliveryMethod={s.preferred_delivery || meetup?.deliveryMethod || 'MEETUP'}
                          buyerNote={s.message}
                          sellerNote={s.response_message}
                          onCancel={s.status === 'PENDING' ? () => handleCancelSwap(s) : undefined}
                          isCancelLoading={actionLoading === `swap-cancel-${s.id}`}
                          onChat={seller?.id ? () => handleChatWithUser(seller.id, s.listing_id || s.listing?.id, `chat-swap-out-${s.id}`) : undefined}
                          isChatLoading={chatLoadingKey === `chat-swap-out-${s.id}`}
                          onOpenQrModal={s.status === 'ACCEPTED' ? () => setQrModalData({
                            isOpen: true,
                            swapId: s.id,
                            bookTitle: book?.title || 'كتاب',
                            meetupLocation: s.agreed_meetup_location || s.proposed_meetup_location || meetup?.location,
                            transactionType: 'SWAP',
                            otherPartyId: seller?.id,
                            otherPartyName: seller?.full_name,
                            listingId: s.listing_id || s.listing?.id,
                            swapListingId: s.offered_listing_id || s.offered_listing?.id,
                          }) : undefined}
                          lang={lang}
                        />
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
        {/* Edit Profile Modal */}
        {isOwnProfile && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            profile={currentProfile}
            onProfileUpdated={(updated) => {
              setCurrentProfile(updated)
              showFeedback(lang === 'ar' ? 'تم تحديث الملف الشخصي بنجاح! ✨' : 'Profile updated successfully! ✨')
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}
