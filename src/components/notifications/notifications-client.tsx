'use client'

import { useState, useEffect } from 'react'
import { Check, BellOff, Bell, BellRing, Smartphone, Sparkles, Trash2, CheckCheck, Eye, EyeOff, Truck } from 'lucide-react'
import { Notification } from '@/types'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalPwaNotification,
  playNotificationChime,
  NotificationPermissionState,
} from '@/lib/notifications/pwa-push'

const NOTIFICATION_ICONS: Record<string, string> = {
  WISHLIST_MATCH: '🔔',
  SWAP_REQUEST: '🔄',
  SWAP_ACCEPTED: '✅',
  SWAP_REJECTED: '❌',
  NEW_OFFER: '💰',
  OFFER_ACCEPTED: '✅',
  NEW_MESSAGE: '💬',
  NEW_REVIEW: '⭐',
  BOOK_SOLD: '📦',
  BOOK_RESERVED: '🔖',
  BORROW_REQUEST: '⏱️',
  BORROW_ACCEPTED: '🎉',
  BORROW_RETURNED: '📚',
  BORROW_OVERDUE: '⚠️',
  MEETUP_REMINDER: '📍',
  RECOMMENDED_BOOK: '💡',
  NEW_BOOK_NEARBY: '📍',
  TRANSACTION_COMPLETED: '🎉',
  FOLLOW: '👤',
  COMMUNITY_INTAKE_REQUEST: '📦',
  COMMUNITY_HANDOVER_REQUEST: '☕',
  COMMUNITY_BOOK_APPROVED: '📚✅',
  COMMUNITY_BOOK_REJECTED: 'ℹ️',
  STORE_NEW_ORDER: '📦',
  STORE_APPROVED: '🏪🎉',
}


interface NotificationsClientProps {
  userId: string
  notifications: Notification[]
}

