'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRightLeft,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  Sparkles,
  BookOpen,
  QrCode,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatPrice, formatRelativeTime } from '@/lib/utils'
import { acceptTransaction, rejectTransaction, completeTransaction, pushNotificationSafe, createTestIncomingTransaction } from '@/lib/transactions/lifecycle'
import { MeetupDetailBadge } from '@/components/ui/meetup-badge'
import { MeetupQrModal } from '@/components/transactions/meetup-qr-modal'
import { DetailedDealCard } from '@/components/transactions/detailed-deal-card'
import type { Profile } from '@/types'

interface TransactionsHubClientProps {
  currentUserId: string
  userProfile: Profile | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingTransactions: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outgoingTransactions: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingSwaps: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outgoingSwaps: any[]
}

type TabType = 'incoming' | 'outgoing' | 'loans' | 'history'

export function TransactionsHubClient({
  currentUserId,
  userProfile,
  incomingTransactions: initialIncomingTx,
  outgoingTransactions: initialOutgoingTx,
  incomingSwaps: initialIncomingSwaps,
  outgoingSwaps: initialOutgoingSwaps,
}: TransactionsHubClientProps) {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const urlTab = searchParams.get('tab') as TabType | null
  const urlId = searchParams.get('id')

  const [activeTab, setActiveTab] = useState<TabType>(
    urlTab && ['incoming', 'outgoing', 'loans', 'history'].includes(urlTab) ? urlTab : 'incoming'
  )
  const [highlightedId, setHighlightedId] = useState<string | null>(urlId)
  const [incomingTx, setIncomingTx] = useState(initialIncomingTx)
  const [outgoingTx, setOutgoingTx] = useState(initialOutgoingTx)
  const [incomingSwaps, setIncomingSwaps] = useState(initialIncomingSwaps)
  const [outgoingSwaps, setOutgoingSwaps] = useState(initialOutgoingSwaps)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null)
  const [creatingSampleRequest, setCreatingSampleRequest] = useState(false)

  const handleCreateSampleIncomingRequest = async (mode: 'BORROW' | 'BUY' = 'BORROW') => {
    setCreatingSampleRequest(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdTx: any = null
      try {
        createdTx = await createTestIncomingTransaction({
          sellerId: currentUserId,
          mode,
        })
      } catch {
        const res = await fetch('/api/transactions/test-incoming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerId: currentUserId, mode }),
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
        setIncomingTx(prev => [createdTx, ...prev.filter((t: any) => t.id !== createdTx.id)])
        showToast(
          lang === 'ar'
            ? 'تم إنشاء طلب استعارة وارد تجريبي بنجاح! يمكنك الآن تجربة قبوله أو رفضه وفحص تفاصيل المقابلة. 🎉'
            : 'Test incoming request generated! You can now accept, decline, or check meetup details. 🎉'
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ أثناء إنشاء الطلب التجريبي'
      showToast(msg)
      console.error('Test incoming request error:', err)
    } finally {
      setCreatingSampleRequest(false)
    }
  }

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
      ...(newStatus === 'COMPLETED' ? { completed_at: new Date().toISOString(), payment_status: 'PAID' } : {}),
    }

    if (qrModalData.swapId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingSwaps(prev => prev.map((s: any) => s.id === id ? { ...s, ...updates } : s))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOutgoingSwaps(prev => prev.map((s: any) => s.id === id ? { ...s, ...updates } : s))
    }
    if (qrModalData.transactionId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingTx(prev => prev.map((t: any) => t.id === id ? { ...t, ...updates } : t))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOutgoingTx(prev => prev.map((t: any) => t.id === id ? { ...t, ...updates } : t))
    }

    showToast(lang === 'ar' ? 'تم تأكيد المعاملة بنجاح عبر رمز QR! 🎉' : 'Transaction confirmed via QR! 🎉')
  }

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    if (urlTab && ['incoming', 'outgoing', 'loans', 'history'].includes(urlTab)) {
      setActiveTab(urlTab)
    }
  }, [urlTab])

  // Scroll to and visually highlight the targeted request from notification
  useEffect(() => {
    if (urlId) {
      setHighlightedId(urlId)
      const timer = setTimeout(() => {
        const el = document.getElementById(`tx-${urlId}`) || document.getElementById(`swap-${urlId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 350)

      const clearTimer = setTimeout(() => {
        setHighlightedId(null)
      }, 5000)

      return () => {
        clearTimeout(timer)
        clearTimeout(clearTimer)
      }
    }
  }, [urlId, activeTab])

  // Filter Active Borrowings / Loans
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeLoans = [...incomingTx, ...outgoingTx].filter((t: any) => {
    try {
      const parsed = t.buyer_note ? JSON.parse(t.buyer_note) : null
      return parsed?.mode === 'BORROW' && (t.status === 'ACCEPTED' || t.status === 'PENDING')
    } catch {
      return false
    }
  })

  // Pending incoming count
  const pendingIncomingCount =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    incomingTx.filter((t: any) => t.status === 'PENDING').length +
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    incomingSwaps.filter((s: any) => s.status === 'PENDING').length

  const showToast = (msg: string) => {
    setNotificationMsg(msg)
    setTimeout(() => setNotificationMsg(null), 4000)
  }

  // Handle Swap Action
  const handleSwapStatus = async (swapId: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
    setActionLoading(`swap-${swapId}`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const swap = [...incomingSwaps, ...outgoingSwaps].find((s: any) => s.id === swapId)
      const requesterId = swap?.requester?.id || swap?.requester_id
      const ownerId = swap?.listing?.seller_id || swap?.seller_id || swap?.seller?.id
      const bookTitle = swap?.listing?.book?.title || 'الكتاب'

      const { error } = await supabase
        .from('swap_requests')
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
        })
        .eq('id', swapId)

      if (!error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setIncomingSwaps(prev => prev.map((s: any) => (s.id === swapId ? { ...s, status: newStatus } : s)))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOutgoingSwaps(prev => prev.map((s: any) => (s.id === swapId ? { ...s, status: newStatus } : s)))

        if (newStatus === 'ACCEPTED') {
          // Reserve BOTH listings when swap is accepted
          const listingIds = [
            swap?.listing?.id,
            swap?.offered_listing?.id,
          ].filter(Boolean) as string[]
          if (listingIds.length) {
            await supabase.from('book_listings').update({ status: 'RESERVED' }).in('id', listingIds)
          }
          if (requesterId) {
            await pushNotificationSafe(supabase, {
              user_id: requesterId,
              type: 'SWAP_ACCEPTED',
              title: 'تمت الموافقة على طلب المبادلة! 🔄',
              title_ar: 'تمت الموافقة على طلب المبادلة! 🔄',
              body: `وافق صاحب الكتاب على عرض المبادلة! اتجه إلى المحادثة للاتفاق على موعد التسليم.`,
              action_url: `/transactions?tab=outgoing&id=${swapId}`,
            })
          }
        } else {
          // Re-activate BOTH listings if swap rejected or cancelled
          const listingIds = [
            swap?.listing?.id,
            swap?.offered_listing?.id,
          ].filter(Boolean) as string[]
          if (listingIds.length) {
            await supabase.from('book_listings').update({ status: 'ACTIVE' }).in('id', listingIds)
          }

          // Distinguish between owner declining vs requester withdrawing:
          if (currentUserId === requesterId && ownerId) {
            // Requester withdrew/cancelled their offer -> notify owner
            await pushNotificationSafe(supabase, {
              user_id: ownerId,
              type: 'SWAP_REJECTED',
              title: 'تم سحب عرض المبادلة',
              title_ar: 'تم سحب عرض المبادلة',
              body: `قام القارئ بإلغاء وسحب عرض المبادلة لكتاب "${bookTitle}".`,
              action_url: '/transactions',
            })
          } else if (requesterId) {
            // Owner declined -> notify requester
            await pushNotificationSafe(supabase, {
              user_id: requesterId,
              type: 'SWAP_REJECTED',
              title: 'اعتذار عن طلب المبادلة',
              title_ar: 'اعتذار عن طلب المبادلة',
              body: `عذراً، اعتذر مالك الكتاب عن إتمام طلب المبادلة في الوقت الحالي. يمكنك البحث عن كتب أخرى.`,
              action_url: '/explore',
            })
          }
        }

        showToast(
          newStatus === 'ACCEPTED'
            ? lang === 'ar' ? 'تمت الموافقة على طلب المبادلة بنجاح! تم إشعار القارئ.' : 'Swap request accepted! Reader notified.'
            : lang === 'ar' ? 'تم تحديث طلب المبادلة وإعادة الكتب للمتاح.' : 'Swap request updated. Books re-listed.'
        )
      }
    } catch (err) {
      console.error(err)
      showToast(lang === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Transaction Action (Buy or Borrow)
  const handleTxStatus = async (txId: string, newStatus: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED') => {
    setActionLoading(`tx-${txId}`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = [...incomingTx, ...outgoingTx].find((t: any) => t.id === txId)
      const loanInfo = parseLoanInfo(tx?.buyer_note)
      const isBorrow = Boolean(loanInfo)
      const buyerId = tx?.buyer?.id || tx?.buyer_id
      const sellerId = tx?.seller?.id || tx?.seller_id
      const listingId = tx?.listing?.id
      const bookTitle = tx?.listing?.book?.title

      if (newStatus === 'ACCEPTED') {
        await acceptTransaction({
          transactionId: txId,
          sellerId: currentUserId,
          buyerId,
          listingId,
          bookTitle,
          isBorrow,
        })
      } else if (newStatus === 'REJECTED') {
        await rejectTransaction({
          transactionId: txId,
          sellerId: currentUserId,
          buyerId,
          bookTitle,
        })
      } else if (newStatus === 'COMPLETED') {
        await completeTransaction({
          transactionId: txId,
          actorId: currentUserId,
          otherPartyId: currentUserId === sellerId ? buyerId : sellerId,
          listingId,
          bookTitle,
          isBorrow,
        })
      } else if (newStatus === 'CANCELLED') {
        await supabase.from('transactions').update({
          status: 'CANCELLED',
          cancelled_at: new Date().toISOString(),
        }).eq('id', txId)

        if (listingId) {
          await supabase.from('book_listings').update({ status: 'ACTIVE' }).eq('id', listingId)
        }

        const targetNotifyId = currentUserId === sellerId ? buyerId : sellerId
        if (targetNotifyId) {
          await pushNotificationSafe(supabase, {
            user_id: targetNotifyId,
            type: 'SWAP_REJECTED',
            title: lang === 'ar' ? 'تم إلغاء الطلب' : 'Request Cancelled',
            title_ar: 'تم إلغاء الطلب',
            body: lang === 'ar'
              ? `تم إلغاء طلب كتاب "${bookTitle || 'الكتاب'}" من قبل الطرف الآخر.`
              : `The request for book "${bookTitle || 'Book'}" was cancelled by the other party.`,
            body_ar: `تم إلغاء طلب كتاب "${bookTitle || 'الكتاب'}" من قبل الطرف الآخر.`,
            action_url: '/transactions',
          })
        }
      }

      const updates: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'COMPLETED') {
        updates.completed_at = new Date().toISOString()
        updates.payment_status = 'PAID'
      } else if (newStatus === 'CANCELLED') {
        updates.cancelled_at = new Date().toISOString()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIncomingTx(prev => prev.map((t: any) => (t.id === txId ? { ...t, ...updates } : t)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOutgoingTx(prev => prev.map((t: any) => (t.id === txId ? { ...t, ...updates } : t)))

      if (newStatus === 'ACCEPTED') {
        showToast(lang === 'ar' ? 'تمت الموافقة على الطلب وإشعار القارئ بنجاح! 🎉' : 'Request accepted & reader notified! 🎉')
      } else if (newStatus === 'COMPLETED') {
        showToast(lang === 'ar' ? 'اكتملت المعاملة بنجاح وتم استرداد أي تأمين مستحق! ⭐' : 'Deal marked completed & deposit released! ⭐')
      } else if (newStatus === 'REJECTED') {
        showToast(lang === 'ar' ? 'تم رفض الطلب.' : 'Request declined.')
      } else if (newStatus === 'CANCELLED') {
        showToast(lang === 'ar' ? 'تم إلغاء الطلب.' : 'Request cancelled.')
      }
    } catch (err) {
      console.error('handleTxStatus error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const [chatLoadingKey, setChatLoadingKey] = useState<string | null>(null)

  // Open conversation
  const handleChatWithUser = async (otherUserId?: string | null, listingId?: string, key?: string) => {
    if (!otherUserId) return
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

  // Helper: Parse Loan Note
  const parseLoanInfo = (note?: string) => {
    if (!note) return null
    try {
      const d = JSON.parse(note)
      if (d.mode === 'BORROW') return d
    } catch {
      return null
    }
    return null
  }

  // Helper: Clean raw JSON buyer note for display
  const getCleanBuyerNote = (note?: string | null) => {
    if (!note) return null
    try {
      const d = JSON.parse(note)
      return d.note || d.buyer_note || d.message || null
    } catch {
      return note
    }
  }

  // Helper: Extract Book Object whether relations return an array or single item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractBook = (listing: any) => {
    if (!listing?.book) return null
    return Array.isArray(listing.book) ? listing.book[0] : listing.book
  }

  // Helper: Parse Meetup Info from either direct columns, buyer_note JSON, or swap message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseMeetupInfo = (item: any) => {
    if (!item) return null

    // 1. Direct migration columns
    if (item.meetup_location || item.proposed_meetup_location || item.agreed_meetup_location) {
      return {
        location: item.agreed_meetup_location || item.meetup_location || item.proposed_meetup_location,
        deliveryMethod: item.preferred_delivery || item.delivery_method || 'MEETUP',
        times: Array.isArray(item.proposed_times) ? item.proposed_times : [],
        isConfirmed: Boolean(item.agreed_meetup_location || item.meetup_at),
        at: item.agreed_meetup_at || item.meetup_at || null,
      }
    }

    // 2. buyer_note JSON fallback
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

    // 3. Swap message fallback
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

  return (
    <MainLayout user={{ id: currentUserId, profile: userProfile ?? undefined }}>
      <div className="page-container py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <ArrowRightLeft className="h-6 w-6" />
              </span>
              {lang === 'ar' ? 'معاملاتي وطلبات الكتب' : 'My Deals & Requests'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'ar'
                ? 'إدارة عروض المبادلة، طلبات الشراء، والكتب المستعارة النشطة مع تتبع التأمين وتواريخ الإرجاع'
                : 'Manage book swaps, buy orders, and active book loans with deposit tracking'}
            </p>
          </div>

          <Link href="/books/add">
            <Button className="font-bold gap-2 rounded-xl shadow-md shadow-primary/20">
              <BookOpen className="h-4 w-4" />
              {lang === 'ar' ? 'عرض كتاب جديد' : 'List a Book'}
            </Button>
          </Link>
        </div>

        {/* Toast Alert */}
        {notificationMsg && (
          <div className="mb-6 rounded-2xl bg-primary/10 border-2 border-primary/20 p-4 text-sm font-bold text-primary flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <p>{notificationMsg}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-border/80 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'incoming'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <span>📥 {lang === 'ar' ? 'الطلبات الواردة' : 'Incoming Requests'}</span>
            {pendingIncomingCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black">
                {pendingIncomingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'outgoing'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <span>📤 {lang === 'ar' ? 'طلباتي الصادرة' : 'My Sent Requests'}</span>
            <span className="text-xs opacity-70">
              ({outgoingTx.length + outgoingSwaps.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loans')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'loans'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <span>⏳ {lang === 'ar' ? 'الاستعارات النشطة والمهلة' : 'Active Loans & Deadlines'}</span>
            {activeLoans.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black">
                {activeLoans.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <span>📜 {lang === 'ar' ? 'السجل المكتمل' : 'Completed Deals'}</span>
          </button>
        </div>

        {/* TAB 1: INCOMING REQUESTS */}
        {activeTab === 'incoming' && (
          <div className="space-y-4">
            {/* Accepted Incoming Deals Ready for Handover */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(incomingTx.some((t: any) => t.status === 'ACCEPTED') || incomingSwaps.some((s: any) => s.status === 'ACCEPTED')) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">
                    🤝 {lang === 'ar' ? 'معاملات مقبولة بانتظار المقابلة والتسليم' : 'Accepted Deals — Ready for Meetup'}
                  </Badge>
                </div>

                {/* Accepted Incoming Transactions (Buy & Borrow) */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {incomingTx.filter((t: any) => t.status === 'ACCEPTED').map((tx: any) => {
                  const book = extractBook(tx.listing)
                  const loan = parseLoanInfo(tx.buyer_note)
                  const meetup = parseMeetupInfo(tx)
                  const isBorrow = Boolean(loan) || tx.transaction_type === 'BORROW'

                  return (
                    <DetailedDealCard
                      key={`acc-tx-${tx.id}`}
                      id={tx.id}
                      type={isBorrow ? 'BORROW' : (tx.transaction_type || 'BUY')}
                      status={tx.status}
                      createdAt={tx.created_at}
                      completedAt={tx.completed_at}
                      isIncoming={true}
                      counterparty={tx.buyer}
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
                      onChat={() => handleChatWithUser(tx.buyer?.id || tx.buyer_id, tx.listing_id, `tx-${tx.id}`)}
                      isChatLoading={chatLoadingKey === `tx-${tx.id}`}
                      onOpenQrModal={() => setQrModalData({
                        isOpen: true,
                        transactionId: tx.id,
                        bookTitle: book?.title_ar || book?.title || 'كتاب',
                        meetupLocation: tx.meetup_location || meetup?.location,
                        transactionType: isBorrow ? 'BORROW' : 'BUY',
                        otherPartyId: tx.buyer?.id,
                        otherPartyName: tx.buyer?.full_name,
                        listingId: tx.listing_id,
                      })}
                      lang={lang}
                      highlighted={highlightedId === tx.id}
                    />
                  )
                })}

                {/* Accepted Incoming Swaps */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {incomingSwaps.filter((s: any) => s.status === 'ACCEPTED').map((swap: any) => {
                  const myBook = extractBook(swap.listing)
                  const meetup = parseMeetupInfo(swap)

                  return (
                    <DetailedDealCard
                      key={`acc-swap-${swap.id}`}
                      id={swap.id}
                      type="SWAP"
                      status={swap.status}
                      createdAt={swap.created_at}
                      completedAt={swap.responded_at || swap.completed_at}
                      isIncoming={true}
                      counterparty={swap.requester}
                      primaryListing={swap.listing}
                      offeredListing={swap.offered_listing}
                      meetupLocation={swap.agreed_meetup_location || swap.proposed_meetup_location || meetup?.location}
                      meetupAt={swap.agreed_meetup_at || meetup?.at}
                      proposedTimes={meetup?.times}
                      deliveryMethod={swap.preferred_delivery || meetup?.deliveryMethod || 'MEETUP'}
                      buyerNote={swap.message}
                      sellerNote={swap.response_message}
                      onChat={() => handleChatWithUser(swap.requester?.id || swap.requester_id, swap.listing_id, `swap-${swap.id}`)}
                      isChatLoading={chatLoadingKey === `swap-${swap.id}`}
                      onOpenQrModal={() => setQrModalData({
                        isOpen: true,
                        swapId: swap.id,
                        bookTitle: myBook?.title_ar || myBook?.title || 'كتاب',
                        meetupLocation: swap.agreed_meetup_location || swap.proposed_meetup_location,
                        transactionType: 'SWAP',
                        otherPartyId: swap.requester?.id,
                        otherPartyName: swap.requester?.full_name,
                        listingId: swap.listing_id,
                        swapListingId: swap.offered_listing_id,
                      })}
                      lang={lang}
                      highlighted={highlightedId === swap.id}
                    />
                  )
                })}
              </div>
            )}

            {/* Incoming Pending Swaps */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {incomingSwaps.filter((s: any) => s.status === 'PENDING').map((swap: any) => {
              const meetup = parseMeetupInfo(swap)

              return (
                <DetailedDealCard
                  key={`pending-swap-${swap.id}`}
                  id={swap.id}
                  type="SWAP"
                  status={swap.status}
                  createdAt={swap.created_at}
                  isIncoming={true}
                  counterparty={swap.requester}
                  primaryListing={swap.listing}
                  offeredListing={swap.offered_listing}
                  meetupLocation={swap.agreed_meetup_location || swap.proposed_meetup_location || meetup?.location}
                  meetupAt={swap.agreed_meetup_at || meetup?.at}
                  proposedTimes={meetup?.times}
                  deliveryMethod={swap.preferred_delivery || meetup?.deliveryMethod || 'MEETUP'}
                  buyerNote={swap.message}
                  sellerNote={swap.response_message}
                  onAccept={() => handleSwapStatus(swap.id, 'ACCEPTED')}
                  onReject={() => handleSwapStatus(swap.id, 'REJECTED')}
                  onChat={() => handleChatWithUser(swap.requester?.id || swap.requester_id, swap.listing_id, `swap-${swap.id}`)}
                  isActionLoading={actionLoading === `swap-${swap.id}`}
                  isChatLoading={chatLoadingKey === `swap-${swap.id}`}
                  lang={lang}
                  highlighted={highlightedId === swap.id}
                />
              )
            })}

            {/* Incoming Pending Buy & Borrow Transactions */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {incomingTx.filter((t: any) => t.status === 'PENDING').map((tx: any) => {
              const loan = parseLoanInfo(tx.buyer_note)
              const meetup = parseMeetupInfo(tx)
              const isBorrow = Boolean(loan) || tx.transaction_type === 'BORROW'

              return (
                <DetailedDealCard
                  key={`pending-tx-${tx.id}`}
                  id={tx.id}
                  type={isBorrow ? 'BORROW' : (tx.transaction_type || 'BUY')}
                  status={tx.status}
                  createdAt={tx.created_at}
                  isIncoming={true}
                  counterparty={tx.buyer}
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
                  onAccept={() => handleTxStatus(tx.id, 'ACCEPTED')}
                  onReject={() => handleTxStatus(tx.id, 'REJECTED')}
                  onChat={() => handleChatWithUser(tx.buyer?.id || tx.buyer_id, tx.listing_id, `tx-${tx.id}`)}
                  isActionLoading={actionLoading === `tx-${tx.id}`}
                  isChatLoading={chatLoadingKey === `tx-${tx.id}`}
                  lang={lang}
                  highlighted={highlightedId === tx.id}
                />
              )
            })}

            {pendingIncomingCount === 0 && (
              <div className="text-center py-14 px-6 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-4">
                <div className="text-5xl">📭</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد طلبات جديدة واردة حالياً' : 'No pending incoming requests'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {lang === 'ar'
                    ? 'عندما يطلب أحد القراء مبادلة أو شراء أو استعارة كتاب من كتبك المعروضة ستظهر الطلبات هنا فوراً.'
                    : 'When readers request to swap, buy, or borrow your books, they will appear here.'}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => handleCreateSampleIncomingRequest('BORROW')}
                    loading={creatingSampleRequest}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-primary hover:opacity-95 text-white font-black text-xs sm:text-sm py-6 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 cursor-pointer gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{lang === 'ar' ? '⚡ إنشاء طلب استعارة وارد تجريبي فوراً (اختبار الدورة)' : '⚡ Create Test Borrow Request (Verify Cycle)'}</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleCreateSampleIncomingRequest('BUY')}
                    loading={creatingSampleRequest}
                    className="w-full sm:w-auto font-black text-xs sm:text-sm py-6 px-5 rounded-2xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{lang === 'ar' ? '⚡ إنشاء طلب شراء وارد تجريبي' : '⚡ Create Test Buy Request'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OUTGOING REQUESTS */}
        {activeTab === 'outgoing' && (
          <div className="space-y-4">
            {/* Outgoing Swaps */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {outgoingSwaps.map((swap: any) => {
              const targetBook = extractBook(swap.listing)
              const meetup = parseMeetupInfo(swap)
              const seller = swap.listing?.seller

              return (
                <DetailedDealCard
                  key={`out-swap-${swap.id}`}
                  id={swap.id}
                  type="SWAP"
                  status={swap.status}
                  createdAt={swap.created_at}
                  completedAt={swap.responded_at || swap.completed_at}
                  isIncoming={false}
                  counterparty={seller}
                  primaryListing={swap.listing}
                  offeredListing={swap.offered_listing}
                  meetupLocation={swap.agreed_meetup_location || swap.proposed_meetup_location || meetup?.location}
                  meetupAt={swap.agreed_meetup_at || meetup?.at}
                  proposedTimes={meetup?.times}
                  deliveryMethod={swap.preferred_delivery || meetup?.deliveryMethod || 'MEETUP'}
                  buyerNote={swap.message}
                  sellerNote={swap.response_message}
                  onCancel={swap.status === 'PENDING' ? () => handleSwapStatus(swap.id, 'REJECTED') : undefined}
                  onChat={seller?.id ? () => handleChatWithUser(seller.id, swap.listing_id, `swap-${swap.id}`) : undefined}
                  isChatLoading={chatLoadingKey === `swap-${swap.id}`}
                  isActionLoading={actionLoading === `swap-${swap.id}`}
                  onOpenQrModal={swap.status === 'ACCEPTED' ? () => setQrModalData({
                    isOpen: true,
                    swapId: swap.id,
                    bookTitle: targetBook?.title_ar || targetBook?.title || 'كتاب',
                    meetupLocation: swap.proposed_meetup_location || swap.agreed_meetup_location,
                    transactionType: 'SWAP',
                    otherPartyId: seller?.id,
                    otherPartyName: seller?.full_name,
                    listingId: swap.listing_id,
                    swapListingId: swap.offered_listing_id,
                  }) : undefined}
                  lang={lang}
                  highlighted={highlightedId === swap.id}
                />
              )
            })}

            {/* Outgoing Buy & Borrow */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {outgoingTx.map((tx: any) => {
              const book = extractBook(tx.listing)
              const seller = tx.seller
              const loan = parseLoanInfo(tx.buyer_note)
              const meetup = parseMeetupInfo(tx)
              const isBorrow = Boolean(loan) || tx.transaction_type === 'BORROW'

              return (
                <DetailedDealCard
                  key={`out-tx-${tx.id}`}
                  id={tx.id}
                  type={isBorrow ? 'BORROW' : (tx.transaction_type || 'BUY')}
                  status={tx.status}
                  createdAt={tx.created_at}
                  completedAt={tx.completed_at}
                  isIncoming={false}
                  counterparty={seller}
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
                  onCancel={tx.status === 'PENDING' ? () => handleTxStatus(tx.id, 'CANCELLED') : undefined}
                  onChat={seller?.id ? () => handleChatWithUser(seller.id, tx.listing_id, `tx-${tx.id}`) : undefined}
                  isChatLoading={chatLoadingKey === `tx-${tx.id}`}
                  isActionLoading={actionLoading === `tx-${tx.id}`}
                  onOpenQrModal={tx.status === 'ACCEPTED' ? () => setQrModalData({
                    isOpen: true,
                    transactionId: tx.id,
                    bookTitle: book?.title_ar || book?.title || 'كتاب',
                    meetupLocation: tx.meetup_location,
                    transactionType: isBorrow ? 'BORROW' : 'BUY',
                    otherPartyId: seller?.id,
                    otherPartyName: seller?.full_name,
                    listingId: tx.listing_id,
                  }) : undefined}
                  lang={lang}
                  highlighted={highlightedId === tx.id}
                />
              )
            })}

            {outgoingSwaps.length === 0 && outgoingTx.length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-5xl">🔍</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لم ترسل أي طلبات تبادل أو شراء بعد' : 'No outgoing requests yet'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'تصفح الكتب المتاحة بالقرب منك واطلب مبادلة أو شراء لتظهر معاملاتك هنا.'
                    : 'Explore available books near you and request a swap or purchase to see them here.'}
                </p>
                <Link href="/search">
                  <Button className="font-bold text-xs rounded-xl mt-2">
                    {lang === 'ar' ? 'استكشف الكتب الآن' : 'Explore Books'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVE LOANS & DEADLINES */}
        {activeTab === 'loans' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-300">
                  {lang === 'ar' ? 'نظام الاستعارة والتأمين المسترد' : 'Book Lending & Security Deposit System'}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {lang === 'ar'
                    ? 'يتم تسليم التأمين عند المقابلة ويبقى محفوظاً حتى إعادة الكتاب بحالته الأصلية. يوجد فترة سماح يومين، وبعدها تُطبق غرامة تأخير بسيطة تُخصم من التأمين.'
                    : 'Deposits are handled at handover and fully returned once the book is returned safely. A 2-day grace period applies.'}
                </p>
              </div>
            </div>

            {/* Active loans cards */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {activeLoans.map((tx: any) => {
              const book = extractBook(tx.listing)
              const isLender = tx.seller_id === currentUserId
              const counterparty = isLender ? tx.buyer : tx.seller
              const loan = parseLoanInfo(tx.buyer_note)
              const meetup = parseMeetupInfo(tx)

              return (
                <DetailedDealCard
                  key={`loan-${tx.id}`}
                  id={tx.id}
                  type="BORROW"
                  status={tx.status}
                  createdAt={tx.created_at}
                  completedAt={tx.completed_at}
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
                  onChat={counterparty?.id ? () => handleChatWithUser(counterparty.id, tx.listing_id, `tx-${tx.id}`) : undefined}
                  isChatLoading={chatLoadingKey === `tx-${tx.id}`}
                  onOpenQrModal={() => setQrModalData({
                    isOpen: true,
                    transactionId: tx.id,
                    bookTitle: book?.title_ar || book?.title || 'كتاب',
                    meetupLocation: tx.meetup_location,
                    transactionType: 'BORROW',
                    isBorrowReturn: true,
                    otherPartyId: counterparty?.id,
                    otherPartyName: counterparty?.full_name,
                    listingId: tx.listing_id,
                  })}
                  lang={lang}
                  highlighted={highlightedId === tx.id}
                />
              )
            })}

            {activeLoans.length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-5xl">⏳</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد استعارات نشطة حالياً' : 'No active loans currently'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'عندما تستعير كتاباً أو تعير كتابك لقارئ آخر، سيظهر موعد الإرجاع وحالة التأمين هنا.'
                    : 'When you borrow or lend a book, return deadlines and deposit statuses will be tracked here.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPLETED HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {[...incomingTx, ...outgoingTx].filter((t: any) => t.status === 'COMPLETED').map((tx: any) => {
              const loan = parseLoanInfo(tx.buyer_note)
              const isLenderOrSeller = tx.seller_id === currentUserId
              const counterparty = isLenderOrSeller ? tx.buyer : tx.seller
              const meetup = parseMeetupInfo(tx)
              const isBorrow = Boolean(loan) || tx.transaction_type === 'BORROW'

              return (
                <DetailedDealCard
                  key={`history-${tx.id}`}
                  id={tx.id}
                  type={isBorrow ? 'BORROW' : (tx.transaction_type || 'BUY')}
                  status="COMPLETED"
                  createdAt={tx.created_at}
                  completedAt={tx.completed_at}
                  isIncoming={isLenderOrSeller}
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
                  onChat={counterparty?.id ? () => handleChatWithUser(counterparty.id, tx.listing_id, `tx-${tx.id}`) : undefined}
                  isChatLoading={chatLoadingKey === `tx-${tx.id}`}
                  lang={lang}
                />
              )
            })}

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {[...incomingTx, ...outgoingTx].filter((t: any) => t.status === 'COMPLETED').length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10">
                <p className="text-xs font-bold text-muted-foreground">
                  {lang === 'ar' ? 'سجل المعاملات المكتملة فارغ حالياً' : 'No completed transactions yet'}
                </p>
              </div>
            )}
          </div>
        )}
        {/* Render Meetup QR Code Modal */}
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
            currentUserId={currentUserId}
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
