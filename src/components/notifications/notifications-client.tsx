'use client'

import { useState, useEffect } from 'react'
import { Check, BellOff } from 'lucide-react'
import { Notification } from '@/types'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

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
}

interface NotificationsClientProps {
  userId: string
  notifications: Notification[]
}

export function NotificationsClient({ userId, notifications: initial }: NotificationsClientProps) {
  const { lang } = useLanguage()
  const supabase = createClient()
  const [notifications, setNotifications] = useState(initial)

  // Realtime subscription for incoming notifications while on page
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
            setNotifications(prev => [payload.new as Notification, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="page-container py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {lang === 'ar' ? `${unreadCount} غير مقروء` : `${unreadCount} unread`}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <Check className="h-4 w-4 me-1" />
            {lang === 'ar' ? 'تعليم كمقروء' : 'Mark all read'}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">{lang === 'ar' ? 'مفيش إشعارات لحد دلوقتي' : 'No notifications yet'}</p>
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
        <div className="space-y-2">
          {notifications.map(notif => {
            const cardContent = (
              <div
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/30 hover:shadow-sm',
                  !notif.is_read
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border'
                )}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {NOTIFICATION_ICONS[notif.type] ?? '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', !notif.is_read ? 'font-semibold' : 'font-medium')}>
                    {lang === 'ar' ? (notif.title_ar ?? notif.title) : notif.title}
                  </p>
                  {(notif.body_ar || notif.body) && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {lang === 'ar' ? (notif.body_ar ?? notif.body) : notif.body}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(notif.created_at, lang)}
                    </p>
                    {notif.action_url && (
                      <span className="text-[11px] font-bold text-primary">
                        {lang === 'ar' ? '← اضغط لعرض التفاصيل' : 'Tap to view details →'}
                      </span>
                    )}
                  </div>
                </div>
                {!notif.is_read && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse" />
                )}
              </div>
            )

            // Wrap in Link if notification has an action URL (e.g. /transactions)
            if (notif.action_url) {
              return (
                <Link
                  key={notif.id}
                  href={notif.action_url}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  className="block"
                >
                  {cardContent}
                </Link>
              )
            }

            return <div key={notif.id}>{cardContent}</div>
          })}
        </div>
      )}
    </div>
  )
}