export function NotificationsClient({ userId, notifications: initial }: NotificationsClientProps) {
  const { lang } = useLanguage()
  const supabase = createClient()
  const [notifications, setNotifications] = useState(initial)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  // Realtime subscription for incoming, updated, or deleted notifications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-page-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.new) {
            const newItem = payload.new as Notification
            setNotifications(prev => [newItem, ...prev.filter(n => n.id !== newItem.id)])
            playNotificationChime()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.new) {
            const updated = payload.new as Notification
            setNotifications(prev => prev.map(n => (n.id === updated.id ? updated : n)))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.old?.id) {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
  }

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
  }

  const toggleReadStatus = async (id: string, currentIsRead: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const nextStatus = !currentIsRead
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: nextStatus } : n)))
    await supabase
      .from('notifications')
      .update({ is_read: nextStatus, read_at: nextStatus ? new Date().toISOString() : null })
      .eq('id', id)
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>('default')
  const [requestingPerm, setRequestingPerm] = useState(false)

  useEffect(() => {
    setNotifPermission(getNotificationPermission())
  }, [])

  const handleEnablePush = async () => {
    setRequestingPerm(true)
    try {
      const res = await requestNotificationPermission()
      setNotifPermission(res)
      if (res === 'granted') {
        showLocalPwaNotification(
          lang === 'ar' ? 'تم تفعيل إشعارات الهاتف بنجاح! 🔔' : 'Push notifications enabled! 🔔',
          {
            body:
              lang === 'ar'
                ? 'ستصلك هنا تنبيهات فورية عند اعتماد كتبك بالرف أو طلبات التبادل والشراء.'
                : 'Instant alerts will be sent when your books are approved or requests arrive.',
            url: '/notifications',
          }
        )
      }
    } finally {
      setRequestingPerm(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const displayedNotifications = activeFilter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  return (
    <div className="page-container py-6 max-w-2xl">
      {/* PWA & Native Push Notification Banner */}
      {isPushNotificationSupported() && notifPermission === 'default' && (
        <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-4 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BellRing className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>{lang === 'ar' ? 'تفعيل إشعارات الهاتف الفورية' : 'Enable Instant Push Notifications'}</span>
                <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'ar'
                  ? 'احصل على تنبيهات فورية على هاتفك عند اعتماد كتبك، أو وصول طلبات استعارة وتبادل'
                  : 'Receive native alerts when your books are approved on the shelf or deals arrive'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleEnablePush}
            disabled={requestingPerm}
            className="shrink-0 rounded-xl font-bold shadow-xs flex items-center gap-1.5"
          >
            <Bell className="h-4 w-4" />
            {lang === 'ar' ? 'تفعيل الآن' : 'Enable Now'}
          </Button>
        </div>
      )}

      {isPushNotificationSupported() && notifPermission === 'granted' && (
        <div className="mb-4 flex items-center justify-between px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'ar' ? 'إشعارات الهاتف وتطبيق الـ PWA مفعّلة' : 'Mobile & PWA Push Notifications Active'}</span>
          </div>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {lang === 'ar' ? 'تصلك التنبيهات فوراً ✅' : 'Live Alerts Active ✅'}
          </span>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h1>
          {unreadCount > 0 ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar' ? `${unreadCount} إشعار جديد بانتظارك` : `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar' ? 'أنت على اطلاع بكل جديد ✨' : 'All caught up ✨'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Unread / All Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-3 py-1 rounded-lg transition-all cursor-pointer',
                activeFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {lang === 'ar' ? 'الكل' : 'All'} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1',
                activeFilter === 'unread'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{lang === 'ar' ? 'غير مقروء' : 'Unread'}</span>
              {unreadCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead} className="rounded-xl text-xs font-bold">
              <CheckCheck className="h-3.5 w-3.5 me-1 text-primary" />
              {lang === 'ar' ? 'تعليم الكل' : 'Mark all read'}
            </Button>
          )}
        </div>
      </div>

      {displayedNotifications.length === 0 ? (
        <div className="empty-state">
          <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">
            {activeFilter === 'unread'
              ? (lang === 'ar' ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications')
              : (lang === 'ar' ? 'مفيش إشعارات لحد دلوقتي' : 'No notifications yet')}
          </p>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
            {lang === 'ar'
              ? 'ستظهر هنا إشعارات طلبات الشراء والاستعارة والمبادلة عند وصولها'
              : 'Buy, borrow & swap request notifications will appear here'}
          </p>
          <Link
            href="/transactions"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            {lang === 'ar' ? 'عرض طلباتي ومعاملاتي' : 'View My Deals & Requests'}
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedNotifications.map(notif => {
            const cardInner = (
              <div
                className={cn(
                  'group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer',
                  !notif.is_read
                    ? 'bg-primary/5 border-primary/30 shadow-xs hover:border-primary/50'
                    : 'bg-card border-border hover:bg-muted/30 hover:border-border/80'
                )}
                onClick={() => !notif.is_read && markRead(notif.id)}
              >
                {/* Notification Emoji Icon */}
                <div className="h-10 w-10 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-border/40">
                  {NOTIFICATION_ICONS[notif.type] ?? '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-xs sm:text-sm', !notif.is_read ? 'font-black text-foreground' : 'font-medium text-foreground')}>
                      {lang === 'ar' ? (notif.title_ar ?? notif.title) : notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
                    )}
                  </div>

                  {(notif.body_ar || notif.body) && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {lang === 'ar' ? (notif.body_ar ?? notif.body) : notif.body}
                    </p>
                  )}

                  {/* Order Specific Badges & Quick Action */}
                  {(() => {
                    const orderNumber = notif.data?.order_number ? String(notif.data.order_number) : undefined
                    const orderId = notif.data?.order_id ? String(notif.data.order_id) : undefined
                    const orderRef = orderNumber || orderId
                    if (!orderRef && notif.type !== 'STORE_NEW_ORDER') return null

                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {orderNumber && (
                          <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-mono text-[11px] font-black border border-primary/20">
                            #{orderNumber}
                          </span>
                        )}
                        {orderRef && (
                          <Link
                            href={`/orders/${orderRef}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!notif.is_read) markRead(notif.id)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-bold hover:bg-emerald-500/20 transition-colors"
                          >
                            <Truck className="h-3 w-3 text-emerald-600" />
                            <span>{lang === 'ar' ? 'صفحة ومتابعة الطلب 📦' : 'Order Tracking Page 📦'}</span>
                          </Link>
                        )}
                      </div>
                    )
                  })()}

                  {/* STORE_APPROVED Quick Action Button */}
                  {notif.type === 'STORE_APPROVED' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Link
                        href="/stores/dashboard"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!notif.is_read) markRead(notif.id)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black hover:bg-emerald-500/25 transition-all shadow-xs"
                      >
                        <span>🏪</span>
                        <span>{lang === 'ar' ? 'الدخول للوحة المتجر وإضافة الكتب 📚' : 'Open Store Dashboard & Add Books 📚'}</span>
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(notif.created_at, lang)}
                      </span>
                      {notif.action_url && (
                        <span className="text-[10px] font-bold text-primary group-hover:underline">
                          {lang === 'ar' ? 'عرض في لوحة الإدارة ←' : 'View in Dashboard →'}
                        </span>
                      )}
                    </div>

                    {/* Inline Quick Actions (Toggle Read & Delete) */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => toggleReadStatus(notif.id, notif.is_read, e)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title={notif.is_read ? (lang === 'ar' ? 'تحديد كغير مقروء' : 'Mark unread') : (lang === 'ar' ? 'تحديد كمقروء' : 'Mark read')}
                      >
                        {notif.is_read ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'حذف الإشعار' : 'Delete notification'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )

            // Wrap in Link if notification has an action URL (e.g. /transactions)
            if (notif.action_url) {
              return (
                <Link
                  key={notif.id}
                  href={notif.action_url}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  className="block focus:outline-none"
                >
                  {cardInner}
                </Link>
              )
            }

            return <div key={notif.id}>{cardInner}</div>
          })}
        </div>
      )}
    </div>
  )
}

