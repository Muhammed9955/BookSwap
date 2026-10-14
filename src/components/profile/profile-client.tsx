'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Star, Shield, BookOpen, ArrowRightLeft, Gift, MessageCircle,
  UserPlus, UserMinus, Settings, Clock, CheckCircle2, XCircle, ShoppingBag,
  ExternalLink, Calendar, ShieldCheck, Sparkles, Trash2, Edit3, AlertTriangle, Loader2
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
  const [incomingSwapsList, setIncomingSwapsList] = useState(incomingSwaps)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
  const activeLoans = [...incomingTxList, ...outgoingTransactions].filter(t => {
    try {
      const parsed = t.buyer_note ? JSON.parse(t.buyer_note) : null
      return parsed?.mode === 'BORROW' && (t.status === 'ACCEPTED' || t.status === 'PENDING')
    } catch {
      return false
    }
  })

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
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-black',
                  pendingIncomingCount > 0 ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'
                )}>
                  {pendingIncomingCount > 0 ? pendingIncomingCount : incomingTransactions.length + incomingSwaps.length + outgoingTransactions.length + outgoingSwaps.length}
                </span>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-card border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground block">
                    {lang === 'ar' ? 'طلبات واردة بانتظار ردك' : 'Incoming Pending'}
                  </span>
                  <span className="text-2xl font-black text-foreground">{pendingIncomingCount}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-black">
                  📥
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground block">
                    {lang === 'ar' ? 'طلبات أرسلتها' : 'Sent Requests'}
                  </span>
                  <span className="text-2xl font-black text-foreground">
                    {outgoingTransactions.length + outgoingSwaps.length}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  📤
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground block">
                    {lang === 'ar' ? 'استعارات نشطة' : 'Active Loans'}
                  </span>
                  <span className="text-2xl font-black text-foreground">{activeLoans.length}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  ⏳
                </div>
              </div>
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

            {/* 1. Pending Incoming Requests */}
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

            <div className="space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center justify-between">
                <span>📥 {lang === 'ar' ? 'الطلبات الواردة لك (يمكنك قبولها أو رفضها مباشرة):' : 'Incoming Requests for You (Accept or Decline):'}</span>
                <span className="text-xs font-bold text-muted-foreground">({incomingTxList.length + incomingSwapsList.length})</span>
              </h3>

              {incomingTxList.length === 0 && incomingSwapsList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed text-xs text-muted-foreground bg-muted/20 space-y-3">
                  <p className="font-bold text-foreground">{lang === 'ar' ? 'لا توجد طلبات واردة حالياً.' : 'No incoming requests yet.'}</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    {lang === 'ar'
                      ? 'عندما يرسل القراء طلبات لاستعارة أو شراء كتبك ستظهر هنا فوراً مع خيارات القبول والرفض.'
                      : 'Incoming borrow and buy requests for your books will appear here.'}
                  </p>
                  {isOwnProfile && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateSampleIncomingRequest('BORROW')}
                        loading={creatingSampleRequest}
                        className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? '⚡ إنشاء طلب استعارة وارد تجريبي لاختبار الدورة' : '⚡ Create Test Incoming Request'}</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Incoming transactions (Borrow & Buy) */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {incomingTxList.map((tx: any) => {
                    const loan = (() => {
                      if (!tx.buyer_note) return null
                      try {
                        const d = JSON.parse(tx.buyer_note)
                        return d.mode === 'BORROW' ? d : null
                      } catch {
                        return null
                      }
                    })()
                    const book = tx.listing?.book
                    const buyer = tx.buyer
                    const cover = tx.listing?.images?.[0]?.url || book?.cover_image_url
                    const isPending = tx.status === 'PENDING'

                    return (
                      <div
                        key={tx.id}
                        className={cn(
                          'p-4 sm:p-5 rounded-2xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all',
                          isPending ? 'border-primary/40 shadow-xs ring-1 ring-primary/20' : 'hover:border-border'
                        )}
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
                              <Badge className={cn('text-[10px] font-bold', isPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : tx.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted')}>
                                {isPending ? (lang === 'ar' ? 'قيد الانتظار ⏳' : 'Pending ⏳') : tx.status === 'ACCEPTED' ? (lang === 'ar' ? 'مقبول ✅' : 'Accepted ✅') : tx.status}
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
                          {isPending && (
                            <>
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
                            </>
                          )}
                          <Link href={`/transactions?tab=incoming&id=${tx.id}`} className="w-full sm:w-auto">
                            <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl w-full sm:w-auto cursor-pointer">
                              {lang === 'ar' ? 'التفاصيل والمقابلة' : 'Details & Meetup'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}

                  {/* Incoming Swaps */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {incomingSwapsList.map((s: any) => {
                    const book = s.listing?.book
                    const offeredBook = s.offered_listing?.book
                    const requester = s.requester
                    const cover = s.listing?.images?.[0]?.url || book?.cover_image_url
                    const isPending = s.status === 'PENDING'

                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'p-4 sm:p-5 rounded-2xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all',
                          isPending ? 'border-primary/40 shadow-xs ring-1 ring-primary/20' : 'hover:border-border'
                        )}
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
                                🔄 {lang === 'ar' ? 'طلب مبادلة' : 'Swap Request'}
                              </Badge>
                              <Badge className={cn('text-[10px] font-bold', isPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : s.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted')}>
                                {isPending ? (lang === 'ar' ? 'قيد الانتظار ⏳' : 'Pending ⏳') : s.status === 'ACCEPTED' ? (lang === 'ar' ? 'مقبول ✅' : 'Accepted ✅') : s.status}
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
                          {isPending && (
                            <>
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
                            </>
                          )}
                          <Link href={`/transactions?tab=incoming&id=${s.id}`} className="w-full sm:w-auto">
                            <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl w-full sm:w-auto cursor-pointer">
                              {lang === 'ar' ? 'التفاصيل والمقابلة' : 'Details & Meetup'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 2. Active Loans & Deadlines */}
            {activeLoans.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-foreground flex items-center justify-between">
                  <span>⏳ {lang === 'ar' ? 'الاستعارات النشطة ومواعيد الإرجاع:' : 'Active Loans & Deadlines:'}</span>
                  <span className="text-xs font-bold text-emerald-600">({activeLoans.length})</span>
                </h3>
                <div className="space-y-2.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {activeLoans.map((tx: any) => {
                    const loan = (() => {
                      if (!tx.buyer_note) return null
                      try {
                        const d = JSON.parse(tx.buyer_note)
                        return d.mode === 'BORROW' ? d : null
                      } catch {
                        return null
                      }
                    })()
                    const isLender = tx.seller_id === profile.id
                    const book = tx.listing?.book

                    return (
                      <div key={tx.id} className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                              {isLender ? (lang === 'ar' ? 'كتابك المُعار' : 'Book Lent') : (lang === 'ar' ? 'كتاب استعرته' : 'Book Borrowed')}
                            </Badge>
                            <span className="text-xs font-bold text-foreground">{book?.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-emerald-600" />
                            <span>{lang === 'ar' ? 'موعد الإرجاع:' : 'Due Date:'} {loan?.due_date ? new Date(loan.due_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : 'قريباً'}</span>
                            <span>• التأمين: {loan?.deposit} ج.م</span>
                          </p>
                        </div>
                        <Link href="/transactions">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs">
                            {lang === 'ar' ? 'إدارة الإرجاع والتأمين' : 'Manage Return'}
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 3. Sent Requests */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center justify-between">
                <span>📤 {lang === 'ar' ? 'طلبات أرسلتها للآخرين:' : 'Sent Requests to Others:'}</span>
                <span className="text-xs font-bold text-muted-foreground">({outgoingTransactions.length + outgoingSwaps.length})</span>
              </h3>

              {outgoingTransactions.length === 0 && outgoingSwaps.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed text-xs text-muted-foreground bg-muted/20">
                  {lang === 'ar' ? 'لم ترسل أي طلبات شراء أو مبادلة أو استعارة بعد.' : 'No sent requests yet.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {outgoingTransactions.map((tx: any) => {
                    const loan = (() => {
                      if (!tx.buyer_note) return null
                      try {
                        const d = JSON.parse(tx.buyer_note)
                        return d.mode === 'BORROW' ? d : null
                      } catch {
                        return null
                      }
                    })()
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
                        <Link href="/transactions">
                          <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl">
                            {lang === 'ar' ? 'تفاصيل الطلب' : 'Details'}
                          </Button>
                        </Link>
                      </div>
                    )
                  })}

                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {outgoingSwaps.map((s: any) => {
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
                        <Link href="/transactions">
                          <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl">
                            {lang === 'ar' ? 'تفاصيل الطلب' : 'Details'}
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
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
      </div>
    </MainLayout>
  )
}
