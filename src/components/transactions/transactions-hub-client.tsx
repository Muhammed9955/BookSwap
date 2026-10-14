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
      const swap = incomingSwaps.find((s: any) => s.id === swapId)

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

        if (newStatus === 'ACCEPTED') {
          // Reserve BOTH listings when swap is accepted
          const listingIds = [
            swap?.listing?.id,
            swap?.offered_listing?.id,
          ].filter(Boolean) as string[]
          if (listingIds.length) {
            await supabase.from('book_listings').update({ status: 'RESERVED' }).in('id', listingIds)
          }
          if (swap?.requester?.id) {
            await pushNotificationSafe(supabase, {
              user_id: swap.requester.id,
              type: 'SWAP_ACCEPTED',
              title: 'تمت الموافقة على طلب المبادلة! 🔄',
              title_ar: 'تمت الموافقة على طلب المبادلة! 🔄',
              body: `وافق صاحب الكتاب على عرض المبادلة! اتجه إلى المحادثة للاتفاق على موعد التسليم.`,
              action_url: `/transactions?tab=outgoing&id=${swapId}`,
            })
          }
        } else {
          // Re-activate BOTH listings if swap rejected
          const listingIds = [
            swap?.listing?.id,
            swap?.offered_listing?.id,
          ].filter(Boolean) as string[]
          if (listingIds.length) {
            await supabase.from('book_listings').update({ status: 'ACTIVE' }).in('id', listingIds)
          }
          if (swap?.requester?.id) {
            await pushNotificationSafe(supabase, {
              user_id: swap.requester.id,
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
            : lang === 'ar' ? 'تم رفض طلب المبادلة وإعادة الكتب للمتاح.' : 'Swap request declined. Books re-listed.'
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

  // Open conversation
  const handleChatWithUser = async (otherUserId: string, listingId?: string) => {
    if (!otherUserId) return
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
            {incomingTx.filter((t: any) => t.status === 'ACCEPTED').length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">
                    🤝 {lang === 'ar' ? 'معاملات مقبولة بانتظار المقابلة والتسليم' : 'Accepted Deals — Ready for Meetup'}
                  </Badge>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {incomingTx.filter((t: any) => t.status === 'ACCEPTED').map((tx: any) => {
                  const book = extractBook(tx.listing)
                  const buyer = tx.buyer
                  const cover = tx.listing?.images?.[0]?.url || book?.cover_image_url
                  const loan = parseLoanInfo(tx.buyer_note)

                  return (
                    <div
                      key={`acc-${tx.id}`}
                      className="rounded-3xl border-2 border-emerald-500/60 bg-emerald-500/5 p-5 sm:p-6 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                        <Badge className="bg-emerald-600 text-white font-bold text-xs">
                          {loan ? (lang === 'ar' ? 'استعارة مقبولة ⏱️' : 'Accepted Loan') : (lang === 'ar' ? 'بيع مقبول 💰' : 'Accepted Sale')}
                        </Badge>
                        <span className="text-xs font-bold text-foreground">
                          {buyer?.full_name_ar || buyer?.full_name || 'المشتري'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-12 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
                          {cover ? <Image src={cover} alt="" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center">📖</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-foreground truncate">{book?.title_ar || book?.title || 'كتاب'}</p>
                          <p className="text-xs text-muted-foreground truncate">{book?.author}</p>
                        </div>
                      </div>

                      <MeetupDetailBadge meetup={parseMeetupInfo(tx)} lang={lang} />

                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChatWithUser(buyer?.id, tx.listing_id)}
                          className="font-bold text-xs gap-1 cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {lang === 'ar' ? 'تواصل' : 'Chat'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setQrModalData({
                            isOpen: true,
                            transactionId: tx.id,
                            bookTitle: book?.title_ar || book?.title || 'كتاب',
                            meetupLocation: tx.meetup_location,
                            transactionType: loan ? 'BORROW' : 'BUY',
                            otherPartyId: buyer?.id,
                            otherPartyName: buyer?.full_name,
                            listingId: tx.listing_id,
                          })}
                          className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <QrCode className="h-4 w-4" />
                          {lang === 'ar' ? 'تأكيد المقابلة برمز QR 📱' : 'Verify Meetup with QR'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Incoming Swaps */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {incomingSwaps.filter((s: any) => s.status === 'PENDING').map((swap: any) => {
              const myBook = extractBook(swap.listing)
              const offeredBook = extractBook(swap.offered_listing)
              const requester = swap.requester
              const myCover = swap.listing?.images?.[0]?.url || myBook?.cover_image_url
              const offeredCover = swap.offered_listing?.images?.[0]?.url || offeredBook?.cover_image_url

              return (
                <div
                  key={swap.id}
                  id={`swap-${swap.id}`}
                  className={cn(
                    'rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:border-primary/40 transition-all space-y-4',
                    highlightedId === swap.id && 'ring-4 ring-primary ring-offset-2 animate-pulse border-primary shadow-xl bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="swap" className="font-bold text-xs">
                        🔄 {lang === 'ar' ? 'طلب مبادلة وارد' : 'Incoming Swap Request'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(swap.created_at, lang)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                        {requester?.avatar_url ? (
                          <img src={requester.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          requester?.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {requester?.full_name_ar || requester?.full_name || 'قارئ'}
                      </span>
                    </div>
                  </div>

                  {/* Books side-by-side comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-muted/20 p-4 rounded-2xl border border-border/60">
                    {/* My book */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                        {myCover ? (
                          <Image src={myCover} alt="" fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-lg">📖</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                          {lang === 'ar' ? 'كتابك المطلوب' : 'Your Book'}
                        </span>
                        <p className="text-sm font-black text-foreground truncate">
                          {myBook?.title_ar || myBook?.title || 'كتاب'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{myBook?.author}</p>
                      </div>
                    </div>

                    {/* Offered book */}
                    <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-s border-border/80 pt-3 sm:pt-0 sm:ps-4">
                      <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                        {offeredCover ? (
                          <Image src={offeredCover} alt="" fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-lg">📚</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          {lang === 'ar' ? 'الكتاب المعروض عليك' : 'Offered in Exchange'}
                        </span>
                        <p className="text-sm font-black text-foreground truncate">
                          {offeredBook?.title_ar || offeredBook?.title || 'كتاب للمبادلة'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{offeredBook?.author}</p>
                      </div>
                    </div>
                  </div>

                  {swap.message && (
                    <p className="text-xs text-muted-foreground bg-card p-3 rounded-xl border border-border/60 italic">
                      &ldquo;{swap.message}&rdquo;
                    </p>
                  )}

                  {/* Proposed / Agreed Meetup Location */}
                  <MeetupDetailBadge meetup={parseMeetupInfo(swap)} lang={lang} />

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatWithUser(requester.id, swap.listing_id)}
                      className="font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {lang === 'ar' ? 'تواصل' : 'Chat'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSwapStatus(swap.id, 'REJECTED')}
                      loading={actionLoading === `swap-${swap.id}`}
                      className="font-bold text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      {lang === 'ar' ? 'رفض' : 'Decline'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleSwapStatus(swap.id, 'ACCEPTED')}
                      loading={actionLoading === `swap-${swap.id}`}
                      className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {lang === 'ar' ? 'قبول المبادلة' : 'Accept Swap'}
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Incoming Buy & Borrow Transactions */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {incomingTx.filter((t: any) => t.status === 'PENDING').map((tx: any) => {
              const book = extractBook(tx.listing)
              const buyer = tx.buyer
              const cover = tx.listing?.images?.[0]?.url || book?.cover_image_url
              const loan = parseLoanInfo(tx.buyer_note)

              return (
                <div
                  key={tx.id}
                  id={`tx-${tx.id}`}
                  className={cn(
                    'rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:border-primary/40 transition-all space-y-4',
                    highlightedId === tx.id && 'ring-4 ring-emerald-500 ring-offset-2 animate-pulse border-emerald-500 shadow-xl bg-emerald-500/5'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      {loan ? (
                        <Badge variant="outline" className="font-bold text-xs border-emerald-500 text-emerald-600 bg-emerald-500/10">
                          ⏳ {lang === 'ar' ? 'طلب استعارة' : 'Borrow Request'}
                        </Badge>
                      ) : (
                        <Badge variant="sell" className="font-bold text-xs">
                          💰 {lang === 'ar' ? 'طلب شراء نقدي' : 'Buy Request'}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(tx.created_at, lang)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                        {buyer?.avatar_url ? (
                          <img src={buyer.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          buyer?.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {buyer?.full_name_ar || buyer?.full_name || 'قارئ'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-border/60">
                    <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                      {cover ? (
                        <Image src={cover} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg">📖</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-foreground truncate">
                        {book?.title_ar || book?.title || 'كتاب'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{book?.author}</p>

                      {loan ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs mt-2 font-bold text-foreground">
                          <span className="text-primary">
                            رسوم الاستعارة: {loan.borrow_fee ? `${loan.borrow_fee} ج.م` : 'مجانية'}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            تأمين مسترد: {loan.deposit} ج.م
                          </span>
                          <span className="text-muted-foreground">المدة: {loan.loan_days} يوماً</span>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-primary mt-1">
                          السعر المطلوب: {tx.price ? formatPrice(tx.price) : 'حسب الاتفاق'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Proposed / Agreed Meetup Location */}
                  <MeetupDetailBadge meetup={parseMeetupInfo(tx)} lang={lang} />

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatWithUser(buyer.id, tx.listing_id)}
                      className="font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {lang === 'ar' ? 'تواصل' : 'Chat'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTxStatus(tx.id, 'REJECTED')}
                      loading={actionLoading === `tx-${tx.id}`}
                      className="font-bold text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      {lang === 'ar' ? 'رفض' : 'Decline'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleTxStatus(tx.id, 'ACCEPTED')}
                      loading={actionLoading === `tx-${tx.id}`}
                      className="font-black text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-md shadow-primary/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {lang === 'ar' ? 'قبول الطلب' : 'Accept Request'}
                    </Button>
                  </div>
                </div>
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
              const offeredBook = extractBook(swap.offered_listing)
              const seller = swap.listing?.seller
              const targetCover = swap.listing?.images?.[0]?.url || targetBook?.cover_image_url

              return (
                <div
                  key={swap.id}
                  id={`swap-${swap.id}`}
                  className={cn(
                    'rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4 transition-all',
                    highlightedId === swap.id && 'ring-4 ring-primary ring-offset-2 animate-pulse border-primary shadow-xl bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="swap" className="font-bold text-xs">
                        🔄 {lang === 'ar' ? 'طلب مبادلة أرسلته' : 'Sent Swap Request'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(swap.created_at, lang)}
                      </span>
                    </div>

                    <Badge
                      className={cn(
                        'text-xs font-bold',
                        swap.status === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : swap.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-600 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      )}
                    >
                      {swap.status === 'ACCEPTED'
                        ? 'تمت الموافقة ✅'
                        : swap.status === 'REJECTED'
                        ? 'مرفوض ❌'
                        : 'قيد الانتظار ⏳'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-border/60">
                    <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                      {targetCover ? (
                        <Image src={targetCover} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg">📖</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-foreground truncate">
                        {targetBook?.title_ar || targetBook?.title || 'كتاب'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{targetBook?.author}</p>
                      <p className="text-xs text-primary font-bold mt-1">
                        عرضت بالمقابل: "{offeredBook?.title_ar || offeredBook?.title || 'كتابك'}"
                      </p>
                    </div>
                  </div>

                  {/* Proposed / Agreed Meetup Location */}
                  <MeetupDetailBadge meetup={parseMeetupInfo(swap)} lang={lang} />

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    {seller && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChatWithUser(seller.id, swap.listing_id)}
                        className="font-bold text-xs gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {lang === 'ar' ? 'تواصل مع صاحب الكتاب' : 'Message Owner'}
                      </Button>
                    )}

                    {swap.status === 'ACCEPTED' && (
                      <Button
                        size="sm"
                        onClick={() => setQrModalData({
                          isOpen: true,
                          swapId: swap.id,
                          bookTitle: targetBook?.title_ar || targetBook?.title || 'كتاب',
                          meetupLocation: swap.proposed_meetup_location || swap.agreed_meetup_location,
                          transactionType: 'SWAP',
                          otherPartyId: seller?.id,
                          otherPartyName: seller?.full_name,
                          listingId: swap.listing_id,
                          swapListingId: swap.offered_listing_id,
                        })}
                        className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <QrCode className="h-4 w-4" />
                        {lang === 'ar' ? 'رمز QR للمقابلة 📱' : 'Meetup QR Pass'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Outgoing Buy & Borrow */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {outgoingTx.map((tx: any) => {
              const book = extractBook(tx.listing)
              const seller = tx.seller
              const cover = tx.listing?.images?.[0]?.url || book?.cover_image_url
              const loan = parseLoanInfo(tx.buyer_note)

              return (
                <div
                  key={tx.id}
                  id={`tx-${tx.id}`}
                  className={cn(
                    'rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4 transition-all',
                    highlightedId === tx.id && 'ring-4 ring-emerald-500 ring-offset-2 animate-pulse border-emerald-500 shadow-xl bg-emerald-500/5'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      {loan ? (
                        <Badge variant="outline" className="font-bold text-xs border-emerald-500 text-emerald-600 bg-emerald-500/10">
                          ⏳ {lang === 'ar' ? 'طلب استعارة أرسلته' : 'Sent Borrow Request'}
                        </Badge>
                      ) : (
                        <Badge variant="sell" className="font-bold text-xs">
                          💰 {lang === 'ar' ? 'طلب شراء أرسلته' : 'Sent Buy Order'}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(tx.created_at, lang)}
                      </span>
                    </div>

                    <Badge
                      className={cn(
                        'text-xs font-bold',
                        tx.status === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : tx.status === 'COMPLETED'
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : tx.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-600 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      )}
                    >
                      {tx.status === 'ACCEPTED'
                        ? 'تم القبول ✅'
                        : tx.status === 'COMPLETED'
                        ? 'مكتمل 🎉'
                        : tx.status === 'REJECTED'
                        ? 'مرفوض ❌'
                        : 'قيد الانتظار ⏳'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-border/60">
                    <div className="relative h-18 w-13 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/80">
                      {cover ? (
                        <Image src={cover} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg">📖</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-foreground truncate">
                        {book?.title_ar || book?.title || 'كتاب'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{book?.author}</p>

                      {loan && (
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          تأمين مسترد: {loan.deposit} ج.م | المدة: {loan.loan_days} يوماً
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Proposed / Agreed Meetup Location */}
                  <MeetupDetailBadge meetup={parseMeetupInfo(tx)} lang={lang} />

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    {seller && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChatWithUser(seller.id, tx.listing_id)}
                        className="font-bold text-xs gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {lang === 'ar' ? 'تواصل مع المالك' : 'Chat with Owner'}
                      </Button>
                    )}

                    {tx.status === 'ACCEPTED' && (
                      <Button
                        size="sm"
                        onClick={() => setQrModalData({
                          isOpen: true,
                          transactionId: tx.id,
                          bookTitle: book?.title_ar || book?.title || 'كتاب',
                          meetupLocation: tx.meetup_location,
                          transactionType: loan ? 'BORROW' : 'BUY',
                          otherPartyId: seller?.id,
                          otherPartyName: seller?.full_name,
                          listingId: tx.listing_id,
                        })}
                        className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <QrCode className="h-4 w-4" />
                        {lang === 'ar' ? 'رمز QR للمقابلة 📱' : 'Meetup QR Pass'}
                      </Button>
                    )}

                    {tx.status === 'PENDING' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTxStatus(tx.id, 'CANCELLED')}
                        loading={actionLoading === `tx-${tx.id}`}
                        className="font-bold text-xs text-muted-foreground hover:text-red-600 cursor-pointer"
                      >
                        {lang === 'ar' ? 'إلغاء الطلب' : 'Cancel Request'}
                      </Button>
                    )}
                  </div>
                </div>
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
              const countdown = getLoanCountdown(loan?.due_date)

              return (
                <div
                  key={tx.id}
                  className="rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white font-bold text-xs">
                        {isLender ? (lang === 'ar' ? 'كتابك المُعار' : 'Book You Lent') : (lang === 'ar' ? 'كتاب استعرته' : 'Book You Borrowed')}
                      </Badge>
                      {countdown && (
                        <Badge className={cn('font-bold text-xs border', countdown.color)}>
                          <Clock className="h-3 w-3 me-1" />
                          {lang === 'ar' ? countdown.textAr : countdown.textEn}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {loan?.due_date ? new Date(loan.due_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-base font-black text-foreground">
                        {book?.title_ar || book?.title || 'كتاب'}
                      </p>
                      <p className="text-xs text-muted-foreground">{book?.author}</p>
                      <div className="flex items-center gap-4 text-xs font-bold pt-1">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {lang === 'ar' ? 'قيمة التأمين:' : 'Deposit:'} {loan?.deposit} ج.م
                        </span>
                        <span className="text-muted-foreground">
                          {isLender ? (lang === 'ar' ? 'المستعير:' : 'Borrower:') : (lang === 'ar' ? 'المالك:' : 'Owner:')}{' '}
                          {counterparty?.full_name_ar || counterparty?.full_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Handover & Return Meetup Spot */}
                  <MeetupDetailBadge meetup={parseMeetupInfo(tx)} lang={lang} />

                  {/* Complete & Release Deposit */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatWithUser(counterparty.id, tx.listing_id)}
                      className="font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {lang === 'ar' ? 'محادثة' : 'Chat'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setQrModalData({
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
                      className="font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <QrCode className="h-4 w-4" />
                      {lang === 'ar' ? 'تأكيد إرجاع الكتاب واسترداد التأمين برمز QR 📱' : 'Verify Return via QR'}
                    </Button>
                  </div>
                </div>
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
              const book = extractBook(tx.listing)
              return (
                <div
                  key={tx.id}
                  className="rounded-3xl border border-border/80 bg-card p-5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                        ✅ {lang === 'ar' ? 'صفقة مكتملة' : 'Completed Deal'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {tx.completed_at ? formatRelativeTime(tx.completed_at, lang) : ''}
                      </span>
                    </div>
                    <p className="text-sm font-black text-foreground truncate">
                      {book?.title_ar || book?.title || 'كتاب'}
                    </p>
                    <p className="text-xs text-muted-foreground">{book?.author}</p>
                  </div>

                  <span className="text-xs font-bold text-muted-foreground">
                    {tx.price ? formatPrice(tx.price) : (lang === 'ar' ? 'تبادل ناجح' : 'Swap Done')}
                  </span>
                </div>
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
